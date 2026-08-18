import { prisma } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";

export enum NotificationType {
  PAYMENT_VERIFIED = "PAYMENT_VERIFIED",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  PAYMENT_REQUIRES_REVIEW = "PAYMENT_REQUIRES_REVIEW",
  NEW_ORDER = "NEW_ORDER",
  PAYMENT_REMINDER = "PAYMENT_REMINDER",
  LOW_STOCK = "LOW_STOCK",
}

export enum NotificationChannel {
  IN_APP = "IN_APP",
  EMAIL = "EMAIL",
}

export type NotificationMetadata = Record<string, unknown>;

export type CreateNotificationInput = {
  businessId: string;
  userId?: string | null;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  dedupeKey?: string;
  metadata?: NotificationMetadata;
};

export type TriggerNotificationInput = {
  businessId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  userIds?: string[];
  metadata?: NotificationMetadata;
  dedupeKey?: string;
};

export async function createNotification(input: CreateNotificationInput) {
  const dedupeKey =
    input.dedupeKey ??
    `${input.entityType ?? "notification"}:${input.entityId ?? input.title}:${input.channel}`;

  return prisma.notification.upsert({
    where: {
      businessId_dedupeKey: {
        businessId: input.businessId,
        dedupeKey,
      },
    },
    update: {
      title: input.title,
      message: input.message,
      metadata: input.metadata ?? {},
      readAt: null,
    },
    create: {
      businessId: input.businessId,
      userId: input.userId ?? null,
      type: input.type,
      channel: input.channel,
      title: input.title,
      message: input.message,
      entityType: input.entityType ?? "Notification",
      entityId: input.entityId ?? null,
      dedupeKey,
      metadata: input.metadata ?? {},
    },
  });
}

export async function createNotificationTx(
  tx: Prisma.TransactionClient,
  input: CreateNotificationInput,
) {
  const dedupeKey =
    input.dedupeKey ??
    `${input.entityType ?? "notification"}:${input.entityId ?? input.title}:${input.channel}`;

  return tx.notification.upsert({
    where: {
      businessId_dedupeKey: {
        businessId: input.businessId,
        dedupeKey,
      },
    },
    update: {
      title: input.title,
      message: input.message,
      metadata: input.metadata ?? {},
      readAt: null,
    },
    create: {
      businessId: input.businessId,
      userId: input.userId ?? null,
      type: input.type,
      channel: input.channel,
      title: input.title,
      message: input.message,
      entityType: input.entityType ?? "Notification",
      entityId: input.entityId ?? null,
      dedupeKey,
      metadata: input.metadata ?? {},
    },
  });
}

async function sendEmailNotification({
  to,
  subject,
  text,
}: {
  to: string;
  subject: string;
  text: string;
}) {
  if (!to) return null;

  console.info(`[EMAIL NOTIFICATION] ${to}: ${subject}\n${text}`);
  return { sent: true, recipient: to };
}

export async function triggerBusinessNotification(input: TriggerNotificationInput) {
  const userFilter = input.userIds?.length
    ? { businessId: input.businessId, id: { in: input.userIds } }
    : { businessId: input.businessId };

  const users = await prisma.user.findMany({
    where: userFilter,
    select: { id: true, email: true, name: true, role: true },
  });

  if (users.length === 0) {
    return [];
  }

  const notifications = [] as Awaited<ReturnType<typeof createNotification>>[];

  for (const user of users) {
    const base = {
      businessId: input.businessId,
      userId: user.id,
      type: input.type,
      title: input.title,
      message: input.message,
      entityType: input.entityType ?? "Notification",
      entityId: input.entityId ?? null,
      metadata: input.metadata ?? {},
      dedupeKey: input.dedupeKey ?? `${input.type}:${input.entityType ?? "notification"}:${input.entityId ?? user.id}`,
    };

    const inApp = await createNotification({
      ...base,
      channel: NotificationChannel.IN_APP,
      dedupeKey: `${base.dedupeKey}:in_app`,
    });

    notifications.push(inApp);

    if (user.email) {
      const email = await createNotification({
        ...base,
        channel: NotificationChannel.EMAIL,
        dedupeKey: `${base.dedupeKey}:email`,
      });

      notifications.push(email);
      await sendEmailNotification({
        to: user.email,
        subject: input.title,
        text: input.message,
      });
    }
  }

  return notifications;
}

