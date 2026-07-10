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
      accent="warning"
      hint={<>Feed Operations staff sign in here. No account? <a href="/signup" className="text-primary hover:underline">Create one</a>.</>}
    />
  );
}