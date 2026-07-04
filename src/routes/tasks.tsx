import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/tasks")({
  component: () => (
    <PlaceholderPage
      title={'Tasks'}
      subtitle={'Everything assigned and completed.'}
      sections={["Assigned tasks", "Completed tasks"]}
    />
  ),
});
