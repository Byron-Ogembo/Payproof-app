import { getOrderById } from "@/app/actions/orders";
import { OrderStatusForm } from "@/app/components/orders/OrderStatusForm";
import Link from "next/link";
import { ArrowLeft, User, Calendar, FileText } from "lucide-react";
import { notFound } from "next/navigation";

export default async function OrderProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  let order;
  try {
    order = await getOrderById(id);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/orders"
            className="rounded-full p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{order.orderNumber}</h1>
            <p className="text-sm text-slate-500">Order Details</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-600">Status:</span>
          <OrderStatusForm orderId={order.id} currentStatus={order.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Order Items</h3>
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2 font-medium">Product</th>
                  <th className="py-2 font-medium text-right">Price</th>
                  <th className="py-2 font-medium text-center">Qty</th>
                  <th className="py-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 font-medium text-slate-900">{item.product.name}</td>
                    <td className="py-3 text-right">{item.unitPrice.toLocaleString()} KES</td>
                    <td className="py-3 text-center">{item.quantity}</td>
                    <td className="py-3 text-right font-medium text-slate-900">{item.total.toLocaleString()} KES</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {order.notes && (
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="flex items-center gap-2 text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">
                <FileText className="h-4 w-4" /> Notes
              </h3>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}
        </div>

        <div className="md:col-span-1 space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{order.subtotal.toLocaleString()} KES</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Discount</span>
                <span className="text-red-600">-{order.discount.toLocaleString()} KES</span>
              </div>
              <div className="flex justify-between text-slate-600 pb-3 border-b border-slate-100">
                <span>Tax</span>
                <span>{order.tax.toLocaleString()} KES</span>
              </div>
              <div className="flex justify-between font-bold text-lg text-slate-900 pt-1">
                <span>Total</span>
                <span className="text-blue-600">{order.total.toLocaleString()} KES</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Customer Info</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-slate-400" />
                <div className="flex flex-col">
                  <Link href={`/dashboard/customers/${order.customerId}`} className="font-medium text-blue-600 hover:underline">
                    {order.customer.name}
                  </Link>
                  <span className="text-slate-500">{order.customer.email || order.customer.phone}</span>
                </div>
              </div>
              <div className="flex items-start gap-3 pt-3 border-t border-slate-100">
                <Calendar className="h-5 w-5 text-slate-400" />
                <div className="flex flex-col">
                  <span className="text-slate-900">Created On</span>
                  <span className="text-slate-500">{new Date(order.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
