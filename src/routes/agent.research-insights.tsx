import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/agent/research-insights")({
  component: () => (
    <PlaceholderPage
      title="Research Insights"
      subtitle="Performance, nutrition and species-level analytics."
      sections={["Performance Analytics", "Nutrition Analytics", "Species Insights"]}
    />
  ),
});