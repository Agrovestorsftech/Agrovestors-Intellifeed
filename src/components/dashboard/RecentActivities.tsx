import {
  FileCheck2,
  UserPlus,
  AlertTriangle,
  ShoppingCart,
  MessageCircle,
  ArrowRight,
  Salad,
  PackageCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useActivities } from "@/hooks/useDashboard";
import { relativeTime } from "@/lib/dashboard/queries";

type Tone = "primary" | "info" | "warning" | "destructive" | "accent";

const toneStyles: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary",
  info: "bg-info-soft text-info",
  warning: "bg-warning-soft text-warning-foreground",
  destructive: "bg-destructive-soft text-destructive",
  accent: "bg-accent text-accent-foreground",
};

const META: Record<string, { icon: LucideIcon; tone: Tone; title: (m: any) => string }> = {
  report_submitted: { icon: FileCheck2, tone: "primary", title: (m) => `Report submitted for ${m?.farm_name ?? "farm"}` },
  farmer_onboarded: { icon: UserPlus, tone: "info", title: (m) => `New farmer onboarded: ${m?.name ?? "farmer"}` },
  health_case_opened: { icon: AlertTriangle, tone: "destructive", title: (m) => `Health issue reported at ${m?.farm_name ?? "farm"}` },
  order_placed: { icon: ShoppingCart, tone: "warning", title: (m) => `Feed order placed for ${m?.farm_name ?? "farm"}` },
  order_delivered: { icon: PackageCheck, tone: "accent", title: (m) => `Order delivered to ${m?.farm_name ?? "farm"}` },
  plan_updated: { icon: Salad, tone: "primary", title: (m) => `Nutrition plan updated for ${m?.farm_name ?? "farm"}` },
};

export function RecentActivities() {
  const { data, isLoading, error } = useActivities(20);
  const activities = data ?? [];
  return (
    <section className="rounded-2xl bg-card border border-border p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-foreground">Recent Activities</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Latest updates from your field</p>
        </div>
      </div>
      {error ? (
        <p className="text-sm text-destructive">Couldn't load activities.</p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : activities.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No recent activity.</p>
      ) : (
      <ul className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
        {activities.map((a: any) => {
          const meta = META[a.activity_type] ?? { icon: MessageCircle, tone: "accent" as Tone, title: () => a.description ?? "Activity" };
          const Icon = meta.icon;
          const title = meta.title(a.metadata);
          return (
            <li key={a.id} className="flex items-start gap-3">
              <div className={`h-9 w-9 shrink-0 grid place-items-center rounded-xl ${toneStyles[meta.tone]}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-snug">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{relativeTime(a.created_at)}</p>
              </div>
            </li>
          );
        })}
      </ul>
      )}

      <button className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:gap-2.5 transition-all">
        View All
        <ArrowRight className="h-4 w-4" />
      </button>
    </section>
  );
}
