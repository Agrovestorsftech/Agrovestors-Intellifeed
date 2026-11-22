import { createFileRoute } from "@tanstack/react-router";
import { SampleDataNotice } from "@/components/data/SampleDataNotice";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, CreditCard, Download, Receipt, Users, Wallet } from "lucide-react";
import { PageHeader } from "@/components/data/PageHeader";
import { DataTable, type Column } from "@/components/data/DataTable";
import { StatCards } from "@/components/data/StatCards";
import { StatusBadge } from "@/components/data/StatusBadge";
import { ChartCard, ChartSkeleton, SimpleBars } from "@/components/data/Charts";
import { downloadCsv } from "@/components/data/csv";
import { useAction } from "@/components/data/useAction";
import { Button } from "@/components/ui/button";
import {
  audit,
  listInvoices,
  listUsers,
  naira,
  nairaShort,
  shortDate,
  updateRow,
  useActorName,
} from "@/lib/ops/api";

export const Route = createFileRoute("/admin/billing")({
  head: () => ({ meta: [{ title: "Subscription & Billing — IntelliFeed360" }] }),
  component: BillingPage,
});

type Row = Awaited<ReturnType<typeof listInvoices>>[number];

// DEMO MODE: plan terms are fixed until the billing API exists.
const PLAN = {
  name: "IntelliFeed360 Growth",
  base: 120_000,
  perSeat: 15_000,
  renews: "1st of every month",
  card: "Visa ending 4242",
};

