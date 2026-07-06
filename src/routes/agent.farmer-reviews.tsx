import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/agent/farmer-reviews")({
  component: () => (
    <PlaceholderPage
      title="Farmer Reviews"
      subtitle="Review submissions from farmers across all assigned farms."
      sections={["Pending Reviews", "Completed Reviews", "Flagged Reports"]}
    />
  ),
});