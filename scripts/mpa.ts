import { Plugin, UserConfig } from "vite";
import fg from "fast-glob";

const generatePathConfig = (root = process.cwd()) => {
  const paths = fg.sync(`${root}/**/*.html`);
  return paths.map((path) => path.replace(root, ""));
};

const resolveMpaConfig = (vitePlugin: UserConfig): UserConfig => ({
  build: {
    rollupOptions: {
      input: generatePathConfig(vitePlugin.root),
    },
  },
});

export const vitePluginMpa = (): Plugin => ({
  name: "vite-plugin-mpa",
  config: (vitePlugin, _) => resolveMpaConfig(vitePlugin),
  apply: "build",
});
