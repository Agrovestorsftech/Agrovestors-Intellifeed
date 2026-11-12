import { defineConfig, type PluginOption } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

export default defineConfig(({ command, mode }) => {
  const isBuild = command === "build";
  // `npm run build:dev` (vite build --mode development): unminified-name dev build.
  const isDevBuild = isBuild && mode === "development";

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
          esbuild: { keepNames: true },
        }
      : {}),
    server: {
      host: "::",
      port: 8080,
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
      ],
    },
  };
});
