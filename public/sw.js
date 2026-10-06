const CACHE = "mandato-shell-v4";
const DATA_CACHE = "mandato-data-v4";
const CORE = ["/", "/privacy.html", "/data/countries/index.json", "/data/countries/peru.json", "/data/countries/spain.json", "/data/countries/france.json", "/data/world/world-map.json"];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE);
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
      if (response.ok) void caches.open(CACHE).then((cache) => cache.put(request.url, response.clone()));
      return response;
    }).catch(async () => {
      const cache = await caches.open(CACHE);
      return (await cache.match(request.url, { ignoreVary: true })) ?? (await cache.match(new URL("/", self.location.origin), { ignoreVary: true }));
    }));
    return;
  }
  if (url.pathname.startsWith("/assets/")) {
    event.respondWith(caches.match(request, { ignoreVary: true }).then((cached) => cached ?? fetch(request)));
    return;
  }
  if (url.pathname.startsWith("/data/")) {
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
