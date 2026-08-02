import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, BookOpen, PlusCircle } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AddKnowledgeArticleDialog } from "@/components/agent/dialogs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/agent/knowledge-base")({ component: KnowledgeBasePage });

function KnowledgeBasePage() {
  const [q, setQ] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["knowledge-articles-full"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_articles")
        .select("id, title, body, category, tags, published, created_at")
        .order("created_at", { ascending: false })
        .limit(150);
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (data ?? []).filter((a: any) =>
      !t || a.title.toLowerCase().includes(t) ||
      (a.category ?? "").toLowerCase().includes(t) ||
      (a.tags ?? []).some((tag: string) => tag.toLowerCase().includes(t))
    );
  }, [data, q]);

  return (
    <>
      <DashboardHeader title="Knowledge Base" subtitle="Guidelines, protocols, and reference material." />
      <section className="rounded-2xl bg-card border border-border p-4 shadow-sm mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search articles, categories, tags…" className="pl-9" />
        </div>
        <AddKnowledgeArticleDialog trigger={<Button><PlusCircle className="h-4 w-4 mr-2" />New article</Button>} />
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5 h-36 animate-pulse" />
        ))}
        {error && <p className="col-span-full text-sm text-destructive">Couldn't load articles.</p>}
        {!isLoading && !error && filtered.length === 0 && (
          <p className="col-span-full text-sm text-muted-foreground text-center py-12">No articles match your search.</p>
        )}
        {filtered.map((a: any) => (
          <article key={a.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 shrink-0 grid place-items-center rounded-xl bg-primary-soft text-primary">
                <BookOpen className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground line-clamp-2">{a.title}</h3>
                {a.category && (
                  <span className="mt-1 inline-flex items-center text-[10px] font-medium text-primary bg-primary-soft px-2 py-0.5 rounded-full">
                    {a.category}
                  </span>
                )}
              </div>
              {!a.published && <Badge variant="outline">Draft</Badge>}
            </div>
            <p className="mt-3 text-sm text-muted-foreground line-clamp-3 flex-1">{a.body}</p>
            {a.tags && a.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {a.tags.map((t: string) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{t}</span>
                ))}
              </div>
            )}
          </article>
        ))}
      </section>
    </>
  );
}
