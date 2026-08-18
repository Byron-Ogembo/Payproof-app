import { CustomerForm } from "@/app/components/customers/CustomerForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewCustomerPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/customers"
          className="rounded-full p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Add Customer</h1>
          <p className="text-sm text-slate-500">Create a new customer profile for your business.</p>
        </div>
      </div>

      <CustomerForm />
    </div>
  );
}
