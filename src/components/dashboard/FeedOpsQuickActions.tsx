import {
  FilePlus2,
  PackagePlus,
  ClipboardCheck,
  Truck,
  ShieldCheck,
  Repeat,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Tone = "primary" | "info" | "warning" | "accent";

const toneStyles: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary",
  info: "bg-info-soft text-info",
  warning: "bg-warning-soft text-warning-foreground",
  accent: "bg-accent text-accent-foreground",
};

const actions: { icon: LucideIcon; title: string; tone: Tone }[] = [
  { icon: FilePlus2, title: "Create Production", tone: "primary" },
  { icon: PackagePlus, title: "Add Inventory", tone: "primary" },
  { icon: ClipboardCheck, title: "Process Order", tone: "warning" },
  { icon: Truck, title: "Schedule Delivery", tone: "primary" },
  { icon: ShieldCheck, title: "Quality Check", tone: "info" },
  { icon: Repeat, title: "Stock Transfer", tone: "info" },
];

export function FeedOpsQuickActions() {
  return (
    <section className="rounded-2xl bg-card border border-border p-6 shadow-sm">
      <h2 className="text-base font-semibold text-foreground mb-5">Quick Actions</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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