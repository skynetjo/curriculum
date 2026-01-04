// ========================================
// SERVICE WORKER - Curriculum Tracker PWA
// Enhanced Version with Full PWA Features
// Fixed Offline Capability Check
// ========================================
// Version - UPDATE THIS WITH EACH DEPLOYMENT
const VERSION = '3.7.3';
const STATIC_CACHE = 'static-v' + VERSION;
const DYNAMIC_CACHE = 'dynamic-v' + VERSION;
const OFFLINE_CACHE = 'offline-v' + VERSION;
const DATA_CACHE = 'data-v' + VERSION;

// ========================================
// CACHE CONFIGURATION
// ========================================
// Files to cache immediately on install (App Shell)
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/Icon-72.jpg',
  '/Icon-96.jpg',
  '/Icon-144.jpg',
  '/Icon-152.jpg',
  '/Icon-192.jpg',
  '/Icon-384.jpg',
  '/Icon-512.jpg'
];

// External resources to cache
const EXTERNAL_RESOURCES = [
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js'
];

// Firebase URLs to never cache
const FIREBASE_URLS = [
  'firebaseio.com',
  'googleapis.com',
  'firebase',
  'firestore'
];

// ========================================
// INSTALL EVENT - Cache App Shell
// ========================================
self.addEventListener('install', event => {
  console.log('[SW] Installing version:', VERSION);
  
  event.waitUntil(
    Promise.all([
      // Cache static files with proper error handling
      caches.open(STATIC_CACHE).then(async cache => {
        console.log('[SW] Caching static files');
        
        // Cache each file individually with error handling
        for (const url of STATIC_FILES) {
          try {
            const response = await fetch(url, { cache: 'reload' });
            if (response.ok) {
              await cache.put(url, response);
              console.log('[SW] Cached:', url);
            }
          } catch (err) {
            console.log('[SW] Failed to cache (will retry):', url);
          }
        }
      }),
      
      // Cache external resources (CDN files)
      caches.open(DYNAMIC_CACHE).then(async cache => {
        console.log('[SW] Caching external resources');
        
        for (const url of EXTERNAL_RESOURCES) {
          try {
            const response = await fetch(url, { mode: 'cors' });
            if (response.ok) {
              await cache.put(url, response);
            }
          } catch (err) {
            console.log('[SW] Failed to cache external:', url);
          }
        }
      }),
      
      // Ensure offline page is cached
      caches.open(OFFLINE_CACHE).then(async cache => {
        try {
          const response = await fetch('/offline.html', { cache: 'reload' });
          if (response.ok) {
            await cache.put('/offline.html', response);
            console.log('[SW] Offline page cached successfully');
          }
        } catch (err) {
          console.log('[SW] Creating fallback offline page');
          // Create a fallback response if offline.html doesn't exist
          const fallbackResponse = new Response(
            getOfflineFallbackHTML(),
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
          await cache.put('/offline.html', fallbackResponse);
        }
      })
    ]).then(() => {
      console.log('[SW] Installation complete');
      self.skipWaiting();
    })
  );
});

// ========================================
// ACTIVATE EVENT - Clean Old Caches
// ========================================
self.addEventListener('activate', event => {
  console.log('[SW] Activating version:', VERSION);
  
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, OFFLINE_CACHE, DATA_CACHE];
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!currentCaches.includes(cacheName)) {
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

// ========================================
// FETCH EVENT - Smart Caching Strategy
// FIXED: Proper offline handling for PWABuilder
// ========================================
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) schemes
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Skip Firebase requests - always network
  if (FIREBASE_URLS.some(domain => url.hostname.includes(domain))) {
    return;
  }
  
  // Skip Freshdesk/chat widgets
  if (url.hostname.includes('freshdesk') || 
      url.hostname.includes('freshchat') ||
      url.hostname.includes('freshworks')) {
    return;
  }
  
  // ========================================
  // NAVIGATION REQUESTS (HTML Pages)
  // Network First → Cache → Offline Page
  // ========================================
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Try network first
          const networkResponse = await fetch(request);
          
          // Cache the response for future offline use
          if (networkResponse.ok) {
            const cache = await caches.open(DYNAMIC_CACHE);
            cache.put(request, networkResponse.clone());
          }
          
          return networkResponse;
        } catch (error) {
          console.log('[SW] Navigation failed, trying cache:', request.url);
          
          // Try to get from cache
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Try to return the root page from cache
          const rootCache = await caches.match('/');
          if (rootCache) {
            return rootCache;
          }
          
          // Return offline page
          const offlineResponse = await caches.match('/offline.html');
          if (offlineResponse) {
            return offlineResponse;
          }
          
          // Ultimate fallback
          return new Response(
            getOfflineFallbackHTML(),
            { 
              status: 200,
              headers: { 'Content-Type': 'text/html; charset=utf-8' } 
            }
          );
        }
      })()
    );
    return;
  }
  
  // ========================================
  // HTML PAGES (non-navigation)
  // ========================================
  if (url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) return cachedResponse;
          
          const offlineResponse = await caches.match('/offline.html');
          return offlineResponse || new Response(
            getOfflineFallbackHTML(),
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }
  
  // ========================================
  // API REQUESTS - Network First with Cache Fallback
  // ========================================
  if (url.pathname.includes('/api/') || url.pathname.includes('/data/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(DATA_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }
  
  // ========================================
  // STATIC ASSETS - Cache First with Network Fallback
  // ========================================
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json)$/)) {
    event.respondWith(
      caches.match(request)
        .then(async cachedResponse => {
          if (cachedResponse) {
            // Return cache but also update in background (stale-while-revalidate)
            fetch(request).then(response => {
              if (response.ok) {
                caches.open(DYNAMIC_CACHE).then(cache => {
                  cache.put(request, response);
                });
              }
            }).catch(() => {});
            return cachedResponse;
          }
          
          // Not in cache, fetch and cache
          try {
            const response = await fetch(request);
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE).then(cache => {
                cache.put(request, responseClone);
              });
            }
            return response;
          } catch (error) {
            console.log('[SW] Asset not available:', request.url);
            return new Response('', { status: 404 });
          }
        })
    );
    return;
  }
  
  // ========================================
  // DEFAULT - Network with Cache Fallback
  // ========================================
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// ========================================
// BACKGROUND SYNC - For Offline Data Submission
// ========================================
self.addEventListener('sync', event => {
  console.log('[SW] Background Sync triggered:', event.tag);
  
  if (event.tag === 'sync-attendance') {
    event.waitUntil(syncAttendance());
  }
  
  if (event.tag === 'sync-curriculum') {
    event.waitUntil(syncCurriculum());
  }
  
  if (event.tag === 'sync-feedback') {
    event.waitUntil(syncFeedback());
  }
  
  if (event.tag === 'sync-all-data') {
    event.waitUntil(syncAllData());
  }
});

