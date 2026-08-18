import { getCustomerById } from "@/app/actions/customers";
import Link from "next/link";
import { ArrowLeft, Edit, Mail, Phone, MapPin, Calendar } from "lucide-react";
import { notFound } from "next/navigation";

export default async function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  let customer;
  try {
    customer = await getCustomerById(id);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/customers"
            className="rounded-full p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{customer.name}</h1>
            <p className="text-sm text-slate-500">Customer Profile</p>
          </div>
        </div>
        <Link
          href={`/dashboard/customers/${customer.id}/edit`}
          className="flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 hover:bg-slate-50"
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit Profile
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Contact Info</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-slate-400" />
                <span className={customer.email ? "text-slate-900" : "text-slate-400 italic"}>
                  {customer.email || "No email provided"}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-slate-400" />
                <span className={customer.phone ? "text-slate-900" : "text-slate-400 italic"}>
                  {customer.phone || "No phone provided"}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-slate-400" />
                <span className={customer.address ? "text-slate-900" : "text-slate-400 italic"}>
                  {customer.address || "No address provided"}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Details</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-500">Status</span>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                  {customer.status.replace("_", " ")}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-500">Customer ID</span>
                <span className="text-slate-900 font-mono text-xs">{customer.id.slice(-8)}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-500 flex items-center gap-1"><Calendar className="h-4 w-4" /> Joined</span>
                <span className="text-slate-900">{new Date(customer.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm min-h-[150px]">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Notes</h3>
            {customer.notes ? (
              <p className="text-slate-700 whitespace-pre-wrap text-sm">{customer.notes}</p>
            ) : (
              <p className="text-slate-400 text-sm italic">No notes available for this customer.</p>
            )}
          </div>
          
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm min-h-[300px] flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-medium text-slate-900">Recent Orders</h3>
              <p className="mt-1 text-sm text-slate-500">Order management system is not implemented yet.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
