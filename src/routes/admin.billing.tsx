import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/dashboard/PlaceholderPage";

export const Route = createFileRoute("/admin/billing")({
  component: () => (
    <PlaceholderPage
      title="Subscription & Billing"
      subtitle="Manage plans, invoices and payments."
      sections={["Subscriptions", "Invoices", "Payments"]}
    />
  ),
});