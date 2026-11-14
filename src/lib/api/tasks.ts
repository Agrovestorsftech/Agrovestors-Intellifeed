// Tasks. DEMO MODE: backed by the in-memory mock store (src/lib/mock).
// Swap the bodies back to `api.*` calls once the backend exposes a tasks
// endpoint; the exported types/signatures are the contract.

import { mockDb as db } from "@/lib/mock/db";

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
  assignee?: string;
}

/** Tasks for the signed-in user (the store binds seeded tasks to them). */
export async function listMyTasks(): Promise<Task[]> {
  const { data, error } = await db.from("tasks").select("*").order("due_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Task[];
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const { data } = await db
    .from("tasks")
    .insert({ status: "open", priority: "medium", description: "", due_at: null, assigned_by: null, updated_at: new Date().toISOString(), ...input })
    .select("*")
    .single();
  return data as unknown as Task;
}

export async function toggleTask(id: string): Promise<Task> {
  const { data: current } = await db.from("tasks").select("status").eq("id", id).single();
  const { data } = await db
    .from("tasks")
    .update({ status: current?.status === "done" ? "open" : "done" })
    .eq("id", id)
    .select("*")
    .single();
  return data as unknown as Task;
}

export async function updateTask(id: string, patch: Partial<CreateTaskInput & { status: TaskStatus }>): Promise<Task> {
  const { data } = await db.from("tasks").update(patch).eq("id", id).select("*").single();
  return data as unknown as Task;
}
