import { copyFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

function pagesRoutes() {
  return {
    name: "pages-routes",
    apply: "build",
    closeBundle() {
      const dist = resolve("dist");
      const index = resolve(dist, "index.html");
      copyFileSync(index, resolve(dist, "404.html"));
      mkdirSync(resolve(dist, "experience"), { recursive: true });
      copyFileSync(index, resolve(dist, "experience/index.html"));
      mkdirSync(resolve(dist, "body"), { recursive: true });
      copyFileSync(index, resolve(dist, "body/index.html"));
    },
  };
}

export default defineConfig({
  plugins: [react(), pagesRoutes()],
});
