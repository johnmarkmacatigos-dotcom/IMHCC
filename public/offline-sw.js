/*
 * Iloilo Modern Homes offline helper.
 * Only one job: when a page can't load because there is no internet, show our own
 * offline page (with phone and Messenger) instead of the browser's error screen.
 * Nothing else is cached, so visitors always get fresh content when online.
 */
const CACHE = "imhcc-offline-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll([OFFLINE_URL, "/images/logo.jpg"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("imhcc-offline-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
    return;
  }
  if (new URL(req.url).pathname === "/images/logo.jpg") {
    event.respondWith(fetch(req).catch(() => caches.match("/images/logo.jpg")));
  }
});
