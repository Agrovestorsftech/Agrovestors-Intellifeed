import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LifeBuoy } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { OpenTicketDialog } from "@/components/field/dialogs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { relativeTime } from "@/lib/dashboard/queries";

export const Route = createFileRoute("/agent/support")({ component: AgentSupportPage });

const statusStyle: Record<string, string> = {
  open: "bg-warning-soft text-warning-foreground",
  in_progress: "bg-info-soft text-info",
  resolved: "bg-success-soft text-success",
  closed: "bg-muted text-muted-foreground",
};

function AgentSupportPage() {
  const { session } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["my-tickets", session?.user.id],
    enabled: !!session?.user.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("support_tickets")
        .select("id, subject, status, priority, created_at")
        .eq("opened_by", session!.user.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const faqs = [
    { q: "How do I approve a report?", a: "Go to Reports Review and use the Approve / Reject buttons on each pending report." },
    { q: "How do I open a health case?", a: "Use New case on Health Assessments, or Open health case from a farmer's card in Farmer Reviews." },
    { q: "Where do I publish guidelines?", a: "Use New article on the Knowledge Base page." },
  ];

  return (
    <>
      <DashboardHeader title="Support" subtitle="Get help and raise tickets." />
      <section className="rounded-2xl bg-card border border-border p-4 mb-4 flex justify-end">
        <OpenTicketDialog trigger={<Button><LifeBuoy className="h-4 w-4 mr-2" />New ticket</Button>} />
      </section>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="rounded-2xl bg-card border border-border p-6 shadow-sm">
          <h2 className="text-base font-semibold mb-3">My tickets</h2>
          {isLoading ? <div className="animate-pulse h-24" /> : (data?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">No open tickets.</p>
          ) : (
            <ul className="divide-y divide-border">
              {(data ?? []).map((t: any) => (
                <li key={t.id} className="py-3 flex justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-2">{t.subject}</p>
                    <p className="text-xs text-muted-foreground">{relativeTime(t.created_at)} · {t.priority}</p>
                  </div>
                  <Badge className={statusStyle[t.status] ?? "bg-muted"}>{t.status.replace("_", " ")}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-2xl bg-card border border-border p-6 shadow-sm">
          <h2 className="text-base font-semibold mb-3">FAQ</h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <div key={f.q}>
                <p className="text-sm font-medium">{f.q}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{f.a}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
