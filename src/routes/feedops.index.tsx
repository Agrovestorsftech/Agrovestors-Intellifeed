import { createFileRoute } from "@tanstack/react-router";
import {
  Boxes,
  Factory,
  ClipboardList,
  Truck,
  AlertTriangle,
} from "lucide-react";
import { FeedOpsHeader } from "@/components/dashboard/FeedOpsHeader";
import { FeedOpsKpiCard } from "@/components/dashboard/FeedOpsKpiCard";
import { useFeedOpsKpis } from "@/hooks/useDashboard";
import { InventorySummary } from "@/components/dashboard/InventorySummary";
import { ProductionOverview } from "@/components/dashboard/ProductionOverview";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { FeedOpsQuickActions } from "@/components/dashboard/FeedOpsQuickActions";

export const Route = createFileRoute("/feedops/")({
  head: () => ({
    meta: [
      { title: "IntelliFeed360 — FeedOps Dashboard" },
      {
        name: "description",
        content:
          "IntelliFeed360 FeedOps dashboard for managing feed inventory, production and distribution.",
      },
      { property: "og:title", content: "IntelliFeed360 — FeedOps Dashboard" },
      {
        property: "og:description",
        content: "Manage feed inventory, production and distribution.",
      },
    ],
  }),
  component: FeedOpsDashboardPage,
});

function FeedOpsDashboardPage() {
  const { data, isLoading } = useFeedOpsKpis();
  const invMt = Math.round(((data?.totalInventory ?? 0) / 1000) * 10) / 10;
  return (
    <>
      <FeedOpsHeader
        title="FeedOps Overview"
        subtitle="Manage feed inventory, production and distribution."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
        <FeedOpsKpiCard title="Total Inventory" value={`${invMt} MT`} description="Across all warehouses" icon={Boxes} tone="primary" loading={isLoading} />
        <FeedOpsKpiCard title="Production Queue" value={data?.productionQueue ?? 0} description="Queued or running" icon={Factory} tone="accent" loading={isLoading} />
        <FeedOpsKpiCard title="Orders to Fulfill" value={data?.pendingOrders ?? 0} description="Pending fulfillment" icon={ClipboardList} tone="info" loading={isLoading} />
        <FeedOpsKpiCard title="Orders Today" value={data?.deliveriesToday ?? 0} description="Placed today" icon={Truck} tone="warning" loading={isLoading} />
        <FeedOpsKpiCard title="Low Stock Alerts" value={data?.lowStock ?? 0} description="At or below reorder level" icon={AlertTriangle} tone="destructive" loading={isLoading} />
      </div>

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <InventorySummary />
        <ProductionOverview />
        <RecentOrders />
      </div>

      <div className="mt-6">
        <FeedOpsQuickActions />
      </div>
    </>
  );
}