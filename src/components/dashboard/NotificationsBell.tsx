import { Bell, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useUnreadNotifications, useAllNotifications } from "@/hooks/useDashboard";
import { markNotificationRead, relativeTime } from "@/lib/dashboard/queries";

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const unread = useUnreadNotifications();
  const all = useAllNotifications();
  const qc = useQueryClient();

  const count = unread.data?.length ?? 0;
  const list = open ? (all.data ?? []) : [];

  async function markRead(id: string) {
    try {
      await markNotificationRead(id);
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
      qc.invalidateQueries({ queryKey: ["notifications-all"] });
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative h-10 w-10 sm:h-11 sm:w-11 grid place-items-center rounded-xl border border-border bg-card hover:bg-muted transition-colors shadow-sm"
        aria-label="Notifications"
      >
        <Bell className="h-[18px] w-[18px] text-foreground" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-h-5 min-w-5 px-1 rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground grid place-items-center ring-2 ring-background">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-2 z-50 w-[340px] max-h-[480px] rounded-2xl border border-border bg-card shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold text-foreground">Notifications</p>
              <span className="text-xs text-muted-foreground">{count} unread</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {all.isLoading ? (
                <div className="p-6 grid place-items-center text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : list.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">You're all caught up.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {list.map((n) => (
                    <li key={n.id} className={`p-3 ${!n.read_at ? "bg-primary-soft/30" : ""}`}>
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                          {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                          <p className="text-[10px] text-muted-foreground mt-1">{relativeTime(n.created_at)}</p>
                        </div>
                        {!n.read_at && (
                          <button
                            type="button"
                            onClick={() => markRead(n.id)}
                            className="text-primary hover:bg-primary-soft rounded-md p-1"
                            aria-label="Mark read"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}