import { ChevronDown } from "lucide-react";

const total = 24;
const completed = 15;
const pending = 9;
const percent = Math.round((completed / total) * 100);

export function VisitSummary() {
  const size = 180;
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  return (
    <section className="rounded-2xl bg-card border border-border p-6 shadow-sm flex flex-col">
      <h2 className="text-base font-semibold text-foreground mb-5">My Visit Summary</h2>

      <div className="flex-1 flex items-center justify-between gap-4">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="var(--muted)"
              strokeWidth={stroke}
              fill="none"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="oklch(0.55 0.22 295)"
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-[stroke-dashoffset] duration-700"
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <p className="text-3xl font-semibold text-foreground">{percent}%</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Visits Completed</p>
            </div>
          </div>
        </div>

        <dl className="space-y-4 pr-2">
          <div>
            <dt className="text-xs text-muted-foreground">Total Visits</dt>
            <dd className="mt-0.5 text-2xl font-semibold text-foreground">{total}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Completed</dt>
            <dd className="mt-0.5 text-2xl font-semibold text-foreground">{completed}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Pending</dt>
            <dd className="mt-0.5 text-2xl font-semibold text-foreground">{pending}</dd>
          </div>
        </dl>
      </div>

      <button className="mt-6 w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
        This Week <ChevronDown className="h-4 w-4" />
      </button>
    </section>
  );
}
