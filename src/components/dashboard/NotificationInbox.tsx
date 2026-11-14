import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BellOff, CheckCheck, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAllNotifications } from "@/hooks/useDashboard";
import { markAllNotificationsRead, relativeTime } from "@/lib/dashboard/queries";
import { useAuth } from "@/lib/auth/AuthContext";
import { NotificationIcon } from "./NotificationIcon";
import { useOpenNotification, type NotificationRow } from "./NotificationsBell";

type Filter = "all" | "unread";

/** Full-page notifications list. Each row opens the screen it is about. */
export function NotificationInbox() {
  const role = useAuth().session?.user.role;
  const { data, isLoading, isError, refetch } = useAllNotifications();
  const qc = useQueryClient();
  const openNotification = useOpenNotification();
  const [filter, setFilter] = useState<Filter>("all");
  const [marking, setMarking] = useState(false);

  const rows = (data ?? []) as NotificationRow[];
  const unreadCount = rows.filter((n) => !n.read_at).length;
  const visible = filter === "unread" ? rows.filter((n) => !n.read_at) : rows;

  async function markAll() {
    setMarking(true);
    try {
      await markAllNotificationsRead(role);
      await qc.invalidateQueries({ queryKey: ["notifications-all"] });
      await qc.invalidateQueries({ queryKey: ["notifications-unread"] });
      toast.success("All caught up");
    } finally {
      setMarking(false);
    }
  }

  return (
    <>
      <section className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
        <div className="inline-flex rounded-xl bg-muted p-1" role="tablist" aria-label="Filter notifications">
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                filter === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "all" ? "All" : `Unread${unreadCount ? ` (${unreadCount})` : ""}`}
            </button>
          ))}
        </div>
        <Button variant="outline" onClick={markAll} disabled={marking || unreadCount === 0}>
          <CheckCheck className="mr-2 h-4 w-4" aria-hidden="true" />
          Mark all read
        </Button>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {isError ? (
          <div className="p-10 text-center">
            <p className="text-sm text-destructive">Couldn't load notifications.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : isLoading ? (
          <div className="space-y-px" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted/60 motion-safe:animate-pulse" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-12 text-center">
            <BellOff className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">{filter === "unread" ? "No unread notifications" : "No notifications yet"}</p>
            <p className="text-xs text-muted-foreground">New activity on your farms and orders shows up here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {visible.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => void openNotification(n)}
                  className={`group flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none ${!n.read_at ? "bg-primary/5" : ""}`}
                >
                  <NotificationIcon type={n.type} size="md" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className={`text-sm text-foreground ${!n.read_at ? "font-semibold" : "font-medium"}`}>{n.title}</span>
                      {!n.read_at && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                    </span>
                    {n.body && <span className="mt-0.5 block text-sm text-muted-foreground">{n.body}</span>}
                    <span className="mt-1 block text-xs text-muted-foreground">{relativeTime(n.created_at)}</span>
                  </span>
                  {n.link && (
                    <span className="mt-1 hidden items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 sm:inline-flex">
                      Open <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
