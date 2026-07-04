import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/admin/audit-trail")({
  component: () => (
    <PlaceholderPage
      title="Audit Trail"
      subtitle="Login history, activity logs and security events."
      sections={["Login History", "Activity Logs", "Security Events"]}
    />
  ),
});