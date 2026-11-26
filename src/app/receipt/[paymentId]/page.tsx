import { prisma } from "@/lib/db/prisma";
import { PaymentStatus } from "@prisma/client";
import { CircleCheck, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { connection } from "next/server";

export default async function ReceiptPage({ params }: { params: Promise<{ paymentId: string }> }) {
  await connection();
  const { paymentId } = await params;
  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { business: true, order: { include: { customer: true } } } });
  if (!payment || !([PaymentStatus.VERIFIED, PaymentStatus.OVERPAID] as PaymentStatus[]).includes(payment.status)) notFound();
  return <main className="min-h-screen bg-slate-950 px-4 py-10"><section className="mx-auto max-w-md rounded-3xl bg-white p-8 text-slate-900 shadow-2xl"><div className="flex items-center gap-3 text-emerald-700"><CircleCheck className="h-10 w-10" /><div><p className="text-xs font-bold uppercase tracking-widest">Payment verified</p><h1 className="text-xl font-black">PayProof receipt</h1></div></div><div className="mt-7 space-y-4 rounded-2xl bg-slate-50 p-5 text-sm"><div className="flex justify-between gap-4"><span className="text-slate-500">Merchant</span><strong className="text-right">{payment.business.businessName}</strong></div><div className="flex justify-between gap-4"><span className="text-slate-500">Order</span><strong>{payment.order?.orderNumber ?? "—"}</strong></div><div className="flex justify-between gap-4"><span className="text-slate-500">Receipt</span><strong>{payment.providerRef ?? "—"}</strong></div><div className="flex justify-between gap-4 border-t pt-4"><span className="text-slate-500">Amount received</span><strong className="text-lg text-emerald-700">KES {payment.amount.toLocaleString()}</strong></div></div><p className="mt-6 flex items-center gap-2 text-xs text-slate-500"><ShieldCheck className="h-4 w-4 text-emerald-600" />Verified from the merchant&apos;s transaction ledger.</p></section></main>;
}
