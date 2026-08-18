/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDashboardData } from "./dashboard";
import { prisma } from "@/lib/db/prisma";
import { PaymentStatus } from "@prisma/client";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    payment: {
      aggregate: vi.fn(),
      groupBy: vi.fn(),
      count: vi.fn(),
      findMany: vi.fn(),
    },
    order: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    customer: {
      count: vi.fn(),
    },
  },
}));

describe("getDashboardData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("builds real revenue and status metrics from the database", async () => {
    (prisma.payment.aggregate as any).mockImplementation(({ where }: any) => {
      const gte = where?.createdAt?.gte;
      if (where?.status === PaymentStatus.VERIFIED && gte instanceof Date) {
        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        if (gte.getTime() === startOfToday.getTime()) {
          return { _sum: { amount: 2500 } };
        }

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        if (gte.getTime() === startOfMonth.getTime()) {
          return { _sum: { amount: 9000 } };
        }
      }

      if (where?.status === PaymentStatus.VERIFIED) {
        return { _sum: { amount: 9000 } };
      }

      return { _sum: { amount: 0 } };
    });

    (prisma.payment.count as any).mockImplementation(({ where }: any) => {
      if (where?.status === PaymentStatus.VERIFIED) return 4;
      if (where?.status && Array.isArray(where.status.in)) return 3;
      return 2;
    });

    (prisma.payment.groupBy as any).mockResolvedValue([
      { status: PaymentStatus.VERIFIED, _count: { status: 4 } },
      { status: PaymentStatus.PENDING, _count: { status: 3 } },
      { status: PaymentStatus.FAILED, _count: { status: 2 } },
    ]);

    (prisma.order.count as any).mockResolvedValue(12);
    (prisma.customer.count as any).mockResolvedValue(9);
    (prisma.payment.findMany as any).mockResolvedValue([
      { id: "pay_1", amount: 1000, status: PaymentStatus.VERIFIED, createdAt: new Date(), order: { orderNumber: "ORD-100" }, customer: { name: "Alice" } },
    ]);
    (prisma.order.findMany as any).mockResolvedValue([
      { id: "ord_1", orderNumber: "ORD-100", total: 1500, status: PaymentStatus.VERIFIED, customer: { name: "Alice" }, createdAt: new Date() },
    ]);

    const result = await getDashboardData("bus_1");

    expect(result.metrics.revenueToday).toBe(2500);
    expect(result.metrics.revenueThisWeek).toBe(9000);
    expect(result.metrics.verifiedPayments).toBe(4);
    expect(result.metrics.pendingPayments).toBe(3);
    expect(result.metrics.orders).toBe(12);
    expect(result.metrics.customers).toBe(9);
    expect(result.recentTransactions.length).toBeGreaterThan(0);
    expect(result.recentOrders.length).toBeGreaterThan(0);
  });
});
