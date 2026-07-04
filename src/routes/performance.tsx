import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/performance")({
  component: () => (
    <PlaceholderPage
      title={'My Performance'}
      subtitle={'Track your KPIs and satisfaction ratings.'}
      sections={["Monthly KPIs", "Visit completion rate", "Farmer satisfaction"]}
    />
  ),
});
