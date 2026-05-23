// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";

function shouldSuppressBuildWarning(warning: { code?: string; id?: string; message?: string }) {
  const warningMessage = typeof warning.message === "string" ? warning.message : "";
  const warningId = typeof warning.id === "string" ? warning.id : "";

  if (
    warning.code === "MODULE_LEVEL_DIRECTIVE" &&
    warningMessage.includes('"use client"')
  ) {
    return true;
  }

  if (
    warning.code === "EMPTY_BUNDLE" &&
    (warningMessage.includes("Generated an empty chunk") || warningId.includes("_libs/"))
  ) {
    return true;
  }

  return (
    (warning.code === "UNUSED_EXTERNAL_IMPORT" ||
      warningMessage.includes("are imported from external module")) &&
    (warningId.includes("@tanstack/start-server-core") ||
      warningId.includes("@tanstack/start-client-core") ||
      warningMessage.includes("@tanstack/start-server-core") ||
      warningMessage.includes("@tanstack/start-client-core"))
  );
}

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  cloudflare: false,
  plugins: [
    nitro({
      preset: "vercel",
      rollupConfig: {
        onwarn(warning, warn) {
          if (shouldSuppressBuildWarning(warning)) return;

          warn(warning);
        },
      },
    }),
  ],
  vite: {
    environments: {
      ssr: {
        build: {
          rollupOptions: {
            onwarn(warning, warn) {
              if (shouldSuppressBuildWarning(warning)) return;
              warn(warning);
            },
          },
        },
      },
    },
    build: {
      // Keep critical app code smaller by isolating heavy vendor groups.
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return;
            if (id.includes("@tanstack")) return "vendor-tanstack";
            if (id.includes("@supabase")) return "vendor-supabase";
            if (id.includes("@radix-ui") || id.includes("cmdk") || id.includes("vaul")) {
              return "vendor-ui";
            }
            if (id.includes("react") || id.includes("scheduler")) return "vendor-react";
          },
        },
        onwarn(warning, warn) {
          if (shouldSuppressBuildWarning(warning)) return;

          warn(warning);
        },
      },
    },
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
