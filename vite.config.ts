import { defineConfig } from "vite";
import { vitePluginMpa } from "./scripts/mpa";

export default defineConfig({
  root: "src",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  plugins: [vitePluginMpa()],
});
