import { Bell, Calendar, Plus } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
};

export function AgentHeader({ title, subtitle, actionLabel = "Create Nutrition Plan" }: Props) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 pb-6 sm:pb-8 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-[26px] font-semibold text-foreground tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button className="hidden md:inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors shadow-sm">
          <span>May 21, 2025</span>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </button>

        <button className="relative h-10 w-10 sm:h-11 sm:w-11 grid place-items-center rounded-xl border border-border bg-card hover:bg-muted transition-colors shadow-sm">
          <Bell className="h-[18px] w-[18px] text-foreground" />
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground grid place-items-center ring-2 ring-background">
            3
          </span>
        </button>

        <button className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 sm:px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity shadow-md shadow-primary/30">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{actionLabel}</span>
          <span className="sm:hidden">New Plan</span>
        </button>
      </div>
    </header>
  );
}