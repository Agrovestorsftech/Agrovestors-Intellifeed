import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Sprout, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth, MIN_PASSWORD_LENGTH } from "@/lib/auth/AuthContext";
import { ROLE_HOME, SIGNUP_ROLES, type UserRole } from "@/lib/auth/types";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your IntelliFeed360 account" },
      { name: "description", content: "Create an IntelliFeed360 account." },
    ],
  }),
  component: SignupPage,
});

const inputClass =
  "mt-1.5 block w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60";

// DEMO MODE: no backend. "Signing up" just signs you in with the chosen role.
// system_admin is intentionally not offered (SIGNUP_ROLES excludes it).
function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Exclude<UserRole, "system_admin">>("field_agent");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    if (!firstName.trim() || !lastName.trim()) {
      setError("Enter your first and last name.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const result = await login(email, password, role, `${firstName.trim()} ${lastName.trim()}`);
    if (!result.ok || !result.user) {
      setSubmitting(false);
      setError(result.error ?? "Couldn't create account. Please try again.");
      return;
    }
    navigate({ to: ROLE_HOME[result.user.role], replace: true });
  };

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
          <h1 className="text-xl font-semibold text-foreground">Create an account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Demo mode — no real account is created. You'll be signed in straight away with sample data.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="text-sm font-medium text-foreground">First name</label>
                <input
                  id="firstName" required disabled={submitting}
                  value={firstName} onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name" placeholder="Amina" className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="lastName" className="text-sm font-medium text-foreground">Last name</label>
                <input
                  id="lastName" required disabled={submitting}
                  value={lastName} onChange={(e) => setLastName(e.target.value)}
                  autoComplete="family-name" placeholder="Yusuf" className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
              <input
                id="email" type="email" required disabled={submitting}
                value={email} onChange={(e) => setEmail(e.target.value)}
                autoComplete="email" placeholder="you@example.com" className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
              <input
                id="password" type="password" required disabled={submitting}
                value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password" placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
                className={inputClass}
              />
            </div>

            <fieldset>
              <legend className="text-sm font-medium text-foreground">Role</legend>
              <div className="mt-1.5 space-y-2">
                {SIGNUP_ROLES.map((r) => (
                  <label
                    key={r.value}
                    className={`flex cursor-pointer gap-3 rounded-lg border px-3.5 py-2.5 ${
                      role === r.value ? "border-primary bg-primary/5" : "border-input"
                    }`}
                  >
                    <input
                      type="radio" name="role" value={r.value} className="mt-1"
                      checked={role === r.value} onChange={() => setRole(r.value)} disabled={submitting}
                    />
                    <span>
                      <span className="block text-sm font-medium text-foreground">{r.label}</span>
                      <span className="block text-xs text-muted-foreground">{r.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

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
