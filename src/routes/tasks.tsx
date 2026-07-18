import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Circle } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/AuthContext";

export const Route = createFileRoute("/tasks")({ component: TasksPage });

const priorityColor: Record<string, string> = {
  high: "bg-destructive-soft text-destructive",
  medium: "bg-warning-soft text-warning-foreground",
  low: "bg-info-soft text-info",
};

function TasksPage() {
  const { session } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["my-tasks", session?.user.id],
    enabled: !!session?.user.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks").select("id, title, description, due_at, status, priority")
        .eq("assignee_id", session!.user.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const toggle = useMutation({
    mutationFn: async ({ id, done }: { id: string; done: boolean }) => {
      const { error } = await supabase.from("tasks").update({ status: done ? "done" : "open" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-tasks"] }),
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });
  const open = (data ?? []).filter((t: any) => t.status !== "done");
  const done = (data ?? []).filter((t: any) => t.status === "done");
  const Row = ({ t }: { t: any }) => (
    <li className="flex items-start gap-3 py-3">
      <button onClick={() => toggle.mutate({ id: t.id, done: t.status !== "done" })} className="mt-0.5 shrink-0" aria-label="Toggle">
        {t.status === "done" ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>{t.title}</p>
        {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
        {t.due_at && <p className="text-xs text-muted-foreground mt-1">Due {new Date(t.due_at).toLocaleDateString()}</p>}
      </div>
      <Badge className={priorityColor[t.priority] ?? "bg-muted"}>{t.priority}</Badge>
    </li>
  );
  return (
    <>
      <DashboardHeader title="Tasks" subtitle="To-dos, follow-ups and scheduled work." />
      {isLoading ? <div className="rounded-2xl bg-card border border-border p-6 animate-pulse h-40" /> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section className="rounded-2xl bg-card border border-border p-6 shadow-sm">
            <h2 className="text-base font-semibold mb-2">Open · {open.length}</h2>
            {open.length === 0 ? <p className="text-sm text-muted-foreground">All caught up.</p> : <ul className="divide-y divide-border">{open.map((t: any) => <Row key={t.id} t={t} />)}</ul>}
          </section>
          <section className="rounded-2xl bg-card border border-border p-6 shadow-sm">
            <h2 className="text-base font-semibold mb-2">Done · {done.length}</h2>
            {done.length === 0 ? <p className="text-sm text-muted-foreground">No completed tasks yet.</p> : <ul className="divide-y divide-border">{done.map((t: any) => <Row key={t.id} t={t} />)}</ul>}
          </section>
        </div>
      )}
    </>
  );
}
