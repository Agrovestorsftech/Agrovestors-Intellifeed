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

type Row = {
  farmer: string;
  farm: string;
  species: string;
  submitted: string;
  priority: Priority;
  status: Status;
};

const rows: Row[] = [
  { farmer: "James Okoro", farm: "Green Valley Farm", species: "Broilers", submitted: "Today", priority: "High", status: "Pending" },
  { farmer: "Adaeze Umeh", farm: "Sunnyvale Farm", species: "Layers", submitted: "Yesterday", priority: "Normal", status: "Pending" },
  { farmer: "Ade Adekunle", farm: "Ade's Farm", species: "Pigs", submitted: "Today", priority: "Medium", status: "Under Review" },
  { farmer: "Grace Peter", farm: "Riverbend Farm", species: "Catfish", submitted: "Yesterday", priority: "High", status: "Pending" },
  { farmer: "Michael James", farm: "Hilltop Farm", species: "Layers", submitted: "2 days ago", priority: "Normal", status: "Under Review" },
];

export function ReportsAwaitingReview() {
  return (
    <section className="rounded-2xl bg-card border border-border p-6 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-foreground">Reports Awaiting Review</h2>
        <span className="text-xs text-muted-foreground">28 pending</span>
      </div>
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground">
              <th className="text-left font-medium pb-3">Farmer</th>
              <th className="text-left font-medium pb-3">Farm</th>
              <th className="text-left font-medium pb-3">Species</th>
              <th className="text-left font-medium pb-3">Submitted</th>
              <th className="text-left font-medium pb-3">Priority</th>
              <th className="text-left font-medium pb-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.farmer + r.farm} className="border-t border-border">
                <td className="py-3 text-foreground font-medium">{r.farmer}</td>
                <td className="py-3 text-foreground">{r.farm}</td>
                <td className="py-3 text-muted-foreground">{r.species}</td>
                <td className="py-3 text-muted-foreground">{r.submitted}</td>
                <td className="py-3">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${priorityStyles[r.priority]}`}>
                    {r.priority}
                  </span>
                </td>
                <td className="py-3">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusStyles[r.status]}`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="mt-6 w-full rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
        Review All Reports
      </button>
    </section>
  );
}