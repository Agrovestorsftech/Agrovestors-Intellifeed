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
  return (
    <>
      <FeedOpsHeader
        title="FeedOps Overview"
        subtitle="Manage feed inventory, production and distribution."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
        <FeedOpsKpiCard title="Total Inventory" value="12.6 MT" trend={{ direction: "up", value: "8.3%", label: "from last week" }} icon={Boxes} tone="primary" />
        <FeedOpsKpiCard title="Production Today" value="4.2 MT" trend={{ direction: "up", value: "12.6%", label: "from yesterday" }} icon={Factory} tone="accent" />
        <FeedOpsKpiCard title="Orders to Fulfill" value="42" description="Pending fulfillment" icon={ClipboardList} tone="info" />
        <FeedOpsKpiCard title="Deliveries Today" value="18" description="Out for delivery" icon={Truck} tone="warning" />
        <FeedOpsKpiCard title="Low Stock Alerts" value="5" description="Needs attention" icon={AlertTriangle} tone="destructive" />
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