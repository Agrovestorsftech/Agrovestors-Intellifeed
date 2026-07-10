import { Link, useNavigate } from "@tanstack/react-router";
import { Sprout, Loader2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { ROLE_HOME, type PortalId } from "@/lib/auth/types";

interface LoginCardProps {
  portal: PortalId;
  portalName: string; // "Admin Portal"
  tagline: string;
  identifierLabel?: string;
  identifierPlaceholder?: string;
  hint?: ReactNode;
  accent: "primary" | "info" | "warning";
}

const accentButton: Record<LoginCardProps["accent"], string> = {
  primary: "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30",
  info: "bg-info hover:bg-info/90 text-info-foreground shadow-lg shadow-info/30",
  warning: "bg-warning hover:bg-warning/90 text-warning-foreground shadow-lg shadow-warning/30",
};

const accentIcon: Record<LoginCardProps["accent"], string> = {
  primary: "bg-primary/15 ring-primary/30 text-primary",
  info: "bg-info/15 ring-info/30 text-info",
  warning: "bg-warning/15 ring-warning/30 text-warning",
};

export function LoginCard({
  portal,
  portalName,
  tagline,
  identifierLabel = "Email",
  identifierPlaceholder = "you@example.com",
  hint,
  accent,
}: LoginCardProps) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    const result = await login(identifier, password);
    if (!result.ok || !result.user) {
      setSubmitting(false);
      setError(result.error === "invalid" || !result.error
        ? `Invalid ${identifierLabel} or Password. Please try again.`
        : result.error);
      return;
    }
    navigate({ to: ROLE_HOME[result.user.role], replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${accentIcon[accent]}`}>
            <Sprout className="h-5 w-5" />
          </div>
          <div className="flex items-baseline">
            <span className="text-2xl font-semibold tracking-tight">IntelliFeed</span>
            <span className="text-2xl font-semibold text-primary tracking-tight">360</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-foreground">{portalName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{tagline}</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="identifier" className="text-sm font-medium text-foreground">
                {identifierLabel}
              </label>
              <input
                id="identifier"
                name="identifier"
                type="email"
                autoComplete="email"
                required
                disabled={submitting}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={identifierPlaceholder}
                className="mt-1.5 block w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={submitting}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1.5 block w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-70 ${accentButton[accent]}`}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Signing in…" : "Login"}
            </button>

            <div className="flex items-center justify-between text-xs">
              <Link
                to="/forgot-password"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Forgot password?
              </Link>
              <Link to="/signup" className="text-primary hover:underline">
                Create account
              </Link>
            </div>
          </form>

          {hint && (
            <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              {hint}
            </div>
          )}
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          IntelliFeed360 · {portalName}
        </p>
      </div>
    </div>
  );
}