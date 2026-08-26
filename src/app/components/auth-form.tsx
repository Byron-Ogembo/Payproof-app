"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
              <div className="relative">
                <input
                  name="password"
                  required
                  type={showPassword ? "text" : "password"}
                  minLength={8}
                  autoComplete={register ? "new-password" : "current-password"}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-4 pr-12 py-3 text-sm font-semibold text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition cursor-pointer p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    // Eye slash icon
                    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a8.962 8.962 0 013.982-.963c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21m-4.225-4.225L3 3"
                      />
                    </svg>
                  ) : (
                    // Eye icon
                    <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
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
