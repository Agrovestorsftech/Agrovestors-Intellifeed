import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ClipboardList,
  Salad,
  Stethoscope,
  LifeBuoy,
  FileSearch,
  BookOpen,
  MessageSquare,
  Microscope,
  BarChart3,
  HelpCircle,
  Sprout,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SidebarUser } from "./SidebarUser";

type NavItem = { title: string; to: string; icon: LucideIcon };

const navItems: NavItem[] = [
  { title: "Dashboard", to: "/agent", icon: LayoutDashboard },
  { title: "Farmer Reviews", to: "/agent/farmer-reviews", icon: ClipboardList },
  { title: "Nutrition Plans", to: "/agent/nutrition-plans", icon: Salad },
  { title: "Health Assessments", to: "/agent/health-assessments", icon: Stethoscope },
  { title: "Rescue Plans", to: "/agent/rescue-plans", icon: LifeBuoy },
  { title: "Reports Review", to: "/agent/reports-review", icon: FileSearch },
  { title: "Knowledge Base", to: "/agent/knowledge-base", icon: BookOpen },
  { title: "Messages", to: "/agent/messages", icon: MessageSquare },
  { title: "Research Insights", to: "/agent/research-insights", icon: Microscope },
  { title: "Analytics", to: "/agent/analytics", icon: BarChart3 },
  { title: "Support", to: "/agent/support", icon: HelpCircle },
];

export function AgentSidebar() {
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
            item.to === "/agent"
              ? pathname === "/agent"
              : pathname === item.to || pathname.startsWith(item.to + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={[
                "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
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
          fallbackName="Dr. Jane Smith"
          fallbackRole="Admin Agent · Nutrition & Vet"
          fallbackInitials="JS"
          avatarGradient="from-primary to-info"
          portal="agent"
        />
      </div>
    </aside>
  );
}