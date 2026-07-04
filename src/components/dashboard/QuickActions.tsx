import {
  PlayCircle,
  FilePlus2,
  UserPlus,
  Camera,
  RefreshCw,
  Send,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Tone = "primary" | "info" | "warning" | "destructive" | "accent";

const toneStyles: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary",
  info: "bg-info-soft text-info",
  warning: "bg-warning-soft text-warning-foreground",
  destructive: "bg-destructive-soft text-destructive",
  accent: "bg-accent text-accent-foreground",
};

const actions: { icon: LucideIcon; title: string; tone: Tone }[] = [
  { icon: PlayCircle, title: "Start Visit", tone: "primary" },
  { icon: FilePlus2, title: "Add Report", tone: "info" },
  { icon: UserPlus, title: "Add Farmer", tone: "accent" },
  { icon: Camera, title: "Take Photo", tone: "warning" },
  { icon: RefreshCw, title: "Sync Data", tone: "primary" },
  { icon: Send, title: "Send Message", tone: "info" },
];

export function QuickActions() {
  return (
    <section className="rounded-2xl bg-card border border-border p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-foreground">Quick Actions</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Common tasks to jump right in</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.title}
              className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card px-3 py-5 hover:border-primary/40 hover:bg-primary-soft/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
            >
              <span
                className={`h-12 w-12 grid place-items-center rounded-2xl ${toneStyles[a.tone]} group-hover:scale-110 transition-transform`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium text-foreground text-center">{a.title}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
