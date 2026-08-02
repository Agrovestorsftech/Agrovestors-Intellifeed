import { createFileRoute } from "@tanstack/react-router";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import Analytics from "@/components/dashboard/pages/Analytics";
import { useAnalyticsSeries } from "@/hooks/useDashboard";

export const Route = createFileRoute("/agent/analytics")({
  component: () => {
    const { data, isLoading, error } = useAnalyticsSeries();

    if (error) {
      return (
        <>
          <DashboardHeader title="Analytics" subtitle="Cross-farm analytics and trend reporting" />
          <div className="p-6 text-center text-red-600">
            <p>Failed to load analytics. Please try again later.</p>
          </div>
        </>
      );
    }

    return (
      <>
        <DashboardHeader title="Analytics" subtitle="Cross-farm analytics and trend reporting" />
        <div className="p-6">
          <Analytics data={data || null} isLoading={isLoading} />
        </div>
      </>
    );
  },
});
