// MovieFlix PWA Service Worker
const CACHE_NAME = "movieflix-v4";
const STATIC_ASSETS = [
  "/",
  "/home",
  "/favicon.svg",
  "/favicon.ico",
  "/icon-192.png",
  "/icon-512.png",
  "/manifest.json"
];

// INSTALL — Pre-cache critical static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(STATIC_ASSETS).catch((err) => console.warn("[SW] Pre-cache error:", err))
    )
  );
  self.skipWaiting();
});

// ACTIVATE — Clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => k !== CACHE_NAME && caches.delete(k)))
    )
  );
  self.clients.claim();
});

// FETCH — Network-first with cache fallback for app assets
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = event.request.url;
  const parsedUrl = new URL(url);

  // Allow all third-party services (ads, APIs, media streams) to pass straight through
  if (
    parsedUrl.origin !== self.location.origin ||
    parsedUrl.pathname.startsWith("/api/") ||
    // Full-screen player: always straight from the network, never cached or intercepted.
    parsedUrl.pathname === "/play" ||
    parsedUrl.pathname.includes("apiplayer") ||
    parsedUrl.pathname.includes("embed")
  ) {
    return;
  }

  // Network-first with Cache fallback for own assets
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === "navigate") {
            return caches.match("/home") || caches.match("/");
          }
          return new Response("Offline", { status: 503 });
        })
      )
  );
});
