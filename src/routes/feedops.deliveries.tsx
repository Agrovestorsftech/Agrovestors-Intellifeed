import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/feedops/deliveries")({
  component: () => <PlaceholderPage title="deliveries" subtitle="FeedOps module — coming soon." />,
});
