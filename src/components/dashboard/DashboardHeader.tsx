import { Calendar } from "lucide-react";
import { NotificationsBell } from "./NotificationsBell";

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
        <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors shadow-sm">
          <span>May 21, 2025</span>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </button>

        <NotificationsBell />
      </div>
    </header>
  );
}
