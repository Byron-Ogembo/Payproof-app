import { prisma } from "@/lib/db/prisma";
import { PaymentStatus, OrderStatus, Prisma } from "@prisma/client";
import { NotificationType, triggerPaymentNotificationTx } from "@/lib/notifications";

export interface PaymentPayload {
  businessId: string;
  provider: string;       // e.g. "MPESA"
  providerRef: string;    // e.g. "QWE123RTY4"
  amount: number;
  currency?: string;
  idempotencyKey?: string;
  rawPayload: Prisma.InputJsonValue;        // Original webhook data
}

export async function processWebhook(payload: PaymentPayload) {
  const { businessId, provider, providerRef, amount, currency = "KES", idempotencyKey, rawPayload } = payload;

  return await prisma.$transaction(async (tx) => {
    // 1. Idempotency Check (if key provided)
    if (idempotencyKey) {
      const existingKey = await tx.payment.findUnique({
        where: { idempotencyKey },
      });
      if (existingKey) return existingKey; // Silently return existing to prevent double-processing
    }

    // 2. Prevent duplicate provider transaction references
    const existingTx = await tx.payment.findUnique({
      where: {
        businessId_provider_providerRef: { businessId, provider, providerRef },
      },
    });
    
    if (existingTx) return existingTx; 

    // 3. Create the initial PENDING payment
    const payment = await tx.payment.create({
      data: {
        businessId,
        provider,
        providerRef,
        amount,
        currency,
        idempotencyKey,
        status: PaymentStatus.PENDING,
        events: {
          create: {
            status: PaymentStatus.PENDING,
            message: "Webhook received, payment created",
            rawPayload,
          },
        },
      },
    });

    return payment;
  });
}

export async function matchAndVerifyPayment(paymentId: string, orderId?: string) {
  return await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { business: true },
    });

    if (!payment) throw new Error("Payment not found");
    if (payment.status === PaymentStatus.VERIFIED || payment.status === PaymentStatus.FAILED) {
      return payment; // Already in terminal state
    }

    const orderForNotification = orderId || payment.orderId ? await tx.order.findUnique({
      where: { id: orderId || payment.orderId! },
      include: { customer: true },
    }) : null;

    const targetOrderId = orderId || payment.orderId;

    if (!targetOrderId) {
      // Logic to auto-match order based on account numbers or notes would go here.
      // For now, if no orderId is explicitly provided or attached, it requires review.
      await tx.paymentEvent.create({
        data: {
          paymentId: payment.id,
          status: PaymentStatus.REQUIRES_REVIEW,
          message: "No order matched to this payment",
        },
      });

      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.REQUIRES_REVIEW },
      });

      await triggerPaymentNotificationTx(tx, {
        businessId: payment.businessId,
        type: NotificationType.PAYMENT_REQUIRES_REVIEW,
        title: "Payment requires review",
        message: `Payment for ${payment.amount} KES requires review because no matching order was found.`,
        paymentId: payment.id,
        amount: payment.amount,
        metadata: { orderId: null },
      });

      return updatedPayment;
    }

    // Attempt to match with order
    const order = await tx.order.findUnique({
      where: { id: targetOrderId },
    });

    if (!order) {
      await tx.paymentEvent.create({
        data: {
          paymentId: payment.id,
          status: PaymentStatus.REQUIRES_REVIEW,
          message: `Attempted to match with non-existent order: ${targetOrderId}`,
        },
      });
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.REQUIRES_REVIEW },
      });

      await triggerPaymentNotificationTx(tx, {
        businessId: payment.businessId,
        type: NotificationType.PAYMENT_REQUIRES_REVIEW,
        title: "Payment requires review",
        message: `Payment for ${payment.amount} KES requires review because order ${targetOrderId} was not found.`,
        paymentId: payment.id,
        amount: payment.amount,
        metadata: { orderId: targetOrderId },
      });

      return updatedPayment;
    }

    // Ensure business domains match (Unauthorized access check)
    if (order.businessId !== payment.businessId) {
       await tx.paymentEvent.create({
        data: {
          paymentId: payment.id,
          status: PaymentStatus.FAILED,
          message: `Business ID mismatch. Payment Business: ${payment.businessId}, Order Business: ${order.businessId}`,
        },
      });
      const failedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });

      await triggerPaymentNotificationTx(tx, {
        businessId: payment.businessId,
        type: NotificationType.PAYMENT_FAILED,
        title: "Payment failed",
        message: `Payment for ${failedPayment.amount} KES failed because the order was not in the same business context.`,
        paymentId: payment.id,
        amount: failedPayment.amount,
        metadata: { orderId: order.id },
      });

      return failedPayment;
    }

    // Math Evaluation
    let finalPaymentStatus: PaymentStatus = PaymentStatus.VERIFIED;
    let finalOrderStatus: OrderStatus = OrderStatus.PAID;
    let eventMessage = "Payment matched perfectly.";

    if (payment.amount === order.total) {
      finalPaymentStatus = PaymentStatus.VERIFIED;
      finalOrderStatus = OrderStatus.PAID;
      eventMessage = `Exact payment of ${payment.amount} matches order total.`;
    } else if (payment.amount < order.total) {
      finalPaymentStatus = PaymentStatus.PARTIALLY_PAID;
      finalOrderStatus = OrderStatus.PARTIALLY_PAID;
      eventMessage = `Partial payment. Paid: ${payment.amount}, Expected: ${order.total}`;
    } else if (payment.amount > order.total) {
      finalPaymentStatus = PaymentStatus.OVERPAID;
      finalOrderStatus = OrderStatus.PAID;
      eventMessage = `Overpayment. Paid: ${payment.amount}, Expected: ${order.total}`;
    }

    // Update the payment
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: { 
        status: finalPaymentStatus,
        orderId: order.id,
        customerId: order.customerId
      },
    });

    await tx.paymentEvent.create({
      data: {
        paymentId: payment.id,
        status: finalPaymentStatus,
        message: eventMessage,
      },
    });

    // Update the Order Status
    await tx.order.update({
      where: { id: order.id },
      data: { status: finalOrderStatus },
    });

    if (finalPaymentStatus === PaymentStatus.VERIFIED) {
      await triggerPaymentNotificationTx(tx, {
        businessId: payment.businessId,
        type: NotificationType.PAYMENT_VERIFIED,
        title: "Payment verified",
        message: `Payment of ${updatedPayment.amount} KES was verified for order ${order.orderNumber}.`,
        paymentId: payment.id,
        orderNumber: order.orderNumber,
        amount: updatedPayment.amount,
        metadata: { orderId: order.id, orderNumber: order.orderNumber },
      });
    }

    if (finalPaymentStatus === PaymentStatus.PARTIALLY_PAID || finalPaymentStatus === PaymentStatus.OVERPAID) {
      await triggerPaymentNotificationTx(tx, {
        businessId: payment.businessId,
        type: NotificationType.PAYMENT_REQUIRES_REVIEW,
        title: "Payment status update",
        message: `Payment for order ${order.orderNumber} was processed with status ${finalPaymentStatus}.`,
        paymentId: payment.id,
        orderNumber: order.orderNumber,
        amount: updatedPayment.amount,
        metadata: { orderId: order.id, paymentStatus: finalPaymentStatus },
      });
    }

    // Audit log
    await tx.auditLog.create({
      data: {
        businessId: payment.businessId,
        action: "PAYMENT_RECONCILED",
        entityType: "Order",
        entityId: order.id,
        newValue: { paymentId: payment.id, paymentStatus: finalPaymentStatus, newOrderStatus: finalOrderStatus },
      },
    });

    return updatedPayment;
  });
}
