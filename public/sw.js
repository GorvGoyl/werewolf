// Werewolf GM service worker: lets the app open with no connection (and makes it installable).
// - The page: network first, so you get the latest version when online. Offline or on a slow
//   connection it falls back to the copy saved last time.
// - Built files in /assets have a hash in their name and never change: cache first.
// - Icons and the manifest: cache first, refreshed when this file changes.
const CACHE = "werewolf-v1"
const STATIC_FILES = ["/manifest.webmanifest", "/favicon.svg", "/icon-192.png", "/icon-512.png", "/apple-touch-icon.png"]
const NETWORK_TIMEOUT_MS = 4000
// Module scripts are requested with an Origin header; a "Vary: Origin" reply must still match
const MATCH = { ignoreVary: true }

self.addEventListener("install", (event) => {
  event.waitUntil(saveAppShell())
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener("fetch", (event) => {
  const request = event.request
  if (request.method !== "GET") return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(event))
    return
  }
  if (url.pathname.startsWith("/assets/") || STATIC_FILES.includes(url.pathname)) {
    event.respondWith(cacheFirst(request))
  }
})

async function saveAppShell() {
  const cache = await caches.open(CACHE)
  await cache.addAll(STATIC_FILES)
  const response = await fetch("/", { cache: "no-cache" })
  if (response.ok) await savePage(cache, response)
}

// Keeps the page plus exactly the built files it loads, dropping files of older versions
async function savePage(cache, response) {
  const html = await response.clone().text()
  const assets = [...new Set(html.match(/\/assets\/[\w.-]+/g) || [])]
  for (const asset of assets) {
    if (!(await cache.match(asset, MATCH))) await cache.add(asset)
  }
  await cache.put("/", response)
  const keys = await cache.keys()
  await Promise.all(
    keys
      .filter((request) => {
        const path = new URL(request.url).pathname
        return path.startsWith("/assets/") && !assets.includes(path)
      })
      .map((request) => cache.delete(request)),
  )
}

async function networkFirstPage(event) {
  const cache = await caches.open(CACHE)
  const network = fetch(event.request).then((response) => {
    const path = new URL(event.request.url).pathname
    if (response.ok && (path === "/" || path === "/index.html")) {
      const saving = savePage(cache, response.clone())
      try {
        event.waitUntil(saving)
      } catch {
        // The page was already answered from the cache; saving continues on its own
      }
    }
    return response
  })

  const timeout = new Promise((resolve) => setTimeout(resolve, NETWORK_TIMEOUT_MS))
  try {
    const response = await Promise.race([network, timeout])
    if (response) return response
  } catch {
    // Offline: use the saved copy below
  }
  const saved = await cache.match("/", MATCH)
  if (saved) return saved
  return network
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE)
  const saved = await cache.match(request, MATCH)
  if (saved) return saved
  const response = await fetch(request)
  if (response.ok) await cache.put(request, response.clone())
  return response
}
