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
      accent="info"
      hint={<>System Administrator access. Contact support if you need an account.</>}
    />
  );
}