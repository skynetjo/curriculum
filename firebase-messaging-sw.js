// ========================================
// FIREBASE MESSAGING SERVICE WORKER
// Upload this to your website ROOT
// ========================================

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// YOUR FIREBASE CONFIG - Replace with your actual config
firebase.initializeApp({
    apiKey: "AIzaSyCXHj5oN5KQdUMXDHg3mAcTPn_CXJjq0Jo",
    authDomain: "jnvportal.firebaseapp.com",
    projectId: "jnvportal",
    storageBucket: "jnvportal.firebasestorage.app",
    messagingSenderId: "913756177",
    appId: "1:913756177:web:your_app_id"
});

const messaging = firebase.messaging();

// Handle background notifications
messaging.onBackgroundMessage((payload) => {
    console.log('[FCM SW] Background message:', payload);
    
    const title = payload.notification?.title || 'Avanti Help Desk';
    const options = {
        body: payload.notification?.body || 'You have a ticket update',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'helpdesk-notification',
        data: payload.data
    };
    
    self.registration.showNotification(title, options);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/')
    );
});

console.log('[FCM SW] Service Worker loaded');
