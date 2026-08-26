"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const register = mode === "register";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);

    if (register) {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error);
        setLoading(false);
        return;
      }
    }

    const result = await signIn("credentials", {
      email: form.get("email"),
      password: form.get("password"),
      redirect: false,
    });

    if (result?.error) {
      setError("Incorrect email or password.");
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-5 py-10 selection:bg-emerald-500 selection:text-white">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-3 text-2xl font-black tracking-tight">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 font-extrabold text-slate-950 shadow-lg shadow-emerald-500/20">
            P
          </span>
          <span className="bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
            PAYPROOF
          </span>
        </Link>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
          {/* High-Contrast Bold Heading */}
          <h1 className="text-2xl font-extrabold tracking-tight text-white mb-2">
            {register ? "Set up your workspace" : "Log in to PayProof"}
          </h1>
          <p className="text-sm font-semibold text-slate-400 mb-6">
            {register
              ? "Start managing payment proofs and sales ledger."
              : "Enter your email credentials to access your dashboard."}
          </p>

          {/* Quick One-Click Gmail / Google Login Option */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm font-bold text-white transition hover:border-slate-500 hover:bg-slate-800 cursor-pointer"
            >
              <svg className="size-5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 10.8 0 12.3s.7 2.6 1.9 5l3.7-2.5z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                />
              </svg>
              Sign in with Gmail (Google)
            </button>
            <div className="relative my-6 flex items-center justify-center">
              <div className="w-full border-t border-slate-800" />
              <span className="absolute bg-slate-900 px-3 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                Or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {register && (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Your Full Name
                  </label>
                  <input
                    name="ownerName"
                    required
                    placeholder="e.g. Byron Ogembo"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Business Name
                  </label>
                  <input
                    name="businessName"
                    required
                    placeholder="e.g. Acme Fashion"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    name="phone"
                    required
                    placeholder="e.g. 0712345678"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    name="businessCategory"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                  >
                    <option value="RETAIL">Retail</option>
                    <option value="ONLINE_SELLER">Online seller</option>
                    <option value="SERVICES">Services</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-1">
                Gmail / Email Address
              </label>
              <input
                name="email"
                required
                type="email"
                autoComplete="email"
                placeholder="your.email@gmail.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-1">
                Password
              </label>
              <input
                name="password"
                required
                type="password"
                minLength={8}
                autoComplete={register ? "new-password" : "current-password"}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>

            {error && (
              <p role="alert" className="text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl">
                {error}
              </p>
            )}

            <button
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 p-3.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:scale-102 hover:shadow-emerald-500/40 disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Please wait…" : register ? "Create workspace" : "Log in"}
            </button>
          </form>

          {/* High-Contrast Clear Text Footer Link */}
          <div className="mt-6 border-t border-slate-800 pt-4 text-center text-sm font-bold text-slate-300">
            {register ? "Already registered?" : "New to PayProof?"}{" "}
            <Link
              className="font-extrabold text-emerald-400 hover:text-emerald-300 underline underline-offset-4"
              href={register ? "/login" : "/register"}
            >
              {register ? "Log in here" : "Create an account"}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
