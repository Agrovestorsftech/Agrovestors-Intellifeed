import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useAuth, isValidEmail, MIN_PASSWORD_LENGTH, AUTH_MODE } from "@/lib/auth/AuthContext";
import { ROLE_HOME, ROLE_SIGNUP, type UserRole } from "@/lib/auth/types";
import { AuthLayout } from "./AuthLayout";
import { Field, FormAlert, PasswordInput, PortalBadge, ROLE_META, inputClass } from "./fields";

/** Sample credentials per role for the "fill demo account" shortcut. */
const DEMO_EMAIL: Record<UserRole, string> = {
  field_agent: "amina.yusuf@demo.intellifeed360.com",
  admin_agent: "dr.ada.obi@demo.intellifeed360.com",
  feedops: "tunde.ops@demo.intellifeed360.com",
  system_admin: "admin@demo.intellifeed360.com",
};
const DEMO_PASSWORD = "demo1234";

// Demo mode validates email + password locally; api mode signs in against the
// backend and may ask for an emailed code on a new device (see AuthContext).
// The role comes from the route (/login, /login/agent, /login/feedops, /login/admin).
export function LoginCard({ role }: { role: UserRole }) {
  const { login, verifyDevice } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"credentials" | "code">("credentials");
  const [code, setCode] = useState("");

  const emailError =
    touched && !isValidEmail(email)
      ? email
        ? "Enter a valid email, like name@example.com."
        : "Enter your email."
      : null;
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
    if (result.stepUp) {
      setSubmitting(false);
      setPassword("");
      setStep("code");
      return;
    }
    if (!result.ok || !result.user) {
      setSubmitting(false);
      setFormError(result.error ?? "Couldn't sign in. Please try again.");
      return;
    }
    navigate({ to: ROLE_HOME[result.user.role], replace: true });
  };

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setFormError(null);
    if (!code.trim()) {
      setFormError("Enter the code from your email.");
      document.getElementById("code")?.focus();
      return;
    }
    setSubmitting(true);
    const result = await verifyDevice(code);
    if (!result.ok || !result.user) {
      setSubmitting(false);
      setFormError(result.error ?? "That code didn't work. Check it and try again.");
      return;
    }
    navigate({ to: ROLE_HOME[result.user.role], replace: true });
  };

  const backToCredentials = () => {
    setStep("credentials");
    setCode("");
    setFormError(null);
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
        <PortalBadge role={role} />
        {step === "code" ? (
          <>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
              Check your email
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              This is a new device, so we emailed a sign-in code to{" "}
              <span className="font-medium text-foreground">{email.trim()}</span>. Enter it below.
            </p>
            <form onSubmit={handleVerify} className="mt-8 space-y-5" noValidate>
              <Field id="code" label="Sign-in code" error={null}>
                <input
                  id="code"
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  maxLength={12}
                  disabled={submitting}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className={`${inputClass} tracking-widest`}
                />
              </Field>
              {formError && <FormAlert>{formError}</FormAlert>}
              <button
                type="submit"
                disabled={submitting}
                className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-70 ${meta.accent.button}`}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Verifying…
                  </>
                ) : (
                  "Verify and sign in"
                )}
              </button>
              <button
                type="button"
                onClick={backToCredentials}
                disabled={submitting}
                className="w-full rounded text-center text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Use a different account
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Sign in to your IntelliFeed360 workspace.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
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
                  <Link
                    to="/forgot-password"
                    className="rounded text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
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
                    Sign in
                    <ArrowRight
                      className="h-4 w-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </>
                )}
              </button>
            </form>

            {AUTH_MODE === "demo" && (
              <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/40 p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <div className="min-w-0 flex-1 text-xs text-muted-foreground">
                    <p>
                      <span className="font-medium text-foreground">Demo mode.</span> Any valid
                      email and a password of {MIN_PASSWORD_LENGTH}+ characters signs you in with
                      sample data.
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
            )}
          </>
        )}

        {AUTH_MODE === "demo" && ROLE_SIGNUP[role] && (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            New to IntelliFeed360?{" "}
            <Link
              to={ROLE_SIGNUP[role]}
              className="rounded font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Create an account
            </Link>
          </p>
        )}
      </div>
    </AuthLayout>
  );
}
