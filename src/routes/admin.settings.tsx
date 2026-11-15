import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/data/PageHeader";
import {
  SaveBar,
  SettingRow,
  SettingsSection,
  useStoredSettings,
} from "@/components/data/Settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { audit, useActorName } from "@/lib/ops/api";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Settings — IntelliFeed360" }] }),
  component: AdminSettingsPage,
});

function demoKey(prefix: string) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return `${prefix}_${Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")}`;
}

const DEFAULTS = {
  companyName: "Agrovestors Farm Tech Ltd",
  supportEmail: "support@agrovestors.com",
  supportPhone: "+234 800 000 0000",
  address: "Kaduna, Nigeria",
  productName: "IntelliFeed360",
  accent: "green",
  timezone: "Africa/Lagos",
  currency: "NGN",
  dateFormat: "DD/MM/YYYY",
  language: "en",
  sessionTimeout: "60",
  requireMfa: false,
  maintenanceMode: false,
  allowSelfSignup: true,
  syncInterval: "15",
  dataRetentionDays: "365",
  mobileKey: "if_live_mob_7h2k9x3m1q8w5e4r6t0y2u9i3o7p1a5s",
  serverKey: "if_live_srv_4d8f2g6h1j9k3l7z5x0c2v8b4n6m1q3w",
};

type Settings = typeof DEFAULTS;
const LABELS: Partial<Record<keyof Settings, string>> = {
  companyName: "company name",
  supportEmail: "support email",
  sessionTimeout: "session timeout",
  requireMfa: "require 2FA",
  maintenanceMode: "maintenance mode",
  allowSelfSignup: "self sign-up",
  mobileKey: "mobile API key",
  serverKey: "server API key",
};

