import { Link } from "@tanstack/react-router";
import { useFarmerHealth } from "@/hooks/useDashboard";

type Risk = "Low" | "Medium" | "High";

const riskStyles: Record<Risk, string> = {
  Low: "bg-success-soft text-success",
  Medium: "bg-warning-soft text-warning-foreground",
  High: "bg-destructive-soft text-destructive",
};

function scoreColor(score: number) {
  if (score >= 85) return "text-success";
  if (score >= 70) return "text-warning-foreground";
  return "text-destructive";
}

export function FarmerHealthMonitoring() {
  const { data, isLoading, error } = useFarmerHealth();
  const rows = data ?? [];
  return (
    <section className="rounded-2xl bg-card border border-border p-6 shadow-sm flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
        <h2 className="text-base font-semibold text-foreground">Farmer Health Monitoring</h2>
        <span className="text-xs text-muted-foreground">Farms needing attention</span>
      </div>
      <div className="flex-1 overflow-x-auto">
        {error ? (
          <p className="p-6 text-sm text-destructive">Couldn't load farms.</p>
        ) : isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground text-center">No farms to display.</p>
        ) : (
        <table className="w-full text-sm sm:min-w-[640px]">
          <thead>
            <tr className="text-xs text-muted-foreground">
              <th className="text-left font-medium pb-3">Farm</th>
              <th className="hidden sm:table-cell text-left font-medium pb-3">Species</th>
              <th className="text-left font-medium pb-3">Health Score</th>
              <th className="text-left font-medium pb-3">Risk Level</th>
              <th className="hidden sm:table-cell text-left font-medium pb-3">Last Review</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="py-3 pr-3 text-foreground font-medium">
                  {r.farm}
                  {/* Phones: the hidden columns, in one line. */}
                  <span className="block text-xs font-normal text-muted-foreground sm:hidden">
                    {[r.species, r.lastReview].filter(Boolean).join(" · ")}
                  </span>
                </td>
                <td className="hidden sm:table-cell py-3 text-muted-foreground">{r.species}</td>
                <td className={`py-3 font-semibold ${scoreColor(r.score)}`}>{r.score}%</td>
                <td className="py-3">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${riskStyles[r.risk as Risk]}`}>
                    {r.risk}
                  </span>
                </td>
                <td className="hidden sm:table-cell py-3 text-muted-foreground">{r.lastReview}</td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
      <Link
        to="/agent/farmer-reviews"
        className="mt-6 block w-full rounded-xl border border-border px-3 py-2.5 text-center text-sm font-medium text-foreground hover:bg-muted transition-colors"
      >
        View All Assigned Farms
      </Link>
    </section>
  );
}