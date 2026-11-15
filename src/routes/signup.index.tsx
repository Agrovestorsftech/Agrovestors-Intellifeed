import { createFileRoute } from "@tanstack/react-router";
import { SignupCard } from "@/components/auth/SignupCard";

export const Route = createFileRoute("/signup/")({
  head: () => ({
    meta: [
      { title: "Create your account — IntelliFeed360" },
      { name: "description", content: "Create an IntelliFeed360 account." },
    ],
  }),
  component: () => <SignupCard role="field_agent" />,
});
