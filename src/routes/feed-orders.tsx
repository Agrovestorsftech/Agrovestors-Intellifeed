import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { CreateOrderDialog } from "@/components/field/dialogs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { formatOrderStatus, relativeTime } from "@/lib/dashboard/queries";

export const Route = createFileRoute("/feed-orders")({ component: FeedOrdersPage });

const statusStyle: Record<string, string> = {
  Pending: "bg-warning-soft text-warning-foreground",
  Processing: "bg-info-soft text-info",
  "Out for Delivery": "bg-info-soft text-info",
  Delivered: "bg-success-soft text-success",
};

function FeedOrdersPage() {
  const { session } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders", session?.user.id],
    enabled: !!session?.user.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feed_orders")
        .select("id, order_no, quantity, status, placed_at, farmers(name, farm_name), feed_products(name, unit)")
        .eq("agent_id", session!.user.id)
        .order("placed_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
  return (
    <>
      <DashboardHeader title="Feed Orders" subtitle="Feed requests raised for the farmers you support." />
      <section className="rounded-2xl bg-card border border-border p-4 mb-4 flex justify-end">
        <CreateOrderDialog trigger={<Button>New order</Button>} />
      </section>
      <section className="rounded-2xl bg-card border border-border shadow-sm overflow-hidden">
        {isLoading ? <div className="p-6 animate-pulse h-40" /> : (data?.length ?? 0) === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">No orders yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left px-5 py-3">Order</th>
                <th className="text-left px-5 py-3">Farmer</th>
                <th className="text-left px-5 py-3">Product</th>
                <th className="text-right px-5 py-3">Qty</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Placed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(data ?? []).map((o: any) => {
                const s = formatOrderStatus(o.status);
                return (
                  <tr key={o.id}>
                    <td className="px-5 py-3 font-medium">{o.order_no}</td>
                    <td className="px-5 py-3">{o.farmers?.farm_name ?? "—"}</td>
                    <td className="px-5 py-3">{o.feed_products?.name ?? "—"}</td>
                    <td className="px-5 py-3 text-right">{o.quantity} {o.feed_products?.unit ?? ""}</td>
                    <td className="px-5 py-3"><Badge className={statusStyle[s] ?? "bg-muted"}>{s}</Badge></td>
                    <td className="px-5 py-3 text-muted-foreground">{relativeTime(o.placed_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
