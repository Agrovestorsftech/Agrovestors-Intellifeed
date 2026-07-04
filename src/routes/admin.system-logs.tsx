import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/admin/system-logs")({
  component: () => (
    <PlaceholderPage
      title="System Logs"
      subtitle="Platform-wide event and activity logs."
      sections={["Activity Logs", "Login History", "Security Events"]}
    />
  ),
});