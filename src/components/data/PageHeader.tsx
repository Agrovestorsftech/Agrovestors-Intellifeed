import type { ReactNode } from "react";
import { NotificationsBell } from "@/components/dashboard/NotificationsBell";

/** Header for module pages: title, subtitle, page actions and the notifications bell. */
export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 pb-6 sm:items-center sm:pb-8">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-[26px]">{title}</h1>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
        {actions}
        <NotificationsBell />
      </div>
    </header>
  );
}
