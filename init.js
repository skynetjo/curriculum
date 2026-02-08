// ✅ INIT.JS v5.1.0 - Consolidated initialization
// Firebase + Connection Manager + Offline Queue + Chart Config

// ── Firebase Initialization ──────────────────────────────
(function() {
  const firebaseConfig = {
    apiKey: "AIzaSyDyyGAHNJvhuint86USW36eBJKfw_u3AcA",
    authDomain: "curriculum-dbb10.firebaseapp.com",
    projectId: "curriculum-dbb10",
    storageBucket: "curriculum-dbb10.firebasestorage.app",
    messagingSenderId: "706387632109",
    appId: "1:706387632109:web:06c78a304fdbdc12f391e4"
  };
  
  if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    try {
      firebase.initializeApp(firebaseConfig);
      console.log('✅ Firebase initialized');
      window._firebaseEarlyInit = true;
      
      const db = firebase.firestore();
      db.settings({ 
        cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
        merge: true
      });
      
      db.enablePersistence({ synchronizeTabs: true })
        .then(() => {
          console.log('✅ Offline persistence enabled');
          window._firestoreInitialized = true;
        })
        .catch((err) => {
          window._firestoreInitialized = true;
          if (err.code === 'failed-precondition') {
            console.log('ℹ️ Persistence limited to one tab');
          } else if (err.code === 'unimplemented') {
            console.log('ℹ️ Browser does not support persistence');
          }
        });
        
      window._earlyDb = db;
    } catch (e) {
      console.error('Firebase init error:', e);
    }
  }
})();

window._firestoreInitialized = window._firestoreInitialized || false;
window._enableOfflinePersistence = function(db) {
  if (window._firestoreInitialized) return;
  window._firestoreInitialized = true;
  try {
    db.settings({ cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED });
    db.enablePersistence({ synchronizeTabs: true })
      .then(() => console.log('✅ Offline persistence enabled (fallback)'))
      .catch(() => {});
  } catch (e) {}
};

