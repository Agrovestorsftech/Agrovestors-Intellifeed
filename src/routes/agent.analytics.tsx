import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/agent/analytics")({
  component: () => (
    <PlaceholderPage
      title="Analytics"
      subtitle="Cross-farm analytics and trend reporting."
      sections={["Overview", "Trends", "Reports"]}
    />
  ),
});