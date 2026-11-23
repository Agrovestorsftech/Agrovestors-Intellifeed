import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/**
 * Run a mutation, toast the outcome and refresh every query, which keeps
 * dashboards and lists in sync. The refresh runs in the background: against
 * the API it re-reads several lists and can take seconds, and the change is
 * already saved, so nothing should wait on it.
 */
export function useAction() {
  const qc = useQueryClient();
  return async function act(fn: () => Promise<unknown>, success?: string) {
    try {
      await fn();
      void qc.invalidateQueries();
      if (success) toast.success(success);
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      return false;
    }
  };
}

/** For FormDialog onSubmit: the same background refresh. The dialog closes as
 * soon as the save succeeds, and shows the error and stays open if it fails. */
export function useRefresh() {
  const qc = useQueryClient();
  return async () => {
    void qc.invalidateQueries();
  };
}
