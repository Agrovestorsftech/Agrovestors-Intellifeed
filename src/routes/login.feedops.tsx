import { createFileRoute } from "@tanstack/react-router";
import { LoginCard } from "@/components/auth/LoginCard";

export const Route = createFileRoute("/login/feedops")({
  head: () => ({
    meta: [
      { title: "Sign in — IntelliFeed360" },
      { name: "description", content: "Sign in to IntelliFeed360." },
    ],
  }),
  component: () => <LoginCard defaultRole="feedops" />,
});
