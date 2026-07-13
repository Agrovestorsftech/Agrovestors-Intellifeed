import { createFileRoute } from "@tanstack/react-router";
import {
  MapPin,
  CheckCircle2,
  Clock,
  FileText,
  Mail,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { useFieldKpis } from "@/hooks/useDashboard";
import { TodaysSchedule } from "@/components/dashboard/TodaysSchedule";
import { VisitSummary } from "@/components/dashboard/VisitSummary";
import { RecentActivities } from "@/components/dashboard/RecentActivities";
import { QuickActions } from "@/components/dashboard/QuickActions";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data, isLoading } = useFieldKpis();
  return (
    <>
      <DashboardHeader
        title="Welcome, John! 👋"
        subtitle="Here's your field activity summary."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
        <StatCard title="Today's Visits" value={data?.todayVisits ?? 0} description={`of ${data?.assigned ?? 0} assigned`} icon={MapPin} tone="primary" loading={isLoading} />
        <StatCard title="Completed" value={data?.completedThisWeek ?? 0} description="This week" icon={CheckCircle2} tone="accent" loading={isLoading} />
        <StatCard title="Pending Reports" value={data?.pendingReports ?? 0} description="Awaiting review" icon={Clock} tone="warning" loading={isLoading} />
        <StatCard title="Assigned Farmers" value={data?.assigned ?? 0} description="Total farmers" icon={FileText} tone="info" loading={isLoading} />
        <StatCard title="Urgent Alerts" value={data?.urgentAlerts ?? 0} description="Critical/high" icon={Mail} tone="destructive" loading={isLoading} />
      </div>

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <TodaysSchedule />
        </div>
        <div className="space-y-6">
          <VisitSummary />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <QuickActions />
        </div>
        <RecentActivities />
      </div>
    </>
  );
}
