import {
  FileSearch,
  Salad,
  Wheat,
  LifeBuoy,
  CalendarClock,
  CheckCircle2,
  HeartPulse,
  Upload,
  BookOpen,
  MessageSquare,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Tone = "primary" | "info" | "warning" | "accent" | "destructive";

const toneStyles: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary",
  info: "bg-info-soft text-info",
  warning: "bg-warning-soft text-warning-foreground",
  accent: "bg-accent text-accent-foreground",
  destructive: "bg-destructive-soft text-destructive",
};

const actions: { icon: LucideIcon; title: string; tone: Tone }[] = [
  { icon: FileSearch, title: "Review Report", tone: "info" },
  { icon: Salad, title: "Create Nutrition Plan", tone: "primary" },
  { icon: Wheat, title: "Generate Feed Recommendation", tone: "accent" },
  { icon: LifeBuoy, title: "Create Rescue Plan", tone: "destructive" },
  { icon: CalendarClock, title: "Schedule Follow-up Review", tone: "warning" },
  { icon: CheckCircle2, title: "Approve Recommendation", tone: "primary" },
  { icon: HeartPulse, title: "Add Health Record", tone: "destructive" },
  { icon: Upload, title: "Upload Research", tone: "info" },
  { icon: BookOpen, title: "Open Feed Library", tone: "accent" },
  { icon: MessageSquare, title: "Send Message", tone: "primary" },
];

export function VeterinaryWorkspace() {
  return (
    <section className="rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
        <h2 className="text-base font-semibold text-foreground">Quick Actions</h2>
        <span className="text-xs text-muted-foreground hidden sm:inline">
          Frequent nutrition & veterinary tasks
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.title}
              className="group flex flex-col items-center justify-start gap-3 rounded-2xl border border-border bg-card px-3 py-4 text-center hover:border-primary/40 hover:bg-primary-soft/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
            >
              <span
                className={`h-11 w-11 grid place-items-center rounded-2xl ${toneStyles[a.tone]} group-hover:scale-110 transition-transform`}
              >
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className="text-xs sm:text-[13px] font-medium text-foreground leading-tight">
                {a.title}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}