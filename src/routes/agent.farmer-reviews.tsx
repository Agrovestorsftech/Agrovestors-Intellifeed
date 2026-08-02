import { createFileRoute } from "@tanstack/react-router";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import FarmerReviews from "@/components/dashboard/pages/FarmerReviews";
import { useFarmersWithReportSummary } from "@/hooks/useDashboard";

export const Route = createFileRoute("/agent/farmer-reviews")({
  component: () => {
    const { data = [], isLoading, error } = useFarmersWithReportSummary(50);

    if (error) {
      return (
        <>
          <DashboardHeader title="Farmer Reviews" subtitle="Review submissions from farmers across all assigned farms" />
          <div className="p-6 text-center text-red-600">
            <p>Failed to load farmer reviews. Please try again later.</p>
          </div>
        </>
      );
    }

    return (
      <>
        <DashboardHeader title="Farmer Reviews" subtitle="Review submissions from farmers across all assigned farms" />
        <div className="p-6">
          <FarmerReviews data={data} isLoading={isLoading} />
        </div>
      </>
    );
  },
});
