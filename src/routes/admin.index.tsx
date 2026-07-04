import { createFileRoute } from "@tanstack/react-router";
import { Users, UserCheck, Warehouse, ShoppingCart, Banknote } from "lucide-react";
import { AdminHeader } from "@/components/dashboard/AdminHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
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
  return (
    <>
      <AdminHeader
        title="System Overview"
        subtitle="Monitor platform health, users, and overall performance."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
        <KpiCard title="Total Farmers" value="2,583" growth="12.4%" icon={Users} tone="primary" />
        <KpiCard title="Total Agents" value="156" growth="8.7%" icon={UserCheck} tone="info" />
        <KpiCard title="Active Farms" value="1,976" growth="9.7%" icon={Warehouse} tone="accent" />
        <KpiCard title="Feed Orders" value="1,342" growth="18.8%" icon={ShoppingCart} tone="destructive" />
        <KpiCard title="Total Revenue" value="₦24.8M" growth="22.1%" icon={Banknote} tone="warning" />
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