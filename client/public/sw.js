const CACHE_NAME = "jaytrix-shell-v2";
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/brand/jaytrix-mark.svg",
  "/brand/jaytrix-logo.svg",
  "/brand/jaytrix-icon-192.png",
  "/brand/jaytrix-icon-512.png",
  "/brand/jaytrix-maskable-192.png",
  "/brand/jaytrix-maskable-512.png",
];

const isApiRequest = (url) => url.pathname.startsWith("/api/");
const isStaticAsset = (request) =>
  request.destination === "style" ||
  request.destination === "script" ||
  request.destination === "image" ||
  request.destination === "font";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin || isApiRequest(url)) {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("/", copy));
          return response;
        })
        .catch(() => caches.match("/"))
    );
    return;
  }

  if (isStaticAsset(event.request)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) {
          return cached;
        }

        return fetch(event.request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        });
      })
    );
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
