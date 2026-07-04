import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/admin/roles")({
  component: () => (
    <PlaceholderPage
      title="Roles & Permissions"
      subtitle="Define roles and manage access across the platform."
      sections={["Create Role", "Assign Permissions", "Manage Access"]}
    />
  ),
});