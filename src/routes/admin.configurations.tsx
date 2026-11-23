import { createFileRoute } from "@tanstack/react-router";
import { SampleDataNotice } from "@/components/data/SampleDataNotice";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { PageHeader } from "@/components/data/PageHeader";
import {
  SaveBar,
  SettingRow,
  SettingsSection,
  useStoredSettings,
} from "@/components/data/Settings";
import { humanize } from "@/components/data/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { audit, useActorName } from "@/lib/ops/api";

export const Route = createFileRoute("/admin/configurations")({
  head: () => ({ meta: [{ title: "Configurations — IntelliFeed360" }] }),
  component: ConfigurationsPage,
});

type SpeciesCfg = {
  enabled: boolean;
  stages: string;
  minProtein: string;
  maxMortality: string;
  targetFcr: string;
};

const SPECIES: Record<string, SpeciesCfg> = {
  poultry: {
    enabled: true,
    stages: "Starter, Grower, Layer, Finisher",
    minProtein: "16",
    maxMortality: "5",
    targetFcr: "1.8",
  },
  cattle: {
    enabled: true,
    stages: "Calf, Heifer, Lactating, Dry, Fattening",
    minProtein: "12",
    maxMortality: "2",
    targetFcr: "6.5",
  },
  goats: {
    enabled: true,
    stages: "Kid, Grower, Doe, Buck",
    minProtein: "14",
    maxMortality: "4",
    targetFcr: "5",
  },
  sheep: {
    enabled: true,
    stages: "Lamb, Grower, Ewe, Ram",
    minProtein: "13",
    maxMortality: "4",
    targetFcr: "5.5",
  },
  pigs: {
    enabled: true,
    stages: "Piglet, Weaner, Grower, Finisher, Sow",
    minProtein: "16",
    maxMortality: "3",
    targetFcr: "2.8",
  },
  fish: {
    enabled: true,
    stages: "Fry, Fingerling, Juvenile, Grow-out",
    minProtein: "32",
    maxMortality: "8",
    targetFcr: "1.3",
  },
};

const EVENTS = [
  "critical_case",
  "report_submitted",
  "plan_published",
  "order_placed",
  "low_stock",
  "qc_failed",
] as const;
const AUDIENCES = ["field_agent", "admin_agent", "feedops", "system_admin", "farmer"] as const;
const AUDIENCE_LABEL: Record<string, string> = {
  field_agent: "Field agents",
  admin_agent: "Admin agents",
  feedops: "FeedOps",
  system_admin: "Admins",
  farmer: "Farmers",
};

const DEFAULTS = {
  species: SPECIES,
  feedCategories: [
    "Starter",
    "Grower",
    "Finisher",
    "Layer",
    "Concentrate",
    "Premix",
    "Pellets",
    "Floating",
  ],
  notify: {
    critical_case: ["admin_agent", "system_admin", "field_agent"],
    report_submitted: ["admin_agent"],
    plan_published: ["field_agent", "farmer"],
    order_placed: ["feedops"],
    low_stock: ["feedops", "system_admin"],
    qc_failed: ["feedops", "system_admin"],
  } as Record<string, string[]>,
  escalateCriticalMins: "30",
  escalateHighHours: "12",
  aiRequireEvidence: true,
  aiAllowDosage: false,
  rationSource: "research_approved",
};

type Cfg = typeof DEFAULTS;

