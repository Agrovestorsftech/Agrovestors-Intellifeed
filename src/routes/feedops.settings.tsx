import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/data/PageHeader";
import { SaveBar, SettingRow, SettingsSection, useStoredSettings } from "@/components/data/Settings";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QC_LIMITS, WAREHOUSES } from "@/lib/ops/api";

export const Route = createFileRoute("/feedops/settings")({
  head: () => ({ meta: [{ title: "FeedOps Settings — IntelliFeed360" }] }),
  component: FeedOpsSettingsPage,
});

const DEFAULTS = {
  defaultWarehouse: WAREHOUSES[0]!,
  bagSize: "25",
  reorderLevel: "100",
  autoConfirmOrders: false,
  maxMoisture: String(QC_LIMITS.moisture),
  maxAflatoxin: String(QC_LIMITS.aflatoxin),
  holdFailedBatches: true,
  alertLowStock: true,
  alertNewOrder: true,
  alertQcFail: true,
  dailyDigest: false,
};

function FeedOpsSettingsPage() {
  const s = useStoredSettings("feedops", DEFAULTS);
  const d = s.draft;
  return (
    <>
      <PageHeader title="Settings" subtitle="Defaults for inventory, fulfilment, quality and alerts." />
      <div className="space-y-6">
        <SettingsSection title="Inventory" description="How stock is received and when you're warned.">
          <SettingRow label="Default warehouse" description="Pre-selected when adding stock or completing batches." htmlFor="defaultWarehouse">
            <Select value={d.defaultWarehouse} onValueChange={(v) => s.set("defaultWarehouse", v)}>
              <SelectTrigger id="defaultWarehouse">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WAREHOUSES.map((w) => (
                  <SelectItem key={w} value={w}>
                    {w}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingRow>
          <SettingRow label="Bag size (kg)" description="Used to convert production output into bags." htmlFor="bagSize">
            <Input id="bagSize" type="number" min={1} value={d.bagSize} onChange={(e) => s.set("bagSize", e.target.value)} />
          </SettingRow>
          <SettingRow label="Default reorder level (bags)" description="Applied to new stock lines." htmlFor="reorderLevel">
            <Input id="reorderLevel" type="number" min={0} value={d.reorderLevel} onChange={(e) => s.set("reorderLevel", e.target.value)} />
          </SettingRow>
        </SettingsSection>

        <SettingsSection title="Orders & fulfilment">
          <SettingRow label="Auto-confirm orders" description="Confirm field orders automatically when stock is available." htmlFor="autoConfirm">
            <Switch id="autoConfirm" checked={d.autoConfirmOrders} onCheckedChange={(v) => s.set("autoConfirmOrders", v)} />
          </SettingRow>
        </SettingsSection>

        <SettingsSection title="Quality control" description="Limits a batch must meet to pass.">
          <SettingRow label="Max moisture (%)" htmlFor="maxMoisture">
            <Input id="maxMoisture" type="number" step={0.1} value={d.maxMoisture} onChange={(e) => s.set("maxMoisture", e.target.value)} />
          </SettingRow>
          <SettingRow label="Max aflatoxin (ppb)" htmlFor="maxAflatoxin">
            <Input id="maxAflatoxin" type="number" value={d.maxAflatoxin} onChange={(e) => s.set("maxAflatoxin", e.target.value)} />
          </SettingRow>
          <SettingRow label="Hold failed batches" description="Keep failed batches out of available stock until re-tested." htmlFor="holdFailed">
            <Switch id="holdFailed" checked={d.holdFailedBatches} onCheckedChange={(v) => s.set("holdFailedBatches", v)} />
          </SettingRow>
        </SettingsSection>

        <SettingsSection title="Alerts" description="What sends you a notification.">
          <SettingRow label="Low or out of stock" htmlFor="alertLow">
            <Switch id="alertLow" checked={d.alertLowStock} onCheckedChange={(v) => s.set("alertLowStock", v)} />
          </SettingRow>
          <SettingRow label="New order placed" htmlFor="alertOrder">
            <Switch id="alertOrder" checked={d.alertNewOrder} onCheckedChange={(v) => s.set("alertNewOrder", v)} />
          </SettingRow>
          <SettingRow label="Batch fails quality control" htmlFor="alertQc">
            <Switch id="alertQc" checked={d.alertQcFail} onCheckedChange={(v) => s.set("alertQcFail", v)} />
          </SettingRow>
          <SettingRow label="Daily email digest" description="A summary of yesterday's orders, output and stock." htmlFor="digest">
            <Switch id="digest" checked={d.dailyDigest} onCheckedChange={(v) => s.set("dailyDigest", v)} />
          </SettingRow>
        </SettingsSection>
      </div>
      <SaveBar dirty={s.dirty} saving={s.saving} onSave={() => s.save()} onReset={s.reset} />
    </>
  );
}
