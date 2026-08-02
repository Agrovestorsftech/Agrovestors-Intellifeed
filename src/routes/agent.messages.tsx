import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Info, MailOpen, Mail } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { useAllNotifications } from "@/hooks/useDashboard";
import { markNotificationRead, relativeTime } from "@/lib/dashboard/queries";

export const Route = createFileRoute("/agent/messages")({ component: MessagesPage });

/**
 * There is no `messages` table in the schema yet — real portal-to-portal
 * messaging (Admin Agent <-> Field Agent <-> Admin) needs one, with sender_id,
 * recipient_id, body, thread/conversation grouping, and read state.
 * Until that exists, this page shows the notifications inbox (the closest
 * real, working data source) so the page isn't empty or fake.
 */
function MessagesPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useAllNotifications();

  const markRead = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications-all"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  return (
    <>
      <DashboardHeader title="Messages" subtitle="Notifications and updates sent to you." />

      <div className="rounded-2xl bg-warning-soft border border-warning/20 p-4 mb-6 flex items-start gap-3">
        <Info className="h-4 w-4 text-warning-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-warning-foreground">
          There's no dedicated messages table yet, so real portal-to-portal messaging (e.g. replying to a Field
          Agent) isn't wired up. This view shows your notifications inbox as an interim source of real data.
          Adding a <code className="font-mono">messages</code> table (sender, recipient, body, thread, read state)
          is the next step to make this fully functional.
        </p>
      </div>

      <section className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
        <div className="divide-y divide-border">
          {isLoading && Array.from({ length: 5 }).map((_, i) => <div key={i} className="p-5 h-16 animate-pulse bg-muted/30" />)}
          {error && <p className="p-6 text-sm text-destructive">Couldn't load notifications.</p>}
          {!isLoading && !error && (data?.length ?? 0) === 0 && (
            <p className="p-10 text-center text-sm text-muted-foreground">No notifications yet.</p>
          )}
          {(data ?? []).map((n: any) => (
            <div key={n.id} className={`p-5 flex items-start gap-3 ${n.read_at ? "" : "bg-primary-soft/20"}`}>
              <div className="h-9 w-9 shrink-0 grid place-items-center rounded-xl bg-muted text-muted-foreground">
                {n.read_at ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{n.title}</p>
                {n.body && <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>}
                <p className="text-xs text-muted-foreground mt-1">{relativeTime(n.created_at)}</p>
              </div>
              {!n.read_at && (
                <Button size="sm" variant="ghost" onClick={() => markRead.mutate(n.id)} disabled={markRead.isPending}>
                  Mark read
                </Button>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
