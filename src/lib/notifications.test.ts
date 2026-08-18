/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  NotificationChannel,
  NotificationType,
  createNotification,
  getNotifications,
  markNotificationRead,
  triggerPaymentNotification,
} from "./notifications";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    notification: {
      upsert: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
  },
}));

describe("notification system", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates idempotent in-app notifications for duplicate payment callbacks", async () => {
    (prisma.notification.upsert as any).mockResolvedValue({
      id: "notif_1",
      type: NotificationType.PAYMENT_VERIFIED,
      channel: NotificationChannel.IN_APP,
      readAt: null,
    });

    await createNotification({
      businessId: "bus_1",
      userId: "user_1",
      type: NotificationType.PAYMENT_VERIFIED,
      channel: NotificationChannel.IN_APP,
      title: "Payment verified",
      message: "Payment for order ORD-100 was verified.",
      entityType: "Payment",
      entityId: "pay_1",
      dedupeKey: "payment:pay_1:verified:in_app",
    });

    expect(prisma.notification.upsert).toHaveBeenCalledWith({
      where: {
        businessId_dedupeKey: {
          businessId: "bus_1",
          dedupeKey: "payment:pay_1:verified:in_app",
        },
      },
      update: expect.any(Object),
      create: expect.objectContaining({
        businessId: "bus_1",
        userId: "user_1",
        type: NotificationType.PAYMENT_VERIFIED,
        channel: NotificationChannel.IN_APP,
      }),
    });
  });

  it("dispatches both in-app and email notifications for a verified payment", async () => {
    (prisma.user.findMany as any).mockResolvedValue([
      { id: "user_1", email: "owner@example.com", name: "Owner" },
    ]);
    (prisma.notification.upsert as any).mockResolvedValue({ id: "notif_1" });

    await triggerPaymentNotification({
      businessId: "bus_1",
      type: NotificationType.PAYMENT_VERIFIED,
      title: "Payment verified",
      message: "Payment for order ORD-100 has been verified.",
      paymentId: "pay_1",
      orderNumber: "ORD-100",
      amount: 5000,
    });

    expect(prisma.notification.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { businessId: "bus_1" },
      select: { id: true, email: true, name: true, role: true },
    });
  });

  it("marks a notification as read and returns unread counts", async () => {
    (prisma.notification.findMany as any).mockResolvedValue([
      { id: "notif_1", readAt: null, title: "Test", message: "Hello", createdAt: new Date() },
    ]);
    (prisma.notification.count as any).mockResolvedValue(1);
    (prisma.notification.updateMany as any).mockResolvedValue({ count: 1 });

    const list = await getNotifications({ businessId: "bus_1", page: 1, limit: 10 });
    const changed = await markNotificationRead("notif_1");

    expect(list.notifications).toHaveLength(1);
    expect(changed).toBe(1);
    expect(prisma.notification.updateMany).toHaveBeenCalledWith({
      where: { id: "notif_1", readAt: null },
      data: { readAt: expect.any(Date) },
    });
  });
});
