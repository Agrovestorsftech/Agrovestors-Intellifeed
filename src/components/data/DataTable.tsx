import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Inbox, MoreHorizontal, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Value used for sorting; omit to make the column unsortable. */
  sort?: (row: T) => string | number | null | undefined;
  align?: "left" | "right";
  /** Hide on small screens. */
  hideBelow?: "sm" | "md" | "lg";
  className?: string;
};

export type Filter<T> = {
  id: string;
  label: string;
  options: { value: string; label: string }[];
  value: (row: T) => string;
};

export type RowAction = { label: string; onSelect: () => void; destructive?: boolean; disabled?: boolean; separatorBefore?: boolean };

const HIDE: Record<NonNullable<Column<unknown>["hideBelow"]>, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
};

type Props<T> = {
  rows: T[] | undefined;
  columns: Column<T>[];
  getId: (row: T) => string;
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  /** Text searched by the search box. Omit to hide search. */
  searchText?: (row: T) => string;
  searchPlaceholder?: string;
  filters?: Filter<T>[];
  /** Extra controls on the right of the toolbar (e.g. a "New" button). */
  toolbar?: ReactNode;
  rowActions?: (row: T) => RowAction[];
  /** Short name of a row for screen readers, e.g. the order number. */
  rowLabel?: (row: T) => string;
  empty?: { title: string; hint?: string; action?: ReactNode };
  pageSize?: number;
  defaultSort?: { key: string; dir: "asc" | "desc" };
};

