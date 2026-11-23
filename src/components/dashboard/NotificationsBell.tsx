import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff, CheckCheck, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAllNotifications, useUnreadNotifications } from "@/hooks/useDashboard";
import { markAllNotificationsRead, markNotificationRead, relativeTime } from "@/lib/dashboard/queries";
import { useAuth } from "@/lib/auth/AuthContext";
import { NotificationIcon } from "./NotificationIcon";

/** Full inbox page for roles that have one. */
const INBOX: Partial<Record<string, string>> = {
  field_agent: "/messages",
  admin_agent: "/agent/messages",
};

export type NotificationRow = {
  id: string;
  title: string;
  body: string | null;
  type: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

/** Mark a notification read and open the screen it is about. */
export function useOpenNotification() {
  const router = useRouter();
  const qc = useQueryClient();
  return async (n: NotificationRow) => {
    if (!n.read_at) {
      await markNotificationRead(n.id);
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
      qc.invalidateQueries({ queryKey: ["notifications-all"] });
    }
    if (n.link) router.navigate({ href: n.link });
  };
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const role = useAuth().session?.user.role;
  const unread = useUnreadNotifications();
  const all = useAllNotifications();
  const qc = useQueryClient();
  const router = useRouter();
  const openNotification = useOpenNotification();

  const count = unread.data?.length ?? 0;
  const list = (all.data ?? []) as NotificationRow[];
  const inbox = role ? INBOX[role] : undefined;

  async function markAll() {
    await markAllNotificationsRead(role);
    qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    qc.invalidateQueries({ queryKey: ["notifications-all"] });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative grid h-10 w-10 place-items-center rounded-xl border border-border bg-card shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-muted sm:h-11 sm:w-11"
          aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"}
        >
          <Bell className="h-[18px] w-[18px] text-foreground" aria-hidden="true" />
          {count > 0 && (
            <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground ring-2 ring-background">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="flex max-h-[min(520px,80vh)] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl p-0">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            <p className="text-xs text-muted-foreground">{count > 0 ? `${count} unread` : "You're all caught up"}</p>
          </div>
          {count > 0 && (
            <button
              type="button"
              onClick={markAll}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Mark all read
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {all.isError ? (
            <p className="p-6 text-center text-sm text-destructive">
              Couldn't load notifications.{" "}
              <button type="button" onClick={() => all.refetch()} className="font-medium text-primary hover:underline">
                Retry
              </button>
            </p>
          ) : all.isLoading ? (
            <div className="space-y-2 p-3" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-muted motion-safe:animate-pulse" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-8 text-center">
              <BellOff className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">No notifications yet.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {list.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      void openNotification(n);
                    }}
                    className={`group flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none ${!n.read_at ? "bg-primary-soft/40" : ""}`}
                  >
                    <NotificationIcon type={n.type} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className={`truncate text-sm text-foreground ${!n.read_at ? "font-semibold" : "font-medium"}`}>{n.title}</span>
                        {!n.read_at && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />}
                      </span>
                      {n.body && <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{n.body}</span>}
                      <span className="mt-1 block text-[11px] text-muted-foreground">{relativeTime(n.created_at)}</span>
                    </span>
                    {n.link && (
                      <ChevronRight
                        className="mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {inbox && (
          <div className="border-t border-border p-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.navigate({ href: inbox });
              }}
              className="w-full rounded-lg py-2 text-center text-sm font-medium text-primary transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              View all notifications
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
