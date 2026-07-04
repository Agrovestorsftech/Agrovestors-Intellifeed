import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/feedops/orders")({
  component: () => <PlaceholderPage title="orders" subtitle="FeedOps module — coming soon." />,
});
