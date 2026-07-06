import { createFileRoute } from "@tanstack/react-router";
import {
  ClipboardList,
  Salad,
  LifeBuoy,
  AlertTriangle,
  HeartPulse,
} from "lucide-react";
import { AgentHeader } from "@/components/dashboard/AgentHeader";
import { FeedOpsKpiCard as KpiCard } from "@/components/dashboard/FeedOpsKpiCard";
import { ReportsAwaitingReview } from "@/components/dashboard/ReportsAwaitingReview";
import { NutritionMonitoring } from "@/components/dashboard/NutritionMonitoring";
import { CriticalAlerts } from "@/components/dashboard/CriticalAlerts";
import { VeterinaryWorkspace } from "@/components/dashboard/VeterinaryWorkspace";
import { KnowledgePanel } from "@/components/dashboard/KnowledgePanel";
import { FarmerHealthMonitoring } from "@/components/dashboard/FarmerHealthMonitoring";

export const Route = createFileRoute("/agent/")({
  head: () => ({
    meta: [
      { title: "IntelliFeed360 — Admin Agent Dashboard" },
      {
        name: "description",
        content:
          "IntelliFeed360 Admin Agent dashboard for nutritionists and veterinarians to review farmer reports, manage nutrition plans and monitor livestock health.",
      },
      { property: "og:title", content: "IntelliFeed360 — Admin Agent Dashboard" },
      {
        property: "og:description",
        content: "Review farmer reports, update nutrition plans and monitor livestock health.",
      },
    ],
  }),
  component: AgentDashboardPage,
});

function AgentDashboardPage() {
  return (
    <>
      <AgentHeader
        title="Welcome, Dr. Jane! 👋"
        subtitle="Review farmer reports, update nutrition plans and monitor livestock health."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
        <KpiCard title="Reports Awaiting Review" value="28" description="Pending review" icon={ClipboardList} tone="warning" />
        <KpiCard title="Nutrition Plans Updated" value="16" description="This week" icon={Salad} tone="primary" />
        <KpiCard title="Rescue Plans Active" value="7" description="Require monitoring" icon={LifeBuoy} tone="info" />
        <KpiCard title="Critical Cases" value="5" description="Needs immediate attention" icon={AlertTriangle} tone="destructive" />
        <KpiCard title="Farm Health Score" value="92%" description="Across all assigned farms" icon={HeartPulse} tone="accent" />
      </div>

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <ReportsAwaitingReview />
        </div>
        <NutritionMonitoring />
      </div>

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <VeterinaryWorkspace />
        </div>
        <CriticalAlerts />
      </div>

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <FarmerHealthMonitoring />
        </div>
        <KnowledgePanel />
      </div>
    </>
  );
}