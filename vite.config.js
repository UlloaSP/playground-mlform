import { defineConfig } from "vite";

// Keep public model calls on the playground's origin.
const proxy = {
  "/api/dosetailor": {
    target: "https://api.dosetailor.com",
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/dosetailor/, ""),
  },
  "/api/m3diseen": {
    target: "https://api.m3diseen.com",
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/m3diseen/, ""),
  },
};

export default defineConfig({ server: { proxy }, preview: { proxy } });