function ConfigurationsPage() {
  const s = useStoredSettings("configurations", DEFAULTS);
  const actor = useActorName();
  const d = s.draft;
  const [newCat, setNewCat] = useState("");

  const setSpecies = (k: string, patch: Partial<SpeciesCfg>) =>
    s.set("species", { ...d.species, [k]: { ...d.species[k]!, ...patch } });
  const toggleNotify = (ev: string, aud: string, on: boolean) => {
    const cur = d.notify[ev] ?? [];
    s.set("notify", { ...d.notify, [ev]: on ? [...cur, aud] : cur.filter((a) => a !== aud) });
  };
  const addCategory = () => {
    const v = newCat.trim();
    if (!v || d.feedCategories.some((c) => c.toLowerCase() === v.toLowerCase())) return;
    s.set("feedCategories", [...d.feedCategories, v]);
    setNewCat("");
  };

  const onSave = () =>
    s.save(async (before, after) => {
      for (const k of Object.keys(after) as (keyof Cfg)[]) {
        if (JSON.stringify(before[k]) === JSON.stringify(after[k])) continue;
        await audit(
          actor,
          "updated",
          "configuration",
          humanize(k.replace(/([A-Z])/g, "_$1").toLowerCase()),
        );
      }
    });

  return (
    <>
      <SampleDataNotice what="platform configuration" />
      <PageHeader
        title="Configurations"
        subtitle="Research parameters, species, feed categories, alerts and AI guardrails used across the platform."
      />
      <div className="space-y-6">
        <SettingsSection
          title="Species & research parameters"
          description="Thresholds the intelligence engine uses to flag farms. Values come from the research team's approved documents."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                  <th scope="col" className="px-6 py-3 font-medium">
                    Species
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Lifecycle stages
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Min crude protein (%)
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Max mortality (%)
                  </th>
                  <th scope="col" className="px-3 py-3 font-medium">
                    Target FCR
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(d.species).map(([k, v]) => (
                  <tr key={k} className="border-b border-border last:border-0">
                    <th scope="row" className="px-6 py-3 text-left font-normal">
                      <label className="flex items-center gap-3">
                        <Switch
                          checked={v.enabled}
                          onCheckedChange={(on) => setSpecies(k, { enabled: on })}
                          aria-label={`Enable ${k}`}
                        />
                        <span className={v.enabled ? "text-foreground" : "text-muted-foreground"}>
                          {humanize(k)}
                        </span>
                      </label>
                    </th>
                    <td className="px-3 py-2">
                      <Input
                        value={v.stages}
                        disabled={!v.enabled}
                        aria-label={`${k} stages`}
                        onChange={(e) => setSpecies(k, { stages: e.target.value })}
                      />
                    </td>
                    {(["minProtein", "maxMortality", "targetFcr"] as const).map((f) => (
                      <td key={f} className="w-32 px-3 py-2">
                        <Input
                          type="number"
                          step="0.1"
                          value={v[f]}
                          disabled={!v.enabled}
                          aria-label={`${k} ${f}`}
                          onChange={(e) => setSpecies(k, { [f]: e.target.value })}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SettingsSection>

        <SettingsSection
          title="Feed categories"
          description="Used to group products in the Feed Store and FeedOps inventory."
        >
          <div className="px-6 py-4">
            <ul className="flex flex-wrap gap-2">
              {d.feedCategories.map((c) => (
                <li
                  key={c}
                  className="inline-flex items-center gap-1 rounded-full bg-muted py-1 pl-3 pr-1 text-sm text-foreground"
                >
                  {c}
                  <button
                    type="button"
                    className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground hover:bg-background hover:text-destructive"
                    aria-label={`Remove ${c}`}
                    onClick={() =>
                      s.set(
                        "feedCategories",
                        d.feedCategories.filter((x) => x !== c),
                      )
                    }
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
            <form
              className="mt-4 flex max-w-sm gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                addCategory();
              }}
            >
              <Input
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                placeholder="New category"
                aria-label="New feed category"
              />
              <Button type="submit" variant="outline" disabled={!newCat.trim()}>
                <Plus className="mr-1 h-4 w-4" aria-hidden="true" />
                Add
              </Button>
            </form>
          </div>
        </SettingsSection>

        <SettingsSection
          title="Notification routing"
          description="Who is notified when each event happens."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                  <th scope="col" className="px-6 py-3 font-medium">
                    Event
                  </th>
                  {AUDIENCES.map((a) => (
                    <th key={a} scope="col" className="px-3 py-3 text-center font-medium">
                      {AUDIENCE_LABEL[a]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {EVENTS.map((ev) => (
                  <tr key={ev} className="border-b border-border last:border-0">
                    <th scope="row" className="px-6 py-3 text-left font-normal text-foreground">
                      {humanize(ev).replace("Qc", "QC")}
                    </th>
                    {AUDIENCES.map((a) => (
                      <td key={a} className="px-3 py-3 text-center">
                        <Checkbox
                          checked={(d.notify[ev] ?? []).includes(a)}
                          aria-label={`${humanize(ev)} notifies ${AUDIENCE_LABEL[a]}`}
                          onCheckedChange={(v) => toggleNotify(ev, a, v === true)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SettingsSection>

        <SettingsSection
          title="Health-case escalation"
          description="When an unanswered case is escalated to the assigned vet's supervisor."
        >
          <SettingRow label="Critical cases (minutes)" htmlFor="escCrit">
            <Input
              id="escCrit"
              type="number"
              min={5}
              value={d.escalateCriticalMins}
              onChange={(e) => s.set("escalateCriticalMins", e.target.value)}
            />
          </SettingRow>
          <SettingRow label="High-severity cases (hours)" htmlFor="escHigh">
            <Input
              id="escHigh"
              type="number"
              min={1}
              value={d.escalateHighHours}
              onChange={(e) => s.set("escalateHighHours", e.target.value)}
            />
          </SettingRow>
        </SettingsSection>

        <SettingsSection
          title="Intelligence & AI guardrails"
          description="Limits on what the AI assistant may say. Applied by the backend once the AI service is connected."
        >
          <SettingRow
            label="Ration source"
            description="Where feed formulations may come from."
            htmlFor="rationSource"
          >
            <Select value={d.rationSource} onValueChange={(v) => s.set("rationSource", v)}>
              <SelectTrigger id="rationSource">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="research_approved">Research-approved formulas only</SelectItem>
                <SelectItem value="approved_plus_agent">Approved + admin-agent edits</SelectItem>
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow
            label="Require evidence references"
            description="Every recommendation must cite the research document it came from."
            htmlFor="aiEvidence"
          >
            <Switch
              id="aiEvidence"
              checked={d.aiRequireEvidence}
              onCheckedChange={(v) => s.set("aiRequireEvidence", v)}
            />
          </SettingRow>
          <SettingRow
            label="Allow medication dosages"
            description="Off: the assistant refers dosage questions to the assigned vet."
            htmlFor="aiDosage"
          >
            <Switch
              id="aiDosage"
              checked={d.aiAllowDosage}
              onCheckedChange={(v) => s.set("aiAllowDosage", v)}
            />
          </SettingRow>
        </SettingsSection>
      </div>
      <SaveBar dirty={s.dirty} saving={s.saving} onSave={onSave} onReset={s.reset} />
    </>
  );
}
