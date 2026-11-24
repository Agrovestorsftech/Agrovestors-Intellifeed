import { Link } from "@tanstack/react-router";
import { usePendingReports } from "@/hooks/useDashboard";
import { formatPriority, formatReportStatus } from "@/lib/dashboard/queries";

type Priority = "High" | "Medium" | "Normal";
type Status = "Pending" | "Under Review";

const priorityStyles: Record<Priority, string> = {
  High: "bg-destructive-soft text-destructive",
  Medium: "bg-warning-soft text-warning-foreground",
  Normal: "bg-info-soft text-info",
};

const statusStyles: Record<Status, string> = {
  Pending: "bg-warning-soft text-warning-foreground",
  "Under Review": "bg-info-soft text-info",
};

export function ReportsAwaitingReview() {
  const { data, isLoading, error } = usePendingReports();
  const rows = data ?? [];

  return (
    <section className="rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-sm flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
        <div>
          <h2 className="text-base font-semibold text-foreground">Reports Awaiting Review</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Primary daily workspace — submissions from field agents</p>
        </div>
        <span className="text-xs font-medium text-primary bg-primary-soft px-3 py-1 rounded-full">{rows.length} pending</span>
      </div>
      <div className="flex-1 overflow-x-auto">
        {error ? (
          <p className="p-6 text-sm text-destructive">Couldn't load reports.</p>
        ) : isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading reports…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground text-center">No reports awaiting review.</p>
        ) : (
        <table className="w-full text-sm sm:min-w-[640px]">
          <thead>
            <tr className="text-xs text-muted-foreground">
              <th className="text-left font-medium pb-3">Farmer</th>
              <th className="hidden sm:table-cell text-left font-medium pb-3">Farm</th>
              <th className="hidden sm:table-cell text-left font-medium pb-3">Species</th>
              <th className="hidden sm:table-cell text-left font-medium pb-3">Submitted</th>
              <th className="text-left font-medium pb-3">Priority</th>
              <th className="text-left font-medium pb-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const p = formatPriority(r.priority);
              const s = formatReportStatus(r.status);
              return (
              <tr key={r.id} className="border-t border-border">
                <td className="py-3 pr-3 text-foreground font-medium">
                  {r.farmer}
                  {/* Phones: the hidden columns, in one line. */}
                  <span className="block text-xs font-normal text-muted-foreground sm:hidden">
                    {[r.farm, r.species, r.submitted].filter(Boolean).join(" · ")}
                  </span>
                </td>
                <td className="hidden sm:table-cell py-3 text-foreground">{r.farm}</td>
                <td className="hidden sm:table-cell py-3 text-muted-foreground">{r.species ?? "—"}</td>
                <td className="hidden sm:table-cell py-3 text-muted-foreground">{r.submitted}</td>
                <td className="py-3">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${priorityStyles[p]}`}>
                    {p}
                  </span>
                </td>
                <td className="py-3">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusStyles[s]}`}>
                    {s}
                  </span>
                </td>
              </tr>
            );})}
          </tbody>
        </table>
        )}
      </div>
      <Link
        to="/agent/reports-review"
        className="mt-6 block w-full rounded-xl border border-border px-3 py-2.5 text-center text-sm font-medium text-foreground hover:bg-muted transition-colors"
      >
        Review All Reports
      </Link>
    </section>
  );
}