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
import { TodaysSchedule } from "@/components/dashboard/TodaysSchedule";
import { VisitSummary } from "@/components/dashboard/VisitSummary";
import { RecentActivities } from "@/components/dashboard/RecentActivities";
import { QuickActions } from "@/components/dashboard/QuickActions";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <>
      <DashboardHeader
        title="Welcome, John! 👋"
        subtitle="Here's your field activity summary."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5">
        <StatCard
          title="Today's Visits"
          value="8"
          description="of 12 assigned"
          icon={MapPin}
          tone="primary"
        />
        <StatCard
          title="Completed Visits"
          value="5"
          description="This week"
          icon={CheckCircle2}
          tone="accent"
        />
        <StatCard
          title="Pending Visits"
          value="3"
          description="Today"
          icon={Clock}
          tone="warning"
        />
        <StatCard
          title="Reports Submitted"
          value="12"
          description="This week"
          icon={FileText}
          tone="info"
        />
        <StatCard
          title="New Messages"
          value="4"
          description="Unread"
          icon={Mail}
          tone="destructive"
        />
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
