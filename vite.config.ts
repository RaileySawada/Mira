import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import type { Plugin } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const appVersion: string = JSON.parse(
  readFileSync("package.json", "utf8"),
).version;

// Generate the offline asset list from the build so each release has its own cache.
function offlinePlugin(): Plugin {
  return {
    name: "mira-offline",
    apply: "build",
    generateBundle(_, bundle) {
      const assets = Object.keys(bundle).filter(
        (name) => !name.endsWith(".map"),
      );
      const branding = [
        "/brand/logo.png",
        "/brand/mark.png",
        "/icons/favicon-64.png",
        "/icons/favicon-32.png",
        "/icons/apple-touch-icon.png",
        "/icons/pwa-192.png",
        "/icons/pwa-512.png",
        "/icons/pwa-maskable-512.png",
      ];
      branding.push(
        ...["normal", "happy", "sad", "amazed", "thinking"].map(
          (name) => "/expressions/" + name + ".webp",
        ),
        ...Array.from(
          { length: 10 },
          (_, i) => "/rewards/" + (i + 1) + ".webp",
        ),
      );
      branding.push(
        ...[
          "master-first-card",
          "master-25-cards",
          "comeback-kid",
          "clear-due-queue",
          "due-five-days",
          "topic-tamer",
          "rising-scholar",
          "second-chance",
          "voice-learner",
          "offline-scholar",
        ].map((id) => "/rewards/" + id + ".webp"),
      );
      const version = createHash("sha256")
        .update(appVersion)
        .update(readFileSync("vite.config.ts"))
        .update(JSON.stringify(assets))
        .update(
          Buffer.concat(
            Object.values(bundle).map((file) =>
              Buffer.from(file.type === "chunk" ? file.code : file.source),
            ),
          ),
        )
        .update(readFileSync("index.html"))
        .update(readFileSync("public/manifest.webmanifest"))
        .update(
          Buffer.concat(branding.map((path) => readFileSync("public" + path))),
        )
        .digest("hex")
        .slice(0, 12);
      const urls = [
        "/",
        "/index.html",
        "/manifest.webmanifest",
        ...branding,
        ...assets.map((name) => "/" + name),
      ];
      this.emitFile({
        type: "asset",
        fileName: "version.json",
        source: JSON.stringify({ version: appVersion, build: version }),
      });
      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: `
const CACHE = "mira-${appVersion}-${version}";
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
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Only Firebase web-app configuration is public; never expose server secrets.
  const publicValue = (key: string) =>
    env["VITE_FIREBASE_" + key] || env["FIREBASE_" + key] || "";
  const firebase = {
    apiKey: publicValue("API_KEY"),
    authDomain: publicValue("AUTH_DOMAIN"),
    projectId: publicValue("PROJECT_ID"),
    appId: publicValue("APP_ID"),
    databaseURL: publicValue("DATABASE_URL"),
  };
  return {
    define: { __MIRA_FIREBASE_CONFIG__: JSON.stringify(firebase) },
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    plugins: [react(), tailwindcss(), offlinePlugin()],
  };
});
