import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Boxes,
  Factory,
  ClipboardList,
  Truck,
  Building2,
  ShieldCheck,
  Repeat,
  BarChart3,
  Settings,
  ChevronDown,
  Sprout,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type NavItem = { title: string; to: string; icon: LucideIcon };

const navItems: NavItem[] = [
  { title: "Dashboard", to: "/feedops", icon: LayoutDashboard },
  { title: "Feed Inventory", to: "/feedops/inventory", icon: Boxes },
  { title: "Feed Production", to: "/feedops/production", icon: Factory },
  { title: "Orders & Fulfillment", to: "/feedops/orders", icon: ClipboardList },
  { title: "Deliveries", to: "/feedops/deliveries", icon: Truck },
  { title: "Suppliers", to: "/feedops/suppliers", icon: Building2 },
  { title: "Quality Control", to: "/feedops/quality-control", icon: ShieldCheck },
  { title: "Stock Transfers", to: "/feedops/stock-transfers", icon: Repeat },
  { title: "Reports & Analytics", to: "/feedops/reports", icon: BarChart3 },
  { title: "Settings", to: "/feedops/settings", icon: Settings },
];

export function FeedOpsSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-[280px] flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-6 pt-7 pb-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/30">
            <Sprout className="h-5 w-5 text-primary" />
          </div>
          <div className="flex items-baseline">
            <span className="text-lg font-semibold text-white tracking-tight">IntelliFeed</span>
            <span className="text-lg font-semibold text-primary tracking-tight">360</span>
          </div>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-sidebar-foreground/60">
          Smart Feed. Healthy Farms. Better Profits.
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const active =
            item.to === "/feedops"
              ? pathname === "/feedops"
              : pathname === item.to || pathname.startsWith(item.to + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={[
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-warning text-white shadow-lg shadow-warning/30"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white",
              ].join(" ")}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <button className="w-full flex items-center gap-3 rounded-xl p-2 hover:bg-sidebar-accent transition-colors">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-warning to-primary flex items-center justify-center text-sm font-semibold text-white ring-2 ring-sidebar-border">
            FM
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-medium text-white truncate">FeedOps Manager</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">Feed Operations</p>
          </div>
          <ChevronDown className="h-4 w-4 text-sidebar-foreground/60" />
        </button>
      </div>
    </aside>
  );
}