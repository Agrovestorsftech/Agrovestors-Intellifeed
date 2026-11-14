import { createFileRoute } from "@tanstack/react-router";
import { LoginCard } from "@/components/auth/LoginCard";

export const Route = createFileRoute("/login/agent")({
  head: () => ({
    meta: [
      { title: "Sign in — IntelliFeed360" },
      { name: "description", content: "Sign in to IntelliFeed360." },
    ],
  }),
  component: () => <LoginCard defaultRole="field_agent" />,
});
