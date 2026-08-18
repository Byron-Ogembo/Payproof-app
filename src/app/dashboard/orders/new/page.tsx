import { OrderBuilder } from "@/app/components/orders/OrderBuilder";
import { getCustomers } from "@/app/actions/customers";
import { getProducts } from "@/app/actions/products";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function NewOrderPage() {
  // Fetch active customers and products for the builder
  // In a massive app we'd do async search, but for MVP fetching a good chunk is fine.
  const [{ customers }, { products }] = await Promise.all([
    getCustomers({ limit: 100 }), // Get up to 100 recent customers
    getProducts({ limit: 200, category: undefined }) // Get active products
  ]);

  const activeProducts = products.filter(p => p.active);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/orders"
          className="rounded-full p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create Order</h1>
          <p className="text-sm text-slate-500">Build a new order and calculate totals.</p>
        </div>
      </div>

      <OrderBuilder customers={customers} products={activeProducts} />
    </div>
  );
}
