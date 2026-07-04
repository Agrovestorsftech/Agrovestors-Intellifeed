import { ChevronDown } from "lucide-react";

const total = 24;
const completed = 15;
const pending = 9;
const percent = Math.round((completed / total) * 100);

export function VisitSummary() {
  const size = 168;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  return (
    <section className="rounded-2xl bg-card border border-border p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-foreground">My Visit Summary</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Weekly progress</p>
        </div>
        <button className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors">
          This Week <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: size, height: size }}>
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
              stroke="var(--primary)"
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
              <p className="text-xs text-muted-foreground mt-0.5">Completed</p>
            </div>
          </div>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-muted/50 py-3">
          <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">Total</dt>
          <dd className="mt-1 text-lg font-semibold text-foreground">{total}</dd>
        </div>
        <div className="rounded-xl bg-success-soft py-3">
          <dt className="text-[11px] uppercase tracking-wide text-success">Done</dt>
          <dd className="mt-1 text-lg font-semibold text-success">{completed}</dd>
        </div>
        <div className="rounded-xl bg-warning-soft py-3">
          <dt className="text-[11px] uppercase tracking-wide text-warning-foreground">Pending</dt>
          <dd className="mt-1 text-lg font-semibold text-warning-foreground">{pending}</dd>
        </div>
      </dl>
    </section>
  );
}
