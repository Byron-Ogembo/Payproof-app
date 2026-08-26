import Image from "next/image";
import Link from "next/link";

const features3D = [
  {
    title: "Instant Payment Verification",
    desc: "No more checking SMS or screenshots. We verify it for you automatically.",
    image: "/assets/3d_instant_verification.webp",
  },
  {
    title: "Automated Reminders",
    desc: "Get paid faster with automatic payment reminders that work for you.",
    image: "/assets/3d_payment_reminders.webp",
  },
  {
    title: "Inventory Alerts",
    desc: "Never run out. Get low stock alerts before it's too late.",
    image: "/assets/3d_inventory_alerts.webp",
  },
  {
    title: "Customer Insights",
    desc: "Track purchase history, outstanding balances and customer lifetime value.",
    image: "/assets/3d_customer_insights.webp",
  },
  {
    title: "Grow Smarter",
    desc: "Make data-driven decisions and grow your business with 3D confidence.",
    image: "/assets/3d_grow_smarter.webp",
  },
];

const workflowSteps = [
  { step: 1, title: "Create Order", desc: "Add customer details & create order" },
  { step: 2, title: "Customer Pays", desc: "Customer pays via M-PESA or bank" },
  { step: 3, title: "PayProof Verifies", desc: "We verify the payment automatically" },
  { step: 4, title: "Order Updated", desc: "Order status is updated to PAID" },
  { step: 5, title: "You Get Notified", desc: "Instant notification & receipt" },
  { step: 6, title: "Grow Business", desc: "Focus on what matters most" },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#0a101d] text-white selection:bg-emerald-500 selection:text-white">
      {/* Dynamic 3D Lighting Gradients */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[600px] w-[1000px] -translate-x-1/2 rounded-full bg-emerald-500/15 blur-[140px]" />
      <div className="pointer-events-none absolute top-[600px] -right-40 -z-10 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[130px]" />

      {/* Navigation */}
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 text-2xl font-extrabold tracking-tight">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 font-black text-white shadow-lg shadow-emerald-500/30">
            P
          </span>
          <span className="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            PAYPROOF
          </span>
        </Link>
        <div className="hidden items-center gap-8 md:flex text-sm font-medium text-slate-300">
          <Link href="#features" className="hover:text-emerald-400 transition">Features</Link>
          <Link href="#pricing" className="hover:text-emerald-400 transition">Pricing</Link>
          <Link href="#how-it-works" className="hover:text-emerald-400 transition">How It Works</Link>
          <Link href="/dashboard/ai" className="hover:text-emerald-400 transition">AI Assistant</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition">
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:scale-105 hover:shadow-emerald-500/40"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 pt-12 pb-24 lg:px-8 lg:pt-20 lg:pb-32">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-400 backdrop-blur-md">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              For Smart Businesses
            </span>
            <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.1]">
              Don&apos;t trust the screenshot. <br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                Trust the transaction.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-300 leading-relaxed">
              Verify payments instantly. Reconcile orders in seconds. Understand your business with 3D real-time insights.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 px-7 py-4 text-base font-bold text-slate-950 shadow-xl shadow-emerald-500/30 transition hover:-translate-y-1 hover:shadow-emerald-500/50"
              >
                Start Free
              </Link>
              <Link
                href="#how-it-works"
                className="rounded-xl border border-slate-700 bg-slate-800/60 px-7 py-4 text-base font-semibold text-white backdrop-blur-md transition hover:border-slate-500 hover:bg-slate-800"
              >
                See How It Works
              </Link>
            </div>
            <div className="mt-8 flex items-center gap-6 text-xs font-medium text-slate-400">
              <div className="flex items-center gap-2">✓ No credit card required</div>
              <div className="flex items-center gap-2">✓ Setup in minutes</div>
              <div className="flex items-center gap-2">✓ Cancel anytime</div>
            </div>
          </div>

          <div className="relative lg:col-span-5">
            <div className="group relative rounded-3xl border border-emerald-500/20 bg-slate-900/80 p-3 shadow-2xl shadow-emerald-500/10 backdrop-blur-xl transition duration-500 hover:rotate-1 hover:scale-102 hover:border-emerald-500/40">
              <div className="overflow-hidden rounded-2xl">
                <Image
                  src="/assets/mobile_app.webp"
                  alt="PayProof Mobile & Dashboard App"
                  width={573}
                  height={559}
                  priority
                  className="w-full object-cover rounded-2xl"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 rounded-2xl border border-slate-800 bg-slate-950/90 p-4 shadow-xl backdrop-blur-lg hidden sm:flex items-center gap-4">
                <span className="flex size-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 text-2xl font-bold">
                  ✓
                </span>
                <div>
                  <p className="text-xs text-slate-400">Instant Verification</p>
                  <p className="text-base font-bold text-white">KES 84,500 Confirmed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3D Interactive Feature Grid */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400">Next-Gen Capabilities</h2>
          <p className="mt-2 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Everything your business needs to grow.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features3D.map((item, idx) => (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/50 p-4 transition-all duration-300 hover:-translate-y-2 hover:border-emerald-500/50 hover:bg-slate-900/90 hover:shadow-2xl hover:shadow-emerald-500/20"
            >
              <div className="relative h-48 w-full overflow-hidden rounded-2xl bg-slate-950">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="p-4">
                <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}

          {/* Security Banner Card */}
          <div className="group relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-slate-900/80 to-slate-950 p-6 flex flex-col justify-between hover:border-emerald-400 transition">
            <div>
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400 uppercase tracking-widest">
                Bank-Grade Security
              </span>
              <h3 className="mt-4 text-2xl font-bold text-white">Your data is safe with us</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2">✓ Bank-level encryption</li>
                <li className="flex items-center gap-2">✓ Secure payment processing</li>
                <li className="flex items-center gap-2">✓ Role-based access control</li>
                <li className="flex items-center gap-2">✓ Regular automated backups</li>
              </ul>
            </div>
            <div className="mt-6 relative h-28 w-full overflow-hidden rounded-xl">
              <Image
                src="/assets/security_shield.webp"
                alt="Security Shield"
                fill
                className="object-cover rounded-xl opacity-90 group-hover:scale-105 transition duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* AI Assistant 3D Banner */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/50 p-8 lg:p-12 shadow-2xl">
          <div className="grid items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <span className="rounded-full bg-emerald-500/20 px-3.5 py-1 text-xs font-bold text-emerald-400 uppercase tracking-widest">
                Phase 12: PayProof AI Assistant
              </span>
              <h2 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl">
                Know what to do today.
              </h2>
              <p className="mt-4 text-base text-slate-300 leading-relaxed">
                PayProof AI tells you what matters most. Ask real questions about revenue, debtors, slow-moving stock, and restock actions without leaving your workspace.
              </p>
              <div className="mt-6 flex gap-4">
                <Link
                  href="/dashboard/ai"
                  className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/25 transition hover:bg-emerald-400"
                >
                  Try AI Assistant Now
                </Link>
              </div>
            </div>
            <div className="lg:col-span-5 relative h-64 lg:h-80 w-full overflow-hidden rounded-2xl">
              <Image
                src="/assets/ai_assistant_character.webp"
                alt="AI Assistant Character"
                fill
                className="object-cover rounded-2xl group-hover:scale-105 transition duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How PayProof Works */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400">Step-by-Step Workflow</h2>
          <p className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">How PayProof Works</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-6">
          {workflowSteps.map((step) => (
            <div
              key={step.step}
              className="relative rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-center transition hover:border-emerald-500/40 hover:bg-slate-900"
            >
              <span className="mx-auto flex size-8 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-black text-emerald-400 border border-emerald-500/30 mb-3">
                {step.step}
              </span>
              <h4 className="text-base font-bold text-white">{step.title}</h4>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Grid */}
      <section id="pricing" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400">Simple Pricing</h2>
          <p className="mt-2 text-4xl font-extrabold text-white sm:text-5xl">All the tools you need to grow.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          {[
            { title: "Free", price: "KSh 0", desc: "For getting started", features: ["30 transactions / month", "Basic dashboard", "Payment verification", "Email support"] },
            { title: "Starter", price: "KSh 499", desc: "For small businesses", features: ["300 transactions / month", "Customer management", "Basic reports", "Email support"] },
            { title: "Business", price: "KSh 1,499", desc: "For growing businesses", popular: true, features: ["Unlimited transactions", "Inventory management", "Advanced analytics", "Priority support"] },
            { title: "Pro", price: "KSh 4,999", desc: "For advanced businesses", features: ["Multi-branch", "API access", "Advanced analytics", "Dedicated support"] },
          ].map((plan, idx) => (
            <div
              key={idx}
              className={`rounded-3xl border p-6 flex flex-col justify-between transition ${
                plan.popular
                  ? "border-emerald-500 bg-gradient-to-b from-emerald-950/50 to-slate-900 shadow-xl shadow-emerald-500/10"
                  : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
              }`}
            >
              <div>
                {plan.popular && (
                  <span className="mb-4 inline-block rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-black text-slate-950 uppercase tracking-widest">
                    Most Popular
                  </span>
                )}
                <h3 className="text-2xl font-bold text-white">{plan.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{plan.desc}</p>
                <div className="mt-4 mb-6">
                  <span className="text-3xl font-black text-white">{plan.price}</span>
                  <span className="text-xs text-slate-400"> /month</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-4">
                  {plan.features.map((f, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/register"
                className={`mt-8 w-full rounded-xl py-3 text-center text-xs font-bold transition ${
                  plan.popular
                    ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                    : "border border-slate-700 bg-slate-800 text-white hover:bg-slate-700"
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-12 text-center text-xs text-slate-400 font-semibold">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} PayProof App. Built by Byron Ogembo.</p>
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/Byron-Ogembo/Payproof-app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5"
            >
              <svg className="size-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub Repository
            </a>
            <Link href="/login" className="hover:text-white">Login</Link>
            <Link href="/register" className="hover:text-white">Register</Link>
            <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
