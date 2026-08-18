/**
 * M-PESA Callback Handler
 *
 * Processes the asynchronous STK Push callback from Safaricom.
 *
 * CRITICAL SECURITY RULES:
 *   1. Only ResultCode === 0 can result in a VERIFIED payment.
 *   2. We NEVER trust the amount from the callback alone — we compare
 *      it against our stored order total.
 *   3. IP validation is applied upstream (middleware or edge config).
 *   4. Duplicate CheckoutRequestIDs are silently absorbed (idempotent).
 *   5. A pending STK Push initiation NEVER marks an order as PAID.
 */

import { prisma } from "@/lib/db/prisma";
import { PaymentStatus } from "@prisma/client";
import { matchAndVerifyPayment } from "@/lib/payments/engine";
import {
  MpesaCallbackPayload,
  extractMetadataValue,
} from "./types";

export async function handleMpesaCallback(
  payload: MpesaCallbackPayload
): Promise<{ success: boolean; message: string }> {
  const { stkCallback } = payload.Body;
  const { CheckoutRequestID, MerchantRequestID, ResultCode, ResultDesc } =
    stkCallback;

  // 1. Find the pending payment by CheckoutRequestID
  const payment = await prisma.payment.findUnique({
    where: { checkoutRequestId: CheckoutRequestID },
  });

  if (!payment) {
    // Unknown transaction — log and return OK so Safaricom stops retrying
    console.warn(
      `[MPESA CALLBACK] Unknown CheckoutRequestID: ${CheckoutRequestID}`
    );
    return { success: true, message: "Unknown transaction, acknowledged" };
  }

  // 2. Idempotency — if already in a terminal state, ignore the duplicate
  const terminalStates: PaymentStatus[] = [
    PaymentStatus.VERIFIED,
    PaymentStatus.FAILED,
    PaymentStatus.REFUNDED,
  ];
  if (terminalStates.includes(payment.status)) {
    return {
      success: true,
      message: `Duplicate callback ignored. Payment already ${payment.status}`,
    };
  }

  // 3. Handle FAILED transactions (ResultCode !== 0)
  if (ResultCode !== 0) {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          errorCode: String(ResultCode),
          errorMessage: ResultDesc,
        },
      });

      await tx.paymentEvent.create({
        data: {
          paymentId: payment.id,
          status: PaymentStatus.FAILED,
          message: `M-PESA ResultCode ${ResultCode}: ${ResultDesc}`,
          rawPayload: payload as unknown as Record<string, unknown>,
        },
      });

      await tx.auditLog.create({
        data: {
          businessId: payment.businessId,
          action: "PAYMENT_FAILED",
          entityType: "Payment",
          entityId: payment.id,
          newValue: { ResultCode, ResultDesc, CheckoutRequestID },
        },
      });
    });

    return { success: true, message: "Payment failure recorded" };
  }

  // 4. SUCCESSFUL PAYMENT (ResultCode === 0)
  const metadata = stkCallback.CallbackMetadata!;
  const amountPaid = Number(extractMetadataValue(metadata, "Amount") ?? 0);
  const mpesaReceiptNumber = String(
    extractMetadataValue(metadata, "MpesaReceiptNumber") ?? ""
  );
  const transactionDate = extractMetadataValue(metadata, "TransactionDate");

  // Record the receipt and update to PROCESSING status before matching
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.PROCESSING,
        providerRef: mpesaReceiptNumber,
        amount: amountPaid,
      },
    });

    await tx.paymentEvent.create({
      data: {
        paymentId: payment.id,
        status: PaymentStatus.PROCESSING,
        message: `M-PESA confirmed. Receipt: ${mpesaReceiptNumber}, Amount: ${amountPaid}`,
        rawPayload: payload as unknown as Record<string, unknown>,
      },
    });

    await tx.auditLog.create({
      data: {
        businessId: payment.businessId,
        action: "MPESA_CALLBACK_RECEIVED",
        entityType: "Payment",
        entityId: payment.id,
        newValue: {
          mpesaReceiptNumber,
          amountPaid,
          transactionDate,
          CheckoutRequestID,
          MerchantRequestID,
        },
      },
    });
  });

  // 5. Run matching engine — this is where VERIFIED / PARTIALLY_PAID / OVERPAID is decided
  //    It also updates the Order status. Frontend CANNOT trigger this.
  await matchAndVerifyPayment(payment.id, payment.orderId ?? undefined);

  return { success: true, message: "Payment processed successfully" };
}
