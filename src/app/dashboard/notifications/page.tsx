import { auth } from "@/auth";
import { getNotifications } from "@/lib/notifications";
import { markAsRead } from "@/app/actions/notifications";

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.businessId) return null;

  const params = await searchParams;
  const page = Number(params?.page ?? 1) || 1;
  const data = await getNotifications({ businessId: session.user.businessId, page, limit: 15 });

  return (
    <main className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
            <p className="text-sm text-slate-500">
              {data.unreadCount} unread out of {data.total} total notifications
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {data.notifications.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500">
              No notifications yet.
            </div>
          ) : (
            data.notifications.map((n) => (
              <div
                key={n.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border p-4 transition ${
                  n.readAt ? "border-slate-200 bg-white" : "border-indigo-200 bg-indigo-50/50 shadow-sm"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{n.title}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      {n.channel}
                    </span>
                    {!n.readAt && (
                      <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">{n.message}</p>
                  <p className="text-xs text-slate-400">{formatDate(n.createdAt)}</p>
                </div>

                {!n.readAt && (
                  <form
                    action={async () => {
                      "use server";
                      await markAsRead(n.id);
                    }}
                  >
                    <button
                      type="submit"
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
                    >
                      Mark as read
                    </button>
                  </form>
                )}
              </div>
            ))
          )}
        </div>

        {data.totalPages > 1 && (
          <div className="mt-6 flex justify-end gap-2 text-sm text-slate-600">
            <a
              href={`?page=${Math.max(1, page - 1)}`}
              className={`rounded-lg border bg-white px-3 py-1.5 ${page <= 1 ? "pointer-events-none opacity-50" : ""}`}
            >
              Previous
            </a>
            <span className="py-1.5 px-2">Page {page} of {data.totalPages}</span>
            <a
              href={`?page=${page + 1}`}
              className={`rounded-lg border bg-white px-3 py-1.5 ${page >= data.totalPages ? "pointer-events-none opacity-50" : ""}`}
            >
              Next
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
