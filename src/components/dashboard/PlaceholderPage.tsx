import { DashboardHeader } from "./DashboardHeader";
import { Construction } from "lucide-react";

type Props = {
  title: string;
  subtitle?: string;
  sections?: string[];
};

export function PlaceholderPage({ title, subtitle, sections = [] }: Props) {
  return (
    <>
      <DashboardHeader title={title} subtitle={subtitle} />
      <div className="rounded-2xl bg-card border border-border p-10 shadow-sm">
        <div className="flex flex-col items-center text-center max-w-md mx-auto">
          <div className="h-14 w-14 rounded-2xl bg-primary-soft text-primary grid place-items-center">
            <Construction className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">Coming soon</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This page is scaffolded and ready for backend integration.
          </p>
        </div>
        {sections.length > 0 && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl mx-auto">
            {sections.map((s) => (
              <div
                key={s}
                className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground"
              >
                {s}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}