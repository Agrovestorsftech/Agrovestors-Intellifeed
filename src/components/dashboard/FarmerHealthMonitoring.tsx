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

type Row = {
  farm: string;
  species: string;
  score: number;
  risk: Risk;
  agent: string;
  lastReview: string;
};

const rows: Row[] = [
  { farm: "Green Valley Farm", species: "Broilers", score: 82, risk: "Medium", agent: "John Field", lastReview: "Yesterday" },
  { farm: "Ade's Farm", species: "Pigs", score: 65, risk: "High", agent: "Michael James", lastReview: "Today" },
  { farm: "Riverbend Farm", species: "Catfish", score: 91, risk: "Low", agent: "Grace Peter", lastReview: "2 days ago" },
  { farm: "Sunnyvale Farm", species: "Layers", score: 78, risk: "Medium", agent: "Fatima Bello", lastReview: "Yesterday" },
  { farm: "Hilltop Farm", species: "Layers", score: 88, risk: "Low", agent: "David Ojo", lastReview: "3 days ago" },
];

export function FarmerHealthMonitoring() {
  return (
    <section className="rounded-2xl bg-card border border-border p-6 shadow-sm flex flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
        <h2 className="text-base font-semibold text-foreground">Farmer Health Monitoring</h2>
        <span className="text-xs text-muted-foreground">Farms needing attention</span>
      </div>
      <div className="flex-1 -mx-6 sm:mx-0 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm px-6 sm:px-0">
          <thead>
            <tr className="text-xs text-muted-foreground">
              <th className="text-left font-medium pb-3">Farm</th>
              <th className="text-left font-medium pb-3">Species</th>
              <th className="text-left font-medium pb-3">Health Score</th>
              <th className="text-left font-medium pb-3">Risk Level</th>
              <th className="text-left font-medium pb-3">Field Agent</th>
              <th className="text-left font-medium pb-3">Last Review</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.farm} className="border-t border-border">
                <td className="py-3 text-foreground font-medium">{r.farm}</td>
                <td className="py-3 text-muted-foreground">{r.species}</td>
                <td className={`py-3 font-semibold ${scoreColor(r.score)}`}>{r.score}%</td>
                <td className="py-3">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${riskStyles[r.risk]}`}>
                    {r.risk}
                  </span>
                </td>
                <td className="py-3 text-foreground">{r.agent}</td>
                <td className="py-3 text-muted-foreground">{r.lastReview}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="mt-6 w-full rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
        View All Assigned Farms
      </button>
    </section>
  );
}