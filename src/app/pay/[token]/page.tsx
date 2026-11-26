import { PaymentCheckoutForm } from "@/app/components/payments/PaymentCheckoutForm";
import { prisma } from "@/lib/db/prisma";
import { PaymentRequestStatus } from "@prisma/client";
import { CircleCheck, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { connection } from "next/server";

export default async function PayPage({ params }: { params: Promise<{ token: string }> }) {
  // Payment requests must be resolved at request time; they are not safe to prerender.
  await connection();
  const { token } = await params;
  const request = await prisma.paymentRequest.findUnique({ where: { token }, include: { business: true, order: { include: { customer: true } } } });
  if (!request) notFound();
  const unavailable = request.status !== PaymentRequestStatus.OPEN || (request.expiresAt && request.expiresAt < new Date());
  return <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-900"><section className="mx-auto max-w-md rounded-3xl bg-white p-7 shadow-2xl sm:p-9"><div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-emerald-500 font-black text-slate-950">P</span><div><p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Secure payment request</p><h1 className="text-xl font-black">{request.business.businessName}</h1></div></div><div className="mt-8 rounded-2xl bg-slate-50 p-5"><p className="text-sm text-slate-500">Order {request.order.orderNumber}</p><p className="mt-1 text-sm font-semibold">For {request.order.customer.name}</p><p className="mt-4 text-3xl font-black">KES {request.order.total.toLocaleString()}</p></div>{unavailable ? <p className="mt-7 rounded-xl bg-slate-100 p-4 text-sm font-medium text-slate-600">This payment request is no longer available.</p> : <PaymentCheckoutForm token={token} />}<div className="mt-7 flex items-center gap-2 border-t pt-5 text-xs text-slate-500"><ShieldCheck className="h-4 w-4 text-emerald-600" />Payment is verified before the merchant marks your order as paid.</div>{request.status === PaymentRequestStatus.PAID && <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-700"><CircleCheck className="h-5 w-5" />Payment verified</div>}</section></main>;
}
