// ========================================
// SERVICE WORKER - Curriculum Tracker PWA
// ========================================
// Version - Must match CURRENT_VERSION in index.html
const VERSION = '3.0.0';
const STATIC_CACHE = 'static-v' + VERSION;

// Install event - cache essential files
self.addEventListener('install', event => {
  console.log('[SW] Installing version:', VERSION);
  
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll([
        '/manifest.json',
        '/icon-192.png',
        '/icon-512.png'
      ]).catch(err => {
        console.log('[SW] Some files failed to cache:', err);
      });
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating version:', VERSION);
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ])
  );
});

// Fetch event - network first for HTML, cache first for static assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Always fetch HTML from network (never cache index.html)
  if (event.request.mode === 'navigate' || 
      url.pathname.endsWith('.html') || 
      url.pathname === '/') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If offline, try to return cached version
        return caches.match(event.request);
      })
    );
    return;
  }
  
  // Skip Firebase and external API requests
  if (url.hostname.includes('firebaseio.com') || 
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firebase')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // For static assets - cache first, then network
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Return cached version but also update cache in background
        fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(STATIC_CACHE).then(cache => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }
      
      // Not in cache - fetch from network
      return fetch(event.request).then(networkResponse => {
        // Cache successful responses for static assets
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(STATIC_CACHE).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      });
    })
  );
});

// Listen for skip waiting message
self.addEventListener('message', event => {
  if (event.data && (event.data.type === 'SKIP_WAITING' || event.data.action === 'skipWaiting')) {
    console.log('[SW] Skip waiting triggered');
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker loaded - Version ' + VERSION);
