import { createFileRoute } from "@tanstack/react-router";
import { LoginCard } from "@/components/auth/LoginCard";

export const Route = createFileRoute("/login/admin")({
  head: () => ({
    meta: [
      { title: "Admin Portal Login — IntelliFeed360" },
      { name: "description", content: "Sign in to the IntelliFeed360 Admin Portal." },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  return (
    <LoginCard
      portal="admin"
      portalName="Admin Portal"
      tagline="Sign in to manage the IntelliFeed360 platform."
      identifierLabel="Email"
      identifierPlaceholder="admin@intellifeed360.com"
      identifierType="email"
      identifierAutoComplete="email"
      accent="info"
      hint={<><strong className="text-foreground">Demo:</strong> admin@intellifeed360.com / Password123</>}
    />
  );
}