function AdminSettingsPage() {
  const s = useStoredSettings("admin", DEFAULTS);
  const actor = useActorName();
  const d = s.draft;

  const text = (
    k: keyof Settings,
    label: string,
    opts: { type?: string; description?: string } = {},
  ) => (
    <SettingRow label={label} description={opts.description} htmlFor={k}>
      <Input
        id={k}
        type={opts.type ?? "text"}
        value={String(d[k])}
        onChange={(e) => s.set(k, e.target.value as never)}
      />
    </SettingRow>
  );
  const select = (
    k: keyof Settings,
    label: string,
    options: [string, string][],
    description?: string,
  ) => (
    <SettingRow label={label} description={description} htmlFor={k}>
      <Select value={String(d[k])} onValueChange={(v) => s.set(k, v as never)}>
        <SelectTrigger id={k}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([v, l]) => (
            <SelectItem key={v} value={v}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </SettingRow>
  );
  const toggle = (k: keyof Settings, label: string, description?: string) => (
    <SettingRow label={label} description={description} htmlFor={k}>
      <Switch id={k} checked={Boolean(d[k])} onCheckedChange={(v) => s.set(k, v as never)} />
    </SettingRow>
  );

  const onSave = () =>
    s.save(async (before, after) => {
      for (const k of Object.keys(after) as (keyof Settings)[]) {
        if (before[k] === after[k]) continue;
        const secret = k.endsWith("Key");
        await audit(actor, "updated", "settings", "Platform settings", {
          field: LABELS[k] ?? k.replace(/([A-Z])/g, " $1").toLowerCase(),
          from: secret ? "••••" + String(before[k]).slice(-4) : before[k],
          to: secret ? "••••" + String(after[k]).slice(-4) : after[k],
        });
      }
    });

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Company profile, branding and platform-wide preferences."
      />
      <div className="space-y-6">
        <SettingsSection
          title="Company profile"
          description="Shown on invoices, emails and the farmer app's help screen."
        >
          {text("companyName", "Company name")}
          {text("supportEmail", "Support email", { type: "email" })}
          {text("supportPhone", "Support phone", { type: "tel" })}
          {text("address", "Address")}
        </SettingsSection>

        <SettingsSection title="Branding">
          {text("productName", "Product name", {
            description: "Appears in page titles and emails.",
          })}
          {select(
            "accent",
            "Accent colour",
            [
              ["green", "Agrovestors green"],
              ["teal", "Teal"],
              ["amber", "Harvest amber"],
            ],
            "Applied to the farmer app on next release.",
          )}
        </SettingsSection>

        <SettingsSection title="General">
          {select("timezone", "Time zone", [
            ["Africa/Lagos", "West Africa Time (Lagos)"],
            ["UTC", "UTC"],
          ])}
          {select("currency", "Currency", [
            ["NGN", "Nigerian naira (₦)"],
            ["USD", "US dollar ($)"],
          ])}
          {select("dateFormat", "Date format", [
            ["DD/MM/YYYY", "DD/MM/YYYY"],
            ["MM/DD/YYYY", "MM/DD/YYYY"],
            ["YYYY-MM-DD", "YYYY-MM-DD"],
          ])}
          {select(
            "language",
            "Default language",
            [
              ["en", "English"],
              ["ha", "Hausa"],
              ["yo", "Yoruba"],
              ["ig", "Igbo"],
            ],
            "For new farmer accounts.",
          )}
        </SettingsSection>

        <SettingsSection
          title="API keys"
          description="Used by the Flutter app and server integrations to reach the IntelliFeed360 API. Demo keys — not real credentials."
        >
          <ApiKeyRow
            label="Mobile app key"
            value={d.mobileKey}
            onRotate={() => s.set("mobileKey", demoKey("if_live_mob"))}
          />
          <ApiKeyRow
            label="Server key"
            value={d.serverKey}
            onRotate={() => s.set("serverKey", demoKey("if_live_srv"))}
          />
        </SettingsSection>

        <SettingsSection title="Security & system">
          {select(
            "sessionTimeout",
            "Session timeout",
            [
              ["15", "15 minutes"],
              ["30", "30 minutes"],
              ["60", "1 hour"],
              ["480", "8 hours"],
            ],
            "Dashboard users are signed out after this much inactivity.",
          )}
          {toggle("requireMfa", "Require two-factor sign-in", "For admins and admin agents.")}
          {toggle(
            "allowSelfSignup",
            "Allow self sign-up",
            "Field agents, admin agents and FeedOps staff can create their own accounts. Admins are always invited.",
          )}
          {select(
            "syncInterval",
            "Mobile sync interval",
            [
              ["5", "Every 5 minutes"],
              ["15", "Every 15 minutes"],
              ["60", "Hourly"],
            ],
            "How often the farmer app syncs when online.",
          )}
          {text("dataRetentionDays", "Log retention (days)", {
            type: "number",
            description: "System logs older than this are deleted.",
          })}
          {toggle(
            "maintenanceMode",
            "Maintenance mode",
            "Shows a maintenance notice and blocks sign-in for everyone except admins.",
          )}
        </SettingsSection>
      </div>
      <SaveBar dirty={s.dirty} saving={s.saving} onSave={onSave} onReset={s.reset} />
    </>
  );
}

function ApiKeyRow({
  label,
  value,
  onRotate,
}: {
  label: string;
  value: string;
  onRotate: () => void;
}) {
  const [shown, setShown] = useState(false);
  const masked = `${value.slice(0, 12)}${"•".repeat(16)}${value.slice(-4)}`;
  return (
    <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
          {shown ? value : masked}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label={shown ? `Hide ${label}` : `Show ${label}`}
          onClick={() => setShown((v) => !v)}
        >
          {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label={`Copy ${label}`}
          onClick={() =>
            navigator.clipboard
              .writeText(value)
              .then(() => toast.success("Copied"))
              .catch(() => toast.error("Couldn't copy"))
          }
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            onRotate();
            toast.info("New key generated. Save changes to apply it.");
          }}
        >
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
          Rotate
        </Button>
      </div>
    </div>
  );
}
