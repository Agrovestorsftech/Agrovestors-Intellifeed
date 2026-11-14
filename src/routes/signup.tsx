import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { useAuth, isValidEmail, MIN_PASSWORD_LENGTH } from "@/lib/auth/AuthContext";
import { ROLE_HOME, type UserRole } from "@/lib/auth/types";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Field, FormAlert, PasswordInput, ROLE_META, RolePicker, StrengthMeter, inputClass } from "@/components/auth/fields";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your account — IntelliFeed360" },
      { name: "description", content: "Create an IntelliFeed360 account." },
    ],
  }),
  component: SignupPage,
});

// system_admin is intentionally not self-assignable.
const SIGNUP_ROLE_OPTIONS: UserRole[] = ["field_agent", "admin_agent", "feedops"];

// DEMO MODE: no backend. "Signing up" signs you in with the chosen role.
function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("field_agent");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const errors = {
    firstName: touched && !firstName.trim() ? "Enter your first name." : null,
    lastName: touched && !lastName.trim() ? "Enter your last name." : null,
    email: touched && !isValidEmail(email) ? (email ? "Enter a valid email, like name@example.com." : "Enter your email.") : null,
    password: touched && password.length < MIN_PASSWORD_LENGTH ? `Use at least ${MIN_PASSWORD_LENGTH} characters.` : null,
  };
  const meta = ROLE_META[role];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setTouched(true);
    setFormError(null);
    const firstInvalid = !firstName.trim()
      ? "firstName"
      : !lastName.trim()
        ? "lastName"
        : !isValidEmail(email)
          ? "email"
          : password.length < MIN_PASSWORD_LENGTH
            ? "password"
            : null;
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }
    setSubmitting(true);
    const result = await login(email, password, role, `${firstName.trim()} ${lastName.trim()}`);
    if (!result.ok || !result.user) {
      setSubmitting(false);
      setFormError(result.error ?? "Couldn't create your account. Please try again.");
      return;
    }
    navigate({ to: ROLE_HOME[result.user.role], replace: true });
  };

  return (
    <AuthLayout>
      <div className={meta.accent.scope ?? ""}>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Create your account</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Set up your workspace in under a minute.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
          <RolePicker roles={SIGNUP_ROLE_OPTIONS} value={role} onChange={setRole} legend="I'm joining as" disabled={submitting} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="firstName" label="First name" error={errors.firstName}>
              <input
                id="firstName" autoComplete="given-name" required disabled={submitting}
                value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Amina"
                aria-invalid={!!errors.firstName} aria-describedby={errors.firstName ? "firstName-error" : undefined}
                className={inputClass}
              />
            </Field>
            <Field id="lastName" label="Last name" error={errors.lastName}>
              <input
                id="lastName" autoComplete="family-name" required disabled={submitting}
                value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Yusuf"
                aria-invalid={!!errors.lastName} aria-describedby={errors.lastName ? "lastName-error" : undefined}
                className={inputClass}
              />
            </Field>
          </div>

          <Field id="email" label="Work email" error={errors.email}>
            <input
              id="email" type="email" inputMode="email" autoComplete="email" spellCheck={false} required disabled={submitting}
              value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
              aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-error" : undefined}
              className={inputClass}
            />
          </Field>

          <Field
            id="password"
            label="Password"
            error={errors.password}
            hint={!password ? `At least ${MIN_PASSWORD_LENGTH} characters.` : undefined}
          >
            <PasswordInput
              id="password" autoComplete="new-password" required disabled={submitting}
              value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : !password ? "password-hint" : undefined}
            />
            <StrengthMeter password={password} />
          </Field>

          {formError && <FormAlert>{formError}</FormAlert>}

          <button
            type="submit"
            disabled={submitting}
            className={`group inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold shadow-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-70 ${meta.accent.button}`}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Creating account…
              </>
            ) : (
              <>
                Create account
                <ArrowRight className="h-4 w-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5" aria-hidden="true" />
              </>
            )}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Demo mode: no real account is created and all data is sample data.
          </p>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login/agent" className="rounded font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
