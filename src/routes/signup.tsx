import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Sprout, Loader2 } from "lucide-react";
import { useState } from "react";
import { registerFarmer, type Role430 } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

const TEST_ROLES: { value: Role430; label: string }[] = [
  { value: "farmer", label: "Farmer" },
  { value: "agent", label: "Agent" },
  { value: "nutritionist", label: "Nutritionist" },
  { value: "admin", label: "Admin" },
  { value: "investor", label: "Investor" },
];

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your IntelliFeed360 account" },
      { name: "description", content: "Register as a farmer on IntelliFeed360." },
    ],
  }),
  component: SignupPage,
});

// Self-registration via POST /farmers/register — the only registration
// endpoint that exists in the API spec, so it's also being used here as a
// TESTING-ONLY way to create accounts of any role. The `role` field on the
// payload is UNCONFIRMED to actually override the created account's role
// (the backend may just always create a farmer regardless of what's sent).
// After registering, check the resulting user's role via /auth/me and
// report back if it doesn't match what was picked here.
//
// IMPORTANT CAVEAT: this is the ONLY self-signup endpoint in the API spec,
// and its request/response body isn't documented there either (same
// drf-spectacular gap as the OTP endpoints). The fields below are a best
// guess built from the User + FarmerProfile schemas. If the backend
// rejects this payload, check the error response — DRF validation errors
// usually name the exact field it expected — and fix `registerFarmer` in
// src/lib/api/auth.ts (only one place to change).
//
// NOTE: This is test-account creation, not a real production signup flow —
// don't leave the role picker here once real self-signup rules exist.
// See MIGRATION_PLAN.md gap #6.
function SignupPage() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("+234 ");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role430>("farmer");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await registerFarmer({
        phone: phone.replace(/\s+/g, ""),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        role,
        ...(email.trim() ? { email: email.trim() } : {}),
      });
      setDone(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Registration failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm text-center">
            <h1 className="text-xl font-semibold text-foreground">You're registered</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in with the phone number or email you just used to verify your account.
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

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-foreground">Create a test account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Testing only — this registers through the farmer signup endpoint but lets you pick any
            role below. Whether the backend actually honors that role isn't confirmed yet.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="text-sm font-medium text-foreground">First name</label>
                <input
                  id="firstName" required disabled={submitting}
                  value={firstName} onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name" placeholder="Amina"
                  className="mt-1.5 block w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="text-sm font-medium text-foreground">Last name</label>
                <input
                  id="lastName" required disabled={submitting}
                  value={lastName} onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name" placeholder="Yusuf"
                  className="mt-1.5 block w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="text-sm font-medium text-foreground">Phone number</label>
              <input
                id="phone" type="tel" required disabled={submitting}
                value={phone} onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel" placeholder="+234 800 000 0000"
                className="mt-1.5 block w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
              />
            </div>

            <div>
              <label htmlFor="role" className="text-sm font-medium text-foreground">Role</label>
              <select
                id="role" disabled={submitting}
                value={role} onChange={(e) => setRole(e.target.value as Role430)}
                className="mt-1.5 block w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
              >
                {TEST_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-medium text-foreground">Email (optional)</label>
              <input
                id="email" type="email" disabled={submitting}
                value={email} onChange={(e) => setEmail(e.target.value)}
                autoComplete="email" placeholder="you@example.com"
                className="mt-1.5 block w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
              />
            </div>

            {error && (
              <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit" disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-colors hover:bg-primary/90 disabled:opacity-70"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Registering…" : "Register"}
            </button>

            <p className="text-center text-xs text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login/agent" className="text-primary hover:underline">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}