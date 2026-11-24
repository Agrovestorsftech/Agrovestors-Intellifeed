// Staff tasks, switched by AUTH_MODE.
//
// - demo: the in-memory mock store (src/lib/mock).
// - api: /staff-tasks/ (apps.support). Anyone on staff creates tasks for
//   themselves; admins and admin agents can assign them to others. The
//   assignee marks a task done or reopens it.

import { AUTH_MODE } from "@/lib/auth/AuthContext";
import { api, fetchAllPages } from "@/lib/api/client";
import { mockDb as db } from "@/lib/mock/db";

const IS_API = AUTH_MODE === "api";

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

// --- Backend shape (apps/support/views.py) ----------------------------------

interface ApiPerson {
  id: string;
  full_name: string;
}

interface ApiTask {
  id: string;
  title: string;
  description: string;
  due_at: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  assignee: ApiPerson;
  assigned_by: ApiPerson | null;
  created_at: string;
  updated_at: string;
}

const toTask = (t: ApiTask): Task => ({
  id: t.id,
  title: t.title,
  description: t.description,
  due_at: t.due_at,
  status: t.status,
  priority: t.priority,
  assignee: t.assignee?.full_name ?? "",
  // Someone else's name only: a task you set yourself has no "from".
  assigned_by:
    t.assigned_by && t.assigned_by.id !== t.assignee?.id ? t.assigned_by.full_name : null,
  created_at: t.created_at,
  updated_at: t.updated_at,
});

/** Tasks assigned to the signed-in user (the demo store binds seeded tasks to them). */
export async function listMyTasks(): Promise<Task[]> {
  if (IS_API) return (await fetchAllPages<ApiTask>("/staff-tasks/?assignee=me")).map(toTask);
  const { data, error } = await db.from("tasks").select("*").order("due_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Task[];
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  if (IS_API) {
    // Without assignee_id the backend assigns the task to whoever creates it.
    const created = await api.post<ApiTask>("/staff-tasks/", {
      title: input.title.trim(),
      description: input.description?.trim() ?? "",
      due_at: input.due_at ?? null,
      priority: input.priority ?? "medium",
      ...(input.assignee ? { assignee_id: input.assignee } : {}),
    });
    return toTask(created);
  }
  const { data } = await db
    .from("tasks")
    .insert({
      status: "open",
      priority: "medium",
      description: "",
      due_at: null,
      assigned_by: null,
      updated_at: new Date().toISOString(),
      ...input,
    })
    .select("*")
    .single();
  return data as unknown as Task;
}

/** Mark done, or reopen. */
export async function toggleTask(id: string, currentStatus?: TaskStatus): Promise<Task> {
  if (IS_API) {
    const status = currentStatus ?? (await api.get<ApiTask>(`/staff-tasks/${id}/`)).status;
    return toTask(
      await api.patch<ApiTask>(`/staff-tasks/${id}/`, {
        status: status === "done" ? "open" : "done",
      }),
    );
  }
  const { data: current } = await db.from("tasks").select("status").eq("id", id).single();
  const { data } = await db
    .from("tasks")
    .update({ status: current?.status === "done" ? "open" : "done" })
    .eq("id", id)
    .select("*")
    .single();
  return data as unknown as Task;
}

export async function updateTask(
  id: string,
  patch: Partial<CreateTaskInput & { status: TaskStatus }>,
): Promise<Task> {
  if (IS_API) {
    const { assignee, ...rest } = patch;
    return toTask(
      await api.patch<ApiTask>(`/staff-tasks/${id}/`, {
        ...rest,
        ...(assignee ? { assignee_id: assignee } : {}),
      }),
    );
  }
  const { data } = await db.from("tasks").update(patch).eq("id", id).select("*").single();
  return data as unknown as Task;
}
