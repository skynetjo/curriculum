// ========================================
  // AGGRESSIVE AUTO-UPDATE MECHANISM FOR PWA
  // ========================================
  // Version management - UPDATE THIS WITH EACH DEPLOYMENT
  const CURRENT_VERSION = '5.1.0'; // ✅ PERFORMANCE FIX + NOTIFICATION FIX

  // ✅ PERFORMANCE FIX: Check for updates less frequently (once per session)
  // This saves bandwidth for teachers in low-connectivity areas
  (async function immediateUpdateCheck() {
    try {
      // Skip if already checked this session
      const lastCheck = sessionStorage.getItem('versionCheckTime');
      const now = Date.now();
      if (lastCheck && (now - parseInt(lastCheck)) < 300000) { // 5 minutes
        console.log('⏭️ Skipping version check (checked recently)');
        return;
      }
      sessionStorage.setItem('versionCheckTime', String(now));
      
      // Fetch the latest index.html with cache bypass
      const response = await fetch('/index.html?v=' + Date.now(), { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      const html = await response.text();
      
      // Extract version from fetched HTML
      const versionMatch = html.match(/CURRENT_VERSION\s*=\s*['"]([^'"]+)['"]/);
      if (versionMatch && versionMatch[1] !== CURRENT_VERSION) {
        console.log('🆕 New version available:', versionMatch[1], '(current:', CURRENT_VERSION, ')');
        // Auto-update without asking
        performUpdate();
      }
    } catch (e) {
      console.log('Version check failed:', e);
    }
  })();

  // Check stored version
  function checkStoredVersion() {
    const storedVersion = localStorage.getItem('appVersion');
    if (storedVersion && storedVersion !== CURRENT_VERSION) {
      console.log('🔄 Stored version mismatch, updating...');
      performUpdate();
    } else if (!storedVersion) {
      localStorage.setItem('appVersion', CURRENT_VERSION);
    }
  }

  // Perform the update
  async function performUpdate() {
    console.log('🔄 Starting auto-update...');
    
    // Show update indicator
    const updateBanner = document.createElement('div');
    updateBanner.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; right: 0; background: linear-gradient(90deg, #F4B41A, #E8B039); color: white; padding: 12px 20px; text-align: center; z-index: 99999; font-family: Arial, sans-serif; box-shadow: 0 2px 10px rgba(0,0,0,0.2);">
        <span style="font-size: 16px;">🔄 Updating to latest version... Please wait</span>
      </div>
    `;
    document.body.prepend(updateBanner);

    try {
      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('🗑️ All caches cleared');
      }

      // Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
        console.log('🗑️ Service workers unregistered');
      }

      // Preserve user session AND device ID for 2FA
      const sessionData = {
        studentSession: localStorage.getItem('studentSession'),
        authToken: localStorage.getItem('authToken'),
        avanti_device_id: localStorage.getItem('avanti_device_id'), // ✅ FIX: Preserve 2FA device trust
        darkMode: localStorage.getItem('darkMode')
      };

      // Clear storage
      localStorage.clear();
      sessionStorage.clear();

      // Restore session AND device ID
      if (sessionData.studentSession) localStorage.setItem('studentSession', sessionData.studentSession);
      if (sessionData.authToken) localStorage.setItem('authToken', sessionData.authToken);
      if (sessionData.avanti_device_id) {
        localStorage.setItem('avanti_device_id', sessionData.avanti_device_id);
        sessionStorage.setItem('avanti_device_id', sessionData.avanti_device_id);
        // Also restore cookie
        const expires = new Date(Date.now() + 30*24*60*60*1000).toUTCString();
        document.cookie = `avanti_device_id=${sessionData.avanti_device_id};expires=${expires};path=/;SameSite=Strict`;
        console.log('✅ Device ID preserved during update');
      }
      if (sessionData.darkMode) localStorage.setItem('darkMode', sessionData.darkMode);
      
      // Set new version
      localStorage.setItem('appVersion', CURRENT_VERSION);

      // Force reload with cache bypass
      setTimeout(() => {
        window.location.href = window.location.pathname + '?updated=' + Date.now();
      }, 500);

    } catch (e) {
      console.error('Update failed:', e);
      window.location.reload(true);
    }
  }

  // Manual update function
  window.forceUpdate = performUpdate;

  // Register service worker with immediate update behavior
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registered');

        // Check for updates immediately
        registration.update();

        // Check for updates every 5 minutes
        setInterval(() => registration.update(), 5 * 60 * 1000);

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Skip waiting and activate immediately
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });

        // Reload on controller change
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload(true);
        });

      } catch (err) {
        console.error('SW registration failed:', err);
      }
    });
  }

  // Also check on visibility change (when user returns to app)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      checkStoredVersion();
    }
  });

  // Check on load
  window.addEventListener('load', () => setTimeout(checkStoredVersion, 2000));

  // Log version
  console.log('%c📱 Curriculum Tracker v' + CURRENT_VERSION, 'color: #F4B41A; font-size: 16px; font-weight: bold;');
  console.log('%cType forceUpdate() to manually update', 'color: #666; font-size: 12px;');
(function(){
  // Small, resilient wrapper that watches Firestore write methods and shows a saving indicator.
  if (!window || !document) return;
  const overlay = document.getElementById('__global_saving_overlay');
  let activeWrites = 0;
  let safetyTimeoutId = null;
  
  // ✅ FIX: List of selectors for critical buttons that should NEVER be disabled
  const CRITICAL_BUTTONS = [
    '.close-btn',
    '.sidebar-logout',
    '.notification-bell',
    '[class*="close"]',
    '[onclick*="close"]',
    '[onclick*="setIsVisible"]',
    '[onclick*="Logout"]',
    '[onclick*="logout"]',
    'button[class*="Close"]'
  ];
  
  function isCriticalButton(el) {
    // Check if this element matches any critical button selector
    for (const selector of CRITICAL_BUTTONS) {
      try {
        if (el.matches && el.matches(selector)) return true;
      } catch(e) {}
    }
    // Also check for data attribute
    if (el.dataset && el.dataset.allowDuringSaving === "true") return true;
    // Check if it's inside a modal header or card header (close buttons)
    if (el.closest && (el.closest('.online-status-card') || el.closest('.floating-celebration-card') || el.closest('.notification-bell') || el.closest('.sidebar-footer'))) {
      return true;
    }
    return false;
  }
  
  function updateUI(){
    if (activeWrites > 0) {
      overlay.style.display = 'flex';
      // ✅ FIX: Only add visual indicator, DON'T disable buttons
      // This was causing all buttons to become unclickable
    } else {
      overlay.style.display = 'none';
      // ✅ FIX: Remove disabled class from all elements
      document.querySelectorAll('.__global_saving_disabled').forEach(el => {
        el.classList.remove('__global_saving_disabled');
      });
    }
  }

  function startWrite(){ 
    activeWrites++; 
    updateUI(); 
    
    // ✅ FIX: Safety timeout - force end write after 10 seconds
    // This prevents buttons from staying disabled forever
    if (safetyTimeoutId) clearTimeout(safetyTimeoutId);
    safetyTimeoutId = setTimeout(() => {
      if (activeWrites > 0) {
        console.warn('[SaveIndicator] Safety timeout - forcing reset after 10s');
        activeWrites = 0;
        updateUI();
      }
    }, 10000);
  }
  
  function endWrite(){ 
    activeWrites = Math.max(0, activeWrites-1); 
    updateUI(); 
    
    // Clear safety timeout if all writes are done
    if (activeWrites === 0 && safetyTimeoutId) {
      clearTimeout(safetyTimeoutId);
      safetyTimeoutId = null;
    }
  }

  // Wrap common Firestore write methods if firebase is present.
  function tryWrapFirestore(firebase){
    try {
      const firestore = firebase && firebase.firestore && firebase.firestore();
      if (!firestore) return;
      // DocumentReference.prototype.set/update/delete
      const docProto = firestore.constructor && firestore.constructor.prototype;
      // Instead, find DocumentReference from an actual doc object if possible
      let sampleDoc;
      try {
        sampleDoc = firestore.collection('_chattmp_').doc('_tmp_');
      } catch(e){}
      if (sampleDoc) {
        const docRefProto = Object.getPrototypeOf(sampleDoc);
        ['set','update','delete'].forEach(name=>{
          if (docRefProto && docRefProto[name]) {
            const orig = docRefProto[name];
            if (!orig.__wrappedBySaving) {
              docRefProto[name] = function(...args){
                startWrite();
                try {
                  const result = orig.apply(this,args);
                  if (result && typeof result.then === 'function') {
                    return result.finally(endWrite);
                  } else {
                    endWrite();
                    return result;
                  }
                } catch(err){
                  endWrite();
                  throw err;
                }
              };
              docRefProto[name].__wrappedBySaving = true;
            }
          }
        });
      }
      // CollectionReference.add
      let sampleCol;
      try { sampleCol = firestore.collection('_chattmp_'); } catch(e){}
      if (sampleCol) {
        const colProto = Object.getPrototypeOf(sampleCol);
        if (colProto && colProto.add && !colProto.add.__wrappedBySaving) {
          const origAdd = colProto.add;
          colProto.add = function(...args){
            startWrite();
            try {
              const result = origAdd.apply(this,args);
              if (result && typeof result.then === 'function') {
                return result.finally(endWrite);
              } else {
                endWrite();
                return result;
              }
            } catch(err){
              endWrite();
              throw err;
            }
          };
          colProto.add.__wrappedBySaving = true;
        }
      }

      // Wrap write batch commit if available
      try {
        const batch = firestore.batch();
        const batchProto = Object.getPrototypeOf(batch);
        if (batchProto && batchProto.commit && !batchProto.commit.__wrappedBySaving) {
          const origCommit = batchProto.commit;
          batchProto.commit = function(...args){
            startWrite();
            try {
              const res = origCommit.apply(this,args);
              if (res && typeof res.then === 'function') return res.finally(endWrite);
              endWrite();
              return res;
            } catch(e){
              endWrite();
              throw e;
            }
          };
          batchProto.commit.__wrappedBySaving = true;
        }
      } catch(e){}
    } catch(e){}
  }

  // Try to wrap immediately if firebase exists, otherwise poll until it does (for lazy init)
  function attemptWrap(){
    try {
      if (window.firebase && firebase.firestore) {
        tryWrapFirestore(window.firebase);
        return true;
      }
    } catch(e){}
    return false;
  }
  if (!attemptWrap()){
    // poll a few times
    const maxAttempts = 20;
    let attempts = 0;
    const t = setInterval(()=>{
      attempts++;
      if (attemptWrap() || attempts >= maxAttempts) clearInterval(t);
    }, 300);
  }

  // As a fallback, also watch for global ajax/fetch/XHR calls that return promises — optional
  // Wrap fetch to show saving indicator if fetch options contain a header 'X-Expect-Save: true'
  if (window.fetch && !window.fetch.__wrappedBySaving) {
    const origFetch = window.fetch.bind(window);
    window.fetch = function(resource, init){
      const expectSave = init && init.headers && (init.headers['X-Expect-Save'] === 'true' || init.headers.get && init.headers.get('X-Expect-Save') === 'true');
      if (expectSave) startWrite();
      const p = origFetch(resource, init);
      if (expectSave && p && typeof p.then === 'function') return p.finally(()=>endWrite());
      return p;
    };
    window.fetch.__wrappedBySaving = true;
  }

  // expose controls for debugging
  window.__savingOverlay = {
    isActive: ()=> activeWrites > 0,
    startWrite,
    endWrite
  };

})();
// (script boundary removed)

// ============================================
// NOTIFICATION MANAGER - Global App Notifications
// ============================================
const NotificationManager = {
    notifications: [],
    unreadCount: 0,
    messaging: null,
    fcmToken: null,
    isOpen: false,
    userId: null,
    notificationSound: null,
    _initialLoadComplete: false,  // ✅ FIX: Track initial load to prevent sound on app open
    _sessionNotified: {},  // ✅ FIX: Track notifications shown this session
    
    init: function() {
        console.log('[NotificationManager] Initializing...');
        
        // ✅ v5.0.3 FIX: Check if user is a student early
        const isStudent = !!localStorage.getItem('studentSession');
        this._isStudent = isStudent;
        if (isStudent) {
            console.log('[NotificationManager] Student mode - limited features');
        }
        
        // ✅ FIX: Reset session notification tracker
        this._sessionNotified = {};
        this._initialLoadComplete = false;
        
        // Initialize notification sound
        this.initSound();
        
        // Resume audio context on first user interaction
        const resumeAudio = () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    console.log('[NotificationManager] AudioContext resumed');
                });
            }
        };
        document.addEventListener('click', resumeAudio, { once: true });
        document.addEventListener('touchstart', resumeAudio, { once: true });
        
        // Get user ID
        this.getUserId();
        
        // Initialize Firebase Messaging
        this.initMessaging();
        
        // Load notifications from Firestore
        setTimeout(() => {
            try {
                this.loadNotifications();
            } catch (e) {
                console.warn('[NotificationManager] Load notifications error:', e);
            }
        }, 2000);
        
        // Check for today's birthdays/anniversaries at 8 AM (not for students)
        if (!this._isStudent) {
            this.scheduleCelebrationNotifications();
        }
        
        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.notification-bell') && !e.target.closest('.notification-panel')) {
                this.closePanel();
            }
        });
        
        console.log('[NotificationManager] Initialized');
    },
    
    initSound: function() {
        try {
            // Use a simple beep sound (base64 encoded)
            // This is a short notification beep that works without external files
            const beepData = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU' + 
              Array(300).fill('A').join('') + 
              Array(300).fill('/').join('') + 
              Array(200).fill('A').join('');
            
            // Create audio context for better browser support
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.notificationSound = new Audio(beepData);
            this.notificationSound.volume = 0.5;
            
            // Also create an oscillator-based sound as backup
            this.useOscillator = true;
            console.log('[NotificationManager] Sound initialized');
        } catch (e) {
            console.log('[NotificationManager] Sound init error:', e);
        }
    },
    
    playSound: function() {
        try {
            // Try oscillator beep first (more reliable)
            if (this.audioContext) {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.value = 800; // Hz
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.3);
                
                console.log('[NotificationManager] Beep played!');
            }
        } catch (e) {
            console.log('[NotificationManager] Sound error:', e);
        }
    },
    
    scheduleCelebrationNotifications: function() {
        // ✅ v5.0.3 FIX: Skip for students who don't have permission to read teacher collections
        const studentSession = localStorage.getItem('studentSession');
        if (studentSession) {
            console.log('[NotificationManager] Skipping celebration scheduling for student');
            return;
        }
        
        // ✅ FIX: Don't trigger immediate notification check - let loadCelebrationNotifications handle it
        // The browser notification at 8 AM was causing repeated notifications on app open
        const now = new Date();
        const targetHour = 8; // 8 AM
        const currentHour = now.getHours();
        
        // ✅ FIX: Only show ONE notification per day using localStorage
        const todayStr = now.toDateString();
        const sentToday = localStorage.getItem('celebrationNotifSent_' + todayStr);
        
        // If it's between 8 AM and 9 AM AND we haven't sent today, schedule ONE notification
        if (currentHour >= targetHour && currentHour < 10 && !sentToday) {
            console.log('[NotificationManager] Morning window - will check for celebrations');
            // ✅ FIX: Don't call sendCelebrationNotifications immediately
            // Let loadCelebrationNotifications handle it through normal flow
            // This prevents the duplicate sound/notification on app open
        }
        
        // Calculate milliseconds until next 8 AM
        const target = new Date(now);
        target.setHours(targetHour, 0, 0, 0);
        
        if (now >= target) {
            // Already past 8 AM today, schedule for next day
            target.setDate(target.getDate() + 1);
        }
        
        const msUntil8AM = target - now;
        
        // Schedule the check for next 8 AM
        setTimeout(() => {
            this.sendCelebrationNotifications();
            // Then repeat every 24 hours
            setInterval(() => this.sendCelebrationNotifications(), 24 * 60 * 60 * 1000);
        }, msUntil8AM);
        
        console.log('[NotificationManager] Celebration check scheduled for next 8 AM');
    },
    
    sendCelebrationNotifications: async function() {
        if (!this.userId || typeof firebase === 'undefined') return;
        
        // ✅ v5.0.3 FIX: Skip for students who don't have permission to read teacher collections
        const studentSession = localStorage.getItem('studentSession');
        if (studentSession) {
            console.log('[NotificationManager] Skipping celebration check for student');
            return;
        }
        
        const today = new Date();
        const todayStr = today.toDateString();
        
        // Check if already sent today
        const sentToday = localStorage.getItem('celebrationNotifSent_' + todayStr);
        if (sentToday) {
            console.log('[NotificationManager] Celebration notification already sent today');
            return;
        }
        
        try {
            console.log('[NotificationManager] Checking for celebrations at 8 AM...');
            
            // Check for birthdays and anniversaries
            const teachersSnap = await firebase.firestore().collection('teachers').get();
            const managersSnap = await firebase.firestore().collection('managers').get();
            const apcsSnap = await firebase.firestore().collection('apcs').get();
            
            const all = [
                ...teachersSnap.docs.map(d => ({ ...d.data(), id: d.id, type: 'teacher' })),
                ...managersSnap.docs.map(d => ({ ...d.data(), id: d.id, type: 'manager' })),
                ...apcsSnap.docs.map(d => ({ ...d.data(), id: d.id, type: 'apc' }))
            ].filter(m => m.name && m.name.toLowerCase() !== 'vacant' && !m.isArchived);
            
            console.log('[NotificationManager] Total members to check:', all.length);
            
            const birthdays = all.filter(m => {
                const dobField = m.dateOfBirth || m.dob;
                if (!dobField) return false;
                const dob = new Date(dobField);
                return dob.getMonth() === today.getMonth() && dob.getDate() === today.getDate();
            });
            
            const anniversaries = all.filter(m => {
                if (!m.joiningDate) return false;
                const j = new Date(m.joiningDate);
                if (j.getFullYear() >= today.getFullYear()) return false;
                return j.getMonth() === today.getMonth() && j.getDate() === today.getDate();
            });
            
            console.log('[NotificationManager] Birthdays found:', birthdays.length);
            console.log('[NotificationManager] Anniversaries found:', anniversaries.length);
            
            // Store celebration notifications in Firestore for background delivery
            // This allows a Cloud Function to send push notifications to all users
            if (birthdays.length > 0 || anniversaries.length > 0) {
                const celebrationNotification = {
                    type: 'celebration',
                    date: todayStr,
                    birthdays: birthdays.map(b => ({ name: b.name, id: b.id })),
                    anniversaries: anniversaries.map(a => ({ 
                        name: a.name, 
                        id: a.id, 
                        years: today.getFullYear() - new Date(a.joiningDate).getFullYear() 
                    })),
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    processed: false
                };
                
                // Store in app_notifications for all users to see
                await firebase.firestore().collection('app_notifications').add({
                    title: birthdays.length > 0 ? '🎂 Birthday Today!' : '🎉 Work Anniversary!',
                    message: birthdays.length > 0 
                        ? `Wish ${birthdays.map(b => b.name).slice(0, 2).join(', ')}${birthdays.length > 2 ? ` and ${birthdays.length - 2} more` : ''} a Happy Birthday!`
                        : `Congratulate ${anniversaries.map(a => a.name).slice(0, 2).join(', ')}${anniversaries.length > 2 ? ` and ${anniversaries.length - 2} more` : ''} on their work anniversary!`,
                    type: 'celebration',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                console.log('[NotificationManager] Stored celebration notification in Firestore');
            }
            
            // Request notification permission if not granted
            if (Notification.permission === 'default') {
                console.log('[NotificationManager] Requesting notification permission...');
                await Notification.requestPermission();
            }
            
            // Show browser notification with sound
            if (Notification.permission === 'granted') {
                if (birthdays.length > 0) {
                    const names = birthdays.map(b => b.name).slice(0, 3).join(', ');
                    const notif = new Notification('🎂 Birthday Today!', {
                        body: birthdays.length === 1 
                            ? `Wish ${names} a Happy Birthday!`
                            : `${names}${birthdays.length > 3 ? ` and ${birthdays.length - 3} more` : ''} have birthdays today!`,
                        icon: 'Icon-192.png',
                        tag: 'birthday-notification',
                        requireInteraction: true
                    });
                    
                    // Play notification sound
                    this.playNotificationSound('birthday');
                    
                    // Click handler to open app
                    notif.onclick = function() {
                        window.focus();
                        notif.close();
                    };
                }
                
                if (anniversaries.length > 0) {
                    // Delay second notification by 2 seconds if there's a birthday notification
                    setTimeout(() => {
                        const names = anniversaries.map(a => a.name).slice(0, 3).join(', ');
                        const notif = new Notification('🎉 Work Anniversary Today!', {
                            body: anniversaries.length === 1
                                ? `Congratulate ${names} on their work anniversary!`
                                : `${names}${anniversaries.length > 3 ? ` and ${anniversaries.length - 3} more` : ''} have work anniversaries today!`,
                            icon: 'Icon-192.png',
                            tag: 'anniversary-notification',
                            requireInteraction: true
                        });
                        
                        this.playNotificationSound('anniversary');
                        
                        notif.onclick = function() {
                            window.focus();
                            notif.close();
                        };
                    }, birthdays.length > 0 ? 2000 : 0);
                }
            } else {
                console.log('[NotificationManager] Notification permission not granted:', Notification.permission);
            }
            
            localStorage.setItem('celebrationNotifSent_' + todayStr, 'true');
        } catch (e) {
            console.error('[NotificationManager] Celebration check error:', e);
        }
    },
    
    // Play celebration notification sound
    playNotificationSound: function(type) {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            
            if (type === 'birthday') {
                // Happy birthday jingle - C E G C (higher)
                const notes = [523.25, 659.25, 783.99, 1046.50];
                notes.forEach((freq, i) => {
                    setTimeout(() => {
                        const osc = audioCtx.createOscillator();
                        const gain = audioCtx.createGain();
                        osc.connect(gain);
                        gain.connect(audioCtx.destination);
                        osc.frequency.value = freq;
                        osc.type = 'sine';
                        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
                        osc.start(audioCtx.currentTime);
                        osc.stop(audioCtx.currentTime + 0.3);
                    }, i * 150);
                });
            } else {
                // Celebration sound - ascending chord
                const notes = [440, 554.37, 659.25];
                notes.forEach((freq, i) => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.frequency.value = freq;
                    osc.type = 'sine';
                    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
                    osc.start(audioCtx.currentTime);
                    osc.stop(audioCtx.currentTime + 0.5);
                });
            }
            
            console.log('[NotificationManager] 🔔 Celebration sound played');
        } catch (e) {
            console.log('[NotificationManager] Could not play sound:', e);
        }
    },
    
    getUserId: function() {
        // Try to get from localStorage (students)
        const studentSession = localStorage.getItem('studentSession');
        if (studentSession) {
            try {
                const student = JSON.parse(studentSession);
                this.userId = student.studentId || student.id || null;
                return;
            } catch (e) {}
        }
        
        // Try Firebase Auth (teachers)
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().onAuthStateChanged(user => {
                if (user) {
                    this.userId = user.email;
                    this.loadNotifications();
                }
            });
        }
    },
    
    initMessaging: function() {
        // ✅ FIX: Wait for firebase.messaging to be fully loaded (deferred script)
        const initWithRetry = (retries = 5) => {
            if (typeof firebase === 'undefined' || !firebase.messaging) {
                if (retries > 0) {
                    console.log('[NotificationManager] Waiting for Firebase Messaging... retries left:', retries);
                    setTimeout(() => initWithRetry(retries - 1), 1000);
                    return;
                }
                console.log('[NotificationManager] Firebase Messaging not available after retries');
                return;
            }
            
            try {
                this.messaging = firebase.messaging();
                console.log('[NotificationManager] Messaging ready');
                
                // Handle foreground messages
                this.messaging.onMessage((payload) => {
                    console.log('[NotificationManager] Message received:', payload);
                    
                    // Play notification sound
                    this.playSound();
                    
                    // Show browser notification
                    if (Notification.permission === 'granted') {
                        new Notification(payload.notification?.title || 'Avanti Fellows', {
                            body: payload.notification?.body,
                            icon: 'Icon-192.png'
                        });
                    }
                    
                    // Reload notifications
                    this.loadNotifications();
                });
                
                // Auto-request permission and get token if not already done
                this.autoRequestPermission();
                
                // Check for pending celebration notifications from background
                this.checkPendingCelebrations();
            } catch (e) {
                console.log('[NotificationManager] Messaging init error:', e);
            }
        };
        
        initWithRetry();
    },
    
    // ✅ NEW: Auto-request permission silently if possible
    autoRequestPermission: async function() {
        try {
            // Check if we already have a token stored
            const storedToken = localStorage.getItem('fcmToken_' + (this.userId || 'guest'));
            if (storedToken) {
                this.fcmToken = storedToken;
                console.log('[NotificationManager] Using stored FCM token');
                return;
            }
            
            // If permission is already granted, get token
            if (Notification.permission === 'granted') {
                await this.getAndStoreFCMToken();
            } else if (Notification.permission === 'default') {
                // Show a subtle prompt after some delay
                setTimeout(() => {
                    this.showPermissionPrompt();
                }, 10000); // Wait 10 seconds before showing prompt
            }
        } catch (e) {
            console.log('[NotificationManager] Auto permission error:', e);
        }
    },
    
    // ✅ NEW: Show a subtle permission prompt
    showPermissionPrompt: function() {
        // Don't show if user already dismissed recently
        const dismissed = localStorage.getItem('notifPromptDismissed');
        if (dismissed) {
            const dismissedDate = new Date(dismissed);
            const daysSince = (Date.now() - dismissedDate) / (1000 * 60 * 60 * 24);
            if (daysSince < 30) return; // ✅ FIX: Don't show again for 30 days (was 7)
        }
        
        // ✅ FIX: Also don't show if we've already shown it this session
        if (sessionStorage.getItem('notifPromptShownThisSession')) return;
        sessionStorage.setItem('notifPromptShownThisSession', 'true');
        
        // ✅ FIX: Actually show a prompt UI
        const promptDiv = document.createElement('div');
        promptDiv.id = 'notification-prompt';
        promptDiv.innerHTML = `
          <div style="position:fixed;bottom:20px;right:20px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:16px 20px;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,0.3);z-index:9999;max-width:320px;font-family:system-ui,sans-serif;">
            <div style="display:flex;align-items:flex-start;gap:12px;">
              <div style="font-size:28px;">🔔</div>
              <div style="flex:1;">
                <div style="font-weight:600;font-size:14px;margin-bottom:4px;">Enable Notifications?</div>
                <div style="font-size:12px;opacity:0.9;line-height:1.4;">Get alerts for birthdays, mentions, and important updates even when you're not on this page.</div>
                <div style="display:flex;gap:8px;margin-top:12px;">
                  <button id="notif-enable-btn" style="flex:1;padding:8px 12px;background:white;color:#667eea;border:none;border-radius:8px;font-weight:600;font-size:12px;cursor:pointer;">Enable</button>
                  <button id="notif-later-btn" style="padding:8px 12px;background:rgba(255,255,255,0.2);color:white;border:none;border-radius:8px;font-size:12px;cursor:pointer;">Later</button>
                </div>
              </div>
              <button id="notif-close-btn" style="background:none;border:none;color:white;font-size:20px;cursor:pointer;padding:0;line-height:1;">×</button>
            </div>
          </div>
        `;
        document.body.appendChild(promptDiv);
        
        const self = this;
        
        document.getElementById('notif-enable-btn').onclick = async function() {
            promptDiv.remove();
            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    console.log('[NotificationManager] Permission granted!');
                    await self.getAndStoreFCMToken();
                    // Show success toast
                    self.showToast('🔔 Notifications enabled!', 'success');
                }
            } catch (e) {
                console.log('[NotificationManager] Permission error:', e);
            }
        };
        
        document.getElementById('notif-later-btn').onclick = function() {
            localStorage.setItem('notifPromptDismissed', new Date().toISOString());
            promptDiv.remove();
        };
        
        document.getElementById('notif-close-btn').onclick = function() {
            localStorage.setItem('notifPromptDismissed', new Date().toISOString());
            promptDiv.remove();
        };
        
        console.log('[NotificationManager] Permission prompt shown');
    },
    
    // ✅ NEW: Show toast notification
    showToast: function(message, type = 'info') {
        const toast = document.createElement('div');
        toast.style.cssText = `position:fixed;bottom:80px;right:20px;padding:12px 20px;border-radius:12px;color:white;font-size:14px;font-weight:500;z-index:9999;animation:slideIn 0.3s ease;`;
        toast.style.background = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },
    
    // ✅ NEW: Get and store FCM token
    getAndStoreFCMToken: async function() {
        if (!this.messaging) {
            console.log('[NotificationManager] Messaging not initialized');
            return;
        }
        
        try {
            // Register service worker if not already
            let sw = null;
            try {
                sw = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
                if (!sw) {
                    console.log('[NotificationManager] Registering service worker...');
                    sw = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                    console.log('[NotificationManager] Service worker registered');
                }
            } catch (swError) {
                console.log('[NotificationManager] Service worker error (will try without):', swError);
            }
            
            // ✅ FIX: Try to get token - first without VAPID key (works for many Firebase configs)
            let token = null;
            try {
                // Try with service worker if available
                if (sw) {
                    token = await this.messaging.getToken({
                        serviceWorkerRegistration: sw
                    });
                } else {
                    // Try without service worker
                    token = await this.messaging.getToken();
                }
            } catch (tokenError) {
                console.log('[NotificationManager] Token error (will retry):', tokenError.message);
                // Some errors are expected on first try, retry after a moment
                await new Promise(resolve => setTimeout(resolve, 1000));
                try {
                    token = await this.messaging.getToken();
                } catch (retryError) {
                    console.log('[NotificationManager] Token retry failed:', retryError.message);
                }
            }
            
            if (token) {
                this.fcmToken = token;
                try {
                    localStorage.setItem('fcmToken_' + (this.userId || 'guest'), token);
                } catch(e) {}
                console.log('[NotificationManager] ✅ FCM Token obtained:', token.substring(0, 20) + '...');
                
                // Save token to Firestore for this user
                if (this.userId && typeof firebase !== 'undefined') {
                    try {
                        await firebase.firestore().collection('fcm_tokens').doc(this.userId).set({
                            token: token,
                            userId: this.userId,
                            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                            platform: /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'web',
                            userAgent: navigator.userAgent.substring(0, 200)
                        }, { merge: true });
                        console.log('[NotificationManager] ✅ Token saved to Firestore');
                    } catch (firestoreError) {
                        console.log('[NotificationManager] Could not save token to Firestore:', firestoreError);
                    }
                }
                
                return token;
            } else {
                console.log('[NotificationManager] No token received');
            }
        } catch (e) {
            console.log('[NotificationManager] FCM token error:', e);
        }
        return null;
    },
    
    // Check if there are pending celebration notifications from when the app was closed
    checkPendingCelebrations: async function() {
        try {
            // Check IndexedDB for pending check flag
            if ('indexedDB' in window) {
                const db = await this.openIndexedDB();
                const pending = await this.getFromIndexedDB(db, 'pendingCelebrationCheck');
                if (pending) {
                    console.log('[NotificationManager] Pending celebration check from background');
                    await this.setInIndexedDB(db, 'pendingCelebrationCheck', false);
                    // Trigger immediate check
                    setTimeout(() => this.checkForCelebrations(), 1000);
                }
            }
        } catch (e) {
            console.log('[NotificationManager] IndexedDB check error:', e);
        }
    },
    
    // IndexedDB helpers
    openIndexedDB: function() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('AvantiNotifications', 1);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('data')) {
                    db.createObjectStore('data');
                }
            };
        });
    },
    
    getFromIndexedDB: function(db, key) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction('data', 'readonly');
            const store = tx.objectStore('data');
            const request = store.get(key);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    },
    
    setInIndexedDB: function(db, key, value) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction('data', 'readwrite');
            const store = tx.objectStore('data');
            const request = store.put(value, key);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    },
    
    // Schedule a celebration notification to be sent later (stored in Firestore for Cloud Function)
    scheduleCelebrationNotification: async function(type, personName, personId, scheduledTime) {
        if (typeof firebase === 'undefined') return;
        
        try {
            await firebase.firestore().collection('scheduled_notifications').add({
                type: type, // 'birthday' or 'anniversary'
                personName: personName,
                personId: personId,
                scheduledTime: scheduledTime,
                sent: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('[NotificationManager] Scheduled notification for:', personName, type);
        } catch (e) {
            console.error('[NotificationManager] Schedule error:', e);
        }
    },
    
    requestPermission: async function() {
        if (!('Notification' in window)) {
            alert('Your browser does not support notifications');
            return false;
        }
        
        try {
            const permission = await Notification.requestPermission();
            
            if (permission === 'granted') {
                await this.getFCMToken();
                this.renderNotifications();
                return true;
            } else {
                alert('Notifications blocked. Enable in browser settings.');
                return false;
            }
        } catch (e) {
            console.error('[NotificationManager] Permission error:', e);
            return false;
        }
    },
    
    getFCMToken: async function() {
        if (!this.messaging) return null;
        
        try {
            // Register service worker
            if ('serviceWorker' in navigator) {
                try {
                    await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                } catch (e) {
                    console.log('[NotificationManager] SW error:', e.message);
                }
            }
            
            const token = await this.messaging.getToken({
                vapidKey: 'BAmI6KolDdphNCYs1yHd5UtWT80R4MQIO-5VVu5yvc2UfSBez-n5UAJ--MBQc_ZOAvzGOTJRWHQv2uyW2enLbEw' // Replace with your key
            });
            
            if (token) {
                this.fcmToken = token;
                await this.saveFCMToken(token);
                return token;
            }
        } catch (e) {
            console.error('[NotificationManager] Token error:', e);
        }
        return null;
    },
    
    saveFCMToken: async function(token) {
        if (!this.userId || typeof firebase === 'undefined') return;
        
        try {
            await firebase.firestore().collection('app_fcm_tokens').doc(String(this.userId)).set({
                token: token,
                userId: this.userId,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            console.log('[NotificationManager] Token saved');
        } catch (e) {
            console.error('[NotificationManager] Save token error:', e);
        }
    },
    
    // ✅ FIX: Optimized notifications - periodic fetch instead of realtime
    loadNotifications: function() {
        if (typeof firebase === 'undefined') return;
        
        const fetchNotifications = async () => {
            try {
                // Fetch global announcements
                const globalSnap = await firebase.firestore().collection('app_notifications')
                    .orderBy('createdAt', 'desc')
                    .limit(15)
                    .get();
                const globalNotifs = globalSnap.docs.map(d => ({ id: d.id, source: 'global', ...d.data() }));
                this.mergeNotifications(globalNotifs, 'global');
                
                // Fetch user-specific ticket notifications
                if (this.userId) {
                    try {
                        const ticketSnap = await firebase.firestore().collection('user_notifications')
                            .where('userId', '==', String(this.userId))
                            .orderBy('createdAt', 'desc')
                            .limit(15)
                            .get();
                        const ticketNotifs = ticketSnap.docs.map(d => ({ id: d.id, source: 'ticket', ...d.data() }));
                        this.mergeNotifications(ticketNotifs, 'ticket');
                    } catch (indexErr) {
                        // If index error, try without orderBy
                        console.log('[NotificationManager] Trying without orderBy:', indexErr.message);
                        const ticketSnap = await firebase.firestore().collection('user_notifications')
                            .where('userId', '==', String(this.userId))
                            .limit(15)
                            .get();
                        const ticketNotifs = ticketSnap.docs.map(d => ({ id: d.id, source: 'ticket', ...d.data() }));
                        this.mergeNotifications(ticketNotifs, 'ticket');
                    }
                }
                
            } catch (e) {
                console.log('[NotificationManager] Fetch error:', e);
            }
        };
        
        // Initial fetch
        fetchNotifications();
        
        // ✅ FIX: Mark initial load as complete after 5 seconds
        // This allows all initial data to load without playing sounds
        // After this, new notifications WILL play sounds
        setTimeout(() => {
            this._initialLoadComplete = true;
            console.log('[NotificationManager] Initial load complete - sounds enabled for new notifications');
        }, 5000);
        
        // ✅ COST FIX: Refresh every 3 minutes instead of 60 seconds (saves ~₹500/month)
        this.notificationInterval = setInterval(fetchNotifications, 180000);
        
        // Load today's birthday/anniversary notifications (one-time)
        this.loadCelebrationNotifications();
    },
    
    // Load birthday and anniversary notifications
    // ✅ COST FIX: Cache celebration data to avoid repeated fetches
    // ✅ v5.0.3 FIX: Skip for students who don't have permission to read teacher collections
    loadCelebrationNotifications: async function() {
        try {
            // ✅ FIX: Check if current user is a student - skip celebration queries
            // Students don't have permission to read teachers/managers/apcs collections
            const studentSession = localStorage.getItem('studentSession');
            if (studentSession) {
                console.log('[NotificationManager] Skipping celebration notifications for student (no permission to read teacher collections)');
                return; // Exit early - students can't access these collections
            }
            
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayStr = today.toISOString().split('T')[0];
            
            // ✅ COST FIX: Check if we already loaded celebrations today
            const cacheKey = 'celebrationCache_' + todayStr;
            try {
                const cached = localStorage.getItem(cacheKey);
                if (cached) {
                    const cachedData = JSON.parse(cached);
                    console.log('[NotificationManager] Using cached celebration data');
                    this.mergeNotifications(cachedData, 'celebration');
                    return;
                }
            } catch (e) {
                // localStorage might fail in private mode, continue without cache
            }
            
            const todayMonth = today.getMonth();
            const todayDate = today.getDate();
            
            console.log('[NotificationManager] Loading celebration notifications for', today.toDateString());
            
            // Load teachers (without problematic query - filter client-side)
            const teachersSnap = await firebase.firestore().collection('teachers').get();
            
            // Load managers
            const managersSnap = await firebase.firestore().collection('managers').get();
            
            // Load APCs
            const apcsSnap = await firebase.firestore().collection('apcs').get();
            
            const allMembers = [
                ...teachersSnap.docs.map(d => ({ id: d.id, ...d.data(), type: 'teacher' })),
                ...managersSnap.docs.map(d => ({ id: d.id, ...d.data(), type: 'manager' })),
                ...apcsSnap.docs.map(d => ({ id: d.id, ...d.data(), type: 'apc' }))
            ].filter(m => m.name && m.name.toLowerCase() !== 'vacant' && !m.isArchived && m.status !== 'inactive');
            
            console.log('[NotificationManager] Total members:', allMembers.length);
            console.log('[NotificationManager] Members with DOB:', allMembers.filter(m => m.dateOfBirth || m.dob).length);
            
            const celebrationNotifs = [];
            
            // Find today's birthdays
            allMembers.forEach(member => {
                const dobField = member.dateOfBirth || member.dob;
                if (dobField) {
                    const birthDate = new Date(dobField);
                    if (birthDate.getMonth() === todayMonth && birthDate.getDate() === todayDate) {
                        console.log('[NotificationManager] Found birthday:', member.name);
                        celebrationNotifs.push({
                            id: 'birthday_' + member.id + '_' + today.toDateString(),
                            source: 'celebration',
                            type: 'birthday',
                            title: '🎂 Birthday Today!',
                            message: member.name + ' celebrates their birthday today! Send them your wishes! 🎈',
                            personName: member.name,
                            personPhoto: member.profilePhoto,
                            personType: member.type,
                            createdAt: { toDate: () => today }
                        });
                    }
                }
                
                // Find today's work anniversaries
                const joiningDate = member.joiningDate;
                if (joiningDate) {
                    const joinDate = new Date(joiningDate);
                    const years = today.getFullYear() - joinDate.getFullYear();
                    if (years > 0 && joinDate.getMonth() === todayMonth && joinDate.getDate() === todayDate) {
                        console.log('[NotificationManager] Found anniversary:', member.name, years, 'years');
                        celebrationNotifs.push({
                            id: 'anniversary_' + member.id + '_' + today.toDateString(),
                            source: 'celebration',
                            type: 'anniversary',
                            title: '🎉 Work Anniversary!',
                            message: member.name + ' completes ' + years + ' year' + (years > 1 ? 's' : '') + ' at Avanti today! Congratulate them! 💐',
                            personName: member.name,
                            personPhoto: member.profilePhoto,
                            personType: member.type,
                            years: years,
                            createdAt: { toDate: () => today }
                        });
                    }
                }
            });
            
            // Also find upcoming birthdays (next 7 days) for notification bell
            allMembers.forEach(member => {
                const dobField = member.dateOfBirth || member.dob;
                if (dobField) {
                    const birthDate = new Date(dobField);
                    // Create this year's birthday
                    const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
                    
                    // If birthday has passed this year, check next year
                    if (thisYearBirthday < today) {
                        thisYearBirthday.setFullYear(today.getFullYear() + 1);
                    }
                    
                    const daysUntil = Math.ceil((thisYearBirthday - today) / (1000 * 60 * 60 * 24));
                    
                    if (daysUntil > 0 && daysUntil <= 7) {
                        celebrationNotifs.push({
                            id: 'upcoming_birthday_' + member.id + '_' + today.toDateString(),
                            source: 'celebration',
                            type: 'upcoming_birthday',
                            title: '📅 Upcoming Birthday',
                            message: member.name + "'s birthday is in " + daysUntil + ' day' + (daysUntil > 1 ? 's' : '') + '!',
                            personName: member.name,
                            personPhoto: member.profilePhoto,
                            daysUntil: daysUntil,
                            createdAt: { toDate: () => new Date(today.getTime() - daysUntil * 60000) } // Make upcoming ones appear lower
                        });
                    }
                }
            });
            
            // Also find upcoming work anniversaries (next 7 days)
            allMembers.forEach(member => {
                if (member.joiningDate) {
                    const joinDate = new Date(member.joiningDate);
                    if (joinDate.getFullYear() >= today.getFullYear()) return;
                    
                    const thisYearAnniv = new Date(today.getFullYear(), joinDate.getMonth(), joinDate.getDate());
                    if (thisYearAnniv < today) {
                        thisYearAnniv.setFullYear(today.getFullYear() + 1);
                    }
                    
                    const daysUntil = Math.ceil((thisYearAnniv - today) / (1000 * 60 * 60 * 24));
                    const years = today.getFullYear() - joinDate.getFullYear() + (thisYearAnniv.getFullYear() > today.getFullYear() ? 1 : 0);
                    
                    if (daysUntil > 0 && daysUntil <= 7) {
                        celebrationNotifs.push({
                            id: 'upcoming_anniversary_' + member.id + '_' + today.toDateString(),
                            source: 'celebration',
                            type: 'upcoming_anniversary',
                            title: '🎉 Upcoming Anniversary',
                            message: member.name + "'s " + years + " year work anniversary is in " + daysUntil + ' day' + (daysUntil > 1 ? 's' : '') + '!',
                            personName: member.name,
                            personPhoto: member.profilePhoto,
                            daysUntil: daysUntil,
                            years: years,
                            createdAt: { toDate: () => new Date(today.getTime() - daysUntil * 60000) }
                        });
                    }
                }
            });
            
            console.log('[NotificationManager] Total celebration notifications:', celebrationNotifs.length);
            
            if (celebrationNotifs.length > 0) {
                // ✅ COST FIX: Cache celebration data to avoid repeated fetches
                try {
                    const cacheKey = 'celebrationCache_' + today.toISOString().split('T')[0];
                    localStorage.setItem(cacheKey, JSON.stringify(celebrationNotifs));
                    console.log('[NotificationManager] Cached celebration data for today');
                    
                    // Clean up old cache entries
                    const yesterday = new Date(today);
                    yesterday.setDate(yesterday.getDate() - 1);
                    const oldCacheKey = 'celebrationCache_' + yesterday.toISOString().split('T')[0];
                    localStorage.removeItem(oldCacheKey);
                } catch (e) {
                    // localStorage might fail, ignore
                }
                
                this.mergeNotifications(celebrationNotifs, 'celebration');
            }
            
        } catch (e) {
            console.error('[NotificationManager] Celebration notifications error:', e);
        }
    },
    
    // Merge notifications from different sources
    mergeNotifications: function(newNotifs, source) {
        // Check if there are new notifications we haven't seen before
        const readIds = JSON.parse(localStorage.getItem('readNotifications') || '[]');
        const existingIds = this.notifications.map(n => n.id);
        
        // ✅ FIX: Also check session-based tracking to prevent duplicate sounds
        const trulyNewNotifs = newNotifs.filter(n => 
            !existingIds.includes(n.id) && 
            !readIds.includes(n.id) &&
            !this._sessionNotified[n.id]
        );
        
        // ✅ FIX: Only play sound AFTER initial load is complete (not on first app open)
        // This prevents the annoying notification sound every time you open the app
        const shouldPlaySound = this._initialLoadComplete && 
                                trulyNewNotifs.length > 0 && 
                                this.notifications.length > 0;
        
        if (shouldPlaySound) {
            this.playSound();
            
            // Show browser push notification for ticket replies only
            trulyNewNotifs.forEach(notif => {
                if ((notif.source === 'ticket' || notif.type === 'ticket_update') && Notification.permission === 'granted') {
                    try {
                        new Notification('🎫 ' + (notif.title || 'New Reply'), {
                            body: notif.message || 'You have a new message on your ticket',
                            icon: 'Icon-192.png',
                            tag: 'ticket-' + (notif.ticketId || notif.id),
                            requireInteraction: true
                        });
                    } catch (e) {
                        console.log('[NotificationManager] Browser notification error:', e);
                    }
                }
            });
        }
        
        // ✅ FIX: Mark all notifications as notified this session
        newNotifs.forEach(n => {
            this._sessionNotified[n.id] = true;
        });
        
        // Remove old notifications from same source
        this.notifications = this.notifications.filter(n => n.source !== source);
        
        // Add new notifications
        this.notifications = this.notifications.concat(newNotifs);
        
        // Sort by date (newest first)
        this.notifications.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            return dateB - dateA;
        });
        
        // Keep only latest 20
        this.notifications = this.notifications.slice(0, 20);
        
        this.updateUnreadCount();
        this.renderNotifications();
    },
    
    updateUnreadCount: function() {
        const readIds = JSON.parse(localStorage.getItem('readNotifications') || '[]');
        // ✅ FIX: Also check markAllRead timestamp
        const markAllReadTime = parseInt(localStorage.getItem('notificationMarkAllReadTime') || '0');
        
        this.unreadCount = this.notifications.filter(n => {
            // If notification ID is explicitly marked as read, it's read
            if (readIds.includes(n.id)) return false;
            
            // ✅ FIX: If notification was created BEFORE markAllRead time, consider it read
            // This prevents old notifications from showing as unread after IDs change
            if (markAllReadTime > 0) {
                const notificationTime = n.createdAt?.toDate?.() || n.createdAt;
                if (notificationTime) {
                    const notifTimestamp = notificationTime instanceof Date 
                        ? notificationTime.getTime() 
                        : new Date(notificationTime).getTime();
                    if (notifTimestamp <= markAllReadTime) return false;
                }
            }
            
            return true; // Notification is unread
        }).length;
        
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            badge.textContent = this.unreadCount;
            badge.classList.toggle('show', this.unreadCount > 0);
        }
        
        // Check if bell should auto-hide
        this.checkAutoHideBell();
    },
    
    renderNotifications: function() {
        const list = document.getElementById('notificationList');
        if (!list) return;
        
        const readIds = JSON.parse(localStorage.getItem('readNotifications') || '[]');
        // ✅ FIX: Also check markAllRead timestamp
        const markAllReadTime = parseInt(localStorage.getItem('notificationMarkAllReadTime') || '0');
        
        const permissionBanner = Notification.permission !== 'granted' ? 
            '<div class="enable-notifications-banner"><span class="text">🔔 Enable push notifications to get instant updates</span><button class="btn" onclick="NotificationManager.requestPermission()">Enable</button></div>' : '';
        
        if (this.notifications.length === 0) {
            list.innerHTML = permissionBanner + '<div class="notification-empty"><div class="icon">📭</div><p>No notifications yet</p></div>';
            return;
        }
        
        list.innerHTML = permissionBanner + this.notifications.map(n => {
            // ✅ FIX: Check both explicit readIds AND markAllRead timestamp
            let isUnread = !readIds.includes(n.id);
            
            // If notification was created before markAllRead time, it's read
            if (isUnread && markAllReadTime > 0) {
                const notificationTime = n.createdAt?.toDate?.() || n.createdAt;
                if (notificationTime) {
                    const notifTimestamp = notificationTime instanceof Date 
                        ? notificationTime.getTime() 
                        : new Date(notificationTime).getTime();
                    if (notifTimestamp <= markAllReadTime) isUnread = false;
                }
            }
            const time = n.createdAt?.toDate?.() || new Date();
            const timeAgo = this.timeAgo(time);
            const isTicket = n.source === 'ticket' || n.type === 'ticket_update';
            const isCelebration = n.source === 'celebration';
            
            // Choose icon based on type
            let icon = '📢';
            if (isTicket) icon = '🎫';
            else if (n.type === 'birthday') icon = '🎂';
            else if (n.type === 'anniversary') icon = '🎉';
            else if (n.type === 'upcoming_birthday') icon = '📅';
            else if (n.type === 'upcoming_anniversary') icon = '🎊';
            
            const ticketLabel = isTicket && n.ticketId ? '<span style="color: #F4B41A; font-size: 11px; margin-left: 6px;">#' + n.ticketId + '</span>' : '';
            
            // Priority indicator
            const priorityColors = { 'urgent': '#ef4444', 'important': '#f59e0b', 'normal': '#3b82f6' };
            let priorityStyle = n.priority && n.priority !== 'normal' ? 'border-left: 3px solid ' + (priorityColors[n.priority] || '#3b82f6') + ';' : '';
            
            // Special styling for celebrations
            let celebrationStyle = '';
            if (n.type === 'birthday') {
                celebrationStyle = 'border-left: 3px solid #ec4899; background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);';
            } else if (n.type === 'anniversary') {
                celebrationStyle = 'border-left: 3px solid #f59e0b; background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);';
            } else if (n.type === 'upcoming_birthday') {
                celebrationStyle = 'border-left: 3px solid #8b5cf6; background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);';
            } else if (n.type === 'upcoming_anniversary') {
                celebrationStyle = 'border-left: 3px solid #06b6d4; background: linear-gradient(135deg, #ecfeff 0%, #cffafe 100%);';
            }
            
            // Link button
            const linkBtn = n.link ? '<a href="' + n.link + '" target="_blank" style="display: inline-block; margin-top: 8px; background: #2a2a3a; color: #3b82f6; padding: 4px 10px; border-radius: 6px; font-size: 11px; text-decoration: none;">🔗 Open Link</a>' : '';
            
            // Person photo for celebrations
            let personPhoto = '';
            if (isCelebration && n.personPhoto) {
                const borderColor = n.type === 'birthday' || n.type === 'upcoming_birthday' ? '#ec4899' : '#f59e0b';
                personPhoto = '<img src="' + n.personPhoto + '" alt="" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; margin-right: 10px; border: 2px solid ' + borderColor + ';" />';
            } else if (isCelebration) {
                const gradientColor = n.type === 'birthday' || n.type === 'upcoming_birthday' ? '#ec4899, #f472b6' : '#f59e0b, #fbbf24';
                personPhoto = '<div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, ' + gradientColor + '); display: flex; align-items: center; justify-content: center; font-size: 20px; margin-right: 10px;">' + icon + '</div>';
            }
            
            return `<div class="notification-item ${isUnread ? 'unread' : ''}" style="${celebrationStyle || priorityStyle}" onclick="NotificationManager.expandNotification('${n.id}')">
                <div style="display: flex; align-items: flex-start;">
                    ${personPhoto}
                    <div style="flex: 1;">
                        <div class="title">${!isCelebration ? icon + ' ' : ''}${n.title || 'Notification'}${ticketLabel}</div>
                        <div class="message">${n.message || ''}</div>
                        ${linkBtn}
                        <div class="time">${timeAgo}</div>
                    </div>
                </div>
            </div>`;
        }).join('');
    },
    
    timeAgo: function(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return Math.floor(seconds / 60) + ' min ago';
        if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
        return Math.floor(seconds / 86400) + ' days ago';
    },
    
    togglePanel: function() {
        this.isOpen ? this.closePanel() : this.openPanel();
    },
    
    openPanel: function() {
        document.getElementById('notificationPanel')?.classList.add('show');
        this.isOpen = true;
    },
    
    closePanel: function() {
        document.getElementById('notificationPanel')?.classList.remove('show');
        this.isOpen = false;
    },
    
    markRead: function(id) {
        const readIds = JSON.parse(localStorage.getItem('readNotifications') || '[]');
        if (!readIds.includes(id)) {
            readIds.push(id);
            localStorage.setItem('readNotifications', JSON.stringify(readIds));
            this.updateUnreadCount();
            this.renderNotifications();
            
            // Track view in Firestore for analytics
            this.trackNotificationView(id);
        }
    },
    
    // Track notification view for analytics
    trackNotificationView: async function(notificationId) {
        if (!this.userId || typeof firebase === 'undefined') return;
        
        try {
            const notifRef = firebase.firestore().collection('app_notifications').doc(notificationId);
            
            // Increment view count and add user to viewedBy array
            await notifRef.update({
                viewCount: firebase.firestore.FieldValue.increment(1),
                viewedBy: firebase.firestore.FieldValue.arrayUnion(String(this.userId))
            });
            
            console.log('[NotificationManager] View tracked for:', notificationId);
        } catch (e) {
            // Notification might not exist or be a ticket notification
            console.log('[NotificationManager] Could not track view:', e.message);
        }
    },
    
    markAllRead: function() {
        const readIds = this.notifications.map(n => n.id);
        localStorage.setItem('readNotifications', JSON.stringify(readIds));
        
        // ✅ FIX: Also save the timestamp of when "mark all read" was clicked
        // Any notification older than this timestamp is considered read
        // This prevents the issue where notification IDs change but appear as unread
        localStorage.setItem('notificationMarkAllReadTime', String(Date.now()));
        
        this.updateUnreadCount();
        this.renderNotifications();
        
        // Auto-hide bell if all read
        this.checkAutoHideBell();
        
        console.log('[NotificationManager] Marked all notifications as read at:', new Date().toLocaleString());
    },
    
    // ✅ FIX: Bell appearance changes when all read, but NEVER hides completely
    // NOTE: This ONLY affects the notification bell styling, NOT visibility
    checkAutoHideBell: function() {
        const bell = document.getElementById('notificationBell');
        const badge = document.getElementById('notificationBadge');
        if (!bell) return;
        
        // ✅ Bell is ALWAYS visible, just styled differently when all read
        if (this.unreadCount === 0) {
            bell.classList.add('all-read');
            // Also hide the badge count when no unread
            if (badge) badge.classList.remove('show');
        } else {
            bell.classList.remove('all-read');
            // Show badge with count
            if (badge) {
                badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
                badge.classList.add('show');
            }
        }
        
        // Ensure chatbot button is ALWAYS visible (fix for disappearing chatbot bug)
        const chatbotBtn = document.getElementById('avantiBtn');
        if (chatbotBtn) {
            chatbotBtn.style.display = 'flex';
            chatbotBtn.style.opacity = '1';
            chatbotBtn.style.visibility = 'visible';
        }
    },
    
    // Expand notification to show full message
    expandNotification: function(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (!notification) return;
        
        this.markRead(id);
        
        const isTicket = notification.source === 'ticket' || notification.type === 'ticket_update';
        const time = notification.createdAt?.toDate?.() || new Date();
        const ticketId = notification.ticketId || id;
        
        let popup = document.getElementById('notificationExpansionPopup');
        if (!popup) {
            popup = document.createElement('div');
            popup.id = 'notificationExpansionPopup';
            document.body.appendChild(popup);
        }
        
        const ticketContent = isTicket ? `
            <div class="notification-expansion-body">
                <div class="notification-expansion-message">${notification.message || 'No message content'}</div>
                <div class="notification-expansion-meta">
                    <span>${this.timeAgo(time)}</span>
                </div>
                
// Reply Input
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #2a2a3a;">
                    <div style="display: flex; gap: 8px; align-items: flex-end;">
                        <textarea 
                            id="ticketReplyInput" 
                            placeholder="Type your reply..." 
                            style="flex: 1; background: #1a1a24; border: 1px solid #3a3a4a; border-radius: 12px; padding: 12px; color: #fff; font-size: 14px; resize: none; min-height: 60px;"
                            rows="2"
                        ></textarea>
                    </div>
                </div>
            </div>
            <div class="notification-expansion-actions" style="flex-direction: column; gap: 8px;">
                <button class="notification-reply-btn" onclick="NotificationManager.sendTicketReply('${ticketId}')" style="width: 100%;">
                    📤 Send Reply
                </button>
                <div style="display: flex; gap: 8px;">
                    <button class="notification-close-btn" onclick="NotificationManager.endTicketChat('${ticketId}')" style="flex: 1;">
                        ✓ End Chat
                    </button>
                    <button class="notification-close-btn" onclick="NotificationManager.closeExpansion()" style="flex: 1;">
                        Close
                    </button>
                </div>
            </div>
        ` : `
            <div class="notification-expansion-body">
                <div class="notification-expansion-message">${notification.message || 'No message content'}</div>
                ${notification.link ? '<a href="' + notification.link + '" target="_blank" style="display: inline-block; background: #2a2a3a; color: #3b82f6; padding: 8px 16px; border-radius: 8px; text-decoration: none; margin-top: 12px;">🔗 Open Link</a>' : ''}
                <div class="notification-expansion-meta">
                    ${notification.source ? '<span>Source: ' + notification.source + '</span> • ' : ''}
                    <span>${this.timeAgo(time)}</span>
                </div>
            </div>
            <div class="notification-expansion-actions">
                <button class="notification-close-btn" onclick="NotificationManager.closeExpansion()" style="flex: 1;">
                    Close
                </button>
            </div>
        `;
        
        popup.innerHTML = `
            <div class="notification-expansion-overlay" onclick="NotificationManager.closeExpansion()">
                <div class="notification-expansion-popup" onclick="event.stopPropagation()">
                    <div class="notification-expansion-header">
                        <h3>${isTicket ? '🎫' : '📢'} ${notification.title || 'Notification'}${notification.ticketId ? ' <span style="color:#F4B41A;font-size:13px;">#' + notification.ticketId + '</span>' : ''}</h3>
                        <button class="notification-expansion-close" onclick="NotificationManager.closeExpansion()">×</button>
                    </div>
                    ${ticketContent}
                </div>
            </div>
        `;
    },
    
    // Close expansion popup
    closeExpansion: function() {
        const popup = document.getElementById('notificationExpansionPopup');
        if (popup) popup.innerHTML = '';
    },
    
    // Send reply to ticket directly from notification popup
    sendTicketReply: async function(ticketId) {
        const replyInput = document.getElementById('ticketReplyInput');
        const replyText = replyInput?.value?.trim();
        
        if (!replyText) {
            alert('Please enter a reply message');
            return;
        }
        
        try {
            // Find the ticket doc
            const ticketSnap = await firebase.firestore().collection('support_tickets')
                .where('ticketId', '==', ticketId)
                .limit(1)
                .get();
            
            if (ticketSnap.empty) {
                alert('Ticket not found');
                return;
            }
            
            const ticketDoc = ticketSnap.docs[0];
            const ticketData = ticketDoc.data();
            
            // Add user reply
            const newReply = {
                message: replyText,
                sender: 'user',
                senderName: ticketData.userName || 'User',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await ticketDoc.ref.update({
                replies: firebase.firestore.FieldValue.arrayUnion(newReply),
                status: 'open', // Reopen if was closed
                lastUserReply: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            alert('✓ Reply sent successfully!');
            this.closeExpansion();
            
        } catch (e) {
            console.error('Error sending reply:', e);
            alert('Failed to send reply. Please try again.');
        }
    },
    
    // Reply to a ticket (open chatbot)
    replyToTicket: function(ticketId) {
        this.closeExpansion();
        // Open the chatbot and navigate to the ticket
        if (typeof AvantiWidget !== 'undefined') {
            AvantiWidget.open();
            setTimeout(() => {
                if (AvantiWidget.loadTicket) AvantiWidget.loadTicket(ticketId);
            }, 300);
        } else {
            alert('Please open the Help/Support chat to reply to this ticket.');
        }
    },
    
    // End ticket chat (with option to reopen)
    endTicketChat: async function(ticketId) {
        const action = confirm('End this chat?\n\nClick OK to close the ticket.\nYou can reopen it later if needed.');
        if (!action) return;
        
        try {
            // Find the ticket doc
            const ticketSnap = await firebase.firestore().collection('support_tickets')
                .where('ticketId', '==', ticketId)
                .limit(1)
                .get();
            
            if (!ticketSnap.empty) {
                await ticketSnap.docs[0].ref.update({
                    status: 'closed',
                    closedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    closedBy: 'user',
                    canReopen: true
                });
                alert('✓ Chat ended. You can reopen this ticket anytime by sending a new reply.');
            }
            this.closeExpansion();
        } catch (e) {
            console.error('Error closing ticket:', e);
            alert('Could not close the chat. Please try again.');
        }
    }
};

// Initialize when Firebase is ready - ✅ PERFORMANCE: Use requestIdleCallback
// This ensures the main UI is interactive before loading notifications
if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => NotificationManager.init(), { timeout: 3000 });
} else {
    setTimeout(() => NotificationManager.init(), 2000);
}
// (script boundary removed)

// PWA Sync Handler - Handles data sync when back online
// Listen for sync events from PWA Manager
window.addEventListener('syncAttendance', async (event) => {
  const data = event.detail;
  console.log('[Sync] Syncing attendance:', data);
  
  try {
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      const docId = data.docId || `${data.school}_${data.grade}_${data.studentId}_${data.date}`;
      await firebase.firestore().collection('studentAttendance').doc(docId).set({
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
      console.log('[Sync] ✅ Attendance synced:', docId);
    }
  } catch (error) {
    console.error('[Sync] ❌ Failed to sync attendance:', error);
  }
});

// Listen for curriculum sync
window.addEventListener('syncCurriculum', async (event) => {
  const data = event.detail;
  console.log('[Sync] Syncing curriculum:', data);
  
  try {
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      await firebase.firestore().collection('curriculum_progress').add({
        ...data,
        syncedAt: new Date().toISOString(),
        wasOffline: true
      });
      console.log('[Sync] ✅ Curriculum synced');
    }
  } catch (error) {
    console.error('[Sync] ❌ Failed to sync curriculum:', error);
  }
});

// Listen for feedback sync
window.addEventListener('syncFeedback', async (event) => {
  const data = event.detail;
  console.log('[Sync] Syncing feedback:', data);
  
  try {
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      await firebase.firestore().collection('student_feedback').add({
        ...data,
        syncedAt: new Date().toISOString(),
        wasOffline: true
      });
      console.log('[Sync] ✅ Feedback synced');
    }
  } catch (error) {
    console.error('[Sync] ❌ Failed to sync feedback:', error);
  }
});

let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // Show install button
  const installBtn = document.getElementById('pwa-install-btn');
  if (installBtn) installBtn.style.display = 'flex';
  
  console.log('[PWA] Install prompt ready');
});

// Install function
window.installPWA = async function() {
  if (!deferredPrompt) {
    alert('App is already installed or not available for installation');
    return;
  }
  
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log('[PWA] Install outcome:', outcome);
  deferredPrompt = null;
  
  const installBtn = document.getElementById('pwa-install-btn');
  if (installBtn) installBtn.style.display = 'none';
};

window.addEventListener('appinstalled', () => {
  console.log('[PWA] App installed!');
  deferredPrompt = null;
});
