import { Logo } from "@/components/brand/Logo";
import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { AppSidebarInner } from "./AppSidebar";
import { AdminSidebarInner } from "./AdminSidebar";
import { AgentSidebarInner } from "./AgentSidebar";
import { FeedOpsSidebarInner } from "./FeedOpsSidebar";

type Portal = "admin" | "agent" | "feedops" | "field";

function InnerFor({ portal, onNavigate }: { portal: Portal; onNavigate: () => void }) {
  switch (portal) {
    case "admin":
      return <AdminSidebarInner onNavigate={onNavigate} />;
    case "agent":
      return <AgentSidebarInner onNavigate={onNavigate} />;
    case "feedops":
      return <FeedOpsSidebarInner onNavigate={onNavigate} />;
    default:
      return <AppSidebarInner onNavigate={onNavigate} />;
  }
}

/**
 * Mobile / tablet top bar with a hamburger that opens the appropriate
 * portal sidebar in an off-canvas drawer. Hidden on lg+ where the
 * sidebar renders as a fixed aside.
 */
export function MobileTopbar({ portal }: { portal: Portal }): ReactNode {
  const [open, setOpen] = useState(false);
  return (
    <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border bg-background/95 backdrop-blur px-4 py-3">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            aria-label="Open navigation"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-[280px] p-0 border-r-0 bg-sidebar text-sidebar-foreground [&>button]:text-sidebar-foreground/70"
        >
          <VisuallyHidden>
            <SheetTitle>Navigation</SheetTitle>
          </VisuallyHidden>
          <InnerFor portal={portal} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <Logo size="sm" />
      <div className="w-10" />
    </div>
  );
}