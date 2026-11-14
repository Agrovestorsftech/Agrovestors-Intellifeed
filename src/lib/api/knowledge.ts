// Knowledge articles. DEMO MODE: backed by the in-memory mock store (src/lib/mock).
// Swap the bodies back to `api.*` calls once the backend exposes a knowledge
// endpoint; the exported types/signatures are the contract.

import { mockDb as db } from "@/lib/mock/db";

export interface KnowledgeArticleListItem {
  id: string;
  title: string;
  category: string;
  tags: string[];
  updated_at: string;
  is_published: boolean;
}

export interface KnowledgeArticleDetail extends KnowledgeArticleListItem {
  body: string;
  created_at: string;
}

function toItem(a: Record<string, any>): KnowledgeArticleDetail {
  return {
    id: a.id,
    title: a.title,
    category: a.category ?? "General",
    tags: a.tags ?? [],
    updated_at: a.updated_at ?? a.created_at,
    is_published: !!a.published,
    body: a.body,
    created_at: a.created_at,
  };
}

export async function listArticles(params: { limit?: number; category?: string; search?: string } = {}): Promise<KnowledgeArticleListItem[]> {
  let q = db.from("knowledge_articles").select("*");
  if (params.category) q = q.eq("category", params.category);
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const s = params.search?.toLowerCase();
  return (data ?? [])
    .filter((a) => !s || `${a.title} ${a.body} ${(a.tags ?? []).join(" ")}`.toLowerCase().includes(s))
    .slice(0, params.limit ?? 100)
    .map(toItem);
}

export async function getArticle(id: string): Promise<KnowledgeArticleDetail> {
  const { data, error } = await db.from("knowledge_articles").select("*").eq("id", id).single();
  if (error || !data) throw new Error(error?.message ?? "Article not found");
  return toItem(data);
}
