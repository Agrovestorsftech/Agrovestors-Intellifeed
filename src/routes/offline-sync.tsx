import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { RefreshCw, Wifi, WifiOff, HardDrive } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/offline-sync")({ component: OfflineSyncPage });

function OfflineSyncPage() {
  const qc = useQueryClient();
  const [online, setOnline] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);
  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  const runSync = async () => {
    setSyncing(true);
    await qc.invalidateQueries();
    await new Promise((r) => setTimeout(r, 500));
    setLastSync(new Date());
    setSyncing(false);
    toast.success("Everything is up to date");
  };
  return (
    <>
      <DashboardHeader title="Offline Sync" subtitle="Sync your field data when you're back online." />
      <section className="rounded-2xl bg-card border border-border p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-2xl grid place-items-center ${online ? "bg-success-soft text-success" : "bg-warning-soft text-warning-foreground"}`}>
              {online ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-sm font-medium">{online ? "Online" : "Offline"}</p>
              <p className="text-xs text-muted-foreground">Last sync: {lastSync ? lastSync.toLocaleTimeString() : "not yet"}</p>
            </div>
          </div>
          <Button onClick={runSync} disabled={!online || syncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync now"}
          </Button>
        </div>
      </section>
      <section className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        {[{ label: "Queued reports", value: 0 }, { label: "Queued farmers", value: 0 }, { label: "Photos to upload", value: 0 }].map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <HardDrive className="h-5 w-5 text-muted-foreground" />
            <p className="mt-2 text-2xl font-semibold">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </section>
    </>
  );
}
