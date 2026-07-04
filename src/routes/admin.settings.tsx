import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/admin/settings")({
  component: () => (
    <PlaceholderPage
      title="Settings"
      subtitle="Company profile, branding and system preferences."
      sections={[
        "Company Profile",
        "Branding",
        "General Settings",
        "API Keys",
        "System Preferences",
      ]}
    />
  ),
});