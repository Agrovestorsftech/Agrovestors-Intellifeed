// Tasks — replaces the old Supabase `tasks` table.
// Backend: GET/POST /api/v1/tasks/, PATCH+POST toggle /api/v1/tasks/{id}/.
// See backend-additions/apps/tasks/ for the server-side implementation
// this client assumes.

import { api } from "./client";
import { unwrapPage } from "./client";

export type TaskStatus = "open" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description: string;
  due_at: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string;
  assigned_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  due_at?: string | null;
  priority?: TaskPriority;
  assignee?: string; // defaults server-side to self if omitted
}

export async function listMyTasks(): Promise<Task[]> {
  const page = await api.get<Task[] | { results: Task[] }>("/tasks/");
  return unwrapPage(page as any);
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  return api.post<Task>("/tasks/", input);
}

export async function toggleTask(id: string): Promise<Task> {
  return api.post<Task>(`/tasks/${id}/toggle/`);
}

export async function updateTask(id: string, patch: Partial<CreateTaskInput & { status: TaskStatus }>): Promise<Task> {
  return api.patch<Task>(`/tasks/${id}/`, patch);
}