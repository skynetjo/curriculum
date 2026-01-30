// ========================================
// PWA ENHANCEMENT MODULE v5.0.2
// For Curriculum Tracker - Avanti Fellows
// Includes: Offline Support, Background Sync, Notifications
// ========================================

(function() {
  'use strict';
  
  console.log('[PWA] 🚀 Loading PWA Enhancement Module v5.0.2...');
  
  // ========================================
  // PWA MANAGER OBJECT
  // ========================================
  window.PWAManager = {
    version: '5.0.2',
    isOnline: navigator.onLine,
    pendingCount: 0,
    registration: null,
    db: null,
    
    // ========================================
    // INITIALIZATION
    // ========================================
    init: async function() {
      console.log('[PWA] Starting initialization...');
      
      // Setup network detection
      this.setupNetworkDetection();
      
      // Register enhanced service worker
      await this.registerServiceWorker();
      
      // Setup IndexedDB for offline storage
      await this.setupDatabase();
      
      // Setup message handler
      this.setupMessageHandler();
      
      // Check for pending data
      await this.checkPendingData();
      
      // Setup periodic sync
      await this.setupPeriodicSync();
      
      console.log('[PWA] ✅ Initialization complete');
    },
    
    // ========================================
    // SERVICE WORKER REGISTRATION
    // ========================================
    registerServiceWorker: async function() {
      if (!('serviceWorker' in navigator)) {
        console.warn('[PWA] Service Workers not supported');
        return;
      }
      
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        console.log('[PWA] ✅ Service Worker registered');
        
        // Check for updates
        this.registration.addEventListener('updatefound', () => {
          const newWorker = this.registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showToast('New version available! Refreshing...', 'info');
              setTimeout(() => window.location.reload(), 2000);
            }
          });
        });
        
        // Update check every 5 minutes
        setInterval(() => this.registration.update(), 5 * 60 * 1000);
        
      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    },
    
    // ========================================
    // NETWORK DETECTION
    // ========================================
    setupNetworkDetection: function() {
      const statusEl = document.getElementById('pwa-network-status');
      
      const updateStatus = (online) => {
        this.isOnline = online;
        
        if (statusEl) {
          statusEl.className = 'pwa-network-status ' + (online ? 'online' : 'offline');
          const textEl = statusEl.querySelector('.status-text');
          if (textEl) textEl.textContent = online ? 'Online' : 'Offline';
        }
        
        if (online) {
          console.log('[PWA] 📶 Back online - syncing data...');
          this.syncPendingData();
        } else {
          console.log('[PWA] 📵 Gone offline - data will be saved locally');
        }
      };
      
      window.addEventListener('online', () => {
        updateStatus(true);
        this.showToast('You\'re back online! Syncing...', 'success');
      });
      
      window.addEventListener('offline', () => {
        updateStatus(false);
        this.showToast('You\'re offline. Data will save locally.', 'warning');
      });
      
      // Periodic connectivity check (for JNV low-signal areas)
      setInterval(async () => {
        try {
          const response = await fetch('/manifest.json', { 
            method: 'HEAD', 
            cache: 'no-store',
            signal: AbortSignal.timeout(5000)
          });
          if (response.ok && !this.isOnline) {
            updateStatus(true);
            this.showToast('Connection restored!', 'success');
          }
        } catch (e) {
          if (this.isOnline && !navigator.onLine) {
            updateStatus(false);
          }
        }
      }, 30000);
      
      // Initial state
      updateStatus(navigator.onLine);
    },
    
    // ========================================
    // INDEXED DB SETUP
    // ========================================
    setupDatabase: function() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('CurriculumTrackerPWA', 2);
        
        request.onerror = () => {
          console.error('[PWA] IndexedDB error:', request.error);
          reject(request.error);
        };
        
        request.onsuccess = () => {
          this.db = request.result;
          console.log('[PWA] ✅ IndexedDB ready');
          resolve(this.db);
        };
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          
          // Create stores for offline data
          const stores = [
            'pendingAttendance',
            'pendingCurriculum', 
            'pendingFeedback',
            'pendingObservations',
            'cachedData'
          ];
          
          stores.forEach(storeName => {
            if (!db.objectStoreNames.contains(storeName)) {
              db.createObjectStore(storeName, { keyPath: 'id' });
              console.log('[PWA] Created store:', storeName);
            }
          });
        };
      });
    },
    
    // ========================================
    // OFFLINE DATA STORAGE
    // ========================================
    saveOffline: async function(type, data) {
      if (!this.db) {
        console.warn('[PWA] Database not ready');
        return false;
      }
      
      const storeName = 'pending' + type.charAt(0).toUpperCase() + type.slice(1);
      
      try {
        const transaction = this.db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        
        const record = {
          ...data,
          id: data.id || `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now(),
          synced: false
        };
        
        await new Promise((resolve, reject) => {
          const request = store.put(record);
          request.onsuccess = resolve;
          request.onerror = () => reject(request.error);
        });
        
        console.log('[PWA] ✅ Saved offline:', type, record.id);
        
        // Update pending count
        await this.checkPendingData();
        
        // Request background sync
        this.requestBackgroundSync(`sync-${type}`);
        
        return record.id;
      } catch (error) {
        console.error('[PWA] Save offline failed:', error);
        return false;
      }
    },
    
    // ========================================
    // CHECK PENDING DATA
    // ========================================
    checkPendingData: async function() {
      if (!this.db) return 0;
      
      const stores = ['pendingAttendance', 'pendingCurriculum', 'pendingFeedback', 'pendingObservations'];
      let total = 0;
      
      for (const storeName of stores) {
        try {
          const transaction = this.db.transaction(storeName, 'readonly');
          const store = transaction.objectStore(storeName);
          const count = await new Promise((resolve) => {
            const request = store.count();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(0);
          });
          total += count;
        } catch (e) {
          // Store might not exist
        }
      }
      
      this.pendingCount = total;
      
      // Update badge
      const badge = document.getElementById('pwa-pending-badge');
      const countEl = document.getElementById('pwa-pending-count');
      if (badge && countEl) {
        countEl.textContent = total;
        badge.classList.toggle('show', total > 0);
      }
      
      return total;
    },
    
    // ========================================
    // SYNC PENDING DATA TO FIREBASE
    // ========================================
    syncPendingData: async function() {
      if (!this.isOnline || !this.db) {
        console.log('[PWA] Cannot sync - offline or DB not ready');
        return;
      }
      
      // Check if Firebase is available
      if (typeof firebase === 'undefined' || !firebase.firestore) {
        console.warn('[PWA] Firebase not available, skipping sync');
        return;
      }
      
      console.log('[PWA] 🔄 Starting sync to Firebase...');
      
      const firestore = firebase.firestore();
      let syncedCount = 0;
      let failedCount = 0;
      
      // ========================================
      // SYNC ATTENDANCE - to 'studentAttendance' collection
      // ========================================
      try {
        const attTransaction = this.db.transaction('pendingAttendance', 'readwrite');
        const attStore = attTransaction.objectStore('pendingAttendance');
        
        const attRecords = await new Promise((resolve) => {
          const request = attStore.getAll();
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => resolve([]);
        });
        
        console.log('[PWA] Found', attRecords.length, 'pending attendance records');
        
        for (const record of attRecords) {
          try {
            // Extract data (remove PWA metadata)
            const { id, timestamp, synced, ...data } = record;
            
            // Create document ID (same format as your app uses)
            const docId = data.docId || `${data.school}_${data.grade}_${data.studentId}_${data.date}`;
            
            // Save to Firebase - using 'studentAttendance' collection (your collection name)
            await firestore.collection('studentAttendance').doc(docId).set({
              school: data.school,
              grade: data.grade,
              studentId: data.studentId,
              studentName: data.studentName,
              date: data.date,
              status: data.status,
              remarks: data.remarks || '',
              markedBy: data.markedBy,
              markedAt: data.markedAt,
              syncedAt: new Date().toISOString(),
              wasOffline: true
            });
            
            // Remove from pending store
            const deleteTransaction = this.db.transaction('pendingAttendance', 'readwrite');
            const deleteStore = deleteTransaction.objectStore('pendingAttendance');
            await new Promise((resolve) => {
              const deleteRequest = deleteStore.delete(id);
              deleteRequest.onsuccess = resolve;
              deleteRequest.onerror = resolve;
            });
            
            syncedCount++;
            console.log('[PWA] ✅ Synced attendance:', docId);
          } catch (err) {
            console.error('[PWA] ❌ Failed to sync attendance:', record.id, err);
            failedCount++;
          }
        }
      } catch (error) {
        console.error('[PWA] Attendance sync error:', error);
      }
      
      // ========================================
      // SYNC CURRICULUM - to 'curriculum_progress' collection
      // ========================================
      try {
        const currTransaction = this.db.transaction('pendingCurriculum', 'readwrite');
        const currStore = currTransaction.objectStore('pendingCurriculum');
        
        const currRecords = await new Promise((resolve) => {
          const request = currStore.getAll();
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => resolve([]);
        });
        
        console.log('[PWA] Found', currRecords.length, 'pending curriculum records');
        
        for (const record of currRecords) {
          try {
            const { id, timestamp, synced, ...data } = record;
            
            await firestore.collection('curriculum_progress').add({
              ...data,
              syncedAt: firebase.firestore.FieldValue.serverTimestamp(),
              wasOffline: true
            });
            
            const deleteTransaction = this.db.transaction('pendingCurriculum', 'readwrite');
            const deleteStore = deleteTransaction.objectStore('pendingCurriculum');
            await new Promise((resolve) => {
              const deleteRequest = deleteStore.delete(id);
              deleteRequest.onsuccess = resolve;
              deleteRequest.onerror = resolve;
            });
            
            syncedCount++;
            console.log('[PWA] ✅ Synced curriculum:', id);
          } catch (err) {
            console.error('[PWA] ❌ Failed to sync curriculum:', err);
            failedCount++;
          }
        }
      } catch (error) {
        console.error('[PWA] Curriculum sync error:', error);
      }
      
      // ========================================
      // SYNC FEEDBACK - to 'teacherFeedback' collection
      // ========================================
      try {
        const fbTransaction = this.db.transaction('pendingFeedback', 'readwrite');
        const fbStore = fbTransaction.objectStore('pendingFeedback');
        
        const fbRecords = await new Promise((resolve) => {
          const request = fbStore.getAll();
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => resolve([]);
        });
        
        console.log('[PWA] Found', fbRecords.length, 'pending feedback records');
        
        for (const record of fbRecords) {
          try {
            const { id, timestamp, synced, ...data } = record;
            
            await firestore.collection('teacherFeedback').add({
              ...data,
              syncedAt: firebase.firestore.FieldValue.serverTimestamp(),
              wasOffline: true
            });
            
            const deleteTransaction = this.db.transaction('pendingFeedback', 'readwrite');
            const deleteStore = deleteTransaction.objectStore('pendingFeedback');
            await new Promise((resolve) => {
              const deleteRequest = deleteStore.delete(id);
              deleteRequest.onsuccess = resolve;
              deleteRequest.onerror = resolve;
            });
            
            syncedCount++;
            console.log('[PWA] ✅ Synced feedback:', id);
          } catch (err) {
            console.error('[PWA] ❌ Failed to sync feedback:', err);
            failedCount++;
          }
        }
      } catch (error) {
        console.error('[PWA] Feedback sync error:', error);
      }
      
      // ========================================
      // SYNC OBSERVATIONS - to 'classroom_observations' collection
      // ========================================
      try {
        const obsTransaction = this.db.transaction('pendingObservations', 'readwrite');
        const obsStore = obsTransaction.objectStore('pendingObservations');
        
        const obsRecords = await new Promise((resolve) => {
          const request = obsStore.getAll();
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => resolve([]);
        });
        
        console.log('[PWA] Found', obsRecords.length, 'pending observation records');
        
        for (const record of obsRecords) {
          try {
            const { id, timestamp, synced, ...data } = record;
            
            await firestore.collection('classroom_observations').add({
              ...data,
              syncedAt: firebase.firestore.FieldValue.serverTimestamp(),
              wasOffline: true
            });
            
            const deleteTransaction = this.db.transaction('pendingObservations', 'readwrite');
            const deleteStore = deleteTransaction.objectStore('pendingObservations');
            await new Promise((resolve) => {
              const deleteRequest = deleteStore.delete(id);
              deleteRequest.onsuccess = resolve;
              deleteRequest.onerror = resolve;
            });
            
            syncedCount++;
            console.log('[PWA] ✅ Synced observation:', id);
          } catch (err) {
            console.error('[PWA] ❌ Failed to sync observation:', err);
            failedCount++;
          }
        }
      } catch (error) {
        console.error('[PWA] Observation sync error:', error);
      }
      
      // ========================================
      // SHOW RESULTS
      // ========================================
      if (syncedCount > 0) {
        this.showToast(`✅ Synced ${syncedCount} item(s) to Firebase`, 'success');
      }
      if (failedCount > 0) {
        this.showToast(`⚠️ ${failedCount} item(s) failed to sync`, 'warning');
      }
      
      await this.checkPendingData();
      console.log('[PWA] Sync complete. Synced:', syncedCount, 'Failed:', failedCount);
    },
    
    // ========================================
    // BACKGROUND SYNC
    // ========================================
    requestBackgroundSync: async function(tag) {
      if (!this.registration || !('sync' in this.registration)) {
        console.log('[PWA] Background sync not supported');
        return;
      }
      
      try {
        await this.registration.sync.register(tag);
        console.log('[PWA] Background sync registered:', tag);
      } catch (error) {
        console.log('[PWA] Background sync registration failed:', error);
      }
    },
    
    // ========================================
    // PERIODIC SYNC
    // ========================================
    setupPeriodicSync: async function() {
      if (!this.registration || !('periodicSync' in this.registration)) {
        console.log('[PWA] Periodic sync not supported');
        return;
      }
      
      try {
        const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
        
        if (status.state === 'granted') {
          await this.registration.periodicSync.register('sync-pending-data', {
            minInterval: 60 * 60 * 1000 // 1 hour
          });
          console.log('[PWA] ✅ Periodic sync registered');
        }
      } catch (error) {
        console.log('[PWA] Periodic sync not available:', error.message);
      }
    },
    
    // ========================================
    // MESSAGE HANDLER
    // ========================================
    setupMessageHandler: function() {
      if (!navigator.serviceWorker) return;
      
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('[PWA] Message from SW:', event.data);
        
        const { type, action, data } = event.data;
        
        if (type === 'SYNC_COMPLETE') {
          this.showToast('Data synced successfully!', 'success');
          this.checkPendingData();
        }
        
        if (type === 'PERIODIC_SYNC') {
          if (action === 'UPDATE_CURRICULUM') {
            window.dispatchEvent(new CustomEvent('refreshCurriculum'));
          }
        }
      });
    },
    
    // ========================================
    // PUSH NOTIFICATIONS
    // ========================================
    requestNotificationPermission: async function() {
      if (!('Notification' in window)) {
        this.showToast('Notifications not supported', 'error');
        return false;
      }
      
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        this.showToast('Notifications enabled!', 'success');
        return true;
      } else {
        this.showToast('Notification permission denied', 'warning');
        return false;
      }
    },
    
    showNotification: async function(title, options = {}) {
      if (Notification.permission !== 'granted') return false;
      
      const defaultOptions = {
        icon: '/icon-192.png',
        badge: '/icon-72.png',
        vibrate: [100, 50, 100],
        tag: 'curriculum-tracker'
      };
      
      try {
        if (this.registration) {
          await this.registration.showNotification(title, { ...defaultOptions, ...options });
        } else {
          new Notification(title, { ...defaultOptions, ...options });
        }
        return true;
      } catch (error) {
        console.error('[PWA] Notification error:', error);
        return false;
      }
    },
    
    // ========================================
    // TOAST NOTIFICATIONS
    // ========================================
    showToast: function(message, type = 'info') {
      // Remove existing toast
      const existing = document.querySelector('.pwa-toast');
      if (existing) existing.remove();
      
      const toast = document.createElement('div');
      toast.className = `pwa-toast ${type}`;
      toast.innerHTML = `
        <span>${type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'error' ? '❌' : 'ℹ️'}</span>
        <span>${message}</span>
      `;
      
      // Add styles if not exists
      if (!document.querySelector('#pwa-toast-styles')) {
        const style = document.createElement('style');
        style.id = 'pwa-toast-styles';
        style.textContent = `
          .pwa-toast {
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            padding: 14px 24px;
            border-radius: 12px;
            color: white;
            font-size: 14px;
            font-weight: 500;
            z-index: 99999;
            box-shadow: 0 4px 20px rgba(0,0,0,0.25);
            animation: pwaToastIn 0.3s ease;
            max-width: 90%;
            text-align: center;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .pwa-toast.success { background: linear-gradient(135deg, #10b981, #059669); }
          .pwa-toast.warning { background: linear-gradient(135deg, #f59e0b, #d97706); }
          .pwa-toast.error { background: linear-gradient(135deg, #ef4444, #dc2626); }
          .pwa-toast.info { background: linear-gradient(135deg, #3b82f6, #2563eb); }
          @keyframes pwaToastIn { from { transform: translateX(-50%) translateY(30px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
        `;
        document.head.appendChild(style);
      }
      
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    }
  };
  
  // ========================================
  // CONVENIENCE FUNCTIONS (Global)
  // ========================================
  
  // Save attendance offline
  window.saveAttendanceOffline = async function(data) {
    return PWAManager.saveOffline('attendance', data);
  };
  
  // Save curriculum offline
  window.saveCurriculumOffline = async function(data) {
    return PWAManager.saveOffline('curriculum', data);
  };
  
  // Save feedback offline
  window.saveFeedbackOffline = async function(data) {
    return PWAManager.saveOffline('feedback', data);
  };
  
  // Save observation offline
  window.saveObservationOffline = async function(data) {
    return PWAManager.saveOffline('observations', data);
  };
  
  // Check if online
  window.isPWAOnline = function() {
    return PWAManager.isOnline;
  };
  
  // Get pending count
  window.getPendingSyncCount = function() {
    return PWAManager.pendingCount;
  };
  
  // Show PWA toast
  window.showPWAToast = function(message, type) {
    PWAManager.showToast(message, type);
  };
  
  // Force sync
  window.forcePWASync = function() {
    return PWAManager.syncPendingData();
  };
  
  // ========================================
  // AUTO-INITIALIZE
  // ========================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PWAManager.init());
  } else {
    PWAManager.init();
  }
  
  console.log('[PWA] ✅ PWA Enhancement Module v4.1.0 loaded');
  
})();
