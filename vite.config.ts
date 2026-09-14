import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import type { Plugin } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

// Generate the offline asset list from the build so each release has its own cache.
function offlinePlugin(): Plugin {
  return {
    name: "mira-offline",
    apply: "build",
    generateBundle(_, bundle) {
      const assets = Object.keys(bundle).filter(
        (name) => !name.endsWith(".map"),
      );
      const version = createHash("sha256")
        .update(JSON.stringify(assets))
        .update(readFileSync("index.html"))
        .update(readFileSync("public/manifest.webmanifest"))
        .update(readFileSync("public/icon.png"))
        .update(readFileSync("public/favicon.png"))
        .digest("hex")
        .slice(0, 12);
      const urls = [
        "/",
        "/index.html",
        "/manifest.webmanifest",
        "/favicon.png",
        "/icon.png",
        ...assets.map((name) => "/" + name),
      ];
      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: `
const CACHE = "mira-${version}";
const ASSETS = ${JSON.stringify(urls)};
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("mira-") && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  if (event.request.mode === "navigate") {
    event.respondWith(caches.open(CACHE).then(cache => cache.match("/index.html")).then(cached => cached || fetch(event.request)));
  } else if (ASSETS.includes(url.pathname)) {
    event.respondWith(caches.open(CACHE).then(cache => cache.match(event.request)).then(cached => cached || fetch(event.request)));
  }
});
`,
      });
    },
  };
}
export default defineConfig({
  plugins: [react(), tailwindcss(), offlinePlugin()],
});
