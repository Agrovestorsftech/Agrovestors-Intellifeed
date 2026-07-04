import { ShieldCheck, Database, HardDrive, Cpu } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Status = "Online" | "Healthy" | "68% Used" | "Operational";

type Row = { icon: LucideIcon; label: string; status: Status };

const statusStyles: Record<Status, string> = {
  Online: "bg-success-soft text-success",
  Healthy: "bg-success-soft text-success",
  Operational: "bg-info-soft text-info",
  "68% Used": "bg-warning-soft text-warning-foreground",
};

const rows: Row[] = [
  { icon: ShieldCheck, label: "Server Status", status: "Online" },
  { icon: Database, label: "Database", status: "Healthy" },
  { icon: HardDrive, label: "Storage", status: "68% Used" },
  { icon: Cpu, label: "API Services", status: "Operational" },
];

export function SystemHealth() {
  return (
    <section className="rounded-2xl bg-card border border-border p-6 shadow-sm flex flex-col">
      <h2 className="text-base font-semibold text-foreground mb-5">System Health</h2>
      <ul className="flex-1 space-y-4">
        {rows.map((r) => {
          const Icon = r.icon;
          return (
            <li key={r.label} className="flex items-center gap-3">
              <div className="h-9 w-9 shrink-0 grid place-items-center rounded-xl bg-info-soft text-info">
                <Icon className="h-4 w-4" />
              </div>
              <p className="flex-1 text-sm font-medium text-foreground">{r.label}</p>
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusStyles[r.status]}`}
              >
                {r.status}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}