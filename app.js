// ✅ PRE-COMPILED JAVASCRIPT v5.7.0 - Performance Optimized
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
const APC_NAME_OVERRIDES = ['sharda'];
const getStaffRoleText = staff => String(staff?.role || staff?.userType || staff?.type || staff?.position || '').toLowerCase();
const isApcStaff = staff => {
  const roleText = getStaffRoleText(staff);
  const name = String(staff?.name || '').toLowerCase();
  return roleText === 'apc' || roleText.includes('academic program coordinator') || APC_NAME_OVERRIDES.some(apcName => name.includes(apcName));
};
const getStaffDisplayRole = staff => isApcStaff(staff) ? 'APC' : staff?.subject || 'Teacher';
const getStaffStableId = staff => staff?.afid || staff?.docId || staff?.id || staff?.email || staff?.name || '';
const dedupeStaffMembers = staffList => {
  const seen = new Set();
  return staffList.filter(staff => {
    const key = String(staff?.afid || staff?.email || staff?.docId || staff?.id || staff?.name || '').toLowerCase();
    if (!key) return true;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
const PresenceSystem = {
  userId: null,
  userName: null,
  userEmail: null,
  presenceRef: null,
  heartbeatInterval: null,
  onlineUsers: {},
  allPresence: {},
  listeners: [],
  initialized: false,
  OFFLINE_TIMEOUT: 60000,
  init: function (userId, userName, userEmail) {
    if (!userId || this.initialized) return;
    this.userId = String(userId);
    this.userName = userName || '';
    this.userEmail = userEmail || '';
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
        email: this.userEmail || '',
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
const APPROVED_SCHOOLS = ['CoE Barwani', 'CoE Cuttak', 'CoE Bundi', 'CoE Mahisagar', 'EMRS Bhopal', 'EMRS Bhopal_NEET', 'JNV Bharuch'];
let SCHOOLS = [...APPROVED_SCHOOLS];
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
  SCHOOLS = [...APPROVED_SCHOOLS];
  ALL_SCHOOLS_COUNT = APPROVED_SCHOOLS.length;
  cacheSchools(APPROVED_SCHOOLS);
  console.log('📊 [Schools] Initialized with approved schools:', APPROVED_SCHOOLS.join(', '));
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
      used: Math.max(0, entitledUsed),
      remaining: Math.min(35, Math.max(0, 35 - entitledUsed)),
      adjustment: adjustment.entitled || 0
    },
    maternity: {
      total: 180,
      used: Math.max(0, maternityUsed),
      remaining: Math.min(180, Math.max(0, 180 - maternityUsed)),
      adjustment: adjustment.maternity || 0
    },
    paternity: {
      total: 15,
      used: Math.max(0, paternityUsed),
      remaining: Math.min(15, Math.max(0, 15 - paternityUsed)),
      adjustment: adjustment.paternity || 0
    }
  };
}
const GENDERS = ['Male', 'Female', 'Other'];
const isEditing = true;
function TeacherProfileModal({
  teacher,
  onClose
}) {
  const displayRole = getStaffDisplayRole(teacher);
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
  }, displayRole))), React.createElement("button", {
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
  }, teacher.bio))))));
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
const AVANTI_LOGO = 'data:image/png;base64,UklGRkpLAABXRUJQVlA4WAoAAAAwAAAA2QIA+QAASUNDUMgBAAAAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADZBTFBI6R0AAAHwhu3/Iyf9/z1nd9MbGBJ6E6RJ70Uw0qTXhbdgeSN2DVWk+OYNKiBEVEAMKFUE6b33wFvjGwh9gSC9VyGkt9153JjZmdnXvGbG3VsRMQEUGOxoMWz+rosPs925D9N3zB5ciQLFg/utzoTai1PqBoKVmHQf2qb0EQK87COeQPuTnQO6ah2Db7dUCNwakA1fZ74TqDXKAwaXRQRkjQSbZysFYLV3M4K7jQKuYu6B2ay2gVZzwXBOQmBV5SKWkNs6oGou2H7yYgBV6FNNMjZPeatbu3ZdBo6ek5KhArfKB045ob54TXsHKbU1n+xShCMhAVOL1e2uQRo2/jlfAZaaFyG+cbch46bPX70j5eiJM64zJ9IeZVxbN2vSh31aVXL4426qKR4pkLZlZhd5w4cmJL594pwdF/PgS/ftw4vH93re5k+Lh8qivqR9jT3e8uubirJ9vt51H+zmpM4dWtfmJ+uo5k3y6ZBncrgQYRZqffjbLegxc+/El4L9YB+qmEc+rnZCDskmwN77u4O3oOfsbcOe93d9pexsmK8o9Dc58RWjqzj8IHh4M+0NwZ/1k6Kc2uR7YaoMrkUaWbnRx0RwM+O7pv6rXxWNIybHyuB7wwp/Y78HnL34eXk/1Voll4LZoNEyxfWNqV5yBnjs3tnL7o9arWQwsTpNgj8E43G89jv4fXP8c/6nxQruBzEjLJHg30YT9ekN8D13fnV/0w8KfiR2g1MldyIMJW7qU/Dfva6Rf2m8gr4MUZk7ADDZQErPzIExilua+ZMGeRNLsUQvuwHklDOKktNyYJziphf9Ry29pRPbkwFgnjGEjHkKY/X8Ut5fFOH2sokx+1EAhVWMoN8VGG/O5DD/EJ33MpMxqp0PYAn/6uyDMd9w+od+8fIZazQeQHENzoVPL4Jh763uD3rLy9vMBZ0HsJJrUZMyYeR54xz+n3Ki3EDmKEEEPHU5FnMbRn+8vt+Hzsj1YY/WA1jJr063YfyFE+3+nv/K9dBBHTfgrsGpsLkiTGHqC36emnJv64CWAVjCpxddMItisn+HTspM0sPzRUBRFR4NzYWJdIX7dT6WWaAHWgQgmT9hS2Auz9b050TnSHbpoloxkBvLmyqnYDYze/lxaIHEpQtaBuBzziQ8hvn0TBT8N7U9AJ7po5YHuBvMlfeKYEpXhfltaBMAxOuCtgJ4kyO272FWj5b227SUvKmPdgCO8SN0Hczr1Rr+GtoNYLU+KA1AQ16U+B/M7OPm/prGIvDUoY+3AczlROlTMLfZHf00tBZAO32EPQGehnGh4iWY3YLefprqOUCSPugHAIN4UPkqzG9RP/8MDQEu2/TRHMBmDlS+ATNc5PTP0G9AP33QJSA/UncVr8EcF/X2z0RdxnmHPmYC6KO3Mpdglgu7+mWoaSFG6eMVAD/qrOQZmOfcNn4ZGo2cGroIKwJO6Ss8FWb6WX2/jLADpyP1QKeBwiA92TfBXN+p5I+h+HvYEayHbQAq6ykZZvtcjCEIdd5J3nX88s2792//lbrqK2f5f3qovQc7I3XwK4C6+rGtgPne6+Be2SGrH0H1xVkvCf/o0FTgTC32lgGooJ+DMOPzuGZr+eUJERpf/U+cT6om6vb7tWvXrl2ZqMuf1q5duyiR6Slr1/6ayPzEtWsnJPJw+PZVP3ye6Mvv1srPS1R8FMhL9G1LX9TIMWV4n1uOLksewaf5c8v7IDoL/8RP9UHUeZjzwtZ8avnTI/g+d1qkZvSjf0FYB7N+tzSHeh8Do7d7aVZb9CuMgnnfb+dNxC4wvKykRrTPn9CiyMRhKW/s6Szhzssa9fYjRF+FqR/FGRrEFIrHCJrYr/sPVsDci1U5YzvHFLAmXAsa5zcYCLP/G2eoP2M4Gq9FbJ6foNwT04d/cUY4pd2dbTMTB/cbODjxq6WpWd6QXkEDWuIn2Azz/yiOL9RLmyerhlQhxY6mX16Ww+WyGjT2DwyGFVzDGeGYuqcLOgeRhjbnDRm4SqijlWnaXlBzN03lrdzc3NysNF0+zM3NfZym+LiaW2mqL+fmZqQxfyE391waP7NUZKYpPp0rez9N4XU1p9O0/EiL2EeWAD35Ql1UiHtfCyWtI9bK4GCQOq2bqfmC+B2sZhSZzwMq9pCPh6iJI0YXwxrejOQLpSrJm/0C+VJYK4M5/oi2okXATM508FYwpyz5OOaBjNjT/2A/BatYVJsvdEjGvagi+X68DB4853f4BNZxL2faSnbWJRYrymGhv6HEYwuBHnyhfbjVhxi9Iueu72eYCSt5wcGXVquiiNVtcljvX6hcYCnwAV9YXuTFU82vsATW8m6YQSV7QZI/obbbYuAzg1rs7ZbgR1gFq/kowpi2ekNj/0Ftt+XAWGO6oGCs/2A1rOfDMCOK8SjY4DdoCyv6iRH1h8KL/oIK+ZbkusOA1ikpFPwEJYstCQYYT+ViJXjOTzAW1jTVeJZAcUX/gP2mRUFTo2njUVbZP9ALVnWxwcRchvJY/8Auy5Jb0lAc26E8z+YXqOyxLEg0EvtyqDxDfoH/wrqeMJDQDVA73y8gXLUwqG8YFY9BdX+/QBtY2W+MYuATqM4ONxD7c1UaJvR6bciHoydMnPTltMH/JPxoabJshlBlEzRcQAYQ0WTg+J93nLrvhsqcuH8O7A8tDUYZQMmkPGjoeZFzQv2Rq9Ld0HrGPwevwNre5V78tGfQdAXxzJYw/wF8mhVrbI5afRInTmf9Bq9+tDh3BK5FJywtgLa5VTgW//lV+HyKgYW/uSED+ueHcMfioBmvynT5fN1lEZqPJW7Ff58DBp+VMKrYbzLBRX40htX9kj9Cdee0Xffh21QHr4LGZYLNScYkfPwMnOTHJMtzgiuOhkNmHc6E7zMqE6dqHwerT6KNKH4/uMmPPy2PWJonoZfB5uvEKWcW2J1gQC9eg+mIKbY8eJ0n1FFkYhlxapgHDD+ONJxGT2A++sD6LuUK/cpCaiinEsH2Z0ZT52+YkNkW6DpbkUNb+Sjub9+llSA+9fQw9iDcWGKvwIycskCozI6QsDQ7N8xH9LbPtscQn6o8Besj9VKrax899j0NM1LCY4XeYGcZgD/J10KKjzxNiVN74UPPzQMLvhw+uEtC66ZtB49P3nbmmeRuqC5qnoAp5EVnWOFkdlYBWO0zqlngG1wvxacB0PrRb8Nbh5Fq4fmBSfuefKKH0KuwEpMt0XF2JgFY5DuarJ37OgAcDOaRPV2buzNa20l7IVYP/4KluGKJikKZ6QLgFwZC0jVyL68VewMAVggc6gUt9/RwELPsfM+V/NP7Nm9i9xGPusMaN2UmshDYyAC9LGqR8V01ImpWAAA/CIzELGdopwa/tySW2VnGjwdfN7cT0wd41MoivccMHQb+ZIEWqfIcGBJBsh9KMEtgotsdsFOySFXGvwXi0lxeiF+HEOtc6mSRfmRnDPCYidiHinK2fVyBFC6XYEWw70oshXpfDILatCrEODtjOZHVj9jn0giLlMJOdQCxLNDrcgWuNaNbBpPyiLMSpFX3Vfc7YGq+mk1hxKuX+fBXHTIHCyzSQ3boHPAqEzT03Td6t6xsJy1rZEqQNdzui/oboKkvTqhY7yBuhWXzYGsMmYTDFgkl2ZkGTGLDpx/IAKd6CBoJHbd6wJgtV9mfIcQvWsWB9QKZhbtWqRk7zYC9unNckANODI3QoOakv6C5D8pD8ZPyxLMe+rtVgsxChGiVBrEj3ERemN6ovzcga8M7dWzebFUHzkmHL33QRNkQ4prtiu76kmmoA6s8gR1KAjrpzpYOIPeJRJrj2rZ84cIVe1y58LUPOik6LvCNRmo350PN1ytLJfPwqmWaz1AjYJbu6D0AmH3YC8M+6KmoN3Eu4qFmnUnz/yrrbiLes0zbGaJ0XBd0F5kJoPDFL93c6Kvkho13NIa9qYpu2U3EJMt0gqXJQGPd0QIA2EcJd3jRXcl04l74beYmKppNJiLZMt1hqSYwTX+dJOhGpbZzIkFJa/7RW8wNV9TVTKyzTEUCQ3QC1wTdBT2VHCUS3rrFhfoKcoMMwJbGWn9FpczEQcuEaJbGAC/pjjZK8CoRhY15yIFSCo6QAVALD2NNlDwgM3HSOlViqUwxftLfCJntJI0Yfl13lO3tF0OgZMYiPAqOmYpr1qkBS7QZT8N010rGU01CZO+xuUiLu/OHs3PM2xRjiLnHFl1SsMdUPLJO7ZnqBbyhu2hRgq/liKjU+7vylLjTV49sJFAzdhZ6G2UM1I+x5Qq2mIoc6zSNKcc9HNYd3ZG5IXgjorCOkxb/nDx93NBudUJIlqGh3j40CFrJ1kcKtpsJwWOd0pii6RBr6u6IDNoq0pKh6t4+MIpSD5iqoWCfmXDAOnvimKrixizdbZb7jhd0ycsIo6BeIkt0w1uamQi1UKnBTNEWZETobYXcZW4keflKL03Zo3lM/ejtmpmIsFB7ie1OwAd6WySH6rxo6GWJPkImF+kg7BxLHb3lCyYi3ELtZky4iLN6W+LlPV7Qcbkjumh7AaqZoHo5DAU99oIyJiLEQm1jjD4BOulslZcV3BgqlxfKXuxCEfqgwQzRPG9tTITDQm1kLfwxDutsi5dL3Ai+I4POrDmGP4GWjNAchl7y9r6JILd1WsEafQm009fvXsSSvKBP5JYy1ukctGXFsYsd4S8vc81EsXWaz1x8Hvbp64YXtONG8BWZnHiWam2E1qxQ1GlmaJyXIyaiNKzz18zRfKCznuzF3t7nBvWUwWx26qzyQG9U/jIzZQrl8kPMQ0ePdfqYvSqFOGXTUTV4/44ftFHG3YKR1ms88CE7VOEyK7RSDm3NA52wTh3ZowXAv3XUX8F6jpR5LMHtsgyEvpUG3zJEZdO8NfVRay+TTMRe61RaB1UK8aCEfmYqOMoR6i5KkF7RR0K7nzPga5YobKHcWcFHlCb3h4lYaZ1IjwuAefo5ruAWT2iGDJ68LmgX3HnOTTDIFFGH/wO4XY98/ZqcO9Y8zPpHo2IePC31UsajIJsr9p0ywKmh0VqEvjR2axbYZIzohb4dQsnnjhsyeMM8jLdMHl3QDOCvCJ0kQmkQTyjqpByQf2Cys14pQSJE1Wj/xhdrXIVglzlGE+U2m4c3LVOePkr8DczTSZqiklyhspe8yLuzn2Tki2CfT2EPZPKjTEOCZXqoDxoFiH100QKK4/lCFa8q0y2faJwMhpiGapbJpZPgdCCzph42KCvPGSqfbloiH8scNA1BxVZpg06oI4BzUew1E5WV5Q3FperhiCHQWBnP82aBrlilEXqhNQD2BrNmS4Xyktyh0BXMFU8KM4aIhxJMNw27rVIZ3VTIBrBCYGwYlHts/CEaUcjWniYUbAw0XOZhiFmYZZVIvx8DwAIbU3XzVNwjHlHjCwz9rx2RYQRfleAts/CeRSrUke0QAPxqZyj2MlT+yScKmVLAyLFuJDUKGiRz0iy0tkj3dETVcwFgexQzEalQu5BTRNU3iQykdCZ5wxCOS/CKSYj0WKPdeqJPJHBVZSQiBao/4BZR8y0e3+QtbkTeDYM6yewxCXTRGr2jK2GLBBmDmIg7AvW1OUb0QtIDzcTD75cgpcZBeyRoYhJWWqNgXVHsbQmwsrTvmt6A+uvENSJ7+x8uafBk0/vlSKWBNPJINpuEEZaomHT+crEMno0M8o1jfCE0/IZ30jK9J638/+1sAGJm+r457zawkXoDoQUSsYk5aGmJ7uqNEuWA6x+H+ODl09BSrGUEXm2hoQJpbiRxGQCwwxyEFFqh1bqjn70A95NqaWPrsg/a7iYD8a2R0AgJ2pkCSrdCDfTn2OENwOlpL4WqcLSefg1at7FgQecl/xdMwVELJBIHI44qAVB8ZvmU9/t0fql1B+fIOfszof16smDUSYL+puCMBXrIA4o9o4zZZ+UtGW2SXA0xAUKWBVrBBSp9Xg+DyJo9nwsAY01A0NAM61OZDxR3kr0fyKLRWElmWeMjOm55ioiXJVJY2+SwbI4TALDCDPS0PKe4QcG/sLU1hCwbNSoCILYzASRanQH8IBpZxNDSILJwNBUAXEEm4IbFEYmrra+zUvwpMWlhQs4DwKcmYITFucoXil4qMnGpJVk8au4GkFXe+MjivMsZolcu+K5wehhZPpoBAGtMwDVLIxJ/He/f8Y1n9QvErKUJPQ8AXYzvDUtznkNEIe+e1y4ruRYxbGmoWTGA6xGGR24r05lLRNTyx9taZK4fFE5MWxuaCgDfG9+fFqaQ+C00GrnmfKG3x2nLx7RyEOsWJ/g0AHczw6tuYTZxTNZWpkHLdi3rVwsnfVocalAI4FyI0dEz6xLJO71bHRoPAEmG91/LcovMbaUHhmE/ZUz2VADu1mxsZatVNlPksSq9TQ6V3mUUFDLXkKh6NoAr0UzErGWKapxiaq9FySPTK4wpNAiifk+NiN4DgDVMEH2YzxKFJrMUaVG+Nj9Ejf8yCqpyxIhoCwC8zwbVT2eJqN9TduiCJXGTKY5cahQUlCQaUPxDAAVt2KDIZUxR1SPs1LQka8wR0eBMgyDq+sh4qIcI4EElNojezGaJgpJEVuiWBRHtZomeP2IUVC7FeGg+APxVjhGqdYYlom6PWGlsQbaTeQ6a7jEIsn/hNpyIiwCQXpkRCk1misqlMEJ3LIfoMFFE7e8aBFHCXaOhpkUA8PjtMDaIBjxjiexfutloZjm2krmO22YUFLfDaGiCBMmhrFDVIywRJdxlgq5aDI/dZJEwfIJBkDA20WDsh4CMfsRw0MzdLFH8biYqW4yfyXw7jILIYTBUKeNIVWK7GlNks7NARyxFIfkTGwWR4YeJVuITv4Ip/MlC/E0Bh3nWoWHgQR/L8AcFIF6wCG57IEK4aA0SKSDxP5bgOgUo3rYAYlSgQqxo/j6jgMXPTN9lCmC8YPLcIYEMjiJz15sCGl8xdRsowHGeiXtEAY+XTJs7OvDBXmDWOlIAZE3RnE2jgMhBpuwwBUjONmH3KGDyoOnKcwRO0CWT5S5FgZR/myqxPgVUOnLMVAcKsIwsME8DyGj7OqVVNHjV6XQ6K6vo5HQ6nXHq6jilr2rTw+l0OnsLSl5wOp1Ou4JaTk3rKXA4nU5ngm9qONW+qKi0U21HZd2cTmcvrao4nU5ndR+VdH6z/sChrXPff0GDik6n09leQWen0+ls4q200+l0NlMT1nPGhpSDWxaObuPQCT1XZJaGktE2hexSDRYDwE/K4ooAZEeq2w+pu6wm9yF9T8lIAAhTMAGaJimIBIDfffMZ1E5R1AVqTym7AeCpVm8DwAifNF9fCO8n3rKrqQcAGTYvYQUA8Lu3TwFguLKIKRnw/mSCTiiuyBx9Qob7vVxWuLr2kkcORcMAYBGpLueWwRgfZFayFtFLRCg/WVeFcB8A6nlpD2lesJftkmqKXrgExd/qhUoVmqF3yHDt9+QwWJ3tNgB0UnRM0lrdaMif8QH2CVaicjrkPW455PZQRiskH3iZIoPmco5MAOdJaakbUN5KNxSTb34Gk/F2BHD7OoBd6ugbyUIltQAgndQfB/A7ADTwAT7SrNtC+VTJ7wvl+7O3a5bCburSZikcw4ey1yBNea28IJQffFiCgpeVDZH86uV3uRFyLQEgSdFCAMie2rJcpYaD5927I+iHQjJNjtiVDHgJgMWzAbjLqmsg+TtIwVTJZ+pqAfA0EgF8q1U2gOyqWnn/SPI+qWdmMGksM4O01o39MABkDySvr+UAwIN4RRUlV+TCC4EnAFbJTZC0VRJdACCvAck76pGe7fdMjacpGXBYJgBnAgCMVkcuAOjiTbgOoLiMuq8ApNFRAPfsGk0rBpBiswofAUD+S6SwbQEALFREFwGgjEwnAEsA3JDbC+CJQ0l7AFhBvDxlYgrKkRE7ARTG2B8AOKXBeMkSby8DwGZSLVwB8AWNAYBXNUpcDADDLELIPcloUvyZpKiioh8l/WS+BtBdBFBeEpwLYAUpHSCZzw1aa1oeB5MhbwKwh+gHAKinrpIHwNNgLwslvdS1BICGVNEDYIVG4yrmAcitbg0GAcD1IGVB1wHgc0V9JN/J/Al4oq4C6C9pBwCvKeokuVuSGzTRpBwnYy5ZAGAoUQvJTHV0CAB6yIU+A3Dfoe4HABeJKAVAbpQ2k2gqAPzPZgnWSyaSyomSVEUl3AD+L4ksAs7SRgDfSiYDKC6hqGQRAJxpwg3q4DYj88mg3wVQUIKILgG4a1f3nuRXuYEAkESqHQ8BfEFE7wLAv7WZRlF3AWCUQc0to9DBg4eSJmoaSwrsSugIgMIwIuoCIJkmAEiVHAKQQsp/kUDcMyCcE1TiqekQ+5FRpwDYTEQ0GQA6qytZAOBZqMxWSS11XQCgFhGVyAewX5skosGSvBpENJxPxzd5n6CB4nociAWA4iA1QcUAUEnRVABoS0RJAAZSBwD5IURhBQA+VRF3TQIge9krfCA6bDIyy5JRV/AAeE1SXQSwXB1tBIDekrgiAH+Q+uUATpJ0PQBPRU2+JRIOAUCKQDSMT0o3866e5C6pviepryhBMo6IjgKeUhTlBtCSqD0A1FRBldLkAKS14wMNMxX7ybg/A5AdLqH/A8iJVNdfskqSCABD1YVnAxgr0xcAxmsyi4hqFwLA20QfmrzmkqvqbkkaKArJBbCZKLoYOElEpwAMI5oM4BKpDh792AvEGTYuUKVnpkEcSgZ+CsDGErLjAeAtdaEZALLDiegIgOxIda8BEOuXkMZnAjivyWwioimSB9H0jvHcT1NYnQP1JI/UZUqqKqLdAB4QdQXwLRElA1hOtB/A9+qIQt/cVSQDJPGBaItJuB9LBl4Hqvepo4UA0JeoqghgManfBtVNtJgjCTkPAN/QYD5NbOq9ugYzSGudxErEGDXxAFAcpGwMAFShaQC6EdHrAC6QIxtAey2IqOTQEzKehpyghEIzMIsMfZo6T3l1CZLlROMAoI262CJ1szWjFm4A+RV78mkwacwjug8A3dT0k5wk5Q0lA+kwUBRFRFUBeCKbAngWpBGR8FY+AMziBdFBw/u7Mhm6cE0dxqqz3QLwxEFHAVwU1H0E9Q8dmtG3ALDwZbO3SrJczRrJNyqERwBmBuUCqSS9C6BNIoA15MNEyRF+ULtcQxOTyODbAEDadK9rJC51lAQAbSuIAMaS+t8BiN9O9/oQALprF/YXgKKuZq+vpLC6sheKJQ1U0CoAKY0BTJFZD+CT5QDe9EW85ApHiJYY2KVoMvpkSV/yGpMPAI3V1ZdM+xBAcRl1VUQAR8j7LMlq7aidB8Aqs+e4CgCHHErshwFgD6l9F0DmhwDay4wC8PMFwF3KF+UkZ7lCcVcNKr8PGX7QYwBZYd5ovWSWOjoL4OhmAFtI/QQA+FRBM0lejHY0F4Db7JFTgt+CvAX9CgBFdVVVAYAUID9UpgWAs27gD1Ld2K5gnGQ5X4i6ZhuQmEwmsDsArCSF/SQPHOrGAXDnAuitgQuAWEkBXQKAd3wQeQ3yxvJdpNIgVZkNlcar+qahwvqK6DcJjreVa3UU0pGk/jJkD5BscB5kx6sS7l2eWEsm7NNiSTfeEE0qNpqDDjKDv0n6KgnNAIBu6ip6IPsgSF0DADhCSr+QHPIBdRSNSPkHqpSPVaU4T1nYIQlw7qfxY5NdkJ1JGs6X+48c/U+urqpGAPDg4OrVh7IgPSDwh2iBx0jOxJIpjMgBkBWmhBZLVqmjFLlvSH2S5FNFNSRiFR/QAitAYStllBYMIy2dcq28zJC5Tqo/lyi9EE9ctq3yGMW5CmQSXweAlaS4gyQvWt27crXU2W4CECspouMA8B9fxNy2AkT/uqFsz4uk6XMeSVaQl14yc9VNcisSV5Qkbi8sNoKT5ck0zna5XK6uyux/uFwuV3d1Jc64XC7XWlJf3+VyudaR8vdcLpdrg6IUl8s1Xgl1dUlDNPiXy+VyOTUId7lcrl9987bL5XJ116qNS/UARXtdaocq6eNSe1wVOQZs+FvG40qqT1pvcLlcrgXkNc4lTVBHlccezJYRL8+tT1yfmMM5z44w8hsLFVp1bFc3knhoq9yiY0LDEsT/V29yLHsaBfpGbS3iknihOQUE97ws8uZpEgUQj7/LkeyVURRoPPKahwd/L4mhwOR2B7J1VXR+JAU024amZhbrofDSjCgKiK42bueNQmbcGbc39aMA6/DuX287/7hA1K742fXDP79bkQK5Y9oOmTBr+Y6DqcdOnjl9PO3w7g2Lpg/rVpkCVwEAVlA4IGorAAAQvgCdASraAvoAPlEokUYjoqGhIzQY+HAKCU3bHWGkMHFp9R1ThkjSg/rW6tcxnKv9N/ADN5N2vAH7Of2TPBNgP1u+ED8ANwLR39P/mH4MfsB/meAA9ET8E/2x/2NrgZfp+u/hL7OSIyw/zvXwW97R/Yv2j/xX7ffL5WP7t/XP1l/afb13W+Jf4TzgPHf0j/Uf4H/H/sH82P796lf0T/0P7H8AX6ef7X/Df4T9hfrL/Wv9H7C/2u9QX9U/yH/Q/xv7//LB/fv+X/fPch/Zv8v/wf8b8AH9G/uP/L9az2D/3K9gL+b/4v/q+zp/r//h/nP9n///ov/Zv/3f6j9//oU/oP9y/8P5//IB/1/UA/9PqAenf1y/u34r/sn9IPHP9f9YHd9fNtCrKX2Va7Xenn37FeAF4w3mMAX1p82b7nzJ8QDgPvxHqD/zj+/+sf/w+QP9j9RX+Yf1/rF/vT7Kf69q/0FPbMAkmNKntmASTGlT2zAI/b1eFq85sPbL/kd3KVysZ3zApf6IHmIXgILhUwBhlioK+qgGNz/twxLYN/oKe2YBJMaVPbMAkp5dy9i5rkCAHZBKH03esz5mDM8/Vw+hjxIpv9vWwt8aO6qGAPWoN+pS94ayZkDRSaPFv+m+nixJMaVPbMAkmNKntlXdKXD1q+0qsq/pYZQoDlOF/oYEPA5pIO9WPBUkNnY1FoTCQ1M6CUd1O8YEm5vkO3Dms4D1w5unN7hgmmVb7bd9tu+23fbOHHYUEjoDXpDSvqB+TX6EEngaEJEAlw23CzoLxrLWKwCKl8oHSgEUu4LQ2CTDY1oTw5RcDpgXs2g1aYMrpMQ/N8cfDGuUYBU7mv2e4FYGx8DP7GuJYK2hWtPrOSVzNfyYQNxQfemfLhx2PYKvYMUCQjRS9WchyqK2FLO+qcJSl0pbRrmm/S4blY+PEoGq86KF2Y6kCLzmhRErEmNKqGRQ60w+LPbFZPGHWqDWAoYq2ZHCVxx8pOlMxcQ1hENcEDp1p2WaBBq+5bLyssW6AdPD/9rH2wCAWzGgJHqvO63eQmGKOl3P0qu5QFBgO/irACkL3yqhLMcfGkpvnckWjoQcMUyCqnGwrNlN4I6maptnSqK4RDoRq6uxuGsMKSQXPb7eeYrz0JlvP7Sr1YSOsZ/73+8mqrJP8t1TjfUu2bisb/hgGXH/Ot21jXGwJlfr1XgwXFEmVlOfvHMb38BRzTKyxo+lbVG4CluYpquesdlA/ELur4kVGua6jA2fCIB1oSW+Vuhk+AKh//T7EalmLEc7LZH3aBi9/8R/TS27Vf7wOPoB0xqKi93lnHlPpcdlJBjRBaRHN59v3eqoI1mI6y0L/l+POPlSwWlLTHYIkGno8cKFj1vAUcAiHhUBO5/1bHdAoy4ZovrzoRchN+ffUX+7qJv0bl2HLaTvQqP7/UsjX6kRfG7fPn5g/cWQUnK3tXcIeMN1DRJhOh6GZyj4oDdCX8i+a/56EbccldqJycwYiZMQMgNnNc1j4bmCXDociW7Z9gDq2UuMt2dOpiMjVKDNNrtAXebTk/MNLUWYAYn0pyKTAiLlrqPXbTdguhWxIZNtgapvPpDeCURibSdUhGGRvoHR043hxDcGEjOqegZRX+5+JVqULgigtkX+YNvXQ8UOSVSWjjD1Gyc4RKGpMFPOI20MKZlH7Q1CecCHQgZEtdEK3FnNxwy4Uzd5LYssl/VAe+zAJJrR3NthHbnaFsFCvuOVK4pSGajqqYL+Z0NtflJYiCVxx0ydMRUFlpUdnWLOvwSjGnt/TNXFY8qH7qM5SXq6tFdvQrJd2gRLE8A4PMQcuSsnX0Upc5J8x590G9b1lRgfjc3QzsBDvBE+usC+6YzVPFf6f7DhT7WXG1cLxk//FiQU9l+rGu4zGTQoOHuqMGgKCLwmqS6Aq3YaMB4kUM+XdBvYh05FrMYtBeyN82BJ1vSy2sABtzDnkJepnqzUz+9HCD4rWjY/TOzNBocc12L+mnx2SNOPvhKX3xO49U/0+EF5g2IAOwcHquDrNMxAJ94du8OvgAD+nyUAAAdgON/WOpxxVjAYj30ctRK3DM72dhtViVqlxbS+QJPKDkrV5/8G+7QLmopM23DFJJbutON4d4l8JNFMJN0JwrP02sUWSzNQfr7fQEkN4mwAvyzXbzMDv6tmjnWIPJgKLLxcfF4ip4GhaWfJGWuv583kGkjqs/lpgxlVldebQ3wirQ/WHdCfijjetbipruC5WPHJ+lhAWbTxy13SKG8zGHGAFn4r3SSuisNfo6/ZYm3UaUuzprm5XhikC9qqJJTky0AMElaeQO/nc9oPZsV2joGHH2tlR7TCDfPjOUivdgaLRE18f7Uk2ybRRmIS6xTpcdLxILVsi1W2JCr+WCpBqCH7l4WZ5hCQcGBIodsX7nzqyS2Rmv9dQNVk8Z0Ik1zDAzeUJ1fIDSqv+JEsB9H4hU7FBbSfyDdX79v2TtdF6JTJjEUIunJVN9OJSY8eoMTXZx3Qbl9dvv7+c3yXdUP+vV8YfjUgRiAJAKPtan1/Q8nX8s6xXafN1sUzSa5atMao95AnvFgIQqYfJZVIhX4yKaCWV8XhG4pKCM9Yk6Svux0Dvu/qhBC6Kd7kvAABPUzpUWCSFwXB09OGs2KK3guS83Hf67rQoxUqig9q/RDr4rXPlGIbQocsxaLaOAAoiwd0opfYAMxUMsB7w6fR6tXLtS5XuJXXSlQ5JnSmRlXFJ5414+vOf7I31BzYW9CjhIkMQf1wf4RgIM1uU4uD0HhHAhjuxlZkGiCYfd/MdZ8R86quFXsZkTpXN9DEC8yglKSbpEl+ug2Af/YisWFli6v5WuRFqTx0kj1GgUgDtJ5aYhRCjYnIGAk1JpvII7m0bLB4S7T2tzArPNsfxTH/IaILJiRk0LvAPA7LpyTt7/r4Nl+oXsnU3DyOxmS2iY97zEWBIloW/7PVBLyCPhrHWxHURLePLBt7Y39ploSb9tyyznEPmeFOIPkL+bzEHIFXkUzoHUg31kFTOWrEkzSL/AtXPnaLm3hDz8bEYmgOTKVJTzE7YMEueO6SeY1bvSNO19sRnsEehp1Q2OwS3uG/fxRXDR0OZUesRSuPpvzSuDzQHNH+FtbsEFIb/G50EAThXO0C3KQJuys7513slrmCZFzeyzVELaeaFZYDOpiy2FVS7LCem3UF+jMJN/hzI9GBZRDxvo79AASk1uIFHFPmezW7PjX4mBrDxmKXfq4iXoupt20OoYHth+eAtCawf2JsmAf0RsokSIkKez7fuVbpG9CRT1FICYORftHK9ZFMeWTBK2V+FGTdmjMJ2kp8dArhmTWa6u5CNd+msGJ0IO1I9bm212V1ZWth5hd9QNXXTskF+obkrHFcWimr+Cpz/mIufcY6ZaqOi54bbbsb5QlGQw64+8NF+IF+4XlRLvQqFrRYMBlqY/DPuQaCBOJ59MbSgFFn+xhGP1hxdrFoSGtfsOwZTrZSWRt1kMBZCNqGfDzvtQf/3t+i4OulFm/0JyT8l0o4x5qLV1/xe4Wi2bwG87T4/AHJ3pZjTc8/F2ZUGP2hviG0nWnpEvV1pHjtUWFDiD1IxGWnJPHzGW077BeZSstiPeJe4M1P0oASGtV+ZrF4DlWalLjFnGbnm8VrKjP0R3zkgC3ot0dl91wJBYx1C+7rFUa9+HCJXjz4YI0ocXlwO6B5lyY9GMH6NytKOH7JwLs1KzT/ZMH6QwCOdxlKTH2pvu9/C45Sf3SGMJNjieJFJjEUKCqmlhJJ0XlSEeRkdFtA7n4SDQT5yshZ4A1BlHa+HDYbK9ChogJxuz/L3J0+F/ZLma/ILw97wtCdeTjAabvmAobPAImGtb8Azb8trCyQperGZbiwWMgZEX+KleFkAFkI6rX4me23pw4ynW8AsrJSXANfxF3fr2nmhz//+JyF9TA/FLzNXggGmCL+kd+87MafDI4gyr0IKkjvpe6rly0ReVtKj2+MwmCYRHFvamA8Fh80lCvTq74yzv60dWcHyiwHIzkNOEr+w9GmTHwyu/+YSmGrSm8ua8vWNjbQZnMt8Tj1atNKKE+oj68VijG6ZAvFIc9rbbjg7b/EkTk/oyxmoP0hhJyRp4v7x/QGHY/zLv83fdrpRZzU8/t4dDr9hFzxymjZeOx58/qfILN645MzEeuUb1C1mipuiWcuuCGCQmwQkzFlUru64TthqYw7sFfGDrTCCn0oQEczLBSMH/lfBR85Dr+2XKuMlFJCAOLe4yzAUYD5SfuSQaZtdBi6dfUQECeru1kIYuurrXg1TccCpX4C6vJunlJvJiLvNAuztcE3lrIE72Vk2dMLIg4g4ww5oyUHIyE4KT8v6nO0UA6xoA7YTT/Pxk4wn9ZFN/6/1sFYr48yAPU+rz19i9e1033/67rAkG/hH75ogbxsS9gDeAj/clCiJqAyRPBUP9qoW515pitxhV5GTmJIX9j3ZDkiXtDfy1wGQhPrivCOpntTdeJFkCVr5tx0kPv3NKvClfMPV3jYFJ33FNUWZhPu212YmQWWym+kNNVddAqOph8Ly2RL0udZeNyeKwZRStmfqlLKtMA0BCZwY3pEPkiFVEYpn4HAFl4u5NJawAMvUe9tH1RF/QrzMqg7X71VZdTIoMAHuv+Qvndzq+PCvkGtGTO0sxBy5NAk7FyJ17LS+YXtt9+k2rpIbFdiKFvZzJ7DLi18RVaRMB9zdYg8R+kZ9RokpEMlXAhiJtoznlLDT9M9mx8TCHuiHpNxH+W85h7Quo8c/g8+kAk/nmAjYULBQoBROKp/PAEsoyyHqMInjGqZ/tL6x0tTn85VM5FH3EMXVZijPy40CgIya4EoGUyYn0OvduD8+gv8TX58T/t+66KUyRrrNeOMVfTaKHxEeDIvh3zGf8psLrZadV2Ar2bnm3PRqsaRke0cw2rFAWsEz8J9rh54NIbeDw7xidKoReafF6+G6taaoiRSbrg3HcoKXSQoKg03pZvW2jDQeA/wi1kHj2Q+zoD2ldip4bb0tvgVij6FNRs+Rh8/IlNKohbPYdRkCrcD5oK+3WH0feuxv50e394v0nb2Cd7vq46T7M3J9w4G7Kj3J6fwo0lv6FCp7ZvrxhAwUX6gYASXHsENsty5r5jcaOnOLoO+pJ3aZ56/5eB2QE9b1eDGPY4swYIy84s/t5bqGZstpmrmzzGFAbBFwO2Pk0xsZhB5iFzshc9nRbeI3B1fkJRzdgo0sVvqx7pgeXfPNOl9JmmRG8awDQcP0c6ya6mSM4aKL9ywTKn/sdm8RR4NPZYuiJ7UtOXJzUVcMVRByCi7zJ5bPW0UblqSKtI0i9nS2Mu4PE0HiLTyNyXfhi+NsrH0XU21ubCkHPEh6pHf6qqVbEPuZc+YXRS7WEKdr0r8RnQXiG0O8vUMtRPoHCSM8oq/yo+hFxNmmZSSWWCeXrq25i8El8sFMp1KFIAAU+F9XweJGC87eYdbkGx8ZEt4GPZtD23EJezWnYUtPHDP9iZZszUPVAHFr3sxTN8PZI3wIBMCb/5H5LgJEHWnIBCdrLxLNKB7248BDXOReH3EFLmlLFQc3xuPNycKejYWE6KNFa6Ty1/bpGtNH5PlC/lJym9Pa2jmOtqCCo0+7CMX1P4OBKir7bXZATz0+rtAMeNw9EAFde0lwHEwbrKPBcY7SP1jqN+RBLpwIqAAnB0dslv5Iq/88Xkq+j2IpNS/OP8uQaoraUn/5/x1SeqGuIDjYUaNAjiGsMYyvkeIKvUBhegpjif9vFqXXgnD+JPPinkjSCZD0o0SkjmhrKWK2DYvie7UIpZYvvPeeENeIqOllq2ZlJ3M+1ZFrB5o+acdDez/Ub4rvWEoFp2p/MnRP2xVGATMXZ33fFjpYunGLSxe8QD8xQhocco37H/BkHhTbs++5+0rdu9A8KbSdnAS4SsdPUFMadAYtVVSOgK98obTgkVmmKQ6d+Nxsy/1vvhZfA6Slzns7lFaNw5s7q4GUnWsvbJJbsWse/xJEAaoJBhG7wFORDeRBWXe0LJ+vQlB2YhXwA98Qs2dB+ZdKb9k10e/zQKossDpJyH2PAHeLHiDRcN24549IkBA9w2lgwo6YS7lhdwrAm1tKhKhUr9CVZxaU0a74Z9IC8qJ26P5BLghXvuGraRUGqUcTp4y1U7M1eqfkiN8XMJpNVpN+cPjxqYMUvrcKHlPy++AZuWaSF5bYgKPLFCOIzLOTqO7VNbf6a0xgBQ/UKzgqAgm4uARYcu//8Elcqx/nGr/QwavFuliYvbQlvOQWSHxqlJPTQeTAKAtQ3YPTZGtXprdUbrMjmCQ9goLwfbJIRfO5/hJaMPYGuD9HF8PLq8vM89q8zkIs/c7xi+KtsYUXzbwDiBLZ0qzP1xwk7P5OgxmhLSY+M0Rbc5gg8965uQYO25k8aAoeb9YJUq8IyHbBQ5H3ye4DR8GeWGGn5JJ0m/x6AS+VK65aB4BAM7mBmo7QJaFeyO7mI8IXONiCh78Dp/nzxBJP/fs/3MWAamom7himbWYemoif+TxxFocnD8ecuezbspa9kuj1BlN/UlvPfzm2rcZIx/7Pc+YsGPxcT/Ng8H5QPivzwB+9if5GLzjJXw17Y8Yvh3fUaP14H4GkEme2jvgSrDIgu9pPcTQhfDXUiVUO/4LA75NDpyNlzgstXYOWGVLDJ9SsoFie2Vkf5AYeZ5aqTRJfpR961P4klQBLvKXMGnluWnNdjy7OW0UARPn40vq+DBdXPHMpPybiBSR2kNhsntHWWwlbES3yipZ2G01Ky+Y6NYV7R1OXnxg+lHnvqkkKouVWyILK4g6LPbVWt2tiM6vZ/6ITrs4y8FR/Mvh0nE+4UdgdgewzsU2iRPXeKXDLTpQ7o/vEx6kud6WFrdQR4vPoXQwxdsUBaEJzi9zV/wmsqbwFdWDHbmXMGZRo3vhX2nlpmvQUQfhtuW+zH1Fsfdw6EaXRewKhH4l6Qr6lHsTjlmwFOQMAuPKAcEnk+kwncEXpqQpYgyGJOd3Eq3paYnsgggfd/b69iqbTw786h6/DSWXDd47cAiXbjl9fwGbY9LHzXpFHUmUE9agO0SZIUjo3yYzeFTPS25n8StmDO4kZLuyRT0eKbfahYJ4iP+mL4sF6/BCEn6Q4vz03VL2AByC98EcQphsV07SWL9enyacVU08DfRJ+ewNy3BTw2z+75AHlQ2yYJI9XXI3gZ8ICuMz7L/7iHexlA4wzWwnr6ObVF0Ar/HbzPhjb5GhPPrICFQgja1nfxROgpCSVZame1PzjnVoc2qFhCyRTOc//2yRegYcONXChEeTCISo0+Yy8jnEOeS9/ZNZ9Wy7bhuJJItqdsT6qGIT8CunD+QZsdsuvJwRhbkVZpQLD6VBrDj0TdYHPtrhc3jbWBwkHrescLJkvZBRft1M3zFCwo0V0cfiF7lFvqnmG43SCW1sXqWH4Yyd2il0HNDQYs582hQRbT6qII2ThZGxD/GdginW6kHRZ0IGiIIVayhMb+KtFXZUhDv1L5x4R03KMwMQmWkmMfoZlGnL5LpjAS+NxMDO1csfDi0/UZksbqnXttXoOLRiJWKWgoPentAuWHl/jsBGlw9vNHaqKIG9PD/PXtJYI2+bYhLjYw+ab5vd3cftD/HWhgBTRCtHbNNRZOdQ8XwslGKYTGaMYWuzYu9PH6sb6u8fJRW/HM2mpd1ENRg47vpzXhTfhFjfWma+3PHoVVSohsAOZrWtvpYO4pzctgp+xaejSlmRP54fkNLqZw8JCvF2ubKwLcjRvJsgXP6mioDsYFHoKZ0J9hDCDkc/sJo6/5TOQsck8IQz6I1fQ5B8iJTraR9P/ybsdtkxYDm9eGEAdl2jY3/U+CKdesKgSRwciwodJmc0eV/pxBlPnaAMcYwLv9iAXFGN4//eTP0+3zgT0XDEyA2vk8ltT89jh2eyA5LxL2R/vhziJ3HZTk+iMmElnflLoBKZAGYcmrmfhdx5sZsj+5OsZjL1hPdcFwz2f00KMHJ8fvNtUlKEj2jqc2InP2eXXlhaiqiXgfjRmyoodyDwjPAD8DmSgLrLTsQD3fx0kPeVcWXYEgVI89RKKYo2Hl+YBwqIpLqT2u+eIkoWe7YsN6hxt9YZ78BDglgIGO+mFupxwOIx1IUKgIn2wpE4wTseGz6Es3ZJW61PZgJ5zT8ODC0GRWWuH7hM8LdsBycXZ39JC2jA7Kzw580PcSvglqiXBJKiYPx/Le6kDm0PUGe1se31EzfFqozT4QxmaeTXCB253JSqzVscWaA4kFEoOtK1ZaUoRVc2rGNLnuE7CbZoX0MIpS/oTbPOBio20D5nw9WLjBlb1MqdYRRVTddZ35mwkJLPbYVtXeGt2ErOeImPps316KL/T+nLKhHLqX2+DZbFAh77n4RcOxAELS9xbhHSuptMBU3lYii+qwCGmSP8dr6DnFuEXjdDxgqyFYcMavRkbQgosvlzf2MrI5So98n8s0RVAXaGQXUFAnf9IImKu7N5zjk0IneOcG3uwgp3wfpEOU7foSPxpBbbRy+/4OOhY9YAqLCeP7F+s5XIWF8oSJ6b8/LvaU4V5YT5IhpWrChWEfGopB/hxtEMTZ748iVr3fMPjlwBgB/XNv6Fi4m01embX4my3USjpBH9IBnAMSH5cd0Zf553HnK2hl3RAnGPP+Pufjbsy8evt5Q7e14ytYxbTKUyc4P9u/TajsBWEiANS9RDSs7WZFjuJXA1HRxO42C8nLXp5OeQHBUow82DyepmPye8Jhkyt1oFFkoRD/b3qyK+SLr8Qq7GkzYTPCHhXfkENAUaE4Hvyn9kAQ1nqF/zEEytjx0NnDG4wf48wQ15rUBEZRU+9IdZo/hJw8G5uYe0mqtts30Le68QM0F1Pv3cRVNShl2oHpVrcWzPy7W0pbccsqfXSdtlzl6Uu7PCSAETOJM/HnPAzJNQBkv1EtiVRD3BRTmyYIBwq+3Auy6jj0jiB47opjzBf0wlPyciUQh7ZHuCt/ze6oth5r7loW7X3luImMBsP2xDAOtbyfWsvHXmQyvG+fthaakAngVVDWSoT297BffWFzas7p1v+RwvPmkgWoCeHEtIdlE8pm+ZPnaN4SHY3wTDN2LuOpCEXRt4hdIJfVz71Jz4/XeiecMXmql2DJcmZPjkiyWo1Wj2kyR8ajJWeel7VxQ96dv+4IimJKLwlRqFsrGkNwGBy78NEsAURdtOhudFB9yat8SV3jDIMzv10EUFBseFlZ6a8mx7YnGrde8t1HWayx/CVmAOGnwlsG52b4Wf/J8oRKhBHPsGpfGsmGC/4ZwbwwVRzBhoB8Le0BKc4vzUgjJucUlaH4kO9aEGYz6MeiiOe7N5Dyd2fFJsYYAZYOzsJ44VJTp/R39gF4S3Ls09VdcQHdjOrD904UC5UjByXvgICDtOqR3zcVUQZYFSRX/q+5HQrcScCHHQcGdIBWh1FGtq6ZhJvbhogtCQcmGdfk+b0bvWbZgdxSbVzzyd1ivjB9LLcmq2OqUI+/ER7083xFtEgEMzZPkA6Bz4zIVid4KXjVjlmThZ7HHQt6/8yJ7AR0AYE69ZypnfVxyVrb43dpnpCGvkqde2BEChSGf94YCYK58QERV4MhhCG3OEILIIUygB8wx6cV2w1BSoIO5deDEr2aV3jNLmfWTSb/PRM5Na7jPOvFl2iq3pxzN54KBhR33dL3dqjBLyt3L5liF4QYhpJsz39xdtbzMgpKtlGGQnegIzIdc2kdkcmeEL531tPeKm4Bq60UV1mKi5DqG2wajQ+Un7aEwTiA5vRODMLuvRuKD9B5l7ZTW1gXjix9TUxtKra8jIg0HyXTfW4LnUWYjfV7pyMrhDVnrXisqyePykrgX/mcBOAQM2jiZZ3+fjlidlSF7rFINVFTYItED3uKoQ8ioJ1Wl9r7oGwY0S/FUtfiGp0DA8BmBNJ9kmoCDhka0rLx3kxMZgF+b7h3sLJFZbix6bF4bKVNE5gvW/Z/r+bPJY1fwdgZRVdyQiTneRn4JxZYp5+xXngO4PX/8JgDBzhxS9VB8rNhdCMJ0xhdBsVHFPi6mS6nD5EnT4+m83QHxjOkTA565z5f2qU0tuz33G/uVG50zBbCTdgXYbvdX1VNsxBJH2r31gOfhgVajmZhDgdtuZIlQzh62itQQFMVtguLtve+nzI7+/E2qaw899hLHPNw2RKqp/TSGfqb3U0BrBDQ99jwrr/dMIRClqntrExStVzE950nwz5mGXw4JV328kzkal/V2wpyFoGIGQCl6Ko+hfUZtSMKFKocp4xXhYiHP6A+l96/Wpn+SEy2jpCcDBIkydx7+y0Ah2lV7dvP32g1hY9FjCG/Cv28zr53wzECV8TCogpTK1t0uSn8WkR7dbEvrL+ET76zLlySsjgqLJHzxR3YkCl6scsxLUrclktS56ikqwm+LGwANMAFwXlpJiekOmMLSx0dX9nIS58NLbUGNfzL9VShCrrWssQES+t5Xc/SzaJ9iLXt8w24cURZJwOdCgK/QwJL3KwthosGoXJOa1pnWdobDTgBq1GxPATLFw0UvqmZBIie+mmPNaHSBTGp46bML7m8/GpzVpRvaSY0vadBH+v2p5v88My2VSBjDEAVbpec4MMIgbSihPiPTC8kSHzNN36DtbS4uN/0dnuyxkNarhPsuI8m9P/6G1SGLIr1XhrsUsC0QeGrdFr68MSPhKSeeIpRz3wIvofxpxvqXdMEqwCJERFuC9Ua9H0eIF4sOp5vD8ivzNbLONu+Q41PiueNjlVTU3NW5MgX4nzH/ucfRYx898FgTwjLZgKiJezXE8MMRp0kkpySsKfTMek6UCljbH9BF3j8c8ksDlLu1DKfIS/1pjthmTeSMSwtxVbCJO8Q8ghNP9vOfTap1XFvfcuOD3J+20nP36l82bGaihwmjFpjDVkNxcFsvZ+xryRGoFDX2gXveHFxBHO5W5dBx1fKzQ0TlJYkxEZ9676e5aCD9MYAC6FLeW13Fd8a1RC99CPZ/MmBDFens+hHO9I1T6YNj6x8ExRMZF/ptGhRLLys5K14wlxQRMg73c/A7fo3rBZicJhpzgBeyuVlOetkFalxYgmRLpPxispIeR1UTIx3WvRU+DTwtonCb3oc1HqPJClA5XX8u23Zs5KKPTEXd+2faHmiorZUcCkIOuMCwEOwjix1cvpPXWkSsfcXtRR1OiXw3wy/rAS4zJaM6AQ88axzhtMoQ9wGikGovukVe9Q735/Vonx0ru2RaK/ja8JrJu3ZkceBKPq0NTQRhXsvnozUMDrHy7B//Pz2dabkrVt+qf7GjZghkaLvvu9ENWX3TLPccm3avFePq4kdWM9X64xbSZM9EFDOyAZrz/8m3rvFDg5BpMI/FBdHKa+SV834e9J+0Um1uYjHR5M+WfV9P+PPYo92snIr1FVy4goZAV83SJbW4LUSWRcl6oFjbrUrEu3Uoutx8W3BF/G9gSZqufmBm1KcsHDr/dU5r0B49jptUAJRePvGcbt4TA6b+lcbe0cEInWBfiZdZP/0Cb9wLPDmWDsYQN1VMunlAl8mSmxrxI77Z9FItxUF+I4TK/knn9nP3yACSz4Dnf50f4eOijEBbIROs0xflAMuLnagJd6pmQtl6nHumY484E8sLPrLc1eV1ESdQehsrYxmLQRbk61tQjsTiQaRO8aIDuFrNLOYTiUWZjkzSz79/i/rrueSEiFmGXsGQY6Z3n8s24kgSYOHQla1dL1DUqmqCXCOoSLFNulAZAtG9DkhCkF9T/cP+xnnjOOhlyvNRCdfJ/aiTCJW9pkZEbB6JW3qUPU4fBnMW7VTM0bzZQAhX/ik4WpQcaJxaxtjF9x07NezfvTbYaimSdb97p3SKJCw1NpsA75k/betGkhgKXo1538METrCKyzKMi1dXNRf1OQ18QfNLm7xe9vnPuOLCi9qw0Sq6S8XKy9Xf6pHT8rGtHwhT52sXsr87pksZ7lfdMXNRby+ehAZyJwgsEn/9ozrcVVNuwXcHKDEer/LbqF/fOiqFusv8Lez5ZHf8fehAFUKnsWnuogBVVT/J5sL/HRKD8FU21dag6quT6D8ifxHCvA/EEm38Y9ETXGoRXK+Ag1fQW7ySY/LhVajKTNEw4YujkTwCbH4Mt2+IoyFzS1fmoifL/JZR2feEZSAzWyUqyl8Vy4VGfrmVMjSkVWVA2wVgR0CTFBkbyug+qIvfhwXf+k4j1ivdROSasn/rw7x+gtnBeLjFQplmU0Dzv1aryIXwQCK4Mu0kyhcsAqxWoYNu+cTehCGqgwy5WuT+KTwBxN0AUCnYsFd++apmlHIKGXtHQQlNprYooKdZHrbIK9cjmr6wNHTA1IKLGHn50B8cwLZYgywy1HyJrv4uEWbSr2FnqNAQ0FWaPZ2bqyDIbA3ORpqBmrqVe7zhf+qkznrtz7TvNeM8v84XIDSzvIQ81WoZupjMLNObpviKgfc5bm7eA1n/RIGU1UcTQoCuUgacj4Op6dUleviSZy56+nIR1ZoFYsw0sxieRyHGumzyV/fjXH3Q1W9xUsD5saEwcebgNdsmalMgO6bnlGhSiwG2s7v1iC7bx2ZJ1E2OHRbTJQu9Cx6r6xDhWY8ZjKbIfVyZt/4SgCaR31M6Ip9/T2ZPSR/iXsyHYlxt6DVwn3N5xQRWzkZcz9H5qf5KsBzVWV3GjqLJA1XysJsSOHJ6Cj9+ZT+4qvUZMv9jUw5Kg9VpCho8T3Aiw7tOzS2dlxYAyZvje+LoGQtsZstNSoq9KvBx2R+Gzi9WR6xUxibF5Vce3SVEmfAsYSGC2SSYgxNxdap7JYjifwoP/SIcrcmmnecRSxPOk1DP+QzK+JFUgCX8MmJyystRm0peCWQvLXKRfoE43zDgoSSwDcB1KYbp1BlledSWMnaqE4P/1V6PxJQFVP9KP0tMkS1XwRABLbf3TUt2MAyfwAEkL45UqETihhUaMVDpRyBvWbKM2PrPAXGbNVkgU25AzpBwCWCGK2/hmm2LLhwU36wwiSu5eO2De4u1EXsVTBvFA23jhK1AdzZEOiVlqobX8L6IA6UZ+vgeEUWKC7UjgKQ5ji2jQIHugI6RYQw3pOxOLccC9ZNv6mnosMlVbEKJ6wTGJRfMvL/2TuSD6pFlhZ++gqj15AbM/JEP56lvCbJ6YtkUrtxopujr4cvOnBTKvm2enpymcW/aZcuZBgAAAAIR2mzbIchwjtvo0xqY2qjc1vqnTTruHWfjNZNu21TmAcl29LAOInWdFw/tW58VL1bMqTiuKFf+f15MzbtxSYDQCdxpTIoGCFiDNF3Vv/kpOCp2S0AAJkj9XfYloxpvdzrUSRNJfyCQ1+alNIjNjgm8RxcYSn//SjLRT+zckdL5fVy7O++BP+Xf5Ahaf9sQ4lZvLZnn/4C/y+td/bQ8YNHrf0MMXGBZiDqkojp9cm3oQhDUG6UHPqYfU3lxjmYZrGN1Ky+C205CKRIO9Tox3LX62W/YmDt6UUFRdqC+hUtN2880bvy0GFqrSe9LU4WkxIZNEsMdJm4k3VIesVf1OpppvZBdlkQcLfjTnANFiR46MZ0dkcak7FCXn0BwpmAlVLFqJchwsQMeXYqvKFQ+U12gXXleUmhub4fWFMXv9vqpbl9Y9MTpJ/hzroSRIzTtDI1CdG9+AxczsMwIblo9eZpf7VfXBO8dPMCsoB2rv6hVwGCzMG6vcTODgEYP/DrzMJtjyDY7IAM7Bib0OsIAFAQc2kCBoinkZJKgc2FI5RK45wWEgE7l0VSP+1p3OzgA7sMdSWe5cDVKLjqwp1/BM9CQRgmq49XUNW84xRyGbovx62viCqI+2s6miLfXLL7Y1UQsNng0Q6rGs/4pT+zmD2YbStjLHk21r2u1XaA9bk9LpYM1fQgQxTWvAu0GjDCIgbpyRWPIr5Spg2jtADv+h10y7qtjD/Iz2vPJWrhKA6VaVP7DHUuoHYjq70XMwltAF+053AkK6byTQXcgb7mt2XnTk/eesPra2gLM8Op2TYZmfTclrH8G3g/pqn55sTtkd1LPHt9GxM1fBS/e/Ji5LTXK9GHK/KwAX5DFpynlPuAAWaCRORTQo3Md42oFal+xyhelbZ67Z363FdkSIYDMPq4iq2rRXjY+1tbES7ez6U5grWLhqhXpIh42tZ41bDzyMkV+91u89RWhbQoV8WMuv3W4Bu+sZqdiPLhzK/+jNRJmOdG1xM22/4IS99wYWYAWrMbfIxHW7k2g6qqmbQQQlpy2aF2M+QcldG2wHxDL0WY9yOdu3UYMTovaEwhSJJx28puVPjESgm3dHDa6NQGvr6xF4TDlxbFF9JFdWiOS/Q1dK+ogy30XN3Jax/GRyF+ExAk6hcPY2Tc4WW/oOk2Svq7bvI5ARfhfjiit1eMX0J7q3++wl3446YtZ63anpnnQGZSt6mc4qKCTLWvOh8NPrIpRF+7L1enfvPfkU7BhK9/xfT9nM5ScM3l/Xk0X/9fKw1tubw3tyMOsRPQnZIvibaK+8QZwj8FhRfjTjxbu/7NyGQEch5s0ckxfyucIDSaCOgbrzvne9KO9iX058CcxqDgz0H/MGrNRRrzRiuN5QPIpqBS+ddfjuy9MIQyJsdcouTnrXNtKlKpbGaUL9Od5Nr3GNwU5rxpkImisbTiFU9BNxTr20jKeOzdkfcr/tRZg675AE2KuIsFqcPO2ns/8cNkxnlUSya9/sOcDdz3TGgGJexZhrf+f2OrKvMmaay+L8nEoxDI/UKHpU7+q78dTo/8hkxE5zWyFnDWEw38+ZxcxB37Drc3LXPFQ1TDUxdxBVK0/2hIva01xhTyO/nSkRZvzkEr2hlrE5RYbThIAAAAAAAAAAAA==';
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
    className: "flex items-center px-4 py-2 hover:bg-yellow-50 cursor-pointer border-b",
    onClick: handleSelectAll
  }, React.createElement("div", {
    className: `w-5 h-5 rounded border-2 mr-3 flex items-center justify-center flex-shrink-0 transition-colors ${selected.length === options.length ? 'bg-red-500 border-red-500' : 'border-gray-300 bg-white'}`
  }, selected.length === options.length && React.createElement("svg", {viewBox:"0 0 10 8", width:"12", height:"12", fill:"none"}, React.createElement("path", {d:"M1 4l3 3 5-6", stroke:"white", strokeWidth:"1.8", strokeLinecap:"round", strokeLinejoin:"round"}))), React.createElement("span", {
    className: "font-semibold text-gray-800"
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
    }, React.createElement("div", {
      className: `w-5 h-5 rounded border-2 mr-3 flex items-center justify-center flex-shrink-0 transition-all duration-150 ${selected.includes(value) ? 'bg-red-500 border-red-500' : 'border-gray-300 bg-white group-hover:border-red-300'}`
    }, selected.includes(value) && React.createElement("svg", {viewBox:"0 0 10 8", width:"12", height:"12", fill:"none"}, React.createElement("path", {d:"M1 4l3 3 5-6", stroke:"white", strokeWidth:"1.8", strokeLinecap:"round", strokeLinejoin:"round"}))), React.createElement("span", {className: "text-gray-700 text-sm"}, labelText)), React.createElement("button", {
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
          fps: 15,
          qrbox: {
            width: 320,
            height: 180
          },
          aspectRatio: 1.777778,
          formatsToSupport: [Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.EAN_8, Html5QrcodeSupportedFormats.UPC_A, Html5QrcodeSupportedFormats.UPC_E, Html5QrcodeSupportedFormats.CODE_128, Html5QrcodeSupportedFormats.CODE_39, Html5QrcodeSupportedFormats.CODE_93, Html5QrcodeSupportedFormats.ITF, Html5QrcodeSupportedFormats.QR_CODE]
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
  // Timeout wrapper — critical for teachers on 2G/weak signal (30-40km from cities)
  const fetchWithTimeout = (url, ms = 6000) => Promise.race([
    fetch(url),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Network timeout')), ms))
  ]);
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
      const response = await fetchWithTimeout(`https://openlibrary.org/api/books?bibkeys=ISBN:${cleanISBN}&jscmd=data&format=json`);
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
      const googleResponse = await fetchWithTimeout(`https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanISBN}`);
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
          const response = await fetchWithTimeout(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn10}&jscmd=data&format=json`);
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
const CHROMEBOOK_MODELS_DB = {
  '82XJ002LHA': { title: 'Lenovo IdeaPad Slim 3 Chromebook 14 (14M868)', model: 'IdeaPad Slim 3 Chrome 14M868', brand: 'Lenovo' },
  '82XJ001LIN': { title: 'Lenovo IdeaPad Slim 3 Chromebook 14 (14M868)', model: 'IdeaPad Slim 3 Chrome 14M868', brand: 'Lenovo' },
  '82W20001IN': { title: 'Lenovo 100e Chromebook Gen 3', model: '100e Chromebook Gen 3', brand: 'Lenovo' },
  '82W2001QIN': { title: 'Lenovo 100e Chromebook Gen 3', model: '100e Chromebook Gen 3', brand: 'Lenovo' },
  '82BA0001IN': { title: 'Lenovo IdeaPad Flex 3 Chromebook 11', model: 'IdeaPad Flex 3 Chromebook', brand: 'Lenovo' },
  '6ZR36PA': { title: 'HP Chromebook 11 G8 EE', model: 'Chromebook 11 G8 EE', brand: 'HP' },
  '3V2W3PA': { title: 'HP Chromebook 11A G8 EE', model: 'Chromebook 11A G8 EE', brand: 'HP' },
  'NX.ATQSI.002': { title: 'Acer Chromebook 314', model: 'Chromebook 314', brand: 'Acer' },
};
async function lookupChromebook(barcode) {
  const fetchWithTimeout = (url, ms = 8000) => Promise.race([fetch(url), new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);
  if (CHROMEBOOK_MODELS_DB[barcode]) {
    const cb = CHROMEBOOK_MODELS_DB[barcode];
    return { found: true, suggestedAssetType: 'chromebook', title: cb.title, model: cb.model, brand: cb.brand, serialNumber: '', source: 'Local DB' };
  }
  if (/^\d{12,13}$/.test(barcode)) {
    try {
      const upc = barcode.replace(/^0+/, '');
      const response = await fetchWithTimeout(`https://api.upcitemdb.com/prod/trial/lookup?upc=${upc}`);
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        const item = data.items[0];
        return { found: true, suggestedAssetType: 'chromebook', title: item.title || item.description || '', model: item.model || '', brand: item.brand || '', serialNumber: '', source: 'UPC Database' };
      }
    } catch (e) {
      console.log('[Chromebook] UPC lookup failed:', e.message);
    }
  }
  return { found: false, suggestedAssetType: 'chromebook', title: '', model: '', serialNumber: barcode, source: 'manual' };
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
    if (lookupResult && lookupResult.found && lookupResult.suggestedAssetType === 'chromebook') {
      setAssetType('chromebook');
      setTitle(lookupResult.title || '');
      setModel(lookupResult.model || '');
      if (lookupResult.serialNumber) setSerialNumber(lookupResult.serialNumber);
    } else if (lookupResult && lookupResult.found) {
      setTitle(lookupResult.title || '');
      setAuthor(lookupResult.author || '');
      setPublisher(lookupResult.publisher || '');
      setAssetType('book');
      if (lookupResult.copyNumber) setCopyNumber(lookupResult.copyNumber);
    } else if (lookupResult && lookupResult.suggestedAssetType === 'chromebook') {
      setAssetType('chromebook');
      if (lookupResult.serialNumber) setSerialNumber(lookupResult.serialNumber);
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
  }, "\uD83D\uDD04"), React.createElement("p", null, "Looking up details...")) : React.createElement("form", {
    onSubmit: handleSubmit,
    className: "space-y-4"
  }, !isManualAdd && React.createElement("div", {
    className: `p-3 rounded-lg ${isAdditionalCopy ? 'bg-blue-50 border-2 border-blue-200' : lookupResult?.found ? 'bg-green-50' : 'bg-gray-100'}`
  }, React.createElement("p", {
    className: "text-sm text-gray-600"
  }, lookupResult?.suggestedAssetType === 'chromebook' ? 'Scanned: ' : 'ISBN/Barcode: ', React.createElement("strong", null, barcode)), isAdditionalCopy && React.createElement("p", {
    className: "text-sm text-blue-600 mt-1 font-semibold"
  }, "\uD83D\uDCDA Adding Copy #", copyNumber, " of this book"), lookupResult?.found && !isAdditionalCopy && React.createElement("p", {
    className: "text-sm text-green-600 mt-1 font-semibold"
  }, lookupResult.suggestedAssetType === 'chromebook' ? `\u2705 ${lookupResult.source} \u2014 details filled automatically!` : '\u2705 Details found automatically!'), lookupResult && !lookupResult.found && !isAdditionalCopy && React.createElement("div", {
    className: `text-sm mt-1 ${lookupResult.suggestedAssetType === 'chromebook' ? 'text-blue-600' : 'text-orange-600'}`
  }, React.createElement("p", {
    className: "font-semibold"
  }, lookupResult.suggestedAssetType === 'chromebook' ? '\uD83D\uDCBB Serial pre-filled. Enter model name below.' : '\uD83D\uDCDA Book not found in database.'), React.createElement("p", {
    className: "text-xs mt-1"
  }, lookupResult.suggestedAssetType === 'chromebook' ? 'Tip: scan the long EAN number (e.g. 0197532701212) or model code (e.g. 82XJ002LHA) for auto-fill.' : 'Please enter details manually. For multiple copies of same book, add one copy first then use the \"\uD83D\uDCCB Copy\" button.'))), React.createElement("div", null, React.createElement("label", {
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
        setShowAddModal(true);
        const result = await lookupISBN(barcode);
        setBookLookupResult({
          ...result,
          copyNumber: 1
        });
        setLookingUp(false);
      } else {
        setLookingUp(true);
        setShowAddModal(true);
        const cbResult = await lookupChromebook(barcode);
        setBookLookupResult({ ...cbResult, isbn: barcode, copyNumber: 1 });
        setLookingUp(false);
      }
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
      // Trigger SmartSync refresh instead of page reload
      if (window.SmartSyncManager) {
        window.SmartSyncManager.forceRefresh?.('all');
        window.dispatchEvent(new CustomEvent('smartsync:refresh', {detail: {type: 'all'}}));
      }
      setTimeout(() => {
        window._forceRefresh = false;
        setIsRefreshing(false);
      }, 3000);
    } catch (e) {
      console.error('Refresh failed:', e);
      setIsRefreshing(false);
    }
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
    if (connectionQuality === 'slow') return 'bg-yellow-500';
    if (connectionQuality === 'very-slow') return 'bg-orange-500';
    return 'bg-green-500';
  };
  return React.createElement("div", {
    className: "fixed bottom-20 right-4 z-30",
    style: {display: "block"}
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
    const userEmail = currentUser.email || '';
    PresenceSystem.init(userId, userName, userEmail);
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
function MaintenanceScreen({ onAdminLogin }) {
  return React.createElement('div', {
    style: { minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)',color:'white',textAlign:'center',padding:'24px',fontFamily:'inherit' }
  },
    React.createElement('style', null, `
      @keyframes maintFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-18px)}}
      @keyframes maintPulse{0%,100%{opacity:.4;transform:scale(1)}50%{opacity:.9;transform:scale(1.08)}}
      @keyframes maintSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      @keyframes maintFadeIn{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
      .maint-gear{display:inline-block;animation:maintSpin 4s linear infinite}
      .maint-gear2{display:inline-block;animation:maintSpin 3s linear infinite reverse}
      .maint-icon{animation:maintFloat 3s ease-in-out infinite}
      .maint-card{animation:maintFadeIn .8s ease-out both}
      .maint-dot{width:10px;height:10px;border-radius:50%;background:#F4B41A;display:inline-block;margin:0 4px;animation:maintPulse 1.4s ease-in-out infinite}
      .maint-dot:nth-child(2){animation-delay:.2s}.maint-dot:nth-child(3){animation-delay:.4s}
    `),
    React.createElement('div',{className:'maint-card',style:{maxWidth:'480px',width:'100%'}},
      React.createElement('div',{className:'maint-icon',style:{fontSize:'72px',marginBottom:'16px'}},'🔧'),
      React.createElement('div',{style:{display:'flex',justifyContent:'center',gap:'8px',marginBottom:'24px'}},
        React.createElement('span',{className:'maint-gear',style:{fontSize:'28px'}},'⚙️'),
        React.createElement('span',{className:'maint-gear2',style:{fontSize:'22px',marginTop:'6px'}},'⚙️'),
        React.createElement('span',{className:'maint-gear',style:{fontSize:'20px',marginTop:'12px'}},'⚙️')),
      React.createElement('h1',{style:{fontSize:'36px',fontWeight:800,marginBottom:'12px',letterSpacing:'-0.5px'}},'Under Maintenance'),
      React.createElement('p',{style:{fontSize:'18px',color:'rgba(255,255,255,0.75)',marginBottom:'32px',lineHeight:1.6}},"We'll be back soon! Our team is working hard to improve your experience."),
      React.createElement('div',{style:{display:'flex',justifyContent:'center',marginBottom:'40px'}},
        React.createElement('span',{className:'maint-dot'}),
        React.createElement('span',{className:'maint-dot'}),
        React.createElement('span',{className:'maint-dot'})),
      React.createElement('div',{style:{background:'rgba(255,255,255,0.08)',borderRadius:'16px',padding:'20px 24px',border:'1px solid rgba(255,255,255,0.15)',marginBottom:'24px'}},
        React.createElement('p',{style:{fontSize:'14px',color:'rgba(255,255,255,0.6)',margin:0}},'🏫 Avanti Fellows Curriculum Tracker')),
      React.createElement('button',{onClick:onAdminLogin,style:{background:'transparent',border:'1px solid rgba(255,255,255,0.2)',color:'rgba(255,255,255,0.4)',fontSize:'12px',padding:'8px 16px',borderRadius:'8px',cursor:'pointer'}},'Admin Login'))
  );
}
function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceModeLoaded, setMaintenanceModeLoaded] = useState(false);
  const [showAdminLoginFromMaintenance, setShowAdminLoginFromMaintenance] = useState(false);
  const maintenanceModeRef = React.useRef(false);
  const maintenanceModeLoadedRef = React.useRef(false);
  const [managerProfile, setManagerProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('directory');
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
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
    const unsub = db.collection('app_settings').doc('global').onSnapshot(doc => {
      const mode = doc.exists ? !!doc.data().maintenanceMode : false;
      setMaintenanceMode(mode);
      maintenanceModeRef.current = mode;
      setMaintenanceModeLoaded(true);
      maintenanceModeLoadedRef.current = true;
    }, () => {
      setMaintenanceModeLoaded(true);
      maintenanceModeLoadedRef.current = true;
    });
    return () => unsub();
  }, []);
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (user) {
        if (user.isAnonymous) {
          // Student login has been removed; anonymous auth is no longer used by this app.
          console.log('Anonymous auth session found - signing out (student login removed)');
          await auth.signOut();
          setLoading(false);
          return;
        }
        // Maintenance mode check: block all non-super-admin logins when maintenance is on
        if (user.email !== 'admin@avantifellows.org') {
          let inMaintenance = maintenanceModeRef.current;
          if (!maintenanceModeLoadedRef.current) {
            // Firestore snapshot hasn't fired yet — fetch directly to avoid race condition
            try {
              const settingsDoc = await db.collection('app_settings').doc('global').get();
              inMaintenance = settingsDoc.exists && !!settingsDoc.data().maintenanceMode;
              setMaintenanceMode(inMaintenance);
              maintenanceModeRef.current = inMaintenance;
              setMaintenanceModeLoaded(true);
              maintenanceModeLoadedRef.current = true;
            } catch (e) {
              inMaintenance = false;
            }
          }
          if (inMaintenance) {
            console.log('\uD83D\uDD12 Maintenance mode active — blocking login for:', user.email);
            await auth.signOut();
            setShowAdminLoginFromMaintenance(false);
            setLoading(false);
            setAuthLoading(false);
            setLoginProgress('');
            return;
          }
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
                setActiveTab('teachers');
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
                  setActiveTab('directory');
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
        setCurrentUser(null);
        setIsAdmin(false);
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
    if (!currentUser) return;
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
        // ✅ FIX: Never downgrade - only update if new data is richer
        // Prevents TeacherOverview showing 0% when background sync runs with partial data
        if (Object.keys(progressMap).length > 0) {
          setChapterProgress(prev => {
            const prevCount = Object.keys(prev || {}).length;
            const newCount = Object.keys(progressMap).length;
            return newCount >= prevCount ? { ...(prev || {}), ...progressMap } : prev;
          });
        }
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
        SCHOOLS = [...APPROVED_SCHOOLS];
        ALL_SCHOOLS_COUNT = APPROVED_SCHOOLS.length;
        cacheSchools(APPROVED_SCHOOLS);
        console.log('📊 [Schools] Using approved schools list:', APPROVED_SCHOOLS.join(', '));
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
      setActiveTab('directory');
      setLoginForm({
        email: '',
        password: ''
      });
      console.log('✅ Logout successful');
    } catch (e) {
      console.error('logout error', e);
      try {
        setCurrentUser(null);
        setIsAdmin(false);
        setActiveTab('directory');
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
      setActiveTab('teachers');
    } else if (user.userType === 'teacher') {
      setCurrentUser(user);
      setIsAdmin(false);
      setActiveTab('directory');
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
      setActiveTab('directory');
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
  if (maintenanceModeLoaded && maintenanceMode && !isSuperAdmin && !showAdminLoginFromMaintenance) {
    return React.createElement(MaintenanceScreen, { onAdminLogin: () => setShowAdminLoginFromMaintenance(true) });
  }
  if (loading || !maintenanceModeLoaded) {
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
    // ── Inject login page CSS animations ──────────────────────────────────
    var loginStyleId = 'login-anim-css';
    if (!document.getElementById(loginStyleId)) {
      var s = document.createElement('style');
      s.id = loginStyleId;
      s.textContent = `
        @keyframes loginBlobFloat {
          0%   { transform: translate(0,0) scale(1); }
          33%  { transform: translate(30px,-40px) scale(1.05); }
          66%  { transform: translate(-20px,20px) scale(0.95); }
          100% { transform: translate(0,0) scale(1); }
        }
        @keyframes loginTwinkle { from{opacity:.6} to{opacity:1} }
        @keyframes loginFloatUp {
          0%   { transform:translateY(110vh) rotate(0deg); opacity:0; }
          5%   { opacity:.13; }
          95%  { opacity:.13; }
          100% { transform:translateY(-15vh) rotate(360deg); opacity:0; }
        }
        @keyframes loginCardIn {
          from { opacity:0; transform:translateY(28px) scale(.96); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes loginFadeQuote { 0%,100%{opacity:.4} 50%{opacity:.75} }
        .lp-blob {
          position:absolute; border-radius:50%;
          filter:blur(80px); opacity:.18;
          animation:loginBlobFloat linear infinite;
        }
        .lp-stars {
          position:absolute; inset:0;
          background-image:
            radial-gradient(1px 1px at 10% 15%,rgba(255,255,255,.6) 0%,transparent 100%),
            radial-gradient(1px 1px at 25% 60%,rgba(255,255,255,.4) 0%,transparent 100%),
            radial-gradient(1.5px 1.5px at 50% 20%,rgba(255,255,255,.7) 0%,transparent 100%),
            radial-gradient(1px 1px at 70% 80%,rgba(255,255,255,.5) 0%,transparent 100%),
            radial-gradient(1px 1px at 85% 40%,rgba(255,255,255,.6) 0%,transparent 100%),
            radial-gradient(1px 1px at 38% 85%,rgba(255,255,255,.3) 0%,transparent 100%),
            radial-gradient(1.5px 1.5px at 62% 50%,rgba(255,255,255,.5) 0%,transparent 100%),
            radial-gradient(1px 1px at 90% 10%,rgba(255,255,255,.7) 0%,transparent 100%),
            radial-gradient(1px 1px at 15% 90%,rgba(255,255,255,.4) 0%,transparent 100%),
            radial-gradient(1px 1px at 45% 45%,rgba(255,255,255,.3) 0%,transparent 100%);
          animation:loginTwinkle 4s ease-in-out infinite alternate;
        }
        .lp-floater {
          position:absolute; font-size:28px; opacity:.12;
          animation:loginFloatUp linear infinite;
          user-select:none; pointer-events:none;
        }
        .lp-card { animation:loginCardIn .7s cubic-bezier(.34,1.56,.64,1) forwards; }
        .lp-input:focus {
          border-color:#F4B41A !important;
          background:white !important;
          box-shadow:0 0 0 4px rgba(244,180,26,.12) !important;
          outline:none;
        }
        .lp-signin:hover { transform:translateY(-2px); box-shadow:0 12px 32px rgba(244,180,26,.45) !important; }
        .lp-signin:active { transform:translateY(0); }
        .lp-student:hover { border-color:#F4B41A !important; background:#fffbef !important; }
        .lp-quote { animation:loginFadeQuote 6s ease-in-out infinite; }
        @media(max-width:900px){ .lp-left{ display:none!important; } .lp-right{ width:100%!important; max-width:420px!important; } }
      `;
      document.head.appendChild(s);
    }

    const floaterIcons = ['\uD83D\uDCDA','\u270F\uFE0F','\uD83C\uDF93','\uD83D\uDCCF','\uD83D\uDD2C','\uD83D\uDCCA','\uD83C\uDFEB','\uD83D\uDCA1','\uD83D\uDCDD'];
    const floaterStyles = [
      {left:'5%', animationDuration:'14s', animationDelay:'0s', fontSize:'24px'},
      {left:'15%', animationDuration:'17s', animationDelay:'-4s', fontSize:'32px'},
      {left:'28%', animationDuration:'12s', animationDelay:'-8s', fontSize:'20px'},
      {left:'42%', animationDuration:'19s', animationDelay:'-2s', fontSize:'28px'},
      {left:'55%', animationDuration:'15s', animationDelay:'-6s', fontSize:'22px'},
      {left:'68%', animationDuration:'16s', animationDelay:'-10s', fontSize:'30px'},
      {left:'78%', animationDuration:'13s', animationDelay:'-3s', fontSize:'26px'},
      {left:'88%', animationDuration:'18s', animationDelay:'-7s', fontSize:'24px'},
      {left:'92%', animationDuration:'11s', animationDelay:'-1s', fontSize:'18px'},
    ];

    return React.createElement('div', {
      style:{minHeight:'100vh', display:'flex', fontFamily:'Nunito, system-ui, sans-serif', position:'relative', overflow:'hidden', background:'#12122a'}
    },
      // ── Animated background ──────────────────────────────────────────────
      React.createElement('div', {
        style:{position:'fixed', inset:0, background:'linear-gradient(135deg,#0f0f23 0%,#1a1a38 40%,#0d1117 100%)', overflow:'hidden', zIndex:0}
      },
        React.createElement('div', {className:'lp-blob', style:{width:'500px',height:'500px',background:'#F4B41A',top:'-100px',left:'-100px',animationDuration:'18s'}}),
        React.createElement('div', {className:'lp-blob', style:{width:'400px',height:'400px',background:'#E8B039',bottom:'-80px',right:'-80px',animationDuration:'22s',animationDelay:'-8s'}}),
        React.createElement('div', {className:'lp-blob', style:{width:'300px',height:'300px',background:'#ff6b35',top:'50%',left:'40%',animationDuration:'15s',animationDelay:'-5s'}}),
        React.createElement('div', {className:'lp-stars'}),
        React.createElement('div', {style:{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(244,180,26,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(244,180,26,.03) 1px,transparent 1px)',backgroundSize:'50px 50px'}}),
        React.createElement('div', {style:{position:'absolute',inset:0,pointerEvents:'none'}},
          floaterIcons.map((icon, i) =>
            React.createElement('div', {key:i, className:'lp-floater', style:floaterStyles[i]}, icon)
          )
        )
      ),

      // ── Left panel ───────────────────────────────────────────────────────
      React.createElement('div', {
        className:'lp-left',
        style:{flex:1, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'flex-start', padding:'60px 50px', position:'relative', zIndex:2}
      },
        // Brand logo
        React.createElement('div', {style:{display:'flex', alignItems:'center', gap:'14px', marginBottom:'48px'}},
          React.createElement('div', {style:{width:'52px',height:'52px',background:'linear-gradient(135deg,#F4B41A,#E8B039)',borderRadius:'14px',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 24px rgba(244,180,26,.35)',flexShrink:0}},
            React.createElement('img', {src:AVANTI_LOGO, alt:'Avanti Fellows', style:{width:'34px',height:'34px',objectFit:'contain'}})
          ),
          React.createElement('div', null,
            React.createElement('div', {style:{fontFamily:'system-ui,sans-serif',fontSize:'22px',fontWeight:'800',color:'white',lineHeight:'1.1'}}, 'Avanti Fellows'),
            React.createElement('div', {style:{color:'rgba(255,255,255,.5)',fontSize:'12px',fontWeight:'600',letterSpacing:'1.5px',textTransform:'uppercase'}}, 'JNV Curriculum Tracker')
          )
        ),
        // Tagline
        React.createElement('h1', {style:{fontSize:'clamp(30px,3.8vw,44px)',fontWeight:'800',color:'white',lineHeight:'1.2',marginBottom:'14px'}},
          'Every Lesson ',
          React.createElement('span', {style:{background:'linear-gradient(90deg,#F4B41A,#E8B039)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}, 'Counts,'),
          React.createElement('br', null),
          'Every Student ',
          React.createElement('span', {style:{background:'linear-gradient(90deg,#F4B41A,#E8B039)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}, 'Matters.')
        ),
        // Subtitle
        React.createElement('p', {style:{fontSize:'15px',color:'rgba(255,255,255,.45)',fontStyle:'italic',lineHeight:'1.6',marginBottom:'32px',letterSpacing:'0.2px'}},
          'Centers the human element of teaching and learning.'
        ),
        // Quote
        React.createElement('div', {style:{marginTop:'auto',paddingTop:'32px',borderTop:'1px solid rgba(255,255,255,.08)',maxWidth:'420px'}},
          React.createElement('p', {className:'lp-quote', style:{fontSize:'14px',color:'rgba(255,255,255,.45)',fontStyle:'italic',lineHeight:'1.7'}},
            '\u201cEducation is the most powerful weapon which you can use to change the world.\u201d \u2014 Nelson Mandela'
          )
        )
      ),

      // ── Right panel ──────────────────────────────────────────────────────
      React.createElement('div', {
        className:'lp-right',
        style:{width:'440px',display:'flex',alignItems:'center',justifyContent:'center',padding:'40px',position:'relative',zIndex:2}
      },
        React.createElement('div', {
          className:'lp-card',
          style:{background:'rgba(255,255,255,.97)',borderRadius:'28px',padding:'44px 40px',width:'100%',boxShadow:'0 32px 80px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.1)'}
        },
          // Card header
          React.createElement('div', {style:{textAlign:'center',marginBottom:'28px'}},
            React.createElement('div', {style:{width:'64px',height:'64px',margin:'0 auto 16px',background:'linear-gradient(135deg,#fff8e6,#fff0c0)',borderRadius:'20px',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'32px',boxShadow:'0 8px 20px rgba(244,180,26,.2)'}},
              '\uD83D\uDD10'
            ),
            React.createElement('div', {style:{fontSize:'26px',fontWeight:'800',color:'#1a1a2e'}}, 'Welcome Back!'),
            React.createElement('div', {style:{fontSize:'13px',color:'#888',marginTop:'4px'}}, 'Sign in to your Avanti account')
          ),

          // ── Teacher fields ─────────────────────────────────────
          React.createElement(React.Fragment, null,
            // Email
            React.createElement('div', {style:{marginBottom:'18px'}},
              React.createElement('label', {style:{display:'block',fontSize:'12px',fontWeight:'700',color:'#555',letterSpacing:'.5px',textTransform:'uppercase',marginBottom:'6px'}}, 'Email Address'),
              React.createElement('div', {style:{position:'relative'}},
                React.createElement('span', {style:{position:'absolute',left:'14px',top:'50%',transform:'translateY(-50%)',fontSize:'16px',opacity:.5}}, '\u2709\uFE0F'),
                React.createElement('input', {
                  type:'email',
                  className:'lp-input',
                  style:{width:'100%',padding:'14px 14px 14px 42px',border:'2px solid #eee',borderRadius:'14px',fontSize:'15px',fontFamily:'inherit',color:'#1a1a2e',background:'#fafafa',transition:'all .2s',outline:'none',boxSizing:'border-box'},
                  value: loginForm.email,
                  onChange: e => setLoginForm({...loginForm, email:e.target.value}),
                  placeholder:'you@avantifellows.org'
                })
              )
            ),
            // Password
            React.createElement('div', {style:{marginBottom:'8px'}},
              React.createElement('label', {style:{display:'block',fontSize:'12px',fontWeight:'700',color:'#555',letterSpacing:'.5px',textTransform:'uppercase',marginBottom:'6px'}}, 'Password'),
              React.createElement('div', {style:{position:'relative'}},
                React.createElement('span', {style:{position:'absolute',left:'14px',top:'50%',transform:'translateY(-50%)',fontSize:'16px',opacity:.5}}, '\uD83D\uDD12'),
                React.createElement('input', {
                  type:'password',
                  className:'lp-input',
                  style:{width:'100%',padding:'14px 14px 14px 42px',border:'2px solid #eee',borderRadius:'14px',fontSize:'15px',fontFamily:'inherit',color:'#1a1a2e',background:'#fafafa',transition:'all .2s',outline:'none',boxSizing:'border-box'},
                  value: loginForm.password,
                  onChange: e => setLoginForm({...loginForm, password:e.target.value}),
                  placeholder:'Enter your password',
                  onKeyPress: e => e.key === 'Enter' && handleLogin()
                })
              )
            )
          ),

          // Sign In button
          React.createElement('button', {
            className:'lp-signin',
            onClick: handleLogin,
            disabled: authLoading,
            style:{width:'100%',padding:'16px',background:'linear-gradient(135deg,#F4B41A,#E8B039)',border:'none',borderRadius:'14px',fontSize:'16px',fontWeight:'800',color:'#1a1a2e',cursor:authLoading?'not-allowed':'pointer',marginTop:'12px',boxShadow:'0 8px 24px rgba(244,180,26,.35)',transition:'transform .15s, box-shadow .15s',opacity:authLoading?.75:1}
          },
            authLoading
              ? React.createElement('span', {className:'login-spinner'},
                  React.createElement('span', {className:'login-spinner-icon'}),
                  React.createElement('span', {className:'login-progress-text'}, loginProgress || 'Please wait...')
                )
              : 'Sign In \u2192'
          ),

          // Footer
          React.createElement('div', {style:{textAlign:'center',marginTop:'24px',fontSize:'12px',color:'#bbb'}},
            'Avanti Fellows \u00B7 JNV Program \u00B7 v5.7.0'
          )
        )
      )
    );
  }

  return React.createElement(React.Fragment, null, currentUser && React.createElement(DataFreshnessIndicator, null), isAdmin ? React.createElement(AdminView, {
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
    id: 'timetable',
    label: 'Timetable',
    icon: React.createElement("i", {
      className: "fa-solid fa-calendar"
    })
  }] : [{
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
    id: 'assets',
    label: 'Asset Management',
    icon: React.createElement("i", {
      className: "fa-solid fa-boxes-stacked"
    })
  }, {
    id: 'timetable',
    label: 'Timetable',
    icon: React.createElement("i", {
      className: "fa-solid fa-calendar"
    })
  }, {
    id: 'myprofile',
    label: 'My Profile',
    icon: React.createElement("i", {
      className: "fa-solid fa-user"
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
  }), activeTab === 'timetable' && React.createElement(TimetablePage, {
    currentUser: currentUser,
    mySchool: currentUser?.school
  }), activeTab === 'assets' && React.createElement(AssetManagement, {
    currentUser: currentUser,
    students: students
  }), activeTab === 'socialwall' && React.createElement(SocialWall, {
    teachers: teachers,
    currentUser: currentUser
  }))), React.createElement("footer", {
    className: "bg-gray-800 text-white text-center py-4"
  }, React.createElement("p", null, "Made by Anand with \u2764\uFE0F")));
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
      const parentLabel = form.role === MANAGER_ROLES.PM ? 'Program Head' : 'Program Manager';
      const hasOptions = getReportsToOptions(form.role).length > 0;
      const proceed = confirm(hasOptions ? `You haven't selected who this person reports to.\n\nThey'll be added as "Unassigned" and will show up under "Unassigned Managers" until you assign a ${parentLabel} to them.\n\nContinue?` : `There's no active ${parentLabel} to assign right now.\n\n${form.name || 'This person'} will be added as "Unassigned" and can be linked to a manager later from the "Unassigned Managers" section.\n\nContinue?`);
      if (!proceed) return;
    }
    const isDirectorRole = form.role === 'director' || form.role === 'assoc_director' || form.role === 'training';
    try {
      const managerData = {
        name: form.name,
        email: form.email.toLowerCase(),
        afCode: form.afCode || null,
        role: form.role,
        reportsTo: form.role === MANAGER_ROLES.APH || isDirectorRole ? null : form.reportsTo || null,
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
  const handleDeleteManager = async manager => {
    const directReports = getDirectReportees(manager.id);
    if (directReports.length > 0) {
      alert(`⚠️ Cannot delete ${manager.name}.\n\nThey still have ${directReports.length} direct report(s):\n` + directReports.map(r => `• ${r.name}`).join('\n') + `\n\nReassign or delete those first (edit each one's "Reports To"), then try again.`);
      return;
    }
    if (!confirm(`⚠️ PERMANENT DELETE\n\nAre you sure you want to permanently delete ${manager.name}?\n\nThis action cannot be undone. They will lose access immediately.`)) return;
    try {
      await db.collection('managers').doc(manager.id).delete();
      alert('✅ Deleted permanently');
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
    }, "Reactivate"), React.createElement("button", {
      onClick: () => handleDeleteManager(manager),
      className: "px-3 py-1 bg-red-700 text-white rounded-lg font-semibold text-sm"
    }, "Delete")))), reportees.map(reportee => renderManagerCard(reportee, level + 1)));
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
  }, React.createElement("div", {
    className: "flex gap-2 flex-wrap"
  }, React.createElement("button", {
    onClick: () => openEditModal(manager),
    className: "px-3 py-1 bg-yellow-400 rounded-lg font-semibold text-sm"
  }, "Edit"), manager.status === 'active' ? React.createElement("button", {
    onClick: () => handleDeactivate(manager),
    className: "px-3 py-1 bg-red-500 text-white rounded-lg font-semibold text-sm"
  }, "Deactivate") : React.createElement("button", {
    onClick: () => handleReactivate(manager),
    className: "px-3 py-1 bg-green-500 text-white rounded-lg font-semibold text-sm"
  }, "Reactivate"), React.createElement("button", {
    onClick: () => handleDeleteManager(manager),
    className: "px-3 py-1 bg-red-700 text-white rounded-lg font-semibold text-sm"
  }, "Delete")))))))), showModal && React.createElement("div", {
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
  }, "Reports To (", form.role === MANAGER_ROLES.PM ? 'PH' : 'PM', ")"), React.createElement("select", {
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
  }, m.name, " (", ROLE_LABELS[m.role], ")"))), getReportsToOptions(form.role).length === 0 ? React.createElement("p", {
    className: "text-xs text-orange-600 mt-1 font-semibold"
  }, "⚠️ No active ", form.role === MANAGER_ROLES.PM ? 'Program Head' : 'Program Manager', " available. You can still add this person as \"Unassigned\" and link a manager later.") : React.createElement("p", {
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
function ClassView({
  grade,
  currentUser,
  curriculum,
  chapterProgress,
  updateChapterProgress
}) {
  const [expandedChapters, setExpandedChapters] = useState({});
  const [currentDate] = useState(new Date().toISOString().split('T')[0]);
  const gradeCurriculum = useMemo(() => {
    const filtered = {};
    Object.keys(curriculum).forEach(subject => {
      if (currentUser.subject === 'All' || subject === currentUser.subject) {
        const chapters = (curriculum[subject] || []).filter(ch => String(ch.grade) === String(grade) || ch.grade === `Class ${grade}`);
        if (chapters.length > 0) {
          filtered[subject] = chapters;
        }
      }
    });
    return filtered;
  }, [curriculum, grade, currentUser.subject]);
  const getChapterProgress = chapterId => {
    return chapterProgress[currentUser.school]?.[chapterId] || {};
  };
  const toggleChapter = chapterId => {
    setExpandedChapters(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };
  const getChapterStatus = chapter => {
    const progress = getChapterProgress(chapter.id);
    if (progress.completed) return 'completed';
    const today = new Date(currentDate);
    const plannedEnd = new Date(chapter.plannedEndDate);
    if (today > plannedEnd) return 'delayed';
    return 'pending';
  };
  const getStatusCounts = () => {
    let completed = 0,
      delayed = 0,
      pending = 0;
    Object.values(gradeCurriculum).forEach(chapters => {
      chapters.forEach(chapter => {
        const status = getChapterStatus(chapter);
        if (status === 'completed') completed++;else if (status === 'delayed') delayed++;else pending++;
      });
    });
    return {
      completed,
      delayed,
      pending
    };
  };
  const statusCounts = getStatusCounts();
  const totalChapters = statusCounts.completed + statusCounts.delayed + statusCounts.pending;
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("div", {
    className: "flex justify-between items-center"
  }, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "\uD83D\uDCDA Class ", grade, " Curriculum"), React.createElement("div", {
    className: "text-sm text-gray-600"
  }, "Subject: ", React.createElement("span", {
    className: "font-bold"
  }, currentUser.subject))), React.createElement("div", {
    className: "grid md:grid-cols-4 gap-4"
  }, React.createElement("div", {
    className: "stat-card bg-blue-500 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Total Chapters"), React.createElement("div", {
    className: "text-4xl font-bold"
  }, totalChapters)), React.createElement("div", {
    className: "stat-card bg-green-500 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "\u2713 Completed"), React.createElement("div", {
    className: "text-4xl font-bold"
  }, statusCounts.completed)), React.createElement("div", {
    className: "stat-card bg-orange-500 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "\u26A0 Delayed"), React.createElement("div", {
    className: "text-4xl font-bold"
  }, statusCounts.delayed)), React.createElement("div", {
    className: "stat-card bg-red-500 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "\u23F3 Pending"), React.createElement("div", {
    className: "text-4xl font-bold"
  }, statusCounts.pending))), Object.keys(gradeCurriculum).length === 0 ? React.createElement("div", {
    className: "bg-white p-12 rounded-2xl shadow-lg text-center"
  }, React.createElement("div", {
    className: "text-6xl mb-4"
  }, "\uD83D\uDCED"), React.createElement("p", {
    className: "text-xl text-gray-600"
  }, "No chapters found for Class ", grade)) : Object.keys(gradeCurriculum).map(subject => {
    const chapters = gradeCurriculum[subject];
    if (chapters.length === 0) return null;
    return React.createElement("div", {
      key: subject,
      className: "bg-white p-6 rounded-2xl shadow-lg"
    }, React.createElement("h3", {
      className: "text-2xl font-bold mb-4 text-blue-600"
    }, subject, " (", chapters.length, " chapters)"), React.createElement("div", {
      className: "space-y-4"
    }, chapters.map(chapter => {
      const progress = getChapterProgress(chapter.id);
      const status = getChapterStatus(chapter);
      const isExpanded = expandedChapters[chapter.id];
      return React.createElement("div", {
        key: chapter.id,
        className: `chapter-card ${status} border-2 rounded-xl p-4`
      }, React.createElement("div", {
        className: "flex justify-between items-start cursor-pointer gap-3",
        onClick: () => toggleChapter(chapter.id)
      }, React.createElement("div", {
        className: "flex-1 min-w-0"
      }, React.createElement("div", {
        className: "flex flex-wrap items-center gap-3 mb-2"
      }, React.createElement("h4", {
        className: "text-lg font-bold break-words"
      }, chapter.name), React.createElement("span", {
        className: `status-badge status-${status} flex-shrink-0`
      }, status === 'completed' ? '✓ Done' : status === 'delayed' ? '⚠ Delayed' : '⏳ Pending')), React.createElement("div", {
        className: "text-sm text-gray-600 space-y-1"
      }, React.createElement("div", null, React.createElement("strong", null, "Duration:"), " ", chapter.duration, " days"), React.createElement("div", null, React.createElement("strong", null, "Planned:"), " ", chapter.plannedStartDate, " \u2192 ", chapter.plannedEndDate), progress.actualStartDate && React.createElement("div", null, React.createElement("strong", null, "Actual Start:"), " ", progress.actualStartDate), progress.completed && progress.actualEndDate && React.createElement("div", null, React.createElement("strong", null, "Actual End:"), " ", progress.actualEndDate))), React.createElement("button", {
        className: "text-2xl flex-shrink-0"
      }, isExpanded ? '▲' : '▼')), isExpanded && React.createElement("div", {
        className: "mt-4 pt-4 border-t-2 chapter-details"
      }, React.createElement("div", {
        className: "grid md:grid-cols-2 gap-4 mb-4"
      }, React.createElement("div", null, React.createElement("label", {
        className: "block text-sm font-semibold mb-2"
      }, "Actual Start Date"), React.createElement("input", {
        type: "date",
        value: progress.actualStartDate || '',
        onChange: e => {
          updateChapterProgress(chapter.id, {
            ...progress,
            actualStartDate: e.target.value
          });
        },
        className: "w-full px-3 py-2 border-2 rounded-lg"
      })), React.createElement("div", null, React.createElement("label", {
        className: "block text-sm font-semibold mb-2"
      }, "Actual End Date"), React.createElement("input", {
        type: "date",
        value: progress.actualEndDate || '',
        onChange: e => {
          updateChapterProgress(chapter.id, {
            ...progress,
            actualEndDate: e.target.value
          });
        },
        className: "w-full px-3 py-2 border-2 rounded-lg"
      }))), React.createElement("label", {
        className: "flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer"
      }, React.createElement("input", {
        type: "checkbox",
        checked: progress.completed || false,
        onChange: e => {
          updateChapterProgress(chapter.id, {
            ...progress,
            completed: e.target.checked,
            actualEndDate: e.target.checked && !progress.actualEndDate ? currentDate : progress.actualEndDate
          });
        }
      }), React.createElement("span", {
        className: "font-semibold"
      }, "Mark as Completed")), React.createElement("div", {
        className: "mt-4"
      }, React.createElement("label", {
        className: "block text-sm font-semibold mb-2"
      }, "Notes / Remarks"), React.createElement("textarea", {
        value: progress.notes || '',
        onChange: e => {
          updateChapterProgress(chapter.id, {
            ...progress,
            notes: e.target.value
          });
        },
        className: "w-full px-3 py-2 border-2 rounded-lg",
        rows: "3",
        placeholder: "Add any notes about this chapter..."
      }))));
    })));
  }));
}
function BirthdaysPage({
  teachers
}) {
  const todayBirthdays = useMemo(() => getBirthdays(teachers, 'today'), [teachers]);
  const weekBirthdays = useMemo(() => getBirthdays(teachers, 'week'), [teachers]);
  const monthBirthdays = useMemo(() => getBirthdays(teachers, 'month'), [teachers]);
  const todayAnniversaries = useMemo(() => getAnniversaries(teachers, 'today'), [teachers]);
  const weekAnniversaries = useMemo(() => getAnniversaries(teachers, 'week'), [teachers]);
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "\uD83C\uDF89 Celebrations"), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-6"
  }, React.createElement(React.Fragment, null, todayBirthdays.length > 0 && React.createElement("div", {
    className: "birthday-card p-6 rounded-2xl"
  }, React.createElement("h3", {
    className: "text-2xl font-bold text-white mb-4"
  }, "\uD83C\uDF82 Today's Birthdays"), todayBirthdays.map(t => React.createElement("div", {
    key: t.id,
    className: "bg-white p-4 rounded-lg mb-2"
  }, React.createElement("div", {
    className: "font-bold text-lg"
  }, t.name), React.createElement("div", {
    className: "text-sm text-gray-600"
  }, t.school)))), todayAnniversaries.length > 0 && React.createElement("div", {
    className: "birthday-card p-6 rounded-2xl"
  }, React.createElement("h3", {
    className: "text-2xl font-bold text-white mb-4"
  }, "\uD83C\uDF89 Today's Anniversaries"), todayAnniversaries.map(t => {
    const years = new Date().getFullYear() - new Date(t.joiningDate).getFullYear();
    return React.createElement("div", {
      key: t.id,
      className: "bg-white p-4 rounded-lg mb-2"
    }, React.createElement("div", {
      className: "font-bold text-lg"
    }, t.name), React.createElement("div", {
      className: "text-sm text-gray-600"
    }, years, " Years at Avanti"));
  })))), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-6"
  }, React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "This Week's Birthdays"), weekBirthdays.length === 0 ? React.createElement("p", {
    className: "text-gray-500"
  }, "No birthdays this week") : React.createElement("div", {
    className: "space-y-2"
  }, weekBirthdays.map(t => React.createElement("div", {
    key: t.id,
    className: "p-3 bg-gray-50 rounded-lg"
  }, React.createElement("div", {
    className: "font-semibold"
  }, t.name), React.createElement("div", {
    className: "text-sm text-gray-600"
  }, new Date(t.dob).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  })))))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "This Month's Birthdays"), monthBirthdays.length === 0 ? React.createElement("p", {
    className: "text-gray-500"
  }, "No birthdays this month") : React.createElement("div", {
    className: "space-y-2 max-h-96 overflow-y-auto"
  }, monthBirthdays.map(t => React.createElement("div", {
    key: t.id,
    className: "p-3 bg-gray-50 rounded-lg"
  }, React.createElement("div", {
    className: "font-semibold"
  }, t.name), React.createElement("div", {
    className: "text-sm text-gray-600"
  }, new Date(t.dob).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  }))))))));
}
function TeacherManagement({
  teachers,
  teacherAttendance,
  leaveAdjustments,
  setLeaveAdjustments,
  isSuperAdmin = false
}) {
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [selectedTeacherLeave, setSelectedTeacherLeave] = useState(null);
  const [isEditingLeave, setIsEditingLeave] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    entitled: 0,
    maternity: 0,
    paternity: 0
  });
  const [savingLeave, setSavingLeave] = useState(false);
  const [form, setForm] = useState({
    name: '',
    afid: '',
    afCode: '',
    email: '',
    password: '',
    dob: '',
    joiningDate: '',
    subject: '',
    school: '',
    phone: '',
    role: 'teacher'
  });
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [teacherToArchive, setTeacherToArchive] = useState(null);
  const [archiveReason, setArchiveReason] = useState('');
  const [archiveNotes, setArchiveNotes] = useState('');
  const [archiving, setArchiving] = useState(false);
  const [showArchivedTeachers, setShowArchivedTeachers] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const bulkFileInputRef = useRef(null);
  const handleBulkCSVImport = e => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      complete: async results => {
        try {
          setIsImporting(true);
          setImportResults(null);
          const rows = results.data;
          if (rows.length < 2) {
            alert('CSV file is empty or has no data rows');
            setIsImporting(false);
            return;
          }
          const teachersToAdd = [];
          const errors = [];
          const firebaseAuthList = [];
          rows.forEach((row, index) => {
            if (index === 0) return;
            const afid = row[0] ? row[0].trim() : '';
            const afCode = row[1] ? row[1].trim() : '';
            const name = row[2] ? row[2].trim() : '';
            const email = row[3] ? row[3].trim().toLowerCase() : '';
            const password = row[4] ? row[4].trim() : '';
            const subject = row[5] ? row[5].trim() : '';
            const school = row[6] ? row[6].trim() : '';
            const dob = row[7] ? row[7].trim() : '';
            const joiningDate = row[8] ? row[8].trim() : '';
            const phone = row[9] ? row[9].trim() : '';
            if (!afid || !name || !email || !subject || !school) {
              if (afid || name || email) {
                errors.push(`Row ${index + 1}: Missing required fields (AFID, Name, Email, Subject, or School)`);
              }
              return;
            }
            if (!SUBJECTS.includes(subject)) {
              errors.push(`Row ${index + 1}: Invalid subject "${subject}". Must be one of: ${SUBJECTS.join(', ')}`);
              return;
            }
            if (!SCHOOLS.includes(school)) {
              errors.push(`Row ${index + 1}: Invalid school "${school}". Must be one of: ${SCHOOLS.join(', ')}`);
              return;
            }
            if (teachersToAdd.some(t => t.afid === afid)) {
              errors.push(`Row ${index + 1}: Duplicate AFID "${afid}" in CSV`);
              return;
            }
            teachersToAdd.push({
              afid,
              afCode: afCode || null,
              name,
              email,
              subject,
              school,
              dob: dob || null,
              joiningDate: joiningDate || null,
              phone: phone || null,
              isArchived: false
            });
            if (password) {
              firebaseAuthList.push({
                email,
                password,
                name,
                afid
              });
            }
          });
          if (teachersToAdd.length === 0) {
            alert('No valid teachers found in CSV.\n\nErrors:\n' + errors.join('\n'));
            setIsImporting(false);
            return;
          }
          const existingAFIDs = teachers.map(t => t.afid);
          const duplicates = teachersToAdd.filter(t => existingAFIDs.includes(t.afid));
          if (duplicates.length > 0) {
            const proceed = confirm(`⚠️ Warning: ${duplicates.length} teacher(s) already exist with these AFIDs:\n${duplicates.map(d => `• ${d.afid} - ${d.name}`).join('\n')}\n\nDo you want to UPDATE these existing teachers?\n\nClick OK to update existing + add new, or Cancel to abort.`);
            if (!proceed) {
              setIsImporting(false);
              if (bulkFileInputRef.current) bulkFileInputRef.current.value = '';
              return;
            }
          }
          let successCount = 0;
          let failCount = 0;
          for (const teacher of teachersToAdd) {
            try {
              await db.collection('teachers').doc(teacher.afid).set(teacher);
              successCount++;
            } catch (err) {
              failCount++;
              errors.push(`Failed to save ${teacher.name} (${teacher.afid}): ${err.message}`);
            }
          }
          setIsImporting(false);
          setImportResults({
            success: successCount,
            failed: failCount,
            errors,
            firebaseAuth: firebaseAuthList
          });
          if (bulkFileInputRef.current) bulkFileInputRef.current.value = '';
        } catch (e) {
          setIsImporting(false);
          alert('Import failed: ' + e.message);
        }
      },
      error: () => {
        setIsImporting(false);
        alert('Failed to parse CSV file');
      }
    });
  };
  const openAddModal = () => {
    setEditingTeacher(null);
    setForm({
      name: '',
      afid: '',
      afCode: '',
      email: '',
      password: '',
      dob: '',
      joiningDate: '',
      subject: '',
      school: '',
      phone: '',
      role: 'teacher'
    });
    setShowModal(true);
  };
  const openEditModal = teacher => {
    setEditingTeacher(teacher);
    setForm({
      ...teacher,
      password: '',
      role: teacher.role || 'teacher'
    });
    setShowModal(true);
  };
  const openLeaveModal = async teacher => {
    setShowLeaveModal(true);
    setSelectedTeacherLeave({ teacher, balance: null });
    setIsEditingLeave(false);
    const currentAdj = (leaveAdjustments || {})[teacher.afid] || { entitled: 0, maternity: 0, paternity: 0 };
    setLeaveForm({ entitled: currentAdj.entitled || 0, maternity: currentAdj.maternity || 0, paternity: currentAdj.paternity || 0 });
    try {
      const snap = await db.collection('teacherAttendance')
        .where('teacherId', '==', teacher.afid)
        .where('status', '==', 'On Leave')
        .get();
      const fullLeaves = snap.docs.map(d => d.data());
      const balance = calculateLeaveBalance(fullLeaves, teacher.afid, leaveAdjustments || {});
      setSelectedTeacherLeave({ teacher, balance });
    } catch (e) {
      const balance = calculateLeaveBalance(teacherAttendance || [], teacher.afid, leaveAdjustments || {});
      setSelectedTeacherLeave({ teacher, balance });
    }
  };
  const handleSaveLeaveAdjustment = async () => {
    if (!selectedTeacherLeave) return;
    setSavingLeave(true);
    try {
      const teacherId = selectedTeacherLeave.teacher.afid;
      await db.collection('leaveAdjustments').doc(teacherId).set({
        entitled: parseInt(leaveForm.entitled) || 0,
        maternity: parseInt(leaveForm.maternity) || 0,
        paternity: parseInt(leaveForm.paternity) || 0,
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin'
      });
      setLeaveAdjustments(prev => ({
        ...prev,
        [teacherId]: {
          entitled: parseInt(leaveForm.entitled) || 0,
          maternity: parseInt(leaveForm.maternity) || 0,
          paternity: parseInt(leaveForm.paternity) || 0
        }
      }));
      const newBalance = calculateLeaveBalance(teacherAttendance || [], teacherId, {
        ...leaveAdjustments,
        [teacherId]: {
          entitled: parseInt(leaveForm.entitled) || 0,
          maternity: parseInt(leaveForm.maternity) || 0,
          paternity: parseInt(leaveForm.paternity) || 0
        }
      });
      setSelectedTeacherLeave({
        ...selectedTeacherLeave,
        balance: newBalance
      });
      setIsEditingLeave(false);
      alert('Leave adjustment saved successfully!');
    } catch (e) {
      alert('Failed to save: ' + e.message);
    } finally {
      setSavingLeave(false);
    }
  };
  const handleResetLeaveAdjustment = async () => {
    if (!selectedTeacherLeave) return;
    if (!confirm(`Reset all leave adjustments for ${selectedTeacherLeave.teacher.name} to zero?\n\nThis will remove any manual adjustments so the balance reflects only system-tracked leaves.`)) return;
    setSavingLeave(true);
    try {
      const teacherId = selectedTeacherLeave.teacher.afid;
      await db.collection('leaveAdjustments').doc(teacherId).set({ entitled: 0, maternity: 0, paternity: 0, updatedAt: new Date().toISOString(), updatedBy: 'admin' });
      const newAdjs = { ...leaveAdjustments, [teacherId]: { entitled: 0, maternity: 0, paternity: 0 } };
      setLeaveAdjustments(newAdjs);
      setLeaveForm({ entitled: 0, maternity: 0, paternity: 0 });
      const snap = await db.collection('teacherAttendance').where('teacherId', '==', teacherId).where('status', '==', 'On Leave').get();
      const newBalance = calculateLeaveBalance(snap.docs.map(d => d.data()), teacherId, newAdjs);
      setSelectedTeacherLeave({ ...selectedTeacherLeave, balance: newBalance });
      alert('✅ Leave adjustments reset to zero!');
    } catch (e) {
      alert('Failed to reset: ' + e.message);
    } finally {
      setSavingLeave(false);
    }
  };
  const handleSave = async () => {
    if (!form.afid || !form.name || !form.email || !form.subject || !form.school) {
      alert('Please fill all required fields (AFID, Name, Email, Subject, School)');
      return;
    }
    try {
      await db.collection('teachers').doc(form.afid).set({
        afid: form.afid,
        afCode: form.afCode || null,
        name: form.name,
        email: form.email.toLowerCase(),
        subject: form.subject,
        school: form.school,
        dob: form.dob || null,
        joiningDate: form.joiningDate || null,
        phone: form.phone || null,
        role: form.role || 'teacher',
        isArchived: form.isArchived || false,
        archiveReason: form.archiveReason || null,
        archiveNotes: form.archiveNotes || null,
        archivedAt: form.archivedAt || null
      });
      if (!editingTeacher && form.password) {
        alert(`Teacher added!\n\nCREATE FIREBASE AUTH:\n1. Firebase Console → Authentication\n2. Add User\n3. Email: ${form.email}\n4. Password: ${form.password}`);
      } else {
        alert(form.role === 'apc' ? 'APC updated!' : 'Teacher updated!');
      }
      setShowModal(false);
    } catch (e) {
      alert('Failed: ' + e.message);
    }
  };
  const openArchiveModal = teacher => {
    setTeacherToArchive(teacher);
    setArchiveReason('');
    setArchiveNotes('');
    setShowArchiveModal(true);
  };
  const handleArchive = async () => {
    if (!archiveReason) {
      alert('Please select a reason for archiving');
      return;
    }
    setArchiving(true);
    try {
      await db.collection('teachers').doc(teacherToArchive.afid).update({
        isArchived: true,
        archiveReason: archiveReason,
        archiveNotes: archiveNotes || '',
        archivedAt: new Date().toISOString(),
        archivedBy: 'admin'
      });
      alert(`✅ ${teacherToArchive.name} has been archived.\n\nReason: ${archiveReason}\n\n• All curriculum data is preserved\n• Student feedback history is preserved\n• A new teacher can be assigned to continue`);
      setShowArchiveModal(false);
      setTeacherToArchive(null);
    } catch (e) {
      alert('Failed to archive: ' + e.message);
    } finally {
      setArchiving(false);
    }
  };
  const handleRestore = async teacher => {
    if (!confirm(`Restore ${teacher.name} as an active teacher?`)) return;
    try {
      await db.collection('teachers').doc(teacher.afid).update({
        isArchived: false,
        archiveReason: null,
        archiveNotes: null,
        archivedAt: null,
        archivedBy: null,
        restoredAt: new Date().toISOString()
      });
      alert(`✅ ${teacher.name} has been restored as an active teacher.`);
    } catch (e) {
      alert('Failed to restore: ' + e.message);
    }
  };
  const handlePermanentDelete = async teacher => {
    if (!confirm(`⚠️ PERMANENT DELETE\n\nAre you sure you want to permanently delete ${teacher.name}?\n\nThis action cannot be undone.\nNote: Historical data (feedback, observations) will remain but show "Deleted Teacher".`)) return;
    try {
      await db.collection('teachers').doc(teacher.afid).delete();
      alert('Teacher permanently deleted.');
    } catch (e) {
      alert('Failed to delete: ' + e.message);
    }
  };
  const activeTeachers = teachers.filter(t => !t.isArchived);
  const archivedTeachers = teachers.filter(t => t.isArchived);
  const getLeaveBalanceDisplay = teacherId => {
    const balance = calculateLeaveBalance(teacherAttendance || [], teacherId, leaveAdjustments || {});
    return balance;
  };
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("div", {
    className: "flex justify-between items-center flex-wrap gap-4"
  }, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "Teacher Management"), React.createElement("div", {
    className: "flex items-center gap-4"
  }, React.createElement("label", {
    className: "flex items-center gap-2 cursor-pointer"
  }, React.createElement("input", {
    type: "checkbox",
    checked: showArchivedTeachers,
    onChange: e => setShowArchivedTeachers(e.target.checked),
    className: "w-5 h-5"
  }), React.createElement("span", {
    className: "text-sm font-medium"
  }, "Show Archived (", archivedTeachers.length, ")")), isSuperAdmin && React.createElement("button", {
    onClick: openAddModal,
    className: "px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold"
  }, "+ Add Teacher"))), isSuperAdmin && React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg border-2 border-purple-200"
  }, React.createElement("div", {
    className: "flex justify-between items-center mb-4"
  }, React.createElement("h3", {
    className: "text-xl font-bold text-purple-700"
  }, "\uD83D\uDCE4 Bulk Import Teachers"), React.createElement("button", {
    onClick: () => setShowBulkImport(!showBulkImport),
    className: "px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-semibold hover:bg-purple-200"
  }, showBulkImport ? '▲ Hide' : '▼ Expand')), showBulkImport && React.createElement("div", {
    className: "space-y-4"
  }, React.createElement("div", {
    className: "p-4 bg-purple-50 border-2 border-purple-200 rounded-xl"
  }, React.createElement("p", {
    className: "font-bold text-purple-800 mb-2"
  }, "\uD83D\uDCCB CSV Format (10 columns):"), React.createElement("div", {
    className: "text-sm text-purple-700 space-y-1"
  }, React.createElement("p", null, React.createElement("strong", null, "Column A:"), " AFID * (unique identifier)"), React.createElement("p", null, React.createElement("strong", null, "Column B:"), " AF Code (e.g., AF355)"), React.createElement("p", null, React.createElement("strong", null, "Column C:"), " Name *"), React.createElement("p", null, React.createElement("strong", null, "Column D:"), " Email *"), React.createElement("p", null, React.createElement("strong", null, "Column E:"), " Password (for new teachers - you'll need to create in Firebase Auth)"), React.createElement("p", null, React.createElement("strong", null, "Column F:"), " Subject * (Physics, Chemistry, Mathematics, Biology)"), React.createElement("p", null, React.createElement("strong", null, "Column G:"), " School * (must match exactly: ", SCHOOLS.join(', '), ")"), React.createElement("p", null, React.createElement("strong", null, "Column H:"), " Date of Birth (YYYY-MM-DD)"), React.createElement("p", null, React.createElement("strong", null, "Column I:"), " Joining Date (YYYY-MM-DD)"), React.createElement("p", null, React.createElement("strong", null, "Column J:"), " Phone")), React.createElement("p", {
    className: "text-xs text-purple-600 mt-2"
  }, "* Required fields")), React.createElement("div", {
    className: "bg-white p-3 rounded-lg text-xs font-mono overflow-x-auto border"
  }, React.createElement("table", {
    className: "w-full border-collapse"
  }, React.createElement("thead", null, React.createElement("tr", {
    className: "bg-gray-100"
  }, React.createElement("th", {
    className: "border p-1 text-left"
  }, "AFID"), React.createElement("th", {
    className: "border p-1 text-left"
  }, "AF Code"), React.createElement("th", {
    className: "border p-1 text-left"
  }, "Name"), React.createElement("th", {
    className: "border p-1 text-left"
  }, "Email"), React.createElement("th", {
    className: "border p-1 text-left"
  }, "Password"), React.createElement("th", {
    className: "border p-1 text-left"
  }, "Subject"), React.createElement("th", {
    className: "border p-1 text-left"
  }, "School"), React.createElement("th", {
    className: "border p-1 text-left"
  }, "DOB"), React.createElement("th", {
    className: "border p-1 text-left"
  }, "Joining"), React.createElement("th", {
    className: "border p-1 text-left"
  }, "Phone"))), React.createElement("tbody", null, React.createElement("tr", null, React.createElement("td", {
    className: "border p-1"
  }, "T001"), React.createElement("td", {
    className: "border p-1"
  }, "AF355"), React.createElement("td", {
    className: "border p-1"
  }, "Rahul Sharma"), React.createElement("td", {
    className: "border p-1"
  }, "rahul@avanti.org"), React.createElement("td", {
    className: "border p-1"
  }, "pass123"), React.createElement("td", {
    className: "border p-1"
  }, "Physics"), React.createElement("td", {
    className: "border p-1"
  }, "CoE Barwani"), React.createElement("td", {
    className: "border p-1"
  }, "1990-05-15"), React.createElement("td", {
    className: "border p-1"
  }, "2023-06-01"), React.createElement("td", {
    className: "border p-1"
  }, "9876543210")), React.createElement("tr", {
    className: "bg-gray-50"
  }, React.createElement("td", {
    className: "border p-1"
  }, "T002"), React.createElement("td", {
    className: "border p-1"
  }, "AF356"), React.createElement("td", {
    className: "border p-1"
  }, "Priya Patel"), React.createElement("td", {
    className: "border p-1"
  }, "priya@avanti.org"), React.createElement("td", {
    className: "border p-1"
  }, "pass456"), React.createElement("td", {
    className: "border p-1"
  }, "Chemistry"), React.createElement("td", {
    className: "border p-1"
  }, "CoE Bundi"), React.createElement("td", {
    className: "border p-1"
  }, "1992-08-20"), React.createElement("td", {
    className: "border p-1"
  }, "2024-01-15"), React.createElement("td", {
    className: "border p-1"
  }, "9876543211"))))), React.createElement("div", {
    className: "flex gap-3"
  }, React.createElement("label", {
    className: `flex-1 px-6 py-4 ${!isImporting ? 'bg-purple-600 hover:bg-purple-700 cursor-pointer' : 'bg-gray-400 cursor-not-allowed'} text-white rounded-xl font-semibold text-center transition-all`
  }, isImporting ? React.createElement("span", {
    className: "flex items-center justify-center gap-2"
  }, React.createElement("svg", {
    className: "animate-spin h-5 w-5",
    viewBox: "0 0 24 24"
  }, React.createElement("circle", {
    className: "opacity-25",
    cx: "12",
    cy: "12",
    r: "10",
    stroke: "currentColor",
    strokeWidth: "4",
    fill: "none"
  }), React.createElement("path", {
    className: "opacity-75",
    fill: "currentColor",
    d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
  })), "Importing Teachers...") : '📤 Select CSV File to Import', React.createElement("input", {
    ref: bulkFileInputRef,
    type: "file",
    accept: ".csv",
    onChange: handleBulkCSVImport,
    disabled: isImporting,
    className: "hidden"
  }))), importResults && React.createElement("div", {
    className: `p-4 rounded-xl ${importResults.failed > 0 ? 'bg-yellow-50 border-2 border-yellow-300' : 'bg-green-50 border-2 border-green-300'}`
  }, React.createElement("h4", {
    className: "font-bold text-lg mb-2"
  }, importResults.failed > 0 ? '⚠️ Import Completed with Warnings' : '✅ Import Successful!'), React.createElement("div", {
    className: "space-y-2 text-sm"
  }, React.createElement("p", {
    className: "text-green-700"
  }, "\u2713 ", importResults.success, " teacher(s) imported successfully"), importResults.failed > 0 && React.createElement("p", {
    className: "text-red-700"
  }, "\u2717 ", importResults.failed, " teacher(s) failed"), importResults.errors.length > 0 && React.createElement("div", {
    className: "mt-3 p-3 bg-red-50 rounded-lg"
  }, React.createElement("p", {
    className: "font-bold text-red-700 mb-1"
  }, "Errors:"), React.createElement("ul", {
    className: "text-red-600 text-xs space-y-1 max-h-32 overflow-y-auto"
  }, importResults.errors.map((err, i) => React.createElement("li", {
    key: i
  }, "\u2022 ", err)))), importResults.firebaseAuth.length > 0 && React.createElement("div", {
    className: "mt-3 p-3 bg-blue-50 rounded-lg"
  }, React.createElement("p", {
    className: "font-bold text-blue-700 mb-2"
  }, "\uD83D\uDD10 Firebase Authentication Required:"), React.createElement("p", {
    className: "text-blue-600 text-xs mb-2"
  }, "Create these users in Firebase Console \u2192 Authentication \u2192 Add User:"), React.createElement("div", {
    className: "bg-white rounded p-2 max-h-40 overflow-y-auto"
  }, React.createElement("table", {
    className: "w-full text-xs"
  }, React.createElement("thead", null, React.createElement("tr", {
    className: "bg-gray-100"
  }, React.createElement("th", {
    className: "p-1 text-left"
  }, "Email"), React.createElement("th", {
    className: "p-1 text-left"
  }, "Password"), React.createElement("th", {
    className: "p-1 text-left"
  }, "Name"))), React.createElement("tbody", null, importResults.firebaseAuth.map((auth, i) => React.createElement("tr", {
    key: i,
    className: "border-b"
  }, React.createElement("td", {
    className: "p-1 font-mono"
  }, auth.email), React.createElement("td", {
    className: "p-1 font-mono"
  }, auth.password), React.createElement("td", {
    className: "p-1"
  }, auth.name)))))))), React.createElement("button", {
    onClick: () => setImportResults(null),
    className: "mt-3 px-4 py-2 bg-gray-200 rounded-lg text-sm font-medium hover:bg-gray-300"
  }, "Dismiss")))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg overflow-x-auto"
  }, React.createElement("h3", {
    className: "text-lg font-bold mb-4 text-green-600"
  }, "\u2705 Active Teachers & APCs (", activeTeachers.length, ")"), React.createElement("table", {
    className: "w-full"
  }, React.createElement("thead", {
    className: "avanti-gradient-light"
  }, React.createElement("tr", null, React.createElement("th", {
    className: "p-3 text-left"
  }, "AFID"), React.createElement("th", {
    className: "p-3 text-left"
  }, "AF Code"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Name"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Role"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Email"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Subject"), React.createElement("th", {
    className: "p-3 text-left"
  }, "School"), React.createElement("th", {
    className: "p-3 text-center"
  }, "Leave Balance"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Actions"))), React.createElement("tbody", null, activeTeachers.map(t => {
    const balance = getLeaveBalanceDisplay(t.afid);
    return React.createElement("tr", {
      key: t.id,
      className: "border-b hover:bg-gray-50"
    }, React.createElement("td", {
      className: "p-3 font-mono"
    }, t.afid), React.createElement("td", {
      className: "p-3 font-mono text-blue-600"
    }, t.afCode || '—'), React.createElement("td", {
      className: "p-3"
    }, t.name), React.createElement("td", {
      className: "p-3"
    }, React.createElement("span", {
      className: `px-2 py-1 rounded-full text-xs font-semibold ${t.role === 'apc' ? 'bg-teal-100 text-teal-700' : 'bg-blue-100 text-blue-700'}`
    }, t.role === 'apc' ? '📋 APC' : '👨‍🏫 Teacher')), React.createElement("td", {
      className: "p-3 text-sm"
    }, t.email), React.createElement("td", {
      className: "p-3"
    }, t.subject), React.createElement("td", {
      className: "p-3"
    }, t.school), React.createElement("td", {
      className: "p-3"
    }, React.createElement("button", {
      onClick: () => openLeaveModal(t),
      className: "flex flex-col items-center gap-1 w-full hover:bg-gray-100 p-2 rounded-lg transition-colors"
    }, React.createElement("div", {
      className: "flex gap-2 text-xs"
    }, React.createElement("span", {
      className: "px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full",
      title: "Entitled Leave"
    }, "E: ", balance.entitled.remaining, "/", balance.entitled.total)), React.createElement("div", {
      className: "flex gap-2 text-xs"
    }, React.createElement("span", {
      className: "px-2 py-0.5 bg-pink-100 text-pink-700 rounded-full",
      title: "Maternity Leave"
    }, "M: ", balance.maternity.remaining), React.createElement("span", {
      className: "px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full",
      title: "Paternity Leave"
    }, "P: ", balance.paternity.remaining)), React.createElement("span", {
      className: "text-xs text-gray-400"
    }, "Click to view/edit"))), React.createElement("td", {
      className: "p-3"
    }, isSuperAdmin ? React.createElement("div", {
      className: "flex gap-2"
    }, React.createElement("button", {
      onClick: () => openEditModal(t),
      className: "px-3 py-1 bg-yellow-400 rounded-lg"
    }, "Edit"), React.createElement("button", {
      onClick: () => openArchiveModal(t),
      className: "px-3 py-1 bg-orange-500 text-white rounded-lg",
      title: "Archive instead of delete"
    }, "Archive")) : React.createElement("span", {
      className: "text-gray-400 text-sm"
    }, "View Only")));
  })))), showArchivedTeachers && archivedTeachers.length > 0 && React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg overflow-x-auto border-2 border-red-200"
  }, React.createElement("h3", {
    className: "text-lg font-bold mb-4 text-red-600"
  }, "\uD83D\uDCE6 Archived Teachers (", archivedTeachers.length, ")"), React.createElement("table", {
    className: "w-full"
  }, React.createElement("thead", {
    className: "bg-red-50"
  }, React.createElement("tr", null, React.createElement("th", {
    className: "p-3 text-left"
  }, "AFID"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Name"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Subject"), React.createElement("th", {
    className: "p-3 text-left"
  }, "School"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Archive Reason"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Archived Date"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Actions"))), React.createElement("tbody", null, archivedTeachers.map(t => React.createElement("tr", {
    key: t.id,
    className: "border-b bg-red-50/50 hover:bg-red-100/50"
  }, React.createElement("td", {
    className: "p-3 font-mono text-red-700"
  }, t.afid), React.createElement("td", {
    className: "p-3 text-red-700 font-medium"
  }, t.name), React.createElement("td", {
    className: "p-3 text-red-600"
  }, t.subject), React.createElement("td", {
    className: "p-3 text-red-600"
  }, t.school), React.createElement("td", {
    className: "p-3"
  }, React.createElement("span", {
    className: `px-2 py-1 rounded-full text-xs font-bold ${t.archiveReason === 'Resigned' ? 'bg-yellow-100 text-yellow-800' : t.archiveReason === 'Removed' ? 'bg-red-100 text-red-800' : t.archiveReason === 'Transferred' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`
  }, t.archiveReason || 'Unknown'), t.archiveNotes && React.createElement("div", {
    className: "text-xs text-gray-500 mt-1",
    title: t.archiveNotes
  }, "\uD83D\uDCDD ", t.archiveNotes.length > 30 ? t.archiveNotes.slice(0, 30) + '...' : t.archiveNotes)), React.createElement("td", {
    className: "p-3 text-sm text-gray-600"
  }, t.archivedAt ? new Date(t.archivedAt).toLocaleDateString() : '—'), React.createElement("td", {
    className: "p-3"
  }, isSuperAdmin && React.createElement("div", {
    className: "flex gap-2"
  }, React.createElement("button", {
    onClick: () => handleRestore(t),
    className: "px-3 py-1 bg-green-500 text-white rounded-lg text-sm"
  }, "Restore"), React.createElement("button", {
    onClick: () => handlePermanentDelete(t),
    className: "px-3 py-1 bg-red-600 text-white rounded-lg text-sm"
  }, "Delete")))))))), showLeaveModal && selectedTeacherLeave && React.createElement("div", {
    className: "modal-overlay",
    onClick: () => {
      setShowLeaveModal(false);
      setIsEditingLeave(false);
    }
  }, React.createElement("div", {
    className: "modal-content max-w-lg",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "flex justify-between items-center mb-4"
  }, React.createElement("h3", {
    className: "text-2xl font-bold"
  }, "\uD83D\uDCCA Leave Balance - ", selectedTeacherLeave.teacher.name), !isEditingLeave && isSuperAdmin && React.createElement("div", { className: "flex gap-2" },
    React.createElement("button", {
      onClick: () => setIsEditingLeave(true),
      className: "px-4 py-2 bg-yellow-400 rounded-lg font-semibold text-sm"
    }, "\u270F\uFE0F Edit"),
    React.createElement("button", {
      onClick: handleResetLeaveAdjustment,
      disabled: savingLeave,
      className: "px-4 py-2 bg-red-100 text-red-700 rounded-lg font-semibold text-sm hover:bg-red-200 disabled:opacity-50"
    }, savingLeave ? '...' : '\uD83D\uDD04 Reset'))), isEditingLeave ? React.createElement("div", {
    className: "space-y-4"
  }, React.createElement("div", {
    className: "bg-yellow-50 p-4 rounded-xl border-2 border-yellow-300 mb-4"
  }, React.createElement("p", {
    className: "text-sm text-yellow-800"
  }, React.createElement("strong", null, "\uD83D\uDEE1\uFE0F Admin Leave Override:"), " Use positive values to reduce a teacher\u2019s leave balance (mark as used), or negative values to add back leave (increase remaining). Set to 0 to reset to system-tracked leaves only."), React.createElement("button", {
    onClick: () => setLeaveForm({ entitled: 0, maternity: 0, paternity: 0 }),
    className: "mt-2 px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-semibold hover:bg-red-200"
  }, "\uD83D\uDD04 Reset All Adjustments to 0")), React.createElement("div", {
    className: "bg-blue-50 p-4 rounded-xl border-2 border-blue-200"
  }, React.createElement("label", {
    className: "block font-bold text-blue-800 mb-2"
  }, "Entitled Leave Adjustment"), React.createElement("div", {
    className: "flex items-center gap-3"
  }, React.createElement("input", {
    type: "number",
    min: "-35",
    max: "35",
    value: leaveForm.entitled,
    onChange: e => setLeaveForm({
      ...leaveForm,
      entitled: Math.min(35, Math.max(-35, parseInt(e.target.value) || 0))
    }),
    className: "w-24 border-2 px-3 py-2 rounded-lg text-center font-bold text-lg"
  }), React.createElement("span", {
    className: "text-blue-700"
  }, leaveForm.entitled >= 0 ? "days deducted (reduces balance)" : "days added back (increases balance)")), React.createElement("p", {
    className: "text-xs text-blue-600 mt-2"
  }, "Range: -35 to +35 days (Personal, Sick, Emergency combined)")), React.createElement("div", {
    className: "bg-pink-50 p-4 rounded-xl border-2 border-pink-200"
  }, React.createElement("label", {
    className: "block font-bold text-pink-800 mb-2"
  }, "Maternity Leave Adjustment"), React.createElement("div", {
    className: "flex items-center gap-3"
  }, React.createElement("input", {
    type: "number",
    min: "-180",
    max: "180",
    value: leaveForm.maternity,
    onChange: e => setLeaveForm({
      ...leaveForm,
      maternity: Math.min(180, Math.max(-180, parseInt(e.target.value) || 0))
    }),
    className: "w-24 border-2 px-3 py-2 rounded-lg text-center font-bold text-lg"
  }), React.createElement("span", {
    className: "text-pink-700"
  }, leaveForm.maternity >= 0 ? "days deducted (reduces balance)" : "days added back (increases balance)")), React.createElement("p", {
    className: "text-xs text-pink-600 mt-2"
  }, "Range: -180 to +180 days")), React.createElement("div", {
    className: "bg-purple-50 p-4 rounded-xl border-2 border-purple-200"
  }, React.createElement("label", {
    className: "block font-bold text-purple-800 mb-2"
  }, "Paternity Leave Adjustment"), React.createElement("div", {
    className: "flex items-center gap-3"
  }, React.createElement("input", {
    type: "number",
    min: "-15",
    max: "15",
    value: leaveForm.paternity,
    onChange: e => setLeaveForm({
      ...leaveForm,
      paternity: Math.min(15, Math.max(-15, parseInt(e.target.value) || 0))
    }),
    className: "w-24 border-2 px-3 py-2 rounded-lg text-center font-bold text-lg"
  }), React.createElement("span", {
    className: "text-purple-700"
  }, leaveForm.paternity >= 0 ? "days deducted (reduces balance)" : "days added back (increases balance)")), React.createElement("p", {
    className: "text-xs text-purple-600 mt-2"
  }, "Range: -15 to +15 days")), React.createElement("div", {
    className: "flex gap-3 mt-6"
  }, React.createElement("button", {
    onClick: handleSaveLeaveAdjustment,
    disabled: savingLeave,
    className: "flex-1 avanti-gradient text-white py-3 rounded-xl font-semibold disabled:opacity-50"
  }, savingLeave ? 'Saving...' : '💾 Save Adjustment'), React.createElement("button", {
    onClick: () => {
      setIsEditingLeave(false);
      const currentAdj = leaveAdjustments[selectedTeacherLeave.teacher.afid] || {
        entitled: 0,
        maternity: 0,
        paternity: 0
      };
      setLeaveForm({
        entitled: currentAdj.entitled || 0,
        maternity: currentAdj.maternity || 0,
        paternity: currentAdj.paternity || 0
      });
    },
    className: "flex-1 bg-gray-300 py-3 rounded-xl font-semibold"
  }, "Cancel"))) : !selectedTeacherLeave.balance ? React.createElement("div", { className: "text-center py-8" }, React.createElement("div", { className: "animate-spin text-3xl mb-3" }, "⏳"), React.createElement("p", { className: "text-gray-500" }, "Loading leave history...")) : React.createElement("div", {
    className: "space-y-4"
  }, React.createElement("div", {
    className: "bg-blue-50 p-4 rounded-xl border-2 border-blue-200"
  }, React.createElement("div", {
    className: "flex justify-between items-center mb-2"
  }, React.createElement("span", {
    className: "font-bold text-blue-800"
  }, "Entitled Leave"), React.createElement("span", {
    className: "text-2xl font-bold text-blue-600"
  }, selectedTeacherLeave.balance.entitled.remaining, "/", selectedTeacherLeave.balance.entitled.total)), React.createElement("div", {
    className: "flex justify-between text-sm text-blue-700"
  }, React.createElement("span", null, "Used: ", selectedTeacherLeave.balance.entitled.used, " days"), React.createElement("span", null, "Remaining: ", selectedTeacherLeave.balance.entitled.remaining, " days")), selectedTeacherLeave.balance.entitled.adjustment > 0 && React.createElement("div", {
    className: "text-xs text-blue-600 mt-1"
  }, "(includes ", selectedTeacherLeave.balance.entitled.adjustment, " prior adjustment)"), React.createElement("div", {
    className: "mt-2 bg-blue-200 rounded-full h-3"
  }, React.createElement("div", {
    className: "bg-blue-500 h-3 rounded-full transition-all",
    style: {
      width: `${selectedTeacherLeave.balance.entitled.remaining / selectedTeacherLeave.balance.entitled.total * 100}%`
    }
  })), React.createElement("p", {
    className: "text-xs text-blue-600 mt-2"
  }, "Includes: Personal Leave, Sick Leave, Emergency Leave")), React.createElement("div", {
    className: "bg-pink-50 p-4 rounded-xl border-2 border-pink-200"
  }, React.createElement("div", {
    className: "flex justify-between items-center mb-2"
  }, React.createElement("span", {
    className: "font-bold text-pink-800"
  }, "Maternity Leave"), React.createElement("span", {
    className: "text-2xl font-bold text-pink-600"
  }, selectedTeacherLeave.balance.maternity.remaining, "/", selectedTeacherLeave.balance.maternity.total)), React.createElement("div", {
    className: "flex justify-between text-sm text-pink-700"
  }, React.createElement("span", null, "Used: ", selectedTeacherLeave.balance.maternity.used, " days"), React.createElement("span", null, "Remaining: ", selectedTeacherLeave.balance.maternity.remaining, " days")), selectedTeacherLeave.balance.maternity.adjustment > 0 && React.createElement("div", {
    className: "text-xs text-pink-600 mt-1"
  }, "(includes ", selectedTeacherLeave.balance.maternity.adjustment, " prior adjustment)"), React.createElement("div", {
    className: "mt-2 bg-pink-200 rounded-full h-3"
  }, React.createElement("div", {
    className: "bg-pink-500 h-3 rounded-full transition-all",
    style: {
      width: `${selectedTeacherLeave.balance.maternity.remaining / selectedTeacherLeave.balance.maternity.total * 100}%`
    }
  }))), React.createElement("div", {
    className: "bg-purple-50 p-4 rounded-xl border-2 border-purple-200"
  }, React.createElement("div", {
    className: "flex justify-between items-center mb-2"
  }, React.createElement("span", {
    className: "font-bold text-purple-800"
  }, "Paternity Leave"), React.createElement("span", {
    className: "text-2xl font-bold text-purple-600"
  }, selectedTeacherLeave.balance.paternity.remaining, "/", selectedTeacherLeave.balance.paternity.total)), React.createElement("div", {
    className: "flex justify-between text-sm text-purple-700"
  }, React.createElement("span", null, "Used: ", selectedTeacherLeave.balance.paternity.used, " days"), React.createElement("span", null, "Remaining: ", selectedTeacherLeave.balance.paternity.remaining, " days")), selectedTeacherLeave.balance.paternity.adjustment > 0 && React.createElement("div", {
    className: "text-xs text-purple-600 mt-1"
  }, "(includes ", selectedTeacherLeave.balance.paternity.adjustment, " prior adjustment)"), React.createElement("div", {
    className: "mt-2 bg-purple-200 rounded-full h-3"
  }, React.createElement("div", {
    className: "bg-purple-500 h-3 rounded-full transition-all",
    style: {
      width: `${selectedTeacherLeave.balance.paternity.remaining / selectedTeacherLeave.balance.paternity.total * 100}%`
    }
  }))), React.createElement("button", {
    onClick: () => {
      setShowLeaveModal(false);
      setIsEditingLeave(false);
    },
    className: "w-full mt-6 bg-gray-300 py-3 rounded-xl font-semibold"
  }, "Close")))), showArchiveModal && teacherToArchive && React.createElement("div", {
    className: "modal-overlay",
    onClick: () => setShowArchiveModal(false)
  }, React.createElement("div", {
    className: "modal-content max-w-md",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "text-center mb-6"
  }, React.createElement("div", {
    className: "text-5xl mb-3"
  }, "\uD83D\uDCE6"), React.createElement("h3", {
    className: "text-2xl font-bold text-gray-800"
  }, "Archive Teacher"), React.createElement("p", {
    className: "text-gray-600 mt-2"
  }, "You are about to archive ", React.createElement("strong", {
    className: "text-red-600"
  }, teacherToArchive.name))), React.createElement("div", {
    className: "bg-blue-50 p-4 rounded-xl mb-4 text-sm"
  }, React.createElement("p", {
    className: "font-bold text-blue-800 mb-2"
  }, "\uD83D\uDCCC What happens when you archive:"), React.createElement("ul", {
    className: "space-y-1 text-blue-700"
  }, React.createElement("li", null, "\u2705 All curriculum data is ", React.createElement("strong", null, "preserved")), React.createElement("li", null, "\u2705 Student feedback history is ", React.createElement("strong", null, "preserved")), React.createElement("li", null, "\u2705 Teacher appears as \"Archived\" in directory"), React.createElement("li", null, "\u2705 Students see \"Vacant\" for this subject"), React.createElement("li", null, "\u2705 New teacher can continue from where they left off"))), React.createElement("div", {
    className: "space-y-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block font-bold mb-2 text-gray-700"
  }, "Reason for Archiving ", React.createElement("span", {
    className: "text-red-500"
  }, "*")), React.createElement("select", {
    value: archiveReason,
    onChange: e => setArchiveReason(e.target.value),
    className: "w-full border-2 px-4 py-3 rounded-xl",
    required: true
  }, React.createElement("option", {
    value: ""
  }, "-- Select Reason --"), React.createElement("option", {
    value: "Resigned"
  }, "\uD83D\uDE14 Resigned"), React.createElement("option", {
    value: "Removed"
  }, "\u274C Removed"), React.createElement("option", {
    value: "Transferred"
  }, "\uD83D\uDD04 Transferred to another program"), React.createElement("option", {
    value: "On Long Leave"
  }, "\uD83C\uDFD6\uFE0F On Long Leave"), React.createElement("option", {
    value: "Other"
  }, "\uD83D\uDCDD Other"))), React.createElement("div", null, React.createElement("label", {
    className: "block font-bold mb-2 text-gray-700"
  }, "Additional Notes (Optional)"), React.createElement("textarea", {
    value: archiveNotes,
    onChange: e => setArchiveNotes(e.target.value),
    placeholder: "E.g., Resigned for personal reasons, effective date, etc.",
    className: "w-full border-2 px-4 py-3 rounded-xl resize-none",
    rows: "3"
  }))), React.createElement("div", {
    className: "flex gap-3 mt-6"
  }, React.createElement("button", {
    onClick: () => setShowArchiveModal(false),
    className: "flex-1 bg-gray-300 py-3 rounded-xl font-semibold",
    disabled: archiving
  }, "Cancel"), React.createElement("button", {
    onClick: handleArchive,
    disabled: !archiveReason || archiving,
    className: `flex-1 py-3 rounded-xl font-semibold text-white ${!archiveReason || archiving ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'}`
  }, archiving ? '⏳ Archiving...' : '📦 Archive Teacher')))), showModal && React.createElement("div", {
    className: "modal-overlay",
    onClick: () => setShowModal(false)
  }, React.createElement("div", {
    className: "modal-content",
    onClick: e => e.stopPropagation()
  }, React.createElement("h3", {
    className: "text-2xl font-bold mb-4"
  }, editingTeacher ? 'Edit Teacher' : 'Add New Teacher'), React.createElement("div", {
    className: "space-y-4"
  }, React.createElement("div", {
    className: "grid grid-cols-2 gap-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-1"
  }, "AFID *"), React.createElement("input", {
    type: "text",
    value: form.afid,
    onChange: e => setForm({
      ...form,
      afid: e.target.value
    }),
    disabled: !!editingTeacher,
    className: "w-full border-2 px-3 py-2 rounded-lg"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-1"
  }, "AF Code (e.g. AF355)"), React.createElement("input", {
    type: "text",
    value: form.afCode || '',
    onChange: e => setForm({
      ...form,
      afCode: e.target.value
    }),
    placeholder: "AF355",
    className: "w-full border-2 px-3 py-2 rounded-lg"
  }))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-1"
  }, "Name *"), React.createElement("input", {
    type: "text",
    value: form.name,
    onChange: e => setForm({
      ...form,
      name: e.target.value
    }),
    className: "w-full border-2 px-3 py-2 rounded-lg"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-1"
  }, "Email *"), React.createElement("input", {
    type: "email",
    value: form.email,
    onChange: e => setForm({
      ...form,
      email: e.target.value
    }),
    className: "w-full border-2 px-3 py-2 rounded-lg"
  })), !editingTeacher && React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-1"
  }, "Password *"), React.createElement("input", {
    type: "password",
    value: form.password,
    onChange: e => setForm({
      ...form,
      password: e.target.value
    }),
    className: "w-full border-2 px-3 py-2 rounded-lg"
  })), React.createElement("div", {
    className: "grid grid-cols-2 gap-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-1"
  }, "Subject *"), React.createElement("select", {
    value: form.subject,
    onChange: e => setForm({
      ...form,
      subject: e.target.value
    }),
    className: "w-full border-2 px-3 py-2 rounded-lg"
  }, React.createElement("option", {
    value: ""
  }, "Select"), SUBJECTS.map(s => React.createElement("option", {
    key: s,
    value: s
  }, s)))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-1"
  }, "School *"), React.createElement("select", {
    value: form.school,
    onChange: e => setForm({
      ...form,
      school: e.target.value
    }),
    className: "w-full border-2 px-3 py-2 rounded-lg"
  }, React.createElement("option", {
    value: ""
  }, "Select"), SCHOOLS.map(s => React.createElement("option", {
    key: s,
    value: s
  }, s))))), React.createElement("div", {
    className: "grid grid-cols-2 gap-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-1"
  }, "Date of Birth"), React.createElement("input", {
    type: "date",
    value: form.dob,
    onChange: e => setForm({
      ...form,
      dob: e.target.value
    }),
    className: "w-full border-2 px-3 py-2 rounded-lg"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-1"
  }, "Joining Date"), React.createElement("input", {
    type: "date",
    value: form.joiningDate,
    onChange: e => setForm({
      ...form,
      joiningDate: e.target.value
    }),
    className: "w-full border-2 px-3 py-2 rounded-lg"
  }))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-1"
  }, "Phone"), React.createElement("input", {
    type: "text",
    value: form.phone,
    onChange: e => setForm({
      ...form,
      phone: e.target.value
    }),
    className: "w-full border-2 px-3 py-2 rounded-lg"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-1"
  }, "Role *"), React.createElement("select", {
    value: form.role || 'teacher',
    onChange: e => setForm({
      ...form,
      role: e.target.value
    }),
    className: "w-full border-2 px-3 py-2 rounded-lg"
  }, React.createElement("option", {
    value: "teacher"
  }, "\uD83D\uDC68\u200D\uD83C\uDFEB Teacher"), React.createElement("option", {
    value: "apc"
  }, "\uD83D\uDCCB APC (Academic Program Coordinator)")), form.role === 'apc' && React.createElement("p", {
    className: "text-xs text-teal-600 mt-1"
  }, "\u2139\uFE0F APC can view all subjects, mark student attendance, view teacher attendance, but cannot edit curriculum.")), React.createElement("div", {
    className: "flex gap-3"
  }, React.createElement("button", {
    onClick: handleSave,
    className: "flex-1 avanti-gradient text-white py-3 rounded-xl font-semibold"
  }, "Save"), React.createElement("button", {
    onClick: () => setShowModal(false),
    className: "flex-1 bg-gray-300 py-3 rounded-xl font-semibold"
  }, "Cancel"))))));
}
function AdminAssetManagement({
  accessibleSchools = [],
  isSuperAdmin = false,
  isDirector = false
}) {
  const [assets, setAssets] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterSchools, setFilterSchools] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const hasFullDataAccess = isSuperAdmin || isDirector;
  useEffect(() => {
    const schoolsToShow = hasFullDataAccess ? SCHOOLS : accessibleSchools;
    if (filterSchools.length === 0 && schoolsToShow.length > 0) {
      setFilterSchools([...schoolsToShow]);
    }
  }, [accessibleSchools, hasFullDataAccess]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        let allAssets = [];
        let allAssignments = [];
        const schoolsToFetch = hasFullDataAccess ? SCHOOLS : accessibleSchools;
        for (const school of schoolsToFetch) {
          const assetsSnap = await db.collection('assets').where('school', '==', school).get();
          allAssets = [...allAssets, ...assetsSnap.docs.map(d => ({
            ...d.data(),
            docId: d.id
          }))];
          const assignmentsSnap = await db.collection('assetAssignments').where('school', '==', school).get();
          allAssignments = [...allAssignments, ...assignmentsSnap.docs.map(d => ({
            ...d.data(),
            docId: d.id
          }))];
        }
        setAssets(allAssets);
        setAssignments(allAssignments);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching assets:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, [accessibleSchools, hasFullDataAccess]);
  const schoolsToShow = hasFullDataAccess ? SCHOOLS : accessibleSchools;
  const allSchoolsSelected = filterSchools.length === schoolsToShow.length || filterSchools.length === 0;
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      if (!allSchoolsSelected && filterSchools.length > 0 && !filterSchools.includes(asset.school)) return false;
      if (filterType !== 'all' && asset.assetType !== filterType) return false;
      if (filterStatus !== 'all' && asset.status !== filterStatus) return false;
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return asset.title?.toLowerCase().includes(search) || asset.author?.toLowerCase().includes(search) || asset.barcode?.includes(search) || asset.currentAssignee?.studentName?.toLowerCase().includes(search);
      }
      return true;
    });
  }, [assets, filterSchools, allSchoolsSelected, filterType, filterStatus, searchTerm]);
  const stats = useMemo(() => {
    const filtered = allSchoolsSelected ? assets : assets.filter(a => filterSchools.includes(a.school));
    return {
      total: filtered.length,
      available: filtered.filter(a => a.status === 'available').length,
      assigned: filtered.filter(a => a.status === 'assigned').length,
      books: filtered.filter(a => a.assetType === 'book').length,
      chromebooks: filtered.filter(a => a.assetType === 'chromebook').length
    };
  }, [assets, filterSchools, allSchoolsSelected]);
  const schoolStats = useMemo(() => {
    const schoolsList = hasFullDataAccess ? SCHOOLS : accessibleSchools;
    return schoolsList.map(school => {
      const schoolAssets = assets.filter(a => a.school === school);
      return {
        school,
        total: schoolAssets.length,
        available: schoolAssets.filter(a => a.status === 'available').length,
        assigned: schoolAssets.filter(a => a.status === 'assigned').length,
        books: schoolAssets.filter(a => a.assetType === 'book').length,
        chromebooks: schoolAssets.filter(a => a.assetType === 'chromebook').length
      };
    });
  }, [assets, accessibleSchools, isSuperAdmin]);
  if (loading) return React.createElement("div", {
    className: "text-center py-8"
  }, "Loading assets...");
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "\uD83D\uDCE6 Asset Management (All Schools)"), React.createElement("div", {
    className: "bg-white p-4 rounded-xl shadow-lg"
  }, React.createElement("div", {
    className: "grid md:grid-cols-5 gap-4 items-end"
  }, React.createElement(AssetSchoolMultiSelect, {
    schools: schoolsToShow,
    selected: filterSchools,
    onChange: setFilterSchools
  }), React.createElement("input", {
    type: "text",
    value: searchTerm,
    onChange: e => setSearchTerm(e.target.value),
    placeholder: "Search assets...",
    className: "border-2 px-4 py-2 rounded-xl h-[46px]"
  }), React.createElement("select", {
    value: filterType,
    onChange: e => setFilterType(e.target.value),
    className: "border-2 px-4 py-2 rounded-xl h-[46px]"
  }, React.createElement("option", {
    value: "all"
  }, "All Types"), React.createElement("option", {
    value: "book"
  }, "Books"), React.createElement("option", {
    value: "chromebook"
  }, "Chromebooks")), React.createElement("select", {
    value: filterStatus,
    onChange: e => setFilterStatus(e.target.value),
    className: "border-2 px-4 py-2 rounded-xl h-[46px]"
  }, React.createElement("option", {
    value: "all"
  }, "All Status"), React.createElement("option", {
    value: "available"
  }, "Available"), React.createElement("option", {
    value: "assigned"
  }, "Assigned")), React.createElement("button", {
    onClick: () => {
      setFilterSchools([...schoolsToShow]);
      setSearchTerm('');
      setFilterType('all');
      setFilterStatus('all');
    },
    className: "px-4 py-2 bg-gray-200 rounded-xl h-[46px] font-semibold"
  }, "Clear"))), React.createElement("div", {
    className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
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
  }, stats.chromebooks))), React.createElement("div", {
    className: "flex gap-2 overflow-x-auto pb-2"
  }, ['overview', 'inventory', 'history', 'byschool'].map(tab => React.createElement("button", {
    key: tab,
    onClick: () => setActiveSubTab(tab),
    className: `px-4 py-2 rounded-xl font-semibold whitespace-nowrap ${activeSubTab === tab ? 'avanti-gradient text-white' : 'bg-white'}`
  }, tab === 'overview' && '📊 Overview', tab === 'inventory' && '📦 All Assets', tab === 'history' && '📜 History', tab === 'byschool' && '🏫 By School'))), activeSubTab === 'overview' && React.createElement("div", {
    className: "grid md:grid-cols-2 lg:grid-cols-3 gap-4"
  }, schoolStats.map(ss => React.createElement("div", {
    key: ss.school,
    className: "bg-white p-6 rounded-xl shadow-lg"
  }, React.createElement("h3", {
    className: "font-bold text-lg mb-4"
  }, ss.school), React.createElement("div", {
    className: "grid grid-cols-3 gap-2 text-center"
  }, React.createElement("div", {
    className: "p-2 bg-blue-50 rounded-lg"
  }, React.createElement("div", {
    className: "text-2xl font-bold text-blue-600"
  }, ss.total), React.createElement("div", {
    className: "text-xs text-gray-600"
  }, "Total")), React.createElement("div", {
    className: "p-2 bg-green-50 rounded-lg"
  }, React.createElement("div", {
    className: "text-2xl font-bold text-green-600"
  }, ss.available), React.createElement("div", {
    className: "text-xs text-gray-600"
  }, "Available")), React.createElement("div", {
    className: "p-2 bg-yellow-50 rounded-lg"
  }, React.createElement("div", {
    className: "text-2xl font-bold text-yellow-600"
  }, ss.assigned), React.createElement("div", {
    className: "text-xs text-gray-600"
  }, "Assigned")))))), activeSubTab === 'inventory' && React.createElement("div", {
    className: "bg-white p-6 rounded-xl shadow-lg overflow-x-auto"
  }, React.createElement("table", {
    className: "w-full"
  }, React.createElement("thead", {
    className: "avanti-gradient-light"
  }, React.createElement("tr", null, React.createElement("th", {
    className: "p-3 text-left"
  }, "Title"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Type"), React.createElement("th", {
    className: "p-3 text-left"
  }, "School"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Status"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Assigned To"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Copy #"))), React.createElement("tbody", null, filteredAssets.length === 0 ? React.createElement("tr", null, React.createElement("td", {
    colSpan: "6",
    className: "p-8 text-center text-gray-500"
  }, "No assets found")) : filteredAssets.slice(0, 100).map(asset => React.createElement("tr", {
    key: asset.docId,
    className: "border-b hover:bg-gray-50"
  }, React.createElement("td", {
    className: "p-3"
  }, React.createElement("div", {
    className: "font-semibold"
  }, asset.title), asset.author && React.createElement("div", {
    className: "text-xs text-gray-500"
  }, "by ", asset.author)), React.createElement("td", {
    className: "p-3"
  }, asset.assetType === 'book' ? '📚 Book' : '💻 Chromebook'), React.createElement("td", {
    className: "p-3 text-sm"
  }, asset.school), React.createElement("td", {
    className: "p-3"
  }, React.createElement("span", {
    className: `asset-badge badge-${asset.status}`
  }, asset.status)), React.createElement("td", {
    className: "p-3 text-sm"
  }, asset.currentAssignee?.studentName || '-'), React.createElement("td", {
    className: "p-3 text-sm"
  }, asset.copyNumber || 1))))), filteredAssets.length > 100 && React.createElement("p", {
    className: "text-center text-gray-500 mt-4"
  }, "Showing first 100 of ", filteredAssets.length, " assets")), activeSubTab === 'history' && React.createElement("div", {
    className: "bg-white p-6 rounded-xl shadow-lg"
  }, React.createElement("h3", {
    className: "font-bold text-xl mb-4"
  }, "\uD83D\uDCDC Assignment History"), assignments.filter(a => a.status === 'returned').length === 0 ? React.createElement("p", {
    className: "text-center py-8 text-gray-500"
  }, "No returned assets yet") : React.createElement("div", {
    className: "overflow-x-auto"
  }, React.createElement("table", {
    className: "w-full"
  }, React.createElement("thead", {
    className: "avanti-gradient-light"
  }, React.createElement("tr", null, React.createElement("th", {
    className: "p-3 text-left"
  }, "Asset"), React.createElement("th", {
    className: "p-3 text-left"
  }, "School"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Student"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Assigned Date"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Return Date"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Duration"))), React.createElement("tbody", null, assignments.filter(a => a.status === 'returned').sort((a, b) => new Date(b.returnedDate) - new Date(a.returnedDate)).slice(0, 100).map(a => {
    const assignedDate = new Date(a.assignedDate);
    const returnedDate = new Date(a.returnedDate);
    const daysHeld = Math.ceil((returnedDate - assignedDate) / (1000 * 60 * 60 * 24));
    return React.createElement("tr", {
      key: a.docId,
      className: "border-b hover:bg-gray-50"
    }, React.createElement("td", {
      className: "p-3 font-semibold"
    }, a.assetTitle), React.createElement("td", {
      className: "p-3 text-sm"
    }, a.school), React.createElement("td", {
      className: "p-3"
    }, a.studentName, " (Class ", a.studentClass, ")"), React.createElement("td", {
      className: "p-3 text-sm"
    }, assignedDate.toLocaleDateString()), React.createElement("td", {
      className: "p-3 text-sm"
    }, returnedDate.toLocaleDateString()), React.createElement("td", {
      className: "p-3"
    }, React.createElement("span", {
      className: "px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
    }, daysHeld, " days")));
  }))))), activeSubTab === 'byschool' && React.createElement("div", {
    className: "bg-white p-6 rounded-xl shadow-lg overflow-x-auto"
  }, React.createElement("table", {
    className: "w-full"
  }, React.createElement("thead", {
    className: "avanti-gradient-light"
  }, React.createElement("tr", null, React.createElement("th", {
    className: "p-3 text-left"
  }, "School"), React.createElement("th", {
    className: "p-3 text-center"
  }, "Total"), React.createElement("th", {
    className: "p-3 text-center"
  }, "Books"), React.createElement("th", {
    className: "p-3 text-center"
  }, "Chromebooks"), React.createElement("th", {
    className: "p-3 text-center"
  }, "Available"), React.createElement("th", {
    className: "p-3 text-center"
  }, "Assigned"))), React.createElement("tbody", null, schoolStats.map(ss => React.createElement("tr", {
    key: ss.school,
    className: "border-b hover:bg-gray-50"
  }, React.createElement("td", {
    className: "p-3 font-semibold"
  }, ss.school), React.createElement("td", {
    className: "p-3 text-center font-bold"
  }, ss.total), React.createElement("td", {
    className: "p-3 text-center"
  }, ss.books), React.createElement("td", {
    className: "p-3 text-center"
  }, ss.chromebooks), React.createElement("td", {
    className: "p-3 text-center text-green-600 font-semibold"
  }, ss.available), React.createElement("td", {
    className: "p-3 text-center text-yellow-600 font-semibold"
  }, ss.assigned))), React.createElement("tr", {
    className: "bg-gray-100 font-bold"
  }, React.createElement("td", {
    className: "p-3"
  }, "TOTAL"), React.createElement("td", {
    className: "p-3 text-center"
  }, schoolStats.reduce((s, ss) => s + ss.total, 0)), React.createElement("td", {
    className: "p-3 text-center"
  }, schoolStats.reduce((s, ss) => s + ss.books, 0)), React.createElement("td", {
    className: "p-3 text-center"
  }, schoolStats.reduce((s, ss) => s + ss.chromebooks, 0)), React.createElement("td", {
    className: "p-3 text-center text-green-600"
  }, schoolStats.reduce((s, ss) => s + ss.available, 0)), React.createElement("td", {
    className: "p-3 text-center text-yellow-600"
  }, schoolStats.reduce((s, ss) => s + ss.assigned, 0)))))));
}
function AdminBirthdays({
  teachers
}) {
  const todayBirthdays = useMemo(() => getBirthdays(teachers, 'today'), [teachers]);
  const weekBirthdays = useMemo(() => getBirthdays(teachers, 'week'), [teachers]);
  const monthBirthdays = useMemo(() => getBirthdays(teachers, 'month'), [teachers]);
  const todayAnniversaries = useMemo(() => getAnniversaries(teachers, 'today'), [teachers]);
  const weekAnniversaries = useMemo(() => getAnniversaries(teachers, 'week'), [teachers]);
  const monthAnniversaries = useMemo(() => getAnniversaries(teachers, 'month'), [teachers]);
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "\uD83C\uDF89 Celebrations"), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-6"
  }, React.createElement(React.Fragment, null, todayBirthdays.length > 0 && React.createElement("div", {
    className: "birthday-card p-6 rounded-2xl"
  }, React.createElement("h3", {
    className: "text-2xl font-bold text-white mb-4"
  }, "\uD83C\uDF82 Today's Birthdays"), todayBirthdays.map(t => React.createElement("div", {
    key: t.id,
    className: "bg-white p-4 rounded-lg mb-2"
  }, React.createElement("div", {
    className: "font-bold text-lg"
  }, t.name), React.createElement("div", {
    className: "text-sm text-gray-600"
  }, t.school, " - ", t.subject)))), todayAnniversaries.length > 0 && React.createElement("div", {
    className: "birthday-card p-6 rounded-2xl"
  }, React.createElement("h3", {
    className: "text-2xl font-bold text-white mb-4"
  }, "\uD83C\uDF89 Today's Work Anniversaries"), todayAnniversaries.map(t => {
    const years = new Date().getFullYear() - new Date(t.joiningDate).getFullYear();
    return React.createElement("div", {
      key: t.id,
      className: "bg-white p-4 rounded-lg mb-2"
    }, React.createElement("div", {
      className: "font-bold text-lg"
    }, t.name), React.createElement("div", {
      className: "text-sm text-gray-600"
    }, years, " Years - ", t.school));
  })))), React.createElement("div", {
    className: "grid md:grid-cols-3 gap-6"
  }, React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "This Week"), weekBirthdays.length === 0 && weekAnniversaries.length === 0 ? React.createElement("p", {
    className: "text-gray-500"
  }, "No celebrations") : React.createElement("div", {
    className: "space-y-2"
  }, React.createElement(React.Fragment, null, weekBirthdays.map(t => React.createElement("div", {
    key: t.id,
    className: "p-3 bg-blue-50 rounded-lg"
  }, React.createElement("div", {
    className: "font-semibold"
  }, "\uD83C\uDF82 ", t.name), React.createElement("div", {
    className: "text-sm text-gray-600"
  }, new Date(t.dob).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  })))), weekAnniversaries.map(t => React.createElement("div", {
    key: t.id,
    className: "p-3 bg-green-50 rounded-lg"
  }, React.createElement("div", {
    className: "font-semibold"
  }, "\uD83C\uDF89 ", t.name), React.createElement("div", {
    className: "text-sm text-gray-600"
  }, "Work Anniversary")))))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "This Month - Birthdays"), monthBirthdays.length === 0 ? React.createElement("p", {
    className: "text-gray-500"
  }, "No birthdays") : React.createElement("div", {
    className: "space-y-2 max-h-96 overflow-y-auto"
  }, monthBirthdays.map(t => React.createElement("div", {
    key: t.id,
    className: "p-3 bg-gray-50 rounded-lg"
  }, React.createElement("div", {
    className: "font-semibold"
  }, t.name), React.createElement("div", {
    className: "text-sm text-gray-600"
  }, new Date(t.dob).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  })))))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "This Month - Anniversaries"), monthAnniversaries.length === 0 ? React.createElement("p", {
    className: "text-gray-500"
  }, "No anniversaries") : React.createElement("div", {
    className: "space-y-2 max-h-96 overflow-y-auto"
  }, monthAnniversaries.map(t => {
    const years = new Date().getFullYear() - new Date(t.joiningDate).getFullYear();
    return React.createElement("div", {
      key: t.id,
      className: "p-3 bg-gray-50 rounded-lg"
    }, React.createElement("div", {
      className: "font-semibold"
    }, t.name), React.createElement("div", {
      className: "text-sm text-gray-600"
    }, years, " Years"));
  })))));
}
function StudentManagement({
  students,
  isSuperAdmin = true,
  isDirector = false,
  accessibleSchools = SCHOOLS
}) {
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [form, setForm] = useState({
    school: '',
    grade: '',
    name: '',
    gender: '',
    id: ''
  });
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [filterSchool, setFilterSchool] = useState('All');
  const [filterGrade, setFilterGrade] = useState('All');
  const [selectAll, setSelectAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef(null);
  const updateIdFileRef = useRef(null);
  const hasFullDataAccess = isSuperAdmin || isDirector;
  const availableSchools = hasFullDataAccess ? SCHOOLS : accessibleSchools;
  const filteredStudents = students.filter(s => {
    if (!hasFullDataAccess && !accessibleSchools.includes(s.school)) return false;
    if (filterSchool !== 'All' && s.school !== filterSchool) return false;
    if (filterGrade !== 'All' && s.grade !== filterGrade) return false;
    if (searchQuery && !s.name?.toLowerCase().includes(searchQuery.toLowerCase()) && !s.id?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  }).sort((a, b) => a.name.localeCompare(b.name));
  const handleSave = async () => {
    if (!form.school || !form.grade || !form.name || !form.gender || !form.id) {
      alert('⚠️ Please fill all required fields:\n\n• School\n• Student ID\n• Grade\n• Name\n• Gender');
      return;
    }
    try {
      const newDocId = `${form.school.replace(/\s+/g, '_')}_${form.id}`;
      if (editingStudent) {
        const oldDocId = `${editingStudent.school.replace(/\s+/g, '_')}_${editingStudent.id}`;
        console.log('📝 Editing student:');
        console.log('  Old Doc ID:', oldDocId);
        console.log('  New Doc ID:', newDocId);
        if (newDocId !== oldDocId) {
          console.log('🔄 ID or School changed - need to delete old doc');
          const existingDoc = await db.collection('students').doc(newDocId).get();
          if (existingDoc.exists) {
            alert('❌ This Student ID already exists in this school!\n\nPlease use a different Student ID.');
            return;
          }
          console.log('🗑️ Deleting old document:', oldDocId);
          await db.collection('students').doc(oldDocId).delete();
        }
        console.log('💾 Saving to:', newDocId);
        await db.collection('students').doc(newDocId).set({
          school: form.school,
          grade: form.grade,
          name: form.name,
          gender: form.gender,
          id: form.id,
          updatedAt: new Date().toISOString()
        });
        alert('✅ Student updated successfully!');
      } else {
        console.log('➕ Adding new student:', newDocId);
        const existingDoc = await db.collection('students').doc(newDocId).get();
        if (existingDoc.exists) {
          alert('❌ This Student ID already exists!\n\nStudent ID: ' + form.id + '\nSchool: ' + form.school);
          return;
        }
        await db.collection('students').doc(newDocId).set({
          school: form.school,
          grade: form.grade,
          name: form.name,
          gender: form.gender,
          id: form.id,
          createdAt: new Date().toISOString()
        });
        alert('✅ Student added successfully!\n\n📝 Login Details:\nStudent ID: ' + form.id + '\nPassword: pass123');
      }
      setShowModal(false);
      setEditingStudent(null);
      setForm({
        school: '',
        grade: '',
        name: '',
        gender: '',
        id: ''
      });
      console.log('🔄 Reloading page...');
      setTimeout(() => window.location.reload(), 500);
    } catch (e) {
      console.error('❌ Save error:', e);
      alert('Failed to save student:\n\n' + e.message);
    }
  };
  const openAddModal = () => {
    setEditingStudent(null);
    setForm({
      school: '',
      grade: '',
      name: '',
      gender: '',
      id: ''
    });
    setShowModal(true);
  };
  const openEditModal = student => {
    console.log('Editing student:', student);
    setEditingStudent(student);
    setForm({
      school: student.school,
      grade: student.grade,
      name: student.name,
      gender: student.gender,
      id: student.id
    });
    setShowModal(true);
  };
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedStudents([]);
      setSelectAll(false);
    } else {
      setSelectedStudents(filteredStudents.map(s => s.docId));
      setSelectAll(true);
    }
  };
  const handleSelectStudent = studentId => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };
  const handleBulkDelete = async () => {
    if (selectedStudents.length === 0) {
      alert('Please select students to delete');
      return;
    }
    if (!confirm(`Delete ${selectedStudents.length} selected students?`)) return;
    try {
      const batch = db.batch();
      selectedStudents.forEach(id => {
        batch.delete(db.collection('students').doc(id));
      });
      await batch.commit();
      alert(`${selectedStudents.length} students deleted!`);
      setSelectedStudents([]);
      setSelectAll(false);
      window.location.reload();
    } catch (e) {
      alert('Failed: ' + e.message);
    }
  };
  const handleBulkUpdateSchool = async () => {
    if (selectedStudents.length === 0) {
      alert('Please select students first');
      return;
    }
    const newSchool = prompt('Enter new school name:');
    if (!newSchool || !SCHOOLS.includes(newSchool)) {
      alert('Invalid school name');
      return;
    }
    if (!confirm(`Update school to "${newSchool}" for ${selectedStudents.length} students?`)) return;
    try {
      const batch = db.batch();
      selectedStudents.forEach(id => {
        batch.update(db.collection('students').doc(id), {
          school: newSchool,
          updatedAt: new Date().toISOString()
        });
      });
      await batch.commit();
      alert(`${selectedStudents.length} students updated!`);
      setSelectedStudents([]);
      setSelectAll(false);
    } catch (e) {
      alert('Failed: ' + e.message);
    }
  };
  const handleBulkUpdateGrade = async () => {
    if (selectedStudents.length === 0) {
      alert('Please select students first');
      return;
    }
    const newGrade = prompt('Enter new grade (11 or 12):');
    if (!newGrade || !['11', '12'].includes(newGrade)) {
      alert('Invalid grade. Must be 11 or 12');
      return;
    }
    if (!confirm(`Update grade to "${newGrade}" for ${selectedStudents.length} students?`)) return;
    try {
      const batch = db.batch();
      selectedStudents.forEach(id => {
        batch.update(db.collection('students').doc(id), {
          grade: newGrade,
          updatedAt: new Date().toISOString()
        });
      });
      await batch.commit();
      alert(`${selectedStudents.length} students updated!`);
      setSelectedStudents([]);
      setSelectAll(false);
    } catch (e) {
      alert('Failed: ' + e.message);
    }
  };
  const handleCSVImport = e => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      complete: async results => {
        try {
          const rows = results.data;
          if (rows.length < 2) {
            alert('CSV file is empty');
            return;
          }
          let imported = 0;
          let skipped = 0;
          const errors = [];
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const school = row[0] ? row[0].trim() : '';
            const studentId = row[1] ? row[1].trim() : '';
            const grade = row[2] ? row[2].trim() : '';
            const name = row[3] ? row[3].trim() : '';
            const gender = row[4] ? row[4].trim() : '';
            if (!school || !studentId || !grade || !name || !gender) {
              errors.push(`Row ${i + 1}: Missing required fields`);
              skipped++;
              continue;
            }
            const existingSnap = await db.collection('students').where('id', '==', studentId).limit(1).get();
            if (!existingSnap.empty) {
              errors.push(`Row ${i + 1}: Student ID "${studentId}" already exists`);
              skipped++;
              continue;
            }
            const docId = `${school.replace(/\s+/g, '_')}_${studentId}`;
            await db.collection('students').doc(docId).set({
              school,
              grade,
              name,
              gender,
              id: studentId,
              createdAt: new Date().toISOString()
            });
            imported++;
          }
          let message = `✅ Imported ${imported} students!`;
          if (skipped > 0) {
            message += `\n⚠️ Skipped ${skipped} students`;
            if (errors.length > 0) {
              message += '\n\nErrors:\n' + errors.slice(0, 5).join('\n');
              if (errors.length > 5) message += `\n... and ${errors.length - 5} more`;
            }
          }
          message += '\n\n📝 Students can login with:\nStudent ID + Password: pass123';
          alert(message);
          if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (e) {
          alert('Import failed: ' + e.message);
        }
      },
      error: () => alert('Failed to parse CSV')
    });
  };
  const handleBulkUpdateIDs = e => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      complete: async results => {
        try {
          const rows = results.data;
          if (rows.length < 2) {
            alert('CSV file is empty');
            return;
          }
          let updated = 0;
          let notFound = 0;
          const errors = [];
          const updateLog = [];
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const schoolName = row[0] ? row[0].trim() : '';
            const studentName = row[1] ? row[1].trim() : '';
            const grade = row[2] ? row[2].trim() : '';
            const newStudentId = row[3] ? row[3].trim() : '';
            if (!schoolName || !studentName || !grade || !newStudentId) {
              errors.push(`Row ${i + 1}: Missing required fields (School, Name, Grade, Student ID)`);
              notFound++;
              continue;
            }
            const querySnap = await db.collection('students').where('school', '==', schoolName).where('name', '==', studentName).where('grade', '==', grade).limit(1).get();
            if (querySnap.empty) {
              errors.push(`Row ${i + 1}: Student "${studentName}" not found in ${schoolName}, Grade ${grade}`);
              notFound++;
              continue;
            }
            const studentDoc = querySnap.docs[0];
            const oldId = studentDoc.data().id || '(blank)';
            await studentDoc.ref.update({
              id: newStudentId,
              updatedAt: new Date().toISOString()
            });
            updated++;
            updateLog.push(`✅ ${studentName} (${schoolName}): ${oldId} → ${newStudentId}`);
          }
          let message = `✅ Updated ${updated} Student IDs!`;
          if (notFound > 0) {
            message += `\n⚠️ ${notFound} students not found`;
          }
          if (updateLog.length > 0) {
            message += '\n\n📝 Updates:\n' + updateLog.slice(0, 10).join('\n');
            if (updateLog.length > 10) message += `\n... and ${updateLog.length - 10} more`;
          }
          if (errors.length > 0) {
            message += '\n\n❌ Errors:\n' + errors.slice(0, 5).join('\n');
            if (errors.length > 5) message += `\n... and ${errors.length - 5} more`;
          }
          alert(message);
          if (updateIdFileRef.current) updateIdFileRef.current.value = '';
          window.location.reload();
        } catch (e) {
          alert('Update failed: ' + e.message);
        }
      },
      error: () => alert('Failed to parse CSV')
    });
  };
  const handleDelete = async student => {
    if (!confirm(`⚠️ Delete ${student.name}?\n\nStudent ID: ${student.id}\nSchool: ${student.school}\n\nThis action cannot be undone!`)) return;
    try {
      console.log('=== DELETE ATTEMPT ===');
      console.log('Student object:', student);
      const formats = [`${student.school.replace(/\s+/g, '_')}_${student.id}`, `${student.school}_${student.id}`, student.docId];
      console.log('Trying document IDs:', formats);
      let deleted = false;
      for (const docId of formats) {
        if (!docId) continue;
        const docRef = db.collection('students').doc(docId);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          console.log('✅ Found document:', docId);
          await docRef.delete();
          deleted = true;
          break;
        } else {
          console.log('❌ Not found:', docId);
        }
      }
      if (deleted) {
        alert('✅ Student deleted successfully!');
        window.location.reload();
      } else {
        alert('❌ Error: Could not find student document.\n\nPlease contact support.');
        console.error('Tried formats:', formats);
      }
    } catch (e) {
      console.error('Delete error:', e);
      alert('Failed to delete:\n\n' + e.message);
    }
  };
  const handleExport = () => {
    const exportData = students.map(s => ({
      School: s.school,
      'Student ID': s.id,
      Grade: s.grade,
      Name: s.name,
      Gender: s.gender
    }));
    exportToExcel(exportData, 'students_list');
  };
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("div", {
    className: "flex justify-between items-center flex-wrap gap-4"
  }, React.createElement("div", null, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "Student Management"), !isSuperAdmin && React.createElement("p", {
    className: "text-sm text-gray-500 mt-1"
  }, "\uD83D\uDC41\uFE0F View Only Mode - Contact Super Admin for modifications")), React.createElement("div", {
    className: "flex gap-3 flex-wrap"
  }, isSuperAdmin && React.createElement(React.Fragment, null, React.createElement("button", {
    onClick: openAddModal,
    className: "px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold"
  }, "+ Add Student"), React.createElement("label", {
    className: "px-6 py-3 bg-green-600 text-white rounded-xl font-semibold cursor-pointer"
  }, "\uD83D\uDCE4 Import CSV", React.createElement("input", {
    ref: fileInputRef,
    type: "file",
    accept: ".csv",
    onChange: handleCSVImport,
    className: "hidden"
  })), React.createElement("label", {
    className: "px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold cursor-pointer"
  }, "\uD83D\uDD04 Update Student IDs", React.createElement("input", {
    ref: updateIdFileRef,
    type: "file",
    accept: ".csv",
    onChange: handleBulkUpdateIDs,
    className: "hidden"
  }))), React.createElement("button", {
    onClick: handleExport,
    className: "px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold"
  }, "\uD83D\uDCE5 Export"))), isSuperAdmin && selectedStudents.length > 0 && React.createElement("div", {
    className: "bg-blue-50 border-2 border-blue-300 p-4 rounded-xl"
  }, React.createElement("div", {
    className: "flex justify-between items-center"
  }, React.createElement("div", {
    className: "font-bold text-blue-800"
  }, selectedStudents.length, " student(s) selected"), React.createElement("div", {
    className: "flex gap-2"
  }, React.createElement("button", {
    onClick: handleBulkUpdateSchool,
    className: "px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold"
  }, "\uD83C\uDFEB Change School"), React.createElement("button", {
    onClick: handleBulkUpdateGrade,
    className: "px-4 py-2 bg-green-600 text-white rounded-lg font-semibold"
  }, "\uD83D\uDCDA Change Grade"), React.createElement("button", {
    onClick: handleBulkDelete,
    className: "px-4 py-2 bg-red-600 text-white rounded-lg font-semibold"
  }, "\uD83D\uDDD1\uFE0F Delete Selected"), React.createElement("button", {
    onClick: () => {
      setSelectedStudents([]);
      setSelectAll(false);
    },
    className: "px-4 py-2 bg-gray-400 text-white rounded-lg font-semibold"
  }, "Cancel")))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "\uD83D\uDD0D Filters & Search"), React.createElement("div", {
    className: "grid md:grid-cols-3 gap-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Search"), React.createElement("input", {
    type: "text",
    value: searchQuery,
    onChange: e => setSearchQuery(e.target.value),
    placeholder: "Search by name or ID...",
    className: "w-full border-2 px-4 py-3 rounded-xl"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "School"), React.createElement("select", {
    value: filterSchool,
    onChange: e => {
      setFilterSchool(e.target.value);
      setSelectedStudents([]);
      setSelectAll(false);
    },
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
    onChange: e => {
      setFilterGrade(e.target.value);
      setSelectedStudents([]);
      setSelectAll(false);
    },
    className: "w-full border-2 px-4 py-3 rounded-xl"
  }, React.createElement("option", {
    value: "All"
  }, "All Grades"), React.createElement("option", {
    value: "11"
  }, "Class 11"), React.createElement("option", {
    value: "12"
  }, "Class 12"))))), React.createElement("div", {
    className: "grid grid-cols-3 gap-4"
  }, React.createElement("div", {
    className: "bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl shadow-lg"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Total Students"), React.createElement("div", {
    className: "text-3xl font-bold"
  }, filteredStudents.length), React.createElement("div", {
    className: "text-xs opacity-75 mt-1"
  }, "Filtered results")), React.createElement("div", {
    className: "bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 rounded-xl shadow-lg"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Male"), React.createElement("div", {
    className: "text-3xl font-bold"
  }, filteredStudents.filter(s => s.gender === 'Male').length), React.createElement("div", {
    className: "text-xs opacity-75 mt-1"
  }, filteredStudents.length > 0 ? Math.round(filteredStudents.filter(s => s.gender === 'Male').length / filteredStudents.length * 100) : 0, "%")), React.createElement("div", {
    className: "bg-gradient-to-r from-pink-500 to-rose-600 text-white p-4 rounded-xl shadow-lg"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Female"), React.createElement("div", {
    className: "text-3xl font-bold"
  }, filteredStudents.filter(s => s.gender === 'Female').length), React.createElement("div", {
    className: "text-xs opacity-75 mt-1"
  }, filteredStudents.length > 0 ? Math.round(filteredStudents.filter(s => s.gender === 'Female').length / filteredStudents.length * 100) : 0, "%"))), isSuperAdmin && React.createElement(React.Fragment, null, React.createElement("div", {
    className: "bg-white p-4 rounded-xl border-2 border-gray-200"
  }, React.createElement("p", {
    className: "text-sm text-gray-600"
  }, React.createElement("strong", null, "\uD83D\uDCCB Import New Students CSV Format (5 columns):"), React.createElement("br", null), "School Name, Student ID, Grade, Student Name, Gender", React.createElement("br", null), React.createElement("br", null), React.createElement("strong", null, "\u2705 Example Row:"), React.createElement("br", null), "CoE Barwani, STU001, 11, Raj Kumar, Male", React.createElement("br", null), React.createElement("br", null), React.createElement("strong", null, "\uD83D\uDD10 Login Info:"), " Students use their Student ID + Password: ", React.createElement("span", {
    className: "font-mono bg-yellow-100 px-2 py-1 rounded"
  }, "pass123"))), React.createElement("div", {
    className: "bg-orange-50 p-4 rounded-xl border-2 border-orange-300"
  }, React.createElement("p", {
    className: "text-sm text-gray-600"
  }, React.createElement("strong", null, "\uD83D\uDD04 Update Student IDs CSV Format (4 columns):"), React.createElement("br", null), "School Name, Student Name, Grade, Student ID", React.createElement("br", null), React.createElement("br", null), React.createElement("strong", null, "\u2705 Example Row:"), React.createElement("br", null), "CoE Bundi, Aaditya Raj Dhawan, Class 12, 2754059028", React.createElement("br", null), React.createElement("br", null), React.createElement("strong", null, "\u26A1 How it works:"), " System finds existing student by matching School + Name + Grade, then updates only the Student ID field."))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg overflow-x-auto"
  }, React.createElement("h3", {
    className: "font-bold mb-4"
  }, "Showing ", filteredStudents.length, " of ", students.length, " Students"), React.createElement("table", {
    className: "w-full"
  }, React.createElement("thead", {
    className: "avanti-gradient-light"
  }, React.createElement("tr", null, isSuperAdmin && React.createElement("th", {
    className: "p-3"
  }, React.createElement("input", {
    type: "checkbox",
    checked: selectAll && filteredStudents.length > 0,
    onChange: handleSelectAll,
    className: "cursor-pointer"
  })), React.createElement("th", {
    className: "p-3 text-left"
  }, "School"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Student ID"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Grade"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Name"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Gender"), isSuperAdmin && React.createElement("th", {
    className: "p-3 text-left"
  }, "Actions"))), React.createElement("tbody", null, filteredStudents.length === 0 ? React.createElement("tr", null, React.createElement("td", {
    colSpan: isSuperAdmin ? "7" : "5",
    className: "p-8 text-center text-gray-500"
  }, "No students found")) : filteredStudents.map(s => React.createElement("tr", {
    key: s.docId,
    className: `border-b hover:bg-gray-50 ${selectedStudents.includes(s.docId) ? 'bg-blue-50' : ''}`
  }, isSuperAdmin && React.createElement("td", {
    className: "p-3"
  }, React.createElement("input", {
    type: "checkbox",
    checked: selectedStudents.includes(s.docId),
    onChange: () => handleSelectStudent(s.docId),
    className: "cursor-pointer"
  })), React.createElement("td", {
    className: "p-3"
  }, s.school), React.createElement("td", {
    className: "p-3"
  }, React.createElement("span", {
    className: "font-mono bg-blue-100 px-2 py-1 rounded font-bold"
  }, s.id)), React.createElement("td", {
    className: "p-3"
  }, "Class ", s.grade), React.createElement("td", {
    className: "p-3 font-semibold"
  }, s.name), React.createElement("td", {
    className: "p-3"
  }, s.gender), isSuperAdmin && React.createElement("td", {
    className: "p-3"
  }, React.createElement("div", {
    className: "flex gap-2"
  }, React.createElement("button", {
    onClick: () => openEditModal(s),
    className: "px-3 py-1 bg-yellow-400 rounded-lg font-semibold"
  }, "Edit"), React.createElement("button", {
    onClick: () => handleDelete(s),
    className: "px-3 py-1 bg-red-500 text-white rounded-lg font-semibold"
  }, "Delete")))))))), isSuperAdmin && showModal && React.createElement("div", {
    className: "modal-overlay",
    onClick: () => {
      setShowModal(false);
      setEditingStudent(null);
    }
  }, React.createElement("div", {
    className: "modal-content",
    onClick: e => e.stopPropagation()
  }, React.createElement("h3", {
    className: "text-2xl font-bold mb-4"
  }, editingStudent ? 'Edit Student' : 'Add New Student'), React.createElement("div", {
    className: "space-y-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-1"
  }, "School *"), React.createElement("select", {
    value: form.school,
    onChange: e => setForm({
      ...form,
      school: e.target.value
    }),
    className: "w-full border-2 px-3 py-2 rounded-lg"
  }, React.createElement("option", {
    value: ""
  }, "Select"), SCHOOLS.map(s => React.createElement("option", {
    key: s,
    value: s
  }, s)))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-1"
  }, "Student ID * (For Login)"), React.createElement("input", {
    type: "text",
    value: form.id,
    onChange: e => setForm({
      ...form,
      id: e.target.value
    }),
    placeholder: "e.g., STU001",
    className: "w-full border-2 px-3 py-2 rounded-lg"
  }), React.createElement("p", {
    className: "text-xs text-gray-600 mt-1"
  }, "This will be used for student login")), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-1"
  }, "Grade *"), React.createElement("select", {
    value: form.grade,
    onChange: e => setForm({
      ...form,
      grade: e.target.value
    }),
    className: "w-full border-2 px-3 py-2 rounded-lg"
  }, React.createElement("option", {
    value: ""
  }, "Select"), React.createElement("option", {
    value: "11"
  }, "Class 11"), React.createElement("option", {
    value: "12"
  }, "Class 12"))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-1"
  }, "Name *"), React.createElement("input", {
    type: "text",
    value: form.name,
    onChange: e => setForm({
      ...form,
      name: e.target.value
    }),
    className: "w-full border-2 px-3 py-2 rounded-lg"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-1"
  }, "Gender *"), React.createElement("select", {
    value: form.gender,
    onChange: e => setForm({
      ...form,
      gender: e.target.value
    }),
    className: "w-full border-2 px-3 py-2 rounded-lg"
  }, React.createElement("option", {
    value: ""
  }, "Select"), GENDERS.map(g => React.createElement("option", {
    key: g,
    value: g
  }, g)))), !editingStudent && React.createElement("div", {
    className: "bg-blue-50 border-2 border-blue-300 p-3 rounded-lg"
  }, React.createElement("p", {
    className: "text-sm text-blue-800"
  }, React.createElement("strong", null, "\uD83D\uDD10 Login Credentials:"), React.createElement("br", null), "Student ID: ", React.createElement("span", {
    className: "font-mono"
  }, form.id || '(will be generated)'), React.createElement("br", null), "Password: ", React.createElement("span", {
    className: "font-mono bg-yellow-100 px-2 py-1 rounded"
  }, "pass123"))), React.createElement("div", {
    className: "flex gap-3"
  }, React.createElement("button", {
    onClick: handleSave,
    className: "flex-1 avanti-gradient text-white py-3 rounded-xl font-semibold"
  }, "Save"), React.createElement("button", {
    onClick: () => {
      setShowModal(false);
      setEditingStudent(null);
      setForm({
        school: '',
        grade: '',
        name: '',
        gender: '',
        id: ''
      });
    },
    className: "flex-1 bg-gray-300 py-3 rounded-xl font-semibold"
  }, "Cancel"))))));
}
function TeacherAttendanceDashboard({
  currentUser,
  students,
  teachers,
  studentAttendance,
  teacherAttendance
}) {
  const [filterGrade, setFilterGrade] = useState('All');
  const today = getTodayDate();
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const mySchool = currentUser.school;
  const chart1Ref = useRef(null);
  const chart2Ref = useRef(null);
  const chartInstances = useRef({});
  const filteredStudentAttendance = useMemo(() => {
    return studentAttendance.filter(a => {
      if (a.school !== mySchool) return false;
      if (filterGrade !== 'All' && a.grade !== filterGrade) return false;
      if (a.date < startDate || a.date > endDate) return false;
      return true;
    });
  }, [studentAttendance, mySchool, filterGrade, startDate, endDate]);
  const dailyStats = useMemo(() => {
    const stats = {};
    filteredStudentAttendance.forEach(a => {
      if (!stats[a.date]) {
        stats[a.date] = {
          present: 0,
          absent: 0
        };
      }
      if (a.status === 'Present') {
        stats[a.date].present++;
      } else {
        stats[a.date].absent++;
      }
    });
    return stats;
  }, [filteredStudentAttendance]);
  const gradeStats = useMemo(() => {
    const stats = {
      '11': {
        present: 0,
        absent: 0
      },
      '12': {
        present: 0,
        absent: 0
      }
    };
    filteredStudentAttendance.forEach(a => {
      if (stats[a.grade]) {
        if (a.status === 'Present') {
          stats[a.grade].present++;
        } else {
          stats[a.grade].absent++;
        }
      }
    });
    return stats;
  }, [filteredStudentAttendance]);
  useEffect(() => {
    Object.values(chartInstances.current).forEach(chart => {
      if (chart) chart.destroy();
    });
    chartInstances.current = {};
    if (chart1Ref.current) {
      const ctx = chart1Ref.current.getContext('2d');
      const dates = Object.keys(dailyStats).sort();
      chartInstances.current.chart1 = new Chart(ctx, {
        type: 'line',
        data: {
          labels: dates.map(d => new Date(d).getDate() + '/' + String(new Date(d).getMonth() + 1)),
          datasets: [{
            label: 'Present',
            data: dates.map(d => dailyStats[d].present),
            borderColor: '#10B981',
            backgroundColor: 'rgba(16,185,129,0.1)',
            tension: 0.4,
            fill: true
          }, {
            label: 'Absent',
            data: dates.map(d => dailyStats[d].absent),
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239,68,68,0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Daily Student Attendance Trend',
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
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
    if (chart2Ref.current) {
      const ctx = chart2Ref.current.getContext('2d');
      chartInstances.current.chart2 = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Class 11', 'Class 12'],
          datasets: [{
            label: 'Present',
            data: [gradeStats['11'].present, gradeStats['12'].present],
            backgroundColor: '#10B981'
          }, {
            label: 'Absent',
            data: [gradeStats['11'].absent, gradeStats['12'].absent],
            backgroundColor: '#EF4444'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Grade-wise Attendance',
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
            y: {
              beginAtZero: true
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
  }, [dailyStats, gradeStats]);
  const [exportingStudents, setExportingStudents] = React.useState(false);
  const handleExportStudents = async () => {
    setExportingStudents(true);
    try {
      const snap = await db.collection('studentAttendance').where('school', '==', mySchool).where('date', '>=', startDate).where('date', '<=', endDate).get();
      let records = snap.docs.map(d => d.data());
      if (filterGrade !== 'All') records = records.filter(a => a.grade === filterGrade);
      records.sort((a, b) => a.date.localeCompare(b.date));
      if (!records.length) { alert('No student records found for this period.'); setExportingStudents(false); return; }
      exportToExcel(records.map(a => ({ Date: a.date, Grade: a.grade, 'Student Name': a.studentName, Status: a.status, Remarks: a.remarks || '', 'Marked By': a.markedBy })), `student_attendance_${mySchool}_${startDate}_to_${endDate}`);
    } catch (err) { alert('Export failed: ' + err.message); }
    setExportingStudents(false);
  };
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("div", {
    className: "flex justify-between items-center"
  }, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "📊 Attendance Dashboard - ", mySchool)), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "🔍 Filters"), React.createElement("div", {
    className: "grid md:grid-cols-4 gap-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Student Grade"), React.createElement("select", {
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
  }, "Start Date"), React.createElement("input", {
    type: "date",
    value: startDate,
    onChange: e => setStartDate(e.target.value),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "End Date"), React.createElement("input", {
    type: "date",
    value: endDate,
    onChange: e => setEndDate(e.target.value),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  }))), React.createElement("div", {
    className: "flex gap-3 mt-4"
  }, React.createElement("button", {
    onClick: handleExportStudents,
    className: "px-6 py-3 bg-green-600 text-white rounded-xl font-semibold"
  }, "📥 Export Student Attendance"))), React.createElement("div", {
    className: "grid grid-cols-2 md:grid-cols-4 gap-4"
  }, React.createElement("div", {
    className: "stat-card bg-green-500 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Students Present"), React.createElement("div", {
    className: "text-4xl font-bold"
  }, filteredStudentAttendance.filter(a => a.status === 'Present').length)), React.createElement("div", {
    className: "stat-card bg-red-500 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Students Absent"), React.createElement("div", {
    className: "text-4xl font-bold"
  }, filteredStudentAttendance.filter(a => a.status === 'Absent').length))), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-6"
  }, React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg",
    style: {
      height: '350px'
    }
  }, React.createElement("canvas", {
    ref: chart1Ref
  })), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg",
    style: {
      height: '350px'
    }
  }, React.createElement("canvas", {
    ref: chart2Ref
  }))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "📋 Recent Student Attendance"), React.createElement("div", {
    className: "overflow-x-auto max-h-96"
  }, React.createElement("table", {
    className: "w-full"
  }, React.createElement("thead", {
    className: "avanti-gradient-light sticky top-0"
  }, React.createElement("tr", null, React.createElement("th", {
    className: "p-3 text-left"
  }, "Date"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Grade"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Student"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Status"))), React.createElement("tbody", null, filteredStudentAttendance.slice(0, 50).map((a, idx) => React.createElement("tr", {
    key: idx,
    className: "border-b hover:bg-gray-50"
  }, React.createElement("td", {
    className: "p-3 text-sm"
  }, a.date), React.createElement("td", {
    className: "p-3"
  }, a.grade), React.createElement("td", {
    className: "p-3 font-semibold"
  }, a.studentName), React.createElement("td", {
    className: "p-3"
  }, React.createElement("span", {
    className: `px-2 py-1 rounded-full text-xs font-bold ${a.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`
  }, a.status)))))))));
}

function RemarksModal({
  student,
  onSave,
  onClose
}) {
  const [selectedRemark, setSelectedRemark] = useState('Sick Leave');
  const [customRemark, setCustomRemark] = useState('');
  const ABSENCE_REASONS = ['Sick Leave', 'Went Home for Festival', 'Family Emergency', 'Medical Appointment', 'Personal Reason', 'Staff Ward', 'Others'];
  const handleSave = () => {
    const finalRemark = selectedRemark === 'Others' ? customRemark : selectedRemark;
    if (selectedRemark === 'Others' && !customRemark.trim()) {
      alert('Please enter a custom reason');
      return;
    }
    onSave(finalRemark);
  };
  return React.createElement("div", {
    className: "modal-overlay",
    onClick: onClose
  }, React.createElement("div", {
    className: "modal-content",
    onClick: e => e.stopPropagation()
  }, React.createElement("h3", {
    className: "text-2xl font-bold mb-4"
  }, "\uD83D\uDCDD Absence Remarks"), React.createElement("p", {
    className: "text-gray-600 mb-4"
  }, "Student: ", React.createElement("strong", null, student.name)), React.createElement("div", {
    className: "space-y-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Reason for Absence *"), React.createElement("select", {
    value: selectedRemark,
    onChange: e => setSelectedRemark(e.target.value),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  }, ABSENCE_REASONS.map(reason => React.createElement("option", {
    key: reason,
    value: reason
  }, reason)))), selectedRemark === 'Others' && React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Please Specify *"), React.createElement("textarea", {
    value: customRemark,
    onChange: e => setCustomRemark(e.target.value),
    className: "w-full border-2 px-4 py-3 rounded-xl",
    rows: "3",
    placeholder: "Enter custom reason..."
  })), React.createElement("div", {
    className: "flex gap-3 mt-6"
  }, React.createElement("button", {
    onClick: handleSave,
    className: "flex-1 bg-red-500 text-white py-3 rounded-xl font-semibold"
  }, "Mark Absent"), React.createElement("button", {
    onClick: onClose,
    className: "flex-1 bg-gray-300 py-3 rounded-xl font-semibold"
  }, "Cancel")))));
}
function showAttendanceSavedToast(message, type) {
  const existing = document.getElementById('attToast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.id = 'attToast';
  const colors = {
    success: 'background:#16a34a;color:white',
    warning: 'background:#d97706;color:white',
    error: 'background:#dc2626;color:white'
  };
  toast.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);${colors[type]||colors.success};padding:12px 24px;border-radius:12px;font-size:15px;font-weight:600;z-index:99999;box-shadow:0 4px 20px rgba(0,0,0,0.3);transition:opacity 0.4s`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 2500);
}
function StudentAttendanceView({
  currentUser,
  students,
  studentAttendance
}) {
  const [selectedGrade, setSelectedGrade] = useState('11');
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [attendanceMap, setAttendanceMap] = useState({});
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [lockStatus, setLockStatus] = useState({
    11: false,
    12: false
  });
  const [lockInfo, setLockInfo] = useState({
    11: null,
    12: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [markingProgress, setMarkingProgress] = useState({
    current: 0,
    total: 0
  });
  const isLocked = lockStatus[selectedGrade] || false;
  const currentLockInfo = lockInfo[selectedGrade] || null;
  const mySchool = currentUser.school;
  const normalizeSchool = school => (school || '').toString().trim().toLowerCase();
  const mySchoolNormalized = normalizeSchool(mySchool);
  const filteredStudents = students.filter(s => {
    const studentSchoolNormalized = normalizeSchool(s.school);
    const gradeMatches = String(s.grade) === String(selectedGrade);
    const schoolMatches = studentSchoolNormalized === mySchoolNormalized;
    return schoolMatches && gradeMatches;
  }).sort((a, b) => a.name.localeCompare(b.name));
  console.log('StudentAttendanceView Debug:', {
    mySchool,
    mySchoolNormalized,
    selectedGrade,
    totalStudents: students.length,
    filteredCount: filteredStudents.length,
    allSchools: Array.from(new Set(students.map(s => s.school))),
    allGrades: Array.from(new Set(students.map(s => s.grade))),
    sampleStudents: students.slice(0, 3).map(s => ({
      school: s.school,
      grade: s.grade,
      name: s.name
    }))
  });
  useEffect(() => {
    const map = {};
    studentAttendance.filter(a => a.date === selectedDate && a.school === mySchool && a.grade === selectedGrade).forEach(a => {
      map[a.studentId] = a.status;
    });
    setAttendanceMap(map);
    checkAllLocks();
  }, [selectedDate, mySchool, studentAttendance]);
  useEffect(() => {
    const map = {};
    studentAttendance.filter(a => a.date === selectedDate && a.school === mySchool && a.grade === selectedGrade).forEach(a => {
      map[a.studentId] = a.status;
    });
    setAttendanceMap(map);
  }, [selectedGrade]);
  const checkAllLocks = async () => {
    try {
      const newLockStatus = {
        11: false,
        12: false
      };
      const newLockInfo = {
        11: null,
        12: null
      };
      for (const grade of ['11', '12']) {
        const lockId = `${mySchool}_${grade}_${selectedDate}`;
        const lockDoc = await db.collection('attendanceLocks').doc(lockId).get();
        if (lockDoc.exists) {
          newLockStatus[grade] = true;
          newLockInfo[grade] = lockDoc.data();
        }
      }
      setLockStatus(newLockStatus);
      setLockInfo(newLockInfo);
    } catch (e) {
      console.error('Error checking locks:', e);
    }
  };
  const lockAttendance = async () => {
    const confirmation = confirm(`Are you sure you want to lock attendance for Class ${selectedGrade} on ${selectedDate}?\n\nOnce locked:\n- No teacher can mark or change attendance for Class ${selectedGrade}\n- Only admins can unlock it\n\nThis prevents duplicate entries.`);
    if (!confirmation) return;
    try {
      setIsLoading(true);
      const lockId = `${mySchool}_${selectedGrade}_${selectedDate}`;
      await db.collection('attendanceLocks').doc(lockId).set({
        school: mySchool,
        grade: selectedGrade,
        date: selectedDate,
        lockedBy: currentUser.afid,
        lockedAt: new Date().toISOString(),
        lockedByName: currentUser.name || currentUser.afid
      });
      alert(`✅ Attendance locked for Class ${selectedGrade}!\n\nNo one can modify attendance for Class ${selectedGrade} on this date now.`);
      checkAllLocks();
    } catch (e) {
      alert('Failed to lock: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };
  const unlockAttendance = async () => {
    if (currentUser.role !== 'admin') {
      alert('Only admins can unlock attendance.');
      return;
    }
    const confirmation = confirm(`Are you sure you want to unlock attendance for Class ${selectedGrade}?\n\nTeachers will be able to mark/modify attendance for Class ${selectedGrade} again.`);
    if (!confirmation) return;
    try {
      setIsLoading(true);
      const lockId = `${mySchool}_${selectedGrade}_${selectedDate}`;
      await db.collection('attendanceLocks').doc(lockId).delete();
      alert(`✅ Attendance unlocked for Class ${selectedGrade}!`);
      checkAllLocks();
    } catch (e) {
      alert('Failed to unlock: ' + e.message);
    } finally {
      setIsLoading(false);
    }
  };
  const handleAttendanceChange = async (studentId, status, remarks = '') => {
    if (isLocked) {
      const lockedBy = currentLockInfo?.lockedByName || 'Unknown';
      const lockedAt = currentLockInfo?.lockedAt ? new Date(currentLockInfo.lockedAt).toLocaleString() : 'Unknown time';
      alert(`❌ Attendance is locked for Class ${selectedGrade} on this date!\n\n` + `Locked by: ${lockedBy}\n` + `Locked at: ${lockedAt}\n\n` + 'Contact admin to unlock.');
      return;
    }
    try {
      setAttendanceMap(prev => ({
        ...prev,
        [studentId]: status
      }));
      const docId = `${mySchool}_${selectedGrade}_${studentId}_${selectedDate}`;
      const attendanceData = {
        school: mySchool,
        grade: selectedGrade,
        studentId,
        studentName: filteredStudents.find(s => s.id === studentId)?.name || '',
        date: selectedDate,
        status,
        remarks: status === 'Absent' ? remarks : '',
        markedBy: currentUser.afid,
        markedAt: new Date().toISOString(),
        docId: docId
      };
      const isOnline = window.ConnectionManager ? window.ConnectionManager.isOnline() : window.isPWAOnline ? window.isPWAOnline() : navigator.onLine;
      let savedSuccessfully = false;
      if (!isOnline) {
        if (window.OfflineQueue) {
          window.OfflineQueue.add({
            type: 'attendance',
            docId: docId,
            data: attendanceData
          });
          console.log('📝 Attendance queued for offline sync:', docId);
        } else if (window.saveAttendanceOffline) {
          await window.saveAttendanceOffline(attendanceData);
        }
        if (window.showPWAToast) window.showPWAToast('Saved offline - will sync when online', 'warning');
        savedSuccessfully = true;
      } else {
        try {
          if (window.retryWithBackoff) {
            await window.retryWithBackoff(() => db.collection('studentAttendance').doc(docId).set(attendanceData), {
              maxRetries: 2,
              baseDelay: 500
            });
          } else {
            await db.collection('studentAttendance').doc(docId).set(attendanceData);
          }
          savedSuccessfully = true;
          console.log('✅ Attendance saved:', docId);
          showAttendanceSavedToast('✅ Saved!', 'success');
        } catch (firebaseError) {
          console.warn('Firebase save failed, queuing offline:', firebaseError.message);
          if (window.OfflineQueue) {
            window.OfflineQueue.add({
              type: 'attendance',
              docId: docId,
              data: attendanceData
            });
            savedSuccessfully = true;
            if (window.showPWAToast) window.showPWAToast('Network slow - saved locally', 'warning');
          } else {
            throw firebaseError;
          }
        }
      }
      if (savedSuccessfully && window.DataCacheManager) {
        try {
          const cacheKey = 'studentAttendance_' + (mySchool || 'all');
          const cachedData = await window.DataCacheManager.loadFromCache(cacheKey);
          if (cachedData?.docs) {
            const existingIndex = cachedData.docs.findIndex(d => d.id === docId);
            if (existingIndex >= 0) {
              cachedData.docs[existingIndex].data = attendanceData;
            } else {
              cachedData.docs.push({
                id: docId,
                data: attendanceData
              });
            }
            await window.DataCacheManager.saveToCache(cacheKey, cachedData);
            console.log('✅ Attendance cache updated for:', docId);
          }
        } catch (cacheErr) {
          console.log('Cache update skipped:', cacheErr.message);
        }
      }
    } catch (e) {
      try {
        const docId = `${mySchool}_${selectedGrade}_${studentId}_${selectedDate}`;
        const attendanceData = {
          school: mySchool,
          grade: selectedGrade,
          studentId,
          studentName: filteredStudents.find(s => s.id === studentId)?.name || '',
          date: selectedDate,
          status,
          remarks: status === 'Absent' ? remarks : '',
          markedBy: currentUser.afid,
          markedAt: new Date().toISOString(),
          docId: docId
        };
        if (window.OfflineQueue) {
          window.OfflineQueue.add({
            type: 'attendance',
            docId: docId,
            data: attendanceData
          });
          if (window.showPWAToast) window.showPWAToast('Saved locally - will sync later', 'warning');
        } else if (window.saveAttendanceOffline) {
          await window.saveAttendanceOffline(attendanceData);
          if (window.showPWAToast) window.showPWAToast('Network error - saved offline', 'warning');
        } else {
          throw e;
        }
      } catch (offlineErr) {
        setAttendanceMap(prev => ({
          ...prev,
          [studentId]: prev[studentId] || ''
        }));
        alert('Failed to save: ' + e.message);
      }
    }
  };
  const handleSelectAll = async () => {
    if (isLocked) {
      const lockedBy = lockInfo?.lockedByName || 'Unknown';
      const lockedAt = lockInfo?.lockedAt ? new Date(lockInfo.lockedAt).toLocaleString() : 'Unknown time';
      alert('❌ Attendance is locked for this date!\n\n' + `Locked by: ${lockedBy}\n` + `Locked at: ${lockedAt}\n\n` + 'Contact admin to unlock.');
      return;
    }
    setIsMarkingAll(true);
    setMarkingProgress({
      current: 0,
      total: filteredStudents.length
    });
    try {
      let completed = 0;
      for (const student of filteredStudents) {
        const docId = `${mySchool}_${selectedGrade}_${student.id}_${selectedDate}`;
        const attendanceData = {
          school: mySchool,
          grade: selectedGrade,
          studentId: student.id,
          studentName: student.name,
          date: selectedDate,
          status: 'Present',
          markedBy: currentUser.afid,
          markedAt: new Date().toISOString(),
          docId: docId
        };
        if (window.isPWAOnline && !window.isPWAOnline()) {
          await window.saveAttendanceOffline(attendanceData);
        } else {
          try {
            await db.collection('studentAttendance').doc(docId).set(attendanceData);
          } catch (err) {
            if (window.saveAttendanceOffline) {
              await window.saveAttendanceOffline(attendanceData);
            }
          }
        }
        completed++;
        setMarkingProgress({
          current: completed,
          total: filteredStudents.length
        });
      }
      if (window.isPWAOnline && !window.isPWAOnline()) {
        if (window.showPWAToast) window.showPWAToast(`${filteredStudents.length} students saved offline`, 'warning');
      }
      const newMap = {};
      filteredStudents.forEach(s => newMap[s.id] = 'Present');
      setAttendanceMap(newMap);
      showAttendanceSavedToast(`✅ All ${filteredStudents.length} students marked Present!`, 'success');
    } catch (e) {
      alert('Failed: ' + e.message);
    } finally {
      setIsMarkingAll(false);
      setMarkingProgress({
        current: 0,
        total: 0
      });
    }
  };
  return React.createElement("div", {
    className: "space-y-6"
  }, isMarkingAll && React.createElement("div", {
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999
    }
  }, React.createElement("div", {
    style: {
      backgroundColor: 'white',
      padding: '2rem',
      borderRadius: '1rem',
      textAlign: 'center',
      maxWidth: '90%',
      width: '320px',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
    }
  }, React.createElement("div", {
    style: {
      width: '60px',
      height: '60px',
      border: '4px solid #e5e7eb',
      borderTopColor: '#10b981',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      margin: '0 auto 1rem'
    }
  }), React.createElement("div", {
    style: {
      fontSize: '1.25rem',
      fontWeight: 'bold',
      color: '#1f2937',
      marginBottom: '0.5rem'
    }
  }, "Marking Attendance..."), React.createElement("div", {
    style: {
      fontSize: '1rem',
      color: '#6b7280',
      marginBottom: '1rem'
    }
  }, "Please wait, do not close this page"), React.createElement("div", {
    style: {
      width: '100%',
      height: '8px',
      backgroundColor: '#e5e7eb',
      borderRadius: '4px',
      overflow: 'hidden',
      marginBottom: '0.5rem'
    }
  }, React.createElement("div", {
    style: {
      width: `${markingProgress.total > 0 ? markingProgress.current / markingProgress.total * 100 : 0}%`,
      height: '100%',
      backgroundColor: '#10b981',
      transition: 'width 0.3s ease'
    }
  })), React.createElement("div", {
    style: {
      fontSize: '0.875rem',
      color: '#6b7280'
    }
  }, markingProgress.current, " of ", markingProgress.total, " students"))), React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "Student Attendance - ", mySchool), React.createElement("div", {
    className: "grid grid-cols-2 gap-4"
  }, React.createElement("div", {
    className: `p-4 rounded-xl border-2 ${lockStatus['11'] ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'}`
  }, React.createElement("div", {
    className: "flex items-center justify-between"
  }, React.createElement("div", null, React.createElement("span", {
    className: "font-bold text-lg"
  }, "Class 11"), React.createElement("span", {
    className: `ml-2 px-2 py-1 rounded text-sm font-semibold ${lockStatus['11'] ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`
  }, lockStatus['11'] ? '🔒 Locked' : '🔓 Unlocked')), lockStatus['11'] && lockInfo['11'] && React.createElement("div", {
    className: "text-xs text-gray-600"
  }, "by ", lockInfo['11'].lockedByName))), React.createElement("div", {
    className: `p-4 rounded-xl border-2 ${lockStatus['12'] ? 'bg-red-50 border-red-300' : 'bg-green-50 border-green-300'}`
  }, React.createElement("div", {
    className: "flex items-center justify-between"
  }, React.createElement("div", null, React.createElement("span", {
    className: "font-bold text-lg"
  }, "Class 12"), React.createElement("span", {
    className: `ml-2 px-2 py-1 rounded text-sm font-semibold ${lockStatus['12'] ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`
  }, lockStatus['12'] ? '🔒 Locked' : '🔓 Unlocked')), lockStatus['12'] && lockInfo['12'] && React.createElement("div", {
    className: "text-xs text-gray-600"
  }, "by ", lockInfo['12'].lockedByName)))), isLocked && React.createElement("div", {
    className: "bg-red-100 border-2 border-red-500 p-4 rounded-xl"
  }, React.createElement("div", {
    className: "flex items-center justify-between"
  }, React.createElement("div", null, React.createElement("div", {
    className: "font-bold text-red-800"
  }, "\uD83D\uDD12 Attendance is LOCKED for Class ", selectedGrade), React.createElement("div", {
    className: "text-sm text-red-700 mt-1"
  }, "Locked by: ", React.createElement("strong", null, currentLockInfo?.lockedByName || 'Unknown'), " on ", currentLockInfo?.lockedAt ? new Date(currentLockInfo.lockedAt).toLocaleString() : 'Unknown date'), React.createElement("div", {
    className: "text-sm text-red-700"
  }, "No changes can be made to Class ", selectedGrade, " attendance for this date.")), currentUser.role === 'admin' && React.createElement("button", {
    onClick: unlockAttendance,
    disabled: isLoading,
    className: "px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-semibold disabled:opacity-50"
  }, isLoading ? 'Unlocking...' : '🔓 Unlock Class ' + selectedGrade))), !isLocked && selectedDate === getTodayDate() && React.createElement("div", {
    className: "bg-green-100 border-2 border-green-500 p-4 rounded-xl"
  }, React.createElement("div", {
    className: "flex items-center justify-between"
  }, React.createElement("div", null, React.createElement("div", {
    className: "font-bold text-green-800"
  }, "\u2705 Class ", selectedGrade, " Attendance is UNLOCKED"), React.createElement("div", {
    className: "text-sm text-green-700 mt-1"
  }, "You can mark/modify attendance for Class ", selectedGrade, ". Remember to lock it after completion to prevent duplicates.")), React.createElement("button", {
    onClick: lockAttendance,
    disabled: isLoading,
    className: "px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold disabled:opacity-50"
  }, isLoading ? 'Locking...' : '🔒 Lock Class ' + selectedGrade))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("div", {
    className: "grid md:grid-cols-3 gap-4 mb-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Grade"), React.createElement("select", {
    value: selectedGrade,
    onChange: e => setSelectedGrade(e.target.value),
    className: "w-full border-2 px-4 py-3 rounded-xl"
  }, React.createElement("option", {
    value: "11"
  }, "Class 11 ", lockStatus['11'] ? '🔒' : ''), React.createElement("option", {
    value: "12"
  }, "Class 12 ", lockStatus['12'] ? '🔒' : ''))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Date"), React.createElement("input", {
    type: "date",
    value: selectedDate,
    onChange: e => setSelectedDate(e.target.value),
    className: "w-full border-2 px-4 py-3 rounded-xl"
  })), React.createElement("div", {
    className: "flex items-end"
  }, React.createElement("button", {
    onClick: handleSelectAll,
    disabled: isLocked || isMarkingAll,
    className: "w-full px-6 py-3 bg-green-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
  }, isMarkingAll ? '⏳ Marking...' : '✅ Mark All Present')))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "font-bold mb-4"
  }, "Students (", filteredStudents.length, ")"), filteredStudents.length === 0 ? React.createElement("div", {
    className: "text-center py-8"
  }, React.createElement("p", {
    className: "text-gray-500 mb-4"
  }, "No students found"), students.length > 0 && React.createElement("div", {
    className: "text-sm text-amber-600 bg-amber-50 p-4 rounded-xl"
  }, React.createElement("p", {
    className: "font-semibold mb-2"
  }, "\u26A0\uFE0F Debug Info:"), React.createElement("p", null, "Total students in database: ", students.length), React.createElement("p", null, "Your school: \"", mySchool, "\""), React.createElement("p", null, "Selected grade: Class ", selectedGrade), React.createElement("p", {
    className: "mt-2 text-xs"
  }, "Schools in database: ", Array.from(new Set(students.map(s => s.school))).join(', ')), React.createElement("p", {
    className: "text-xs mt-1"
  }, "If your school name doesn't match exactly, contact admin to update student records."))) : React.createElement("div", {
    className: "space-y-2"
  }, filteredStudents.map(student => React.createElement("div", {
    key: student.id,
    className: "flex items-center justify-between p-4 border-2 rounded-xl hover:bg-gray-50"
  }, React.createElement("div", {
    className: "flex-1"
  }, React.createElement("div", {
    className: "font-semibold text-lg"
  }, student.name), React.createElement("div", {
    className: "text-sm text-gray-600"
  }, student.gender), attendanceMap[student.id] === 'Absent' && React.createElement("div", {
    className: "text-xs text-red-600 mt-1"
  }, "\uD83D\uDCDD ", studentAttendance.find(a => a.studentId === student.id && a.date === selectedDate)?.remarks || 'No reason provided')), React.createElement("div", {
    className: "flex gap-2"
  }, React.createElement("button", {
    onClick: () => handleAttendanceChange(student.id, 'Present'),
    disabled: isLocked,
    className: `px-6 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${attendanceMap[student.id] === 'Present' ? 'bg-green-500 text-white' : 'bg-gray-200'}`
  }, "\u2713 Present"), React.createElement("button", {
    onClick: () => {
      if (!isLocked) {
        setSelectedStudent(student);
        setShowRemarksModal(true);
      }
    },
    disabled: isLocked,
    className: `px-6 py-2 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${attendanceMap[student.id] === 'Absent' ? 'bg-red-500 text-white' : 'bg-gray-200'}`
  }, "\u2717 Absent")))))), showRemarksModal && selectedStudent && React.createElement(RemarksModal, {
    student: selectedStudent,
    onSave: remarks => {
      handleAttendanceChange(selectedStudent.id, 'Absent', remarks);
      setShowRemarksModal(false);
      setSelectedStudent(null);
    },
    onClose: () => {
      setShowRemarksModal(false);
      setSelectedStudent(null);
    }
  }));
}
function AdminAttendanceAnalytics({
  students,
  teachers,
  studentAttendance,
  teacherAttendance,
  accessibleSchools = [],
  isSuperAdmin = false,
  isDirector = false
}) {
  const hasFullDataAccess = isSuperAdmin || isDirector;
  const schoolOptions = hasFullDataAccess ? SCHOOLS : accessibleSchools;
  const schoolMatchesFilter = (itemSchool, selectedSchools) => {
    if (!selectedSchools || selectedSchools.length === 0) return true;
    if (!itemSchool) return false;
    const itemSchoolLower = itemSchool.toString().toLowerCase().trim();
    return selectedSchools.some(s => s && s.toString().toLowerCase().trim() === itemSchoolLower);
  };
  const [filterSchools, setFilterSchools] = useState([...schoolOptions]);
  const [filterGrade, setFilterGrade] = useState('All');
  const [startDate, setStartDate] = useState(getTodayDate().slice(0, 7) + '-01');
  const [endDate, setEndDate] = useState(getTodayDate());
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [attendanceLocks, setAttendanceLocks] = useState([]);
  const [loadingLocks, setLoadingLocks] = useState(false);
  const [showLockManagement, setShowLockManagement] = useState(false);
  const [lockFilterSchool, setLockFilterSchool] = useState('All');
  const [lockFilterDate, setLockFilterDate] = useState(getTodayDate());
  const chart1Ref = useRef(null);
  const chart2Ref = useRef(null);
  const chart3Ref = useRef(null);
  const chart4Ref = useRef(null);
  const chartInstances = useRef({});
  const loadAttendanceLocks = async () => {
    setLoadingLocks(true);
    try {
      let query = db.collection('attendanceLocks').orderBy('lockedAt', 'desc').limit(100);
      const snapshot = await query.get();
      const locks = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAttendanceLocks(locks);
    } catch (e) {
      console.error('Error loading locks:', e);
    }
    setLoadingLocks(false);
  };
  useEffect(() => {
    if (showLockManagement) {
      loadAttendanceLocks();
    }
  }, [showLockManagement]);
  const handleUnlock = async (lockId, school, grade, date) => {
    const confirmation = confirm(`Are you sure you want to unlock attendance for:\n\nSchool: ${school}\nClass: ${grade}\nDate: ${date}\n\nTeachers will be able to modify attendance again.`);
    if (!confirmation) return;
    try {
      await db.collection('attendanceLocks').doc(lockId).delete();
      alert('✅ Attendance unlocked successfully!');
      loadAttendanceLocks();
    } catch (e) {
      alert('Failed to unlock: ' + e.message);
    }
  };
  const filteredLocks = attendanceLocks.filter(lock => {
    if (lockFilterSchool !== 'All' && lock.school?.toLowerCase() !== lockFilterSchool?.toLowerCase()) return false;
    if (lockFilterDate && lock.date !== lockFilterDate) return false;
    if (!hasFullDataAccess && !schoolMatchesFilter(lock.school, accessibleSchools)) return false;
    return true;
  });
  const [rangeStudentData, setRangeStudentData] = React.useState(null);
  const [rangeTeacherData, setRangeTeacherData] = React.useState(null);
  const [loadingRange, setLoadingRange] = React.useState(false);
  const [editSchool, setEditSchool] = React.useState('');
  const [editDate, setEditDate] = React.useState(getTodayDate());
  const [editTeachers, setEditTeachers] = React.useState([]);
  const [editAttendanceMap, setEditAttendanceMap] = React.useState({});
  const [editLoadingData, setEditLoadingData] = React.useState(false);
  const [editModal, setEditModal] = React.useState(null);
  const [editSaving, setEditSaving] = React.useState(false);
  const handleLoadRange = async () => {
    setLoadingRange(true);
    setRangeStudentData(null);
    setRangeTeacherData(null);
    try {
      const [stuSnap, tchSnap] = await Promise.all([
        db.collection('studentAttendance').where('date', '>=', startDate).where('date', '<=', endDate).get(),
        db.collection('teacherAttendance').where('date', '>=', startDate).where('date', '<=', endDate).get()
      ]);
      let stuRecords = stuSnap.docs.map(d => d.data());
      let tchRecords = tchSnap.docs.map(d => d.data());
      if (!hasFullDataAccess && accessibleSchools.length > 0) {
        stuRecords = stuRecords.filter(a => schoolMatchesFilter(a.school, accessibleSchools));
        tchRecords = tchRecords.filter(a => schoolMatchesFilter(a.school, accessibleSchools));
      }
      setRangeStudentData(stuRecords);
      setRangeTeacherData(tchRecords);
    } catch (err) { alert('Failed to load data: ' + err.message); }
    setLoadingRange(false);
  };
  React.useEffect(() => {
    setRangeStudentData(null);
    setRangeTeacherData(null);
  }, [startDate, endDate, filterSchools]);
  React.useEffect(() => {
    if (!editSchool) { setEditTeachers([]); setEditAttendanceMap({}); return; }
    setEditLoadingData(true);
    let teacherList = [];
    db.collection('teachers').where('school', '==', editSchool).get()
      .then(snap => {
        teacherList = snap.docs.map(d => ({ ...d.data(), docId: d.id })).filter(t => t.isArchived !== true);
        setEditTeachers(teacherList);
        return db.collection('teacherAttendance').where('school', '==', editSchool).where('date', '==', editDate).get();
      })
      .then(snap => {
        const map = {};
        snap.docs.forEach(d => { map[d.data().teacherId] = { ...d.data(), docId: d.id }; });
        setEditAttendanceMap(map);
        setEditLoadingData(false);
      })
      .catch(() => setEditLoadingData(false));
  }, [editSchool, editDate]);
  const saveTeacherAttendanceEdit = async () => {
    if (!editModal) return;
    setEditSaving(true);
    const { teacher, existing, status, reason } = editModal;
    const docId = `${teacher.afid}_${editDate}`;
    const record = {
      teacherId: teacher.afid,
      teacherName: teacher.name,
      school: teacher.school,
      date: editDate,
      status,
      reason,
      location: 'Marked by Admin',
      punchInTime: status === 'Present' ? (existing && existing.status === 'Present' && existing.punchInTime ? existing.punchInTime : new Date().toISOString()) : 'Leave applied',
      markedAt: new Date().toISOString(),
      markedByAdmin: true,
      adminOverride: true,
    };
    if (existing && existing.status !== status) record.originalStatus = existing.status;
    try {
      await db.collection('teacherAttendance').doc(docId).set(record);
      setEditAttendanceMap(prev => ({ ...prev, [teacher.afid]: { ...record, docId } }));
      setEditModal(null);
    } catch (e) { alert('Error saving: ' + e.message); }
    setEditSaving(false);
  };
  const filteredStudentAttendance = useMemo(() => {
    const source = rangeStudentData !== null ? rangeStudentData : studentAttendance.filter(a => a.date >= startDate && a.date <= endDate);
    return source.filter(a => {
      if (!schoolMatchesFilter(a.school, filterSchools)) return false;
      if (filterGrade !== 'All' && a.grade !== filterGrade) return false;
      return true;
    });
  }, [rangeStudentData, studentAttendance, filterSchools, filterGrade, startDate, endDate]);
  const filteredTeacherAttendance = useMemo(() => {
    const source = rangeTeacherData !== null ? rangeTeacherData : teacherAttendance.filter(a => a.date >= startDate && a.date <= endDate);
    return source.filter(a => {
      if (!schoolMatchesFilter(a.school, filterSchools)) return false;
      return true;
    });
  }, [rangeTeacherData, teacherAttendance, filterSchools, startDate, endDate]);
  const todayStats = useMemo(() => {
    const studentRecords = studentAttendance.filter(a => {
      if (a.date !== selectedDate) return false;
      if (!schoolMatchesFilter(a.school, filterSchools)) return false;
      if (filterGrade !== 'All' && a.grade !== filterGrade) return false;
      return true;
    });
    const teacherRecords = teacherAttendance.filter(a => {
      if (a.date !== selectedDate) return false;
      if (!schoolMatchesFilter(a.school, filterSchools)) return false;
      return true;
    });
    return {
      studentPresent: studentRecords.filter(r => r.status === 'Present').length,
      studentAbsent: studentRecords.filter(r => r.status === 'Absent').length,
      teacherPresent: teacherRecords.filter(r => r.status === 'Present').length,
      teacherAbsent: teacherRecords.filter(r => r.status === 'On Leave').length
    };
  }, [studentAttendance, teacherAttendance, selectedDate, filterSchools, filterGrade]);
  const genderStats = useMemo(() => {
    const stats = {
      Male: {
        present: 0,
        absent: 0
      },
      Female: {
        present: 0,
        absent: 0
      },
      Other: {
        present: 0,
        absent: 0
      }
    };
    filteredStudentAttendance.forEach(a => {
      const student = students.find(s => s.id === a.studentId);
      if (student && stats[student.gender]) {
        if (a.status === 'Present') {
          stats[student.gender].present++;
        } else {
          stats[student.gender].absent++;
        }
      }
    });
    return stats;
  }, [filteredStudentAttendance, students]);
  const monthlyDayStats = useMemo(() => {
    const stats = {};
    filteredStudentAttendance.forEach(a => {
      if (!stats[a.date]) {
        stats[a.date] = {
          present: 0,
          absent: 0
        };
      }
      if (a.status === 'Present') {
        stats[a.date].present++;
      } else {
        stats[a.date].absent++;
      }
    });
    return stats;
  }, [filteredStudentAttendance]);
  useEffect(() => {
    Object.values(chartInstances.current).forEach(chart => {
      if (chart) chart.destroy();
    });
    chartInstances.current = {};
    if (chart1Ref.current) {
      const ctx = chart1Ref.current.getContext('2d');
      const dates = Object.keys(monthlyDayStats).sort();
      chartInstances.current.chart1 = new Chart(ctx, {
        type: 'line',
        data: {
          labels: dates.map(d => new Date(d).getDate()),
          datasets: [{
            label: 'Present',
            data: dates.map(d => monthlyDayStats[d].present),
            borderColor: '#10B981',
            backgroundColor: 'rgba(16,185,129,0.1)',
            tension: 0.4,
            fill: true
          }, {
            label: 'Absent',
            data: dates.map(d => monthlyDayStats[d].absent),
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239,68,68,0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Daily Student Attendance (Month)',
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
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
    if (chart2Ref.current) {
      const ctx = chart2Ref.current.getContext('2d');
      const genders = Object.keys(genderStats);
      chartInstances.current.chart2 = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: genders,
          datasets: [{
            label: 'Present',
            data: genders.map(g => genderStats[g].present),
            backgroundColor: '#10B981'
          }, {
            label: 'Absent',
            data: genders.map(g => genderStats[g].absent),
            backgroundColor: '#EF4444'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Gender-wise Student Attendance',
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
            y: {
              beginAtZero: true
            }
          }
        }
      });
    }
    if (chart3Ref.current) {
      const ctx = chart3Ref.current.getContext('2d');
      const present = filteredTeacherAttendance.filter(a => a.status === 'Present').length;
      const onLeave = filteredTeacherAttendance.filter(a => a.status === 'On Leave').length;
      chartInstances.current.chart3 = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['Present', 'On Leave'],
          datasets: [{
            data: [present, onLeave],
            backgroundColor: ['#5B8A8A', '#D4A574'],
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
              text: 'Teacher Attendance Status (Month)',
              font: {
                size: 16,
                weight: 'bold'
              }
            },
            legend: {
              position: 'bottom'
            }
          }
        }
      });
    }
    if (chart4Ref.current) {
      const ctx = chart4Ref.current.getContext('2d');
      const present = filteredStudentAttendance.filter(a => a.status === 'Present').length;
      const absent = filteredStudentAttendance.filter(a => a.status === 'Absent').length;
      chartInstances.current.chart4 = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Present', 'Absent'],
          datasets: [{
            data: [present, absent],
            backgroundColor: ['#5B8A8A', '#C17A6E'],
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
              text: 'Overall Student Attendance (Month)',
              font: {
                size: 16,
                weight: 'bold'
              }
            },
            legend: {
              position: 'bottom'
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
  }, [monthlyDayStats, genderStats, filteredTeacherAttendance, filteredStudentAttendance]);
  const [exportingStudents, setExportingStudents] = React.useState(false);
  const [exportingTeachers, setExportingTeachers] = React.useState(false);
  const handleExportStudents = async () => {
    setExportingStudents(true);
    try {
      const snap = await db.collection('studentAttendance').where('date', '>=', startDate).where('date', '<=', endDate).get();
      let records = snap.docs.map(d => d.data());
      if (!hasFullDataAccess && accessibleSchools.length > 0) records = records.filter(a => schoolMatchesFilter(a.school, accessibleSchools));
      if (filterSchools.length > 0) records = records.filter(a => schoolMatchesFilter(a.school, filterSchools));
      if (filterGrade !== 'All') records = records.filter(a => a.grade === filterGrade);
      records.sort((a, b) => a.date.localeCompare(b.date));
      if (!records.length) { alert('No student records found for this period.'); setExportingStudents(false); return; }
      exportToExcel(records.map(a => ({ Date: a.date, School: a.school, Grade: a.grade, 'Student Name': a.studentName, Status: a.status, Remarks: a.remarks || '', 'Marked By': a.markedBy })), `student_attendance_${startDate}_to_${endDate}`);
    } catch (err) { alert('Export failed: ' + err.message); }
    setExportingStudents(false);
  };
  const handleExportTeachers = async () => {
    setExportingTeachers(true);
    try {
      const snap = await db.collection('teacherAttendance').where('date', '>=', startDate).where('date', '<=', endDate).get();
      let records = snap.docs.map(d => d.data());
      if (!hasFullDataAccess && accessibleSchools.length > 0) records = records.filter(a => schoolMatchesFilter(a.school, accessibleSchools));
      if (filterSchools.length > 0) records = records.filter(a => schoolMatchesFilter(a.school, filterSchools));
      records.sort((a, b) => a.date.localeCompare(b.date));
      if (!records.length) { alert('No teacher records found for this period.'); setExportingTeachers(false); return; }
      exportToExcel(records.map(a => ({ Date: a.date, 'Teacher Name': a.teacherName, School: a.school, 'Punch-In Time': a.punchInTime || 'Not recorded', Status: a.status, Reason: a.reason || '', Location: a.location || '' })), `teacher_attendance_${startDate}_to_${endDate}`);
    } catch (err) { alert('Export failed: ' + err.message); }
    setExportingTeachers(false);
  };
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("div", {
    className: "flex justify-between items-center flex-wrap gap-4"
  }, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "\uD83D\uDCCA Attendance Analytics"), React.createElement("div", {
    className: "flex gap-2 flex-wrap"
  }, React.createElement("button", {
    onClick: () => setShowLockManagement(!showLockManagement),
    className: `px-4 py-2 rounded-xl font-semibold ${showLockManagement ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400'}`
  }, "\uD83D\uDD10 Manage Locks"), React.createElement("button", {
    onClick: handleExportStudents,
    disabled: exportingStudents,
    className: `px-4 py-2 rounded-xl font-semibold text-white ${exportingStudents ? 'bg-green-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`
  }, exportingStudents ? "\u23F3 Fetching..." : "\uD83D\uDCE5 Export Students"), React.createElement("button", {
    onClick: handleExportTeachers,
    disabled: exportingTeachers,
    className: `px-4 py-2 rounded-xl font-semibold text-white ${exportingTeachers ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`
  }, exportingTeachers ? "\u23F3 Fetching..." : "\uD83D\uDCE5 Export Teachers"))), showLockManagement && React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg border-2 border-yellow-300"
  }, React.createElement("div", {
    className: "flex justify-between items-center mb-4"
  }, React.createElement("h3", {
    className: "text-xl font-bold flex items-center gap-2"
  }, "\uD83D\uDD10 Attendance Lock Management"), React.createElement("button", {
    onClick: loadAttendanceLocks,
    disabled: loadingLocks,
    className: "px-4 py-2 bg-gray-200 rounded-lg font-semibold"
  }, loadingLocks ? '⏳ Loading...' : '🔄 Refresh')), React.createElement("p", {
    className: "text-sm text-gray-600 mb-4"
  }, "View and manage attendance locks. When attendance is locked, teachers cannot modify it. Use this section to unlock attendance when needed."), React.createElement("div", {
    className: "grid md:grid-cols-3 gap-4 mb-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Filter by School"), React.createElement("select", {
    value: lockFilterSchool,
    onChange: e => setLockFilterSchool(e.target.value),
    className: "w-full border-2 px-4 py-3 rounded-xl"
  }, React.createElement("option", {
    value: "All"
  }, "All Schools"), schoolOptions.map(s => React.createElement("option", {
    key: s,
    value: s
  }, s)))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Filter by Date"), React.createElement("input", {
    type: "date",
    value: lockFilterDate,
    onChange: e => setLockFilterDate(e.target.value),
    className: "w-full border-2 px-4 py-3 rounded-xl"
  })), React.createElement("div", {
    className: "flex items-end"
  }, React.createElement("button", {
    onClick: () => setLockFilterDate(''),
    className: "w-full px-4 py-3 bg-gray-200 rounded-xl font-semibold"
  }, "Show All Dates"))), loadingLocks ? React.createElement("div", {
    className: "text-center py-8"
  }, React.createElement("div", {
    className: "animate-spin text-4xl mb-2"
  }, "\u23F3"), React.createElement("p", null, "Loading attendance locks...")) : filteredLocks.length === 0 ? React.createElement("div", {
    className: "text-center py-8 text-gray-500"
  }, React.createElement("div", {
    className: "text-4xl mb-2"
  }, "\uD83D\uDD13"), React.createElement("p", null, "No attendance locks found for the selected filters.")) : React.createElement("div", {
    className: "overflow-x-auto"
  }, React.createElement("table", {
    className: "w-full"
  }, React.createElement("thead", {
    className: "bg-yellow-100"
  }, React.createElement("tr", null, React.createElement("th", {
    className: "p-3 text-left"
  }, "School"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Grade"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Date"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Locked By"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Locked At"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Actions"))), React.createElement("tbody", null, filteredLocks.map(lock => React.createElement("tr", {
    key: lock.id,
    className: "border-b hover:bg-gray-50"
  }, React.createElement("td", {
    className: "p-3"
  }, lock.school), React.createElement("td", {
    className: "p-3"
  }, React.createElement("span", {
    className: "px-2 py-1 bg-blue-100 text-blue-800 rounded font-semibold"
  }, "Class ", lock.grade)), React.createElement("td", {
    className: "p-3 font-mono"
  }, lock.date), React.createElement("td", {
    className: "p-3"
  }, lock.lockedByName || lock.lockedBy), React.createElement("td", {
    className: "p-3 text-sm"
  }, lock.lockedAt ? new Date(lock.lockedAt).toLocaleString() : 'Unknown'), React.createElement("td", {
    className: "p-3"
  }, React.createElement("button", {
    onClick: () => handleUnlock(lock.id, lock.school, lock.grade, lock.date),
    className: "px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600"
  }, "\uD83D\uDD13 Unlock")))))), React.createElement("div", {
    className: "mt-4 text-sm text-gray-500"
  }, "Showing ", filteredLocks.length, " lock(s)"))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "\uD83D\uDD0D Filters"), React.createElement("div", {
    className: "grid md:grid-cols-5 gap-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Schools (", filterSchools.length, "/", schoolOptions.length, ")"), React.createElement(MultiSelectDropdown, {
    options: schoolOptions,
    selected: filterSchools,
    onChange: setFilterSchools,
    placeholder: "Select Schools..."
  })), React.createElement("div", null, React.createElement("label", {
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
  }, "Class 12"))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Start Date"), React.createElement("input", {
    type: "date",
    value: startDate,
    onChange: e => setStartDate(e.target.value),
    className: "w-full border-2 px-4 py-3 rounded-xl"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "End Date"), React.createElement("input", {
    type: "date",
    value: endDate,
    onChange: e => setEndDate(e.target.value),
    className: "w-full border-2 px-4 py-3 rounded-xl"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Load Range Data"), React.createElement("button", {
    onClick: handleLoadRange,
    disabled: loadingRange,
    className: `w-full py-3 rounded-xl font-bold text-white ${loadingRange ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 active:scale-95'}`
  }, loadingRange ? "\u23F3 Loading..." : "\uD83D\uDD04 Load Data")), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Today's View"), React.createElement("input", {
    type: "date",
    value: selectedDate,
    onChange: e => setSelectedDate(e.target.value),
    className: "w-full border-2 px-4 py-3 rounded-xl"
  })))), React.createElement("div", {
    className: "grid grid-cols-2 md:grid-cols-4 gap-4"
  }, React.createElement("div", {
    className: "stat-card bg-green-500 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Students Present Today"), React.createElement("div", {
    className: "text-4xl font-bold"
  }, todayStats.studentPresent)), React.createElement("div", {
    className: "stat-card bg-red-500 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Students Absent Today"), React.createElement("div", {
    className: "text-4xl font-bold"
  }, todayStats.studentAbsent)), React.createElement("div", {
    className: "stat-card bg-blue-500 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Teachers Present Today"), React.createElement("div", {
    className: "text-4xl font-bold"
  }, todayStats.teacherPresent)), React.createElement("div", {
    className: "stat-card bg-orange-500 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Teachers on Leave Today"), React.createElement("div", {
    className: "text-4xl font-bold"
  }, todayStats.teacherAbsent))), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-6"
  }, React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg",
    style: {
      height: '350px'
    }
  }, React.createElement("canvas", {
    ref: chart1Ref
  })), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg",
    style: {
      height: '350px'
    }
  }, React.createElement("canvas", {
    ref: chart2Ref
  })), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg",
    style: {
      height: '350px'
    }
  }, React.createElement("canvas", {
    ref: chart3Ref
  })), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg",
    style: {
      height: '350px'
    }
  }, React.createElement("canvas", {
    ref: chart4Ref
  }))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "\uD83D\uDCCB Detailed Teacher Attendance"), React.createElement("div", {
    className: "overflow-x-auto"
  }, React.createElement("table", {
    className: "w-full"
  }, React.createElement("thead", {
    className: "avanti-gradient-light"
  }, React.createElement("tr", null, React.createElement("th", {
    className: "p-3 text-left"
  }, "Date"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Teacher"), React.createElement("th", {
    className: "p-3 text-left"
  }, "School"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Punch-In Time"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Status"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Reason"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Location"))), React.createElement("tbody", null, filteredTeacherAttendance.length === 0 ? React.createElement("tr", null, React.createElement("td", {
    colSpan: "7",
    className: "p-8 text-center text-gray-500"
  }, rangeTeacherData === null ? "\u26A0\uFE0F Select dates above and click Load Data to view records" : "No records found for selected filters.")) : filteredTeacherAttendance.slice(0, 50).map((a, idx) => React.createElement("tr", {
    key: idx,
    className: "border-b hover:bg-gray-50"
  }, React.createElement("td", {
    className: "p-3 text-sm"
  }, a.date), React.createElement("td", {
    className: "p-3 font-semibold"
  }, a.teacherName), React.createElement("td", {
    className: "p-3"
  }, a.school), React.createElement("td", {
    className: "p-3"
  }, React.createElement("span", {
    className: "font-mono font-bold text-blue-600 text-lg"
  }, "\u23F0 ", a.punchInTime || '--:--')), React.createElement("td", {
    className: "p-3"
  }, React.createElement("span", {
    className: `px-2 py-1 rounded-full text-xs font-bold ${a.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`
  }, a.status)), React.createElement("td", {
    className: "p-3 text-sm"
  }, a.reason), React.createElement("td", {
    className: "p-3 text-sm"
  }, "\uD83D\uDCCD ", a.location)))))))
  , React.createElement("div", {className: "bg-white p-6 rounded-2xl shadow-lg"},
    React.createElement("h3", {className: "text-xl font-bold mb-4"}, "\u270F\uFE0F Edit Teacher Attendance"),
    React.createElement("div", {className: "flex gap-4 flex-wrap mb-4"},
      React.createElement("div", {style: {flex: '1', minWidth: '200px'}},
        React.createElement("label", {className: "block text-sm font-bold mb-2"}, "School"),
        React.createElement("select", {
          value: editSchool,
          onChange: e => setEditSchool(e.target.value),
          className: "w-full border-2 px-4 py-2 rounded-xl"
        },
          React.createElement("option", {value: ""}, "-- Select School --"),
          schoolOptions.map(s => React.createElement("option", {key: s, value: s}, s))
        )
      ),
      React.createElement("div", {style: {flex: '1', minWidth: '200px'}},
        React.createElement("label", {className: "block text-sm font-bold mb-2"}, "Date"),
        React.createElement("input", {
          type: "date",
          value: editDate,
          onChange: e => setEditDate(e.target.value),
          className: "w-full border-2 px-4 py-2 rounded-xl"
        })
      )
    ),
    !editSchool
      ? React.createElement("div", {className: "text-center py-8 text-gray-400"}, "Select a school and date to edit teacher attendance")
      : editLoadingData
        ? React.createElement("div", {className: "text-center py-8 text-gray-500"}, "\u23F3 Loading...")
        : editTeachers.length === 0
          ? React.createElement("div", {className: "text-center py-8 text-gray-400"}, "No active teachers found for this school.")
          : React.createElement("div", {className: "overflow-x-auto"},
              React.createElement("div", {className: "py-2 mb-2 flex justify-between items-center"},
                React.createElement("span", {className: "font-semibold text-gray-700"}, editSchool + " \u2014 " + editDate),
                React.createElement("span", {className: "text-sm text-gray-500"}, editTeachers.length + " teachers, " + Object.keys(editAttendanceMap).length + " marked")
              ),
              React.createElement("table", {className: "w-full"},
                React.createElement("thead", {className: "avanti-gradient-light"},
                  React.createElement("tr", null,
                    React.createElement("th", {className: "p-3 text-left"}, "Teacher"),
                    React.createElement("th", {className: "p-3 text-left"}, "Status"),
                    React.createElement("th", {className: "p-3 text-left"}, "Reason"),
                    React.createElement("th", {className: "p-3 text-left"}, "Punch-In Time"),
                    React.createElement("th", {className: "p-3 text-center"}, "Action")
                  )
                ),
                React.createElement("tbody", null,
                  editTeachers.map(t => {
                    const rec = editAttendanceMap[t.afid];
                    return React.createElement("tr", {key: t.afid, className: "border-b hover:bg-gray-50"},
                      React.createElement("td", {className: "p-3"},
                        React.createElement("div", {className: "font-semibold"}, t.name),
                        rec && rec.markedByAdmin && React.createElement("span", {className: "text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold ml-1"}, "Admin Override")
                      ),
                      React.createElement("td", {className: "p-3"},
                        rec
                          ? React.createElement("span", {className: `px-2 py-1 rounded-full text-xs font-bold ${rec.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}, rec.status)
                          : React.createElement("span", {className: "px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500"}, "Not Marked")
                      ),
                      React.createElement("td", {className: "p-3 text-sm text-gray-600"}, rec ? rec.reason : "\u2014"),
                      React.createElement("td", {className: "p-3 text-sm font-mono text-blue-600"}, rec && rec.punchInTime ? "\u23F0 " + rec.punchInTime : "\u2014"),
                      React.createElement("td", {className: "p-3 text-center"},
                        React.createElement("button", {
                          onClick: () => setEditModal({teacher: t, existing: rec || null, status: rec ? rec.status : 'Present', reason: rec ? rec.reason : 'Present'}),
                          className: `px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${rec ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`
                        }, rec ? "\u270F\uFE0F Edit" : "+ Mark")
                      )
                    );
                  })
                )
              )
            ),
    editModal && React.createElement("div", {
      className: "fixed inset-0 flex items-center justify-center z-50",
      style: {background: 'rgba(0,0,0,0.55)'},
      onClick: e => { if (e.target === e.currentTarget) setEditModal(null); }
    },
      React.createElement("div", {className: "bg-white rounded-2xl p-6 shadow-2xl w-full max-w-md mx-4"},
        React.createElement("h3", {className: "text-xl font-bold mb-1"}, (editModal.existing ? "\u270F\uFE0F Edit" : "\u2795 Mark") + " Attendance"),
        React.createElement("p", {className: "text-gray-500 text-sm mb-4"}, editModal.teacher.name + " \u2014 " + editDate),
        React.createElement("div", {className: "space-y-4"},
          React.createElement("div", null,
            React.createElement("label", {className: "block text-sm font-semibold text-gray-700 mb-2"}, "Status"),
            React.createElement("div", {className: "flex gap-3"},
              ['Present', 'On Leave'].map(s =>
                React.createElement("button", {
                  key: s,
                  onClick: () => setEditModal(prev => ({...prev, status: s, reason: s === 'Present' ? 'Present' : 'Personal Leave'})),
                  className: `flex-1 py-2 rounded-lg font-semibold border-2 transition-colors ${editModal.status === s ? (s === 'Present' ? 'bg-green-500 text-white border-green-500' : 'bg-orange-500 text-white border-orange-500') : 'border-gray-300 text-gray-600 hover:border-gray-400'}`
                }, s)
              )
            )
          ),
          React.createElement("div", null,
            React.createElement("label", {className: "block text-sm font-semibold text-gray-700 mb-2"}, "Reason"),
            React.createElement("select", {
              value: editModal.reason,
              onChange: e => setEditModal(prev => ({...prev, reason: e.target.value})),
              className: "w-full border border-gray-300 rounded-lg p-2 focus:border-blue-400 focus:outline-none"
            },
              (editModal.status === 'Present' ? ['Present'] : ['Personal Leave', 'Sick Leave', 'Weekly Off', 'Public Holiday', 'Organization Holiday', 'School Holiday', 'Emergency Leave', 'Maternity Leave', 'Paternity Leave', 'Comp Off']).map(r =>
                React.createElement("option", {key: r, value: r}, r)
              )
            )
          ),
          editModal.existing && React.createElement("div", {className: "text-xs bg-blue-50 text-blue-700 rounded-lg p-3 border border-blue-200"},
            "Current: ", React.createElement("strong", null, editModal.existing.status), " \u2014 ", editModal.existing.reason,
            editModal.existing.markedByAdmin ? " (previously admin-marked)" : " (teacher-submitted)"
          ),
          React.createElement("div", {className: "text-xs bg-yellow-50 text-yellow-700 rounded-lg p-3 border border-yellow-200"},
            "\u26A0\uFE0F This will be saved as an admin override and will overwrite any existing record."
          )
        ),
        React.createElement("div", {className: "flex gap-3 mt-6"},
          React.createElement("button", {
            onClick: () => setEditModal(null),
            className: "flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium"
          }, "Cancel"),
          React.createElement("button", {
            onClick: saveTeacherAttendanceEdit,
            disabled: editSaving,
            className: "flex-1 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
          }, editSaving ? "Saving..." : "Save")
        )
      )
    )
  )
  );
}
function TimetableAdminSection({ currentUser, availableSchools }) {
  var schools = availableSchools && availableSchools.length > 0 ? availableSchools : (typeof SCHOOLS !== 'undefined' ? SCHOOLS : []);
  var [selectedSchool, setSelectedSchool] = useState(schools.length === 1 ? schools[0] : '');
  if (!selectedSchool) {
    return React.createElement('div', { className: 'space-y-4' },
      React.createElement('div', { className: 'bg-gradient-to-r from-yellow-500 via-yellow-600 to-red-600 text-white p-6 rounded-2xl shadow-lg' },
        React.createElement('h2', { className: 'text-2xl font-bold mb-1' }, '📅 Class Timetable'),
        React.createElement('p', { className: 'text-sm opacity-80' }, 'Select a school to view or edit the timetable')
      ),
      React.createElement('div', { className: 'bg-white rounded-2xl shadow p-6' },
        React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' }, '🏫 School'),
        React.createElement('select', {
          value: selectedSchool,
          onChange: function(e) { setSelectedSchool(e.target.value); },
          className: 'w-full border-2 border-gray-200 rounded-xl p-3 text-sm focus:border-yellow-400 focus:outline-none bg-white'
        },
          React.createElement('option', { value: '' }, '— Select a School —'),
          schools.map(function(s) { return React.createElement('option', { key: s, value: s }, s); })
        )
      )
    );
  }
  return React.createElement('div', { className: 'space-y-3' },
    schools.length > 1 && React.createElement('div', { className: 'flex items-center gap-3 flex-wrap bg-white rounded-xl shadow px-4 py-2' },
      React.createElement('label', { className: 'text-sm font-semibold text-gray-600' }, '🏫 School:'),
      React.createElement('select', {
        value: selectedSchool,
        onChange: function(e) { setSelectedSchool(e.target.value); },
        className: 'border-2 border-gray-200 rounded-xl p-2 text-sm focus:border-yellow-400 focus:outline-none bg-white flex-1'
      },
        schools.map(function(s) { return React.createElement('option', { key: s, value: s }, s); })
      )
    ),
    React.createElement(TimetablePage, { currentUser: currentUser, mySchool: selectedSchool })
  );
}
function TimetablePage({ currentUser, mySchool }) {
  var [activeClass, setActiveClass] = useState('11');
  var [activeView, setActiveView] = useState('grid');
  var [teachers, setTeachers] = useState([]);
  var [timetable11, setTimetable11] = useState({});
  var [timetable12, setTimetable12] = useState({});
  var [isSaving, setIsSaving] = useState(false);
  var [isLoading, setIsLoading] = useState(true);
  var [saveMsg, setSaveMsg] = useState('');
  var [conflicts, setConflicts] = useState([]);
  var [teacherFilter, setTeacherFilter] = useState('');
  var [lastSaved, setLastSaved] = useState(null);
  var [numPeriods, setNumPeriods] = useState(8);
  var [periodTimes, setPeriodTimes] = useState(['6:00–7:00','7:30–9:00','9:30–10:30','10:30–12:00','12:00–1:30','3:00–4:30','5:00–8:00','9:00–10:30']);
  var [breakTimes, setBreakTimes] = useState({});
  var [editingTime, setEditingTime] = useState(null);
  var [periodLabels, setPeriodLabels] = useState({});
  var [colTypes, setColTypes] = useState({});
  var [editingLabel, setEditingLabel] = useState(null);
  var [weeklyOffDays, setWeeklyOffDays] = useState({Sunday:true});
  var autoSaveRef = React.useRef(null);
  var initialLoadDone = React.useRef(false);
  // Full daily schedule including breaks – 'break' rows are read-only dividers
  var FULL_SCHEDULE = [
    {type:'period', key:'P1',  label:'Period 1', time:'6:00 – 7:00 AM',    note:'Class'},
    {type:'break',  key:'BRK_ASSEMBLY', label:'Assembly & Attendance', time:'7:00 – 7:30 AM', color:'bg-blue-50 text-blue-700'},
    {type:'period', key:'P2',  label:'Period 2', time:'7:30 – 9:00 AM',    note:'Class'},
    {type:'break',  key:'BRK_BREAKFAST', label:'Breakfast', time:'9:00 – 9:30 AM', color:'bg-amber-50 text-amber-700'},
    {type:'period', key:'P3',  label:'Period 3 (CBSE)', time:'9:30 – 10:30 AM', note:'English class (CBSE)'},
    {type:'period', key:'P4',  label:'Period 4', time:'10:30 AM – 12:00 PM', note:'Class'},
    {type:'period', key:'P5',  label:'Period 5', time:'12:00 – 1:30 PM',   note:'Class'},
    {type:'break',  key:'BRK_LUNCH', label:'Lunch Break', time:'1:30 – 3:00 PM', color:'bg-green-50 text-green-700'},
    {type:'period', key:'P6',  label:'Period 6', time:'3:00 – 4:30 PM',    note:'Remedial / Problem Solving'},
    {type:'break',  key:'BRK_SNACK', label:'Snack Break', time:'4:30 – 5:00 PM', color:'bg-orange-50 text-orange-700'},
    {type:'period', key:'P7',  label:'Period 7', time:'5:00 – 8:00 PM',    note:'Self Study (Invigilated)'},
    {type:'break',  key:'BRK_DINNER', label:'Dinner & Attendance', time:'8:00 – 9:00 PM', color:'bg-indigo-50 text-indigo-700'},
    {type:'period', key:'P8',  label:'Period 8', time:'9:00 – 10:30 PM',   note:'Self Study'},
  ];
  var DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  var PERIODS = FULL_SCHEDULE.filter(function(s){return s.type==='period';}).map(function(s){return s.key;});
  var PLABELS  = FULL_SCHEDULE.filter(function(s){return s.type==='period';}).map(function(s){return s.label;});
  // Only show up to numPeriods period columns (include breaks between visible periods)
  var visibleSchedule=(function(){var r=[];var c=0;for(var i=0;i<FULL_SCHEDULE.length;i++){var e=FULL_SCHEDULE[i];if(e.type==='period'){if(c<numPeriods){r.push(e);c++;}}else{if(c<numPeriods)r.push(e);}}return r;})();
  function addPeriod(){
    var n=numPeriods+1;
    setNumPeriods(n);
    setPeriodTimes(function(prev){ var next=prev.slice(); next.push(''); return next; });
  }
  function removePeriod(){
    if(numPeriods<=1) return;
    var n=numPeriods-1;
    setNumPeriods(n);
    setPeriodTimes(function(prev){ return prev.slice(0,n); });
  }
  function updatePeriodTime(idx,val){
    setPeriodTimes(function(prev){ var next=prev.slice(); next[idx]=val; return next; });
  }
  // CBSE Teacher constant – always available in teacher dropdowns
  var CBSE_TEACHER = {docId:'__cbse__', afid:'__cbse__', name:'CBSE Teacher', subject:'', isCbse:true};
  // Subjects that are always taught by CBSE Teacher (language / PT)
  var CBSE_SUBJECTS = ['English','Hindi','Sanskrit','Marathi','Gujarati','PT','Physical Education','Sports','Language'];
  function isCbseSubject(sub){ return sub && CBSE_SUBJECTS.some(function(cs){ return sub.toLowerCase().includes(cs.toLowerCase()); }); }
  // All subjects = teacher subjects + always-show language subjects
  function getAllSubjects(){
    var seen={}; var s=[];
    teachers.forEach(function(t){ if(t.subject&&!seen[t.subject]){seen[t.subject]=true;s.push(t.subject);} });
    CBSE_SUBJECTS.forEach(function(cs){ if(!seen[cs]){seen[cs]=true;s.push(cs);} });
    return s.sort();
  }
  useEffect(function() {
    if (!mySchool) return;
    var db = getFirestore();
    setIsLoading(true); setTeachers([]); setTimetable11({}); setTimetable12({}); setLastSaved(null);
    Promise.all([
      db.collection('teachers').where('school','==',mySchool).get(),
      db.collection('timetables').doc(mySchool+'_class11').get(),
      db.collection('timetables').doc(mySchool+'_class12').get()
    ]).then(function(r) {
      var tList = r[0].docs.map(function(d){ return Object.assign({},d.data(),{docId:d.id}); })
        .filter(function(t){ return !t.isArchived; })
        .sort(function(a,b){ return (a.name||'').localeCompare(b.name||''); });
      setTeachers(tList);
      var metaLoaded=false;
      if (r[1].exists) {
        var d1=r[1].data();
        setTimetable11(d1.slots||{});
        setLastSaved(d1.updatedAt||null);
        if(d1.periodLabels){setPeriodLabels(d1.periodLabels);metaLoaded=true;}
        if(d1.colTypes){setColTypes(d1.colTypes);metaLoaded=true;}
        if(d1.periodTimes){setPeriodTimes(d1.periodTimes);metaLoaded=true;}
        if(d1.numPeriods){setNumPeriods(d1.numPeriods);}else if(d1.periodTimes){setNumPeriods(d1.periodTimes.length);}
        if(d1.breakTimes){setBreakTimes(d1.breakTimes);}
        if(d1.weeklyOffDays){setWeeklyOffDays(d1.weeklyOffDays);}
      }
      if (r[2].exists) {
        var d2=r[2].data();
        setTimetable12(d2.slots||{});
        if(!metaLoaded){
          if(d2.periodLabels)setPeriodLabels(d2.periodLabels);
          if(d2.colTypes)setColTypes(d2.colTypes);
          if(d2.periodTimes)setPeriodTimes(d2.periodTimes);
          if(d2.numPeriods){setNumPeriods(d2.numPeriods);}else if(d2.periodTimes){setNumPeriods(d2.periodTimes.length);}
          if(d2.breakTimes)setBreakTimes(d2.breakTimes);
        }
      }
    }).catch(function(e){ console.error('Timetable load error:',e); })
    .finally(function(){ setIsLoading(false); setTimeout(function(){initialLoadDone.current=true;},800); });
  }, [mySchool]);
  useEffect(function() {
    var found = [];
    DAYS.forEach(function(day) {
      PERIODS.forEach(function(period) {
        var key = day+'_'+period;
        var s11 = timetable11[key]||{}; var s12 = timetable12[key]||{};
        if (s11.teacherId && s12.teacherId && s11.teacherId===s12.teacherId)
          found.push({day:day,period:period,teacherName:s11.teacherName||'Unknown'});
      });
    });
    setConflicts(found);
  }, [timetable11,timetable12]);
  // Auto-save: debounce 3s after any data change
  useEffect(function(){
    if(!initialLoadDone.current||isLoading||!canEdit()) return;
    if(autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current=setTimeout(function(){saveTimetable(true);},3000);
    return function(){if(autoSaveRef.current)clearTimeout(autoSaveRef.current);};
  },[timetable11,timetable12,periodLabels,colTypes,periodTimes,breakTimes]);
  function canEdit() {
    if (!currentUser) return false;
    var utype = (currentUser.userType||'').toLowerCase();
    var role  = (currentUser.role||'').toLowerCase();
    if (utype==='teacher'||utype==='apc'||utype==='manager'||utype==='superadmin') return true;
    return ['super_admin','manager','admin','apc','pm','apm','program_manager','associate_program_manager','program_head','aph','director','assoc_director'].indexOf(role)!==-1;
  }
  function getTId(t){ return t.afid||t.docId; }
  function getSubjects(){ var seen={}; var s=[]; teachers.forEach(function(t){ if(t.subject&&!seen[t.subject]){seen[t.subject]=true;s.push(t.subject);} }); return s.sort(); }
  function getTeachersForSubject(sub){
    if(!sub) return teachers.concat([CBSE_TEACHER]);
    if(isCbseSubject(sub)) return [CBSE_TEACHER].concat(teachers.filter(function(t){ return t.subject===sub; }));
    var filtered=teachers.filter(function(t){ return t.subject===sub; });
    return filtered.concat([CBSE_TEACHER]);
  }
  function getSlot(grade,day,period){ var key=day+'_'+period; return grade==='11'?(timetable11[key]||{}):(timetable12[key]||{}); }
  function updateSlot(grade,day,period,updates){ var key=day+'_'+period; var setter=grade==='11'?setTimetable11:setTimetable12; setter(function(prev){ return Object.assign({},prev,{[key]:Object.assign({},prev[key]||{},updates)}); }); }
  function clearSlot(grade,day,period){ var key=day+'_'+period; var setter=grade==='11'?setTimetable11:setTimetable12; setter(function(prev){ var n=Object.assign({},prev); delete n[key]; return n; }); }
  function isConflict(day,period){ return conflicts.some(function(c){ return c.day===day&&c.period===period; }); }
  function handleSubjectChange(grade,day,period,subject){
    var cur=getSlot(grade,day,period);
    var upd={subject:subject};
    if(!subject){ upd.teacherId=''; upd.teacherName=''; }
    else if(isCbseSubject(subject)){
      // Language/PT → auto-select CBSE Teacher
      upd.teacherId=CBSE_TEACHER.docId; upd.teacherName=CBSE_TEACHER.name;
    } else {
      // Non-CBSE: auto-select if exactly one teacher for this subject
      var matching=teachers.filter(function(t){ return t.subject===subject; });
      if(matching.length===1){ upd.teacherId=getTId(matching[0]); upd.teacherName=matching[0].name||''; }
      else if(cur.teacherId){
        var t=teachers.find(function(x){ return getTId(x)===cur.teacherId; });
        if(t&&t.subject!==subject){ upd.teacherId=''; upd.teacherName=''; }
      }
    }
    updateSlot(grade,day,period,upd);
  }
  function handleTeacherChange(grade,day,period,teacherId){ var t=teachers.find(function(x){ return getTId(x)===teacherId; }); var cur=getSlot(grade,day,period); updateSlot(grade,day,period,{teacherId:teacherId,teacherName:t?(t.name||''):'',subject:t?(t.subject||cur.subject||''):(cur.subject||'')}); }
  async function saveTimetable(isAutoSave){
    if(conflicts.length>0){if(!isAutoSave)setSaveMsg('❌ Fix all conflicts before saving!'); if(!isAutoSave)setTimeout(function(){setSaveMsg('');},4000); return;}
    setIsSaving(true); if(!isAutoSave)setSaveMsg('');
    if(isAutoSave)setSaveMsg('Auto-saving...');
    try{
      var db=getFirestore(); var now=new Date().toISOString();
      var meta={periodLabels:periodLabels,colTypes:colTypes,periodTimes:periodTimes,breakTimes:breakTimes,weeklyOffDays:weeklyOffDays,numPeriods:numPeriods};
      var base=Object.assign({school:mySchool,updatedAt:now,updatedBy:(currentUser&&(currentUser.afid||currentUser.email))||'',updatedByName:(currentUser&&currentUser.name)||''},meta);
      await Promise.all([
        db.collection('timetables').doc(mySchool+'_class11').set(Object.assign({},base,{grade:'11',slots:timetable11})),
        db.collection('timetables').doc(mySchool+'_class12').set(Object.assign({},base,{grade:'12',slots:timetable12}))
      ]);
      setLastSaved(now); setSaveMsg(isAutoSave?'✅ Auto-saved':'✅ Saved successfully!');
      // Schedule exam notifications for non-CBSE teachers
      try{scheduleExamNotifications();}catch(ne){console.warn('Notification error:',ne);}
    }catch(e){setSaveMsg('❌ Error: '+e.message);}
    setIsSaving(false); setTimeout(function(){setSaveMsg('');},isAutoSave?2000:4000);
  }
  function scheduleExamNotifications(){
    if(!('Notification' in window)||Notification.permission==='denied') return;
    if(Notification.permission==='default') Notification.requestPermission();
    var dayMap={Monday:1,Tuesday:2,Wednesday:3,Thursday:4,Friday:5,Saturday:6,Sunday:0};
    var now=new Date();
    [timetable11,timetable12].forEach(function(tt,gi){
      var grade=gi===0?'11':'12';
      DAYS.forEach(function(day){
        PERIODS.forEach(function(p,pi){
          var slot=tt[day+'_'+p]; if(!slot||!slot.teacherId||!slot.subject) return;
          if(slot.teacherId==='__cbse__') return; // Skip CBSE teachers
          var teacher=teachers.find(function(t){return getTId(t)===slot.teacherId;});
          if(!teacher) return;
          var targetDay=dayMap[day]; var timeStr=periodTimes[pi]||'';
          var timeParts=timeStr.split(/[–\-]/); if(timeParts.length<1) return;
          var startRaw=timeParts[0].trim();
          // Determine AM/PM: prefer explicit AM/PM in the stored time,
          // fall back to the FULL_SCHEDULE reference time for this period
          var fsEntry=FULL_SCHEDULE.find(function(fs){return fs.key===PERIODS[pi];});
          var refTime=fsEntry?fsEntry.time:'';
          var hasPM=/pm/i.test(startRaw)||(!(/am/i.test(startRaw))&&/pm/i.test(refTime));
          startRaw=startRaw.replace(/\s*(AM|PM)/i,'');
          var hm=startRaw.split(':'); if(hm.length<2) return;
          var h=parseInt(hm[0])||0; var m=parseInt(hm[1])||0;
          if(hasPM&&h!==12) h+=12; else if(!hasPM&&h===12) h=0;
          var next=new Date(); next.setHours(h,m,0,0);
          var diff=targetDay-now.getDay(); if(diff<0||(diff===0&&next<=now)) diff+=7;
          next.setDate(next.getDate()+diff);
          var delay=next.getTime()-Date.now()-5*60*1000;
          if(delay>0&&delay<7*24*60*60*1000){
            setTimeout(function(){
              if(Notification.permission==='granted'){
                new Notification('📚 Class Reminder - Avanti',{body:'Class '+grade+' | '+slot.subject+' with '+teacher.name+' starting at '+timeStr,icon:'/icon-192.png'});
              }
            },delay);
          }
        });
      });
    });
  }
  function exportCSV(){
    var tt=activeClass==='11'?timetable11:timetable12;
    var rows=[['Day'].concat(PLABELS.map(function(p,i){ return p+(periodTimes[i]?' ('+periodTimes[i]+')':''); }))];
    DAYS.forEach(function(day){ var row=[day]; PERIODS.forEach(function(p){ var slot=tt[day+'_'+p]||{}; row.push(slot.subject?slot.subject+(slot.teacherName?' ('+slot.teacherName+')':''):''); }); rows.push(row); });
    var csv=rows.map(function(r){ return r.map(function(c){ return '"'+String(c).replace(/"/g,'""')+'"'; }).join(','); }).join('\n');
    var blob=new Blob([csv],{type:'text/csv'}); var url=URL.createObjectURL(blob);
    var a=document.createElement('a'); a.href=url; a.download='Timetable_Class'+activeClass+'_'+(mySchool||'').replace(/\s+/g,'_')+'.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }
  if(isLoading) return React.createElement('div',{className:'text-center py-16 text-gray-500'},React.createElement('div',{className:'text-4xl mb-3'},'⏳'),React.createElement('p',null,'Loading timetable...'));
  if(activeView==='teacher'){
    function getTeacherSchedule(tid){ var sch={}; DAYS.forEach(function(day){ PERIODS.forEach(function(p){ var key=day+'_'+p; var s11=timetable11[key]||{}; var s12=timetable12[key]||{}; if(s11.teacherId===tid) sch[key]={grade:'11',subject:s11.subject||''}; else if(s12.teacherId===tid) sch[key]={grade:'12',subject:s12.subject||''}; }); }); return sch; }
    var selT=teacherFilter?teachers.find(function(t){ return getTId(t)===teacherFilter; }):null;
    return React.createElement('div',{className:'space-y-4'},
      React.createElement('div',{className:'flex flex-wrap gap-2 items-center justify-between'},
        React.createElement('h3',{className:'text-xl font-bold text-gray-800'},'👩‍🏫 Teacher-Wise View'),
        React.createElement('button',{onClick:function(){setActiveView('grid');},className:'px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700'},'⬅️ Back to Grid')
      ),
      React.createElement('div',{className:'bg-white p-4 rounded-2xl shadow'},
        React.createElement('select',{value:teacherFilter,onChange:function(e){setTeacherFilter(e.target.value);},className:'w-full border-2 border-gray-200 rounded-xl p-3 text-sm focus:border-purple-400 focus:outline-none bg-white'},
          React.createElement('option',{value:''},'— All Teachers —'),
          teachers.map(function(t){ return React.createElement('option',{key:getTId(t),value:getTId(t)},t.name+(t.subject?' ('+t.subject+')':'')); })
        )
      ),
      selT?React.createElement('div',{className:'space-y-3'},
        React.createElement('div',{className:'bg-purple-50 border border-purple-200 rounded-2xl p-4'},
          React.createElement('h4',{className:'font-bold text-purple-800 text-lg'},selT.name+' — '+(selT.subject||'N/A')),
          React.createElement('p',{className:'text-sm text-purple-600 mt-1'},Object.keys(getTeacherSchedule(getTId(selT))).length+' periods assigned this week')
        ),
        React.createElement('div',{className:'overflow-x-auto'},
          React.createElement('table',{className:'w-full min-w-[600px] border-collapse text-xs'},
            React.createElement('thead',null,React.createElement('tr',{className:'bg-gray-100'},React.createElement('th',{className:'border p-2 text-left'},'Day'),PLABELS.map(function(p,i){ return React.createElement('th',{key:i,className:'border p-2 text-center'},React.createElement('div',{className:'font-semibold'},p),periodTimes[i]&&React.createElement('div',{className:'text-xs text-gray-400 font-normal'},periodTimes[i])); }))),
            React.createElement('tbody',null,DAYS.map(function(day){ return React.createElement('tr',{key:day,className:'odd:bg-white even:bg-gray-50'},React.createElement('td',{className:'border p-2 font-semibold whitespace-nowrap'},day),PERIODS.map(function(period,i){ var slot=getTeacherSchedule(getTId(selT))[day+'_'+period]; return React.createElement('td',{key:i,className:'border p-1 text-center '+(slot?'bg-green-50':'')},slot?React.createElement('div',null,React.createElement('div',{className:'font-bold text-green-700'},slot.subject),React.createElement('div',{className:'text-gray-500'},'Cl '+slot.grade)):React.createElement('span',{className:'text-gray-300'},'—')); })); }))
          )
        )
      ):React.createElement('div',{className:'grid grid-cols-1 md:grid-cols-2 gap-4'},teachers.map(function(t){ var cnt=Object.keys(getTeacherSchedule(getTId(t))).length; return React.createElement('div',{key:getTId(t),className:'bg-white rounded-2xl shadow p-4 border-l-4 border-purple-400 cursor-pointer hover:shadow-md',onClick:function(){setTeacherFilter(getTId(t));}},React.createElement('div',{className:'font-bold text-gray-800'},t.name),React.createElement('div',{className:'text-sm text-gray-500 mb-2'},t.subject||'—'),React.createElement('span',{className:'px-3 py-1 rounded-full text-xs font-semibold '+(cnt>0?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500')},cnt+' period'+(cnt!==1?'s':'')+' assigned')); }))
    );
  }
  var currentTT=activeClass==='11'?timetable11:timetable12;
  var totalFilled=Object.keys(currentTT).filter(function(k){ return currentTT[k]&&(currentTT[k].subject||currentTT[k].teacherName); }).length;
  var subjects=getAllSubjects(); var editable=canEdit();
  return React.createElement('div',{className:'space-y-4'},
    React.createElement('div',{className:'bg-gradient-to-r from-yellow-500 via-yellow-600 to-red-600 text-white p-5 rounded-2xl shadow-lg'},
      React.createElement('div',{className:'flex flex-wrap gap-3 items-start justify-between'},
        React.createElement('div',null,
          React.createElement('h2',{className:'text-2xl font-bold tracking-tight'},'📅 Class Timetable'),
          React.createElement('p',{className:'text-sm opacity-90 mt-0.5'},mySchool+(lastSaved?' · Last saved: '+new Date(lastSaved).toLocaleString('en-IN',{dateStyle:'short',timeStyle:'short'}):''))
        ),
        React.createElement('div',{className:'flex flex-wrap gap-2 items-center'},
          React.createElement('button',{onClick:function(){setActiveView('teacher');},className:'px-3 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-xl font-semibold text-xs border border-white border-opacity-30'},'👩‍🏫 Teacher View'),
          React.createElement('button',{onClick:exportCSV,className:'px-3 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-xl font-semibold text-xs border border-white border-opacity-30'},'📤 Export'),
          editable&&React.createElement('button',{onClick:saveTimetable,disabled:isSaving,className:'px-4 py-2 rounded-xl font-semibold text-sm bg-white text-yellow-700 hover:bg-yellow-50 disabled:opacity-60 disabled:cursor-not-allowed shadow'},isSaving?'⏳ Saving...':'💾 Save'),
          !editable&&React.createElement('span',{className:'px-3 py-1 bg-white bg-opacity-20 rounded-full text-xs border border-white border-opacity-30'},'👁️ View only')
        )
      )
    ),
    saveMsg&&React.createElement('div',{className:'p-3 rounded-xl text-sm font-semibold '+(saveMsg.startsWith('✅')?'bg-green-50 text-green-700 border border-green-200':'bg-red-50 text-red-700 border border-red-200')},saveMsg),
    conflicts.length>0&&React.createElement('div',{className:'bg-red-50 border-l-4 border-red-500 rounded-xl p-4'},
      React.createElement('h4',{className:'font-bold text-red-700 mb-2'},'⚠️ '+conflicts.length+' Conflict'+(conflicts.length>1?'s':'')+' Detected!'),
      React.createElement('ul',{className:'space-y-1'},conflicts.map(function(c,i){ return React.createElement('li',{key:i,className:'text-sm text-red-600'},'🔴 '+c.teacherName+' — BOTH Class 11 & 12 on '+c.day+' '+c.period); })),
      React.createElement('p',{className:'text-xs text-red-500 mt-2'},'Fix conflicts before saving.')
    ),
    React.createElement('div',{className:'flex flex-wrap gap-3 items-center'},
      React.createElement('div',{className:'flex gap-2'},
        ['11','12'].map(function(cls){ return React.createElement('button',{key:cls,onClick:function(){setActiveClass(cls);},className:'px-5 py-2 rounded-xl font-bold text-sm '+(activeClass===cls?'avanti-gradient text-white shadow-md':'bg-white border-2 border-gray-200 text-gray-600 hover:border-purple-300')},(cls==='11'?'📗':'📘')+' Class '+cls); })
      ),
      React.createElement('div',{className:'text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full'},totalFilled+' / '+(DAYS.length*numPeriods)+' periods filled'),
      editable&&React.createElement('div',{className:'flex items-center gap-1 bg-white border border-gray-200 rounded-full px-2 py-0.5'},
        React.createElement('span',{className:'text-xs text-gray-500 mr-1'},'Periods:'),
        React.createElement('button',{onClick:removePeriod,disabled:numPeriods<=1,className:'w-5 h-5 flex items-center justify-center rounded-full text-gray-500 hover:bg-red-100 hover:text-red-600 disabled:opacity-30 font-bold text-sm leading-none'},'-'),
        React.createElement('span',{className:'text-xs font-bold text-gray-700 w-4 text-center'},numPeriods),
        React.createElement('button',{onClick:addPeriod,disabled:numPeriods>=12,className:'w-5 h-5 flex items-center justify-center rounded-full text-gray-500 hover:bg-green-100 hover:text-green-600 disabled:opacity-30 font-bold text-sm leading-none'},'+')
      )
    ),
    React.createElement('div',{className:'bg-white p-3 rounded-2xl shadow flex flex-wrap gap-2 items-center'},
      React.createElement('span',{className:'text-xs font-bold text-gray-500 uppercase tracking-wide mr-1'},'📆 Weekly Off:'),
      DAYS.map(function(day){
        var isOff=!!weeklyOffDays[day];
        return React.createElement('label',{key:day,className:'flex items-center gap-1.5 text-xs cursor-pointer px-2.5 py-1.5 rounded-lg border transition '+(isOff?'bg-red-50 border-red-200 text-red-700 font-semibold':'bg-gray-50 border-gray-200 text-gray-600')},
          React.createElement('input',{type:'checkbox',checked:isOff,disabled:!editable,onChange:function(e){setWeeklyOffDays(function(p){var n=Object.assign({},p);if(e.target.checked){n[day]=true;}else{delete n[day];}return n;});},className:'w-3.5 h-3.5 accent-yellow-500'}),
          day==='Sunday'?'☀️ Sunday':day.slice(0,3)
        );
      })
    ),
    React.createElement('p',{className:'text-xs text-blue-600 bg-blue-50 p-2 rounded-lg md:hidden'},'👉 Scroll right to see all periods'),
    React.createElement('div',{className:'overflow-x-auto rounded-2xl shadow-lg border border-gray-200'},
      React.createElement('div',{style:{minWidth:'max-content'}},
        // ── Header Row 1: Column Labels as editable rounded pill badges
        React.createElement('div',{className:'flex'},
          React.createElement('div',{className:'bg-slate-900',style:{width:'72px',minHeight:'46px',borderRight:'1px solid #475569',flexShrink:0}}),
          visibleSchedule.map(function(col){
            var displayLabel=periodLabels[col.key]||col.label;
            return React.createElement('div',{key:'h1_'+col.key,className:'bg-slate-900 flex items-center justify-center text-center',style:{width:'160px',minHeight:'46px',borderLeft:'1px solid #475569',padding:'8px 10px',flexShrink:0}},
              editable&&editingLabel===col.key
                ?React.createElement('input',{autoFocus:true,className:'bg-slate-600 text-white text-xs font-bold rounded-full px-3 py-1.5 text-center w-full border border-slate-400 focus:outline-none focus:border-yellow-400',defaultValue:displayLabel,
                  onBlur:function(e){var v=e.target.value.trim();if(v&&v!==col.label){setPeriodLabels(function(prev){return Object.assign({},prev,{[col.key]:v});});}else{setPeriodLabels(function(prev){var n=Object.assign({},prev);delete n[col.key];return n;});}setEditingLabel(null);},
                  onKeyDown:function(e){if(e.key==='Enter')e.target.blur();}
                })
                :React.createElement('span',{className:'bg-slate-700 text-white font-bold text-xs rounded-full px-4 py-1.5 whitespace-nowrap shadow-sm'+(editable?' cursor-pointer hover:bg-slate-600':''),onClick:editable?function(){setEditingLabel(col.key);}:undefined},displayLabel)
            );
          })
        ),
        // ── Header Row 2: Times
        React.createElement('div',{className:'flex'},
          React.createElement('div',{className:'bg-slate-900',style:{width:'72px',minHeight:'30px',borderRight:'1px solid #475569',flexShrink:0}}),
          visibleSchedule.map(function(col){
            var pidx=PERIODS.indexOf(col.key);
            var dispTime=col.type==='break'?(breakTimes[col.key]||col.time):(pidx>=0&&periodTimes[pidx]?periodTimes[pidx]:col.time);
            return React.createElement('div',{key:'h2_'+col.key,className:'bg-slate-900 flex items-center justify-center text-xs text-white',style:{width:'160px',minHeight:'30px',borderLeft:'1px solid #475569',padding:'2px 8px',flexShrink:0}},
              editable
                ?React.createElement('input',{className:'w-full text-center text-xs bg-transparent text-white border-0 border-b border-slate-600 focus:outline-none focus:border-yellow-400 py-0.5',value:dispTime,
                  onChange:function(e){
                    if(col.type==='break'){setBreakTimes(function(prev){return Object.assign({},prev,{[col.key]:e.target.value});});}
                    else if(pidx>=0){updatePeriodTime(pidx,e.target.value);}
                  }})
                :React.createElement('span',null,dispTime)
            );
          })
        ),
        // ── Header Row 3: Type selector dropdowns (functional)
        React.createElement('div',{className:'flex'},
          React.createElement('div',{className:'bg-slate-900',style:{width:'72px',minHeight:'36px',borderRight:'1px solid #475569',borderBottom:'2px solid #1e293b',flexShrink:0}}),
          visibleSchedule.map(function(col){
            var defaultType=col.type==='break'?(col.key==='BRK_ASSEMBLY'?'Assembly':col.key==='BRK_BREAKFAST'?'Breakfast':col.key==='BRK_LUNCH'?'Lunch':col.key==='BRK_SNACK'?'Snack':'Dinner'):'Class';
            var currentType=colTypes[col.key]||defaultType;
            return React.createElement('div',{key:'h3_'+col.key,className:'bg-slate-900 flex items-center justify-center',style:{width:'160px',minHeight:'36px',borderLeft:'1px solid #475569',borderBottom:'2px solid #1e293b',padding:'4px 10px',flexShrink:0}},
              editable
                ?React.createElement('select',{className:'w-full text-xs text-white bg-slate-700 border border-slate-600 rounded px-2 py-1 focus:outline-none text-center cursor-pointer',value:currentType,
                  onChange:function(e){var val=e.target.value;setColTypes(function(prev){var n=Object.assign({},prev);if(val===defaultType){delete n[col.key];}else{n[col.key]=val;}return n;});}
                },
                  React.createElement('option',{value:'Class'},'Class'),
                  React.createElement('option',{value:'Assembly'},'Assembly'),
                  React.createElement('option',{value:'Lunch'},'Lunch'),
                  React.createElement('option',{value:'Breakfast'},'Breakfast'),
                  React.createElement('option',{value:'Snack'},'Snack'),
                  React.createElement('option',{value:'Dinner'},'Dinner'),
                  React.createElement('option',{value:'Sports'},'Sports'),
                  React.createElement('option',{value:'Self Study'},'Self Study'),
                  React.createElement('option',{value:'Free Period'},'Free Period'),
                  React.createElement('option',{value:'Exam'},'Exam'),
                  React.createElement('option',{value:'Weekly Off'},'Weekly Off')
                )
                :React.createElement('select',{className:'w-full text-xs text-white bg-slate-700 border border-slate-600 rounded px-2 py-1 focus:outline-none text-center cursor-default',value:currentType,disabled:true},
                  React.createElement('option',{value:currentType},currentType)
                )
            );
          })
        ),
        // ── Day Rows
        DAYS.map(function(day,di){
          var rowBg=di%2===0?'#ffffff':'#f9fafb';
          // Weekly Off row
          if(weeklyOffDays[day]){
            return React.createElement('div',{key:day,className:'flex',style:{borderTop:'1px solid #e5e7eb',background:'#f8f9fa'}},
              React.createElement('div',{className:'bg-slate-800 text-white font-bold text-xs flex flex-col items-center justify-center gap-1',style:{width:'72px',minHeight:'60px',borderRight:'1px solid #475569',flexShrink:0,padding:'4px',textAlign:'center'}},
                React.createElement('span',null,day.substring(0,3).toUpperCase()),
                editable&&React.createElement('button',{onClick:function(){setWeeklyOffDays(function(p){var n=Object.assign({},p);delete n[day];return n;});},style:{fontSize:'9px',color:'#fbbf24',background:'none',border:'1px solid #fbbf24',borderRadius:'3px',padding:'1px 5px',cursor:'pointer',lineHeight:'1.5',marginTop:'2px'}},'Enable')
              ),
              React.createElement('div',{style:{flex:1,display:'flex',alignItems:'center',justifyContent:'center',borderLeft:'1px solid #e5e7eb',background:'#f3f4f6'}},
                React.createElement('div',{style:{textAlign:'center'}},
                  React.createElement('div',{style:{fontSize:'20px',marginBottom:'3px'}},'🌟'),
                  React.createElement('div',{style:{fontSize:'12px',fontWeight:'700',color:'#9ca3af',textTransform:'uppercase',letterSpacing:'.06em'}},'Weekly Off')
                )
              )
            );
          }
          return React.createElement('div',{key:day,className:'flex',style:{borderTop:'1px solid #e5e7eb',background:rowBg}},
            // Day label cell
            React.createElement('div',{className:'bg-slate-800 text-white font-bold text-xs flex items-center justify-center',style:{width:'72px',minHeight:'90px',borderRight:'1px solid #475569',flexShrink:0}},
              day.substring(0,3).toUpperCase()
            ),
            // Schedule slot cells
            visibleSchedule.map(function(col){
              var defaultType=col.type==='break'?(col.key==='BRK_ASSEMBLY'?'Assembly':col.key==='BRK_BREAKFAST'?'Breakfast':col.key==='BRK_LUNCH'?'Lunch':col.key==='BRK_SNACK'?'Snack':'Dinner'):'Class';
              var currentType=colTypes[col.key]||defaultType;
              var isSelfStudy=currentType==='Self Study';
              var isBreakType=currentType!=='Class'&&currentType!=='Exam'&&!isSelfStudy;
              // Render as break cell if type is a break type
              if(isBreakType){
                var pidx=PERIODS.indexOf(col.key);
                var breakLabel=periodLabels[col.key]||col.label.replace(/\s*&.*/,'').trim();
                var breakTime=col.type==='break'?(breakTimes[col.key]||col.time):(pidx>=0&&periodTimes[pidx]?periodTimes[pidx]:col.time);
                return React.createElement('div',{key:col.key,className:'flex flex-col items-start justify-center',style:{width:'160px',minHeight:'90px',background:'#fef9ee',borderLeft:'1px solid #e5e7eb',padding:'10px 14px',flexShrink:0}},
                  React.createElement('div',{className:'font-bold text-amber-700',style:{fontSize:'13px',lineHeight:'1.3'}},currentType!==defaultType?currentType:breakLabel),
                  React.createElement('div',{className:'text-amber-500 text-xs mt-1'},breakTime)
                );
              }
              // Self Study cell – amber label + invigilator teacher dropdown
              if(isSelfStudy){
                var sSS=getSlot(activeClass,day,col.key);
                var pidxSS=PERIODS.indexOf(col.key);
                var timeSS=pidxSS>=0&&periodTimes[pidxSS]?periodTimes[pidxSS]:col.time;
                return React.createElement('div',{key:col.key,className:'flex flex-col justify-center',style:{width:'160px',minHeight:'90px',background:sSS.teacherId?'#fffbeb':'#fef9ee',borderLeft:'1px solid #e5e7eb',padding:'8px 10px',flexShrink:0}},
                  React.createElement('div',{style:{fontSize:'11px',fontWeight:'700',color:'#b45309',marginBottom:'5px'}},'📚 Self Study'),
                  React.createElement('div',{style:{fontSize:'10px',color:'#d97706',marginBottom:'6px'}},timeSS),
                  editable
                    ?React.createElement('select',{value:sSS.teacherId||'',onChange:function(e){var t=teachers.find(function(x){return getTId(x)===e.target.value;});updateSlot(activeClass,day,col.key,{teacherId:e.target.value,teacherName:t?t.name||'':'',subject:'Self Study'});},className:'w-full border border-amber-300 rounded text-xs py-1 px-1.5 bg-white focus:border-amber-400 focus:outline-none'},
                      React.createElement('option',{value:''},'— Invigilator —'),
                      teachers.map(function(t){return React.createElement('option',{key:getTId(t),value:getTId(t)},t.name);})
                    )
                    :React.createElement('div',{style:{fontSize:'11px',fontWeight:'600',color:'#374151'}},sSS.teacherName||React.createElement('span',{style:{color:'#d1d5db'}},'—'))
                );
              }
              var period=col.key;
              var s=getSlot(activeClass,day,period);
              var conf=isConflict(day,period);
              var tfs=getTeachersForSubject(s.subject);
              var cellBg=conf?'#fef2f2':(s.subject||s.teacherName)?'#faf5ff':rowBg;
              return React.createElement('div',{key:period,className:'flex flex-col justify-start',style:{width:'160px',minHeight:'90px',background:cellBg,borderLeft:'1px solid #e5e7eb',padding:'8px 8px',flexShrink:0}},
                conf&&React.createElement('div',{className:'text-xs font-bold text-red-500 text-center leading-none mb-1'},'⚠️ Conflict'),
                editable
                  ?React.createElement('div',{className:'space-y-1.5 w-full'},
                      React.createElement('select',{value:s.subject||'',onChange:function(e){handleSubjectChange(activeClass,day,period,e.target.value);},className:'w-full border border-gray-300 rounded text-xs py-1.5 px-2 bg-white focus:border-yellow-400 focus:outline-none'},
                        React.createElement('option',{value:''},'— Sub —'),
                        React.createElement('optgroup',{label:'Subjects'},subjects.filter(function(sub){return !isCbseSubject(sub);}).map(function(sub){return React.createElement('option',{key:sub,value:sub},sub);})),
                        React.createElement('optgroup',{label:'Language / PT'},subjects.filter(function(sub){return isCbseSubject(sub);}).map(function(sub){return React.createElement('option',{key:sub,value:sub},sub);}))
                      ),
                      React.createElement('select',{value:s.teacherId||'',onChange:function(e){handleTeacherChange(activeClass,day,period,e.target.value);},className:'w-full border rounded text-xs py-1.5 px-2 bg-white focus:border-yellow-400 focus:outline-none '+(conf?'border-red-400':s.teacherId===CBSE_TEACHER.docId?'border-blue-300':'border-gray-300')},
                        React.createElement('option',{value:''},'— Teacher —'),
                        tfs.map(function(t){return React.createElement('option',{key:getTId(t),value:getTId(t)},t.isCbse?'CBSE Teacher':t.name);})
                      ),
                      (s.subject||s.teacherId)&&React.createElement('button',{onClick:function(){clearSlot(activeClass,day,period);},className:'text-xs text-gray-400 hover:text-red-500 self-end leading-none'},'✕ clear')
                    )
                  :React.createElement('div',{className:'p-1'},
                      s.subject
                        ?React.createElement('div',null,
                            React.createElement('div',{className:'text-xs font-bold '+(isCbseSubject(s.subject)?'text-blue-700':'text-purple-700')},s.subject),
                            React.createElement('div',{className:'text-xs text-gray-600 mt-0.5'},s.teacherName||'—')
                          )
                        :React.createElement('span',{className:'text-gray-300 text-xs'},'—')
                    )
              );
            })
          );
        })
      )
    ),

    teachers.length===0?React.createElement('div',{className:'bg-yellow-50 border border-yellow-300 rounded-xl p-4 text-sm text-yellow-800'},'⚠️ No teachers found for "'+mySchool+'". Teachers must be added to the system first.')
    :React.createElement('div',{className:'bg-white rounded-2xl shadow p-4'},
      React.createElement('h4',{className:'font-bold text-gray-700 mb-3 text-sm'},'👥 Teachers at '+mySchool+' ('+teachers.length+')'),
      React.createElement('div',{className:'flex flex-wrap gap-2'},teachers.map(function(t){ return React.createElement('div',{key:getTId(t),className:'flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1 text-xs'},React.createElement('span',{className:'w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs'},(t.name||'?').charAt(0).toUpperCase()),React.createElement('span',{className:'font-medium text-gray-700'},t.name),t.subject&&React.createElement('span',{className:'text-gray-400'},'· '+t.subject)); }))
    )
  );
}
function TeacherDirectory({
  teachers,
  currentUser
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSchool, setFilterSchool] = useState('All');
  const [filterSubject, setFilterSubject] = useState('All');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const schools = ['All', ...new Set(teachers.filter(t => !t.isArchived).map(t => t.school))];
  const filteredTeachers = teachers.filter(teacher => {
    if (teacher.isArchived) return false;
    const matchesSearch = teacher.name?.toLowerCase().includes(searchTerm.toLowerCase()) || teacher.email?.toLowerCase().includes(searchTerm.toLowerCase()) || teacher.phone?.includes(searchTerm);
    const matchesSchool = filterSchool === 'All' || teacher.school === filterSchool;
    const matchesSubject = filterSubject === 'All' || teacher.subject === filterSubject;
    return matchesSearch && matchesSchool && matchesSubject;
  });
  const getSubjectIcon = subject => {
    const icons = {
      'Physics': '⚛️',
      'Chemistry': '🧪',
      'Mathematics': '📐',
      'Biology': '🧬'
    };
    return icons[subject] || '📚';
  };
  const getSchoolColor = school => {
    const colors = {
      'CoE Barwani': 'from-blue-500 to-blue-600',
      'CoE Cuttack': 'from-green-500 to-green-600',
      'CoE Bundi': 'from-purple-500 to-purple-600',
      'CoE Mahisagar': 'from-orange-500 to-orange-600',
      'EMRS Bhopal': 'from-pink-500 to-pink-600',
      'JNV Bharuch': 'from-red-500 to-red-600'
    };
    return colors[school] || 'from-gray-500 to-gray-600';
  };
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("div", {
    className: "flex items-center justify-between"
  }, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "\uD83D\uDCD6 Teacher Directory"), React.createElement("div", {
    className: "text-lg font-semibold text-gray-600"
  }, filteredTeachers.length, " ", filteredTeachers.length === 1 ? 'Teacher' : 'Teachers')), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("div", {
    className: "grid md:grid-cols-3 gap-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-semibold mb-2"
  }, "\uD83D\uDD0D Search"), React.createElement("input", {
    type: "text",
    placeholder: "Name, email, or phone...",
    value: searchTerm,
    onChange: e => setSearchTerm(e.target.value),
    className: "w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-yellow-500"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-semibold mb-2"
  }, "\uD83C\uDFEB School"), React.createElement("select", {
    value: filterSchool,
    onChange: e => setFilterSchool(e.target.value),
    className: "w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-yellow-500"
  }, schools.map(school => React.createElement("option", {
    key: school,
    value: school
  }, school)))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-semibold mb-2"
  }, "\uD83D\uDCDA Subject"), React.createElement("select", {
    value: filterSubject,
    onChange: e => setFilterSubject(e.target.value),
    className: "w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-yellow-500"
  }, React.createElement("option", {
    value: "All"
  }, "All Subjects"), SUBJECTS.map(subject => React.createElement("option", {
    key: subject,
    value: subject
  }, subject)))))), filteredTeachers.length === 0 ? React.createElement("div", {
    className: "bg-white p-12 rounded-2xl shadow-lg text-center"
  }, React.createElement("div", {
    className: "text-6xl mb-4"
  }, "\uD83D\uDD0D"), React.createElement("div", {
    className: "text-xl font-semibold text-gray-600"
  }, "No teachers found"), React.createElement("div", {
    className: "text-gray-500 mt-2"
  }, "Try adjusting your search filters")) : React.createElement("div", {
    className: "grid md:grid-cols-2 lg:grid-cols-3 gap-6"
  }, filteredTeachers.map(teacher => React.createElement("div", {
    key: teacher.docId,
    className: `bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-1 ${teacher.isArchived ? 'ring-2 ring-red-400 opacity-75' : ''}`,
    onClick: () => setSelectedTeacher(teacher)
  }, teacher.isArchived && React.createElement("div", {
    className: "bg-red-500 text-white text-center py-1 text-xs font-bold"
  }, "\uD83D\uDCE6 ARCHIVED - ", teacher.archiveReason || 'Unknown'), React.createElement("div", {
    className: `bg-gradient-to-r ${teacher.isArchived ? 'from-gray-400 to-gray-500' : getSchoolColor(teacher.school)} p-4 text-white`
  }, React.createElement("div", {
    className: "flex items-start justify-between"
  }, React.createElement("div", {
    className: "flex-1"
  }, React.createElement("div", {
    className: "text-xs font-semibold opacity-90 mb-1"
  }, teacher.school), React.createElement("div", {
    className: "text-sm opacity-90"
  }, teacher.grade || 'Class 11 & 12')), React.createElement("div", {
    className: "text-3xl"
  }, teacher.isArchived ? '📦' : getSubjectIcon(teacher.subject)))), React.createElement("div", {
    className: "flex justify-center -mt-10 mb-4"
  }, teacher.profilePhoto ? React.createElement("img", {
    src: teacher.profilePhoto,
    alt: teacher.name,
    className: `w-20 h-20 rounded-full border-4 shadow-lg object-cover ${teacher.isArchived ? 'border-red-300 grayscale' : 'border-white'}`
  }) : React.createElement("div", {
    className: `w-20 h-20 rounded-full border-4 shadow-lg flex items-center justify-center text-3xl font-bold text-white ${teacher.isArchived ? 'border-red-300 bg-gradient-to-br from-gray-400 to-gray-500' : 'border-white bg-gradient-to-br from-gray-300 to-gray-400'}`
  }, teacher.name?.charAt(0) || '?')), React.createElement("div", {
    className: "px-4 pb-4 space-y-3"
  }, React.createElement("div", {
    className: "text-center"
  }, React.createElement("div", {
    className: `text-xl font-bold ${teacher.isArchived ? 'text-red-600' : 'text-gray-800'}`
  }, teacher.name, teacher.isArchived && React.createElement("span", {
    className: "text-sm ml-1"
  }, "(Archived)")), React.createElement("div", {
    className: "text-sm font-semibold text-gray-600"
  }, teacher.subject), teacher.isArchived && React.createElement("div", {
    className: "mt-2"
  }, React.createElement("span", {
    className: `px-3 py-1 rounded-full text-xs font-bold ${teacher.archiveReason === 'Resigned' ? 'bg-yellow-100 text-yellow-800' : teacher.archiveReason === 'Removed' ? 'bg-red-100 text-red-800' : teacher.archiveReason === 'Transferred' ? 'bg-blue-100 text-blue-800' : teacher.archiveReason === 'On Long Leave' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`
  }, teacher.archiveReason === 'Resigned' && '😔 ', teacher.archiveReason === 'Removed' && '❌ ', teacher.archiveReason === 'Transferred' && '🔄 ', teacher.archiveReason === 'On Long Leave' && '🏖️ ', teacher.archiveReason || 'Archived'), teacher.archivedAt && React.createElement("div", {
    className: "text-xs text-gray-500 mt-1"
  }, "Since ", new Date(teacher.archivedAt).toLocaleDateString()))), React.createElement("div", {
    className: "space-y-2 text-sm"
  }, teacher.phone && React.createElement("div", {
    className: "flex items-center gap-2 text-gray-700"
  }, React.createElement("span", {
    className: "text-lg"
  }, "\uD83D\uDCF1"), React.createElement("span", {
    className: "font-medium"
  }, teacher.phone)), teacher.whatsapp && React.createElement("div", {
    className: "flex items-center gap-2 text-gray-700"
  }, React.createElement("span", {
    className: "text-lg"
  }, "\uD83D\uDCAC"), React.createElement("span", {
    className: "font-medium"
  }, teacher.whatsapp)), teacher.email && React.createElement("div", {
    className: "flex items-center gap-2 text-gray-700"
  }, React.createElement("span", {
    className: "text-lg"
  }, "\uD83D\uDCE7"), React.createElement("span", {
    className: "font-medium text-xs break-all"
  }, teacher.email))), React.createElement("div", {
    className: "grid grid-cols-2 gap-2 pt-2 border-t"
  }, teacher.dateOfJoining && React.createElement("div", {
    className: "text-center"
  }, React.createElement("div", {
    className: "text-xs text-gray-500"
  }, "Joined"), React.createElement("div", {
    className: "text-sm font-semibold text-gray-700"
  }, new Date(teacher.dateOfJoining).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }))), teacher.dateOfBirth && React.createElement("div", {
    className: "text-center"
  }, React.createElement("div", {
    className: "text-xs text-gray-500"
  }, "Birthday"), React.createElement("div", {
    className: "text-sm font-semibold text-gray-700"
  }, new Date(teacher.dateOfBirth).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short'
  })))), React.createElement("div", {
    className: "text-center pt-2"
  }, React.createElement("button", {
    className: "text-xs text-blue-600 font-semibold hover:text-blue-800"
  }, "Click for full details \u2192")))))), selectedTeacher && React.createElement("div", {
    className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4",
    onClick: () => setSelectedTeacher(null)
  }, React.createElement("div", {
    className: "bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto",
    onClick: e => e.stopPropagation()
  }, selectedTeacher.isArchived && React.createElement("div", {
    className: "bg-red-500 text-white p-4"
  }, React.createElement("div", {
    className: "flex items-center justify-center gap-2"
  }, React.createElement("span", {
    className: "text-2xl"
  }, "\uD83D\uDCE6"), React.createElement("div", null, React.createElement("div", {
    className: "font-bold"
  }, "This teacher has been archived"), React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Reason: ", selectedTeacher.archiveReason || 'Not specified', selectedTeacher.archivedAt && ` • Since ${new Date(selectedTeacher.archivedAt).toLocaleDateString()}`), selectedTeacher.archiveNotes && React.createElement("div", {
    className: "text-sm opacity-80 mt-1"
  }, "Notes: ", selectedTeacher.archiveNotes)))), React.createElement("div", {
    className: `bg-gradient-to-r ${selectedTeacher.isArchived ? 'from-gray-400 to-gray-500' : getSchoolColor(selectedTeacher.school)} p-6 text-white relative`
  }, React.createElement("button", {
    onClick: () => setSelectedTeacher(null),
    className: "absolute top-4 right-4 text-white text-2xl hover:text-gray-200 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20"
  }, "\xD7"), React.createElement("div", {
    className: "flex items-center gap-4"
  }, selectedTeacher.profilePhoto ? React.createElement("img", {
    src: selectedTeacher.profilePhoto,
    alt: selectedTeacher.name,
    className: `w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover ${selectedTeacher.isArchived ? 'grayscale' : ''}`
  }) : React.createElement("div", {
    className: "w-24 h-24 rounded-full border-4 border-white shadow-lg bg-white/30 flex items-center justify-center text-4xl font-bold"
  }, selectedTeacher.name?.charAt(0) || '?'), React.createElement("div", {
    className: "flex-1"
  }, React.createElement("div", {
    className: "text-2xl font-bold"
  }, selectedTeacher.name, selectedTeacher.isArchived && React.createElement("span", {
    className: "text-sm ml-2 bg-red-600 px-2 py-1 rounded"
  }, "Archived")), React.createElement("div", {
    className: "text-lg opacity-90"
  }, selectedTeacher.subject), React.createElement("div", {
    className: "text-sm opacity-80 mt-1"
  }, selectedTeacher.school)))), React.createElement("div", {
    className: "p-6 space-y-6"
  }, React.createElement("div", null, React.createElement("div", {
    className: "text-lg font-bold mb-3 flex items-center gap-2"
  }, React.createElement("span", null, "\uD83D\uDCDE"), " Contact Information"), React.createElement("div", {
    className: "bg-gray-50 rounded-xl p-4 space-y-3"
  }, selectedTeacher.phone && React.createElement("div", {
    className: "flex items-center justify-between"
  }, React.createElement("span", {
    className: "text-gray-600 font-medium"
  }, "Phone:"), React.createElement("a", {
    href: `tel:${selectedTeacher.phone}`,
    className: "text-blue-600 font-semibold hover:underline"
  }, selectedTeacher.phone)), selectedTeacher.whatsapp && React.createElement("div", {
    className: "flex items-center justify-between"
  }, React.createElement("span", {
    className: "text-gray-600 font-medium"
  }, "WhatsApp:"), React.createElement("a", {
    href: `https://wa.me/${selectedTeacher.whatsapp.replace(/[^0-9]/g, '')}`,
    target: "_blank",
    rel: "noopener noreferrer",
    className: "text-green-600 font-semibold hover:underline"
  }, selectedTeacher.whatsapp)), selectedTeacher.email && React.createElement("div", {
    className: "flex items-start justify-between"
  }, React.createElement("span", {
    className: "text-gray-600 font-medium"
  }, "Email:"), React.createElement("a", {
    href: `mailto:${selectedTeacher.email}`,
    className: "text-blue-600 font-semibold hover:underline text-right break-all"
  }, selectedTeacher.email)), selectedTeacher.driveLink && React.createElement("div", {
    className: "flex items-center justify-between"
  }, React.createElement("span", {
    className: "text-gray-600 font-medium"
  }, "\uD83D\uDCC1 Drive Folder:"), React.createElement("a", {
    href: selectedTeacher.driveLink,
    target: "_blank",
    rel: "noopener noreferrer",
    className: "text-blue-600 font-semibold hover:underline"
  }, "Open Folder \u2192")))), React.createElement("div", null, React.createElement("div", {
    className: "text-lg font-bold mb-3 flex items-center gap-2"
  }, React.createElement("span", null, "\uD83D\uDC64"), " Personal Information"), React.createElement("div", {
    className: "bg-gray-50 rounded-xl p-4 space-y-3"
  }, React.createElement("div", {
    className: "flex items-center justify-between"
  }, React.createElement("span", {
    className: "text-gray-600 font-medium"
  }, "Class:"), React.createElement("span", {
    className: "font-semibold"
  }, selectedTeacher.grade || 'Class 11 & 12')), selectedTeacher.dateOfBirth && React.createElement("div", {
    className: "flex items-center justify-between"
  }, React.createElement("span", {
    className: "text-gray-600 font-medium"
  }, "Date of Birth:"), React.createElement("span", {
    className: "font-semibold"
  }, new Date(selectedTeacher.dateOfBirth).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }))), selectedTeacher.dateOfJoining && React.createElement("div", {
    className: "flex items-center justify-between"
  }, React.createElement("span", {
    className: "text-gray-600 font-medium"
  }, "Date of Joining:"), React.createElement("span", {
    className: "font-semibold"
  }, new Date(selectedTeacher.dateOfJoining).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }))), selectedTeacher.anniversary && React.createElement("div", {
    className: "flex items-center justify-between"
  }, React.createElement("span", {
    className: "text-gray-600 font-medium"
  }, "Anniversary:"), React.createElement("span", {
    className: "font-semibold"
  }, new Date(selectedTeacher.anniversary).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long'
  }))))), (selectedTeacher.additionalDetails || selectedTeacher.qualification || selectedTeacher.experience || selectedTeacher.bio) && React.createElement("div", null, React.createElement("div", {
    className: "text-lg font-bold mb-3 flex items-center gap-2"
  }, React.createElement("span", null, "\uD83D\uDCDD"), " Additional Information"), React.createElement("div", {
    className: "bg-gray-50 rounded-xl p-4 space-y-3"
  }, selectedTeacher.qualification && React.createElement("div", null, React.createElement("span", {
    className: "text-gray-600 font-medium"
  }, "Qualification:"), React.createElement("div", {
    className: "font-semibold mt-1"
  }, selectedTeacher.qualification)), selectedTeacher.experience && React.createElement("div", null, React.createElement("span", {
    className: "text-gray-600 font-medium"
  }, "Experience:"), React.createElement("div", {
    className: "font-semibold mt-1"
  }, selectedTeacher.experience)), selectedTeacher.bio && React.createElement("div", null, React.createElement("span", {
    className: "text-gray-600 font-medium"
  }, "About:"), React.createElement("div", {
    className: "font-semibold mt-1"
  }, selectedTeacher.bio)), selectedTeacher.additionalDetails && React.createElement("div", null, React.createElement("span", {
    className: "text-gray-600 font-medium"
  }, "Notes:"), React.createElement("div", {
    className: "font-semibold mt-1"
  }, selectedTeacher.additionalDetails)))), React.createElement("div", {
    className: "grid grid-cols-2 gap-3 pt-4"
  }, selectedTeacher.phone && React.createElement("a", {
    href: `tel:${selectedTeacher.phone}`,
    className: "bg-blue-500 text-white px-4 py-3 rounded-xl font-semibold text-center hover:bg-blue-600 transition-colors"
  }, "\uD83D\uDCF1 Call"), selectedTeacher.whatsapp && React.createElement("a", {
    href: `https://wa.me/${selectedTeacher.whatsapp.replace(/[^0-9]/g, '')}`,
    target: "_blank",
    rel: "noopener noreferrer",
    className: "bg-green-500 text-white px-4 py-3 rounded-xl font-semibold text-center hover:bg-green-600 transition-colors"
  }, "\uD83D\uDCAC WhatsApp"))))));
}
function OrgChartDirectory({
  teachers,
  currentUser
}) {
  const [managers, setManagers] = useState([]);
  const [apcs, setApcs] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSchool, setFilterSchool] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterManager, setFilterManager] = useState('all');
  // ✅ FIX: Safety timeout - stop loading after 10s if Firebase fails silently
  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch each collection independently so partial failures don't break everything
        const [managersResult, apcsResult, teachersResult] = await Promise.allSettled([
          db.collection('managers').get(),
          db.collection('apcs').get(),
          db.collection('teachers').get()
        ]);
        if (managersResult.status === 'fulfilled') {
          setManagers(managersResult.value.docs.map(doc => ({id: doc.id, ...doc.data()})));
        }
        if (apcsResult.status === 'fulfilled') {
          setApcs(apcsResult.value.docs.map(doc => ({id: doc.id, ...doc.data()})));
        }
        if (teachersResult.status === 'fulfilled') {
          setAllTeachers(teachersResult.value.docs.map(doc => ({docId: doc.id, ...doc.data()})));
        }
      } catch (error) {
        console.error('Directory load error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  const allMembers = useMemo(() => {
    const members = [];
    managers.filter(m => m.status === 'active').forEach(m => {
      members.push({
        ...m,
        memberType: m.role,
        displayRole: m.role === 'aph' ? 'Program Head (APH)' : m.role === 'pm' ? 'Program Manager (PM)' : m.role === 'apm' ? 'Associate Program Manager (APM)' : m.role,
        sortOrder: m.role === 'aph' ? 1 : m.role === 'pm' ? 2 : m.role === 'apm' ? 3 : 4
      });
    });
    apcs.forEach(a => {
      members.push({
        ...a,
        memberType: 'apc',
        displayRole: 'Academic Program Coordinator (APC)',
        sortOrder: 5
      });
    });
    allTeachers.filter(t => !t.isArchived && t.name?.toLowerCase() !== 'vacant').forEach(t => {
      members.push({
        ...t,
        memberType: 'teacher',
        displayRole: t.subject ? `${t.subject} Teacher` : 'Teacher',
        sortOrder: 6
      });
    });
    return members.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [managers, apcs, allTeachers]);
  const filterOptions = useMemo(() => {
    const schools = new Set();
    const subjects = new Set();
    allMembers.forEach(m => {
      if (m.school) schools.add(m.school);
      if (m.directSchools) m.directSchools.forEach(s => schools.add(s));
      if (m.subject) subjects.add(m.subject);
    });
    return {
      schools: Array.from(schools).sort(),
      subjects: Array.from(subjects).sort(),
      managers: managers.filter(m => m.status === 'active' && ['pm', 'apm'].includes(m.role))
    };
  }, [allMembers, managers]);
  const getMemberManager = member => {
    if (member.memberType === 'teacher' || member.memberType === 'apc') {
      const school = member.school;
      if (!school) return null;
      const apm = managers.find(m => m.role === 'apm' && m.directSchools?.includes(school));
      if (apm) return apm;
      const pm = managers.find(m => m.role === 'pm' && m.directSchools?.includes(school));
      if (pm) return pm;
    }
    return null;
  };
  const filteredMembers = useMemo(() => {
    return allMembers.filter(m => {
      const matchesSearch = !searchQuery || m.name?.toLowerCase().includes(searchQuery.toLowerCase()) || m.email?.toLowerCase().includes(searchQuery.toLowerCase()) || m.school?.toLowerCase().includes(searchQuery.toLowerCase()) || m.afid?.toLowerCase().includes(searchQuery.toLowerCase()) || m.afCode?.toLowerCase().includes(searchQuery.toLowerCase()) || m.phone?.includes(searchQuery) || m.whatsapp?.includes(searchQuery);
      const matchesRole = filterRole === 'all' || m.memberType === filterRole;
      let matchesSchool = filterSchool === 'all';
      if (!matchesSchool) {
        if (m.school === filterSchool) matchesSchool = true;
        if (m.directSchools?.includes(filterSchool)) matchesSchool = true;
      }
      const matchesSubject = filterSubject === 'all' || m.subject === filterSubject;
      let matchesManager = filterManager === 'all';
      if (!matchesManager) {
        const memberManager = getMemberManager(m);
        if (memberManager?.id === filterManager) matchesManager = true;
        if (m.id === filterManager) matchesManager = true;
        const selectedManager = managers.find(mgr => mgr.id === filterManager);
        if (selectedManager?.directSchools?.includes(m.school)) matchesManager = true;
      }
      return matchesSearch && matchesRole && matchesSchool && matchesSubject && matchesManager;
    });
  }, [allMembers, searchQuery, filterRole, filterSchool, filterSubject, filterManager, managers]);
  const getRoleColor = role => ({
    'aph': {
      bg: 'bg-purple-100',
      text: 'text-purple-700',
      border: 'border-purple-500',
      gradient: 'from-purple-500 to-purple-600'
    },
    'pm': {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      border: 'border-blue-500',
      gradient: 'from-blue-500 to-blue-600'
    },
    'apm': {
      bg: 'bg-green-100',
      text: 'text-green-700',
      border: 'border-green-500',
      gradient: 'from-green-500 to-green-600'
    },
    'apc': {
      bg: 'bg-orange-100',
      text: 'text-orange-700',
      border: 'border-orange-500',
      gradient: 'from-orange-500 to-orange-600'
    },
    'teacher': {
      bg: 'bg-pink-100',
      text: 'text-pink-700',
      border: 'border-pink-500',
      gradient: 'from-pink-500 to-pink-600'
    }
  })[role] || {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-500',
    gradient: 'from-gray-500 to-gray-600'
  };
  const getSubjectColor = subject => ({
    'Physics': '#3b82f6',
    'Chemistry': '#8b5cf6',
    'Mathematics': '#ef4444',
    'Maths': '#ef4444',
    'Biology': '#10b981',
    'Bio': '#10b981'
  })[subject] || '#6b7280';
  const clearFilters = () => {
    setSearchQuery('');
    setFilterSchool('all');
    setFilterRole('all');
    setFilterSubject('all');
    setFilterManager('all');
  };
  const hasActiveFilters = searchQuery || filterSchool !== 'all' || filterRole !== 'all' || filterSubject !== 'all' || filterManager !== 'all';
  if (loading) {
    return React.createElement("div", {
      className: "flex items-center justify-center h-64"
    }, React.createElement("div", {
      className: "animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent"
    }));
  }
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("div", {
    className: "flex flex-col md:flex-row md:items-center justify-between gap-4"
  }, React.createElement("div", {
    className: "inline-flex items-center gap-3 bg-gradient-to-r from-yellow-100 via-orange-100 to-red-100 px-6 py-3 rounded-full shadow-lg"
  }, React.createElement("span", {
    className: "text-3xl"
  }, "\uD83D\uDC65"), React.createElement("h2", {
    className: "text-2xl md:text-3xl font-bold bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 bg-clip-text text-transparent"
  }, "Team Directory")), React.createElement("div", {
    className: "text-sm text-gray-500"
  }, filteredMembers.length, " of ", allMembers.length, " members")), React.createElement("div", {
    className: "bg-white rounded-2xl p-4 shadow-lg border border-gray-100"
  }, React.createElement("div", {
    className: "mb-4"
  }, React.createElement("div", {
    className: "relative"
  }, React.createElement("span", {
    className: "absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl"
  }, "\uD83D\uDD0D"), React.createElement("input", {
    type: "text",
    placeholder: "Search by name, email, phone, AFID...",
    value: searchQuery,
    onChange: e => setSearchQuery(e.target.value),
    className: "w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:border-yellow-400 focus:outline-none text-lg"
  }), searchQuery && React.createElement("button", {
    onClick: () => setSearchQuery(''),
    className: "absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
  }, "\u2715"))), React.createElement("div", {
    className: "grid grid-cols-2 md:grid-cols-4 gap-3"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-xs font-semibold text-gray-500 mb-1 ml-1"
  }, "\uD83C\uDFEB School"), React.createElement("select", {
    value: filterSchool,
    onChange: e => setFilterSchool(e.target.value),
    className: "w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-white focus:border-yellow-400 focus:outline-none text-sm"
  }, React.createElement("option", {
    value: "all"
  }, "All Schools"), filterOptions.schools.map(school => React.createElement("option", {
    key: school,
    value: school
  }, school)))), React.createElement("div", null, React.createElement("label", {
    className: "block text-xs font-semibold text-gray-500 mb-1 ml-1"
  }, "\uD83D\uDC64 Role"), React.createElement("select", {
    value: filterRole,
    onChange: e => setFilterRole(e.target.value),
    className: "w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-white focus:border-yellow-400 focus:outline-none text-sm"
  }, React.createElement("option", {
    value: "all"
  }, "All Roles"), React.createElement("option", {
    value: "aph"
  }, "Program Head (APH)"), React.createElement("option", {
    value: "pm"
  }, "Program Manager (PM)"), React.createElement("option", {
    value: "apm"
  }, "Associate PM (APM)"), React.createElement("option", {
    value: "apc"
  }, "Coordinator (APC)"), React.createElement("option", {
    value: "teacher"
  }, "Teachers"))), React.createElement("div", null, React.createElement("label", {
    className: "block text-xs font-semibold text-gray-500 mb-1 ml-1"
  }, "\uD83D\uDCDA Subject"), React.createElement("select", {
    value: filterSubject,
    onChange: e => setFilterSubject(e.target.value),
    className: "w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-white focus:border-yellow-400 focus:outline-none text-sm"
  }, React.createElement("option", {
    value: "all"
  }, "All Subjects"), filterOptions.subjects.map(subject => React.createElement("option", {
    key: subject,
    value: subject
  }, subject)))), React.createElement("div", null, React.createElement("label", {
    className: "block text-xs font-semibold text-gray-500 mb-1 ml-1"
  }, "\uD83D\uDC68\u200D\uD83D\uDCBC Manager"), React.createElement("select", {
    value: filterManager,
    onChange: e => setFilterManager(e.target.value),
    className: "w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-white focus:border-yellow-400 focus:outline-none text-sm"
  }, React.createElement("option", {
    value: "all"
  }, "All Managers"), filterOptions.managers.map(mgr => React.createElement("option", {
    key: mgr.id,
    value: mgr.id
  }, mgr.name, " (", mgr.role === 'pm' ? 'PM' : 'APM', ")"))))), hasActiveFilters && React.createElement("div", {
    className: "mt-3 flex items-center justify-between"
  }, React.createElement("div", {
    className: "flex flex-wrap gap-2"
  }, searchQuery && React.createElement("span", {
    className: "inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs"
  }, "Search: \"", searchQuery, "\" ", React.createElement("button", {
    onClick: () => setSearchQuery('')
  }, "\u2715")), filterSchool !== 'all' && React.createElement("span", {
    className: "inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs"
  }, "\uD83C\uDFEB ", filterSchool, " ", React.createElement("button", {
    onClick: () => setFilterSchool('all')
  }, "\u2715")), filterRole !== 'all' && React.createElement("span", {
    className: "inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs"
  }, "\uD83D\uDC64 ", filterRole.toUpperCase(), " ", React.createElement("button", {
    onClick: () => setFilterRole('all')
  }, "\u2715")), filterSubject !== 'all' && React.createElement("span", {
    className: "inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs"
  }, "\uD83D\uDCDA ", filterSubject, " ", React.createElement("button", {
    onClick: () => setFilterSubject('all')
  }, "\u2715")), filterManager !== 'all' && React.createElement("span", {
    className: "inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs"
  }, "\uD83D\uDC68\u200D\uD83D\uDCBC ", managers.find(m => m.id === filterManager)?.name, " ", React.createElement("button", {
    onClick: () => setFilterManager('all')
  }, "\u2715"))), React.createElement("button", {
    onClick: clearFilters,
    className: "text-sm text-red-500 hover:text-red-700 font-medium"
  }, "Clear All"))), React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
  }, filteredMembers.map((member, idx) => {
    const roleColor = getRoleColor(member.memberType);
    const memberManager = getMemberManager(member);
    return React.createElement("div", {
      key: member.id || idx,
      className: `bg-white rounded-xl p-4 shadow-md hover:shadow-xl transition-all cursor-pointer border-l-4 ${roleColor.border} hover:-translate-y-1`,
      onClick: () => setSelectedMember(member)
    }, React.createElement("div", {
      className: "flex items-start gap-3"
    }, member.profilePhoto ? React.createElement("img", {
      src: member.profilePhoto,
      alt: "",
      className: "w-14 h-14 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
    }) : React.createElement("div", {
      className: `w-14 h-14 rounded-full bg-gradient-to-br ${roleColor.gradient} flex items-center justify-center text-xl font-bold text-white flex-shrink-0`
    }, member.name?.charAt(0) || '?'), React.createElement("div", {
      className: "flex-1 min-w-0"
    }, React.createElement("div", {
      className: "font-bold text-gray-800 truncate"
    }, member.name), React.createElement("div", {
      className: `text-xs px-2 py-0.5 rounded-full inline-block ${roleColor.bg} ${roleColor.text} font-medium mt-1`
    }, member.displayRole), member.school && React.createElement("div", {
      className: "text-sm text-gray-500 mt-1 truncate flex items-center gap-1"
    }, React.createElement("span", null, "\uD83C\uDFEB"), " ", member.school), member.directSchools?.length > 0 && React.createElement("div", {
      className: "text-xs text-gray-400 mt-1 truncate"
    }, "Manages: ", member.directSchools.slice(0, 2).join(', '), member.directSchools.length > 2 ? ` +${member.directSchools.length - 2}` : ''), member.subject && React.createElement("span", {
      className: "inline-block mt-1 text-xs px-2 py-0.5 rounded-full text-white font-medium",
      style: {
        background: getSubjectColor(member.subject)
      }
    }, member.subject))), React.createElement("div", {
      className: "mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2"
    }, React.createElement(LastActiveBadge, {
      userId: member.afid || member.uid || member.id || member.email
    }), member.phone && React.createElement("a", {
      href: `tel:${member.phone}`,
      onClick: e => e.stopPropagation(),
      className: "text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full hover:bg-blue-100 flex items-center gap-1"
    }, "\uD83D\uDCF1 Call"), member.whatsapp && React.createElement("a", {
      href: `https://wa.me/${member.whatsapp.replace(/[^0-9]/g, '')}`,
      target: "_blank",
      onClick: e => e.stopPropagation(),
      className: "text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full hover:bg-green-100 flex items-center gap-1"
    }, "\uD83D\uDCAC WhatsApp"), member.email && React.createElement("a", {
      href: `mailto:${member.email}`,
      onClick: e => e.stopPropagation(),
      className: "text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-full hover:bg-purple-100 flex items-center gap-1"
    }, "\uD83D\uDCE7 Email"), !member.phone && !member.whatsapp && !member.email && React.createElement("span", {
      className: "text-xs text-gray-400"
    }, "No contact info")), memberManager && React.createElement("div", {
      className: "mt-2 text-xs text-gray-400 flex items-center gap-1"
    }, React.createElement("span", null, "\u21B3"), " Reports to: ", React.createElement("span", {
      className: "font-medium text-gray-600"
    }, memberManager.name)));
  }), filteredMembers.length === 0 && React.createElement("div", {
    className: "col-span-full text-center py-16 text-gray-500"
  }, React.createElement("div", {
    className: "text-6xl mb-4"
  }, "\uD83D\uDD0D"), React.createElement("p", {
    className: "text-xl font-semibold"
  }, "No members found"), React.createElement("p", {
    className: "text-sm mt-2"
  }, "Try adjusting your filters"), hasActiveFilters && React.createElement("button", {
    onClick: clearFilters,
    className: "mt-4 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
  }, "Clear All Filters"))), selectedMember && React.createElement("div", {
    className: "fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4",
    onClick: () => setSelectedMember(null)
  }, React.createElement("div", {
    className: "bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "p-6 text-white rounded-t-3xl relative",
    style: {
      background: `linear-gradient(135deg, ${selectedMember.memberType === 'aph' ? '#8b5cf6, #7c3aed' : selectedMember.memberType === 'pm' ? '#3b82f6, #2563eb' : selectedMember.memberType === 'apm' ? '#10b981, #059669' : selectedMember.memberType === 'apc' ? '#f59e0b, #d97706' : getSubjectColor(selectedMember.subject) + ', ' + getSubjectColor(selectedMember.subject) + 'cc'})`
    }
  }, React.createElement("button", {
    onClick: () => setSelectedMember(null),
    className: "absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-xl font-bold"
  }, "\u2715"), React.createElement("div", {
    className: "flex items-center gap-4"
  }, selectedMember.profilePhoto ? React.createElement("img", {
    src: selectedMember.profilePhoto,
    alt: "",
    className: "w-20 h-20 rounded-2xl object-cover border-4 border-white/30"
  }) : React.createElement("div", {
    className: "w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-4xl font-bold"
  }, selectedMember.name?.charAt(0)), React.createElement("div", null, React.createElement("h3", {
    className: "text-2xl font-bold"
  }, selectedMember.name), React.createElement("p", {
    className: "opacity-90"
  }, selectedMember.displayRole)))), React.createElement("div", {
    className: "p-5 space-y-3"
  }, (selectedMember.afid || selectedMember.afCode) && React.createElement("div", {
    className: "flex items-center gap-3 p-3 bg-purple-50 rounded-xl"
  }, React.createElement("span", {
    className: "text-xl"
  }, "\uD83C\uDD94"), React.createElement("div", null, React.createElement("div", {
    className: "text-xs text-gray-500"
  }, "AF ID / Code"), React.createElement("div", {
    className: "font-semibold"
  }, selectedMember.afid || selectedMember.afCode))), selectedMember.school && React.createElement("div", {
    className: "flex items-center gap-3 p-3 bg-yellow-50 rounded-xl"
  }, React.createElement("span", {
    className: "text-xl"
  }, "\uD83C\uDFEB"), React.createElement("div", null, React.createElement("div", {
    className: "text-xs text-gray-500"
  }, "School"), React.createElement("div", {
    className: "font-semibold"
  }, selectedMember.school))), selectedMember.directSchools?.length > 0 && React.createElement("div", {
    className: "flex items-start gap-3 p-3 bg-yellow-50 rounded-xl"
  }, React.createElement("span", {
    className: "text-xl"
  }, "\uD83C\uDFEB"), React.createElement("div", null, React.createElement("div", {
    className: "text-xs text-gray-500"
  }, "Manages Schools"), React.createElement("div", {
    className: "font-semibold"
  }, selectedMember.directSchools.join(', ')))), selectedMember.subject && React.createElement("div", {
    className: "flex items-center gap-3 p-3 bg-blue-50 rounded-xl"
  }, React.createElement("span", {
    className: "text-xl"
  }, "\uD83D\uDCDA"), React.createElement("div", null, React.createElement("div", {
    className: "text-xs text-gray-500"
  }, "Subject"), React.createElement("div", {
    className: "font-semibold"
  }, selectedMember.subject))), selectedMember.bio && React.createElement("div", {
    className: "flex items-start gap-3 p-3 bg-gray-50 rounded-xl"
  }, React.createElement("span", {
    className: "text-xl"
  }, "\uD83D\uDCDD"), React.createElement("div", null, React.createElement("div", {
    className: "text-xs text-gray-500"
  }, "About"), React.createElement("div", {
    className: "font-medium text-sm"
  }, selectedMember.bio))), selectedMember.qualification && React.createElement("div", {
    className: "flex items-center gap-3 p-3 bg-orange-50 rounded-xl"
  }, React.createElement("span", {
    className: "text-xl"
  }, "\uD83C\uDF93"), React.createElement("div", null, React.createElement("div", {
    className: "text-xs text-gray-500"
  }, "Qualification"), React.createElement("div", {
    className: "font-semibold"
  }, selectedMember.qualification))), selectedMember.experience && React.createElement("div", {
    className: "flex items-center gap-3 p-3 bg-amber-50 rounded-xl"
  }, React.createElement("span", {
    className: "text-xl"
  }, "\uD83D\uDCBC"), React.createElement("div", null, React.createElement("div", {
    className: "text-xs text-gray-500"
  }, "Experience"), React.createElement("div", {
    className: "font-semibold"
  }, selectedMember.experience))), selectedMember.email && React.createElement("div", {
    className: "flex items-center gap-3 p-3 bg-indigo-50 rounded-xl"
  }, React.createElement("span", {
    className: "text-xl"
  }, "\uD83D\uDCE7"), React.createElement("div", null, React.createElement("div", {
    className: "text-xs text-gray-500"
  }, "Email"), React.createElement("a", {
    href: `mailto:${selectedMember.email}`,
    className: "font-semibold text-blue-600 hover:underline break-all"
  }, selectedMember.email))), selectedMember.phone && React.createElement("div", {
    className: "flex items-center gap-3 p-3 bg-cyan-50 rounded-xl"
  }, React.createElement("span", {
    className: "text-xl"
  }, "\uD83D\uDCF1"), React.createElement("div", null, React.createElement("div", {
    className: "text-xs text-gray-500"
  }, "Phone Number"), React.createElement("a", {
    href: `tel:${selectedMember.phone}`,
    className: "font-semibold text-blue-600 hover:underline"
  }, selectedMember.phone))), selectedMember.whatsapp && React.createElement("div", {
    className: "flex items-center gap-3 p-3 bg-green-50 rounded-xl"
  }, React.createElement("span", {
    className: "text-xl"
  }, "\uD83D\uDCAC"), React.createElement("div", null, React.createElement("div", {
    className: "text-xs text-gray-500"
  }, "WhatsApp"), React.createElement("a", {
    href: `https://wa.me/${selectedMember.whatsapp.replace(/[^0-9]/g, '')}`,
    target: "_blank",
    className: "font-semibold text-green-600 hover:underline"
  }, selectedMember.whatsapp))), (selectedMember.dateOfBirth || selectedMember.dob) && React.createElement("div", {
    className: "flex items-center gap-3 p-3 bg-pink-50 rounded-xl"
  }, React.createElement("span", {
    className: "text-xl"
  }, "\uD83C\uDF82"), React.createElement("div", null, React.createElement("div", {
    className: "text-xs text-gray-500"
  }, "Birthday"), React.createElement("div", {
    className: "font-semibold"
  }, new Date(selectedMember.dateOfBirth || selectedMember.dob).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long'
  })))), selectedMember.joiningDate && React.createElement("div", {
    className: "flex items-center gap-3 p-3 bg-teal-50 rounded-xl"
  }, React.createElement("span", {
    className: "text-xl"
  }, "\uD83D\uDCC5"), React.createElement("div", null, React.createElement("div", {
    className: "text-xs text-gray-500"
  }, "Joined Avanti"), React.createElement("div", {
    className: "font-semibold"
  }, new Date(selectedMember.joiningDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })))), selectedMember.driveLink && React.createElement("div", {
    className: "flex items-center gap-3 p-3 bg-sky-50 rounded-xl"
  }, React.createElement("span", {
    className: "text-xl"
  }, "\uD83D\uDCC1"), React.createElement("div", null, React.createElement("div", {
    className: "text-xs text-gray-500"
  }, "Drive Folder"), React.createElement("a", {
    href: selectedMember.driveLink,
    target: "_blank",
    className: "font-semibold text-blue-600 hover:underline"
  }, "Open Folder \u2192"))), (selectedMember.phone || selectedMember.whatsapp || selectedMember.email) && React.createElement("div", {
    className: "grid grid-cols-3 gap-2 pt-3"
  }, selectedMember.phone && React.createElement("a", {
    href: `tel:${selectedMember.phone}`,
    className: "bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-semibold text-center hover:shadow-lg text-sm flex items-center justify-center gap-1"
  }, "\uD83D\uDCF1 Call"), selectedMember.whatsapp && React.createElement("a", {
    href: `https://wa.me/${selectedMember.whatsapp.replace(/[^0-9]/g, '')}`,
    target: "_blank",
    className: "bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-semibold text-center hover:shadow-lg text-sm flex items-center justify-center gap-1"
  }, "\uD83D\uDCAC WhatsApp"), selectedMember.email && React.createElement("a", {
    href: `mailto:${selectedMember.email}`,
    className: "bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 rounded-xl font-semibold text-center hover:shadow-lg text-sm flex items-center justify-center gap-1"
  }, "\uD83D\uDCE7 Email"))))));
}
function SocialWall({
  teachers,
  currentUser
}) {
  const [posts, setPosts] = useState([]);
  const [birthdays, setBirthdays] = useState([]);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);
  const [weekBirthdays, setWeekBirthdays] = useState([]);
  const [monthBirthdays, setMonthBirthdays] = useState([]);
  const [anniversaries, setAnniversaries] = useState([]);
  const [weekAnniversaries, setWeekAnniversaries] = useState([]);
  const [monthAnniversaries, setMonthAnniversaries] = useState([]);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showBirthdayPopup, setShowBirthdayPopup] = useState(null);
  // ✅ FIX: Safety timeout - if loading takes >10s, stop spinner and show empty state
  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 10000);
    return () => clearTimeout(timer);
  }, []);
  const [allMembers, setAllMembers] = useState([]);
  const [activeTab, setActiveTab] = useState('feed');
  const [celebrationReactions, setCelebrationReactions] = useState({});
  const [wishMessage, setWishMessage] = useState('');
  const [showWishInput, setShowWishInput] = useState(null);
  const [topPerformers, setTopPerformers] = useState([]);
  const [previousMonthWinners, setPreviousMonthWinners] = useState([]);
  const [recognitionLoading, setRecognitionLoading] = useState(false);
  const [postImage, setPostImage] = useState(null);
  const [postImagePreview, setPostImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyImage, setReplyImage] = useState(null);
  const [replyImagePreview, setReplyImagePreview] = useState(null);
  const [showGifPicker, setShowGifPicker] = useState(null);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [editingPost, setEditingPost] = useState(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const isAdminOrModerator = currentUser?.role === 'super_admin' || currentUser?.role === 'aph' || currentUser?.role === 'pm' || currentUser?.isSuperAdmin === true;
  const compressImage = (file, maxWidth = 1200, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        console.warn('[compressImage] Timeout - returning original file');
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
          console.warn('[compressImage] FileReader error - returning original file');
          resolve(file);
        };
        reader.onload = e => {
          const img = new Image();
          img.onerror = () => {
            clearTimeout(timeoutId);
            console.warn('[compressImage] Image load error - returning original file');
            resolve(file);
          };
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;
              if (width > maxWidth) {
                height = height * maxWidth / width;
                width = maxWidth;
              }
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                clearTimeout(timeoutId);
                console.warn('[compressImage] Canvas context error - returning original file');
                resolve(file);
                return;
              }
              ctx.drawImage(img, 0, 0, width, height);
              canvas.toBlob(blob => {
                clearTimeout(timeoutId);
                if (!blob) {
                  console.warn('[compressImage] toBlob returned null - returning original file');
                  resolve(file);
                  return;
                }
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                console.log(`Compressed: ${(file.size / 1024).toFixed(1)}KB → ${(compressedFile.size / 1024).toFixed(1)}KB`);
                resolve(compressedFile);
              }, 'image/jpeg', quality);
            } catch (canvasError) {
              clearTimeout(timeoutId);
              console.warn('[compressImage] Canvas error:', canvasError);
              resolve(file);
            }
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      } catch (error) {
        clearTimeout(timeoutId);
        console.warn('[compressImage] Unexpected error:', error);
        resolve(file);
      }
    });
  };
  const handlePostImageSelect = async e => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size should be less than 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setPostImagePreview(reader.result);
      reader.readAsDataURL(file);
      const compressed = await compressImage(file);
      setPostImage(compressed);
    }
  };
  const handleReplyImageSelect = async e => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size should be less than 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setReplyImagePreview(reader.result);
      reader.readAsDataURL(file);
      const compressed = await compressImage(file);
      setReplyImage(compressed);
    }
  };
  const uploadImage = async (file, path) => {
    if (!file || typeof firebase === 'undefined') return null;
    try {
      const storageRef = firebase.storage().ref();
      const fileRef = storageRef.child(path + '/' + Date.now() + '_' + file.name);
      await fileRef.put(file);
      const url = await fileRef.getDownloadURL();
      console.log('[SocialWall] Image uploaded to Storage successfully');
      return url;
    } catch (e) {
      console.warn('[SocialWall] Storage upload failed (CORS?), trying base64 fallback:', e.message);
      try {
        const compressedFile = await compressImageForBase64(file);
        const base64 = await fileToBase64(compressedFile);
        if (base64.length > 750000) {
          throw new Error('Image too large even after compression');
        }
        console.log('[SocialWall] Using base64 fallback, size:', Math.round(base64.length / 1024) + 'KB');
        return base64;
      } catch (fallbackError) {
        console.error('[SocialWall] Base64 fallback also failed:', fallbackError);
        alert('⚠️ Image upload failed. Please try:\\n\\n1. Use a smaller image\\n2. Check your internet connection\\n3. Try again');
        return null;
      }
    }
  };
  const compressImageForBase64 = async file => {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 600;
          let {
            width,
            height
          } = img;
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = height / width * maxSize;
              width = maxSize;
            } else {
              width = width / height * maxSize;
              height = maxSize;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(resolve, 'image/jpeg', 0.5);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };
  const fileToBase64 = file => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };
  const popularGifs = ['https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif', 'https://media.giphy.com/media/3oz8xIsloV7zOmt81G/giphy.gif', 'https://media.giphy.com/media/BPJmthQ3YRwD6QqcVD/giphy.gif', 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif', 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif', 'https://media.giphy.com/media/KJ1f5iTl4Oo7u/giphy.gif', 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif', 'https://media.giphy.com/media/l3q2K5jinAlChoCLS/giphy.gif'];
  const celebrationEmojis = ['🎉', '🎂', '🥳', '❤️', '👏', '🎊'];
  const loadCelebrationReactions = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const reactionsSnap = await db.collection('celebrationReactions').where('date', '==', today).get();
      const reactions = {};
      reactionsSnap.docs.forEach(doc => {
        const data = doc.data();
        reactions[data.personId] = data;
      });
      setCelebrationReactions(reactions);
    } catch (e) {
      console.log('Could not load celebration reactions:', e);
    }
  };
  const handleCelebrationReaction = async (person, emoji) => {
    const personId = person.afid || person.id || person.email || String(Date.now());
    const userId = currentUser.afid || currentUser.uid || currentUser.email || 'anonymous';
    const today = new Date().toISOString().split('T')[0];
    const docId = `${today}_${personId}`;
    try {
      const currentReactions = celebrationReactions[personId] || {
        reactions: {},
        wishes: []
      };
      const userReaction = currentReactions.reactions?.[userId];
      const newReactions = {
        ...currentReactions.reactions
      };
      if (userReaction === emoji) {
        delete newReactions[userId];
      } else {
        newReactions[userId] = emoji;
      }
      await db.collection('celebrationReactions').doc(docId).set({
        personId: personId,
        personName: person.name || 'Unknown',
        date: today,
        reactions: newReactions,
        wishes: currentReactions.wishes || [],
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, {
        merge: true
      });
      setCelebrationReactions(prev => ({
        ...prev,
        [personId]: {
          ...currentReactions,
          reactions: newReactions
        }
      }));
    } catch (e) {
      console.error('Reaction error:', e);
    }
  };
  const sendWish = async person => {
    if (!wishMessage.trim()) return;
    const personId = person.afid || person.id || person.email || String(Date.now());
    const userId = currentUser.afid || currentUser.uid || currentUser.email || 'anonymous';
    const today = new Date().toISOString().split('T')[0];
    const docId = `${today}_${personId}`;
    try {
      const currentReactions = celebrationReactions[personId] || {
        reactions: {},
        wishes: []
      };
      const newWish = {
        odId: `wish_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: userId,
        userName: currentUser.name || currentUser.email?.split('@')[0] || 'Anonymous',
        userPhoto: currentUser.profilePhoto || '',
        message: wishMessage.trim(),
        timestamp: new Date().toISOString()
      };
      const docRef = db.collection('celebrationReactions').doc(docId);
      const docSnap = await docRef.get();
      const existingData = docSnap.exists ? docSnap.data() : {};
      const existingWishes = existingData.wishes || [];
      await docRef.set({
        personId: personId,
        personName: person.name || 'Unknown',
        date: today,
        reactions: currentReactions.reactions || {},
        wishes: [...existingWishes, newWish],
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, {
        merge: true
      });
      setCelebrationReactions(prev => ({
        ...prev,
        [personId]: {
          ...currentReactions,
          wishes: [...(currentReactions.wishes || []), newWish]
        }
      }));
      setWishMessage('');
      setShowWishInput(null);
      alert('🎉 Your wish has been sent!');
    } catch (e) {
      console.error('Wish error:', e);
      alert('Failed to send wish. Please check your connection and try again.');
    }
  };
  const getReactionCounts = personId => {
    const reactions = celebrationReactions[personId]?.reactions || {};
    const counts = {};
    Object.values(reactions).forEach(emoji => {
      counts[emoji] = (counts[emoji] || 0) + 1;
    });
    return counts;
  };
  const getUserReaction = personId => {
    const userId = currentUser.afid || currentUser.uid || currentUser.email;
    return celebrationReactions[personId]?.reactions?.[userId];
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // ✅ FIX: Use the teachers prop already loaded in App - avoid 3 redundant Firebase reads
        // Also fetch managers/apcs for birthday data, but use Promise.allSettled so 
        // partial failures don't block posts from loading
        const [managersResult, apcsResult] = await Promise.allSettled([
          db.collection('managers').get(),
          db.collection('apcs').get()
        ]);
        const managers = managersResult.status === 'fulfilled' 
          ? managersResult.value.docs.map(doc => ({id: doc.id, ...doc.data(), role: 'Manager'}))
          : [];
        const apcs = apcsResult.status === 'fulfilled'
          ? apcsResult.value.docs.map(doc => ({id: doc.id, ...doc.data(), role: 'APC'}))
          : [];
        // Use prop teachers (already loaded) instead of re-fetching
        const allTeachers = (teachers || []).map(t => ({...t, role: 'Teacher'}));
        const combined = [...managers, ...apcs, ...allTeachers].filter(m => m.name && m.name.toLowerCase() !== 'vacant' && !m.isArchived);
        setAllMembers(combined);
        console.log('[SocialWall] Total members loaded:', combined.length);
        console.log('[SocialWall] Members with DOB:', combined.filter(m => m.dateOfBirth || m.dob).length);
        console.log('[SocialWall] Members with joiningDate:', combined.filter(m => m.joiningDate).length);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayMonth = today.getMonth();
        const todayDate = today.getDate();
        const getDaysUntilBday = dobString => {
          if (!dobString) return 999;
          const dob = new Date(dobString);
          const thisYearBday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
          if (thisYearBday < today) {
            thisYearBday.setFullYear(today.getFullYear() + 1);
          }
          return Math.ceil((thisYearBday - today) / (1000 * 60 * 60 * 24));
        };
        const todayBirthdays = combined.filter(m => {
          const dobField = m.dateOfBirth || m.dob;
          if (!dobField) return false;
          const dob = new Date(dobField);
          return dob.getMonth() === todayMonth && dob.getDate() === todayDate;
        });
        setBirthdays(todayBirthdays);
        console.log('[SocialWall] Today birthdays:', todayBirthdays.length);
        const thisWeekBdays = combined.filter(m => {
          const dobField = m.dateOfBirth || m.dob;
          if (!dobField) return false;
          const days = getDaysUntilBday(dobField);
          return days >= 0 && days <= 7;
        }).sort((a, b) => getDaysUntilBday(a.dateOfBirth || a.dob) - getDaysUntilBday(b.dateOfBirth || b.dob));
        setWeekBirthdays(thisWeekBdays);
        console.log('[SocialWall] This week birthdays:', thisWeekBdays.length);
        const thisMonthBdays = combined.filter(m => {
          const dobField = m.dateOfBirth || m.dob;
          if (!dobField) return false;
          const dob = new Date(dobField);
          return dob.getMonth() === todayMonth;
        }).sort((a, b) => {
          const aDay = new Date(a.dateOfBirth || a.dob).getDate();
          const bDay = new Date(b.dateOfBirth || b.dob).getDate();
          return aDay - bDay;
        });
        setMonthBirthdays(thisMonthBdays);
        console.log('[SocialWall] This month birthdays:', thisMonthBdays.length);
        const upcoming = combined.filter(m => {
          const dobField = m.dateOfBirth || m.dob;
          if (!dobField) return false;
          const days = getDaysUntilBday(dobField);
          return days > 0 && days <= 30;
        }).sort((a, b) => getDaysUntilBday(a.dateOfBirth || a.dob) - getDaysUntilBday(b.dateOfBirth || b.dob)).slice(0, 15);
        setUpcomingBirthdays(upcoming);
        console.log('[SocialWall] Upcoming birthdays (30 days):', upcoming.length);
        const getDaysUntilAnniv = joinDateString => {
          if (!joinDateString) return 999;
          const jDate = new Date(joinDateString);
          if (jDate.getFullYear() >= today.getFullYear()) return 999;
          const thisYearAnniv = new Date(today.getFullYear(), jDate.getMonth(), jDate.getDate());
          if (thisYearAnniv < today) {
            thisYearAnniv.setFullYear(today.getFullYear() + 1);
          }
          return Math.ceil((thisYearAnniv - today) / (1000 * 60 * 60 * 24));
        };
        const todayAnniversaries = combined.filter(m => {
          if (!m.joiningDate) return false;
          const j = new Date(m.joiningDate);
          if (j.getFullYear() >= today.getFullYear()) return false;
          return j.getMonth() === todayMonth && j.getDate() === todayDate;
        });
        setAnniversaries(todayAnniversaries);
        console.log('[SocialWall] Today anniversaries:', todayAnniversaries.length);
        const weekAnn = combined.filter(m => {
          if (!m.joiningDate) return false;
          const j = new Date(m.joiningDate);
          if (j.getFullYear() >= today.getFullYear()) return false;
          const days = getDaysUntilAnniv(m.joiningDate);
          return days >= 0 && days <= 7;
        }).sort((a, b) => getDaysUntilAnniv(a.joiningDate) - getDaysUntilAnniv(b.joiningDate));
        setWeekAnniversaries(weekAnn);
        console.log('[SocialWall] This week anniversaries:', weekAnn.length);
        const monthAnn = combined.filter(m => {
          if (!m.joiningDate) return false;
          const j = new Date(m.joiningDate);
          if (j.getFullYear() >= today.getFullYear()) return false;
          return j.getMonth() === todayMonth;
        }).sort((a, b) => {
          const aDay = new Date(a.joiningDate).getDate();
          const bDay = new Date(b.joiningDate).getDate();
          return aDay - bDay;
        });
        setMonthAnniversaries(monthAnn);
        console.log('[SocialWall] This month anniversaries:', monthAnn.length);
        if (todayBirthdays.length > 0) {
          const dismissedToday = localStorage.getItem('birthdayDismissed_' + today.toDateString());
          if (!dismissedToday) {
            setShowBirthdayPopup(todayBirthdays[0]);
          }
        }
        // ✅ FIX: Try ordered query first; fall back to unordered if index missing
        let postsSnap;
        try {
          postsSnap = await db.collection('socialPosts').orderBy('createdAt', 'desc').limit(50).get();
        } catch (indexErr) {
          console.warn('[SocialWall] orderBy index not ready, fetching without sort:', indexErr.message);
          postsSnap = await db.collection('socialPosts').limit(50).get();
        }
        const postsData = postsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Sort client-side as fallback
        postsData.sort((a, b) => {
          const aTime = a.createdAt?.toDate?.()?.getTime() || new Date(a.createdAt || 0).getTime();
          const bTime = b.createdAt?.toDate?.()?.getTime() || new Date(b.createdAt || 0).getTime();
          return bTime - aTime;
        });
        setPosts(postsData);
      } catch (error) {
        console.error('[SocialWall] Error loading posts:', error);
        // ✅ FIX: Set empty posts so loading spinner stops - show empty state
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    loadCelebrationReactions();
  }, [teachers]);
  useEffect(() => {
    const fetchRecognitionData = async () => {
      if (activeTab !== 'recognition') return;
      setRecognitionLoading(true);
      try {
        const now = new Date();
        const currentMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7); // last completed month
        const currentStartDate = currentMonth + '-01';
        const currentEndDate = currentMonth + '-31';
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 2, 1); // two months ago
        const prevMonthStr = prevMonth.toISOString().slice(0, 7);
        const prevStartDate = prevMonthStr + '-01';
        const prevEndDate = prevMonthStr + '-31';
        const currentMonthSnap = await db.collection('timesheetEntries').where('date', '>=', currentStartDate).where('date', '<=', currentEndDate).where('status', '==', 'approved').get();
        const currentTeacherHours = {};
        currentMonthSnap.docs.forEach(doc => {
          const data = doc.data();
          const key = data.teacherAfid;
          if (!currentTeacherHours[key]) {
            currentTeacherHours[key] = {
              afid: data.teacherAfid,
              name: data.teacherName,
              school: data.school,
              subject: data.subject,
              totalHours: 0,
              entries: 0
            };
          }
          currentTeacherHours[key].totalHours += parseFloat(data.hours) || 0;
          currentTeacherHours[key].entries += 1;
        });
        const sortedCurrent = Object.values(currentTeacherHours).sort((a, b) => b.totalHours - a.totalHours).slice(0, 2);
        setTopPerformers(sortedCurrent);
        const prevMonthSnap = await db.collection('timesheetEntries').where('date', '>=', prevStartDate).where('date', '<=', prevEndDate).where('status', '==', 'approved').get();
        const prevTeacherHours = {};
        prevMonthSnap.docs.forEach(doc => {
          const data = doc.data();
          const key = data.teacherAfid;
          if (!prevTeacherHours[key]) {
            prevTeacherHours[key] = {
              afid: data.teacherAfid,
              name: data.teacherName,
              school: data.school,
              subject: data.subject,
              totalHours: 0,
              entries: 0,
              month: prevMonthStr
            };
          }
          prevTeacherHours[key].totalHours += parseFloat(data.hours) || 0;
          prevTeacherHours[key].entries += 1;
        });
        const sortedPrev = Object.values(prevTeacherHours).sort((a, b) => b.totalHours - a.totalHours).slice(0, 2);
        setPreviousMonthWinners(sortedPrev);
      } catch (error) {
        console.error('Error fetching recognition data:', error);
      } finally {
        setRecognitionLoading(false);
      }
    };
    fetchRecognitionData();
  }, [activeTab]);
  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !postImage) return;
    setPosting(true);
    setUploadingImage(true);
    try {
      let imageUrl = null;
      if (postImage) {
        imageUrl = await uploadImage(postImage, 'social_posts');
        if (!imageUrl) {
          const continueWithoutImage = confirm('⚠️ Could not upload image.\\n\\nWould you like to post without the image?');
          if (!continueWithoutImage) {
            setPosting(false);
            setUploadingImage(false);
            return;
          }
        }
      }
      const postData = {
        content: newPostContent.trim(),
        authorId: currentUser.afid || currentUser.uid,
        authorName: currentUser.name,
        authorPhoto: currentUser.profilePhoto || '',
        authorSchool: currentUser.school,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        reactions: {},
        comments: [],
        imageUrl: imageUrl || null,
        imageType: imageUrl?.startsWith('data:') ? 'base64' : 'url'
      };
      const docRef = await db.collection('socialPosts').add(postData);
      setPosts([{
        id: docRef.id,
        ...postData,
        createdAt: new Date()
      }, ...posts]);
      const postContent = newPostContent.trim();
      const mentionRegex = /@(\w+(?:\s\w+)?)/g;
      let match;
      if (postContent.toLowerCase().includes('@everyone')) {
        MentionNotificationSystem.sendEveryoneNotification(postContent, currentUser.name, currentUser.afid || currentUser.uid);
      } else {
        while ((match = mentionRegex.exec(postContent)) !== null) {
          const mentionedName = match[1];
          const mentionedMember = allMembers.find(m => m.name?.toLowerCase() === mentionedName.toLowerCase());
          if (mentionedMember) {
            const mentionedUserId = mentionedMember.afid || mentionedMember.uid || mentionedMember.id;
            MentionNotificationSystem.sendMentionNotification(mentionedUserId, mentionedMember.name, postContent, currentUser.name, currentUser.afid || currentUser.uid);
          }
        }
      }
      setNewPostContent('');
      setPostImage(null);
      setPostImagePreview(null);
      setShowNewPost(false);
    } catch (error) {
      console.error('[SocialWall] Failed to create post:', error);
      alert('❌ Failed to create post. Please check your connection and try again.');
    } finally {
      setPosting(false);
      setUploadingImage(false);
    }
  };
  const handleReply = async postId => {
    if (!replyContent.trim() && !replyImage && !replyImagePreview) return;
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      let replyImageUrl = null;
      if (replyImage) {
        replyImageUrl = await uploadImage(replyImage, 'social_replies');
      } else if (replyImagePreview && replyImagePreview.startsWith('http')) {
        replyImageUrl = replyImagePreview;
      }
      const newReply = {
        id: Date.now().toString(),
        authorId: currentUser.afid || currentUser.uid,
        authorName: currentUser.name,
        authorPhoto: currentUser.profilePhoto || '',
        content: replyContent.trim(),
        imageUrl: replyImageUrl,
        reactions: {},
        createdAt: new Date().toISOString()
      };
      const updatedComments = [...(post.comments || []), newReply];
      await db.collection('socialPosts').doc(postId).update({
        comments: updatedComments
      });
      const commentContent = replyContent.trim();
      const mentionRegex = /@(\w+(?:\s\w+)?)/g;
      let match;
      if (commentContent.toLowerCase().includes('@everyone')) {
        MentionNotificationSystem.sendEveryoneNotification(commentContent, currentUser.name, currentUser.afid || currentUser.uid);
      } else {
        while ((match = mentionRegex.exec(commentContent)) !== null) {
          const mentionedName = match[1];
          const mentionedMember = allMembers.find(m => m.name?.toLowerCase() === mentionedName.toLowerCase());
          if (mentionedMember) {
            const mentionedUserId = mentionedMember.afid || mentionedMember.uid || mentionedMember.id;
            MentionNotificationSystem.sendMentionNotification(mentionedUserId, mentionedMember.name, commentContent, currentUser.name, currentUser.afid || currentUser.uid);
          }
        }
      }
      setPosts(posts.map(p => p.id === postId ? {
        ...p,
        comments: updatedComments
      } : p));
      setReplyContent('');
      setReplyImage(null);
      setReplyImagePreview(null);
      setReplyingTo(null);
      setShowGifPicker(null);
    } catch (error) {
      console.error('Reply error:', error);
      alert('Failed to post reply');
    }
  };
  const selectGif = gifUrl => {
    setReplyImagePreview(gifUrl);
    setReplyImage(null);
    setShowGifPicker(null);
  };
  const handleReaction = async (postId, emoji) => {
    const userId = currentUser.afid || currentUser.uid;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    let newReactions = {
      ...(post.reactions || {})
    };
    if (newReactions[userId] === emoji) {
      delete newReactions[userId];
    } else {
      newReactions[userId] = emoji;
    }
    try {
      await db.collection('socialPosts').doc(postId).update({
        reactions: newReactions
      });
      setPosts(posts.map(p => p.id === postId ? {
        ...p,
        reactions: newReactions
      } : p));
    } catch (error) {
      console.error('Error:', error);
    }
  };
  const handleCommentReaction = async (postId, commentId, emoji) => {
    const userId = currentUser.afid || currentUser.uid;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const comments = [...(post.comments || [])];
    const commentIndex = comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) return;
    const comment = comments[commentIndex];
    let newReactions = {
      ...(comment.reactions || {})
    };
    if (newReactions[userId] === emoji) {
      delete newReactions[userId];
    } else {
      newReactions[userId] = emoji;
    }
    comments[commentIndex] = {
      ...comment,
      reactions: newReactions
    };
    try {
      await db.collection('socialPosts').doc(postId).update({
        comments: comments
      });
      setPosts(posts.map(p => p.id === postId ? {
        ...p,
        comments: comments
      } : p));
    } catch (error) {
      console.error('Comment reaction error:', error);
    }
  };
  const handleNestedReply = async (postId, parentCommentId, replyText) => {
    if (!replyText.trim()) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const comments = [...(post.comments || [])];
    const commentIndex = comments.findIndex(c => c.id === parentCommentId);
    if (commentIndex === -1) return;
    const parentComment = comments[commentIndex];
    const newNestedReply = {
      id: Date.now().toString(),
      authorId: currentUser.afid || currentUser.uid,
      authorName: currentUser.name,
      authorPhoto: currentUser.profilePhoto || '',
      content: replyText.trim(),
      reactions: {},
      createdAt: new Date().toISOString()
    };
    const updatedReplies = [...(parentComment.replies || []), newNestedReply];
    comments[commentIndex] = {
      ...parentComment,
      replies: updatedReplies
    };
    try {
      await db.collection('socialPosts').doc(postId).update({
        comments: comments
      });
      setPosts(posts.map(p => p.id === postId ? {
        ...p,
        comments: comments
      } : p));
      const mentionRegex = /@(\w+(?:\s\w+)?)/g;
      let match;
      while ((match = mentionRegex.exec(replyText)) !== null) {
        const mentionedName = match[1];
        const mentionedMember = allMembers.find(m => m.name?.toLowerCase() === mentionedName.toLowerCase());
        if (mentionedMember) {
          const mentionedUserId = mentionedMember.afid || mentionedMember.uid || mentionedMember.id;
          MentionNotificationSystem.sendMentionNotification(mentionedUserId, mentionedMember.name, replyText, currentUser.name, currentUser.afid || currentUser.uid);
        }
      }
    } catch (error) {
      console.error('Nested reply error:', error);
      alert('Failed to post reply');
    }
  };
  const handleEditPost = async postId => {
    if (!editPostContent.trim()) return;
    try {
      await db.collection('socialPosts').doc(postId).update({
        content: editPostContent.trim(),
        editedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      setPosts(posts.map(p => p.id === postId ? {
        ...p,
        content: editPostContent.trim(),
        editedAt: new Date()
      } : p));
      setEditingPost(null);
      setEditPostContent('');
    } catch (error) {
      console.error('Edit post error:', error);
      alert('Failed to edit post');
    }
  };
  const handleDeletePost = async postId => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await db.collection('socialPosts').doc(postId).delete();
      setPosts(posts.filter(p => p.id !== postId));
    } catch (error) {
      console.error('Delete post error:', error);
      alert('Failed to delete post');
    }
  };
  const handleEditComment = async (postId, commentId) => {
    if (!editCommentContent.trim()) return;
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      const updatedComments = post.comments.map(c => c.id === commentId ? {
        ...c,
        content: editCommentContent.trim(),
        editedAt: new Date().toISOString()
      } : c);
      await db.collection('socialPosts').doc(postId).update({
        comments: updatedComments
      });
      setPosts(posts.map(p => p.id === postId ? {
        ...p,
        comments: updatedComments
      } : p));
      setEditingComment(null);
      setEditCommentContent('');
    } catch (error) {
      console.error('Edit comment error:', error);
      alert('Failed to edit comment');
    }
  };
  const handleDeleteComment = async (postId, commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;
      const updatedComments = post.comments.filter(c => c.id !== commentId);
      await db.collection('socialPosts').doc(postId).update({
        comments: updatedComments
      });
      setPosts(posts.map(p => p.id === postId ? {
        ...p,
        comments: updatedComments
      } : p));
    } catch (error) {
      console.error('Delete comment error:', error);
      alert('Failed to delete comment');
    }
  };
  const canModify = authorId => {
    const currentUserId = currentUser.afid || currentUser.uid;
    return authorId === currentUserId || isAdminOrModerator;
  };
  const dismissBirthdayPopup = () => {
    localStorage.setItem('birthdayDismissed_' + new Date().toDateString(), 'true');
    setShowBirthdayPopup(null);
  };
  const emojis = ['👍', '❤️', '😊', '🎉', '👏', '🙌'];
  const getDaysUntilBirthday = dob => {
    const today = new Date();
    const bday = new Date(dob);
    const thisYearBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
    if (thisYearBday < today) thisYearBday.setFullYear(today.getFullYear() + 1);
    return Math.ceil((thisYearBday - today) / (1000 * 60 * 60 * 24));
  };
  if (loading) {
    return React.createElement("div", {
      className: "flex items-center justify-center h-64"
    }, React.createElement("div", {
      className: "text-center"
    }, React.createElement("div", {
      className: "text-6xl mb-4 animate-bounce"
    }, "\uD83C\uDF89"), React.createElement("p", {
      className: "text-gray-600"
    }, "Loading fun stuff...")));
  }
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("style", null, `
        .confetti {
          position: fixed;
          width: 10px;
          height: 10px;
          background: #f00;
          animation: fall 3s linear infinite;
        }
        
        @keyframes fall {
          to { transform: translateY(100vh) rotate(720deg); }
        }
        
        .celebration-card {
          background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #fbcfe8 100%);
          border: 2px solid #f9a8d4;
          position: relative;
          overflow: hidden;
        }
        
        .celebration-card::before {
          content: '🎈🎉🎊';
          position: absolute;
          top: -10px;
          right: -10px;
          font-size: 40px;
          opacity: 0.3;
          transform: rotate(15deg);
        }
        
        .birthday-card {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(236, 72, 153, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(236, 72, 153, 0); }
        }
        
        .tab-btn {
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          transition: all 0.3s;
        }
        
        .tab-active {
          background: linear-gradient(135deg, #ec4899, #8b5cf6);
          color: white;
          box-shadow: 0 4px 15px rgba(236, 72, 153, 0.4);
        }
        
        .tab-inactive {
          background: white;
          color: #6b7280;
        }
        
        .tab-inactive:hover {
          background: #fdf2f8;
        }
        
        .post-card {
          background: white;
          border-radius: 20px;
          border: 1px solid #f3e8ff;
          transition: all 0.3s;
        }
        
        .post-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(139, 92, 246, 0.1);
        }
        
        .emoji-btn {
          padding: 6px 10px;
          border-radius: 20px;
          transition: all 0.2s;
          background: #f9fafb;
        }
        
        .emoji-btn:hover {
          background: #fdf2f8;
          transform: scale(1.1);
        }
        
        .emoji-btn.active {
          background: linear-gradient(135deg, #fce7f3, #ede9fe);
        }
      `), React.createElement("div", {
    className: "text-center"
  }, React.createElement("div", {
    className: "inline-flex items-center gap-3 bg-gradient-to-r from-pink-100 via-purple-100 to-indigo-100 px-8 py-4 rounded-2xl shadow-lg"
  }, React.createElement("span", {
    className: "text-4xl animate-bounce"
  }, "\uD83C\uDF89"), React.createElement("h2", {
    className: "text-3xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent"
  }, "Social Wall"), React.createElement("span", {
    className: "text-4xl animate-bounce",
    style: {
      animationDelay: '0.5s'
    }
  }, "\uD83C\uDF8A"))), React.createElement("div", {
    className: "flex justify-center gap-4 flex-wrap"
  }, React.createElement("button", {
    onClick: () => setActiveTab('feed'),
    className: `tab-btn ${activeTab === 'feed' ? 'tab-active' : 'tab-inactive'}`
  }, "\uD83D\uDCDD Feed"), React.createElement("button", {
    onClick: () => setActiveTab('celebrations'),
    className: `tab-btn ${activeTab === 'celebrations' ? 'tab-active' : 'tab-inactive'}`
  }, "\uD83C\uDF82 Celebrations ", birthdays.length > 0 && React.createElement("span", {
    className: "ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full"
  }, birthdays.length)), React.createElement("button", {
    onClick: () => setActiveTab('recognition'),
    className: `tab-btn ${activeTab === 'recognition' ? 'tab-active' : 'tab-inactive'}`
  }, "\uD83C\uDFC6 Recognition")), activeTab === 'celebrations' && React.createElement("div", {
    className: "space-y-6"
  }, birthdays.length > 0 && React.createElement("div", {
    className: "celebration-card rounded-3xl p-6"
  }, React.createElement("h3", {
    className: "text-2xl font-bold text-pink-700 mb-4 flex items-center gap-2"
  }, React.createElement("span", {
    className: "text-3xl"
  }, "\uD83C\uDF82"), " Today's Birthday", birthdays.length > 1 ? 's' : '', "!"), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4"
  }, birthdays.map((person, idx) => {
    const personId = person.afid || person.id || person.email;
    const reactionCounts = getReactionCounts(personId);
    const myReaction = getUserReaction(personId);
    const wishes = celebrationReactions[personId]?.wishes || [];
    return React.createElement("div", {
      key: idx,
      className: "bg-white rounded-2xl p-4 shadow-lg border-2 border-pink-200"
    }, React.createElement("div", {
      className: "flex items-center gap-4 mb-4"
    }, person.profilePhoto ? React.createElement("img", {
      src: person.profilePhoto,
      alt: "",
      className: "w-16 h-16 rounded-full object-cover border-4 border-pink-300"
    }) : React.createElement("div", {
      className: "w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-2xl text-white font-bold"
    }, person.name?.charAt(0)), React.createElement("div", {
      className: "flex-1"
    }, React.createElement("div", {
      className: "font-bold text-gray-800 text-lg"
    }, person.name), React.createElement("div", {
      className: "text-sm text-gray-500"
    }, person.role || person.subject), person.school && React.createElement("div", {
      className: "text-xs text-gray-400"
    }, person.school), React.createElement("div", {
      className: "text-sm text-pink-600 font-medium mt-1"
    }, "\uD83C\uDF88 Happy Birthday!"))), React.createElement("div", {
      className: "flex items-center gap-2 flex-wrap mb-3"
    }, celebrationEmojis.map(emoji => React.createElement("button", {
      key: emoji,
      onClick: () => handleCelebrationReaction(person, emoji),
      className: `px-3 py-1.5 rounded-full text-lg transition-all ${myReaction === emoji ? 'bg-pink-100 scale-110 ring-2 ring-pink-400' : 'bg-gray-100 hover:bg-pink-50 hover:scale-105'}`
    }, emoji, " ", reactionCounts[emoji] ? React.createElement("span", {
      className: "text-xs font-bold"
    }, reactionCounts[emoji]) : ''))), wishes.length > 0 && React.createElement("div", {
      className: "mb-3 max-h-32 overflow-y-auto"
    }, wishes.map((wish, widx) => React.createElement("div", {
      key: widx,
      className: "flex items-start gap-2 p-2 bg-pink-50 rounded-lg mb-1"
    }, React.createElement("div", {
      className: "w-6 h-6 rounded-full bg-pink-300 flex items-center justify-center text-xs text-white font-bold"
    }, wish.userName?.charAt(0)), React.createElement("div", {
      className: "flex-1"
    }, React.createElement("div", {
      className: "text-xs font-semibold text-pink-700"
    }, wish.userName), React.createElement("div", {
      className: "text-sm text-gray-700"
    }, wish.message))))), showWishInput === personId ? React.createElement("div", {
      className: "flex gap-2"
    }, React.createElement("input", {
      type: "text",
      value: wishMessage,
      onChange: e => setWishMessage(e.target.value),
      placeholder: "Send your wishes...",
      className: "flex-1 border-2 border-pink-200 px-3 py-2 rounded-lg text-sm focus:border-pink-400 focus:ring-0",
      autoFocus: true
    }), React.createElement("button", {
      onClick: () => sendWish(person),
      className: "px-4 py-2 bg-pink-500 text-white rounded-lg font-semibold hover:bg-pink-600"
    }, "Send"), React.createElement("button", {
      onClick: () => {
        setShowWishInput(null);
        setWishMessage('');
      },
      className: "px-3 py-2 bg-gray-200 rounded-lg"
    }, "\u2715")) : React.createElement("button", {
      onClick: () => setShowWishInput(personId),
      className: "w-full py-2 bg-gradient-to-r from-pink-400 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
    }, "\uD83C\uDF81 Send Birthday Wishes"));
  }))), anniversaries.length > 0 && React.createElement("div", {
    className: "bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl p-6 border-2 border-amber-200"
  }, React.createElement("h3", {
    className: "text-2xl font-bold text-amber-700 mb-4 flex items-center gap-2"
  }, React.createElement("span", {
    className: "text-3xl"
  }, "\uD83D\uDC8D"), " Work Anniversary!"), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4"
  }, anniversaries.map((person, idx) => {
    const personId = person.afid || person.id || person.email;
    const reactionCounts = getReactionCounts(personId);
    const myReaction = getUserReaction(personId);
    const wishes = celebrationReactions[personId]?.wishes || [];
    const years = new Date().getFullYear() - new Date(person.joiningDate).getFullYear();
    return React.createElement("div", {
      key: idx,
      className: "bg-white rounded-2xl p-4 shadow-lg border-2 border-amber-200"
    }, React.createElement("div", {
      className: "flex items-center gap-4 mb-4"
    }, person.profilePhoto ? React.createElement("img", {
      src: person.profilePhoto,
      alt: "",
      className: "w-16 h-16 rounded-full object-cover border-4 border-amber-300"
    }) : React.createElement("div", {
      className: "w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl text-white font-bold"
    }, person.name?.charAt(0)), React.createElement("div", {
      className: "flex-1"
    }, React.createElement("div", {
      className: "font-bold text-gray-800 text-lg"
    }, person.name), React.createElement("div", {
      className: "text-sm text-gray-500"
    }, person.role || person.subject), person.school && React.createElement("div", {
      className: "text-xs text-gray-400"
    }, person.school), React.createElement("div", {
      className: "text-sm text-amber-600 font-medium mt-1"
    }, "\uD83C\uDF8A ", years, " Year", years > 1 ? 's' : '', " at Avanti!"))), React.createElement("div", {
      className: "flex items-center gap-2 flex-wrap mb-3"
    }, celebrationEmojis.map(emoji => React.createElement("button", {
      key: emoji,
      onClick: () => handleCelebrationReaction(person, emoji),
      className: `px-3 py-1.5 rounded-full text-lg transition-all ${myReaction === emoji ? 'bg-amber-100 scale-110 ring-2 ring-amber-400' : 'bg-gray-100 hover:bg-amber-50 hover:scale-105'}`
    }, emoji, " ", reactionCounts[emoji] ? React.createElement("span", {
      className: "text-xs font-bold"
    }, reactionCounts[emoji]) : ''))), wishes.length > 0 && React.createElement("div", {
      className: "mb-3 max-h-32 overflow-y-auto"
    }, wishes.map((wish, widx) => React.createElement("div", {
      key: widx,
      className: "flex items-start gap-2 p-2 bg-amber-50 rounded-lg mb-1"
    }, React.createElement("div", {
      className: "w-6 h-6 rounded-full bg-amber-300 flex items-center justify-center text-xs text-white font-bold"
    }, wish.userName?.charAt(0)), React.createElement("div", {
      className: "flex-1"
    }, React.createElement("div", {
      className: "text-xs font-semibold text-amber-700"
    }, wish.userName), React.createElement("div", {
      className: "text-sm text-gray-700"
    }, wish.message))))), showWishInput === personId ? React.createElement("div", {
      className: "flex gap-2"
    }, React.createElement("input", {
      type: "text",
      value: wishMessage,
      onChange: e => setWishMessage(e.target.value),
      placeholder: "Send congratulations...",
      className: "flex-1 border-2 border-amber-200 px-3 py-2 rounded-lg text-sm focus:border-amber-400 focus:ring-0",
      autoFocus: true
    }), React.createElement("button", {
      onClick: () => sendWish(person),
      className: "px-4 py-2 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600"
    }, "Send"), React.createElement("button", {
      onClick: () => {
        setShowWishInput(null);
        setWishMessage('');
      },
      className: "px-3 py-2 bg-gray-200 rounded-lg"
    }, "\u2715")) : React.createElement("button", {
      onClick: () => setShowWishInput(personId),
      className: "w-full py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
    }, "\uD83C\uDF89 Send Congratulations"));
  }))), React.createElement("div", {
    className: "bg-white rounded-3xl p-6 shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold text-gray-700 mb-4 flex items-center gap-2"
  }, React.createElement("span", {
    className: "text-2xl"
  }, "\uD83D\uDDD3\uFE0F"), " This Week's Birthdays"), weekBirthdays.length === 0 ? React.createElement("p", {
    className: "text-gray-500 text-center py-4"
  }, "No birthdays this week") : React.createElement("div", {
    className: "space-y-3"
  }, weekBirthdays.map((person, idx) => {
    const dobField = person.dateOfBirth || person.dob;
    const daysLeft = getDaysUntilBirthday(dobField);
    const dob = new Date(dobField);
    const isToday = daysLeft === 0;
    return React.createElement("div", {
      key: idx,
      className: `flex items-center justify-between p-3 rounded-xl transition-colors ${isToday ? 'bg-pink-100 border-2 border-pink-300' : 'bg-gray-50 hover:bg-pink-50'}`
    }, React.createElement("div", {
      className: "flex items-center gap-3"
    }, person.profilePhoto ? React.createElement("img", {
      src: person.profilePhoto,
      alt: "",
      className: "w-10 h-10 rounded-full object-cover"
    }) : React.createElement("div", {
      className: "w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold"
    }, person.name?.charAt(0)), React.createElement("div", null, React.createElement("div", {
      className: "font-semibold text-gray-800"
    }, person.name, " ", isToday && '🎂'), React.createElement("div", {
      className: "text-xs text-gray-500"
    }, person.school || person.role))), React.createElement("div", {
      className: "text-right"
    }, React.createElement("div", {
      className: "text-sm font-bold text-pink-600"
    }, dob.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    })), React.createElement("div", {
      className: "text-xs text-gray-500"
    }, isToday ? '🎉 Today!' : daysLeft === 1 ? 'Tomorrow!' : `in ${daysLeft} days`)));
  }))), React.createElement("div", {
    className: "bg-white rounded-3xl p-6 shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold text-gray-700 mb-4 flex items-center gap-2"
  }, React.createElement("span", {
    className: "text-2xl"
  }, "\uD83D\uDCC5"), " This Month's Birthdays (", new Date().toLocaleDateString('en-IN', {
    month: 'long'
  }), ")"), monthBirthdays.length === 0 ? React.createElement("p", {
    className: "text-gray-500 text-center py-4"
  }, "No birthdays this month") : React.createElement("div", {
    className: "grid md:grid-cols-2 gap-3"
  }, monthBirthdays.map((person, idx) => {
    const dobField = person.dateOfBirth || person.dob;
    const dob = new Date(dobField);
    const daysLeft = getDaysUntilBirthday(dobField);
    const isPast = dob.getDate() < new Date().getDate();
    const isToday = daysLeft === 0;
    return React.createElement("div", {
      key: idx,
      className: `flex items-center justify-between p-3 rounded-xl transition-colors ${isToday ? 'bg-pink-100 border-2 border-pink-300' : isPast ? 'bg-gray-100 opacity-60' : 'bg-gray-50 hover:bg-pink-50'}`
    }, React.createElement("div", {
      className: "flex items-center gap-3"
    }, person.profilePhoto ? React.createElement("img", {
      src: person.profilePhoto,
      alt: "",
      className: "w-9 h-9 rounded-full object-cover"
    }) : React.createElement("div", {
      className: "w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm"
    }, person.name?.charAt(0)), React.createElement("div", null, React.createElement("div", {
      className: "font-semibold text-gray-800 text-sm"
    }, person.name, " ", isToday && '🎂'), React.createElement("div", {
      className: "text-xs text-gray-500"
    }, person.school || person.role))), React.createElement("div", {
      className: "text-right"
    }, React.createElement("div", {
      className: `text-sm font-bold ${isPast ? 'text-gray-400' : 'text-pink-600'}`
    }, dob.getDate(), " ", dob.toLocaleDateString('en-IN', {
      month: 'short'
    })), React.createElement("div", {
      className: "text-xs text-gray-500"
    }, isToday ? '🎉 Today!' : isPast ? 'Passed' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft}d`)));
  }))), React.createElement("div", {
    className: "bg-white rounded-3xl p-6 shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold text-gray-700 mb-4 flex items-center gap-2"
  }, React.createElement("span", {
    className: "text-2xl"
  }, "\uD83C\uDF89"), " This Week's Work Anniversaries"), weekAnniversaries.length === 0 ? React.createElement("p", {
    className: "text-gray-500 text-center py-4"
  }, "No work anniversaries this week") : React.createElement("div", {
    className: "space-y-3"
  }, weekAnniversaries.map((person, idx) => {
    const years = new Date().getFullYear() - new Date(person.joiningDate).getFullYear();
    const jDate = new Date(person.joiningDate);
    return React.createElement("div", {
      key: idx,
      className: "flex items-center justify-between p-3 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors"
    }, React.createElement("div", {
      className: "flex items-center gap-3"
    }, person.profilePhoto ? React.createElement("img", {
      src: person.profilePhoto,
      alt: "",
      className: "w-10 h-10 rounded-full object-cover"
    }) : React.createElement("div", {
      className: "w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold"
    }, person.name?.charAt(0)), React.createElement("div", null, React.createElement("div", {
      className: "font-semibold text-gray-800"
    }, person.name), React.createElement("div", {
      className: "text-xs text-gray-500"
    }, person.school || person.role))), React.createElement("div", {
      className: "text-right"
    }, React.createElement("div", {
      className: "text-sm font-bold text-amber-600"
    }, years, " Year", years > 1 ? 's' : ''), React.createElement("div", {
      className: "text-xs text-gray-500"
    }, jDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    }))));
  }))), React.createElement("div", {
    className: "bg-white rounded-3xl p-6 shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold text-gray-700 mb-4 flex items-center gap-2"
  }, React.createElement("span", {
    className: "text-2xl"
  }, "\uD83D\uDCC5"), " This Month's Work Anniversaries"), monthAnniversaries.length === 0 ? React.createElement("p", {
    className: "text-gray-500 text-center py-4"
  }, "No work anniversaries this month") : React.createElement("div", {
    className: "space-y-3 max-h-80 overflow-y-auto"
  }, monthAnniversaries.map((person, idx) => {
    const years = new Date().getFullYear() - new Date(person.joiningDate).getFullYear();
    const jDate = new Date(person.joiningDate);
    return React.createElement("div", {
      key: idx,
      className: "flex items-center justify-between p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
    }, React.createElement("div", {
      className: "flex items-center gap-3"
    }, person.profilePhoto ? React.createElement("img", {
      src: person.profilePhoto,
      alt: "",
      className: "w-10 h-10 rounded-full object-cover"
    }) : React.createElement("div", {
      className: "w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center text-white font-bold"
    }, person.name?.charAt(0)), React.createElement("div", null, React.createElement("div", {
      className: "font-semibold text-gray-800"
    }, person.name), React.createElement("div", {
      className: "text-xs text-gray-500"
    }, person.school || person.role))), React.createElement("div", {
      className: "text-right"
    }, React.createElement("div", {
      className: "text-sm font-bold text-green-600"
    }, years, " Year", years > 1 ? 's' : ''), React.createElement("div", {
      className: "text-xs text-gray-500"
    }, jDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    }))));
  }))), birthdays.length === 0 && anniversaries.length === 0 && upcomingBirthdays.length === 0 && weekAnniversaries.length === 0 && monthAnniversaries.length === 0 && React.createElement("div", {
    className: "text-center py-12"
  }, React.createElement("div", {
    className: "text-6xl mb-4"
  }, "\uD83C\uDF88"), React.createElement("p", {
    className: "text-gray-500"
  }, "No celebrations today. Check back soon!"))), activeTab === 'feed' && React.createElement("div", {
    className: "space-y-6"
  }, (birthdays.length > 0 || anniversaries.length > 0) && React.createElement("div", {
    onClick: () => setActiveTab('celebrations'),
    className: "celebration-card rounded-2xl p-4 cursor-pointer hover:shadow-lg transition-all"
  }, React.createElement("div", {
    className: "flex items-center justify-between"
  }, React.createElement("div", {
    className: "flex items-center gap-3"
  }, React.createElement("span", {
    className: "text-3xl"
  }, "\uD83C\uDF89"), React.createElement("div", null, React.createElement("div", {
    className: "font-bold text-pink-700"
  }, birthdays.length > 0 && `${birthdays.length} Birthday${birthdays.length > 1 ? 's' : ''} Today!`, birthdays.length > 0 && anniversaries.length > 0 && ' + ', anniversaries.length > 0 && `${anniversaries.length} Anniversary`), React.createElement("div", {
    className: "text-sm text-pink-600"
  }, "Click to view celebrations \u2192"))), React.createElement("div", {
    className: "flex -space-x-2"
  }, [...birthdays, ...anniversaries].slice(0, 3).map((p, i) => p.profilePhoto ? React.createElement("img", {
    key: i,
    src: p.profilePhoto,
    alt: "",
    className: "w-10 h-10 rounded-full border-2 border-white object-cover"
  }) : React.createElement("div", {
    key: i,
    className: "w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 border-2 border-white flex items-center justify-center text-white font-bold text-sm"
  }, p.name?.charAt(0)))))), React.createElement("div", {
    className: "bg-white rounded-2xl p-4 shadow-lg border border-purple-100"
  }, showNewPost ? React.createElement("div", {
    className: "space-y-3"
  }, React.createElement("div", {
    className: "relative mention-input-container"
  }, React.createElement(MentionTextarea, {
    value: newPostContent,
    onChange: setNewPostContent,
    placeholder: "What's on your mind? Type @ to mention someone \uD83D\uDC4B",
    allMembers: allMembers,
    className: "w-full p-4 pr-12 border-2 border-purple-200 rounded-2xl focus:border-purple-400 focus:ring-0 resize-none",
    rows: 3
  }), React.createElement("label", {
    className: "absolute bottom-3 right-3 cursor-pointer text-gray-400 hover:text-purple-600 transition-colors"
  }, React.createElement("span", {
    className: "text-xl"
  }, "\uD83D\uDCCE"), React.createElement("input", {
    type: "file",
    accept: "image/*,video/*",
    onChange: handlePostImageSelect,
    className: "hidden"
  }))), React.createElement("div", {
    className: "text-xs text-gray-400 flex items-center gap-2"
  }, React.createElement("span", null, "\uD83D\uDCA1 Tip: Type ", React.createElement("span", {
    className: "mention-tag"
  }, "@name"), " to mention someone or ", React.createElement("span", {
    className: "mention-tag mention-everyone"
  }, "@everyone"), " to notify all")), postImagePreview && React.createElement("div", {
    className: "relative inline-block"
  }, React.createElement("img", {
    src: postImagePreview,
    alt: "Preview",
    className: "max-h-40 rounded-xl border-2 border-purple-200"
  }), React.createElement("button", {
    onClick: () => {
      setPostImage(null);
      setPostImagePreview(null);
    },
    className: "absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full text-sm font-bold hover:bg-red-600"
  }, "\u2715")), React.createElement("div", {
    className: "flex justify-end items-center gap-3"
  }, React.createElement("button", {
    onClick: () => {
      setShowNewPost(false);
      setNewPostContent('');
      setPostImage(null);
      setPostImagePreview(null);
    },
    className: "px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl"
  }, "Cancel"), React.createElement("button", {
    onClick: handleCreatePost,
    disabled: !newPostContent.trim() && !postImage || posting,
    className: "px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-50 hover:shadow-lg transition-all"
  }, uploadingImage ? '📤 Uploading...' : posting ? 'Posting...' : '✨ Post'))) : React.createElement("div", {
    onClick: () => setShowNewPost(true),
    className: "flex items-center gap-4 cursor-pointer p-2 hover:bg-purple-50 rounded-xl transition-colors"
  }, currentUser.profilePhoto ? React.createElement("img", {
    src: currentUser.profilePhoto,
    alt: "",
    className: "w-11 h-11 rounded-full object-cover"
  }) : React.createElement("div", {
    className: "w-11 h-11 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg"
  }, currentUser.name?.charAt(0)), React.createElement("div", {
    className: "flex-1 text-gray-400 bg-gray-100 rounded-full py-3 px-4"
  }, "What's on your mind?"))), posts.length === 0 ? React.createElement("div", {
    className: "text-center py-12 bg-white rounded-2xl"
  }, React.createElement("div", {
    className: "text-6xl mb-4"
  }, "\uD83D\uDCDD"), React.createElement("p", {
    className: "text-gray-500"
  }, "No posts yet. Be the first to share something!")) : React.createElement("div", {
    className: "space-y-4"
  }, posts.map(post => {
    const reactionCounts = {};
    Object.values(post.reactions || {}).forEach(emoji => {
      reactionCounts[emoji] = (reactionCounts[emoji] || 0) + 1;
    });
    const myReaction = post.reactions?.[currentUser.afid || currentUser.uid];
    return React.createElement("div", {
      key: post.id,
      className: "post-card p-5"
    }, React.createElement("div", {
      className: "flex items-start justify-between mb-4"
    }, React.createElement("div", {
      className: "flex items-center gap-3"
    }, post.authorPhoto ? React.createElement("img", {
      src: post.authorPhoto,
      alt: "",
      className: "w-12 h-12 rounded-full object-cover"
    }) : React.createElement("div", {
      className: "w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg"
    }, post.authorName?.charAt(0)), React.createElement("div", null, React.createElement("div", {
      className: "font-bold text-gray-800"
    }, post.authorName), React.createElement("div", {
      className: "text-xs text-gray-500"
    }, post.authorSchool, " \u2022 ", post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    }) : 'Just now', post.editedAt && React.createElement("span", {
      className: "ml-1 text-gray-400"
    }, "(edited)")))), canModify(post.authorId) && React.createElement("div", {
      className: "flex items-center gap-1"
    }, React.createElement("button", {
      onClick: () => {
        setEditingPost(post.id);
        setEditPostContent(post.content);
      },
      className: "p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all",
      title: "Edit post"
    }, "\u270F\uFE0F"), React.createElement("button", {
      onClick: () => handleDeletePost(post.id),
      className: "p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all",
      title: isAdminOrModerator && post.authorId !== (currentUser.afid || currentUser.uid) ? 'Delete as moderator' : 'Delete post'
    }, "\uD83D\uDDD1\uFE0F"))), editingPost === post.id ? React.createElement("div", {
      className: "mb-4"
    }, React.createElement("textarea", {
      value: editPostContent,
      onChange: e => setEditPostContent(e.target.value),
      className: "w-full p-3 border-2 border-purple-200 rounded-xl focus:border-purple-400 focus:ring-0 resize-none",
      rows: 3,
      autoFocus: true
    }), React.createElement("div", {
      className: "flex gap-2 mt-2"
    }, React.createElement("button", {
      onClick: () => handleEditPost(post.id),
      className: "px-4 py-2 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600"
    }, "Save"), React.createElement("button", {
      onClick: () => {
        setEditingPost(null);
        setEditPostContent('');
      },
      className: "px-4 py-2 bg-gray-200 rounded-lg font-semibold hover:bg-gray-300"
    }, "Cancel"))) : React.createElement("p", {
      className: "text-gray-700 mb-4 whitespace-pre-wrap"
    }, post.content), post.imageUrl && React.createElement("div", {
      className: "mb-4"
    }, React.createElement("img", {
      src: post.imageUrl,
      alt: "Post attachment",
      className: "max-w-full rounded-xl border border-purple-100 max-h-96 object-contain"
    })), React.createElement("div", {
      className: "flex items-center gap-2 flex-wrap mb-3"
    }, emojis.map(emoji => {
      const reactedBy = Object.entries(post.reactions || {}).filter(([userId, reaction]) => reaction === emoji).map(([userId]) => userId);
      return React.createElement(ReactionButton, {
        key: emoji,
        emoji: emoji,
        count: reactionCounts[emoji],
        isActive: myReaction === emoji,
        onClick: () => handleReaction(post.id, emoji),
        reactedBy: reactedBy,
        allMembers: allMembers
      });
    }), post.comments?.length > 0 && React.createElement("span", {
      className: "text-gray-400 text-sm ml-2"
    }, "\uD83D\uDCAC ", post.comments.length, " ", post.comments.length === 1 ? 'comment' : 'comments')), post.comments?.length > 0 && React.createElement("div", {
      className: "space-y-2 mb-3"
    }, post.comments.slice(0, expandedReplies[post.id] ? post.comments.length : 2).map((reply, idx) => {
      const commentReactionCounts = {};
      Object.values(reply.reactions || {}).forEach(e => {
        commentReactionCounts[e] = (commentReactionCounts[e] || 0) + 1;
      });
      const myCommentReaction = reply.reactions?.[currentUser.afid || currentUser.uid];
      const commentEmojis = ['👍', '❤️', '😊'];
      const isCollapsed = expandedReplies[`collapse_${post.id}_${reply.id}`];
      const showEmojiPicker = expandedReplies[`emoji_${post.id}_${reply.id}`];
      const hasAnyReactions = Object.keys(reply.reactions || {}).length > 0;
      return React.createElement("div", {
        key: reply.id || idx,
        className: "reddit-comment-thread"
      }, reply.replies?.length > 0 && React.createElement("button", {
        className: "reddit-collapse-btn",
        onClick: () => setExpandedReplies({
          ...expandedReplies,
          [`collapse_${post.id}_${reply.id}`]: !isCollapsed
        }),
        title: isCollapsed ? 'Expand' : 'Collapse'
      }, isCollapsed ? '+' : '−'), React.createElement("div", {
        className: "comment-wrapper flex gap-2 ml-0"
      }, reply.authorPhoto ? React.createElement("img", {
        src: reply.authorPhoto,
        alt: "",
        className: "w-8 h-8 rounded-full object-cover flex-shrink-0 border-0",
        style: {
          border: 'none'
        }
      }) : React.createElement("div", {
        className: "w-8 h-8 rounded-full bg-gradient-to-br from-pink-300 to-purple-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
      }, reply.authorName?.charAt(0)), React.createElement("div", {
        className: "flex-1"
      }, editingComment?.postId === post.id && editingComment?.commentId === reply.id ? React.createElement("div", {
        className: "mb-2"
      }, React.createElement("textarea", {
        value: editCommentContent,
        onChange: e => setEditCommentContent(e.target.value),
        className: "w-full p-2 border-2 border-purple-200 rounded-xl focus:border-purple-400 focus:ring-0 resize-none text-sm",
        rows: 2,
        autoFocus: true
      }), React.createElement("div", {
        className: "flex gap-2 mt-1"
      }, React.createElement("button", {
        onClick: () => handleEditComment(post.id, reply.id),
        className: "px-3 py-1 bg-purple-500 text-white rounded-lg text-xs font-semibold hover:bg-purple-600"
      }, "Save"), React.createElement("button", {
        onClick: () => {
          setEditingComment(null);
          setEditCommentContent('');
        },
        className: "px-3 py-1 bg-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-300"
      }, "Cancel"))) : React.createElement("div", {
        className: "bg-gray-50 rounded-2xl px-3 py-2"
      }, React.createElement("span", {
        className: "font-semibold text-sm"
      }, reply.authorName), reply.editedAt && React.createElement("span", {
        className: "text-xs text-gray-400 ml-1"
      }, "(edited)"), React.createElement("span", {
        className: "text-gray-700 text-sm ml-1"
      }, reply.content?.split(/(@\w+(?:\s\w+)?)/g).map((part, i) => part.startsWith('@') ? React.createElement("span", {
        key: i,
        className: "mention-tag"
      }, part) : part)), reply.imageUrl && React.createElement("img", {
        src: reply.imageUrl,
        alt: "",
        className: "mt-2 max-h-32 rounded-lg"
      })), React.createElement("div", {
        className: "reddit-action-row"
      }, React.createElement("span", {
        className: "reddit-timestamp"
      }, reply.createdAt ? new Date(reply.createdAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short'
      }) : ''), React.createElement("button", {
        className: "reddit-action-btn",
        onClick: () => setExpandedReplies({
          ...expandedReplies,
          [`reply_${post.id}_${reply.id}`]: !expandedReplies[`reply_${post.id}_${reply.id}`]
        })
      }, React.createElement("span", {
        className: "icon"
      }, "\uD83D\uDCAC"), React.createElement("span", null, "Reply")), canModify(reply.authorId) && React.createElement(React.Fragment, null, React.createElement("button", {
        className: "reddit-action-btn",
        onClick: () => {
          setEditingComment({
            postId: post.id,
            commentId: reply.id
          });
          setEditCommentContent(reply.content);
        }
      }, React.createElement("span", {
        className: "icon"
      }, "\u270F\uFE0F"), React.createElement("span", null, "Edit")), React.createElement("button", {
        className: "reddit-action-btn text-red-500",
        onClick: () => handleDeleteComment(post.id, reply.id)
      }, React.createElement("span", {
        className: "icon"
      }, "\uD83D\uDDD1\uFE0F"), React.createElement("span", null, "Delete"))), React.createElement("div", {
        className: "reddit-reactions"
      }, commentEmojis.map(emoji => {
        const count = commentReactionCounts[emoji] || 0;
        const reactedBy = Object.entries(reply.reactions || {}).filter(([uid, reaction]) => reaction === emoji).map(([uid]) => uid);
        return React.createElement("button", {
          key: emoji,
          className: `emoji-btn ${myCommentReaction === emoji ? 'active' : ''}`,
          onClick: () => handleCommentReaction(post.id, reply.id, emoji),
          title: reactedBy.length > 0 ? `${reactedBy.length} reaction${reactedBy.length > 1 ? 's' : ''}` : 'React'
        }, emoji, count > 0 && React.createElement("span", {
          style: {
            fontSize: '10px',
            marginLeft: '2px'
          }
        }, count));
      })), reply.replies?.length > 0 && React.createElement("span", {
        className: "reddit-timestamp",
        style: {
          marginLeft: '4px'
        }
      }, "\u2022 ", reply.replies.length, " ", reply.replies.length === 1 ? 'reply' : 'replies')), expandedReplies[`reply_${post.id}_${reply.id}`] && React.createElement("div", {
        className: "reddit-reply-input mt-2"
      }, React.createElement("div", {
        className: "flex items-center gap-2"
      }, React.createElement(MentionInput, {
        value: expandedReplies[`replyText_${post.id}_${reply.id}`] || '',
        onChange: val => setExpandedReplies({
          ...expandedReplies,
          [`replyText_${post.id}_${reply.id}`]: val
        }),
        placeholder: `Reply to ${reply.authorName}...`,
        allMembers: allMembers,
        className: "flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400",
        onSubmit: () => {
          const replyText = expandedReplies[`replyText_${post.id}_${reply.id}`];
          if (replyText?.trim()) {
            handleNestedReply(post.id, reply.id, replyText.trim());
            setExpandedReplies({
              ...expandedReplies,
              [`replyText_${post.id}_${reply.id}`]: '',
              [`reply_${post.id}_${reply.id}`]: false
            });
          }
        }
      }), React.createElement("button", {
        onClick: () => {
          const replyText = expandedReplies[`replyText_${post.id}_${reply.id}`];
          if (replyText?.trim()) {
            handleNestedReply(post.id, reply.id, replyText.trim());
            setExpandedReplies({
              ...expandedReplies,
              [`replyText_${post.id}_${reply.id}`]: '',
              [`reply_${post.id}_${reply.id}`]: false
            });
          }
        },
        className: "text-purple-600 font-semibold text-sm hover:text-purple-800 px-3 py-2"
      }, "Post"))), !isCollapsed && reply.replies?.length > 0 && React.createElement("div", {
        className: "mt-2 space-y-2 ml-4 pl-4 border-l-2 border-gray-200"
      }, reply.replies.map((nestedReply, nidx) => {
        const nestedReactionCounts = {};
        Object.values(nestedReply.reactions || {}).forEach(e => {
          nestedReactionCounts[e] = (nestedReactionCounts[e] || 0) + 1;
        });
        const myNestedReaction = nestedReply.reactions?.[currentUser.afid || currentUser.uid];
        return React.createElement("div", {
          key: nestedReply.id || nidx,
          className: "comment-wrapper flex gap-2"
        }, nestedReply.authorPhoto ? React.createElement("img", {
          src: nestedReply.authorPhoto,
          alt: "",
          className: "w-6 h-6 rounded-full object-cover flex-shrink-0"
        }) : React.createElement("div", {
          className: "w-6 h-6 rounded-full bg-gradient-to-br from-blue-300 to-indigo-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        }, nestedReply.authorName?.charAt(0)), React.createElement("div", {
          className: "flex-1"
        }, React.createElement("div", {
          className: "bg-gray-50 rounded-xl px-3 py-1.5"
        }, React.createElement("span", {
          className: "font-semibold text-xs"
        }, nestedReply.authorName), React.createElement("span", {
          className: "text-gray-700 text-xs ml-1"
        }, nestedReply.content?.split(/(@\w+(?:\s\w+)?)/g).map((part, i) => part.startsWith('@') ? React.createElement("span", {
          key: i,
          className: "mention-tag"
        }, part) : part))), React.createElement("div", {
          className: "flex items-center gap-1 mt-0.5 ml-2 text-xs text-gray-400"
        }, nestedReply.createdAt && new Date(nestedReply.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short'
        }))));
      })))));
    }), post.comments.length > 2 && !expandedReplies[post.id] && React.createElement("button", {
      onClick: () => setExpandedReplies({
        ...expandedReplies,
        [post.id]: true
      }),
      className: "text-sm text-gray-500 font-medium hover:text-gray-700 ml-10"
    }, "View all ", post.comments.length, " comments")), React.createElement("div", {
      className: "border-t border-gray-100 pt-3 mt-2"
    }, React.createElement("div", {
      className: "flex items-center gap-3"
    }, currentUser.profilePhoto ? React.createElement("img", {
      src: currentUser.profilePhoto,
      alt: "",
      className: "w-8 h-8 rounded-full object-cover flex-shrink-0"
    }) : React.createElement("div", {
      className: "w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
    }, currentUser.name?.charAt(0)), React.createElement("div", {
      className: "flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2 border border-gray-200 focus-within:border-purple-400 focus-within:bg-white transition-all"
    }, React.createElement(MentionInput, {
      value: replyingTo === post.id ? replyContent : '',
      onChange: val => {
        setReplyingTo(post.id);
        setReplyContent(val);
      },
      placeholder: "Add a comment... (type @ to mention)",
      allMembers: allMembers,
      className: "flex-1 bg-transparent border-none outline-none text-sm",
      onSubmit: () => {
        if (replyContent.trim()) handleReply(post.id);
      }
    }), React.createElement("label", {
      className: "cursor-pointer text-gray-400 hover:text-gray-600 p-1 ml-1"
    }, React.createElement("span", {
      className: "text-lg"
    }, "\uD83D\uDCCE"), React.createElement("input", {
      type: "file",
      accept: "image/*,video/*",
      onChange: e => {
        setReplyingTo(post.id);
        handleReplyImageSelect(e);
      },
      className: "hidden"
    })), replyingTo === post.id && (replyContent.trim() || replyImagePreview) && React.createElement("button", {
      onClick: () => handleReply(post.id),
      className: "text-purple-600 font-semibold text-sm ml-2 hover:text-purple-800"
    }, "Post"))), replyingTo === post.id && replyImagePreview && React.createElement("div", {
      className: "relative inline-block ml-11 mt-2"
    }, React.createElement("img", {
      src: replyImagePreview,
      alt: "Preview",
      className: "max-h-20 rounded-lg"
    }), React.createElement("button", {
      onClick: () => {
        setReplyImage(null);
        setReplyImagePreview(null);
      },
      className: "absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 rounded-full text-xs"
    }, "\u2715"))));
  }))), activeTab === 'recognition' && React.createElement("div", {
    className: "space-y-6"
  }, recognitionLoading ? React.createElement("div", {
    className: "flex items-center justify-center h-64"
  }, React.createElement("div", {
    className: "text-center"
  }, React.createElement("div", {
    className: "w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"
  }), React.createElement("p", {
    className: "text-gray-500"
  }, "Loading recognition data..."))) : React.createElement(React.Fragment, null, React.createElement("div", {
    className: "bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 p-1 rounded-2xl"
  }, React.createElement("div", {
    className: "bg-white p-6 rounded-2xl"
  }, React.createElement("div", {
    className: "text-center"
  }, React.createElement("div", {
    className: "text-5xl mb-4"
  }, "\uD83C\uDFC6"), React.createElement("h2", {
    className: "text-2xl font-bold mb-2"
  }, "Educators of the Month"), React.createElement("p", {
    className: "text-gray-500 mb-6"
  }, new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric'
  })), topPerformers.length > 0 ? React.createElement("div", {
    className: "grid md:grid-cols-2 gap-6 max-w-2xl mx-auto"
  }, topPerformers.map((educator, idx) => React.createElement("div", {
    key: educator.afid,
    className: `p-6 rounded-xl ${idx === 0 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300' : 'bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-300'}`
  }, React.createElement("div", {
    className: "text-4xl mb-3"
  }, idx === 0 ? '🥇' : '🥈'), React.createElement("div", {
    className: `w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3 ${idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gradient-to-br from-gray-400 to-slate-500'}`
  }, educator.name?.charAt(0)), React.createElement("h3", {
    className: "text-xl font-bold text-gray-800"
  }, educator.name), React.createElement("p", {
    className: "text-sm text-gray-600"
  }, educator.subject), React.createElement("p", {
    className: "text-xs text-gray-500"
  }, educator.school), React.createElement("div", {
    className: "mt-4 flex justify-center gap-3"
  }, React.createElement("div", {
    className: `px-3 py-2 rounded-lg ${idx === 0 ? 'bg-yellow-100' : 'bg-gray-100'}`
  }, React.createElement("div", {
    className: `text-xl font-bold ${idx === 0 ? 'text-yellow-600' : 'text-gray-600'}`
  }, educator.totalHours?.toFixed(1), "h"), React.createElement("div", {
    className: `text-xs ${idx === 0 ? 'text-yellow-700' : 'text-gray-500'}`
  }, "Hours")), React.createElement("div", {
    className: "bg-green-100 px-3 py-2 rounded-lg"
  }, React.createElement("div", {
    className: "text-xl font-bold text-green-600"
  }, educator.entries), React.createElement("div", {
    className: "text-xs text-green-700"
  }, "Entries")))))) : React.createElement("div", {
    className: "text-gray-500 py-8"
  }, React.createElement("div", {
    className: "text-4xl mb-2"
  }, "\uD83D\uDCCA"), React.createElement("p", null, "Not enough data yet this month"), React.createElement("p", {
    className: "text-sm"
  }, "Keep logging your activities!"))))), previousMonthWinners.length > 0 && React.createElement("div", {
    className: "bg-white p-6 rounded-xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-6 flex items-center gap-2"
  }, React.createElement("span", null, "\uD83C\uDF1F"), " Previous Month's Top Performers", React.createElement("span", {
    className: "text-sm font-normal text-gray-500 ml-2"
  }, "(", new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric'
  }), ")")), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4"
  }, previousMonthWinners.map((educator, idx) => React.createElement("div", {
    key: educator.afid,
    className: `p-4 rounded-xl border-2 flex items-center gap-4 ${idx === 0 ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-gray-50'}`
  }, React.createElement("div", {
    className: `w-12 h-12 rounded-full flex items-center justify-center font-bold text-white ${idx === 0 ? 'bg-yellow-500' : 'bg-gray-400'}`
  }, idx === 0 ? '🥇' : '🥈'), React.createElement("div", {
    className: "flex-1"
  }, React.createElement("div", {
    className: "font-semibold"
  }, educator.name), React.createElement("div", {
    className: "text-xs text-gray-500"
  }, educator.school, " \u2022 ", educator.subject)), React.createElement("div", {
    className: "text-right"
  }, React.createElement("span", {
    className: "text-xl font-bold text-yellow-600"
  }, educator.totalHours?.toFixed(1)), React.createElement("span", {
    className: "text-gray-500 text-sm"
  }, " hrs")))))), React.createElement("div", {
    className: "bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border-2 border-purple-200"
  }, React.createElement("h4", {
    className: "font-bold text-purple-800 mb-3 flex items-center gap-2"
  }, React.createElement("span", null, "\uD83D\uDCA1"), " How Recognition Works"), React.createElement("ul", {
    className: "text-sm text-purple-700 space-y-2"
  }, React.createElement("li", null, "\u2022 Top 2 educators with most approved timesheet hours are recognized each month"), React.createElement("li", null, "\u2022 Make sure to log your daily activities in the Timesheet"), React.createElement("li", null, "\u2022 Get your entries approved by your line manager"), React.createElement("li", null, "\u2022 Previous month's winners are also displayed for motivation!"))))), showBirthdayPopup && React.createElement("div", {
    className: "fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
  }, React.createElement("div", {
    className: "bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-bounce-in"
  }, React.createElement("style", null, `
              @keyframes bounce-in {
                0% { transform: scale(0.5); opacity: 0; }
                70% { transform: scale(1.05); }
                100% { transform: scale(1); opacity: 1; }
              }
              .animate-bounce-in { animation: bounce-in 0.5s ease-out; }
            `), React.createElement("div", {
    className: "bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-6 text-white text-center"
  }, React.createElement("div", {
    className: "text-6xl mb-2"
  }, "\uD83C\uDF82"), React.createElement("h3", {
    className: "text-2xl font-bold"
  }, "Happy Birthday!")), React.createElement("div", {
    className: "p-6 text-center"
  }, showBirthdayPopup.profilePhoto ? React.createElement("img", {
    src: showBirthdayPopup.profilePhoto,
    alt: "",
    className: "w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-pink-300"
  }) : React.createElement("div", {
    className: "w-24 h-24 rounded-full mx-auto mb-4 bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-4xl text-white font-bold"
  }, showBirthdayPopup.name?.charAt(0)), React.createElement("h4", {
    className: "text-2xl font-bold text-gray-800"
  }, showBirthdayPopup.name), React.createElement("p", {
    className: "text-gray-500"
  }, showBirthdayPopup.role || showBirthdayPopup.subject), React.createElement("p", {
    className: "text-pink-600 mt-2 font-medium"
  }, "\uD83C\uDF88 Wishing you a wonderful day! \uD83C\uDF88"), React.createElement("button", {
    onClick: dismissBirthdayPopup,
    className: "mt-6 px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg transition-all"
  }, "Send Wishes! \uD83C\uDF89")))));
}
function TeacherSelfProfile({
  currentUser,
  teachers
}) {
  const [teacherData, setTeacherData] = useState(null);
  const [observations, setObservations] = useState([]);
  const [feedbackData, setFeedbackData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedObservation, setSelectedObservation] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    qualification: '',
    experience: '',
    phone: '',
    whatsapp: '',
    profilePhoto: '',
    driveLink: '',
    bio: '',
    dob: '',
    address: '',
    bloodGroup: '',
    emergencyContact: '',
    emergencyContactName: ''
  });
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  useEffect(() => {
    const teacher = teachers.find(t => t.afid === currentUser.afid || t.email === currentUser.email) || {
      name: currentUser.name || currentUser.email,
      subject: currentUser.subject,
      school: currentUser.school,
      afid: currentUser.afid,
      docId: currentUser.afid
    };
    setTeacherData(teacher);
    setEditForm({
      qualification: teacher.qualification || '',
      experience: teacher.experience || '',
      phone: teacher.phone || '',
      whatsapp: teacher.whatsapp || '',
      profilePhoto: teacher.profilePhoto || '',
      driveLink: teacher.driveLink || '',
      bio: teacher.bio || '',
      dob: teacher.dob || teacher.dateOfBirth || '',
      address: teacher.address || '',
      bloodGroup: teacher.bloodGroup || '',
      emergencyContact: teacher.emergencyContact || '',
      emergencyContactName: teacher.emergencyContactName || ''
    });
  }, [teachers, currentUser]);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const teacherId = currentUser.afid || currentUser.uid;
        const obsSnap = await db.collection('classroomObservations').where('teacherId', '==', teacherId).orderBy('submittedAt', 'desc').get();
        const obsData = obsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          submittedAt: doc.data().submittedAt?.toDate() || new Date(doc.data().submittedAtISO)
        }));
        setObservations(obsData);
        const feedbackSnap = await db.collection('teacherFeedback').get();
        const teacherIdentifiers = [currentUser.afid, currentUser.docId, currentUser.id, currentUser.uid, currentUser.name].filter(Boolean).map(id => String(id).toLowerCase());
        const fbData = feedbackSnap.docs.filter(doc => {
          const data = doc.data();
          const feedbackTeacherId = String(data.teacherId || '').toLowerCase();
          const feedbackTeacherAfid = String(data.teacherAfid || '').toLowerCase();
          const feedbackTeacherDocId = String(data.teacherDocId || '').toLowerCase();
          const feedbackTeacherName = String(data.teacherName || '').toLowerCase();
          return teacherIdentifiers.includes(feedbackTeacherId) || teacherIdentifiers.includes(feedbackTeacherAfid) || teacherIdentifiers.includes(feedbackTeacherDocId) || teacherIdentifiers.includes(feedbackTeacherName);
        }).map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            submittedAt: data.submittedAt?.toDate ? data.submittedAt.toDate() : new Date(data.submittedAt || data.completedAt)
          };
        });
        console.log('My Profile - Found feedback:', fbData.length, 'responses');
        setFeedbackData(fbData);
      } catch (error) {
        console.error('Error fetching teacher profile data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);
  const handleSaveProfile = async () => {
    if (!teacherData?.docId) {
      alert('Unable to update profile. Please contact admin.');
      return;
    }
    setSaving(true);
    try {
      await db.collection('teachers').doc(teacherData.docId).update({
        qualification: editForm.qualification,
        experience: editForm.experience,
        phone: editForm.phone,
        whatsapp: editForm.whatsapp,
        profilePhoto: editForm.profilePhoto,
        driveLink: editForm.driveLink,
        bio: editForm.bio,
        dob: editForm.dob,
        dateOfBirth: editForm.dob,
        address: editForm.address,
        bloodGroup: editForm.bloodGroup,
        emergencyContact: editForm.emergencyContact,
        emergencyContactName: editForm.emergencyContactName,
        updatedAt: new Date().toISOString()
      });
      setTeacherData(prev => ({
        ...prev,
        ...editForm
      }));
      alert('✅ Profile updated successfully!');
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('❌ Failed to update profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };
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
              text: 'My Observation Score Trend',
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
  const calculateProfileCompletion = () => {
    if (!teacherData) return {
      percentage: 0,
      missing: []
    };
    const fields = [{
      key: 'name',
      label: 'Full Name'
    }, {
      key: 'email',
      label: 'Email'
    }, {
      key: 'phone',
      label: 'Phone Number'
    }, {
      key: 'whatsapp',
      label: 'WhatsApp Number'
    }, {
      key: 'dob',
      label: 'Date of Birth',
      alt: 'dateOfBirth'
    }, {
      key: 'school',
      label: 'School'
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
    let filled = 0;
    const missing = [];
    fields.forEach(field => {
      const value = teacherData[field.key] || (field.alt ? teacherData[field.alt] : null);
      if (value && String(value).trim() !== '') {
        filled++;
      } else {
        missing.push(field.label);
      }
    });
    return {
      percentage: Math.round(filled / fields.length * 100),
      missing
    };
  };
  const profileCompletion = calculateProfileCompletion();
  if (loading || !teacherData) {
    return React.createElement("div", {
      className: "flex items-center justify-center min-h-[400px]"
    }, React.createElement("div", {
      className: "text-center"
    }, React.createElement("div", {
      className: "text-4xl mb-4"
    }, "\u23F3"), React.createElement("p", null, "Loading your profile...")));
  }
  return React.createElement("div", {
    className: "space-y-6"
  }, profileCompletion.percentage < 100 && React.createElement("div", {
    className: `p-4 rounded-2xl border-2 ${profileCompletion.percentage < 50 ? 'bg-red-50 border-red-200' : profileCompletion.percentage < 80 ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'}`
  }, React.createElement("div", {
    className: "flex items-center justify-between"
  }, React.createElement("div", {
    className: "flex items-center gap-3"
  }, React.createElement("div", {
    className: `text-3xl ${profileCompletion.percentage < 50 ? 'text-red-500' : profileCompletion.percentage < 80 ? 'text-orange-500' : 'text-blue-500'}`
  }, profileCompletion.percentage < 50 ? '⚠️' : profileCompletion.percentage < 80 ? '📝' : '✨'), React.createElement("div", null, React.createElement("div", {
    className: "font-bold text-gray-800"
  }, "Profile ", profileCompletion.percentage, "% Complete"), React.createElement("div", {
    className: "text-sm text-gray-600"
  }, profileCompletion.missing.length, " field", profileCompletion.missing.length !== 1 ? 's' : '', " remaining: ", profileCompletion.missing.slice(0, 3).join(', '), profileCompletion.missing.length > 3 ? '...' : ''))), React.createElement("button", {
    onClick: () => setShowEditModal(true),
    className: `px-4 py-2 rounded-xl font-semibold text-white ${profileCompletion.percentage < 50 ? 'bg-red-500 hover:bg-red-600' : profileCompletion.percentage < 80 ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-500 hover:bg-blue-600'}`
  }, "Complete Now \u2192")), React.createElement("div", {
    className: "mt-3 bg-white rounded-full h-2 overflow-hidden"
  }, React.createElement("div", {
    className: `h-full rounded-full transition-all ${profileCompletion.percentage < 50 ? 'bg-red-500' : profileCompletion.percentage < 80 ? 'bg-orange-500' : 'bg-blue-500'}`,
    style: {
      width: `${profileCompletion.percentage}%`
    }
  }))), profileCompletion.percentage >= 100 && React.createElement("div", {
    className: "bg-green-50 border-2 border-green-200 p-4 rounded-2xl flex items-center gap-3"
  }, React.createElement("div", {
    className: "text-3xl"
  }, "\u2705"), React.createElement("div", null, React.createElement("div", {
    className: "font-bold text-green-800"
  }, "Profile 100% Complete!"), React.createElement("div", {
    className: "text-sm text-green-600"
  }, "Your profile is complete. Thank you!"))), React.createElement("div", {
    className: "bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-6 rounded-2xl"
  }, React.createElement("div", {
    className: "flex justify-between items-start"
  }, React.createElement("div", {
    className: "flex items-center gap-4"
  }, teacherData.profilePhoto ? React.createElement("img", {
    src: teacherData.profilePhoto,
    alt: teacherData.name,
    className: "w-20 h-20 rounded-full border-4 border-white object-cover"
  }) : React.createElement("div", {
    className: "w-20 h-20 rounded-full border-4 border-white bg-white/30 flex items-center justify-center text-3xl font-bold"
  }, teacherData.name?.charAt(0) || '?'), React.createElement("div", null, React.createElement("h2", {
    className: "text-2xl font-bold"
  }, "\uD83D\uDC64 My Profile"), React.createElement("p", {
    className: "text-xl mt-1"
  }, teacherData.name), React.createElement("p", {
    className: "opacity-90"
  }, teacherData.subject, " | ", teacherData.school), React.createElement("div", {
    className: "flex gap-2 mt-2"
  }, teacherData.afid && React.createElement("span", {
    className: "px-2 py-0.5 bg-white/30 text-white rounded text-xs font-mono"
  }, "AFID: ", teacherData.afid), teacherData.afCode && React.createElement("span", {
    className: "px-2 py-0.5 bg-blue-500 text-white rounded text-xs font-mono"
  }, "AF Code: ", teacherData.afCode)))), React.createElement("button", {
    onClick: () => setShowEditModal(true),
    className: "px-4 py-2 bg-white text-orange-600 rounded-xl font-semibold hover:bg-orange-50"
  }, "\u270F\uFE0F Edit Profile"))), React.createElement("div", {
    className: "bg-white p-6 rounded-xl shadow"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "\uD83D\uDCCB Profile Details"), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4"
  }, React.createElement("div", {
    className: "bg-gray-50 p-4 rounded-lg"
  }, React.createElement("div", {
    className: "text-sm text-gray-500"
  }, "Education Qualification"), React.createElement("div", {
    className: "font-semibold"
  }, teacherData.qualification || 'Not specified')), React.createElement("div", {
    className: "bg-gray-50 p-4 rounded-lg"
  }, React.createElement("div", {
    className: "text-sm text-gray-500"
  }, "Experience"), React.createElement("div", {
    className: "font-semibold"
  }, teacherData.experience || 'Not specified')), React.createElement("div", {
    className: "bg-gray-50 p-4 rounded-lg"
  }, React.createElement("div", {
    className: "text-sm text-gray-500"
  }, "Phone"), React.createElement("div", {
    className: "font-semibold"
  }, teacherData.phone || 'Not specified')), React.createElement("div", {
    className: "bg-gray-50 p-4 rounded-lg"
  }, React.createElement("div", {
    className: "text-sm text-gray-500"
  }, "WhatsApp"), React.createElement("div", {
    className: "font-semibold"
  }, teacherData.whatsapp || 'Not specified')), React.createElement("div", {
    className: "bg-gray-50 p-4 rounded-lg"
  }, React.createElement("div", {
    className: "text-sm text-gray-500"
  }, "Email"), React.createElement("div", {
    className: "font-semibold"
  }, teacherData.email || 'Not specified')), React.createElement("div", {
    className: "bg-gray-50 p-4 rounded-lg"
  }, React.createElement("div", {
    className: "text-sm text-gray-500"
  }, "\uD83C\uDF82 Date of Birth"), React.createElement("div", {
    className: "font-semibold"
  }, teacherData.dob || teacherData.dateOfBirth || 'Not specified')), React.createElement("div", {
    className: "bg-gray-50 p-4 rounded-lg"
  }, React.createElement("div", {
    className: "text-sm text-gray-500"
  }, "\uD83E\uDE78 Blood Group"), React.createElement("div", {
    className: "font-semibold"
  }, teacherData.bloodGroup || 'Not specified')), React.createElement("div", {
    className: "bg-gray-50 p-4 rounded-lg"
  }, React.createElement("div", {
    className: "text-sm text-gray-500"
  }, "\uD83D\uDCC5 Joining Date"), React.createElement("div", {
    className: "font-semibold"
  }, teacherData.joiningDate || 'Not specified')), React.createElement("div", {
    className: "bg-gray-50 p-4 rounded-lg"
  }, React.createElement("div", {
    className: "text-sm text-gray-500"
  }, "Average Rating"), React.createElement("div", {
    className: "font-semibold text-yellow-600"
  }, overallRating || 'N/A', "/5"))), React.createElement("div", {
    className: "mt-4 bg-gray-50 p-4 rounded-lg"
  }, React.createElement("div", {
    className: "text-sm text-gray-500"
  }, "\uD83C\uDFE0 Address"), React.createElement("div", {
    className: "font-semibold"
  }, teacherData.address || 'Not specified')), React.createElement("div", {
    className: "mt-4 bg-red-50 p-4 rounded-lg border border-red-100"
  }, React.createElement("div", {
    className: "text-sm text-red-600 font-semibold mb-2"
  }, "\uD83C\uDD98 Emergency Contact"), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4"
  }, React.createElement("div", null, React.createElement("div", {
    className: "text-sm text-gray-500"
  }, "Contact Name"), React.createElement("div", {
    className: "font-semibold"
  }, teacherData.emergencyContactName || 'Not specified')), React.createElement("div", null, React.createElement("div", {
    className: "text-sm text-gray-500"
  }, "Contact Number"), React.createElement("div", {
    className: "font-semibold"
  }, teacherData.emergencyContact || 'Not specified')))), teacherData.driveLink && React.createElement("div", {
    className: "mt-4 bg-blue-50 p-4 rounded-lg"
  }, React.createElement("div", {
    className: "text-sm text-gray-500"
  }, "\uD83D\uDCC1 Google Drive Folder"), React.createElement("a", {
    href: teacherData.driveLink,
    target: "_blank",
    rel: "noopener noreferrer",
    className: "font-semibold text-blue-600 hover:underline flex items-center gap-2"
  }, "\uD83D\uDCC2 Open Teaching Resources")), teacherData.bio && React.createElement("div", {
    className: "mt-4 bg-gray-50 p-4 rounded-lg"
  }, React.createElement("div", {
    className: "text-sm text-gray-500"
  }, "Bio"), React.createElement("div", {
    className: "font-semibold"
  }, teacherData.bio))), React.createElement("div", {
    className: "grid md:grid-cols-3 gap-4"
  }, React.createElement("div", {
    className: "bg-white p-4 rounded-xl shadow border-l-4 border-yellow-500"
  }, React.createElement("div", {
    className: "text-sm text-gray-500"
  }, "Total Observations"), React.createElement("div", {
    className: "text-3xl font-bold text-yellow-600"
  }, observations.length)), React.createElement("div", {
    className: "bg-white p-4 rounded-xl shadow border-l-4 border-green-500"
  }, React.createElement("div", {
    className: "text-sm text-gray-500"
  }, "Avg Observation Score"), React.createElement("div", {
    className: "text-3xl font-bold text-green-600"
  }, observations.length > 0 ? (observations.reduce((sum, o) => sum + o.percentageScore, 0) / observations.length).toFixed(1) + '%' : 'N/A')), React.createElement("div", {
    className: "bg-white p-4 rounded-xl shadow border-l-4 border-blue-500"
  }, React.createElement("div", {
    className: "text-sm text-gray-500"
  }, "Student Feedback Rating"), React.createElement("div", {
    className: "text-3xl font-bold text-blue-600"
  }, overallRating || 'N/A', "/5"), React.createElement("div", {
    className: "text-xs text-gray-400"
  }, feedbackData.length, " responses"))), observations.length > 0 && React.createElement("div", {
    className: "bg-white p-4 rounded-xl shadow"
  }, React.createElement("div", {
    style: {
      height: '250px'
    }
  }, React.createElement("canvas", {
    ref: chartRef
  }))), React.createElement("div", {
    className: "bg-white p-6 rounded-xl shadow"
  }, React.createElement("div", {
    className: "flex justify-between items-center mb-4"
  }, React.createElement("h3", {
    className: "text-xl font-bold"
  }, "\uD83D\uDCCB My Classroom Observations"), React.createElement("select", {
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
  }, "\uD83D\uDCCB"), React.createElement("p", null, "No classroom observations yet"), React.createElement("p", {
    className: "text-sm"
  }, "Your manager will add observations when they visit your class")) : React.createElement("div", {
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
  }, "\uD83D\uDCAC Student Feedback Summary"), React.createElement("p", {
    className: "text-sm text-gray-500 mb-4"
  }, "Average scores from ", feedbackData.length, " student responses (individual responses are anonymous)"), !feedbackAverages ? React.createElement("div", {
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
  }, "(", data.count, " ratings)")))))), showEditModal && React.createElement("div", {
    className: "modal-overlay",
    onClick: () => setShowEditModal(false)
  }, React.createElement("div", {
    className: "modal-content max-w-lg",
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    className: "p-6"
  }, React.createElement("div", {
    className: "flex justify-between items-center mb-6"
  }, React.createElement("h3", {
    className: "text-xl font-bold"
  }, "\u270F\uFE0F Edit Profile"), React.createElement("button", {
    onClick: () => setShowEditModal(false),
    className: "text-2xl font-bold text-gray-400"
  }, "\xD7")), React.createElement("div", {
    className: "space-y-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Profile Photo"), React.createElement("div", {
    className: "flex items-center gap-4 mb-3"
  }, editForm.profilePhoto ? React.createElement("img", {
    src: editForm.profilePhoto,
    alt: "Profile",
    className: "w-20 h-20 rounded-full object-cover border-2 border-yellow-400"
  }) : React.createElement("div", {
    className: "w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-3xl text-white font-bold"
  }, teacherData?.name?.charAt(0) || '?'), React.createElement("div", {
    className: "flex-1"
  }, React.createElement("p", {
    className: "text-sm text-gray-600"
  }, "Upload a photo (max 1MB, JPG/PNG)"))), React.createElement("input", {
    type: "file",
    id: "profilePhotoUpload",
    accept: "image/jpeg,image/png,image/webp",
    onChange: async e => {
      const file = e.target.files[0];
      if (!file) return;
      const uploadBtn = document.getElementById('uploadStatus');
      if (file.size > 1024 * 1024) {
        alert('❌ File too large! Please upload an image under 1MB');
        e.target.value = '';
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        alert('❌ Invalid file type! Please upload JPG, PNG, or WebP image');
        e.target.value = '';
        return;
      }
      try {
        if (uploadBtn) {
          uploadBtn.textContent = '⏳ Uploading...';
          uploadBtn.className = 'text-sm text-blue-600 font-medium';
        }
        const reader = new FileReader();
        reader.onload = async readerEvent => {
          const base64 = readerEvent.target.result;
          setEditForm(prev => ({
            ...prev,
            profilePhoto: base64
          }));
          try {
            const storageRef = firebase.storage().ref();
            const safeId = (teacherData.afid || teacherData.email || 'unknown').replace(/[^a-zA-Z0-9]/g, '_');
            const fileName = `profile-photos/${safeId}_${Date.now()}.${file.name.split('.').pop() || 'jpg'}`;
            const photoRef = storageRef.child(fileName);
            const uploadTask = photoRef.put(file);
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Upload timeout - please try again')), 30000);
            });
            await Promise.race([new Promise((resolve, reject) => {
              uploadTask.on('state_changed', snapshot => {
                const progress = Math.round(snapshot.bytesTransferred / snapshot.totalBytes * 100);
                if (uploadBtn) uploadBtn.textContent = `⏳ Uploading... ${progress}%`;
              }, error => reject(error), async () => {
                try {
                  const downloadURL = await photoRef.getDownloadURL();
                  setEditForm(prev => ({
                    ...prev,
                    profilePhoto: downloadURL
                  }));
                  resolve(downloadURL);
                } catch (urlError) {
                  reject(urlError);
                }
              });
            }), timeoutPromise]);
            if (uploadBtn) {
              uploadBtn.textContent = '✅ Uploaded successfully!';
              uploadBtn.className = 'text-sm text-green-600 font-medium';
            }
            setTimeout(() => {
              if (uploadBtn) uploadBtn.textContent = '';
            }, 3000);
          } catch (uploadError) {
            console.error('Firebase upload error:', uploadError);
            if (uploadBtn) {
              uploadBtn.textContent = '⚠️ Cloud save failed, using local preview';
              uploadBtn.className = 'text-sm text-orange-600 font-medium';
            }
          }
        };
        reader.onerror = () => {
          throw new Error('Failed to read file');
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Upload error:', error);
        if (uploadBtn) {
          uploadBtn.textContent = '❌ ' + (error.message || 'Upload failed');
          uploadBtn.className = 'text-sm text-red-600 font-medium';
        }
        e.target.value = '';
      }
    },
    className: "w-full border-2 px-4 py-3 rounded-xl cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
  }), React.createElement("span", {
    id: "uploadStatus",
    className: "text-sm text-green-600 font-medium"
  }), React.createElement("div", {
    className: "mt-3"
  }, React.createElement("p", {
    className: "text-xs text-gray-500 mb-2"
  }, "Or paste an image URL:"), React.createElement("input", {
    type: "url",
    value: editForm.profilePhoto,
    onChange: e => setEditForm({
      ...editForm,
      profilePhoto: e.target.value
    }),
    placeholder: "https://example.com/photo.jpg",
    className: "w-full border-2 px-4 py-2 rounded-xl text-sm"
  }))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Education Qualification"), React.createElement("input", {
    type: "text",
    value: editForm.qualification,
    onChange: e => setEditForm({
      ...editForm,
      qualification: e.target.value
    }),
    placeholder: "e.g., M.Sc Physics, B.Ed",
    className: "w-full border-2 px-4 py-3 rounded-xl"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Experience"), React.createElement("input", {
    type: "text",
    value: editForm.experience,
    onChange: e => setEditForm({
      ...editForm,
      experience: e.target.value
    }),
    placeholder: "e.g., 5 years teaching Physics",
    className: "w-full border-2 px-4 py-3 rounded-xl"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Phone Number"), React.createElement("input", {
    type: "tel",
    value: editForm.phone,
    onChange: e => setEditForm({
      ...editForm,
      phone: e.target.value
    }),
    placeholder: "e.g., 9876543210",
    className: "w-full border-2 px-4 py-3 rounded-xl"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "WhatsApp Number"), React.createElement("input", {
    type: "tel",
    value: editForm.whatsapp,
    onChange: e => setEditForm({
      ...editForm,
      whatsapp: e.target.value
    }),
    placeholder: "e.g., 9876543210",
    className: "w-full border-2 px-4 py-3 rounded-xl"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "\uD83C\uDF82 Date of Birth"), React.createElement("input", {
    type: "date",
    value: editForm.dob,
    onChange: e => setEditForm({
      ...editForm,
      dob: e.target.value
    }),
    className: "w-full border-2 px-4 py-3 rounded-xl"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "\uD83E\uDE78 Blood Group"), React.createElement("select", {
    value: editForm.bloodGroup,
    onChange: e => setEditForm({
      ...editForm,
      bloodGroup: e.target.value
    }),
    className: "w-full border-2 px-4 py-3 rounded-xl"
  }, React.createElement("option", {
    value: ""
  }, "Select Blood Group"), React.createElement("option", {
    value: "A+"
  }, "A+"), React.createElement("option", {
    value: "A-"
  }, "A-"), React.createElement("option", {
    value: "B+"
  }, "B+"), React.createElement("option", {
    value: "B-"
  }, "B-"), React.createElement("option", {
    value: "AB+"
  }, "AB+"), React.createElement("option", {
    value: "AB-"
  }, "AB-"), React.createElement("option", {
    value: "O+"
  }, "O+"), React.createElement("option", {
    value: "O-"
  }, "O-"))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "\uD83C\uDFE0 Address"), React.createElement("textarea", {
    value: editForm.address,
    onChange: e => setEditForm({
      ...editForm,
      address: e.target.value
    }),
    placeholder: "Your full address...",
    rows: "2",
    className: "w-full border-2 px-4 py-3 rounded-xl"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "\uD83C\uDD98 Emergency Contact Name"), React.createElement("input", {
    type: "text",
    value: editForm.emergencyContactName,
    onChange: e => setEditForm({
      ...editForm,
      emergencyContactName: e.target.value
    }),
    placeholder: "e.g., Father, Mother, Spouse",
    className: "w-full border-2 px-4 py-3 rounded-xl"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "\uD83D\uDCDE Emergency Contact Number"), React.createElement("input", {
    type: "tel",
    value: editForm.emergencyContact,
    onChange: e => setEditForm({
      ...editForm,
      emergencyContact: e.target.value
    }),
    placeholder: "e.g., 9876543210",
    className: "w-full border-2 px-4 py-3 rounded-xl"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "\uD83D\uDCC1 Google Drive Folder Link"), React.createElement("input", {
    type: "url",
    value: editForm.driveLink,
    onChange: e => setEditForm({
      ...editForm,
      driveLink: e.target.value
    }),
    placeholder: "https://drive.google.com/drive/folders/...",
    className: "w-full border-2 px-4 py-3 rounded-xl"
  }), React.createElement("p", {
    className: "text-xs text-gray-500 mt-1"
  }, "Link to your teaching resources folder")), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Bio (About Me)"), React.createElement("textarea", {
    value: editForm.bio,
    onChange: e => setEditForm({
      ...editForm,
      bio: e.target.value
    }),
    placeholder: "Tell students about yourself...",
    rows: "3",
    className: "w-full border-2 px-4 py-3 rounded-xl"
  })), React.createElement("div", {
    className: "flex gap-3 pt-4"
  }, React.createElement("button", {
    onClick: handleSaveProfile,
    disabled: saving,
    className: "flex-1 avanti-gradient text-white py-3 rounded-xl font-semibold disabled:opacity-50"
  }, saving ? '⏳ Saving...' : '✅ Save Changes'), React.createElement("button", {
    onClick: () => setShowEditModal(false),
    className: "px-6 py-3 bg-gray-300 rounded-xl font-semibold"
  }, "Cancel")))))), selectedObservation && React.createElement("div", {
    className: "modal-overlay",
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
  }))), React.createElement("button", {
    onClick: () => setSelectedObservation(null),
    className: "text-2xl font-bold text-gray-400"
  }, "\xD7")), React.createElement("div", {
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

// ✅ Mount the React application
ReactDOM.render(React.createElement(App, null), document.getElementById('root'));
