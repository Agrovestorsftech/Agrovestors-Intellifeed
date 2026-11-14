import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useAuth, isValidEmail, MIN_PASSWORD_LENGTH } from "@/lib/auth/AuthContext";
import { ROLE_HOME, type UserRole } from "@/lib/auth/types";
import { AuthLayout } from "./AuthLayout";
import { Field, FormAlert, PasswordInput, ROLE_META, RolePicker, inputClass } from "./fields";

const ALL_ROLES: UserRole[] = ["field_agent", "admin_agent", "feedops", "system_admin"];

/** Sample credentials per role for the "fill demo account" shortcut. */
const DEMO_EMAIL: Record<UserRole, string> = {
  field_agent: "amina.yusuf@demo.intellifeed360.com",
  admin_agent: "dr.ada.obi@demo.intellifeed360.com",
  feedops: "tunde.ops@demo.intellifeed360.com",
  system_admin: "admin@demo.intellifeed360.com",
};
const DEMO_PASSWORD = "demo1234";

// DEMO MODE: email + password are validated locally only (see AuthContext).
export function LoginCard({ defaultRole = "field_agent" }: { defaultRole?: UserRole }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const emailError = touched && !isValidEmail(email) ? (email ? "Enter a valid email, like name@example.com." : "Enter your email.") : null;
  const passwordError =
    touched && password.length < MIN_PASSWORD_LENGTH
      ? password
        ? `Use at least ${MIN_PASSWORD_LENGTH} characters.`
        : "Enter your password."
      : null;

  const meta = ROLE_META[role];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setTouched(true);
    setFormError(null);
    if (!isValidEmail(email) || password.length < MIN_PASSWORD_LENGTH) {
      document.getElementById(!isValidEmail(email) ? "email" : "password")?.focus();
      return;
    }
    setSubmitting(true);
    const result = await login(email, password, role);
    if (!result.ok || !result.user) {
      setSubmitting(false);
      setFormError(result.error ?? "Couldn't sign in. Please try again.");
      return;
    }
    navigate({ to: ROLE_HOME[result.user.role], replace: true });
  };

  const fillDemo = () => {
    setEmail(DEMO_EMAIL[role]);
    setPassword(DEMO_PASSWORD);
    setTouched(false);
    setFormError(null);
  };

  return (
    <AuthLayout>
      <div className={meta.accent.scope ?? ""}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Sign in to your IntelliFeed360 workspace.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
          <RolePicker roles={ALL_ROLES} value={role} onChange={setRole} disabled={submitting} />

          <Field id="email" label="Email" error={emailError}>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              spellCheck={false}
              required
              disabled={submitting}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-invalid={!!emailError}
              aria-describedby={emailError ? "email-error" : undefined}
              className={inputClass}
            />
          </Field>

          <Field
            id="password"
            label="Password"
            error={passwordError}
            trailing={
              <Link to="/forgot-password" className="rounded text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                Forgot password?
              </Link>
            }
          >
            <PasswordInput
              id="password"
              name="password"
              autoComplete="current-password"
              required
              disabled={submitting}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? "password-error" : undefined}
            />
          </Field>

          {formError && <FormAlert>{formError}</FormAlert>}

          <button
            type="submit"
            disabled={submitting}
            className={`group inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-70 ${meta.accent.button}`}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Signing in…
              </>
            ) : (
              <>
                Sign in as {meta.label}
                <ArrowRight className="h-4 w-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5" aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/40 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0 flex-1 text-xs text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Demo mode.</span> Any valid email and a password of{" "}
                {MIN_PASSWORD_LENGTH}+ characters signs you in with sample data.
              </p>
              <button
                type="button"
                onClick={fillDemo}
                disabled={submitting}
                className="mt-2 inline-flex items-center gap-1 rounded font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Fill in a {meta.label} demo account
              </button>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          New to IntelliFeed360?{" "}
          <Link to="/signup" className="rounded font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Create an account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
