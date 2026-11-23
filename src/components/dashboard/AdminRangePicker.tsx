import { Calendar as CalendarIcon, Check } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RANGE_OPTIONS, rangeLabel, useAdminRange } from "@/lib/dashboard/admin-range";

/** Header date-range button for the admin dashboard. Drives the platform charts. */
export function AdminRangePicker() {
  const [days, setDays] = useAdminRange();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Reporting period: last ${days} days`}
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-muted"
        >
          <span suppressHydrationWarning>{rangeLabel(days)}</span>
          <CalendarIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Reporting period</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {RANGE_OPTIONS.map((d) => (
          <DropdownMenuItem key={d} onSelect={() => setDays(d)} className="flex items-center justify-between">
            <span>Last {d} days</span>
            {d === days && <Check className="h-4 w-4 text-primary" aria-hidden="true" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
