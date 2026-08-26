import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import Image from "next/image";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.businessId) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* 3D Glassmorphic Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2.5 font-black text-xl tracking-tight">
              <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 font-extrabold text-slate-950 shadow-md shadow-emerald-500/20">
                P
              </span>
              <span className="bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                PAYPROOF
              </span>
            </Link>
            <span className="hidden sm:inline-block text-xs font-bold uppercase tracking-widest text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
              3D Portal
            </span>
          </div>

          <nav className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-semibold">
            <Link
              href="/dashboard"
              className="rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              Overview
            </Link>
            <Link
              href="/dashboard/orders"
              className="rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              Orders
            </Link>
            <Link
              href="/dashboard/products"
              className="rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              Products
            </Link>
            <Link
              href="/dashboard/customers"
              className="rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              Customers
            </Link>
            <Link
              href="/dashboard/notifications"
              className="rounded-lg px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition flex items-center gap-1.5"
            >
              Notifications
            </Link>
            <Link
              href="/dashboard/ai"
              className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 px-3.5 py-1.5 font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:scale-105 transition"
            >
              AI Assistant
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
