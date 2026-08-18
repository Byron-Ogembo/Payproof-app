"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { OrderSchema, type OrderFormValues } from "@/lib/validations/order";
import { createOrder } from "@/app/actions/orders";
import { Customer, Product } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";

interface OrderBuilderProps {
  customers: Customer[];
  products: Product[];
}

export function OrderBuilder({ customers, products }: OrderBuilderProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(OrderSchema),
    defaultValues: {
      customerId: "",
      notes: "",
      discount: 0,
      tax: 0,
      items: [{ productId: "", quantity: 1 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const watchItems = watch("items");
   
  const watchDiscount = watch("discount");
   
  const watchTax = watch("tax");

  // Calculate live estimates (frontend only - backend validates and recalculates)
  const estimates = useMemo(() => {
    let subtotal = 0;
    watchItems.forEach((item) => {
      if (item.productId) {
        const product = products.find((p) => p.id === item.productId);
        if (product) {
          subtotal += product.sellingPrice * (item.quantity || 0);
        }
      }
    });

    const discount = Number(watchDiscount) || 0;
    const tax = Number(watchTax) || 0;
    const total = Math.max(0, subtotal - discount + tax);

    return { subtotal, discount, tax, total };
  }, [watchItems, watchDiscount, watchTax, products]);

  async function onSubmit(data: OrderFormValues) {
    try {
      setError(null);
      const result = await createOrder(data);
      router.push(`/dashboard/orders/${result.orderId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Form Inputs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-medium text-slate-900">Customer Details</h2>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Select Customer *</label>
              <select
                {...register("customerId")}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">-- Choose a customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email || c.phone || "No contact"})
                  </option>
                ))}
              </select>
              {errors.customerId && <p className="text-sm text-red-500">{errors.customerId.message}</p>}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-slate-900">Order Items</h2>
              <button
                type="button"
                onClick={() => append({ productId: "", quantity: 1 })}
                className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                <Plus className="mr-1 h-4 w-4" /> Add Item
              </button>
            </div>
            
            {errors.items?.root && <p className="text-sm text-red-500">{errors.items.root.message}</p>}

            <div className="space-y-4">
              {fields.map((field, index) => {
                const selectedProductId = watchItems[index]?.productId;
                const selectedProduct = products.find(p => p.id === selectedProductId);

                return (
                  <div key={field.id} className="flex items-start gap-4 rounded-md border border-slate-100 bg-slate-50 p-4">
                    <div className="flex-1 space-y-2">
                      <label className="text-xs font-medium text-slate-700">Product</label>
                      <select
                        {...register(`items.${index}.productId`)}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">-- Select --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id} disabled={p.stockQuantity <= 0}>
                            {p.name} - {p.sellingPrice} KES {p.stockQuantity <= 0 ? "(Out of Stock)" : `(${p.stockQuantity} in stock)`}
                          </option>
                        ))}
                      </select>
                      {errors.items?.[index]?.productId && (
                        <p className="text-xs text-red-500">{errors.items[index]?.productId?.message}</p>
                      )}
                    </div>
                    <div className="w-24 space-y-2">
                      <label className="text-xs font-medium text-slate-700">Qty</label>
                      <input
                        {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        type="number"
                        min="1"
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      {errors.items?.[index]?.quantity && (
                        <p className="text-xs text-red-500">{errors.items[index]?.quantity?.message}</p>
                      )}
                    </div>
                    <div className="w-24 space-y-2 pt-6 text-right">
                      <span className="text-sm font-medium text-slate-700">
                        {selectedProduct ? (selectedProduct.sellingPrice * (watchItems[index]?.quantity || 0)).toLocaleString() : 0} KES
                      </span>
                    </div>
                    <div className="pt-6">
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="rounded p-2 text-slate-400 hover:bg-slate-200 hover:text-red-600"
                        disabled={fields.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-medium text-slate-900">Additional Details</h2>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Notes / Instructions</label>
              <textarea
                {...register("notes")}
                rows={3}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Optional notes..."
              />
            </div>
          </div>
        </div>

        {/* Right Column: Financials & Submit */}
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-4 sticky top-6">
            <h2 className="text-lg font-medium text-slate-900">Summary</h2>
            
            <div className="space-y-2 pb-4 border-b border-slate-100">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium">{estimates.subtotal.toLocaleString()} KES</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Discount (Flat)</span>
                <div className="w-24">
                  <input
                    {...register("discount", { valueAsNumber: true })}
                    type="number"
                    min="0"
                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-right text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              {errors.discount && <p className="text-xs text-red-500 text-right">{errors.discount.message}</p>}

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Tax (Flat)</span>
                <div className="w-24">
                  <input
                    {...register("tax", { valueAsNumber: true })}
                    type="number"
                    min="0"
                    className="w-full rounded-md border border-slate-300 px-2 py-1 text-right text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              {errors.tax && <p className="text-xs text-red-500 text-right">{errors.tax.message}</p>}
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-base font-semibold text-slate-900">Total</span>
              <span className="text-lg font-bold text-blue-600">{estimates.total.toLocaleString()} KES</span>
            </div>
            
            <p className="text-xs text-slate-400 text-center">Totals are verified and finalized on the server.</p>

            <div className="pt-4 space-y-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Create Order"
                )}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="w-full rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 bg-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
