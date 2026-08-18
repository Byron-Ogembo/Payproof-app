import { getProducts } from "@/app/actions/products";
import Link from "next/link";
import { Plus, Search } from "lucide-react";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; page?: string; category?: string }>;
}) {
  const params = await searchParams;
  const query = params?.query || "";
  const page = Number(params?.page) || 1;
  const category = params?.category;

  const { products, total, totalPages } = await getProducts({ query, page, category });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Products</h1>
        <Link
          href="/dashboard/products/new"
          className="flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Link>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <form className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                name="query"
                defaultValue={query}
                placeholder="Search by name or SKU..."
                className="w-full rounded-md border border-slate-300 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <input
              type="text"
              name="category"
              defaultValue={category || ""}
              placeholder="Filter by Category"
              className="rounded-md border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button type="submit" className="rounded-md bg-slate-100 px-4 py-2 text-sm font-medium hover:bg-slate-200">
              Filter
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 font-medium">Product</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Price</th>
                <th className="px-6 py-3 font-medium">Stock</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{product.name}</div>
                      <div className="text-xs text-slate-400">SKU: {product.sku}</div>
                    </td>
                    <td className="px-6 py-4">{product.category || "-"}</td>
                    <td className="px-6 py-4">{product.sellingPrice.toLocaleString()} KES</td>
                    <td className="px-6 py-4">
                      <span className={product.stockQuantity <= product.reorderLevel ? "text-red-600 font-medium" : ""}>
                        {product.stockQuantity}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {product.active ? (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/products/${product.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
            <div className="text-sm text-slate-500">
              Showing page {page} of {totalPages} ({total} total products)
            </div>
            <div className="flex gap-2">
              <Link
                href={`?page=${page - 1}&query=${query}&category=${category || ""}`}
                className={`rounded-md border border-slate-300 px-3 py-1 text-sm ${
                  page <= 1 ? "pointer-events-none opacity-50" : "hover:bg-slate-50"
                }`}
              >
                Previous
              </Link>
              <Link
                href={`?page=${page + 1}&query=${query}&category=${category || ""}`}
                className={`rounded-md border border-slate-300 px-3 py-1 text-sm ${
                  page >= totalPages ? "pointer-events-none opacity-50" : "hover:bg-slate-50"
                }`}
              >
                Next
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
