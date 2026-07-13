import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth/AuthContext";
import * as Q from "@/lib/dashboard/queries";

const REFRESH_MS = 60_000;

export const useAdminKpis = () =>
  useQuery({ queryKey: ["admin-kpis"], queryFn: Q.fetchAdminKpis, refetchInterval: REFRESH_MS });

export const useAgentKpis = () =>
  useQuery({ queryKey: ["agent-kpis"], queryFn: Q.fetchAgentKpis, refetchInterval: REFRESH_MS });

export const useFeedOpsKpis = () =>
  useQuery({ queryKey: ["feedops-kpis"], queryFn: Q.fetchFeedOpsKpis, refetchInterval: REFRESH_MS });

export function useFieldKpis() {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useQuery({
    queryKey: ["field-kpis", userId],
    queryFn: () => Q.fetchFieldKpis(userId),
    enabled: !!userId,
    refetchInterval: REFRESH_MS,
  });
}

export const usePendingReports = () =>
  useQuery({ queryKey: ["pending-reports"], queryFn: () => Q.fetchPendingReports(8), refetchInterval: REFRESH_MS });

export const useFarmerHealth = () =>
  useQuery({ queryKey: ["farmer-health"], queryFn: () => Q.fetchFarmerHealth(8), refetchInterval: REFRESH_MS });

export const useCriticalAlerts = () =>
  useQuery({ queryKey: ["critical-alerts"], queryFn: () => Q.fetchCriticalAlerts(6), refetchInterval: REFRESH_MS });

export const useKnowledgeArticles = () =>
  useQuery({ queryKey: ["knowledge-articles"], queryFn: () => Q.fetchKnowledgeArticles(6) });

export const useInventoryRows = () =>
  useQuery({ queryKey: ["inventory-rows"], queryFn: () => Q.fetchInventoryRows(8), refetchInterval: REFRESH_MS });

export const useProductionSeries = () =>
  useQuery({ queryKey: ["production-series"], queryFn: Q.fetchProductionSeries, refetchInterval: REFRESH_MS });

export const usePlatformSeries = () =>
  useQuery({ queryKey: ["platform-series"], queryFn: Q.fetchPlatformSeries, refetchInterval: REFRESH_MS });

export const useUserDistribution = () =>
  useQuery({ queryKey: ["user-distribution"], queryFn: Q.fetchUserDistribution, refetchInterval: REFRESH_MS });

export const useRecentOrders = () =>
  useQuery({ queryKey: ["recent-orders"], queryFn: () => Q.fetchRecentOrders(6), refetchInterval: REFRESH_MS });

export function useTodaysSchedule() {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useQuery({
    queryKey: ["todays-schedule", userId],
    queryFn: () => Q.fetchTodaysSchedule(userId, 6),
    enabled: !!userId,
    refetchInterval: REFRESH_MS,
  });
}

export const useActivities = (limit = 20) =>
  useQuery({ queryKey: ["activities", limit], queryFn: () => Q.fetchActivities(limit), refetchInterval: REFRESH_MS });

export const useUnreadNotifications = () =>
  useQuery({ queryKey: ["notifications-unread"], queryFn: Q.fetchUnreadNotifications, refetchInterval: 30_000 });

export const useAllNotifications = () =>
  useQuery({ queryKey: ["notifications-all"], queryFn: () => Q.fetchAllNotifications(20) });

export const useSupportTickets = () =>
  useQuery({ queryKey: ["support-tickets"], queryFn: () => Q.fetchSupportTickets(6), refetchInterval: REFRESH_MS });

export const useSystemLogs = () =>
  useQuery({ queryKey: ["system-logs"], queryFn: () => Q.fetchSystemLogs(8), refetchInterval: REFRESH_MS });