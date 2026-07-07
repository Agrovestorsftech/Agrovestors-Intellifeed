import { createFileRoute } from "@tanstack/react-router";
import {
  ClipboardList,
  Salad,
  HeartPulse,
  MessageSquareText,
  CheckSquare,
} from "lucide-react";
import { AgentHeader } from "@/components/dashboard/AgentHeader";
import { FeedOpsKpiCard as KpiCard } from "@/components/dashboard/FeedOpsKpiCard";
import { ReportsAwaitingReview } from "@/components/dashboard/ReportsAwaitingReview";
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
        title="Welcome, Dr. Jane 👋"
        subtitle="Manage nutrition plans, health cases & consultations."
      />

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 sm:gap-5">
        <KpiCard title="Active Farms" value="142" description="Under your care" icon={HeartPulse} tone="primary" />
        <KpiCard title="Nutrition Plans" value="56" description="Active plans" icon={Salad} tone="primary" />
        <KpiCard title="Health Cases" value="18" description="Active cases" icon={MessageSquareText} tone="destructive" />
        <KpiCard title="Consultations" value="24" description="This week" icon={ClipboardList} tone="info" />
        <KpiCard title="Pending Tasks" value="7" description="To review" icon={CheckSquare} tone="warning" />
      </div>

      {/* Hero: Reports Awaiting Review */}
      <div className="mt-6">
        <ReportsAwaitingReview />
      </div>

      {/* Critical Alerts + Farmer Health */}
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <FarmerHealthMonitoring />
        </div>
        <CriticalAlerts />
      </div>

      {/* Knowledge & Research */}
      <div className="mt-6">
        <KnowledgePanel />
      </div>

      {/* Quick Actions */}
      <div className="mt-6">
        <VeterinaryWorkspace />
      </div>
    </>
  );
}