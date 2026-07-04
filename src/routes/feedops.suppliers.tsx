import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/feedops/suppliers")({
  component: () => <PlaceholderPage title="suppliers" subtitle="FeedOps module — coming soon." />,
});
