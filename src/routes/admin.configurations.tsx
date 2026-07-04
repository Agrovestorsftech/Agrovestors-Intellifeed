import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/admin/configurations")({
  component: () => (
    <PlaceholderPage
      title="Configurations"
      subtitle="Global platform configuration."
      sections={[
        "Research Parameters",
        "Species Configuration",
        "Feed Categories",
        "Notification Settings",
        "System Settings",
      ]}
    />
  ),
});