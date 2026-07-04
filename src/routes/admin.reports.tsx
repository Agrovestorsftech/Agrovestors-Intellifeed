import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/admin/reports")({
  component: () => (
    <PlaceholderPage
      title="Reports & Analytics"
      subtitle="Platform-wide reporting and insights."
      sections={[
        "Farmer Reports",
        "Performance Reports",
        "Feed Analytics",
        "Mortality Trends",
        "Financial Reports",
      ]}
    />
  ),
});