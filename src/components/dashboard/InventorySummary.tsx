type Status = "Good" | "Low Stock" | "Critical";

const statusStyles: Record<Status, string> = {
  Good: "bg-success-soft text-success",
  "Low Stock": "bg-destructive-soft text-destructive",
  Critical: "bg-destructive-soft text-destructive",
};

type Row = { feed: string; stock: string; unit: string; status: Status };

const rows: Row[] = [
  { feed: "Broiler Starter", stock: "2.4", unit: "MT", status: "Good" },
  { feed: "Broiler Finisher", stock: "3.1", unit: "MT", status: "Good" },
  { feed: "Layer Mash", stock: "2.0", unit: "MT", status: "Low Stock" },
  { feed: "Catfish Feed", stock: "1.8", unit: "MT", status: "Good" },
  { feed: "Tilapia Feed", stock: "1.5", unit: "MT", status: "Good" },
  { feed: "Pig Grower Feed", stock: "1.8", unit: "MT", status: "Low Stock" },
];

export function InventorySummary() {
  return (
    <section className="rounded-2xl bg-card border border-border p-6 shadow-sm flex flex-col">
      <h2 className="text-base font-semibold text-foreground mb-5">Inventory Summary</h2>
      <div className="flex-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground">
              <th className="text-left font-medium pb-3">Feed Type</th>
              <th className="text-left font-medium pb-3">Current Stock</th>
              <th className="text-left font-medium pb-3">Unit</th>
              <th className="text-left font-medium pb-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.feed} className="border-t border-border">
                <td className="py-3 text-foreground font-medium">{r.feed}</td>
                <td className="py-3 text-foreground">{r.stock}</td>
                <td className="py-3 text-muted-foreground">{r.unit}</td>
                <td className="py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusStyles[r.status]}`}
                  >
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="mt-6 w-full rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
        View All Inventory
      </button>
    </section>
  );
}