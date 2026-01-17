// ========================================
// SERVICE WORKER - Curriculum Tracker PWA
// Version 4.0.0 - Fixed Icon References
// ========================================
const VERSION = '3.7.4';
const STATIC_CACHE = 'static-v' + VERSION;
const DYNAMIC_CACHE = 'dynamic-v' + VERSION;
const OFFLINE_CACHE = 'offline-v' + VERSION;
const DATA_CACHE = 'data-v' + VERSION;

// Files to cache immediately on install
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/Icon-72.png',
  '/Icon-96.png',
  '/Icon-144.png',
  '/Icon-152.png',
  '/Icon-192.png',
  '/Icon-384.png',
  '/Icon-512.png'
];

// External CDN resources to cache
const EXTERNAL_RESOURCES = [
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js'
];

// URLs to never cache (always fetch from network)
const NEVER_CACHE = [
  'firebaseio.com',
  'googleapis.com',
  'firebase',
  'firestore',
  'freshdesk',
  'freshchat',
  'freshworks'
];

// ========================================
// INSTALL EVENT
// ========================================
self.addEventListener('install', event => {
  console.log('[SW] Installing version:', VERSION);
  
  event.waitUntil(
    (async () => {
      // Cache static files
      const staticCache = await caches.open(STATIC_CACHE);
      console.log('[SW] Caching static files');
      
      for (const url of STATIC_FILES) {
        try {
          const response = await fetch(url, { cache: 'reload' });
          if (response.ok) {
            await staticCache.put(url, response);
            console.log('[SW] Cached:', url);
          }
        } catch (err) {
          console.log('[SW] Could not cache:', url);
        }
      }
      
      // Cache external resources
      const dynamicCache = await caches.open(DYNAMIC_CACHE);
      for (const url of EXTERNAL_RESOURCES) {
        try {
          const response = await fetch(url, { mode: 'cors' });
          if (response.ok) {
            await dynamicCache.put(url, response);
          }
        } catch (err) {
          console.log('[SW] Could not cache external:', url);
        }
      }
      
      // Ensure offline page is cached
      const offlineCache = await caches.open(OFFLINE_CACHE);
      try {
        const offlineResponse = await fetch('/offline.html', { cache: 'reload' });
        if (offlineResponse.ok) {
          await offlineCache.put('/offline.html', offlineResponse);
          console.log('[SW] Offline page cached');
        }
      } catch (err) {
        // Create fallback offline page
        const fallbackHTML = getOfflineFallbackHTML();
        const fallbackResponse = new Response(fallbackHTML, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
        await offlineCache.put('/offline.html', fallbackResponse);
        console.log('[SW] Fallback offline page created');
      }
      
      console.log('[SW] Installation complete');
      self.skipWaiting();
    })()
  );
});

// ========================================
// ACTIVATE EVENT
// ========================================
self.addEventListener('activate', event => {
  console.log('[SW] Activating version:', VERSION);
  
  const currentCaches = [STATIC_CACHE, DYNAMIC_CACHE, OFFLINE_CACHE, DATA_CACHE];
  
  event.waitUntil(
    (async () => {
      // Delete old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => {
          if (!currentCaches.includes(cacheName)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
      
      // Take control immediately
      await self.clients.claim();
      console.log('[SW] Activation complete');
    })()
  );
});

// ========================================
// FETCH EVENT - CRITICAL FOR OFFLINE SUPPORT
// ========================================
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Only handle GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip non-http(s) protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Skip URLs that should never be cached
  if (NEVER_CACHE.some(domain => url.hostname.includes(domain) || url.href.includes(domain))) {
    return;
  }
  
  // Navigation requests (HTML Pages)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }
  
  // HTML files (non-navigation)
  if (url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(handleHTMLRequest(request));
    return;
  }
  
  // API requests
  if (url.pathname.includes('/api/') || url.pathname.includes('/data/')) {
    event.respondWith(handleAPIRequest(request));
    return;
  }
  
  // Static assets (js, css, images, fonts)
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json)$/)) {
    event.respondWith(handleStaticRequest(request));
    return;
  }
  
  // Default handler
  event.respondWith(handleDefaultRequest(request));
});

// ========================================
// REQUEST HANDLERS
// ========================================

async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Navigation failed, trying cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const rootResponse = await caches.match('/');
    if (rootResponse) {
      return rootResponse;
    }
    
    return getOfflineResponse();
  }
}

async function handleHTMLRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return getOfflineResponse();
  }
}

async function handleAPIRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DATA_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response(JSON.stringify({ error: 'Offline' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    fetch(request).then(response => {
      if (response.ok) {
        caches.open(DYNAMIC_CACHE).then(cache => {
          cache.put(request, response);
        });
      }
    }).catch(() => {});
    
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    return new Response('', { status: 404 });
  }
}

async function handleDefaultRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('', { status: 404 });
  }
}

