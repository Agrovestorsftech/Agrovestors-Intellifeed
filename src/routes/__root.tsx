import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { AdminSidebar } from "@/components/dashboard/AdminSidebar";
import { FeedOpsSidebar } from "@/components/dashboard/FeedOpsSidebar";
import { AgentSidebar } from "@/components/dashboard/AgentSidebar";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { RouteGuard } from "@/components/auth/RouteGuard";
import { isPublicPath } from "@/lib/auth/route-policy";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "IntelliFeed360 — Field Agent Dashboard" },
      { name: "description", content: "IntelliFeed360 by Agrovestors — Smart Feed. Healthy Farms. Better Profits. Field agent dashboard for managing farm visits, reports, and daily activities." },
      { name: "author", content: "Agrovestors" },
      { property: "og:title", content: "IntelliFeed360 — Field Agent Dashboard" },
      { property: "og:description", content: "Smart Feed. Healthy Farms. Better Profits." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const publicPath = isPublicPath(pathname);
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const isFeedOps = pathname === "/feedops" || pathname.startsWith("/feedops/");
  const isAgent = pathname === "/agent" || pathname.startsWith("/agent/");

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouteGuard>
          {publicPath ? (
            <Outlet />
          ) : (
            <div className="min-h-screen bg-background text-foreground">
              {isAgent ? (
                <AgentSidebar />
              ) : isFeedOps ? (
                <FeedOpsSidebar />
              ) : isAdmin ? (
                <AdminSidebar />
              ) : (
                <AppSidebar />
              )}
              <div className="lg:pl-[280px]">
                <div className="mx-auto max-w-[1400px] px-6 lg:px-8 py-8">
                  {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
                  <Outlet />
                </div>
              </div>
            </div>
          )}
        </RouteGuard>
      </AuthProvider>
    </QueryClientProvider>
  );
}
