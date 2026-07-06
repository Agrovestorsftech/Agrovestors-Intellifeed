import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/agent/reports-review")({
  component: () => (
    <PlaceholderPage
      title="Reports Review"
      subtitle="Review, approve and archive farmer reports."
      sections={["Pending Reports", "Reviewed Reports", "Farmer History"]}
    />
  ),
});