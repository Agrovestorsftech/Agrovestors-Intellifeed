import {
  UserPlus,
  BadgePlus,
  Factory,
  KeySquare,
  Settings2,
  BarChart3,
  ShieldCheck,
  SlidersHorizontal,
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
  { icon: UserPlus, title: "Add User", tone: "primary" },
  { icon: BadgePlus, title: "Register Agent", tone: "info" },
  { icon: Factory, title: "Register FeedOps Staff", tone: "warning" },
  { icon: KeySquare, title: "Create New Role", tone: "accent" },
  { icon: Settings2, title: "System Configuration", tone: "info" },
  { icon: BarChart3, title: "View Reports", tone: "primary" },
  { icon: ShieldCheck, title: "Manage Permissions", tone: "destructive" },
  { icon: SlidersHorizontal, title: "Platform Settings", tone: "accent" },
];

export function QuickManagementActions() {
  return (
    <section className="rounded-2xl bg-card border border-border p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-foreground">Quick Management Actions</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Common admin tasks at your fingertips</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.title}
              className="group flex flex-col items-center justify-start gap-3 rounded-2xl border border-border bg-card px-3 py-5 text-center hover:border-primary/40 hover:bg-primary-soft/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
            >
              <span
                className={`h-12 w-12 grid place-items-center rounded-2xl ${toneStyles[a.tone]} group-hover:scale-110 transition-transform`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-medium text-foreground leading-tight">{a.title}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}