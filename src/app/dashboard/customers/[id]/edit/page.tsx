import { CustomerForm } from "@/app/components/customers/CustomerForm";
import { getCustomerById } from "@/app/actions/customers";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  let customer;
  try {
    customer = await getCustomerById(id);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/customers/${id}`}
          className="rounded-full p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit Customer</h1>
          <p className="text-sm text-slate-500">Update information for {customer.name}.</p>
        </div>
      </div>

      <CustomerForm initialData={customer} />
    </div>
  );
}
