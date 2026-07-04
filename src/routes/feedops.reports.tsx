import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/feedops/reports")({
  component: () => <PlaceholderPage title="reports" subtitle="FeedOps module — coming soon." />,
});
