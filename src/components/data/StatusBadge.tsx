export type Tone = "neutral" | "primary" | "info" | "success" | "warning" | "danger" | "solid-danger";

const TONE: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-primary-soft text-primary",
  info: "bg-info-soft text-info",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning-foreground",
  danger: "bg-destructive-soft text-destructive",
  "solid-danger": "bg-destructive text-destructive-foreground",
};

/** Default tone for common status words used across the mock data. */
const STATUS_TONE: Record<string, Tone> = {
  active: "success",
  approved: "success",
  completed: "success",
  delivered: "success",
  received: "success",
  resolved: "success",
  pass: "success",
  paid: "success",
  success: "success",
  running: "info",
  in_progress: "info",
  in_transit: "info",
  processing: "info",
  out_for_delivery: "info",
  under_review: "info",
  invited: "info",
  info: "info",
  scheduled: "primary",
  queued: "primary",
  placed: "primary",
  requested: "primary",
  open: "warning",
  pending: "warning",
  draft: "warning",
  low_stock: "warning",
  warn: "warning",
  due: "warning",
  monitoring: "warning",
  inactive: "neutral",
  closed: "neutral",
  cancelled: "neutral",
  archived: "neutral",
  suspended: "danger",
  failed: "danger",
  fail: "danger",
  rejected: "danger",
  overdue: "danger",
  out_of_stock: "danger",
  error: "danger",
  critical: "solid-danger",
  high: "danger",
  urgent: "danger",
  medium: "warning",
  normal: "neutral",
  low: "neutral",
};

export function humanize(s: string): string {
  const t = s.replace(/_/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function StatusBadge({ status, tone, label }: { status: string; tone?: Tone; label?: string }) {
  const t = tone ?? STATUS_TONE[status.toLowerCase()] ?? "neutral";
  return (
    <span className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE[t]}`}>
      {label ?? humanize(status)}
    </span>
  );
}
