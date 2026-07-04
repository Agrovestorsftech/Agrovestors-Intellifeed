import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/admin/users")({
  component: () => (
    <PlaceholderPage
      title="User Management"
      subtitle="Manage all platform users across roles."
      sections={[
        "All Users",
        "Farmers",
        "Agents",
        "FeedOps",
        "Administrators",
        "User Details",
      ]}
    />
  ),
});