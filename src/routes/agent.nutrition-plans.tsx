import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/agent/nutrition-plans")({
  component: () => (
    <PlaceholderPage
      title="Nutrition Plans"
      subtitle="Create, update and manage nutrition plans."
      sections={["All Plans", "Draft Plans", "Approved Plans", "Plan History"]}
    />
  ),
});