/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  processWebhook,
  matchAndVerifyPayment,
  calculateOrderBalance,
  PaymentPayload,
} from "./engine";
import { PaymentStatus, OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

const prismaMock = vi.hoisted(() => ({
  $transaction: vi.fn(async (callback: (tx: typeof prismaMock) => Promise<unknown>) => callback(prismaMock)),
  payment: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  paymentEvent: {
    create: vi.fn(),
  },
  paymentRequest: { updateMany: vi.fn() },
  order: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
  },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: prismaMock,
}));

describe("Payment Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("processWebhook", () => {
    const payload: PaymentPayload = {
      businessId: "bus_1",
      provider: "MPESA",
      providerRef: "QWE123RTY",
      amount: 1000,
      idempotencyKey: "idem_123",
      rawPayload: {},
    };

    it("should return existing payment if idempotency key matches", async () => {
      const mockPayment = { id: "pay_1", idempotencyKey: "idem_123" };
      (prisma.payment.findUnique as any).mockResolvedValueOnce(mockPayment);

      const result = await processWebhook(payload);

      expect(prisma.payment.findUnique).toHaveBeenCalledWith({
        where: { idempotencyKey: "idem_123" },
      });
      expect(result).toEqual(mockPayment);
      expect(prisma.payment.create).not.toHaveBeenCalled();
    });

    it("should reject duplicate provider/ref combination", async () => {
      (prisma.payment.findUnique as any)
        .mockResolvedValueOnce(null) // Idempotency check passes
        .mockResolvedValueOnce({ id: "pay_1" }); // Provider uniqueness fails (exists)

      const result = await processWebhook(payload);
      
      expect(prisma.payment.create).not.toHaveBeenCalled();
      expect(result).toHaveProperty("id", "pay_1");
    });

    it("should create a new pending payment", async () => {
      (prisma.payment.findUnique as any).mockResolvedValue(null);
      const newPayment = { id: "pay_2", status: PaymentStatus.PENDING };
      (prisma.payment.create as any).mockResolvedValue(newPayment);

      const result = await processWebhook(payload);

      expect(prisma.payment.create).toHaveBeenCalled();
      expect(result).toEqual(newPayment);
    });
  });

  describe("matchAndVerifyPayment", () => {
    const mockOrder = {
      id: "ord_1",
      businessId: "bus_1",
      total: 1000,
      customerId: "cust_1",
    };

    const mockPayment = {
      id: "pay_1",
      businessId: "bus_1",
      amount: 1000,
      status: PaymentStatus.PENDING,
    };

    it("should mark exact payment as VERIFIED and order as PAID", async () => {
      (prisma.payment.findUnique as any).mockResolvedValue(mockPayment);
      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);
      (prisma.payment.findMany as any).mockResolvedValue([{ id: "pay_1", amount: 1000 }]);
      (prisma.payment.update as any).mockResolvedValue({ ...mockPayment, status: PaymentStatus.VERIFIED });

      await matchAndVerifyPayment("pay_1", "ord_1");

      // Verify Payment update
      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: "pay_1" },
        data: { status: PaymentStatus.VERIFIED, orderId: "ord_1", customerId: "cust_1" },
      });

      // Verify Order update
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "ord_1" },
        data: { status: OrderStatus.PAID },
      });
      
      // Verify Event created
      expect(prisma.paymentEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: PaymentStatus.VERIFIED,
          message: expect.stringContaining("settled in full")
        })
      });
    });

    it("should mark partial payment as PARTIALLY_PAID", async () => {
      const partialPayment = { ...mockPayment, amount: 500 };
      (prisma.payment.findUnique as any).mockResolvedValue(partialPayment);
      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);
      (prisma.payment.findMany as any).mockResolvedValue([{ id: "pay_1", amount: 500 }]);

      await matchAndVerifyPayment("pay_1", "ord_1");

      expect(prisma.payment.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: PaymentStatus.PARTIALLY_PAID })
      }));
      expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
        data: { status: OrderStatus.PARTIALLY_PAID }
      }));
    });

    it("should mark overpayment as OVERPAID and order as PAID", async () => {
      const overPayment = { ...mockPayment, amount: 1500 };
      (prisma.payment.findUnique as any).mockResolvedValue(overPayment);
      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);
      (prisma.payment.findMany as any).mockResolvedValue([{ id: "pay_1", amount: 1500 }]);

      await matchAndVerifyPayment("pay_1", "ord_1");

      expect(prisma.payment.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: PaymentStatus.OVERPAID })
      }));
      expect(prisma.order.update).toHaveBeenCalledWith(expect.objectContaining({
        data: { status: OrderStatus.PAID }
      }));
    });

    it("should mark REQUIRES_REVIEW if mismatched order", async () => {
      (prisma.payment.findUnique as any).mockResolvedValue(mockPayment);
      (prisma.order.findUnique as any).mockResolvedValue(null); // Order not found

      await matchAndVerifyPayment("pay_1", "invalid_ord");

      expect(prisma.payment.update).toHaveBeenCalledWith(expect.objectContaining({
        data: { status: PaymentStatus.REQUIRES_REVIEW }
      }));
      expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it("should mark FAILED if unauthorized business access", async () => {
      const foreignOrder = { ...mockOrder, businessId: "bus_HACKER" };
      (prisma.payment.findUnique as any).mockResolvedValue(mockPayment); // belongs to bus_1
      (prisma.order.findUnique as any).mockResolvedValue(foreignOrder);

      await matchAndVerifyPayment("pay_1", "ord_1");

      expect(prisma.payment.update).toHaveBeenCalledWith(expect.objectContaining({
        data: { status: PaymentStatus.FAILED }
      }));
    });

    it("should settle split payments when second installment completes order total and promote prior partial payment", async () => {
      const secondInstallment = {
        ...mockPayment,
        id: "pay_2",
        amount: 600,
        status: PaymentStatus.PROCESSING,
      };
      (prisma.payment.findUnique as any).mockResolvedValue(secondInstallment);
      (prisma.order.findUnique as any).mockResolvedValue({
        ...mockOrder,
        orderNumber: "ORD-100",
        total: 1000,
      });
      (prisma.payment.findMany as any).mockResolvedValue([
        { id: "pay_1", amount: 400 },
        { id: "pay_2", amount: 600 },
      ]);
      (prisma.payment.update as any).mockResolvedValue({
        ...secondInstallment,
        status: PaymentStatus.VERIFIED,
      });

      await matchAndVerifyPayment("pay_2", "ord_1");

      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: "pay_2" },
        data: {
          status: PaymentStatus.VERIFIED,
          orderId: "ord_1",
          customerId: "cust_1",
        },
      });
      expect(prisma.payment.updateMany).toHaveBeenCalledWith({
        where: {
          orderId: "ord_1",
          id: { not: "pay_2" },
          status: PaymentStatus.PARTIALLY_PAID,
        },
        data: { status: PaymentStatus.VERIFIED },
      });
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "ord_1" },
        data: { status: OrderStatus.PAID },
      });
      expect(prisma.paymentRequest.updateMany).toHaveBeenCalledWith({
        where: { orderId: "ord_1", status: "OPEN" },
        data: { status: "PAID" },
      });
    });

    it("should count an unmatched REQUIRES_REVIEW payment when manually matched to an order", async () => {
      const reviewPayment = {
        id: "pay_review",
        businessId: "bus_1",
        orderId: null,
        amount: 1000,
        status: PaymentStatus.REQUIRES_REVIEW,
      };
      (prisma.payment.findUnique as any).mockResolvedValue(reviewPayment);
      (prisma.order.findUnique as any).mockResolvedValue(mockOrder);
      // Previously unmatched payment is not yet returned in orderId query
      (prisma.payment.findMany as any).mockResolvedValue([]);
      (prisma.payment.update as any).mockResolvedValue({
        ...reviewPayment,
        status: PaymentStatus.VERIFIED,
      });

      await matchAndVerifyPayment("pay_review", "ord_1");

      expect(prisma.payment.update).toHaveBeenCalledWith({
        where: { id: "pay_review" },
        data: {
          status: PaymentStatus.VERIFIED,
          orderId: "ord_1",
          customerId: "cust_1",
        },
      });
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: "ord_1" },
        data: { status: OrderStatus.PAID },
      });
    });
  });

  describe("calculateOrderBalance", () => {
    it("computes remaining balance ignoring pending and failed attempts", () => {
      const balance = calculateOrderBalance(1500, [
        { amount: 500, status: PaymentStatus.PARTIALLY_PAID },
        { amount: 1500, status: PaymentStatus.PENDING },
        { amount: 1500, status: PaymentStatus.FAILED },
      ]);
      expect(balance).toEqual({ paidAmount: 500, remainingBalance: 1000 });
    });

    it("clamps remaining balance to 0 when settled or overpaid", () => {
      const balance = calculateOrderBalance(1000, [
        { amount: 400, status: PaymentStatus.VERIFIED },
        { amount: 800, status: PaymentStatus.OVERPAID },
      ]);
      expect(balance).toEqual({ paidAmount: 1200, remainingBalance: 0 });
    });
  });
});
