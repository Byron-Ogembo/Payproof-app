"use client";

import { createPaymentRequest } from "@/app/actions/payment-requests";
import { Copy, Link as LinkIcon, Loader2 } from "lucide-react";
import { useState } from "react";

export function PaymentRequestButton({ orderId }: { orderId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "copied">("idle");
  const [error, setError] = useState<string | null>(null);
  async function createLink() {
    try {
      setState("loading"); setError(null);
      const { token } = await createPaymentRequest(orderId);
      await navigator.clipboard.writeText(`${window.location.origin}/pay/${token}`);
      setState("copied");
      setTimeout(() => setState("idle"), 2500);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not create payment link"); setState("idle"); }
  }
  return <div className="flex flex-col items-end gap-1"><button onClick={createLink} disabled={state === "loading"} className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">{state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : state === "copied" ? <Copy className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}{state === "copied" ? "Link copied" : "Request payment"}</button>{error && <p className="max-w-52 text-right text-xs text-red-600">{error}</p>}</div>;
}
