import { createFileRoute } from "@tanstack/react-router";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import RescuePlans from "@/components/dashboard/pages/RescuePlans";
import { useRescuePlans } from "@/hooks/useDashboard";

export const Route = createFileRoute("/agent/rescue-plans")({
  component: () => {
    const { data = [], isLoading, error } = useRescuePlans(50);

    if (error) {
      return (
        <>
          <DashboardHeader title="Rescue Plans" subtitle="Develop and track recovery plans for at-risk farms" />
          <div className="p-6 text-center text-red-600">
            <p>Failed to load rescue plans. Please try again later.</p>
          </div>
        </>
      );
    }

    return (
      <>
        <DashboardHeader title="Rescue Plans" subtitle="Develop and track recovery plans for at-risk farms" />
        <div className="p-6">
          <RescuePlans data={data} isLoading={isLoading} />
        </div>
      </>
    );
  },
});