// Sync attendance data when online
async function syncAttendance() {
  try {
    const db = await openIndexedDB();
    const pendingAttendance = await getFromStore(db, 'pendingAttendance');
    
    for (const record of pendingAttendance) {
      try {
        await self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_ATTENDANCE',
              data: record
            });
          });
        });
        
        await removeFromStore(db, 'pendingAttendance', record.id);
        console.log('[SW] Attendance synced:', record.id);
      } catch (err) {
        console.error('[SW] Failed to sync attendance:', err);
      }
    }
    
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_COMPLETE', store: 'attendance' });
    });
    
  } catch (err) {
    console.error('[SW] Sync attendance error:', err);
  }
}

// Sync curriculum data when online
async function syncCurriculum() {
  try {
    const db = await openIndexedDB();
    const pendingCurriculum = await getFromStore(db, 'pendingCurriculum');
    
    for (const record of pendingCurriculum) {
      try {
        await self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_CURRICULUM',
              data: record
            });
          });
        });
        
        await removeFromStore(db, 'pendingCurriculum', record.id);
        console.log('[SW] Curriculum synced:', record.id);
      } catch (err) {
        console.error('[SW] Failed to sync curriculum:', err);
      }
    }
    
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_COMPLETE', store: 'curriculum' });
    });
    
  } catch (err) {
    console.error('[SW] Sync curriculum error:', err);
  }
}

// Sync feedback data when online
async function syncFeedback() {
  try {
    const db = await openIndexedDB();
    const pendingFeedback = await getFromStore(db, 'pendingFeedback');
    
    for (const record of pendingFeedback) {
      try {
        await self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_FEEDBACK',
              data: record
            });
          });
        });
        
        await removeFromStore(db, 'pendingFeedback', record.id);
        console.log('[SW] Feedback synced:', record.id);
      } catch (err) {
        console.error('[SW] Failed to sync feedback:', err);
      }
    }
    
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_COMPLETE', store: 'feedback' });
    });
    
  } catch (err) {
    console.error('[SW] Sync feedback error:', err);
  }
}

// Sync all pending data
async function syncAllData() {
  console.log('[SW] Syncing all pending data...');
  await syncAttendance();
  await syncCurriculum();
  await syncFeedback();
  console.log('[SW] All data sync complete');
}

// ========================================
// PERIODIC BACKGROUND SYNC
// ========================================
self.addEventListener('periodicsync', event => {
  console.log('[SW] Periodic Sync triggered:', event.tag);
  
  if (event.tag === 'update-curriculum-data') {
    event.waitUntil(updateCurriculumData());
  }
  
  if (event.tag === 'check-notifications') {
    event.waitUntil(checkForNotifications());
  }
  
  if (event.tag === 'sync-pending-data') {
    event.waitUntil(syncAllData());
  }
});

// Fetch latest curriculum data in background
async function updateCurriculumData() {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'PERIODIC_SYNC',
        action: 'UPDATE_CURRICULUM'
      });
    });
    console.log('[SW] Periodic curriculum update requested');
  } catch (err) {
    console.error('[SW] Periodic sync failed:', err);
  }
}

