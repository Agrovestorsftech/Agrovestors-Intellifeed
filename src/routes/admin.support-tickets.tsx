import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/admin/support-tickets")({
  component: () => (
    <PlaceholderPage
      title="Support Tickets"
      subtitle="Track and resolve platform support issues."
      sections={["Support Tickets", "Complaints", "Issue Tracking"]}
    />
  ),
});