import { BookOpen } from "lucide-react";
import { useKnowledgeArticles } from "@/hooks/useDashboard";

export function KnowledgePanel() {
  const { data, isLoading, error } = useKnowledgeArticles();
  const items = data ?? [];
  return (
    <section className="rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-sm flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
        <h2 className="text-base font-semibold text-foreground">Knowledge & Research</h2>
        <span className="text-xs text-muted-foreground hidden sm:inline">
          Guidelines · references · protocols
        </span>
      </div>
      {error ? (
        <p className="text-sm text-destructive">Couldn't load articles.</p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No published articles yet.</p>
      ) : (
      <ul className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((it) => (
            <li
              key={it.id}
              className="group flex items-start gap-3 rounded-xl border border-border/60 p-3 hover:border-primary/40 hover:bg-primary-soft/30 transition-colors cursor-pointer"
            >
              <div className="h-10 w-10 shrink-0 grid place-items-center rounded-xl bg-primary-soft text-primary">
                <BookOpen className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{it.title}</p>
                {it.category && (
                  <span className="mt-2 inline-flex items-center text-[10px] font-medium text-primary bg-primary-soft px-2 py-0.5 rounded-full">
                    {it.category}
                  </span>
                )}
              </div>
            </li>
          ))}
      </ul>
      )}
      <button className="mt-6 w-full sm:w-auto sm:self-end rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
        Open Knowledge Base
      </button>
    </section>
  );
}