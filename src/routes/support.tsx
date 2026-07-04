import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/support")({
  component: () => (
    <PlaceholderPage
      title={'Support'}
      subtitle={'Get help fast when you need it.'}
      sections={["Help centre", "Emergency cases"]}
    />
  ),
});
