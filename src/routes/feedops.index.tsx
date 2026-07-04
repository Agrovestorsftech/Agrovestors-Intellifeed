import { createFileRoute } from "@tanstack/react-router";
import {
  Boxes,
  Factory,
  ClipboardList,
  Truck,
  AlertTriangle,
} from "lucide-react";
import { FeedOpsHeader } from "@/components/dashboard/FeedOpsHeader";
import { KpiCard } from "@/components/dashboard/KpiCard";
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
        <KpiCard title="Total Inventory" value="12.6 MT" growth="8.3%" icon={Boxes} tone="primary" />
        <KpiCard title="Production Today" value="4.2 MT" growth="12.6%" icon={Factory} tone="accent" />
        <KpiCard title="Orders to Fulfill" value="42" growth="Pending fulfillment" icon={ClipboardList} tone="info" />
        <KpiCard title="Deliveries Today" value="18" growth="Out for delivery" icon={Truck} tone="warning" />
        <KpiCard title="Low Stock Alerts" value="5" growth="Needs attention" icon={AlertTriangle} tone="destructive" />
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