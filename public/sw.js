// Minimal service worker for AniVerse.
//
// Scope, deliberately: this is NOT a full offline-first app (the content is
// live anime data from Jikan + your own DB, which can't be meaningfully
// cached ahead of time). What this DOES give you:
//   1. The install criteria Chrome/Android check for before showing an
//      "Add to Home Screen" prompt (a service worker with a fetch handler).
//   2. A friendly offline fallback page instead of the browser's default
//      "no internet" error when navigation fails.
//   3. Runtime caching for static assets (icons, fonts, JS/CSS chunks) so
//      repeat visits are a little faster.
const CACHE_NAME = "aniverse-static-v1";
const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = [
  OFFLINE_URL,
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET — never intercept mutations (POST/DELETE to the API).
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never cache API calls — this data (comments, watchlist, live anime
  // info) must always be fresh.
  if (url.pathname.startsWith("/api/")) return;

  // Page navigations: try the network first, fall back to the offline
  // page only if the network genuinely fails (not on 4xx/5xx from a live
  // page, just on connectivity failure).
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Static assets (Next.js build chunks, icons, fonts): cache-first, then
  // fall back to network and store the result for next time.
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/favicon.ico"
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            return res;
          })
      )
    );
  }
});
