// Service worker van Karnootje: maakt de app installeerbaar en laat hem snel opstarten.
// Bewust eenvoudig: de pagina zelf komt altijd eerst van het net (zo krijg je meteen
// de nieuwste versie), de bestanden in /assets/ (met een vaste naam per versie) uit de cache.
const CACHE = 'karnootje-v1'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key)
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)
  if (req.method !== 'GET' || url.origin !== self.location.origin) return

  if (url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(req)
        if (hit) return hit
        const res = await fetch(req)
        if (res.ok) cache.put(req, res.clone())
        return res
      }),
    )
    return
  }

  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE)
        try {
          const res = await fetch(req)
          if (res.ok) cache.put(new URL('./', self.registration.scope).href, res.clone())
          return res
        } catch {
          const cached = await cache.match(new URL('./', self.registration.scope).href)
          return cached ?? Response.error()
        }
      })(),
    )
  }
})
