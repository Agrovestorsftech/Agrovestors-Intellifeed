// Knowledge articles — replaces the old Supabase `knowledge_articles` table.
// Backend: /api/v1/knowledge/articles/?category=&search=
// See backend-additions/apps/knowledge/ for the server-side implementation
// this client assumes — NOTE that app may already partially exist server-
// side (apps.knowledge is in INSTALLED_APPS), so field names here may need
// a one-line adjustment once confirmed against the live server.

import { api, unwrapPage } from "./client";

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

export async function listArticles(params: { limit?: number; category?: string; search?: string } = {}): Promise<KnowledgeArticleListItem[]> {
  const query = new URLSearchParams();
  query.set("page_size", String(params.limit ?? 100));
  if (params.category) query.set("category", params.category);
  if (params.search) query.set("search", params.search);
  const page = await api.get<any>(`/knowledge/articles/?${query}`);
  return unwrapPage(page);
}

export async function getArticle(id: string): Promise<KnowledgeArticleDetail> {
  return api.get<KnowledgeArticleDetail>(`/knowledge/articles/${id}/`);
}