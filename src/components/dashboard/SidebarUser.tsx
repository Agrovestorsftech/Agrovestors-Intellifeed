import { useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { PORTAL_LOGIN, type PortalId } from "@/lib/auth/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SidebarUserProps {
  fallbackName: string;
  fallbackRole: string;
  fallbackInitials: string;
  avatarGradient: string; // tailwind classes e.g. "from-primary to-info"
  /** Which portal login to return to after logout. */
  portal: PortalId;
}

/**
 * Shared sidebar footer: shows the current user (from auth context, with
 * hard-coded fallbacks for pre-hydration render) and a logout affordance.
 */
export function SidebarUser({
  fallbackName,
  fallbackRole,
  fallbackInitials,
  avatarGradient,
  portal,
}: SidebarUserProps) {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const name = session?.user.name ?? fallbackName;
  const role = session?.user.roleLabel ?? fallbackRole;
  const initials = session?.user.initials ?? fallbackInitials;

  const performLogout = () => {
    setConfirmOpen(false);
    logout();
    navigate({ to: PORTAL_LOGIN[portal], replace: true });
  };

  return (
    <>
    <div className="flex items-center gap-3 rounded-xl p-2">
      <div
        className={`h-10 w-10 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-sm font-semibold text-white ring-2 ring-sidebar-border`}
      >
        {initials}
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className="text-sm font-medium text-white truncate">{name}</p>
        <p className="text-xs text-sidebar-foreground/60 truncate">{role}</p>
      </div>
      <button
        onClick={() => setConfirmOpen(true)}
        aria-label="Log out"
        title="Log out"
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white transition-colors"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to logout of IntelliFeed360?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={performLogout}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Logout
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}