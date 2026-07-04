import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/feedops/stock-transfers")({
  component: () => <PlaceholderPage title="stock-transfers" subtitle="FeedOps module — coming soon." />,
});
