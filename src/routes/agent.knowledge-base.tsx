import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/agent/knowledge-base")({
  component: () => (
    <PlaceholderPage
      title="Knowledge Base"
      subtitle="Research library, nutrition references and disease protocols."
      sections={["Research Library", "Nutrition References", "Disease Protocols", "Best Practices"]}
    />
  ),
});