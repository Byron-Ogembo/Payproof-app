"use client";

import {
  matchPaymentToOrder,
  resolvePaymentException,
} from "@/app/actions/reconciliation";
import { PaymentStatus } from "@prisma/client";
import Link from "next/link";
import { useState } from "react";

type OpenOrderOption = {
  id: string;
  orderNumber: string;
  total: number;
  customerName: string;
};

export function ReconciliationActions({
  paymentId,
  status,
  orderId,
  openOrders,
}: {
  paymentId: string;
  status: PaymentStatus;
  orderId: string | null;
  openOrders: OpenOrderOption[];
}) {
  const [selectedOrderId, setSelectedOrderId] = useState(orderId ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleMatch() {
    if (!selectedOrderId) return;
    try {
      setBusy(true);
      setError(null);
      await matchPaymentToOrder(paymentId, selectedOrderId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to match payment");
    } finally {
      setBusy(false);
    }
  }

  async function handleResolve(
    resolution: "MARK_VERIFIED" | "MARK_REFUNDED" | "MARK_FAILED",
  ) {
    try {
      setBusy(true);
      setError(null);
      await resolvePaymentException(paymentId, resolution);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve payment");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {status === PaymentStatus.REQUIRES_REVIEW && !orderId && (
          <>
            <select
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              disabled={busy}
              className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500"
            >
              <option value="">Select order…</option>
              {openOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.orderNumber} · {order.customerName} (KES{" "}
                  {order.total.toLocaleString()})
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={busy || !selectedOrderId}
              onClick={handleMatch}
              className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
            >
              Match order
            </button>
          </>
        )}

        {status === PaymentStatus.REQUIRES_REVIEW && orderId && (
          <button
            type="button"
            disabled={busy}
            onClick={handleMatch}
            className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            Reconcile
          </button>
        )}

        {status === PaymentStatus.OVERPAID && (
          <button
            type="button"
            disabled={busy}
            onClick={() => handleResolve("MARK_VERIFIED")}
            className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            Accept overpayment
          </button>
        )}

        {(status === PaymentStatus.OVERPAID ||
          status === PaymentStatus.PARTIALLY_PAID ||
          status === PaymentStatus.REQUIRES_REVIEW) && (
          <button
            type="button"
            disabled={busy}
            onClick={() => handleResolve("MARK_REFUNDED")}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 disabled:opacity-50"
          >
            Mark refunded
          </button>
        )}

        {status === PaymentStatus.REQUIRES_REVIEW && (
          <button
            type="button"
            disabled={busy}
            onClick={() => handleResolve("MARK_FAILED")}
            className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 disabled:opacity-50"
          >
            Mark failed
          </button>
        )}

        {orderId && (
          <Link
            href={`/dashboard/orders/${orderId}`}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:border-emerald-500/50 hover:text-emerald-300"
          >
            View order
          </Link>
        )}
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
}
