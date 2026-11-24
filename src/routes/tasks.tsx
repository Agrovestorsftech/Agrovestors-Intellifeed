import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Circle } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/AuthContext";
import { listMyTasks, toggleTask, type Task } from "@/lib/api/tasks";

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
    // api mode: /staff-tasks/?assignee=me, the tasks assigned to the signed-in user.
    queryFn: listMyTasks,
  });
  const toggle = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Task["status"] }) => toggleTask(id, status),
    onSuccess: (t) => {
      toast.success(t.status === "done" ? "Task done" : "Task reopened");
      void qc.invalidateQueries({ queryKey: ["my-tasks"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Couldn't update the task"),
  });
  const open = (data ?? []).filter((t: any) => t.status !== "done");
  const done = (data ?? []).filter((t: any) => t.status === "done");
  const Row = ({ t }: { t: any }) => (
    <li className="flex items-start gap-3 py-3">
      <button
        onClick={() => toggle.mutate({ id: t.id, status: t.status })}
        disabled={toggle.isPending}
        className="mt-0.5 shrink-0 disabled:opacity-50"
        aria-label={t.status === "done" ? `Reopen ${t.title}` : `Mark ${t.title} done`}
      >
        {t.status === "done" ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5 text-muted-foreground hover:text-primary" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${t.status === "done" ? "line-through text-muted-foreground" : ""}`}>{t.title}</p>
        {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
        {(t.due_at || t.assigned_by) && (
          <p className="text-xs text-muted-foreground mt-1">
            {[t.due_at && `Due ${new Date(t.due_at).toLocaleDateString()}`, t.assigned_by && `From ${t.assigned_by}`].filter(Boolean).join(" · ")}
          </p>
        )}
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
            {open.length === 0 ? <p className="text-sm text-muted-foreground">All caught up. Tasks your team lead assigns you show up here.</p> : <ul className="divide-y divide-border">{open.map((t: any) => <Row key={t.id} t={t} />)}</ul>}
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