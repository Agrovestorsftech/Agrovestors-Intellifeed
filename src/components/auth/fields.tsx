import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff, Factory, ShieldCheck, Stethoscope, Tractor, AlertCircle, type LucideIcon } from "lucide-react";
import type { UserRole } from "@/lib/auth/types";

/* ---------------------------------- roles ---------------------------------- */

type Accent = {
  /** Selected role card. */
  card: string;
  /** Icon tile on the role card. */
  tile: string;
  /** Primary submit button. */
  button: string;
  /** Wrapper class (purple Admin Agent theme re-points --primary). */
  scope?: string;
};

export const ROLE_META: Record<UserRole, { label: string; short: string; icon: LucideIcon; accent: Accent }> = {
  field_agent: {
    label: "Field Agent",
    short: "Visits, farmers & orders",
    icon: Tractor,
    accent: {
      card: "has-[:checked]:border-primary has-[:checked]:bg-primary/5",
      tile: "bg-primary-soft text-primary",
      button: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/30",
    },
  },
  admin_agent: {
    label: "Admin Agent",
    short: "Nutrition & vet review",
    icon: Stethoscope,
    accent: {
      card: "has-[:checked]:border-primary has-[:checked]:bg-primary/5",
      tile: "bg-primary-soft text-primary",
      button: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/30",
      scope: "theme-agent",
    },
  },
  feedops: {
    label: "Feed Operations",
    short: "Inventory & production",
    icon: Factory,
    accent: {
      card: "has-[:checked]:border-warning has-[:checked]:bg-warning/10",
      tile: "bg-warning-soft text-warning-foreground",
      button: "bg-warning text-warning-foreground hover:bg-warning/90 shadow-warning/30",
    },
  },
  system_admin: {
    label: "System Admin",
    short: "Users, roles & platform",
    icon: ShieldCheck,
    accent: {
      card: "has-[:checked]:border-info has-[:checked]:bg-info/5",
      tile: "bg-info-soft text-info",
      button: "bg-info text-info-foreground hover:bg-info/90 shadow-info/30",
    },
  },
};

/** Card-style radio group. Real radios underneath → arrow keys + screen readers work. */
export function RolePicker({
  roles,
  value,
  onChange,
  legend = "Sign in as",
  disabled,
}: {
  roles: UserRole[];
  value: UserRole;
  onChange: (r: UserRole) => void;
  legend?: string;
  disabled?: boolean;
}) {
  const name = useId();
  return (
    <fieldset disabled={disabled}>
      <legend className="text-sm font-medium text-foreground">{legend}</legend>
      <div className="mt-2 grid grid-cols-2 gap-2.5">
        {roles.map((r) => {
          const meta = ROLE_META[r];
          const Icon = meta.icon;
          return (
            <label
              key={r}
              className={`group relative flex min-h-14 cursor-pointer items-center gap-2.5 rounded-xl border border-input bg-card p-2.5 sm:gap-3 sm:p-3 transition-colors hover:bg-muted/60 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-background ${meta.accent.card} ${meta.accent.scope ?? ""}`}
            >
              <input
                type="radio"
                name={name}
                value={r}
                checked={value === r}
                onChange={() => onChange(r)}
                className="sr-only"
              />
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg sm:h-9 sm:w-9 ${meta.accent.tile}`}>
                <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium leading-tight text-foreground">{meta.label}</span>
                <span className="hidden truncate text-xs text-muted-foreground sm:block">{meta.short}</span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/* ---------------------------------- inputs --------------------------------- */

export const inputClass =
  "mt-1.5 block w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent disabled:opacity-60 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/40";

export function Field({
  id,
  label,
  error,
  hint,
  trailing,
  children,
}: {
  id: string;
  label: string;
  error?: string | null;
  hint?: ReactNode;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {trailing}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : hint ? (
        <div id={`${id}-hint`} className="mt-1.5 text-xs text-muted-foreground">
          {hint}
        </div>
      ) : null}
    </div>
  );
}

export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={show ? "text" : "password"} className={`${inputClass} pr-11`} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        className="absolute right-1 top-1/2 mt-[3px] grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {show ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
      </button>
    </div>
  );
}

/** 0–3 strength score with label, for the signup meter. */
export function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3; label: string } {
  if (!pw) return { score: 0, label: "" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  else if (/\d|[^A-Za-z0-9]/.test(pw) && pw.length >= 10) s++;
  const score = Math.min(3, Math.max(1, s)) as 1 | 2 | 3;
  return { score, label: ["", "Weak", "Fair", "Strong"][score]! };
}

export function StrengthMeter({ password }: { password: string }) {
  const { score, label } = passwordStrength(password);
  if (!password) return null;
  const color = score === 1 ? "bg-destructive" : score === 2 ? "bg-warning" : "bg-success";
  return (
    <div className="mt-2 flex items-center gap-3" aria-live="polite">
      <div className="flex flex-1 gap-1" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= score ? color : "bg-muted"}`} />
        ))}
      </div>
      <span className="w-12 text-right text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function FormAlert({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
