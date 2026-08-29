// Farmers — list/detail. Registration already existed (POST /farmers/register,
// see ./auth.ts's registerFarmer). This adds the read side the frontend needs
// for the farmer directory/review screens.
// Backend: /api/v1/farmers/ (read-only list/detail).
// See backend-additions/apps/farmers/ for the server-side implementation
// this client assumes — that file is NOT self-contained (depends on
// whatever Farmer model backs the existing register endpoint), so field
// names here may need a one-line adjustment once confirmed.

import { api, unwrapPage } from "./client";

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
  const query = new URLSearchParams();
  query.set("page_size", String(params.page_size ?? 50));
  if (params.search) query.set("search", params.search);
  const page = await api.get<any>(`/farmers/?${query}`);
  return unwrapPage(page);
}

export async function getFarmer(id: string): Promise<FarmerDetail> {
  return api.get<FarmerDetail>(`/farmers/${id}/`);
}

// KPI-tile helper — uses the pagination envelope's `count` directly.
export async function countFarmers(params: { status?: string } = {}): Promise<number> {
  const query = new URLSearchParams({ page_size: "1" });
  if (params.status) query.set("status", params.status);
  const page = await api.get<{ count: number }>(`/farmers/?${query}`);
  return page.count ?? 0;
}