function BillingPage() {
  const act = useAction();
  const actor = useActorName();
  const q = useQuery({ queryKey: ["admin-invoices"], queryFn: listInvoices });
  const users = useQuery({ queryKey: ["admin-users"], queryFn: listUsers });
  const data = q.data ?? [];
  const seats = (users.data ?? []).filter((u) => u.status !== "suspended").length;
  const nextAmount = PLAN.base + seats * PLAN.perSeat;
  const due = data.filter((r) => r.status === "due" || r.status === "overdue");
  const paidYtd = data
    .filter(
      (r) =>
        r.status === "paid" && new Date(r.issued_at).getFullYear() === new Date().getFullYear(),
    )
    .reduce((s, r) => s + Number(r.amount), 0);
  const chart = [...data].reverse().map((r) => ({
    month: new Date(r.issued_at).toLocaleDateString(undefined, { month: "short" }),
    amount: Number(r.amount),
  }));

  const download = (r: Row) =>
    downloadCsv(`${r.number}.csv`, [
      { item: `${PLAN.name} — base`, period: r.period, qty: 1, amount: PLAN.base },
      { item: "User seats", period: r.period, qty: r.seats, amount: Number(r.amount) - PLAN.base },
      { item: "Total", period: r.period, qty: "", amount: r.amount },
    ]);

  const columns: Column<Row>[] = [
    {
      key: "number",
      header: "Invoice",
      sort: (r) => r.number,
      cell: (r) => (
        <div className="min-w-0">
          <p className="font-medium text-foreground">{r.number}</p>
          <p className="text-xs text-muted-foreground md:hidden">{r.period}</p>
        </div>
      ),
    },
    {
      key: "period",
      header: "Period",
      hideBelow: "md",
      sort: (r) => r.issued_at,
      cell: (r) => r.period,
    },
    {
      key: "seats",
      header: "Seats",
      align: "right",
      hideBelow: "sm",
      sort: (r) => r.seats,
      cell: (r) => r.seats,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      sort: (r) => Number(r.amount),
      cell: (r) => <span className="tabular-nums">{naira(r.amount)}</span>,
    },
    {
      key: "issued",
      header: "Issued",
      hideBelow: "md",
      sort: (r) => r.issued_at,
      cell: (r) => <span className="text-muted-foreground">{shortDate(r.issued_at)}</span>,
    },
    {
      key: "status",
      header: "Status",
      sort: (r) => r.status,
      cell: (r) => <StatusBadge status={r.status} />,
    },
  ];

  return (
    <>
      <SampleDataNotice what="subscriptions or billing" />
      <PageHeader
        title="Subscription & Billing"
        subtitle="Your plan, seats, invoices and payment method."
      />
      <StatCards
        loading={q.isLoading || users.isLoading}
        stats={[
          {
            label: "Current plan",
            value: PLAN.name.replace("IntelliFeed360 ", ""),
            hint: `Renews ${PLAN.renews}`,
            icon: CreditCard,
            tone: "primary",
          },
          {
            label: "Billable seats",
            value: seats,
            hint: `${naira(PLAN.perSeat)} per seat / month`,
            icon: Users,
            tone: "info",
          },
          {
            label: "Next invoice",
            value: nairaShort(nextAmount),
            hint: "Estimated from current seats",
            icon: CalendarClock,
            tone: "warning",
          },
          {
            label: "Paid this year",
            value: nairaShort(paidYtd),
            hint: due.length ? `${due.length} invoice due` : "Nothing outstanding",
            icon: Wallet,
            tone: due.length ? "destructive" : "success",
          },
        ]}
      />

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard title="Monthly spend" subtitle="Last 8 invoices" className="lg:col-span-2">
          {q.isLoading ? (
            <ChartSkeleton height={220} />
          ) : (
            <SimpleBars
              data={chart}
              x="month"
              series={[{ key: "amount", label: "Amount" }]}
              height={220}
              format={nairaShort}
            />
          )}
        </ChartCard>
        <section className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">Payment method</h2>
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-border p-4">
            <span
              className="grid h-10 w-14 place-items-center rounded-lg bg-muted text-xs font-semibold text-foreground"
              aria-hidden="true"
            >
              VISA
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">{PLAN.card}</p>
              <p className="text-xs text-muted-foreground">Charged automatically on the 1st</p>
            </div>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Base fee</dt>
              <dd className="tabular-nums text-foreground">{naira(PLAN.base)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                {seats} seats × {naira(PLAN.perSeat)}
              </dt>
              <dd className="tabular-nums text-foreground">{naira(seats * PLAN.perSeat)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-medium">
              <dt className="text-foreground">Next invoice</dt>
              <dd className="tabular-nums text-foreground">{naira(nextAmount)}</dd>
            </div>
          </dl>
          <div className="mt-auto pt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                act(async () => undefined, "Demo mode: card updates aren't available yet")
              }
            >
              Update card
            </Button>
          </div>
        </section>
      </div>

      <h2 className="mb-3 text-base font-semibold text-foreground">Invoices</h2>
      <DataTable
        rows={data}
        columns={columns}
        getId={(r) => r.id}
        loading={q.isLoading}
        error={q.error}
        onRetry={() => q.refetch()}
        searchText={(r) => `${r.number} ${r.period}`}
        searchPlaceholder="Search invoice or period"
        filters={[
          {
            id: "status",
            label: "Statuses",
            options: [
              { value: "paid", label: "Paid" },
              { value: "due", label: "Due" },
            ],
            value: (r) => r.status,
          },
        ]}
        defaultSort={{ key: "period", dir: "desc" }}
        rowLabel={(r) => r.number}
        rowActions={(r) => [
          { label: "Download", onSelect: () => download(r) },
          ...(r.status !== "paid"
            ? [
                {
                  label: `Pay ${naira(r.amount)} now`,
                  separatorBefore: true,
                  onSelect: () =>
                    act(async () => {
                      await updateRow("invoices", r.id, { status: "paid" });
                      await audit(actor, "updated", "invoice", r.number, {
                        field: "status",
                        from: r.status,
                        to: "paid",
                      });
                    }, `${r.number} paid`),
                },
              ]
            : []),
        ]}
        toolbar={
          <Button
            variant="outline"
            disabled={data.length === 0}
            onClick={() =>
              downloadCsv(
                "invoices.csv",
                data.map((r) => ({
                  number: r.number,
                  period: r.period,
                  seats: r.seats,
                  amount: r.amount,
                  status: r.status,
                  issued: r.issued_at,
                })),
              )
            }
          >
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            Export
          </Button>
        }
        empty={{
          title: "No invoices yet",
          hint: "Your first invoice is issued at the start of next month.",
        }}
      />
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Receipt className="h-3.5 w-3.5" aria-hidden="true" />
        Demo mode: payments are simulated.
      </p>
    </>
  );
}
