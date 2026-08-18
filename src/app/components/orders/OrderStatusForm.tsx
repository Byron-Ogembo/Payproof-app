"use client";

import { OrderStatus } from "@prisma/client";
import { updateOrderStatus } from "@/app/actions/orders";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export function OrderStatusForm({ orderId, currentStatus }: { orderId: string, currentStatus: OrderStatus }) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpdate() {
    if (status === currentStatus) return;
    try {
      setIsUpdating(true);
      setError(null);
      await updateOrderStatus(orderId, status);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStatus(currentStatus); // revert
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as OrderStatus)}
        disabled={isUpdating}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {Object.values(OrderStatus).map((s) => (
          <option key={s} value={s}>
            {s.replace(/_/g, " ")}
          </option>
        ))}
      </select>
      <button
        onClick={handleUpdate}
        disabled={isUpdating || status === currentStatus}
        className="flex items-center justify-center rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
