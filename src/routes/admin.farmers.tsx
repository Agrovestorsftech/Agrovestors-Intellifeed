import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/admin/farmers")({
  component: () => (
    <PlaceholderPage
      title="Farm Management"
      subtitle="All farms across the network."
      sections={["All Farms", "Farm Profiles", "Farm Images"]}
    />
  ),
});