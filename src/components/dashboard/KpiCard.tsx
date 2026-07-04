import { TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Tone = "primary" | "info" | "warning" | "destructive" | "accent";

const toneStyles: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary",
  info: "bg-info-soft text-info",
  warning: "bg-warning-soft text-warning-foreground",
  destructive: "bg-destructive-soft text-destructive",
  accent: "bg-accent text-accent-foreground",
};

type Props = {
  title: string;
  value: string;
  growth: string;
  icon: LucideIcon;
  tone?: Tone;
};

export function KpiCard({ title, value, growth, icon: Icon, tone = "primary" }: Props) {
  return (
    <div className="rounded-2xl bg-card border border-border p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
        </div>
        <div className={`h-11 w-11 grid place-items-center rounded-xl ${toneStyles[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1 font-medium text-success">
          <TrendingUp className="h-3.5 w-3.5" />
          {growth}
        </span>
        <span className="text-muted-foreground">from last month</span>
      </div>
    </div>
  );
}