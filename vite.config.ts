import { defineConfig } from "vite";

// Reason: GitHub Pages serves the site at /grok-frogger/, so asset URLs need that base.
export default defineConfig({
  base: "/grok-frogger/",
  server: { port: 5173, open: true },
  build: { target: "es2022" },
});
