import { auth } from "@/auth";
import { AiChatInterface } from "@/app/components/ai/AiChatInterface";

export default async function AiPage() {
  const session = await auth();
  if (!session?.user?.businessId) return null;

  return (
    <main className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <span className="text-xs font-semibold text-indigo-600 uppercase tracking-widest">Phase 12</span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">PayProof AI Assistant</h1>
          <p className="text-sm text-slate-500">
            Real-time analytics and business insights backed by your isolated business ledger data.
          </p>
        </div>

        <AiChatInterface />
      </div>
    </main>
  );
}
