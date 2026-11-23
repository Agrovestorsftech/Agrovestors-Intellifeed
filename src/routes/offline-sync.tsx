import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CheckCircle2,
  ClipboardList,
  CloudUpload,
  Database,
  History,
  Image as ImageIcon,
  RefreshCw,
  ShoppingCart,
  UserPen,
  Wifi,
  WifiOff,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  fetchCacheStats,
  fetchSyncState,
  markSyncItemUploaded,
  recordSyncRun,
  relativeTime,
  type SyncItem,
} from "@/lib/dashboard/queries";

export const Route = createFileRoute("/offline-sync")({ component: OfflineSyncPage });

const KIND: Record<string, { icon: LucideIcon; tone: string }> = {
  visit_report: { icon: ClipboardList, tone: "bg-primary-soft text-primary" },
  photo: { icon: ImageIcon, tone: "bg-info-soft text-info" },
  farmer_update: { icon: UserPen, tone: "bg-warning-soft text-warning-foreground" },
  order: { icon: ShoppingCart, tone: "bg-accent text-accent-foreground" },
};

const AUTO_SYNC_KEY = "if360.autoSync";
const STORAGE_QUOTA_MB = 250;

function formatSize(kb: number) {
  return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
}

function OfflineSyncPage() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const qc = useQueryClient();
  const [online, setOnline] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [progress, setProgress] = useState<{ done: number; total: number; current?: string } | null>(null);

  const state = useQuery({ queryKey: ["sync-state", userId], queryFn: () => fetchSyncState(userId), enabled: !!userId });
  const cache = useQuery({ queryKey: ["cache-stats", userId], queryFn: () => fetchCacheStats(userId), enabled: !!userId });

  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    try {
      const saved = localStorage.getItem(AUTO_SYNC_KEY);
      if (saved !== null) setAutoSync(saved === "1");
    } catch {
      /* storage unavailable — keep default */
    }
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const toggleAutoSync = (v: boolean) => {
    setAutoSync(v);
    try {
      localStorage.setItem(AUTO_SYNC_KEY, v ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  const queue = state.data?.queue ?? [];
  const history = state.data?.history ?? [];
  const lastSync = history[0]?.created_at;
  const queuedKb = queue.reduce((s, q) => s + q.size_kb, 0);
  const syncing = progress !== null;

  const runSync = async () => {
    if (!userId || syncing) return;
    const items: SyncItem[] = [...queue];
    const started = performance.now();
    setProgress({ done: 0, total: items.length });
    for (let i = 0; i < items.length; i++) {
      const item = items[i]!;
      setProgress({ done: i, total: items.length, current: `${item.label} · ${item.detail}` });
      // Simulated upload time, scaled a little by size.
      await new Promise((r) => setTimeout(r, 350 + Math.min(900, item.size_kb / 8)));
      await markSyncItemUploaded(item.id);
      setProgress({ done: i + 1, total: items.length });
    }
    await recordSyncRun(userId, items.length, Math.round(performance.now() - started));
    await qc.invalidateQueries();
    setProgress(null);
    toast.success(items.length ? `Uploaded ${items.length} item${items.length === 1 ? "" : "s"}` : "Everything is up to date");
  };

  const cachedRecords = cache.data ? cache.data.farmers + cache.data.reports + cache.data.visits + cache.data.orders : 0;
  // Rough local footprint: ~6 KB per record + queued uploads.
  const usedMb = Math.round(((cachedRecords * 6 + queuedKb) / 1024) * 10) / 10;

  return (
    <>
      <DashboardHeader title="Offline Sync" subtitle="Work without signal. Everything you capture uploads when you're back online." />

      {/* Status */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`grid h-12 w-12 place-items-center rounded-2xl ${online ? "bg-success-soft text-success" : "bg-warning-soft text-warning-foreground"}`}
              aria-hidden="true"
            >
              {online ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-base font-semibold text-foreground" aria-live="polite">
                {online ? (queue.length ? `${queue.length} item${queue.length === 1 ? "" : "s"} waiting to upload` : "All synced") : "You're offline"}
              </p>
              <p className="text-sm text-muted-foreground">
                {online
                  ? `Last sync ${lastSync ? relativeTime(lastSync) : "never"}`
                  : "New visits and photos are saved on this device and upload automatically later."}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <Switch checked={autoSync} onCheckedChange={toggleAutoSync} aria-label="Auto-sync on Wi-Fi" />
              Auto-sync on Wi-Fi
            </label>
            <Button onClick={runSync} disabled={!online || syncing || state.isLoading} className="h-10">
              <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "motion-safe:animate-spin" : ""}`} aria-hidden="true" />
              {syncing ? "Syncing…" : "Sync now"}
            </Button>
          </div>
        </div>

        {progress && (
          <div className="mt-5" aria-live="polite">
            <div className="mb-2 flex items-center justify-between gap-4 text-xs text-muted-foreground">
              <span className="truncate">{progress.current ?? "Finishing up…"}</span>
              <span className="shrink-0 tabular-nums">
                {progress.done}/{progress.total}
              </span>
            </div>
            <Progress value={progress.total ? (progress.done / progress.total) * 100 : 100} aria-label="Sync progress" />
          </div>
        )}
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Queue */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
              <CloudUpload className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Waiting to upload
            </h2>
            {queue.length > 0 && <span className="text-xs text-muted-foreground">{formatSize(queuedKb)} total</span>}
          </div>
          {state.isError ? (
            <p className="py-6 text-center text-sm text-destructive">
              Couldn't read the upload queue.{" "}
              <button type="button" onClick={() => state.refetch()} className="font-medium text-primary hover:underline">
                Retry
              </button>
            </p>
          ) : state.isLoading ? (
            <div className="space-y-2" aria-busy="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-muted motion-safe:animate-pulse" />
              ))}
            </div>
          ) : queue.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <CheckCircle2 className="h-8 w-8 text-success" aria-hidden="true" />
              <p className="text-sm font-medium text-foreground">Nothing waiting</p>
              <p className="text-xs text-muted-foreground">Visits, photos and orders you capture offline will queue here.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {queue.map((q) => {
                const k = KIND[q.kind] ?? KIND.visit_report!;
                const Icon = k.icon;
                return (
                  <li key={q.id} className="flex items-center gap-3 py-3">
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${k.tone}`} aria-hidden="true">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{q.label}</p>
                      <p className="truncate text-xs text-muted-foreground">{q.detail}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-medium tabular-nums text-foreground">{formatSize(q.size_kb)}</p>
                      <p className="text-xs text-muted-foreground">{relativeTime(q.created_at)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Storage */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
            <Database className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            On this device
          </h2>
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-semibold tabular-nums text-foreground">{usedMb} MB</p>
            <p className="text-xs text-muted-foreground">of {STORAGE_QUOTA_MB} MB</p>
          </div>
          <Progress className="mt-2" value={(usedMb / STORAGE_QUOTA_MB) * 100} aria-label="Storage used" />
          <dl className="mt-5 space-y-2.5 text-sm">
            {[
              ["Farmers", cache.data?.farmers],
              ["Visit reports", cache.data?.reports],
              ["Scheduled visits", cache.data?.visits],
              ["Feed orders", cache.data?.orders],
            ].map(([label, value]) => (
              <div key={label as string} className="flex items-center justify-between">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="font-medium tabular-nums text-foreground">
                  {cache.isLoading ? <span className="inline-block h-4 w-8 rounded bg-muted align-middle motion-safe:animate-pulse" /> : (value ?? "—")}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-xs text-muted-foreground">Available offline: your farmers, schedule, recent reports and orders.</p>
        </section>
      </div>

      {/* History */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
          <History className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          Sync history
        </h2>
        {history.length === 0 ? (
          <p className="py-4 text-sm text-muted-foreground">No syncs yet.</p>
        ) : (
          <ol className="space-y-3">
            {history.map((h) => (
              <li key={h.id} className="flex items-center gap-3">
                {h.status === "success" ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" aria-label="Succeeded" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-warning" aria-label="Partly failed" />
                )}
                <p className="flex-1 text-sm text-foreground">
                  {h.status === "success" ? "Uploaded" : "Partly uploaded"} {h.items} item{h.items === 1 ? "" : "s"}
                  <span className="text-muted-foreground"> · {(h.duration_ms / 1000).toFixed(1)}s</span>
                </p>
                <time className="text-xs text-muted-foreground" dateTime={h.created_at}>
                  {relativeTime(h.created_at)}
                </time>
              </li>
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
