import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/admin/feedops")({
  component: () => (
    <PlaceholderPage
      title="FeedOps"
      subtitle="Feed production and dispatch operations."
      sections={["Orders", "Production Queue", "Dispatch", "Inventory Overview"]}
    />
  ),
});