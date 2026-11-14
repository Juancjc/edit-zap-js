import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  build: { outDir: "playground-dist", emptyOutDir: true },
});
