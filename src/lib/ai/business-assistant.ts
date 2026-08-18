import { prisma } from "@/lib/db/prisma";
import { PaymentStatus, Prisma } from "@prisma/client";

export type BusinessAssistantAnswer = {
  answer: string;
  requiresConfirmation: boolean;
  source: string[];
  dataSummary?: Record<string, unknown>;
};

function formatCurrency(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "KES 0";
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);
}

function toBusinessSafeWhere(businessId: string, overrides: Prisma.PaymentWhereInput = {}) {
  return {
    businessId,
    ...overrides,
  };
}

async function logAiAudit({
  businessId,
  userId,
  question,
  answer,
  action,
}: {
  businessId: string;
  userId: string;
  question: string;
  answer: string;
  action: string;
}) {
  await prisma.auditLog.create({
    data: {
      businessId,
      userId,
      action,
      entityType: "AI_Assistant",
      entityId: userId,
      newValue: { question, answer },
    },
  });
}

async function getRevenueForMonth(businessId: string) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const total = await prisma.payment.aggregate({
    where: toBusinessSafeWhere(businessId, {
      status: PaymentStatus.VERIFIED,
      createdAt: { gte: start },
    }),
    _sum: { amount: true },
  });

  return total._sum.amount ?? null;
}

export async function answerBusinessQuestion(
  question: string,
  businessId: string,
  userId: string,
): Promise<BusinessAssistantAnswer> {
  const normalized = question.trim().toLowerCase();

  if (!businessId || !userId) {
    throw new Error("Authenticated business context is required.");
  }

  if (normalized.includes("sold this month") || normalized.includes("revenue this month") || normalized.includes("how much did i sell")) {
    const amount = await getRevenueForMonth(businessId);
    if (amount == null) {
      const answer = "There is insufficient data to calculate this month’s revenue from verified payments.";
      await logAiAudit({ businessId, userId, question, answer, action: "AI_QUESTION" });
      return { answer, requiresConfirmation: false, source: ["payment:verified:monthly_total"] };
    }

    const answer = `this month’s verified sales total ${formatCurrency(amount)}.`;
    await logAiAudit({ businessId, userId, question, answer, action: "AI_QUESTION" });
    return {
      answer,
      requiresConfirmation: false,
      source: ["payment:verified:monthly_total"],
      dataSummary: { revenueThisMonth: amount },
    };
  }

  if (normalized.includes("who owes me money") || normalized.includes("outstanding payments") || normalized.includes("owing")) {
    const unpaidOrders = await prisma.order.findMany({
      where: {
        businessId,
        status: { in: ["DRAFT", "PENDING_PAYMENT", "PARTIALLY_PAID"] },
      },
      select: {
        orderNumber: true,
        total: true,
        status: true,
        customer: { select: { name: true } },
      },
    });

    if (!unpaidOrders.length) {
      const answer = "There is insufficient data to identify outstanding debtor balances. No unpaid orders are currently recorded for this business.";
      await logAiAudit({ businessId, userId, question, answer, action: "AI_QUESTION" });
      return { answer, requiresConfirmation: false, source: ["order:outstanding"], dataSummary: { outstandingOrders: 0 } };
    }

    const lines = unpaidOrders.map((order) => `${order.customer?.name ?? "Customer"} owes ${formatCurrency(order.total)} on ${order.orderNumber} (${order.status}).`);
    const answer = `Outstanding payments: ${lines.join(" ")}`;
    await logAiAudit({ businessId, userId, question, answer, action: "AI_QUESTION" });
    return {
      answer,
      requiresConfirmation: false,
      source: ["order:outstanding"],
      dataSummary: { outstandingOrders: unpaidOrders.length },
    };
  }

  if (normalized.includes("best-selling") || normalized.includes("top selling") || normalized.includes("best selling")) {
    const topProducts = await prisma.orderItem.groupBy({
      by: ["productId"],
      where: {
        order: { businessId },
      },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    });

    if (!topProducts.length) {
      const answer = "There is insufficient data to determine best-selling products because no completed order items are recorded for this business.";
      await logAiAudit({ businessId, userId, question, answer, action: "AI_QUESTION" });
      return { answer, requiresConfirmation: false, source: ["order_item:sales_rank"], dataSummary: { topProducts: 0 } };
    }

    const productIds = topProducts.map((entry) => entry.productId);
    const products = await prisma.product.findMany({
      where: { businessId, id: { in: productIds } },
      select: { id: true, name: true },
    });
    const productMap = new Map(products.map((product) => [product.id, product.name]));
    const insights = topProducts.map((entry) => `${productMap.get(entry.productId) ?? "Unknown product"}: ${entry._sum.quantity ?? 0} units sold.`);
    const answer = `Your best-selling products are: ${insights.join(" ")}`;
    await logAiAudit({ businessId, userId, question, answer, action: "AI_QUESTION" });
    return {
      answer,
      requiresConfirmation: false,
      source: ["order_item:sales_rank", "product:lookup"],
      dataSummary: { topProducts: insights },
    };
  }

  if (normalized.includes("slow-moving") || normalized.includes("slow moving") || normalized.includes("underperforming")) {
    const slowProducts = await prisma.product.findMany({
      where: { businessId, stockQuantity: { gt: 0 } },
      select: { id: true, name: true, stockQuantity: true, reorderLevel: true, sellingPrice: true },
      orderBy: [{ stockQuantity: "asc" }],
      take: 5,
    });

    if (!slowProducts.length) {
      const answer = "There is insufficient data to identify slow-moving products because no product inventory data is available for this business.";
      await logAiAudit({ businessId, userId, question, answer, action: "AI_QUESTION" });
      return { answer, requiresConfirmation: false, source: ["product:inventory"], dataSummary: { slowProducts: 0 } };
    }

    const lowStock = slowProducts.map((product) => `${product.name} has ${product.stockQuantity} units left.`);
    const answer = `Slow-moving or low-stock products: ${lowStock.join(" ")}`;
    await logAiAudit({ businessId, userId, question, answer, action: "AI_QUESTION" });
    return {
      answer,
      requiresConfirmation: false,
      source: ["product:inventory"],
      dataSummary: { slowProducts: slowProducts.map((p) => ({ name: p.name, stockQuantity: p.stockQuantity })) },
    };
  }

  if (normalized.includes("restock") || normalized.includes("what should i restock")) {
    const products = await prisma.product.findMany({
      where: { businessId },
      select: { id: true, name: true, stockQuantity: true, reorderLevel: true },
      orderBy: [{ stockQuantity: "asc" }],
      take: 10,
    });

    const restockCandidates = products.filter((product) => product.stockQuantity <= product.reorderLevel);

    if (!restockCandidates.length) {
      const answer = "There is insufficient data to recommend restocking. No products are currently at or below their reorder threshold.";
      await logAiAudit({ businessId, userId, question, answer, action: "AI_QUESTION" });
      return { answer, requiresConfirmation: false, source: ["product:inventory"], dataSummary: { restockCandidates: 0 } };
    }

    const answer = `Recommended restocking: ${restockCandidates.map((product) => `${product.name} (${product.stockQuantity} left, reorder at ${product.reorderLevel})`).join("; ")}.`;
    await logAiAudit({ businessId, userId, question, answer, action: "AI_QUESTION" });
    return {
      answer,
      requiresConfirmation: true,
      source: ["product:inventory", "product:reorder_threshold"],
      dataSummary: { restockCandidates: products },
    };
  }

  if (normalized.includes("focus on today") || normalized.includes("what should i focus on today") || normalized.includes("today")) {
    const urgentOrders = await prisma.order.findMany({
      where: { businessId, status: { in: ["DRAFT", "PENDING_PAYMENT", "PARTIALLY_PAID"] } },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { orderNumber: true, total: true, status: true, createdAt: true },
    });

    const lowStock = await prisma.product.findMany({
      where: { businessId, stockQuantity: { lte: 5 } },
      select: { name: true, stockQuantity: true },
      orderBy: [{ stockQuantity: "asc" }],
      take: 3,
    });

    if (!urgentOrders.length && !lowStock.length) {
      const answer = "There is insufficient data to recommend what to focus on today. No urgent orders or low-stock products are currently tracked for this business.";
      await logAiAudit({ businessId, userId, question, answer, action: "AI_QUESTION" });
      return { answer, requiresConfirmation: false, source: ["order:priority", "product:inventory"], dataSummary: { urgentOrders: 0, lowStock: 0 } };
    }

    const tasks = [
      ...urgentOrders.map((order) => `Follow up on ${order.orderNumber} (${formatCurrency(order.total)}; ${order.status}).`),
      ...lowStock.map((product) => `Restock ${product.name} (${product.stockQuantity} units left).`),
    ];
    const answer = `Focus today: ${tasks.join(" ")}`;
    await logAiAudit({ businessId, userId, question, answer, action: "AI_QUESTION" });
    return {
      answer,
      requiresConfirmation: false,
      source: ["order:priority", "product:inventory"],
      dataSummary: { urgentOrders, lowStock },
    };
  }

  const answer = "There is insufficient data to answer that question from this business’s records. Please ask about sales, outstanding payments, product stock, order status, or restocking.";
  await logAiAudit({ businessId, userId, question, answer, action: "AI_QUESTION" });
  return { answer, requiresConfirmation: false, source: ["business_context:insufficient_data"] };
}
