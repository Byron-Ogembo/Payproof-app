"use client";

import { useState } from "react";
import { askBusinessAssistant } from "@/app/actions/ai";
import type { BusinessAssistantAnswer } from "@/lib/ai/business-assistant";

const SUGGESTIONS = [
  "How much did I sell this month?",
  "Who owes me money?",
  "What are my best-selling products?",
  "Why did sales decrease?",
  "Which products are slow-moving?",
  "What should I restock?",
  "What should I focus on today?",
];

export function AiChatInterface() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<
    Array<{ question: string; response: BusinessAssistantAnswer }>
  >([]);
  const [error, setError] = useState<string | null>(null);

  async function handleAsk(qToAsk?: string) {
    const query = qToAsk ?? question;
    if (!query.trim() || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await askBusinessAssistant(query);
      setHistory((prev) => [{ question: query, response: res }, ...prev]);
      setQuestion("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to query assistant");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-xs">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Ask your business data</h2>
        <p className="text-sm text-slate-500 mb-4">
          PayProof AI directly queries your authenticated business database metrics and audit logs. Financial modifications require explicit user confirmation.
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleAsk(s)}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 transition cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about sales, debtors, stock, or restock recommendations..."
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer"
          >
            {loading ? "Analyzing..." : "Ask AI"}
          </button>
        </form>

        {error && <p className="mt-3 text-sm text-rose-600 font-medium">{error}</p>}
      </div>

      <div className="space-y-4">
        {history.map((item, idx) => (
          <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider">
              <span>Question</span>
            </div>
            <p className="text-base font-medium text-slate-900">{item.question}</p>

            <div className="border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Data-backed response
                </span>
                {item.response.requiresConfirmation && (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                    Requires User Action / Confirmation
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{item.response.answer}</p>
              
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                <span>Sources: {item.response.source.join(", ")}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
