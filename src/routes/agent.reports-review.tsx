import { createFileRoute } from "@tanstack/react-router";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import ReportsReview from "@/components/dashboard/pages/ReportsReview";
import { useVisitReportsForReview } from "@/hooks/useDashboard";

export const Route = createFileRoute("/agent/reports-review")({
  component: () => {
    const { data = [], isLoading, error } = useVisitReportsForReview(50);

    if (error) {
      return (
        <>
          <DashboardHeader title="Reports Review" subtitle="Review, approve and archive farmer reports" />
          <div className="p-6 text-center text-red-600">
            <p>Failed to load reports. Please try again later.</p>
          </div>
        </>
      );
    }

    return (
      <>
        <DashboardHeader title="Reports Review" subtitle="Review, approve and archive farmer reports" />
        <div className="p-6">
          <ReportsReview data={data} isLoading={isLoading} />
        </div>
      </>
    );
  },
});
