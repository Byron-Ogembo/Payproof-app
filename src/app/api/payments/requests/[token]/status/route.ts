import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { calculateOrderBalance } from "@/lib/payments/engine";
import { PaymentStatus } from "@prisma/client";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const paymentId = req.nextUrl.searchParams.get("paymentId");

  const request = await prisma.paymentRequest.findUnique({
    where: { token },
    select: {
      status: true,
      order: {
        select: {
          status: true,
          total: true,
          payments: {
            select: {
              id: true,
              amount: true,
              status: true,
              errorMessage: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!request) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { paidAmount, remainingBalance } = calculateOrderBalance(
    request.order.total,
    request.order.payments,
  );

  const trackedPayment = paymentId
    ? request.order.payments.find((p) => p.id === paymentId) ?? null
    : request.order.payments[0] ?? null;

  const receiptPayment = request.order.payments.find((p) =>
    ([PaymentStatus.VERIFIED, PaymentStatus.OVERPAID] as PaymentStatus[]).includes(p.status),
  );

  return NextResponse.json({
    requestStatus: request.status,
    orderStatus: request.order.status,
    paidAmount,
    remainingBalance,
    paymentStatus: trackedPayment?.status ?? null,
    errorMessage:
      trackedPayment?.status === PaymentStatus.FAILED
        ? trackedPayment.errorMessage ?? "Payment was not completed."
        : null,
    receiptPaymentId: receiptPayment?.id ?? null,
  });
}
