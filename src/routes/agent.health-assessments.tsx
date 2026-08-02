import { createFileRoute } from "@tanstack/react-router";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import HealthAssessments from "@/components/dashboard/pages/HealthAssessments";
import { useHealthCases } from "@/hooks/useDashboard";

export const Route = createFileRoute("/agent/health-assessments")({
  component: () => {
    const { data = [], isLoading, error } = useHealthCases(50);

    if (error) {
      return (
        <>
          <DashboardHeader title="Health Assessments" subtitle="Track and manage animal health cases" />
          <div className="p-6 text-center text-red-600">
            <p>Failed to load health cases. Please try again later.</p>
          </div>
        </>
      );
    }

    return (
      <>
        <DashboardHeader title="Health Assessments" subtitle="Track and manage animal health cases" />
        <div className="p-6">
          <HealthAssessments data={data} isLoading={isLoading} />
        </div>
      </>
    );
  },
});
