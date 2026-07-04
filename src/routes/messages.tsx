import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/messages")({
  component: () => (
    <PlaceholderPage
      title={'Messages'}
      subtitle={'Talk to admins, farmers, and your team.'}
      sections={["Inbox", "Conversation", "Notifications"]}
    />
  ),
});
