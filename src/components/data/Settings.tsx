import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Settings kept in this browser (DEMO MODE: there is no settings API yet).
 * Returns the saved values, a draft you edit, and save / reset helpers.
 */
export function useStoredSettings<T extends Record<string, unknown>>(key: string, defaults: T) {
  const storageKey = `if360.settings.${key}`;
  const [saved, setSaved] = useState<T>(defaults);
  const [draft, setDraft] = useState<T>(defaults);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const v = { ...defaults, ...(JSON.parse(raw) as Partial<T>) };
        setSaved(v);
        setDraft(v);
      }
    } catch {
      /* storage unavailable: keep defaults */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const dirty = JSON.stringify(saved) !== JSON.stringify(draft);
  const set = <K extends keyof T>(k: K, v: T[K]) => setDraft((d) => ({ ...d, [k]: v }));

  async function save(onSaved?: (before: T, after: T) => Promise<void> | void) {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    try {
      localStorage.setItem(storageKey, JSON.stringify(draft));
    } catch {
      /* ignore */
    }
    await onSaved?.(saved, draft);
    setSaved(draft);
    setSaving(false);
    toast.success("Settings saved");
  }

  return { saved, draft, set, dirty, saving, save, reset: () => setDraft(saved) };
}

export function SettingsSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card shadow-sm">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

/** One labelled setting. `htmlFor` links the label to the control for screen readers. */
export function SettingRow({ label, description, htmlFor, children }: { label: string; description?: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
      <div className="min-w-0">
        <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="shrink-0 sm:w-64 sm:text-right [&>*]:sm:ml-auto">{children}</div>
    </div>
  );
}

/** Sticky save bar shown while there are unsaved changes. */
export function SaveBar({ dirty, saving, onSave, onReset }: { dirty: boolean; saving: boolean; onSave: () => void; onReset: () => void }) {
  if (!dirty && !saving) return null;
  return (
    <div className="sticky bottom-4 z-10 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 px-5 py-3 shadow-lg backdrop-blur" role="status">
      <p className="text-sm text-foreground">You have unsaved changes.</p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onReset} disabled={saving}>
          Discard
        </Button>
        <Button onClick={onSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
          Save changes
        </Button>
      </div>
    </div>
  );
}
