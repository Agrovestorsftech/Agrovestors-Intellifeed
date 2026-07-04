import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/reports")({
  component: () => (
    <PlaceholderPage
      title={'Reports'}
      subtitle={'Field reports submitted, pending, and drafts.'}
      sections={["Pending reports", "Submitted reports", "Draft reports"]}
    />
  ),
});
