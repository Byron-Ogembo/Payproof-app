import Link from "next/link";

const benefits = [
  ["Instant confirmation", "Match every payment to the right order in seconds, so your team can serve customers with confidence."],
  ["A clear daily picture", "See paid, pending, and overdue orders at a glance — without building another spreadsheet."],
  ["Built for your team", "Give cashiers, managers, and owners the right view of the business, wherever they work."],
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#fbfcfe] text-slate-950">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 font-bold tracking-[-0.04em]">
          <span className="grid size-8 place-items-center rounded-lg bg-blue-600 text-sm text-white">P</span>
          <span className="text-xl">payproof</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-5">
          <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950">Log in</Link>
          <Link href="/register" className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">Start free</Link>
        </div>
      </nav>

      <section className="relative mx-auto max-w-7xl px-6 pb-24 pt-16 lg:px-8 lg:pb-32 lg:pt-24">
        <div className="absolute -right-44 -top-32 size-[38rem] rounded-full bg-blue-100/70 blur-3xl" />
        <div className="relative grid items-center gap-16 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700"><span className="size-1.5 rounded-full bg-blue-600" />Payment clarity for growing businesses</p>
            <h1 className="max-w-2xl text-5xl font-bold tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-7xl">Know the money has landed.</h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">PayProof turns payment confirmation into a simple, reliable part of every sale. No more chasing screenshots or guessing what has been paid.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="rounded-xl bg-blue-600 px-6 py-3.5 text-center font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700">Create your workspace</Link>
              <Link href="#how-it-works" className="rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-center font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">See how it works</Link>
            </div>
            <p className="mt-5 text-sm text-slate-500">Free to get started. No card required.</p>
          </div>

          <div className="relative mx-auto w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-200/70">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3"><span className="size-9 rounded-lg bg-slate-950" /><div><p className="text-sm font-bold">Today&apos;s payments</p><p className="text-xs text-slate-500">12 August 2026</p></div></div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Live</span>
            </div>
            <div className="grid grid-cols-2 gap-3 py-5">
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-medium text-slate-500">Confirmed today</p><p className="mt-2 text-2xl font-bold tracking-tight">KES 84,500</p><p className="mt-1 text-xs font-semibold text-emerald-600">↑ 18% from yesterday</p></div>
              <div className="rounded-xl bg-blue-50 p-4"><p className="text-xs font-medium text-blue-700">Awaiting payment</p><p className="mt-2 text-2xl font-bold tracking-tight text-blue-950">7 orders</p><p className="mt-1 text-xs font-semibold text-blue-600">KES 21,800 value</p></div>
            </div>
            <div className="space-y-3">
              {[['M-PESA payment', 'INV-1048 · 2 min ago', 'KES 3,500'], ['Bank transfer', 'INV-1047 · 18 min ago', 'KES 12,000'], ['M-PESA payment', 'INV-1046 · 31 min ago', 'KES 6,750']].map(([name, detail, amount]) => <div className="flex items-center justify-between" key={detail}><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-emerald-50 text-emerald-600">✓</span><div><p className="text-sm font-semibold">{name}</p><p className="text-xs text-slate-500">{detail}</p></div></div><p className="text-sm font-bold">{amount}</p></div>)}
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-slate-100 bg-white py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8"><div className="max-w-xl"><p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-600">One source of truth</p><h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">From payment request to peace of mind.</h2></div><div className="mt-14 grid gap-10 md:grid-cols-3">{benefits.map(([title, copy], index) => <div key={title}><p className="mb-5 text-sm font-bold text-blue-600">0{index + 1}</p><h3 className="text-xl font-bold">{title}</h3><p className="mt-3 leading-7 text-slate-600">{copy}</p></div>)}</div></div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8"><div className="rounded-3xl bg-slate-950 px-7 py-14 text-center text-white sm:px-12"><p className="text-blue-300">Every order deserves proof.</p><h2 className="mx-auto mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">Spend less time reconciling. More time growing.</h2><Link href="/register" className="mt-8 inline-block rounded-xl bg-white px-6 py-3.5 font-semibold text-slate-950 transition hover:bg-blue-50">Start using PayProof</Link></div></section>
      <footer className="border-t border-slate-100 px-6 py-8 text-center text-sm text-slate-500">© {new Date().getFullYear()} PayProof. Built for clear business days.</footer>
    </main>
  );
}
