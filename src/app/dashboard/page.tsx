import { auth } from "@/auth";
import { getDashboardData } from "@/lib/dashboard";
import { answerBusinessQuestion } from "@/lib/ai/business-assistant";
import { PaymentStatus, type OrderStatus } from "@prisma/client";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusClass(status: PaymentStatus | OrderStatus) {
  const mapped: Record<string, string> = {
    VERIFIED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    PENDING: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    PROCESSING: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
    REQUIRES_REVIEW: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
    PARTIALLY_PAID: "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
    FAILED: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    PAID: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    DRAFT: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
    PENDING_PAYMENT: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    OVERPAID: "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200",
    REFUNDED: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
    DISPUTED: "bg-fuchsia-50 text-fuchsia-700 ring-1 ring-fuchsia-200",
    SHIPPED: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",
    DELIVERED: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    CANCELLED: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  };

  return mapped[status] ?? "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ txPage?: string; orderPage?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.businessId) {
    return null;
  }

  const params = await searchParams;
  const txPage = Number(params?.txPage ?? 1) || 1;
  const orderPage = Number(params?.orderPage ?? 1) || 1;
  const question = "What should I focus on today?";

  const [data, aiInsight] = await Promise.all([
    getDashboardData(session.user.businessId, txPage, orderPage),
    answerBusinessQuestion(question, session.user.businessId, session.user.id),
  ]);
  const maxRevenue = Math.max(...data.revenueChart.map((point) => point.value), 1);
  const maxStatus = Math.max(...data.paymentStatusChart.map((point) => point.value), 1);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-600">Business Overview</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">PayProof Dashboard</h1>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "Revenue Today", value: formatCurrency(data.metrics.revenueToday) },
            { label: "Revenue This Week", value: formatCurrency(data.metrics.revenueThisWeek) },
            { label: "Revenue This Month", value: formatCurrency(data.metrics.revenueThisMonth) },
            { label: "Verified Payments", value: String(data.metrics.verifiedPayments) },
            { label: "Pending Payments", value: String(data.metrics.pendingPayments) },
          ].map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">{metric.label}</p>
              <p className="mt-3 text-2xl font-bold text-slate-900">{metric.value}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Outstanding Payments</p>
            <p className="mt-3 text-2xl font-bold text-slate-900">{data.metrics.outstandingPayments}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Orders</p>
            <p className="mt-3 text-2xl font-bold text-slate-900">{data.metrics.orders}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Customers</p>
            <p className="mt-3 text-2xl font-bold text-slate-900">{data.metrics.customers}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Last Updated</p>
            <p className="mt-3 text-lg font-semibold text-slate-900">{formatDate(new Date())}</p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Revenue chart</h2>
              <span className="text-sm text-slate-500">7-day view</span>
            </div>
            <div className="flex h-52 items-end gap-3">
              {data.revenueChart.map((point) => (
                <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
                  <div className="w-full rounded-t-xl bg-blue-500/90" style={{ height: `${(point.value / maxRevenue) * 100}%`, minHeight: point.value ? "12px" : "2px" }} />
                  <span className="text-xs text-slate-500">{point.label}</span>
                  <span className="text-[10px] text-slate-400">{Math.round(point.value / 1000)}k</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Payment status</h2>
            </div>
            <div className="space-y-4">
              {data.paymentStatusChart.map((point) => (
                <div key={point.label}>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                    <span>{point.label}</span>
                    <span>{point.value}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100">
                    <div
                      className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                      style={{ width: `${(point.value / maxStatus) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Recent transactions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Provider</th>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Customer</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.recentTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-slate-500">No transactions yet.</td>
                    </tr>
                  ) : (
                    data.recentTransactions.map((payment) => (
                      <tr key={payment.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-medium text-slate-900">{payment.provider}</td>
                        <td className="px-5 py-3 font-medium text-slate-900">{formatCurrency(payment.amount)}</td>
                        <td className="px-5 py-3">{payment.customerName ?? payment.orderNumber ?? "—"}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusClass(payment.status)}`}>
                            {payment.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-5 py-3">{formatDate(payment.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {data.pagination.transactionTotalPages > 1 && (
              <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3 text-sm text-slate-600">
                <a href={`?txPage=${Math.max(1, txPage - 1)}`} className={txPage <= 1 ? "pointer-events-none opacity-50" : ""}>Previous</a>
                <span>Page {txPage}</span>
                <a href={`?txPage=${txPage + 1}`} className={txPage >= data.pagination.transactionTotalPages ? "pointer-events-none opacity-50" : ""}>Next</a>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Business alerts</h2>
            </div>
            <div className="space-y-3 p-5">
              {data.alerts.length === 0 ? (
                <p className="text-sm text-slate-500">No active alerts.</p>
              ) : (
                data.alerts.map((alert) => (
                  <div key={alert.id} className="rounded-xl border border-slate-200 p-3">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <p className="font-medium text-slate-900">{alert.title}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        alert.level === "critical"
                          ? "bg-rose-100 text-rose-700"
                          : alert.level === "warning"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-sky-100 text-sky-700"
                      }`}>
                        {alert.level}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">{alert.message}</p>
                    <p className="mt-2 text-[11px] text-slate-400">{formatDate(alert.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">AI Business Assistant</h2>
            <span className="rounded-full bg-indigo-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-indigo-700">Business data only</span>
          </div>
          <p className="text-sm text-slate-500">Question: {question}</p>
          <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-slate-700">
            <p>{aiInsight.answer}</p>
            <p className="mt-2 text-xs text-slate-500">Source: {aiInsight.source.join(", ")}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Recent orders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-500">No recent orders.</td>
                  </tr>
                ) : (
                  data.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-900">{order.orderNumber}</td>
                      <td className="px-5 py-3">{order.customerName ?? "—"}</td>
                      <td className="px-5 py-3 font-medium text-slate-900">{formatCurrency(order.total)}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusClass(order.status)}`}>
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-5 py-3">{formatDate(order.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {data.pagination.orderTotalPages > 1 && (
            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3 text-sm text-slate-600">
              <a href={`?orderPage=${Math.max(1, orderPage - 1)}`} className={orderPage <= 1 ? "pointer-events-none opacity-50" : ""}>Previous</a>
              <span>Page {orderPage}</span>
              <a href={`?orderPage=${orderPage + 1}`} className={orderPage >= data.pagination.orderTotalPages ? "pointer-events-none opacity-50" : ""}>Next</a>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

