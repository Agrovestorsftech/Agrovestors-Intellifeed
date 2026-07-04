import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/feedops/inventory")({
  component: () => <PlaceholderPage title="inventory" subtitle="FeedOps module — coming soon." />,
});
