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

// Login is a two-step phone + OTP flow (IntelliFeed360 API). CONFIRMED
// against the live server (2026-08-23), straight from the Django view
// source: /auth/otp/send only accepts `phone` — there's no email field on
// this endpoint at all. This test environment also has SHOW_RANDOM_OTP set,
// so a successful send returns the code directly; it's shown below the form
// so testing doesn't depend on SMS delivery.
export function LoginCard({
  portal,
  portalName,
  tagline,
  identifierLabel = "Phone number",
  identifierPlaceholder = "+234 800 000 0000",
  hint,
  accent,
}: LoginCardProps) {
  const { requestOtp, verifyLogin } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("+234 ");
  const [otp, setOtp] = useState("");
  const [testCode, setTestCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSendCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    const result = await requestOtp(phone.replace(/\s+/g, ""));
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error ?? "Couldn't send code. Please try again.");
      return;
    }
    setTestCode(result.testCode ?? null);
    setStep("otp");
  };

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    const result = await verifyLogin(phone.replace(/\s+/g, ""), otp.trim());
    if (!result.ok || !result.user) {
      setSubmitting(false);
      setError(result.error ?? "Invalid or expired code. Please try again.");
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

          {step === "phone" ? (
            <form onSubmit={handleSendCode} className="mt-6 space-y-4" noValidate>
              <div>
                <label htmlFor="phone" className="text-sm font-medium text-foreground">
                  {identifierLabel}
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  disabled={submitting}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={identifierPlaceholder}
                  className="mt-1.5 block w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Use the phone number from signup — it's the auto-generated one shown after you
                  registered.
                </p>
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
                {submitting ? "Sending code…" : "Send code"}
              </button>

              <div className="flex items-center justify-between text-xs">
                <Link
                  to="/forgot-password"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Trouble signing in?
                </Link>
                <Link to="/signup" className="text-primary hover:underline">
                  Create account
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="mt-6 space-y-4" noValidate>
              <p className="text-sm text-muted-foreground">
                Enter the code sent to <span className="font-medium text-foreground">{phone}</span>.
              </p>
              {testCode && (
                <div className="rounded-lg border border-dashed border-border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">Test code (SHOW_RANDOM_OTP is on for this environment)</p>
                  <p className="mt-1 font-mono text-lg font-semibold text-foreground select-all">{testCode}</p>
                </div>
              )}
              <div>
                <label htmlFor="otp" className="text-sm font-medium text-foreground">
                  Verification code
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  autoFocus
                  disabled={submitting}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
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
                {submitting ? "Verifying…" : "Verify & sign in"}
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setTestCode(null);
                  setError(null);
                }}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Use a different phone number
              </button>
            </form>
          )}

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