// Farmers. DEMO MODE: backed by the in-memory mock store (src/lib/mock).
// Swap the bodies back to `api.get(...)` calls once the backend exposes
// a farmers list endpoint; the exported types/signatures are the contract.

import { mockDb as db } from "@/lib/mock/db";

export interface FarmerListItem {
  id: string;
  farm_name: string;
  name: string;
  livestock_type: string;
  updated_at: string;
  report_count: number;
  open_health_cases: number;
}

export interface FarmerDetail {
  id: string;
  farm_name: string;
  name: string;
  livestock_type: string;
  contact_info: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function listFarmers(params: { search?: string; page_size?: number } = {}): Promise<FarmerListItem[]> {
  const { data, error } = await db
    .from("farmers")
    .select("id, name, farm_name, livestock_type, updated_at, visit_reports(id), health_cases(status)")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  const q = params.search?.toLowerCase();
  return (data ?? [])
    .filter((f) => !q || `${f.name} ${f.farm_name}`.toLowerCase().includes(q))
    .slice(0, params.page_size ?? 50)
    .map((f) => ({
      id: f.id,
      farm_name: f.farm_name ?? "—",
      name: f.name,
      livestock_type: f.livestock_type ?? "—",
      updated_at: f.updated_at,
      report_count: f.visit_reports.length,
      open_health_cases: f.health_cases.filter((c: { status: string }) => c.status !== "resolved").length,
    }));
}

export async function getFarmer(id: string): Promise<FarmerDetail> {
  const { data, error } = await db.from("farmers").select("*").eq("id", id).single();
  if (error || !data) throw new Error(error?.message ?? "Farmer not found");
  return {
    id: data.id,
    farm_name: data.farm_name ?? "—",
    name: data.name,
    livestock_type: data.livestock_type ?? "—",
    contact_info: data.phone ?? "—",
    status: data.status,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
}

export async function countFarmers(params: { status?: string } = {}): Promise<number> {
  let q = db.from("farmers").select("*", { count: "exact", head: true });
  if (params.status) q = q.eq("status", params.status);
  const { count } = await q;
  return count ?? 0;
}
