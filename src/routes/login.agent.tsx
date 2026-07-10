import { createFileRoute } from "@tanstack/react-router";
import { LoginCard } from "@/components/auth/LoginCard";

export const Route = createFileRoute("/login/agent")({
  head: () => ({
    meta: [
      { title: "Agent Portal Login — IntelliFeed360" },
      { name: "description", content: "Sign in to the IntelliFeed360 Agent Portal." },
    ],
  }),
  component: AgentLoginPage,
});

function AgentLoginPage() {
  return (
    <LoginCard
      portal="agent"
      portalName="Agent Portal"
      tagline="Shared login for Field Agents and Admin Agents."
      accent="primary"
      hint={<>Field Agents and Admin Agents (Nutritionists/Vets) sign in here. No account? <a href="/signup" className="text-primary hover:underline">Create one</a>.</>}
    />
  );
}