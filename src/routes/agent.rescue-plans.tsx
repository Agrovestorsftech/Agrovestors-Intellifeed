import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/agent/rescue-plans")({
  component: () => (
    <PlaceholderPage
      title="Rescue Plans"
      subtitle="Develop and track recovery plans for at-risk farms."
      sections={["Active Rescue Plans", "Recovery Tracking", "Completed Cases"]}
    />
  ),
});