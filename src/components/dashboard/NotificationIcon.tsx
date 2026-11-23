import {
  AlertTriangle,
  BookOpen,
  CalendarClock,
  ClipboardCheck,
  Factory,
  LifeBuoy,
  ListChecks,
  Package,
  Salad,
  ShieldAlert,
  ShoppingCart,
  Siren,
  TrendingUp,
  Bell,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, { icon: LucideIcon; tone: string }> = {
  schedule: { icon: CalendarClock, tone: "bg-info-soft text-info" },
  report: { icon: ClipboardCheck, tone: "bg-primary-soft text-primary" },
  order: { icon: ShoppingCart, tone: "bg-info-soft text-info" },
  task: { icon: ListChecks, tone: "bg-warning-soft text-warning-foreground" },
  support: { icon: LifeBuoy, tone: "bg-accent text-accent-foreground" },
  performance: { icon: TrendingUp, tone: "bg-success-soft text-success" },
  growth: { icon: TrendingUp, tone: "bg-success-soft text-success" },
  alert: { icon: Siren, tone: "bg-destructive-soft text-destructive" },
  rescue: { icon: AlertTriangle, tone: "bg-destructive-soft text-destructive" },
  plan: { icon: Salad, tone: "bg-primary-soft text-primary" },
  knowledge: { icon: BookOpen, tone: "bg-accent text-accent-foreground" },
  inventory: { icon: Package, tone: "bg-warning-soft text-warning-foreground" },
  production: { icon: Factory, tone: "bg-primary-soft text-primary" },
  security: { icon: ShieldAlert, tone: "bg-destructive-soft text-destructive" },
};

export function NotificationIcon({ type, size = "sm" }: { type: string; size?: "sm" | "md" }) {
  const { icon: Icon, tone } = MAP[type] ?? { icon: Bell, tone: "bg-muted text-muted-foreground" };
  const box = size === "md" ? "h-10 w-10 rounded-xl" : "h-8 w-8 rounded-lg";
  return (
    <span className={`grid shrink-0 place-items-center ${box} ${tone}`} aria-hidden="true">
      <Icon className={size === "md" ? "h-4 w-4" : "h-4 w-4"} />
    </span>
  );
}
