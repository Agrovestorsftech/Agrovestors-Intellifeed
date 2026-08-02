import { createFileRoute } from "@tanstack/react-router";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import SupportTickets from "@/components/dashboard/pages/SupportTickets";
import { useSupportTicketsForPage } from "@/hooks/useDashboard";

export const Route = createFileRoute("/agent/support")({
  component: () => {
    const { data = [], isLoading, error } = useSupportTicketsForPage(50);

    if (error) {
      return (
        <>
          <DashboardHeader title="Support Tickets" subtitle="Manage customer support requests" />
          <div className="p-6 text-center text-red-600">
            <p>Failed to load support tickets. Please try again later.</p>
          </div>
        </>
      );
    }

    return (
      <>
        <DashboardHeader title="Support Tickets" subtitle="Manage customer support requests" />
        <div className="p-6">
          <SupportTickets data={data} isLoading={isLoading} />
        </div>
      </>
    );
  },
});
