import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  UserCog,
  UserCheck,
  Warehouse,
  BarChart3,
  ScrollText,
  Settings2,
  CreditCard,
  LifeBuoy,
  History,
  Settings,
  Sprout,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SidebarUser } from "./SidebarUser";

type NavItem = { title: string; to: string; icon: LucideIcon };

const navItems: NavItem[] = [
  { title: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { title: "User Management", to: "/admin/users", icon: Users },
  { title: "Role & Permissions", to: "/admin/roles", icon: ShieldCheck },
  { title: "Farmers", to: "/admin/farmers", icon: UserCog },
  { title: "Agents", to: "/admin/agents", icon: UserCheck },
  { title: "FeedOps", to: "/admin/feedops", icon: Warehouse },
  { title: "Reports & Analytics", to: "/admin/reports", icon: BarChart3 },
  { title: "System Logs", to: "/admin/system-logs", icon: ScrollText },
  { title: "Configurations", to: "/admin/configurations", icon: Settings2 },
  { title: "Subscription & Billing", to: "/admin/billing", icon: CreditCard },
  { title: "Support Tickets", to: "/admin/support-tickets", icon: LifeBuoy },
  { title: "Audit Trail", to: "/admin/audit-trail", icon: History },
  { title: "Settings", to: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
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
            item.to === "/admin"
              ? pathname === "/admin"
              : pathname === item.to || pathname.startsWith(item.to + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={[
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-info text-info-foreground shadow-lg shadow-info/30"
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
        <SidebarUser
          fallbackName="Admin User"
          fallbackRole="System Administrator"
          fallbackInitials="AU"
          avatarGradient="from-info to-primary"
          portal="admin"
        />
      </div>
    </aside>
  );
}