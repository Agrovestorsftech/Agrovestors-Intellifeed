import { Bell, Calendar, Plus } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
};

export function DashboardHeader({ title, subtitle }: Props) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 pb-8">
      <div>
        <h1 className="text-[26px] font-semibold text-foreground tracking-tight">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-3">
        <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>May 1 – May 21, 2025</span>
        </button>

        <button className="relative h-10 w-10 grid place-items-center rounded-full border border-border bg-card hover:bg-muted transition-colors">
          <Bell className="h-[18px] w-[18px] text-foreground" />
          <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground grid place-items-center ring-2 ring-background">
            4
          </span>
        </button>

        <button className="inline-flex items-center gap-2 rounded-xl bg-info px-4 py-2 text-sm font-medium text-info-foreground hover:opacity-90 transition-opacity shadow-sm shadow-info/30">
          <Plus className="h-4 w-4" />
          <span>Add New</span>
        </button>
      </div>
    </header>
  );
}
