import { PaymentCheckoutForm } from "@/app/components/payments/PaymentCheckoutForm";
import { prisma } from "@/lib/db/prisma";
import { calculateOrderBalance } from "@/lib/payments/engine";
import { OrderStatus, PaymentRequestStatus, PaymentStatus } from "@prisma/client";
import { CircleCheck, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

export default async function PayPage({ params }: { params: Promise<{ token: string }> }) {
  // Payment requests must be resolved at request time; they are not safe to prerender.
  await connection();
  const { token } = await params;

  const request = await prisma.paymentRequest.findUnique({
    where: { token },
    include: {
      business: true,
      order: {
        include: {
          customer: true,
          payments: {
            select: { id: true, amount: true, status: true },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!request) notFound();

  const { paidAmount, remainingBalance } = calculateOrderBalance(
    request.order.total,
    request.order.payments,
  );
  const verifiedPayment = request.order.payments.find((p) =>
    ([PaymentStatus.VERIFIED, PaymentStatus.OVERPAID] as PaymentStatus[]).includes(p.status),
  );
  const isPaid =
    request.status === PaymentRequestStatus.PAID ||
    request.order.status === OrderStatus.PAID ||
    remainingBalance <= 0;
  const unavailable =
    !isPaid &&
    (request.status !== PaymentRequestStatus.OPEN ||
      (request.expiresAt && request.expiresAt < new Date()) ||
      ([OrderStatus.CANCELLED, OrderStatus.REFUNDED] as OrderStatus[]).includes(
        request.order.status,
      ));

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-900">
      <section className="mx-auto max-w-md rounded-3xl bg-white p-7 shadow-2xl sm:p-9">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-500 font-black text-slate-950">
            P
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
              Secure payment request
            </p>
            <h1 className="text-xl font-black">{request.business.businessName}</h1>
          </div>
        </div>

        <div className="mt-8 rounded-2xl bg-slate-50 p-5">
          <p className="text-sm text-slate-500">Order {request.order.orderNumber}</p>
          <p className="mt-1 text-sm font-semibold">For {request.order.customer.name}</p>

          {paidAmount > 0 && !isPaid ? (
            <div className="mt-4 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Order total</span>
                <span>KES {request.order.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-emerald-700">
                <span>Paid so far</span>
                <span>- KES {paidAmount.toLocaleString()}</span>
              </div>
              <p className="pt-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                Balance due
              </p>
              <p className="text-3xl font-black">KES {remainingBalance.toLocaleString()}</p>
            </div>
          ) : (
            <p className="mt-4 text-3xl font-black">KES {request.order.total.toLocaleString()}</p>
          )}
        </div>

        {isPaid ? (
          <div className="mt-6 space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-800">
              <CircleCheck className="h-5 w-5 text-emerald-600" />
              Payment verified
            </div>
            {verifiedPayment && (
              <Link
                href={`/receipt/${verifiedPayment.id}`}
                className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700"
              >
                View verified receipt
              </Link>
            )}
          </div>
        ) : unavailable ? (
          <p className="mt-7 rounded-xl bg-slate-100 p-4 text-sm font-medium text-slate-600">
            This payment request is no longer available.
          </p>
        ) : (
          <PaymentCheckoutForm token={token} remainingBalance={remainingBalance} />
        )}

        <div className="mt-7 flex items-center gap-2 border-t pt-5 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Payment is verified before the merchant marks your order as paid.
        </div>
      </section>
    </main>
  );
}
