// Service Worker for Curriculum Tracker PWA
// Version: 2.7.0 - Update this with each deployment

const CACHE_NAME = 'curriculum-tracker-v2.7.0';
const STATIC_CACHE = 'static-v2.7.0';

// Files to cache (static assets only, NOT index.html)
const STATIC_FILES = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event - cache static files
self.addEventListener('install', event => {
  console.log('[SW] Installing new service worker...');
  
  // Skip waiting to activate immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      console.log('[SW] Caching static files');
      return cache.addAll(STATIC_FILES).catch(err => {
        console.log('[SW] Some static files failed to cache:', err);
      });
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating new service worker...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete old caches
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - network-first for HTML, cache-first for static assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Always fetch HTML from network (never cache index.html)
  if (event.request.mode === 'navigate' || 
      url.pathname === '/' || 
      url.pathname === '/index.html' ||
      url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .catch(() => {
          // If offline, try cache as fallback
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // For API calls - always network
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

console.log('[SW] Service Worker loaded - Version 2.7.0');
