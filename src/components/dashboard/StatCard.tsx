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
  description: string;
  icon: LucideIcon;
  tone?: Tone;
};

export function StatCard({ title, value, description, icon: Icon, tone = "primary" }: Props) {
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
      <p className="mt-4 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
