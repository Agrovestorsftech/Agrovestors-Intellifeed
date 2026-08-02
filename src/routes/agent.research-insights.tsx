import { createFileRoute } from "@tanstack/react-router";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import ResearchInsights from "@/components/dashboard/pages/ResearchInsights";
import { useResearchInsights } from "@/hooks/useDashboard";

export const Route = createFileRoute("/agent/research-insights")({
  component: () => {
    const { data, isLoading, error } = useResearchInsights();

    if (error) {
      return (
        <>
          <DashboardHeader title="Research Insights" subtitle="Performance, nutrition and species-level analytics" />
          <div className="p-6 text-center text-red-600">
            <p>Failed to load insights. Please try again later.</p>
          </div>
        </>
      );
    }

    return (
      <>
        <DashboardHeader title="Research Insights" subtitle="Performance, nutrition and species-level analytics" />
        <div className="p-6">
          <ResearchInsights data={data || null} isLoading={isLoading} />
        </div>
      </>
    );
  },
});
