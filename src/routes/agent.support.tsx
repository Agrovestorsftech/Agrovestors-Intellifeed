import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/agent/support")({
  component: () => (
    <PlaceholderPage
      title="Support"
      subtitle="Help centre, technical support and settings."
      sections={["Help Centre", "Technical Support", "Profile", "Preferences", "Notification Settings"]}
    />
  ),
});