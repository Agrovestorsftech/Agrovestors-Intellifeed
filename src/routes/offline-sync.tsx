import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/offline-sync")({
  component: () => (
    <PlaceholderPage
      title={'Offline Sync'}
      subtitle={'Sync your field data when you'\''re back online.'}
      sections={["Pending uploads", "Last sync", "Sync status"]}
    />
  ),
});
