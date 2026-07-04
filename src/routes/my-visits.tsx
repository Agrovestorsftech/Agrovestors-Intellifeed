import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/my-visits")({
  component: () => (
    <PlaceholderPage
      title={'My Visits'}
      subtitle={'Your assigned farm visits at a glance.'}
      sections={["Today's visits", "Upcoming visits", "Completed visits", "Visit details"]}
    />
  ),
});
