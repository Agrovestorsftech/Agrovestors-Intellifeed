import { createFileRoute } from "@tanstack/react-router";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { NotificationInbox } from "@/components/dashboard/NotificationInbox";

export const Route = createFileRoute("/messages")({ component: MessagesPage });

function MessagesPage() {
  return (
    <>
      <DashboardHeader title="Messages" subtitle="Updates about your visits, reports, orders and tasks." />
      <NotificationInbox />
    </>
  );
}
