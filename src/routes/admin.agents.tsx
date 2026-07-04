import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/admin/agents")({
  component: () => (
    <PlaceholderPage
      title="Agents"
      subtitle="Field agents and admin agents across the platform."
      sections={["Field Agents", "Admin Agents", "Assignments"]}
    />
  ),
});