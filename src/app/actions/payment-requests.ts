"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { calculateOrderBalance } from "@/lib/payments/engine";
import { initiateStkPush } from "@/lib/payments/providers/mpesa/stk";
import { OrderStatus, PaymentStatus, PaymentRequestStatus } from "@prisma/client";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

const REQUEST_EXPIRY_DAYS = 7;

function normaliseKenyanPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  const normalized = digits.startsWith("0")
    ? `254${digits.slice(1)}`
    : digits.startsWith("7") || digits.startsWith("1")
      ? `254${digits}`
      : digits;
  if (!/^254[17]\d{8}$/.test(normalized)) {
    throw new Error("Enter a valid Kenyan mobile number.");
  }
  return normalized;
}

export async function createPaymentRequest(orderId: string) {
  const session = await auth();
  if (!session?.user?.businessId) throw new Error("Unauthorized");
  if (session.user.role === "VIEWER") {
    throw new Error("Viewers cannot create payment requests.");
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, businessId: session.user.businessId },
    include: {
      payments: { select: { amount: true, status: true } },
    },
  });
  if (!order) throw new Error("Order not found");

  const blockedStatuses: OrderStatus[] = [
    OrderStatus.PAID,
    OrderStatus.CANCELLED,
    OrderStatus.REFUNDED,
    OrderStatus.DELIVERED,
  ];
  if (blockedStatuses.includes(order.status)) {
    throw new Error("This order cannot accept a payment request.");
  }

  const { remainingBalance } = calculateOrderBalance(order.total, order.payments);
  if (remainingBalance <= 0) {
    throw new Error("This order has already been paid in full.");
  }

  const expiresAt = new Date(Date.now() + REQUEST_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const request = await prisma.paymentRequest.create({
    data: {
      businessId: order.businessId,
      orderId: order.id,
      token: randomUUID().replace(/-/g, ""),
      expiresAt,
    },
  });

  await prisma.auditLog.create({
    data: {
      businessId: order.businessId,
      userId: session.user.id,
      action: "PAYMENT_REQUEST_CREATED",
      entityType: "PaymentRequest",
      entityId: request.id,
      newValue: { orderId, expiresAt: expiresAt.toISOString() },
    },
  });

  revalidatePath(`/dashboard/orders/${orderId}`);
  return { token: request.token };
}

export async function payPaymentRequest(
  token: string,
  phoneNumber: string,
  requestedAmount?: number,
) {
  const request = await prisma.paymentRequest.findUnique({
    where: { token },
    include: {
      order: {
        include: {
          customer: true,
          payments: { select: { amount: true, status: true } },
        },
      },
    },
  });

  if (
    !request ||
    request.status !== PaymentRequestStatus.OPEN ||
    (request.expiresAt && request.expiresAt < new Date())
  ) {
    throw new Error("This payment request is no longer available.");
  }

  const blockedOrderStatuses: OrderStatus[] = [
    OrderStatus.PAID,
    OrderStatus.CANCELLED,
    OrderStatus.REFUNDED,
  ];
  if (blockedOrderStatuses.includes(request.order.status)) {
    throw new Error("This order is no longer payable.");
  }

  const { remainingBalance } = calculateOrderBalance(
    request.order.total,
    request.order.payments,
  );
  if (remainingBalance <= 0) {
    throw new Error("This order has already been paid.");
  }

  const amountToCharge =
    requestedAmount === undefined ? remainingBalance : Math.round(requestedAmount);
  if (
    !Number.isFinite(amountToCharge) ||
    amountToCharge < 1 ||
    amountToCharge > remainingBalance
  ) {
    throw new Error(
      `Enter an amount between KES 1 and KES ${remainingBalance.toLocaleString()}.`,
    );
  }

  const activePayment = await prisma.payment.findFirst({
    where: {
      paymentRequestId: request.id,
      status: { in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING] },
    },
  });
  if (activePayment) {
    throw new Error(
      "A payment prompt is already active. Complete or cancel it before trying again.",
    );
  }

  const phone = normaliseKenyanPhone(phoneNumber);
  const payment = await prisma.payment.create({
    data: {
      businessId: request.businessId,
      orderId: request.orderId,
      customerId: request.order.customerId,
      paymentRequestId: request.id,
      provider: "MPESA",
      amount: amountToCharge,
      currency: request.order.currency,
      status: PaymentStatus.PENDING,
      events: {
        create: {
          status: PaymentStatus.PENDING,
          message: `Customer initiated payment of KES ${amountToCharge} from secure request`,
        },
      },
    },
  });

  try {
    const response = await initiateStkPush({
      phoneNumber: phone,
      amount: amountToCharge,
      orderId: request.order.orderNumber,
      description: `PayProof: ${request.order.orderNumber}`,
    });

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          checkoutRequestId: response.CheckoutRequestID,
          merchantRequestId: response.MerchantRequestID,
        },
      }),
      prisma.order.update({
        where: { id: request.orderId },
        data: {
          status:
            request.order.status === OrderStatus.PARTIALLY_PAID
              ? OrderStatus.PARTIALLY_PAID
              : OrderStatus.PENDING_PAYMENT,
        },
      }),
    ]);

    return {
      paymentId: payment.id,
      amount: amountToCharge,
      message: response.CustomerMessage,
    };
  } catch (error) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        errorMessage: error instanceof Error ? error.message : "STK Push failed",
        events: {
          create: {
            status: PaymentStatus.FAILED,
            message: "Payment prompt could not be started",
          },
        },
      },
    });
    throw error;
  }
}
