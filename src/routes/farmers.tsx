import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/farmers")({
  component: () => (
    <PlaceholderPage
      title={'Farmers'}
      subtitle={'Manage the farmers in your territory.'}
      sections={["All farmers", "Farmer profile", "Farm history", "Farm images"]}
    />
  ),
});