export async function triggerBusinessNotificationTx(
  tx: Prisma.TransactionClient,
  input: TriggerNotificationInput,
) {
  const userFilter = input.userIds?.length
    ? { businessId: input.businessId, id: { in: input.userIds } }
    : { businessId: input.businessId };

  const users = await tx.user.findMany({
    where: userFilter,
    select: { id: true, email: true, name: true, role: true },
  });

  if (users.length === 0) {
    return [];
  }

  const notifications = [] as Awaited<ReturnType<typeof createNotificationTx>>[];

  for (const user of users) {
    const base = {
      businessId: input.businessId,
      userId: user.id,
      type: input.type,
      title: input.title,
      message: input.message,
      entityType: input.entityType ?? "Notification",
      entityId: input.entityId ?? null,
      metadata: input.metadata ?? {},
      dedupeKey: input.dedupeKey ?? `${input.type}:${input.entityType ?? "notification"}:${input.entityId ?? user.id}`,
    };

    const inApp = await createNotificationTx(tx, {
      ...base,
      channel: NotificationChannel.IN_APP,
      dedupeKey: `${base.dedupeKey}:in_app`,
    });

    notifications.push(inApp);

    if (user.email) {
      const email = await createNotificationTx(tx, {
        ...base,
        channel: NotificationChannel.EMAIL,
        dedupeKey: `${base.dedupeKey}:email`,
      });

      notifications.push(email);
    }
  }

  return notifications;
}

export async function triggerPaymentNotification({
  businessId,
  type,
  title,
  message,
  paymentId,
  orderNumber,
  amount,
  metadata,
}: {
  businessId: string;
  type: NotificationType;
  title: string;
  message: string;
  paymentId: string;
  orderNumber?: string;
  amount?: number;
  metadata?: NotificationMetadata;
}) {
  return triggerBusinessNotification({
    businessId,
    type,
    title,
    message,
    entityType: "Payment",
    entityId: paymentId,
    dedupeKey: `payment:${paymentId}:${type}`,
    metadata: {
      ...(metadata ?? {}),
      paymentId,
      orderNumber: orderNumber ?? null,
      amount: amount ?? null,
    },
  });
}

export async function triggerPaymentNotificationTx(
  tx: Prisma.TransactionClient,
  input: {
    businessId: string;
    type: NotificationType;
    title: string;
    message: string;
    paymentId: string;
    orderNumber?: string;
    amount?: number;
    metadata?: NotificationMetadata;
  },
) {
  return triggerBusinessNotificationTx(tx, {
    businessId: input.businessId,
    type: input.type,
    title: input.title,
    message: input.message,
    entityType: "Payment",
    entityId: input.paymentId,
    dedupeKey: `payment:${input.paymentId}:${input.type}`,
    metadata: {
      ...(input.metadata ?? {}),
      paymentId: input.paymentId,
      orderNumber: input.orderNumber ?? null,
      amount: input.amount ?? null,
    },
  });
}

export async function triggerOrderNotification({
  businessId,
  orderId,
  orderNumber,
}: {
  businessId: string;
  orderId: string;
  orderNumber: string;
}) {
  return triggerBusinessNotification({
    businessId,
    type: NotificationType.NEW_ORDER,
    title: "New order received",
    message: `A new order (${orderNumber}) has been created and is ready for processing.`,
    entityType: "Order",
    entityId: orderId,
    dedupeKey: `order:${orderId}:new_order`,
    metadata: { orderNumber },
  });
}

export async function triggerLowStockNotification({
  businessId,
  productId,
  productName,
  stockQuantity,
  reorderLevel,
}: {
  businessId: string;
  productId: string;
  productName: string;
  stockQuantity: number;
  reorderLevel: number;
}) {
  return triggerBusinessNotification({
    businessId,
    type: NotificationType.LOW_STOCK,
    title: "Low stock alert",
    message: `${productName} is running low (${stockQuantity} left; reorder level ${reorderLevel}).`,
    entityType: "Product",
    entityId: productId,
    dedupeKey: `product:${productId}:low_stock`,
    metadata: { productName, stockQuantity, reorderLevel },
  });
}

export async function triggerPaymentReminderNotification({
  businessId,
  orderId,
  orderNumber,
  customerName,
}: {
  businessId: string;
  orderId: string;
  orderNumber: string;
  customerName?: string | null;
}) {
  return triggerBusinessNotification({
    businessId,
    type: NotificationType.PAYMENT_REMINDER,
    title: "Payment reminder",
    message: customerName
      ? `Payment reminder for ${customerName} on order ${orderNumber}.`
      : `Payment reminder for order ${orderNumber}.`,
    entityType: "Order",
    entityId: orderId,
    dedupeKey: `order:${orderId}:payment_reminder`,
    metadata: { orderNumber, customerName },
  });
}

export async function getNotifications({
  businessId,
  page = 1,
  limit = 10,
}: {
  businessId: string;
  page?: number;
  limit?: number;
}) {
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { businessId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { businessId } }),
    prisma.notification.count({ where: { businessId, readAt: null } }),
  ]);

  return {
    notifications,
    total,
    unreadCount,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    page,
  };
}

export async function markNotificationRead(id: string) {
  const result = await prisma.notification.updateMany({
    where: { id, readAt: null },
    data: { readAt: new Date() },
  });

  return result.count;
}
