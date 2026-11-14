import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, KeyRound } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/AuthContext";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — IntelliFeed360" },
      { name: "description", content: "Password recovery for IntelliFeed360." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary">
        <KeyRound className="h-5 w-5" aria-hidden="true" />
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">Forgot your password?</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        IntelliFeed360 is running in demo mode, so there are no real passwords to reset. Sign in with any valid email and
        a password of {MIN_PASSWORD_LENGTH}+ characters.
      </p>
      <Link
        to="/login"
        className="mt-8 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to sign in
      </Link>
    </AuthLayout>
  );
}
