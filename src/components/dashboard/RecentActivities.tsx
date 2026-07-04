import {
  FileCheck2,
  UserPlus,
  AlertTriangle,
  ShoppingCart,
  MessageCircle,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Tone = "primary" | "info" | "warning" | "destructive" | "accent";

type Activity = {
  icon: LucideIcon;
  title: string;
  time: string;
  tone: Tone;
};

const toneStyles: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary",
  info: "bg-info-soft text-info",
  warning: "bg-warning-soft text-warning-foreground",
  destructive: "bg-destructive-soft text-destructive",
  accent: "bg-accent text-accent-foreground",
};

const activities: Activity[] = [
  { icon: FileCheck2, title: "Report submitted for Green Valley Farm", time: "10 mins ago", tone: "primary" },
  { icon: UserPlus, title: "New farmer onboarded: Ade Ojo", time: "1 hour ago", tone: "info" },
  { icon: AlertTriangle, title: "Health issue reported at Hilltop Farm", time: "2 hours ago", tone: "destructive" },
  { icon: ShoppingCart, title: "Feed order placed for Sunnyvale", time: "4 hours ago", tone: "warning" },
  { icon: MessageCircle, title: "Message from Admin Agent", time: "Yesterday", tone: "accent" },
];

export function RecentActivities() {
  return (
    <section className="rounded-2xl bg-card border border-border p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-foreground">Recent Activities</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Latest updates from your field</p>
        </div>
      </div>

      <ul className="space-y-4">
        {activities.map((a) => {
          const Icon = a.icon;
          return (
            <li key={a.title} className="flex items-start gap-3">
              <div className={`h-9 w-9 shrink-0 grid place-items-center rounded-xl ${toneStyles[a.tone]}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-snug">{a.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{a.time}</p>
              </div>
            </li>
          );
        })}
      </ul>

      <button className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:gap-2.5 transition-all">
        View All
        <ArrowRight className="h-4 w-4" />
      </button>
    </section>
  );
}
