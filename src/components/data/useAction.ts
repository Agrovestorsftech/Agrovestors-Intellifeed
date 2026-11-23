import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Run a mutation, toast the outcome and refresh every query (the mock store is
 * cheap to re-read, so a blanket refresh keeps dashboards and lists in sync).
 */
export function useAction() {
  const qc = useQueryClient();
  return async function act(fn: () => Promise<unknown>, success?: string) {
    try {
      await fn();
      await qc.invalidateQueries();
      if (success) toast.success(success);
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      return false;
    }
  };
}

/** For FormDialog onSubmit: same refresh, but lets the dialog show the error and stay open. */
export function useRefresh() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries();
}
