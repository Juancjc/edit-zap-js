import { defineConfig } from "vitest/config";
export default defineConfig({
  build: {
    lib: {
      entry: {
        index: "packages/editor/src/index.ts",
        core: "packages/core/src/index.ts",
        vue: "packages/vue/src/index.ts",
        react: "packages/react/src/index.ts",
      },
      formats: ["es"],
      fileName: (_, name) => `${name}.js`,
      cssFileName: "style",
    },
    rollupOptions: { external: ["vue", "react", "react/jsx-runtime"] },
  },
  test: { environment: "jsdom", include: ["tests/**/*.test.ts*"] },
});
