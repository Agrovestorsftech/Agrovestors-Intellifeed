import { createFileRoute, Link } from "@tanstack/react-router";
import { Sprout } from "lucide-react";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your IntelliFeed360 account" },
      { name: "description", content: "Account creation for IntelliFeed360." },
    ],
  }),
  component: SignupPage,
});

// Self-signup is intentionally disabled pending a backend decision.
//
// IntelliFeed360's API only exposes `POST /farmers/register` for self-service
// account creation, and even that endpoint's request/response body isn't
// documented in the spec we have. There is no general "create an
// agent/nutritionist/admin account" endpoint at all — those accounts appear
// to be provisioned some other way (admin dashboard, backend seeding, etc).
//
// Rather than ship a form that pretends to create accounts it can't, this
// page is a placeholder until that's resolved. See MIGRATION_PLAN.md,
// "Known gaps" #1/#4 and Phase 2 notes.
function SignupPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-primary/30 bg-primary/15 text-primary">
            <Sprout className="h-5 w-5" />
          </div>
          <div className="flex items-baseline">
            <span className="text-2xl font-semibold tracking-tight">IntelliFeed</span>
            <span className="text-2xl font-semibold text-primary tracking-tight">360</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm text-center">
          <h1 className="text-xl font-semibold text-foreground">Self-signup isn't available yet</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Account creation now goes through IntelliFeed360, and it doesn't currently expose a
            general signup endpoint for this app to call. If you already have an account, sign in
            below — otherwise reach out to your administrator to get one created.
          </p>
          <Link
            to="/login/agent"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-colors hover:bg-primary/90"
          >
            Go to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
