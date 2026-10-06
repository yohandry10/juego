const CACHE = "mandato-shell-__BUILD_VERSION__";
const DATA_CACHE = "mandato-data-__BUILD_VERSION__";
const CORE = ["/", "/offline-manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE);
    const offlineManifest = await (await cache.match("/offline-manifest.json")).json();
    await cache.addAll(offlineManifest.files);
    const page = await cache.match("/");
    const html = await page.text();
    const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)].map((match) => match[1]);
    await cache.addAll(assets);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("mandato-") && key !== CACHE && key !== DATA_CACHE).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) { const copy = response.clone(); void caches.open(CACHE).then((cache) => cache.put(request.url, copy)); }
      return response;
    }).catch(async () => {
      const cache = await caches.open(CACHE);
      return (await cache.match(request.url, { ignoreVary: true })) ?? (await cache.match(new URL("/", self.location.origin), { ignoreVary: true }));
    }));
    return;
  }
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(request, { ignoreVary: true });
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    })());
    return;
  }
  if (url.pathname.startsWith("/data/") || ["/credits.html", "/privacy.html", "/THIRD-PARTY-NOTICES.txt", "/offline-manifest.json"].includes(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(DATA_CACHE);
      const cached = await caches.match(request, { ignoreVary: true });
      if (cached) return cached;
      const response = await fetch(request);
      if (response.ok) await cache.put(request, response.clone());
      return response;
    })());
  }
});
