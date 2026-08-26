import { prisma } from "@/lib/db/prisma";
import { OrderStatus, PaymentStatus } from "@prisma/client";

export type DashboardMetric = {
  revenueToday: number;
  revenueThisWeek: number;
  revenueThisMonth: number;
  verifiedPayments: number;
  pendingPayments: number;
  outstandingPayments: number;
  orders: number;
  customers: number;
};

export type RevenuePoint = {
  label: string;
  value: number;
};

export type StatusPoint = {
  label: string;
  value: number;
};

export type RecentTransaction = {
  id: string;
  provider: string;
  amount: number;
  status: PaymentStatus;
  createdAt: Date;
  customerName: string | null;
  orderNumber: string | null;
};

export type RecentOrder = {
  id: string;
  orderNumber: string;
  total: number;
  status: OrderStatus;
  createdAt: Date;
  customerName: string | null;
};

export type DashboardAlert = {
  id: string;
  type: "payment" | "order";
  level: "info" | "warning" | "critical";
  title: string;
  message: string;
  createdAt: Date;
};

export async function getDashboardData(
  businessId: string,
  transactionPage = 1,
  orderPage = 1,
  pageSize = 6
) {
  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - 6);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const transactionSkip = (Math.max(transactionPage, 1) - 1) * pageSize;
  const orderSkip = (Math.max(orderPage, 1) - 1) * pageSize;

  const [
    revenueToday,
    revenueThisWeek,
    revenueThisMonth,
    verifiedPayments,
    pendingPayments,
    outstandingPayments,
    orders,
    customers,
    statusBreakdown,
    recentTransactionRows,
    recentOrderRows,
    failedPaymentRows,
    unpaidOrderRows,
    revenueTrendRows,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        businessId,
        status: PaymentStatus.VERIFIED,
        createdAt: { gte: startOfToday },
      },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        businessId,
        status: PaymentStatus.VERIFIED,
        createdAt: { gte: startOfWeek },
      },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: {
        businessId,
        status: PaymentStatus.VERIFIED,
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    }),
    prisma.payment.count({
      where: { businessId, status: PaymentStatus.VERIFIED },
    }),
    prisma.payment.count({
      where: {
        businessId,
        status: { in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING, PaymentStatus.REQUIRES_REVIEW] },
      },
    }),
    prisma.order.count({
      where: {
        businessId,
        status: { in: [OrderStatus.DRAFT, OrderStatus.PENDING_PAYMENT, OrderStatus.PARTIALLY_PAID] },
      },
    }),
    prisma.order.count({ where: { businessId } }),
    prisma.customer.count({ where: { businessId } }),
    prisma.payment.groupBy({
      by: ["status"],
      where: { businessId },
      _count: { status: true },
    }),
    prisma.payment.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      skip: transactionSkip,
      take: pageSize,
      select: {
        id: true,
        provider: true,
        amount: true,
        status: true,
        createdAt: true,
        customer: { select: { name: true } },
        order: { select: { orderNumber: true } },
      },
    }),
    prisma.order.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      skip: orderSkip,
      take: pageSize,
      select: {
        id: true,
        orderNumber: true,
        total: true,
        status: true,
        createdAt: true,
        customer: { select: { name: true } },
      },
    }),
    prisma.payment.findMany({
      where: { businessId, status: { in: [PaymentStatus.FAILED, PaymentStatus.REQUIRES_REVIEW] } },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        amount: true,
        status: true,
        errorMessage: true,
        createdAt: true,
      },
    }),
    prisma.order.findMany({
      where: {
        businessId,
        status: { in: [OrderStatus.DRAFT, OrderStatus.PENDING_PAYMENT, OrderStatus.PARTIALLY_PAID] },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        orderNumber: true,
        total: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.payment.findMany({
      where: {
        businessId,
        status: PaymentStatus.VERIFIED,
        createdAt: { gte: startOfWeek },
      },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const paymentStatusChart: StatusPoint[] = Object.values(PaymentStatus).map((status) => ({
    label: status.replace(/_/g, " "),
    value: statusBreakdown.find((entry) => entry.status === status)?._count.status ?? 0,
  }));

  const revenueChart: RevenuePoint[] = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + index);
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    const value = revenueTrendRows
      .filter((entry) => entry.createdAt >= dayStart && entry.createdAt <= dayEnd)
      .reduce((sum, entry) => sum + (entry.amount ?? 0), 0);

    return {
      label: day.toLocaleDateString("en-KE", { weekday: "short" }),
      value,
    };
  });

  const totalTransactions = await prisma.payment.count({ where: { businessId } });
  const totalOrderPages = Math.max(1, Math.ceil(totalTransactions / pageSize));
  const totalOrderRows = await prisma.order.count({ where: { businessId } });
  const totalOrderPagesForOrders = Math.max(1, Math.ceil(totalOrderRows / pageSize));

  const recentTransactions: RecentTransaction[] = recentTransactionRows.map((payment) => ({
    id: payment.id,
    provider: payment.provider,
    amount: payment.amount,
    status: payment.status,
    createdAt: payment.createdAt,
    customerName: payment.customer?.name ?? null,
    orderNumber: payment.order?.orderNumber ?? null,
  }));

  const recentOrders: RecentOrder[] = recentOrderRows.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    total: order.total,
    status: order.status,
    createdAt: order.createdAt,
    customerName: order.customer?.name ?? null,
  }));

  const alerts: DashboardAlert[] = [
    ...failedPaymentRows.map((payment) => ({
      id: payment.id,
      type: "payment" as const,
      level: (payment.status === PaymentStatus.REQUIRES_REVIEW ? "warning" : "critical") as DashboardAlert["level"],
      title: payment.status === PaymentStatus.REQUIRES_REVIEW ? "Payment review required" : "Payment failed",
      message: payment.errorMessage ?? "Payment requires attention.",
      createdAt: payment.createdAt,
    })),
    ...unpaidOrderRows.map((order) => ({
      id: order.id,
      type: "order" as const,
      level: "warning" as const,
      title: "Outstanding order",
      message: `${order.orderNumber} is still awaiting payment completion.`,
      createdAt: order.createdAt,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5);

  return {
    metrics: {
      revenueToday: revenueToday._sum.amount ?? 0,
      revenueThisWeek: revenueThisWeek._sum.amount ?? 0,
      revenueThisMonth: revenueThisMonth._sum.amount ?? 0,
      verifiedPayments,
      pendingPayments,
      outstandingPayments,
      orders,
      customers,
    } satisfies DashboardMetric,
    revenueChart,
    paymentStatusChart,
    recentTransactions,
    recentOrders,
    alerts,
    pagination: {
      transactionsPage: transactionPage,
      ordersPage: orderPage,
      transactionTotal: totalTransactions,
      transactionTotalPages: totalOrderPages,
      orderTotal: totalOrderRows,
      orderTotalPages: totalOrderPagesForOrders,
    },
  };
}
