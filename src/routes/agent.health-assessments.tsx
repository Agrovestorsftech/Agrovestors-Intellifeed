import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/agent/health-assessments")({
  component: () => (
    <PlaceholderPage
      title="Health Assessments"
      subtitle="Monitor livestock health across all assigned farms."
      sections={["Farm Health", "Disease Monitoring", "Performance Tracking"]}
    />
  ),
});