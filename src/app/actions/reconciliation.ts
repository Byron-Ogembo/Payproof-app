"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { matchAndVerifyPayment } from "@/lib/payments/engine";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

async function getAuthorizedBusiness() {
  const session = await auth();
  if (!session?.user?.businessId) {
    throw new Error("Unauthorized");
  }
  if (session.user.role === "VIEWER") {
    throw new Error("Viewers cannot modify reconciliation records.");
  }
  return { businessId: session.user.businessId, userId: session.user.id };
}

export async function matchPaymentToOrder(paymentId: string, orderId: string) {
  const { businessId, userId } = await getAuthorizedBusiness();

  if (!orderId) {
    throw new Error("Select an order to match this payment.");
  }

  const [payment, order] = await Promise.all([
    prisma.payment.findFirst({ where: { id: paymentId, businessId } }),
    prisma.order.findFirst({ where: { id: orderId, businessId } }),
  ]);

  if (!payment) throw new Error("Payment not found.");
  if (!order) throw new Error("Order not found.");

  const allowedPaymentStates: PaymentStatus[] = [
    PaymentStatus.REQUIRES_REVIEW,
    PaymentStatus.PENDING,
  ];
  if (!allowedPaymentStates.includes(payment.status)) {
    throw new Error("Only unmatched or pending review payments can be matched.");
  }

  const blockedOrderStates: OrderStatus[] = [
    OrderStatus.CANCELLED,
    OrderStatus.REFUNDED,
  ];
  if (blockedOrderStates.includes(order.status)) {
    throw new Error("Cannot match a payment to a cancelled or refunded order.");
  }

  await prisma.auditLog.create({
    data: {
      businessId,
      userId: userId ?? null,
      action: "PAYMENT_MANUALLY_MATCHED",
      entityType: "Payment",
      entityId: payment.id,
      oldValue: { orderId: payment.orderId, status: payment.status },
      newValue: { orderId: order.id },
    },
  });

  await matchAndVerifyPayment(payment.id, order.id);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reconciliation");
  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${order.id}`);

  return { success: true };
}

export async function resolvePaymentException(
  paymentId: string,
  resolution: "MARK_VERIFIED" | "MARK_REFUNDED" | "MARK_FAILED",
) {
  const { businessId, userId } = await getAuthorizedBusiness();

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, businessId },
  });
  if (!payment) throw new Error("Payment not found.");

  const resolvableStates: PaymentStatus[] = [
    PaymentStatus.OVERPAID,
    PaymentStatus.REQUIRES_REVIEW,
    PaymentStatus.PARTIALLY_PAID,
  ];
  if (!resolvableStates.includes(payment.status)) {
    throw new Error("This payment cannot be resolved with that action.");
  }

  if (resolution === "MARK_VERIFIED" && payment.status !== PaymentStatus.OVERPAID) {
    throw new Error("Only overpaid exceptions can be directly accepted as verified.");
  }

  const nextStatus =
    resolution === "MARK_VERIFIED"
      ? PaymentStatus.VERIFIED
      : resolution === "MARK_REFUNDED"
        ? PaymentStatus.REFUNDED
        : PaymentStatus.FAILED;

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: nextStatus },
    });

    await tx.paymentEvent.create({
      data: {
        paymentId: payment.id,
        status: nextStatus,
        message: `Exception resolved by merchant (${resolution.replace(/_/g, " ").toLowerCase()})`,
      },
    });

    await tx.auditLog.create({
      data: {
        businessId,
        userId: userId ?? null,
        action: "PAYMENT_EXCEPTION_RESOLVED",
        entityType: "Payment",
        entityId: payment.id,
        oldValue: { status: payment.status },
        newValue: { status: nextStatus, resolution },
      },
    });
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/reconciliation");
  if (payment.orderId) {
    revalidatePath(`/dashboard/orders/${payment.orderId}`);
  }

  return { success: true };
}