/** Searchable, filterable, sortable, paginated table with loading / empty / error states. */
export function DataTable<T>({
  rows,
  columns,
  getId,
  loading,
  error,
  onRetry,
  searchText,
  searchPlaceholder = "Search…",
  filters = [],
  toolbar,
  rowActions,
  rowLabel,
  empty = { title: "Nothing here yet" },
  pageSize = 10,
  defaultSort,
}: Props<T>) {
  const [q, setQ] = useState("");
  const [filterVals, setFilterVals] = useState<Record<string, string>>({});
  const [sort, setSort] = useState(defaultSort);
  const [page, setPage] = useState(0);

  const processed = useMemo(() => {
    const t = q.trim().toLowerCase();
    let out = (rows ?? []).filter((r) => {
      if (t && searchText && !searchText(r).toLowerCase().includes(t)) return false;
      return filters.every((f) => {
        const v = filterVals[f.id];
        return !v || v === "all" || f.value(r) === v;
      });
    });
    const col = sort && columns.find((c) => c.key === sort.key);
    if (col?.sort) {
      const get = col.sort;
      out = [...out].sort((a, b) => {
        const av = get(a);
        const bv = get(b);
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv));
        return sort!.dir === "asc" ? cmp : -cmp;
      });
    }
    return out;
  }, [rows, q, filterVals, sort, columns, filters, searchText]);

  useEffect(() => setPage(0), [q, filterVals]);
  const pages = Math.max(1, Math.ceil(processed.length / pageSize));
  const current = Math.min(page, pages - 1);
  const visible = processed.slice(current * pageSize, current * pageSize + pageSize);
  const filtering = q.trim() !== "" || Object.values(filterVals).some((v) => v && v !== "all");

  const toggleSort = (key: string) =>
    setSort((s) => (s?.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : undefined));

  const colCount = columns.length + (rowActions ? 1 : 0);
  // Phones get one card per row (every column, labelled) instead of a table
  // whose status and amount columns start off-screen.
  const showCards = !error && !loading && visible.length > 0;
  const [lead, ...rest] = columns;

  const actionsMenu = (r: T) =>
    rowActions && (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Actions${rowLabel ? ` for ${rowLabel(r)}` : ""}`}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-muted"
          >
            <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-44 rounded-xl">
          {rowActions(r).map((a) => (
            <span key={a.label}>
              {a.separatorBefore && <DropdownMenuSeparator />}
              <DropdownMenuItem
                disabled={a.disabled}
                onSelect={a.onSelect}
                className={a.destructive ? "text-destructive focus:text-destructive" : ""}
              >
                {a.label}
              </DropdownMenuItem>
            </span>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {(searchText || filters.length > 0 || toolbar) && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3 sm:gap-3 sm:p-4">
          {searchText && (
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="h-10 rounded-xl pl-9 pr-9"
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  aria-label="Clear search"
                  className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          )}
          {filters.map((f) => (
            <Select key={f.id} value={filterVals[f.id] ?? "all"} onValueChange={(v) => setFilterVals((s) => ({ ...s, [f.id]: v }))}>
              <SelectTrigger className="h-10 w-auto min-w-[140px] rounded-xl" aria-label={f.label}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {f.label.toLowerCase()}</SelectItem>
                {f.options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
          {toolbar && <div className="ml-auto flex flex-wrap items-center gap-2">{toolbar}</div>}
        </div>
      )}

      {showCards && lead && (
        <ul className="divide-y divide-border sm:hidden">
          {visible.map((r) => (
            <li key={getId(r)} className="px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1 text-sm">{lead.cell(r)}</div>
                {rowActions && <div className="-mr-2 -mt-1 shrink-0">{actionsMenu(r)}</div>}
              </div>
              {rest.length > 0 && (
                <dl className="mt-2 grid grid-cols-[minmax(0,auto)_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
                  {rest.map((c) => (
                    <div key={c.key} className="contents">
                      <dt className="text-xs leading-5 text-muted-foreground">{c.header}</dt>
                      <dd className="min-w-0 break-words">{c.cell(r)}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className={showCards ? "hidden overflow-x-auto sm:block" : "overflow-x-auto"}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              {columns.map((c) => {
                const active = sort?.key === c.key;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined}
                    className={`whitespace-nowrap px-4 py-3 text-xs font-medium text-muted-foreground ${c.align === "right" ? "text-right" : ""} ${c.hideBelow ? HIDE[c.hideBelow] : ""}`}
                  >
                    {c.sort ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className={`inline-flex items-center gap-1 rounded hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? "text-foreground" : ""}`}
                      >
                        {c.header}
                        {active ? (
                          sort!.dir === "asc" ? <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-40" aria-hidden="true" />
                        )}
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
              {rowActions && (
                <th scope="col" className="w-12 px-2 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {error ? (
              <tr>
                <td colSpan={colCount} className="px-4 py-12 text-center">
                  <p className="text-sm text-destructive">Couldn't load this data.</p>
                  {onRetry && (
                    <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
                      Try again
                    </Button>
                  )}
                </td>
              </tr>
            ) : loading ? (
              Array.from({ length: 5 }, (_, i) => (
                <tr key={i} aria-hidden="true">
                  <td colSpan={colCount} className="px-4 py-3">
                    <div className="h-6 rounded bg-muted motion-safe:animate-pulse" />
                  </td>
                </tr>
              ))
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={colCount} className="px-4 py-14 text-center">
                  <Inbox className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden="true" />
                  <p className="mt-2 text-sm font-medium text-foreground">{filtering ? "No matches" : empty.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {filtering ? "Try a different search or clear the filters." : empty.hint}
                  </p>
                  {filtering ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => {
                        setQ("");
                        setFilterVals({});
                      }}
                    >
                      Clear filters
                    </Button>
                  ) : (
                    empty.action && <div className="mt-3">{empty.action}</div>
                  )}
                </td>
              </tr>
            ) : (
              visible.map((r) => (
                <tr key={getId(r)} className="transition-colors hover:bg-muted/40">
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={`px-4 py-3 align-middle ${c.align === "right" ? "text-right tabular-nums" : ""} ${c.hideBelow ? HIDE[c.hideBelow] : ""} ${c.className ?? ""}`}
                    >
                      {c.cell(r)}
                    </td>
                  ))}
                  {rowActions && (
                    <td className="px-2 py-2 text-right">
                      {actionsMenu(r)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && !error && processed.length > pageSize && (
        <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <span aria-live="polite">
            {current * pageSize + 1}–{Math.min(processed.length, (current + 1) * pageSize)} of {processed.length}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setPage(current - 1)} disabled={current === 0} aria-label="Previous page">
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <span className="px-2 tabular-nums">
              {current + 1} / {pages}
            </span>
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setPage(current + 1)} disabled={current >= pages - 1} aria-label="Next page">
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
