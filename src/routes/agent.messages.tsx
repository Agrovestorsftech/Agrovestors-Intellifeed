import { createFileRoute } from "@tanstack/react-router";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { NotificationInbox } from "@/components/dashboard/NotificationInbox";

export const Route = createFileRoute("/agent/messages")({ component: MessagesPage });

function MessagesPage() {
  return (
    <>
      <DashboardHeader title="Messages" subtitle="Reports to review, health alerts and plan updates." />
      <NotificationInbox />
    </>
  );
}
