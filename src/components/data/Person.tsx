import { initials } from "@/lib/ops/people";

/** Avatar initials + name + secondary line for table cells. */
export function Person({ name, sub }: { name: string; sub?: string | null }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary" aria-hidden="true">
        {initials(name)}
      </span>
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{name}</p>
        {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}
