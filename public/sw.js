/**
 * Offline shell for מסלול.
 *
 * The app is a static export with all state in localStorage and Firestore, so
 * everything it needs to run is cacheable. Without this, opening the app in a
 * gym with no signal shows a browser error page, which is the one place it has
 * to work.
 *
 * Strategies, chosen per kind of request:
 *   navigations      network first, cache fallback  (updates land, offline opens)
 *   /_next/static    cache first                    (fingerprinted, immutable)
 *   /media/img       cache first, filled on demand  (1,324 files, never bulk)
 *   /data            stale while revalidate         (catalogue, changes rarely)
 *
 * Anything cross-origin is left alone: Firestore has its own offline queue and
 * must not be served stale copies.
 */

const VERSION = 'maslul-v1';

/**
 * This build's fingerprinted assets, filled in by scripts/stamp-sw.mjs. Empty
 * in the source: there is nothing to list until the build has run.
 */
const BUILD_ASSETS = [];

const SHELL = `${VERSION}-shell`;
const ASSETS = `${VERSION}-assets`;
const DATA = `${VERSION}-data`;
const KEEP = [SHELL, ASSETS, DATA];

const ROUTES = [
  '/',
  '/welcome',
  '/workout',
  '/program',
  '/library',
  '/progress',
  '/profile',
  '/coach',
  '/coach/trainee',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const shell = await caches.open(SHELL);
      const assets = await caches.open(ASSETS);
      // Individually, so one 404 cannot fail the whole install.
      await Promise.all([
        ...[...ROUTES, '/data/exercises.json', '/data/meta.json', '/manifest.webmanifest'].map(
          (url) => shell.add(url).catch(() => {}),
        ),
        ...BUILD_ASSETS.map((url) => assets.add(url).catch(() => {})),
      ]);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => !KEEP.includes(n)).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return hit ?? (await network) ?? Response.error();
}

async function networkFirst(request) {
  const cache = await caches.open(SHELL);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const url = new URL(request.url);
    return (
      (await cache.match(request)) ??
      (await cache.match(url.pathname)) ??
      (await cache.match('/')) ??
      Response.error()
    );
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request));
    return;
  }
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/media/img/')) {
    event.respondWith(cacheFirst(request, ASSETS));
    return;
  }
  if (url.pathname.startsWith('/data/')) {
    event.respondWith(staleWhileRevalidate(request, DATA));
  }
});
