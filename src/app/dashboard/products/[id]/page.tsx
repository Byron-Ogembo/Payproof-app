import { getProductById } from "@/app/actions/products";
import Link from "next/link";
import { ArrowLeft, Edit, Package, Tag, Banknote, ShieldAlert } from "lucide-react";
import { notFound } from "next/navigation";

export default async function ProductProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  let product;
  try {
    product = await getProductById(id);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/products"
            className="rounded-full p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{product.name}</h1>
            <p className="text-sm text-slate-500">SKU: {product.sku}</p>
          </div>
        </div>
        <Link
          href={`/dashboard/products/${product.id}/edit`}
          className="flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 hover:bg-slate-50"
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit Product
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Pricing</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600"><Tag className="h-4 w-4"/> Selling Price</span>
                <span className="font-semibold text-slate-900">{product.sellingPrice.toLocaleString()} KES</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600"><Banknote className="h-4 w-4"/> Cost Price</span>
                <span className="font-semibold text-slate-900">{product.costPrice.toLocaleString()} KES</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="font-medium text-slate-600">Margin</span>
                <span className="font-semibold text-green-600">
                  {product.sellingPrice > 0 
                    ? Math.round(((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100) 
                    : 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Inventory</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-slate-600"><Package className="h-4 w-4"/> In Stock</span>
                <span className={`font-semibold ${product.stockQuantity <= product.reorderLevel ? "text-red-600" : "text-slate-900"}`}>
                  {product.stockQuantity}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-slate-600"><ShieldAlert className="h-4 w-4"/> Reorder Level</span>
                <span className="text-slate-900 font-medium">{product.reorderLevel}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm min-h-[150px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Details</h3>
              {product.active ? (
                <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">Active</span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Inactive</span>
              )}
            </div>
            
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-slate-500 block mb-1">Category</span>
                <span className="text-slate-900 font-medium">{product.category || "Uncategorized"}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Description</span>
                {product.description ? (
                  <p className="text-slate-700 whitespace-pre-wrap">{product.description}</p>
                ) : (
                  <p className="text-slate-400 italic">No description available.</p>
                )}
              </div>
              <div>
                <span className="text-slate-500 block mb-1">Added On</span>
                <span className="text-slate-900">{new Date(product.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
