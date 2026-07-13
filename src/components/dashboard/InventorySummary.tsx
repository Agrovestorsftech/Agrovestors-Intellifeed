import { useInventoryRows } from "@/hooks/useDashboard";

type Status = "Good" | "Low Stock" | "Critical";

const statusStyles: Record<Status, string> = {
  Good: "bg-success-soft text-success",
  "Low Stock": "bg-destructive-soft text-destructive",
  Critical: "bg-destructive-soft text-destructive",
};

export function InventorySummary() {
  const { data, isLoading, error } = useInventoryRows();
  const rows = data ?? [];
  return (
    <section className="rounded-2xl bg-card border border-border p-6 shadow-sm flex flex-col">
      <h2 className="text-base font-semibold text-foreground mb-5">Inventory Summary</h2>
      <div className="flex-1">
        {error ? (
          <p className="p-4 text-sm text-destructive">Couldn't load inventory.</p>
        ) : isLoading ? (
          <p className="p-4 text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground text-center">No inventory items.</p>
        ) : (
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
              <tr key={r.id} className="border-t border-border">
                <td className="py-3 text-foreground font-medium">{r.feed}</td>
                <td className="py-3 text-foreground">{r.stock}</td>
                <td className="py-3 text-muted-foreground">{r.unit}</td>
                <td className="py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusStyles[r.status as Status]}`}
                  >
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>
      <button className="mt-6 w-full rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
        View All Inventory
      </button>
    </section>
  );
}