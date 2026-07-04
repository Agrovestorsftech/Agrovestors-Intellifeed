import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/feedops/production")({
  component: () => <PlaceholderPage title="production" subtitle="FeedOps module — coming soon." />,
});
