import { auth } from "@/auth";
import { getDashboardData } from "@/lib/dashboard";
import { answerBusinessQuestion } from "@/lib/ai/business-assistant";
import { PaymentStatus, type OrderStatus } from "@prisma/client";
import Image from "next/image";

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
    VERIFIED: "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40",
    PENDING: "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40",
    PROCESSING: "bg-sky-500/20 text-sky-300 ring-1 ring-sky-500/40",
    REQUIRES_REVIEW: "bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/40",
    PARTIALLY_PAID: "bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/40",
    FAILED: "bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40",
    PAID: "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40",
    DRAFT: "bg-slate-800 text-slate-400 ring-1 ring-slate-700",
    PENDING_PAYMENT: "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40",
    OVERPAID: "bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/40",
    REFUNDED: "bg-gray-800 text-gray-400 ring-1 ring-gray-700",
    DISPUTED: "bg-fuchsia-500/20 text-fuchsia-300 ring-1 ring-fuchsia-500/40",
    SHIPPED: "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40",
    DELIVERED: "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40",
    CANCELLED: "bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40",
  };

  return mapped[status] ?? "bg-slate-800 text-slate-300 ring-1 ring-slate-700";
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
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Business Overview</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white">PayProof 3D Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-400">
              Live Verified Ledger
            </span>
          </div>
        </div>

        {/* Top 5 Metrics */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "Revenue Today", value: formatCurrency(data.metrics.revenueToday) },
            { label: "Revenue This Week", value: formatCurrency(data.metrics.revenueThisWeek) },
            { label: "Revenue This Month", value: formatCurrency(data.metrics.revenueThisMonth) },
            { label: "Verified Payments", value: String(data.metrics.verifiedPayments) },
            { label: "Pending Payments", value: String(data.metrics.pendingPayments) },
          ].map((metric) => (
            <div
              key={metric.label}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-md hover:border-emerald-500/40 transition"
            >
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{metric.label}</p>
              <p className="mt-2 text-2xl font-black text-white">{metric.value}</p>
            </div>
          ))}
        </section>

        {/* Secondary Metrics & Quick Status */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Outstanding Payments</p>
            <p className="mt-2 text-2xl font-black text-white">{data.metrics.outstandingPayments}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Orders</p>
            <p className="mt-2 text-2xl font-black text-white">{data.metrics.orders}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Customers</p>
            <p className="mt-2 text-2xl font-black text-white">{data.metrics.customers}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Updated</p>
            <p className="mt-2 text-sm font-bold text-slate-200">{formatDate(new Date())}</p>
          </div>
        </section>

        {/* Charts & 3D Visualizer */}
        <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl backdrop-blur-md">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Revenue Overview</h2>
              <span className="text-xs font-semibold text-slate-400">7-day view</span>
            </div>
            <div className="flex h-56 items-end gap-3 pt-4">
              {data.revenueChart.map((point) => (
                <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-xl bg-gradient-to-t from-emerald-600 to-teal-400 shadow-md shadow-emerald-500/20 transition-all duration-500 hover:scale-105"
                    style={{
                      height: `${(point.value / maxRevenue) * 100}%`,
                      minHeight: point.value ? "12px" : "4px",
                    }}
                  />
                  <span className="text-xs text-slate-400 font-medium">{point.label}</span>
                  <span className="text-[10px] text-slate-500">{Math.round(point.value / 1000)}k</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl backdrop-blur-md">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Payment Status</h2>
            </div>
            <div className="space-y-4">
              {data.paymentStatusChart.map((point) => (
                <div key={point.label}>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
                    <span className="font-semibold">{point.label}</span>
                    <span className="font-bold">{point.value}</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-800">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm"
                      style={{ width: `${(point.value / maxStatus) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Transactions & Alerts */}
        <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl overflow-hidden">
            <div className="border-b border-slate-800 px-6 py-4">
              <h2 className="text-lg font-bold text-white">Recent Transactions</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  <tr>
                    <th className="px-6 py-3">Provider</th>
                    <th className="px-6 py-3">Amount</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {data.recentTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    data.recentTransactions.map((payment) => (
                      <tr key={payment.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-6 py-3 font-semibold text-white">{payment.provider}</td>
                        <td className="px-6 py-3 font-bold text-emerald-400">{formatCurrency(payment.amount)}</td>
                        <td className="px-6 py-3">{payment.customerName ?? payment.orderNumber ?? "—"}</td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${getStatusClass(payment.status)}`}>
                            {payment.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-xs text-slate-400">{formatDate(payment.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Business Health Alerts</h2>
            <div className="space-y-3">
              {data.alerts.length === 0 ? (
                <p className="text-sm text-slate-400">No critical business alerts.</p>
              ) : (
                data.alerts.map((alert) => (
                  <div key={alert.id} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <p className="font-bold text-white">{alert.title}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                        alert.level === "critical"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                          : alert.level === "warning"
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-sky-500/20 text-sky-300 border border-sky-500/30"
                      }`}>
                        {alert.level}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{alert.message}</p>
                    <p className="mt-2 text-[10px] text-slate-500">{formatDate(alert.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* AI Assistant 3D Banner */}
        <section className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/60 p-6 lg:p-8 shadow-2xl">
          <div className="grid items-center gap-6 lg:grid-cols-12">
            <div className="lg:col-span-8 space-y-3">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-400">
                  PayProof AI Assistant
                </span>
                <span className="text-xs text-slate-400">Real Ledger Intelligence</span>
              </div>
              <p className="text-sm font-semibold text-slate-300">Question: &quot;{question}&quot;</p>
              <div className="rounded-xl border border-emerald-500/20 bg-slate-950/80 p-4 text-sm text-slate-200">
                <p className="font-medium">{aiInsight.answer}</p>
                <p className="mt-2 text-xs text-emerald-400/80 font-bold">Source: {aiInsight.source.join(", ")}</p>
              </div>
            </div>
            <div className="lg:col-span-4 relative h-48 w-full overflow-hidden rounded-2xl">
              <Image
                src="/assets/ai_assistant_character.webp"
                alt="AI Assistant"
                fill
                className="object-cover rounded-2xl"
              />
            </div>
          </div>
        </section>

        {/* Recent Orders */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl overflow-hidden">
          <div className="border-b border-slate-800 px-6 py-4">
            <h2 className="text-lg font-bold text-white">Recent Orders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 font-semibold">
                <tr>
                  <th className="px-6 py-3">Order Number</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Total</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No recent orders found.
                    </td>
                  </tr>
                ) : (
                  data.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-6 py-3 font-semibold text-white">{order.orderNumber}</td>
                      <td className="px-6 py-3">{order.customerName ?? "—"}</td>
                      <td className="px-6 py-3 font-bold text-emerald-400">{formatCurrency(order.total)}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${getStatusClass(order.status)}`}>
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-400">{formatDate(order.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
