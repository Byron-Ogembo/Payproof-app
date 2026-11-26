"use client";

import { payPaymentRequest } from "@/app/actions/payment-requests";
import { Loader2, Smartphone } from "lucide-react";
import { useState } from "react";

export function PaymentCheckoutForm({ token }: { token: string }) {
  const [phone, setPhone] = useState(""); const [message, setMessage] = useState<string | null>(null); const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) { e.preventDefault(); try { setLoading(true); setError(null); setMessage((await payPaymentRequest(token, phone)).message); } catch (err) { setError(err instanceof Error ? err.message : "Unable to start payment"); } finally { setLoading(false); } }
  return <form onSubmit={submit} className="mt-7 space-y-4"><label className="block text-sm font-semibold text-slate-700">M-PESA number<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712 345 678" inputMode="tel" required className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none ring-emerald-500 focus:ring-2" /></label><button disabled={loading || !!message} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 font-bold text-white hover:bg-emerald-700 disabled:opacity-60">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Smartphone className="h-5 w-5" />}{message ? "Prompt sent" : "Pay with M-PESA"}</button>{message && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message} Confirm the prompt on your phone. This page will show a receipt after verification.</p>}{error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}</form>;
}
