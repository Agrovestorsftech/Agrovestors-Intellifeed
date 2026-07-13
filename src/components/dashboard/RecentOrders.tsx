import { useRecentOrders } from "@/hooks/useDashboard";

type Status = "Pending" | "Processing" | "Out for Delivery" | "Delivered";

const statusStyles: Record<Status, string> = {
  Pending: "bg-destructive-soft text-destructive",
  Processing: "bg-info-soft text-info",
  "Out for Delivery": "bg-warning-soft text-warning-foreground",
  Delivered: "bg-success-soft text-success",
};

export function RecentOrders() {
  const { data, isLoading, error } = useRecentOrders();
  const orders = data ?? [];
  return (
    <section className="rounded-2xl bg-card border border-border p-6 shadow-sm flex flex-col">
      <h2 className="text-base font-semibold text-foreground mb-5">Recent Orders</h2>
      {error ? (
        <p className="text-sm text-destructive">Couldn't load orders.</p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center flex-1 grid place-items-center">No recent orders.</p>
      ) : (
      <ul className="flex-1 space-y-4">
        {orders.map((o) => (
          <li key={o.id} className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">#{o.orderNo}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{o.farm}</p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${statusStyles[o.status as Status]}`}
            >
              {o.status}
            </span>
          </li>
        ))}
      </ul>
      )}
      <button className="mt-6 w-full rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
        View All Orders
      </button>
    </section>
  );
}