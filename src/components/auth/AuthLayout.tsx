import type { ReactNode } from "react";
import { ClipboardCheck, HeartPulse, Truck, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

const FEATURES = [
  { icon: ClipboardCheck, title: "Farm visits & reports", body: "Plan visits, log findings and track follow-ups from the field." },
  { icon: HeartPulse, title: "Health & nutrition", body: "Vets and nutritionists review cases and publish ration plans." },
  { icon: Truck, title: "Feed operations", body: "Orders, inventory and production in one live view." },
];

/**
 * Split-screen shell for sign-in / sign-up: brand story on the left (desktop),
 * form on the right. On mobile only the form shows, with the logo above it.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      {/* Brand panel */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-sidebar px-12 py-10 text-sidebar-foreground">
        <div aria-hidden="true" className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-primary/25 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-info/20 blur-3xl" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:22px_22px]"
        />

        <Logo tone="light" size="lg" className="relative" />

        <div className="relative max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Agrovestors platform</p>
          <h2 className="mt-3 text-4xl font-semibold leading-tight tracking-tight text-white">
            Smart feed. Healthy farms. Better profits.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-sidebar-foreground/80">
            One workspace for field agents, vets, feed operations and admins, built around the farms you serve.
          </p>

          <ul className="mt-10 space-y-5">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-white">{title}</span>
                  <span className="block text-sm text-sidebar-foreground/75">{body}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative flex items-center gap-2 text-xs text-sidebar-foreground/60">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Demo environment · sample data only
        </p>
      </aside>

      {/* Form side */}
      <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300">
          <Logo size="lg" className="mb-8 justify-center lg:hidden" />
          {children}
        </div>
      </main>
    </div>
  );
}
