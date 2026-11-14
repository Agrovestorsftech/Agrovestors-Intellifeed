import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Award, BadgeCheck, CalendarCheck2, Flame, MapPinned, Target, Trophy, type LucideIcon } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth/AuthContext";
import { fetchPerformance } from "@/lib/dashboard/queries";

export const Route = createFileRoute("/performance")({ component: PerformancePage });

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-border bg-card p-6 shadow-sm ${className}`}>{children}</section>;
}

function Stat({
  icon: Icon,
  tone,
  label,
  value,
  foot,
  loading,
}: {
  icon: LucideIcon;
  tone: string;
  label: string;
  value: string;
  foot: React.ReactNode;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`} aria-hidden="true">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight text-foreground">
        {loading ? <span className="inline-block h-8 w-16 rounded bg-muted align-middle motion-safe:animate-pulse" /> : value}
      </p>
      <div className="mt-3 text-xs text-muted-foreground">{foot}</div>
    </div>
  );
}

function BreakdownBars({ rows, empty }: { rows: { name: string; value: number }[]; empty: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="space-y-3">
      {rows.slice(0, 6).map((r) => (
        <li key={r.name}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="text-foreground">{r.name}</span>
            <span className="tabular-nums text-muted-foreground">{r.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary motion-safe:transition-[width] motion-safe:duration-500" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function PerformancePage() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [weeks, setWeeks] = useState(8);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["performance", userId, weeks],
    queryFn: () => fetchPerformance(userId, weeks),
    enabled: !!userId,
  });

  if (isError) {
    return (
      <>
        <DashboardHeader title="My Performance" subtitle="Your visit metrics, targets and streaks." />
        <Card className="text-center">
          <p className="text-sm text-destructive">Couldn't load your performance.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Try again
          </Button>
        </Card>
      </>
    );
  }

  const target = data?.target ?? 10;
  const thisWeek = data?.thisWeek ?? 0;
  const toGo = Math.max(0, target - thisWeek);
  const myRank = (data?.leaderboard.findIndex((l) => l.me) ?? -1) + 1;

  return (
    <>
      <DashboardHeader title="My Performance" subtitle="Your visit metrics, targets and streaks." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          icon={Target}
          tone="bg-primary-soft text-primary"
          label="This week's visits"
          value={`${thisWeek}/${target}`}
          loading={isLoading}
          foot={
            <>
              <Progress value={Math.min(100, (thisWeek / target) * 100)} className="mb-2 h-1.5" aria-label="Weekly target progress" />
              {toGo === 0 ? "Weekly target reached. Nice work!" : `${toGo} more to hit your weekly target`}
            </>
          }
        />
        <Stat
          icon={CalendarCheck2}
          tone="bg-info-soft text-info"
          label="Completion rate"
          value={`${data?.completionRate ?? 0}%`}
          loading={isLoading}
          foot="Planned visits completed, last 30 days"
        />
        <Stat
          icon={BadgeCheck}
          tone="bg-success-soft text-success"
          label="Report approval"
          value={`${data?.approvalRate ?? 0}%`}
          loading={isLoading}
          foot={`Of ${data?.reviewedCount ?? 0} reviewed reports`}
        />
        <Stat
          icon={MapPinned}
          tone="bg-warning-soft text-warning-foreground"
          label="Farms covered"
          value={`${data?.farmsCovered ?? 0}/${data?.assigned ?? 0}`}
          loading={isLoading}
          foot="Assigned farms visited, last 30 days"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Weekly visits</h2>
              <p className="text-xs text-muted-foreground">Completed vs missed · dashed line is your target</p>
            </div>
            <Select value={String(weeks)} onValueChange={(v) => setWeeks(Number(v))}>
              <SelectTrigger className="h-9 w-[140px] rounded-xl text-sm" aria-label="Chart period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="4">Last 4 weeks</SelectItem>
                <SelectItem value="8">Last 8 weeks</SelectItem>
                <SelectItem value="12">Last 12 weeks</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="h-[280px] w-full">
            {isLoading ? (
              <div className="h-full rounded-xl bg-muted motion-safe:animate-pulse" aria-busy="true" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.weekly ?? []} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="week" tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} stroke="var(--muted-foreground)" />
                  <Tooltip
                    cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }}
                  />
                  <ReferenceLine y={target} stroke="var(--warning)" strokeDasharray="6 4" />
                  <Bar dataKey="completed" name="Completed" stackId="v" fill="var(--primary)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="missed" name="Missed" stackId="v" fill="var(--destructive)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-warning-soft text-warning-foreground" aria-hidden="true">
                <Flame className="h-6 w-6" />
              </span>
              <div>
                <p className="text-2xl font-semibold tabular-nums text-foreground">
                  {isLoading ? "—" : `${data?.streak ?? 0} day${data?.streak === 1 ? "" : "s"}`}
                </p>
                <p className="text-sm text-muted-foreground">Visit streak</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Days in a row with at least one completed visit.</p>
          </Card>

          <Card>
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-foreground">
              <Trophy className="h-4 w-4 text-warning" aria-hidden="true" />
              Team ranking
            </h2>
            {isLoading ? (
              <div className="h-24 rounded-xl bg-muted motion-safe:animate-pulse" />
            ) : (
              <>
                <ol className="space-y-2">
                  {(data?.leaderboard ?? []).map((l, i) => (
                    <li
                      key={l.id}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 ${l.me ? "bg-primary-soft" : ""}`}
                    >
                      <span className="w-5 text-sm font-semibold tabular-nums text-muted-foreground">{i + 1}</span>
                      <span className={`flex-1 text-sm ${l.me ? "font-semibold text-foreground" : "text-foreground"}`}>{l.name}</span>
                      <span className="text-sm tabular-nums text-muted-foreground">{l.value} reports</span>
                      {i === 0 && <Award className="h-4 w-4 text-warning" aria-label="Top agent" />}
                    </li>
                  ))}
                </ol>
                <p className="mt-3 text-xs text-muted-foreground">
                  {myRank ? `You're #${myRank} by reports submitted in the last 30 days.` : "Submit a report to join the ranking."}
                </p>
              </>
            )}
          </Card>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-base font-semibold text-foreground">Visits by livestock</h2>
          {isLoading ? <div className="h-32 rounded-xl bg-muted motion-safe:animate-pulse" /> : <BreakdownBars rows={data?.bySpecies ?? []} empty="No completed visits in the last 30 days." />}
        </Card>
        <Card>
          <h2 className="mb-4 text-base font-semibold text-foreground">Visits by region</h2>
          {isLoading ? <div className="h-32 rounded-xl bg-muted motion-safe:animate-pulse" /> : <BreakdownBars rows={data?.byRegion ?? []} empty="No completed visits in the last 30 days." />}
        </Card>
      </div>
    </>
  );
}
