import { ProductForm } from "@/app/components/products/ProductForm";
import { getProductById } from "@/app/actions/products";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  let product;
  try {
    product = await getProductById(id);
  } catch {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/products/${id}`}
          className="rounded-full p-2 hover:bg-slate-100 text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit Product</h1>
          <p className="text-sm text-slate-500">Update information for {product.name}.</p>
        </div>
      </div>

      <ProductForm initialData={product} />
    </div>
  );
}
