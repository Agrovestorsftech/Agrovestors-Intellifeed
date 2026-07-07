import { createFileRoute } from "@tanstack/react-router";
import { LoginCard } from "@/components/auth/LoginCard";

export const Route = createFileRoute("/login/feedops")({
  head: () => ({
    meta: [
      { title: "FeedOps Portal Login — IntelliFeed360" },
      { name: "description", content: "Sign in to the IntelliFeed360 FeedOps Portal." },
    ],
  }),
  component: FeedOpsLoginPage,
});

function FeedOpsLoginPage() {
  return (
    <LoginCard
      portal="feedops"
      portalName="FeedOps Portal"
      tagline="Sign in to manage feed production, inventory and deliveries."
      identifierLabel="Staff ID"
      identifierPlaceholder="FOP001"
      accent="warning"
      hint={<><strong className="text-foreground">Demo:</strong> FOP001 / Password123</>}
    />
  );
}