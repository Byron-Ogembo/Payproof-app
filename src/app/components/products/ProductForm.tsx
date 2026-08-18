"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProductSchema, type ProductFormValues } from "@/lib/validations/product";
import { createProduct, updateProduct } from "@/app/actions/products";
import { Product } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface ProductFormProps {
  initialData?: Product;
}

export function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      name: initialData?.name || "",
      sku: initialData?.sku || "",
      category: initialData?.category || "",
      description: initialData?.description || "",
      sellingPrice: initialData?.sellingPrice || 0,
      costPrice: initialData?.costPrice || 0,
      stockQuantity: initialData?.stockQuantity || 0,
      reorderLevel: initialData?.reorderLevel || 0,
      active: initialData ? initialData.active : true,
    },
  });

  async function onSubmit(data: ProductFormValues) {
    try {
      setError(null);
      if (initialData) {
        await updateProduct(initialData.id, data);
        router.push(`/dashboard/products/${initialData.id}`);
      } else {
        const result = await createProduct(data);
        router.push(`/dashboard/products/${result.productId}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Product Name *</label>
          <input
            {...register("name")}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. Wireless Mouse"
          />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">SKU *</label>
          <input
            {...register("sku")}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. WM-001"
          />
          {errors.sku && <p className="text-sm text-red-500">{errors.sku.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Category</label>
          <input
            {...register("category")}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="e.g. Electronics"
          />
          {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
        </div>

        <div className="space-y-2 flex items-center pt-6">
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" {...register("active")} className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium text-slate-700">Active</span>
          </label>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Selling Price</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">KES</span>
            <input
              {...register("sellingPrice", { valueAsNumber: true })}
              type="number"
              min="0"
              className="w-full rounded-md border border-slate-300 pl-12 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {errors.sellingPrice && <p className="text-sm text-red-500">{errors.sellingPrice.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Cost Price</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">KES</span>
            <input
              {...register("costPrice", { valueAsNumber: true })}
              type="number"
              min="0"
              className="w-full rounded-md border border-slate-300 pl-12 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {errors.costPrice && <p className="text-sm text-red-500">{errors.costPrice.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Stock Quantity</label>
          <input
            {...register("stockQuantity", { valueAsNumber: true })}
            type="number"
            min="0"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.stockQuantity && <p className="text-sm text-red-500">{errors.stockQuantity.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Reorder Level</label>
          <input
            {...register("reorderLevel", { valueAsNumber: true })}
            type="number"
            min="0"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.reorderLevel && <p className="text-sm text-red-500">{errors.reorderLevel.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">Description</label>
        <textarea
          {...register("description")}
          rows={3}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Product description..."
        />
        {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
      </div>

      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : initialData ? (
            "Update Product"
          ) : (
            "Create Product"
          )}
        </button>
      </div>
    </form>
  );
}