// Check for new notifications
async function checkForNotifications() {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'PERIODIC_SYNC',
        action: 'CHECK_NOTIFICATIONS'
      });
    });
  } catch (err) {
    console.error('[SW] Notification check failed:', err);
  }
}

// ========================================
// PUSH NOTIFICATIONS
// ========================================
self.addEventListener('push', event => {
  console.log('[SW] Push notification received');
  
  let data = {
    title: 'Curriculum Tracker',
    body: 'You have a new notification',
    icon: '/Icon-192.jpg',
    badge: '/Icon-72.jpg',
    tag: 'default',
    data: {}
  };
  
  try {
    if (event.data) {
      const payload = event.data.json();
      data = { ...data, ...payload };
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon || '/Icon-192.jpg',
    badge: data.badge || '/Icon-72.jpg',
    tag: data.tag,
    data: data.data,
    vibrate: [100, 50, 100],
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [
      { action: 'open', title: 'Open App', icon: '/Icon-192.jpg' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    image: data.image,
    renotify: true
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              data: event.notification.data
            });
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', event => {
  console.log('[SW] Notification closed');
});

// ========================================
// MESSAGE HANDLING
// ========================================
self.addEventListener('message', event => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: VERSION });
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(names => {
        return Promise.all(names.map(name => caches.delete(name)));
      }).then(() => {
        if (event.ports[0]) {
          event.ports[0].postMessage({ success: true });
        }
      })
    );
  }
  
  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then(cache => {
        return cache.addAll(event.data.urls);
      })
    );
  }
  
  if (event.data.type === 'STORE_FOR_SYNC') {
    event.waitUntil(
      storeForSync(event.data.store, event.data.data)
    );
  }
  
  if (event.data.type === 'REQUEST_SYNC') {
    event.waitUntil(
      self.registration.sync.register(event.data.tag)
    );
  }
});

// ========================================
// INDEXED DB HELPERS
// ========================================
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CurriculumTrackerOffline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('pendingAttendance')) {
        db.createObjectStore('pendingAttendance', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pendingCurriculum')) {
        db.createObjectStore('pendingCurriculum', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pendingFeedback')) {
        db.createObjectStore('pendingFeedback', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pendingObservations')) {
        db.createObjectStore('pendingObservations', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cachedData')) {
        db.createObjectStore('cachedData', { keyPath: 'key' });
      }
    };
  });
}

function getFromStore(db, storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function addToStore(db, storeName, data) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function removeFromStore(db, storeName, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function storeForSync(storeName, data) {
  try {
    const db = await openIndexedDB();
    await addToStore(db, storeName, {
      ...data,
      id: data.id || Date.now().toString(),
      timestamp: Date.now()
    });
    console.log('[SW] Data stored for sync:', storeName);
  } catch (err) {
    console.error('[SW] Failed to store for sync:', err);
  }
}

// ========================================
// OFFLINE FALLBACK HTML
// This ensures PWABuilder offline test passes
// ========================================
function getOfflineFallbackHTML() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - Curriculum Tracker</title>
  <meta name="theme-color" content="#F4B41A">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      padding: 20px;
    }
    .container {
      text-align: center;
      max-width: 400px;
      padding: 40px 30px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 20px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .icon {
      width: 100px;
      height: 100px;
      margin: 0 auto 30px;
      background: linear-gradient(135deg, #F4B41A 0%, #E8A830 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 50px;
    }
    h1 { font-size: 28px; color: #F4B41A; margin-bottom: 15px; }
    p { font-size: 16px; line-height: 1.6; color: rgba(255, 255, 255, 0.8); margin-bottom: 30px; }
    .status {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 15px 25px;
      background: rgba(239, 68, 68, 0.2);
      border-radius: 12px;
      margin-bottom: 30px;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .dot {
      width: 12px;
      height: 12px;
      background: #ef4444;
      border-radius: 50%;
      animation: blink 1.5s ease-in-out infinite;
    }
    @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 16px 30px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      background: linear-gradient(135deg, #F4B41A 0%, #E8A830 100%);
      color: #1a1a2e;
      width: 100%;
    }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(244, 180, 26, 0.3); }
    .info { margin-top: 30px; font-size: 14px; color: rgba(255, 255, 255, 0.6); }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📡</div>
    <h1>You're Offline</h1>
    <p>Don't worry - your data is saved locally and will sync when you're back online.</p>
    <div class="status">
      <div class="dot"></div>
      <span>No internet connection</span>
    </div>
    <button class="btn" onclick="location.reload()">Try Again</button>
    <p class="info">Check your Wi-Fi or mobile data and try again.</p>
  </div>
  <script>
    window.addEventListener('online', () => location.reload());
  </script>
</body>
</html>`;
}

// Log service worker status
console.log('[SW] Service Worker loaded - Version:', VERSION);
