// ✅ CURRICULUM TRACKER v5.5.0 - CHUNK 1: Core (split from original app.js)
// Contains: Utilities, Firebase, Constants, Components up to TeacherHistoryView
// Chunk 2: app-admin.js | Chunk 3: app-features.js (has ReactDOM.render)
// Size: ~551KB | Lines: 12950
// ✅ PERFORMANCE: Use passive event listeners for scroll/touch
document.addEventListener('touchstart', function(){}, {passive: true});
document.addEventListener('touchmove', function(){}, {passive: true});
document.addEventListener('wheel', function(){}, {passive: true});

const {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo
} = React;

// ✅ PERFORMANCE: Enhanced cache with LRU eviction
const firestoreCache = new Map();
const CACHE_MAX_SIZE = 50; // Prevent memory bloat
async function cachedQuery(key, queryFn, ttl = 120000) {
  if (firestoreCache.has(key)) return firestoreCache.get(key);
  const data = await queryFn();
  
  // LRU eviction if cache is too large
  if (firestoreCache.size >= CACHE_MAX_SIZE) {
    const firstKey = firestoreCache.keys().next().value;
    firestoreCache.delete(firstKey);
  }
  
  firestoreCache.set(key, data);
  setTimeout(() => firestoreCache.delete(key), ttl);
  return data;
}
const useDebounce = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
};
const useDebouncedState = (initialValue, delay = 300) => {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const timeoutRef = useRef(null);
  const setValueDebounced = useCallback(newValue => {
    setValue(newValue);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(newValue);
    }, delay);
  }, [delay]);
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  return [value, setValueDebounced, debouncedValue];
};
const firebaseConfig = {
  apiKey: "AIzaSyDyyGAHNJvhuint86USW36eBJKfw_u3AcA",
  authDomain: "curriculum-dbb10.firebaseapp.com",
  projectId: "curriculum-dbb10",
  storageBucket: "curriculum-dbb10.firebasestorage.app",
  messagingSenderId: "706387632109",
  appId: "1:706387632109:web:06c78a304fdbdc12f391e4"
};
let firebaseInitialized = window._firebaseEarlyInit || false;
if (!firebaseInitialized) {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    firebaseInitialized = true;
  } catch (e) {
    console.error('Firebase initialization error:', e);
    try {
      firebase.initializeApp(firebaseConfig);
      firebaseInitialized = true;
    } catch (retryError) {
      console.error('Firebase retry failed:', retryError);
    }
  }
} else {
  console.log('✅ Firebase was initialized early, skipping duplicate init');
}
const getFirestore = () => {
  if (window._earlyDb) {
    return window._earlyDb;
  }
  if (!firebaseInitialized || !firebase.apps.length) {
    console.warn('Firebase not initialized, attempting to initialize...');
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
  }
  return firebase.firestore();
};
const db = getFirestore();
if (window._enableOfflinePersistence && !window._firestoreInitialized) {
  window._enableOfflinePersistence(db);
}
const firebaseWithTimeout = async (promise, timeoutMs = 15000, fallback = null) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Firebase operation timed out after ' + timeoutMs + 'ms'));
    }, timeoutMs);
  });
  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('[Timeout] Firebase operation failed:', error.message);
    return fallback;
  }
};
const auth = firebase.auth();
const SUBJECTS = ['Physics', 'Chemistry', 'Maths', 'Biology'];
const PresenceSystem = {
  userId: null,
  userName: null,
  presenceRef: null,
  heartbeatInterval: null,
  onlineUsers: {},
  allPresence: {},
  listeners: [],
  initialized: false,
  OFFLINE_TIMEOUT: 60000,
  init: function (userId, userName) {
    if (!userId || this.initialized) return;
    this.userId = String(userId);
    this.userName = userName || '';
    this.initialized = true;
    console.log('[Presence] Initializing for:', this.userId, this.userName);
    this.updatePresence('online');
    this.updatePresence('online');
    document.addEventListener('visibilitychange', () => {
      this.updatePresence(document.hidden ? 'away' : 'online');
    });
    window.addEventListener('beforeunload', () => {
      this.updatePresence('offline');
    });
    window.addEventListener('pagehide', () => {
      this.updatePresence('offline');
    });
    document.addEventListener('freeze', () => {
      this.updatePresence('offline');
    });
    this.listenToPresence();
  },
  updatePresence: async function (status) {
    if (!this.userId || typeof firebase === 'undefined') return;
    try {
      const docId = this.userId.replace(/[^a-zA-Z0-9]/g, '_');
      await db.collection('user_presence').doc(docId).set({
        status: status,
        lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
        userId: this.userId,
        userName: this.userName,
        updatedAt: new Date().toISOString(),
        heartbeatAt: Date.now()
      }, {
        merge: true
      });
      console.log('[Presence] Updated:', status);
    } catch (e) {
      console.log('[Presence] Update error:', e);
    }
  },
  listenToPresence: function () {
    const fetchPresence = async () => {
      try {
        const snap = await db.collection('user_presence').orderBy('lastSeen', 'desc').limit(200).get();
        const online = {};
        const all = {};
        const now = Date.now();
        snap.docs.forEach(doc => {
          const data = doc.data();
          const heartbeatAt = data.heartbeatAt || 0;
          const timeSinceHeartbeat = now - heartbeatAt;
          let effectiveStatus = data.status;
          if (effectiveStatus === 'online' || effectiveStatus === 'away') {
            if (timeSinceHeartbeat > this.OFFLINE_TIMEOUT) {
              effectiveStatus = 'offline';
            }
          }
          const presenceData = {
            ...data,
            status: effectiveStatus,
            originalStatus: data.status
          };
          all[doc.id] = presenceData;
          if (data.userId) all[data.userId] = presenceData;
          if (data.userName) all[data.userName.toLowerCase()] = presenceData;
          if (data.email) all[data.email.toLowerCase()] = presenceData;
          if (effectiveStatus === 'online' || effectiveStatus === 'away') {
            online[doc.id] = presenceData;
          }
        });
        this.onlineUsers = online;
        this.allPresence = all;
        this.notifyListeners();
        console.log('[Presence] Loaded', Object.keys(all).length, 'presence records');
      } catch (err) {
        console.log('[Presence] Fetch error:', err);
      }
    };
    fetchPresence();
    this.presenceInterval = setInterval(fetchPresence, 600000);
  },
  getOnlineCount: function () {
    return Object.keys(this.onlineUsers).length;
  },
  findPresence: function (userId) {
    if (!userId) return null;
    const searchKey = String(userId).toLowerCase();
    const sanitizedKey = searchKey.replace(/[^a-zA-Z0-9]/g, '_');
    if (this.allPresence[userId]) return this.allPresence[userId];
    if (this.allPresence[sanitizedKey]) return this.allPresence[sanitizedKey];
    if (this.allPresence[searchKey]) return this.allPresence[searchKey];
    for (const [key, data] of Object.entries(this.allPresence)) {
      if (data.userId && String(data.userId).toLowerCase() === searchKey) return data;
      if (data.userName && String(data.userName).toLowerCase() === searchKey) return data;
      if (data.email && String(data.email).toLowerCase() === searchKey) return data;
      if (key.toLowerCase() === searchKey) return data;
      if (data.userId && String(data.userId).toLowerCase().includes(searchKey)) return data;
    }
    return null;
  },
  isOnline: function (userId) {
    const presence = this.findPresence(userId);
    if (!presence) return false;
    const now = Date.now();
    const heartbeatAt = presence.heartbeatAt || 0;
    const timeSinceHeartbeat = now - heartbeatAt;
    if (timeSinceHeartbeat > this.OFFLINE_TIMEOUT) {
      return false;
    }
    return presence?.status === 'online' || presence?.status === 'away';
  },
  getLastSeen: function (userId) {
    const presence = this.findPresence(userId);
    if (!presence?.lastSeen) return null;
    try {
      const lastSeen = presence.lastSeen.toDate ? presence.lastSeen.toDate() : new Date(presence.lastSeen);
      return lastSeen;
    } catch (e) {
      if (presence.updatedAt) {
        return new Date(presence.updatedAt);
      }
      return null;
    }
  },
  formatLastSeen: function (userId) {
    const lastSeen = this.getLastSeen(userId);
    if (!lastSeen) return 'Never';
    const now = new Date();
    const diff = Math.floor((now - lastSeen) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return Math.floor(diff / 86400) + 'd ago';
  },
  subscribe: function (callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  },
  notifyListeners: function () {
    this.listeners.forEach(callback => callback(this.onlineUsers));
  },
  cleanup: function () {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.presenceInterval) {
      clearInterval(this.presenceInterval);
    }
    this.updatePresence('offline');
  }
};
const NotificationSound = {
  audioContext: null,
  init: function () {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.log('[Sound] AudioContext not available');
    }
  },
  playChime: function () {
    if (!this.audioContext) this.init();
    if (!this.audioContext) return;
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1108.73, this.audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(1318.51, this.audioContext.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + 0.4);
    } catch (e) {
      console.log('[Sound] Chime error:', e);
    }
  }
};
const MentionNotificationSystem = {
  sendMentionNotification: async function (mentionedUserId, mentionedUserName, postContent, authorName, authorId) {
    if (!mentionedUserId || typeof firebase === 'undefined') return;
    try {
      await db.collection('mention_notifications').add({
        targetUserId: mentionedUserId,
        targetUserName: mentionedUserName,
        postContent: postContent.substring(0, 100) + (postContent.length > 100 ? '...' : ''),
        authorName: authorName,
        authorId: authorId,
        type: 'mention',
        read: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log('[Mentions] Notification sent to:', mentionedUserName);
    } catch (e) {
      console.log('[Mentions] Error sending notification:', e);
    }
  },
  sendEveryoneNotification: async function (postContent, authorName, authorId) {
    if (typeof firebase === 'undefined') return;
    try {
      await db.collection('everyone_notifications').add({
        postContent: postContent.substring(0, 100) + (postContent.length > 100 ? '...' : ''),
        authorName: authorName,
        authorId: authorId,
        type: 'everyone',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log('[Mentions] @everyone notification sent');
    } catch (e) {
      console.log('[Mentions] Error sending @everyone notification:', e);
    }
  },
  listenForMentions: function (userId, callback) {
    if (!userId || typeof firebase === 'undefined') return () => {};
    let lastMentionCount = 0;
    const fetchMentions = async () => {
      try {
        const snap = await db.collection('mention_notifications').where('targetUserId', '==', userId).where('read', '==', false).orderBy('createdAt', 'desc').limit(10).get();
        const mentions = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        if (mentions.length > lastMentionCount && lastMentionCount > 0) {
          NotificationSound.playChime();
        }
        lastMentionCount = mentions.length;
        callback(mentions);
      } catch (e) {
        console.log('[Mentions] Fetch error:', e);
      }
    };
    fetchMentions();
    const interval = setInterval(fetchMentions, 120000);
    return () => clearInterval(interval);
  },
  listenForEveryone: function (callback) {
    if (typeof firebase === 'undefined') return () => {};
    const fetchEveryone = async () => {
      try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const snap = await db.collection('everyone_notifications').where('createdAt', '>', fiveMinutesAgo).orderBy('createdAt', 'desc').limit(5).get();
        const notifications = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(notifications);
      } catch (e) {
        console.log('[Everyone] Fetch error:', e);
      }
    };
    fetchEveryone();
    const interval = setInterval(fetchEveryone, 120000);
    return () => clearInterval(interval);
  },
  markAsRead: async function (notificationId) {
    try {
      await db.collection('mention_notifications').doc(notificationId).update({
        read: true
      });
    } catch (e) {
      console.log('[Mentions] Mark read error:', e);
    }
  }
};
document.addEventListener('click', function initSound() {
  NotificationSound.init();
  document.removeEventListener('click', initSound);
}, {
  once: true
});
let SCHOOLS = ['CoE Barwani', 'CoE Cuttak', 'CoE Bundi', 'CoE Mahisagar', 'EMRS Bhopal', 'JNV Bharuch'];
let ALL_SCHOOLS_COUNT = 0;
function extractSchoolsFromCurriculum(curriculum) {
  const schools = new Set();
  Object.keys(curriculum).forEach(docId => {
    const parts = docId.split('_');
    if (parts.length >= 3) {
      const schoolName = parts.slice(0, -2).join('_');
      if (schoolName) schools.add(schoolName);
    }
  });
  return Array.from(schools).sort();
}
function getCachedSchools() {
  try {
    const cached = localStorage.getItem('curriculum_schools_cache');
    if (cached) {
      const data = JSON.parse(cached);
      if (data.timestamp && Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
        return data.schools || [];
      }
    }
  } catch (e) {}
  return [];
}
function cacheSchools(schools) {
  try {
    localStorage.setItem('curriculum_schools_cache', JSON.stringify({
      schools: schools,
      timestamp: Date.now()
    }));
  } catch (e) {}
}
(function () {
  const cachedSchools = getCachedSchools();
  if (cachedSchools.length > 0) {
    SCHOOLS = cachedSchools;
    ALL_SCHOOLS_COUNT = cachedSchools.length;
    console.log('📊 [Schools] Loaded', cachedSchools.length, 'schools from cache');
  }
})();
const MANAGER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  DIRECTOR: 'director',
  ASSOC_DIRECTOR: 'assoc_director',
  TRAINING: 'training',
  APH: 'aph',
  PM: 'pm',
  APM: 'apm',
  APC: 'apc'
};
const ROLE_LABELS = {
  'super_admin': 'Super Admin',
  'director': 'Director',
  'assoc_director': 'Associate Director',
  'training': 'Training Department',
  'aph': 'Program Head',
  'pm': 'Program Manager',
  'apm': 'Associate Program Manager',
  'apc': 'Academic Program Coordinator'
};
const ROLE_COLORS = {
  'super_admin': {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-200'
  },
  'director': {
    bg: 'bg-indigo-100',
    text: 'text-indigo-700',
    border: 'border-indigo-200'
  },
  'assoc_director': {
    bg: 'bg-violet-100',
    text: 'text-violet-700',
    border: 'border-violet-200'
  },
  'training': {
    bg: 'bg-cyan-100',
    text: 'text-cyan-700',
    border: 'border-cyan-200'
  },
  'aph': {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200'
  },
  'pm': {
    bg: 'bg-green-100',
    text: 'text-green-700',
    border: 'border-green-200'
  },
  'apm': {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    border: 'border-orange-200'
  },
  'apc': {
    bg: 'bg-teal-100',
    text: 'text-teal-700',
    border: 'border-teal-200'
  }
};
const getCurrentAcademicYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  if (month >= 3) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};
const CURRENT_ACADEMIC_YEAR = getCurrentAcademicYear();
const DataSyncManager = {
  pendingOperations: [],
  retryInterval: null,
  maxRetries: 5,
  init: function () {
    try {
      const stored = localStorage.getItem('pendingDataSync');
      if (stored) {
        this.pendingOperations = JSON.parse(stored);
        console.log('[DataSync] Loaded', this.pendingOperations.length, 'pending operations');
      }
    } catch (e) {
      console.error('[DataSync] Error loading pending ops:', e);
    }
    window.addEventListener('online', () => {
      console.log('[DataSync] Back online, syncing...');
      this.syncPendingOperations();
    });
    setInterval(() => {
      if (navigator.onLine && this.pendingOperations.length > 0) {
        this.syncPendingOperations();
      }
    }, 30000);
  },
  saveWithRetry: async function (collection, docId, data, options = {}) {
    const {
      merge = true,
      maxRetries = this.maxRetries,
      showToast = true
    } = options;
    const operation = {
      id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      collection,
      docId,
      data,
      merge,
      timestamp: new Date().toISOString(),
      retries: 0
    };
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (!navigator.onLine) {
          throw new Error('Offline');
        }
        const docRef = docId ? db.collection(collection).doc(docId) : db.collection(collection).doc();
        await docRef.set(data, {
          merge
        });
        if (showToast) {
          this.showSaveToast('success');
        }
        return {
          success: true,
          docId: docRef.id
        };
      } catch (error) {
        console.log(`[DataSync] Attempt ${attempt + 1} failed:`, error.message);
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    this.pendingOperations.push(operation);
    this.savePendingToStorage();
    if (showToast) {
      this.showSaveToast('queued');
    }
    return {
      success: false,
      queued: true,
      operationId: operation.id
    };
  },
  syncPendingOperations: async function () {
    if (!navigator.onLine || this.pendingOperations.length === 0) return;
    console.log('[DataSync] Syncing', this.pendingOperations.length, 'operations');
    const successfulOps = [];
    for (const op of this.pendingOperations) {
      try {
        const docRef = op.docId ? db.collection(op.collection).doc(op.docId) : db.collection(op.collection).doc();
        await docRef.set(op.data, {
          merge: op.merge
        });
        successfulOps.push(op.id);
        console.log('[DataSync] Synced:', op.collection);
      } catch (error) {
        op.retries++;
        console.log('[DataSync] Failed to sync:', op.collection, error.message);
        if (op.retries > 10) {
          successfulOps.push(op.id);
          console.log('[DataSync] Giving up on:', op.collection);
        }
      }
    }
    this.pendingOperations = this.pendingOperations.filter(op => !successfulOps.includes(op.id));
    this.savePendingToStorage();
    if (successfulOps.length > 0) {
      this.showSaveToast('synced', successfulOps.length);
    }
  },
  savePendingToStorage: function () {
    try {
      localStorage.setItem('pendingDataSync', JSON.stringify(this.pendingOperations));
    } catch (e) {
      console.error('[DataSync] Error saving to storage:', e);
    }
  },
  showSaveToast: function (status, count = 1) {
    const existing = document.getElementById('saveToast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'saveToast';
    toast.className = 'fixed bottom-20 right-4 px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-2 text-sm font-medium transition-all';
    switch (status) {
      case 'success':
        toast.className += ' bg-green-500 text-white';
        toast.innerHTML = '✅ Saved!';
        break;
      case 'queued':
        toast.className += ' bg-yellow-500 text-black';
        toast.innerHTML = '⏳ Saved offline - will sync when connected';
        break;
      case 'synced':
        toast.className += ' bg-blue-500 text-white';
        toast.innerHTML = `🔄 Synced ${count} item${count > 1 ? 's' : ''}!`;
        break;
      case 'error':
        toast.className += ' bg-red-500 text-white';
        toast.innerHTML = '❌ Save failed';
        break;
    }
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, status === 'queued' ? 4000 : 2000);
  },
  getPendingCount: function () {
    return this.pendingOperations.length;
  }
};
if (typeof window !== 'undefined') {
  DataSyncManager.init();
}
const LEAVE_REASONS = ['Present', 'Personal Leave', 'Sick Leave', 'Weekly Off', 'Public Holiday', 'Organization Holiday', 'School Holiday', 'Emergency Leave', 'Maternity Leave', 'Paternity Leave', 'Comp Off'];
const LEAVE_ENTITLEMENTS = {
  'Personal Leave': 35,
  'Sick Leave': 35,
  'Emergency Leave': 35,
  'Maternity Leave': 180,
  'Paternity Leave': 15
};
const ENTITLED_LEAVE_TYPES = ['Personal Leave', 'Sick Leave', 'Emergency Leave'];
const MATERNITY_LEAVE_TYPES = ['Maternity Leave'];
const PATERNITY_LEAVE_TYPES = ['Paternity Leave'];
const ASSET_CATEGORIES = ['Physics', 'Chemistry', 'Maths', 'Biology', 'General', 'Competition', 'Other'];
const ASSET_TYPES = ['book', 'chromebook'];
const CLASSROOM_OBSERVATION_PARAMETERS = [{
  id: 'teacherStartedOnTime',
  type: 'minor',
  text: 'Teacher started the class on time',
  maxScore: 1,
  options: [{
    label: 'Yes',
    value: 1
  }, {
    label: 'No',
    value: 0
  }]
}, {
  id: 'hygiene',
  type: 'minor',
  text: 'Hygiene Parameter: Teacher Grooming - The teacher is formally dressed with proper grooming',
  maxScore: 1,
  options: [{
    label: 'Yes',
    value: 1
  }, {
    label: 'No',
    value: 0
  }]
}, {
  id: 'startNote',
  type: 'minor',
  text: 'Start Note of the Class: Greetings to the students along with general discussion to gather the attention of all students',
  maxScore: 1,
  options: [{
    label: 'Yes',
    value: 1
  }, {
    label: 'No',
    value: 0
  }]
}, {
  id: 'preTask',
  type: 'minor',
  text: 'Class structure - Pre-task/Check for HW: The teacher is discussing any previous task assigned',
  maxScore: 1,
  options: [{
    label: 'Yes',
    value: 1
  }, {
    label: 'No',
    value: 0
  }]
}, {
  id: 'recall',
  type: 'major',
  text: 'Class structure - Recall/Recall test: The session recall needs to be done with two-side communication with simple questions if possible',
  maxScore: 2,
  options: [{
    label: 'Recall done - with questions / students interaction within time',
    value: 2
  }, {
    label: 'Recall done - without questions / Taking more than allotted time',
    value: 1
  }, {
    label: 'Recall is not done',
    value: 0
  }]
}, {
  id: 'learningObjective',
  type: 'major',
  text: 'Learning Objective Setting - Agenda of the class: The teacher needs to set the learning outcome or index for the present class',
  maxScore: 1,
  options: [{
    label: 'Agenda clearly given',
    value: 1
  }, {
    label: 'Agenda not given/not clear',
    value: 0
  }]
}, {
  id: 'curiosityIntro',
  type: 'major',
  text: 'Curiosity-Introduction: Introduction with practical examples',
  maxScore: 1,
  options: [{
    label: 'Yes',
    value: 1
  }, {
    label: 'No',
    value: 0
  }]
}, {
  id: 'teachingCompetence',
  type: 'major',
  text: 'Concept-Teaching competence',
  maxScore: 4,
  inputType: 'checkbox',
  checkboxItems: [{
    id: 'conceptClear',
    label: 'Concept clearly explained'
  }, {
    id: 'cfuPresent',
    label: 'CFU-Check for understanding present'
  }, {
    id: 'physicalTools',
    label: 'Used physical teaching tools'
  }, {
    id: 'wellPrepared',
    label: 'Teacher was well-prepared'
  }],
  options: [{
    label: 'All 4 parameters met',
    value: 4
  }, {
    label: 'Any 3 parameters met',
    value: 3
  }, {
    label: 'Any 2 parameters met',
    value: 2
  }, {
    label: 'Any 1 parameter met',
    value: 1
  }, {
    label: 'None',
    value: 0
  }]
}, {
  id: 'notesTaking',
  type: 'major',
  text: 'Concept-Notes Taking: Teacher provides notes and checks students are noting down',
  maxScore: 3,
  options: [{
    label: 'Notes given & checked + mind maps/tricks/mnemonics provided',
    value: 3
  }, {
    label: 'Notes given and ensured all students are noting down by checking',
    value: 2
  }, {
    label: 'Notes given but not checked with students',
    value: 1
  }, {
    label: 'Notes were not given',
    value: 0
  }]
}, {
  id: 'problemSolving',
  type: 'major',
  text: 'Concept-Problem solving: Problems solved with student interaction and PYQs',
  maxScore: 4,
  options: [{
    label: 'Problem solved step by step + student opportunity + PYQ given & solved',
    value: 4
  }, {
    label: 'Problem solved step by step + giving opportunity for students to solve',
    value: 3
  }, {
    label: 'Problem solved step by step with student interaction',
    value: 2
  }, {
    label: 'Problem solved without mistakes',
    value: 1
  }, {
    label: 'No problems solved or solved with mistakes',
    value: 0
  }]
}, {
  id: 'doubtSolving',
  type: 'major',
  text: 'Concept-Doubt solving: Doubts solved correctly with good time management',
  maxScore: 2,
  options: [{
    label: 'Doubt solved correctly with good time management',
    value: 2
  }, {
    label: 'Doubt solved correctly but time management not good',
    value: 1
  }, {
    label: 'No doubt asked & teacher did not encourage / doubt solved wrong',
    value: 0
  }]
}, {
  id: 'boardPresentation',
  type: 'major',
  text: 'Communication-Board Presentation',
  maxScore: 3,
  inputType: 'checkbox',
  checkboxItems: [{
    id: 'boardUsage',
    label: 'Usage of board'
  }, {
    id: 'writingClear',
    label: 'Writing is clear'
  }, {
    id: 'boardRepresentation',
    label: 'Board representation clear/highlighting formulae'
  }],
  options: [{
    label: 'All 3 parameters met',
    value: 3
  }, {
    label: 'Any 2 parameters met',
    value: 2
  }, {
    label: 'Any 1 parameter met',
    value: 1
  }, {
    label: 'None',
    value: 0
  }]
}, {
  id: 'interaction',
  type: 'major',
  text: 'Communication-Interaction: Engaging all students vs limited engagement',
  maxScore: 2,
  options: [{
    label: 'Putting efforts for engaging all the students',
    value: 2
  }, {
    label: 'Student engagement is limited to few students',
    value: 1
  }, {
    label: 'One way teaching / No engagement with students',
    value: 0
  }]
}, {
  id: 'bodyLanguage',
  type: 'major',
  text: 'Communication-Body Language & Energy & Voice',
  maxScore: 6,
  inputType: 'checkbox',
  checkboxItems: [{
    id: 'voiceClear',
    label: 'Voice clear'
  }, {
    id: 'voiceModulations',
    label: 'Voice modulations'
  }, {
    id: 'movementAroundClass',
    label: 'Movement around class'
  }, {
    id: 'eyeContact',
    label: 'Eye contact'
  }, {
    id: 'handGestures',
    label: 'Hand gestures'
  }, {
    id: 'adaptiveLanguage',
    label: 'Adaptive language & fluency'
  }],
  options: [{
    label: 'All 6 parameters met',
    value: 6
  }, {
    label: 'Any 5 parameters',
    value: 5
  }, {
    label: 'Any 4 parameters',
    value: 4
  }, {
    label: 'Any 3 parameters',
    value: 3
  }, {
    label: 'Any 2 parameters',
    value: 2
  }, {
    label: 'Any 1 parameter',
    value: 1
  }, {
    label: 'None',
    value: 0
  }]
}, {
  id: 'conclusion',
  type: 'minor',
  text: 'Class structure-Conclusion: Summary, homework, and next class preview',
  maxScore: 3,
  options: [{
    label: 'Class summary + HW given + Idea about next class',
    value: 3
  }, {
    label: 'Both Class summary and HW given',
    value: 2
  }, {
    label: 'Either HW or class summary given, not both',
    value: 1
  }, {
    label: 'No Summary and no home work given',
    value: 0
  }]
}, {
  id: 'paceOfTeaching',
  type: 'major',
  text: 'Class structure-Pace of teaching: Appropriate pace maintained throughout',
  maxScore: 2,
  options: [{
    label: 'Pace of teaching is as per class level',
    value: 2
  }, {
    label: 'Pace of teaching is good but not followed throughout',
    value: 1
  }, {
    label: 'Pace of teaching is not good',
    value: 0
  }]
}, {
  id: 'timeManagement',
  type: 'major',
  text: 'Class structure-Time management: Completed the learning objectives in the stipulated time',
  maxScore: 3,
  options: [{
    label: 'Agenda completed within time',
    value: 3
  }, {
    label: 'Agenda is completed but rushed towards the end',
    value: 2
  }, {
    label: 'Agenda could not be completed',
    value: 1
  }]
}, {
  id: 'classroomManagement',
  type: 'major',
  text: 'Class structure-Classroom management: Teacher set class rules, able to manage entire class well',
  maxScore: 2,
  options: [{
    label: 'Teacher is able to manage the class',
    value: 2
  }, {
    label: 'Teacher mostly able to manage with some disruption',
    value: 1
  }, {
    label: 'Teacher was unable to manage the class',
    value: 0
  }]
}, {
  id: 'genderSensitivity',
  type: 'major',
  text: 'Gender Sensitivity: 1) Avoids gender-biased remarks, 2) Uses gender-neutral language, 3) Represents diversity in examples, 4) Encourages balanced participation, 5) Addresses gender topics sensitively',
  maxScore: 3,
  options: [{
    label: 'No violations + any 2 positive indicators',
    value: 3
  }, {
    label: 'No violations + any 1 positive indicator',
    value: 2
  }, {
    label: 'Violation occurred once but teacher corrected it',
    value: 1
  }, {
    label: 'Violation occurred more than once',
    value: 0
  }]
}];
const MAX_OBSERVATION_SCORE = CLASSROOM_OBSERVATION_PARAMETERS.reduce((sum, p) => sum + p.maxScore, 0);
function calculateLeaveBalance(teacherAttendance, teacherId, leaveAdjustments = {}) {
  const teacherLeaves = teacherAttendance.filter(a => a.teacherId === teacherId && a.status === 'On Leave');
  let entitledUsed = 0;
  let maternityUsed = 0;
  let paternityUsed = 0;
  teacherLeaves.forEach(leave => {
    if (ENTITLED_LEAVE_TYPES.includes(leave.reason)) {
      entitledUsed++;
    } else if (MATERNITY_LEAVE_TYPES.includes(leave.reason)) {
      maternityUsed++;
    } else if (PATERNITY_LEAVE_TYPES.includes(leave.reason)) {
      paternityUsed++;
    }
  });
  const adjustment = leaveAdjustments[teacherId] || {
    entitled: 0,
    maternity: 0,
    paternity: 0
  };
  entitledUsed += adjustment.entitled || 0;
  maternityUsed += adjustment.maternity || 0;
  paternityUsed += adjustment.paternity || 0;
  return {
    entitled: {
      total: 35,
      used: entitledUsed,
      remaining: Math.max(0, 35 - entitledUsed),
      adjustment: adjustment.entitled || 0
    },
    maternity: {
      total: 180,
      used: maternityUsed,
      remaining: Math.max(0, 180 - maternityUsed),
      adjustment: adjustment.maternity || 0
    },
    paternity: {
      total: 15,
      used: paternityUsed,
      remaining: Math.max(0, 15 - paternityUsed),
      adjustment: adjustment.paternity || 0
    }
  };
}
const GENDERS = ['Male', 'Female', 'Other'];
const isEditing = true;
function ClassroomObservationForm({
  teacher,
  observerInfo,
  onClose,
  onSubmitSuccess
}) {
  const [grade, setGrade] = useState('11');
  const [observationDate, setObservationDate] = useState(getTodayDate());
  const [observationTime, setObservationTime] = useState(new Date().toTimeString().slice(0, 5));
  const [chapterName, setChapterName] = useState('');
  const [topicName, setTopicName] = useState('');
  const [responses, setResponses] = useState({});
  const [checkboxSelections, setCheckboxSelections] = useState({});
  const [remarks, setRemarks] = useState({});
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [mediaLinks, setMediaLinks] = useState(['']);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const handleCheckboxToggle = (paramId, itemId) => {
    setCheckboxSelections(prev => {
      const current = prev[paramId] || {};
      const newSelection = {
        ...current,
        [itemId]: !current[itemId]
      };
      const checkedCount = Object.values(newSelection).filter(Boolean).length;
      handleResponseChange(paramId, checkedCount);
      return {
        ...prev,
        [paramId]: newSelection
      };
    });
  };
  const totalScore = useMemo(() => {
    return Object.values(responses).reduce((sum, val) => sum + (val || 0), 0);
  }, [responses]);
  const percentageScore = (totalScore / MAX_OBSERVATION_SCORE * 100).toFixed(1);
  const flaggedCount = useMemo(() => {
    return CLASSROOM_OBSERVATION_PARAMETERS.filter(p => {
      const score = responses[p.id];
      return score !== undefined && score < p.maxScore;
    }).length;
  }, [responses]);
  const handleResponseChange = (paramId, value) => {
    setResponses(prev => ({
      ...prev,
      [paramId]: value
    }));
  };
  const handleRemarkChange = (paramId, value) => {
    setRemarks(prev => ({
      ...prev,
      [paramId]: value
    }));
  };
  const addMediaLink = () => {
    setMediaLinks(prev => [...prev, '']);
  };
  const updateMediaLink = (index, value) => {
    setMediaLinks(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };
  const removeMediaLink = index => {
    setMediaLinks(prev => prev.filter((_, i) => i !== index));
  };
  const handleSubmit = async () => {
    const unanswered = CLASSROOM_OBSERVATION_PARAMETERS.filter(p => responses[p.id] === undefined);
    if (unanswered.length > 0) {
      alert(`Please answer all observation parameters. ${unanswered.length} unanswered.`);
      return;
    }
    setSubmitting(true);
    try {
      const observationData = {
        teacherId: teacher.afid || teacher.docId,
        teacherName: teacher.name,
        teacherAfCode: teacher.afCode || null,
        teacherSubject: teacher.subject,
        school: teacher.school,
        grade: grade,
        chapterName: chapterName || null,
        topicName: topicName || null,
        observationDate: observationDate,
        observationTime: observationTime,
        responses: responses,
        checkboxSelections: checkboxSelections,
        remarks: remarks,
        strengths: strengths,
        improvements: improvements,
        mediaLinks: mediaLinks.filter(link => link.trim() !== ''),
        totalScore: totalScore,
        maxScore: MAX_OBSERVATION_SCORE,
        percentageScore: parseFloat(percentageScore),
        flaggedCount: flaggedCount,
        observerId: observerInfo.id,
        observerName: observerInfo.name,
        observerPosition: observerInfo.position || 'Manager',
        submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
        submittedAtISO: new Date().toISOString()
      };
      await db.collection('classroomObservations').add(observationData);
      alert('✅ Classroom observation submitted successfully!');
      onSubmitSuccess && onSubmitSuccess();
      onClose();
    } catch (error) {
      console.error('Error submitting observation:', error);
      alert('❌ Failed to submit observation: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };
  const getScoreColor = (score, max) => {
    const pct = score / max * 100;
    if (pct >= 80) return 'bg-green-100 text-green-700 border-green-300';
    if (pct >= 60) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-red-100 text-red-700 border-red-300';
  };
  return React.createElement("div", {
    className: "modal-overlay",
    onClick: onClose
  }, React.createElement("div", {
    className: "modal-content max-w-4xl max-h-[95vh] overflow-y-auto",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "p-6"
  }, React.createElement("div", {
    className: "flex justify-between items-start mb-6"
  }, React.createElement("div", null, React.createElement("h2", {
    className: "text-2xl font-bold"
  }, "\uD83D\uDCCB Classroom Observation"), React.createElement("p", {
    className: "text-gray-600 mt-1"
  }, "Teacher: ", React.createElement("strong", null, teacher.name), " (", teacher.subject, ")"), React.createElement("p", {
    className: "text-gray-500 text-sm"
  }, "School: ", teacher.school)), React.createElement("button", {
    onClick: onClose,
    className: "text-3xl font-bold text-gray-400 hover:text-gray-600"
  }, "\xD7")), React.createElement("div", {
    className: "mb-6 bg-gray-100 rounded-full h-2"
  }, React.createElement("div", {
    className: "avanti-gradient h-2 rounded-full transition-all",
    style: {
      width: `${Object.keys(responses).length / CLASSROOM_OBSERVATION_PARAMETERS.length * 100}%`
    }
  })), React.createElement("div", {
    className: "grid md:grid-cols-3 gap-4 mb-6 bg-gray-50 p-4 rounded-xl"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Grade *"), React.createElement("select", {
    value: grade,
    onChange: e => setGrade(e.target.value),
    className: "w-full border-2 px-4 py-3 rounded-xl"
  }, React.createElement("option", {
    value: "11"
  }, "Class 11"), React.createElement("option", {
    value: "12"
  }, "Class 12"))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Date *"), React.createElement("input", {
    type: "date",
    value: observationDate,
    onChange: e => setObservationDate(e.target.value),
    className: "w-full border-2 px-4 py-3 rounded-xl"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Time *"), React.createElement("input", {
    type: "time",
    value: observationTime,
    onChange: e => setObservationTime(e.target.value),
    className: "w-full border-2 px-4 py-3 rounded-xl"
  }))), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4 mb-6 bg-blue-50 p-4 rounded-xl"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Chapter Name (Optional)"), React.createElement("input", {
    type: "text",
    value: chapterName,
    onChange: e => setChapterName(e.target.value),
    placeholder: "e.g., Kinematics, Chemical Bonding",
    className: "w-full border-2 px-4 py-3 rounded-xl"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Topic Name (Optional)"), React.createElement("input", {
    type: "text",
    value: topicName,
    onChange: e => setTopicName(e.target.value),
    placeholder: "e.g., Projectile Motion, Hybridization",
    className: "w-full border-2 px-4 py-3 rounded-xl"
  }))), React.createElement("div", {
    className: `p-4 rounded-xl mb-6 border-2 ${getScoreColor(totalScore, MAX_OBSERVATION_SCORE)}`
  }, React.createElement("div", {
    className: "flex justify-between items-center"
  }, React.createElement("div", null, React.createElement("span", {
    className: "text-2xl font-bold"
  }, totalScore, "/", MAX_OBSERVATION_SCORE), React.createElement("span", {
    className: "ml-2 text-lg"
  }, "(", percentageScore, "%)")), React.createElement("div", {
    className: "text-right"
  }, React.createElement("span", {
    className: "px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold"
  }, flaggedCount, " flagged items")))), React.createElement("div", {
    className: "space-y-4 mb-6"
  }, React.createElement("h3", {
    className: "text-xl font-bold border-b pb-2"
  }, "Observation Parameters"), CLASSROOM_OBSERVATION_PARAMETERS.map((param, idx) => React.createElement("div", {
    key: param.id,
    className: `p-4 rounded-xl border-2 ${responses[param.id] !== undefined ? responses[param.id] === param.maxScore ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`
  }, React.createElement("div", {
    className: "flex justify-between items-start mb-3"
  }, React.createElement("div", {
    className: "flex-1"
  }, React.createElement("span", {
    className: `inline-block px-2 py-1 text-xs font-bold rounded mb-2 ${param.type === 'major' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`
  }, param.type === 'major' ? '⭐ Major' : '📌 Minor', " (", param.maxScore, " pts)"), React.createElement("p", {
    className: "font-semibold text-gray-800"
  }, idx + 1, ". ", param.text))), param.inputType === 'checkbox' && param.checkboxItems ? React.createElement("div", {
    className: "mb-3"
  }, React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-2 gap-2 mb-3 p-3 bg-gray-50 rounded-xl"
  }, param.checkboxItems.map(item => {
    const isChecked = checkboxSelections[param.id]?.[item.id] || false;
    return React.createElement("label", {
      key: item.id,
      className: `flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${isChecked ? 'bg-green-100 border border-green-300' : 'bg-white border border-gray-200 hover:bg-gray-100'}`
    }, React.createElement("input", {
      type: "checkbox",
      checked: isChecked,
      onChange: () => handleCheckboxToggle(param.id, item.id),
      className: "cursor-pointer"
    }), React.createElement("span", {
      className: `text-sm ${isChecked ? 'text-green-700 font-semibold' : 'text-gray-700'}`
    }, item.label));
  })), React.createElement("div", {
    className: "flex items-center gap-2 text-sm"
  }, React.createElement("span", {
    className: "font-semibold"
  }, "Score:"), React.createElement("span", {
    className: `px-3 py-1 rounded-full font-bold ${responses[param.id] === param.maxScore ? 'bg-green-100 text-green-700' : responses[param.id] > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`
  }, responses[param.id] ?? 0, " / ", param.maxScore), React.createElement("span", {
    className: "text-gray-500"
  }, "(", Object.values(checkboxSelections[param.id] || {}).filter(Boolean).length, " items selected)"))) : React.createElement("select", {
    value: responses[param.id] ?? '',
    onChange: e => handleResponseChange(param.id, e.target.value === '' ? undefined : parseInt(e.target.value)),
    className: "w-full border-2 px-4 py-3 rounded-xl mb-2"
  }, React.createElement("option", {
    value: ""
  }, "-- Select --"), param.options.map((opt, optIdx) => React.createElement("option", {
    key: optIdx,
    value: opt.value
  }, opt.label, " (", opt.value, ")"))), responses[param.id] !== undefined && responses[param.id] < param.maxScore && React.createElement("div", {
    className: "mt-2"
  }, React.createElement("label", {
    className: "block text-sm font-semibold text-red-600 mb-1"
  }, "\uD83D\uDCDD Remarks (why not full marks?)"), React.createElement("textarea", {
    value: remarks[param.id] || '',
    onChange: e => handleRemarkChange(param.id, e.target.value),
    placeholder: "Please provide remarks for improvement...",
    className: "w-full border-2 border-red-200 px-4 py-2 rounded-xl text-sm",
    rows: "2"
  }))))), React.createElement("div", {
    className: "space-y-4 mb-6 bg-blue-50 p-4 rounded-xl"
  }, React.createElement("h3", {
    className: "text-xl font-bold text-blue-800"
  }, "\uD83D\uDCDD Observer Summary"), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Strengths Observed"), React.createElement("textarea", {
    value: strengths,
    onChange: e => setStrengths(e.target.value),
    placeholder: "What did the teacher do well?",
    className: "w-full border-2 px-4 py-3 rounded-xl",
    rows: "3"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Points of Improvement"), React.createElement("textarea", {
    value: improvements,
    onChange: e => setImprovements(e.target.value),
    placeholder: "What recommendations do you have to improve teaching?",
    className: "w-full border-2 px-4 py-3 rounded-xl",
    rows: "3"
  }))), React.createElement("div", {
    className: "space-y-4 mb-6 bg-gray-50 p-4 rounded-xl"
  }, React.createElement("div", {
    className: "flex justify-between items-center"
  }, React.createElement("h3", {
    className: "text-xl font-bold"
  }, "\uD83D\uDCF8 Media (Google Drive Links)"), React.createElement("button", {
    onClick: addMediaLink,
    className: "px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold"
  }, "+ Add Link")), mediaLinks.map((link, idx) => React.createElement("div", {
    key: idx,
    className: "flex gap-2"
  }, React.createElement("input", {
    type: "url",
    value: link,
    onChange: e => updateMediaLink(idx, e.target.value),
    placeholder: "https://drive.google.com/...",
    className: "flex-1 border-2 px-4 py-2 rounded-xl"
  }), mediaLinks.length > 1 && React.createElement("button", {
    onClick: () => removeMediaLink(idx),
    className: "px-3 py-2 bg-red-500 text-white rounded-xl"
  }, "\u2715")))), React.createElement("div", {
    className: "bg-gray-100 p-4 rounded-xl mb-6"
  }, React.createElement("h4", {
    className: "font-bold mb-2"
  }, "Observer Information (Auto-filled)"), React.createElement("div", {
    className: "grid md:grid-cols-3 gap-4 text-sm"
  }, React.createElement("div", null, React.createElement("strong", null, "Name:"), " ", observerInfo.name), React.createElement("div", null, React.createElement("strong", null, "Position:"), " ", observerInfo.position || 'Manager'), React.createElement("div", null, React.createElement("strong", null, "Date/Time:"), " ", new Date().toLocaleString('en-IN')))), React.createElement("div", {
    className: "flex gap-4"
  }, React.createElement("button", {
    onClick: handleSubmit,
    disabled: submitting,
    className: "flex-1 avanti-gradient text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 disabled:opacity-50"
  }, submitting ? '⏳ Submitting...' : '✅ Submit Observation'), React.createElement("button", {
    onClick: onClose,
    className: "px-8 py-4 bg-gray-300 rounded-xl font-bold"
  }, "Cancel")))));
}
function TeacherProfileView({
  teacher,
  onClose,
  currentUser
}) {
  const [observations, setObservations] = useState([]);
  const [feedbackData, setFeedbackData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedObservation, setSelectedObservation] = useState(null);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const obsSnap = await db.collection('classroomObservations').where('teacherId', '==', teacher.afid || teacher.docId).orderBy('submittedAt', 'desc').get();
        const obsData = obsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          submittedAt: doc.data().submittedAt?.toDate() || new Date(doc.data().submittedAtISO)
        }));
        setObservations(obsData);
        const teacherAfid = teacher.afid || teacher.docId || teacher.id;
        let fbData = [];
        try {
          if (teacherAfid) {
            const afidSnap = await db.collection('teacherFeedback').where('teacherAfid', '==', teacherAfid).get();
            fbData = afidSnap.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                submittedAt: data.submittedAt?.toDate ? data.submittedAt.toDate() : new Date(data.submittedAt || data.completedAt)
              };
            });
          }
          if (fbData.length === 0 && teacherAfid) {
            const idSnap = await db.collection('teacherFeedback').where('teacherId', '==', teacherAfid).get();
            fbData = idSnap.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                submittedAt: data.submittedAt?.toDate ? data.submittedAt.toDate() : new Date(data.submittedAt || data.completedAt)
              };
            });
          }
          if (fbData.length === 0 && teacher.docId && teacher.docId !== teacherAfid) {
            const docIdSnap = await db.collection('teacherFeedback').where('teacherDocId', '==', teacher.docId).get();
            fbData = docIdSnap.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                submittedAt: data.submittedAt?.toDate ? data.submittedAt.toDate() : new Date(data.submittedAt || data.completedAt)
              };
            });
          }
        } catch (queryError) {
          console.log('Feedback query error, trying alternate method:', queryError.message);
          try {
            const schoolSnap = await db.collection('teacherFeedback').where('school', '==', teacher.school).get();
            const teacherIdentifiers = [teacher.afid, teacher.docId, teacher.id].filter(Boolean).map(id => String(id).toLowerCase());
            fbData = schoolSnap.docs.filter(doc => {
              const data = doc.data();
              const feedbackTeacherId = String(data.teacherId || data.teacherAfid || data.teacherDocId || '').toLowerCase();
              return teacherIdentifiers.includes(feedbackTeacherId);
            }).map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                ...data,
                submittedAt: data.submittedAt?.toDate ? data.submittedAt.toDate() : new Date(data.submittedAt || data.completedAt)
              };
            });
          } catch (fallbackError) {
            console.error('Fallback query also failed:', fallbackError);
          }
        }
        console.log('Found feedback for teacher:', teacher.name, ':', fbData.length, 'responses');
        setFeedbackData(fbData);
      } catch (error) {
        console.error('Error fetching teacher profile data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [teacher]);
  const availableMonths = useMemo(() => {
    const months = new Set();
    observations.forEach(obs => {
      const date = new Date(obs.observationDate || obs.submittedAt);
      months.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(months).sort().reverse();
  }, [observations]);
  const filteredObservations = useMemo(() => {
    if (selectedMonth === 'All') return observations;
    return observations.filter(obs => {
      const date = new Date(obs.observationDate || obs.submittedAt);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      return month === selectedMonth;
    });
  }, [observations, selectedMonth]);
  const feedbackAverages = useMemo(() => {
    if (feedbackData.length === 0) return null;
    const questionAverages = {};
    const questionLabels = {
      q1: 'Punctuality',
      q2: 'Academic Level',
      q3: 'Problem Solving',
      q4: 'Explanation Clarity',
      q5: 'Handwriting & Voice',
      q6: 'Time Management',
      q7: 'Guidance & Motivation',
      q8: 'Student Participation',
      q9: 'Equal Attention'
    };
    Object.keys(questionLabels).forEach(qId => {
      const ratings = feedbackData.map(fb => fb.responses?.[qId]?.rating).filter(r => r !== undefined && r !== null).map(r => Math.min(r, 5));
      if (ratings.length > 0) {
        questionAverages[qId] = {
          label: questionLabels[qId],
          average: (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1),
          count: ratings.length
        };
      }
    });
    return questionAverages;
  }, [feedbackData]);
  const overallRating = useMemo(() => {
    if (!feedbackAverages) return null;
    const values = Object.values(feedbackAverages).map(v => parseFloat(v.average));
    if (values.length === 0) return null;
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  }, [feedbackAverages]);
  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    if (chartRef.current && observations.length > 0) {
      const ctx = chartRef.current.getContext('2d');
      const monthlyData = {};
      observations.forEach(obs => {
        const date = new Date(obs.observationDate || obs.submittedAt);
        const month = date.toLocaleDateString('en-IN', {
          month: 'short',
          year: '2-digit'
        });
        if (!monthlyData[month]) {
          monthlyData[month] = [];
        }
        monthlyData[month].push(obs.percentageScore);
      });
      const labels = Object.keys(monthlyData);
      const avgScores = labels.map(month => {
        const scores = monthlyData[month];
        return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
      });
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Observation Score %',
            data: avgScores,
            borderColor: '#F4B41A',
            backgroundColor: 'rgba(244, 180, 26, 0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#F4B41A',
            pointRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Observation Score Trend',
              font: {
                size: 16,
                weight: 'bold'
              }
            },
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: {
                display: true,
                text: 'Score %'
              }
            }
          }
        }
      });
    }
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [observations]);
  const generatePDF = async observation => {
    const printWindow = window.open('', '_blank');
    const parameterRows = CLASSROOM_OBSERVATION_PARAMETERS.map(param => {
      const score = observation.responses?.[param.id] ?? 'N/A';
      const remark = observation.remarks?.[param.id] || '';
      const isFlagged = score !== param.maxScore;
      return `
        <tr style="border-bottom: 1px solid #eee; ${isFlagged ? 'background-color: #FEE2E2;' : ''}">
          <td style="padding: 8px; font-size: 12px;">${param.type === 'major' ? '⭐' : '📌'} ${param.text}</td>
          <td style="padding: 8px; text-align: center; font-weight: bold; ${isFlagged ? 'color: #DC2626;' : 'color: #059669;'}">${score}/${param.maxScore}</td>
          <td style="padding: 8px; font-size: 11px; color: #666;">${remark}</td>
        </tr>
      `;
    }).join('');
    const mediaSection = observation.mediaLinks?.length > 0 ? `
      <div style="margin-top: 20px;">
        <h3 style="color: #1F2937; border-bottom: 2px solid #F4B41A; padding-bottom: 5px;">📸 Media Links</h3>
        <ul style="font-size: 12px;">
          ${observation.mediaLinks.map((link, i) => `<li><a href="${link}" target="_blank">Media ${i + 1}</a></li>`).join('')}
        </ul>
      </div>
    ` : '';
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Classroom Observation - ${observation.teacherName}</title>
        <style>
          @media print {
            @page { margin: 1cm; size: A4; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #F4B41A; padding-bottom: 15px; margin-bottom: 20px; }
          .logo { font-size: 24px; font-weight: bold; color: #F4B41A; }
          .score-box { background: linear-gradient(135deg, #F4B41A, #E8B039); color: white; padding: 15px 25px; border-radius: 10px; text-align: center; }
          .score-box .score { font-size: 32px; font-weight: bold; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
          .info-item { padding: 10px; background: #F9FAFB; border-radius: 8px; }
          .info-item label { font-size: 11px; color: #6B7280; text-transform: uppercase; }
          .info-item span { display: block; font-weight: bold; color: #1F2937; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #F4B41A; color: white; padding: 10px; text-align: left; }
          .flagged { background: #FEF2F2; }
          .footer { position: fixed; bottom: 0; left: 0; right: 0; padding: 10px 20px; font-size: 10px; border-top: 1px solid #ddd; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">अवंती Avanti Fellows</div>
            <h1 style="margin: 10px 0 5px; font-size: 20px;">Classroom Observation Report</h1>
            <p style="margin: 0; color: #666;">Teacher: ${observation.teacherName} | ${observation.teacherSubject}</p>
          </div>
          <div class="score-box">
            <div class="score">${observation.totalScore}/${observation.maxScore}</div>
            <div style="font-size: 14px;">${observation.percentageScore}%</div>
            <div style="font-size: 12px; margin-top: 5px;">${observation.flaggedCount} flagged</div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-item">
            <label>School</label>
            <span>${observation.school}</span>
          </div>
          <div class="info-item">
            <label>Grade</label>
            <span>Class ${observation.grade}</span>
          </div>
          <div class="info-item">
            <label>Observation Date</label>
            <span>${new Date(observation.observationDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })} ${observation.observationTime}</span>
          </div>
          <div class="info-item">
            <label>Observer</label>
            <span>${observation.observerName} (${observation.observerPosition})</span>
          </div>
        </div>

        <h3 style="color: #1F2937; border-bottom: 2px solid #F4B41A; padding-bottom: 5px;">Observation Parameters</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 60%;">Parameter</th>
              <th style="width: 15%;">Score</th>
              <th style="width: 25%;">Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${parameterRows}
          </tbody>
        </table>

        ${observation.strengths ? `
          <div style="margin-top: 20px; background: #ECFDF5; padding: 15px; border-radius: 8px;">
            <h4 style="color: #059669; margin: 0 0 10px;">✅ Strengths Observed</h4>
            <p style="margin: 0; font-size: 13px; white-space: pre-line;">${observation.strengths}</p>
          </div>
        ` : ''}

        ${observation.improvements ? `
          <div style="margin-top: 15px; background: #FEF3C7; padding: 15px; border-radius: 8px;">
            <h4 style="color: #D97706; margin: 0 0 10px;">💡 Points of Improvement</h4>
            <p style="margin: 0; font-size: 13px; white-space: pre-line;">${observation.improvements}</p>
          </div>
        ` : ''}

        ${mediaSection}

        <div class="footer">
          <span>Private & Confidential</span>
          <span>Page 1</span>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };
  if (loading) {
    return React.createElement("div", {
      className: "modal-overlay",
      onClick: onClose
    }, React.createElement("div", {
      className: "modal-content",
      onClick: e => e.stopPropagation()
    }, React.createElement("div", {
      className: "p-12 text-center"
    }, React.createElement("div", {
      className: "text-4xl mb-4"
    }, "\u23F3"), React.createElement("p", null, "Loading teacher profile..."))));
  }
  return React.createElement("div", {
    className: "modal-overlay",
    onClick: onClose
  }, React.createElement("div", {
    className: "modal-content max-w-5xl max-h-[95vh] overflow-y-auto",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "p-6"
  }, React.createElement("div", {
    className: "flex justify-between items-start mb-6"
  }, React.createElement("div", null, React.createElement("h2", {
    className: "text-2xl font-bold"
  }, "\uD83D\uDC64 Teacher Profile"), React.createElement("p", {
    className: "text-xl text-gray-700 mt-1"
  }, teacher.name), React.createElement("p", {
    className: "text-gray-500"
  }, teacher.subject, " | ", teacher.school), React.createElement("div", {
    className: "flex gap-3 mt-2"
  }, React.createElement("span", {
    className: "px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-mono"
  }, "AFID: ", teacher.afid), teacher.afCode && React.createElement("span", {
    className: "px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-mono"
  }, "AF Code: ", teacher.afCode))), React.createElement("button", {
    onClick: onClose,
    className: "text-3xl font-bold text-gray-400 hover:text-gray-600"
  }, "\xD7")), React.createElement("div", {
    className: "grid md:grid-cols-3 gap-4 mb-6"
  }, React.createElement("div", {
    className: "bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 rounded-xl"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Total Observations"), React.createElement("div", {
    className: "text-3xl font-bold"
  }, observations.length)), React.createElement("div", {
    className: "bg-gradient-to-r from-green-400 to-green-600 text-white p-4 rounded-xl"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Avg Observation Score"), React.createElement("div", {
    className: "text-3xl font-bold"
  }, observations.length > 0 ? (observations.reduce((sum, o) => sum + o.percentageScore, 0) / observations.length).toFixed(1) + '%' : 'N/A')), React.createElement("div", {
    className: "bg-gradient-to-r from-blue-400 to-blue-600 text-white p-4 rounded-xl"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Student Feedback Rating"), React.createElement("div", {
    className: "text-3xl font-bold"
  }, overallRating || 'N/A', "/5"), React.createElement("div", {
    className: "text-xs opacity-75"
  }, feedbackData.length, " responses"))), observations.length > 0 && React.createElement("div", {
    className: "bg-white p-4 rounded-xl shadow mb-6"
  }, React.createElement("div", {
    style: {
      height: '250px'
    }
  }, React.createElement("canvas", {
    ref: chartRef
  }))), React.createElement("div", {
    className: "bg-white p-6 rounded-xl shadow mb-6"
  }, React.createElement("div", {
    className: "flex justify-between items-center mb-4"
  }, React.createElement("h3", {
    className: "text-xl font-bold"
  }, "\uD83D\uDCCB Classroom Observations"), React.createElement("select", {
    value: selectedMonth,
    onChange: e => setSelectedMonth(e.target.value),
    className: "border-2 px-4 py-2 rounded-xl"
  }, React.createElement("option", {
    value: "All"
  }, "All Months"), availableMonths.map(month => React.createElement("option", {
    key: month,
    value: month
  }, new Date(month + '-01').toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric'
  }))))), filteredObservations.length === 0 ? React.createElement("div", {
    className: "text-center py-8 text-gray-500"
  }, React.createElement("div", {
    className: "text-4xl mb-2"
  }, "\uD83D\uDCCB"), React.createElement("p", null, "No classroom observations recorded yet")) : React.createElement("div", {
    className: "space-y-3"
  }, filteredObservations.map(obs => React.createElement("div", {
    key: obs.id,
    className: "border-2 rounded-xl p-4 hover:border-yellow-400 cursor-pointer transition",
    onClick: () => setSelectedObservation(obs)
  }, React.createElement("div", {
    className: "flex justify-between items-center"
  }, React.createElement("div", null, React.createElement("div", {
    className: "font-bold"
  }, new Date(obs.observationDate || obs.submittedAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }), React.createElement("span", {
    className: "text-gray-500 font-normal ml-2"
  }, "Class ", obs.grade)), React.createElement("div", {
    className: "text-sm text-gray-500"
  }, "Observer: ", obs.observerName)), React.createElement("div", {
    className: "text-right"
  }, React.createElement("div", {
    className: `text-2xl font-bold ${obs.percentageScore >= 80 ? 'text-green-600' : obs.percentageScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`
  }, obs.percentageScore, "%"), React.createElement("div", {
    className: "text-sm text-gray-500"
  }, obs.totalScore, "/", obs.maxScore))))))), React.createElement("div", {
    className: "bg-white p-6 rounded-xl shadow"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "\uD83D\uDCAC Student Feedback Summary"), !feedbackAverages ? React.createElement("div", {
    className: "text-center py-8 text-gray-500"
  }, React.createElement("div", {
    className: "text-4xl mb-2"
  }, "\uD83D\uDCAC"), React.createElement("p", null, "No student feedback received yet")) : React.createElement("div", {
    className: "grid md:grid-cols-3 gap-4"
  }, Object.entries(feedbackAverages).map(([qId, data]) => React.createElement("div", {
    key: qId,
    className: "bg-gray-50 p-3 rounded-lg"
  }, React.createElement("div", {
    className: "text-sm text-gray-600 mb-1"
  }, data.label), React.createElement("div", {
    className: "flex items-center justify-between"
  }, React.createElement("span", {
    className: `text-xl font-bold ${parseFloat(data.average) >= 4 ? 'text-green-600' : parseFloat(data.average) >= 3 ? 'text-yellow-600' : 'text-red-600'}`
  }, data.average, "/5"), React.createElement("span", {
    className: "text-xs text-gray-400"
  }, "(", data.count, " ratings)")))))))), selectedObservation && React.createElement("div", {
    className: "modal-overlay",
    style: {
      zIndex: 1001
    },
    onClick: () => setSelectedObservation(null)
  }, React.createElement("div", {
    className: "modal-content max-w-3xl max-h-[90vh] overflow-y-auto",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "p-6"
  }, React.createElement("div", {
    className: "flex justify-between items-start mb-4"
  }, React.createElement("div", null, React.createElement("h3", {
    className: "text-xl font-bold"
  }, "Observation Details"), React.createElement("p", {
    className: "text-gray-500"
  }, new Date(selectedObservation.observationDate).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }))), React.createElement("div", {
    className: "flex gap-2"
  }, React.createElement("button", {
    onClick: () => generatePDF(selectedObservation),
    className: "px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold"
  }, "\uD83D\uDCC4 Download PDF"), React.createElement("button", {
    onClick: () => setSelectedObservation(null),
    className: "text-2xl font-bold text-gray-400"
  }, "\xD7"))), React.createElement("div", {
    className: `p-4 rounded-xl mb-4 ${selectedObservation.percentageScore >= 80 ? 'bg-green-100' : selectedObservation.percentageScore >= 60 ? 'bg-yellow-100' : 'bg-red-100'}`
  }, React.createElement("div", {
    className: "text-center"
  }, React.createElement("div", {
    className: "text-3xl font-bold"
  }, selectedObservation.totalScore, "/", selectedObservation.maxScore), React.createElement("div", {
    className: "text-xl"
  }, selectedObservation.percentageScore, "%"), React.createElement("div", {
    className: "text-sm text-gray-600"
  }, selectedObservation.flaggedCount, " items flagged"))), React.createElement("div", {
    className: "space-y-2 mb-4"
  }, CLASSROOM_OBSERVATION_PARAMETERS.map(param => {
    const score = selectedObservation.responses?.[param.id];
    const remark = selectedObservation.remarks?.[param.id];
    const isFlagged = score !== undefined && score < param.maxScore;
    return React.createElement("div", {
      key: param.id,
      className: `p-3 rounded-lg ${isFlagged ? 'bg-red-50' : 'bg-green-50'}`
    }, React.createElement("div", {
      className: "flex justify-between items-start"
    }, React.createElement("div", {
      className: "flex-1 text-sm"
    }, param.text), React.createElement("div", {
      className: `font-bold ml-2 ${isFlagged ? 'text-red-600' : 'text-green-600'}`
    }, score ?? 'N/A', "/", param.maxScore)), remark && React.createElement("div", {
      className: "text-xs text-red-600 mt-1"
    }, "\uD83D\uDCDD ", remark));
  })), selectedObservation.strengths && React.createElement("div", {
    className: "bg-green-50 p-4 rounded-xl mb-3"
  }, React.createElement("h4", {
    className: "font-bold text-green-700 mb-2"
  }, "\u2705 Strengths"), React.createElement("p", {
    className: "text-sm", style: { whiteSpace: "pre-line" }
  }, selectedObservation.strengths)), selectedObservation.improvements && React.createElement("div", {
    className: "bg-yellow-50 p-4 rounded-xl mb-3"
  }, React.createElement("h4", {
    className: "font-bold text-yellow-700 mb-2"
  }, "\uD83D\uDCA1 Improvements"), React.createElement("p", {
    className: "text-sm", style: { whiteSpace: "pre-line" }
  }, selectedObservation.improvements)), React.createElement("div", {
    className: "text-sm text-gray-500 mt-4"
  }, "Observer: ", selectedObservation.observerName, " (", selectedObservation.observerPosition, ") | Submitted: ", new Date(selectedObservation.submittedAt).toLocaleString('en-IN'))))));
}
function StarRating({
  value,
  onChange,
  readonly = false
}) {
  const [hoverValue, setHoverValue] = useState(0);
  return React.createElement("div", {
    className: "star-rating"
  }, [1, 2, 3, 4, 5].map(star => React.createElement("span", {
    key: star,
    className: `star ${(hoverValue || value) >= star ? 'filled' : ''}`,
    onClick: () => !readonly && onChange(star),
    onMouseEnter: () => !readonly && setHoverValue(star),
    onMouseLeave: () => !readonly && setHoverValue(0)
  }, "\u2605")));
}
function TeacherProfileModal({
  teacher,
  onClose,
  onGiveFeedback,
  averageRating
}) {
  return React.createElement("div", {
    className: "modal-overlay",
    onClick: onClose
  }, React.createElement("div", {
    className: "modal-content max-w-md",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "p-6"
  }, React.createElement("div", {
    className: "flex justify-between items-start mb-4"
  }, React.createElement("div", {
    className: "flex items-center gap-4"
  }, teacher.profilePhoto ? React.createElement("img", {
    src: teacher.profilePhoto,
    alt: teacher.name,
    className: "w-16 h-16 rounded-full object-cover border-2 border-yellow-400"
  }) : React.createElement("div", {
    className: "w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-2xl font-bold text-white"
  }, teacher.name?.charAt(0) || '?'), React.createElement("div", null, React.createElement("h2", {
    className: "text-xl font-bold"
  }, teacher.name), React.createElement("p", {
    className: "text-gray-600"
  }, teacher.subject))), React.createElement("button", {
    onClick: onClose,
    className: "text-2xl font-bold text-gray-500 hover:text-gray-700"
  }, "\xD7")), React.createElement("div", {
    className: "space-y-3"
  }, React.createElement("div", {
    className: "bg-gray-50 p-3 rounded-lg"
  }, React.createElement("div", {
    className: "text-sm text-gray-500"
  }, "Education Qualification"), React.createElement("div", {
    className: "font-semibold"
  }, teacher.qualification || 'Not specified')), React.createElement("div", {
    className: "bg-gray-50 p-3 rounded-lg"
  }, React.createElement("div", {
    className: "text-sm text-gray-500"
  }, "Experience"), React.createElement("div", {
    className: "font-semibold"
  }, teacher.experience || 'Not specified')), teacher.phone && React.createElement("div", {
    className: "bg-gray-50 p-3 rounded-lg"
  }, React.createElement("div", {
    className: "text-sm text-gray-500"
  }, "Phone"), React.createElement("a", {
    href: `tel:${teacher.phone}`,
    className: "font-semibold text-blue-600 hover:underline"
  }, "\uD83D\uDCF1 ", teacher.phone)), teacher.whatsapp && React.createElement("div", {
    className: "bg-gray-50 p-3 rounded-lg"
  }, React.createElement("div", {
    className: "text-sm text-gray-500"
  }, "WhatsApp"), React.createElement("a", {
    href: `https://wa.me/${teacher.whatsapp.replace(/[^0-9]/g, '')}`,
    target: "_blank",
    rel: "noopener noreferrer",
    className: "font-semibold text-green-600 hover:underline"
  }, "\uD83D\uDCAC ", teacher.whatsapp)), teacher.driveLink && React.createElement("div", {
    className: "bg-blue-50 p-3 rounded-lg border border-blue-200"
  }, React.createElement("div", {
    className: "text-sm text-gray-500"
  }, "\uD83D\uDCC1 Google Drive Folder"), React.createElement("a", {
    href: teacher.driveLink,
    target: "_blank",
    rel: "noopener noreferrer",
    className: "font-semibold text-blue-600 hover:underline"
  }, "\uD83D\uDCC2 Open Teaching Resources \u2192")), teacher.bio && React.createElement("div", {
    className: "bg-gray-50 p-3 rounded-lg"
  }, React.createElement("div", {
    className: "text-sm text-gray-500"
  }, "About"), React.createElement("div", {
    className: "font-semibold text-sm"
  }, teacher.bio)), React.createElement("div", {
    className: "bg-yellow-50 p-3 rounded-lg border border-yellow-200"
  }, React.createElement("div", {
    className: "text-sm text-gray-500 mb-1"
  }, "Average Rating"), React.createElement("div", {
    className: "flex items-center gap-3"
  }, React.createElement("span", {
    className: "text-2xl font-bold text-yellow-500"
  }, averageRating ? averageRating.toFixed(1) : 'N/A'), React.createElement("span", {
    className: "text-gray-600"
  }, "/ 5"), averageRating && React.createElement("span", {
    className: `px-2 py-1 rounded-full text-xs font-bold ${averageRating >= 4.5 ? 'bg-green-100 text-green-700' : averageRating >= 3.5 ? 'bg-blue-100 text-blue-700' : averageRating >= 2.5 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`
  }, averageRating >= 4.5 ? '⭐ Excellent' : averageRating >= 3.5 ? '👍 Good' : averageRating >= 2.5 ? '😐 Average' : '👎 Needs Improvement'))), React.createElement("button", {
    onClick: onGiveFeedback,
    className: "w-full avanti-gradient text-white py-3 rounded-xl font-bold text-lg hover:opacity-90"
  }, "\uD83D\uDCDD Give Feedback")))));
}
function MonthlyFeedbackTrendGraph({
  feedbackData = []
}) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const monthlyData = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
        label: date.toLocaleDateString('en-IN', {
          month: 'short',
          year: '2-digit'
        }),
        totalRating: 0,
        count: 0,
        avgRating: 0
      });
    }
    feedbackData.forEach(fb => {
      if (fb.submittedAt) {
        const date = fb.submittedAt instanceof Date ? fb.submittedAt : new Date(fb.submittedAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthData = months.find(m => m.key === monthKey);
        if (monthData) {
          const rating = fb.rating || fb.averageRating || 0;
          if (rating > 0) {
            monthData.totalRating += rating;
            monthData.count++;
          }
        }
      }
    });
    months.forEach(month => {
      if (month.count > 0) {
        month.avgRating = (month.totalRating / month.count).toFixed(1);
      }
    });
    return months;
  }, [feedbackData]);
  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    if (chartRef.current && monthlyData.length > 0) {
      const ctx = chartRef.current.getContext('2d');
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: monthlyData.map(m => m.label),
          datasets: [{
            label: 'Avg Rating (out of 5)',
            data: monthlyData.map(m => m.avgRating > 0 ? parseFloat(m.avgRating) : null),
            borderColor: '#8B5CF6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#8B5CF6',
            pointRadius: 6,
            pointHoverRadius: 8,
            spanGaps: true,
            borderWidth: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            title: {
              display: true,
              text: '📈 Monthly Average Feedback Rating',
              font: {
                size: 16,
                weight: 'bold'
              },
              padding: {
                bottom: 20
              }
            },
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleFont: {
                size: 14
              },
              bodyFont: {
                size: 13
              },
              padding: 12,
              callbacks: {
                label: function (context) {
                  const monthData = monthlyData[context.dataIndex];
                  return [`Average Rating: ${context.raw}/5`, `Total Responses: ${monthData.count}`];
                }
              }
            },
            datalabels: {
              display: true,
              anchor: 'end',
              align: 'top',
              color: '#8B5CF6',
              font: {
                weight: 'bold',
                size: 12
              },
              formatter: function (value) {
                return value ? value : '';
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 5,
              title: {
                display: true,
                text: 'Average Rating',
                font: {
                  weight: 'bold'
                }
              },
              ticks: {
                stepSize: 1
              }
            },
            x: {
              title: {
                display: true,
                text: 'Month',
                font: {
                  weight: 'bold'
                }
              }
            }
          }
        },
        plugins: typeof ChartDataLabels !== 'undefined' ? [ChartDataLabels] : []
      });
    }
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [monthlyData]);
  const totalResponses = monthlyData.reduce((sum, m) => sum + m.count, 0);
  const monthsWithData = monthlyData.filter(m => m.count > 0);
  const overallAvg = monthsWithData.length > 0 ? (monthsWithData.reduce((sum, m) => sum + parseFloat(m.avgRating), 0) / monthsWithData.length).toFixed(1) : 'N/A';
  if (feedbackData.length === 0) {
    return null;
  }
  return React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("div", {
    style: {
      height: '280px'
    }
  }, React.createElement("canvas", {
    ref: chartRef
  })), React.createElement("div", {
    className: "grid grid-cols-3 gap-4 mt-4 pt-4 border-t"
  }, React.createElement("div", {
    className: "text-center"
  }, React.createElement("div", {
    className: "text-2xl font-bold text-purple-600"
  }, overallAvg), React.createElement("div", {
    className: "text-xs text-gray-600"
  }, "6-Month Avg Rating")), React.createElement("div", {
    className: "text-center"
  }, React.createElement("div", {
    className: "text-2xl font-bold text-blue-600"
  }, totalResponses), React.createElement("div", {
    className: "text-xs text-gray-600"
  }, "Total Responses")), React.createElement("div", {
    className: "text-center"
  }, React.createElement("div", {
    className: "text-2xl font-bold text-green-600"
  }, monthlyData[monthlyData.length - 1]?.count || 0), React.createElement("div", {
    className: "text-xs text-gray-600"
  }, "This Month"))));
}
function TeacherFeedbackForm({
  teacher,
  studentId,
  studentInfo,
  onClose,
  onSubmitSuccess
}) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [feedback, setFeedback] = useState({
    teacherId: teacher.afid || teacher.docId,
    teacherDocId: teacher.docId,
    teacherAfid: teacher.afid,
    teacherName: teacher.name,
    subject: teacher.subject,
    school: teacher.school,
    grade: studentInfo?.grade || '',
    studentId: studentId,
    studentName: studentInfo?.name || '',
    submittedAt: new Date().toISOString(),
    responses: {}
  });
  const [showExplanation, setShowExplanation] = useState(false);
  const questions = [{
    id: 'q1',
    text: 'Does the teacher start and end the class on time?',
    type: 'mcq',
    options: [{
      value: 'a',
      text: 'The teacher is always on time and ends the class on time.',
      rating: 5
    }, {
      value: 'b',
      text: 'The teacher is sometimes late or does not end the class on time.',
      rating: 3
    }, {
      value: 'c',
      text: 'The teacher is mostly late / early and ends class early / late.',
      rating: 1
    }, {
      value: 'other',
      text: 'Other (please specify)',
      rating: null
    }]
  }, {
    id: 'q2',
    text: 'What is the academic / content level of the teacher?',
    type: 'mcq',
    options: [{
      value: 'a',
      text: 'The teacher can teach concepts up to the JEE Advanced curriculum.',
      rating: 5
    }, {
      value: 'b',
      text: 'The teacher can teach concepts up to the JEE Mains/NEET curriculum.',
      rating: 3
    }, {
      value: 'c',
      text: 'The teacher can teach concepts up to the CBSE curriculum.',
      rating: 1
    }, {
      value: 'other',
      text: 'Other (please specify)',
      rating: null
    }]
  }, {
    id: 'q3',
    text: 'How effectively does the teacher solve problems and clear doubts in class?',
    type: 'mcq',
    options: [{
      value: 'a',
      text: 'The teacher regularly solves mock tests/PYQs in class and clears all doubts.',
      rating: 5
    }, {
      value: 'b',
      text: 'The teacher sometimes solves questions and clears some doubts.',
      rating: 3
    }, {
      value: 'c',
      text: 'The teacher rarely solves questions or clears doubts.',
      rating: 1
    }, {
      value: 'other',
      text: 'Other (please specify)',
      rating: null
    }]
  }, {
    id: 'q4',
    text: 'How clear and easy is the teacher\'s explanation and use of language during class?',
    type: 'mcq',
    options: [{
      value: 'a',
      text: 'The teacher speaks clearly and explains concepts in an easy-to-understand way.',
      rating: 5
    }, {
      value: 'b',
      text: 'The teacher is clear sometimes and a bit confusing.',
      rating: 3
    }, {
      value: 'c',
      text: 'It\'s hard to understand the teacher\'s language or explanation.',
      rating: 1
    }, {
      value: 'other',
      text: 'Other (please specify)',
      rating: null
    }]
  }, {
    id: 'q5',
    text: 'Is the teacher\'s handwriting clear and voice clearly audible during the session?',
    type: 'mcq',
    options: [{
      value: 'a',
      text: 'The teacher\'s writing is always clear and voice is always audible.',
      rating: 5
    }, {
      value: 'b',
      text: 'The writing or voice is unclear sometimes.',
      rating: 3
    }, {
      value: 'c',
      text: 'It\'s hard to read the writing and hear the teacher properly.',
      rating: 1
    }, {
      value: 'other',
      text: 'Other (please specify)',
      rating: null
    }]
  }, {
    id: 'q6',
    text: 'Does the teacher manage time well and teach at an appropriate speed?',
    type: 'mcq',
    options: [{
      value: 'a',
      text: 'The teacher finishes the topic on time and teaches at a good pace.',
      rating: 5
    }, {
      value: 'b',
      text: 'The speed varies to a small extent.',
      rating: 3
    }, {
      value: 'c',
      text: 'The speed is too fast or too slow, so it\'s hard to understand.',
      rating: 1
    }, {
      value: 'other',
      text: 'Other (please specify)',
      rating: null
    }]
  }, {
    id: 'q7',
    text: 'Does the teacher provide guidance and motivation related to exams and careers?',
    type: 'mcq',
    options: [{
      value: 'a',
      text: 'The teacher gives useful exam/career guidance and motivates the class often.',
      rating: 5
    }, {
      value: 'b',
      text: 'The teacher sometimes gives guidance and motivation.',
      rating: 3
    }, {
      value: 'c',
      text: 'The teacher doesn\'t guide the class and demotivates the students.',
      rating: 1
    }, {
      value: 'other',
      text: 'Other (please specify)',
      rating: null
    }]
  }, {
    id: 'q8',
    text: 'How well does the teacher encourage students to participate and ask questions in class?',
    type: 'mcq',
    options: [{
      value: 'a',
      text: 'The teacher always encourages us to ask questions and take part in class.',
      rating: 5
    }, {
      value: 'b',
      text: 'The teacher sometimes asks us to participate or share doubts.',
      rating: 3
    }, {
      value: 'c',
      text: 'The teacher doesn\'t ask us to participate or think deeply.',
      rating: 1
    }, {
      value: 'other',
      text: 'Other (please specify)',
      rating: null
    }]
  }, {
    id: 'q9',
    text: 'Does the teacher give equal attention to all students?',
    type: 'mcq',
    options: [{
      value: 'a',
      text: 'The teacher gives equal attention to everyone in class.',
      rating: 5
    }, {
      value: 'b',
      text: 'The teacher gives attention to some students more than others.',
      rating: 3
    }, {
      value: 'c',
      text: 'The teacher is often biased and does not give equal attention to everyone.',
      rating: 1
    }, {
      value: 'other',
      text: 'Other (please specify)',
      rating: null
    }]
  }, {
    id: 'q10',
    text: `What did you like most about the class or ${teacher.name}?`,
    type: 'opentext'
  }, {
    id: 'q11',
    text: `What can be improved about the class or ${teacher.name}?`,
    type: 'opentext'
  }];
  const currentQ = questions[currentQuestion];
  const handleRatingChange = value => {
    setFeedback({
      ...feedback,
      responses: {
        ...feedback.responses,
        [currentQ.id]: {
          rating: value
        }
      }
    });
    setShowExplanation(value < 3);
  };
  const handleMCQChange = option => {
    const newResponse = {
      selectedOption: option.value,
      selectedText: option.text,
      rating: option.rating
    };
    setFeedback({
      ...feedback,
      responses: {
        ...feedback.responses,
        [currentQ.id]: newResponse
      }
    });
    setShowExplanation(option.value === 'other');
  };
  const handleOtherTextChange = text => {
    setFeedback({
      ...feedback,
      responses: {
        ...feedback.responses,
        [currentQ.id]: {
          ...feedback.responses[currentQ.id],
          otherText: text
        }
      }
    });
  };
  const handleYesNoChange = value => {
    setFeedback({
      ...feedback,
      responses: {
        ...feedback.responses,
        [currentQ.id]: {
          answer: value
        }
      }
    });
    setShowExplanation(value === 'No');
  };
  const handleOpenTextChange = text => {
    setFeedback({
      ...feedback,
      responses: {
        ...feedback.responses,
        [currentQ.id]: {
          text: text
        }
      }
    });
  };
  const handleExplanationChange = text => {
    setFeedback({
      ...feedback,
      responses: {
        ...feedback.responses,
        [currentQ.id]: {
          ...feedback.responses[currentQ.id],
          explanation: text
        }
      }
    });
  };
  const canProceed = () => {
    const response = feedback.responses[currentQ.id];
    if (!response) return false;
    if (currentQ.type === 'mcq') {
      if (!response.selectedOption) return false;
      if (response.selectedOption === 'other' && (!response.otherText || response.otherText.trim() === '')) return false;
    } else if (currentQ.type === 'rating') {
      if (!response.rating) return false;
      if (response.rating < 3 && !response.explanation) return false;
    } else if (currentQ.type === 'yesno') {
      if (!response.answer) return false;
      if (response.answer === 'No' && !response.explanation) return false;
    } else if (currentQ.type === 'opentext') {
      if (!response.text || response.text.trim() === '') return false;
    }
    return true;
  };
  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      const nextQ = questions[currentQuestion + 1];
      const nextResponse = feedback.responses[nextQ.id];
      if (nextQ.type === 'mcq') {
        setShowExplanation(nextResponse?.selectedOption === 'other');
      } else if (nextQ.type === 'rating') {
        setShowExplanation(nextResponse?.rating < 3);
      } else if (nextQ.type === 'yesno') {
        setShowExplanation(nextResponse?.answer === 'No');
      } else if (nextQ.type === 'opentext') {
        setShowExplanation(false);
      }
    }
  };
  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      const prevQ = questions[currentQuestion - 1];
      const prevResponse = feedback.responses[prevQ.id];
      if (prevQ.type === 'mcq') {
        setShowExplanation(prevResponse?.selectedOption === 'other');
      } else if (prevQ.type === 'rating') {
        setShowExplanation(prevResponse?.rating < 3);
      } else if (prevQ.type === 'yesno') {
        setShowExplanation(prevResponse?.answer === 'No');
      } else if (prevQ.type === 'opentext') {
        setShowExplanation(false);
      }
    }
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async () => {
    if (isSubmitting) {
      console.log('Already submitting feedback, please wait...');
      return;
    }
    setIsSubmitting(true);
    try {
      let totalRating = 0;
      let ratingCount = 0;
      Object.values(feedback.responses).forEach(response => {
        if (response.rating !== null && response.rating !== undefined) {
          totalRating += response.rating;
          ratingCount++;
        }
      });
      const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;
      const today = new Date().toISOString().split('T')[0];
      const teacherId = teacher.afid || teacher.id || 'unknown';
      const uniqueDocId = `${studentId}_${teacherId}_${today}`;
      const feedbackData = {
        ...feedback,
        averageRating: averageRating,
        maxRating: 5,
        completedAt: new Date().toISOString(),
        submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
        uniqueId: uniqueDocId
      };
      await db.collection('teacherFeedback').doc(uniqueDocId).set(feedbackData, {
        merge: true
      });
      await db.collection('studentProfiles').doc(studentId).set({
        lastFeedbackDate: new Date().toISOString()
      }, {
        merge: true
      });
      alert('✅ Feedback submitted successfully! Thank you for your input.');
      onSubmitSuccess();
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('❌ Failed to submit feedback. Please check your internet and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  return React.createElement("div", {
    className: "feedback-modal",
    onClick: onClose
  }, React.createElement("div", {
    className: "feedback-content",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "p-6"
  }, React.createElement("div", {
    className: "flex justify-between items-start mb-4"
  }, React.createElement("div", null, React.createElement("h2", {
    className: "text-2xl font-bold"
  }, "Feedback for ", teacher.name), React.createElement("p", {
    className: "text-gray-600"
  }, teacher.subject)), React.createElement("button", {
    onClick: onClose,
    className: "text-2xl font-bold text-gray-500 hover:text-gray-700"
  }, "\xD7")), React.createElement("div", {
    className: "mb-6"
  }, React.createElement("div", {
    className: "flex justify-between items-center mb-2"
  }, React.createElement("span", {
    className: "text-sm font-semibold text-gray-600"
  }, "Question ", currentQuestion + 1, " of ", questions.length), React.createElement("span", {
    className: "text-sm text-gray-500"
  }, Math.round((currentQuestion + 1) / questions.length * 100), "% Complete")), React.createElement("div", {
    className: "w-full bg-gray-200 rounded-full h-2"
  }, React.createElement("div", {
    className: "avanti-gradient h-2 rounded-full transition-all duration-300",
    style: {
      width: `${(currentQuestion + 1) / questions.length * 100}%`
    }
  }))), React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("div", null, React.createElement("h3", {
    className: "text-lg font-semibold mb-4"
  }, currentQ.text), currentQ.type === 'rating' && React.createElement("div", {
    className: "flex flex-col items-center gap-4"
  }, React.createElement(StarRating, {
    value: feedback.responses[currentQ.id]?.rating || 0,
    onChange: handleRatingChange
  }), React.createElement("div", {
    className: "text-center text-sm text-gray-600"
  }, feedback.responses[currentQ.id]?.rating || 0, " / 5")), currentQ.type === 'mcq' && React.createElement("div", {
    className: "space-y-3"
  }, currentQ.options.map((option, idx) => React.createElement("button", {
    key: option.value,
    onClick: () => handleMCQChange(option),
    className: `w-full text-left p-4 rounded-xl border-2 transition-all ${feedback.responses[currentQ.id]?.selectedOption === option.value ? 'border-yellow-500 bg-yellow-50 shadow-md' : 'border-gray-200 bg-white hover:border-yellow-300 hover:bg-yellow-25'}`
  }, React.createElement("div", {
    className: "flex items-start gap-3"
  }, React.createElement("div", {
    className: `w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${feedback.responses[currentQ.id]?.selectedOption === option.value ? 'border-yellow-500 bg-yellow-500' : 'border-gray-300'}`
  }, feedback.responses[currentQ.id]?.selectedOption === option.value && React.createElement("span", {
    className: "text-white text-sm"
  }, "\u2713")), React.createElement("span", {
    className: `text-base ${feedback.responses[currentQ.id]?.selectedOption === option.value ? 'font-semibold text-gray-800' : 'text-gray-700'}`
  }, option.text)))), feedback.responses[currentQ.id]?.selectedOption === 'other' && React.createElement("div", {
    className: "mt-4"
  }, React.createElement("label", {
    className: "block text-sm font-semibold mb-2 text-gray-700"
  }, "Please specify:"), React.createElement("textarea", {
    value: feedback.responses[currentQ.id]?.otherText || '',
    onChange: e => handleOtherTextChange(e.target.value),
    className: "w-full border-2 px-4 py-3 rounded-xl min-h-[80px] focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200",
    placeholder: "Please describe your answer..."
  }))), currentQ.type === 'yesno' && React.createElement("div", {
    className: "flex gap-4 justify-center"
  }, React.createElement("button", {
    onClick: () => handleYesNoChange('Yes'),
    className: `px-8 py-3 rounded-xl font-bold text-lg ${feedback.responses[currentQ.id]?.answer === 'Yes' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`
  }, "\u2705 Yes"), React.createElement("button", {
    onClick: () => handleYesNoChange('No'),
    className: `px-8 py-3 rounded-xl font-bold text-lg ${feedback.responses[currentQ.id]?.answer === 'No' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'}`
  }, "\u274C No")), currentQ.type === 'opentext' && React.createElement("div", {
    className: "mt-2"
  }, React.createElement("textarea", {
    value: feedback.responses[currentQ.id]?.text || '',
    onChange: e => handleOpenTextChange(e.target.value),
    className: "w-full border-2 px-4 py-3 rounded-xl min-h-[120px] focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200",
    placeholder: "Please share your thoughts here..."
  }), React.createElement("p", {
    className: "text-sm text-gray-500 mt-2"
  }, "Your feedback helps us improve!")), showExplanation && currentQ.type !== 'mcq' && React.createElement("div", {
    className: "mt-4"
  }, React.createElement("label", {
    className: "block text-sm font-semibold mb-2 text-gray-700"
  }, currentQ.type === 'rating' ? 'Why do you feel it\'s low?' : 'Can you please explain why?'), React.createElement("textarea", {
    value: feedback.responses[currentQ.id]?.explanation || '',
    onChange: e => handleExplanationChange(e.target.value),
    className: "w-full border-2 px-4 py-3 rounded-xl min-h-[100px]",
    placeholder: "Please provide your explanation..."
  }))), React.createElement("div", {
    className: "flex justify-between gap-3"
  }, React.createElement("button", {
    onClick: handlePrevious,
    disabled: currentQuestion === 0,
    className: "px-6 py-3 bg-gray-300 text-gray-700 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
  }, "\u2190 Previous"), currentQuestion < questions.length - 1 ? React.createElement("button", {
    onClick: handleNext,
    disabled: !canProceed(),
    className: "px-6 py-3 avanti-gradient text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
  }, "Next \u2192") : React.createElement("button", {
    onClick: handleSubmit,
    disabled: !canProceed() || isSubmitting,
    className: "px-6 py-3 bg-green-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
  }, isSubmitting ? '⏳ Submitting...' : "\u2713 Submit Feedback"))))));
}
function FeedbackNotification({
  onClose,
  onGiveFeedback
}) {
  return React.createElement("div", {
    className: "feedback-notification"
  }, React.createElement("div", {
    className: "flex items-start gap-3"
  }, React.createElement("div", {
    className: "text-2xl"
  }, "\uD83D\uDCDD"), React.createElement("div", {
    className: "flex-1"
  }, React.createElement("div", {
    className: "font-bold text-lg mb-1"
  }, "Time for Teacher Feedback!"), React.createElement("p", {
    className: "text-sm mb-3"
  }, "It\\'s been 2 months since your last feedback. Please share your thoughts about your teachers."), React.createElement("div", {
    className: "flex gap-2"
  }, React.createElement("button", {
    onClick: onGiveFeedback,
    className: "px-4 py-2 bg-white text-gray-800 rounded-lg font-semibold text-sm hover:bg-gray-100"
  }, "Give Feedback Now"), React.createElement("button", {
    onClick: onClose,
    className: "px-4 py-2 bg-transparent border-2 border-white text-white rounded-lg font-semibold text-sm hover:bg-white hover:text-gray-800"
  }, "Remind Later"))), React.createElement("button", {
    onClick: onClose,
    className: "text-xl font-bold text-white hover:text-gray-200"
  }, "\xD7")));
}
const CATEGORIES = ['General', 'General EWS', 'OBC', 'SC', 'ST', 'PWD'];
const STREAMS = ['JEE', 'NEET'];
const OCCUPATIONS = ['Government Job', 'Private Job', 'Business', 'Farmer', 'Doctor', 'Engineer', 'Teacher', 'Self-Employed', 'Unemployed', 'Retired', 'Daily Wage Worker', 'Homemaker', 'Others'];
const EDUCATION_LEVELS = ['1st to 5th Standard', '6th to 10th Standard', '11th to 12th Standard', 'Graduation - B.A.', 'Graduation - B.Sc.', 'Graduation - B.Com', 'Post Graduation - M.A.', 'Post Graduation - M.Sc.', 'Post Graduation - M.Com', 'Engineering - B.Tech/B.E.', 'Ph.D', 'Diploma', 'ITI', 'Others'];
const INCOME_RANGES = ['Below ₹1 Lakh', '₹1 - ₹2.5 Lakh', '₹2.5 - ₹5 Lakh', '₹5 - ₹10 Lakh', '₹10 - ₹15 Lakh', '₹15 - ₹25 Lakh', 'Above ₹25 Lakh'];
const EXAMS_12TH = ['JEE Mains Session 1', 'JEE Mains Session 2', 'JEE Advanced', 'NEET UG', 'NDA', 'BITSAT', 'VITEEE', 'COMEDK', 'MHT CET', 'TS EAMCET', 'AP EAMCET', 'KCET', 'WBJEE'];
const EXAMS_11TH = ['JEE Mains', 'JEE Advanced', 'NEET UG', 'KVPY', 'NTSE', 'Olympiads', 'BITSAT', 'VITEEE'];
const INDIAN_STATES = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'];
const STATE_DISTRICTS = {
  'Andhra Pradesh': ['Anantapur', 'Chittoor', 'East Godavari', 'Guntur', 'Krishna', 'Kurnool', 'Prakasam', 'Srikakulam', 'Visakhapatnam', 'Vizianagaram', 'West Godavari', 'YSR Kadapa'],
  'Madhya Pradesh': ['Agar Malwa', 'Alirajpur', 'Anuppur', 'Ashoknagar', 'Balaghat', 'Barwani', 'Betul', 'Bhind', 'Bhopal', 'Burhanpur', 'Chhatarpur', 'Chhindwara', 'Damoh', 'Datia', 'Dewas', 'Dhar', 'Dindori', 'Guna', 'Gwalior', 'Harda', 'Hoshangabad', 'Indore', 'Jabalpur', 'Jhabua', 'Katni', 'Khandwa', 'Khargone', 'Mandla', 'Mandsaur', 'Morena', 'Narsinghpur', 'Neemuch', 'Panna', 'Raisen', 'Rajgarh', 'Ratlam', 'Rewa', 'Sagar', 'Satna', 'Sehore', 'Seoni', 'Shahdol', 'Shajapur', 'Sheopur', 'Shivpuri', 'Sidhi', 'Singrauli', 'Tikamgarh', 'Ujjain', 'Umaria', 'Vidisha'],
  'Maharashtra': ['Ahmednagar', 'Akola', 'Amravati', 'Aurangabad', 'Beed', 'Bhandara', 'Buldhana', 'Chandrapur', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli', 'Jalgaon', 'Jalna', 'Kolhapur', 'Latur', 'Mumbai City', 'Mumbai Suburban', 'Nagpur', 'Nanded', 'Nandurbar', 'Nashik', 'Osmanabad', 'Palghar', 'Parbhani', 'Pune', 'Raigad', 'Ratnagiri', 'Sangli', 'Satara', 'Sindhudurg', 'Solapur', 'Thane', 'Wardha', 'Washim', 'Yavatmal'],
  'Gujarat': ['Ahmedabad', 'Amreli', 'Anand', 'Aravalli', 'Banaskantha', 'Bharuch', 'Bhavnagar', 'Botad', 'Chhota Udaipur', 'Dahod', 'Dang', 'Devbhoomi Dwarka', 'Gandhinagar', 'Gir Somnath', 'Jamnagar', 'Junagadh', 'Kheda', 'Kutch', 'Mahisagar', 'Mehsana', 'Morbi', 'Narmada', 'Navsari', 'Panchmahal', 'Patan', 'Porbandar', 'Rajkot', 'Sabarkantha', 'Surat', 'Surendranagar', 'Tapi', 'Vadodara', 'Valsad'],
  'Rajasthan': ['Ajmer', 'Alwar', 'Banswara', 'Baran', 'Barmer', 'Bharatpur', 'Bhilwara', 'Bikaner', 'Bundi', 'Chittorgarh', 'Churu', 'Dausa', 'Dholpur', 'Dungarpur', 'Hanumangarh', 'Jaipur', 'Jaisalmer', 'Jalore', 'Jhalawar', 'Jhunjhunu', 'Jodhpur', 'Karauli', 'Kota', 'Nagaur', 'Pali', 'Pratapgarh', 'Rajsamand', 'Sawai Madhopur', 'Sikar', 'Sirohi', 'Sri Ganganagar', 'Tonk', 'Udaipur'],
  'Karnataka': ['Bagalkot', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban', 'Bidar', 'Chamarajanagar', 'Chikkaballapur', 'Chikkamagaluru', 'Chitradurga', 'Dakshina Kannada', 'Davanagere', 'Dharwad', 'Gadag', 'Hassan', 'Haveri', 'Kalaburagi', 'Kodagu', 'Kolar', 'Koppal', 'Mandya', 'Mysuru', 'Raichur', 'Ramanagara', 'Shivamogga', 'Tumakuru', 'Udupi', 'Uttara Kannada', 'Vijayapura', 'Yadgir'],
  'Odisha': ['Angul', 'Balangir', 'Balasore', 'Bargarh', 'Bhadrak', 'Boudh', 'Cuttack', 'Deogarh', 'Dhenkanal', 'Gajapati', 'Ganjam', 'Jagatsinghpur', 'Jajpur', 'Jharsuguda', 'Kalahandi', 'Kandhamal', 'Kendrapara', 'Kendujhar', 'Khordha', 'Koraput', 'Malkangiri', 'Mayurbhanj', 'Nabarangpur', 'Nayagarh', 'Nuapada', 'Puri', 'Rayagada', 'Sambalpur', 'Subarnapur', 'Sundargarh']
};
const AVANTI_LOGO = 'data:image/png;base64,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';
const exportToExcel = (data, filename) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Data");
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
const getBirthdays = (teachers, period = 'week') => {
  const now = new Date();
  return teachers.filter(t => {
    if (!t.dob) return false;
    const d = new Date(t.dob);
    const thisYear = new Date(now.getFullYear(), d.getMonth(), d.getDate());
    const diff = Math.ceil((thisYear - now) / (1000 * 60 * 60 * 24));
    if (period === 'today') {
      return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
    } else if (period === 'week') {
      return diff >= 0 && diff <= 7;
    } else if (period === 'month') {
      return d.getMonth() === now.getMonth();
    }
    return false;
  });
};
const getAnniversaries = (teachers, period = 'week') => {
  const now = new Date();
  return teachers.filter(t => {
    if (!t.joiningDate) return false;
    const j = new Date(t.joiningDate);
    if (j.getFullYear() >= now.getFullYear()) return false;
    const thisYear = new Date(now.getFullYear(), j.getMonth(), j.getDate());
    const diff = Math.ceil((thisYear - now) / (1000 * 60 * 60 * 24));
    if (period === 'today') {
      return j.getDate() === now.getDate() && j.getMonth() === now.getMonth();
    } else if (period === 'week') {
      return diff >= 0 && diff <= 7;
    } else if (period === 'month') {
      return j.getMonth() === now.getMonth();
    }
    return false;
  });
};
const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};
const getMonthYear = date => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
function MultiSelectDropdown({
  options,
  selected,
  onChange,
  label,
  placeholder,
  disabled = false,
  getOptionLabel = opt => opt,
  getOptionValue = opt => opt
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredOption, setHoveredOption] = useState(null);
  const dropdownRef = React.useRef(null);
  React.useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const handleToggleOption = optionValue => {
    if (selected.includes(optionValue)) {
      onChange(selected.filter(v => v !== optionValue));
    } else {
      onChange([...selected, optionValue]);
    }
  };
  const handleSelectAll = () => {
    if (selected.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map(opt => getOptionValue(opt)));
    }
  };
  const handleOnlyClick = (e, optionValue) => {
    e.stopPropagation();
    e.preventDefault();
    onChange([optionValue]);
  };
  const getDisplayText = () => {
    if (selected.length === 0) return placeholder || 'Select...';
    if (selected.length === options.length) return 'All Selected';
    if (selected.length === 1) {
      const selectedOption = options.find(opt => getOptionValue(opt) === selected[0]);
      return selectedOption ? getOptionLabel(selectedOption) : selected[0];
    }
    return `${selected.length} selected`;
  };
  return React.createElement("div", {
    className: "relative",
    ref: dropdownRef
  }, React.createElement("button", {
    type: "button",
    onClick: () => !disabled && setIsOpen(!isOpen),
    disabled: disabled,
    className: `w-full border-2 px-4 py-3 rounded-xl text-left flex justify-between items-center ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white cursor-pointer hover:border-yellow-400'}`
  }, React.createElement("span", {
    className: selected.length === 0 ? 'text-gray-400' : 'text-gray-800'
  }, getDisplayText()), React.createElement("span", {
    className: `transform transition-transform ${isOpen ? 'rotate-180' : ''}`
  }, "\u25BC")), isOpen && !disabled && React.createElement("div", {
    className: "absolute z-50 w-full mt-1 bg-white border-2 rounded-xl shadow-lg max-h-64 overflow-y-auto"
  }, React.createElement("label", {
    className: "flex items-center px-4 py-2 hover:bg-yellow-50 cursor-pointer border-b"
  }, React.createElement("input", {
    type: "checkbox",
    checked: selected.length === options.length,
    onChange: handleSelectAll,
    className: "mr-3 accent-red-500",
    style: {
      width: '18px',
      height: '18px'
    }
  }), React.createElement("span", {
    className: "font-semibold"
  }, selected.length === options.length ? 'Deselect All' : 'Select All')), options.map((option, idx) => {
    const value = getOptionValue(option);
    const labelText = getOptionLabel(option);
    const isHovered = hoveredOption === idx;
    return React.createElement("div", {
      key: idx,
      className: "flex items-center justify-between px-4 py-2 hover:bg-yellow-50 cursor-pointer relative group",
      onMouseEnter: () => setHoveredOption(idx),
      onMouseLeave: () => setHoveredOption(null),
      onClick: () => handleToggleOption(value)
    }, React.createElement("label", {
      className: "flex items-center cursor-pointer flex-1"
    }, React.createElement("input", {
      type: "checkbox",
      checked: selected.includes(value),
      onChange: () => handleToggleOption(value),
      className: "mr-3 accent-red-500",
      style: {
        width: '18px',
        height: '18px'
      },
      onClick: e => e.stopPropagation()
    }), React.createElement("span", null, labelText)), React.createElement("button", {
      onClick: e => handleOnlyClick(e, value),
      className: `text-xs font-semibold px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 transition-opacity duration-150 ${isHovered ? 'opacity-100' : 'opacity-0'}`,
      style: {
        minWidth: '45px'
      }
    }, "ONLY"));
  })));
}
function AssetSchoolMultiSelect({
  schools,
  selected,
  onChange
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredOption, setHoveredOption] = useState(null);
  const dropdownRef = React.useRef(null);
  React.useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const handleToggleOption = school => {
    if (selected.includes(school)) {
      onChange(selected.filter(s => s !== school));
    } else {
      onChange([...selected, school]);
    }
  };
  const handleSelectAll = () => {
    if (selected.length === schools.length) {
      onChange([]);
    } else {
      onChange([...schools]);
    }
  };
  const handleOnlyClick = (e, school) => {
    e.stopPropagation();
    e.preventDefault();
    onChange([school]);
    setIsOpen(false);
  };
  const getDisplayText = () => {
    if (selected.length === 0 || selected.length === schools.length) return 'All Schools';
    if (selected.length === 1) return selected[0];
    return `${selected.length} Schools`;
  };
  return React.createElement("div", {
    className: "relative",
    ref: dropdownRef
  }, React.createElement("div", {
    className: "text-xs text-gray-500 mb-1 font-medium"
  }, "Schools (", selected.length, "/", schools.length, ")"), React.createElement("button", {
    type: "button",
    onClick: () => setIsOpen(!isOpen),
    className: "w-full border-2 px-4 py-2 rounded-xl text-left flex justify-between items-center bg-white cursor-pointer hover:border-yellow-400"
  }, React.createElement("span", {
    className: "text-gray-800 truncate"
  }, getDisplayText()), React.createElement("span", {
    className: `transform transition-transform ml-2 ${isOpen ? 'rotate-180' : ''}`
  }, "\u25BC")), isOpen && React.createElement("div", {
    className: "absolute z-50 w-full mt-1 bg-white border-2 rounded-xl shadow-lg max-h-72 overflow-y-auto",
    style: {
      minWidth: '220px'
    }
  }, React.createElement("div", {
    className: "flex items-center px-4 py-2 hover:bg-yellow-50 cursor-pointer border-b",
    onClick: handleSelectAll
  }, React.createElement("input", {
    type: "checkbox",
    checked: selected.length === schools.length,
    onChange: handleSelectAll,
    className: "mr-3 accent-red-500",
    style: {
      width: '18px',
      height: '18px'
    },
    onClick: e => e.stopPropagation()
  }), React.createElement("span", {
    className: "font-semibold"
  }, selected.length === schools.length ? 'Deselect All' : 'Select All')), schools.map((school, idx) => {
    const isHovered = hoveredOption === idx;
    return React.createElement("div", {
      key: school,
      className: "flex items-center justify-between px-4 py-2 hover:bg-yellow-50 cursor-pointer",
      onMouseEnter: () => setHoveredOption(idx),
      onMouseLeave: () => setHoveredOption(null),
      onClick: () => handleToggleOption(school)
    }, React.createElement("label", {
      className: "flex items-center cursor-pointer flex-1 min-w-0"
    }, React.createElement("input", {
      type: "checkbox",
      checked: selected.includes(school),
      onChange: () => handleToggleOption(school),
      className: "mr-3 flex-shrink-0 accent-red-500",
      style: {
        width: '18px',
        height: '18px'
      },
      onClick: e => e.stopPropagation()
    }), React.createElement("span", {
      className: "truncate"
    }, school)), React.createElement("button", {
      onClick: e => handleOnlyClick(e, school),
      className: `text-xs font-semibold px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 transition-opacity duration-150 ml-2 flex-shrink-0 ${isHovered ? 'opacity-100' : 'opacity-0'}`,
      style: {
        minWidth: '45px'
      }
    }, "ONLY"));
  })));
}
const getAttendanceStats = (attendanceRecords, filterDate = null) => {
  if (filterDate) {
    const filtered = attendanceRecords.filter(r => r.date === filterDate);
    const present = filtered.filter(r => r.status === 'Present').length;
    return {
      total: filtered.length,
      present,
      absent: filtered.length - present
    };
  }
  const present = attendanceRecords.filter(r => r.status === 'Present').length;
  return {
    total: attendanceRecords.length,
    present,
    absent: attendanceRecords.length - present
  };
};
const getMonthlyAttendanceStats = (attendanceRecords, month) => {
  const filtered = attendanceRecords.filter(r => getMonthYear(r.date) === month);
  const dayStats = {};
  filtered.forEach(record => {
    if (!dayStats[record.date]) {
      dayStats[record.date] = {
        present: 0,
        absent: 0
      };
    }
    if (record.status === 'Present') {
      dayStats[record.date].present++;
    } else {
      dayStats[record.date].absent++;
    }
  });
  return dayStats;
};
const getChapterStatus = (chapter, progress) => {
  if (!chapter.targetDate) {
    return {
      label: 'No Target',
      color: 'pending',
      class: 'status-delayed'
    };
  }
  const targetDate = new Date(chapter.targetDate);
  const today = new Date();
  const completionDate = progress.completionDate ? new Date(progress.completionDate) : null;
  if (progress.completed === 'Yes' && progress.testConducted !== 'Yes') {
    return {
      label: '⚠️ Test Pending',
      color: 'delayed',
      class: 'status-delayed'
    };
  }
  if (progress.completed === 'Yes' && progress.testConducted === 'Yes') {
    if (completionDate) {
      if (completionDate < targetDate) {
        return {
          label: 'Ahead - Good Job! 🎉',
          color: 'completed',
          class: 'status-ahead'
        };
      } else if (completionDate.toDateString() === targetDate.toDateString()) {
        return {
          label: 'On Track ✓',
          color: 'completed',
          class: 'status-ontrack'
        };
      } else {
        return {
          label: 'Completed (Late)',
          color: 'delayed',
          class: 'status-delayed'
        };
      }
    }
    return {
      label: 'Completed ✓',
      color: 'completed',
      class: 'status-ahead'
    };
  }
  if (today > targetDate) {
    return {
      label: 'Delayed ⚠️',
      color: 'delayed',
      class: 'status-delayed'
    };
  }
  return {
    label: 'Pending',
    color: 'pending',
    class: 'status-delayed'
  };
};
function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  useEffect(() => {
    const checkInstalled = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches;
      const fromHomeScreen = window.navigator.standalone === true;
      return standalone || fromHomeScreen;
    };
    if (checkInstalled()) {
      setIsInstalled(true);
      setShowInstall(false);
      document.body.classList.remove('has-install-banner');
      return;
    }
    const dismissed = localStorage.getItem('installBannerDismissed');
    const dismissedTime = localStorage.getItem('installBannerDismissedTime');
    if (dismissed === 'true' && dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        document.body.classList.remove('has-install-banner');
        return;
      }
    }
    const handler = e => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
      document.body.classList.add('has-install-banner');
    };
    window.addEventListener('beforeinstallprompt', handler);
    const timer = setTimeout(() => {
      if (!deferredPrompt && !checkInstalled()) {
        setShowInstall(true);
        document.body.classList.add('has-install-banner');
      }
    }, 2000);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, [deferredPrompt]);
  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const {
        outcome
      } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstall(false);
        document.body.classList.remove('has-install-banner');
      }
      setDeferredPrompt(null);
    } else {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          alert('📱 To install on iOS:\n\n1. Tap the Share button (📤) at the bottom\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to confirm');
        } else {
          alert('📱 To install on Android:\n\n1. Tap the menu (⋮) at the top right\n2. Tap "Add to Home Screen" or "Install app"\n3. Tap "Install" to confirm');
        }
      } else {
        alert('💻 To install on Desktop:\n\n1. Look for the install icon (⊕ or 📥) in the address bar\n2. Or click the menu (⋮) and select "Install Curriculum Tracker"');
      }
    }
  };
  const handleDismiss = () => {
    setShowInstall(false);
    document.body.classList.remove('has-install-banner');
    localStorage.setItem('installBannerDismissed', 'true');
    localStorage.setItem('installBannerDismissedTime', Date.now().toString());
  };
  if (isInstalled || !showInstall) return null;
  return React.createElement("div", {
    className: "install-app-banner"
  }, React.createElement("div", {
    className: "install-app-banner-text"
  }, React.createElement("i", {
    className: "fa-solid fa-mobile-screen-button"
  }), React.createElement("span", null, "Install curriculum tracker app")), React.createElement("button", {
    onClick: handleInstall,
    className: "install-app-banner-btn"
  }, React.createElement("i", {
    className: "fa-solid fa-download"
  }), "Install"), React.createElement("button", {
    onClick: handleDismiss,
    className: "install-app-banner-close",
    title: "Dismiss"
  }, React.createElement("i", {
    className: "fa-solid fa-xmark"
  })));
}
function StudentProfileForm({
  currentUser,
  onProfileUpdated
}) {
  const myId = currentUser.studentId || currentUser.id;
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    grade: currentUser.grade || '',
    category: '',
    stream: '',
    school: currentUser.school || '',
    fatherName: '',
    motherName: '',
    fatherOccupation: '',
    fatherOccupationOther: '',
    motherOccupation: '',
    motherOccupationOther: '',
    fatherEducation: '',
    fatherEducationOther: '',
    motherEducation: '',
    motherEducationOther: '',
    familyIncome: '',
    address: '',
    state: '',
    stateOther: '',
    district: '',
    districtOther: '',
    pincode: '',
    whatsappNumber: '',
    percentage10th: '',
    percentage11th: ''
  });
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  useEffect(() => {
    const fetchProfile = async () => {
      const cacheKey = `studentProfile_${myId}`;
      
      // ✅ FIX: Load from cache first
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.data) {
            setProfile(prev => ({
              ...prev,
              grade: currentUser.grade || '',
              school: currentUser.school || '',
              ...parsed.data
            }));
            setLoading(false);
          }
        }
      } catch (e) {}
      
      // ✅ FIX: Fetch with timeout
      try {
        const fetchPromise = db.collection('studentProfiles').doc(myId).get();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 8000)
        );
        
        const docSnap = await Promise.race([fetchPromise, timeoutPromise]);
        if (docSnap.exists) {
          const profileData = docSnap.data();
          const fullProfile = {
            ...profile,
            grade: currentUser.grade || '',
            school: currentUser.school || '',
            ...profileData
          };
          setProfile(fullProfile);
          // Update cache
          try {
            localStorage.setItem(cacheKey, JSON.stringify({
              data: profileData, timestamp: Date.now()
            }));
          } catch (e) {}
          if (onProfileUpdated) {
            onProfileUpdated(fullProfile);
          }
        }
        setLoading(false);
      } catch (e) {
        setLoading(false); // ✅ FIX: Always stop loading
      }
    };
    fetchProfile();
  }, [myId]);
  const calculateCompletion = () => {
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'dob', 'grade', 'category', 'stream', 'school', 'fatherName', 'motherName', 'fatherOccupation', 'motherOccupation', 'fatherEducation', 'motherEducation', 'familyIncome', 'address', 'state', 'district', 'pincode', 'whatsappNumber', 'percentage10th'];
    const filled = requiredFields.filter(field => profile[field] && String(profile[field]).trim() !== '').length;
    return Math.round(filled / requiredFields.length * 100);
  };
  const handleSave = async () => {
    try {
      const savedProfile = {
        ...profile,
        studentId: myId,
        updatedAt: new Date().toISOString()
      };
      await db.collection('studentProfiles').doc(myId).set(savedProfile);
      if (onProfileUpdated) {
        onProfileUpdated(savedProfile);
      }
      alert('✅ Profile saved successfully!');
      return true;
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('❌ Error saving profile: ' + error.message);
      return false;
    }
  };
  const handleToggleEdit = async () => {
    if (isEditing) {
      const saved = await handleSave();
      if (saved) {
        setIsEditing(false);
      }
    } else {
      setIsEditing(true);
    }
  };
  const completion = calculateCompletion();
  const inputCls = (extra = '') => `w-full border-2 px-4 py-3 rounded-xl ${extra} ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`;
  const disabled = !isEditing;
  if (loading) {
    return React.createElement("div", {
      className: "text-center py-8"
    }, "Loading profile...");
  }
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("div", {
    className: "bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("div", {
    className: "flex justify-between items-start flex-wrap gap-4"
  }, React.createElement("div", null, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "\uD83D\uDC64 My Profile"), React.createElement("div", {
    className: "flex flex-wrap gap-2 mt-3"
  }, React.createElement("span", {
    className: "px-3 py-1 bg-white/30 text-white rounded-lg text-sm font-mono"
  }, "Student ID: ", myId), React.createElement("span", {
    className: "px-3 py-1 bg-white/30 text-white rounded-lg text-sm"
  }, currentUser.school), React.createElement("span", {
    className: "px-3 py-1 bg-white/30 text-white rounded-lg text-sm"
  }, "Class ", currentUser.grade))), React.createElement("div", {
    className: "flex items-center gap-4"
  }, React.createElement("div", {
    className: "text-right"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Profile Completion"), React.createElement("div", {
    className: "text-3xl font-bold",
    style: {
      color: completion >= 80 ? '#86EFAC' : completion >= 50 ? '#FCD34D' : '#FCA5A5'
    }
  }, completion, "%")), React.createElement("button", {
    onClick: handleToggleEdit,
    className: "px-4 py-2 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50"
  }, isEditing ? 'Save' : 'Edit')))), completion < 100 && React.createElement("div", {
    className: "bg-orange-50 border-2 border-orange-300 p-4 rounded-xl"
  }, React.createElement("p", {
    className: "text-orange-800 font-semibold"
  }, "\u26A0\uFE0F Click Edit, complete your profile and then press Save.")), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg space-y-6"
  }, React.createElement("div", {
    className: "border-4 border-blue-500 rounded-2xl p-6 bg-blue-50"
  }, React.createElement("h3", {
    className: "text-2xl font-bold mb-4 text-blue-800"
  }, "\uD83D\uDCCB Personal Information"), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "First Name *"), React.createElement("input", {
    type: "text",
    value: profile.firstName,
    disabled: disabled,
    onChange: e => setProfile({
      ...profile,
      firstName: e.target.value
    }),
    className: inputCls()
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Last Name *"), React.createElement("input", {
    type: "text",
    value: profile.lastName,
    disabled: disabled,
    onChange: e => setProfile({
      ...profile,
      lastName: e.target.value
    }),
    className: inputCls()
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Email ID *"), React.createElement("input", {
    type: "email",
    value: profile.email,
    disabled: disabled,
    onChange: e => setProfile({
      ...profile,
      email: e.target.value
    }),
    className: inputCls()
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Phone Number *"), React.createElement("input", {
    type: "tel",
    value: profile.phone,
    disabled: disabled,
    onChange: e => setProfile({
      ...profile,
      phone: e.target.value
    }),
    className: inputCls()
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Date of Birth *"), React.createElement("input", {
    type: "date",
    value: profile.dob,
    disabled: disabled,
    onChange: e => setProfile({
      ...profile,
      dob: e.target.value
    }),
    className: inputCls()
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Class *"), React.createElement("select", {
    value: profile.grade,
    disabled: disabled,
    onChange: e => setProfile({
      ...profile,
      grade: e.target.value
    }),
    className: inputCls()
  }, React.createElement("option", {
    value: ""
  }, "Select"), React.createElement("option", {
    value: "11"
  }, "11th"), React.createElement("option", {
    value: "12"
  }, "12th"))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Category *"), React.createElement("select", {
    value: profile.category,
    disabled: disabled,
    onChange: e => setProfile({
      ...profile,
      category: e.target.value
    }),
    className: inputCls()
  }, React.createElement("option", {
    value: ""
  }, "Select"), CATEGORIES.map(c => React.createElement("option", {
    key: c,
    value: c
  }, c)))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Stream *"), React.createElement("select", {
    value: profile.stream,
    disabled: disabled,
    onChange: e => setProfile({
      ...profile,
      stream: e.target.value
    }),
    className: inputCls()
  }, React.createElement("option", {
    value: ""
  }, "Select"), STREAMS.map(s => React.createElement("option", {
    key: s,
    value: s
  }, s)))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "School *"), React.createElement("select", {
    value: profile.school,
    disabled: disabled,
    onChange: e => setProfile({
      ...profile,
      school: e.target.value
    }),
    className: inputCls()
  }, React.createElement("option", {
    value: ""
  }, "Select"), SCHOOLS.map(s => React.createElement("option", {
    key: s,
    value: s
  }, s)))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "10th Overall Percentage *"), React.createElement("input", {
    type: "number",
    step: "0.01",
    value: profile.percentage10th,
    disabled: disabled,
    onChange: e => setProfile({
      ...profile,
      percentage10th: e.target.value
    }),
    className: inputCls(),
    placeholder: "e.g. 85.5"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "11th Overall Percentage (Optional)"), React.createElement("input", {
    type: "number",
    step: "0.01",
    value: profile.percentage11th,
    disabled: disabled,
    onChange: e => setProfile({
      ...profile,
      percentage11th: e.target.value
    }),
    className: inputCls(),
    placeholder: "e.g. 80.0"
  })))), React.createElement("div", {
    className: "border-4 border-purple-500 rounded-2xl p-6 bg-purple-50"
  }, React.createElement("h3", {
    className: "text-2xl font-bold mb-4 text-purple-800"
  }, "\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67\u200D\uD83D\uDC66 Parent Information"), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Father's Name *"), React.createElement("input", {
    type: "text",
    value: profile.fatherName,
    disabled: disabled,
    onChange: e => setProfile({
      ...profile,
      fatherName: e.target.value
    }),
    className: inputCls()
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Mother's Name *"), React.createElement("input", {
    type: "text",
    value: profile.motherName,
    disabled: disabled,
    onChange: e => setProfile({
      ...profile,
      motherName: e.target.value
    }),
    className: inputCls()
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Father's Occupation *"), React.createElement("select", {
    value: profile.fatherOccupation,
    disabled: disabled,
    onChange: e => setProfile({
      ...profile,
      fatherOccupation: e.target.value,
      fatherOccupationOther: ''
    }),
    className: inputCls()
  }, React.createElement("option", {
    value: ""
  }, "Select Occupation"), OCCUPATIONS.map(o => React.createElement("option", {
    key: o,
    value: o
  }, o))), profile.fatherOccupation === 'Others' && React.createElement("input", {
    type: "text",
    placeholder: "Please specify occupation",
    value: profile.fatherOccupationOther,
    disabled: disabled,
    onChange: e => setProfile({
      ...profile,
      fatherOccupationOther: e.target.value
    }),
    className: inputCls('mt-2')
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Mother's Occupation *"), React.createElement("select", {
    value: profile.motherOccupation,
    disabled: disabled,
    onChange: e => setProfile({
      ...profile,
      motherOccupation: e.target.value,
      motherOccupationOther: ''
    }),
    className: inputCls()
  }, React.createElement("option", {
    value: ""
  }, "Select Occupation"), OCCUPATIONS.map(o => React.createElement("option", {
    key: o,
    value: o
  }, o))), profile.motherOccupation === 'Others' && React.createElement("input", {
    type: "text",
    placeholder: "Please specify occupation",
    value: profile.motherOccupationOther,
    disabled: disabled,
    onChange: e => setProfile({
      ...profile,
      motherOccupationOther: e.target.value
    }),
    className: inputCls('mt-2')
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Father's Education *"), React.createElement("select", {
    value: profile.fatherEducation,
    disabled: disabled,
    onChange: e => setProfile({
      ...profile,
      fatherEducation: e.target.value,
      fatherEducationOther: ''
    }),
    className: inputCls()
  }, React.createElement("option", {
    value: ""
  }, "Select Education"), EDUCATION_LEVELS.map(e => React.createElement("option", {
    key: e,
    value: e
  }, e))), profile.fatherEducation === 'Others' && React.createElement("input", {
    type: "text",
    placeholder: "Please specify education",
    value: profile.fatherEducationOther,
    disabled: disabled,
    onChange: e => setProfile({
      ...profile,
      fatherEducationOther: e.target.value
    }),
    className: inputCls('mt-2')
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Mother's Education *"), React.createElement("select", {
    value: profile.motherEducation,
    disabled: disabled,
    onChange: e => setProfile({
      ...profile,
      motherEducation: e.target.value,
      motherEducationOther: ''
    }),
    className: inputCls()
  }, React.createElement("option", {
    value: ""
  }, "Select Education"), EDUCATION_LEVELS.map(e => React.createElement("option", {
    key: e,
    value: e
  }, e))), profile.motherEducation === 'Others' && React.createElement("input", {
    type: "text",
    placeholder: "Please specify education",
    value: profile.motherEducationOther,
    disabled: disabled,
    onChange: e => setProfile({
      ...profile,
      motherEducationOther: e.target.value
    }),
    className: inputCls('mt-2')
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Family Income *"), React.createElement("select", {
    value: profile.familyIncome,
    disabled: disabled,
    onChange: e => setProfile({
      ...profile,
      familyIncome: e.target.value
    }),
    className: inputCls()
  }, React.createElement("option", {
    value: ""
  }, "Select Income Range"), INCOME_RANGES.map(i => React.createElement("option", {
    key: i,
    value: i
  }, i)))))), React.createElement("div", {
    className: "border-4 border-green-500 rounded-2xl p-6 bg-green-50"
  }, React.createElement("h3", {
    className: "text-2xl font-bold mb-4 text-green-800"
  }, "\uD83D\uDCEE Contact Details"), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4"
  }, React.createElement("div", {
    className: "md:col-span-2"
  }, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Address *"), React.createElement("input", {
    type: "text",
    value: profile.address,
    disabled: disabled,
    onChange: e => setProfile({
      ...profile,
      address: e.target.value
    }),
    className: inputCls()
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "State *"), React.createElement("select", {
    value: profile.state,
    disabled: disabled,
    onChange: e => setProfile({
      ...profile,
      state: e.target.value,
      district: '',
      districtOther: ''
    }),
    className: inputCls()
  }, React.createElement("option", {
    value: ""
  }, "Select State"), INDIAN_STATES.map(s => React.createElement("option", {
    key: s,
    value: s
  }, s)), React.createElement("option", {
    value: "Others"
  }, "Others")), profile.state === 'Others' && React.createElement("input", {
    type: "text",
    placeholder: "Please specify state",
    value: profile.stateOther,
    disabled: disabled,
    onChange: e => setProfile({
      ...profile,
      stateOther: e.target.value
    }),
    className: inputCls('mt-2')
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "District *"), React.createElement("select", {
    value: profile.district,
    disabled: disabled || !profile.state || profile.state === 'Others',
    onChange: e => setProfile({
      ...profile,
      district: e.target.value,
      districtOther: ''
    }),
    className: inputCls()
  }, React.createElement("option", {
    value: ""
  }, "Select District"), profile.state && profile.state !== 'Others' && STATE_DISTRICTS[profile.state] && STATE_DISTRICTS[profile.state].map(d => React.createElement("option", {
    key: d,
    value: d
  }, d)), React.createElement("option", {
    value: "Others"
  }, "Others")), profile.district === 'Others' && React.createElement("input", {
    type: "text",
    placeholder: "Please specify district",
    value: profile.districtOther,
    disabled: disabled,
    onChange: e => setProfile({
      ...profile,
      districtOther: e.target.value
    }),
    className: inputCls('mt-2')
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Pincode *"), React.createElement("input", {
    type: "text",
    value: profile.pincode,
    disabled: disabled,
    onChange: e => setProfile({
      ...profile,
      pincode: e.target.value
    }),
    className: inputCls()
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "WhatsApp Number *"), React.createElement("input", {
    type: "text",
    value: profile.whatsappNumber,
    disabled: disabled,
    onChange: e => setProfile({
      ...profile,
      whatsappNumber: e.target.value
    }),
    className: inputCls()
  }))))), React.createElement("div", {
    className: "border-4 border-indigo-500 rounded-2xl p-6 bg-indigo-50"
  }, React.createElement("div", {
    className: "flex justify-between items-center mb-4"
  }, React.createElement("h3", {
    className: "text-2xl font-bold text-indigo-800"
  }, "\uD83C\uDF93 Academic Information"), React.createElement("button", {
    onClick: handleToggleEdit,
    className: "px-4 py-2 rounded-xl font-semibold text-sm bg-indigo-600 text-white"
  }, isEditing ? 'Save' : 'Edit')), React.createElement("p", {
    className: "text-sm text-gray-600"
  }, "You can update your marks / percentages here whenever results are updated."), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4 mt-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "10th Percentage *"), React.createElement("input", {
    type: "number",
    step: "0.01",
    className: inputCls(),
    disabled: !isEditing,
    value: profile.percentage10th,
    onChange: e => setProfile({
      ...profile,
      percentage10th: e.target.value
    })
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "11th Percentage (Optional)"), React.createElement("input", {
    type: "number",
    step: "0.01",
    className: inputCls(),
    disabled: !isEditing,
    value: profile.percentage11th,
    onChange: e => setProfile({
      ...profile,
      percentage11th: e.target.value
    })
  })))));
}
function StudentExamRegistration({
  currentUser
}) {
  const myId = currentUser.studentId || currentUser.id;
  const myGrade = currentUser.grade;
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedExams, setExpandedExams] = useState(new Set());
  const [editingExams, setEditingExams] = useState(new Set());
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const docSnap = await db.collection('studentExamRegistrations').doc(myId).get();
        if (docSnap.exists) {
          setExams(docSnap.data().exams || []);
        }
        setLoading(false);
      } catch (e) {
        console.error('Error fetching exam registrations:', e);
        setLoading(false);
      }
    };
    fetchExams();
  }, [myId]);
  const handleAddExam = () => {
    const newExams = [...exams, {
      examName: '',
      registrationStatus: 'No',
      registrationNumber: '',
      password: '',
      emailUsed: '',
      phoneUsed: '',
      reasonNotCompleted: '',
      needSupport: 'No',
      supportType: ''
    }];
    setExams(newExams);
    const newIndex = newExams.length - 1;
    setExpandedExams(new Set([...expandedExams, newIndex]));
    setEditingExams(new Set([...editingExams, newIndex]));
  };
  const handleRemoveExam = index => {
    const updated = [...exams];
    updated.splice(index, 1);
    setExams(updated);
    const newExpanded = new Set(expandedExams);
    const newEditing = new Set(editingExams);
    newExpanded.delete(index);
    newEditing.delete(index);
    setExpandedExams(newExpanded);
    setEditingExams(newEditing);
  };
  const handleExamChange = (index, field, value) => {
    const updated = [...exams];
    updated[index][field] = value;
    setExams(updated);
  };
  const toggleExpand = index => {
    const newExpanded = new Set(expandedExams);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedExams(newExpanded);
  };
  const toggleEdit = index => {
    const newEditing = new Set(editingExams);
    const newExpanded = new Set(expandedExams);
    if (newEditing.has(index)) {
      newEditing.delete(index);
    } else {
      newEditing.add(index);
      newExpanded.add(index);
    }
    setEditingExams(newEditing);
    setExpandedExams(newExpanded);
  };
  const handleSave = async () => {
    try {
      await db.collection('studentExamRegistrations').doc(myId).set({
        studentId: myId,
        studentName: currentUser.name,
        school: currentUser.school,
        grade: myGrade,
        exams,
        updatedAt: new Date().toISOString()
      });
      alert('✅ Exam registrations saved successfully!');
      setExpandedExams(new Set());
      setEditingExams(new Set());
    } catch (e) {
      alert('Failed to save: ' + e.message);
    }
  };
  const examList = myGrade === '12' ? EXAMS_12TH : EXAMS_11TH;
  if (loading) {
    return React.createElement("div", {
      className: "text-center py-8"
    }, "Loading exam registrations...");
  }
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("div", {
    className: "flex justify-between items-center"
  }, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "\uD83D\uDCDD Exam Registration"), React.createElement("button", {
    onClick: handleAddExam,
    className: "px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold"
  }, "+ Add Exam")), myGrade === '11' && React.createElement("div", {
    className: "bg-blue-50 border-2 border-blue-300 p-4 rounded-xl"
  }, React.createElement("p", {
    className: "font-semibold text-blue-800"
  }, "\uD83D\uDCCC Class 11: Please list the competitive exams you're interested in appearing for in the future.")), exams.length === 0 ? React.createElement("div", {
    className: "bg-white p-8 rounded-2xl text-center"
  }, React.createElement("p", {
    className: "text-gray-600"
  }, "No exam registrations added yet. Click \"+ Add Exam\" to start.")) : exams.map((exam, index) => {
    const isExpanded = expandedExams.has(index);
    const isEditing = editingExams.has(index);
    return React.createElement("div", {
      key: index,
      className: "bg-white p-6 rounded-2xl shadow-lg"
    }, React.createElement("div", {
      className: "flex justify-between items-center mb-4"
    }, React.createElement("div", {
      className: "flex items-center gap-3"
    }, React.createElement("button", {
      onClick: () => toggleExpand(index),
      className: "text-2xl"
    }, isExpanded ? '▼' : '▶'), React.createElement("h3", {
      className: "text-xl font-bold"
    }, exam.examName || `Exam ${index + 1}`), exam.registrationStatus === 'Yes' && React.createElement("span", {
      className: "px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold"
    }, "\u2713 Completed")), React.createElement("div", {
      className: "flex gap-2"
    }, React.createElement("button", {
      onClick: () => toggleEdit(index),
      className: "px-4 py-2 bg-blue-500 text-white rounded-lg"
    }, isEditing ? '💾 Save' : '✏️ Edit'), React.createElement("button", {
      onClick: () => handleRemoveExam(index),
      className: "px-4 py-2 bg-red-500 text-white rounded-lg"
    }, "Remove"))), isExpanded && React.createElement("div", {
      className: "grid md:grid-cols-2 gap-4"
    }, React.createElement("div", {
      className: "md:col-span-2"
    }, React.createElement("label", {
      className: "block text-sm font-bold mb-2"
    }, "Exam Name *"), React.createElement("select", {
      value: exam.examName,
      onChange: e => handleExamChange(index, 'examName', e.target.value),
      disabled: !isEditing,
      className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
    }, React.createElement("option", {
      value: ""
    }, "Select Exam"), examList.map(e => React.createElement("option", {
      key: e,
      value: e
    }, e)))), myGrade === '12' && React.createElement(React.Fragment, null, React.createElement("div", {
      className: "md:col-span-2"
    }, React.createElement("label", {
      className: "block text-sm font-bold mb-2"
    }, "Registration Completed? *"), React.createElement("select", {
      value: exam.registrationStatus,
      onChange: e => handleExamChange(index, 'registrationStatus', e.target.value),
      disabled: !isEditing,
      className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
    }, React.createElement("option", {
      value: "No"
    }, "No"), React.createElement("option", {
      value: "Partially"
    }, "Partially Completed"), React.createElement("option", {
      value: "Yes"
    }, "Yes - Fully Completed"))), exam.registrationStatus === 'Yes' && React.createElement(React.Fragment, null, React.createElement("div", null, React.createElement("label", {
      className: "block text-sm font-bold mb-2"
    }, "Registration Number *"), React.createElement("input", {
      type: "text",
      value: exam.registrationNumber,
      onChange: e => handleExamChange(index, 'registrationNumber', e.target.value),
      disabled: !isEditing,
      className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
    })), React.createElement("div", null, React.createElement("label", {
      className: "block text-sm font-bold mb-2"
    }, "Password *"), React.createElement("input", {
      type: "text",
      value: exam.password,
      onChange: e => handleExamChange(index, 'password', e.target.value),
      disabled: !isEditing,
      className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
    })), React.createElement("div", null, React.createElement("label", {
      className: "block text-sm font-bold mb-2"
    }, "Email Used for Registration *"), React.createElement("input", {
      type: "email",
      value: exam.emailUsed,
      onChange: e => handleExamChange(index, 'emailUsed', e.target.value),
      disabled: !isEditing,
      className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
    })), React.createElement("div", null, React.createElement("label", {
      className: "block text-sm font-bold mb-2"
    }, "Phone Number Used *"), React.createElement("input", {
      type: "tel",
      value: exam.phoneUsed,
      onChange: e => handleExamChange(index, 'phoneUsed', e.target.value),
      disabled: !isEditing,
      className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
    }))), exam.registrationStatus === 'No' && React.createElement("div", {
      className: "md:col-span-2"
    }, React.createElement("label", {
      className: "block text-sm font-bold mb-2"
    }, "Why is the registration not completed? *"), React.createElement("textarea", {
      value: exam.reasonNotCompleted,
      onChange: e => handleExamChange(index, 'reasonNotCompleted', e.target.value),
      disabled: !isEditing,
      className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed",
      rows: "3"
    })), React.createElement("div", {
      className: "md:col-span-2"
    }, React.createElement("label", {
      className: "block text-sm font-bold mb-2"
    }, "Do you need help/support to complete this application? *"), React.createElement("select", {
      value: exam.needSupport,
      onChange: e => handleExamChange(index, 'needSupport', e.target.value),
      disabled: !isEditing,
      className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
    }, React.createElement("option", {
      value: "No"
    }, "No"), React.createElement("option", {
      value: "Yes"
    }, "Yes"))), exam.needSupport === 'Yes' && React.createElement("div", {
      className: "md:col-span-2"
    }, React.createElement("label", {
      className: "block text-sm font-bold mb-2"
    }, "What kind of help do you need? *"), React.createElement("textarea", {
      value: exam.supportType,
      onChange: e => handleExamChange(index, 'supportType', e.target.value),
      disabled: !isEditing,
      className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed",
      rows: "3",
      placeholder: "Please describe the support you need..."
    })))));
  }), React.createElement("button", {
    onClick: handleSave,
    className: "w-full avanti-gradient text-white py-4 rounded-xl font-bold text-xl"
  }, "\uD83D\uDCBE Save Exam Registrations"));
}
function BarcodeScanner({
  onScanSuccess,
  onClose
}) {
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(true);
  const [scannedCode, setScannedCode] = useState(null);
  const html5QrCodeRef = useRef(null);
  const hasScannedRef = useRef(false);
  const stopScanner = useCallback(async () => {
    try {
      if (html5QrCodeRef.current) {
        try {
          const state = html5QrCodeRef.current.getState();
          if (state === 2 || state === 1) {
            await html5QrCodeRef.current.stop();
            console.log('Scanner stopped successfully');
          }
        } catch (err) {
          console.log('Scanner stop error:', err);
        }
        html5QrCodeRef.current = null;
      }
      const videoElement = document.querySelector('#barcode-reader video');
      if (videoElement && videoElement.srcObject) {
        const tracks = videoElement.srcObject.getTracks();
        tracks.forEach(track => {
          track.stop();
          console.log('Video track stopped:', track.label);
        });
        videoElement.srcObject = null;
      }
      const container = document.getElementById('barcode-reader');
      if (container) {
        container.innerHTML = '';
      }
    } catch (err) {
      console.log('Cleanup error (can be ignored):', err);
    }
  }, []);
  useEffect(() => {
    let mounted = true;
    const startScanner = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (!mounted || hasScannedRef.current) return;
        html5QrCodeRef.current = new Html5Qrcode("barcode-reader");
        const config = {
          fps: 10,
          qrbox: {
            width: 250,
            height: 100
          },
          aspectRatio: 1.777778,
          formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.EAN_8, Html5QrcodeSupportedFormats.UPC_A, Html5QrcodeSupportedFormats.UPC_E, Html5QrcodeSupportedFormats.CODE_128, Html5QrcodeSupportedFormats.CODE_39]
        };
        await html5QrCodeRef.current.start({
          facingMode: "environment"
        }, config, async decodedText => {
          if (hasScannedRef.current) return;
          hasScannedRef.current = true;
          console.log('Barcode scanned:', decodedText);
          setScanning(false);
          setScannedCode(decodedText);
          await stopScanner();
          onScanSuccess(decodedText);
        }, errorMessage => {});
      } catch (err) {
        console.error('Scanner error:', err);
        if (mounted) {
          setError('Camera access denied. Please allow camera access and try again.');
        }
      }
    };
    startScanner();
    return () => {
      mounted = false;
      stopScanner();
    };
  }, []);
  const handleClose = async () => {
    await stopScanner();
    onClose();
  };
  return React.createElement("div", {
    className: "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[10000] p-4"
  }, React.createElement("div", {
    className: "bg-white rounded-2xl p-6 w-full max-w-md"
  }, React.createElement("div", {
    className: "flex justify-between items-center mb-4"
  }, React.createElement("h3", {
    className: "text-xl font-bold"
  }, "\uD83D\uDCF7 Scan Barcode"), React.createElement("button", {
    onClick: handleClose,
    className: "text-2xl text-gray-500 hover:text-gray-700"
  }, "\u2715")), error ? React.createElement("div", {
    className: "text-center py-8"
  }, React.createElement("p", {
    className: "text-red-500 mb-4"
  }, error), React.createElement("button", {
    onClick: () => window.location.reload(),
    className: "px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold"
  }, "Retry")) : React.createElement(React.Fragment, null, React.createElement("div", {
    className: "barcode-scanner-container mb-4"
  }, React.createElement("div", {
    id: "barcode-reader"
  }), scanning && React.createElement("p", {
    className: "text-center text-gray-600 mt-2"
  }, "Point camera at barcode...")), React.createElement("p", {
    className: "text-sm text-gray-500 text-center"
  }, "Position the barcode within the frame. It will scan automatically."))));
}
const INDIAN_BOOKS_DB = {
  '9789368024552': {
    title: 'Advanced Problems in Mathematics for JEE',
    author: 'Vikas Gupta, Pankaj Joshi',
    publisher: 'Shree Balaji Publications',
    category: 'JEE Preparation'
  },
  '9788193975800': {
    title: 'Problems in Physics',
    author: 'S.S. Krotov',
    publisher: 'CBS Publishers',
    category: 'Physics'
  },
  '9789384934002': {
    title: 'Cengage Physics',
    author: 'B.M. Sharma',
    publisher: 'Cengage Learning',
    category: 'JEE Physics'
  },
  '9789354491719': {
    title: 'HC Verma Concepts of Physics Vol 1',
    author: 'H.C. Verma',
    publisher: 'Bharati Bhawan',
    category: 'Physics'
  },
  '9789354491726': {
    title: 'HC Verma Concepts of Physics Vol 2',
    author: 'H.C. Verma',
    publisher: 'Bharati Bhawan',
    category: 'Physics'
  },
  '9789311123394': {
    title: 'Organic Chemistry Morrison Boyd',
    author: 'Morrison & Boyd',
    publisher: 'Pearson',
    category: 'Organic Chemistry'
  },
  '9788120349858': {
    title: 'Concise Inorganic Chemistry',
    author: 'J.D. Lee',
    publisher: 'Wiley',
    category: 'Inorganic Chemistry'
  },
  '9789332519008': {
    title: 'Physical Chemistry',
    author: 'OP Tandon',
    publisher: 'G.R. Bathla Publications',
    category: 'Physical Chemistry'
  },
  '9788183486934': {
    title: 'Problems in General Physics',
    author: 'I.E. Irodov',
    publisher: 'Arihant',
    category: 'Physics'
  },
  '9789325793729': {
    title: 'Coordinate Geometry for JEE',
    author: 'S.K. Goyal',
    publisher: 'Arihant',
    category: 'Mathematics'
  },
  '9789325798625': {
    title: 'Differential Calculus for JEE',
    author: 'Amit M Agarwal',
    publisher: 'Arihant',
    category: 'Mathematics'
  },
  '9789325798618': {
    title: 'Integral Calculus for JEE',
    author: 'Amit M Agarwal',
    publisher: 'Arihant',
    category: 'Mathematics'
  },
  '9788177091878': {
    title: 'IIT Mathematics',
    author: 'M.L. Khanna',
    publisher: 'Jai Prakash Nath',
    category: 'Mathematics'
  },
  '9789388241755': {
    title: 'Objective NCERT Xtract Physics',
    author: 'MTG Editorial Board',
    publisher: 'MTG Learning',
    category: 'NEET Physics'
  },
  '9789388241762': {
    title: 'Objective NCERT Xtract Chemistry',
    author: 'MTG Editorial Board',
    publisher: 'MTG Learning',
    category: 'NEET Chemistry'
  },
  '9789388241779': {
    title: 'Objective NCERT Xtract Biology',
    author: 'MTG Editorial Board',
    publisher: 'MTG Learning',
    category: 'NEET Biology'
  },
  '9789389167542': {
    title: 'NCERT Fingertips Biology',
    author: 'MTG Editorial Board',
    publisher: 'MTG Learning',
    category: 'NEET Biology'
  },
  '9789312146712': {
    title: 'Pradeep Chemistry Class 11',
    author: 'S.C. Kheterpal',
    publisher: 'Pradeep Publications',
    category: 'Chemistry'
  },
  '9789312146729': {
    title: 'Pradeep Chemistry Class 12',
    author: 'S.C. Kheterpal',
    publisher: 'Pradeep Publications',
    category: 'Chemistry'
  },
  '9789388127820': {
    title: 'Cengage Chemistry',
    author: 'K.S. Verma',
    publisher: 'Cengage Learning',
    category: 'JEE Chemistry'
  },
  '9789332586949': {
    title: 'RD Sharma Mathematics Class 11',
    author: 'R.D. Sharma',
    publisher: 'Dhanpat Rai',
    category: 'Mathematics'
  },
  '9789332586956': {
    title: 'RD Sharma Mathematics Class 12',
    author: 'R.D. Sharma',
    publisher: 'Dhanpat Rai',
    category: 'Mathematics'
  }
};
async function lookupISBN(isbn) {
  try {
    const cleanISBN = isbn.replace(/[-\s]/g, '');
    console.log('[ISBN] Looking up:', cleanISBN);
    if (INDIAN_BOOKS_DB[cleanISBN]) {
      console.log('[ISBN] Found in Indian Books DB!');
      const book = INDIAN_BOOKS_DB[cleanISBN];
      return {
        found: true,
        title: book.title,
        author: book.author,
        publisher: book.publisher,
        category: book.category,
        isbn: cleanISBN,
        source: 'Indian Books Database'
      };
    }
    try {
      const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${cleanISBN}&jscmd=data&format=json`);
      const data = await response.json();
      const bookData = data[`ISBN:${cleanISBN}`];
      if (bookData) {
        console.log('[ISBN] Found in Open Library!');
        return {
          found: true,
          title: bookData.title || '',
          author: bookData.authors ? bookData.authors.map(a => a.name).join(', ') : '',
          publisher: bookData.publishers ? bookData.publishers.map(p => p.name).join(', ') : '',
          isbn: cleanISBN,
          source: 'Open Library'
        };
      }
    } catch (e) {
      console.log('[ISBN] Open Library error:', e);
    }
    try {
      const googleResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanISBN}`);
      const googleData = await googleResponse.json();
      if (googleData.items && googleData.items.length > 0) {
        const book = googleData.items[0].volumeInfo;
        console.log('[ISBN] Found in Google Books!');
        return {
          found: true,
          title: book.title || '',
          author: book.authors ? book.authors.join(', ') : '',
          publisher: book.publisher || '',
          isbn: cleanISBN,
          source: 'Google Books'
        };
      }
    } catch (e) {
      console.log('[ISBN] Google Books error:', e);
    }
    if (cleanISBN.length === 13 && cleanISBN.startsWith('978')) {
      const isbn10 = convertISBN13to10(cleanISBN);
      if (isbn10) {
        console.log('[ISBN] Trying ISBN-10 format:', isbn10);
        for (const [key, value] of Object.entries(INDIAN_BOOKS_DB)) {
          if (key.includes(isbn10) || convertISBN13to10(key) === isbn10) {
            console.log('[ISBN] Found via ISBN-10 conversion!');
            return {
              found: true,
              title: value.title,
              author: value.author,
              publisher: value.publisher,
              category: value.category,
              isbn: cleanISBN,
              source: 'Indian Books Database (ISBN-10)'
            };
          }
        }
        try {
          const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn10}&jscmd=data&format=json`);
          const data = await response.json();
          const bookData = data[`ISBN:${isbn10}`];
          if (bookData) {
            console.log('[ISBN] Found via ISBN-10 in Open Library!');
            return {
              found: true,
              title: bookData.title || '',
              author: bookData.authors ? bookData.authors.map(a => a.name).join(', ') : '',
              publisher: bookData.publishers ? bookData.publishers.map(p => p.name).join(', ') : '',
              isbn: cleanISBN,
              source: 'Open Library (ISBN-10)'
            };
          }
        } catch (e) {}
      }
    }
    console.log('[ISBN] Not found in any database');
    return {
      found: false,
      isbn: cleanISBN
    };
  } catch (error) {
    console.error('ISBN lookup error:', error);
    return {
      found: false,
      isbn: isbn
    };
  }
}
function convertISBN13to10(isbn13) {
  try {
    if (isbn13.length !== 13 || !isbn13.startsWith('978')) return null;
    const isbn9 = isbn13.substring(3, 12);
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(isbn9[i]) * (10 - i);
    }
    const checkDigit = (11 - sum % 11) % 11;
    return isbn9 + (checkDigit === 10 ? 'X' : checkDigit.toString());
  } catch (e) {
    return null;
  }
}
function AddAssetModal({
  barcode,
  lookupResult,
  lookingUp,
  onSave,
  onClose
}) {
  const [assetType, setAssetType] = useState('book');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publisher, setPublisher] = useState('');
  const [category, setCategory] = useState('Other');
  const [serialNumber, setSerialNumber] = useState('');
  const [model, setModel] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');
  const [copyNumber, setCopyNumber] = useState(1);
  const isManualAdd = barcode && barcode.startsWith('MANUAL-');
  const isAdditionalCopy = lookupResult?.isAdditionalCopy;
  useEffect(() => {
    if (lookupResult && lookupResult.found) {
      setTitle(lookupResult.title || '');
      setAuthor(lookupResult.author || '');
      setPublisher(lookupResult.publisher || '');
      setAssetType('book');
      if (lookupResult.copyNumber) {
        setCopyNumber(lookupResult.copyNumber);
      }
    }
  }, [lookupResult]);
  const handleSubmit = e => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }
    let finalBarcode;
    if (isManualAdd) {
      finalBarcode = manualBarcode.trim() || `ASSET-${Date.now()}`;
    } else if (assetType === 'book' && copyNumber > 1) {
      finalBarcode = `${barcode}-copy-${copyNumber}`;
    } else if (assetType === 'book' && copyNumber === 1) {
      finalBarcode = barcode;
    } else {
      finalBarcode = barcode;
    }
    onSave({
      barcode: finalBarcode,
      assetType,
      title: title.trim(),
      author: assetType === 'book' ? author.trim() : '',
      publisher: assetType === 'book' ? publisher.trim() : '',
      category: assetType === 'book' ? category : '',
      serialNumber: assetType === 'chromebook' ? serialNumber.trim() : '',
      model: assetType === 'chromebook' ? model.trim() : '',
      isbn: lookupResult?.isbn || barcode || '',
      copyNumber: assetType === 'book' ? copyNumber : null
    });
  };
  return React.createElement("div", {
    className: "modal-overlay",
    onClick: onClose
  }, React.createElement("div", {
    className: "modal-content",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "flex justify-between items-center mb-4"
  }, React.createElement("h3", {
    className: "text-xl font-bold"
  }, isAdditionalCopy ? `📚 Add Copy #${copyNumber}` : isManualAdd ? '✏️ Add Asset Manually' : '➕ Add New Asset'), React.createElement("button", {
    onClick: onClose,
    className: "text-2xl text-gray-500"
  }, "\u2715")), lookingUp ? React.createElement("div", {
    className: "text-center py-8"
  }, React.createElement("div", {
    className: "animate-spin text-4xl mb-4"
  }, "\uD83D\uDD04"), React.createElement("p", null, "Looking up book details...")) : React.createElement("form", {
    onSubmit: handleSubmit,
    className: "space-y-4"
  }, !isManualAdd && React.createElement("div", {
    className: `p-3 rounded-lg ${isAdditionalCopy ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-100'}`
  }, React.createElement("p", {
    className: "text-sm text-gray-600"
  }, "ISBN/Barcode: ", React.createElement("strong", null, barcode)), isAdditionalCopy && React.createElement("p", {
    className: "text-sm text-blue-600 mt-1 font-semibold"
  }, "\uD83D\uDCDA Adding Copy #", copyNumber, " of this book"), lookupResult?.found && !isAdditionalCopy && React.createElement("p", {
    className: "text-sm text-green-600 mt-1"
  }, "\u2713 Book details found!"), lookupResult && !lookupResult.found && !isAdditionalCopy && React.createElement("div", {
    className: "text-sm text-orange-600 mt-1"
  }, React.createElement("p", {
    className: "font-semibold"
  }, "\uD83D\uDCDA Book not found in database."), React.createElement("p", {
    className: "text-xs mt-1"
  }, "Please enter details manually. For multiple copies of same book, add one copy first then use the \"\uD83D\uDCCB Copy\" button."))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Asset Type *"), React.createElement("select", {
    value: assetType,
    onChange: e => setAssetType(e.target.value),
    className: "w-full border-2 px-4 py-3 rounded-xl",
    disabled: isAdditionalCopy
  }, React.createElement("option", {
    value: "book"
  }, "\uD83D\uDCDA Book"), React.createElement("option", {
    value: "chromebook"
  }, "\uD83D\uDCBB Chromebook"))), isManualAdd && React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, assetType === 'book' ? 'ISBN / Barcode (Optional)' : 'Asset ID / Serial (Optional)'), React.createElement("input", {
    type: "text",
    value: manualBarcode,
    onChange: e => setManualBarcode(e.target.value),
    placeholder: assetType === 'book' ? 'e.g., 9781234567890 or leave empty' : 'e.g., CB-001 or leave empty',
    className: "w-full border-2 px-4 py-3 rounded-xl"
  }), React.createElement("p", {
    className: "text-xs text-gray-500 mt-1"
  }, "If left empty, a unique ID will be generated automatically")), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Title *"), React.createElement("input", {
    type: "text",
    value: title,
    onChange: e => setTitle(e.target.value),
    placeholder: "Enter title",
    className: "w-full border-2 px-4 py-3 rounded-xl",
    required: true
  })), assetType === 'book' && React.createElement(React.Fragment, null, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Author"), React.createElement("input", {
    type: "text",
    value: author,
    onChange: e => setAuthor(e.target.value),
    placeholder: "Enter author",
    className: "w-full border-2 px-4 py-3 rounded-xl"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Publisher"), React.createElement("input", {
    type: "text",
    value: publisher,
    onChange: e => setPublisher(e.target.value),
    placeholder: "Enter publisher",
    className: "w-full border-2 px-4 py-3 rounded-xl"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Category"), React.createElement("select", {
    value: category,
    onChange: e => setCategory(e.target.value),
    className: "w-full border-2 px-4 py-3 rounded-xl"
  }, ASSET_CATEGORIES.map(cat => React.createElement("option", {
    key: cat,
    value: cat
  }, cat))))), assetType === 'chromebook' && React.createElement(React.Fragment, null, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Model"), React.createElement("input", {
    type: "text",
    value: model,
    onChange: e => setModel(e.target.value),
    placeholder: "e.g., HP Chromebook 11 G8",
    className: "w-full border-2 px-4 py-3 rounded-xl"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Serial Number"), React.createElement("input", {
    type: "text",
    value: serialNumber,
    onChange: e => setSerialNumber(e.target.value),
    placeholder: "Enter serial number (usually on bottom of device)",
    className: "w-full border-2 px-4 py-3 rounded-xl"
  }))), React.createElement("div", {
    className: "flex gap-3 pt-4"
  }, React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: "flex-1 px-4 py-3 bg-gray-200 rounded-xl font-semibold"
  }, "Cancel"), React.createElement("button", {
    type: "submit",
    className: "flex-1 px-4 py-3 avanti-gradient text-white rounded-xl font-semibold"
  }, "Add Asset")))));
}
function AssignAssetModal({
  asset,
  students,
  onAssign,
  onClose,
  onSelectCopy,
  currentUserSchool
}) {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedCopy, setSelectedCopy] = useState(asset?.docId || '');
  const availableGrades = useMemo(() => {
    const schoolStudents = students.filter(s => s.school === currentUserSchool);
    const grades = [...new Set(schoolStudents.map(s => s.grade || s.class).filter(Boolean))];
    return grades.sort((a, b) => Number(a) - Number(b));
  }, [students, currentUserSchool]);
  const filteredStudents = useMemo(() => {
    let filtered = students.filter(s => s.school === currentUserSchool);
    if (selectedGrade !== 'all') {
      filtered = filtered.filter(s => (s.grade || s.class) === selectedGrade || String(s.grade || s.class) === selectedGrade);
    }
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(s => s.name?.toLowerCase().includes(search) || s.studentId?.toLowerCase().includes(search) || s.id?.toLowerCase().includes(search));
    }
    return filtered;
  }, [students, currentUserSchool, selectedGrade, searchTerm]);
  const hasMultipleCopies = asset?.showCopySelection && asset?.availableCopies?.length > 1;
  const currentAsset = hasMultipleCopies ? asset.availableCopies.find(c => c.docId === selectedCopy) || asset.availableCopies[0] : asset;
  const handleAssign = () => {
    if (!selectedStudent) {
      alert('Please select a student');
      return;
    }
    const student = students.find(s => (s.studentId || s.id) === selectedStudent);
    if (student) {
      if (hasMultipleCopies && onSelectCopy) {
        onSelectCopy(selectedCopy);
      }
      onAssign(student.studentId || student.id, student.name, student.grade || student.class || '', selectedCopy);
    }
  };
  const handleStudentClick = studentId => {
    setSelectedStudent(studentId);
  };
  return React.createElement("div", {
    className: "modal-overlay",
    onClick: onClose
  }, React.createElement("div", {
    className: "modal-content",
    onClick: e => e.stopPropagation(),
    style: {
      maxWidth: '500px'
    }
  }, React.createElement("div", {
    className: "flex justify-between items-center mb-4"
  }, React.createElement("h3", {
    className: "text-xl font-bold"
  }, "\uD83D\uDCDA Assign Asset"), React.createElement("button", {
    onClick: onClose,
    className: "text-2xl text-gray-500 hover:text-gray-700 w-10 h-10 flex items-center justify-center"
  }, "\u2715")), React.createElement("div", {
    className: "bg-blue-50 p-4 rounded-xl mb-4"
  }, React.createElement("p", {
    className: "font-bold text-gray-800"
  }, currentAsset.title), React.createElement("p", {
    className: "text-sm text-gray-600"
  }, currentAsset.assetType === 'book' ? '📚 Book' : '💻 Chromebook', currentAsset.copyNumber && ` • Copy #${currentAsset.copyNumber}`)), hasMultipleCopies && React.createElement("div", {
    className: "mb-4"
  }, React.createElement("label", {
    className: "block text-sm font-bold mb-2 text-gray-700"
  }, "Select Copy (", asset.availableCopies.length, " available)"), React.createElement("select", {
    value: selectedCopy,
    onChange: e => setSelectedCopy(e.target.value),
    className: "w-full border-2 px-4 py-3 rounded-xl bg-green-50 text-base"
  }, asset.availableCopies.map(copy => React.createElement("option", {
    key: copy.docId,
    value: copy.docId
  }, "Copy #", copy.copyNumber || '1', " - ", copy.barcode)))), React.createElement("div", {
    className: "space-y-3"
  }, React.createElement("div", {
    className: "flex gap-2"
  }, React.createElement("div", {
    className: "flex-1"
  }, React.createElement("input", {
    type: "text",
    value: searchTerm,
    onChange: e => setSearchTerm(e.target.value),
    placeholder: "\uD83D\uDD0D Search name or ID...",
    className: "w-full border-2 px-3 py-2.5 rounded-xl text-base"
  })), React.createElement("div", {
    className: "w-32"
  }, React.createElement("select", {
    value: selectedGrade,
    onChange: e => setSelectedGrade(e.target.value),
    className: "w-full border-2 px-2 py-2.5 rounded-xl bg-yellow-50 text-base"
  }, React.createElement("option", {
    value: "all"
  }, "All"), availableGrades.map(grade => React.createElement("option", {
    key: grade,
    value: grade
  }, "Class ", grade))))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2 text-gray-700"
  }, "Select Student *", React.createElement("span", {
    className: "font-normal text-gray-500 ml-1"
  }, "(", filteredStudents.length, " students)")), React.createElement("div", {
    className: "border-2 rounded-xl overflow-hidden",
    style: {
      maxHeight: '280px',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch'
    }
  }, filteredStudents.length === 0 ? React.createElement("div", {
    className: "p-4 text-center text-gray-500"
  }, "No students found. Try adjusting your search or filter.") : filteredStudents.map((student, index) => {
    const studentId = student.studentId || student.id;
    const isSelected = selectedStudent === studentId;
    return React.createElement("div", {
      key: studentId,
      onClick: () => handleStudentClick(studentId),
      onTouchEnd: e => {
        e.preventDefault();
        handleStudentClick(studentId);
      },
      className: `
                        cursor-pointer transition-all duration-150 select-none
                        ${isSelected ? 'bg-green-100 border-l-4 border-green-500' : 'bg-white hover:bg-gray-50 border-l-4 border-transparent'}
                        ${index !== filteredStudents.length - 1 ? 'border-b border-gray-100' : ''}
                      `,
      style: {
        padding: '14px 16px',
        minHeight: '60px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }
    }, React.createElement("div", {
      className: `
                          w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
                          ${isSelected ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'}
                        `
    }, isSelected && React.createElement("svg", {
      className: "w-4 h-4 text-white",
      fill: "none",
      stroke: "currentColor",
      viewBox: "0 0 24 24"
    }, React.createElement("path", {
      strokeLinecap: "round",
      strokeLinejoin: "round",
      strokeWidth: "3",
      d: "M5 13l4 4L19 7"
    }))), React.createElement("div", {
      className: "flex-1 min-w-0"
    }, React.createElement("p", {
      className: `font-semibold truncate ${isSelected ? 'text-green-800' : 'text-gray-800'}`
    }, student.name), React.createElement("p", {
      className: "text-sm text-gray-500 truncate"
    }, "Class ", student.grade || student.class, " \u2022 ", studentId)));
  })), selectedStudent && React.createElement("div", {
    className: "mt-2 p-2 bg-green-50 rounded-lg border border-green-200"
  }, React.createElement("p", {
    className: "text-sm text-green-700 font-medium"
  }, "\u2713 Selected: ", students.find(s => (s.studentId || s.id) === selectedStudent)?.name))), React.createElement("div", {
    className: "flex gap-3 pt-3"
  }, React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: "flex-1 px-4 py-3.5 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700 transition-colors"
  }, "Cancel"), React.createElement("button", {
    type: "button",
    onClick: handleAssign,
    disabled: !selectedStudent,
    className: `
                flex-1 px-4 py-3.5 rounded-xl font-semibold transition-colors
                ${selectedStudent ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
              `
  }, selectedStudent ? '✓ Assign' : 'Select Student')))));
}
function AssetManagement({
  currentUser,
  students
}) {
  const [activeSubTab, setActiveSubTab] = useState('inventory');
  const [assets, setAssets] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [bookRequests, setBookRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [scanMode, setScanMode] = useState('add');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [bookLookupResult, setBookLookupResult] = useState(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const mySchool = currentUser.school;
  useEffect(() => {
    const fetchData = async () => {
      try {
        const assetsSnap = await db.collection('assets').where('school', '==', mySchool).get();
        setAssets(assetsSnap.docs.map(d => ({
          ...d.data(),
          docId: d.id
        })));
        const assignmentsSnap = await db.collection('assetAssignments').where('school', '==', mySchool).get();
        setAssignments(assignmentsSnap.docs.map(d => ({
          ...d.data(),
          docId: d.id
        })));
        const requestsSnap = await db.collection('bookRequests').where('school', '==', mySchool).where('status', '==', 'pending').get();
        setBookRequests(requestsSnap.docs.map(d => ({
          ...d.data(),
          docId: d.id
        })));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching assets:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, [mySchool]);
  const handleScanSuccess = async barcode => {
    setScannedBarcode(barcode);
    setShowScanner(false);
    if (scanMode === 'add') {
      const baseBarcode = barcode.split('-copy-')[0];
      const existingCopies = assets.filter(a => a.barcode === barcode || a.barcode.startsWith(baseBarcode + '-copy-') || a.isbn === barcode);
      if (existingCopies.length > 0) {
        const firstCopy = existingCopies[0];
        const addMore = confirm(`"${firstCopy.title}" already exists (${existingCopies.length} copies).\n\n` + `Do you want to add another copy?\n\n` + `Click OK to add copy #${existingCopies.length + 1}, or Cancel to skip.`);
        if (addMore) {
          const nextCopyNum = existingCopies.length + 1;
          setBookLookupResult({
            found: true,
            title: firstCopy.title,
            author: firstCopy.author || '',
            publisher: firstCopy.publisher || '',
            isbn: barcode,
            copyNumber: nextCopyNum,
            isAdditionalCopy: true
          });
          setShowAddModal(true);
        }
        return;
      }
      if (barcode.startsWith('978') || barcode.startsWith('979')) {
        setLookingUp(true);
        const result = await lookupISBN(barcode);
        setBookLookupResult({
          ...result,
          copyNumber: 1
        });
        setLookingUp(false);
      } else {
        setBookLookupResult({
          found: false,
          isbn: barcode,
          copyNumber: 1
        });
      }
      setShowAddModal(true);
    } else if (scanMode === 'assign') {
      const baseBarcode = barcode.split('-copy-')[0];
      const matchingAssets = assets.filter(a => a.barcode === barcode || a.barcode.startsWith(baseBarcode + '-copy-') || a.isbn === barcode);
      if (matchingAssets.length === 0) {
        alert('Asset not found! Add it first.');
        return;
      }
      const availableCopies = matchingAssets.filter(a => a.status === 'available');
      if (availableCopies.length === 0) {
        alert(`All copies of "${matchingAssets[0].title}" are currently assigned.\n\nTotal copies: ${matchingAssets.length}\nAssigned: ${matchingAssets.length}`);
        return;
      }
      if (availableCopies.length === 1) {
        setSelectedAsset(availableCopies[0]);
        setShowAssignModal(true);
      } else {
        setSelectedAsset({
          ...availableCopies[0],
          availableCopies: availableCopies,
          showCopySelection: true
        });
        setShowAssignModal(true);
      }
    } else if (scanMode === 'return') {
      const baseBarcode = barcode.split('-copy-')[0];
      const matchingAssets = assets.filter(a => (a.barcode === barcode || a.barcode.startsWith(baseBarcode + '-copy-') || a.isbn === barcode) && a.status === 'assigned');
      if (matchingAssets.length === 0) {
        const anyMatch = assets.find(a => a.barcode === barcode || a.isbn === barcode);
        if (anyMatch) {
          alert('This asset is not currently assigned to anyone.');
        } else {
          alert('Asset not found!');
        }
        return;
      }
      if (matchingAssets.length === 1) {
        handleReturnAsset(matchingAssets[0]);
      } else {
        const copyList = matchingAssets.map((a, i) => `${i + 1}. Copy #${a.copyNumber || '?'} - ${a.currentAssignee?.studentName || 'Unknown'}`).join('\n');
        const choice = prompt(`Multiple copies are assigned:\n\n${copyList}\n\n` + `Enter the number (1-${matchingAssets.length}) of the copy being returned:`);
        if (choice && !isNaN(choice)) {
          const index = parseInt(choice) - 1;
          if (index >= 0 && index < matchingAssets.length) {
            handleReturnAsset(matchingAssets[index]);
          }
        }
      }
    }
  };
  const handleAddAsset = async assetData => {
    try {
      const newAsset = {
        ...assetData,
        school: mySchool,
        status: 'available',
        currentAssignee: null,
        addedBy: currentUser.id || currentUser.name,
        addedByName: currentUser.name,
        addedDate: new Date().toISOString(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      const docRef = await db.collection('assets').add(newAsset);
      setAssets([...assets, {
        ...newAsset,
        docId: docRef.id
      }]);
      setShowAddModal(false);
      setScannedBarcode('');
      setBookLookupResult(null);
      alert('Asset added!');
    } catch (error) {
      console.error('Error adding asset:', error);
      alert('Error adding asset.');
    }
  };
  const handleAssignAsset = async (studentId, studentName, studentClass, selectedCopyId = null) => {
    try {
      const assetToAssign = selectedCopyId ? selectedAsset.availableCopies?.find(c => c.docId === selectedCopyId) || selectedAsset : selectedAsset;
      const now = new Date();
      const assignment = {
        assetId: assetToAssign.docId,
        assetType: assetToAssign.assetType,
        assetTitle: assetToAssign.title,
        barcode: assetToAssign.barcode,
        copyNumber: assetToAssign.copyNumber || 1,
        studentId,
        studentName,
        studentClass,
        school: mySchool,
        assignedBy: currentUser.id || currentUser.name,
        assignedByName: currentUser.name,
        assignedDate: now.toISOString(),
        returnedDate: null,
        status: 'active',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      const assignmentRef = await db.collection('assetAssignments').add(assignment);
      await db.collection('assets').doc(assetToAssign.docId).update({
        status: 'assigned',
        currentAssignee: {
          studentId,
          studentName,
          assignedDate: now.toISOString(),
          assignmentId: assignmentRef.id
        }
      });
      setAssets(assets.map(a => a.docId === assetToAssign.docId ? {
        ...a,
        status: 'assigned',
        currentAssignee: {
          studentId,
          studentName,
          assignedDate: now.toISOString()
        }
      } : a));
      setAssignments([...assignments, {
        ...assignment,
        docId: assignmentRef.id
      }]);
      setShowAssignModal(false);
      setSelectedAsset(null);
      const copyInfo = assetToAssign.copyNumber ? ` (Copy #${assetToAssign.copyNumber})` : '';
      alert(`"${assetToAssign.title}"${copyInfo} assigned to ${studentName}!`);
    } catch (error) {
      console.error('Error assigning:', error);
      alert('Error assigning asset.');
    }
  };
  const handleReturnAsset = async asset => {
    if (!confirm(`Return "${asset.title}" from ${asset.currentAssignee?.studentName}?`)) return;
    try {
      const now = new Date().toISOString();
      const activeAssignment = assignments.find(a => a.assetId === asset.docId && a.status !== 'returned');
      if (activeAssignment) {
        await db.collection('assetAssignments').doc(activeAssignment.docId).update({
          returnedDate: now,
          returnedTo: currentUser.id || currentUser.name,
          status: 'returned'
        });
        setAssignments(assignments.map(a => a.docId === activeAssignment.docId ? {
          ...a,
          returnedDate: now,
          status: 'returned'
        } : a));
      }
      await db.collection('assets').doc(asset.docId).update({
        status: 'available',
        currentAssignee: null
      });
      setAssets(assets.map(a => a.docId === asset.docId ? {
        ...a,
        status: 'available',
        currentAssignee: null
      } : a));
      alert('Returned!');
    } catch (error) {
      console.error('Error returning:', error);
      alert('Error returning asset.');
    }
  };
  const handleBookRequest = async (requestId, action, remarks = '') => {
    try {
      await db.collection('bookRequests').doc(requestId).update({
        status: action,
        processedBy: currentUser.id || currentUser.name,
        processedByName: currentUser.name,
        processedDate: new Date().toISOString(),
        remarks
      });
      setBookRequests(bookRequests.filter(r => r.docId !== requestId));
      alert(`Request ${action}!`);
    } catch (error) {
      console.error('Error:', error);
      alert('Error processing request.');
    }
  };
  const handleDuplicateAsset = async asset => {
    const baseISBN = asset.isbn || asset.barcode.split('-copy-')[0];
    const existingCopies = assets.filter(a => a.isbn === baseISBN || a.barcode === baseISBN || a.barcode.startsWith(baseISBN + '-copy-'));
    const nextCopyNum = existingCopies.length + 1;
    setScannedBarcode(baseISBN);
    setBookLookupResult({
      found: true,
      title: asset.title,
      author: asset.author || '',
      publisher: asset.publisher || '',
      category: asset.category || 'Other',
      isbn: baseISBN,
      copyNumber: nextCopyNum,
      isAdditionalCopy: true
    });
    setShowAddModal(true);
  };
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      if (filterType !== 'all' && asset.assetType !== filterType) return false;
      if (filterStatus !== 'all' && asset.status !== filterStatus) return false;
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return asset.title?.toLowerCase().includes(search) || asset.author?.toLowerCase().includes(search) || asset.barcode?.includes(search) || asset.currentAssignee?.studentName?.toLowerCase().includes(search);
      }
      return true;
    });
  }, [assets, filterType, filterStatus, searchTerm]);
  const stats = useMemo(() => ({
    total: assets.length,
    available: assets.filter(a => a.status === 'available').length,
    assigned: assets.filter(a => a.status === 'assigned').length,
    books: assets.filter(a => a.assetType === 'book').length,
    chromebooks: assets.filter(a => a.assetType === 'chromebook').length,
    pendingRequests: bookRequests.length
  }), [assets, bookRequests]);
  if (loading) return React.createElement("div", {
    className: "text-center py-8"
  }, "Loading assets...");
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("div", {
    className: "flex flex-col gap-4"
  }, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "\uD83D\uDCDA Asset Management"), React.createElement("div", {
    className: "flex gap-2 flex-wrap"
  }, React.createElement("button", {
    onClick: () => {
      setScanMode('add');
      setShowScanner(true);
    },
    className: "px-4 py-2 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600"
  }, "\uD83D\uDCF7 Scan & Add"), React.createElement("button", {
    onClick: () => {
      setScannedBarcode('MANUAL-' + Date.now());
      setBookLookupResult({
        found: false
      });
      setShowAddModal(true);
    },
    className: "px-4 py-2 bg-purple-500 text-white rounded-xl font-semibold hover:bg-purple-600"
  }, "\u270F\uFE0F Manual Add"), React.createElement("button", {
    onClick: () => {
      setScanMode('assign');
      setShowScanner(true);
    },
    className: "px-4 py-2 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600"
  }, "\uD83D\uDCE4 Assign"), React.createElement("button", {
    onClick: () => {
      setScanMode('return');
      setShowScanner(true);
    },
    className: "px-4 py-2 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600"
  }, "\uD83D\uDCE5 Return"))), React.createElement("div", {
    className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
  }, React.createElement("div", {
    className: "stat-card bg-gradient-to-br from-blue-500 to-blue-600 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Total"), React.createElement("div", {
    className: "text-3xl font-bold"
  }, stats.total)), React.createElement("div", {
    className: "stat-card bg-gradient-to-br from-green-500 to-green-600 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Available"), React.createElement("div", {
    className: "text-3xl font-bold"
  }, stats.available)), React.createElement("div", {
    className: "stat-card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Assigned"), React.createElement("div", {
    className: "text-3xl font-bold"
  }, stats.assigned)), React.createElement("div", {
    className: "stat-card bg-gradient-to-br from-purple-500 to-purple-600 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Books"), React.createElement("div", {
    className: "text-3xl font-bold"
  }, stats.books)), React.createElement("div", {
    className: "stat-card bg-gradient-to-br from-teal-500 to-teal-600 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Chromebooks"), React.createElement("div", {
    className: "text-3xl font-bold"
  }, stats.chromebooks)), React.createElement("div", {
    className: "stat-card bg-gradient-to-br from-orange-500 to-orange-600 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Requests"), React.createElement("div", {
    className: "text-3xl font-bold"
  }, stats.pendingRequests))), React.createElement("div", {
    className: "flex gap-2 overflow-x-auto pb-2"
  }, ['inventory', 'assigned', 'requests', 'history'].map(tab => React.createElement("button", {
    key: tab,
    onClick: () => setActiveSubTab(tab),
    className: `px-4 py-2 rounded-xl font-semibold whitespace-nowrap ${activeSubTab === tab ? 'avanti-gradient text-white' : 'bg-white'}`
  }, tab === 'inventory' && '📦 Inventory', tab === 'assigned' && '📤 Assigned', tab === 'requests' && `📝 Requests (${stats.pendingRequests})`, tab === 'history' && '📜 History'))), activeSubTab === 'inventory' && React.createElement("div", {
    className: "space-y-4"
  }, React.createElement("div", {
    className: "bg-white p-4 rounded-xl shadow-lg"
  }, React.createElement("div", {
    className: "grid md:grid-cols-4 gap-4"
  }, React.createElement("input", {
    type: "text",
    value: searchTerm,
    onChange: e => setSearchTerm(e.target.value),
    placeholder: "Search...",
    className: "border-2 px-4 py-2 rounded-xl"
  }), React.createElement("select", {
    value: filterType,
    onChange: e => setFilterType(e.target.value),
    className: "border-2 px-4 py-2 rounded-xl"
  }, React.createElement("option", {
    value: "all"
  }, "All Types"), React.createElement("option", {
    value: "book"
  }, "Books"), React.createElement("option", {
    value: "chromebook"
  }, "Chromebooks")), React.createElement("select", {
    value: filterStatus,
    onChange: e => setFilterStatus(e.target.value),
    className: "border-2 px-4 py-2 rounded-xl"
  }, React.createElement("option", {
    value: "all"
  }, "All Status"), React.createElement("option", {
    value: "available"
  }, "Available"), React.createElement("option", {
    value: "assigned"
  }, "Assigned")), React.createElement("button", {
    onClick: () => {
      setSearchTerm('');
      setFilterType('all');
      setFilterStatus('all');
    },
    className: "px-4 py-2 bg-gray-200 rounded-xl"
  }, "Clear"))), React.createElement("div", {
    className: "grid md:grid-cols-2 lg:grid-cols-3 gap-4"
  }, filteredAssets.length === 0 ? React.createElement("div", {
    className: "col-span-full text-center py-8 text-gray-500"
  }, "No assets found. Click \"Scan & Add\" or \"Manual Add\" to start.") : filteredAssets.map(asset => React.createElement("div", {
    key: asset.docId,
    className: `asset-card ${asset.assetType}`
  }, React.createElement("div", {
    className: "flex justify-between items-start mb-2"
  }, React.createElement("span", {
    className: `asset-badge badge-${asset.status === 'available' ? 'available' : 'assigned'}`
  }, asset.assetType === 'book' ? '📚' : '💻', " ", asset.assetType, asset.copyNumber && asset.copyNumber > 1 && ` #${asset.copyNumber}`), React.createElement("span", {
    className: `asset-badge badge-${asset.status}`
  }, asset.status)), React.createElement("h4", {
    className: "font-bold text-lg mb-1"
  }, asset.title), asset.author && React.createElement("p", {
    className: "text-sm text-gray-600"
  }, "by ", asset.author), React.createElement("p", {
    className: "text-xs text-gray-500 mt-2"
  }, asset.copyNumber ? `Copy #${asset.copyNumber} • ` : '', asset.isbn || asset.barcode), asset.status === 'assigned' && asset.currentAssignee && React.createElement("div", {
    className: "mt-3 p-2 bg-yellow-50 rounded-lg"
  }, React.createElement("p", {
    className: "text-sm font-semibold"
  }, "Assigned to: ", asset.currentAssignee.studentName), React.createElement("p", {
    className: "text-xs text-gray-600"
  }, "Since: ", new Date(asset.currentAssignee.assignedDate).toLocaleDateString())), React.createElement("div", {
    className: "mt-3 flex gap-2"
  }, asset.status === 'available' ? React.createElement("button", {
    onClick: () => {
      setSelectedAsset(asset);
      setShowAssignModal(true);
    },
    className: "flex-1 px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold"
  }, "Assign") : React.createElement("button", {
    onClick: () => handleReturnAsset(asset),
    className: "flex-1 px-3 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold"
  }, "Return"), asset.assetType === 'book' && React.createElement("button", {
    onClick: () => handleDuplicateAsset(asset),
    className: "px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold",
    title: "Add another copy of this book"
  }, "\uD83D\uDCCB Copy")))))), activeSubTab === 'assigned' && React.createElement("div", {
    className: "bg-white p-6 rounded-xl shadow-lg overflow-x-auto"
  }, React.createElement("h3", {
    className: "font-bold text-xl mb-4"
  }, "Currently Assigned"), React.createElement("table", {
    className: "w-full"
  }, React.createElement("thead", {
    className: "avanti-gradient-light"
  }, React.createElement("tr", null, React.createElement("th", {
    className: "p-3 text-left"
  }, "Asset"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Type"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Student"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Assigned"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Status"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Action"))), React.createElement("tbody", null, assignments.filter(a => a.status !== 'returned').length === 0 ? React.createElement("tr", null, React.createElement("td", {
    colSpan: "6",
    className: "p-8 text-center text-gray-500"
  }, "No assets assigned")) : assignments.filter(a => a.status !== 'returned').sort((a, b) => new Date(b.assignedDate) - new Date(a.assignedDate)).map(assignment => {
    return React.createElement("tr", {
      key: assignment.docId,
      className: "border-b hover:bg-gray-50"
    }, React.createElement("td", {
      className: "p-3 font-semibold"
    }, assignment.assetTitle), React.createElement("td", {
      className: "p-3"
    }, assignment.assetType), React.createElement("td", {
      className: "p-3"
    }, assignment.studentName), React.createElement("td", {
      className: "p-3 text-sm"
    }, new Date(assignment.assignedDate).toLocaleDateString()), React.createElement("td", {
      className: "p-3"
    }, React.createElement("span", {
      className: "asset-badge badge-assigned"
    }, "Active")), React.createElement("td", {
      className: "p-3"
    }, React.createElement("button", {
      onClick: () => {
        const a = assets.find(x => x.docId === assignment.assetId);
        if (a) handleReturnAsset(a);
      },
      className: "px-3 py-1 bg-orange-500 text-white rounded-lg text-sm"
    }, "Return")));
  })))), activeSubTab === 'requests' && React.createElement("div", {
    className: "bg-white p-6 rounded-xl shadow-lg"
  }, React.createElement("h3", {
    className: "font-bold text-xl mb-4"
  }, "\uD83D\uDCDD Pending Requests"), bookRequests.length === 0 ? React.createElement("p", {
    className: "text-center py-8 text-gray-500"
  }, "No pending requests") : React.createElement("div", {
    className: "space-y-4"
  }, bookRequests.map(request => React.createElement("div", {
    key: request.docId,
    className: "request-card pending"
  }, React.createElement("div", {
    className: "flex justify-between items-start flex-wrap gap-4"
  }, React.createElement("div", null, React.createElement("span", {
    className: "asset-badge badge-assigned mb-2"
  }, request.requestType === 'existing' ? 'Library Book' : 'New Book'), React.createElement("h4", {
    className: "font-bold text-lg"
  }, request.requestType === 'existing' ? request.assetTitle : request.requestedTitle), React.createElement("p", {
    className: "text-sm text-gray-600"
  }, "By: ", request.studentName), React.createElement("p", {
    className: "text-sm text-gray-600"
  }, "Date: ", new Date(request.requestDate).toLocaleDateString()), request.reason && React.createElement("p", {
    className: "text-sm mt-2 italic"
  }, "\"", request.reason, "\"")), React.createElement("div", {
    className: "flex gap-2"
  }, React.createElement("button", {
    onClick: () => handleBookRequest(request.docId, 'approved'),
    className: "px-4 py-2 bg-green-500 text-white rounded-lg font-semibold"
  }, "Approve"), React.createElement("button", {
    onClick: () => {
      const r = prompt('Reason (optional):');
      handleBookRequest(request.docId, 'rejected', r || '');
    },
    className: "px-4 py-2 bg-red-500 text-white rounded-lg font-semibold"
  }, "Reject"))))))), activeSubTab === 'history' && React.createElement("div", {
    className: "bg-white p-6 rounded-xl shadow-lg overflow-x-auto"
  }, React.createElement("h3", {
    className: "font-bold text-xl mb-4"
  }, "\uD83D\uDCDC History"), React.createElement("table", {
    className: "w-full"
  }, React.createElement("thead", {
    className: "avanti-gradient-light"
  }, React.createElement("tr", null, React.createElement("th", {
    className: "p-3 text-left"
  }, "Asset"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Student"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Assigned"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Returned"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Duration"))), React.createElement("tbody", null, assignments.filter(a => a.status === 'returned').sort((a, b) => new Date(b.returnedDate) - new Date(a.returnedDate)).slice(0, 50).map(assignment => {
    const duration = Math.ceil((new Date(assignment.returnedDate) - new Date(assignment.assignedDate)) / (1000 * 60 * 60 * 24));
    return React.createElement("tr", {
      key: assignment.docId,
      className: "border-b"
    }, React.createElement("td", {
      className: "p-3 font-semibold"
    }, assignment.assetTitle), React.createElement("td", {
      className: "p-3"
    }, assignment.studentName), React.createElement("td", {
      className: "p-3 text-sm"
    }, new Date(assignment.assignedDate).toLocaleDateString()), React.createElement("td", {
      className: "p-3 text-sm"
    }, new Date(assignment.returnedDate).toLocaleDateString()), React.createElement("td", {
      className: "p-3 text-sm"
    }, duration, " days"));
  })))), showScanner && React.createElement(BarcodeScanner, {
    key: `scanner-${Date.now()}`,
    onScanSuccess: handleScanSuccess,
    onClose: () => setShowScanner(false)
  }), showAddModal && React.createElement(AddAssetModal, {
    barcode: scannedBarcode,
    lookupResult: bookLookupResult,
    lookingUp: lookingUp,
    onSave: handleAddAsset,
    onClose: () => {
      setShowAddModal(false);
      setScannedBarcode('');
      setBookLookupResult(null);
    }
  }), showAssignModal && selectedAsset && React.createElement(AssignAssetModal, {
    asset: selectedAsset,
    students: students,
    currentUserSchool: mySchool,
    onAssign: handleAssignAsset,
    onClose: () => {
      setShowAssignModal(false);
      setSelectedAsset(null);
    }
  }));
}
function StudentAssets({
  currentUser
}) {
  const [myAssets, setMyAssets] = useState([]);
  const [assetHistory, setAssetHistory] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [availableBooks, setAvailableBooks] = useState([]);
  const myId = currentUser.studentId || currentUser.id;
  const mySchool = currentUser.school;
  useEffect(() => {
    const fetchData = async () => {
      try {
        const currentSnap = await db.collection('assetAssignments').where('studentId', '==', String(myId)).where('status', 'in', ['active', 'overdue']).get();
        setMyAssets(currentSnap.docs.map(d => ({
          ...d.data(),
          docId: d.id
        })));
        const historySnap = await db.collection('assetAssignments').where('studentId', '==', String(myId)).where('status', '==', 'returned').get();
        setAssetHistory(historySnap.docs.map(d => ({
          ...d.data(),
          docId: d.id
        })));
        const requestsSnap = await db.collection('bookRequests').where('studentId', '==', String(myId)).get();
        setMyRequests(requestsSnap.docs.map(d => ({
          ...d.data(),
          docId: d.id
        })));
        const booksSnap = await db.collection('assets').where('school', '==', mySchool).where('status', '==', 'available').where('assetType', '==', 'book').get();
        setAvailableBooks(booksSnap.docs.map(d => ({
          ...d.data(),
          docId: d.id
        })));
        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, [myId, mySchool]);
  const handleRequestBook = async requestData => {
    try {
      const request = {
        ...requestData,
        studentId: String(myId),
        studentName: currentUser.name,
        school: mySchool,
        requestDate: new Date().toISOString(),
        status: 'pending',
        processedBy: null,
        processedDate: null,
        remarks: '',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      const docRef = await db.collection('bookRequests').add(request);
      setMyRequests([...myRequests, {
        ...request,
        docId: docRef.id
      }]);
      setShowRequestModal(false);
      alert('Request submitted!');
    } catch (error) {
      console.error('Error:', error);
      alert('Error submitting request.');
    }
  };
  if (loading) return React.createElement("div", {
    className: "text-center py-8"
  }, "Loading...");
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("div", {
    className: "flex justify-between items-center"
  }, React.createElement("h2", {
    className: "text-2xl font-bold"
  }, "\uD83D\uDCDA My Assets"), React.createElement("button", {
    onClick: () => setShowRequestModal(true),
    className: "px-4 py-2 avanti-gradient text-white rounded-xl font-semibold"
  }, "\uD83D\uDCDD Request Book")), React.createElement("div", {
    className: "bg-white p-6 rounded-xl shadow-lg"
  }, React.createElement("h3", {
    className: "font-bold text-xl mb-4"
  }, "\uD83D\uDCE6 Currently With Me"), myAssets.length === 0 ? React.createElement("p", {
    className: "text-gray-500 text-center py-4"
  }, "No assets assigned to you.") : React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4"
  }, myAssets.map(asset => {
    return React.createElement("div", {
      key: asset.docId,
      className: `asset-card ${asset.assetType}`
    }, React.createElement("div", {
      className: "flex justify-between items-start mb-2"
    }, React.createElement("span", {
      className: `asset-badge ${asset.assetType === 'book' ? 'badge-available' : 'badge-assigned'}`
    }, asset.assetType === 'book' ? '📚 Book' : '💻 Chromebook')), React.createElement("h4", {
      className: "font-bold text-lg"
    }, asset.assetTitle), React.createElement("p", {
      className: "text-sm text-gray-600"
    }, "Assigned: ", new Date(asset.assignedDate).toLocaleDateString()));
  }))), React.createElement("div", {
    className: "bg-white p-6 rounded-xl shadow-lg"
  }, React.createElement("h3", {
    className: "font-bold text-xl mb-4"
  }, "\uD83D\uDCDD My Requests"), myRequests.length === 0 ? React.createElement("p", {
    className: "text-gray-500 text-center py-4"
  }, "No requests yet.") : React.createElement("div", {
    className: "space-y-3"
  }, myRequests.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate)).map(request => React.createElement("div", {
    key: request.docId,
    className: `request-card ${request.status}`
  }, React.createElement("div", {
    className: "flex justify-between items-start"
  }, React.createElement("div", null, React.createElement("h4", {
    className: "font-bold"
  }, request.requestType === 'existing' ? request.assetTitle : request.requestedTitle), React.createElement("p", {
    className: "text-sm text-gray-600"
  }, "Requested: ", new Date(request.requestDate).toLocaleDateString())), React.createElement("span", {
    className: `asset-badge ${request.status === 'pending' ? 'badge-assigned' : request.status === 'approved' ? 'badge-available' : 'badge-overdue'}`
  }, request.status.toUpperCase())), request.remarks && React.createElement("p", {
    className: "text-sm mt-2 italic text-gray-600"
  }, "\"", request.remarks, "\""))))), React.createElement("div", {
    className: "bg-white p-6 rounded-xl shadow-lg"
  }, React.createElement("h3", {
    className: "font-bold text-xl mb-4"
  }, "\uD83D\uDCDC Previously Borrowed"), assetHistory.length === 0 ? React.createElement("p", {
    className: "text-gray-500 text-center py-4"
  }, "No history yet.") : React.createElement("div", {
    className: "overflow-x-auto"
  }, React.createElement("table", {
    className: "w-full"
  }, React.createElement("thead", {
    className: "avanti-gradient-light"
  }, React.createElement("tr", null, React.createElement("th", {
    className: "p-3 text-left"
  }, "Asset"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Type"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Borrowed"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Returned"))), React.createElement("tbody", null, assetHistory.sort((a, b) => new Date(b.returnedDate) - new Date(a.returnedDate)).map(item => React.createElement("tr", {
    key: item.docId,
    className: "border-b"
  }, React.createElement("td", {
    className: "p-3 font-semibold"
  }, item.assetTitle), React.createElement("td", {
    className: "p-3"
  }, item.assetType), React.createElement("td", {
    className: "p-3 text-sm"
  }, new Date(item.assignedDate).toLocaleDateString()), React.createElement("td", {
    className: "p-3 text-sm"
  }, new Date(item.returnedDate).toLocaleDateString()))))))), showRequestModal && React.createElement(BookRequestModal, {
    availableBooks: availableBooks,
    onSubmit: handleRequestBook,
    onClose: () => setShowRequestModal(false)
  }));
}
function BookRequestModal({
  availableBooks,
  onSubmit,
  onClose
}) {
  const [requestType, setRequestType] = useState('existing');
  const [selectedBook, setSelectedBook] = useState('');
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [reason, setReason] = useState('');
  const handleSubmit = e => {
    e.preventDefault();
    if (requestType === 'existing') {
      if (!selectedBook) {
        alert('Please select a book');
        return;
      }
      const book = availableBooks.find(b => b.docId === selectedBook);
      onSubmit({
        requestType: 'existing',
        assetId: selectedBook,
        assetTitle: book?.title || '',
        reason
      });
    } else {
      if (!newBookTitle.trim()) {
        alert('Please enter book title');
        return;
      }
      onSubmit({
        requestType: 'new',
        requestedTitle: newBookTitle.trim(),
        requestedAuthor: newBookAuthor.trim(),
        reason
      });
    }
  };
  return React.createElement("div", {
    className: "modal-overlay",
    onClick: onClose
  }, React.createElement("div", {
    className: "modal-content",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "flex justify-between items-center mb-4"
  }, React.createElement("h3", {
    className: "text-xl font-bold"
  }, "\uD83D\uDCDD Request a Book"), React.createElement("button", {
    onClick: onClose,
    className: "text-2xl text-gray-500"
  }, "\u2715")), React.createElement("form", {
    onSubmit: handleSubmit,
    className: "space-y-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Request Type"), React.createElement("div", {
    className: "flex gap-4"
  }, React.createElement("label", {
    className: "flex items-center gap-2 cursor-pointer"
  }, React.createElement("input", {
    type: "radio",
    value: "existing",
    checked: requestType === 'existing',
    onChange: e => setRequestType(e.target.value),
    className: "w-4 h-4"
  }), React.createElement("span", null, "From Library")), React.createElement("label", {
    className: "flex items-center gap-2 cursor-pointer"
  }, React.createElement("input", {
    type: "radio",
    value: "new",
    checked: requestType === 'new',
    onChange: e => setRequestType(e.target.value),
    className: "w-4 h-4"
  }), React.createElement("span", null, "Request New Book")))), requestType === 'existing' ? React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Select Book *"), availableBooks.length === 0 ? React.createElement("p", {
    className: "text-gray-500 italic"
  }, "No books available.") : React.createElement("select", {
    value: selectedBook,
    onChange: e => setSelectedBook(e.target.value),
    className: "w-full border-2 px-4 py-3 rounded-xl",
    size: 5
  }, React.createElement("option", {
    value: ""
  }, "-- Select --"), availableBooks.map(book => React.createElement("option", {
    key: book.docId,
    value: book.docId
  }, book.title, " ", book.author ? `by ${book.author}` : '')))) : React.createElement(React.Fragment, null, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Book Title *"), React.createElement("input", {
    type: "text",
    value: newBookTitle,
    onChange: e => setNewBookTitle(e.target.value),
    placeholder: "Enter book title",
    className: "w-full border-2 px-4 py-3 rounded-xl",
    required: true
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Author (Optional)"), React.createElement("input", {
    type: "text",
    value: newBookAuthor,
    onChange: e => setNewBookAuthor(e.target.value),
    placeholder: "Enter author",
    className: "w-full border-2 px-4 py-3 rounded-xl"
  }))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Reason (Optional)"), React.createElement("textarea", {
    value: reason,
    onChange: e => setReason(e.target.value),
    placeholder: "Why do you need this book?",
    className: "w-full border-2 px-4 py-3 rounded-xl",
    rows: 3
  })), React.createElement("div", {
    className: "flex gap-3 pt-4"
  }, React.createElement("button", {
    type: "button",
    onClick: onClose,
    className: "flex-1 px-4 py-3 bg-gray-200 rounded-xl font-semibold"
  }, "Cancel"), React.createElement("button", {
    type: "submit",
    className: "flex-1 px-4 py-3 avanti-gradient text-white rounded-xl font-semibold"
  }, "Submit")))));
}
function StudentDashboard({
  currentUser,
  handleLogout
}) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [curriculum, setCurriculum] = useState({});
  const [chapterProgress, setChapterProgress] = useState({});
  const [studentAttendance, setStudentAttendance] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [studentProfile, setStudentProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    grade: '',
    category: '',
    stream: '',
    school: '',
    fatherName: '',
    motherName: '',
    fatherOccupation: '',
    motherOccupation: '',
    fatherEducation: '',
    motherEducation: '',
    familyIncome: '',
    address: '',
    state: '',
    district: '',
    pincode: '',
    whatsappNumber: '',
    percentage10th: ''
  });
  const [examRegistrations, setExamRegistrations] = useState(null);
  const [teacherFeedbacks, setTeacherFeedbacks] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showTeacherProfile, setShowTeacherProfile] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showFeedbackNotification, setShowFeedbackNotification] = useState(false);
  const mySchool = currentUser.school;
  const myGrade = currentUser.grade;
  const myId = currentUser.studentId || currentUser.id;
  useEffect(() => {
    const fetchData = async () => {
      const teacherCacheKey = `teachers_${mySchool}`;
      let hasLoadedFromCache = false;
      
      // ✅ FIX: Load ALL cached data FIRST (instant display)
      try {
        const cachedTeachers = localStorage.getItem(teacherCacheKey);
        if (cachedTeachers) {
          const parsed = JSON.parse(cachedTeachers);
          if (parsed.data && Array.isArray(parsed.data) && parsed.data.length > 0) {
            setTeachers(parsed.data);
            hasLoadedFromCache = true;
          }
        }
      } catch (e) {}
      
      try {
        const cachedCurr = localStorage.getItem(`curriculum_${mySchool}_${myGrade}`);
        if (cachedCurr) {
          const parsed = JSON.parse(cachedCurr);
          if (parsed.data) {
            setCurriculum(parsed.data);
            hasLoadedFromCache = true;
          }
        }
      } catch (e) {}
      
      try {
        const cachedAtt = localStorage.getItem(`attendance_${myId}`);
        if (cachedAtt) {
          const parsed = JSON.parse(cachedAtt);
          if (parsed.data) {
            setStudentAttendance(parsed.data);
          }
        }
      } catch (e) {}
      
      // ✅ FIX: Show UI immediately after loading cache
      setLoading(false);
      
      // ✅ FIX: Helper with shorter timeout for student queries
      const queryWithTimeout = (promise, ms = 8000) => {
        return Promise.race([
          promise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
        ]);
      };
      
      // ✅ FIX: Fetch teachers FIRST with priority (most visible on dashboard)
      try {
        const snap = await queryWithTimeout(
          db.collection('teachers').where('school', '==', mySchool).get(),
          6000
        );
        const teachersData = snap.docs.map(d => ({ ...d.data(), docId: d.id }));
        setTeachers(teachersData);
        try {
          localStorage.setItem(teacherCacheKey, JSON.stringify({
            data: teachersData,
            timestamp: Date.now(),
            school: mySchool
          }));
        } catch (e) {}
      } catch (e) {
        // Keep cached data if query fails
      }
      
      // ✅ FIX: Load other data in background (non-blocking)
      Promise.all([
        queryWithTimeout(db.collection('curriculum').get(), 10000).then(snap => {
          const currMap = {};
          snap.docs.forEach(doc => { currMap[doc.id] = doc.data(); });
          setCurriculum(currMap);
          try {
            localStorage.setItem(`curriculum_${mySchool}_${myGrade}`, JSON.stringify({
              data: currMap, timestamp: Date.now()
            }));
          } catch (e) {}
        }).catch(() => {}),
        
        queryWithTimeout(db.collection('chapterProgress').get(), 10000).then(snap => {
          const progressMap = {};
          snap.docs.forEach(d => { progressMap[d.id] = d.data(); });
          setChapterProgress(progressMap);
        }).catch(() => {}),
        
        queryWithTimeout(
          db.collection('studentAttendance').where('studentId', '==', String(myId)).get(),
          10000
        ).then(snap => {
          const attendanceData = snap.docs.map(d => ({
            ...d.data(), docId: d.id
          })).sort((a, b) => b.date.localeCompare(a.date));
          setStudentAttendance(attendanceData);
          try {
            localStorage.setItem(`attendance_${myId}`, JSON.stringify({
              data: attendanceData, timestamp: Date.now()
            }));
          } catch (e) {}
        }).catch(() => {}),
        
        queryWithTimeout(
          db.collection('studentExamRegistrations').doc(myId).get(),
          8000
        ).then(snap => {
          if (snap.exists) setExamRegistrations(snap.data());
        }).catch(() => {})
      ]);
    };
    
    fetchData();
  }, [mySchool, myGrade, myId]);
  const calculateCompletion = () => {
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'dob', 'grade', 'category', 'stream', 'school', 'fatherName', 'motherName', 'fatherOccupation', 'motherOccupation', 'fatherEducation', 'motherEducation', 'familyIncome', 'address', 'state', 'district', 'pincode', 'whatsappNumber', 'percentage10th'];
    const filled = requiredFields.filter(field => studentProfile[field] && String(studentProfile[field]).trim() !== '').length;
    return Math.round(filled / requiredFields.length * 100);
  };
  useEffect(() => {
    if (!myId) return;
    const loadProfile = async () => {
      const cacheKey = `studentProfile_${myId}`;
      
      // ✅ FIX: Load from cache FIRST (instant)
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.data) {
            setStudentProfile(prev => ({ ...prev, ...parsed.data }));
            setProfileLoaded(true);
          }
        }
      } catch (e) {}
      
      // ✅ FIX: Fetch with timeout to prevent hanging
      try {
        const fetchPromise = db.collection('studentProfiles').doc(myId).get();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 8000)
        );
        
        const docSnap = await Promise.race([fetchPromise, timeoutPromise]);
        if (docSnap.exists) {
          const profileData = docSnap.data();
          setStudentProfile(prev => ({ ...prev, ...profileData }));
          setProfileLoaded(true);
          try {
            localStorage.setItem(cacheKey, JSON.stringify({
              data: profileData,
              timestamp: Date.now()
            }));
          } catch (e) {}
        } else {
          setProfileLoaded(true);
        }
      } catch (err) {
        // ✅ FIX: Always mark as loaded even on error/timeout
        setProfileLoaded(true);
      }
    };
    loadProfile();
  }, [myId]);
  
  // ✅ FIX: Fetch feedback only ONCE when myId is available (removed studentProfile dependency)
  useEffect(() => {
    if (!myId) return;
    
    const fetchFeedbackData = async () => {
      try {
        const feedbackSnap = await db.collection('teacherFeedback').where('studentId', '==', myId).get();
        setTeacherFeedbacks(feedbackSnap.docs.map(d => ({
          ...d.data(),
          id: d.id
        })));
      } catch (error) {
        if (error.code === 'permission-denied') {
          // Silent fail - student doesn't have access to this collection
        }
      }
    };
    
    fetchFeedbackData();
    
    // Show feedback notification after 3 seconds (only once)
    const timer = setTimeout(() => setShowFeedbackNotification(true), 3000);
    return () => clearTimeout(timer);
  }, [myId]);
  const getTeacherAverageRating = teacherDocId => {
    const teacherFeedbackList = teacherFeedbacks.filter(f => f.teacherId === teacherDocId);
    if (teacherFeedbackList.length === 0) return null;
    const sum = teacherFeedbackList.reduce((acc, f) => acc + (f.averageRating || 0), 0);
    return sum / teacherFeedbackList.length;
  };
  const handleTeacherClick = teacher => {
    setSelectedTeacher(teacher);
    setShowTeacherProfile(true);
  };
  const handleGiveFeedback = () => {
    setShowTeacherProfile(false);
    setShowFeedbackForm(true);
  };
  const handleFeedbackSubmitSuccess = () => {
    const fetchFeedbackData = async () => {
      const feedbackSnap = await db.collection('teacherFeedback').where('studentId', '==', myId).get();
      setTeacherFeedbacks(feedbackSnap.docs.map(d => ({
        ...d.data(),
        id: d.id
      })));
    };
    fetchFeedbackData();
  };
  const profileCompletion = calculateCompletion();
  if (loading) {
    return React.createElement("div", {
      className: "text-center py-8"
    }, "Loading profile...");
  }
  return React.createElement("div", {
    className: "min-h-screen bg-gray-50 flex flex-col"
  }, React.createElement("nav", {
    className: "avanti-gradient shadow-lg sticky top-0 z-50"
  }, React.createElement("div", {
    className: "max-w-7xl mx-auto px-4 py-4"
  }, React.createElement("div", {
    className: "flex justify-between items-center"
  }, React.createElement("div", {
    className: "flex items-center gap-3"
  }, React.createElement("img", {
    src: AVANTI_LOGO,
    alt: "Avanti",
    className: "w-12 h-12"
  }), React.createElement("div", null, React.createElement("h1", {
    className: "text-2xl font-bold text-white"
  }, "Student Dashboard"), React.createElement("p", {
    className: "text-sm text-white opacity-90"
  }, mySchool))), React.createElement("div", {
    className: "flex items-center gap-4"
  }, React.createElement("div", {
    className: "text-right hidden sm:block"
  }, React.createElement("p", {
    className: "text-white font-semibold"
  }, currentUser.name), React.createElement("p", {
    className: "text-sm text-white opacity-90"
  }, "Class ", myGrade, " \u2022 ID: ", myId)), React.createElement("button", {
    onClick: handleLogout,
    className: "px-4 py-2 bg-white text-gray-800 rounded-xl font-semibold"
  }, "Logout"))))), profileLoaded && profileCompletion < 100 && React.createElement("div", {
    className: "bg-red-500 text-white text-center py-3 px-4"
  }, React.createElement("p", {
    className: "font-bold"
  }, "\u26A0\uFE0F Your profile is ", profileCompletion, "% complete. Please complete your profile!")), React.createElement("div", {
    className: "flex-1 max-w-7xl mx-auto px-4 py-6 w-full"
  }, React.createElement("div", {
    className: "flex gap-3 mb-6 overflow-x-auto pb-2"
  }, ['dashboard', 'profile', 'curriculum', 'attendance', 'assets', 'exams'].map(tab => React.createElement("button", {
    key: tab,
    onClick: () => setActiveTab(tab),
    className: `px-6 py-3 rounded-xl font-semibold whitespace-nowrap ${activeTab === tab ? 'avanti-gradient text-white' : 'bg-white'}`
  }, tab === 'dashboard' && '📊 Dashboard', tab === 'profile' && '👤 My Profile', tab === 'curriculum' && '📚 Curriculum', tab === 'attendance' && '✅ Attendance', tab === 'assets' && '📦 My Assets', tab === 'exams' && '📝 Exam Registration'))), activeTab === 'dashboard' && React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "Welcome, ", currentUser.name, "! \uD83D\uDC4B"), React.createElement("div", {
    className: "grid md:grid-cols-5 gap-4"
  }, React.createElement("div", {
    className: "stat-card bg-blue-500 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "My School"), React.createElement("div", {
    className: "text-xl font-bold"
  }, mySchool)), React.createElement("div", {
    className: "stat-card bg-green-500 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "My Class"), React.createElement("div", {
    className: "text-2xl font-bold"
  }, "Class ", myGrade)), React.createElement("div", {
    className: "stat-card bg-purple-500 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Profile Complete"), React.createElement("div", {
    className: "text-2xl font-bold"
  }, profileCompletion, "%")), React.createElement("div", {
    className: "stat-card bg-green-500 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Days Present"), React.createElement("div", {
    className: "text-2xl font-bold"
  }, studentAttendance.filter(a => a.status === 'Present').length)), React.createElement("div", {
    className: "stat-card bg-red-500 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Days Absent"), React.createElement("div", {
    className: "text-2xl font-bold"
  }, studentAttendance.filter(a => a.status === 'Absent').length))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-2xl font-bold mb-4"
  }, "\uD83D\uDC68\u200D\uD83C\uDFEB My Teachers"), teachers.length === 0 ? React.createElement("p", {
    className: "text-gray-500 text-center py-4"
  }, "No teachers found") : React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4"
  }, SUBJECTS.map(subject => {
    const teacher = teachers.find(t => t.subject === subject && !t.isArchived);
    const archivedTeacher = teachers.find(t => t.subject === subject && t.isArchived);
    const averageRating = teacher ? getTeacherAverageRating(teacher.docId) : null;
    const isVacant = !teacher;
    const wasArchived = !teacher && archivedTeacher;
    return React.createElement("div", {
      key: subject,
      className: `teacher-card border-2 rounded-xl p-4 ${isVacant ? 'bg-yellow-50 border-yellow-300' : ''}`,
      onClick: () => teacher && !teacher.isArchived && handleTeacherClick(teacher)
    }, React.createElement("div", {
      className: "font-bold text-lg"
    }, subject), React.createElement("div", {
      className: "flex items-center justify-between"
    }, React.createElement("div", {
      className: isVacant ? 'text-orange-600 font-medium' : 'text-gray-600'
    }, teacher ? teacher.name : React.createElement("span", null, "\uD83D\uDD38 Vacant", wasArchived && React.createElement("span", {
      className: "text-xs text-gray-500 ml-1"
    }, "(Previously: ", archivedTeacher.name, ")"))), averageRating && React.createElement("div", {
      className: "flex items-center gap-2"
    }, React.createElement("span", {
      className: "text-yellow-500 font-bold"
    }, "\u2605"), React.createElement("span", {
      className: "font-semibold"
    }, averageRating.toFixed(1)))), teacher && !teacher.isArchived && React.createElement("div", {
      className: "text-sm text-blue-600 mt-2"
    }, "Click to view profile \u2192"), isVacant && React.createElement("div", {
      className: "text-sm text-orange-500 mt-2"
    }, "New teacher to be assigned"));
  }))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-2xl font-bold mb-4"
  }, "\uD83D\uDCDA Pending Chapters"), SUBJECTS.map(subject => {
    const docId = `${mySchool}_${subject}_${myGrade}`;
    const chapters = curriculum[docId]?.chapters || [];
    const pendingChapters = chapters.filter(ch => {
      const progressId = `${mySchool}_${ch.id}`;
      const prog = chapterProgress[progressId] || {};
      return prog.completed !== 'Yes';
    });
    if (pendingChapters.length === 0) return null;
    return React.createElement("div", {
      key: subject,
      className: "mb-4"
    }, React.createElement("h4", {
      className: "font-bold text-lg mb-2"
    }, subject, " (", pendingChapters.length, " pending)"), React.createElement("ul", {
      className: "list-disc list-inside space-y-1"
    }, pendingChapters.slice(0, 5).map(ch => React.createElement("li", {
      key: ch.id,
      className: "text-gray-700"
    }, ch.name)), pendingChapters.length > 5 && React.createElement("li", {
      className: "text-gray-500 italic"
    }, "...and ", pendingChapters.length - 5, " more")));
  }))), activeTab === 'profile' && React.createElement(StudentProfileForm, {
    currentUser: currentUser,
    onProfileUpdated: updatedProfile => {
      setStudentProfile(prev => ({
        ...prev,
        ...updatedProfile
      }));
      setProfileLoaded(true);
    }
  }), activeTab === 'curriculum' && React.createElement(StudentCurriculumWithPriority, {
    mySchool: mySchool,
    myGrade: myGrade,
    curriculum: curriculum,
    chapterProgress: chapterProgress
  }), activeTab === 'attendance' && React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "\u2705 My Attendance Record"), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("div", {
    className: "overflow-x-auto"
  }, React.createElement("table", {
    className: "w-full"
  }, React.createElement("thead", {
    className: "avanti-gradient-light"
  }, React.createElement("tr", null, React.createElement("th", {
    className: "p-3 text-left"
  }, "Date"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Status"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Remarks"))), React.createElement("tbody", null, studentAttendance.length === 0 ? React.createElement("tr", null, React.createElement("td", {
    colSpan: "3",
    className: "p-8 text-center text-gray-500"
  }, "No attendance records")) : studentAttendance.map((record, idx) => React.createElement("tr", {
    key: idx,
    className: "border-b hover:bg-gray-50"
  }, React.createElement("td", {
    className: "p-3"
  }, record.date), React.createElement("td", {
    className: "p-3"
  }, React.createElement("span", {
    className: `px-3 py-1 rounded-full text-sm font-bold ${record.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`
  }, record.status)), React.createElement("td", {
    className: "p-3 text-sm"
  }, record.remarks || '—')))))))), activeTab === 'exams' && React.createElement(StudentExamRegistration, {
    currentUser: currentUser
  }), activeTab === 'assets' && React.createElement(StudentAssets, {
    currentUser: currentUser
  })), showTeacherProfile && selectedTeacher && React.createElement(TeacherProfileModal, {
    teacher: selectedTeacher,
    onClose: () => setShowTeacherProfile(false),
    onGiveFeedback: handleGiveFeedback,
    averageRating: getTeacherAverageRating(selectedTeacher.docId)
  }), showFeedbackForm && selectedTeacher && React.createElement(TeacherFeedbackForm, {
    teacher: selectedTeacher,
    studentId: myId,
    studentInfo: currentUser,
    onClose: () => setShowFeedbackForm(false),
    onSubmitSuccess: handleFeedbackSubmitSuccess
  }), showFeedbackNotification && React.createElement(FeedbackNotification, {
    onClose: () => setShowFeedbackNotification(false),
    onGiveFeedback: () => {
      setShowFeedbackNotification(false);
      setActiveTab('dashboard');
    }
  }), React.createElement("footer", {
    className: "bg-gray-800 text-white text-center py-4 mt-auto"
  }, React.createElement("p", null, "Made by Anand with \u2764\uFE0F")));
}
function generate2FASecret(email) {
  const secret = new OTPAuth.Secret({
    size: 20
  });
  return secret.base32;
}
function generate2FAURI(email, secret) {
  const totp = new OTPAuth.TOTP({
    issuer: 'Avanti',
    label: email.split('@')[0],
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret)
  });
  return totp.toString();
}
function verify2FACode(secret, code) {
  try {
    const totp = new OTPAuth.TOTP({
      issuer: 'Avanti Curriculum Tracker',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret)
    });
    const delta = totp.validate({
      token: code,
      window: 2
    });
    return delta !== null;
  } catch (e) {
    console.error('2FA verification error:', e);
    return false;
  }
}
function generateBackupCodes(count = 8) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    codes.push(code);
  }
  return codes;
}
function hashBackupCode(code) {
  let hash = 0;
  const str = code.replace('-', '').toUpperCase();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}
function verifyBackupCode(inputCode, hashedCodes) {
  const inputHash = hashBackupCode(inputCode);
  const index = hashedCodes.findIndex(h => h.hash === inputHash && !h.used);
  return index;
}
function generateDeviceId() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
function getDeviceId() {
  try {
    let deviceId = localStorage.getItem('avanti_device_id');
    if (!deviceId) {
      deviceId = sessionStorage.getItem('avanti_device_id');
      if (deviceId) {
        try {
          localStorage.setItem('avanti_device_id', deviceId);
        } catch (e) {}
      }
    }
    if (!deviceId) {
      const cookies = document.cookie.split(';');
      for (let c of cookies) {
        const [key, value] = c.trim().split('=');
        if (key === 'avanti_device_id' && value) {
          deviceId = value;
          try {
            localStorage.setItem('avanti_device_id', deviceId);
            sessionStorage.setItem('avanti_device_id', deviceId);
          } catch (e) {}
          break;
        }
      }
    }
    if (!deviceId) {
      deviceId = generateDeviceId();
    }
    try {
      localStorage.setItem('avanti_device_id', deviceId);
      sessionStorage.setItem('avanti_device_id', deviceId);
      const expires = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `avanti_device_id=${deviceId};expires=${expires};path=/;SameSite=Strict`;
      if (window.persistentStorage) {
        window.persistentStorage.setItem('avanti_device_id', deviceId).catch(() => {});
      }
    } catch (e) {
      console.warn('[getDeviceId] Cannot save device ID:', e);
    }
    return deviceId;
  } catch (e) {
    console.warn('[getDeviceId] localStorage error, using session ID');
    try {
      let sessionDeviceId = sessionStorage.getItem('avanti_device_id');
      if (!sessionDeviceId) {
        sessionDeviceId = 'session_' + generateDeviceId();
        sessionStorage.setItem('avanti_device_id', sessionDeviceId);
      }
      return sessionDeviceId;
    } catch (e2) {
      return 'temp_' + generateDeviceId();
    }
  }
}
async function restoreDeviceIdFromIDB() {
  try {
    if (!window.persistentStorage) return;
    const storedId = await window.persistentStorage.getItem('avanti_device_id');
    if (storedId) {
      try {
        localStorage.setItem('avanti_device_id', storedId);
        sessionStorage.setItem('avanti_device_id', storedId);
        const expires = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toUTCString();
        document.cookie = `avanti_device_id=${storedId};expires=${expires};path=/;SameSite=Strict`;
        console.log('✅ Device ID restored from IndexedDB');
      } catch (e) {}
    }
  } catch (e) {
    console.log('[restoreDeviceId] Could not restore from IDB:', e);
  }
}
restoreDeviceIdFromIDB();
async function isDeviceTrusted(userId) {
  try {
    const deviceId = getDeviceId();
    console.log('🔍 Checking device trust for:', userId, 'Device ID:', deviceId.substring(0, 8) + '...');
    const trustedDevicesDoc = await db.collection('trustedDevices').doc(userId).get();
    if (!trustedDevicesDoc.exists) {
      console.log('❌ No trusted devices document found for user');
      return false;
    }
    const devices = trustedDevicesDoc.data().devices || [];
    console.log('📱 Found', devices.length, 'trusted devices for user');
    const trustedDevice = devices.find(d => d.deviceId === deviceId && d.active);
    if (trustedDevice) {
      const trustDate = new Date(trustedDevice.trustedAt);
      const now = new Date();
      const daysDiff = (now - trustDate) / (1000 * 60 * 60 * 24);
      if (daysDiff > 15) {
        console.log('⏰ Device trust expired after 15 days, requiring 2FA again');
        await removeDeviceTrust(userId, deviceId);
        return false;
      }
      console.log('✅ Device trusted, days remaining:', Math.round(15 - daysDiff));
      return true;
    }
    console.log('❌ Device not in trusted list. Looking for:', deviceId.substring(0, 12));
    devices.forEach((d, i) => {
      console.log(`   Device ${i + 1}: ${d.deviceId?.substring(0, 12)}... active:${d.active}`);
    });
    return false;
  } catch (e) {
    console.error('Error checking device trust:', e);
    return false;
  }
}
async function addDeviceTrust(userId, userEmail) {
  try {
    const deviceId = getDeviceId();
    console.log('🔐 Adding device trust for:', userId, 'Device:', deviceId.substring(0, 8) + '...');
    const deviceInfo = {
      deviceId: deviceId,
      trustedAt: new Date().toISOString(),
      userAgent: navigator.userAgent.substring(0, 200),
      platform: navigator.platform || 'unknown',
      active: true
    };
    const docRef = db.collection('trustedDevices').doc(userId);
    const doc = await docRef.get();
    if (doc.exists) {
      const devices = doc.data().devices || [];
      const filteredDevices = devices.filter(d => d.deviceId !== deviceId);
      const updatedDevices = [...filteredDevices.slice(-4), deviceInfo];
      await docRef.update({
        devices: updatedDevices,
        userEmail: userEmail,
        lastTrustUpdate: new Date().toISOString()
      });
      console.log('✅ Device trust updated, total trusted devices:', updatedDevices.length);
    } else {
      await docRef.set({
        devices: [deviceInfo],
        userEmail: userEmail,
        createdAt: new Date().toISOString(),
        lastTrustUpdate: new Date().toISOString()
      });
      console.log('✅ New device trust created');
    }
    const verifyDoc = await docRef.get();
    if (verifyDoc.exists) {
      const savedDevices = verifyDoc.data().devices || [];
      const found = savedDevices.find(d => d.deviceId === deviceId);
      if (found) {
        console.log('✅ Device trust verified in Firestore');
      } else {
        console.warn('⚠️ Device trust not found after saving!');
      }
    }
    return true;
  } catch (e) {
    console.error('Error adding device trust:', e);
    return false;
  }
}
async function removeDeviceTrust(userId, deviceId) {
  try {
    const docRef = db.collection('trustedDevices').doc(userId);
    const doc = await docRef.get();
    if (doc.exists) {
      const devices = doc.data().devices || [];
      const updatedDevices = devices.filter(d => d.deviceId !== deviceId);
      await docRef.update({
        devices: updatedDevices
      });
    }
    return true;
  } catch (e) {
    console.error('Error removing device trust:', e);
    return false;
  }
}
async function removeAllDeviceTrusts(userId) {
  try {
    await db.collection('trustedDevices').doc(userId).delete();
    return true;
  } catch (e) {
    console.error('Error removing all device trusts:', e);
    return false;
  }
}
function TwoFactorSetupModal({
  user,
  onClose,
  onSetupComplete
}) {
  const [step, setStep] = useState(1);
  const [secret, setSecret] = useState('');
  const [qrUri, setQrUri] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const qrRef = useRef(null);
  const qrInstance = useRef(null);
  useEffect(() => {
    const newSecret = generate2FASecret(user.email);
    const uri = generate2FAURI(user.email, newSecret);
    setSecret(newSecret);
    setQrUri(uri);
  }, [user.email]);
  useEffect(() => {
    if (qrRef.current && qrUri && step === 1) {
      qrRef.current.innerHTML = '';
      qrInstance.current = new QRCode(qrRef.current, {
        text: qrUri,
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.L
      });
    }
  }, [qrUri, step]);
  const handleVerifyCode = () => {
    setError('');
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    if (verify2FACode(secret, verificationCode)) {
      const codes = generateBackupCodes(8);
      setBackupCodes(codes);
      setStep(3);
    } else {
      setError('Invalid code. Please try again.');
    }
  };
  const handleComplete = async () => {
    setSaving(true);
    try {
      const hashedBackupCodes = backupCodes.map(code => ({
        hash: hashBackupCode(code),
        used: false
      }));
      let collection = 'teachers';
      let docId = user.afid || user.docId;
      if (user.role) {
        collection = 'managers';
        docId = user.docId || user.uid;
      }
      await db.collection('twoFactorAuth').doc(docId).set({
        enabled: true,
        secret: secret,
        backupCodes: hashedBackupCodes,
        setupAt: new Date().toISOString(),
        userEmail: user.email,
        userType: user.role ? 'manager' : 'teacher'
      });
      await db.collection(collection).doc(docId).update({
        twoFactorEnabled: true,
        twoFactorSetupAt: new Date().toISOString()
      });
      onSetupComplete();
    } catch (e) {
      console.error('Error saving 2FA settings:', e);
      setError('Failed to save 2FA settings: ' + e.message);
    } finally {
      setSaving(false);
    }
  };
  return React.createElement("div", {
    className: "modal-overlay",
    onClick: onClose
  }, React.createElement("div", {
    className: "modal-content max-w-lg",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "flex justify-between items-center mb-4"
  }, React.createElement("h3", {
    className: "text-2xl font-bold"
  }, "\uD83D\uDD10 Setup Two-Factor Authentication"), React.createElement("button", {
    onClick: onClose,
    className: "text-2xl text-gray-400 hover:text-gray-600"
  }, "\xD7")), step === 1 && React.createElement("div", {
    className: "space-y-4"
  }, React.createElement("div", {
    className: "bg-blue-50 border-2 border-blue-200 p-4 rounded-xl"
  }, React.createElement("p", {
    className: "text-blue-800 font-semibold mb-2"
  }, "Step 1: Scan QR Code"), React.createElement("p", {
    className: "text-sm text-blue-600"
  }, "Open your authenticator app (Google Authenticator, Microsoft Authenticator, Authy, etc.) and scan this QR code.")), React.createElement("div", {
    className: "flex justify-center p-4 bg-white rounded-xl border-2"
  }, React.createElement("div", {
    ref: qrRef
  })), React.createElement("div", {
    className: "bg-gray-50 p-4 rounded-xl"
  }, React.createElement("p", {
    className: "text-sm font-semibold mb-2"
  }, "Can't scan? Enter this code manually:"), React.createElement("code", {
    className: "block bg-white p-3 rounded-lg text-sm font-mono break-all border"
  }, secret)), React.createElement("button", {
    onClick: () => setStep(2),
    className: "w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
  }, "Next: Verify Code \u2192")), step === 2 && React.createElement("div", {
    className: "space-y-4"
  }, React.createElement("div", {
    className: "bg-green-50 border-2 border-green-200 p-4 rounded-xl"
  }, React.createElement("p", {
    className: "text-green-800 font-semibold mb-2"
  }, "Step 2: Verify Setup"), React.createElement("p", {
    className: "text-sm text-green-600"
  }, "Enter the 6-digit code from your authenticator app to confirm setup.")), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Verification Code"), React.createElement("input", {
    type: "text",
    value: verificationCode,
    onChange: e => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6)),
    placeholder: "Enter 6-digit code",
    className: "w-full px-4 py-3 border-2 rounded-xl text-center text-2xl font-mono tracking-widest",
    maxLength: 6,
    autoFocus: true
  })), error && React.createElement("div", {
    className: "bg-red-50 border-2 border-red-200 p-3 rounded-xl text-red-700 text-sm"
  }, error), React.createElement("div", {
    className: "flex gap-3"
  }, React.createElement("button", {
    onClick: () => setStep(1),
    className: "flex-1 py-3 bg-gray-200 rounded-xl font-semibold hover:bg-gray-300"
  }, "\u2190 Back"), React.createElement("button", {
    onClick: handleVerifyCode,
    className: "flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700"
  }, "Verify Code"))), step === 3 && React.createElement("div", {
    className: "space-y-4"
  }, React.createElement("div", {
    className: "bg-yellow-50 border-2 border-yellow-200 p-4 rounded-xl"
  }, React.createElement("p", {
    className: "text-yellow-800 font-semibold mb-2"
  }, "\u26A0\uFE0F Step 3: Save Backup Codes"), React.createElement("p", {
    className: "text-sm text-yellow-700"
  }, "Save these backup codes in a safe place. You can use them to login if you lose access to your authenticator app. Each code can only be used once.")), React.createElement("div", {
    className: "bg-white border-2 p-4 rounded-xl"
  }, React.createElement("div", {
    className: "grid grid-cols-2 gap-2"
  }, backupCodes.map((code, i) => React.createElement("div", {
    key: i,
    className: "font-mono text-center py-2 bg-gray-100 rounded-lg"
  }, code)))), React.createElement("button", {
    onClick: () => {
      const codesText = backupCodes.join('\n');
      const blob = new Blob([`Avanti Curriculum Tracker - Backup Codes\n\nEmail: ${user.email}\nGenerated: ${new Date().toLocaleString()}\n\nBackup Codes:\n${codesText}\n\nKeep these codes safe! Each code can only be used once.`], {
        type: 'text/plain'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'avanti-2fa-backup-codes.txt';
      a.click();
    },
    className: "w-full py-3 bg-gray-200 rounded-xl font-semibold hover:bg-gray-300"
  }, "\uD83D\uDCE5 Download Backup Codes"), error && React.createElement("div", {
    className: "bg-red-50 border-2 border-red-200 p-3 rounded-xl text-red-700 text-sm"
  }, error), React.createElement("button", {
    onClick: handleComplete,
    disabled: saving,
    className: "w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50"
  }, saving ? 'Saving...' : '✓ Complete Setup'))));
}
function TwoFactorVerifyModal({
  user,
  onVerified,
  onCancel,
  onUseBackupCode
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [showBackupInput, setShowBackupInput] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const handleVerify = async inputCode => {
    const codeToVerify = inputCode || code;
    setError('');
    if (!codeToVerify || codeToVerify.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    setVerifying(true);
    try {
      const docId = user.afid || user.docId || user.uid || user.id;
      const twoFADoc = await db.collection('twoFactorAuth').doc(docId).get();
      if (!twoFADoc.exists) {
        setError('2FA not configured. Please contact admin.');
        return;
      }
      const twoFAData = twoFADoc.data();
      if (verify2FACode(twoFAData.secret, codeToVerify)) {
        onVerified();
      } else {
        setRetryCount(prev => prev + 1);
        if (retryCount >= 2) {
          setError('Code invalid. Tip: Wait for a new code to appear in your app, then enter it immediately.');
        } else {
          setError('Invalid code. Please check your authenticator app and try again.');
        }
        setCode('');
      }
    } catch (e) {
      console.error('2FA verification error:', e);
      if (e.message?.includes('network') || e.message?.includes('timeout')) {
        setError('Network issue. Please check your connection and try again.');
      } else {
        setError('Verification failed: ' + e.message);
      }
    } finally {
      setVerifying(false);
    }
  };
  const handleCodeChange = e => {
    const newCode = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(newCode);
    if (newCode.length === 6) {
      setTimeout(() => handleVerify(newCode), 200);
    }
  };
  const handleBackupCodeVerify = async () => {
    setError('');
    if (!backupCode) {
      setError('Please enter a backup code');
      return;
    }
    setVerifying(true);
    try {
      const docId = user.afid || user.docId || user.uid || user.id;
      const twoFADoc = await db.collection('twoFactorAuth').doc(docId).get();
      if (!twoFADoc.exists) {
        setError('2FA not configured. Please contact admin.');
        return;
      }
      const twoFAData = twoFADoc.data();
      const backupCodes = twoFAData.backupCodes || [];
      const codeIndex = verifyBackupCode(backupCode, backupCodes);
      if (codeIndex >= 0) {
        backupCodes[codeIndex].used = true;
        await db.collection('twoFactorAuth').doc(docId).update({
          backupCodes: backupCodes
        });
        onVerified();
      } else {
        setError('Invalid or already used backup code.');
      }
    } catch (e) {
      console.error('Backup code verification error:', e);
      setError('Verification failed: ' + e.message);
    } finally {
      setVerifying(false);
    }
  };
  return React.createElement("div", {
    className: "modal-overlay"
  }, React.createElement("div", {
    className: "modal-content max-w-md"
  }, React.createElement("div", {
    className: "text-center mb-6"
  }, React.createElement("div", {
    className: "text-5xl mb-3"
  }, "\uD83D\uDD10"), React.createElement("h3", {
    className: "text-2xl font-bold"
  }, "Two-Factor Authentication"), React.createElement("p", {
    className: "text-gray-600 mt-2"
  }, "Enter the code from your authenticator app")), !showBackupInput ? React.createElement("div", {
    className: "space-y-4"
  }, React.createElement("div", {
    className: "bg-blue-50 border border-blue-200 p-3 rounded-xl text-sm text-blue-700"
  }, "\uD83D\uDCA1 ", React.createElement("strong", null, "Tip:"), " Code changes every 30 seconds. Enter it as soon as you see it."), React.createElement("div", {
    className: "bg-green-50 border border-green-200 p-3 rounded-xl text-sm text-green-700"
  }, "\u2705 This device will be remembered for ", React.createElement("strong", null, "15 days"), " after verification."), React.createElement("input", {
    type: "text",
    inputMode: "numeric",
    pattern: "[0-9]*",
    value: code,
    onChange: handleCodeChange,
    placeholder: "000000",
    className: "w-full px-4 py-4 border-2 rounded-xl text-center text-3xl font-mono tracking-widest",
    maxLength: 6,
    autoFocus: true,
    autoComplete: "one-time-code",
    disabled: verifying
  }), error && React.createElement("div", {
    className: "bg-red-50 border-2 border-red-200 p-3 rounded-xl text-red-700 text-sm text-center"
  }, error), verifying && React.createElement("div", {
    className: "text-center text-gray-600"
  }, React.createElement("div", {
    className: "inline-block animate-spin mr-2"
  }, "\u23F3"), "Verifying..."), React.createElement("button", {
    onClick: () => handleVerify(),
    disabled: verifying || code.length !== 6,
    className: "w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50"
  }, verifying ? 'Verifying...' : 'Verify'), React.createElement("div", {
    className: "text-center"
  }, React.createElement("button", {
    onClick: () => setShowBackupInput(true),
    className: "text-blue-600 text-sm hover:underline"
  }, "Lost your phone? Use a backup code")), React.createElement("button", {
    onClick: onCancel,
    className: "w-full py-3 bg-gray-200 rounded-xl font-semibold hover:bg-gray-300"
  }, "Cancel Login")) : React.createElement("div", {
    className: "space-y-4"
  }, React.createElement("div", {
    className: "bg-yellow-50 border-2 border-yellow-200 p-3 rounded-xl text-sm"
  }, React.createElement("p", {
    className: "text-yellow-800 font-semibold"
  }, "Using Backup Code"), React.createElement("p", {
    className: "text-yellow-700"
  }, "Enter one of your saved backup codes. Each code can only be used once.")), React.createElement("input", {
    type: "text",
    value: backupCode,
    onChange: e => setBackupCode(e.target.value.toUpperCase()),
    placeholder: "XXXX-XXXX",
    className: "w-full px-4 py-4 border-2 rounded-xl text-center text-xl font-mono tracking-wider",
    autoFocus: true,
    onKeyPress: e => e.key === 'Enter' && handleBackupCodeVerify()
  }), error && React.createElement("div", {
    className: "bg-red-50 border-2 border-red-200 p-3 rounded-xl text-red-700 text-sm text-center"
  }, error), React.createElement("button", {
    onClick: handleBackupCodeVerify,
    disabled: verifying,
    className: "w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50"
  }, verifying ? 'Verifying...' : 'Use Backup Code'), React.createElement("button", {
    onClick: () => {
      setShowBackupInput(false);
      setError('');
    },
    className: "w-full py-3 bg-gray-200 rounded-xl font-semibold hover:bg-gray-300"
  }, "\u2190 Back to Code Entry"))));
}
function Admin2FAManagement({
  teachers,
  managers
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [twoFAUsers, setTwoFAUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(null);
  const [apcs, setApcs] = useState([]);
  useEffect(() => {
    const fetch2FAStatus = async () => {
      try {
        const twoFASnap = await db.collection('twoFactorAuth').get();
        const status = {};
        twoFASnap.docs.forEach(doc => {
          status[doc.id] = doc.data();
        });
        setTwoFAUsers(status);
        const apcsSnap = await db.collection('apcs').get();
        setApcs(apcsSnap.docs.map(d => ({
          ...d.data(),
          id: d.id
        })));
      } catch (e) {
        console.error('Error fetching 2FA status:', e);
      } finally {
        setLoading(false);
      }
    };
    fetch2FAStatus();
  }, []);
  const allUsers = [...teachers.map(t => ({
    ...t,
    type: 'Teacher',
    docId: t.afid,
    twoFADocId: t.afid
  })), ...managers.map(m => ({
    ...m,
    type: ROLE_LABELS[m.role] || 'Manager',
    docId: m.docId,
    twoFADocId: m.docId || m.uid || m.id
  })), ...apcs.map(a => ({
    ...a,
    type: 'APC',
    docId: a.id,
    twoFADocId: a.id
  }))];
  const filteredUsers = allUsers.filter(user => {
    if (filterType !== 'All' && user.type !== filterType) return false;
    if (searchTerm && !user.name?.toLowerCase().includes(searchTerm.toLowerCase()) && !user.email?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });
  const handleReset2FA = async user => {
    if (!confirm(`Reset 2FA for ${user.name}?\n\nThis will disable their 2FA and remove all trusted devices. They will need to set it up again on next login.`)) return;
    setResetting(user.docId);
    try {
      const possibleIds = [user.twoFADocId, user.docId, user.id, user.uid, user.afid].filter(Boolean);
      let actualTwoFADocId = null;
      for (const id of possibleIds) {
        const doc = await db.collection('twoFactorAuth').doc(id).get();
        if (doc.exists) {
          actualTwoFADocId = id;
          break;
        }
      }
      if (actualTwoFADocId) {
        await db.collection('twoFactorAuth').doc(actualTwoFADocId).delete();
        await removeAllDeviceTrusts(actualTwoFADocId);
      }
      const collection = user.type === 'Teacher' ? 'teachers' : user.type === 'APC' ? 'apcs' : 'managers';
      const userDocId = user.docId || user.afid || user.id;
      await db.collection(collection).doc(userDocId).update({
        twoFactorEnabled: false,
        twoFactorResetAt: new Date().toISOString()
      });
      setTwoFAUsers(prev => {
        const updated = {
          ...prev
        };
        possibleIds.forEach(id => {
          delete updated[id];
        });
        return updated;
      });
      alert(`✅ 2FA reset for ${user.name}. They will need to set up 2FA again on next login from any device.`);
    } catch (e) {
      console.error('Error resetting 2FA:', e);
      alert('Failed to reset 2FA: ' + e.message);
    } finally {
      setResetting(null);
    }
  };
  if (loading) {
    return React.createElement("div", {
      className: "text-center py-8"
    }, React.createElement("div", {
      className: "text-4xl mb-4"
    }, "\u23F3"), React.createElement("p", null, "Loading 2FA status..."));
  }
  const enabledCount = allUsers.filter(user => {
    const possibleIds = [user.twoFADocId, user.docId, user.id, user.uid, user.afid].filter(Boolean);
    return possibleIds.some(id => twoFAUsers[id]?.enabled);
  }).length;
  const pendingCount = allUsers.length - enabledCount;
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "\uD83D\uDD10 Two-Factor Authentication Management"), React.createElement("div", {
    className: "grid md:grid-cols-3 gap-4"
  }, React.createElement("div", {
    className: "bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-xl"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "2FA Enabled"), React.createElement("div", {
    className: "text-3xl font-bold"
  }, enabledCount)), React.createElement("div", {
    className: "bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-xl"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "2FA Pending Setup"), React.createElement("div", {
    className: "text-3xl font-bold"
  }, pendingCount)), React.createElement("div", {
    className: "bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Total Users"), React.createElement("div", {
    className: "text-3xl font-bold"
  }, allUsers.length))), React.createElement("div", {
    className: "bg-white p-4 rounded-xl shadow"
  }, React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Search"), React.createElement("input", {
    type: "text",
    value: searchTerm,
    onChange: e => setSearchTerm(e.target.value),
    placeholder: "Search by name or email...",
    className: "w-full border-2 px-4 py-2 rounded-xl"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "User Type"), React.createElement("select", {
    value: filterType,
    onChange: e => setFilterType(e.target.value),
    className: "w-full border-2 px-4 py-2 rounded-xl"
  }, React.createElement("option", {
    value: "All"
  }, "All Users"), React.createElement("option", {
    value: "Teacher"
  }, "Teachers"), React.createElement("option", {
    value: "Super Admin"
  }, "Super Admins"), React.createElement("option", {
    value: "Associate Program Head"
  }, "Program Heads"), React.createElement("option", {
    value: "Program Manager"
  }, "Program Managers"), React.createElement("option", {
    value: "Associate Program Manager"
  }, "APMs"))))), React.createElement("div", {
    className: "bg-white p-6 rounded-xl shadow overflow-x-auto"
  }, React.createElement("table", {
    className: "w-full"
  }, React.createElement("thead", {
    className: "avanti-gradient-light"
  }, React.createElement("tr", null, React.createElement("th", {
    className: "p-3 text-left"
  }, "Name"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Email"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Type"), React.createElement("th", {
    className: "p-3 text-center"
  }, "2FA Status"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Actions"))), React.createElement("tbody", null, filteredUsers.map(user => {
    const possibleIds = [user.twoFADocId, user.docId, user.id, user.uid, user.afid].filter(Boolean);
    const twoFA = possibleIds.map(id => twoFAUsers[id]).find(t => t) || null;
    const isEnabled = twoFA?.enabled;
    return React.createElement("tr", {
      key: user.docId,
      className: "border-b hover:bg-gray-50"
    }, React.createElement("td", {
      className: "p-3 font-semibold"
    }, user.name), React.createElement("td", {
      className: "p-3 text-sm"
    }, user.email), React.createElement("td", {
      className: "p-3"
    }, React.createElement("span", {
      className: `px-2 py-1 rounded-full text-xs font-bold ${user.type === 'Teacher' ? 'bg-blue-100 text-blue-700' : user.type === 'Super Admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`
    }, user.type)), React.createElement("td", {
      className: "p-3 text-center"
    }, isEnabled ? React.createElement("span", {
      className: "px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold"
    }, "\u2713 Enabled") : React.createElement("span", {
      className: "px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-bold"
    }, "\u23F3 Pending")), React.createElement("td", {
      className: "p-3"
    }, isEnabled && React.createElement("button", {
      onClick: () => handleReset2FA(user),
      disabled: resetting === user.docId,
      className: "px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 disabled:opacity-50"
    }, resetting === user.docId ? 'Resetting...' : '🔄 Reset 2FA')));
  })))));
}
function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState('');
  const [showBanner, setShowBanner] = useState(false);
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };
    const updateConnectionType = () => {
      if ('connection' in navigator) {
        const conn = navigator.connection;
        setConnectionType(conn?.effectiveType || '');
      }
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', updateConnectionType);
      updateConnectionType();
    }
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ('connection' in navigator) {
        navigator.connection.removeEventListener('change', updateConnectionType);
      }
    };
  }, []);
  const isSlowConnection = connectionType === '2g' || connectionType === 'slow-2g';
  if (!showBanner && isOnline && !isSlowConnection) return null;
  return React.createElement("div", {
    className: `fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 text-sm font-medium transition-all ${!isOnline ? 'bg-red-500 text-white' : isSlowConnection ? 'bg-yellow-500 text-black' : 'bg-green-500 text-white'}`
  }, React.createElement("span", {
    className: "text-lg"
  }, !isOnline ? '📡' : isSlowConnection ? '🐌' : '✓'), React.createElement("div", null, React.createElement("div", {
    className: "font-bold"
  }, !isOnline ? 'No Internet Connection' : isSlowConnection ? 'Slow Connection' : 'Back Online!'), React.createElement("div", {
    className: "text-xs opacity-90"
  }, !isOnline ? 'Changes will sync when connected' : isSlowConnection ? 'Data may take longer to load' : 'All data synced successfully')), isOnline && !isSlowConnection && React.createElement("button", {
    onClick: () => setShowBanner(false),
    className: "ml-2 text-white/80 hover:text-white"
  }, "\u2715"));
}
function DataFreshnessIndicator() {
  const [isStale, setIsStale] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState('unknown');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  useEffect(() => {
    const checkStatus = () => {
      if (window.DataCacheManager) {
        const attendanceFreshness = window.DataCacheManager.getFreshness('studentAttendance_' + (window._currentUserSchool || 'all'));
        const isDataStale = attendanceFreshness === 'stale';
        setIsStale(isDataStale);
        const timestamp = window.DataCacheManager._cacheTimestamps['studentAttendance_' + (window._currentUserSchool || 'all')];
        if (timestamp) {
          setLastUpdateTime(timestamp);
        }
      }
      if (window.ConnectionManager) {
        setConnectionQuality(window.ConnectionManager.getQuality());
        setIsOnline(window.ConnectionManager.isOnline());
      } else {
        setIsOnline(navigator.onLine);
      }
      if (window.OfflineQueue) {
        setPendingCount(window.OfflineQueue.getPendingCount());
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    const handleCacheUpdate = () => {
      checkStatus();
      setIsRefreshing(false);
    };
    window.addEventListener('dataCacheUpdated', handleCacheUpdate);
    window.addEventListener('connectionRestored', checkStatus);
    window.addEventListener('connectionLost', checkStatus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('dataCacheUpdated', handleCacheUpdate);
      window.removeEventListener('connectionRestored', checkStatus);
      window.removeEventListener('connectionLost', checkStatus);
    };
  }, []);
  const handleRefresh = async () => {
    setIsRefreshing(true);
    window._forceRefresh = true;
    try {
      if (window.OfflineQueue && pendingCount > 0) {
        await window.OfflineQueue.processQueue();
      }
      window.location.reload();
    } catch (e) {
      console.error('Refresh failed:', e);
      setIsRefreshing(false);
    }
    setTimeout(() => {
      window._forceRefresh = false;
    }, 5000);
  };
  const getTimeAgo = timestamp => {
    if (!timestamp) return 'Unknown';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
    return Math.floor(seconds / 86400) + 'd ago';
  };
  const getConnectionIcon = () => {
    if (!isOnline) return '📴';
    if (connectionQuality === 'good') return '📶';
    if (connectionQuality === 'slow') return '📶';
    if (connectionQuality === 'very-slow') return '🐌';
    return '📡';
  };
  const getConnectionColor = () => {
    if (!isOnline) return 'bg-red-500';
    if (connectionQuality === 'good') return 'bg-green-500';
    if (connectionQuality === 'slow') return 'bg-yellow-500';
    if (connectionQuality === 'very-slow') return 'bg-orange-500';
    return 'bg-gray-500';
  };
  const shouldShow = !isOnline || isStale || isRefreshing || pendingCount > 0 || connectionQuality === 'very-slow';
  if (!shouldShow) return null;
  return React.createElement("div", {
    className: "fixed bottom-20 right-4 z-40"
  }, React.createElement("div", {
    className: `px-3 py-2 rounded-lg shadow-lg text-sm cursor-pointer transition-all ${getConnectionColor()} text-white`,
    onClick: () => setShowDetails(!showDetails)
  }, React.createElement("div", {
    className: "flex items-center gap-2"
  }, isRefreshing ? React.createElement(React.Fragment, null, React.createElement("div", {
    className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
  }), React.createElement("span", null, "Syncing...")) : React.createElement(React.Fragment, null, React.createElement("span", null, getConnectionIcon()), React.createElement("span", null, !isOnline ? 'Offline' : connectionQuality === 'very-slow' ? 'Slow Network' : isStale ? `Data: ${getTimeAgo(lastUpdateTime)}` : 'Online'), pendingCount > 0 && React.createElement("span", {
    className: "bg-white text-red-500 px-1.5 rounded-full text-xs font-bold"
  }, pendingCount)))), showDetails && React.createElement("div", {
    className: "mt-2 bg-white rounded-lg shadow-lg p-3 text-sm border border-gray-200"
  }, React.createElement("div", {
    className: "text-gray-700 mb-3"
  }, React.createElement("div", {
    className: "flex items-center justify-between mb-2"
  }, React.createElement("strong", null, "\uD83D\uDCE1 Network Status"), React.createElement("span", {
    className: `px-2 py-0.5 rounded text-xs font-bold ${isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`
  }, isOnline ? 'Connected' : 'Disconnected')), connectionQuality && connectionQuality !== 'unknown' && React.createElement("div", {
    className: "text-xs text-gray-500 mb-2"
  }, "Speed: ", React.createElement("span", {
    className: `font-bold ${connectionQuality === 'good' ? 'text-green-600' : connectionQuality === 'slow' ? 'text-yellow-600' : 'text-red-600'}`
  }, connectionQuality === 'good' ? 'Good' : connectionQuality === 'slow' ? 'Slow' : 'Very Slow')), lastUpdateTime && React.createElement("div", {
    className: "text-xs text-gray-500 mb-2"
  }, "Last sync: ", React.createElement("span", {
    className: "font-medium"
  }, getTimeAgo(lastUpdateTime))), pendingCount > 0 && React.createElement("div", {
    className: "bg-yellow-50 border border-yellow-200 rounded p-2 mb-2"
  }, React.createElement("span", {
    className: "text-yellow-700 text-xs"
  }, "\u23F3 ", pendingCount, " operation(s) waiting to sync")), !isOnline && React.createElement("p", {
    className: "text-xs text-gray-500 mt-1 bg-gray-50 p-2 rounded"
  }, "You're offline. Data is saved locally and will sync when connected.")), React.createElement("button", {
    onClick: handleRefresh,
    disabled: isRefreshing,
    className: "w-full px-3 py-2 bg-blue-500 text-white rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2"
  }, isRefreshing ? React.createElement(React.Fragment, null, React.createElement("div", {
    className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
  }), "Syncing...") : React.createElement(React.Fragment, null, "\uD83D\uDD04 Refresh Now"))));
}
function OnlineStatusCard({
  currentUser
}) {
  const [onlineCount, setOnlineCount] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState({});
  useEffect(() => {
    if (!currentUser) return;
    const userId = currentUser.afid || currentUser.uid || currentUser.email || currentUser.name;
    const userName = currentUser.name || '';
    PresenceSystem.init(userId, userName);
    const unsubscribe = PresenceSystem.subscribe(users => {
      setOnlineUsers(users);
      setOnlineCount(Object.keys(users).length);
    });
    return () => {
      unsubscribe();
      PresenceSystem.cleanup();
    };
  }, [currentUser]);
  if (!isVisible) return null;
  const totalUsers = 100;
  const offlineCount = Math.max(0, totalUsers - onlineCount);
  return React.createElement("div", {
    className: "online-status-card"
  }, React.createElement("button", {
    className: "close-btn",
    "data-allow-during-saving": "true",
    onClick: e => {
      e.stopPropagation();
      e.preventDefault();
      setIsVisible(false);
    }
  }, "\u2715"), React.createElement("div", {
    className: "text-xs text-gray-400 mb-2 font-semibold"
  }, "TEAM STATUS"), React.createElement("div", {
    className: "status-row"
  }, React.createElement("div", {
    className: "status-dot online"
  }), React.createElement("span", {
    className: "text-green-400 font-bold"
  }, onlineCount), React.createElement("span", {
    className: "text-gray-400 text-sm"
  }, "Online")), React.createElement("div", {
    className: "status-row"
  }, React.createElement("div", {
    className: "status-dot offline"
  }), React.createElement("span", {
    className: "text-gray-500 font-bold"
  }, offlineCount), React.createElement("span", {
    className: "text-gray-400 text-sm"
  }, "Offline")));
}
function MentionInput({
  value,
  onChange,
  placeholder,
  allMembers,
  className,
  onSubmit
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef(null);
  const filteredMembers = useMemo(() => {
    if (!mentionQuery) return [];
    const query = mentionQuery.toLowerCase();
    let results = [];
    if ('everyone'.includes(query)) {
      results.push({
        id: 'everyone',
        name: 'everyone',
        isEveryone: true
      });
    }
    const memberResults = (allMembers || []).filter(m => m.name?.toLowerCase().includes(query)).slice(0, 5);
    return [...results, ...memberResults];
  }, [mentionQuery, allMembers]);
  const handleInputChange = e => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      if (!textAfterAt.includes(' ')) {
        setMentionQuery(textAfterAt);
        setMentionStart(lastAtIndex);
        setShowDropdown(true);
        setHighlightedIndex(0);
      } else {
        setShowDropdown(false);
      }
    } else {
      setShowDropdown(false);
    }
    onChange(newValue);
  };
  const selectMention = member => {
    if (mentionStart === null) return;
    const beforeMention = value.slice(0, mentionStart);
    const afterCursor = value.slice(mentionStart + mentionQuery.length + 1);
    const mention = member.isEveryone ? '@everyone ' : `@${member.name} `;
    const newValue = beforeMention + mention + afterCursor;
    onChange(newValue);
    setShowDropdown(false);
    setMentionQuery('');
    setMentionStart(null);
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newPos = beforeMention.length + mention.length;
        inputRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };
  const handleKeyDown = e => {
    if (!showDropdown || filteredMembers.length === 0) {
      if (e.key === 'Enter' && onSubmit && value.trim()) {
        e.preventDefault();
        onSubmit();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(i => Math.min(i + 1, filteredMembers.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      selectMention(filteredMembers[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };
  const renderWithMentions = text => {
    if (!text) return text;
    const parts = text.split(/(@\w+(?:\s\w+)?)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        const isEveryone = part.toLowerCase() === '@everyone';
        return React.createElement("span", {
          key: i,
          className: `mention-tag ${isEveryone ? 'mention-everyone' : ''}`
        }, part);
      }
      return part;
    });
  };
  return React.createElement("div", {
    className: "mention-input-container"
  }, showDropdown && filteredMembers.length > 0 && React.createElement("div", {
    className: "mention-dropdown"
  }, filteredMembers.map((member, idx) => React.createElement("div", {
    key: member.id || member.afid || idx,
    className: `mention-dropdown-item ${idx === highlightedIndex ? 'highlighted' : ''}`,
    onClick: () => selectMention(member)
  }, member.isEveryone ? React.createElement(React.Fragment, null, React.createElement("div", {
    className: "avatar",
    style: {
      background: 'linear-gradient(135deg, #ef4444, #f59e0b)'
    }
  }, "@"), React.createElement("div", null, React.createElement("div", {
    className: "font-semibold text-red-600"
  }, "@everyone"), React.createElement("div", {
    className: "text-xs text-gray-500"
  }, "Notify all team members"))) : React.createElement(React.Fragment, null, member.profilePhoto ? React.createElement("img", {
    src: member.profilePhoto,
    alt: "",
    className: "w-8 h-8 rounded-full object-cover"
  }) : React.createElement("div", {
    className: "avatar"
  }, member.name?.charAt(0)), React.createElement("div", null, React.createElement("div", {
    className: "font-semibold"
  }, member.name), React.createElement("div", {
    className: "text-xs text-gray-500"
  }, member.school || member.role)))))), React.createElement("input", {
    ref: inputRef,
    type: "text",
    value: value,
    onChange: handleInputChange,
    onKeyDown: handleKeyDown,
    placeholder: placeholder,
    className: className
  }));
}
function MentionTextarea({
  value,
  onChange,
  placeholder,
  allMembers,
  className,
  rows
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const textareaRef = useRef(null);
  const filteredMembers = useMemo(() => {
    if (!mentionQuery) return [];
    const query = mentionQuery.toLowerCase();
    let results = [];
    if ('everyone'.includes(query)) {
      results.push({
        id: 'everyone',
        name: 'everyone',
        isEveryone: true
      });
    }
    const memberResults = (allMembers || []).filter(m => m.name?.toLowerCase().includes(query)).slice(0, 5);
    return [...results, ...memberResults];
  }, [mentionQuery, allMembers]);
  const handleInputChange = e => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionQuery(textAfterAt);
        setMentionStart(lastAtIndex);
        setShowDropdown(true);
        setHighlightedIndex(0);
      } else {
        setShowDropdown(false);
      }
    } else {
      setShowDropdown(false);
    }
    onChange(newValue);
  };
  const selectMention = member => {
    if (mentionStart === null) return;
    const beforeMention = value.slice(0, mentionStart);
    const afterCursor = value.slice(mentionStart + mentionQuery.length + 1);
    const mention = member.isEveryone ? '@everyone ' : `@${member.name} `;
    const newValue = beforeMention + mention + afterCursor;
    onChange(newValue);
    setShowDropdown(false);
    setMentionQuery('');
    setMentionStart(null);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPos = beforeMention.length + mention.length;
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };
  const handleKeyDown = e => {
    if (!showDropdown || filteredMembers.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(i => Math.min(i + 1, filteredMembers.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      selectMention(filteredMembers[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };
  return React.createElement("div", {
    className: "mention-input-container"
  }, showDropdown && filteredMembers.length > 0 && React.createElement("div", {
    className: "mention-dropdown",
    style: {
      bottom: 'auto',
      top: '100%',
      marginTop: '4px',
      marginBottom: '0'
    }
  }, filteredMembers.map((member, idx) => React.createElement("div", {
    key: member.id || member.afid || idx,
    className: `mention-dropdown-item ${idx === highlightedIndex ? 'highlighted' : ''}`,
    onClick: () => selectMention(member)
  }, member.isEveryone ? React.createElement(React.Fragment, null, React.createElement("div", {
    className: "avatar",
    style: {
      background: 'linear-gradient(135deg, #ef4444, #f59e0b)'
    }
  }, "@"), React.createElement("div", null, React.createElement("div", {
    className: "font-semibold text-red-600"
  }, "@everyone"), React.createElement("div", {
    className: "text-xs text-gray-500"
  }, "Notify all team members"))) : React.createElement(React.Fragment, null, member.profilePhoto ? React.createElement("img", {
    src: member.profilePhoto,
    alt: "",
    className: "w-8 h-8 rounded-full object-cover"
  }) : React.createElement("div", {
    className: "avatar"
  }, member.name?.charAt(0)), React.createElement("div", null, React.createElement("div", {
    className: "font-semibold"
  }, member.name), React.createElement("div", {
    className: "text-xs text-gray-500"
  }, member.school || member.role)))))), React.createElement("textarea", {
    ref: textareaRef,
    value: value,
    onChange: handleInputChange,
    onKeyDown: handleKeyDown,
    placeholder: placeholder,
    className: className,
    rows: rows,
    autoFocus: true
  }));
}
function ReactionButton({
  emoji,
  count,
  isActive,
  onClick,
  reactedBy,
  allMembers
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const getReactorNames = () => {
    if (!reactedBy || reactedBy.length === 0) return '';
    const names = reactedBy.map(userId => {
      if (!userId) return 'Someone';
      const userIdLower = String(userId).toLowerCase();
      const member = (allMembers || []).find(m => {
        if (m.afid && String(m.afid).toLowerCase() === userIdLower) return true;
        if (m.uid && String(m.uid).toLowerCase() === userIdLower) return true;
        if (m.id && String(m.id).toLowerCase() === userIdLower) return true;
        if (m.email && String(m.email).toLowerCase() === userIdLower) return true;
        if (m.afid && userIdLower.includes(String(m.afid).toLowerCase())) return true;
        if (m.email && userIdLower.includes(String(m.email).toLowerCase().split('@')[0])) return true;
        if (m.name && String(m.name).toLowerCase() === userIdLower) return true;
        return false;
      });
      return member?.name || userId.split('@')[0] || 'Someone';
    }).slice(0, 5);
    if (reactedBy.length > 5) {
      names.push(`+${reactedBy.length - 5} more`);
    }
    return names.join(', ');
  };
  const tooltipText = getReactorNames();
  return React.createElement("div", {
    className: "reaction-btn-wrapper",
    onMouseEnter: () => setShowTooltip(true),
    onMouseLeave: () => setShowTooltip(false)
  }, showTooltip && tooltipText && React.createElement("div", {
    className: "reaction-tooltip"
  }, tooltipText), React.createElement("button", {
    onClick: onClick,
    className: `emoji-btn ${isActive ? 'active' : ''}`
  }, emoji, " ", count || ''));
}
function LastActiveBadge({
  userId
}) {
  const [isOnline, setIsOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState('Never');
  useEffect(() => {
    if (!userId) return;
    const checkPresence = () => {
      setIsOnline(PresenceSystem.isOnline(userId));
      setLastSeen(PresenceSystem.formatLastSeen(userId));
    };
    checkPresence();
    const unsubscribe = PresenceSystem.subscribe(() => {
      checkPresence();
    });
    const interval = setInterval(checkPresence, 10000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [userId]);
  return React.createElement("span", {
    className: `last-active-badge ${isOnline ? 'online' : ''}`
  }, React.createElement("span", {
    style: {
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      background: isOnline ? '#10b981' : '#9ca3af',
      display: 'inline-block'
    }
  }), isOnline ? 'Online' : lastSeen);
}
function ProfileCompletionBanner({
  currentUser,
  onNavigateToProfile
}) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const managerRoles = ['Super Admin', 'Program Head', 'Program Manager', 'Associate Program Manager', 'PM', 'PH', 'APM', 'Admin', 'Director', 'Associate Director', 'Training Department', 'director', 'assoc_director', 'training'];
  const isManager = currentUser?.role && managerRoles.some(role => currentUser.role.toLowerCase().includes(role.toLowerCase()) || role.toLowerCase().includes(currentUser.role.toLowerCase()));
  const requiredFields = [{
    key: 'name',
    label: 'Full Name'
  }, {
    key: 'email',
    label: 'Email Address'
  }, {
    key: 'phone',
    label: 'Phone Number'
  }, {
    key: 'whatsapp',
    label: 'WhatsApp Number'
  }, {
    key: 'dob',
    label: 'Date of Birth'
  }, {
    key: 'dateOfBirth',
    label: 'Date of Birth'
  }, {
    key: 'school',
    label: 'School/Centre'
  }, {
    key: 'subject',
    label: 'Subject'
  }, {
    key: 'profilePhoto',
    label: 'Profile Photo'
  }, {
    key: 'joiningDate',
    label: 'Joining Date'
  }, {
    key: 'qualification',
    label: 'Qualification'
  }, {
    key: 'address',
    label: 'Address'
  }, {
    key: 'emergencyContact',
    label: 'Emergency Contact'
  }, {
    key: 'bloodGroup',
    label: 'Blood Group'
  }];
  const calculateCompletion = () => {
    if (!currentUser) return {
      percentage: 0,
      filled: [],
      missing: []
    };
    const filled = [];
    const missing = [];
    const checkedKeys = new Set();
    requiredFields.forEach(field => {
      if (field.key === 'dateOfBirth' && checkedKeys.has('dob')) return;
      if (field.key === 'dob' && checkedKeys.has('dateOfBirth')) return;
      const value = currentUser[field.key];
      const hasValue = value && String(value).trim() !== '' && value !== 'null' && value !== 'undefined';
      if (hasValue) {
        filled.push(field);
        checkedKeys.add(field.key);
      } else if (!checkedKeys.has(field.key)) {
        if (field.key === 'dob' || field.key === 'dateOfBirth') {
          const altValue = currentUser[field.key === 'dob' ? 'dateOfBirth' : 'dob'];
          if (!altValue || String(altValue).trim() === '') {
            missing.push(field);
          }
        } else {
          missing.push(field);
        }
        checkedKeys.add(field.key);
      }
    });
    const totalFields = 13;
    const filledCount = Math.min(filled.length, totalFields);
    const percentage = Math.round(filledCount / totalFields * 100);
    return {
      percentage,
      filled,
      missing
    };
  };
  const {
    percentage,
    filled,
    missing
  } = calculateCompletion();
  const dismissKey = `profileBannerDismissed_${currentUser?.afid || currentUser?.uid}_${new Date().toDateString()}`;
  useEffect(() => {
    const wasDismissed = localStorage.getItem(dismissKey);
    if (wasDismissed) {
      setIsDismissed(true);
    }
  }, [dismissKey]);
  const handleDismiss = () => {
    localStorage.setItem(dismissKey, 'true');
    setIsDismissed(true);
  };
  if (percentage >= 100 || isDismissed) return null;
  if (isManager) return null;
  const getUrgencyColor = () => {
    if (percentage < 30) return 'from-red-500 to-red-600';
    if (percentage < 60) return 'from-orange-500 to-amber-500';
    if (percentage < 80) return 'from-yellow-500 to-amber-400';
    return 'from-blue-500 to-indigo-500';
  };
  const getProgressColor = () => {
    if (percentage < 30) return 'bg-red-500';
    if (percentage < 60) return 'bg-orange-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-blue-500';
  };
  return React.createElement("div", {
    className: `mb-4 bg-gradient-to-r ${getUrgencyColor()} rounded-2xl p-4 shadow-lg text-white relative overflow-hidden`
  }, React.createElement("div", {
    className: "absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"
  }), React.createElement("div", {
    className: "absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"
  }), React.createElement("button", {
    onClick: handleDismiss,
    className: "absolute top-2 right-2 w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all text-sm",
    title: "Dismiss for today"
  }, "\u2715"), React.createElement("div", {
    className: "relative z-10"
  }, React.createElement("div", {
    className: "flex items-center gap-3 mb-3"
  }, React.createElement("div", {
    className: "text-3xl"
  }, percentage < 30 ? '⚠️' : percentage < 60 ? '📝' : percentage < 80 ? '📋' : '✨'), React.createElement("div", {
    className: "flex-1"
  }, React.createElement("h3", {
    className: "font-bold text-lg"
  }, "Complete Your Profile"), React.createElement("p", {
    className: "text-sm opacity-90"
  }, "Your profile is ", percentage, "% complete. ", missing.length, " field", missing.length !== 1 ? 's' : '', " remaining.")), React.createElement("div", {
    className: "text-right"
  }, React.createElement("div", {
    className: "text-3xl font-bold"
  }, percentage, "%"))), React.createElement("div", {
    className: "bg-white bg-opacity-30 rounded-full h-3 mb-3 overflow-hidden"
  }, React.createElement("div", {
    className: `h-full ${getProgressColor()} rounded-full transition-all duration-500`,
    style: {
      width: `${percentage}%`
    }
  })), React.createElement("div", {
    className: "flex items-center justify-between"
  }, React.createElement("button", {
    onClick: () => setShowDetails(!showDetails),
    className: "text-sm bg-white bg-opacity-20 px-3 py-1 rounded-lg hover:bg-opacity-30 transition-all"
  }, showDetails ? '▲ Hide Details' : '▼ Show Missing Fields'), React.createElement("button", {
    onClick: () => onNavigateToProfile && onNavigateToProfile(),
    className: "bg-white text-gray-800 px-4 py-2 rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-lg flex items-center gap-2"
  }, React.createElement("span", null, "Complete Now"), React.createElement("span", null, "\u2192"))), showDetails && missing.length > 0 && React.createElement("div", {
    className: "mt-3 bg-white bg-opacity-20 rounded-xl p-3"
  }, React.createElement("p", {
    className: "text-sm font-semibold mb-2"
  }, "Missing Information:"), React.createElement("div", {
    className: "flex flex-wrap gap-2"
  }, missing.map((field, idx) => React.createElement("span", {
    key: idx,
    className: "bg-white bg-opacity-30 px-2 py-1 rounded-lg text-xs font-medium"
  }, field.label))))));
}
function ProfileCompletionCard({
  currentUser,
  onNavigateToProfile
}) {
  const managerRoles = ['Super Admin', 'Program Head', 'Program Manager', 'Associate Program Manager', 'PM', 'PH', 'APM', 'Admin', 'Director', 'Associate Director', 'Training Department', 'director', 'assoc_director', 'training'];
  const isManager = currentUser?.role && managerRoles.some(role => currentUser.role.toLowerCase().includes(role.toLowerCase()) || role.toLowerCase().includes(currentUser.role.toLowerCase()));
  if (isManager) return null;
  const requiredFields = ['name', 'email', 'phone', 'whatsapp', 'dob', 'dateOfBirth', 'school', 'subject', 'profilePhoto', 'joiningDate', 'qualification', 'address', 'emergencyContact', 'bloodGroup'];
  const calculateCompletion = () => {
    if (!currentUser) return 0;
    let filled = 0;
    const checkedDob = currentUser.dob || currentUser.dateOfBirth;
    if (currentUser.name) filled++;
    if (currentUser.email) filled++;
    if (currentUser.phone) filled++;
    if (currentUser.whatsapp) filled++;
    if (checkedDob) filled++;
    if (currentUser.school) filled++;
    if (currentUser.subject) filled++;
    if (currentUser.profilePhoto) filled++;
    if (currentUser.joiningDate) filled++;
    if (currentUser.qualification) filled++;
    if (currentUser.address) filled++;
    if (currentUser.emergencyContact) filled++;
    if (currentUser.bloodGroup) filled++;
    return Math.round(filled / 13 * 100);
  };
  const percentage = calculateCompletion();
  if (percentage >= 100) {
    return React.createElement("div", {
      className: "bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200 rounded-2xl p-4 shadow-lg"
    }, React.createElement("div", {
      className: "flex items-center gap-3"
    }, React.createElement("div", {
      className: "w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl"
    }, "\u2713"), React.createElement("div", null, React.createElement("h3", {
      className: "font-bold text-green-800"
    }, "Profile Complete!"), React.createElement("p", {
      className: "text-sm text-green-600"
    }, "Your profile is 100% complete"))));
  }
  const getColor = () => {
    if (percentage < 30) return {
      bg: 'from-red-50 to-red-100',
      border: 'border-red-200',
      text: 'text-red-700',
      progress: 'bg-red-500'
    };
    if (percentage < 60) return {
      bg: 'from-orange-50 to-amber-100',
      border: 'border-orange-200',
      text: 'text-orange-700',
      progress: 'bg-orange-500'
    };
    if (percentage < 80) return {
      bg: 'from-yellow-50 to-amber-100',
      border: 'border-yellow-200',
      text: 'text-yellow-700',
      progress: 'bg-yellow-500'
    };
    return {
      bg: 'from-blue-50 to-indigo-100',
      border: 'border-blue-200',
      text: 'text-blue-700',
      progress: 'bg-blue-500'
    };
  };
  const colors = getColor();
  return React.createElement("div", {
    className: `bg-gradient-to-br ${colors.bg} border-2 ${colors.border} rounded-2xl p-4 shadow-lg cursor-pointer hover:shadow-xl transition-all`,
    onClick: () => onNavigateToProfile && onNavigateToProfile()
  }, React.createElement("div", {
    className: "flex items-center justify-between mb-3"
  }, React.createElement("div", {
    className: "flex items-center gap-3"
  }, React.createElement("div", {
    className: `w-12 h-12 ${colors.progress} rounded-full flex items-center justify-center text-white font-bold`
  }, percentage, "%"), React.createElement("div", null, React.createElement("h3", {
    className: `font-bold ${colors.text}`
  }, "Profile Completion"), React.createElement("p", {
    className: `text-sm ${colors.text} opacity-80`
  }, "Click to complete your profile"))), React.createElement("span", {
    className: "text-2xl"
  }, "\u2192")), React.createElement("div", {
    className: "bg-white rounded-full h-2 overflow-hidden"
  }, React.createElement("div", {
    className: `h-full ${colors.progress} rounded-full transition-all duration-500`,
    style: {
      width: `${percentage}%`
    }
  })));
}
function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [managerProfile, setManagerProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    studentId: '',
    loginType: 'teacher'
  });
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [loginProgress, setLoginProgress] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [curriculum, setCurriculum] = useState({});
  const [chapterProgress, setChapterProgress] = useState({});
  const [students, setStudents] = useState([]);
  const [managers, setManagers] = useState([]);
  const [accessibleSchools, setAccessibleSchools] = useState([]);
  const [academicYearSettings, setAcademicYearSettings] = useState(null);
  const [precomputedRankings, setPrecomputedRankings] = useState(null);
  const [studentAttendance, setStudentAttendance] = useState([]);
  const [teacherAttendance, setTeacherAttendance] = useState([]);
  const [leaveAdjustments, setLeaveAdjustments] = useState({});
  const [schoolInfo, setSchoolInfo] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  const [floatingCelebration, setFloatingCelebration] = useState(null);
  const [pending2FAUser, setPending2FAUser] = useState(null);
  const [show2FAVerify, setShow2FAVerify] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [needs2FASetup, setNeeds2FASetup] = useState(false);
  const prevUserRef = useRef(null);
  useEffect(() => {
    if (currentUser && !prevUserRef.current && !loading) {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 600;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
        setTimeout(() => {
          try {
            const osc2 = audioContext.createOscillator();
            const gain2 = audioContext.createGain();
            osc2.connect(gain2);
            gain2.connect(audioContext.destination);
            osc2.frequency.value = 800;
            osc2.type = 'sine';
            gain2.gain.setValueAtTime(0.2, audioContext.currentTime);
            gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            osc2.start(audioContext.currentTime);
            osc2.stop(audioContext.currentTime + 0.2);
          } catch (e) {}
        }, 100);
        console.log('🔔 Login sound played');
      } catch (e) {
        console.log('Could not play login sound:', e);
      }
    }
    prevUserRef.current = currentUser;
  }, [currentUser, loading]);
  useEffect(() => {
    if (!currentUser || loading) return;
    const dismissedKey = 'floatingCelebrationDismissed_' + new Date().toDateString();
    if (localStorage.getItem(dismissedKey)) return;
    const checkTeamCelebrations = async () => {
      try {
        const today = new Date();
        const todayMonth = today.getMonth();
        const todayDate = today.getDate();
        const [teachersSnap, managersSnap, apcsSnap] = await Promise.all([db.collection('teachers').get(), db.collection('managers').where('status', '==', 'active').get(), db.collection('apcs').get()]);
        const allMembers = [...teachersSnap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          type: 'teacher'
        })), ...managersSnap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          type: 'manager'
        })), ...apcsSnap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          type: 'apc'
        }))].filter(m => m.name && m.name.toLowerCase() !== 'vacant' && !m.isArchived);
        const todayBirthdays = allMembers.filter(m => {
          if (m.afid === currentUser.afid || m.id === currentUser.afid) return false;
          const dobField = m.dateOfBirth || m.dob;
          if (!dobField) return false;
          const dob = new Date(dobField);
          return dob.getMonth() === todayMonth && dob.getDate() === todayDate;
        });
        const todayAnniversaries = allMembers.filter(m => {
          if (m.afid === currentUser.afid || m.id === currentUser.afid) return false;
          if (!m.joiningDate) return false;
          const j = new Date(m.joiningDate);
          if (j.getFullYear() >= today.getFullYear()) return false;
          return j.getMonth() === todayMonth && j.getDate() === todayDate;
        }).map(m => ({
          ...m,
          years: today.getFullYear() - new Date(m.joiningDate).getFullYear()
        }));
        if (todayBirthdays.length > 0) {
          const person = todayBirthdays[0];
          setFloatingCelebration({
            type: 'birthday',
            person: person,
            total: todayBirthdays.length
          });
        } else if (todayAnniversaries.length > 0) {
          const person = todayAnniversaries[0];
          setFloatingCelebration({
            type: 'anniversary',
            person: person,
            years: person.years,
            total: todayAnniversaries.length
          });
        }
      } catch (e) {
        console.log('Could not check team celebrations:', e);
      }
    };
    const timer = setTimeout(checkTeamCelebrations, 2000);
    return () => clearTimeout(timer);
  }, [currentUser, loading]);
  const getAccessibleSchools = useCallback((managerData, allManagers) => {
    if (!managerData) {
      console.warn('⚠️ getAccessibleSchools: No manager data provided');
      return [];
    }
    console.log('📊 Calculating accessible schools for:', managerData.name, 'Role:', managerData.role);
    console.log('📊 Manager directSchools:', managerData.directSchools);
    if (managerData.viewAllSchools || managerData.role === 'director' || managerData.role === 'assoc_director' || managerData.role === 'training') {
      console.log('📊 Manager has viewAllSchools access, returning ALL schools:', SCHOOLS.length);
      return [...SCHOOLS];
    }
    let schools = [...(managerData.directSchools || [])];
    console.log('📊 Starting with directSchools:', schools.length, schools);
    const getAllReportees = managerId => {
      const directReportees = allManagers.filter(m => m.reportsTo === managerId && m.status === 'active');
      let allReportees = [...directReportees];
      directReportees.forEach(reportee => {
        allReportees = [...allReportees, ...getAllReportees(reportee.id)];
      });
      return allReportees;
    };
    if (managerData.role !== MANAGER_ROLES.APM) {
      const reportees = getAllReportees(managerData.id);
      console.log('📊 Found reportees:', reportees.length, reportees.map(r => r.name));
      reportees.forEach(reportee => {
        schools = [...schools, ...(reportee.directSchools || [])];
      });
    }
    const uniqueSchools = [...new Set(schools)];
    console.log('📊 Final accessible schools:', uniqueSchools.length, uniqueSchools);
    if (uniqueSchools.length === 0) {
      console.warn('⚠️ No schools found for this manager. Please contact admin to assign schools.');
    }
    return uniqueSchools;
  }, []);
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (user) {
        if (user.isAnonymous) {
          let studentSession = typeof window.safeStorage !== 'undefined' ? window.safeStorage.getItem('studentSession') : function () {
            try {
              return localStorage.getItem('studentSession');
            } catch (e) {
              return null;
            }
          }();
          if (!studentSession && window.persistentStorage) {
            try {
              studentSession = await window.persistentStorage.getItem('studentSession');
              if (studentSession) {
                console.log('✅ Restored student session from IndexedDB');
                try {
                  localStorage.setItem('studentSession', studentSession);
                } catch (e) {}
              }
            } catch (e) {}
          }
          if (studentSession) {
            try {
              const studentData = JSON.parse(studentSession);
              console.log('✅ Student detected via anonymous auth:', studentData.name);
              setCurrentUser(studentData);
              setIsAdmin(false);
              setActiveTab('dashboard');
              setLoading(false);
              setAuthLoading(false);
              setLoginProgress('');
              return;
            } catch (e) {
              console.error('Failed to parse student session:', e);
              if (typeof window.safeStorage !== 'undefined') {
                window.safeStorage.removeItem('studentSession');
              } else {
                try {
                  localStorage.removeItem('studentSession');
                } catch (e) {}
              }
              if (window.persistentStorage) {
                window.persistentStorage.removeItem('studentSession').catch(() => {});
              }
            }
          }
          console.log('Anonymous user without student session - signing out');
          await auth.signOut();
          setLoading(false);
          return;
        }
        if (user.email === 'admin@avantifellows.org') {
          const twoFADoc = await db.collection('twoFactorAuth').doc('SUPER_ADMIN').get();
          if (twoFADoc.exists && twoFADoc.data().enabled) {
            const deviceTrusted = await isDeviceTrusted('SUPER_ADMIN');
            if (deviceTrusted) {
              console.log('✅ Trusted device - skipping 2FA for Super Admin');
              setIsSuperAdmin(true);
              setIsAdmin(true);
              const allManagersSnap = await db.collection('managers').where('status', '==', 'active').get();
              const allManagers = allManagersSnap.docs.map(d => ({
                ...d.data(),
                id: d.id
              }));
              setManagers(allManagers);
              const aySnap = await db.collection('system').doc('academicYear').get();
              if (aySnap.exists) setAcademicYearSettings(aySnap.data());
              setAccessibleSchools([...SCHOOLS]);
              setCurrentUser({
                name: 'Super Administrator',
                email: user.email,
                afid: 'SUPER_ADMIN',
                school: 'Admin',
                role: MANAGER_ROLES.SUPER_ADMIN
              });
              setActiveTab('managers');
              setLoading(false);
              setAuthLoading(false);
              setLoginProgress('');
              return;
            }
            setPending2FAUser({
              name: 'Super Administrator',
              email: user.email,
              afid: 'SUPER_ADMIN',
              docId: 'SUPER_ADMIN',
              school: 'Admin',
              role: MANAGER_ROLES.SUPER_ADMIN,
              userType: 'superadmin'
            });
            setShow2FAVerify(true);
            setLoading(false);
            setAuthLoading(false);
            setLoginProgress('');
            return;
          } else {
            setPending2FAUser({
              name: 'Super Administrator',
              email: user.email,
              afid: 'SUPER_ADMIN',
              docId: 'SUPER_ADMIN',
              school: 'Admin',
              role: MANAGER_ROLES.SUPER_ADMIN,
              userType: 'superadmin'
            });
            setShow2FASetup(true);
            setNeeds2FASetup(true);
            setLoading(false);
            setAuthLoading(false);
            setLoginProgress('');
            return;
          }
        } else {
          const managerSnapshot = await db.collection('managers').where('email', '==', user.email).where('status', '==', 'active').limit(1).get();
          if (!managerSnapshot.empty) {
            const managerData = {
              ...managerSnapshot.docs[0].data(),
              id: managerSnapshot.docs[0].id,
              docId: managerSnapshot.docs[0].id
            };
            const twoFADoc = await db.collection('twoFactorAuth').doc(managerData.id).get();
            if (twoFADoc.exists && twoFADoc.data().enabled) {
              const deviceTrusted = await isDeviceTrusted(managerData.id);
              if (deviceTrusted) {
                console.log('✅ Trusted device - skipping 2FA for manager:', managerData.name);
                setManagerProfile(managerData);
                const allManagersSnap = await db.collection('managers').where('status', '==', 'active').get();
                const allManagers = allManagersSnap.docs.map(d => ({
                  ...d.data(),
                  id: d.id
                }));
                setManagers(allManagers);
                const aySnap = await db.collection('system').doc('academicYear').get();
                if (aySnap.exists) setAcademicYearSettings(aySnap.data());
                const schools = getAccessibleSchools(managerData, allManagers);
                setAccessibleSchools(schools);
                setIsAdmin(true);
                setIsSuperAdmin(false);
                setCurrentUser({
                  name: managerData.name,
                  email: user.email,
                  afid: managerData.id,
                  docId: managerData.docId,
                  school: schools[0] || 'Admin',
                  role: managerData.role,
                  directSchools: managerData.directSchools || [],
                  userType: 'manager',
                  isAdmin: true
                });
                const sessionToCache = {
                  name: managerData.name,
                  email: user.email,
                  afid: managerData.id,
                  id: managerData.id,
                  docId: managerData.docId,
                  school: schools[0] || 'Admin',
                  role: managerData.role,
                  directSchools: managerData.directSchools || [],
                  userType: 'manager',
                  isAdmin: true,
                  loginTime: Date.now()
                };
                try {
                  window.safeStorage?.setItem('teacherSession', JSON.stringify(sessionToCache));
                  window.persistentStorage?.setItem('teacherSession', JSON.stringify(sessionToCache)).catch(() => {});
                } catch (e) {}
                setActiveTab('analytics');
                setLoading(false);
                setAuthLoading(false);
                setLoginProgress('');
                return;
              }
              setPending2FAUser({
                ...managerData,
                userType: 'manager'
              });
              setShow2FAVerify(true);
              setLoading(false);
              setAuthLoading(false);
              setLoginProgress('');
              return;
            } else {
              setPending2FAUser({
                ...managerData,
                userType: 'manager'
              });
              setShow2FASetup(true);
              setNeeds2FASetup(true);
              setLoading(false);
              setAuthLoading(false);
              setLoginProgress('');
              return;
            }
          } else {
            const teacherSnapshot = await db.collection('teachers').where('email', '==', user.email).limit(1).get();
            if (!teacherSnapshot.empty) {
              const rawTeacherData = teacherSnapshot.docs[0].data();
              const userType = rawTeacherData.role === 'apc' ? 'apc' : 'teacher';
              const teacherData = {
                ...rawTeacherData,
                docId: teacherSnapshot.docs[0].id,
                userType: userType
              };
              const twoFADoc = await db.collection('twoFactorAuth').doc(teacherData.afid).get();
              if (twoFADoc.exists && twoFADoc.data().enabled) {
                const deviceTrusted = await isDeviceTrusted(teacherData.afid);
                if (deviceTrusted) {
                  console.log('✅ Trusted device - skipping 2FA for ' + userType + ':', teacherData.name);
                  const sessionToCache = {
                    ...teacherData,
                    loginTime: Date.now()
                  };
                  try {
                    window.safeStorage?.setItem('teacherSession', JSON.stringify(sessionToCache));
                    window.persistentStorage?.setItem('teacherSession', JSON.stringify(sessionToCache)).catch(() => {});
                  } catch (e) {}
                  setCurrentUser(teacherData);
                  setIsAdmin(false);
                  setActiveTab('overview');
                  if (userType === 'teacher' && teacherData.dob) {
                    const d = new Date(teacherData.dob);
                    const now = new Date();
                    if (d.getMonth() === now.getMonth() && d.getDate() === now.getDate()) {
                      setShowConfetti(true);
                      setCelebrationMessage(`🎂 Happy Birthday, ${teacherData.name}!`);
                      setTimeout(() => {
                        setShowConfetti(false);
                        setCelebrationMessage('');
                      }, 8000);
                    }
                  }
                  if (userType === 'teacher' && teacherData.joiningDate) {
                    const j = new Date(teacherData.joiningDate);
                    const now = new Date();
                    if (j.getMonth() === now.getMonth() && j.getDate() === now.getDate() && j.getFullYear() < now.getFullYear()) {
                      const years = now.getFullYear() - j.getFullYear();
                      setShowConfetti(true);
                      setCelebrationMessage(`🎉 Happy ${years} Year Work Anniversary, ${teacherData.name}!`);
                      setTimeout(() => {
                        setShowConfetti(false);
                        setCelebrationMessage('');
                      }, 8000);
                    }
                  }
                  setLoading(false);
                  setAuthLoading(false);
                  setLoginProgress('');
                  return;
                }
                setPending2FAUser({
                  ...teacherData,
                  userType: userType
                });
                setShow2FAVerify(true);
                setLoading(false);
                setAuthLoading(false);
                setLoginProgress('');
                return;
              } else {
                setPending2FAUser({
                  ...teacherData,
                  userType: userType
                });
                setShow2FASetup(true);
                setNeeds2FASetup(true);
                setLoading(false);
                setAuthLoading(false);
                setLoginProgress('');
                return;
              }
            } else {
              alert('User profile not found. Please contact admin.');
              await auth.signOut();
              setAuthLoading(false);
              setLoginProgress('');
            }
          }
        }
      } else {
        const studentSession = typeof window.safeStorage !== 'undefined' ? window.safeStorage.getItem('studentSession') : function () {
          try {
            return localStorage.getItem('studentSession');
          } catch (e) {
            return null;
          }
        }();
        if (studentSession) {
          try {
            const studentData = JSON.parse(studentSession);
            console.log('✅ Restored student session:', studentData);
            if (!auth.currentUser) {
              await auth.signInAnonymously();
              console.log('✅ Anonymous auth restored for student');
            }
            setCurrentUser(studentData);
            setIsAdmin(false);
            setActiveTab('dashboard');
          } catch (e) {
            console.error('Failed to restore student session:', e);
            if (typeof window.safeStorage !== 'undefined') {
              window.safeStorage.removeItem('studentSession');
            } else {
              try {
                localStorage.removeItem('studentSession');
              } catch (e) {}
            }
          }
        } else {
          setCurrentUser(null);
          setIsAdmin(false);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [getAccessibleSchools]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window.hideInstantLoader === 'function') {
        window.hideInstantLoader();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (loading) {
      const safetyTimeout = setTimeout(() => {
        console.warn('[Safety] Force stopping infinite loading after 45 seconds');
        setLoading(false);
        setAuthLoading(false);
        setLoginProgress('');
        if (window.DataCacheManager) {
          console.log('📦 Showing cached data after timeout');
        }
      }, 45000);
      return () => clearTimeout(safetyTimeout);
    }
  }, [loading]);
  useEffect(() => {
    // ✅ FIX: Skip admin/teacher data fetching for students
    // Students have their own data fetching in StudentDashboard component
    // SmartSync fetches ALL attendance which students don't have permission for
    if (!currentUser || currentUser.userType === 'student') return;
    const loadCachedData = () => {
      try {
        const cached = localStorage.getItem('cachedAppData');
        if (cached) {
          const data = JSON.parse(cached);
          if (data.timestamp && Date.now() - data.timestamp < 5 * 60 * 1000) {
            console.log('⚡ Loading cached data for instant display');
            if (data.teachers) setTeachers(data.teachers);
            if (data.curriculum) setCurriculum(data.curriculum);
            if (data.chapterProgress) setChapterProgress(data.chapterProgress);
            if (data.managers) setManagers(data.managers);
            return true;
          }
        }
      } catch (e) {
        console.log('Cache load failed:', e);
      }
      return false;
    };
    const fetchData = async () => {
      try {
        const hasCachedData = loadCachedData();
        const userSchool = currentUser?.school;
        const userIsAdmin = currentUser && (currentUser.email === 'admin@avantifellows.org' || currentUser.role === 'super_admin' || currentUser.role === 'program_head' || currentUser.role === 'program_manager' || currentUser.role === 'associate_program_manager' || currentUser.role === 'aph' || currentUser.role === 'pm' || currentUser.role === 'apm' || currentUser.role === 'director' || currentUser.role === 'assoc_director' || currentUser.role === 'training');
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        console.log('📊 Fetching critical data...');
        if (window.updateShellStatus) window.updateShellStatus('Loading teachers...');
        const criticalStartTime = Date.now();
        const fetchWithIndexFallback = async (optimizedQuery, fallbackQuery, filterFn, queryName) => {
          try {
            return await optimizedQuery;
          } catch (e) {
            if (e.message && e.message.includes('index')) {
              console.warn(`⚠️ ${queryName}: Index not ready, using fallback query`);
              const fallbackSnap = await fallbackQuery;
              return {
                docs: fallbackSnap.docs.filter(doc => filterFn(doc.data()))
              };
            }
            throw e;
          }
        };
        window._currentUserSchool = userSchool || 'admin';
        console.log('📦 Loading cached data first for instant display...');
        let usedCache = false;
        try {
          const cachedTeachers = await window.DataCacheManager.loadFromCache('teachers_' + (userSchool || 'all'));
          const cachedCurriculum = await window.DataCacheManager.loadFromCache('curriculum');
          const cachedStudentAtt = await window.DataCacheManager.loadFromCache('studentAttendance_' + (userSchool || 'all'));
          const cachedTeacherAtt = await window.DataCacheManager.loadFromCache('teacherAttendance_' + (userSchool || 'all'));
          const cachedProgress = await window.DataCacheManager.loadFromCache('chapterProgress');
          if (cachedTeachers?.docs?.length || cachedCurriculum?.docs?.length || cachedStudentAtt?.docs?.length || cachedTeacherAtt?.docs?.length) {
            console.log('✅ Found cached data - displaying immediately');
            usedCache = true;
            if (cachedTeachers?.docs) {
              const teachersData = cachedTeachers.docs.map(d => ({
                ...d.data,
                docId: d.id
              }));
              setTeachers(teachersData);
            }
            if (cachedCurriculum?.docs) {
              const currMap = {};
              cachedCurriculum.docs.forEach(d => {
                currMap[d.id] = d.data;
              });
              setCurriculum(currMap);
            }
            if (cachedStudentAtt?.docs) {
              setStudentAttendance(cachedStudentAtt.docs.map(d => ({
                ...d.data,
                docId: d.id
              })));
            }
            if (cachedTeacherAtt?.docs) {
              setTeacherAttendance(cachedTeacherAtt.docs.map(d => ({
                ...d.data,
                docId: d.id
              })));
            }
            if (cachedProgress?.docs) {
              const progressMap = {};
              cachedProgress.docs.forEach(d => {
                progressMap[d.id] = d.data;
              });
              setChapterProgress(progressMap);
            }
          }
        } catch (cacheError) {
          console.log('Cache load skipped:', cacheError.message);
        }
        const timeoutPromise = (promise, ms = 20000, fallback = {
          docs: []
        }) => {
          return Promise.race([promise, new Promise((_, reject) => setTimeout(() => {
            console.log('⏱️ Firebase query timeout after', ms, 'ms - will use cache');
            reject(new Error('timeout'));
          }, ms))]).catch(e => {
            console.warn('Query failed:', e.message, '- checking cache fallback');
            return fallback;
          });
        };
        if (window._logLoadTime) window._logLoadTime('Starting critical data fetch');
        let teachersQuery;
        if (userIsAdmin || !userSchool) {
          teachersQuery = db.collection('teachers').get();
        } else {
          teachersQuery = db.collection('teachers').where('school', '==', userSchool).get();
        }
        const [teachersSnap, curriculumSnap, managersSnap, aySnap] = await Promise.all([timeoutPromise(teachersQuery, 20000), timeoutPromise(db.collection('curriculum').get(), 20000), timeoutPromise(db.collection('managers').where('status', '==', 'active').get(), 15000), timeoutPromise(db.collection('system').doc('academicYear').get(), 10000, {
          exists: false
        })]);
        if (window._logLoadTime) window._logLoadTime('Critical data loaded');
        console.log('✅ Critical data loaded in', Date.now() - criticalStartTime, 'ms');
        const teachersData = teachersSnap.docs?.map(d => ({
          ...d.data(),
          docId: d.id
        })) || [];
        if (teachersData.length > 0 || !usedCache) {
          setTeachers(teachersData);
          window.DataCacheManager.saveToCache('teachers_' + (userSchool || 'all'), {
            docs: teachersSnap.docs?.map(d => ({
              id: d.id,
              data: d.data()
            })) || []
          });
        }
        const currMap = {};
        curriculumSnap.docs?.forEach(doc => {
          currMap[doc.id] = doc.data();
        });
        if (Object.keys(currMap).length > 0 || !usedCache) {
          setCurriculum(currMap);
          window.DataCacheManager.saveToCache('curriculum', {
            docs: curriculumSnap.docs?.map(d => ({
              id: d.id,
              data: d.data()
            })) || []
          });
        }
        const managersData = managersSnap.docs?.map(d => ({
          ...d.data(),
          id: d.id
        })) || [];
        setManagers(managersData);
        if (aySnap.exists) setAcademicYearSettings(aySnap.data());
        try {
          localStorage.setItem('cachedAppData', JSON.stringify({
            teachers: teachersData.slice(0, 50),
            curriculum: currMap,
            managers: managersData,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.log('Cache save failed:', e);
        }
        console.log('📊 Fetching secondary data...');
        if (window.updateShellStatus) window.updateShellStatus('Loading curriculum...');
        let progressQuery, studentAttQuery, teacherAttQuery;
        if (userIsAdmin || !userSchool) {
          progressQuery = db.collection('chapterProgress').get();
          studentAttQuery = db.collection('studentAttendance').where('date', '>=', thirtyDaysAgo).get();
          teacherAttQuery = db.collection('teacherAttendance').where('date', '>=', thirtyDaysAgo).get();
        } else {
          progressQuery = db.collection('chapterProgress').get();
          studentAttQuery = fetchWithIndexFallback(db.collection('studentAttendance').where('school', '==', userSchool).where('date', '>=', thirtyDaysAgo).get(), db.collection('studentAttendance').where('date', '>=', thirtyDaysAgo).get(), data => data.school === userSchool, 'studentAttendance');
          teacherAttQuery = fetchWithIndexFallback(db.collection('teacherAttendance').where('school', '==', userSchool).where('date', '>=', thirtyDaysAgo).get(), db.collection('teacherAttendance').where('date', '>=', thirtyDaysAgo).get(), data => data.school === userSchool, 'teacherAttendance');
        }
        const [progressSnap, studentAttSnap, teacherAttSnap, schoolInfoSnap, leaveAdjSnap, schoolsSnap, rankingsSnap] = await Promise.all([timeoutPromise(progressQuery, 25000), timeoutPromise(studentAttQuery, 30000), timeoutPromise(teacherAttQuery, 30000), timeoutPromise(db.collection('schoolInfo').get(), 20000), timeoutPromise(db.collection('leaveAdjustments').get(), 15000), timeoutPromise(db.collection('schoolsList').get(), 15000), timeoutPromise(db.collection('system').doc('schoolRankings').get(), 10000, {
          exists: false
        })]);
        if (window._logLoadTime) window._logLoadTime('Secondary data loaded');
        if (rankingsSnap.exists) {
          setPrecomputedRankings(rankingsSnap.data());
          console.log('✅ Loaded pre-computed rankings');
        } else {
          console.log('⚠️ No pre-computed rankings found - computing now...');
        }
        const progressMap = {};
        (progressSnap.docs || []).forEach(d => {
          progressMap[d.id] = d.data();
        });
        setChapterProgress(progressMap);
        let studentsData = [];
        if (currentUser && currentUser.userType !== 'student') {
          if (userIsAdmin) {
            console.log('📊 Admin detected - fetching ALL students');
            const allStudentsSnap = await db.collection('students').get();
            studentsData = allStudentsSnap.docs.map(d => {
              const data = d.data();
              let studentId = data.id;
              if (!studentId) {
                const parts = d.id.split('_');
                studentId = parts[parts.length - 1];
              }
              return {
                ...data,
                id: studentId,
                docId: d.id
              };
            });
            console.log('✅ Admin loaded ALL', studentsData.length, 'students');
          } else {
            const teacherSchool = currentUser.school;
            console.log('📊 Teacher detected - fetching students for:', teacherSchool);
            try {
              const schoolStudentsSnap = await db.collection('students').where('school', '==', teacherSchool).get();
              studentsData = schoolStudentsSnap.docs.map(d => {
                const data = d.data();
                let studentId = data.id;
                if (!studentId) {
                  const parts = d.id.split('_');
                  studentId = parts[parts.length - 1];
                }
                return {
                  ...data,
                  id: studentId,
                  docId: d.id
                };
              });
              console.log('✅ Teacher loaded', studentsData.length, 'students for', teacherSchool);
              if (studentsData.length === 0) {
                console.log('⚠️ No students found with exact match, trying case-insensitive search...');
                const allStudentsSnap = await db.collection('students').get();
                const teacherSchoolLower = (teacherSchool || '').toString().trim().toLowerCase();
                studentsData = allStudentsSnap.docs.filter(d => {
                  const studentSchool = (d.data().school || '').toString().trim().toLowerCase();
                  return studentSchool === teacherSchoolLower;
                }).map(d => {
                  const data = d.data();
                  let studentId = data.id;
                  if (!studentId) {
                    const parts = d.id.split('_');
                    studentId = parts[parts.length - 1];
                  }
                  return {
                    ...data,
                    id: studentId,
                    docId: d.id
                  };
                });
                console.log('✅ Case-insensitive search found', studentsData.length, 'students');
                if (studentsData.length > 0 && allStudentsSnap.docs.length > 0) {
                  const sampleSchools = Array.from(new Set(allStudentsSnap.docs.map(d => d.data().school))).slice(0, 5);
                  console.log('📋 Sample school names in database:', sampleSchools);
                  console.log('📋 Teacher school name:', teacherSchool);
                }
              }
            } catch (e) {
              console.error('❌ Error fetching students:', e);
              console.log('⚠️ Fallback: Fetching all students and filtering...');
              const allStudentsSnap = await db.collection('students').get();
              const teacherSchoolLower = (teacherSchool || '').toString().trim().toLowerCase();
              studentsData = allStudentsSnap.docs.filter(d => {
                const studentSchool = (d.data().school || '').toString().trim().toLowerCase();
                return studentSchool === teacherSchoolLower;
              }).map(d => {
                const data = d.data();
                let studentId = data.id;
                if (!studentId) {
                  const parts = d.id.split('_');
                  studentId = parts[parts.length - 1];
                }
                return {
                  ...data,
                  id: studentId,
                  docId: d.id
                };
              });
              console.log('✅ Fallback loaded', studentsData.length, 'students');
            }
          }
        }
        setStudents(studentsData);
        const studentAttData = (studentAttSnap.docs || []).map(d => ({
          ...d.data(),
          docId: d.id
        }));
        const teacherAttData = (teacherAttSnap.docs || []).map(d => ({
          ...d.data(),
          docId: d.id
        }));
        if (studentAttData.length > 0 || !usedCache) {
          setStudentAttendance(studentAttData);
          window.DataCacheManager.saveToCache('studentAttendance_' + (userSchool || 'all'), {
            docs: (studentAttSnap.docs || []).map(d => ({
              id: d.id,
              data: d.data()
            }))
          });
          console.log('✅ Student attendance loaded:', studentAttData.length, 'records');
        } else {
          console.log('⚠️ Student attendance query returned empty - keeping cached data');
        }
        if (teacherAttData.length > 0 || !usedCache) {
          setTeacherAttendance(teacherAttData);
          window.DataCacheManager.saveToCache('teacherAttendance_' + (userSchool || 'all'), {
            docs: (teacherAttSnap.docs || []).map(d => ({
              id: d.id,
              data: d.data()
            }))
          });
          console.log('✅ Teacher attendance loaded:', teacherAttData.length, 'records');
        } else {
          console.log('⚠️ Teacher attendance query returned empty - keeping cached data');
        }
        const progressData = (progressSnap.docs || []).map(d => ({
          id: d.id,
          data: d.data()
        }));
        if (progressData.length > 0) {
          window.DataCacheManager.saveToCache('chapterProgress', {
            docs: progressData
          });
        }
        const schoolInfoData = (schoolInfoSnap.docs || []).map(d => ({
          ...d.data(),
          docId: d.id
        }));
        console.log('📊 School Info loaded:', schoolInfoData.length, 'records');
        if (schoolInfoData.length > 0) {
          console.log('📊 Sample school info schools:', schoolInfoData.slice(0, 3).map(s => s.school));
        }
        setSchoolInfo(schoolInfoData);
        const adjMap = {};
        (leaveAdjSnap.docs || []).forEach(d => {
          adjMap[d.id] = d.data();
        });
        setLeaveAdjustments(adjMap);
        if (schoolsSnap && schoolsSnap.docs && schoolsSnap.docs.length > 0) {
          const schoolsData = schoolsSnap.docs.map(d => d.data().name).filter(Boolean);
          if (schoolsData.length > 0) {
            SCHOOLS = schoolsData;
            ALL_SCHOOLS_COUNT = schoolsData.length;
            cacheSchools(schoolsData);
            console.log('📊 [Schools] Loaded', schoolsData.length, 'schools from Firebase schoolsList');
          }
        } else {
          console.log('⚠️ [Schools] schoolsList empty or failed - using curriculum fallback');
          const curriculumSchools = extractSchoolsFromCurriculum(currMap);
          if (curriculumSchools.length > SCHOOLS.length) {
            SCHOOLS = curriculumSchools;
            ALL_SCHOOLS_COUNT = curriculumSchools.length;
            cacheSchools(curriculumSchools);
            console.log('📊 [Schools] Extracted', curriculumSchools.length, 'schools from curriculum');
          }
        }
        const curriculumSchools = extractSchoolsFromCurriculum(currMap);
        if (curriculumSchools.length > SCHOOLS.length) {
          console.log('📊 [Schools] Found additional schools in curriculum:', curriculumSchools.length, 'vs', SCHOOLS.length);
          SCHOOLS = curriculumSchools;
          ALL_SCHOOLS_COUNT = curriculumSchools.length;
          cacheSchools(curriculumSchools);
        }
        console.log('✅ All data loaded successfully');
        if (window.updateShellStatus) window.updateShellStatus('✓ Ready!', true);
        if (window.SmartSyncManager) {
          window.SmartSyncManager.markSynced('teachers');
          window.SmartSyncManager.markSynced('curriculum');
          window.SmartSyncManager.markSynced('attendance');
          window.SmartSyncManager.markSynced('students');
          window.SmartSyncManager.markSynced('rankings');
        }
      } catch (e) {
        console.error('Data fetch error:', e);
      }
    };
    const fetchAttendanceOnly = async () => {
      if (!currentUser) return;
      console.log('[SmartSync] 🔄 Refreshing attendance data...');
      if (window.updateShellStatus) window.updateShellStatus('Syncing attendance...');
      try {
        const userSchool = currentUser?.school;
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const [studentAttSnap, teacherAttSnap] = await Promise.all([db.collection('studentAttendance').where('date', '>=', thirtyDaysAgo).get(), db.collection('teacherAttendance').where('date', '>=', thirtyDaysAgo).get()]);
        const studentAttData = studentAttSnap.docs.map(d => ({
          ...d.data(),
          docId: d.id
        }));
        const teacherAttData = teacherAttSnap.docs.map(d => ({
          ...d.data(),
          docId: d.id
        }));
        if (studentAttData.length > 0) {
          setStudentAttendance(studentAttData);
          window.DataCacheManager.saveToCache('studentAttendance_' + (userSchool || 'all'), {
            docs: studentAttSnap.docs.map(d => ({
              id: d.id,
              data: d.data()
            }))
          });
        }
        if (teacherAttData.length > 0) {
          setTeacherAttendance(teacherAttData);
          window.DataCacheManager.saveToCache('teacherAttendance_' + (userSchool || 'all'), {
            docs: teacherAttSnap.docs.map(d => ({
              id: d.id,
              data: d.data()
            }))
          });
        }
        console.log('[SmartSync] ✅ Attendance synced:', studentAttData.length, 'student,', teacherAttData.length, 'teacher records');
        if (window.SmartSyncManager) window.SmartSyncManager.markSynced('attendance');
      } catch (e) {
        console.error('[SmartSync] Attendance fetch error:', e);
      }
    };
    const fetchCurriculumOnly = async () => {
      if (!currentUser) return;
      console.log('[SmartSync] 🔄 Refreshing curriculum data...');
      try {
        const curriculumSnap = await db.collection('curriculum').get();
        const currMap = {};
        curriculumSnap.docs.forEach(doc => {
          currMap[doc.id] = doc.data();
        });
        if (Object.keys(currMap).length > 0) {
          setCurriculum(currMap);
          window.DataCacheManager.saveToCache('curriculum', {
            docs: curriculumSnap.docs.map(d => ({
              id: d.id,
              data: d.data()
            }))
          });
        }
        console.log('[SmartSync] ✅ Curriculum synced:', Object.keys(currMap).length, 'records');
        if (window.SmartSyncManager) window.SmartSyncManager.markSynced('curriculum');
      } catch (e) {
        console.error('[SmartSync] Curriculum fetch error:', e);
      }
    };
    const fetchTeachersOnly = async () => {
      if (!currentUser) return;
      console.log('[SmartSync] 🔄 Refreshing teachers data...');
      try {
        const teachersSnap = await db.collection('teachers').get();
        const teachersData = teachersSnap.docs.map(d => ({
          ...d.data(),
          docId: d.id
        }));
        if (teachersData.length > 0) {
          setTeachers(teachersData);
          window.DataCacheManager.saveToCache('teachers_' + (currentUser?.school || 'all'), {
            docs: teachersSnap.docs.map(d => ({
              id: d.id,
              data: d.data()
            }))
          });
        }
        console.log('[SmartSync] ✅ Teachers synced:', teachersData.length, 'records');
        if (window.SmartSyncManager) window.SmartSyncManager.markSynced('teachers');
      } catch (e) {
        console.error('[SmartSync] Teachers fetch error:', e);
      }
    };
    const handleSmartRefresh = overdue => {
      console.log('[SmartSync] 🔄 Manual refresh triggered for:', overdue);
      if (overdue.includes('all')) {
        fetchData();
        return;
      }
      if (overdue.includes('attendance') || overdue.includes('todayAttendance')) {
        fetchAttendanceOnly();
      }
      if (overdue.includes('curriculum')) {
        fetchCurriculumOnly();
      }
      if (overdue.includes('teachers')) {
        fetchTeachersOnly();
      }
    };
    if (window.SmartSyncManager) {
      window.SmartSyncManager.setRefreshCallback(handleSmartRefresh);
      window.SmartSyncManager.registerInterval('attendance', fetchAttendanceOnly);
      window.SmartSyncManager.registerInterval('curriculum', fetchCurriculumOnly);
      window.SmartSyncManager.registerInterval('teachers', fetchTeachersOnly);
      console.log('[SmartSync] ✅ Tiered refresh intervals registered');
      console.log('[SmartSync] Current status:', window.SmartSyncManager.getStatus());
    }
    fetchData();
    window._smartRefreshData = handleSmartRefresh;
    window._forceFullRefresh = fetchData;
    return () => {
      if (window.SmartSyncManager) {
        window.SmartSyncManager.clearInterval('attendance');
        window.SmartSyncManager.clearInterval('curriculum');
        window.SmartSyncManager.clearInterval('teachers');
      }
    };
  }, [currentUser]);
  const computeAndSaveRankings = useCallback(async () => {
    try {
      console.log('📊 Computing school rankings...');
      const [currSnap, progSnap] = await Promise.all([db.collection('curriculum').get(), db.collection('chapterProgress').get()]);
      const currMap = {};
      currSnap.docs.forEach(doc => {
        currMap[doc.id] = doc.data();
      });
      const progMap = {};
      progSnap.docs.forEach(doc => {
        progMap[doc.id] = doc.data();
      });
      const rankings = SCHOOLS.map(school => {
        let total = 0,
          completed = 0;
        SUBJECTS.forEach(subject => {
          ['11', '12'].forEach(grade => {
            const docId = `${school}_${subject}_${grade}`;
            const chapters = currMap[docId]?.chapters || [];
            chapters.forEach(ch => {
              total++;
              const progressId = `${school}_${ch.id}`;
              const prog = progMap[progressId] || {};
              if (prog.completed === 'Yes') completed++;
            });
          });
        });
        return {
          school,
          total,
          completed,
          percentage: total ? Math.round(completed / total * 100) : 0
        };
      });
      rankings.sort((a, b) => b.percentage - a.percentage);
      await db.collection('system').doc('schoolRankings').set({
        rankings: rankings,
        updatedAt: new Date().toISOString(),
        totalSchools: SCHOOLS.length
      });
      console.log('✅ Rankings saved successfully');
      setPrecomputedRankings({
        rankings,
        updatedAt: new Date().toISOString()
      });
      return rankings;
    } catch (e) {
      console.error('Rankings computation error:', e);
      return null;
    }
  }, []);
  useEffect(() => {
    if (currentUser && !loading && precomputedRankings === null) {
      const isAdmin = currentUser.email === 'admin@avantifellows.org' || currentUser.role === 'super_admin' || currentUser.role === 'program_head' || currentUser.role === 'program_manager' || currentUser.role === 'associate_program_manager';
      if (isAdmin) {
        console.log('📊 Rankings not found - initializing for the first time...');
        computeAndSaveRankings();
      }
    }
  }, [currentUser, loading, precomputedRankings, computeAndSaveRankings]);
  const handleLogin = async () => {
    setAuthLoading(true);
    setLoginProgress('Connecting...');
    try {
      const email = (loginForm.email || '').trim().toLowerCase();
      const password = loginForm.password;
      const studentId = (loginForm.studentId || '').trim();
      const loginType = loginForm.loginType || 'teacher';
      if (loginType === 'student') {
        if (!studentId || !password) {
          alert('Please enter Student ID and password');
          setAuthLoading(false);
          setLoginProgress('');
          return;
        }
        if (password !== 'pass123') {
          alert('Invalid password. Default password is: pass123');
          setAuthLoading(false);
          setLoginProgress('');
          return;
        }
        try {
          setLoginProgress('Authenticating...');
          const authPromise = auth.signInAnonymously();
          const authResult = await Promise.race([authPromise, new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout. Please check your internet.')), 8000))]);
          console.log('✅ Anonymous auth successful');
          setLoginProgress('Finding student...');
          const snap = await db.collection('students').where('id', '==', studentId).limit(1).get();
          if (snap.empty) {
            alert('Student ID not found. Please contact your teacher.');
            await auth.signOut();
            setAuthLoading(false);
            setLoginProgress('');
            return;
          }
          const doc = snap.docs[0];
          const foundStudent = {
            ...doc.data(),
            docId: doc.id
          };
          console.log('✅ Found student:', foundStudent);
          if (foundStudent) {
            setLoginProgress('Loading dashboard...');
            const studentUser = {
              ...foundStudent,
              userType: 'student',
              studentId: studentId,
              loginTime: Date.now()
            };
            const sessionStr = JSON.stringify(studentUser);
            if (typeof window.safeStorage !== 'undefined') {
              window.safeStorage.setItem('studentSession', sessionStr);
            } else {
              try {
                localStorage.setItem('studentSession', sessionStr);
              } catch (e) {}
            }
            if (window.persistentStorage) {
              window.persistentStorage.setItem('studentSession', sessionStr).catch(() => {});
            }
            setCurrentUser(studentUser);
            setIsAdmin(false);
            setActiveTab('dashboard');
            setAuthLoading(false);
            setLoginProgress('');
          } else {
            alert('Student ID not found. Please contact your teacher.');
            setAuthLoading(false);
            setLoginProgress('');
            return;
          }
        } catch (e) {
          console.error('Student login error:', e);
          alert('Login failed: ' + (e.message || 'Please check your internet connection'));
          setAuthLoading(false);
          setLoginProgress('');
          return;
        }
      } else {
        if (!email || !password) {
          alert('Please enter email and password');
          setAuthLoading(false);
          setLoginProgress('');
          return;
        }
        setLoginProgress('Authenticating...');
        const authPromise = auth.signInWithEmailAndPassword(email, password);
        await Promise.race([authPromise, new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout. Please check your internet.')), 8000))]);
        setLoginProgress('Loading profile...');
      }
    } catch (e) {
      console.error('login error', e);
      const errorMsg = e.code === 'auth/wrong-password' ? 'Incorrect password' : e.code === 'auth/user-not-found' ? 'User not found' : e.code === 'auth/too-many-requests' ? 'Too many attempts. Try again later.' : e.message || 'Login failed. Please try again.';
      alert(errorMsg);
      setAuthLoading(false);
      setLoginProgress('');
    }
  };
  const handleLogout = async () => {
    console.log('🚪 Logout button clicked');
    const logoutBtns = document.querySelectorAll('.sidebar-logout');
    logoutBtns.forEach(btn => {
      btn.innerHTML = '<span>🔄</span> <span>Logging out...</span>';
      btn.style.pointerEvents = 'none';
    });
    try {
      if (typeof window.safeStorage !== 'undefined') {
        window.safeStorage.removeItem('studentSession');
        window.safeStorage.removeItem('teacherSession');
      } else {
        try {
          localStorage.removeItem('studentSession');
          localStorage.removeItem('teacherSession');
        } catch (e) {
          console.warn('localStorage clear error:', e);
        }
      }
      if (window.persistentStorage) {
        window.persistentStorage.removeItem('studentSession').catch(() => {});
        window.persistentStorage.removeItem('teacherSession').catch(() => {});
      }
      setPending2FAUser(null);
      setShow2FAVerify(false);
      setShow2FASetup(false);
      setNeeds2FASetup(false);
      setLoginProgress('');
      if (auth.currentUser) {
        console.log('🔐 Signing out from Firebase Auth');
        await auth.signOut();
      }
      setCurrentUser(null);
      setIsAdmin(false);
      setActiveTab('overview');
      setLoginForm({
        loginType: 'teacher',
        email: '',
        password: '',
        studentId: ''
      });
      console.log('✅ Logout successful');
    } catch (e) {
      console.error('logout error', e);
      try {
        setCurrentUser(null);
        setIsAdmin(false);
        setActiveTab('overview');
      } catch (resetError) {
        console.error('Reset error:', resetError);
        window.location.reload();
      }
    }
  };
  const complete2FAVerification = async () => {
    if (!pending2FAUser) return;
    const user = pending2FAUser;
    const userId = user.userType === 'superadmin' ? 'SUPER_ADMIN' : user.userType === 'manager' ? user.id : user.userType === 'apc' ? user.id || user.docId : user.afid;
    await addDeviceTrust(userId, user.email);
    console.log('✅ Device trusted after 2FA verification for:', user.email);
    if (user.userType === 'superadmin') {
      setIsSuperAdmin(true);
      setIsAdmin(true);
      const allManagersSnap = await db.collection('managers').where('status', '==', 'active').get();
      const allManagers = allManagersSnap.docs.map(d => ({
        ...d.data(),
        id: d.id
      }));
      setManagers(allManagers);
      const aySnap = await db.collection('system').doc('academicYear').get();
      if (aySnap.exists) setAcademicYearSettings(aySnap.data());
      setAccessibleSchools([...SCHOOLS]);
      setCurrentUser({
        name: 'Super Administrator',
        email: user.email,
        afid: 'SUPER_ADMIN',
        school: 'Admin',
        role: MANAGER_ROLES.SUPER_ADMIN
      });
      setActiveTab('managers');
    } else if (user.userType === 'manager') {
      setManagerProfile(user);
      const allManagersSnap = await db.collection('managers').where('status', '==', 'active').get();
      const allManagers = allManagersSnap.docs.map(d => ({
        ...d.data(),
        id: d.id
      }));
      setManagers(allManagers);
      const aySnap = await db.collection('system').doc('academicYear').get();
      if (aySnap.exists) setAcademicYearSettings(aySnap.data());
      const schools = getAccessibleSchools(user, allManagers);
      setAccessibleSchools(schools);
      setIsAdmin(true);
      setIsSuperAdmin(false);
      setCurrentUser({
        name: user.name,
        email: user.email,
        afid: user.id,
        docId: user.docId,
        school: schools[0] || 'Admin',
        role: user.role,
        directSchools: user.directSchools || []
      });
      setActiveTab('analytics');
    } else if (user.userType === 'teacher') {
      setCurrentUser(user);
      setIsAdmin(false);
      setActiveTab('overview');
      if (user.dob) {
        const d = new Date(user.dob);
        const now = new Date();
        if (d.getMonth() === now.getMonth() && d.getDate() === now.getDate()) {
          setShowConfetti(true);
          setCelebrationMessage(`🎂 Happy Birthday, ${user.name}!`);
          setTimeout(() => {
            setShowConfetti(false);
            setCelebrationMessage('');
          }, 8000);
        }
      }
      if (user.joiningDate) {
        const j = new Date(user.joiningDate);
        const now = new Date();
        if (j.getMonth() === now.getMonth() && j.getDate() === now.getDate() && j.getFullYear() < now.getFullYear()) {
          const years = now.getFullYear() - j.getFullYear();
          setShowConfetti(true);
          setCelebrationMessage(`🎉 Happy ${years} Year Work Anniversary, ${user.name}!`);
          setTimeout(() => {
            setShowConfetti(false);
            setCelebrationMessage('');
          }, 8000);
        }
      }
    } else if (user.userType === 'apc') {
      setCurrentUser(user);
      setIsAdmin(false);
      setActiveTab('overview');
      console.log('✅ APC login completed:', user.name);
    }
    setPending2FAUser(null);
    setShow2FAVerify(false);
    setShow2FASetup(false);
    setNeeds2FASetup(false);
  };
  const handle2FASetupComplete = async () => {
    if (pending2FAUser) {
      const userId = pending2FAUser.userType === 'superadmin' ? 'SUPER_ADMIN' : pending2FAUser.userType === 'manager' ? pending2FAUser.id : pending2FAUser.userType === 'apc' ? pending2FAUser.id || pending2FAUser.docId : pending2FAUser.afid;
      await addDeviceTrust(userId, pending2FAUser.email);
      console.log('✅ Device trusted after 2FA setup for:', pending2FAUser.email);
    }
    setShow2FASetup(false);
    setNeeds2FASetup(false);
    complete2FAVerification();
  };
  const cancel2FA = async () => {
    setPending2FAUser(null);
    setShow2FAVerify(false);
    setShow2FASetup(false);
    setNeeds2FASetup(false);
    if (auth.currentUser) {
      await auth.signOut();
    }
    setCurrentUser(null);
    setIsAdmin(false);
  };
  const updateChapterProgress = useCallback(async (school, chapterId, field, value) => {
    try {
      const progressId = `${school}_${chapterId}`;
      const prev = chapterProgress[progressId] || {};
      const updated = {
        ...prev,
        [field]: value,
        school,
        chapterId,
        updatedAt: new Date().toISOString()
      };
      await db.collection('chapterProgress').doc(progressId).set(updated, {
        merge: true
      });
      setChapterProgress(prevMap => ({
        ...prevMap,
        [progressId]: updated
      }));
      if (field === 'completed') {
        if (window._rankingsUpdateTimeout) clearTimeout(window._rankingsUpdateTimeout);
        window._rankingsUpdateTimeout = setTimeout(() => {
          computeAndSaveRankings();
        }, 2000);
      }
      if (field === 'completed' && (value === 'Yes' || value === true) || updated.completed === 'Yes' || updated.completed === true) {
        setCelebrationMessage('🎉 Chapter marked as completed!');
        setShowConfetti(true);
        setTimeout(() => {
          setShowConfetti(false);
          setCelebrationMessage('');
        }, 5000);
      }
    } catch (e) {
      console.error('Update error', e);
      alert('Failed to update: ' + e.message);
    }
  }, [chapterProgress, computeAndSaveRankings]);
  const addChapter = async (school, subject, grade, chapter) => {
    try {
      const docId = `${school}_${subject}_${grade}`;
      const doc = await db.collection('curriculum').doc(docId).get();
      const existing = doc.exists ? doc.data().chapters || [] : [];
      chapter.id = `${subject.charAt(0)}${grade}-${existing.length + 1}-${Date.now().toString().slice(-4)}`;
      const updated = [...existing, chapter];
      await db.collection('curriculum').doc(docId).set({
        chapters: updated
      });
      alert('Chapter added successfully!');
    } catch (e) {
      console.error('Add error', e);
      alert('Failed to add: ' + e.message);
    }
  };
  const updateChapter = async (school, subject, grade, chapterId, updates) => {
    try {
      const docId = `${school}_${subject}_${grade}`;
      const doc = await db.collection('curriculum').doc(docId).get();
      const existing = doc.exists ? doc.data().chapters || [] : [];
      const index = existing.findIndex(ch => ch.id === chapterId);
      if (index === -1) {
        alert('Chapter not found');
        return;
      }
      existing[index] = {
        ...existing[index],
        ...updates
      };
      await db.collection('curriculum').doc(docId).set({
        chapters: existing
      });
      alert('Chapter updated successfully!');
    } catch (e) {
      console.error('Update error', e);
      alert('Failed to update: ' + e.message);
    }
  };
  const deleteChapter = async (school, subject, grade, chapterId) => {
    if (!confirm('Delete this chapter?')) return;
    try {
      const docId = `${school}_${subject}_${grade}`;
      const doc = await db.collection('curriculum').doc(docId).get();
      const existing = doc.exists ? doc.data().chapters || [] : [];
      const updated = existing.filter(ch => ch.id !== chapterId);
      await db.collection('curriculum').doc(docId).set({
        chapters: updated
      });
      alert('Chapter deleted successfully');
    } catch (e) {
      console.error('Delete error', e);
      alert('Failed to delete: ' + e.message);
    }
  };
  function Confetti() {
    const primary = ['#F97316', '#FACC15', '#22C55E', '#0EA5E9', '#6366F1', '#EC4899'];
    const secondary = ['#FDBA74', '#FDE68A', '#86EFAC', '#7DD3FC', '#A5B4FC', '#F9A8D4'];
    const pieces = 120;
    return React.createElement("div", {
      className: "fixed inset-0 pointer-events-none z-[9999]"
    }, Array.from({
      length: pieces
    }).map((_, i) => {
      const colorIndex = Math.floor(Math.random() * primary.length);
      const left = Math.random() * 100;
      const size = 6 + Math.random() * 10;
      const delay = Math.random() * 1.2;
      const duration = 2.4 + Math.random() * 1.2;
      const isCircle = Math.random() > 0.6;
      return React.createElement("div", {
        key: i,
        className: "confetti-piece",
        style: {
          left: `${left}%`,
          top: '-40px',
          width: `${size * 1.8}px`,
          height: `${size}px`,
          background: `linear-gradient(135deg, ${primary[colorIndex]}, ${secondary[colorIndex]})`,
          borderRadius: isCircle ? '999px' : '6px',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.5)',
          animationDelay: `${delay}s`,
          animationDuration: `${duration}s`,
          opacity: 0.95
        }
      });
    }));
  }
  if (loading) {
    return React.createElement("div", {
      className: "min-h-screen avanti-gradient flex items-center justify-center"
    }, React.createElement("div", {
      style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }
    }, React.createElement("img", {
      src: AVANTI_LOGO,
      alt: "Avanti Fellows",
      style: { width: '60px', height: '60px', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }
    }), React.createElement("div", {
      style: { position: 'relative', width: '100px', height: '100px' }
    }, React.createElement("svg", {
      viewBox: "0 0 120 120",
      style: { width: '100px', height: '100px', transform: 'rotate(-90deg)' }
    }, React.createElement("circle", {
      cx: "60", cy: "60", r: "54", fill: "none", stroke: "#F4B41A", strokeWidth: "10", opacity: "0.4"
    }), React.createElement("circle", {
      cx: "60", cy: "60", r: "54", fill: "none", stroke: "#8B1A1A", strokeWidth: "10", strokeLinecap: "round",
      strokeDasharray: "339.292", strokeDashoffset: "135.717",
      style: { filter: 'drop-shadow(0 0 6px rgba(139,26,26,0.4))', animation: 'react-cpl-pulse 2s ease-in-out infinite alternate' }
    })), React.createElement("div", {
      style: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }
    }, React.createElement("span", {
      style: { fontSize: '20px', fontWeight: 800, color: 'white', textShadow: '0 2px 8px rgba(0,0,0,0.15)' }
    }, "\u23F3"))), React.createElement("div", {
      style: { color: 'white', fontSize: '18px', fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.15)' }
    }, "Loading Dashboard..."), React.createElement("div", {
      style: { color: 'rgba(255,255,255,0.85)', fontSize: '12px', background: 'rgba(255,255,255,0.15)', padding: '5px 14px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.2)' }
    }, "Fetching your school data"), React.createElement("style", null, "@keyframes react-cpl-pulse { 0% { stroke-dashoffset: 305.363; } 100% { stroke-dashoffset: 135.717; } }")));
  }
  if (show2FASetup && pending2FAUser) {
    return React.createElement("div", {
      className: "min-h-screen avanti-gradient flex items-center justify-center p-4"
    }, React.createElement(TwoFactorSetupModal, {
      user: pending2FAUser,
      onClose: cancel2FA,
      onSetupComplete: handle2FASetupComplete
    }));
  }
  if (show2FAVerify && pending2FAUser) {
    return React.createElement("div", {
      className: "min-h-screen avanti-gradient flex items-center justify-center p-4"
    }, React.createElement(TwoFactorVerifyModal, {
      user: pending2FAUser,
      onVerified: complete2FAVerification,
      onCancel: cancel2FA
    }));
  }
  if (!currentUser) {
    return React.createElement("div", {
      className: "min-h-screen avanti-gradient flex items-center justify-center p-4"
    }, React.createElement("div", {
      className: "bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md"
    }, React.createElement("div", {
      className: "text-center mb-8"
    }, React.createElement("img", {
      src: AVANTI_LOGO,
      alt: "Avanti Fellows",
      className: "w-20 h-20 mx-auto mb-4"
    }), React.createElement("h1", {
      className: "text-4xl font-bold text-gray-800 mb-2"
    }, "Curriculum Tracker"), React.createElement("p", {
      className: "text-gray-600 mt-3"
    }, "Avanti Fellows")), React.createElement("div", {
      className: "flex gap-2 mb-6"
    }, React.createElement("button", {
      onClick: () => setLoginForm({
        ...loginForm,
        loginType: 'teacher'
      }),
      className: `flex-1 py-3 rounded-xl font-semibold ${loginForm.loginType === 'teacher' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`
    }, "\uD83D\uDC68\u200D\uD83C\uDFEB Teacher"), React.createElement("button", {
      onClick: () => setLoginForm({
        ...loginForm,
        loginType: 'student'
      }),
      className: `flex-1 py-3 rounded-xl font-semibold ${loginForm.loginType === 'student' ? 'bg-green-600 text-white' : 'bg-gray-200'}`
    }, "\uD83D\uDC68\u200D\uD83C\uDF93 Student")), React.createElement("div", {
      className: "space-y-5"
    }, loginForm.loginType === 'student' ? React.createElement(React.Fragment, null, React.createElement("input", {
      type: "text",
      className: "w-full px-5 py-4 border-2 border-gray-300 rounded-xl text-lg",
      value: loginForm.studentId || '',
      onChange: e => setLoginForm({
        ...loginForm,
        studentId: e.target.value
      }),
      placeholder: "Student ID"
    }), React.createElement("input", {
      type: "password",
      className: "w-full px-5 py-4 border-2 border-gray-300 rounded-xl text-lg",
      value: loginForm.password,
      onChange: e => setLoginForm({
        ...loginForm,
        password: e.target.value
      }),
      placeholder: "Password (pass123)",
      onKeyPress: e => e.key === 'Enter' && handleLogin()
    }), React.createElement("p", {
      className: "text-sm text-gray-600 text-center"
    }, "Default password: ", React.createElement("strong", null, "pass123"))) : React.createElement(React.Fragment, null, React.createElement("input", {
      type: "email",
      className: "w-full px-5 py-4 border-2 border-gray-300 rounded-xl text-lg",
      value: loginForm.email,
      onChange: e => setLoginForm({
        ...loginForm,
        email: e.target.value
      }),
      placeholder: "Email"
    }), React.createElement("input", {
      type: "password",
      className: "w-full px-5 py-4 border-2 border-gray-300 rounded-xl text-lg",
      value: loginForm.password,
      onChange: e => setLoginForm({
        ...loginForm,
        password: e.target.value
      }),
      placeholder: "Password",
      onKeyPress: e => e.key === 'Enter' && handleLogin()
    })), React.createElement("button", {
      onClick: handleLogin,
      disabled: authLoading,
      className: "w-full avanti-gradient text-white py-4 rounded-xl font-bold text-lg disabled:opacity-70 transition-all"
    }, authLoading ? React.createElement("span", {
      className: "login-spinner"
    }, React.createElement("span", {
      className: "login-spinner-icon"
    }), React.createElement("span", {
      className: "login-progress-text"
    }, loginProgress || 'Please wait...')) : 'Login'))));
  }
  if (currentUser && currentUser.userType === 'student') {
    return React.createElement(StudentDashboard, {
      currentUser: currentUser,
      handleLogout: handleLogout
    });
  }
  return React.createElement(React.Fragment, null, currentUser && React.createElement(OnlineStatusCard, {
    currentUser: currentUser
  }), currentUser && React.createElement(DataFreshnessIndicator, null), isAdmin ? React.createElement(AdminView, {
    currentUser: currentUser,
    handleLogout: handleLogout,
    teachers: teachers,
    students: students,
    curriculum: curriculum,
    chapterProgress: chapterProgress,
    studentAttendance: studentAttendance,
    teacherAttendance: teacherAttendance,
    schoolInfo: schoolInfo,
    setSchoolInfo: setSchoolInfo,
    addChapter: addChapter,
    updateChapter: updateChapter,
    deleteChapter: deleteChapter,
    leaveAdjustments: leaveAdjustments,
    setLeaveAdjustments: setLeaveAdjustments,
    managers: managers,
    isSuperAdmin: isSuperAdmin,
    accessibleSchools: accessibleSchools,
    academicYearSettings: academicYearSettings,
    floatingCelebration: floatingCelebration,
    setFloatingCelebration: setFloatingCelebration
  }) : React.createElement(TeacherView, {
    currentUser: currentUser,
    handleLogout: handleLogout,
    showConfetti: showConfetti,
    Confetti: Confetti,
    celebrationMessage: celebrationMessage,
    teachers: teachers,
    students: students,
    curriculum: curriculum,
    chapterProgress: chapterProgress,
    studentAttendance: studentAttendance,
    teacherAttendance: teacherAttendance,
    schoolInfo: schoolInfo,
    setSchoolInfo: setSchoolInfo,
    updateChapterProgress: updateChapterProgress,
    activeTab: activeTab,
    setActiveTab: setActiveTab,
    leaveAdjustments: leaveAdjustments,
    floatingCelebration: floatingCelebration,
    setFloatingCelebration: setFloatingCelebration,
    precomputedRankings: precomputedRankings,
    managers: managers
  }));
}
function AdminStudentProfiles({
  accessibleSchools = SCHOOLS,
  isSuperAdmin = true,
  isDirector = false
}) {
  const [studentProfiles, setStudentProfiles] = useState([]);
  const [filterSchool, setFilterSchool] = useState('All');
  const [filterGrade, setFilterGrade] = useState('All');
  const categoryChartRef = useRef(null);
  const genderChartRef = useRef(null);
  const streamChartRef = useRef(null);
  const schoolDistChartRef = useRef(null);
  const chartInstances = useRef({});
  const hasFullDataAccess = isSuperAdmin || isDirector;
  const availableSchools = hasFullDataAccess ? SCHOOLS : accessibleSchools;
  useEffect(() => {
    const fetchData = async () => {
      const profilesSnap = await db.collection('studentProfiles').get();
      let profiles = profilesSnap.docs.map(d => ({
        ...d.data(),
        id: d.id
      }));
      if (!hasFullDataAccess) {
        profiles = profiles.filter(p => accessibleSchools.includes(p.school));
      }
      setStudentProfiles(profiles);
    };
    fetchData();
  }, [hasFullDataAccess, accessibleSchools]);
  const filteredProfiles = studentProfiles.filter(p => {
    if (filterSchool !== 'All' && p.school !== filterSchool) return false;
    if (filterGrade !== 'All' && p.grade !== filterGrade) return false;
    return true;
  });
  const stats = useMemo(() => {
    const categoryCount = {};
    const genderCount = {
      Male: 0,
      Female: 0,
      Other: 0
    };
    const streamCount = {
      JEE: 0,
      NEET: 0,
      Other: 0
    };
    const categoryByGender = {};
    const schoolCount = {};
    filteredProfiles.forEach(p => {
      const cat = p.category || 'Not Specified';
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      let gender = p.gender || 'Other';
      if (gender === 'Male' || gender === 'Female') {
        genderCount[gender]++;
      } else {
        genderCount.Other++;
      }
      const stream = p.stream || 'Other';
      if (stream === 'JEE' || stream === 'NEET') {
        streamCount[stream]++;
      } else {
        streamCount.Other++;
      }
      if (!categoryByGender[cat]) {
        categoryByGender[cat] = {
          Male: 0,
          Female: 0,
          Other: 0
        };
      }
      if (gender === 'Male' || gender === 'Female') {
        categoryByGender[cat][gender]++;
      } else {
        categoryByGender[cat].Other++;
      }
      const school = p.school || 'Unknown';
      schoolCount[school] = (schoolCount[school] || 0) + 1;
    });
    return {
      categoryCount,
      genderCount,
      streamCount,
      categoryByGender,
      schoolCount
    };
  }, [filteredProfiles]);
  useEffect(() => {
    Object.values(chartInstances.current).forEach(chart => {
      if (chart) chart.destroy();
    });
    chartInstances.current = {};
    if (categoryChartRef.current && Object.keys(stats.categoryCount).length > 0) {
      const ctx = categoryChartRef.current.getContext('2d');
      const labels = Object.keys(stats.categoryCount);
      const data = Object.values(stats.categoryCount);
      const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];
      chartInstances.current.category = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: colors.slice(0, labels.length),
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Category Distribution',
              font: {
                size: 16,
                weight: 'bold'
              }
            },
            legend: {
              position: 'bottom',
              labels: {
                padding: 15
              }
            }
          }
        }
      });
    }
    if (genderChartRef.current) {
      const ctx = genderChartRef.current.getContext('2d');
      chartInstances.current.gender = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Male', 'Female', 'Other'],
          datasets: [{
            data: [stats.genderCount.Male, stats.genderCount.Female, stats.genderCount.Other],
            backgroundColor: ['#6366F1', '#EC4899', '#9CA3AF'],
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Gender Distribution',
              font: {
                size: 16,
                weight: 'bold'
              }
            },
            legend: {
              position: 'bottom',
              labels: {
                padding: 15
              }
            }
          }
        }
      });
    }
    if (streamChartRef.current && Object.keys(stats.categoryByGender).length > 0) {
      const ctx = streamChartRef.current.getContext('2d');
      const categories = Object.keys(stats.categoryByGender);
      chartInstances.current.stream = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: categories,
          datasets: [{
            label: 'Male',
            data: categories.map(cat => stats.categoryByGender[cat].Male),
            backgroundColor: '#6366F1',
            borderRadius: 4
          }, {
            label: 'Female',
            data: categories.map(cat => stats.categoryByGender[cat].Female),
            backgroundColor: '#EC4899',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Category-wise Gender Distribution',
              font: {
                size: 16,
                weight: 'bold'
              }
            },
            legend: {
              position: 'bottom'
            }
          },
          scales: {
            x: {
              stacked: false
            },
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      });
    }
    if (schoolDistChartRef.current && Object.keys(stats.schoolCount).length > 0) {
      const ctx = schoolDistChartRef.current.getContext('2d');
      const schools = Object.keys(stats.schoolCount);
      const counts = Object.values(stats.schoolCount);
      chartInstances.current.schoolDist = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: schools.map(s => s.replace('CoE ', '').replace('JNV ', '')),
          datasets: [{
            label: 'Students',
            data: counts,
            backgroundColor: '#F4B41A',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'School-wise Distribution',
              font: {
                size: 16,
                weight: 'bold'
              }
            },
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      });
    }
    return () => {
      Object.values(chartInstances.current).forEach(chart => {
        if (chart) chart.destroy();
      });
    };
  }, [stats]);
  const handleExport = () => {
    const exportData = filteredProfiles.map(p => ({
      'Student ID': p.studentId,
      'First Name': p.firstName,
      'Last Name': p.lastName,
      'Email': p.email,
      'Phone': p.phone,
      'DOB': p.dob,
      'Grade': p.grade,
      'Category': p.category,
      'Stream': p.stream,
      'School': p.school,
      'Father Name': p.fatherName,
      'Father Occupation': p.fatherOccupation,
      'Father Education': p.fatherEducation,
      'Mother Name': p.motherName,
      'Mother Occupation': p.motherOccupation,
      'Mother Education': p.motherEducation,
      'Family Income': p.familyIncome,
      'Address': p.address,
      'State': p.state,
      'District': p.district,
      'Pincode': p.pincode,
      'WhatsApp': p.whatsappNumber,
      '10th %': p.percentage10th,
      '11th %': p.percentage11th || 'N/A'
    }));
    exportToExcel(exportData, 'student_profiles');
  };
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("div", {
    className: "flex justify-between items-center flex-wrap gap-4"
  }, React.createElement("div", null, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "\uD83D\uDC68\u200D\uD83C\uDF93 Student Profiles (", filteredProfiles.length, ")"), !isSuperAdmin && React.createElement("p", {
    className: "text-sm text-gray-500 mt-1"
  }, "Showing profiles for your assigned schools")), React.createElement("button", {
    onClick: handleExport,
    className: "px-6 py-3 bg-green-600 text-white rounded-xl font-semibold"
  }, "\uD83D\uDCE5 Export to Excel")), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "\uD83D\uDD0D Filters"), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "School"), React.createElement("select", {
    value: filterSchool,
    onChange: e => setFilterSchool(e.target.value),
    className: "w-full border-2 px-4 py-3 rounded-xl"
  }, React.createElement("option", {
    value: "All"
  }, "All Schools"), availableSchools.map(s => React.createElement("option", {
    key: s,
    value: s
  }, s)))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Grade"), React.createElement("select", {
    value: filterGrade,
    onChange: e => setFilterGrade(e.target.value),
    className: "w-full border-2 px-4 py-3 rounded-xl"
  }, React.createElement("option", {
    value: "All"
  }, "All Grades"), React.createElement("option", {
    value: "11"
  }, "Class 11"), React.createElement("option", {
    value: "12"
  }, "Class 12"))))), React.createElement("div", {
    className: "grid grid-cols-2 md:grid-cols-4 gap-4"
  }, React.createElement("div", {
    className: "bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl shadow-lg"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Total Profiles"), React.createElement("div", {
    className: "text-3xl font-bold"
  }, filteredProfiles.length)), React.createElement("div", {
    className: "bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-xl shadow-lg"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Male Students"), React.createElement("div", {
    className: "text-3xl font-bold"
  }, stats.genderCount.Male), React.createElement("div", {
    className: "text-xs opacity-75"
  }, filteredProfiles.length > 0 ? Math.round(stats.genderCount.Male / filteredProfiles.length * 100) : 0, "%")), React.createElement("div", {
    className: "bg-gradient-to-r from-pink-500 to-rose-600 text-white p-4 rounded-xl shadow-lg"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Female Students"), React.createElement("div", {
    className: "text-3xl font-bold"
  }, stats.genderCount.Female), React.createElement("div", {
    className: "text-xs opacity-75"
  }, filteredProfiles.length > 0 ? Math.round(stats.genderCount.Female / filteredProfiles.length * 100) : 0, "%")), React.createElement("div", {
    className: "bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-xl shadow-lg"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Categories"), React.createElement("div", {
    className: "text-3xl font-bold"
  }, Object.keys(stats.categoryCount).length))), filteredProfiles.length > 0 && React.createElement("div", {
    className: "grid md:grid-cols-2 gap-6"
  }, React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("div", {
    style: {
      height: '300px'
    }
  }, React.createElement("canvas", {
    ref: categoryChartRef
  }))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("div", {
    style: {
      height: '300px'
    }
  }, React.createElement("canvas", {
    ref: genderChartRef
  }))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("div", {
    style: {
      height: '300px'
    }
  }, React.createElement("canvas", {
    ref: streamChartRef
  }))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("div", {
    style: {
      height: '300px'
    }
  }, React.createElement("canvas", {
    ref: schoolDistChartRef
  })))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "\uD83D\uDCCA Category-wise Breakdown"), React.createElement("div", {
    className: "overflow-x-auto"
  }, React.createElement("table", {
    className: "w-full"
  }, React.createElement("thead", {
    className: "avanti-gradient-light"
  }, React.createElement("tr", null, React.createElement("th", {
    className: "p-3 text-left"
  }, "Category"), React.createElement("th", {
    className: "p-3 text-center"
  }, "Male"), React.createElement("th", {
    className: "p-3 text-center"
  }, "Female"), React.createElement("th", {
    className: "p-3 text-center"
  }, "Total"), React.createElement("th", {
    className: "p-3 text-center"
  }, "%"))), React.createElement("tbody", null, Object.entries(stats.categoryByGender).map(([cat, counts]) => React.createElement("tr", {
    key: cat,
    className: "border-b hover:bg-gray-50"
  }, React.createElement("td", {
    className: "p-3 font-semibold"
  }, cat), React.createElement("td", {
    className: "p-3 text-center text-indigo-600 font-bold"
  }, counts.Male), React.createElement("td", {
    className: "p-3 text-center text-pink-600 font-bold"
  }, counts.Female), React.createElement("td", {
    className: "p-3 text-center font-bold"
  }, counts.Male + counts.Female + counts.Other), React.createElement("td", {
    className: "p-3 text-center"
  }, filteredProfiles.length > 0 ? Math.round((counts.Male + counts.Female + counts.Other) / filteredProfiles.length * 100) : 0, "%"))))))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg overflow-x-auto"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "\uD83D\uDCCB Student Profiles List"), React.createElement("table", {
    className: "w-full"
  }, React.createElement("thead", {
    className: "avanti-gradient-light"
  }, React.createElement("tr", null, React.createElement("th", {
    className: "p-3 text-left"
  }, "Student ID"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Name"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Grade"), React.createElement("th", {
    className: "p-3 text-left"
  }, "School"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Stream"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Category"), React.createElement("th", {
    className: "p-3 text-left"
  }, "10th %"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Contact"))), React.createElement("tbody", null, filteredProfiles.length === 0 ? React.createElement("tr", null, React.createElement("td", {
    colSpan: "8",
    className: "p-8 text-center text-gray-500"
  }, "No student profiles found")) : filteredProfiles.map(profile => React.createElement("tr", {
    key: profile.id,
    className: "border-b hover:bg-gray-50"
  }, React.createElement("td", {
    className: "p-3 font-mono"
  }, profile.studentId), React.createElement("td", {
    className: "p-3 font-semibold"
  }, profile.firstName, " ", profile.lastName), React.createElement("td", {
    className: "p-3"
  }, profile.grade, "th"), React.createElement("td", {
    className: "p-3"
  }, profile.school), React.createElement("td", {
    className: "p-3"
  }, profile.stream), React.createElement("td", {
    className: "p-3"
  }, React.createElement("span", {
    className: `px-2 py-1 rounded text-xs font-semibold ${profile.category === 'General' ? 'bg-blue-100 text-blue-700' : profile.category === 'OBC' ? 'bg-green-100 text-green-700' : profile.category === 'SC' ? 'bg-yellow-100 text-yellow-700' : profile.category === 'ST' ? 'bg-orange-100 text-orange-700' : profile.category === 'General EWS' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`
  }, profile.category || 'N/A')), React.createElement("td", {
    className: "p-3"
  }, profile.percentage10th, "%"), React.createElement("td", {
    className: "p-3 text-sm"
  }, profile.phone)))))));
}
function APCSyllabusView({
  grade,
  currentUser,
  curriculum,
  chapterProgress,
  teachers
}) {
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [expandedChapters, setExpandedChapters] = useState({});
  const [priorityFilter, setPriorityFilter] = useState('all');
  const mySchool = currentUser.school;
  const subjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
  const schoolTeachers = teachers.filter(t => t.school === mySchool && !t.isArchived);
  const availableSubjects = [...new Set(schoolTeachers.map(t => t.subject).filter(Boolean))];
  const getChaptersForSubject = subject => {
    const docId = `${mySchool}_${subject}_${grade}`;
    return (curriculum[docId]?.chapters || []).map(ch => ({
      ...ch,
      subject,
      progressId: `${mySchool}_${ch.id}`
    }));
  };
  const allChapters = selectedSubject === 'All' ? availableSubjects.flatMap(getChaptersForSubject) : getChaptersForSubject(selectedSubject);
  const chapters = priorityFilter === 'all' ? allChapters : allChapters.filter(ch => (ch.priority || 'high') === priorityFilter);
  const priorityCounts = {
    all: allChapters.length,
    high: allChapters.filter(ch => ch.priority === 'high' || !ch.priority).length,
    medium: allChapters.filter(ch => ch.priority === 'medium').length,
    low: allChapters.filter(ch => ch.priority === 'low').length
  };
  const completedCount = chapters.filter(ch => {
    const prog = chapterProgress[ch.progressId] || {};
    return prog.completed === 'Yes';
  }).length;
  const progressPercentage = chapters.length > 0 ? Math.round(completedCount / chapters.length * 100) : 0;
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("div", {
    className: "flex flex-col md:flex-row md:items-center md:justify-between gap-4"
  }, React.createElement("div", null, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "\uD83D\uDCDA Class ", grade, " Syllabus"), React.createElement("p", {
    className: "text-gray-600 mt-1"
  }, "View-only access for ", mySchool), React.createElement("span", {
    className: "inline-block mt-2 px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-semibold"
  }, "\uD83D\uDC64 APC View")), React.createElement("div", {
    className: "flex items-center gap-3"
  }, React.createElement("label", {
    className: "font-semibold"
  }, "Subject:"), React.createElement("select", {
    value: selectedSubject,
    onChange: e => setSelectedSubject(e.target.value),
    className: "px-4 py-2 border-2 rounded-xl font-semibold"
  }, React.createElement("option", {
    value: "All"
  }, "All Subjects"), availableSubjects.map(sub => React.createElement("option", {
    key: sub,
    value: sub
  }, sub))))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("div", {
    className: "grid grid-cols-2 md:grid-cols-4 gap-4"
  }, React.createElement("div", {
    className: "text-center p-4 bg-blue-50 rounded-xl"
  }, React.createElement("div", {
    className: "text-3xl font-bold text-blue-600"
  }, chapters.length), React.createElement("div", {
    className: "text-sm text-gray-600"
  }, "Total Chapters")), React.createElement("div", {
    className: "text-center p-4 bg-green-50 rounded-xl"
  }, React.createElement("div", {
    className: "text-3xl font-bold text-green-600"
  }, completedCount), React.createElement("div", {
    className: "text-sm text-gray-600"
  }, "Completed")), React.createElement("div", {
    className: "text-center p-4 bg-orange-50 rounded-xl"
  }, React.createElement("div", {
    className: "text-3xl font-bold text-orange-600"
  }, chapters.length - completedCount), React.createElement("div", {
    className: "text-sm text-gray-600"
  }, "Pending")), React.createElement("div", {
    className: "text-center p-4 bg-purple-50 rounded-xl"
  }, React.createElement("div", {
    className: "text-3xl font-bold text-purple-600"
  }, progressPercentage, "%"), React.createElement("div", {
    className: "text-sm text-gray-600"
  }, "Progress")))), React.createElement("div", {
    className: "bg-white p-4 rounded-2xl shadow-lg"
  }, React.createElement("div", {
    className: "flex flex-wrap items-center gap-3"
  }, React.createElement("span", {
    className: "font-bold text-gray-700"
  }, "\uD83C\uDFAF Filter by Priority:"), React.createElement("div", {
    className: "flex flex-wrap gap-2"
  }, React.createElement("button", {
    onClick: () => setPriorityFilter('all'),
    className: `px-4 py-2 rounded-xl font-semibold transition-all ${priorityFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`
  }, "\uD83D\uDCCB All (", priorityCounts.all, ")"), React.createElement("button", {
    onClick: () => setPriorityFilter('high'),
    className: `px-4 py-2 rounded-xl font-semibold transition-all ${priorityFilter === 'high' ? 'bg-green-500 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'}`
  }, "\uD83D\uDFE2 High (", priorityCounts.high, ")"), React.createElement("button", {
    onClick: () => setPriorityFilter('medium'),
    className: `px-4 py-2 rounded-xl font-semibold transition-all ${priorityFilter === 'medium' ? 'bg-yellow-500 text-white' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'}`
  }, "\uD83D\uDFE1 Medium (", priorityCounts.medium, ")"), React.createElement("button", {
    onClick: () => setPriorityFilter('low'),
    className: `px-4 py-2 rounded-xl font-semibold transition-all ${priorityFilter === 'low' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`
  }, "\uD83D\uDD34 Low (", priorityCounts.low, ")")))), chapters.length === 0 ? React.createElement("div", {
    className: "bg-white p-8 rounded-2xl text-center"
  }, React.createElement("p", {
    className: "text-gray-600"
  }, "No chapters found for the selected filters.")) : React.createElement("div", {
    className: "grid md:grid-cols-2 lg:grid-cols-3 gap-6"
  }, chapters.map((chapter, idx) => {
    const prog = chapterProgress[chapter.progressId] || {};
    const completedTopics = prog.completedTopics || [];
    const allTopics = chapter.topics || [];
    const progress = allTopics.length ? Math.round(completedTopics.length / allTopics.length * 100) : 0;
    const isExpanded = expandedChapters[chapter.id + chapter.subject];
    const isCompleted = prog.completed === 'Yes';
    return React.createElement("div", {
      key: idx,
      className: `rounded-2xl shadow-lg p-5 transition-all ${isCompleted ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300' : progress > 50 ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300' : 'bg-white border-2 border-gray-200'}`
    }, React.createElement("div", {
      className: "flex justify-between items-start mb-3 gap-3"
    }, React.createElement("div", {
      className: "flex-1 min-w-0"
    }, React.createElement("div", {
      className: "flex items-center gap-2 mb-1"
    }, React.createElement("span", {
      className: `px-2 py-1 text-xs font-bold rounded ${chapter.subject === 'Physics' ? 'bg-blue-100 text-blue-700' : chapter.subject === 'Chemistry' ? 'bg-purple-100 text-purple-700' : chapter.subject === 'Mathematics' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`
    }, chapter.subject), isCompleted && React.createElement("span", {
      className: "text-green-600"
    }, "\u2705")), React.createElement("h3", {
      className: "text-lg font-bold break-words"
    }, chapter.name), React.createElement("div", {
      className: "mt-2"
    }, (chapter.priority === 'high' || !chapter.priority) && React.createElement("span", {
      className: "priority-badge priority-high text-xs"
    }, "\uD83D\uDFE2 High Priority"), chapter.priority === 'medium' && React.createElement("span", {
      className: "priority-badge priority-medium text-xs"
    }, "\uD83D\uDFE1 Medium Priority"), chapter.priority === 'low' && React.createElement("span", {
      className: "priority-badge priority-low text-xs"
    }, "\uD83D\uDD34 Low Priority"))), React.createElement("button", {
      onClick: () => setExpandedChapters(prev => ({
        ...prev,
        [chapter.id + chapter.subject]: !prev[chapter.id + chapter.subject]
      })),
      className: "text-sm px-3 py-1 bg-gray-100 rounded-lg font-semibold flex-shrink-0"
    }, isExpanded ? '▲' : '▼')), React.createElement("div", {
      className: "space-y-2"
    }, React.createElement("div", {
      className: "flex justify-between text-sm"
    }, React.createElement("span", {
      className: "font-semibold"
    }, "Topics Progress"), React.createElement("span", {
      className: "font-bold"
    }, completedTopics.length, "/", allTopics.length)), React.createElement("div", {
      className: "h-2 bg-gray-200 rounded-full"
    }, React.createElement("div", {
      className: "h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all",
      style: {
        width: `${progress}%`
      }
    }))), isExpanded && React.createElement("div", {
      className: "mt-4 space-y-3"
    }, React.createElement("div", {
      className: "bg-gray-50 p-3 rounded-lg max-h-40 overflow-y-auto"
    }, React.createElement("p", {
      className: "text-sm font-bold mb-2"
    }, "Topics:"), allTopics.map((topic, tidx) => {
      const topicName = typeof topic === 'string' ? topic : topic.name;
      const isChecked = completedTopics.includes(topicName) || completedTopics.includes(topic);
      return React.createElement("div", {
        key: tidx,
        className: `text-sm py-1 ${isChecked ? 'text-gray-500 line-through' : ''}`
      }, isChecked ? '✅' : '⬜', " ", topicName);
    })), React.createElement("div", {
      className: "grid grid-cols-2 gap-2 text-sm"
    }, React.createElement("div", {
      className: "bg-gray-50 p-2 rounded"
    }, React.createElement("span", {
      className: "font-bold"
    }, "Target:"), " ", chapter.targetDate || '—'), React.createElement("div", {
      className: "bg-gray-50 p-2 rounded"
    }, React.createElement("span", {
      className: "font-bold"
    }, "Completed:"), " ", prog.completionDate || '—'), React.createElement("div", {
      className: "bg-gray-50 p-2 rounded"
    }, React.createElement("span", {
      className: "font-bold"
    }, "Test:"), " ", prog.testConducted || 'No'), React.createElement("div", {
      className: "bg-gray-50 p-2 rounded"
    }, React.createElement("span", {
      className: "font-bold"
    }, "Status:"), " ", prog.completed || 'No')), prog.notes && React.createElement("div", {
      className: "bg-yellow-50 p-2 rounded text-sm"
    }, React.createElement("span", {
      className: "font-bold"
    }, "Notes:"), " ", prog.notes)));
  })));
}
function APCTeacherAttendanceView({
  currentUser,
  teachers,
  teacherAttendance,
  leaveAdjustments
}) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [viewMode, setViewMode] = useState('daily');
  const mySchool = currentUser.school;
  const schoolTeachers = teachers.filter(t => t.school === mySchool && !t.isArchived && t.role !== 'apc');
  const getDailyAttendance = () => {
    return teacherAttendance.filter(att => att.date === selectedDate && att.school === mySchool);
  };
  const getMonthlyAttendance = () => {
    const monthStart = selectedMonth + '-01';
    const monthEnd = selectedMonth + '-31';
    return teacherAttendance.filter(att => att.school === mySchool && att.date >= monthStart && att.date <= monthEnd);
  };
  const dailyAttendance = getDailyAttendance();
  const monthlyAttendance = getMonthlyAttendance();
  const presentToday = dailyAttendance.filter(a => a.status === 'Present').length;
  const absentToday = schoolTeachers.length - presentToday;
  const getTeacherMonthlyStats = teacherAfid => {
    const teacherAtt = monthlyAttendance.filter(a => a.teacherId === teacherAfid || a.afid === teacherAfid);
    const present = teacherAtt.filter(a => a.status === 'Present').length;
    const leaves = teacherAtt.filter(a => a.status !== 'Present').length;
    return {
      present,
      leaves,
      total: teacherAtt.length
    };
  };
  const findTeacherAttendance = teacherAfid => {
    return dailyAttendance.find(a => a.teacherId === teacherAfid || a.afid === teacherAfid);
  };
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("div", {
    className: "flex flex-col md:flex-row md:items-center md:justify-between gap-4"
  }, React.createElement("div", null, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "\uD83D\uDC68\u200D\uD83C\uDFEB Teacher Attendance"), React.createElement("p", {
    className: "text-gray-600 mt-1"
  }, mySchool, " - View Only"), React.createElement("span", {
    className: "inline-block mt-2 px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-semibold"
  }, "\uD83D\uDC64 APC View")), React.createElement("div", {
    className: "flex items-center gap-2"
  }, React.createElement("button", {
    onClick: () => setViewMode('daily'),
    className: `px-4 py-2 rounded-xl font-semibold ${viewMode === 'daily' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`
  }, "\uD83D\uDCC5 Daily View"), React.createElement("button", {
    onClick: () => setViewMode('monthly'),
    className: `px-4 py-2 rounded-xl font-semibold ${viewMode === 'monthly' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`
  }, "\uD83D\uDCCA Monthly View"))), viewMode === 'daily' ? React.createElement(React.Fragment, null, React.createElement("div", {
    className: "bg-white p-4 rounded-2xl shadow-lg"
  }, React.createElement("div", {
    className: "flex flex-wrap items-center gap-4"
  }, React.createElement("label", {
    className: "font-bold"
  }, "Select Date:"), React.createElement("input", {
    type: "date",
    value: selectedDate,
    onChange: e => setSelectedDate(e.target.value),
    className: "px-4 py-2 border-2 rounded-xl"
  }), React.createElement("div", {
    className: "flex gap-2"
  }, React.createElement("button", {
    onClick: () => {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() - 1);
      setSelectedDate(d.toISOString().split('T')[0]);
    },
    className: "px-3 py-2 bg-gray-200 rounded-lg"
  }, "\u25C0 Prev"), React.createElement("button", {
    onClick: () => setSelectedDate(new Date().toISOString().split('T')[0]),
    className: "px-3 py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold"
  }, "Today"), React.createElement("button", {
    onClick: () => {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + 1);
      setSelectedDate(d.toISOString().split('T')[0]);
    },
    className: "px-3 py-2 bg-gray-200 rounded-lg"
  }, "Next \u25B6")))), React.createElement("div", {
    className: "grid grid-cols-2 md:grid-cols-4 gap-4"
  }, React.createElement("div", {
    className: "bg-white p-4 rounded-xl shadow text-center"
  }, React.createElement("div", {
    className: "text-3xl font-bold text-blue-600"
  }, schoolTeachers.length), React.createElement("div", {
    className: "text-sm text-gray-600"
  }, "Total Teachers")), React.createElement("div", {
    className: "bg-green-50 p-4 rounded-xl shadow text-center"
  }, React.createElement("div", {
    className: "text-3xl font-bold text-green-600"
  }, presentToday), React.createElement("div", {
    className: "text-sm text-gray-600"
  }, "Present")), React.createElement("div", {
    className: "bg-red-50 p-4 rounded-xl shadow text-center"
  }, React.createElement("div", {
    className: "text-3xl font-bold text-red-600"
  }, absentToday), React.createElement("div", {
    className: "text-sm text-gray-600"
  }, "Absent/Leave")), React.createElement("div", {
    className: "bg-purple-50 p-4 rounded-xl shadow text-center"
  }, React.createElement("div", {
    className: "text-3xl font-bold text-purple-600"
  }, schoolTeachers.length > 0 ? Math.round(presentToday / schoolTeachers.length * 100) : 0, "%"), React.createElement("div", {
    className: "text-sm text-gray-600"
  }, "Attendance Rate"))), React.createElement("div", {
    className: "bg-white rounded-2xl shadow-lg overflow-hidden"
  }, React.createElement("table", {
    className: "w-full"
  }, React.createElement("thead", {
    className: "bg-gray-100"
  }, React.createElement("tr", null, React.createElement("th", {
    className: "p-4 text-left"
  }, "Teacher"), React.createElement("th", {
    className: "p-4 text-left"
  }, "Subject"), React.createElement("th", {
    className: "p-4 text-left"
  }, "Status"), React.createElement("th", {
    className: "p-4 text-left"
  }, "Check-in Time"))), React.createElement("tbody", null, schoolTeachers.map(teacher => {
    const att = findTeacherAttendance(teacher.afid);
    return React.createElement("tr", {
      key: teacher.afid,
      className: "border-b hover:bg-gray-50"
    }, React.createElement("td", {
      className: "p-4"
    }, React.createElement("div", {
      className: "font-semibold"
    }, teacher.name), React.createElement("div", {
      className: "text-xs text-gray-500"
    }, teacher.afid)), React.createElement("td", {
      className: "p-4"
    }, teacher.subject), React.createElement("td", {
      className: "p-4"
    }, att ? React.createElement("span", {
      className: `px-3 py-1 rounded-full text-sm font-semibold ${att.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`
    }, att.status) : React.createElement("span", {
      className: "px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-500"
    }, "Not Marked")), React.createElement("td", {
      className: "p-4 text-sm text-gray-600"
    }, att?.punchInTime || att?.checkInTime || '—'));
  }))))) : React.createElement(React.Fragment, null, React.createElement("div", {
    className: "bg-white p-4 rounded-2xl shadow-lg"
  }, React.createElement("div", {
    className: "flex flex-wrap items-center gap-4"
  }, React.createElement("label", {
    className: "font-bold"
  }, "Select Month:"), React.createElement("input", {
    type: "month",
    value: selectedMonth,
    onChange: e => setSelectedMonth(e.target.value),
    className: "px-4 py-2 border-2 rounded-xl"
  }))), React.createElement("div", {
    className: "bg-white rounded-2xl shadow-lg overflow-hidden"
  }, React.createElement("table", {
    className: "w-full"
  }, React.createElement("thead", {
    className: "bg-gray-100"
  }, React.createElement("tr", null, React.createElement("th", {
    className: "p-4 text-left"
  }, "Teacher"), React.createElement("th", {
    className: "p-4 text-left"
  }, "Subject"), React.createElement("th", {
    className: "p-4 text-center"
  }, "Days Present"), React.createElement("th", {
    className: "p-4 text-center"
  }, "Days Leave"), React.createElement("th", {
    className: "p-4 text-center"
  }, "Attendance %"))), React.createElement("tbody", null, schoolTeachers.map(teacher => {
    const stats = getTeacherMonthlyStats(teacher.afid);
    const percentage = stats.total > 0 ? Math.round(stats.present / stats.total * 100) : 0;
    return React.createElement("tr", {
      key: teacher.afid,
      className: "border-b hover:bg-gray-50"
    }, React.createElement("td", {
      className: "p-4"
    }, React.createElement("div", {
      className: "font-semibold"
    }, teacher.name), React.createElement("div", {
      className: "text-xs text-gray-500"
    }, teacher.afid)), React.createElement("td", {
      className: "p-4"
    }, teacher.subject), React.createElement("td", {
      className: "p-4 text-center"
    }, React.createElement("span", {
      className: "font-bold text-green-600"
    }, stats.present)), React.createElement("td", {
      className: "p-4 text-center"
    }, React.createElement("span", {
      className: "font-bold text-orange-600"
    }, stats.leaves)), React.createElement("td", {
      className: "p-4 text-center"
    }, React.createElement("span", {
      className: `px-3 py-1 rounded-full text-sm font-bold ${percentage >= 90 ? 'bg-green-100 text-green-700' : percentage >= 75 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`
    }, percentage, "%")));
  }))))));
}
function TeacherView({
  currentUser,
  handleLogout,
  showConfetti,
  Confetti,
  celebrationMessage,
  teachers,
  students,
  curriculum,
  chapterProgress,
  studentAttendance,
  teacherAttendance,
  schoolInfo,
  setSchoolInfo,
  updateChapterProgress,
  activeTab,
  setActiveTab,
  leaveAdjustments,
  floatingCelebration,
  setFloatingCelebration,
  precomputedRankings,
  managers = []
}) {
  const isAPC = currentUser.userType === 'apc' || currentUser.role === 'apc' || currentUser.role === MANAGER_ROLES.APC;
  const teacherTabs = isAPC ? [{
    id: 'overview',
    label: 'Dashboard',
    icon: React.createElement("i", {
      className: "fa-solid fa-chart-line"
    })
  }, {
    id: 'analytics',
    label: 'Analytics',
    icon: React.createElement("i", {
      className: "fa-solid fa-chart-pie"
    })
  }, {
    id: 'syllabus11',
    label: 'Class 11 Syllabus',
    icon: React.createElement("i", {
      className: "fa-solid fa-book"
    })
  }, {
    id: 'syllabus12',
    label: 'Class 12 Syllabus',
    icon: React.createElement("i", {
      className: "fa-solid fa-book-open"
    })
  }, {
    id: 'directory',
    label: 'Directory',
    icon: React.createElement("i", {
      className: "fa-solid fa-address-book"
    })
  }, {
    id: 'socialwall',
    label: 'Social Wall',
    icon: React.createElement("i", {
      className: "fa-solid fa-comments"
    })
  }, {
    id: 'attendance',
    label: 'Student Attendance',
    icon: React.createElement("i", {
      className: "fa-solid fa-clipboard-check"
    })
  }, {
    id: 'attendancedash',
    label: 'Attendance Dashboard',
    icon: React.createElement("i", {
      className: "fa-solid fa-calendar-check"
    })
  }, {
    id: 'myattendance',
    label: 'My Attendance',
    icon: React.createElement("i", {
      className: "fa-solid fa-clock"
    })
  }, {
    id: 'teacherattview',
    label: 'Teacher Attendance',
    icon: React.createElement("i", {
      className: "fa-solid fa-chalkboard-user"
    })
  }, {
    id: 'assets',
    label: 'Asset Management',
    icon: React.createElement("i", {
      className: "fa-solid fa-boxes-stacked"
    })
  }, {
    id: 'schoolinfo',
    label: 'School Info',
    icon: React.createElement("i", {
      className: "fa-solid fa-school"
    })
  }, {
    id: 'examstats',
    label: 'Exam Stats',
    icon: React.createElement("i", {
      className: "fa-solid fa-graduation-cap"
    })
  }, {
    id: 'timesheet',
    label: 'Timesheet',
    icon: React.createElement("i", {
      className: "fa-solid fa-clock"
    })
  }, {
    id: 'roadmap',
    label: 'Roadmap',
    icon: React.createElement("i", {
      className: "fa-solid fa-map"
    })
  }] : [{
    id: 'overview',
    label: 'Dashboard',
    icon: React.createElement("i", {
      className: "fa-solid fa-chart-line"
    })
  }, {
    id: 'analytics',
    label: 'Analytics',
    icon: React.createElement("i", {
      className: "fa-solid fa-chart-pie"
    })
  }, {
    id: 'class11',
    label: 'Class 11',
    icon: React.createElement("i", {
      className: "fa-solid fa-book"
    })
  }, {
    id: 'class12',
    label: 'Class 12',
    icon: React.createElement("i", {
      className: "fa-solid fa-book-open"
    })
  }, {
    id: 'directory',
    label: 'Directory',
    icon: React.createElement("i", {
      className: "fa-solid fa-address-book"
    })
  }, {
    id: 'socialwall',
    label: 'Social Wall',
    icon: React.createElement("i", {
      className: "fa-solid fa-comments"
    })
  }, {
    id: 'attendance',
    label: 'Student Attendance',
    icon: React.createElement("i", {
      className: "fa-solid fa-clipboard-check"
    })
  }, {
    id: 'attendancedash',
    label: 'Attendance Dashboard',
    icon: React.createElement("i", {
      className: "fa-solid fa-calendar-check"
    })
  }, {
    id: 'myattendance',
    label: 'My Attendance',
    icon: React.createElement("i", {
      className: "fa-solid fa-clock"
    })
  }, {
    id: 'assets',
    label: 'Asset Management',
    icon: React.createElement("i", {
      className: "fa-solid fa-boxes-stacked"
    })
  }, {
    id: 'schoolinfo',
    label: 'School Info',
    icon: React.createElement("i", {
      className: "fa-solid fa-school"
    })
  }, {
    id: 'examstats',
    label: 'Exam Stats',
    icon: React.createElement("i", {
      className: "fa-solid fa-graduation-cap"
    })
  }, {
    id: 'myprofile',
    label: 'My Profile',
    icon: React.createElement("i", {
      className: "fa-solid fa-user"
    })
  }, {
    id: 'timesheet',
    label: 'Timesheet',
    icon: React.createElement("i", {
      className: "fa-solid fa-clock"
    })
  }, {
    id: 'roadmap',
    label: 'Roadmap',
    icon: React.createElement("i", {
      className: "fa-solid fa-map"
    })
  }];
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarHovering, setSidebarHovering] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);
  const handleTabClick = tabId => {
    setActiveTab(tabId);
    if (window.innerWidth < 768) {
      setIsMobileSidebarOpen(false);
      setIsMobileMoreOpen(false);
    }
  };
  useEffect(() => {
    let touchStartX = 0;
    let touchEndX = 0;
    const handleTouchStart = e => {
      touchStartX = e.changedTouches[0].screenX;
    };
    const handleTouchEnd = e => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    };
    const handleSwipe = () => {
      const swipeThreshold = 50;
      if (touchEndX - touchStartX > swipeThreshold && touchStartX < 50) {
        setIsMobileSidebarOpen(true);
      } else if (touchStartX - touchEndX > swipeThreshold) {
        setIsMobileSidebarOpen(false);
      }
    };
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);
  return React.createElement("div", {
    className: "min-h-screen bg-gray-50"
  }, showConfetti && React.createElement(Confetti, null), floatingCelebration && React.createElement("div", {
    className: `floating-celebration-card ${floatingCelebration.type === 'anniversary' ? 'anniversary' : ''}`
  }, React.createElement("button", {
    className: "close-btn",
    "data-allow-during-saving": "true",
    onClick: e => {
      e.stopPropagation();
      e.preventDefault();
      localStorage.setItem('floatingCelebrationDismissed_' + new Date().toDateString(), 'true');
      setFloatingCelebration(null);
    }
  }, "\xD7"), React.createElement("span", {
    className: "confetti",
    style: {
      top: '5px',
      left: '10px'
    }
  }, "\uD83C\uDF89"), React.createElement("span", {
    className: "confetti",
    style: {
      top: '10px',
      right: '40px',
      animationDelay: '0.5s'
    }
  }, "\u2728"), React.createElement("span", {
    className: "confetti",
    style: {
      bottom: '10px',
      left: '30px',
      animationDelay: '1s'
    }
  }, "\uD83C\uDF8A"), React.createElement("div", {
    className: "celebration-content"
  }, React.createElement("div", {
    className: "avatar"
  }, floatingCelebration.person?.profilePhoto ? React.createElement("img", {
    src: floatingCelebration.person.profilePhoto,
    alt: ""
  }) : floatingCelebration.type === 'birthday' ? '🎂' : '🎉'), React.createElement("div", {
    className: "info"
  }, React.createElement("h4", null, floatingCelebration.type === 'birthday' ? '🎂 Birthday Today!' : '🎉 Work Anniversary!'), React.createElement("h3", null, floatingCelebration.person?.name), React.createElement("p", null, floatingCelebration.type === 'birthday' ? 'Wish them a Happy Birthday! 🎈' : `Completing ${floatingCelebration.years} year${floatingCelebration.years > 1 ? 's' : ''} at Avanti! 💐`), floatingCelebration.total > 1 && React.createElement("p", {
    style: {
      marginTop: '4px',
      opacity: '0.7'
    }
  }, "+", floatingCelebration.total - 1, " more ", floatingCelebration.type === 'birthday' ? 'birthday' : 'anniversary', floatingCelebration.total > 2 ? 's' : '', " today")))), React.createElement(InstallPrompt, null), isMobile && React.createElement("header", {
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '56px',
      background: '#1a1a2e',
      zIndex: 1001,
      padding: '0 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
    }
  }, React.createElement("button", {
    onClick: () => setIsMobileSidebarOpen(!isMobileSidebarOpen),
    style: {
      width: '44px',
      height: '44px',
      background: 'linear-gradient(135deg, #F4B41A 0%, #E8B039 100%)',
      border: 'none',
      borderRadius: '10px',
      color: 'white',
      fontSize: '20px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  }, React.createElement("i", {
    className: `fa-solid ${isMobileSidebarOpen ? 'fa-xmark' : 'fa-bars'}`
  })), React.createElement("div", {
    style: {
      color: 'white',
      fontWeight: 600,
      fontSize: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }
  }, React.createElement("div", {
    style: {
      width: '32px',
      height: '32px',
      background: 'linear-gradient(135deg, #F4B41A 0%, #E8B039 100%)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '16px'
    }
  }, "\uD83D\uDCDA"), React.createElement("span", null, "Curriculum Tracker")), React.createElement("div", {
    style: {
      width: '44px'
    }
  })), !isMobile && sidebarCollapsed && React.createElement("div", {
    className: "sidebar-hover-zone",
    onMouseEnter: () => setSidebarHovering(true)
  }), React.createElement("div", {
    className: `mobile-sidebar-overlay ${isMobileSidebarOpen ? 'active' : ''}`,
    onClick: () => setIsMobileSidebarOpen(false)
  }), React.createElement("div", {
    className: `sidebar ${sidebarCollapsed ? 'collapsed' : 'expanded'} ${isMobileSidebarOpen ? 'mobile-open' : ''} ${sidebarHovering ? 'hovering' : ''}`,
    onMouseEnter: () => !isMobile && sidebarCollapsed && setSidebarHovering(true),
    onMouseLeave: () => !isMobile && setSidebarHovering(false)
  }, React.createElement("div", {
    className: "sidebar-header"
  }, React.createElement("div", {
    className: "sidebar-logo"
  }, React.createElement("div", {
    className: "sidebar-logo-icon"
  }, "\uD83D\uDCDA"), React.createElement("span", {
    className: "sidebar-logo-text"
  }, "Curriculum Tracker")), React.createElement("button", {
    onClick: () => setSidebarCollapsed(!sidebarCollapsed),
    className: "sidebar-toggle"
  }, React.createElement("i", {
    className: `fa-solid ${sidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`
  }))), React.createElement("div", {
    className: "sidebar-nav"
  }, teacherTabs.map(tab => React.createElement("div", {
    key: tab.id,
    onClick: () => handleTabClick(tab.id),
    className: `sidebar-item ${activeTab === tab.id ? 'active' : ''}`,
    "data-tooltip": tab.label
  }, React.createElement("span", {
    className: "sidebar-icon"
  }, tab.icon), React.createElement("span", {
    className: "sidebar-label"
  }, tab.label)))), React.createElement("div", {
    className: "sidebar-footer"
  }, !sidebarCollapsed && React.createElement("div", {
    className: "theme-toggle-container"
  }, React.createElement("i", {
    className: `fa-solid ${darkMode ? 'fa-moon' : 'fa-sun'}`,
    style: {
      color: darkMode ? '#F4B41A' : '#6b7280'
    }
  }), React.createElement("div", {
    className: `theme-toggle ${darkMode ? 'dark' : ''}`,
    onClick: () => setDarkMode(!darkMode)
  }, React.createElement("div", {
    className: "theme-toggle-slider"
  }, darkMode ? '🌙' : '☀️')), React.createElement("span", {
    style: {
      color: 'rgba(255,255,255,0.6)',
      fontSize: '12px'
    }
  }, darkMode ? 'Dark' : 'Light')), sidebarCollapsed && React.createElement("div", {
    className: "sidebar-item",
    onClick: () => setDarkMode(!darkMode),
    style: {
      justifyContent: 'center',
      cursor: 'pointer'
    },
    "data-tooltip": darkMode ? 'Light Mode' : 'Dark Mode'
  }, React.createElement("i", {
    className: `fa-solid ${darkMode ? 'fa-sun' : 'fa-moon'}`,
    style: {
      color: '#F4B41A'
    }
  })), !sidebarCollapsed && React.createElement("div", {
    className: "text-gray-400 text-sm mb-3 px-1 mt-2"
  }, React.createElement("p", {
    className: "font-semibold text-white"
  }, currentUser.name), React.createElement("p", {
    className: "text-xs"
  }, currentUser.school), isAPC && React.createElement("span", {
    className: "inline-block mt-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs font-semibold"
  }, React.createElement("i", {
    className: "fa-solid fa-clipboard-list mr-1"
  }), " APC")), React.createElement("button", {
    onClick: handleLogout,
    className: "sidebar-logout",
    "data-allow-during-saving": "true"
  }, React.createElement("i", {
    className: "fa-solid fa-right-from-bracket"
  }), React.createElement("span", null, "Logout")))), React.createElement("div", {
    className: `main-content ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`,
    style: isMobile ? {
      marginLeft: 0,
      paddingTop: '70px',
      paddingBottom: '20px'
    } : {}
  }, celebrationMessage && React.createElement("div", {
    className: "avanti-gradient text-white text-center py-4 text-xl font-bold"
  }, celebrationMessage), React.createElement("div", {
    className: "px-4 py-6"
  }, React.createElement(ProfileCompletionBanner, {
    currentUser: currentUser,
    onNavigateToProfile: () => setActiveTab('myprofile')
  }), activeTab === 'overview' && React.createElement(TeacherOverview, {
    currentUser: currentUser,
    teachers: teachers,
    students: students,
    curriculum: curriculum,
    chapterProgress: chapterProgress,
    studentAttendance: studentAttendance,
    teacherAttendance: teacherAttendance,
    schoolInfo: schoolInfo,
    onNavigateToProfile: () => setActiveTab('myprofile'),
    precomputedRankings: precomputedRankings
  }), activeTab === 'analytics' && React.createElement(TeacherAnalytics, {
    currentUser: currentUser,
    curriculum: curriculum,
    chapterProgress: chapterProgress
  }), activeTab === 'class11' && React.createElement(TeacherCurriculum, {
    grade: "11",
    currentUser: currentUser,
    curriculum: curriculum,
    chapterProgress: chapterProgress,
    updateChapterProgress: updateChapterProgress
  }), activeTab === 'class12' && React.createElement(TeacherCurriculum, {
    grade: "12",
    currentUser: currentUser,
    curriculum: curriculum,
    chapterProgress: chapterProgress,
    updateChapterProgress: updateChapterProgress
  }), activeTab === 'syllabus11' && React.createElement(APCSyllabusView, {
    grade: "11",
    currentUser: currentUser,
    curriculum: curriculum,
    chapterProgress: chapterProgress,
    teachers: teachers
  }), activeTab === 'syllabus12' && React.createElement(APCSyllabusView, {
    grade: "12",
    currentUser: currentUser,
    curriculum: curriculum,
    chapterProgress: chapterProgress,
    teachers: teachers
  }), activeTab === 'teacherattview' && React.createElement(APCTeacherAttendanceView, {
    currentUser: currentUser,
    teachers: teachers,
    teacherAttendance: teacherAttendance,
    leaveAdjustments: leaveAdjustments
  }), activeTab === 'directory' && React.createElement(OrgChartDirectory, {
    teachers: teachers,
    currentUser: currentUser
  }), activeTab === 'myprofile' && React.createElement(TeacherSelfProfile, {
    currentUser: currentUser,
    teachers: teachers
  }), activeTab === 'attendance' && React.createElement(StudentAttendanceView, {
    currentUser: currentUser,
    students: students,
    studentAttendance: studentAttendance
  }), activeTab === 'attendancedash' && React.createElement(TeacherAttendanceDashboard, {
    currentUser: currentUser,
    students: students,
    teachers: teachers,
    studentAttendance: studentAttendance,
    teacherAttendance: teacherAttendance
  }), activeTab === 'myattendance' && React.createElement(TeacherAttendanceView, {
    currentUser: currentUser,
    teacherAttendance: teacherAttendance,
    leaveAdjustments: leaveAdjustments
  }), activeTab === 'schoolinfo' && React.createElement(SchoolInfoView, {
    currentUser: currentUser,
    schoolInfo: schoolInfo,
    setSchoolInfo: setSchoolInfo
  }), activeTab === 'examstats' && React.createElement(TeacherExamStats, {
    currentUser: currentUser
  }), activeTab === 'assets' && React.createElement(AssetManagement, {
    currentUser: currentUser,
    students: students
  }), activeTab === 'socialwall' && React.createElement(SocialWall, {
    teachers: teachers,
    currentUser: currentUser
  }), activeTab === 'roadmap' && React.createElement(RoadmapPage, {
    currentUser: currentUser
  }), activeTab === 'timesheet' && React.createElement(TimesheetPage, {
    currentUser: currentUser,
    teachers: teachers,
    curriculum: curriculum,
    isAdmin: false,
    accessibleSchools: [currentUser.school],
    managers: managers
  }))), React.createElement("footer", {
    className: "bg-gray-800 text-white text-center py-4"
  }, React.createElement("p", null, "Made by Anand with \u2764\uFE0F")));
}
function AdminExamStats({
  accessibleSchools = [],
  isSuperAdmin = false,
  isDirector = false
}) {
  const [examRegistrations, setExamRegistrations] = useState([]);
  const [students, setStudents] = useState([]);
  const [filterSchool, setFilterSchool] = useState('All');
  const [filterGrade, setFilterGrade] = useState('All');
  const [filterGender, setFilterGender] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterExam, setFilterExam] = useState('All');
  const hasFullDataAccess = isSuperAdmin || isDirector;
  useEffect(() => {
    const fetchData = async () => {
      const regsSnap = await db.collection('studentExamRegistrations').get();
      setExamRegistrations(regsSnap.docs.map(d => ({
        ...d.data(),
        id: d.id
      })));
      console.log('📊 [ExamStats] Fetching students, hasFullDataAccess:', hasFullDataAccess);
      const studentsSnap = await db.collection('students').get();
      const studentsData = studentsSnap.docs.map(d => {
        const data = d.data();
        let studentId = data.id;
        if (!studentId) {
          const parts = d.id.split('_');
          studentId = parts[parts.length - 1];
        }
        return {
          ...data,
          id: studentId,
          docId: d.id
        };
      });
      console.log('✅ [ExamStats] Loaded', studentsData.length, 'students');
      setStudents(studentsData);
    };
    fetchData();
  }, [hasFullDataAccess]);
  const schoolOptions = hasFullDataAccess ? SCHOOLS : accessibleSchools;
  const accessibleStudents = hasFullDataAccess ? students : students.filter(s => accessibleSchools.includes(s.school));
  const gradeOptions = Array.from(new Set(accessibleStudents.map(s => s.grade).filter(Boolean))).sort();
  const genderOptions = Array.from(new Set(accessibleStudents.map(s => s.gender).filter(Boolean))).sort();
  const examOptions = Array.from(new Set(examRegistrations.flatMap(r => (r.exams || []).map(e => e.examName)).filter(Boolean))).sort();
  const filteredStudents = accessibleStudents.filter(s => {
    if (filterSchool !== 'All' && s.school !== filterSchool) return false;
    if (filterGrade !== 'All' && s.grade !== filterGrade) return false;
    if (filterGender !== 'All' && (s.gender || '') !== filterGender) return false;
    return true;
  });
  const studentsWithAnyReg = new Set();
  examRegistrations.forEach(reg => {
    const student = filteredStudents.find(s => s.id === reg.studentId);
    if (student && reg.exams && reg.exams.length > 0) {
      studentsWithAnyReg.add(reg.studentId);
    }
  });
  const pendingStudentsList = filteredStudents.filter(s => !studentsWithAnyReg.has(s.id));
  const detailRows = [];
  if (filterStatus === 'Pending') {
    pendingStudentsList.forEach(student => {
      detailRows.push({
        student,
        reg: {
          studentId: student.id,
          studentName: student.name
        },
        exam: {
          examName: 'No Registration',
          registrationStatus: 'Pending',
          needSupport: 'No'
        },
        isPending: true
      });
    });
  } else {
    examRegistrations.forEach(reg => {
      const student = filteredStudents.find(s => s.id === reg.studentId);
      if (!student) return;
      (reg.exams || []).forEach(exam => {
        if (filterExam !== 'All' && exam.examName !== filterExam) return;
        if (filterStatus === 'Completed' && exam.registrationStatus !== 'Yes') return;
        if (filterStatus === 'Partial' && exam.registrationStatus !== 'Partially') return;
        if (filterStatus === 'NotDone' && exam.registrationStatus !== 'No') return;
        if (filterStatus === 'NeedHelp' && exam.needSupport !== 'Yes') return;
        detailRows.push({
          student,
          reg,
          exam,
          isPending: false
        });
      });
    });
  }
  const totalStudents = filteredStudents.length;
  const studentsWithRegs = studentsWithAnyReg.size;
  const pendingStudents = pendingStudentsList.length;
  const examStats = {};
  if (filterStatus !== 'Pending') {
    detailRows.forEach(({
      exam
    }) => {
      const name = exam.examName || 'Other';
      if (!examStats[name]) {
        examStats[name] = {
          completed: 0,
          partial: 0,
          notCompleted: 0,
          needSupport: 0
        };
      }
      if (exam.registrationStatus === 'Yes') examStats[name].completed++;
      if (exam.registrationStatus === 'Partially') examStats[name].partial++;
      if (exam.registrationStatus === 'No') examStats[name].notCompleted++;
      if (exam.needSupport === 'Yes') examStats[name].needSupport++;
    });
  }
  const handleExport = () => {
    const exportData = detailRows.map(({
      student,
      reg,
      exam,
      isPending
    }) => ({
      'Student ID': reg.studentId || student.id,
      'Student Name': reg.studentName || student.name,
      'School': student.school,
      'Grade': student.grade,
      'Gender': student.gender || '-',
      'Exam Name': isPending ? 'No Registration' : exam.examName,
      'Registration Status': isPending ? 'Pending' : exam.registrationStatus,
      'Registration Number': isPending ? '-' : exam.registrationNumber || '-',
      'Password': isPending ? '-' : exam.password || '-',
      'Email Used': isPending ? '-' : exam.emailUsed || '-',
      'Phone Number Used': isPending ? '-' : exam.phoneUsed || '-',
      'Need Support': isPending ? '-' : exam.needSupport,
      'Support Type': isPending ? '-' : exam.supportType || '-',
      'Reason Not Completed': isPending ? '-' : exam.reasonNotCompleted || '-',
      'Last Updated': isPending ? '-' : reg.updatedAt ? new Date(reg.updatedAt).toLocaleDateString() : '-'
    }));
    if (exportData.length === 0) {
      alert('No data to export!');
      return;
    }
    exportToExcel(exportData, 'exam_registrations_detailed');
  };
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("div", {
    className: "flex justify-between items-center"
  }, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "\uD83D\uDCCA Exam Registration Statistics"), React.createElement("button", {
    onClick: handleExport,
    className: "px-6 py-3 bg-green-600 text-white rounded-xl font-semibold"
  }, "\uD83D\uDCE5 Export")), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "\uD83D\uDD0D Filters"), React.createElement("div", {
    className: "grid md:grid-cols-3 gap-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "School"), React.createElement("select", {
    value: filterSchool,
    onChange: e => setFilterSchool(e.target.value),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  }, React.createElement("option", {
    value: "All"
  }, "All Schools"), schoolOptions.map(s => React.createElement("option", {
    key: s,
    value: s
  }, s)))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Grade"), React.createElement("select", {
    value: filterGrade,
    onChange: e => setFilterGrade(e.target.value),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  }, React.createElement("option", {
    value: "All"
  }, "All Grades"), React.createElement("option", {
    value: "11"
  }, "Class 11"), React.createElement("option", {
    value: "12"
  }, "Class 12"))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Gender"), React.createElement("select", {
    value: filterGender,
    onChange: e => setFilterGender(e.target.value),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  }, React.createElement("option", {
    value: "All"
  }, "All"), genderOptions.map(g => React.createElement("option", {
    key: g,
    value: g
  }, g)))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Exam Name"), React.createElement("select", {
    value: filterExam,
    onChange: e => setFilterExam(e.target.value),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  }, React.createElement("option", {
    value: "All"
  }, "All Exams"), examOptions.map(name => React.createElement("option", {
    key: name,
    value: name
  }, name)))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Status"), React.createElement("select", {
    value: filterStatus,
    onChange: e => setFilterStatus(e.target.value),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  }, React.createElement("option", {
    value: "All"
  }, "All"), React.createElement("option", {
    value: "Completed"
  }, "Completed"), React.createElement("option", {
    value: "Partial"
  }, "Partial"), React.createElement("option", {
    value: "NotDone"
  }, "Not Done"), React.createElement("option", {
    value: "NeedHelp"
  }, "Need Help"), React.createElement("option", {
    value: "Pending"
  }, "Pending (No Registration)"))))), React.createElement("div", {
    className: "grid md:grid-cols-3 gap-4"
  }, React.createElement("div", {
    className: "stat-card bg-blue-500 text-white cursor-pointer hover:bg-blue-600 transition-colors",
    onClick: () => setFilterStatus('All')
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Total Students"), React.createElement("div", {
    className: "text-5xl font-bold"
  }, totalStudents)), React.createElement("div", {
    className: "stat-card bg-green-500 text-white cursor-pointer hover:bg-green-600 transition-colors",
    onClick: () => setFilterStatus('All')
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Registered for Exams"), React.createElement("div", {
    className: "text-5xl font-bold"
  }, studentsWithRegs)), React.createElement("div", {
    className: "stat-card bg-orange-500 text-white cursor-pointer hover:bg-orange-600 transition-colors",
    onClick: () => setFilterStatus('Pending')
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Pending Registration"), React.createElement("div", {
    className: "text-5xl font-bold"
  }, pendingStudents), React.createElement("div", {
    className: "text-xs opacity-75 mt-1"
  }, "Click to view list"))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "\uD83D\uDCCB Exam-wise Registration Status"), React.createElement("div", {
    className: "overflow-x-auto"
  }, React.createElement("table", {
    className: "w-full"
  }, React.createElement("thead", {
    className: "avanti-gradient-light"
  }, React.createElement("tr", null, React.createElement("th", {
    className: "p-3 text-left"
  }, "Exam"), React.createElement("th", {
    className: "p-3 text-center"
  }, "Completed"), React.createElement("th", {
    className: "p-3 text-center"
  }, "Partial"), React.createElement("th", {
    className: "p-3 text-center"
  }, "Not Started"), React.createElement("th", {
    className: "p-3 text-center"
  }, "Need Support"))), React.createElement("tbody", null, Object.keys(examStats).length === 0 ? React.createElement("tr", null, React.createElement("td", {
    colSpan: "5",
    className: "p-8 text-center text-gray-500"
  }, "No exam registrations yet")) : Object.entries(examStats).map(([examName, stats]) => React.createElement("tr", {
    key: examName,
    className: "border-b hover:bg-gray-50"
  }, React.createElement("td", {
    className: "p-3 font-semibold"
  }, examName), React.createElement("td", {
    className: "p-3 text-center"
  }, React.createElement("span", {
    className: "px-3 py-1 rounded-full bg-green-100 text-green-700 font-bold"
  }, stats.completed)), React.createElement("td", {
    className: "p-3 text-center"
  }, React.createElement("span", {
    className: "px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 font-bold"
  }, stats.partial)), React.createElement("td", {
    className: "p-3 text-center"
  }, React.createElement("span", {
    className: "px-3 py-1 rounded-full bg-red-100 text-red-700 font-bold"
  }, stats.notCompleted)), React.createElement("td", {
    className: "p-3 text-center"
  }, React.createElement("span", {
    className: "px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-bold"
  }, stats.needSupport)))))))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "\uD83E\uDDD1\u200D\uD83C\uDF93 Student-wise Exam Registrations"), React.createElement("div", {
    className: "overflow-x-auto"
  }, React.createElement("table", {
    className: "w-full text-sm"
  }, React.createElement("thead", {
    className: "bg-gray-100"
  }, React.createElement("tr", null, React.createElement("th", {
    className: "p-3 text-left"
  }, "Student ID"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Name"), React.createElement("th", {
    className: "p-3 text-left"
  }, "School"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Grade"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Gender"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Exam"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Status"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Need Help"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Reg. No."), React.createElement("th", {
    className: "p-3 text-left"
  }, "Email"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Phone"))), React.createElement("tbody", null, detailRows.length === 0 ? React.createElement("tr", null, React.createElement("td", {
    colSpan: "11",
    className: "p-6 text-center text-gray-500"
  }, "No exam registrations with current filters.")) : detailRows.map((row, idx) => {
    const status = row.exam.registrationStatus || 'No';
    const needHelp = row.exam.needSupport === 'Yes';
    const isPending = row.isPending;
    return React.createElement("tr", {
      key: idx,
      className: "border-b hover:bg-gray-50"
    }, React.createElement("td", {
      className: "p-3"
    }, row.student.id), React.createElement("td", {
      className: "p-3"
    }, row.student.name), React.createElement("td", {
      className: "p-3"
    }, row.student.school), React.createElement("td", {
      className: "p-3"
    }, row.student.grade), React.createElement("td", {
      className: "p-3"
    }, row.student.gender || '—'), React.createElement("td", {
      className: "p-3"
    }, isPending ? '—' : row.exam.examName), React.createElement("td", {
      className: "p-3"
    }, isPending && React.createElement("span", {
      className: "px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold"
    }, "Pending"), !isPending && status === 'Yes' && React.createElement("span", {
      className: "px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold"
    }, "Completed"), !isPending && status === 'Partially' && React.createElement("span", {
      className: "px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 font-semibold"
    }, "Partial"), !isPending && status === 'No' && React.createElement("span", {
      className: "px-3 py-1 rounded-full bg-red-100 text-red-700 font-semibold"
    }, "Not Done")), React.createElement("td", {
      className: "p-3"
    }, isPending ? '—' : needHelp ? React.createElement("span", {
      className: "px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-semibold"
    }, "Yes") : 'No'), React.createElement("td", {
      className: "p-3"
    }, isPending ? '—' : row.exam.registrationNumber || '—'), React.createElement("td", {
      className: "p-3"
    }, isPending ? '—' : row.exam.emailUsed || '—'), React.createElement("td", {
      className: "p-3"
    }, isPending ? '—' : row.exam.phoneUsed || '—'));
  }))))));
}
function ManagerManagement({
  managers,
  currentUser,
  isSuperAdmin
}) {
  const [showModal, setShowModal] = useState(false);
  const [editingManager, setEditingManager] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    afCode: '',
    role: MANAGER_ROLES.APH,
    reportsTo: '',
    directSchools: [],
    phone: '',
    status: 'active',
    dateOfBirth: '',
    joiningDate: '',
    whatsapp: '',
    profilePhoto: ''
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [filterRole, setFilterRole] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [allSchools, setAllSchools] = useState([...SCHOOLS]);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  useEffect(() => {
    const fetchSchools = async () => {
      const schoolsSnap = await db.collection('schoolsList').get();
      if (!schoolsSnap.empty) {
        const schoolsData = schoolsSnap.docs.map(d => d.data().name).filter(Boolean);
        if (schoolsData.length > 0) {
          setAllSchools(schoolsData);
        }
      }
    };
    fetchSchools();
  }, []);
  const getManagersByRole = role => managers.filter(m => m.role === role && m.status === 'active');
  const getReportsToOptions = role => {
    switch (role) {
      case MANAGER_ROLES.DIRECTOR:
        return [];
      case MANAGER_ROLES.ASSOC_DIRECTOR:
        return [];
      case MANAGER_ROLES.TRAINING:
        return [];
      case MANAGER_ROLES.APH:
        return [];
      case MANAGER_ROLES.PM:
        return getManagersByRole(MANAGER_ROLES.APH);
      case MANAGER_ROLES.APM:
        return getManagersByRole(MANAGER_ROLES.PM);
      default:
        return [];
    }
  };
  const filteredManagers = managers.filter(m => {
    if (filterRole !== 'All' && m.role !== filterRole) return false;
    if (searchQuery && !m.name?.toLowerCase().includes(searchQuery.toLowerCase()) && !m.email?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });
  const getAllReportees = managerId => {
    const directReportees = managers.filter(m => m.reportsTo === managerId);
    let allReportees = [...directReportees];
    directReportees.forEach(r => {
      allReportees = [...allReportees, ...getAllReportees(r.id)];
    });
    return allReportees;
  };
  const getDirectReportees = managerId => {
    return managers.filter(m => m.reportsTo === managerId);
  };
  const getManagerName = managerId => {
    const manager = managers.find(m => m.id === managerId);
    return manager ? manager.name : 'Super Admin';
  };
  const getTotalSchools = manager => {
    let schools = [...(manager.directSchools || [])];
    const reportees = getAllReportees(manager.id);
    reportees.forEach(r => {
      schools = [...schools, ...(r.directSchools || [])];
    });
    return [...new Set(schools)];
  };
  const openAddModal = () => {
    setEditingManager(null);
    setForm({
      name: '',
      email: '',
      afCode: '',
      role: MANAGER_ROLES.APH,
      reportsTo: '',
      directSchools: [],
      phone: '',
      whatsapp: '',
      status: 'active',
      dateOfBirth: '',
      joiningDate: '',
      profilePhoto: ''
    });
    setShowModal(true);
  };
  const openEditModal = manager => {
    setEditingManager(manager);
    setForm({
      name: manager.name || '',
      email: manager.email || '',
      afCode: manager.afCode || '',
      role: manager.role || MANAGER_ROLES.APH,
      reportsTo: manager.reportsTo || '',
      directSchools: manager.directSchools || [],
      phone: manager.phone || '',
      whatsapp: manager.whatsapp || '',
      status: manager.status || 'active',
      dateOfBirth: manager.dateOfBirth || '',
      joiningDate: manager.joiningDate || '',
      profilePhoto: manager.profilePhoto || ''
    });
    setShowModal(true);
  };
  const handleManagerPhotoUpload = async e => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Only JPG, PNG, or WebP allowed');
      return;
    }
    setUploadingPhoto(true);
    const compressProfilePhoto = file => {
      return new Promise(resolve => {
        const timeoutId = setTimeout(() => {
          console.warn('[compressProfilePhoto] Timeout - returning original file');
          resolve(file);
        }, 10000);
        if (file.size < 200 * 1024) {
          clearTimeout(timeoutId);
          resolve(file);
          return;
        }
        try {
          const reader = new FileReader();
          reader.onerror = () => {
            clearTimeout(timeoutId);
            console.warn('[compressProfilePhoto] FileReader error');
            resolve(file);
          };
          reader.onload = e => {
            const img = new Image();
            img.onerror = () => {
              clearTimeout(timeoutId);
              console.warn('[compressProfilePhoto] Image load error');
              resolve(file);
            };
            img.onload = () => {
              try {
                const canvas = document.createElement('canvas');
                const maxSize = 400;
                let width = img.width;
                let height = img.height;
                if (width > maxSize || height > maxSize) {
                  if (width > height) {
                    height = height * maxSize / width;
                    width = maxSize;
                  } else {
                    width = width * maxSize / height;
                    height = maxSize;
                  }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                  clearTimeout(timeoutId);
                  resolve(file);
                  return;
                }
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(blob => {
                  clearTimeout(timeoutId);
                  if (!blob) {
                    console.warn('[compressProfilePhoto] toBlob returned null');
                    resolve(file);
                    return;
                  }
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg'
                  });
                  console.log('Profile photo compressed:', (file.size / 1024).toFixed(1) + 'KB →', (compressedFile.size / 1024).toFixed(1) + 'KB');
                  resolve(compressedFile);
                }, 'image/jpeg', 0.7);
              } catch (canvasError) {
                clearTimeout(timeoutId);
                console.warn('[compressProfilePhoto] Canvas error:', canvasError);
                resolve(file);
              }
            };
            img.src = e.target.result;
          };
          reader.readAsDataURL(file);
        } catch (error) {
          clearTimeout(timeoutId);
          console.warn('[compressProfilePhoto] Error:', error);
          resolve(file);
        }
      });
    };
    try {
      const compressedFile = await compressProfilePhoto(file);
      const reader = new FileReader();
      reader.onload = async readerEvent => {
        const base64 = readerEvent.target.result;
        setForm(prev => ({
          ...prev,
          profilePhoto: base64
        }));
        try {
          const safeFileName = `manager_${Date.now()}.jpg`;
          const storageRef = firebase.storage().ref(`profile-photos/${safeFileName}`);
          const uploadTask = storageRef.put(compressedFile);
          await new Promise((resolve, reject) => {
            uploadTask.on('state_changed', snapshot => {
              const progress = Math.round(snapshot.bytesTransferred / snapshot.totalBytes * 100);
              console.log('[Manager Photo] Upload progress:', progress + '%');
            }, error => {
              console.error('[Manager Photo] Upload error:', error);
              reject(error);
            }, async () => {
              try {
                const url = await storageRef.getDownloadURL();
                setForm(prev => ({
                  ...prev,
                  profilePhoto: url
                }));
                resolve(url);
              } catch (urlError) {
                reject(urlError);
              }
            });
          });
          alert('✅ Photo uploaded successfully!');
        } catch (err) {
          console.error('Upload error:', err);
          alert('⚠️ Photo saved locally. Cloud upload may have failed, but you can still continue.');
        } finally {
          setUploadingPhoto(false);
        }
      };
      reader.onerror = () => {
        alert('Failed to read image file');
        setUploadingPhoto(false);
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      console.error('Compression error:', err);
      setUploadingPhoto(false);
      alert('Failed to process image');
    }
  };
  const handleSubmit = async () => {
    if (!form.name || !form.email) {
      alert('Please fill in required fields');
      return;
    }
    if ((form.role === MANAGER_ROLES.PM || form.role === MANAGER_ROLES.APM) && !form.reportsTo) {
      alert('Please select who this person reports to');
      return;
    }
    const isDirectorRole = form.role === 'director' || form.role === 'assoc_director' || form.role === 'training';
    try {
      const managerData = {
        name: form.name,
        email: form.email.toLowerCase(),
        afCode: form.afCode || null,
        role: form.role,
        reportsTo: form.role === MANAGER_ROLES.APH || isDirectorRole ? null : form.reportsTo,
        directSchools: isDirectorRole ? [] : form.directSchools,
        viewAllSchools: isDirectorRole,
        canApprove: !isDirectorRole,
        phone: form.phone,
        whatsapp: form.whatsapp || null,
        status: form.status,
        dateOfBirth: form.dateOfBirth || null,
        joiningDate: form.joiningDate || null,
        profilePhoto: form.profilePhoto || null,
        updatedAt: new Date().toISOString()
      };
      if (editingManager) {
        await db.collection('managers').doc(editingManager.id).update(managerData);
        alert('✅ Updated successfully!');
      } else {
        managerData.createdAt = new Date().toISOString();
        await db.collection('managers').add(managerData);
        alert(`✅ ${ROLE_LABELS[form.role]} added successfully!\n\n` + `📧 Email: ${form.email}\n\n` + `⚠️ IMPORTANT: Create Firebase Auth user:\n` + `1. Firebase Console → Authentication → Users\n` + `2. Click "Add user"\n` + `3. Enter: ${form.email}\n` + `4. Set password and share with them`);
      }
      setShowModal(false);
      window.location.reload();
    } catch (e) {
      alert('Failed: ' + e.message);
    }
  };
  const handleDeactivate = async manager => {
    if (!confirm(`Deactivate ${manager.name}?\n\nThey will lose access to the system.`)) return;
    try {
      await db.collection('managers').doc(manager.id).update({
        status: 'inactive',
        deactivatedAt: new Date().toISOString()
      });
      alert('✅ Deactivated');
      window.location.reload();
    } catch (e) {
      alert('Failed: ' + e.message);
    }
  };
  const handleReactivate = async manager => {
    try {
      await db.collection('managers').doc(manager.id).update({
        status: 'active',
        reactivatedAt: new Date().toISOString()
      });
      alert('✅ Reactivated');
      window.location.reload();
    } catch (e) {
      alert('Failed: ' + e.message);
    }
  };
  const handleAddSchool = async () => {
    if (!newSchoolName.trim()) {
      alert('Please enter a school name');
      return;
    }
    if (allSchools.includes(newSchoolName.trim())) {
      alert('This school already exists');
      return;
    }
    try {
      await db.collection('schoolsList').add({
        name: newSchoolName.trim(),
        createdAt: new Date().toISOString(),
        createdBy: currentUser.email
      });
      setAllSchools([...allSchools, newSchoolName.trim()]);
      setNewSchoolName('');
      alert('✅ School added!');
    } catch (e) {
      alert('Failed: ' + e.message);
    }
  };
  const handleRemoveSchool = async schoolName => {
    if (!confirm(`Remove "${schoolName}"?\n\n⚠️ Existing data will NOT be deleted.`)) return;
    try {
      const schoolsSnap = await db.collection('schoolsList').where('name', '==', schoolName).get();
      if (!schoolsSnap.empty) {
        await schoolsSnap.docs[0].ref.delete();
      }
      setAllSchools(allSchools.filter(s => s !== schoolName));
      alert('✅ School removed');
    } catch (e) {
      alert('Failed: ' + e.message);
    }
  };
  const toggleSchoolSelection = school => {
    if (form.directSchools.includes(school)) {
      setForm({
        ...form,
        directSchools: form.directSchools.filter(s => s !== school)
      });
    } else {
      setForm({
        ...form,
        directSchools: [...form.directSchools, school]
      });
    }
  };
  const renderManagerCard = (manager, level = 0) => {
    const colors = ROLE_COLORS[manager.role] || ROLE_COLORS['apm'];
    const reportees = getDirectReportees(manager.id);
    const totalSchools = getTotalSchools(manager);
    return React.createElement("div", {
      key: manager.id,
      className: `${level > 0 ? 'ml-4 md:ml-8 mt-2' : ''}`
    }, React.createElement("div", {
      className: `border-2 ${colors.border} rounded-xl p-4 ${colors.bg}`
    }, React.createElement("div", {
      className: "flex items-start justify-between flex-wrap gap-2"
    }, React.createElement("div", {
      className: "flex-1 min-w-0"
    }, React.createElement("div", {
      className: "flex items-center gap-2 flex-wrap"
    }, React.createElement("span", {
      className: "text-2xl"
    }, manager.role === MANAGER_ROLES.APH ? '👔' : manager.role === MANAGER_ROLES.PM ? '👨‍💼' : '👤'), React.createElement("span", {
      className: "text-xl font-bold"
    }, manager.name), React.createElement("span", {
      className: `px-3 py-1 ${colors.bg} ${colors.text} text-xs rounded-full font-bold border ${colors.border}`
    }, ROLE_LABELS[manager.role]), manager.status !== 'active' && React.createElement("span", {
      className: "px-3 py-1 bg-red-500 text-white text-xs rounded-full font-bold"
    }, "INACTIVE")), React.createElement("div", {
      className: "text-sm text-gray-600 mt-1"
    }, "\uD83D\uDCE7 ", manager.email), manager.reportsTo && React.createElement("div", {
      className: "text-sm text-gray-500 mt-1"
    }, "\u21B3 Reports to: ", getManagerName(manager.reportsTo)), React.createElement("div", {
      className: "mt-2"
    }, React.createElement("span", {
      className: "text-sm font-semibold"
    }, "Direct Schools:"), React.createElement("div", {
      className: "flex flex-wrap gap-2 mt-1"
    }, (manager.directSchools || []).map(school => React.createElement("span", {
      key: school,
      className: "px-2 py-1 bg-white text-sm rounded border"
    }, "\uD83C\uDFEB ", school)), (!manager.directSchools || manager.directSchools.length === 0) && React.createElement("span", {
      className: "text-gray-400 text-sm"
    }, "No schools assigned"))), reportees.length > 0 && React.createElement("div", {
      className: "mt-2 text-sm text-green-600 font-semibold"
    }, "\uD83D\uDCCA Total Access: ", totalSchools.length, " schools (via ", reportees.length, " reportees)")), isSuperAdmin && React.createElement("div", {
      className: "flex gap-2"
    }, React.createElement("button", {
      onClick: () => openEditModal(manager),
      className: "px-3 py-1 bg-yellow-400 rounded-lg font-semibold text-sm"
    }, "Edit"), manager.status === 'active' ? React.createElement("button", {
      onClick: () => handleDeactivate(manager),
      className: "px-3 py-1 bg-red-500 text-white rounded-lg font-semibold text-sm"
    }, "Deactivate") : React.createElement("button", {
      onClick: () => handleReactivate(manager),
      className: "px-3 py-1 bg-green-500 text-white rounded-lg font-semibold text-sm"
    }, "Reactivate")))), reportees.map(reportee => renderManagerCard(reportee, level + 1)));
  };
  const topLevelManagers = managers.filter(m => m.role === MANAGER_ROLES.APH && m.status === 'active');
  const unassignedManagers = managers.filter(m => (m.role === MANAGER_ROLES.PM || m.role === MANAGER_ROLES.APM) && !m.reportsTo && m.status === 'active');
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("div", {
    className: "flex justify-between items-center flex-wrap gap-4"
  }, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "\uD83D\uDC65 Manager & School Management"), React.createElement("div", {
    className: "flex gap-3"
  }, isSuperAdmin && React.createElement(React.Fragment, null, React.createElement("button", {
    onClick: () => setShowSchoolModal(true),
    className: "px-6 py-3 bg-green-600 text-white rounded-xl font-semibold"
  }, "\uD83C\uDFEB Manage Schools"), React.createElement("button", {
    onClick: openAddModal,
    className: "px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold"
  }, "+ Add Manager")))), React.createElement("div", {
    className: "bg-white p-4 rounded-xl shadow-lg"
  }, React.createElement("h3", {
    className: "font-bold mb-3"
  }, "\uD83D\uDCCB Role Hierarchy"), React.createElement("div", {
    className: "flex flex-wrap gap-3"
  }, React.createElement("span", {
    className: "px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm font-semibold border border-purple-200"
  }, "\uD83D\uDC51 Super Admin"), React.createElement("span", {
    className: "text-gray-400"
  }, "\u2192"), React.createElement("span", {
    className: "px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold border border-blue-200"
  }, "\uD83D\uDC54 PH (Program Head)"), React.createElement("span", {
    className: "text-gray-400"
  }, "\u2192"), React.createElement("span", {
    className: "px-3 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-semibold border border-green-200"
  }, "\uD83D\uDC68\u200D\uD83D\uDCBC PM (Program Manager)"), React.createElement("span", {
    className: "text-gray-400"
  }, "\u2192"), React.createElement("span", {
    className: "px-3 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm font-semibold border border-orange-200"
  }, "\uD83D\uDC64 APM (Associate Program Manager)"))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "\uD83D\uDD0D Filters"), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Search"), React.createElement("input", {
    type: "text",
    value: searchQuery,
    onChange: e => setSearchQuery(e.target.value),
    placeholder: "Search by name or email...",
    className: "w-full border-2 px-4 py-3 rounded-xl"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Role"), React.createElement("select", {
    value: filterRole,
    onChange: e => setFilterRole(e.target.value),
    className: "w-full border-2 px-4 py-3 rounded-xl"
  }, React.createElement("option", {
    value: "All"
  }, "All Roles"), React.createElement("option", {
    value: MANAGER_ROLES.DIRECTOR
  }, "Director"), React.createElement("option", {
    value: MANAGER_ROLES.ASSOC_DIRECTOR
  }, "Associate Director"), React.createElement("option", {
    value: MANAGER_ROLES.TRAINING
  }, "Training Department"), React.createElement("option", {
    value: MANAGER_ROLES.APH
  }, "Program Head (PH)"), React.createElement("option", {
    value: MANAGER_ROLES.PM
  }, "Program Manager (PM)"), React.createElement("option", {
    value: MANAGER_ROLES.APM
  }, "Associate Program Manager (APM)"))))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "\uD83D\uDCCA Organization Hierarchy"), React.createElement("p", {
    className: "text-sm text-gray-600 mb-4"
  }, "Director \u2192 Associate Director \u2192 Program Head \u2192 Program Manager \u2192 Associate Program Manager"), React.createElement("div", {
    className: "space-y-4"
  }, React.createElement("div", {
    className: "border-2 border-purple-200 rounded-xl p-4 bg-purple-50"
  }, React.createElement("div", {
    className: "flex items-center gap-2"
  }, React.createElement("span", {
    className: "text-2xl"
  }, "\uD83D\uDC51"), React.createElement("span", {
    className: "text-xl font-bold"
  }, "Super Administrator"), React.createElement("span", {
    className: "px-3 py-1 bg-purple-600 text-white text-xs rounded-full font-bold"
  }, "SUPER ADMIN")), React.createElement("div", {
    className: "text-sm text-gray-600 mt-1"
  }, "\uD83D\uDCE7 admin@avantifellows.org"), React.createElement("div", {
    className: "text-sm text-green-600 font-semibold mt-2"
  }, "\uD83D\uDCCA Full Access: All Schools")), managers.filter(m => m.role === 'director' && m.status === 'active').map(director => React.createElement("div", {
    key: director.id,
    className: "border-2 border-indigo-200 rounded-xl p-4 bg-indigo-50 ml-4"
  }, React.createElement("div", {
    className: "flex items-center gap-2"
  }, React.createElement("span", {
    className: "text-2xl"
  }, "\uD83C\uDFAF"), React.createElement("span", {
    className: "text-xl font-bold"
  }, director.name), React.createElement("span", {
    className: "px-3 py-1 bg-indigo-600 text-white text-xs rounded-full font-bold"
  }, "DIRECTOR"), React.createElement("span", {
    className: "px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full"
  }, "View Only")), React.createElement("div", {
    className: "text-sm text-gray-600 mt-1"
  }, "\uD83D\uDCE7 ", director.email), React.createElement("div", {
    className: "text-sm text-green-600 font-semibold mt-2"
  }, "\uD83D\uDCCA View Access: All Schools"))), managers.filter(m => m.role === 'assoc_director' && m.status === 'active').map(assocDir => React.createElement("div", {
    key: assocDir.id,
    className: "border-2 border-violet-200 rounded-xl p-4 bg-violet-50 ml-4"
  }, React.createElement("div", {
    className: "flex items-center gap-2"
  }, React.createElement("span", {
    className: "text-2xl"
  }, "\uD83C\uDF96\uFE0F"), React.createElement("span", {
    className: "text-xl font-bold"
  }, assocDir.name), React.createElement("span", {
    className: "px-3 py-1 bg-violet-600 text-white text-xs rounded-full font-bold"
  }, "ASSOCIATE DIRECTOR"), React.createElement("span", {
    className: "px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full"
  }, "View Only")), React.createElement("div", {
    className: "text-sm text-gray-600 mt-1"
  }, "\uD83D\uDCE7 ", assocDir.email), React.createElement("div", {
    className: "text-sm text-green-600 font-semibold mt-2"
  }, "\uD83D\uDCCA View Access: All Schools"))), managers.filter(m => m.role === 'training' && m.status === 'active').map(trainer => React.createElement("div", {
    key: trainer.id,
    className: "border-2 border-cyan-200 rounded-xl p-4 bg-cyan-50 ml-4"
  }, React.createElement("div", {
    className: "flex items-center gap-2"
  }, React.createElement("span", {
    className: "text-2xl"
  }, "\uD83D\uDCDA"), React.createElement("span", {
    className: "text-xl font-bold"
  }, trainer.name), React.createElement("span", {
    className: "px-3 py-1 bg-cyan-600 text-white text-xs rounded-full font-bold"
  }, "TRAINING DEPARTMENT"), React.createElement("span", {
    className: "px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full"
  }, "View Only")), React.createElement("div", {
    className: "text-sm text-gray-600 mt-1"
  }, "\uD83D\uDCE7 ", trainer.email), React.createElement("div", {
    className: "text-sm text-green-600 font-semibold mt-2"
  }, "\uD83D\uDCCA View Access: All Schools"))), topLevelManagers.map(manager => renderManagerCard(manager)), unassignedManagers.length > 0 && React.createElement("div", {
    className: "border-2 border-red-200 rounded-xl p-4 bg-red-50"
  }, React.createElement("div", {
    className: "text-lg font-bold text-red-700 mb-2"
  }, "\u26A0\uFE0F Unassigned Managers (", unassignedManagers.length, ")"), React.createElement("p", {
    className: "text-sm text-red-600 mb-3"
  }, "These managers don't have anyone to report to. Please assign them."), unassignedManagers.map(m => React.createElement("div", {
    key: m.id,
    className: "border border-red-300 rounded-lg p-3 bg-white mb-2"
  }, React.createElement("div", {
    className: "flex items-center gap-2"
  }, React.createElement("span", {
    className: "font-bold"
  }, m.name), React.createElement("span", {
    className: `px-2 py-1 ${ROLE_COLORS[m.role]?.bg} ${ROLE_COLORS[m.role]?.text} text-xs rounded-full font-bold`
  }, ROLE_LABELS[m.role])), React.createElement("button", {
    onClick: () => openEditModal(m),
    className: "mt-2 px-3 py-1 bg-yellow-400 rounded-lg font-semibold text-sm"
  }, "Assign Manager")))), topLevelManagers.length === 0 && React.createElement("div", {
    className: "text-center py-8 text-gray-500"
  }, React.createElement("p", null, "No managers found. Click \"+ Add Manager\" to add your first Program Head.")))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg overflow-x-auto"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "\uD83D\uDCCB All Staff (", filteredManagers.length, ")"), React.createElement("table", {
    className: "w-full"
  }, React.createElement("thead", {
    className: "avanti-gradient-light"
  }, React.createElement("tr", null, React.createElement("th", {
    className: "p-3 text-left"
  }, "Name"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Email"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Role"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Reports To"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Direct Schools"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Total Access"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Status"), isSuperAdmin && React.createElement("th", {
    className: "p-3 text-left"
  }, "Actions"))), React.createElement("tbody", null, filteredManagers.length === 0 ? React.createElement("tr", null, React.createElement("td", {
    colSpan: isSuperAdmin ? 8 : 7,
    className: "p-8 text-center text-gray-500"
  }, "No managers found")) : filteredManagers.map(manager => React.createElement("tr", {
    key: manager.id,
    className: "border-b hover:bg-gray-50"
  }, React.createElement("td", {
    className: "p-3 font-semibold"
  }, manager.name), React.createElement("td", {
    className: "p-3 text-sm"
  }, manager.email), React.createElement("td", {
    className: "p-3"
  }, React.createElement("span", {
    className: `px-3 py-1 rounded-full text-xs font-bold ${ROLE_COLORS[manager.role]?.bg} ${ROLE_COLORS[manager.role]?.text}`
  }, ROLE_LABELS[manager.role])), React.createElement("td", {
    className: "p-3"
  }, manager.reportsTo ? getManagerName(manager.reportsTo) : 'Super Admin'), React.createElement("td", {
    className: "p-3"
  }, React.createElement("div", {
    className: "flex flex-wrap gap-1"
  }, (manager.directSchools || []).slice(0, 2).map(s => React.createElement("span", {
    key: s,
    className: "px-2 py-1 bg-gray-100 text-xs rounded"
  }, s)), (manager.directSchools || []).length > 2 && React.createElement("span", {
    className: "px-2 py-1 bg-gray-200 text-xs rounded"
  }, "+", manager.directSchools.length - 2))), React.createElement("td", {
    className: "p-3 font-bold"
  }, getTotalSchools(manager).length), React.createElement("td", {
    className: "p-3"
  }, React.createElement("span", {
    className: `px-3 py-1 rounded-full text-xs font-bold ${manager.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`
  }, manager.status === 'active' ? 'Active' : 'Inactive')), isSuperAdmin && React.createElement("td", {
    className: "p-3"
  }, React.createElement("button", {
    onClick: () => openEditModal(manager),
    className: "px-3 py-1 bg-yellow-400 rounded-lg font-semibold text-sm"
  }, "Edit"))))))), showModal && React.createElement("div", {
    className: "modal-overlay",
    onClick: () => setShowModal(false)
  }, React.createElement("div", {
    className: "modal-content max-w-2xl",
    onClick: e => e.stopPropagation()
  }, React.createElement("h3", {
    className: "text-2xl font-bold mb-4"
  }, editingManager ? 'Edit Staff Member' : 'Add New Staff Member'), React.createElement("div", {
    className: "space-y-4"
  }, React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-1"
  }, "Full Name *"), React.createElement("input", {
    type: "text",
    value: form.name,
    onChange: e => setForm({
      ...form,
      name: e.target.value
    }),
    className: "w-full border-2 px-3 py-2 rounded-lg",
    placeholder: "e.g., Anand Joshi"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-1"
  }, "Email *"), React.createElement("input", {
    type: "email",
    value: form.email,
    onChange: e => setForm({
      ...form,
      email: e.target.value
    }),
    className: "w-full border-2 px-3 py-2 rounded-lg",
    placeholder: "e.g., anand@avantifellows.org"
  }))), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-1"
  }, "AF Code (e.g. AF355)"), React.createElement("input", {
    type: "text",
    value: form.afCode || '',
    onChange: e => setForm({
      ...form,
      afCode: e.target.value
    }),
    className: "w-full border-2 px-3 py-2 rounded-lg",
    placeholder: "e.g., AF355"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-1"
  }, "Phone"), React.createElement("input", {
    type: "tel",
    value: form.phone,
    onChange: e => setForm({
      ...form,
      phone: e.target.value
    }),
    className: "w-full border-2 px-3 py-2 rounded-lg",
    placeholder: "e.g., 9876543210"
  }))), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-1"
  }, "WhatsApp Number"), React.createElement("input", {
    type: "tel",
    value: form.whatsapp || '',
    onChange: e => setForm({
      ...form,
      whatsapp: e.target.value
    }),
    className: "w-full border-2 px-3 py-2 rounded-lg",
    placeholder: "e.g., 9876543210"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-1"
  }, "\uD83C\uDF82 Date of Birth"), React.createElement("input", {
    type: "date",
    value: form.dateOfBirth || '',
    onChange: e => setForm({
      ...form,
      dateOfBirth: e.target.value
    }),
    className: "w-full border-2 px-3 py-2 rounded-lg"
  }), React.createElement("p", {
    className: "text-xs text-gray-500 mt-1"
  }, "For birthday celebrations"))), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-1"
  }, "\uD83D\uDCC5 Joining Date"), React.createElement("input", {
    type: "date",
    value: form.joiningDate || '',
    onChange: e => setForm({
      ...form,
      joiningDate: e.target.value
    }),
    className: "w-full border-2 px-3 py-2 rounded-lg"
  }), React.createElement("p", {
    className: "text-xs text-gray-500 mt-1"
  }, "For work anniversary celebrations")), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-1"
  }, "\uD83D\uDCF7 Profile Photo"), React.createElement("div", {
    className: "flex items-center gap-3"
  }, form.profilePhoto && React.createElement("img", {
    src: form.profilePhoto,
    alt: "",
    className: "w-14 h-14 rounded-full object-cover border-2 border-pink-300"
  }), React.createElement("div", {
    className: "flex-1"
  }, React.createElement("input", {
    type: "file",
    accept: "image/jpeg,image/png,image/webp",
    onChange: handleManagerPhotoUpload,
    className: "w-full text-sm border-2 px-2 py-1.5 rounded-lg",
    disabled: uploadingPhoto
  }), uploadingPhoto && React.createElement("p", {
    className: "text-xs text-blue-600 mt-1"
  }, "\u23F3 Uploading..."))), React.createElement("p", {
    className: "text-xs text-gray-500 mt-1"
  }, "Max 1MB, JPG/PNG/WebP"))), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-1"
  }, "Role *"), React.createElement("select", {
    value: form.role,
    onChange: e => setForm({
      ...form,
      role: e.target.value,
      reportsTo: ''
    }),
    className: "w-full border-2 px-3 py-2 rounded-lg"
  }, React.createElement("option", {
    value: MANAGER_ROLES.DIRECTOR
  }, "Director (View Only)"), React.createElement("option", {
    value: MANAGER_ROLES.ASSOC_DIRECTOR
  }, "Associate Director (View Only)"), React.createElement("option", {
    value: MANAGER_ROLES.TRAINING
  }, "Training Department (View Only)"), React.createElement("option", {
    value: MANAGER_ROLES.APH
  }, "Program Head (PH)"), React.createElement("option", {
    value: MANAGER_ROLES.PM
  }, "Program Manager (PM)"), React.createElement("option", {
    value: MANAGER_ROLES.APM
  }, "Associate Program Manager (APM)")), (form.role === 'director' || form.role === 'assoc_director' || form.role === 'training') && React.createElement("p", {
    className: "text-xs text-blue-600 mt-1"
  }, "\u26A0\uFE0F This role has view-only access to all data. They cannot approve timesheets."))), (form.role === MANAGER_ROLES.PM || form.role === MANAGER_ROLES.APM) && React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-1"
  }, "Reports To (", form.role === MANAGER_ROLES.PM ? 'PH' : 'PM', ") *"), React.createElement("select", {
    value: form.reportsTo,
    onChange: e => setForm({
      ...form,
      reportsTo: e.target.value
    }),
    className: "w-full border-2 px-3 py-2 rounded-lg"
  }, React.createElement("option", {
    value: ""
  }, "Select ", form.role === MANAGER_ROLES.PM ? 'Program Head' : 'Program Manager'), getReportsToOptions(form.role).map(m => React.createElement("option", {
    key: m.id,
    value: m.id
  }, m.name, " (", ROLE_LABELS[m.role], ")"))), React.createElement("p", {
    className: "text-xs text-gray-600 mt-1"
  }, form.role === MANAGER_ROLES.PM ? 'The PH will see all schools assigned to this PM and their APMs' : 'The PM will see all schools assigned to this APM')), form.role === 'director' || form.role === 'assoc_director' || form.role === 'training' ? React.createElement("div", {
    className: "bg-blue-50 border-2 border-blue-200 rounded-lg p-4"
  }, React.createElement("p", {
    className: "text-blue-700 font-semibold"
  }, "\uD83D\uDCCA All Schools Access"), React.createElement("p", {
    className: "text-sm text-blue-600 mt-1"
  }, "This role has view-only access to all schools. No need to assign specific schools.")) : React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Assign Schools *"), React.createElement("div", {
    className: "border-2 rounded-lg p-3 max-h-48 overflow-y-auto"
  }, allSchools.map(school => React.createElement("label", {
    key: school,
    className: "flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer"
  }, React.createElement("input", {
    type: "checkbox",
    checked: form.directSchools.includes(school),
    onChange: () => toggleSchoolSelection(school),
    className: "cursor-pointer"
  }), React.createElement("span", null, school))), allSchools.length === 0 && React.createElement("p", {
    className: "text-gray-500 text-center py-4"
  }, "No schools available. Add schools first.")), React.createElement("p", {
    className: "text-xs text-gray-600 mt-1"
  }, "Selected: ", form.directSchools.length, " school(s)")), React.createElement("div", {
    className: "flex gap-3"
  }, React.createElement("button", {
    onClick: handleSubmit,
    className: "flex-1 avanti-gradient text-white py-3 rounded-xl font-bold"
  }, editingManager ? 'Update' : 'Add Staff Member'), React.createElement("button", {
    onClick: () => setShowModal(false),
    className: "px-6 py-3 bg-gray-200 rounded-xl font-bold"
  }, "Cancel"))))), showSchoolModal && React.createElement("div", {
    className: "modal-overlay",
    onClick: () => setShowSchoolModal(false)
  }, React.createElement("div", {
    className: "modal-content",
    onClick: e => e.stopPropagation()
  }, React.createElement("h3", {
    className: "text-2xl font-bold mb-4"
  }, "\uD83C\uDFEB Manage Schools"), React.createElement("div", {
    className: "mb-4"
  }, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Add New School"), React.createElement("div", {
    className: "flex gap-2"
  }, React.createElement("input", {
    type: "text",
    value: newSchoolName,
    onChange: e => setNewSchoolName(e.target.value),
    placeholder: "e.g., JNV Mumbai",
    className: "flex-1 border-2 px-3 py-2 rounded-lg"
  }), React.createElement("button", {
    onClick: handleAddSchool,
    className: "px-4 py-2 bg-green-600 text-white rounded-lg font-semibold"
  }, "Add"))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Current Schools (", allSchools.length, ")"), React.createElement("div", {
    className: "border-2 rounded-lg max-h-64 overflow-y-auto"
  }, allSchools.map(school => React.createElement("div", {
    key: school,
    className: "flex items-center justify-between p-3 border-b hover:bg-gray-50"
  }, React.createElement("span", {
    className: "font-medium"
  }, "\uD83C\uDFEB ", school), React.createElement("button", {
    onClick: () => handleRemoveSchool(school),
    className: "px-3 py-1 bg-red-100 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-200"
  }, "Remove"))), allSchools.length === 0 && React.createElement("p", {
    className: "text-gray-500 text-center py-4"
  }, "No schools added yet."))), React.createElement("button", {
    onClick: () => setShowSchoolModal(false),
    className: "w-full mt-4 px-6 py-3 bg-gray-200 rounded-xl font-bold"
  }, "Close"))));
}
function APCManagement() {
  const [apcs, setApcs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingApc, setEditingApc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    school: ''
  });
  useEffect(() => {
    const fetchApcs = async () => {
      try {
        const snapshot = await db.collection('apcs').get();
        setApcs(snapshot.docs.map(d => ({
          ...d.data(),
          id: d.id
        })));
      } catch (e) {
        console.error('Error fetching APCs:', e);
      }
      setLoading(false);
    };
    fetchApcs();
  }, []);
  const resetForm = () => {
    setForm({
      name: '',
      email: '',
      phone: '',
      school: ''
    });
    setEditingApc(null);
  };
  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.school) {
      alert('Please fill in all required fields (Name, Email, School)');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      alert('Please enter a valid email address');
      return;
    }
    try {
      if (editingApc) {
        await db.collection('apcs').doc(editingApc.id).update({
          name: form.name,
          email: form.email.toLowerCase().trim(),
          phone: form.phone,
          school: form.school,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        setApcs(apcs.map(a => a.id === editingApc.id ? {
          ...a,
          ...form,
          email: form.email.toLowerCase().trim()
        } : a));
        alert('✅ APC updated successfully!');
      } else {
        const existingEmail = await db.collection('apcs').where('email', '==', form.email.toLowerCase().trim()).get();
        if (!existingEmail.empty) {
          alert('An APC with this email already exists');
          return;
        }
        const docRef = await db.collection('apcs').add({
          name: form.name,
          email: form.email.toLowerCase().trim(),
          phone: form.phone,
          school: form.school,
          status: 'active',
          role: 'apc',
          userType: 'apc',
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        setApcs([...apcs, {
          id: docRef.id,
          ...form,
          email: form.email.toLowerCase().trim(),
          status: 'active'
        }]);
        alert(`✅ APC added successfully!\n\nName: ${form.name}\nEmail: ${form.email}\nSchool: ${form.school}\n\nNote: The APC can login using Firebase Auth. Make sure their account is created in Firebase Authentication.`);
      }
      setShowModal(false);
      resetForm();
    } catch (e) {
      console.error('Error saving APC:', e);
      alert('Error saving APC: ' + e.message);
    }
  };
  const handleEdit = apc => {
    setForm({
      name: apc.name || '',
      email: apc.email || '',
      phone: apc.phone || '',
      school: apc.school || ''
    });
    setEditingApc(apc);
    setShowModal(true);
  };
  const handleToggleStatus = async apc => {
    const newStatus = apc.status === 'active' ? 'inactive' : 'active';
    if (!confirm(`${newStatus === 'inactive' ? 'Deactivate' : 'Activate'} ${apc.name}?`)) return;
    try {
      await db.collection('apcs').doc(apc.id).update({
        status: newStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      setApcs(apcs.map(a => a.id === apc.id ? {
        ...a,
        status: newStatus
      } : a));
      alert(`✅ APC ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
    } catch (e) {
      console.error('Error updating status:', e);
      alert('Error updating status: ' + e.message);
    }
  };
  const handleDelete = async apc => {
    if (!confirm(`⚠️ Delete ${apc.name}? This action cannot be undone.`)) return;
    try {
      await db.collection('apcs').doc(apc.id).delete();
      setApcs(apcs.filter(a => a.id !== apc.id));
      alert('✅ APC deleted successfully!');
    } catch (e) {
      console.error('Error deleting APC:', e);
      alert('Error deleting APC: ' + e.message);
    }
  };
  const activeApcs = apcs.filter(a => a.status === 'active');
  const inactiveApcs = apcs.filter(a => a.status === 'inactive');
  if (loading) {
    return React.createElement("div", {
      className: "flex items-center justify-center p-12"
    }, React.createElement("div", {
      className: "text-xl"
    }, "Loading APCs..."));
  }
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("div", {
    className: "flex flex-col md:flex-row md:items-center md:justify-between gap-4"
  }, React.createElement("div", null, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "\uD83D\uDCCB APC Management"), React.createElement("p", {
    className: "text-gray-600 mt-1"
  }, "Manage Academic Program Coordinators")), React.createElement("button", {
    onClick: () => {
      resetForm();
      setShowModal(true);
    },
    className: "px-6 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition"
  }, "\u2795 Add New APC")), React.createElement("div", {
    className: "bg-teal-50 border-2 border-teal-200 rounded-2xl p-6"
  }, React.createElement("h3", {
    className: "text-lg font-bold text-teal-800 mb-2"
  }, "\u2139\uFE0F About APCs"), React.createElement("p", {
    className: "text-teal-700 text-sm"
  }, "Academic Program Coordinators (APCs) have school-level access to:"), React.createElement("ul", {
    className: "mt-2 text-teal-700 text-sm space-y-1"
  }, React.createElement("li", null, "\u2705 View syllabus/curriculum progress (all subjects)"), React.createElement("li", null, "\u2705 Mark student attendance"), React.createElement("li", null, "\u2705 View teacher attendance"), React.createElement("li", null, "\u2705 View analytics and dashboards"), React.createElement("li", null, "\u274C Cannot edit curriculum or chapters"), React.createElement("li", null, "\u274C Cannot add/edit teachers or students"))), React.createElement("div", {
    className: "grid grid-cols-2 md:grid-cols-3 gap-4"
  }, React.createElement("div", {
    className: "bg-white p-4 rounded-xl shadow text-center"
  }, React.createElement("div", {
    className: "text-3xl font-bold text-teal-600"
  }, apcs.length), React.createElement("div", {
    className: "text-sm text-gray-600"
  }, "Total APCs")), React.createElement("div", {
    className: "bg-green-50 p-4 rounded-xl shadow text-center"
  }, React.createElement("div", {
    className: "text-3xl font-bold text-green-600"
  }, activeApcs.length), React.createElement("div", {
    className: "text-sm text-gray-600"
  }, "Active")), React.createElement("div", {
    className: "bg-gray-50 p-4 rounded-xl shadow text-center"
  }, React.createElement("div", {
    className: "text-3xl font-bold text-gray-600"
  }, inactiveApcs.length), React.createElement("div", {
    className: "text-sm text-gray-600"
  }, "Inactive"))), React.createElement("div", {
    className: "bg-white rounded-2xl shadow-lg overflow-hidden"
  }, React.createElement("table", {
    className: "w-full"
  }, React.createElement("thead", {
    className: "bg-gray-100"
  }, React.createElement("tr", null, React.createElement("th", {
    className: "p-4 text-left"
  }, "Name"), React.createElement("th", {
    className: "p-4 text-left"
  }, "Email"), React.createElement("th", {
    className: "p-4 text-left"
  }, "School"), React.createElement("th", {
    className: "p-4 text-left"
  }, "Phone"), React.createElement("th", {
    className: "p-4 text-left"
  }, "Status"), React.createElement("th", {
    className: "p-4 text-left"
  }, "Actions"))), React.createElement("tbody", null, apcs.length === 0 ? React.createElement("tr", null, React.createElement("td", {
    colSpan: "6",
    className: "p-8 text-center text-gray-500"
  }, "No APCs added yet. Click \"Add New APC\" to get started.")) : apcs.map(apc => React.createElement("tr", {
    key: apc.id,
    className: `border-b hover:bg-gray-50 ${apc.status === 'inactive' ? 'opacity-50' : ''}`
  }, React.createElement("td", {
    className: "p-4"
  }, React.createElement("div", {
    className: "font-semibold"
  }, apc.name)), React.createElement("td", {
    className: "p-4 text-sm"
  }, apc.email), React.createElement("td", {
    className: "p-4"
  }, React.createElement("span", {
    className: "px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-semibold"
  }, apc.school)), React.createElement("td", {
    className: "p-4 text-sm"
  }, apc.phone || '—'), React.createElement("td", {
    className: "p-4"
  }, React.createElement("span", {
    className: `px-3 py-1 rounded-full text-sm font-semibold ${apc.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`
  }, apc.status === 'active' ? '✅ Active' : '⏸️ Inactive')), React.createElement("td", {
    className: "p-4"
  }, React.createElement("div", {
    className: "flex gap-2"
  }, React.createElement("button", {
    onClick: () => handleEdit(apc),
    className: "px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200"
  }, "\u270F\uFE0F Edit"), React.createElement("button", {
    onClick: () => handleToggleStatus(apc),
    className: `px-3 py-1 rounded-lg text-sm font-semibold ${apc.status === 'active' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`
  }, apc.status === 'active' ? '⏸️ Deactivate' : '▶️ Activate'), React.createElement("button", {
    onClick: () => handleDelete(apc),
    className: "px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200"
  }, "\uD83D\uDDD1\uFE0F")))))))), showModal && React.createElement("div", {
    className: "modal-overlay",
    onClick: () => setShowModal(false)
  }, React.createElement("div", {
    className: "modal-content",
    onClick: e => e.stopPropagation()
  }, React.createElement("h3", {
    className: "text-2xl font-bold mb-4"
  }, editingApc ? '✏️ Edit APC' : '➕ Add New APC'), React.createElement("div", {
    className: "space-y-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Name *"), React.createElement("input", {
    type: "text",
    value: form.name,
    onChange: e => setForm({
      ...form,
      name: e.target.value
    }),
    placeholder: "e.g., Ramesh Kumar",
    className: "w-full border-2 px-4 py-3 rounded-xl"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Email *"), React.createElement("input", {
    type: "email",
    value: form.email,
    onChange: e => setForm({
      ...form,
      email: e.target.value
    }),
    placeholder: "e.g., ramesh@example.com",
    className: "w-full border-2 px-4 py-3 rounded-xl"
  }), React.createElement("p", {
    className: "text-xs text-gray-600 mt-1"
  }, "This email must be registered in Firebase Authentication for login")), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Phone"), React.createElement("input", {
    type: "tel",
    value: form.phone,
    onChange: e => setForm({
      ...form,
      phone: e.target.value
    }),
    placeholder: "e.g., 9876543210",
    className: "w-full border-2 px-4 py-3 rounded-xl"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "School *"), React.createElement("select", {
    value: form.school,
    onChange: e => setForm({
      ...form,
      school: e.target.value
    }),
    className: "w-full border-2 px-4 py-3 rounded-xl"
  }, React.createElement("option", {
    value: ""
  }, "Select School"), SCHOOLS.map(school => React.createElement("option", {
    key: school,
    value: school
  }, school)))), React.createElement("div", {
    className: "flex gap-3 pt-4"
  }, React.createElement("button", {
    onClick: handleSubmit,
    className: "flex-1 bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700"
  }, editingApc ? '💾 Update APC' : '➕ Add APC'), React.createElement("button", {
    onClick: () => {
      setShowModal(false);
      resetForm();
    },
    className: "px-6 py-3 bg-gray-200 rounded-xl font-bold"
  }, "Cancel"))))));
}
function AcademicYearManagement({
  teachers,
  students,
  curriculum,
  chapterProgress,
  studentAttendance,
  teacherAttendance,
  academicYearSettings
}) {
  const [currentAY, setCurrentAY] = useState(academicYearSettings?.currentYear || CURRENT_ACADEMIC_YEAR);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const [transitionLog, setTransitionLog] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [newAcademicYear, setNewAcademicYear] = useState('');
  const [archivedYears, setArchivedYears] = useState([]);
  useEffect(() => {
    const fetchArchived = async () => {
      const archiveSnap = await db.collection('archives').get();
      const years = [...new Set(archiveSnap.docs.map(d => d.data().academicYear))].filter(Boolean);
      setArchivedYears(years);
    };
    fetchArchived();
  }, []);
  const getNextAcademicYear = () => {
    const parts = currentAY.split('-');
    const startYear = parseInt(parts[0]) + 1;
    return `${startYear}-${startYear + 1}`;
  };
  const studentsByGrade = useMemo(() => {
    const counts = {
      '11': 0,
      '12': 0
    };
    students.forEach(s => {
      if (s.grade === '11' || s.grade === 11) counts['11']++;
      if (s.grade === '12' || s.grade === 12) counts['12']++;
    });
    return counts;
  }, [students]);
  const addLog = message => {
    setTransitionLog(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`]);
  };
  const startTransition = async () => {
    if (!newAcademicYear || !newAcademicYear.match(/^\d{4}-\d{4}$/)) {
      alert('Please enter a valid academic year (e.g., 2025-2026)');
      return;
    }
    setShowConfirmModal(false);
    setIsTransitioning(true);
    setTransitionProgress(0);
    setTransitionLog([]);
    try {
      addLog('🚀 Starting academic year transition...');
      addLog(`📅 From: ${currentAY} → To: ${newAcademicYear}`);
      addLog('📚 Step 1: Archiving curriculum progress...');
      setTransitionProgress(5);
      const progressSnap = await db.collection('chapterProgress').get();
      const batch1 = db.batch();
      let progressCount = 0;
      progressSnap.docs.forEach(doc => {
        const archiveRef = db.collection('archives').doc(`chapterProgress_${currentAY}_${doc.id}`);
        batch1.set(archiveRef, {
          ...doc.data(),
          academicYear: currentAY,
          archivedAt: new Date().toISOString(),
          originalDocId: doc.id,
          type: 'chapterProgress'
        });
        progressCount++;
      });
      await batch1.commit();
      addLog(`✅ Archived ${progressCount} curriculum progress records`);
      setTransitionProgress(15);
      addLog('📊 Step 2: Archiving student attendance...');
      const studentAttSnap = await db.collection('studentAttendance').get();
      const batch2 = db.batch();
      let studentAttCount = 0;
      studentAttSnap.docs.forEach(doc => {
        const archiveRef = db.collection('archives').doc(`studentAttendance_${currentAY}_${doc.id}`);
        batch2.set(archiveRef, {
          ...doc.data(),
          academicYear: currentAY,
          archivedAt: new Date().toISOString(),
          originalDocId: doc.id,
          type: 'studentAttendance'
        });
        studentAttCount++;
      });
      await batch2.commit();
      addLog(`✅ Archived ${studentAttCount} student attendance records`);
      setTransitionProgress(30);
      addLog('👥 Step 3: Archiving teacher attendance...');
      const teacherAttSnap = await db.collection('teacherAttendance').get();
      const batch3 = db.batch();
      let teacherAttCount = 0;
      teacherAttSnap.docs.forEach(doc => {
        const archiveRef = db.collection('archives').doc(`teacherAttendance_${currentAY}_${doc.id}`);
        batch3.set(archiveRef, {
          ...doc.data(),
          academicYear: currentAY,
          archivedAt: new Date().toISOString(),
          originalDocId: doc.id,
          type: 'teacherAttendance'
        });
        teacherAttCount++;
      });
      await batch3.commit();
      addLog(`✅ Archived ${teacherAttCount} teacher attendance records`);
      setTransitionProgress(40);
      addLog('💬 Step 4: Archiving student feedback...');
      const feedbackSnap = await db.collection('teacherFeedback').get();
      const batch4 = db.batch();
      let feedbackCount = 0;
      feedbackSnap.docs.forEach(doc => {
        const archiveRef = db.collection('archives').doc(`teacherFeedback_${currentAY}_${doc.id}`);
        batch4.set(archiveRef, {
          ...doc.data(),
          academicYear: currentAY,
          archivedAt: new Date().toISOString(),
          originalDocId: doc.id,
          type: 'teacherFeedback'
        });
        feedbackCount++;
      });
      await batch4.commit();
      addLog(`✅ Archived ${feedbackCount} feedback records`);
      setTransitionProgress(50);
      addLog('📝 Step 5: Archiving exam registrations...');
      const examSnap = await db.collection('studentExamRegistrations').get();
      const batch5 = db.batch();
      let examCount = 0;
      examSnap.docs.forEach(doc => {
        const archiveRef = db.collection('archives').doc(`examRegistrations_${currentAY}_${doc.id}`);
        batch5.set(archiveRef, {
          ...doc.data(),
          academicYear: currentAY,
          archivedAt: new Date().toISOString(),
          originalDocId: doc.id,
          type: 'examRegistrations'
        });
        examCount++;
      });
      await batch5.commit();
      addLog(`✅ Archived ${examCount} exam registration records`);
      setTransitionProgress(60);
      addLog('📈 Step 6: Saving teacher performance history...');
      const teachersSnap = await db.collection('teachers').get();
      const batch6 = db.batch();
      for (const teacherDoc of teachersSnap.docs) {
        const teacher = teacherDoc.data();
        const teacherProgress = progressSnap.docs.filter(p => {
          const data = p.data();
          return data.school === teacher.school && data.subject === teacher.subject;
        });
        const totalChapters = teacherProgress.length;
        const completedChapters = teacherProgress.filter(p => p.data().completed === 'Yes').length;
        const onTimeChapters = teacherProgress.filter(p => {
          const data = p.data();
          if (data.completed !== 'Yes') return false;
          const completed = new Date(data.completedDate);
          const expected = new Date(data.expectedDate);
          return completed <= expected;
        }).length;
        const teacherFeedback = feedbackSnap.docs.filter(f => f.data().teacherAfid === teacher.afid);
        const avgRating = teacherFeedback.length > 0 ? teacherFeedback.reduce((sum, f) => sum + (f.data().rating || 0), 0) / teacherFeedback.length : 0;
        const teacherAtt = teacherAttSnap.docs.filter(a => a.data().afid === teacher.afid);
        const presentDays = teacherAtt.filter(a => a.data().status === 'Present').length;
        const totalWorkDays = teacherAtt.length;
        const historyRef = db.collection('teacherHistory').doc(`${teacher.afid}_${currentAY}`);
        batch6.set(historyRef, {
          afid: teacher.afid,
          name: teacher.name,
          email: teacher.email,
          school: teacher.school,
          subject: teacher.subject,
          academicYear: currentAY,
          metrics: {
            totalChapters,
            completedChapters,
            completionRate: totalChapters > 0 ? Math.round(completedChapters / totalChapters * 100) : 0,
            onTimeChapters,
            onTimeRate: completedChapters > 0 ? Math.round(onTimeChapters / completedChapters * 100) : 0,
            delayedChapters: completedChapters - onTimeChapters,
            feedbackCount: teacherFeedback.length,
            avgFeedbackRating: Math.round(avgRating * 10) / 10,
            presentDays,
            totalWorkDays,
            attendanceRate: totalWorkDays > 0 ? Math.round(presentDays / totalWorkDays * 100) : 0
          },
          savedAt: new Date().toISOString()
        });
      }
      await batch6.commit();
      addLog(`✅ Saved history for ${teachersSnap.docs.length} teachers`);
      setTransitionProgress(70);
      addLog('🎓 Step 7: Promoting 11th grade to 12th...');
      const studentsSnap = await db.collection('students').get();
      const batch7 = db.batch();
      let promoted11to12 = 0;
      studentsSnap.docs.forEach(doc => {
        const student = doc.data();
        if (student.grade === '11' || student.grade === 11) {
          batch7.update(doc.ref, {
            grade: '12',
            previousGrade: '11',
            promotedAt: new Date().toISOString(),
            promotedInYear: newAcademicYear
          });
          promoted11to12++;
        }
      });
      await batch7.commit();
      addLog(`✅ Promoted ${promoted11to12} students from 11th to 12th`);
      setTransitionProgress(80);
      addLog('🎓 Step 8: Moving 12th grade to Alumni...');
      const batch8 = db.batch();
      let movedToAlumni = 0;
      studentsSnap.docs.forEach(doc => {
        const student = doc.data();
        if (student.grade === '12' || student.grade === 12) {
          const alumniRef = db.collection('alumni').doc(doc.id);
          batch8.set(alumniRef, {
            ...student,
            grade: 'Alumni',
            graduatedYear: currentAY,
            movedToAlumniAt: new Date().toISOString(),
            status: 'alumni'
          });
          batch8.delete(doc.ref);
          movedToAlumni++;
        }
      });
      await batch8.commit();
      addLog(`✅ Moved ${movedToAlumni} students to Alumni`);
      setTransitionProgress(90);
      addLog('🧹 Step 9: Clearing current year operational data...');
      const batch9 = db.batch();
      progressSnap.docs.forEach(doc => {
        batch9.delete(doc.ref);
      });
      await batch9.commit();
      addLog('✅ Cleared chapter progress for fresh start');
      const batch10 = db.batch();
      studentAttSnap.docs.forEach(doc => batch10.delete(doc.ref));
      teacherAttSnap.docs.forEach(doc => batch10.delete(doc.ref));
      await batch10.commit();
      addLog('✅ Cleared attendance records');
      const batch11 = db.batch();
      feedbackSnap.docs.forEach(doc => batch11.delete(doc.ref));
      await batch11.commit();
      addLog('✅ Cleared feedback records');
      setTransitionProgress(95);
      addLog('⚙️ Step 10: Updating system settings...');
      await db.collection('system').doc('academicYear').set({
        currentYear: newAcademicYear,
        previousYear: currentAY,
        transitionDate: new Date().toISOString(),
        transitionBy: 'admin@avantifellows.org'
      });
      setTransitionProgress(100);
      addLog('🎉 Academic year transition completed successfully!');
      addLog(`📅 Current academic year is now: ${newAcademicYear}`);
      setTimeout(() => {
        alert(`✅ Academic Year Transition Complete!\n\nFrom: ${currentAY}\nTo: ${newAcademicYear}\n\nSummary:\n• ${progressCount} curriculum records archived\n• ${studentAttCount + teacherAttCount} attendance records archived\n• ${feedbackCount} feedback records archived\n• ${promoted11to12} students promoted to 12th\n• ${movedToAlumni} students moved to Alumni\n\nPlease refresh the page.`);
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Transition error:', error);
      addLog(`❌ Error: ${error.message}`);
      alert('Transition failed: ' + error.message);
    } finally {
      setIsTransitioning(false);
    }
  };
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("div", {
    className: "flex justify-between items-center flex-wrap gap-4"
  }, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "\uD83D\uDCC5 Academic Year Management")), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "\uD83D\uDCCA Current Status"), React.createElement("div", {
    className: "grid md:grid-cols-4 gap-4"
  }, React.createElement("div", {
    className: "bg-blue-50 p-4 rounded-xl border-2 border-blue-200"
  }, React.createElement("div", {
    className: "text-3xl font-bold text-blue-600"
  }, currentAY), React.createElement("div", {
    className: "text-sm text-blue-700"
  }, "Current Academic Year")), React.createElement("div", {
    className: "bg-green-50 p-4 rounded-xl border-2 border-green-200"
  }, React.createElement("div", {
    className: "text-3xl font-bold text-green-600"
  }, studentsByGrade['11']), React.createElement("div", {
    className: "text-sm text-green-700"
  }, "11th Grade Students")), React.createElement("div", {
    className: "bg-orange-50 p-4 rounded-xl border-2 border-orange-200"
  }, React.createElement("div", {
    className: "text-3xl font-bold text-orange-600"
  }, studentsByGrade['12']), React.createElement("div", {
    className: "text-sm text-orange-700"
  }, "12th Grade Students")), React.createElement("div", {
    className: "bg-purple-50 p-4 rounded-xl border-2 border-purple-200"
  }, React.createElement("div", {
    className: "text-3xl font-bold text-purple-600"
  }, teachers.length), React.createElement("div", {
    className: "text-sm text-purple-700"
  }, "Active Teachers")))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "\uD83D\uDD04 Start New Academic Year"), React.createElement("div", {
    className: "bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-4"
  }, React.createElement("div", {
    className: "font-bold text-yellow-800 mb-2"
  }, "\u26A0\uFE0F Important: This action will:"), React.createElement("ul", {
    className: "text-sm text-yellow-700 space-y-1"
  }, React.createElement("li", null, "\u2705 Archive all curriculum progress, attendance, feedback, and exam data"), React.createElement("li", null, "\u2705 Save teacher performance history for the current year"), React.createElement("li", null, "\u2705 Promote 11th grade students to 12th grade (", studentsByGrade['11'], " students)"), React.createElement("li", null, "\u2705 Move 12th grade students to Alumni (", studentsByGrade['12'], " students)"), React.createElement("li", null, "\u2705 Clear operational data for fresh start"), React.createElement("li", null, "\u274C Teachers and their profiles will remain unchanged"))), React.createElement("div", {
    className: "flex items-end gap-4 flex-wrap"
  }, React.createElement("div", {
    className: "flex-1 min-w-64"
  }, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "New Academic Year *"), React.createElement("input", {
    type: "text",
    value: newAcademicYear,
    onChange: e => setNewAcademicYear(e.target.value),
    placeholder: getNextAcademicYear(),
    className: "w-full border-2 px-4 py-3 rounded-xl text-lg",
    disabled: isTransitioning
  }), React.createElement("p", {
    className: "text-xs text-gray-500 mt-1"
  }, "Format: YYYY-YYYY (e.g., ", getNextAcademicYear(), ")")), React.createElement("button", {
    onClick: () => setShowConfirmModal(true),
    disabled: isTransitioning || !newAcademicYear,
    className: `px-8 py-3 rounded-xl font-bold text-white ${isTransitioning ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'}`
  }, isTransitioning ? '⏳ Processing...' : '🚀 Start Transition'))), isTransitioning && React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "\uD83D\uDCC8 Transition Progress"), React.createElement("div", {
    className: "mb-4"
  }, React.createElement("div", {
    className: "flex justify-between mb-2"
  }, React.createElement("span", {
    className: "font-semibold"
  }, "Progress"), React.createElement("span", {
    className: "font-bold"
  }, transitionProgress, "%")), React.createElement("div", {
    className: "w-full bg-gray-200 rounded-full h-4"
  }, React.createElement("div", {
    className: "bg-green-500 h-4 rounded-full transition-all duration-500",
    style: {
      width: `${transitionProgress}%`
    }
  }))), React.createElement("div", {
    className: "bg-gray-900 text-green-400 p-4 rounded-xl font-mono text-sm max-h-64 overflow-y-auto"
  }, transitionLog.map((log, i) => React.createElement("div", {
    key: i
  }, log)))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "\uD83D\uDCDA Archived Academic Years"), archivedYears.length === 0 ? React.createElement("p", {
    className: "text-gray-500"
  }, "No archived years yet.") : React.createElement("div", {
    className: "flex flex-wrap gap-3"
  }, archivedYears.map(year => React.createElement("div", {
    key: year,
    className: "px-4 py-2 bg-gray-100 rounded-xl font-semibold"
  }, "\uD83D\uDCC5 ", year)))), showConfirmModal && React.createElement("div", {
    className: "modal-overlay",
    onClick: () => setShowConfirmModal(false)
  }, React.createElement("div", {
    className: "modal-content max-w-lg",
    onClick: e => e.stopPropagation()
  }, React.createElement("h3", {
    className: "text-2xl font-bold mb-4 text-red-600"
  }, "\u26A0\uFE0F Confirm Academic Year Transition"), React.createElement("div", {
    className: "space-y-4"
  }, React.createElement("p", {
    className: "font-semibold"
  }, "You are about to transition from:"), React.createElement("div", {
    className: "text-center text-2xl font-bold"
  }, currentAY, " \u2192 ", newAcademicYear), React.createElement("div", {
    className: "bg-red-50 border border-red-200 rounded-lg p-4 text-sm"
  }, React.createElement("div", {
    className: "font-bold text-red-700 mb-2"
  }, "This action cannot be undone!"), React.createElement("ul", {
    className: "text-red-600 space-y-1"
  }, React.createElement("li", null, "\u2022 All current year data will be archived"), React.createElement("li", null, "\u2022 ", studentsByGrade['11'], " students will be promoted to 12th"), React.createElement("li", null, "\u2022 ", studentsByGrade['12'], " students will become alumni"), React.createElement("li", null, "\u2022 Operational data will be cleared"))), React.createElement("div", {
    className: "flex gap-3"
  }, React.createElement("button", {
    onClick: startTransition,
    className: "flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700"
  }, "Yes, Start Transition"), React.createElement("button", {
    onClick: () => setShowConfirmModal(false),
    className: "flex-1 bg-gray-200 py-3 rounded-xl font-bold"
  }, "Cancel"))))));
}
function TeacherHistoryView({
  teachers
}) {
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherHistory, setTeacherHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('All');
  const filteredTeachers = teachers.filter(t => {
    if (t.isArchived) return false;
    if (selectedSchool !== 'All' && t.school !== selectedSchool) return false;
    if (searchQuery && !t.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });
  const loadTeacherHistory = async teacher => {
    setSelectedTeacher(teacher);
    setLoading(true);
    try {
      const historySnap = await db.collection('teacherHistory').where('afid', '==', teacher.afid).orderBy('academicYear', 'desc').get();
      setTeacherHistory(historySnap.docs.map(d => d.data()));
    } catch (e) {
      console.error('Error loading history:', e);
      setTeacherHistory([]);
    }
    setLoading(false);
  };
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "\uD83D\uDCC8 Teacher Performance History"), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Search Teacher"), React.createElement("input", {
    type: "text",
    value: searchQuery,
    onChange: e => setSearchQuery(e.target.value),
    placeholder: "Search by name...",
    className: "w-full border-2 px-4 py-3 rounded-xl"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "School"), React.createElement("select", {
    value: selectedSchool,
    onChange: e => setSelectedSchool(e.target.value),
    className: "w-full border-2 px-4 py-3 rounded-xl"
  }, React.createElement("option", {
    value: "All"
  }, "All Schools"), SCHOOLS.map(s => React.createElement("option", {
    key: s,
    value: s
  }, s)))))), React.createElement("div", {
    className: "grid md:grid-cols-3 gap-6"
  }, React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "\uD83D\uDC65 Teachers (", filteredTeachers.length, ")"), React.createElement("div", {
    className: "space-y-2 max-h-96 overflow-y-auto"
  }, filteredTeachers.map(teacher => React.createElement("div", {
    key: teacher.afid,
    onClick: () => loadTeacherHistory(teacher),
    className: `p-3 rounded-xl cursor-pointer transition ${selectedTeacher?.afid === teacher.afid ? 'bg-yellow-100 border-2 border-yellow-400' : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'}`
  }, React.createElement("div", {
    className: "font-bold"
  }, teacher.name), React.createElement("div", {
    className: "text-sm text-gray-600"
  }, teacher.school, " \u2022 ", teacher.subject))))), React.createElement("div", {
    className: "md:col-span-2 bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "\uD83D\uDCCA Performance History", selectedTeacher && React.createElement("span", {
    className: "text-gray-500 font-normal ml-2"
  }, "- ", selectedTeacher.name)), !selectedTeacher ? React.createElement("div", {
    className: "text-center py-12 text-gray-500"
  }, React.createElement("div", {
    className: "text-4xl mb-4"
  }, "\uD83D\uDC46"), React.createElement("p", null, "Select a teacher to view their performance history")) : loading ? React.createElement("div", {
    className: "text-center py-12"
  }, React.createElement("div", {
    className: "animate-spin text-4xl"
  }, "\u23F3"), React.createElement("p", {
    className: "mt-4 text-gray-500"
  }, "Loading history...")) : teacherHistory.length === 0 ? React.createElement("div", {
    className: "text-center py-12 text-gray-500"
  }, React.createElement("div", {
    className: "text-4xl mb-4"
  }, "\uD83D\uDCED"), React.createElement("p", null, "No historical data available for this teacher."), React.createElement("p", {
    className: "text-sm mt-2"
  }, "History will be saved when an academic year transition occurs.")) : React.createElement("div", {
    className: "space-y-4"
  }, teacherHistory.map(history => React.createElement("div", {
    key: history.academicYear,
    className: "border-2 border-gray-200 rounded-xl p-4"
  }, React.createElement("div", {
    className: "flex items-center justify-between mb-4"
  }, React.createElement("div", {
    className: "text-xl font-bold text-blue-600"
  }, "\uD83D\uDCC5 ", history.academicYear), React.createElement("div", {
    className: "text-sm text-gray-500"
  }, "\uD83C\uDFEB ", history.school, " \u2022 ", history.subject)), React.createElement("div", {
    className: "grid grid-cols-2 md:grid-cols-4 gap-4"
  }, React.createElement("div", {
    className: "bg-green-50 p-3 rounded-lg text-center"
  }, React.createElement("div", {
    className: "text-2xl font-bold text-green-600"
  }, history.metrics?.completionRate || 0, "%"), React.createElement("div", {
    className: "text-xs text-green-700"
  }, "Curriculum Completion")), React.createElement("div", {
    className: "bg-blue-50 p-3 rounded-lg text-center"
  }, React.createElement("div", {
    className: "text-2xl font-bold text-blue-600"
  }, history.metrics?.onTimeRate || 0, "%"), React.createElement("div", {
    className: "text-xs text-blue-700"
  }, "On-Time Rate")), React.createElement("div", {
    className: "bg-yellow-50 p-3 rounded-lg text-center"
  }, React.createElement("div", {
    className: "text-2xl font-bold text-yellow-600"
  }, history.metrics?.avgFeedbackRating || '-'), React.createElement("div", {
    className: "text-xs text-yellow-700"
  }, "Avg Feedback (", history.metrics?.feedbackCount || 0, ")")), React.createElement("div", {
    className: "bg-purple-50 p-3 rounded-lg text-center"
  }, React.createElement("div", {
    className: "text-2xl font-bold text-purple-600"
  }, history.metrics?.attendanceRate || 0, "%"), React.createElement("div", {
    className: "text-xs text-purple-700"
  }, "Attendance Rate"))), React.createElement("div", {
    className: "mt-4 grid grid-cols-3 gap-4 text-sm"
  }, React.createElement("div", null, React.createElement("span", {
    className: "text-gray-500"
  }, "Chapters:"), React.createElement("span", {
    className: "font-semibold ml-2"
  }, history.metrics?.completedChapters || 0, "/", history.metrics?.totalChapters || 0)), React.createElement("div", null, React.createElement("span", {
    className: "text-gray-500"
  }, "On-Time:"), React.createElement("span", {
    className: "font-semibold ml-2 text-green-600"
  }, history.metrics?.onTimeChapters || 0)), React.createElement("div", null, React.createElement("span", {
    className: "text-gray-500"
  }, "Delayed:"), React.createElement("span", {
    className: "font-semibold ml-2 text-red-600"
  }, history.metrics?.delayedChapters || 0)))))))));
}
