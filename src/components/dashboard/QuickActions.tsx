import { PlayCircle, FilePlus2, UserPlus, ShoppingCart, RefreshCw, LifeBuoy } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AddFarmerDialog, AddReportDialog, CreateOrderDialog, OpenTicketDialog } from "@/components/field/dialogs";

type Tone = "primary" | "info" | "warning" | "destructive" | "accent";

const toneStyles: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary",
  info: "bg-info-soft text-info",
  warning: "bg-warning-soft text-warning-foreground",
  destructive: "bg-destructive-soft text-destructive",
  accent: "bg-accent text-accent-foreground",
};

export function QuickActions() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  return (
    <section className="rounded-2xl bg-card border border-border p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-foreground">Quick Actions</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Common tasks to jump right in</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button onClick={() => navigate({ to: "/my-visits" })} className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-3 py-5 hover:border-primary/40 hover:bg-primary-soft/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
          <span className={`h-12 w-12 grid place-items-center rounded-2xl ${toneStyles.primary} group-hover:scale-110 transition-transform`}><PlayCircle className="h-5 w-5" /></span>
          <span className="text-sm font-medium">Start Visit</span>
        </button>

        <AddReportDialog trigger={
          <button className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-3 py-5 hover:border-primary/40 hover:bg-primary-soft/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
            <span className={`h-12 w-12 grid place-items-center rounded-2xl ${toneStyles.info} group-hover:scale-110 transition-transform`}><FilePlus2 className="h-5 w-5" /></span>
            <span className="text-sm font-medium">Add Report</span>
          </button>
        } />

        <AddFarmerDialog trigger={
          <button className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-3 py-5 hover:border-primary/40 hover:bg-primary-soft/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
            <span className={`h-12 w-12 grid place-items-center rounded-2xl ${toneStyles.accent} group-hover:scale-110 transition-transform`}><UserPlus className="h-5 w-5" /></span>
            <span className="text-sm font-medium">Add Farmer</span>
          </button>
        } />

        <CreateOrderDialog trigger={
          <button className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-3 py-5 hover:border-primary/40 hover:bg-primary-soft/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
            <span className={`h-12 w-12 grid place-items-center rounded-2xl ${toneStyles.warning} group-hover:scale-110 transition-transform`}><ShoppingCart className="h-5 w-5" /></span>
            <span className="text-sm font-medium">Place Order</span>
          </button>
        } />

        <button
          onClick={async () => {
            await qc.invalidateQueries();
            toast.success("Data synced");
          }}
          className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-3 py-5 hover:border-primary/40 hover:bg-primary-soft/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
        >
          <span className={`h-12 w-12 grid place-items-center rounded-2xl ${toneStyles.primary} group-hover:scale-110 transition-transform`}><RefreshCw className="h-5 w-5" /></span>
          <span className="text-sm font-medium">Sync Data</span>
        </button>

        <OpenTicketDialog trigger={
          <button className="group flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-3 py-5 hover:border-primary/40 hover:bg-primary-soft/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
            <span className={`h-12 w-12 grid place-items-center rounded-2xl ${toneStyles.info} group-hover:scale-110 transition-transform`}><LifeBuoy className="h-5 w-5" /></span>
            <span className="text-sm font-medium">Get Support</span>
          </button>
        } />
      </div>
    </section>
  );
}
