import { createFileRoute, Link } from "@tanstack/react-router";
import { KeyRound, Sprout } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Password Recovery — IntelliFeed360" },
      { name: "description", content: "Password recovery for IntelliFeed360." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30 text-primary">
            <Sprout className="h-5 w-5" />
          </div>
          <div className="flex items-baseline">
            <span className="text-2xl font-semibold tracking-tight">IntelliFeed</span>
            <span className="text-2xl font-semibold text-primary tracking-tight">360</span>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <KeyRound className="h-5 w-5" />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-foreground">Password recovery</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Password recovery will be available in a future update.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link
              to="/login/agent"
              className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90"
            >
              Return to Login
            </Link>
          </div>
          <div className="mt-4 flex justify-center gap-4 text-xs text-muted-foreground">
            <Link to="/login/admin" className="hover:text-foreground">Admin Portal</Link>
            <Link to="/login/feedops" className="hover:text-foreground">FeedOps Portal</Link>
          </div>
        </div>
      </div>
    </div>
  );
}