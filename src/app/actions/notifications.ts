"use server";

import { auth } from "@/auth";
import {
  getNotifications as fetchNotifications,
  markNotificationRead as setNotificationRead,
  triggerPaymentReminderNotification,
} from "@/lib/notifications";
import { revalidatePath } from "next/cache";

async function getSessionBusinessId() {
  const session = await auth();
  if (!session?.user?.businessId) {
    throw new Error("Unauthorized");
  }
  return { businessId: session.user.businessId, userId: session.user.id };
}

export async function getUserNotifications(page = 1, limit = 15) {
  const { businessId } = await getSessionBusinessId();
  return fetchNotifications({ businessId, page, limit });
}

export async function markAsRead(id: string) {
  await getSessionBusinessId();
  const count = await setNotificationRead(id);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/notifications");
  return { success: true, count };
}

export async function sendPaymentReminder(orderId: string, orderNumber: string, customerName?: string | null) {
  const { businessId } = await getSessionBusinessId();
  const result = await triggerPaymentReminderNotification({
    businessId,
    orderId,
    orderNumber,
    customerName,
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/notifications");
  return { success: true, count: result.length };
}
