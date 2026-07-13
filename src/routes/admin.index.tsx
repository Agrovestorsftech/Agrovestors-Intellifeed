import { createFileRoute } from "@tanstack/react-router";
import { Users, UserCheck, Warehouse, ShoppingCart, HeartPulse } from "lucide-react";
import { AdminHeader } from "@/components/dashboard/AdminHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { useAdminKpis } from "@/hooks/useDashboard";
import { PlatformPerformance } from "@/components/dashboard/PlatformPerformance";
import { UserDistribution } from "@/components/dashboard/UserDistribution";
import { SystemLogs } from "@/components/dashboard/SystemLogs";
import { SystemHealth } from "@/components/dashboard/SystemHealth";
import { SupportTickets } from "@/components/dashboard/SupportTickets";
import { QuickManagementActions } from "@/components/dashboard/QuickManagementActions";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "IntelliFeed360 — System Admin Dashboard" },
      {
        name: "description",
        content:
          "IntelliFeed360 admin dashboard for monitoring platform health, users, farms and overall performance.",
      },
      { property: "og:title", content: "IntelliFeed360 — System Admin Dashboard" },
      {
        property: "og:description",
        content: "Monitor platform health, users, and overall performance.",
      },
    ],
  }),
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const { data, isLoading } = useAdminKpis();
  return (
    <>
      <AdminHeader
        title="System Overview"
        subtitle="Monitor platform health, users, and overall performance."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
        <KpiCard title="Total Farmers" value={data?.totalFarmers ?? 0} icon={Users} tone="primary" loading={isLoading} />
        <KpiCard title="Platform Users" value={data?.totalUsers ?? 0} icon={UserCheck} tone="info" loading={isLoading} />
        <KpiCard title="Active Farmers" value={data?.activeFarmers ?? 0} icon={Warehouse} tone="accent" loading={isLoading} />
        <KpiCard title="Pending Orders" value={data?.pendingOrders ?? 0} icon={ShoppingCart} tone="destructive" loading={isLoading} />
        <KpiCard title="Open Health Cases" value={data?.openCases ?? 0} icon={HeartPulse} tone="warning" loading={isLoading} />
      </div>

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <PlatformPerformance />
        </div>
        <UserDistribution />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SystemLogs />
        <SystemHealth />
        <SupportTickets />
      </div>

      <div className="mt-6">
        <QuickManagementActions />
      </div>
    </>
  );
}