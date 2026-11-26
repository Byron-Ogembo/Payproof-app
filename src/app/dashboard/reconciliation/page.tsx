import { auth } from "@/auth";
import { ReconciliationActions } from "@/app/components/payments/ReconciliationActions";
import { prisma } from "@/lib/db/prisma";
import { OrderStatus, PaymentStatus } from "@prisma/client";

const reviewStates = [
  PaymentStatus.PARTIALLY_PAID,
  PaymentStatus.OVERPAID,
  PaymentStatus.REQUIRES_REVIEW,
  PaymentStatus.FAILED,
];

export default async function ReconciliationPage() {
  const session = await auth();
  if (!session?.user?.businessId) return null;

  const [payments, openOrders] = await Promise.all([
    prisma.payment.findMany({
      where: {
        businessId: session.user.businessId,
        status: { in: reviewStates },
        // Hide stale FAILED attempts once the associated order has already settled or closed
        NOT: {
          status: PaymentStatus.FAILED,
          order: {
            status: {
              in: [
                OrderStatus.PAID,
                OrderStatus.DELIVERED,
                OrderStatus.CANCELLED,
                OrderStatus.REFUNDED,
              ],
            },
          },
        },
      },
      include: { order: { include: { customer: true } } },
      orderBy: { updatedAt: "desc" },
      take: 100,
    }),
    prisma.order.findMany({
      where: {
        businessId: session.user.businessId,
        status: {
          in: [
            OrderStatus.DRAFT,
            OrderStatus.PENDING_PAYMENT,
            OrderStatus.PARTIALLY_PAID,
          ],
        },
      },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        customer: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  const openOrderOptions = openOrders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    total: o.total,
    customerName: o.customer.name,
  }));

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">
          Payment truth
        </p>
        <h1 className="mt-1 text-3xl font-extrabold text-white">Reconciliation queue</h1>
        <p className="mt-2 text-sm text-slate-400">
          Resolve payments that need a human decision. Verified payments stay out of your way.
        </p>
      </div>

      <section className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70">
        <table className="min-w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-4">Order / customer</th>
              <th className="px-5 py-4">Received</th>
              <th className="px-5 py-4">Issue</th>
              <th className="px-5 py-4">Updated</th>
              <th className="px-5 py-4 text-right">Resolution</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                  Everything is reconciled. No payment exceptions.
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-white">
                      {payment.order?.orderNumber ?? "Unmatched payment"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {payment.order?.customer.name ?? payment.providerRef ?? "No customer"}
                    </p>
                  </td>
                  <td className="px-5 py-4 font-bold text-emerald-400">
                    KES {payment.amount.toLocaleString()}
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-300">
                      {payment.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-400">
                    {payment.updatedAt.toLocaleString("en-KE")}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <ReconciliationActions
                      paymentId={payment.id}
                      status={payment.status}
                      orderId={payment.orderId}
                      openOrders={openOrderOptions}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