// ── Connection Manager ───────────────────────────────────
window.ConnectionManager = {
  _online: navigator.onLine,
  _listeners: [],
  _connectionQuality: 'unknown',
  _lastPingTime: null,
  
  init: function() {
    window.addEventListener('online', () => this._setStatus(true));
    window.addEventListener('offline', () => this._setStatus(false));
    this.checkRealConnectivity();
    setInterval(() => this.checkRealConnectivity(), 30000);
  },
  
  _setStatus: function(online) {
    var wasOnline = this._online;
    this._online = online;
    this._connectionQuality = online ? 'unknown' : 'offline';
    
    if (!wasOnline && online) {
      console.log('📶 Back online - syncing...');
      window.dispatchEvent(new CustomEvent('connectionRestored'));
    } else if (wasOnline && !online) {
      console.log('📴 Gone offline');
      window.dispatchEvent(new CustomEvent('connectionLost'));
    }
    this._notifyListeners();
  },
  
  checkRealConnectivity: async function() {
    if (!navigator.onLine) { this._connectionQuality = 'offline'; return; }
    var startTime = Date.now();
    try {
      await Promise.race([
        fetch('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js', { method: 'HEAD', mode: 'no-cors' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
      ]);
      var pingTime = Date.now() - startTime;
      this._lastPingTime = pingTime;
      this._connectionQuality = pingTime < 1000 ? 'good' : pingTime < 3000 ? 'slow' : 'very-slow';
    } catch (e) {
      this._connectionQuality = 'offline';
      this._online = false;
    }
    this._notifyListeners();
  },
  
  isOnline: function() { return this._online; },
  getQuality: function() { return this._connectionQuality; },
  subscribe: function(callback) {
    this._listeners.push(callback);
    return () => { this._listeners = this._listeners.filter(l => l !== callback); };
  },
  _notifyListeners: function() {
    this._listeners.forEach(l => l(this._online, this._connectionQuality));
  }
};

// ── Request Deduplicator ─────────────────────────────────
window.RequestDeduplicator = {
  _pendingRequests: new Map(),
  dedupe: function(key, promiseFactory) {
    if (this._pendingRequests.has(key)) return this._pendingRequests.get(key);
    var promise = promiseFactory().finally(() => {
      setTimeout(() => this._pendingRequests.delete(key), 100);
    });
    this._pendingRequests.set(key, promise);
    return promise;
  },
  clear: function() { this._pendingRequests.clear(); }
};

// ── Retry with Backoff ───────────────────────────────────
window.retryWithBackoff = async function(fn, options) {
  options = options || {};
  var maxRetries = options.maxRetries || 3;
  var baseDelay = options.baseDelay || 1000;
  var maxDelay = options.maxDelay || 30000;
  var onRetry = options.onRetry || null;
  var lastError;
  
  for (var attempt = 0; attempt < maxRetries; attempt++) {
    try { return await fn(); }
    catch (error) {
      lastError = error;
      if (attempt < maxRetries - 1) {
        var delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        if (onRetry) onRetry(attempt + 1, delay, error);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
};

// ── Offline Queue ────────────────────────────────────────
window.OfflineQueue = {
  _queue: [],
  _processing: false,
  init: function() {
    try { var saved = localStorage.getItem('offlineQueue'); if (saved) this._queue = JSON.parse(saved); } catch(e) {}
    window.addEventListener('connectionRestored', () => this.processQueue());
  },
  add: function(operation) {
    this._queue.push({ ...operation, id: Date.now() + '_' + Math.random().toString(36).substr(2, 9), timestamp: new Date().toISOString() });
    this._save();
  },
  processQueue: async function() {
    if (this._processing || this._queue.length === 0) return;
    if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) return;
    this._processing = true;
    var queue = [...this._queue];
    this._queue = [];
    this._save();
    for (var op of queue) {
      try {
        if (op.type === 'attendance') await firebase.firestore().collection('studentAttendance').doc(op.docId).set(op.data);
        else if (op.type === 'curriculum') await firebase.firestore().collection('chapterProgress').doc(op.docId).set(op.data, { merge: true });
      } catch (e) { this._queue.push(op); }
    }
    this._save();
    this._processing = false;
  },
  _save: function() { try { localStorage.setItem('offlineQueue', JSON.stringify(this._queue)); } catch(e) {} },
  getPendingCount: function() { return this._queue.length; }
};

// ── Error Handlers ───────────────────────────────────────
window.onerror = function(message, source, lineno, colno, error) {
  console.error('🚨 Global error:', message);
  if (message && message.includes && (message.includes('Loading chunk') || message.includes('ChunkLoadError'))) return true;
  return false;
};
window.addEventListener('unhandledrejection', function(event) {
  if (event.reason && event.reason.message && (
    event.reason.message.includes('network') || event.reason.message.includes('timeout') || event.reason.code === 'unavailable'
  )) { event.preventDefault(); }
});

// Initialize
window.ConnectionManager.init();
window.OfflineQueue.init();

// ── Chart.js Configuration ───────────────────────────────
function initChartPlugins() {
  if (typeof ChartDataLabels !== 'undefined' && typeof Chart !== 'undefined') {
    try {
      Chart.register(ChartDataLabels);
      if (Chart.defaults && Chart.defaults.plugins) {
        Chart.defaults.plugins.datalabels = {
          anchor: 'center', align: 'center', offset: 0,
          formatter: (value, ctx) => {
            var type = ctx.chart.config.type;
            return (type === 'pie' || type === 'doughnut') ? (value > 0 ? value : '') : value;
          },
          color: '#fff', font: { weight: '700', size: 14 }, textShadow: true
        };
      }
    } catch (e) {}
  }
  if (typeof Chart !== 'undefined' && Chart.overrides) {
    Chart.overrides.bar = Chart.overrides.bar || {};
    Chart.overrides.bar.plugins = Chart.overrides.bar.plugins || {};
    Chart.overrides.bar.plugins.datalabels = { color: '#374151', font: { weight: '700', size: 12 }, align: 'end', anchor: 'end' };
    Chart.overrides.pie = Chart.overrides.pie || {};
    Chart.overrides.pie.plugins = Chart.overrides.pie.plugins || {};
    Chart.overrides.pie.plugins.datalabels = { color: '#fff', font: { weight: '700', size: 14 }, textStrokeColor: 'rgba(0,0,0,0.3)', textStrokeWidth: 2 };
    Chart.overrides.doughnut = Chart.overrides.doughnut || {};
    Chart.overrides.doughnut.plugins = Chart.overrides.doughnut.plugins || {};
    Chart.overrides.doughnut.plugins.datalabels = { color: '#fff', font: { weight: '700', size: 14 } };
  }
}

// Try to init Chart plugins, retry if not loaded yet
initChartPlugins();
if (typeof Chart === 'undefined') {
  window.addEventListener('load', function() { setTimeout(initChartPlugins, 500); });
}

// Chart color palette
window.CHART_COLORS = {
  primary: ['#5B8A8A', '#7BA3A3', '#3D6B6B', '#9CBFBF', '#2D5454', '#B5D4D4'],
  status: { completed: '#5B8A8A', pending: '#D4A574', delayed: '#C17A6E' },
  subjects: { physics: '#D4A574', chemistry: '#5B8A8A', maths: '#7BA3A3', biology: '#C17A6E' },
  general: ['#5B8A8A', '#D4A574', '#7BA3A3', '#C17A6E', '#3D6B6B', '#9CBFBF']
};

// ── Lazy Library Loader ──────────────────────────────────
window.LazyLibs = {
  _loaded: {},
  _loading: {},
  
  load: function(name) {
    if (this._loaded[name]) return Promise.resolve();
    if (this._loading[name]) return this._loading[name];
    
    var libs = {
      'chart': 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js',
      'chartLabels': 'https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js',
      'papaparse': 'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js',
      'xlsx': 'https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js',
      'otpauth': 'https://cdnjs.cloudflare.com/ajax/libs/otpauth/9.2.2/otpauth.umd.min.js',
      'qrcode': 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
      'html5qrcode': 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js',
      'firebase-messaging': 'https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js',
      'firebase-storage': 'https://www.gstatic.com/firebasejs/9.22.0/firebase-storage-compat.js'
    };
    
    if (!libs[name]) return Promise.reject(new Error('Unknown lib: ' + name));
    
    var self = this;
    this._loading[name] = new Promise(function(resolve, reject) {
      var script = document.createElement('script');
      script.src = libs[name];
      script.onload = function() {
        self._loaded[name] = true;
        delete self._loading[name];
        console.log('📦 Loaded:', name);
        resolve();
      };
      script.onerror = function() {
        delete self._loading[name];
        reject(new Error('Failed to load: ' + name));
      };
      document.head.appendChild(script);
    });
    
    return this._loading[name];
  },
  
  loadMultiple: function(names) {
    return Promise.all(names.map(n => this.load(n)));
  }
};

// ── Preload critical libraries after page load ───────────
window.addEventListener('load', function() {
  // Preload Chart.js since it's commonly needed
  setTimeout(function() {
    window.LazyLibs.load('chart').then(function() {
      return window.LazyLibs.load('chartLabels');
    }).then(function() {
      initChartPlugins();
    }).catch(function() {});
    
    // Preload Firebase messaging & storage
    window.LazyLibs.load('firebase-messaging').catch(function() {});
    window.LazyLibs.load('firebase-storage').catch(function() {});
  }, 2000); // Wait 2s after page load
});

console.log('✅ Init.js loaded - performance enhanced');
