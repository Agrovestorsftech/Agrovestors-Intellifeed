import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/agent/messages")({
  component: () => (
    <PlaceholderPage
      title="Messages"
      subtitle="Conversations with field agents and farmers."
      sections={["Inbox", "Agent Conversations", "Farmer Communications"]}
    />
  ),
});