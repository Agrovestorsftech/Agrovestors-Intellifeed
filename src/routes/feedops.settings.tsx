import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/feedops/settings")({
  component: () => <PlaceholderPage title="settings" subtitle="FeedOps module — coming soon." />,
});
