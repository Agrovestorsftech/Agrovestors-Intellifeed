import { defineConfig, loadEnv, type PluginOption } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

export default defineConfig(({ command, mode }) => {
  const isBuild = command === "build";
  // `npm run build:dev` (vite build --mode development): unminified-name dev build.
  const isDevBuild = isBuild && mode === "development";
  // Dev only: backend that /api is forwarded to (see `server.proxy` below).
  const apiTarget =
    loadEnv(mode, process.cwd(), "").VITE_API_PROXY_TARGET ||
    "https://api-testing-intellifeed360.onrender.com";

  const plugins: PluginOption[] = [
    tailwindcss(),
    // Resolves the `@/*` alias from tsconfig.json.
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      // Use src/server.ts (our SSR error wrapper) as the server entry.
      server: { entry: "server" },
      // Fail the build if server-only code is imported into the client bundle.
      importProtection: {
        behavior: "error",
        client: {
          files: ["**/server/**"],
          specifiers: ["server-only"],
        },
      },
    }),
  ];

  if (isBuild) {
    // Server build/output (build only; dev uses Vite's own SSR server).
    // Defaults to Cloudflare Workers. Override per deploy with the NITRO_PRESET
    // env var (e.g. NITRO_PRESET=node-server or vercel) or by setting `preset`.
    plugins.push(nitro({ defaultPreset: "cloudflare-module" }));
  }

  plugins.push(viteReact());

  return {
    plugins,
    ...(isDevBuild
      ? {
          environments: {
            client: { define: { "process.env.NODE_ENV": JSON.stringify("development") } },
          },
          // Vite 8 bundles with Rolldown; keepNames moved from `esbuild` to the output options.
          build: { rolldownOptions: { output: { keepNames: true } } },
        }
      : {}),
    server: {
      host: "::",
      port: 8080,
      // The backend's dashboard login uses a SameSite=Lax session cookie, which
      // browsers won't send from localhost to another site. Forwarding /api
      // through this dev server makes the cookie first-party. Origin/Referer are
      // rewritten to the backend's own address so Django's CSRF origin check
      // passes. Deployed builds call VITE_API_BASE_URL directly instead.
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          cookieDomainRewrite: "",
          configure(proxy) {
            proxy.on("proxyReq", (proxyReq) => {
              if (proxyReq.getHeader("origin")) proxyReq.setHeader("origin", apiTarget);
              const referer = proxyReq.getHeader("referer");
              if (typeof referer === "string") {
                proxyReq.setHeader("referer", `${apiTarget}${new URL(referer).pathname}`);
              }
            });
          },
        },
      },
    },
    resolve: {
      // Guard against duplicate React / TanStack Query copies in the bundle.
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        // Pre-bundle UI deps so the dev server doesn't re-optimize mid-session
        // (which can load two React copies and crash with an invalid hook call).
        "@radix-ui/react-dropdown-menu",
        "@radix-ui/react-popover",
        "@radix-ui/react-select",
        "@radix-ui/react-switch",
        "@radix-ui/react-progress",
        "@radix-ui/react-dialog",
        "react-day-picker",
        "recharts",
        "sonner",
      ],
    },
  };
});
