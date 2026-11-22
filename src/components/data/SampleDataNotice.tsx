import { Info } from "lucide-react";
import { IS_API } from "@/lib/ops/api";

/** Shown with real sign-in on pages the backend doesn't serve yet, so sample
 * figures are never mistaken for live data. Renders nothing in demo mode. */
export function SampleDataNotice({ what = "this page" }: { what?: string }) {
  if (!IS_API) return null;
  return (
    <div
      role="note"
      className="mb-4 flex items-start gap-3 rounded-xl border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground"
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <p>
        <span className="font-medium text-foreground">Sample data.</span> The live system doesn't
        provide {what} yet, so the figures below are examples, not your records.
      </p>
    </div>
  );
}