async function getOfflineResponse() {
  const offlineResponse = await caches.match('/offline.html');
  if (offlineResponse) {
    return offlineResponse;
  }
  
  return new Response(getOfflineFallbackHTML(), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// ========================================
// BACKGROUND SYNC
// ========================================
self.addEventListener('sync', event => {
  console.log('[SW] Background Sync:', event.tag);
  
  switch (event.tag) {
    case 'sync-attendance':
      event.waitUntil(syncData('pendingAttendance', 'SYNC_ATTENDANCE'));
      break;
    case 'sync-curriculum':
      event.waitUntil(syncData('pendingCurriculum', 'SYNC_CURRICULUM'));
      break;
    case 'sync-feedback':
      event.waitUntil(syncData('pendingFeedback', 'SYNC_FEEDBACK'));
      break;
    case 'sync-all-data':
      event.waitUntil(syncAllData());
      break;
  }
});

async function syncData(storeName, messageType) {
  try {
    const db = await openIndexedDB();
    const records = await getFromStore(db, storeName);
    
    const clients = await self.clients.matchAll();
    
    for (const record of records) {
      clients.forEach(client => {
        client.postMessage({ type: messageType, data: record });
      });
      await removeFromStore(db, storeName, record.id);
    }
    
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_COMPLETE', store: storeName });
    });
  } catch (err) {
    console.error('[SW] Sync error:', err);
  }
}

async function syncAllData() {
  await syncData('pendingAttendance', 'SYNC_ATTENDANCE');
  await syncData('pendingCurriculum', 'SYNC_CURRICULUM');
  await syncData('pendingFeedback', 'SYNC_FEEDBACK');
}

// ========================================
// PERIODIC BACKGROUND SYNC
// ========================================
self.addEventListener('periodicsync', event => {
  console.log('[SW] Periodic Sync:', event.tag);
  
  if (event.tag === 'update-curriculum-data') {
    event.waitUntil(notifyClients('UPDATE_CURRICULUM'));
  }
  
  if (event.tag === 'check-notifications') {
    event.waitUntil(notifyClients('CHECK_NOTIFICATIONS'));
  }
  
  if (event.tag === 'sync-pending-data') {
    event.waitUntil(syncAllData());
  }
});

async function notifyClients(action) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'PERIODIC_SYNC', action });
  });
}

// ========================================
// PUSH NOTIFICATIONS
// ========================================
self.addEventListener('push', event => {
  console.log('[SW] Push received');
  
  let data = {
    title: 'Curriculum Tracker',
    body: 'You have a new notification',
    icon: '/Icon-192.png',
    badge: '/Icon-72.png'
  };
  
  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag || 'default',
      data: data.data,
      vibrate: [100, 50, 100],
      actions: [
        { action: 'open', title: 'Open App' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'dismiss') return;
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.postMessage({ type: 'NOTIFICATION_CLICK', data: event.notification.data });
            return client.focus();
          }
        }
        return self.clients.openWindow(urlToOpen);
      })
  );
});

// ========================================
// MESSAGE HANDLING
// ========================================
self.addEventListener('message', event => {
  const { type, data } = event.data || {};
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0]?.postMessage({ version: VERSION });
      break;
      
    case 'CLEAR_CACHE':
      caches.keys().then(names => 
        Promise.all(names.map(name => caches.delete(name)))
      ).then(() => {
        event.ports[0]?.postMessage({ success: true });
      });
      break;
      
    case 'CACHE_URLS':
      caches.open(DYNAMIC_CACHE).then(cache => cache.addAll(data.urls || []));
      break;
      
    case 'STORE_FOR_SYNC':
      storeForSync(data.store, data.data);
      break;
      
    case 'REQUEST_SYNC':
      self.registration.sync.register(data.tag);
      break;
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
      
      ['pendingAttendance', 'pendingCurriculum', 'pendingFeedback', 'pendingObservations', 'cachedData']
        .forEach(store => {
          if (!db.objectStoreNames.contains(store)) {
            db.createObjectStore(store, { keyPath: store === 'cachedData' ? 'key' : 'id' });
          }
        });
    };
  });
}

function getFromStore(db, storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const request = transaction.objectStore(storeName).getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function addToStore(db, storeName, data) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const request = transaction.objectStore(storeName).put(data);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function removeFromStore(db, storeName, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const request = transaction.objectStore(storeName).delete(id);
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
  } catch (err) {
    console.error('[SW] Store for sync error:', err);
  }
}

// ========================================
// OFFLINE FALLBACK HTML
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
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
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
    .info { margin-top: 20px; font-size: 14px; color: rgba(255, 255, 255, 0.6); }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📡</div>
    <h1>You're Offline</h1>
    <p>Your data is saved locally and will sync when you're back online.</p>
    <div class="status">
      <div class="dot"></div>
      <span>No internet connection</span>
    </div>
    <button class="btn" onclick="location.reload()">Try Again</button>
    <p class="info">Check your Wi-Fi or mobile data.</p>
  </div>
  <script>window.addEventListener('online', () => location.reload());</script>
</body>
</html>`;
}

console.log('[SW] Service Worker loaded - Version:', VERSION);
