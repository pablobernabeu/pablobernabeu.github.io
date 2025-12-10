/*************************************************
 * Service Worker for Performance Optimization
 * Caches static assets and search index
 **************************************************/

const CACHE_NAME = "website-cache-v1";
const SEARCH_CACHE = "search-cache-v1";

// Assets to cache immediately
const STATIC_ASSETS = [
  "/",
  "/css/academic.min.css",
  "/js/academic.min.js",
  "/js/deferred-loader.js",
  "/images/icon.png",
];

// Assets to cache on demand
const CACHE_PATTERNS = [
  /\.(?:js|css|woff2?|png|jpg|jpeg|gif|svg|webp)$/i,
  /\/index\.json$/,
  /\/posts?\//,
  /\/publications?\//,
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log("[SW] Static assets cached");
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error("[SW] Failed to cache static assets:", err);
      })
  );
});

// Activate event - clean old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== SEARCH_CACHE) {
              console.log("[SW] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("[SW] Service worker activated");
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip external requests
  if (url.origin !== location.origin) {
    return;
  }

  // Handle search index specially
  if (url.pathname === "/index.json") {
    event.respondWith(handleSearchIndex(request));
    return;
  }

  // Handle other requests
  event.respondWith(handleRequest(request));
});

// Handle search index with stale-while-revalidate
async function handleSearchIndex(request) {
  try {
    const cache = await caches.open(SEARCH_CACHE);
    const cachedResponse = await cache.match(request);

    // Serve from cache immediately if available
    if (cachedResponse) {
      console.log("[SW] Serving search index from cache");

      // Update cache in background
      fetch(request)
        .then((response) => {
          if (response.ok) {
            cache.put(request, response.clone());
            console.log("[SW] Search index cache updated");
          }
        })
        .catch((err) =>
          console.log("[SW] Failed to update search cache:", err)
        );

      return cachedResponse;
    }

    // Fetch and cache if not in cache
    console.log("[SW] Fetching search index from network");
    const response = await fetch(request);

    if (response.ok) {
      cache.put(request, response.clone());
      console.log("[SW] Search index cached");
    }

    return response;
  } catch (error) {
    console.error("[SW] Search index error:", error);
    return new Response('{"error": "Search temporarily unavailable"}', {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Handle regular requests
async function handleRequest(request) {
  const url = new URL(request.url);

  // Check if request should be cached
  const shouldCache = CACHE_PATTERNS.some((pattern) =>
    pattern.test(url.pathname)
  );

  if (!shouldCache) {
    // Don't cache, just fetch
    return fetch(request);
  }

  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    // Return cached version if available
    if (cachedResponse) {
      console.log("[SW] Serving from cache:", url.pathname);
      return cachedResponse;
    }

    // Fetch from network
    console.log("[SW] Fetching from network:", url.pathname);
    const response = await fetch(request);

    // Cache successful responses
    if (response.ok && response.status < 400) {
      cache.put(request, response.clone());
      console.log("[SW] Cached:", url.pathname);
    }

    return response;
  } catch (error) {
    console.error("[SW] Fetch error:", error);

    // Try to serve from cache as fallback
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log("[SW] Serving stale cache as fallback:", url.pathname);
      return cachedResponse;
    }

    // Return error response
    return new Response("Offline - content not available", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

// Handle cache quota exceeded
self.addEventListener("quotaexceeded", (event) => {
  console.warn("[SW] Storage quota exceeded, clearing old caches");

  caches.keys().then((cacheNames) => {
    // Keep only the latest caches
    const cachesToDelete = cacheNames.filter(
      (name) => name !== CACHE_NAME && name !== SEARCH_CACHE
    );

    return Promise.all(cachesToDelete.map((name) => caches.delete(name)));
  });
});

// Message handling for cache management
self.addEventListener("message", (event) => {
  const { action, data } = event.data;

  switch (action) {
    case "skipWaiting":
      self.skipWaiting();
      break;

    case "clearCache":
      caches.delete(CACHE_NAME).then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;

    case "getCacheSize":
      getCacheSize().then((size) => {
        event.ports[0].postMessage({ size });
      });
      break;
  }
});

// Get cache size for monitoring
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();

    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }

  return totalSize;
}
