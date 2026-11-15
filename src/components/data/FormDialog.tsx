import { useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "number" | "date" | "datetime-local" | "select" | "textarea";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  hint?: string;
  min?: number;
  max?: number;
  step?: number;
  /** Span both columns of the form grid. */
  full?: boolean;
  autoComplete?: string;
};

export type FormValues = Record<string, string>;

type Props = {
  title: string;
  description?: string;
  fields: FieldDef[];
  submitLabel: string;
  onSubmit: (values: FormValues) => Promise<void> | void;
  successMessage?: string;
  initialValues?: FormValues;
  /** Extra validation; return an error message per field name. */
  validate?: (values: FormValues) => Record<string, string | undefined>;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/** Dialog with a generated form: labels, inline validation, pending state, toast on success. */
export function FormDialog({
  title,
  description,
  fields,
  submitLabel,
  onSubmit,
  successMessage,
  initialValues,
  validate,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: Props) {
  const [innerOpen, setInnerOpen] = useState(false);
  const open = controlledOpen ?? innerOpen;
  const setOpen = (v: boolean) => (onOpenChange ? onOpenChange(v) : setInnerOpen(v));

  const blank = () => Object.fromEntries(fields.map((f) => [f.name, initialValues?.[f.name] ?? (f.type === "select" ? (f.options?.[0]?.value ?? "") : "")]));
  const [values, setValues] = useState<FormValues>(blank);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [pending, setPending] = useState(false);

  // Reset whenever the dialog opens (or its initial values change).
  useEffect(() => {
    if (open) {
      setValues(blank());
      setErrors({});
    }
  }, [open, JSON.stringify(initialValues)]);

  const check = (v: FormValues) => {
    const e: Record<string, string | undefined> = {};
    for (const f of fields) {
      const val = (v[f.name] ?? "").trim();
      if (f.required && !val) e[f.name] = `Enter ${f.label.toLowerCase()}.`;
      else if (f.type === "number" && val) {
        const n = Number(val);
        if (Number.isNaN(n)) e[f.name] = "Enter a number.";
        else if (f.min != null && n < f.min) e[f.name] = `Must be at least ${f.min}.`;
        else if (f.max != null && n > f.max) e[f.name] = `Must be at most ${f.max}.`;
      } else if (f.type === "email" && val && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val)) e[f.name] = "Enter a valid email.";
    }
    return { ...e, ...(validate?.(v) ?? {}) };
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const e = check(values);
    setErrors(e);
    const firstBad = fields.find((f) => e[f.name]);
    if (firstBad) {
      document.getElementById(`fd-${firstBad.name}`)?.focus();
      return;
    }
    setPending(true);
    try {
      await onSubmit(Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()])));
      if (successMessage) toast.success(successMessage);
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  };

  const set = (name: string, v: string) => {
    setValues((s) => ({ ...s, [name]: v }));
    if (errors[name]) setErrors((s) => ({ ...s, [name]: undefined }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form onSubmit={submit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map((f) => {
              const id = `fd-${f.name}`;
              const err = errors[f.name];
              const described = err ? `${id}-error` : f.hint ? `${id}-hint` : undefined;
              const common = {
                id,
                "aria-invalid": !!err,
                "aria-describedby": described,
                disabled: pending,
              };
              return (
                <div key={f.name} className={f.full || f.type === "textarea" ? "sm:col-span-2" : ""}>
                  <Label htmlFor={id}>
                    {f.label}
                    {f.required && <span className="text-destructive"> *</span>}
                  </Label>
                  <div className="mt-1.5">
                    {f.type === "select" ? (
                      <Select value={values[f.name]} onValueChange={(v) => set(f.name, v)} disabled={pending}>
                        <SelectTrigger {...common}>
                          <SelectValue placeholder={f.placeholder ?? "Select…"} />
                        </SelectTrigger>
                        <SelectContent>
                          {(f.options ?? []).map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : f.type === "textarea" ? (
                      <Textarea {...common} rows={3} value={values[f.name]} placeholder={f.placeholder} onChange={(e) => set(f.name, e.target.value)} />
                    ) : (
                      <Input
                        {...common}
                        type={f.type ?? "text"}
                        inputMode={f.type === "number" ? "decimal" : undefined}
                        min={f.min}
                        max={f.max}
                        step={f.step}
                        autoComplete={f.autoComplete}
                        value={values[f.name]}
                        placeholder={f.placeholder}
                        onChange={(e) => set(f.name, e.target.value)}
                      />
                    )}
                  </div>
                  {err ? (
                    <p id={`${id}-error`} className="mt-1 text-xs text-destructive">
                      {err}
                    </p>
                  ) : f.hint ? (
                    <p id={`${id}-hint`} className="mt-1 text-xs text-muted-foreground">
                      {f.hint}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
