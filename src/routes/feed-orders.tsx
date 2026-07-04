import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/feed-orders")({
  component: () => (
    <PlaceholderPage
      title={'Feed Orders'}
      subtitle={'Feed orders assigned to you and their delivery status.'}
      sections={["Orders assigned", "Delivery status"]}
    />
  ),
});
