import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, CheckCheck } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAllNotifications } from "@/hooks/useDashboard";
import { relativeTime } from "@/lib/dashboard/queries";

export const Route = createFileRoute("/messages")({ component: MessagesPage });

function MessagesPage() {
  const { data, isLoading } = useAllNotifications();
  const qc = useQueryClient();
  const markAll = useMutation({
    mutationFn: async () => {
      const ids = (data ?? []).filter((n: any) => !n.read_at).map((n: any) => n.id);
      if (ids.length === 0) return;
      const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["notifications-all"] }); qc.invalidateQueries({ queryKey: ["notifications-unread"] }); toast.success("All caught up"); },
  });
  return (
    <>
      <DashboardHeader title="Messages" subtitle="Notifications from HQ, admin agents and the platform." />
      <section className="rounded-2xl bg-card border border-border p-4 mb-4 flex justify-end">
        <Button variant="outline" onClick={() => markAll.mutate()} disabled={markAll.isPending}><CheckCheck className="h-4 w-4 mr-2" />Mark all read</Button>
      </section>
      <section className="rounded-2xl bg-card border border-border shadow-sm divide-y divide-border">
        {isLoading && <div className="p-6 animate-pulse h-40" />}
        {!isLoading && (data?.length ?? 0) === 0 && (
          <p className="p-10 text-center text-sm text-muted-foreground">You're all caught up.</p>
        )}
        {(data ?? []).map((n: any) => (
          <div key={n.id} className={`p-5 flex gap-3 ${!n.read_at ? "bg-primary/5" : ""}`}>
            <div className="h-10 w-10 rounded-xl bg-primary-soft grid place-items-center text-primary shrink-0"><Bell className="h-4 w-4" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{n.title}</p>
              {n.body && <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>}
              <p className="text-xs text-muted-foreground mt-1">{relativeTime(n.created_at)}</p>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
