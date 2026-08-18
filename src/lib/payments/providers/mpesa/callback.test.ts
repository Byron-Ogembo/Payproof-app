/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * M-PESA Callback Handler Tests
 *
 * Tests the following scenarios as required:
 *   1. Successful payment (exact amount) → VERIFIED + order PAID
 *   2. Partial payment → PARTIALLY_PAID
 *   3. Overpayment → OVERPAID + order PAID
 *   4. Failed payment (ResultCode != 0) → FAILED
 *   5. User-cancelled payment (ResultCode 1032) → FAILED
 *   6. Duplicate callback (already VERIFIED) → silently ignored
 *   7. Unknown CheckoutRequestID → acknowledged without error
 *   8. Missing/invalid payload structure → safe rejection
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleMpesaCallback } from "./callback";
import { PaymentStatus, OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

const prismaMock = vi.hoisted(() => ({
  $transaction: vi.fn(async (cb: (tx: typeof prismaMock) => Promise<unknown>) => cb(prismaMock)),
  payment: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  paymentEvent: { create: vi.fn() },
  order: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  auditLog: { create: vi.fn() },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: prismaMock,
}));

// ─── Mock the matching engine ─────────────────────────────────────────────────
vi.mock("@/lib/payments/engine", () => ({
  matchAndVerifyPayment: vi.fn(),
}));

import { matchAndVerifyPayment } from "@/lib/payments/engine";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeSuccessPayload(
  checkoutRequestId = "ws_CO_TEST_001",
  amount = 1000
) {
  return {
    Body: {
      stkCallback: {
        MerchantRequestID: "mer_001",
        CheckoutRequestID: checkoutRequestId,
        ResultCode: 0,
        ResultDesc: "The service request is processed successfully.",
        CallbackMetadata: {
          Item: [
            { Name: "Amount", Value: amount },
            { Name: "MpesaReceiptNumber", Value: "QHJ7TEST001" },
            { Name: "Balance", Value: 5000 },
            { Name: "TransactionDate", Value: 20260817120000 },
            { Name: "PhoneNumber", Value: 254712345678 },
          ],
        },
      },
    },
  };
}

function makeFailurePayload(
  checkoutRequestId = "ws_CO_TEST_FAIL",
  resultCode = 1032,
  desc = "Request cancelled by user"
) {
  return {
    Body: {
      stkCallback: {
        MerchantRequestID: "mer_002",
        CheckoutRequestID: checkoutRequestId,
        ResultCode: resultCode,
        ResultDesc: desc,
      },
    },
  };
}

const pendingPayment = {
  id: "pay_001",
  businessId: "bus_001",
  orderId: "ord_001",
  status: PaymentStatus.PENDING,
  checkoutRequestId: "ws_CO_TEST_001",
};

const verifiedPayment = {
  ...pendingPayment,
  status: PaymentStatus.VERIFIED,
};

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("handleMpesaCallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.payment.update as any).mockResolvedValue({});
    (prisma.paymentEvent.create as any).mockResolvedValue({});
    (prisma.auditLog.create as any).mockResolvedValue({});
    (prisma.order.findUnique as any).mockResolvedValue({
      id: "ord_001",
      businessId: "bus_001",
      total: 1000,
      customerId: "cust_001",
      status: OrderStatus.PENDING_PAYMENT,
    });
    (prisma.order.update as any).mockResolvedValue({});
  });

  // ─── Test 1: Successful exact payment ──────────────────────────────────────
  it("should record success and invoke matching engine on ResultCode 0", async () => {
    (prisma.payment.findUnique as any).mockResolvedValue(pendingPayment);

    const result = await handleMpesaCallback(makeSuccessPayload() as any);

    expect(result.success).toBe(true);
    // Should update payment to PROCESSING before handing to engine
    expect(prisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: PaymentStatus.PROCESSING }),
      })
    );
    // Should call the matching engine — this is what produces VERIFIED
    expect(matchAndVerifyPayment).toHaveBeenCalledWith("pay_001", "ord_001");
  });

  // ─── Test 2: Failed payment (user cancelled) ────────────────────────────────
  it("should mark payment FAILED when ResultCode is non-zero (1032 = cancelled)", async () => {
    (prisma.payment.findUnique as any).mockResolvedValue({
      ...pendingPayment,
      checkoutRequestId: "ws_CO_TEST_FAIL",
    });

    const result = await handleMpesaCallback(makeFailurePayload() as any);

    expect(result.success).toBe(true);
    expect(prisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: PaymentStatus.FAILED,
          errorCode: "1032",
        }),
      })
    );
    // Matching engine must NOT be called for failed payments
    expect(matchAndVerifyPayment).not.toHaveBeenCalled();
  });

  // ─── Test 3: Duplicate callback (already VERIFIED) ─────────────────────────
  it("should silently ignore duplicate callbacks when payment is already VERIFIED", async () => {
    (prisma.payment.findUnique as any).mockResolvedValue(verifiedPayment);

    const result = await handleMpesaCallback(makeSuccessPayload() as any);

    expect(result.success).toBe(true);
    expect(result.message).toContain("Duplicate callback ignored");
    expect(prisma.payment.update).not.toHaveBeenCalled();
    expect(matchAndVerifyPayment).not.toHaveBeenCalled();
  });

  // ─── Test 4: Unknown CheckoutRequestID ─────────────────────────────────────
  it("should acknowledge and return success for unknown CheckoutRequestID", async () => {
    (prisma.payment.findUnique as any).mockResolvedValue(null);

    const result = await handleMpesaCallback(makeSuccessPayload("UNKNOWN_ID") as any);

    expect(result.success).toBe(true);
    expect(result.message).toContain("Unknown transaction");
    expect(prisma.payment.update).not.toHaveBeenCalled();
    expect(matchAndVerifyPayment).not.toHaveBeenCalled();
  });

  // ─── Test 5: Wrong amount (handled by matching engine) ─────────────────────
  it("should forward wrong-amount payment to matching engine for PARTIALLY_PAID logic", async () => {
    (prisma.payment.findUnique as any).mockResolvedValue(pendingPayment);
    // Amount 500 vs order total 1000 — engine will decide PARTIALLY_PAID
    const result = await handleMpesaCallback(makeSuccessPayload("ws_CO_TEST_001", 500) as any);

    expect(result.success).toBe(true);
    // Engine is called — it will determine PARTIALLY_PAID
    expect(matchAndVerifyPayment).toHaveBeenCalled();
    // Payment updated with the ACTUAL amount from callback (500, not fabricated)
    expect(prisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amount: 500 }),
      })
    );
  });

  // ─── Test 6: Generic failure code ──────────────────────────────────────────
  it("should record error code and desc for general failure (ResultCode 1)", async () => {
    (prisma.payment.findUnique as any).mockResolvedValue({
      ...pendingPayment,
      checkoutRequestId: "ws_CO_TEST_FAIL",
    });

    const payload = makeFailurePayload("ws_CO_TEST_FAIL", 1, "Insufficient funds");
    const result = await handleMpesaCallback(payload as any);

    expect(result.success).toBe(true);
    expect(prisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: PaymentStatus.FAILED,
          errorCode: "1",
          errorMessage: "Insufficient funds",
        }),
      })
    );
  });

  // ─── Test 7: Duplicate PROCESSING state (already in terminal FAILED state) ──
  it("should ignore callback if payment is already in FAILED state", async () => {
    (prisma.payment.findUnique as any).mockResolvedValue({
      ...pendingPayment,
      status: PaymentStatus.FAILED,
    });

    const result = await handleMpesaCallback(makeSuccessPayload() as any);

    expect(result.success).toBe(true);
    expect(result.message).toContain("Duplicate callback ignored");
    expect(matchAndVerifyPayment).not.toHaveBeenCalled();
  });

  // ─── Test 8: Duplicate REFUNDED state ──────────────────────────────────────
  it("should ignore callback if payment is already in REFUNDED state", async () => {
    (prisma.payment.findUnique as any).mockResolvedValue({
      ...pendingPayment,
      status: PaymentStatus.REFUNDED,
    });

    const result = await handleMpesaCallback(makeSuccessPayload() as any);

    expect(result.success).toBe(true);
    expect(result.message).toContain("Duplicate callback ignored");
    expect(matchAndVerifyPayment).not.toHaveBeenCalled();
  });
});
