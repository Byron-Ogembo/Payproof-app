"use client";

import { payPaymentRequest } from "@/app/actions/payment-requests";
import { CircleCheck, Loader2, Smartphone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type PollResponse = {
  requestStatus: string;
  orderStatus: string;
  paidAmount: number;
  remainingBalance: number;
  paymentStatus: string | null;
  errorMessage: string | null;
  receiptPaymentId: string | null;
};

export function PaymentCheckoutForm({
  token,
  remainingBalance,
}: {
  token: string;
  remainingBalance: number;
}) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [customAmount, setCustomAmount] = useState<string | null>(null);
  const [polledBalance, setPolledBalance] = useState<number | null>(null);
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null);
  const [receiptPaymentId, setReceiptPaymentId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const currentBalance = polledBalance ?? remainingBalance;
  const amount = customAmount ?? String(currentBalance);

  useEffect(() => {
    if (!activePaymentId) return;

    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/payments/requests/${encodeURIComponent(token)}/status?paymentId=${encodeURIComponent(activePaymentId)}`,
          { cache: "no-store" },
        );
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as PollResponse;

        if (data.paymentStatus === "VERIFIED" || data.paymentStatus === "OVERPAID") {
          setReceiptPaymentId(data.receiptPaymentId ?? activePaymentId);
          setActivePaymentId(null);
          setPolledBalance(0);
          setCustomAmount(null);
          router.refresh();
        } else if (data.paymentStatus === "PARTIALLY_PAID") {
          setActivePaymentId(null);
          setPolledBalance(data.remainingBalance);
          setCustomAmount(null);
          setMessage(
            `Partial payment received. Remaining balance: KES ${data.remainingBalance.toLocaleString()}.`,
          );
          router.refresh();
        } else if (data.paymentStatus === "FAILED") {
          setActivePaymentId(null);
          setMessage(null);
          setError(data.errorMessage ?? "Payment failed or was cancelled. Please try again.");
        } else if (data.paymentStatus === "REQUIRES_REVIEW") {
          setActivePaymentId(null);
          setMessage("Payment received and queued for merchant review.");
          router.refresh();
        }
      } catch {
        // Ignore transient polling errors
      }
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [activePaymentId, token, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      const parsedAmount = Number(amount);
      const result = await payPaymentRequest(token, phone, parsedAmount);
      setActivePaymentId(result.paymentId);
      setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start payment");
    } finally {
      setLoading(false);
    }
  }

  if (receiptPaymentId) {
    return (
      <div className="mt-7 space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
        <div className="flex items-center gap-2 font-bold">
          <CircleCheck className="h-5 w-5 text-emerald-600" />
          Payment verified!
        </div>
        <p className="text-sm text-emerald-800">
          Your M-PESA payment has been confirmed on the merchant&apos;s ledger.
        </p>
        <Link
          href={`/receipt/${receiptPaymentId}`}
          className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700"
        >
          View verified receipt
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-7 space-y-4">
      <label className="block text-sm font-semibold text-slate-700">
        M-PESA number
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0712 345 678"
          inputMode="tel"
          required
          disabled={!!activePaymentId}
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none ring-emerald-500 focus:ring-2 disabled:bg-slate-100"
        />
      </label>

      <label className="block text-sm font-semibold text-slate-700">
        Amount to pay (KES)
        <input
          type="number"
          min={1}
          max={currentBalance}
          step={1}
          value={amount}
          onChange={(e) => setCustomAmount(e.target.value)}
          required
          disabled={!!activePaymentId}
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none ring-emerald-500 focus:ring-2 disabled:bg-slate-100"
        />
        <span className="mt-1 block text-xs font-normal text-slate-500">
          Pay the full remaining balance (KES {currentBalance.toLocaleString()}) or enter an installment amount.
        </span>
      </label>

      <button
        disabled={loading || !!activePaymentId}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {loading || activePaymentId ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Smartphone className="h-5 w-5" />
        )}
        {activePaymentId ? "Awaiting M-PESA confirmation..." : "Pay with M-PESA"}
      </button>

      {message && (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          {message}{" "}
          {activePaymentId
            ? "Confirm the prompt on your phone. This page updates automatically once verified."
            : ""}
        </p>
      )}
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    </form>
  );
}
