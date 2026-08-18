"use server";

/**
 * Server Action: Initiate M-PESA Payment
 *
 * This is the ONLY way the frontend can trigger an M-PESA payment.
 * It creates a PENDING payment record, then initiates the STK Push.
 *
 * CRITICAL: This action does NOT mark anything as PAID.
 * It only creates a payment in PENDING state and sends the STK prompt.
 * The actual verification happens in the callback endpoint.
 */

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { initiateStkPush } from "@/lib/payments/providers/mpesa/stk";
import { PaymentStatus } from "@prisma/client";

export async function initiateMpesaPayment({
  orderId,
  phoneNumber,
}: {
  orderId: string;
  phoneNumber: string;
}) {
  const session = await auth();
  if (!session?.user?.businessId) {
    throw new Error("Unauthorized");
  }
  const { businessId, id: userId } = session.user;

  // 1. Verify order belongs to this business and is in a payable state
  const order = await prisma.order.findUnique({
    where: { id: orderId, businessId },
  });

  if (!order) throw new Error("Order not found");

  const payableStatuses = ["DRAFT", "PENDING_PAYMENT", "PARTIALLY_PAID"];
  if (!payableStatuses.includes(order.status)) {
    throw new Error(`Order is not in a payable state (current: ${order.status})`);
  }

  // 2. Create a PENDING payment record BEFORE contacting Safaricom
  const payment = await prisma.payment.create({
    data: {
      businessId,
      orderId,
      customerId: order.customerId,
      provider: "MPESA",
      amount: order.total,
      currency: order.currency,
      status: PaymentStatus.PENDING,
      events: {
        create: {
          status: PaymentStatus.PENDING,
          message: `STK Push initiated to ${phoneNumber}`,
        },
      },
    },
  });

  // 3. Initiate the STK Push — this does NOT confirm payment
  let stkResponse;
  try {
    stkResponse = await initiateStkPush({
      phoneNumber,
      amount: order.total,
      orderId: order.orderNumber,
      description: `PayProof: ${order.orderNumber}`,
    });
  } catch (error) {
    // Mark payment as failed if STK Push initiation itself fails
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : "STK Push failed",
        events: {
          create: {
            status: PaymentStatus.FAILED,
            message: `STK Push initiation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        },
      },
    });
    throw error;
  }

  // 4. Store the CheckoutRequestID so the callback can find this payment
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      checkoutRequestId: stkResponse.CheckoutRequestID,
      merchantRequestId: stkResponse.MerchantRequestID,
    },
  });

  // 5. Audit log
  await prisma.auditLog.create({
    data: {
      businessId,
      userId: userId ?? null,
      action: "MPESA_STK_INITIATED",
      entityType: "Payment",
      entityId: payment.id,
      newValue: {
        orderId,
        phoneNumber,
        amount: order.total,
        CheckoutRequestID: stkResponse.CheckoutRequestID,
        MerchantRequestID: stkResponse.MerchantRequestID,
      },
    },
  });

  return {
    success: true,
    paymentId: payment.id,
    checkoutRequestId: stkResponse.CheckoutRequestID,
    message: stkResponse.CustomerMessage,
  };
}
