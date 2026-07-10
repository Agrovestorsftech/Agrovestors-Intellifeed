import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Sprout, Loader2, Check } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { ROLE_HOME, SIGNUP_ROLES, type UserRole } from "@/lib/auth/types";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your IntelliFeed360 account" },
      { name: "description", content: "Sign up for IntelliFeed360 and choose your role: Field Agent, Admin Agent (Nutrition & Vet) or Feed Operations." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Exclude<UserRole, "system_admin">>("field_agent");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmMsg, setConfirmMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const result = await signup({ email, password, fullName, role });
    if (result.ok && result.user) {
      navigate({ to: ROLE_HOME[result.user.role], replace: true });
      return;
    }
    setSubmitting(false);
    if (result.error === "confirm-email") {
      setConfirmMsg("Account created. Check your email to confirm, then sign in.");
      return;
    }
    setError(result.error ?? "Signup failed. Please try again.");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
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
          <h1 className="text-xl font-semibold text-foreground">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Join the IntelliFeed360 platform. Pick the role that fits your work.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="fullName" className="text-sm font-medium text-foreground">Full name</label>
              <input
                id="fullName" required disabled={submitting}
                value={fullName} onChange={(e) => setFullName(e.target.value)}
                autoComplete="name" placeholder="Jane Doe"
                className="mt-1.5 block w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
              />
            </div>
            <div>
              <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
              <input
                id="email" type="email" required disabled={submitting}
                value={email} onChange={(e) => setEmail(e.target.value)}
                autoComplete="email" placeholder="you@example.com"
                className="mt-1.5 block w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
              <input
                id="password" type="password" required minLength={8} disabled={submitting}
                value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password" placeholder="At least 8 characters"
                className="mt-1.5 block w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
              />
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-foreground">Choose your role</legend>
              <div className="grid gap-2">
                {SIGNUP_ROLES.map((opt) => {
                  const selected = role === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                        selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <input
                        type="radio" name="role" value={opt.value} checked={selected}
                        onChange={() => setRole(opt.value)}
                        className="sr-only"
                      />
                      <div className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border ${selected ? "border-primary bg-primary text-primary-foreground" : "border-input"}`}>
                        {selected && <Check className="h-3 w-3" />}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">{opt.label}</div>
                        <div className="text-xs text-muted-foreground">{opt.description}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">System Administrator accounts are provisioned separately.</p>
            </fieldset>

            {error && (
              <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
                {error}
              </div>
            )}
            {confirmMsg && (
              <div role="status" className="rounded-lg border border-primary/30 bg-primary/10 px-3.5 py-2.5 text-sm text-foreground">
                {confirmMsg}
              </div>
            )}

            <button
              type="submit" disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-colors hover:bg-primary/90 disabled:opacity-70"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Creating account…" : "Create account"}
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