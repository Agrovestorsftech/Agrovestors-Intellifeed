import { HeaderCalendar } from "./HeaderCalendar";
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
        <HeaderCalendar />

        <NotificationsBell />
      </div>
    </header>
  );
}
