import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/feedops/quality-control")({
  component: () => <PlaceholderPage title="quality-control" subtitle="FeedOps module — coming soon." />,
});
