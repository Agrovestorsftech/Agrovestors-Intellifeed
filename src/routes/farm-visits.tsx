import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/farm-visits")({
  component: () => (
    <PlaceholderPage
      title={'Farm Visits'}
      subtitle={'Log and review farm visit records.'}
      sections={["Scheduled visits", "Visit records", "Follow-ups"]}
    />
  ),
});
