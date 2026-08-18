/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { answerBusinessQuestion } from "./business-assistant";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    payment: {
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
    order: {
      findMany: vi.fn(),
    },
    orderItem: {
      groupBy: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
}));

describe("business AI assistant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("answers revenue questions using authenticated business data only", async () => {
    (prisma.payment.aggregate as any).mockResolvedValue({ _sum: { amount: 42000 } });

    const result = await answerBusinessQuestion(
      "How much did I sell this month?",
      "bus_1",
      "user_1",
    );

    expect(result.answer).toContain("42,000");
    expect(result.answer).toContain("this month");
    expect(prisma.payment.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          businessId: "bus_1",
          status: PaymentStatus.VERIFIED,
        }),
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  it("returns insufficient data when the requested metric cannot be computed", async () => {
    (prisma.payment.aggregate as any).mockResolvedValue({ _sum: { amount: null } });

    const result = await answerBusinessQuestion(
      "Why did sales decrease?",
      "bus_1",
      "user_1",
    );

    expect(result.answer).toMatch(/insufficient data|not enough data/i);
    expect(result.requiresConfirmation).toBe(false);
  });

  it("identifies low-stock items and recommends restocking without changing records", async () => {
    (prisma.product.findMany as any).mockResolvedValue([
      { id: "prod_1", name: "Milk", stockQuantity: 2, reorderLevel: 10, sellingPrice: 120 },
    ]);

    const result = await answerBusinessQuestion(
      "What should I restock?",
      "bus_1",
      "user_1",
    );

    expect(result.answer).toContain("Milk");
    expect(result.requiresConfirmation).toBe(true);
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          businessId: "bus_1",
        }),
      }),
    );
  });
});
