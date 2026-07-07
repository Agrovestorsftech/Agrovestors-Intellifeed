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
      identifierLabel="Agent ID"
      identifierPlaceholder="AGT001"
      accent="primary"
      hint={<><strong className="text-foreground">Demo:</strong> AGT001 (Field Agent) or ADM001 (Admin Agent) · Password123</>}
    />
  );
}