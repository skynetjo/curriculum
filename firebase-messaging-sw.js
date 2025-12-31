// Firebase Messaging Service Worker
// This handles background push notifications for birthdays, anniversaries, and other alerts
// Updated: December 2024 - Enhanced error handling and notification display

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyDyyGAHNJvhuint86USW36eBJKfw_u3AcA",
  authDomain: "curriculum-dbb10.firebaseapp.com",
  projectId: "curriculum-dbb10",
  storageBucket: "curriculum-dbb10.firebasestorage.app",
  messagingSenderId: "706387632109",
  appId: "1:706387632109:web:06c78a304fdbdc12f391e4"
});

let messaging;
try {
  messaging = firebase.messaging();
  console.log('[SW] Firebase Messaging initialized successfully');
} catch (e) {
  console.error('[SW] Firebase Messaging init error:', e);
}

// Handle background messages (when app is closed or in background)
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log('[SW] 📬 Received background message:', payload);
    
    // Extract notification data
    const notificationTitle = payload.notification?.title || payload.data?.title || 'Avanti Fellows';
    const notificationBody = payload.notification?.body || payload.data?.body || 'You have a new notification';
    
    const notificationOptions = {
      body: notificationBody,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      tag: payload.data?.tag || 'avanti-notification-' + Date.now(),
      renotify: true,
      requireInteraction: payload.data?.requireInteraction === 'true',
      data: {
        ...payload.data,
        url: payload.data?.url || '/',
        timestamp: Date.now()
      },
      actions: [
        { action: 'open', title: '📱 Open App' },
        { action: 'dismiss', title: '✕ Dismiss' }
      ]
    };

    // Show the notification
    return self.registration.showNotification(notificationTitle, notificationOptions)
      .then(() => {
        console.log('[SW] ✅ Notification displayed successfully');
      })
      .catch(err => {
        console.error('[SW] ❌ Notification display error:', err);
      });
  });
}

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] 👆 Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  // Get the URL to open
  const urlToOpen = event.notification.data?.url || '/';
  
  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ 
      type: 'window', 
      includeUncontrolled: true 
    }).then((windowClients) => {
      // Check if app is already open
      for (let client of windowClients) {
        if (client.url.includes('curriculum') && 'focus' in client) {
          console.log('[SW] Focusing existing window');
          return client.focus();
        }
      }
      // If not open, open a new window
      if (clients.openWindow) {
        console.log('[SW] Opening new window:', urlToOpen);
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle push events directly (fallback if onBackgroundMessage doesn't fire)
self.addEventListener('push', (event) => {
  console.log('[SW] 📨 Push event received');
  
  if (!event.data) {
    console.log('[SW] No data in push event');
    return;
  }
  
  try {
    const data = event.data.json();
    console.log('[SW] Push data:', data);
    
    // Only show notification if it wasn't handled by onBackgroundMessage
    if (!data.notification && data.data) {
      const title = data.data.title || 'Avanti Fellows';
      const options = {
        body: data.data.body || 'New notification',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'push-' + Date.now(),
        data: data.data
      };
      
      event.waitUntil(
        self.registration.showNotification(title, options)
      );
    }
  } catch (e) {
    console.error('[SW] Push data parse error:', e);
  }
});

// Periodic sync for checking birthdays/anniversaries (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-celebrations') {
    console.log('[SW] Running periodic celebration check');
    event.waitUntil(checkCelebrations());
  }
});

// Check for today's celebrations
async function checkCelebrations() {
  try {
    console.log('[SW] Checking for celebrations...');
    
    const db = await openDB();
    const lastCheck = await getFromDB(db, 'lastCelebrationCheck');
    const today = new Date().toDateString();
    
    if (lastCheck !== today) {
      await setInDB(db, 'lastCelebrationCheck', today);
      await setInDB(db, 'pendingCelebrationCheck', true);
      console.log('[SW] Marked celebration check as pending');
    }
  } catch (e) {
    console.error('[SW] Celebration check error:', e);
  }
}

// Simple IndexedDB helpers for service worker
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AvantiSW', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('data')) {
        db.createObjectStore('data');
      }
    };
  });
}

function getFromDB(db, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('data', 'readonly');
    const store = tx.objectStore('data');
    const request = store.get(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function setInDB(db, key, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('data', 'readwrite');
    const store = tx.objectStore('data');
    const request = store.put(value, key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Service worker installation
self.addEventListener('install', (event) => {
  console.log('[SW] 🚀 Installing service worker...');
  self.skipWaiting();
});

// Service worker activation
self.addEventListener('activate', (event) => {
  console.log('[SW] ✅ Service worker activated');
  event.waitUntil(
    clients.claim().then(() => {
      console.log('[SW] Now controlling all clients');
    })
  );
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  console.log('[SW] 📩 Message from app:', event.data);
  
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data?.type === 'TEST_NOTIFICATION') {
    self.registration.showNotification('🔔 Test Notification', {
      body: 'Push notifications are working!',
      icon: '/icon-192.png',
      tag: 'test-notification'
    });
  }
});

console.log('[SW] 🎉 Firebase Messaging Service Worker loaded and ready!');
