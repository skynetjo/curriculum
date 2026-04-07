// ✅ CURRICULUM TRACKER v5.5.5 - CHUNK 2: Admin + Attendance Features
// Loaded in parallel with app.js, executes after app.js
// Contains: AdminView, TeacherManagement, StudentManagement, AdminCurriculum,
//           AdminAnalytics, StudentAttendanceView, TeacherAttendanceView
// Size: ~321KB | Lines: 7483

function AdminView({
  currentUser,
  handleLogout,
  teachers,
  students,
  curriculum,
  chapterProgress,
  studentAttendance,
  teacherAttendance,
  schoolInfo,
  setSchoolInfo,
  addChapter,
  updateChapter,
  deleteChapter,
  leaveAdjustments,
  setLeaveAdjustments,
  managers,
  isSuperAdmin,
  accessibleSchools,
  academicYearSettings,
  floatingCelebration,
  setFloatingCelebration
}) {
  const [activeTab, setActiveTab] = useState(isSuperAdmin ? 'managers' : 'analytics');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarHovering, setSidebarHovering] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });
  const isDirector = currentUser?.role === 'director' || currentUser?.role === 'assoc_director' || currentUser?.role === 'training';
  const hasFullDataAccess = isSuperAdmin || isDirector;
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
  const schoolMatches = (itemSchool, allowedSchools) => {
    if (!itemSchool || !allowedSchools || allowedSchools.length === 0) return false;
    const itemSchoolLower = (itemSchool || '').toString().toLowerCase().trim();
    return allowedSchools.some(s => (s || '').toString().toLowerCase().trim() === itemSchoolLower);
  };
  const filteredTeachers = hasFullDataAccess ? teachers.filter(t => !t.isArchived) : teachers.filter(t => schoolMatches(t.school, accessibleSchools) && !t.isArchived);
  const filteredStudents = hasFullDataAccess ? students : students.filter(s => schoolMatches(s.school, accessibleSchools));
  const filteredStudentAttendance = hasFullDataAccess ? studentAttendance : studentAttendance.filter(a => schoolMatches(a.school, accessibleSchools));
  const filteredTeacherAttendance = hasFullDataAccess ? teacherAttendance : teacherAttendance.filter(a => schoolMatches(a.school, accessibleSchools));
  const filteredSchoolInfo = hasFullDataAccess ? schoolInfo : schoolInfo.filter(s => schoolMatches(s.school, accessibleSchools));
  console.log('📊 AdminView Data:', {
    hasFullDataAccess,
    accessibleSchools,
    teachers: teachers.length,
    filteredTeachers: filteredTeachers.length,
    students: students.length,
    filteredStudents: filteredStudents.length,
    studentAttendance: studentAttendance.length,
    filteredStudentAttendance: filteredStudentAttendance.length,
    schoolInfo: schoolInfo.length,
    filteredSchoolInfo: filteredSchoolInfo.length,
    schoolInfoSchools: schoolInfo.map(s => s.school)
  });
  const availableSchools = hasFullDataAccess ? SCHOOLS : accessibleSchools;
  const adminTabs = [...(isSuperAdmin ? [{
    id: 'managers',
    label: 'Managers',
    icon: React.createElement("i", {
      className: "fa-solid fa-user-tie"
    })
  }, {
    id: 'academicyear',
    label: 'Academic Year',
    icon: React.createElement("i", {
      className: "fa-solid fa-calendar"
    })
  }, {
    id: '2fa-management',
    label: '2FA Management',
    icon: React.createElement("i", {
      className: "fa-solid fa-shield-halved"
    })
  }, {
    id: 'settings',
    label: 'Settings',
    icon: React.createElement("i", {
      className: "fa-solid fa-gear"
    })
  }] : []), {
    id: 'teachers',
    label: 'Teachers',
    icon: React.createElement("i", {
      className: "fa-solid fa-users"
    })
  }, {
    id: 'teacherhistory',
    label: 'Teacher History',
    icon: React.createElement("i", {
      className: "fa-solid fa-chart-line"
    })
  }, {
    id: 'students',
    label: 'Students',
    icon: React.createElement("i", {
      className: "fa-solid fa-user-graduate"
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
    id: 'observations',
    label: 'Class Observations',
    icon: React.createElement("i", {
      className: "fa-solid fa-eye"
    })
  }, ...(isSuperAdmin ? [{
    id: 'curriculum',
    label: 'Curriculum',
    icon: React.createElement("i", {
      className: "fa-solid fa-book"
    })
  }] : []), {
    id: 'analytics',
    label: 'Analytics',
    icon: React.createElement("i", {
      className: "fa-solid fa-chart-pie"
    })
  }, ...(isSuperAdmin ? [{
    id: 'chapter-details',
    label: 'Chapter Details',
    icon: React.createElement("i", {
      className: "fa-solid fa-list-check"
    })
  }] : []), {
    id: 'attendance',
    label: 'Attendance Analytics',
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
    id: 'schoolinfo',
    label: 'School Info',
    icon: React.createElement("i", {
      className: "fa-solid fa-school"
    })
  }, {
    id: 'timetable',
    label: '📅 Timetable',
    icon: React.createElement("i", {
      className: "fa-solid fa-calendar"
    })
  }, {
    id: 'studentprofiles',
    label: 'Student Profiles',
    icon: React.createElement("i", {
      className: "fa-solid fa-id-card"
    })
  }, {
    id: 'examstats',
    label: 'Exam Statistics',
    icon: React.createElement("i", {
      className: "fa-solid fa-graduation-cap"
    })
  }, {
    id: 'examtracker',
    label: 'Exam Tracker',
    icon: React.createElement("i", {
      className: "fa-solid fa-clipboard-list"
    })
  }, {
    id: 'studentfeedback',
    label: 'Student Feedback',
    icon: React.createElement("i", {
      className: "fa-solid fa-message"
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
  const handleTabClick = tabId => {
    setActiveTab(tabId);
    if (window.innerWidth < 768) {
      setIsMobileSidebarOpen(false);
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
  }, React.createElement(InstallPrompt, null), isMobile && React.createElement("header", {
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
  }, isSuperAdmin ? '👑' : '🛡️'), React.createElement("span", null, isSuperAdmin ? 'Admin Panel' : 'Manager')), React.createElement("div", {
    style: {
      width: '44px'
    }
  })), floatingCelebration && React.createElement("div", {
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
  }, "+", floatingCelebration.total - 1, " more ", floatingCelebration.type === 'birthday' ? 'birthday' : 'anniversary', floatingCelebration.total > 2 ? 's' : '', " today")))), !isMobile && sidebarCollapsed && React.createElement("div", {
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
  }, isSuperAdmin ? '👑' : '🛡️'), React.createElement("div", {
    className: "sidebar-logo-text"
  }, React.createElement("div", {
    style: {
      fontWeight: 700
    }
  }, isSuperAdmin ? 'Super Admin' : ROLE_LABELS[currentUser.role] || 'Admin'), React.createElement("div", {
    style: {
      fontSize: '0.7rem',
      opacity: 0.7
    }
  }, currentUser.name))), React.createElement("button", {
    onClick: () => setSidebarCollapsed(!sidebarCollapsed),
    className: "sidebar-toggle"
  }, React.createElement("i", {
    className: `fa-solid ${sidebarCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`
  }))), React.createElement("div", {
    className: "sidebar-nav"
  }, adminTabs.map(tab => React.createElement("div", {
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
  })), !sidebarCollapsed && !isSuperAdmin && React.createElement("div", {
    className: "text-gray-400 text-xs mb-2 px-1 mt-2"
  }, React.createElement("i", {
    className: "fa-solid fa-school mr-1"
  }), "Access: ", availableSchools.length, " Schools"), React.createElement("button", {
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
  }, React.createElement("div", {
    className: "px-4 py-6"
  }, React.createElement(ProfileCompletionBanner, {
    currentUser: currentUser,
    onNavigateToProfile: () => alert('Please update your profile from Settings or contact Super Admin')
  }), activeTab === 'managers' && isSuperAdmin && React.createElement(ManagerManagement, {
    managers: managers,
    currentUser: currentUser,
    isSuperAdmin: isSuperAdmin
  }), activeTab === 'academicyear' && isSuperAdmin && React.createElement(AcademicYearManagement, {
    teachers: teachers,
    students: students,
    curriculum: curriculum,
    chapterProgress: chapterProgress,
    studentAttendance: studentAttendance,
    teacherAttendance: teacherAttendance,
    academicYearSettings: academicYearSettings
  }), activeTab === '2fa-management' && isSuperAdmin && React.createElement(Admin2FAManagement, {
    teachers: filteredTeachers,
    managers: managers
  }), activeTab === 'teachers' && React.createElement(TeacherManagement, {
    teachers: filteredTeachers,
    teacherAttendance: filteredTeacherAttendance,
    leaveAdjustments: leaveAdjustments,
    setLeaveAdjustments: setLeaveAdjustments,
    isSuperAdmin: isSuperAdmin,
    isDirector: isDirector
  }), activeTab === 'teacherhistory' && React.createElement(TeacherHistoryView, {
    teachers: filteredTeachers
  }), activeTab === 'students' && React.createElement(StudentManagement, {
    students: filteredStudents,
    isSuperAdmin: isSuperAdmin,
    isDirector: isDirector,
    accessibleSchools: availableSchools
  }), activeTab === 'directory' && React.createElement(OrgChartDirectory, {
    teachers: teachers,
    currentUser: currentUser,
    allEmployeesAccess: true
  }), activeTab === 'socialwall' && React.createElement(SocialWall, {
    teachers: teachers,
    currentUser: currentUser,
    allMembers: true
  }), activeTab === 'roadmap' && React.createElement(RoadmapPage, {
    currentUser: currentUser
  }), activeTab === 'timesheet' && React.createElement(TimesheetPage, {
    currentUser: currentUser,
    teachers: filteredTeachers,
    curriculum: curriculum,
    isAdmin: true,
    isSuperAdmin: isSuperAdmin,
    isDirector: isDirector,
    accessibleSchools: availableSchools,
    managers: managers
  }), activeTab === 'observations' && React.createElement(AdminClassroomObservations, {
    teachers: filteredTeachers,
    currentUser: currentUser
  }), activeTab === 'curriculum' && React.createElement(AdminCurriculum, {
    curriculum: curriculum,
    addChapter: addChapter,
    updateChapter: updateChapter,
    deleteChapter: deleteChapter
  }), activeTab === 'analytics' && React.createElement(AdminAnalytics, {
    teachers: filteredTeachers,
    curriculum: curriculum,
    chapterProgress: chapterProgress,
    accessibleSchools: availableSchools,
    isSuperAdmin: isSuperAdmin,
    isDirector: isDirector
  }), activeTab === 'chapter-details' && React.createElement(AdminChapterDetails, {
    curriculum: curriculum,
    chapterProgress: chapterProgress,
    teachers: filteredTeachers
  }), activeTab === 'attendance' && React.createElement(AdminAttendanceAnalytics, {
    students: filteredStudents,
    teachers: filteredTeachers,
    studentAttendance: filteredStudentAttendance,
    teacherAttendance: filteredTeacherAttendance,
    accessibleSchools: availableSchools,
    isSuperAdmin: isSuperAdmin,
    isDirector: isDirector
  }), activeTab === 'schoolinfo' && React.createElement(AdminSchoolInfo, {
    schoolInfo: filteredSchoolInfo,
    setSchoolInfo: setSchoolInfo,
    currentUser: currentUser
  }), activeTab === 'assets' && React.createElement(AdminAssetManagement, {
    accessibleSchools: availableSchools,
    isSuperAdmin: isSuperAdmin,
    isDirector: isDirector
  }), activeTab === 'birthdays' && React.createElement(AdminBirthdays, {
    teachers: filteredTeachers
  }), activeTab === 'studentprofiles' && React.createElement(AdminStudentProfiles, {
    accessibleSchools: availableSchools,
    isSuperAdmin: isSuperAdmin,
    isDirector: isDirector
  }), activeTab === 'settings' && isSuperAdmin && React.createElement(AdminSettings, null), activeTab === 'examstats' && React.createElement(AdminExamStats, {
    accessibleSchools: availableSchools,
    isSuperAdmin: isSuperAdmin,
    isDirector: isDirector
  }), activeTab === 'examtracker' && React.createElement(ExamTrackerPage, {
    currentUser: currentUser,
    isAdmin: true,
    accessibleSchools: availableSchools
  }), activeTab === 'timetable' && React.createElement(TimetablePage, {
    currentUser: currentUser,
    mySchool: currentUser?.school
  }), activeTab === 'studentfeedback' && React.createElement(StudentFeedbackView, {
    accessibleSchools: availableSchools,
    isSuperAdmin: isSuperAdmin,
    isDirector: isDirector
  }))), React.createElement("footer", {
    className: "bg-gray-800 text-white text-center py-4"
  }, React.createElement("p", null, "Made by Anand with \u2764\uFE0F")));
}
function ExamTrackerPage(props) {
  var [ready, setReady] = React.useState(typeof window.ExamConductTracker === 'function');
  var [error, setError] = React.useState(false);
  React.useEffect(function() {
    if (typeof window.ExamConductTracker === 'function') { setReady(true); return; }
    var attempts = 0;
    var interval = setInterval(function() {
      attempts++;
      if (typeof window.ExamConductTracker === 'function') {
        setReady(true); clearInterval(interval);
      } else if (attempts > 80) {
        setError(true); clearInterval(interval);
      }
    }, 100);
    return function() { clearInterval(interval); };
  }, []);
  if (error) return React.createElement('div', { style:{ padding:'60px', textAlign:'center' } },
    React.createElement('div', { style:{ fontSize:'40px', marginBottom:'12px' } }, '⚠️'),
    React.createElement('p', { style:{ color:'#EF4444', fontWeight:'600', fontSize:'16px', marginBottom:'8px' } }, 'Exam Tracker failed to load'),
    React.createElement('p', { style:{ color:'#9CA3AF', fontSize:'13px' } }, 'Please make sure exam-tracker.js is in your Vercel project root and refresh the page.')
  );
  if (!ready) return React.createElement('div', { style:{ padding:'60px', textAlign:'center', color:'#9CA3AF' } },
    React.createElement('div', { style:{ fontSize:'32px', marginBottom:'10px' } }, '⏳'),
    React.createElement('p', null, 'Loading Exam Tracker...')
  );
  return React.createElement(window.ExamConductTracker, props);
}
function TeacherOverview({
  currentUser,
  curriculum,
  chapterProgress,
  teachers,
  teacherAttendance,
  studentAttendance,
  onNavigateToProfile,
  precomputedRankings
}) {
  const mySchool = currentUser.school;
  const mySubject = currentUser.subject;
  const schoolRankings = useMemo(() => {
    const rankings = SCHOOLS.map(school => {
      let total = 0,
        completed = 0;
      SUBJECTS.forEach(subject => {
        ['11', '12'].forEach(grade => {
          const docId = `${school}_${subject}_${grade}`;
          const chapters = curriculum[docId]?.chapters || [];
          chapters.forEach(ch => {
            total++;
            const progressId = `${school}_${ch.id}`;
            const prog = chapterProgress[progressId] || {};
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
    return rankings;
  }, [curriculum, chapterProgress]);
  const subjectRankings = useMemo(() => {
    const rankings = SUBJECTS.map(subject => {
      let total = 0,
        completed = 0;
      ['11', '12'].forEach(grade => {
        const docId = `${mySchool}_${subject}_${grade}`;
        const chapters = curriculum[docId]?.chapters || [];
        chapters.forEach(ch => {
          total++;
          const progressId = `${mySchool}_${ch.id}`;
          const prog = chapterProgress[progressId] || {};
          if (prog.completed === 'Yes') {
            completed++;
          }
        });
      });
      return {
        subject,
        total,
        completed,
        percentage: total ? Math.round(completed / total * 100) : 0
      };
    }).filter(rank => rank.total > 0);
    rankings.sort((a, b) => b.percentage - a.percentage);
    return rankings;
  }, [curriculum, chapterProgress, mySchool]);
  const mySchoolRank = schoolRankings.findIndex(r => r.school === mySchool) + 1;
  const laggingSubject = subjectRankings[subjectRankings.length - 1];
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [lastSyncTime, setLastSyncTime] = React.useState(null);
  React.useEffect(() => {
    const updateSyncTime = () => {
      if (window.SmartSyncManager) {
        const status = window.SmartSyncManager.getStatus();
        const times = status.lastSyncTimes;
        const latestSync = Math.max(...Object.values(times).filter(t => t > 0), 0);
        if (latestSync > 0) {
          setLastSyncTime(new Date(latestSync));
        }
      }
    };
    updateSyncTime();
    const interval = setInterval(updateSyncTime, 30000);
    return () => clearInterval(interval);
  }, []);
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (window._forceFullRefresh) {
        await window._forceFullRefresh();
      }
      setLastSyncTime(new Date());
    } catch (e) {
      console.error('Refresh failed:', e);
    }
    setTimeout(() => setIsRefreshing(false), 1000);
  };
  const formatLastSync = date => {
    if (!date) return 'Never';
    const mins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("div", {
    className: "flex justify-between items-center flex-wrap gap-2"
  }, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "Dashboard Overview"), React.createElement("div", {
    className: "flex items-center gap-2"
  }, React.createElement("span", {
    className: "text-xs text-gray-500 hidden sm:inline"
  }, lastSyncTime ? `Synced ${formatLastSync(lastSyncTime)}` : ''), React.createElement("button", {
    onClick: handleManualRefresh,
    disabled: isRefreshing,
    className: `px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${isRefreshing ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:shadow-lg active:scale-95'}`,
    title: "Refresh all data"
  }, React.createElement("i", {
    className: `fa-solid fa-sync ${isRefreshing ? 'animate-spin' : ''}`
  }), React.createElement("span", {
    className: "hidden sm:inline"
  }, isRefreshing ? 'Syncing...' : 'Refresh')))), React.createElement(ProfileCompletionCard, {
    currentUser: currentUser,
    onNavigateToProfile: onNavigateToProfile
  }), React.createElement("div", {
    className: "grid md:grid-cols-4 gap-4"
  }, React.createElement("div", {
    className: "stat-card avanti-gradient text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Your School Rank"), React.createElement("div", {
    className: "text-5xl font-bold"
  }, "#", mySchoolRank), React.createElement("div", {
    className: "text-sm mt-2"
  }, "Out of ", schoolRankings.length || SCHOOLS.length, " schools")), React.createElement("div", {
    className: "stat-card bg-gradient-to-br from-green-500 to-emerald-600 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Best Performing School"), React.createElement("div", {
    className: "text-2xl font-bold mt-2"
  }, schoolRankings[0]?.school), React.createElement("div", {
    className: "text-sm mt-2"
  }, schoolRankings[0]?.percentage, "% completed")), React.createElement("div", {
    className: "stat-card bg-gradient-to-br from-orange-500 to-red-600 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Lagging Subject (Your School)"), React.createElement("div", {
    className: "text-2xl font-bold mt-2"
  }, laggingSubject?.subject), React.createElement("div", {
    className: "text-sm mt-2"
  }, laggingSubject?.percentage, "% completed"))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-2xl font-bold mb-4"
  }, "\uD83C\uDFC6 School Rankings"), React.createElement("div", {
    className: "space-y-3"
  }, schoolRankings.map((rank, index) => React.createElement("div", {
    key: rank.school,
    className: `ranking-card ${index === 0 ? 'ranking-1' : index === 1 ? 'ranking-2' : index === 2 ? 'ranking-3' : ''} ${rank.school === mySchool ? 'bg-yellow-50' : ''}`
  }, React.createElement("div", {
    className: "flex justify-between items-center"
  }, React.createElement("div", {
    className: "flex items-center gap-4"
  }, React.createElement("div", {
    className: "text-2xl font-bold text-gray-400"
  }, "#", index + 1), React.createElement("div", null, React.createElement("div", {
    className: "font-bold text-lg"
  }, rank.school, " ", rank.school === mySchool && '⭐'), React.createElement("div", {
    className: "text-sm text-gray-600"
  }, rank.completed, " / ", rank.total, " chapters completed"))), React.createElement("div", {
    className: "text-3xl font-bold",
    style: {
      color: 'var(--avanti-red)'
    }
  }, rank.percentage, "%")))))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-2xl font-bold mb-4"
  }, "\uD83D\uDCDA Subject Performance in ", mySchool), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4"
  }, subjectRankings.map(rank => React.createElement("div", {
    key: rank.subject,
    className: "border-2 rounded-xl p-4"
  }, React.createElement("div", {
    className: "flex justify-between items-center mb-2"
  }, React.createElement("div", {
    className: "font-bold text-lg"
  }, rank.subject), React.createElement("div", {
    className: "text-2xl font-bold",
    style: {
      color: 'var(--avanti-red)'
    }
  }, rank.percentage, "%")), React.createElement("div", {
    className: "h-2 bg-gray-200 rounded-full"
  }, React.createElement("div", {
    className: "h-2 avanti-gradient rounded-full",
    style: {
      width: `${rank.percentage}%`
    }
  })), React.createElement("div", {
    className: "text-sm text-gray-600 mt-2"
  }, rank.completed, " / ", rank.total, " chapters"))))), React.createElement("div", {
    className: "stat-card bg-gradient-to-br from-purple-500 to-pink-600 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "My Attendance (This Month)"), React.createElement("div", {
    className: "text-2xl font-bold mt-2"
  }, teacherAttendance.filter(a => a.teacherId === currentUser.afid && getMonthYear(a.date) === getMonthYear(getTodayDate())).length, " days"), React.createElement("div", {
    className: "text-sm mt-2"
  }, "Marked this month"), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-2xl font-bold mb-4"
  }, "\uD83D\uDCCA Quick Attendance Overview"), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4"
  }, React.createElement("div", {
    className: "border-2 rounded-xl p-4"
  }, React.createElement("h4", {
    className: "font-bold mb-2"
  }, "Today's Student Attendance"), React.createElement("p", {
    className: "text-sm text-gray-600"
  }, "Present: ", React.createElement("strong", {
    className: "text-green-600"
  }, studentAttendance.filter(a => a.date === getTodayDate() && a.school === currentUser.school && a.status === 'Present').length)), React.createElement("p", {
    className: "text-sm text-gray-600"
  }, "Absent: ", React.createElement("strong", {
    className: "text-red-600"
  }, studentAttendance.filter(a => a.date === getTodayDate() && a.school === currentUser.school && a.status === 'Absent').length))), React.createElement("div", {
    className: "border-2 rounded-xl p-4"
  }, React.createElement("h4", {
    className: "font-bold mb-2"
  }, "My Attendance Status"), teacherAttendance.find(a => a.teacherId === currentUser.afid && a.date === getTodayDate()) ? React.createElement("div", {
    className: "text-sm"
  }, React.createElement("p", {
    className: "text-green-600 font-bold"
  }, "\u2713 Marked for today"), React.createElement("p", {
    className: "text-gray-600"
  }, "Status: ", teacherAttendance.find(a => a.teacherId === currentUser.afid && a.date === getTodayDate()).status)) : React.createElement("p", {
    className: "text-orange-600 font-bold"
  }, "\u26A0\uFE0F Not marked yet")))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-2xl font-bold mb-4"
  }, "\u23F0 Today's Punch-In Times - ", mySchool), React.createElement("div", {
    className: "space-y-2 max-h-96 overflow-y-auto"
  }, teachers.filter(t => t.school === mySchool && !t.isArchived).map(teacher => {
    const todayAttendance = teacherAttendance.find(a => a.teacherId === teacher.afid && a.date === getTodayDate());
    return React.createElement("div", {
      key: teacher.afid,
      className: `p-4 rounded-xl border-2 ${teacher.afid === currentUser.afid ? 'bg-yellow-50 border-yellow-400' : 'bg-gray-50 border-gray-200'}`
    }, React.createElement("div", {
      className: "flex justify-between items-center"
    }, React.createElement("div", {
      className: "flex-1"
    }, React.createElement("div", {
      className: "font-bold text-lg"
    }, teacher.name, " ", teacher.afid === currentUser.afid && '(You)'), React.createElement("div", {
      className: "text-sm text-gray-600"
    }, teacher.subject)), React.createElement("div", {
      className: "text-right"
    }, todayAttendance ? React.createElement(React.Fragment, null, React.createElement("div", {
      className: `text-2xl font-bold ${todayAttendance.status === 'Present' ? 'text-green-600' : 'text-orange-600'}`
    }, "\u23F0 ", todayAttendance.punchInTime || '--:--'), React.createElement("div", {
      className: `text-xs font-semibold ${todayAttendance.status === 'Present' ? 'text-green-600' : 'text-orange-600'}`
    }, todayAttendance.status)) : React.createElement("div", {
      className: "text-gray-400 font-semibold"
    }, "Not Marked"))));
  })))));
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
function TeacherAnalytics({
  currentUser,
  curriculum,
  chapterProgress
}) {
  const chart1Ref = useRef(null);
  const chart2Ref = useRef(null);
  const chart3Ref = useRef(null);
  const chart4Ref = useRef(null);
  const chart5Ref = useRef(null);
  const chartInstances = useRef({});
  const mySchool = currentUser.school;
  const mySubject = currentUser.subject;
  
  // EMRS Bhopal batch support for Physics/Chemistry teachers
  const needsBatchSelector = mySchool === 'EMRS Bhopal' && (mySubject === 'Physics' || mySubject === 'Chemistry');
  const [selectedBatch, setSelectedBatch] = useState('JEE');
  
  const myData = useMemo(() => {
    const data = {
      11: {
        total: 0,
        completed: 0,
        testsCompleted: 0,
        testsPending: 0
      },
      12: {
        total: 0,
        completed: 0,
        testsCompleted: 0,
        testsPending: 0
      }
    };
    let totalDays = 0;
    let chaptersWithDates = 0;
    ['11', '12'].forEach(grade => {
      const docId = needsBatchSelector && selectedBatch === 'NEET' 
        ? `${mySchool}_NEET_${mySubject}_${grade}` 
        : `${mySchool}_${mySubject}_${grade}`;
      const chapters = curriculum[docId]?.chapters || [];
      chapters.forEach(ch => {
        data[grade].total++;
        const progressId = needsBatchSelector && selectedBatch === 'NEET' 
          ? `${mySchool}_NEET_${ch.id}` 
          : `${mySchool}_${ch.id}`;
        const prog = chapterProgress[progressId] || {};
        if (prog.completed === 'Yes') {
          data[grade].completed++;
          if (prog.testConducted === 'Yes') {
            data[grade].testsCompleted++;
          } else {
            data[grade].testsPending++;
          }
          if (prog.completionDate && ch.targetDate) {
            const target = new Date(ch.targetDate);
            const completion = new Date(prog.completionDate);
            const days = Math.abs(Math.ceil((completion - target) / (1000 * 60 * 60 * 24)));
            totalDays += days;
            chaptersWithDates++;
          }
        }
      });
    });
    const avgDays = chaptersWithDates ? Math.round(totalDays / chaptersWithDates) : 0;
    return {
      ...data,
      avgDays
    };
  }, [curriculum, chapterProgress, mySchool, mySubject, needsBatchSelector, selectedBatch]);
  const allSchoolsData = useMemo(() => {
    const data = {};
    SCHOOLS.forEach(school => {
      data[school] = {
        11: {
          total: 0,
          completed: 0,
          testsCompleted: 0
        },
        12: {
          total: 0,
          completed: 0,
          testsCompleted: 0
        }
      };
      ['11', '12'].forEach(grade => {
        const docId = `${school}_${mySubject}_${grade}`;
        const chapters = curriculum[docId]?.chapters || [];
        chapters.forEach(ch => {
          data[school][grade].total++;
          const progressId = `${school}_${ch.id}`;
          const prog = chapterProgress[progressId] || {};
          if (prog.completed === 'Yes') {
            data[school][grade].completed++;
            if (prog.testConducted === 'Yes') {
              data[school][grade].testsCompleted++;
            }
          }
        });
      });
    });
    return data;
  }, [curriculum, chapterProgress, mySubject]);
  useEffect(() => {
    Object.values(chartInstances.current).forEach(c => c && c.destroy());
    chartInstances.current = {};
    if (chart1Ref.current) {
      const ctx = chart1Ref.current.getContext('2d');
      chartInstances.current.chart1 = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Class 11', 'Class 12'],
          datasets: [{
            label: 'Completed',
            data: [myData[11].completed, myData[12].completed],
            backgroundColor: '#10B981'
          }, {
            label: 'Pending',
            data: [myData[11].total - myData[11].completed, myData[12].total - myData[12].completed],
            backgroundColor: '#F59E0B'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'My Chapter Progress',
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
              stacked: true
            },
            y: {
              stacked: true,
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
            label: 'Tests Completed',
            data: [myData[11].testsCompleted, myData[12].testsCompleted],
            backgroundColor: '#3B82F6'
          }, {
            label: 'Tests Pending',
            data: [myData[11].testsPending, myData[12].testsPending],
            backgroundColor: '#EF4444'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'My Tests Status',
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
      chartInstances.current.chart3 = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: SCHOOLS,
          datasets: [{
            label: 'Chapters Completed',
            data: SCHOOLS.map(s => allSchoolsData[s][11].completed),
            backgroundColor: SCHOOLS.map(s => s === mySchool ? '#C8342E' : '#10B981'),
            borderWidth: SCHOOLS.map(s => s === mySchool ? 3 : 0),
            borderColor: '#000'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: `Class 11 ${mySubject} - School Comparison`,
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
              beginAtZero: true
            }
          }
        }
      });
    }
    if (chart4Ref.current) {
      const ctx = chart4Ref.current.getContext('2d');
      chartInstances.current.chart4 = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: SCHOOLS,
          datasets: [{
            label: 'Chapters Completed',
            data: SCHOOLS.map(s => allSchoolsData[s][12].completed),
            backgroundColor: SCHOOLS.map(s => s === mySchool ? '#C8342E' : '#10B981'),
            borderWidth: SCHOOLS.map(s => s === mySchool ? 3 : 0),
            borderColor: '#000'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: `Class 12 ${mySubject} - School Comparison`,
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
              beginAtZero: true
            }
          }
        }
      });
    }
    if (chart5Ref.current) {
      const ctx = chart5Ref.current.getContext('2d');
      chartInstances.current.chart5 = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: SCHOOLS,
          datasets: [{
            label: 'Class 11 Tests',
            data: SCHOOLS.map(s => allSchoolsData[s][11].testsCompleted),
            backgroundColor: '#3B82F6'
          }, {
            label: 'Class 12 Tests',
            data: SCHOOLS.map(s => allSchoolsData[s][12].testsCompleted),
            backgroundColor: '#8B5CF6'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: `${mySubject} Tests Completed - School Comparison`,
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
      Object.values(chartInstances.current).forEach(c => c && c.destroy());
    };
  }, [myData, allSchoolsData, mySchool, mySubject]);
  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    const summaryData = [{
      Grade: 'Class 11',
      'Total Chapters': myData[11].total,
      'Completed': myData[11].completed,
      'Tests Completed': myData[11].testsCompleted,
      'Tests Pending': myData[11].testsPending,
      'Completion %': myData[11].total ? Math.round(myData[11].completed / myData[11].total * 100) : 0
    }, {
      Grade: 'Class 12',
      'Total Chapters': myData[12].total,
      'Completed': myData[12].completed,
      'Tests Completed': myData[12].testsCompleted,
      'Tests Pending': myData[12].testsPending,
      'Completion %': myData[12].total ? Math.round(myData[12].completed / myData[12].total * 100) : 0
    }];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
    const chapterDetailsData = [];
    ['11', '12'].forEach(grade => {
      const docId = `${mySchool}_${mySubject}_${grade}`;
      const chapters = curriculum[docId]?.chapters || [];
      chapters.forEach((ch, idx) => {
        const progressId = `${mySchool}_${ch.id}`;
        const prog = chapterProgress[progressId] || {};
        let daysDiff = '—';
        if (prog.completionDate && ch.targetDate) {
          const target = new Date(ch.targetDate);
          const completion = new Date(prog.completionDate);
          const diff = Math.ceil((completion - target) / (1000 * 60 * 60 * 24));
          daysDiff = diff > 0 ? `+${diff} days (Late)` : diff < 0 ? `${diff} days (Early)` : 'On Time';
        }
        chapterDetailsData.push({
          'S.No': idx + 1,
          'Grade': `Class ${grade}`,
          'Chapter Name': ch.name || '—',
          'Topics': ch.topics ? ch.topics.join(', ') : '—',
          'Target Date': ch.targetDate || '—',
          'Completed': prog.completed || 'No',
          'Completion Date': prog.completionDate || '—',
          'Days Difference': daysDiff,
          'Test Conducted': prog.testConducted || 'No',
          'Notes': prog.notes || '—'
        });
      });
    });
    if (chapterDetailsData.length > 0) {
      const wsChapters = XLSX.utils.json_to_sheet(chapterDetailsData);
      XLSX.utils.book_append_sheet(wb, wsChapters, "Chapter Details");
    }
    const comparisonData = SCHOOLS.map(school => {
      const s11 = allSchoolsData[school]?.[11] || {
        total: 0,
        completed: 0,
        testsCompleted: 0
      };
      const s12 = allSchoolsData[school]?.[12] || {
        total: 0,
        completed: 0,
        testsCompleted: 0
      };
      return {
        'School': school,
        'Class 11 Total': s11.total,
        'Class 11 Completed': s11.completed,
        'Class 11 Tests': s11.testsCompleted,
        'Class 12 Total': s12.total,
        'Class 12 Completed': s12.completed,
        'Class 12 Tests': s12.testsCompleted,
        'Overall %': s11.total + s12.total ? Math.round((s11.completed + s12.completed) / (s11.total + s12.total) * 100) : 0
      };
    });
    const wsComparison = XLSX.utils.json_to_sheet(comparisonData);
    XLSX.utils.book_append_sheet(wb, wsComparison, "School Comparison");
    XLSX.writeFile(wb, `${mySubject}_analytics_${mySchool}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("div", {
    className: "flex justify-between items-center"
  }, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "My Analytics - ", mySubject), React.createElement("button", {
    onClick: handleExport,
    className: "px-6 py-3 bg-green-600 text-white rounded-xl font-semibold"
  }, "\uD83D\uDCCA Export to Excel")), needsBatchSelector && React.createElement("div", {
    className: "bg-gradient-to-r from-pink-50 to-rose-50 p-4 rounded-2xl shadow-lg border-2 border-pink-200 mt-4"
  }, React.createElement("div", {
    className: "flex flex-wrap items-center gap-4"
  }, React.createElement("span", {
    className: "font-bold text-pink-700"
  }, "\uD83C\uDFEB EMRS Bhopal Batch:"), React.createElement("div", {
    className: "flex gap-2"
  }, React.createElement("button", {
    onClick: () => setSelectedBatch('JEE'),
    className: `px-6 py-2 rounded-xl font-bold transition-all ${selectedBatch === 'JEE' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg' : 'bg-white text-blue-700 border-2 border-blue-300 hover:bg-blue-50'}`
  }, "\uD83D\uDCDA JEE Batch"), React.createElement("button", {
    onClick: () => setSelectedBatch('NEET'),
    className: `px-6 py-2 rounded-xl font-bold transition-all ${selectedBatch === 'NEET' ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg' : 'bg-white text-green-700 border-2 border-green-300 hover:bg-green-50'}`
  }, "\uD83E\uDE7A NEET Batch")), React.createElement("span", {
    className: "text-sm text-pink-600"
  }, "Showing ", selectedBatch, " analytics for ", mySubject))), React.createElement("div", {
    className: "grid grid-cols-2 md:grid-cols-5 gap-4"
  }, React.createElement("div", {
    className: "stat-card"
  }, React.createElement("div", {
    className: "text-sm text-gray-600"
  }, "Avg Days per Chapter"), React.createElement("div", {
    className: "text-4xl font-bold"
  }, myData.avgDays)), React.createElement("div", {
    className: "stat-card bg-green-500 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Class 11 Completed"), React.createElement("div", {
    className: "text-4xl font-bold"
  }, myData[11].completed, "/", myData[11].total), React.createElement("div", {
    className: "text-sm opacity-90"
  }, myData[11].total ? Math.round(myData[11].completed / myData[11].total * 100) : 0, "%")), React.createElement("div", {
    className: "stat-card bg-green-500 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Class 12 Completed"), React.createElement("div", {
    className: "text-4xl font-bold"
  }, myData[12].completed, "/", myData[12].total), React.createElement("div", {
    className: "text-sm opacity-90"
  }, myData[12].total ? Math.round(myData[12].completed / myData[12].total * 100) : 0, "%")), React.createElement("div", {
    className: "stat-card bg-blue-500 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Tests Completed"), React.createElement("div", {
    className: "text-4xl font-bold"
  }, myData[11].testsCompleted + myData[12].testsCompleted)), React.createElement("div", {
    className: "stat-card bg-red-500 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Tests Pending"), React.createElement("div", {
    className: "text-4xl font-bold"
  }, myData[11].testsPending + myData[12].testsPending))), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-6"
  }, React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg",
    style: {
      height: '400px'
    }
  }, React.createElement("canvas", {
    ref: chart1Ref
  })), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg",
    style: {
      height: '400px'
    }
  }, React.createElement("canvas", {
    ref: chart2Ref
  }))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg",
    style: {
      height: '400px'
    }
  }, React.createElement("canvas", {
    ref: chart5Ref
  })), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-6"
  }, React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg",
    style: {
      height: '400px'
    }
  }, React.createElement("canvas", {
    ref: chart3Ref
  })), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg",
    style: {
      height: '400px'
    }
  }, React.createElement("canvas", {
    ref: chart4Ref
  }))));
}
function StudentCurriculumWithPriority({
  mySchool,
  myGrade,
  curriculum,
  chapterProgress
}) {
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const getAllChaptersWithSubject = () => {
    let allChapters = [];
    SUBJECTS.forEach(subject => {
      const docId = `${mySchool}_${subject}_${myGrade}`;
      const chapters = curriculum[docId]?.chapters || [];
      chapters.forEach(chapter => {
        const progressId = `${mySchool}_${chapter.id}`;
        const prog = chapterProgress[progressId] || {};
        const status = getChapterStatus(chapter, prog);
        allChapters.push({
          ...chapter,
          subject,
          prog,
          status
        });
      });
    });
    return allChapters;
  };
  const allChapters = getAllChaptersWithSubject();
  const priorityCounts = {
    all: allChapters.length,
    high: allChapters.filter(ch => ch.priority === 'high' || !ch.priority).length,
    medium: allChapters.filter(ch => ch.priority === 'medium').length,
    low: allChapters.filter(ch => ch.priority === 'low').length
  };
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "\uD83D\uDCDA My Curriculum - Class ", myGrade), React.createElement("div", {
    className: "bg-white p-4 rounded-2xl shadow-lg"
  }, React.createElement("div", {
    className: "flex flex-wrap items-center gap-3"
  }, React.createElement("span", {
    className: "font-bold text-gray-700"
  }, "\uD83C\uDFAF Filter by Priority:"), React.createElement("div", {
    className: "flex flex-wrap gap-2"
  }, React.createElement("button", {
    onClick: () => setPriorityFilter('all'),
    className: `px-4 py-2 rounded-xl font-semibold transition-all ${priorityFilter === 'all' ? 'bg-gray-800 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`
  }, "\uD83D\uDCCB All (", priorityCounts.all, ")"), React.createElement("button", {
    onClick: () => setPriorityFilter('high'),
    className: `px-4 py-2 rounded-xl font-semibold transition-all ${priorityFilter === 'high' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg' : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'}`
  }, "\uD83D\uDFE2 High (", priorityCounts.high, ")"), React.createElement("button", {
    onClick: () => setPriorityFilter('medium'),
    className: `px-4 py-2 rounded-xl font-semibold transition-all ${priorityFilter === 'medium' ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200'}`
  }, "\uD83D\uDFE1 Medium (", priorityCounts.medium, ")"), React.createElement("button", {
    onClick: () => setPriorityFilter('low'),
    className: `px-4 py-2 rounded-xl font-semibold transition-all ${priorityFilter === 'low' ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg' : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'}`
  }, "\uD83D\uDD34 Low (", priorityCounts.low, ")"))), React.createElement("div", {
    className: "flex flex-wrap items-center gap-3 mt-3 pt-3 border-t"
  }, React.createElement("span", {
    className: "font-bold text-gray-700"
  }, "\uD83D\uDCDA Subject:"), React.createElement("select", {
    value: selectedSubject,
    onChange: e => setSelectedSubject(e.target.value),
    className: "border-2 px-4 py-2 rounded-xl font-semibold"
  }, React.createElement("option", {
    value: "All"
  }, "All Subjects"), SUBJECTS.map(s => React.createElement("option", {
    key: s,
    value: s
  }, s))))), SUBJECTS.filter(subject => selectedSubject === 'All' || subject === selectedSubject).map(subject => {
    const docId = `${mySchool}_${subject}_${myGrade}`;
    let chapters = curriculum[docId]?.chapters || [];
    if (priorityFilter !== 'all') {
      chapters = chapters.filter(chapter => {
        const chPriority = chapter.priority || 'high';
        return chPriority === priorityFilter;
      });
    }
    if (chapters.length === 0 && priorityFilter !== 'all') return null;
    return React.createElement("div", {
      key: subject,
      className: "bg-white p-6 rounded-2xl shadow-lg"
    }, React.createElement("h3", {
      className: "text-2xl font-bold mb-4"
    }, subject), chapters.length === 0 ? React.createElement("p", {
      className: "text-gray-500"
    }, priorityFilter !== 'all' ? `No ${priorityFilter} priority chapters` : 'No chapters available') : React.createElement("div", {
      className: "space-y-3"
    }, chapters.map(chapter => {
      const progressId = `${mySchool}_${chapter.id}`;
      const prog = chapterProgress[progressId] || {};
      const status = getChapterStatus(chapter, prog);
      const chPriority = chapter.priority || 'high';
      return React.createElement("div", {
        key: chapter.id,
        className: "border-2 rounded-xl p-4 hover:shadow-md transition-all"
      }, React.createElement("div", {
        className: "flex justify-between items-start"
      }, React.createElement("div", {
        className: "flex-1"
      }, React.createElement("div", {
        className: "flex items-center gap-3 flex-wrap"
      }, React.createElement("h4", {
        className: "font-bold text-lg"
      }, chapter.name), chPriority === 'high' && React.createElement("span", {
        className: "priority-badge priority-high text-xs"
      }, "\uD83D\uDFE2 High Priority"), chPriority === 'medium' && React.createElement("span", {
        className: "priority-badge priority-medium text-xs"
      }, "\uD83D\uDFE1 Medium Priority"), chPriority === 'low' && React.createElement("span", {
        className: "priority-badge priority-low text-xs"
      }, "\uD83D\uDD34 Low Priority")), React.createElement("div", {
        className: "text-sm text-gray-600 mt-2"
      }, "\uD83D\uDCC5 Target: ", chapter.targetDate || 'Not set'), chapter.topics && chapter.topics.length > 0 && React.createElement("div", {
        className: "text-sm text-gray-500 mt-1"
      }, "\uD83D\uDCDD ", chapter.topics.length, " topic", chapter.topics.length > 1 ? 's' : '')), React.createElement("div", {
        className: `status-badge ${status.class}`
      }, status.label)));
    })));
  }));
}
function TeacherCurriculum({
  grade,
  currentUser,
  curriculum,
  chapterProgress,
  updateChapterProgress
}) {
  const [expandedChapters, setExpandedChapters] = useState({});
  const [priorityFilter, setPriorityFilter] = useState('all');
  const mySchool = currentUser.school;
  const mySubject = currentUser.subject;
  
  // EMRS Bhopal batch support - only for Physics and Chemistry
  const needsBatchSelector = mySchool === 'EMRS Bhopal' && (mySubject === 'Physics' || mySubject === 'Chemistry');
  const [selectedBatch, setSelectedBatch] = useState('JEE');
  
  // For EMRS Bhopal Physics/Chemistry: JEE uses original format, NEET adds batch prefix
  const docId = needsBatchSelector && selectedBatch === 'NEET' 
    ? `${mySchool}_NEET_${mySubject}_${grade}`
    : `${mySchool}_${mySubject}_${grade}`;
  
  const allChapters = curriculum[docId]?.chapters || [];
  const chapters = priorityFilter === 'all' ? allChapters : allChapters.filter(ch => {
    const chPriority = ch.priority || 'high';
    return chPriority === priorityFilter;
  });
  const priorityCounts = {
    all: allChapters.length,
    high: allChapters.filter(ch => ch.priority === 'high' || !ch.priority).length,
    medium: allChapters.filter(ch => ch.priority === 'medium').length,
    low: allChapters.filter(ch => ch.priority === 'low').length
  };
  const handleCompletedChange = (chapterId, value, schoolKey) => {
    updateChapterProgress(schoolKey || mySchool, chapterId, 'completed', value);
  };
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "Class ", grade, " - ", mySubject), React.createElement("div", {
    className: "bg-white p-4 rounded-2xl shadow-lg"
  }, React.createElement("div", {
    className: "flex flex-wrap items-center gap-3"
  }, React.createElement("span", {
    className: "font-bold text-gray-700"
  }, "\uD83C\uDFAF Filter by Priority:"), React.createElement("div", {
    className: "flex flex-wrap gap-2"
  }, React.createElement("button", {
    onClick: () => setPriorityFilter('all'),
    className: `px-4 py-2 rounded-xl font-semibold transition-all ${priorityFilter === 'all' ? 'bg-gray-800 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`
  }, "\uD83D\uDCCB All (", priorityCounts.all, ")"), React.createElement("button", {
    onClick: () => setPriorityFilter('high'),
    className: `px-4 py-2 rounded-xl font-semibold transition-all ${priorityFilter === 'high' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg' : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'}`
  }, "\uD83D\uDFE2 High (", priorityCounts.high, ")"), React.createElement("button", {
    onClick: () => setPriorityFilter('medium'),
    className: `px-4 py-2 rounded-xl font-semibold transition-all ${priorityFilter === 'medium' ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200'}`
  }, "\uD83D\uDFE1 Medium (", priorityCounts.medium, ")"), React.createElement("button", {
    onClick: () => setPriorityFilter('low'),
    className: `px-4 py-2 rounded-xl font-semibold transition-all ${priorityFilter === 'low' ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg' : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'}`
  }, "\uD83D\uDD34 Low (", priorityCounts.low, ")")))), needsBatchSelector && React.createElement("div", {
    className: "bg-gradient-to-r from-pink-50 to-rose-50 p-4 rounded-2xl shadow-lg border-2 border-pink-200"
  }, React.createElement("div", {
    className: "flex flex-wrap items-center gap-4"
  }, React.createElement("span", {
    className: "font-bold text-pink-700"
  }, "\uD83C\uDFEB EMRS Bhopal Batch:"), React.createElement("div", {
    className: "flex gap-2"
  }, React.createElement("button", {
    onClick: () => setSelectedBatch('JEE'),
    className: `px-6 py-2 rounded-xl font-bold transition-all ${selectedBatch === 'JEE' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg' : 'bg-white text-blue-700 border-2 border-blue-300 hover:bg-blue-50'}`
  }, "\uD83D\uDCDA JEE Batch"), React.createElement("button", {
    onClick: () => setSelectedBatch('NEET'),
    className: `px-6 py-2 rounded-xl font-bold transition-all ${selectedBatch === 'NEET' ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg' : 'bg-white text-green-700 border-2 border-green-300 hover:bg-green-50'}`
  }, "\uD83E\uDE7A NEET Batch")), React.createElement("span", {
    className: "text-sm text-pink-600"
  }, "Showing ", selectedBatch, " curriculum for ", mySubject))), chapters.length === 0 ? React.createElement("div", {
    className: "bg-white p-8 rounded-2xl text-center"
  }, React.createElement("p", {
    className: "text-gray-600"
  }, priorityFilter !== 'all' ? `No ${priorityFilter} priority chapters available.` : needsBatchSelector ? `No chapters available for ${selectedBatch} batch. Admin needs to upload ${selectedBatch} curriculum.` : 'No chapters available. Contact admin.')) : React.createElement("div", {
    className: "grid md:grid-cols-2 lg:grid-cols-3 gap-6"
  }, chapters.map(chapter => {
    const progressId = needsBatchSelector && selectedBatch === 'NEET' ? `${mySchool}_NEET_${chapter.id}` : `${mySchool}_${chapter.id}`;
    const progressSchoolKey = needsBatchSelector && selectedBatch === 'NEET' ? `${mySchool}_NEET` : mySchool;
    const prog = chapterProgress[progressId] || {};
    const completedTopics = prog.completedTopics || [];
    const allTopics = chapter.topics || [];
    const progress = allTopics.length ? Math.round(completedTopics.length / allTopics.length * 100) : 0;
    const isExpanded = expandedChapters[chapter.id];
    const status = getChapterStatus(chapter, prog);
    return React.createElement("div", {
      className: `chapter-card ${status.color} rounded-2xl shadow-lg p-5`
    }, React.createElement("div", {
      className: "flex justify-between items-start mb-3 gap-3"
    }, React.createElement("div", {
      className: "flex-1 min-w-0"
    }, React.createElement("h3", {
      className: "text-xl font-bold mb-2 break-words"
    }, chapter.name), React.createElement("div", null, (chapter.priority === 'high' || !chapter.priority) && React.createElement("span", {
      className: "priority-badge priority-high text-xs"
    }, "\uD83D\uDFE2 High Priority"), chapter.priority === 'medium' && React.createElement("span", {
      className: "priority-badge priority-medium text-xs"
    }, "\uD83D\uDFE1 Medium Priority"), chapter.priority === 'low' && React.createElement("span", {
      className: "priority-badge priority-low text-xs"
    }, "\uD83D\uDD34 Low Priority"))), React.createElement("button", {
      onClick: e => {
        e.preventDefault();
        e.stopPropagation();
        setExpandedChapters(prev => ({
          ...prev,
          [chapter.id]: !prev[chapter.id]
        }));
      },
      className: "text-sm px-3 py-1 bg-white rounded-lg font-semibold flex-shrink-0"
    }, isExpanded ? '▲' : '▼')), React.createElement("div", {
      className: `status-badge ${status.class} mb-3`
    }, status.label), React.createElement("div", {
      className: "space-y-3"
    }, React.createElement("div", null, React.createElement("div", {
      className: "flex justify-between text-sm mb-1"
    }, React.createElement("span", {
      className: "font-semibold"
    }, "Topics"), React.createElement("span", {
      className: "font-bold"
    }, completedTopics.length, "/", allTopics.length)), React.createElement("div", {
      className: "h-2 bg-gray-200 rounded-full"
    }, React.createElement("div", {
      className: "h-2 avanti-gradient rounded-full transition-all",
      style: {
        width: `${progress}%`
      }
    }))), isExpanded && React.createElement(React.Fragment, null, React.createElement("div", {
      className: "space-y-2 max-h-40 overflow-y-auto bg-white p-2 rounded-lg"
    }, allTopics.map((topic, idx) => {
      const topicName = typeof topic === 'string' ? topic : topic.name;
      const topicPriority = typeof topic === 'string' ? 'medium' : topic.priority || 'medium';
      const topicKey = typeof topic === 'string' ? topic : topic.name;
      const checked = completedTopics.includes(topicKey) || completedTopics.includes(topic);
      const priorityIcon = topicPriority === 'high' ? '🟢' : topicPriority === 'medium' ? '🟡' : '🔴';
      return React.createElement("label", {
        key: idx,
        className: "flex items-start gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded",
        onClick: e => e.stopPropagation()
      }, React.createElement("input", {
        type: "checkbox",
        checked: checked,
        className: "mt-1 flex-shrink-0",
        onClick: e => e.stopPropagation(),
        onChange: e => {
          e.stopPropagation();
          const updated = e.target.checked ? [...completedTopics, topicKey] : completedTopics.filter(t => t !== topicKey && t !== topic);
          updateChapterProgress(progressSchoolKey, chapter.id, 'completedTopics', updated);
        }
      }), React.createElement("span", {
        className: `text-sm flex-1 break-words ${checked ? 'line-through text-gray-500' : 'font-medium'}`
      }, topicName), React.createElement("span", {
        className: "text-xs flex-shrink-0 mt-1"
      }, priorityIcon));
    })), React.createElement("div", {
      className: "bg-white p-3 rounded-lg"
    }, React.createElement("label", {
      className: "block text-sm font-bold mb-1"
    }, "Chapter Priority"), React.createElement("div", null, (chapter.priority === 'high' || !chapter.priority) && React.createElement("span", {
      className: "priority-badge priority-high text-sm"
    }, "\uD83D\uDFE2 High Priority"), chapter.priority === 'medium' && React.createElement("span", {
      className: "priority-badge priority-medium text-sm"
    }, "\uD83D\uDFE1 Medium Priority"), chapter.priority === 'low' && React.createElement("span", {
      className: "priority-badge priority-low text-sm"
    }, "\uD83D\uDD34 Low Priority"))), React.createElement("div", {
      className: "bg-white p-3 rounded-lg"
    }, React.createElement("label", {
      className: "block text-sm font-bold mb-1"
    }, "Target Date"), React.createElement("div", {
      className: "text-sm"
    }, chapter.targetDate || '—')), React.createElement("div", {
      className: "bg-white p-3 rounded-lg"
    }, React.createElement("label", {
      className: "block text-sm font-bold mb-1"
    }, "Completion Date *"), React.createElement("input", {
      type: "date",
      value: prog.completionDate || '',
      onClick: e => e.stopPropagation(),
      onChange: e => {
        e.stopPropagation();
        updateChapterProgress(progressSchoolKey, chapter.id, 'completionDate', e.target.value);
      },
      className: "w-full border-2 px-3 py-2 rounded-lg cursor-pointer"
    })), React.createElement("div", {
      className: "bg-white p-3 rounded-lg"
    }, React.createElement("label", {
      className: "block text-sm font-bold mb-1"
    }, "Test Conducted? *"), React.createElement("select", {
      value: prog.testConducted || 'No',
      onClick: e => e.stopPropagation(),
      onChange: e => {
        e.stopPropagation();
        updateChapterProgress(progressSchoolKey, chapter.id, 'testConducted', e.target.value);
      },
      className: "w-full border-2 px-3 py-2 rounded-lg cursor-pointer"
    }, React.createElement("option", {
      value: "No"
    }, "No"), React.createElement("option", {
      value: "Yes"
    }, "Yes"))), React.createElement("div", {
      className: "bg-white p-3 rounded-lg"
    }, React.createElement("label", {
      className: "block text-sm font-bold mb-1"
    }, "Chapter Completed? *"), React.createElement("select", {
      value: prog.completed || 'No',
      onClick: e => e.stopPropagation(),
      onChange: e => {
        e.stopPropagation();
        handleCompletedChange(chapter.id, e.target.value, progressSchoolKey);
      },
      className: "w-full border-2 px-3 py-2 rounded-lg cursor-pointer"
    }, React.createElement("option", {
      value: "No"
    }, "No"), React.createElement("option", {
      value: "Yes"
    }, "Yes"))), React.createElement("div", {
      className: "bg-white p-3 rounded-lg"
    }, React.createElement("label", {
      className: "block text-sm font-bold mb-1"
    }, "Notes"), React.createElement("textarea", {
      value: prog.notes || '',
      onClick: e => e.stopPropagation(),
      onChange: e => {
        e.stopPropagation();
        updateChapterProgress(progressSchoolKey, chapter.id, 'notes', e.target.value);
      },
      className: "w-full border-2 px-3 py-2 rounded-lg cursor-text",
      rows: "2",
      placeholder: "Add notes..."
    })))));
  })));
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
  const openLeaveModal = teacher => {
    const balance = calculateLeaveBalance(teacherAttendance || [], teacher.afid, leaveAdjustments || {});
    const currentAdj = leaveAdjustments[teacher.afid] || {
      entitled: 0,
      maternity: 0,
      paternity: 0
    };
    setSelectedTeacherLeave({
      teacher,
      balance
    });
    setLeaveForm({
      entitled: currentAdj.entitled || 0,
      maternity: currentAdj.maternity || 0,
      paternity: currentAdj.paternity || 0
    });
    setIsEditingLeave(false);
    setShowLeaveModal(true);
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
  }, "\uD83D\uDCCA Leave Balance - ", selectedTeacherLeave.teacher.name), !isEditingLeave && React.createElement("button", {
    onClick: () => setIsEditingLeave(true),
    className: "px-4 py-2 bg-yellow-400 rounded-lg font-semibold text-sm"
  }, "\u270F\uFE0F Edit")), isEditingLeave ? React.createElement("div", {
    className: "space-y-4"
  }, React.createElement("div", {
    className: "bg-yellow-50 p-4 rounded-xl border-2 border-yellow-300 mb-4"
  }, React.createElement("p", {
    className: "text-sm text-yellow-800"
  }, React.createElement("strong", null, "\uD83D\uDCDD Adjust Prior Leaves:"), " Enter the number of leaves already taken before this system was implemented. These will be added to the system-tracked leaves.")), React.createElement("div", {
    className: "bg-blue-50 p-4 rounded-xl border-2 border-blue-200"
  }, React.createElement("label", {
    className: "block font-bold text-blue-800 mb-2"
  }, "Entitled Leave (Prior Adjustment)"), React.createElement("div", {
    className: "flex items-center gap-3"
  }, React.createElement("input", {
    type: "number",
    min: "0",
    max: "35",
    value: leaveForm.entitled,
    onChange: e => setLeaveForm({
      ...leaveForm,
      entitled: Math.min(35, Math.max(0, parseInt(e.target.value) || 0))
    }),
    className: "w-24 border-2 px-3 py-2 rounded-lg text-center font-bold text-lg"
  }), React.createElement("span", {
    className: "text-blue-700"
  }, "days taken before system")), React.createElement("p", {
    className: "text-xs text-blue-600 mt-2"
  }, "Max: 35 days (Personal, Sick, Emergency combined)")), React.createElement("div", {
    className: "bg-pink-50 p-4 rounded-xl border-2 border-pink-200"
  }, React.createElement("label", {
    className: "block font-bold text-pink-800 mb-2"
  }, "Maternity Leave (Prior Adjustment)"), React.createElement("div", {
    className: "flex items-center gap-3"
  }, React.createElement("input", {
    type: "number",
    min: "0",
    max: "180",
    value: leaveForm.maternity,
    onChange: e => setLeaveForm({
      ...leaveForm,
      maternity: Math.min(180, Math.max(0, parseInt(e.target.value) || 0))
    }),
    className: "w-24 border-2 px-3 py-2 rounded-lg text-center font-bold text-lg"
  }), React.createElement("span", {
    className: "text-pink-700"
  }, "days taken before system")), React.createElement("p", {
    className: "text-xs text-pink-600 mt-2"
  }, "Max: 180 days")), React.createElement("div", {
    className: "bg-purple-50 p-4 rounded-xl border-2 border-purple-200"
  }, React.createElement("label", {
    className: "block font-bold text-purple-800 mb-2"
  }, "Paternity Leave (Prior Adjustment)"), React.createElement("div", {
    className: "flex items-center gap-3"
  }, React.createElement("input", {
    type: "number",
    min: "0",
    max: "15",
    value: leaveForm.paternity,
    onChange: e => setLeaveForm({
      ...leaveForm,
      paternity: Math.min(15, Math.max(0, parseInt(e.target.value) || 0))
    }),
    className: "w-24 border-2 px-3 py-2 rounded-lg text-center font-bold text-lg"
  }), React.createElement("span", {
    className: "text-purple-700"
  }, "days taken before system")), React.createElement("p", {
    className: "text-xs text-purple-600 mt-2"
  }, "Max: 15 days")), React.createElement("div", {
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
  }, "Cancel"))) : React.createElement("div", {
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
function AdminCurriculum({
  curriculum,
  addChapter,
  updateChapter,
  deleteChapter
}) {
  const [selectedSchool, setSelectedSchool] = useState(SCHOOLS[0]);
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [selectedGrade, setSelectedGrade] = useState('11');
  const [selectedBatch, setSelectedBatch] = useState('JEE');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);
  const [chapterForm, setChapterForm] = useState({
    name: '',
    topics: [],
    targetDate: '',
    priority: 'medium'
  });
  const [newTopic, setNewTopic] = useState('');
  const fileInputRef = useRef(null);
  const [selectedSchoolsForImport, setSelectedSchoolsForImport] = useState([SCHOOLS[0]]);
  const [importSubject, setImportSubject] = useState(SUBJECTS[0]);
  const [importGrade, setImportGrade] = useState('11');
  const [importBatch, setImportBatch] = useState('JEE');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedChaptersForDelete, setSelectedChaptersForDelete] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // EMRS Bhopal batch support - only for Physics and Chemistry
  const needsBatchSelector = selectedSchool === 'EMRS Bhopal' && (selectedSubject === 'Physics' || selectedSubject === 'Chemistry');
  const needsBatchSelectorForImport = selectedSchoolsForImport.includes('EMRS Bhopal') && (importSubject === 'Physics' || importSubject === 'Chemistry');
  
  const toggleSchoolSelection = school => {
    setSelectedSchoolsForImport(prev => prev.includes(school) ? prev.filter(s => s !== school) : [...prev, school]);
  };
  const selectAllSchools = () => setSelectedSchoolsForImport([...SCHOOLS]);
  const deselectAllSchools = () => setSelectedSchoolsForImport([]);
  const toggleChapterSelection = chapterId => {
    setSelectedChaptersForDelete(prev => prev.includes(chapterId) ? prev.filter(id => id !== chapterId) : [...prev, chapterId]);
  };
  const selectAllChapters = () => {
    const docId = needsBatchSelector && selectedBatch === 'NEET' ? `${selectedSchool}_NEET_${selectedSubject}_${selectedGrade}` : `${selectedSchool}_${selectedSubject}_${selectedGrade}`;
    const chapters = curriculum[docId]?.chapters || [];
    setSelectedChaptersForDelete(chapters.map(ch => ch.id));
  };
  const deselectAllChapters = () => setSelectedChaptersForDelete([]);
  const handleBulkDelete = async () => {
    if (selectedChaptersForDelete.length === 0) {
      alert('Please select chapters to delete');
      return;
    }
    const count = selectedChaptersForDelete.length;
    if (!confirm(`Are you sure you want to delete ${count} chapter${count > 1 ? 's' : ''}? This action cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      const docId = needsBatchSelector && selectedBatch === 'NEET' ? `${selectedSchool}_NEET_${selectedSubject}_${selectedGrade}` : `${selectedSchool}_${selectedSubject}_${selectedGrade}`;
      const doc = await db.collection('curriculum').doc(docId).get();
      const existing = doc.exists ? doc.data().chapters || [] : [];
      const updated = existing.filter(ch => !selectedChaptersForDelete.includes(ch.id));
      await db.collection('curriculum').doc(docId).set({
        chapters: updated
      });
      setSelectedChaptersForDelete([]);
      alert(`✅ Successfully deleted ${count} chapter${count > 1 ? 's' : ''}`);
    } catch (e) {
      console.error('Bulk delete error', e);
      alert('Failed to delete chapters: ' + e.message);
    } finally {
      setIsDeleting(false);
    }
  };
  React.useEffect(() => {
    setSelectedChaptersForDelete([]);
  }, [selectedSchool, selectedSubject, selectedGrade, selectedBatch]);
  const docId = needsBatchSelector && selectedBatch === 'NEET' ? `${selectedSchool}_NEET_${selectedSubject}_${selectedGrade}` : `${selectedSchool}_${selectedSubject}_${selectedGrade}`;
  const chapters = curriculum[docId]?.chapters || [];
  const handleSaveChapter = () => {
    if (!chapterForm.name) {
      alert('Chapter name is required');
      return;
    }
    // For EMRS Bhopal NEET, use modified school name
    const schoolForSave = needsBatchSelector && selectedBatch === 'NEET' ? `${selectedSchool}_NEET` : selectedSchool;
    if (editingChapter) {
      updateChapter(schoolForSave, selectedSubject, selectedGrade, editingChapter.id, chapterForm);
      setEditingChapter(null);
    } else {
      addChapter(schoolForSave, selectedSubject, selectedGrade, chapterForm);
    }
    setChapterForm({
      name: '',
      topics: [],
      targetDate: '',
      priority: 'medium'
    });
    setShowAddForm(false);
  };
  const handleEditChapter = chapter => {
    setEditingChapter(chapter);
    const convertedTopics = (chapter.topics || []).map(t => typeof t === 'string' ? {
      name: t,
      priority: 'medium'
    } : t);
    setChapterForm({
      name: chapter.name,
      topics: convertedTopics,
      targetDate: chapter.targetDate || '',
      priority: chapter.priority || 'medium'
    });
    setShowAddForm(true);
  };
  const handleAddTopic = () => {
    if (!newTopic.trim()) return;
    setChapterForm({
      ...chapterForm,
      topics: [...chapterForm.topics, {
        name: newTopic.trim(),
        priority: 'medium'
      }]
    });
    setNewTopic('');
  };
  const handleCSVImport = e => {
    const file = e.target.files[0];
    if (!file) return;
    if (selectedSchoolsForImport.length === 0) {
      alert('Please select at least one school');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    Papa.parse(file, {
      complete: async results => {
        try {
          setIsImporting(true);
          const rows = results.data;
          if (rows.length < 2) {
            alert('CSV file is empty');
            setIsImporting(false);
            return;
          }
          let currentChapter = null;
          const chaptersToAdd = [];
          rows.forEach((row, index) => {
            if (index === 0) return;
            const chapterName = row[0] ? row[0].trim() : '';
            const topicName = row[1] ? row[1].trim() : '';
            const targetDate = row[2] ? row[2].trim() : '';
            const chapterPriorityRaw = row[3] ? row[3].trim().toLowerCase() : '';
            const topicPriorityRaw = row[4] ? row[4].trim().toLowerCase() : '';
            let chapterPriority = 'medium';
            if (chapterPriorityRaw === 'high' || chapterPriorityRaw === 'h' || chapterPriorityRaw === '1' || chapterPriorityRaw === '🟢') {
              chapterPriority = 'high';
            } else if (chapterPriorityRaw === 'medium' || chapterPriorityRaw === 'med' || chapterPriorityRaw === 'm' || chapterPriorityRaw === '2' || chapterPriorityRaw === '🟡') {
              chapterPriority = 'medium';
            } else if (chapterPriorityRaw === 'low' || chapterPriorityRaw === 'l' || chapterPriorityRaw === '3' || chapterPriorityRaw === '🔴') {
              chapterPriority = 'low';
            }
            let topicPriority = 'medium';
            if (topicPriorityRaw === 'high' || topicPriorityRaw === 'h' || topicPriorityRaw === '1' || topicPriorityRaw === '🟢') {
              topicPriority = 'high';
            } else if (topicPriorityRaw === 'medium' || topicPriorityRaw === 'med' || topicPriorityRaw === 'm' || topicPriorityRaw === '2' || topicPriorityRaw === '🟡') {
              topicPriority = 'medium';
            } else if (topicPriorityRaw === 'low' || topicPriorityRaw === 'l' || topicPriorityRaw === '3' || topicPriorityRaw === '🔴') {
              topicPriority = 'low';
            }
            if (chapterName) {
              if (currentChapter) {
                chaptersToAdd.push(currentChapter);
              }
              currentChapter = {
                name: chapterName,
                topics: topicName ? [{
                  name: topicName,
                  priority: topicPriority
                }] : [],
                targetDate: targetDate || '',
                priority: chapterPriority
              };
            } else if (topicName && currentChapter) {
              currentChapter.topics.push({
                name: topicName,
                priority: topicPriority
              });
            }
          });
          if (currentChapter) {
            chaptersToAdd.push(currentChapter);
          }
          if (chaptersToAdd.length === 0) {
            alert('No valid chapters found in CSV');
            setIsImporting(false);
            return;
          }
          let totalImported = 0;
          const failedSchools = [];
          for (const school of selectedSchoolsForImport) {
            try {
              // For EMRS Bhopal NEET batch with Physics/Chemistry, use modified school name
              const schoolForImport = school === 'EMRS Bhopal' && (importSubject === 'Physics' || importSubject === 'Chemistry') && importBatch === 'NEET' 
                ? 'EMRS Bhopal_NEET' 
                : school;
              for (const chapter of chaptersToAdd) {
                await addChapter(schoolForImport, importSubject, importGrade, chapter);
              }
              totalImported++;
            } catch (err) {
              failedSchools.push(school);
              console.error(`Failed to import to ${school}:`, err);
            }
          }
          setIsImporting(false);
          const batchInfo = needsBatchSelectorForImport ? ` (${importBatch} batch)` : '';
          if (failedSchools.length > 0) {
            alert(`Imported ${chaptersToAdd.length} chapters to ${totalImported} schools${batchInfo}.\nFailed for: ${failedSchools.join(', ')}`);
          } else {
            alert(`✅ Successfully imported ${chaptersToAdd.length} chapters to ${selectedSchoolsForImport.length} school(s)${batchInfo}:\n${selectedSchoolsForImport.join(', ')}`);
          }
          if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (e) {
          setIsImporting(false);
          alert('Import failed: ' + e.message);
        }
      },
      error: () => {
        setIsImporting(false);
        alert('Failed to parse CSV');
      }
    });
  };
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "Curriculum Management"), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg border-2 border-green-200"
  }, React.createElement("div", {
    className: "flex justify-between items-center mb-4"
  }, React.createElement("h3", {
    className: "text-xl font-bold text-green-700"
  }, "\uD83D\uDCE4 Bulk Import Curriculum"), React.createElement("button", {
    onClick: () => setShowBulkImport(!showBulkImport),
    className: "px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold hover:bg-green-200"
  }, showBulkImport ? '▲ Hide' : '▼ Expand')), showBulkImport && React.createElement("div", {
    className: "space-y-4"
  }, React.createElement("div", null, React.createElement("div", {
    className: "flex justify-between items-center mb-2"
  }, React.createElement("label", {
    className: "block text-sm font-bold"
  }, "Select Schools (can select multiple)"), React.createElement("div", {
    className: "flex gap-2"
  }, React.createElement("button", {
    onClick: selectAllSchools,
    className: "text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
  }, "Select All"), React.createElement("button", {
    onClick: deselectAllSchools,
    className: "text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
  }, "Clear All"))), React.createElement("div", {
    className: "grid grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-gray-50 rounded-xl"
  }, SCHOOLS.map(school => React.createElement("label", {
    key: school,
    className: `flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${selectedSchoolsForImport.includes(school) ? 'bg-green-100 border-2 border-green-400' : 'bg-white border-2 border-gray-200 hover:border-gray-300'}`
  }, React.createElement("input", {
    type: "checkbox",
    checked: selectedSchoolsForImport.includes(school),
    onChange: () => toggleSchoolSelection(school),
    className: "w-5 h-5"
  }), React.createElement("span", {
    className: `text-sm font-medium ${selectedSchoolsForImport.includes(school) ? 'text-green-700' : 'text-gray-700'}`
  }, school)))), React.createElement("p", {
    className: "text-xs text-gray-500 mt-1"
  }, "Selected: ", selectedSchoolsForImport.length, " school(s)")), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Subject"), React.createElement("select", {
    value: importSubject,
    onChange: e => setImportSubject(e.target.value),
    className: "w-full border-2 px-4 py-3 rounded-xl"
  }, SUBJECTS.map(s => React.createElement("option", {
    key: s,
    value: s
  }, s)))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Grade"), React.createElement("select", {
    value: importGrade,
    onChange: e => setImportGrade(e.target.value),
    className: "w-full border-2 px-4 py-3 rounded-xl"
  }, React.createElement("option", {
    value: "11"
  }, "Class 11"), React.createElement("option", {
    value: "12"
  }, "Class 12")))), needsBatchSelectorForImport && React.createElement("div", {
    className: "md:col-span-2 bg-gradient-to-r from-pink-50 to-rose-50 p-4 rounded-xl border-2 border-pink-200"
  }, React.createElement("label", {
    className: "block text-sm font-bold mb-2 text-pink-700"
  }, "\uD83C\uDFEB EMRS Bhopal Batch (Physics/Chemistry)"), React.createElement("div", {
    className: "flex gap-3"
  }, React.createElement("button", {
    onClick: () => setImportBatch('JEE'),
    className: `px-6 py-2 rounded-xl font-bold transition-all ${importBatch === 'JEE' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg' : 'bg-white text-blue-700 border-2 border-blue-300 hover:bg-blue-50'}`
  }, "\uD83D\uDCDA JEE"), React.createElement("button", {
    onClick: () => setImportBatch('NEET'),
    className: `px-6 py-2 rounded-xl font-bold transition-all ${importBatch === 'NEET' ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg' : 'bg-white text-green-700 border-2 border-green-300 hover:bg-green-50'}`
  }, "\uD83E\uDE7A NEET")), React.createElement("p", {
    className: "text-xs text-pink-600 mt-2"
  }, "EMRS Bhopal curriculum will be uploaded to: ", importBatch, " batch")), React.createElement("div", {
    className: "flex gap-3"
  }, React.createElement("label", {
    className: `flex-1 px-6 py-4 ${selectedSchoolsForImport.length > 0 && !isImporting ? 'bg-green-600 hover:bg-green-700 cursor-pointer' : 'bg-gray-400 cursor-not-allowed'} text-white rounded-xl font-semibold text-center transition-all`
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
  })), "Importing...") : `📤 Import CSV to ${selectedSchoolsForImport.length} School(s)`, React.createElement("input", {
    ref: fileInputRef,
    type: "file",
    accept: ".csv",
    onChange: handleCSVImport,
    disabled: selectedSchoolsForImport.length === 0 || isImporting,
    className: "hidden"
  }))), selectedSchoolsForImport.length > 0 && React.createElement("div", {
    className: "p-3 bg-green-50 rounded-xl"
  }, React.createElement("p", {
    className: "text-sm text-green-700"
  }, React.createElement("strong", null, "Will import to:"), " ", selectedSchoolsForImport.join(', ')), React.createElement("p", {
    className: "text-sm text-green-600"
  }, React.createElement("strong", null, "Subject:"), " ", importSubject, " | ", React.createElement("strong", null, "Grade:"), " Class ", importGrade)))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-lg font-bold text-gray-700 mb-4"
  }, "\uD83D\uDCDD View & Edit Chapters"), React.createElement("div", {
    className: "grid md:grid-cols-3 gap-4 mb-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "School"), React.createElement("select", {
    value: selectedSchool,
    onChange: e => setSelectedSchool(e.target.value),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  }, SCHOOLS.map(s => React.createElement("option", {
    key: s,
    value: s
  }, s)))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Subject"), React.createElement("select", {
    value: selectedSubject,
    onChange: e => setSelectedSubject(e.target.value),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  }, SUBJECTS.map(s => React.createElement("option", {
    key: s,
    value: s
  }, s)))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Grade"), React.createElement("select", {
    value: selectedGrade,
    onChange: e => setSelectedGrade(e.target.value),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  }, React.createElement("option", {
    value: "11"
  }, "Class 11"), React.createElement("option", {
    value: "12"
  }, "Class 12")))), needsBatchSelector && React.createElement("div", {
    className: "md:col-span-3 bg-gradient-to-r from-pink-50 to-rose-50 p-4 rounded-xl border-2 border-pink-200"
  }, React.createElement("label", {
    className: "block text-sm font-bold mb-2 text-pink-700"
  }, "\uD83C\uDFEB EMRS Bhopal Batch (Physics/Chemistry only)"), React.createElement("div", {
    className: "flex gap-3"
  }, React.createElement("button", {
    onClick: () => setSelectedBatch('JEE'),
    className: `px-6 py-2 rounded-xl font-bold transition-all ${selectedBatch === 'JEE' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg' : 'bg-white text-blue-700 border-2 border-blue-300 hover:bg-blue-50'}`
  }, "\uD83D\uDCDA JEE Curriculum"), React.createElement("button", {
    onClick: () => setSelectedBatch('NEET'),
    className: `px-6 py-2 rounded-xl font-bold transition-all ${selectedBatch === 'NEET' ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg' : 'bg-white text-green-700 border-2 border-green-300 hover:bg-green-50'}`
  }, "\uD83E\uDE7A NEET Curriculum")), React.createElement("p", {
    className: "text-xs text-pink-600 mt-2"
  }, "Currently viewing: ", selectedBatch, " curriculum for ", selectedSubject)), React.createElement("div", {
    className: "flex gap-3"
  }, React.createElement("button", {
    onClick: () => {
      setEditingChapter(null);
      setChapterForm({
        name: '',
        topics: [],
        targetDate: '',
        priority: 'medium'
      });
      setShowAddForm(!showAddForm);
    },
    className: "px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold"
  }, showAddForm ? 'Cancel' : '+ Add Chapter')), React.createElement("div", {
    className: "mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl"
  }, React.createElement("p", {
    className: "font-bold text-blue-800 mb-2"
  }, "\uD83D\uDCCB CSV Import Format (5 columns) - Separate Chapter & Topic Priorities:"), React.createElement("div", {
    className: "text-sm text-blue-700 space-y-1"
  }, React.createElement("p", null, React.createElement("strong", null, "Column A:"), " Chapter Name (leave blank for topics under same chapter)"), React.createElement("p", null, React.createElement("strong", null, "Column B:"), " Topic Name"), React.createElement("p", null, React.createElement("strong", null, "Column C:"), " Target Date (YYYY-MM-DD format, only for chapter rows)"), React.createElement("p", null, React.createElement("strong", null, "Column D:"), " ", React.createElement("span", {
    className: "text-purple-700 font-bold"
  }, "Chapter Priority"), " (High, Medium, Low) - ", React.createElement("span", {
    className: "font-bold text-purple-600"
  }, "Only for chapter rows!")), React.createElement("p", null, React.createElement("strong", null, "Column E:"), " ", React.createElement("span", {
    className: "text-green-700 font-bold"
  }, "Topic Priority"), " (High, Medium, Low) - ", React.createElement("span", {
    className: "font-bold text-green-600"
  }, "For each topic!"))), React.createElement("div", {
    className: "mt-3 bg-white p-3 rounded-lg text-xs font-mono overflow-x-auto"
  }, React.createElement("table", {
    className: "w-full border-collapse"
  }, React.createElement("thead", null, React.createElement("tr", {
    className: "bg-gray-100"
  }, React.createElement("th", {
    className: "border p-1 text-left"
  }, "Chapter Name"), React.createElement("th", {
    className: "border p-1 text-left"
  }, "Topic Name"), React.createElement("th", {
    className: "border p-1 text-left"
  }, "Target Date"), React.createElement("th", {
    className: "border p-1 text-left text-purple-700"
  }, "Chapter Priority"), React.createElement("th", {
    className: "border p-1 text-left text-green-700"
  }, "Topic Priority"))), React.createElement("tbody", null, React.createElement("tr", {
    className: "bg-green-50"
  }, React.createElement("td", {
    className: "border p-1 font-bold"
  }, "Laws of Motion"), React.createElement("td", {
    className: "border p-1"
  }, "Newton's First Law"), React.createElement("td", {
    className: "border p-1"
  }, "2025-02-15"), React.createElement("td", {
    className: "border p-1 text-purple-700 font-bold"
  }, "High"), React.createElement("td", {
    className: "border p-1 text-green-700"
  }, "High")), React.createElement("tr", null, React.createElement("td", {
    className: "border p-1"
  }), React.createElement("td", {
    className: "border p-1"
  }, "Newton's Second Law"), React.createElement("td", {
    className: "border p-1"
  }), React.createElement("td", {
    className: "border p-1 text-gray-400"
  }, "-"), React.createElement("td", {
    className: "border p-1 text-green-700"
  }, "High")), React.createElement("tr", null, React.createElement("td", {
    className: "border p-1"
  }), React.createElement("td", {
    className: "border p-1"
  }, "Newton's Third Law"), React.createElement("td", {
    className: "border p-1"
  }), React.createElement("td", {
    className: "border p-1 text-gray-400"
  }, "-"), React.createElement("td", {
    className: "border p-1 text-yellow-700"
  }, "Medium")), React.createElement("tr", {
    className: "bg-yellow-50"
  }, React.createElement("td", {
    className: "border p-1 font-bold"
  }, "Thermodynamics"), React.createElement("td", {
    className: "border p-1"
  }, "First Law"), React.createElement("td", {
    className: "border p-1"
  }, "2025-03-01"), React.createElement("td", {
    className: "border p-1 text-purple-700 font-bold"
  }, "Medium"), React.createElement("td", {
    className: "border p-1 text-yellow-700"
  }, "Medium")), React.createElement("tr", null, React.createElement("td", {
    className: "border p-1"
  }), React.createElement("td", {
    className: "border p-1"
  }, "Second Law"), React.createElement("td", {
    className: "border p-1"
  }), React.createElement("td", {
    className: "border p-1 text-gray-400"
  }, "-"), React.createElement("td", {
    className: "border p-1 text-red-700"
  }, "Low")), React.createElement("tr", null, React.createElement("td", {
    className: "border p-1"
  }), React.createElement("td", {
    className: "border p-1"
  }, "Carnot Engine"), React.createElement("td", {
    className: "border p-1"
  }), React.createElement("td", {
    className: "border p-1 text-gray-400"
  }, "-"), React.createElement("td", {
    className: "border p-1 text-green-700"
  }, "High"))))), React.createElement("div", {
    className: "mt-2 space-y-1 text-xs"
  }, React.createElement("p", {
    className: "text-blue-600"
  }, "\uD83D\uDCA1 ", React.createElement("strong", null, "Priority accepts:"), " High/H/1 (\uD83D\uDFE2), Medium/Med/M/2 (\uD83D\uDFE1), Low/L/3 (\uD83D\uDD34). Default is Medium."), React.createElement("p", {
    className: "text-purple-700"
  }, "\uD83D\uDCC2 ", React.createElement("strong", null, "Column D (Chapter Priority):"), " Set priority for the entire chapter. Only needed on chapter rows (where Column A has a value)."), React.createElement("p", {
    className: "text-green-700"
  }, "\uD83D\uDCDD ", React.createElement("strong", null, "Column E (Topic Priority):"), " Set priority for each individual topic. Can be different from chapter priority!")))), showAddForm && React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h4", {
    className: "text-xl font-bold mb-4"
  }, editingChapter ? 'Edit Chapter' : 'Add New Chapter'), React.createElement("div", {
    className: "space-y-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Chapter Name *"), React.createElement("input", {
    type: "text",
    value: chapterForm.name,
    onChange: e => setChapterForm({
      ...chapterForm,
      name: e.target.value
    }),
    className: "w-full border-2 px-4 py-3 rounded-xl"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Target Date"), React.createElement("input", {
    type: "date",
    value: chapterForm.targetDate,
    onChange: e => setChapterForm({
      ...chapterForm,
      targetDate: e.target.value
    }),
    className: "w-full border-2 px-4 py-3 rounded-xl"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Priority Level"), React.createElement("select", {
    value: chapterForm.priority || 'medium',
    onChange: e => setChapterForm({
      ...chapterForm,
      priority: e.target.value
    }),
    className: "w-full border-2 px-4 py-3 rounded-xl"
  }, React.createElement("option", {
    value: "high"
  }, "\uD83D\uDFE2 High Priority"), React.createElement("option", {
    value: "medium"
  }, "\uD83D\uDFE1 Medium Priority"), React.createElement("option", {
    value: "low"
  }, "\uD83D\uDD34 Low Priority"))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Topics"), React.createElement("div", {
    className: "flex gap-2 mb-3"
  }, React.createElement("input", {
    type: "text",
    value: newTopic,
    onChange: e => setNewTopic(e.target.value),
    onKeyPress: e => e.key === 'Enter' && handleAddTopic(),
    className: "flex-1 border-2 px-4 py-3 rounded-xl",
    placeholder: "Enter topic"
  }), React.createElement("button", {
    onClick: handleAddTopic,
    className: "px-6 py-3 bg-blue-600 text-white rounded-xl"
  }, "Add")), React.createElement("div", {
    className: "space-y-2"
  }, chapterForm.topics.map((topic, idx) => {
    const topicName = typeof topic === 'string' ? topic : topic.name;
    const topicPriority = typeof topic === 'string' ? 'medium' : topic.priority || 'medium';
    return React.createElement("div", {
      key: idx,
      className: "flex justify-between items-center p-3 bg-gray-50 rounded-lg gap-2"
    }, React.createElement("span", {
      className: "flex-1"
    }, topicName), React.createElement("select", {
      value: topicPriority,
      onChange: e => {
        const updated = [...chapterForm.topics];
        updated[idx] = {
          name: topicName,
          priority: e.target.value
        };
        setChapterForm({
          ...chapterForm,
          topics: updated
        });
      },
      className: "border px-2 py-1 rounded-lg text-sm"
    }, React.createElement("option", {
      value: "high"
    }, "\uD83D\uDFE2 High"), React.createElement("option", {
      value: "medium"
    }, "\uD83D\uDFE1 Medium"), React.createElement("option", {
      value: "low"
    }, "\uD83D\uDD34 Low")), React.createElement("button", {
      onClick: () => {
        const updated = chapterForm.topics.filter((_, i) => i !== idx);
        setChapterForm({
          ...chapterForm,
          topics: updated
        });
      },
      className: "px-3 py-1 bg-red-500 text-white rounded-lg"
    }, "Remove"));
  }))), React.createElement("button", {
    onClick: handleSaveChapter,
    className: "px-6 py-3 avanti-gradient text-white rounded-xl font-semibold"
  }, editingChapter ? 'Update Chapter' : 'Save Chapter'))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("div", {
    className: "flex flex-wrap justify-between items-center gap-3 mb-4"
  }, React.createElement("h4", {
    className: "text-xl font-bold"
  }, selectedSchool, " - ", selectedSubject, " - Class ", selectedGrade, " (", chapters.length, " chapters)"), chapters.length > 0 && React.createElement("div", {
    className: "flex flex-wrap gap-2 items-center"
  }, React.createElement("span", {
    className: "text-sm text-gray-600 mr-2"
  }, selectedChaptersForDelete.length, " selected"), React.createElement("button", {
    onClick: selectAllChapters,
    className: "px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200"
  }, "Select All"), React.createElement("button", {
    onClick: deselectAllChapters,
    className: "px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200"
  }, "Deselect All"), React.createElement("button", {
    onClick: handleBulkDelete,
    disabled: selectedChaptersForDelete.length === 0 || isDeleting,
    className: `px-4 py-1 rounded-lg text-sm font-semibold ${selectedChaptersForDelete.length === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-600'}`
  }, isDeleting ? 'Deleting...' : '🗑️ Delete Selected (' + selectedChaptersForDelete.length + ')'))), chapters.length === 0 ? React.createElement("p", {
    className: "text-gray-500 text-center py-8"
  }, "No chapters yet") : React.createElement("div", {
    className: "space-y-3"
  }, chapters.map(ch => React.createElement("div", {
    key: ch.id,
    className: `border-2 rounded-xl p-4 hover:bg-gray-50 ${selectedChaptersForDelete.includes(ch.id) ? 'bg-red-50 border-red-300' : ''}`
  }, React.createElement("div", {
    className: "flex justify-between items-start"
  }, React.createElement("div", {
    className: "flex items-start gap-3"
  }, React.createElement("input", {
    type: "checkbox",
    checked: selectedChaptersForDelete.includes(ch.id),
    onChange: () => toggleChapterSelection(ch.id),
    className: "mt-1 w-5 h-5 cursor-pointer"
  }), React.createElement("div", {
    className: "flex-1"
  }, React.createElement("h5", {
    className: "font-bold text-lg"
  }, ch.name), React.createElement("p", {
    className: "text-sm text-gray-600"
  }, "Target: ", ch.targetDate || 'Not set', " | Topics: ", ch.topics?.length || 0), React.createElement("div", {
    className: "mt-2"
  }, (ch.priority === 'high' || !ch.priority) && React.createElement("span", {
    className: "priority-badge priority-high text-xs"
  }, "\uD83D\uDFE2 High Priority"), ch.priority === 'medium' && React.createElement("span", {
    className: "priority-badge priority-medium text-xs"
  }, "\uD83D\uDFE1 Medium Priority"), ch.priority === 'low' && React.createElement("span", {
    className: "priority-badge priority-low text-xs"
  }, "\uD83D\uDD34 Low Priority")), ch.topics && ch.topics.length > 0 && React.createElement("ul", {
    className: "text-xs text-gray-600 ml-4 mt-2"
  }, ch.topics.map((t, i) => {
    const topicName = typeof t === 'string' ? t : t.name;
    const topicPriority = typeof t === 'string' ? 'medium' : t.priority || 'medium';
    const priorityIcon = topicPriority === 'high' ? '🟢' : topicPriority === 'medium' ? '🟡' : '🔴';
    return React.createElement("li", {
      key: i
    }, "\u2022 ", topicName, " ", React.createElement("span", {
      className: "ml-1"
    }, priorityIcon));
  })))), React.createElement("div", {
    className: "flex gap-2 mt-2 md:mt-0 flex-shrink-0"
  }, React.createElement("button", {
    onClick: () => handleEditChapter(ch),
    className: "px-3 py-1 bg-yellow-400 rounded-lg"
  }, "Edit"), React.createElement("button", {
    onClick: () => deleteChapter(selectedSchool, selectedSubject, selectedGrade, ch.id),
    className: "px-3 py-1 bg-red-500 text-white rounded-lg"
  }, "Delete"))))))));
}
function AdminAnalytics({
  teachers,
  curriculum,
  chapterProgress,
  accessibleSchools = SCHOOLS,
  isSuperAdmin = false,
  isDirector = false
}) {
  const hasFullDataAccess = isSuperAdmin || isDirector;
  const schoolMatchesFilter = (itemSchool, selectedSchools) => {
    if (!selectedSchools || selectedSchools.length === 0) return false;
    if (!itemSchool) return false;
    const itemSchoolLower = itemSchool.toString().toLowerCase().trim();
    return selectedSchools.some(s => s && s.toString().toLowerCase().trim() === itemSchoolLower);
  };
  const availableSchoolOptions = hasFullDataAccess ? SCHOOLS : accessibleSchools;
  const initialSchools = hasFullDataAccess ? [...SCHOOLS] : [...accessibleSchools];
  const [filterSchools, setFilterSchools] = useState(initialSchools);
  const [filterGrade, setFilterGrade] = useState('All');
  const [filterTeachers, setFilterTeachers] = useState([]);
  const [emrsBatch, setEmrsBatch] = useState('JEE');
  
  // Check if EMRS Bhopal is selected for batch selector
  const showEmrsBatchSelector = filterSchools.includes('EMRS Bhopal');
  
  const availableTeachers = useMemo(() => {
    if (filterSchools.length === 0) return [];
    return teachers.filter(t => schoolMatchesFilter(t.school, filterSchools) && !t.isArchived);
  }, [teachers, filterSchools]);
  React.useEffect(() => {
    const validTeachers = filterTeachers.filter(afid => availableTeachers.some(t => t.afid === afid));
    if (validTeachers.length !== filterTeachers.length) {
      setFilterTeachers(validTeachers);
    }
  }, [availableTeachers]);
  const chart1Ref = useRef(null);
  const chart2Ref = useRef(null);
  const chart3Ref = useRef(null);
  const chart4Ref = useRef(null);
  const chart5Ref = useRef(null);
  const chart6Ref = useRef(null);
  const chart7Ref = useRef(null);
  const chart8Ref = useRef(null);
  const chartInstances = useRef({});
  const filteredData = useMemo(() => {
    const data = {
      totalChapters: 0,
      completedChapters: 0,
      delayedChapters: 0,
      aheadChapters: 0,
      testsCompleted: 0,
      testsPending: 0,
      schoolData: {},
      subjectData: {},
      gradeData: {},
      teacherData: {},
      statusData: {
        ahead: 0,
        ontrack: 0,
        delayed: 0,
        pending: 0
      },
      testData: {
        completed: 0,
        pending: 0
      }
    };
    const schoolsToProcess = filterSchools.length > 0 ? filterSchools : [];
    const gradesToProcess = filterGrade === 'All' ? ['11', '12'] : [filterGrade];
    const teachersFiltered = filterTeachers.length === 0 ? teachers.filter(t => schoolMatchesFilter(t.school, schoolsToProcess) && !t.isArchived) : teachers.filter(t => filterTeachers.includes(t.afid) && !t.isArchived);
    schoolsToProcess.forEach(school => {
      if (!data.schoolData[school]) {
        data.schoolData[school] = {
          total: 0,
          completed: 0,
          delayed: 0,
          ahead: 0,
          tests: 0,
          testsPending: 0
        };
      }
      SUBJECTS.forEach(subject => {
        if (!data.subjectData[subject]) {
          data.subjectData[subject] = {
            total: 0,
            completed: 0,
            testsCompleted: 0,
            testsPending: 0
          };
        }
        gradesToProcess.forEach(grade => {
          if (!data.gradeData[grade]) {
            data.gradeData[grade] = {
              total: 0,
              completed: 0,
              testsCompleted: 0,
              testsPending: 0
            };
          }
          const docId = `${school}_${subject}_${grade}`;
          // For EMRS Bhopal Physics/Chemistry, also check NEET curriculum based on batch selection
          const isEmrsPhysChem = school === 'EMRS Bhopal' && (subject === 'Physics' || subject === 'Chemistry');
          const actualDocId = isEmrsPhysChem && emrsBatch === 'NEET' ? `${school}_NEET_${subject}_${grade}` : docId;
          const chapters = curriculum[actualDocId]?.chapters || [];
          const relevantTeachers = teachersFiltered.filter(t => t.school?.toLowerCase() === school?.toLowerCase() && t.subject === subject);
          if (filterTeachers.length > 0 && relevantTeachers.length === 0) return;
          chapters.forEach(ch => {
            data.totalChapters++;
            data.schoolData[school].total++;
            data.subjectData[subject].total++;
            data.gradeData[grade].total++;
            const progressId = isEmrsPhysChem && emrsBatch === 'NEET' ? `${school}_NEET_${ch.id}` : `${school}_${ch.id}`;
            const prog = chapterProgress[progressId] || {};
            const status = getChapterStatus(ch, prog);
            if (prog.completed === 'Yes') {
              data.completedChapters++;
              data.schoolData[school].completed++;
              data.subjectData[subject].completed++;
              data.gradeData[grade].completed++;
              if (prog.testConducted === 'Yes') {
                data.testsCompleted++;
                data.schoolData[school].tests++;
                data.subjectData[subject].testsCompleted++;
                data.gradeData[grade].testsCompleted++;
                data.testData.completed++;
              } else {
                data.testsPending++;
                data.schoolData[school].testsPending++;
                data.subjectData[subject].testsPending++;
                data.gradeData[grade].testsPending++;
                data.testData.pending++;
              }
              if (status.class === 'status-ahead') {
                data.aheadChapters++;
                data.schoolData[school].ahead++;
                data.statusData.ahead++;
              } else if (status.class === 'status-ontrack') {
                data.statusData.ontrack++;
              }
            }
            if (status.label.includes('Delayed')) {
              data.delayedChapters++;
              data.schoolData[school].delayed++;
              data.statusData.delayed++;
            }
            if (status.label === 'Pending') {
              data.statusData.pending++;
            }
          });
        });
      });
    });
    teachersFiltered.forEach(teacher => {
      if (!data.teacherData[teacher.afid]) {
        data.teacherData[teacher.afid] = {
          name: teacher.name,
          total: 0,
          completed: 0
        };
      }
    });
    return data;
  }, [curriculum, chapterProgress, teachers, filterSchools, filterGrade, filterTeachers, emrsBatch]);
  useEffect(() => {
    Object.values(chartInstances.current).forEach(chart => {
      if (chart) chart.destroy();
    });
    chartInstances.current = {};
    if (chart1Ref.current) {
      const ctx = chart1Ref.current.getContext('2d');
      const schools = Object.keys(filteredData.schoolData);
      chartInstances.current.chart1 = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: schools,
          datasets: [{
            label: 'Completion %',
            data: schools.map(s => {
              const d = filteredData.schoolData[s];
              return d.total ? Math.round(d.completed / d.total * 100) : 0;
            }),
            backgroundColor: '#C8342E',
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'School-wise Completion %',
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
              ticks: {
                callback: v => v + '%'
              }
            }
          }
        }
      });
    }
    if (chart2Ref.current) {
      const ctx = chart2Ref.current.getContext('2d');
      const subjects = Object.keys(filteredData.subjectData);
      chartInstances.current.chart2 = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: subjects,
          datasets: [{
            data: subjects.map(s => filteredData.subjectData[s].completed),
            backgroundColor: ['#D4A574', '#5B8A8A', '#7BA3A3', '#C17A6E'],
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
              text: 'Completed Chapters by Subject',
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
    if (chart3Ref.current) {
      const ctx = chart3Ref.current.getContext('2d');
      const grades = Object.keys(filteredData.gradeData);
      chartInstances.current.chart3 = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: grades.map(g => `Class ${g}`),
          datasets: [{
            label: 'Completed',
            data: grades.map(g => filteredData.gradeData[g].completed),
            backgroundColor: '#5B8A8A'
          }, {
            label: 'Pending',
            data: grades.map(g => filteredData.gradeData[g].total - filteredData.gradeData[g].completed),
            backgroundColor: '#D4A574'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Grade-wise Progress',
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
              stacked: true
            },
            y: {
              stacked: true,
              beginAtZero: true
            }
          }
        }
      });
    }
    if (chart4Ref.current) {
      const ctx = chart4Ref.current.getContext('2d');
      chartInstances.current.chart4 = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Completed', 'Pending', 'Delayed'],
          datasets: [{
            data: [filteredData.completedChapters, filteredData.totalChapters - filteredData.completedChapters - filteredData.delayedChapters, filteredData.delayedChapters],
            backgroundColor: ['#5B8A8A', '#D4A574', '#C17A6E'],
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
              text: 'Overall Chapter Status',
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
    if (chart5Ref.current) {
      const ctx = chart5Ref.current.getContext('2d');
      chartInstances.current.chart5 = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['Tests Completed', 'Tests Pending'],
          datasets: [{
            data: [filteredData.testsCompleted, filteredData.testsPending],
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
              text: 'Chapter Tests Status',
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
    if (chart6Ref.current) {
      const ctx = chart6Ref.current.getContext('2d');
      chartInstances.current.chart6 = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Ahead', 'On Track', 'Delayed', 'Pending'],
          datasets: [{
            label: 'Chapters',
            data: [filteredData.statusData.ahead, filteredData.statusData.ontrack, filteredData.statusData.delayed, filteredData.statusData.pending],
            backgroundColor: ['#5B8A8A', '#7BA3A3', '#D4A574', '#C17A6E'],
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Performance Status Distribution',
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
              beginAtZero: true
            }
          }
        }
      });
    }
    if (chart7Ref.current) {
      const ctx = chart7Ref.current.getContext('2d');
      const schools = Object.keys(filteredData.schoolData);
      chartInstances.current.chart7 = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: schools,
          datasets: [{
            label: 'Delayed Chapters',
            data: schools.map(s => filteredData.schoolData[s].delayed),
            backgroundColor: '#C17A6E',
            borderRadius: 6
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Delayed Chapters by School',
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
            x: {
              beginAtZero: true
            }
          }
        }
      });
    }
    if (chart8Ref.current) {
      const ctx = chart8Ref.current.getContext('2d');
      const subjects = Object.keys(filteredData.subjectData);
      chartInstances.current.chart8 = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: subjects.map(s => `${s} - ${filteredData.subjectData[s].total ? Math.round(filteredData.subjectData[s].completed / filteredData.subjectData[s].total * 100) : 0}%`),
          datasets: [{
            data: subjects.map(s => filteredData.subjectData[s].completed),
            backgroundColor: ['#D4A574', '#5B8A8A', '#7BA3A3', '#C17A6E'],
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
              text: 'Subject-wise Completion Rate',
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
  }, [filteredData]);
  const handleExport = () => {
    const wb = XLSX.utils.book_new();
    const schoolData = Object.keys(filteredData.schoolData).map(school => ({
      School: school,
      'Total Chapters': filteredData.schoolData[school].total,
      'Completed': filteredData.schoolData[school].completed,
      'Delayed': filteredData.schoolData[school].delayed,
      'Ahead': filteredData.schoolData[school].ahead,
      'Tests Completed': filteredData.schoolData[school].tests,
      'Tests Pending': filteredData.schoolData[school].testsPending,
      'Completion %': filteredData.schoolData[school].total ? Math.round(filteredData.schoolData[school].completed / filteredData.schoolData[school].total * 100) : 0
    }));
    const wsSchool = XLSX.utils.json_to_sheet(schoolData);
    XLSX.utils.book_append_sheet(wb, wsSchool, "School Summary");
    const subjectData = Object.keys(filteredData.subjectData).map(subject => ({
      Subject: subject,
      'Total Chapters': filteredData.subjectData[subject].total,
      'Completed': filteredData.subjectData[subject].completed,
      'Tests Completed': filteredData.subjectData[subject].testsCompleted,
      'Tests Pending': filteredData.subjectData[subject].testsPending,
      'Completion %': filteredData.subjectData[subject].total ? Math.round(filteredData.subjectData[subject].completed / filteredData.subjectData[subject].total * 100) : 0
    }));
    const wsSubject = XLSX.utils.json_to_sheet(subjectData);
    XLSX.utils.book_append_sheet(wb, wsSubject, "Subject Summary");
    const gradeData = Object.keys(filteredData.gradeData).map(grade => ({
      Grade: `Class ${grade}`,
      'Total Chapters': filteredData.gradeData[grade].total,
      'Completed': filteredData.gradeData[grade].completed,
      'Tests Completed': filteredData.gradeData[grade].testsCompleted,
      'Tests Pending': filteredData.gradeData[grade].testsPending,
      'Completion %': filteredData.gradeData[grade].total ? Math.round(filteredData.gradeData[grade].completed / filteredData.gradeData[grade].total * 100) : 0
    }));
    const wsGrade = XLSX.utils.json_to_sheet(gradeData);
    XLSX.utils.book_append_sheet(wb, wsGrade, "Grade Summary");
    const teacherDetailedData = [];
    const teachersToExport = filterTeachers.length > 0 ? teachers.filter(t => filterTeachers.includes(t.afid) && !t.isArchived) : teachers.filter(t => filterSchools.includes(t.school) && !t.isArchived);
    teachersToExport.forEach(teacher => {
      const gradesToProcess = filterGrade === 'All' ? ['11', '12'] : [filterGrade];
      let teacherTotal = 0,
        teacherCompleted = 0,
        teacherTests = 0,
        teacherDelayed = 0;
      gradesToProcess.forEach(grade => {
        const docId = `${teacher.school}_${teacher.subject}_${grade}`;
        const chapters = curriculum[docId]?.chapters || [];
        chapters.forEach(ch => {
          teacherTotal++;
          const progressId = `${teacher.school}_${ch.id}`;
          const prog = chapterProgress[progressId] || {};
          const status = getChapterStatus(ch, prog);
          if (prog.completed === 'Yes') {
            teacherCompleted++;
            if (prog.testConducted === 'Yes') teacherTests++;
          }
          if (status.label.includes('Delayed')) teacherDelayed++;
        });
      });
      if (teacherTotal > 0) {
        teacherDetailedData.push({
          'Teacher Name': teacher.name,
          'AFID': teacher.afid,
          'School': teacher.school,
          'Subject': teacher.subject,
          'Total Chapters': teacherTotal,
          'Completed': teacherCompleted,
          'Delayed': teacherDelayed,
          'Tests Completed': teacherTests,
          'Tests Pending': teacherCompleted - teacherTests,
          'Completion %': Math.round(teacherCompleted / teacherTotal * 100)
        });
      }
    });
    if (teacherDetailedData.length > 0) {
      const wsTeacher = XLSX.utils.json_to_sheet(teacherDetailedData);
      XLSX.utils.book_append_sheet(wb, wsTeacher, "Teacher Summary");
    }
    const chapterDetailsData = [];
    const schoolsToProcess = filterSchools.length > 0 ? filterSchools : [];
    const gradesToProcess = filterGrade === 'All' ? ['11', '12'] : [filterGrade];
    schoolsToProcess.forEach(school => {
      SUBJECTS.forEach(subject => {
        gradesToProcess.forEach(grade => {
          const docId = `${school}_${subject}_${grade}`;
          const chapters = curriculum[docId]?.chapters || [];
          chapters.forEach((ch, idx) => {
            const progressId = `${school}_${ch.id}`;
            const prog = chapterProgress[progressId] || {};
            const status = getChapterStatus(ch, prog);
            let daysDiff = '—';
            if (prog.completionDate && ch.targetDate) {
              const target = new Date(ch.targetDate);
              const completion = new Date(prog.completionDate);
              const diff = Math.ceil((completion - target) / (1000 * 60 * 60 * 24));
              daysDiff = diff > 0 ? `+${diff} days (Late)` : diff < 0 ? `${diff} days (Early)` : 'On Time';
            }
            const teacher = teachers.find(t => t.school?.toLowerCase() === school?.toLowerCase() && t.subject === subject);
            chapterDetailsData.push({
              'School': school,
              'Subject': subject,
              'Grade': `Class ${grade}`,
              'Teacher': teacher?.name || '—',
              'Chapter Name': ch.name || '—',
              'Target Date': ch.targetDate || '—',
              'Completed': prog.completed || 'No',
              'Completion Date': prog.completionDate || '—',
              'Days Difference': daysDiff,
              'Status': status.label,
              'Test Conducted': prog.testConducted || 'No',
              'Notes': prog.notes || '—'
            });
          });
        });
      });
    });
    if (chapterDetailsData.length > 0) {
      const wsChapterDetails = XLSX.utils.json_to_sheet(chapterDetailsData);
      XLSX.utils.book_append_sheet(wb, wsChapterDetails, "Chapter Details");
    }
    const overallData = [{
      'Total Chapters': filteredData.totalChapters,
      'Completed': filteredData.completedChapters,
      'Delayed': filteredData.delayedChapters,
      'Ahead': filteredData.aheadChapters,
      'Tests Completed': filteredData.testsCompleted,
      'Tests Pending': filteredData.testsPending,
      'Overall Completion %': filteredData.totalChapters ? Math.round(filteredData.completedChapters / filteredData.totalChapters * 100) : 0,
      'Schools Selected': filterSchools.join(', '),
      'Grade Filter': filterGrade,
      'Teachers Selected': filterTeachers.length === 0 ? 'All' : filterTeachers.length + ' teachers'
    }];
    const wsOverall = XLSX.utils.json_to_sheet(overallData);
    XLSX.utils.book_append_sheet(wb, wsOverall, "Overall Summary");
    XLSX.writeFile(wb, `analytics_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("div", {
    className: "flex justify-between items-center"
  }, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "\uD83D\uDCCA Analytics Dashboard"), React.createElement("button", {
    onClick: handleExport,
    className: "px-6 py-3 bg-green-600 text-white rounded-xl font-semibold"
  }, "\uD83D\uDCE5 Export Filtered Data")), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "\uD83D\uDD0D Filters (Apply to All Charts)"), React.createElement("div", {
    className: "grid md:grid-cols-3 gap-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Schools (", filterSchools.length, "/", availableSchoolOptions.length, ")"), React.createElement(MultiSelectDropdown, {
    options: availableSchoolOptions,
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
  }, "Teachers (", filterTeachers.length === 0 ? 'All' : filterTeachers.length, "/", availableTeachers.length, ")"), React.createElement(MultiSelectDropdown, {
    options: availableTeachers,
    selected: filterTeachers,
    onChange: setFilterTeachers,
    placeholder: "All Teachers",
    getOptionLabel: t => `${t.name} (${t.school})`,
    getOptionValue: t => t.afid,
    disabled: filterSchools.length === 0
  }))), showEmrsBatchSelector && React.createElement("div", {
    className: "md:col-span-3 bg-gradient-to-r from-pink-50 to-rose-50 p-4 rounded-xl border-2 border-pink-200 mt-4"
  }, React.createElement("label", {
    className: "block text-sm font-bold mb-2 text-pink-700"
  }, "\uD83C\uDFEB EMRS Bhopal Batch (for Physics & Chemistry)"), React.createElement("div", {
    className: "flex gap-3"
  }, React.createElement("button", {
    onClick: () => setEmrsBatch('JEE'),
    className: `px-6 py-2 rounded-xl font-bold transition-all ${emrsBatch === 'JEE' ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg' : 'bg-white text-blue-700 border-2 border-blue-300 hover:bg-blue-50'}`
  }, "\uD83D\uDCDA JEE Batch"), React.createElement("button", {
    onClick: () => setEmrsBatch('NEET'),
    className: `px-6 py-2 rounded-xl font-bold transition-all ${emrsBatch === 'NEET' ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg' : 'bg-white text-green-700 border-2 border-green-300 hover:bg-green-50'}`
  }, "\uD83E\uDE7A NEET Batch")), React.createElement("p", {
    className: "text-xs text-pink-600 mt-2"
  }, "Showing ", emrsBatch, " curriculum data for EMRS Bhopal Physics & Chemistry")), filterSchools.length === 0 && React.createElement("p", {
    className: "text-orange-600 mt-2 text-sm"
  }, "\u26A0\uFE0F Please select at least one school to see data")), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "\uD83D\uDCCA Overall Progress Summary"), React.createElement("div", {
    className: "grid grid-cols-2 md:grid-cols-5 gap-4"
  }, React.createElement("div", {
    className: "stat-card avanti-gradient text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Total Chapters"), React.createElement("div", {
    className: "text-4xl font-bold"
  }, filteredData.totalChapters)), React.createElement("div", {
    className: "stat-card bg-green-500 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Completed"), React.createElement("div", {
    className: "text-3xl font-bold"
  }, filteredData.completedChapters, "/", filteredData.totalChapters), React.createElement("div", {
    className: "text-lg font-semibold mt-1"
  }, filteredData.totalChapters ? Math.round(filteredData.completedChapters / filteredData.totalChapters * 100) : 0, "%")), React.createElement("div", {
    className: "stat-card bg-blue-500 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Tests Completed"), React.createElement("div", {
    className: "text-3xl font-bold"
  }, filteredData.testsCompleted, "/", filteredData.completedChapters), React.createElement("div", {
    className: "text-lg font-semibold mt-1"
  }, filteredData.completedChapters ? Math.round(filteredData.testsCompleted / filteredData.completedChapters * 100) : 0, "%")), React.createElement("div", {
    className: "stat-card bg-purple-500 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Tests Pending"), React.createElement("div", {
    className: "text-4xl font-bold"
  }, filteredData.testsPending)), React.createElement("div", {
    className: "stat-card bg-orange-500 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Delayed"), React.createElement("div", {
    className: "text-3xl font-bold"
  }, filteredData.delayedChapters)))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "\uD83D\uDCDA Grade-wise Breakdown"), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-6"
  }, React.createElement("div", {
    className: "border-4 border-green-500 rounded-2xl p-6 bg-gradient-to-br from-green-50 to-emerald-50"
  }, React.createElement("h4", {
    className: "text-2xl font-bold text-green-800 mb-4"
  }, "\uD83D\uDCD7 Class 11"), React.createElement("div", {
    className: "space-y-3"
  }, React.createElement("div", {
    className: "flex justify-between items-center p-3 bg-white rounded-lg shadow"
  }, React.createElement("span", {
    className: "font-semibold"
  }, "Total Chapters:"), React.createElement("span", {
    className: "text-2xl font-bold text-gray-800"
  }, filteredData.gradeData['11']?.total || 0)), React.createElement("div", {
    className: "flex justify-between items-center p-3 bg-white rounded-lg shadow"
  }, React.createElement("span", {
    className: "font-semibold"
  }, "Completed:"), React.createElement("span", {
    className: "text-2xl font-bold text-green-600"
  }, filteredData.gradeData['11']?.completed || 0)), React.createElement("div", {
    className: "flex justify-between items-center p-3 bg-white rounded-lg shadow"
  }, React.createElement("span", {
    className: "font-semibold"
  }, "Tests Completed:"), React.createElement("span", {
    className: "text-2xl font-bold text-blue-600"
  }, filteredData.gradeData['11']?.testsCompleted || 0)), React.createElement("div", {
    className: "flex justify-between items-center p-3 bg-white rounded-lg shadow"
  }, React.createElement("span", {
    className: "font-semibold"
  }, "Tests Pending:"), React.createElement("span", {
    className: "text-2xl font-bold text-red-600"
  }, filteredData.gradeData['11']?.testsPending || 0)), React.createElement("div", {
    className: "mt-4 p-4 bg-green-600 text-white rounded-xl text-center"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Completion Rate"), React.createElement("div", {
    className: "text-4xl font-bold"
  }, filteredData.gradeData['11']?.total ? Math.round(filteredData.gradeData['11'].completed / filteredData.gradeData['11'].total * 100) : 0, "%")))), React.createElement("div", {
    className: "border-4 border-blue-500 rounded-2xl p-6 bg-gradient-to-br from-blue-50 to-cyan-50"
  }, React.createElement("h4", {
    className: "text-2xl font-bold text-blue-800 mb-4"
  }, "\uD83D\uDCD8 Class 12"), React.createElement("div", {
    className: "space-y-3"
  }, React.createElement("div", {
    className: "flex justify-between items-center p-3 bg-white rounded-lg shadow"
  }, React.createElement("span", {
    className: "font-semibold"
  }, "Total Chapters:"), React.createElement("span", {
    className: "text-2xl font-bold text-gray-800"
  }, filteredData.gradeData['12']?.total || 0)), React.createElement("div", {
    className: "flex justify-between items-center p-3 bg-white rounded-lg shadow"
  }, React.createElement("span", {
    className: "font-semibold"
  }, "Completed:"), React.createElement("span", {
    className: "text-2xl font-bold text-green-600"
  }, filteredData.gradeData['12']?.completed || 0)), React.createElement("div", {
    className: "flex justify-between items-center p-3 bg-white rounded-lg shadow"
  }, React.createElement("span", {
    className: "font-semibold"
  }, "Tests Completed:"), React.createElement("span", {
    className: "text-2xl font-bold text-blue-600"
  }, filteredData.gradeData['12']?.testsCompleted || 0)), React.createElement("div", {
    className: "flex justify-between items-center p-3 bg-white rounded-lg shadow"
  }, React.createElement("span", {
    className: "font-semibold"
  }, "Tests Pending:"), React.createElement("span", {
    className: "text-2xl font-bold text-red-600"
  }, filteredData.gradeData['12']?.testsPending || 0)), React.createElement("div", {
    className: "mt-4 p-4 bg-blue-600 text-white rounded-xl text-center"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Completion Rate"), React.createElement("div", {
    className: "text-4xl font-bold"
  }, filteredData.gradeData['12']?.total ? Math.round(filteredData.gradeData['12'].completed / filteredData.gradeData['12'].total * 100) : 0, "%")))))), React.createElement("div", {
    className: "grid md:grid-cols-2 lg:grid-cols-2 gap-6"
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
  })), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg",
    style: {
      height: '350px'
    }
  }, React.createElement("canvas", {
    ref: chart5Ref
  })), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg",
    style: {
      height: '350px'
    }
  }, React.createElement("canvas", {
    ref: chart6Ref
  })), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg",
    style: {
      height: '350px'
    }
  }, React.createElement("canvas", {
    ref: chart7Ref
  })), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg",
    style: {
      height: '350px'
    }
  }, React.createElement("canvas", {
    ref: chart8Ref
  }))));
}
function AdminChapterDetails({
  curriculum,
  chapterProgress
}) {
  const [filterSchool, setFilterSchool] = useState('All');
  const [filterSubject, setFilterSubject] = useState('All');
  const [filterGrade, setFilterGrade] = useState('All');
  const chapterDetails = useMemo(() => {
    const details = [];
    const schoolsToProcess = filterSchool === 'All' ? SCHOOLS : [filterSchool];
    const subjectsToProcess = filterSubject === 'All' ? SUBJECTS : [filterSubject];
    const gradesToProcess = filterGrade === 'All' ? ['11', '12'] : [filterGrade];
    schoolsToProcess.forEach(school => {
      subjectsToProcess.forEach(subject => {
        gradesToProcess.forEach(grade => {
          const docId = `${school}_${subject}_${grade}`;
          const chapters = curriculum[docId]?.chapters || [];
          chapters.forEach(ch => {
            const progressId = `${school}_${ch.id}`;
            const prog = chapterProgress[progressId] || {};
            details.push({
              school,
              subject,
              grade: `Class ${grade}`,
              chapterName: ch.name,
              targetDate: ch.targetDate || '—',
              completed: prog.completed || 'No',
              completionDate: prog.completionDate || '—',
              testConducted: prog.testConducted || 'No',
              notes: prog.notes || '—'
            });
          });
        });
      });
    });
    return details;
  }, [curriculum, chapterProgress, filterSchool, filterSubject, filterGrade]);
  const handleExport = () => {
    exportToExcel(chapterDetails, 'chapter_details');
  };
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("div", {
    className: "flex justify-between items-center"
  }, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "Chapter Details"), React.createElement("button", {
    onClick: handleExport,
    className: "px-6 py-3 bg-green-600 text-white rounded-xl font-semibold"
  }, "\uD83D\uDCCA Export to Excel")), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "font-bold mb-4"
  }, "Filters"), React.createElement("div", {
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
  }, "All Schools"), SCHOOLS.map(s => React.createElement("option", {
    key: s,
    value: s
  }, s)))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Subject"), React.createElement("select", {
    value: filterSubject,
    onChange: e => setFilterSubject(e.target.value),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  }, React.createElement("option", {
    value: "All"
  }, "All Subjects"), SUBJECTS.map(s => React.createElement("option", {
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
  }, "Class 12"))))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg overflow-x-auto"
  }, React.createElement("h3", {
    className: "font-bold mb-4"
  }, "All Chapters (", chapterDetails.length, ")"), React.createElement("table", {
    className: "w-full"
  }, React.createElement("thead", {
    className: "avanti-gradient-light"
  }, React.createElement("tr", null, React.createElement("th", {
    className: "p-3 text-left"
  }, "School"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Subject"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Grade"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Chapter Name"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Target Date"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Completed"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Completion Date"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Test Conducted"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Notes"))), React.createElement("tbody", null, chapterDetails.length === 0 ? React.createElement("tr", null, React.createElement("td", {
    colSpan: "9",
    className: "p-8 text-center text-gray-500"
  }, "No chapters found")) : chapterDetails.map((ch, idx) => React.createElement("tr", {
    key: idx,
    className: "border-b hover:bg-gray-50"
  }, React.createElement("td", {
    className: "p-3"
  }, ch.school), React.createElement("td", {
    className: "p-3"
  }, ch.subject), React.createElement("td", {
    className: "p-3"
  }, ch.grade), React.createElement("td", {
    className: "p-3 font-semibold"
  }, ch.chapterName), React.createElement("td", {
    className: "p-3 text-sm"
  }, ch.targetDate), React.createElement("td", {
    className: "p-3"
  }, React.createElement("span", {
    className: `px-2 py-1 rounded-full text-xs font-bold ${ch.completed === 'Yes' ? 'bg-green-100 text-green-700' : 'bg-gray-100'}`
  }, ch.completed)), React.createElement("td", {
    className: "p-3 text-sm"
  }, ch.completionDate), React.createElement("td", {
    className: "p-3"
  }, React.createElement("span", {
    className: `px-2 py-1 rounded-full text-xs font-bold ${ch.testConducted === 'Yes' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`
  }, ch.testConducted)), React.createElement("td", {
    className: "p-3 text-sm"
  }, ch.notes)))))));
}
function AdminSettings() {
  const [settings, setSettings] = useState({
    managerCanViewStudents: true,
    managerCanViewStudentProfiles: true,
    managerCanViewAnalytics: true,
    managerCanViewAttendance: true,
    managerCanViewObservations: true,
    managerCanExportData: true,
    teacherCanEditOwnAttendance: false,
    studentCanViewFeedback: true,
    enableEmailNotifications: true,
    enablePushNotifications: true,
    notifyOnNewTeacher: true,
    notifyOnNewStudent: true,
    notifyOnAttendanceAlert: true,
    autoArchiveAfterDays: 365,
    dataRetentionMonths: 24,
    appName: 'Curriculum Tracker',
    primaryColor: '#F4B41A',
    enableDarkMode: false,
    showWelcomeMessage: true,
    maintenanceMode: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const doc = await db.collection('app_settings').doc('global').get();
        if (doc.exists) {
          setSettings(prev => ({
            ...prev,
            ...doc.data()
          }));
        }
        setLoading(false);
      } catch (e) {
        console.error('Error loading settings:', e);
        setLoading(false);
      }
    };
    loadSettings();
  }, []);
  const handleSave = async () => {
    setSaving(true);
    try {
      await db.collection('app_settings').doc('global').set({
        ...settings,
        updatedAt: new Date().toISOString()
      });
      setSuccessMessage('✅ Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (e) {
      console.error('Error saving settings:', e);
      alert('❌ Error saving settings: ' + e.message);
    }
    setSaving(false);
  };
  const ToggleSwitch = ({
    checked,
    onChange,
    label,
    description
  }) => React.createElement("div", {
    className: "flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
  }, React.createElement("div", null, React.createElement("div", {
    className: "font-medium text-gray-800"
  }, label), description && React.createElement("div", {
    className: "text-sm text-gray-500"
  }, description)), React.createElement("button", {
    onClick: () => onChange(!checked),
    className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-gray-300'}`
  }, React.createElement("span", {
    className: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`
  })));
  if (loading) {
    return React.createElement("div", {
      className: "text-center py-12"
    }, React.createElement("div", {
      className: "animate-spin text-4xl mb-4"
    }, "\u23F3"), React.createElement("p", null, "Loading settings..."));
  }
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("div", {
    className: "flex justify-between items-center"
  }, React.createElement("div", null, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "\u2699\uFE0F Admin Settings"), React.createElement("p", {
    className: "text-gray-500 mt-1"
  }, "Configure application settings and access controls")), React.createElement("button", {
    onClick: handleSave,
    disabled: saving,
    className: "px-6 py-3 bg-green-600 text-white rounded-xl font-semibold disabled:opacity-50"
  }, saving ? '💾 Saving...' : '💾 Save Settings')), successMessage && React.createElement("div", {
    className: "bg-green-50 border-2 border-green-300 p-4 rounded-xl text-green-800 font-semibold"
  }, successMessage), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4 flex items-center gap-2"
  }, "\uD83D\uDC54 Manager Access Controls"), React.createElement("p", {
    className: "text-sm text-gray-500 mb-4"
  }, "Configure what managers (PM, APM, APH) can access"), React.createElement(ToggleSwitch, {
    checked: settings.managerCanViewStudents,
    onChange: val => setSettings({
      ...settings,
      managerCanViewStudents: val
    }),
    label: "View Student Management",
    description: "Allow managers to view student list (read-only)"
  }), React.createElement(ToggleSwitch, {
    checked: settings.managerCanViewStudentProfiles,
    onChange: val => setSettings({
      ...settings,
      managerCanViewStudentProfiles: val
    }),
    label: "View Student Profiles",
    description: "Allow managers to view detailed student profiles with demographics"
  }), React.createElement(ToggleSwitch, {
    checked: settings.managerCanViewAnalytics,
    onChange: val => setSettings({
      ...settings,
      managerCanViewAnalytics: val
    }),
    label: "View Analytics",
    description: "Allow managers to access analytics dashboards"
  }), React.createElement(ToggleSwitch, {
    checked: settings.managerCanViewAttendance,
    onChange: val => setSettings({
      ...settings,
      managerCanViewAttendance: val
    }),
    label: "View Attendance",
    description: "Allow managers to view attendance records"
  }), React.createElement(ToggleSwitch, {
    checked: settings.managerCanViewObservations,
    onChange: val => setSettings({
      ...settings,
      managerCanViewObservations: val
    }),
    label: "View Classroom Observations",
    description: "Allow managers to view and create classroom observations"
  }), React.createElement(ToggleSwitch, {
    checked: settings.managerCanExportData,
    onChange: val => setSettings({
      ...settings,
      managerCanExportData: val
    }),
    label: "Export Data",
    description: "Allow managers to export data to Excel/CSV"
  })), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4 flex items-center gap-2"
  }, "\uD83D\uDC65 Teacher Settings"), React.createElement(ToggleSwitch, {
    checked: settings.teacherCanEditOwnAttendance,
    onChange: val => setSettings({
      ...settings,
      teacherCanEditOwnAttendance: val
    }),
    label: "Edit Own Attendance",
    description: "Allow teachers to modify their own attendance records"
  })), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4 flex items-center gap-2"
  }, "\uD83C\uDF93 Student Settings"), React.createElement(ToggleSwitch, {
    checked: settings.studentCanViewFeedback,
    onChange: val => setSettings({
      ...settings,
      studentCanViewFeedback: val
    }),
    label: "View Feedback Results",
    description: "Allow students to view feedback summary for their teachers"
  })), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4 flex items-center gap-2"
  }, "\uD83D\uDD14 Notification Settings"), React.createElement(ToggleSwitch, {
    checked: settings.enableEmailNotifications,
    onChange: val => setSettings({
      ...settings,
      enableEmailNotifications: val
    }),
    label: "Email Notifications",
    description: "Enable email notifications for important events"
  }), React.createElement(ToggleSwitch, {
    checked: settings.enablePushNotifications,
    onChange: val => setSettings({
      ...settings,
      enablePushNotifications: val
    }),
    label: "Push Notifications",
    description: "Enable browser push notifications"
  }), React.createElement(ToggleSwitch, {
    checked: settings.notifyOnNewTeacher,
    onChange: val => setSettings({
      ...settings,
      notifyOnNewTeacher: val
    }),
    label: "New Teacher Alert",
    description: "Notify when a new teacher is added"
  }), React.createElement(ToggleSwitch, {
    checked: settings.notifyOnNewStudent,
    onChange: val => setSettings({
      ...settings,
      notifyOnNewStudent: val
    }),
    label: "New Student Alert",
    description: "Notify when new students are added"
  }), React.createElement(ToggleSwitch, {
    checked: settings.notifyOnAttendanceAlert,
    onChange: val => setSettings({
      ...settings,
      notifyOnAttendanceAlert: val
    }),
    label: "Attendance Alerts",
    description: "Notify when attendance drops below threshold"
  })), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4 flex items-center gap-2"
  }, "\uD83D\uDDC4\uFE0F Data Management"), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Auto-archive after (days)"), React.createElement("input", {
    type: "number",
    value: settings.autoArchiveAfterDays,
    onChange: e => setSettings({
      ...settings,
      autoArchiveAfterDays: parseInt(e.target.value) || 365
    }),
    className: "w-full border-2 px-4 py-3 rounded-xl",
    min: "30",
    max: "730"
  }), React.createElement("p", {
    className: "text-xs text-gray-500 mt-1"
  }, "Old data will be archived after this many days")), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Data retention (months)"), React.createElement("input", {
    type: "number",
    value: settings.dataRetentionMonths,
    onChange: e => setSettings({
      ...settings,
      dataRetentionMonths: parseInt(e.target.value) || 24
    }),
    className: "w-full border-2 px-4 py-3 rounded-xl",
    min: "6",
    max: "60"
  }), React.createElement("p", {
    className: "text-xs text-gray-500 mt-1"
  }, "Archived data will be retained for this duration")))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4 flex items-center gap-2"
  }, "\uD83C\uDFA8 App Customization"), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4 mb-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "App Name"), React.createElement("input", {
    type: "text",
    value: settings.appName,
    onChange: e => setSettings({
      ...settings,
      appName: e.target.value
    }),
    className: "w-full border-2 px-4 py-3 rounded-xl"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Primary Color"), React.createElement("div", {
    className: "flex gap-2"
  }, React.createElement("input", {
    type: "color",
    value: settings.primaryColor,
    onChange: e => setSettings({
      ...settings,
      primaryColor: e.target.value
    }),
    className: "w-16 h-12 border-2 rounded-xl cursor-pointer"
  }), React.createElement("input", {
    type: "text",
    value: settings.primaryColor,
    onChange: e => setSettings({
      ...settings,
      primaryColor: e.target.value
    }),
    className: "flex-1 border-2 px-4 py-3 rounded-xl font-mono"
  })))), React.createElement(ToggleSwitch, {
    checked: settings.showWelcomeMessage,
    onChange: val => setSettings({
      ...settings,
      showWelcomeMessage: val
    }),
    label: "Show Welcome Message",
    description: "Display welcome message on dashboard"
  }), React.createElement(ToggleSwitch, {
    checked: settings.enableDarkMode,
    onChange: val => setSettings({
      ...settings,
      enableDarkMode: val
    }),
    label: "Enable Dark Mode Option",
    description: "Allow users to switch to dark mode (coming soon)"
  })), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg border-2 border-red-200"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4 flex items-center gap-2 text-red-600"
  }, "\uD83D\uDEA7 Maintenance Mode"), React.createElement(ToggleSwitch, {
    checked: settings.maintenanceMode,
    onChange: val => setSettings({
      ...settings,
      maintenanceMode: val
    }),
    label: "Enable Maintenance Mode",
    description: "\u26A0\uFE0F When enabled, only Super Admins can access the application"
  }), settings.maintenanceMode && React.createElement("div", {
    className: "mt-4 p-4 bg-red-50 rounded-xl text-red-800"
  }, React.createElement("strong", null, "\u26A0\uFE0F Warning:"), " Maintenance mode is enabled. All users except Super Admins will see a maintenance message.")), React.createElement("div", {
    className: "bg-gray-50 p-6 rounded-2xl"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "\uD83D\uDCCA System Information"), React.createElement("div", {
    className: "grid md:grid-cols-3 gap-4 text-sm"
  }, React.createElement("div", {
    className: "bg-white p-4 rounded-xl"
  }, React.createElement("div", {
    className: "text-gray-500"
  }, "Version"), React.createElement("div", {
    className: "font-bold text-lg"
  }, "2.0.0")), React.createElement("div", {
    className: "bg-white p-4 rounded-xl"
  }, React.createElement("div", {
    className: "text-gray-500"
  }, "Last Updated"), React.createElement("div", {
    className: "font-bold text-lg"
  }, new Date().toLocaleDateString())), React.createElement("div", {
    className: "bg-white p-4 rounded-xl"
  }, React.createElement("div", {
    className: "text-gray-500"
  }, "Database"), React.createElement("div", {
    className: "font-bold text-lg"
  }, "Firebase Firestore")))));
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
  const [filterSubject, setFilterSubject] = useState('All');
  const today = getTodayDate();
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const mySchool = currentUser.school;
  const chart1Ref = useRef(null);
  const chart2Ref = useRef(null);
  const chart3Ref = useRef(null);
  const chartInstances = useRef({});
  const filteredStudentAttendance = useMemo(() => {
    return studentAttendance.filter(a => {
      if (a.school !== mySchool) return false;
      if (filterGrade !== 'All' && a.grade !== filterGrade) return false;
      if (a.date < startDate || a.date > endDate) return false;
      return true;
    });
  }, [studentAttendance, mySchool, filterGrade, startDate, endDate]);
  const filteredTeacherAttendance = useMemo(() => {
    return teacherAttendance.filter(a => {
      if (a.school !== mySchool) return false;
      if (filterSubject !== 'All') {
        const teacher = teachers.find(t => t.afid === a.teacherId);
        if (!teacher || teacher.subject !== filterSubject) return false;
      }
      if (a.date < startDate || a.date > endDate) return false;
      return true;
    });
  }, [teacherAttendance, mySchool, teachers, filterSubject, startDate, endDate]);
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
  const teacherStats = useMemo(() => {
    const present = filteredTeacherAttendance.filter(a => a.status === 'Present').length;
    const onLeave = filteredTeacherAttendance.filter(a => a.status === 'On Leave').length;
    return {
      present,
      onLeave
    };
  }, [filteredTeacherAttendance]);
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
    if (chart3Ref.current) {
      const ctx = chart3Ref.current.getContext('2d');
      chartInstances.current.chart3 = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['Present', 'On Leave'],
          datasets: [{
            data: [teacherStats.present, teacherStats.onLeave],
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
              text: 'Teacher Attendance',
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
  }, [dailyStats, gradeStats, teacherStats]);
  const handleExportStudents = () => {
    const exportData = filteredStudentAttendance.map(a => ({
      Date: a.date,
      Grade: a.grade,
      'Student Name': a.studentName,
      Status: a.status,
      Remarks: a.remarks || '',
      'Marked By': a.markedBy
    }));
    exportToExcel(exportData, `student_attendance_${mySchool}_${startDate}_to_${endDate}`);
  };
  const handleExportTeachers = () => {
    const exportData = filteredTeacherAttendance.map(a => ({
      Date: a.date,
      'Teacher Name': a.teacherName,
      'Punch-In Time': a.punchInTime || 'Not recorded',
      Status: a.status,
      Reason: a.reason,
      Location: a.location
    }));
    exportToExcel(exportData, `teacher_attendance_${mySchool}_${startDate}_to_${endDate}`);
  };
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("div", {
    className: "flex justify-between items-center"
  }, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "\uD83D\uDCCA Attendance Dashboard - ", mySchool)), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "\uD83D\uDD0D Filters"), React.createElement("div", {
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
  }, "Teacher Subject"), React.createElement("select", {
    value: filterSubject,
    onChange: e => setFilterSubject(e.target.value),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  }, React.createElement("option", {
    value: "All"
  }, "All Subjects"), SUBJECTS.map(s => React.createElement("option", {
    key: s,
    value: s
  }, s)))), React.createElement("div", null, React.createElement("label", {
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
  }, "\uD83D\uDCE5 Export Student Attendance"), React.createElement("button", {
    onClick: handleExportTeachers,
    className: "px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold"
  }, "\uD83D\uDCE5 Export Teacher Attendance"))), React.createElement("div", {
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
  }, filteredStudentAttendance.filter(a => a.status === 'Absent').length)), React.createElement("div", {
    className: "stat-card bg-blue-500 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Teachers Present"), React.createElement("div", {
    className: "text-4xl font-bold"
  }, teacherStats.present)), React.createElement("div", {
    className: "stat-card bg-orange-500 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Teachers on Leave"), React.createElement("div", {
    className: "text-4xl font-bold"
  }, teacherStats.onLeave))), React.createElement("div", {
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
    className: "bg-white p-6 rounded-2xl shadow-lg",
    style: {
      height: '350px'
    }
  }, React.createElement("canvas", {
    ref: chart3Ref
  })), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-6"
  }, React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "\uD83D\uDCCB Recent Student Attendance"), React.createElement("div", {
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
  }, a.status)))))))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "\uD83D\uDC65 Teacher Attendance Records"), React.createElement("div", {
    className: "overflow-x-auto max-h-96"
  }, React.createElement("table", {
    className: "w-full"
  }, React.createElement("thead", {
    className: "avanti-gradient-light sticky top-0"
  }, React.createElement("tr", null, React.createElement("th", {
    className: "p-3 text-left"
  }, "Date"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Teacher"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Punch-In"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Status"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Reason"))), React.createElement("tbody", null, filteredTeacherAttendance.slice(0, 50).map((a, idx) => React.createElement("tr", {
    key: idx,
    className: "border-b hover:bg-gray-50"
  }, React.createElement("td", {
    className: "p-3 text-sm"
  }, a.date), React.createElement("td", {
    className: "p-3 font-semibold"
  }, a.teacherName), React.createElement("td", {
    className: "p-3"
  }, React.createElement("span", {
    className: "font-mono font-bold text-blue-600"
  }, "\u23F0 ", a.punchInTime || '--:--')), React.createElement("td", {
    className: "p-3"
  }, React.createElement("span", {
    className: `px-2 py-1 rounded-full text-xs font-bold ${a.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`
  }, a.status)), React.createElement("td", {
    className: "p-3 text-sm"
  }, a.reason)))))))));
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
      alert('All students marked present!');
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
function TeacherAttendanceView({
  currentUser,
  teacherAttendance,
  leaveAdjustments
}) {
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [endDate, setEndDate] = useState(getTodayDate());
  const [isDateRange, setIsDateRange] = useState(false);
  const [status, setStatus] = useState('Present');
  const [reason, setReason] = useState('Present');
  const [compOffWorkedDate, setCompOffWorkedDate] = useState('');
  const [location, setLocation] = useState('');
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localSubmittedAttendance, setLocalSubmittedAttendance] = useState([]);
  const [gpsVerified, setGpsVerified] = useState(false);
  const today = new Date();
  const maxDate = useMemo(() => {
    if (status === 'On Leave') {
      const d = new Date();
      d.setDate(d.getDate() + 10);
      return d.toISOString().split('T')[0];
    }
    return getTodayDate();
  }, [status]);
  const minDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    return d.toISOString().split('T')[0];
  }, []);
  const allAttendance = useMemo(() => {
    const merged = [...teacherAttendance];
    localSubmittedAttendance.forEach(local => {
      if (!merged.some(a => a.teacherId === local.teacherId && a.date === local.date)) {
        merged.push(local);
      }
    });
    return merged;
  }, [teacherAttendance, localSubmittedAttendance]);
  const todayRecord = allAttendance.find(a => a.teacherId === currentUser.afid && a.date === selectedDate);
  const hasExistingAttendance = useMemo(() => {
    return allAttendance.some(a => a.teacherId === currentUser.afid && a.date === selectedDate);
  }, [allAttendance, currentUser.afid, selectedDate]);
  const leaveBalance = useMemo(() => {
    return calculateLeaveBalance(allAttendance, currentUser.afid, leaveAdjustments || {});
  }, [allAttendance, currentUser.afid, leaveAdjustments]);
  useEffect(() => {
    if (todayRecord) {
      setStatus(todayRecord.status);
      setReason(todayRecord.reason || 'Present');
      setLocation(todayRecord.location || '');
      setGpsVerified(true);
    }
  }, [todayRecord]);
  useEffect(() => {
    if (status === 'Present') {
      setIsDateRange(false);
      setEndDate(selectedDate);
      setCompOffWorkedDate('');
    }
  }, [status, selectedDate]);
  useEffect(() => {
    if (status === 'On Leave') {
      setGpsVerified(true);
      setLocation('Leave - GPS not required');
    } else {
      setGpsVerified(false);
      setLocation('');
    }
  }, [status]);
  useEffect(() => {
    if (reason !== 'Comp Off') {
      setCompOffWorkedDate('');
    }
  }, [reason]);
  const getLocation = () => {
    setFetchingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(position => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        const accuracy = Math.round(position.coords.accuracy);
        const loc = `${lat}, ${lng} (±${accuracy}m)`;
        setLocation(loc);
        setGpsVerified(true);
        setFetchingLocation(false);
      }, error => {
        let errorMsg = 'Unable to fetch location. ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg += 'Please enable location permission in your browser/phone settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg += 'Location information unavailable. Please try again.';
            break;
          case error.TIMEOUT:
            errorMsg += 'Location request timed out. Please try again.';
            break;
          default:
            errorMsg += 'Please try again.';
        }
        alert(errorMsg);
        setFetchingLocation(false);
      }, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      });
    } else {
      alert('Geolocation not supported by your browser');
      setFetchingLocation(false);
    }
  };
  const getDateRange = (start, end) => {
    const dates = [];
    let currentDate = new Date(start);
    const endDateObj = new Date(end);
    while (currentDate <= endDateObj) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  };
  const daysToMark = useMemo(() => {
    if (!isDateRange || status === 'Present') return 1;
    return getDateRange(selectedDate, endDate).length;
  }, [isDateRange, selectedDate, endDate, status]);
  const handleSubmit = async () => {
    if (status !== 'Present' && !reason) {
      alert('Please select a reason');
      return;
    }
    if (reason === 'Comp Off' && !compOffWorkedDate) {
      alert('Please select the date when you worked for Comp Off');
      return;
    }
    if (status === 'Present' && !gpsVerified) {
      alert('📍 GPS verification required!\n\nPlease click "Get GPS Location" button to verify your location before marking attendance.');
      return;
    }
    if (isDateRange && endDate < selectedDate) {
      alert('End date must be after or equal to start date');
      return;
    }
    if (status === 'On Leave') {
      if (ENTITLED_LEAVE_TYPES.includes(reason) && daysToMark > leaveBalance.entitled.remaining) {
        const proceed = confirm(`Warning: You only have ${leaveBalance.entitled.remaining} entitled leave days remaining, but you're marking ${daysToMark} days.\n\nDo you want to continue?`);
        if (!proceed) return;
      }
      if (MATERNITY_LEAVE_TYPES.includes(reason) && daysToMark > leaveBalance.maternity.remaining) {
        const proceed = confirm(`Warning: You only have ${leaveBalance.maternity.remaining} maternity leave days remaining, but you're marking ${daysToMark} days.\n\nDo you want to continue?`);
        if (!proceed) return;
      }
      if (PATERNITY_LEAVE_TYPES.includes(reason) && daysToMark > leaveBalance.paternity.remaining) {
        const proceed = confirm(`Warning: You only have ${leaveBalance.paternity.remaining} paternity leave days remaining, but you're marking ${daysToMark} days.\n\nDo you want to continue?`);
        if (!proceed) return;
      }
    }
    setSubmitting(true);
    try {
      const now = new Date();
      const punchInTime = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      const datesToMark = isDateRange && status === 'On Leave' ? getDateRange(selectedDate, endDate) : [selectedDate];
      const batch = db.batch();
      const newLocalRecords = [];
      datesToMark.forEach(date => {
        const docId = `${currentUser.afid}_${date}`;
        const docRef = db.collection('teacherAttendance').doc(docId);
        const recordData = {
          teacherId: currentUser.afid,
          teacherName: currentUser.name,
          school: currentUser.school,
          date: date,
          status,
          reason: status === 'Present' ? 'Present' : reason,
          compOffWorkedDate: reason === 'Comp Off' ? compOffWorkedDate : null,
          location: location || 'Not provided',
          punchInTime: date === getTodayDate() ? punchInTime : 'Leave applied',
          markedAt: new Date().toISOString(),
          isPartOfRange: datesToMark.length > 1,
          rangeStart: datesToMark.length > 1 ? selectedDate : null,
          rangeEnd: datesToMark.length > 1 ? endDate : null,
          gpsVerified: gpsVerified
        };
        batch.set(docRef, recordData);
        newLocalRecords.push(recordData);
      });
      await batch.commit();
      setLocalSubmittedAttendance(prev => [...prev, ...newLocalRecords]);
      if (datesToMark.length > 1) {
        alert(`✅ Leave marked for ${datesToMark.length} days!\nFrom: ${selectedDate}\nTo: ${endDate}\n\nYour leave balance has been updated.`);
      } else {
        alert(`✅ Attendance marked!\nPunch-in time: ${punchInTime}\nLocation: ${location}`);
      }
      setIsDateRange(false);
      setEndDate(selectedDate);
    } catch (e) {
      alert('Failed: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "My Attendance"), React.createElement("div", {
    className: "grid md:grid-cols-3 gap-4"
  }, React.createElement("div", {
    className: "bg-white p-4 rounded-xl shadow-lg border-l-4 border-blue-500"
  }, React.createElement("div", {
    className: "flex justify-between items-center"
  }, React.createElement("div", null, React.createElement("p", {
    className: "text-sm text-gray-600"
  }, "Entitled Leave"), React.createElement("p", {
    className: "text-2xl font-bold text-blue-600"
  }, leaveBalance.entitled.remaining, "/", leaveBalance.entitled.total)), React.createElement("div", {
    className: "text-right"
  }, React.createElement("span", {
    className: "text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
  }, "Used: ", leaveBalance.entitled.used))), React.createElement("div", {
    className: "mt-2 bg-gray-200 rounded-full h-2"
  }, React.createElement("div", {
    className: "bg-blue-500 h-2 rounded-full transition-all",
    style: {
      width: `${leaveBalance.entitled.remaining / leaveBalance.entitled.total * 100}%`
    }
  }))), React.createElement("div", {
    className: "bg-white p-4 rounded-xl shadow-lg border-l-4 border-pink-500"
  }, React.createElement("div", {
    className: "flex justify-between items-center"
  }, React.createElement("div", null, React.createElement("p", {
    className: "text-sm text-gray-600"
  }, "Maternity Leave"), React.createElement("p", {
    className: "text-2xl font-bold text-pink-600"
  }, leaveBalance.maternity.remaining, "/", leaveBalance.maternity.total)), React.createElement("div", {
    className: "text-right"
  }, React.createElement("span", {
    className: "text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full"
  }, "Used: ", leaveBalance.maternity.used))), React.createElement("div", {
    className: "mt-2 bg-gray-200 rounded-full h-2"
  }, React.createElement("div", {
    className: "bg-pink-500 h-2 rounded-full transition-all",
    style: {
      width: `${leaveBalance.maternity.remaining / leaveBalance.maternity.total * 100}%`
    }
  }))), React.createElement("div", {
    className: "bg-white p-4 rounded-xl shadow-lg border-l-4 border-purple-500"
  }, React.createElement("div", {
    className: "flex justify-between items-center"
  }, React.createElement("div", null, React.createElement("p", {
    className: "text-sm text-gray-600"
  }, "Paternity Leave"), React.createElement("p", {
    className: "text-2xl font-bold text-purple-600"
  }, leaveBalance.paternity.remaining, "/", leaveBalance.paternity.total)), React.createElement("div", {
    className: "text-right"
  }, React.createElement("span", {
    className: "text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full"
  }, "Used: ", leaveBalance.paternity.used))), React.createElement("div", {
    className: "mt-2 bg-gray-200 rounded-full h-2"
  }, React.createElement("div", {
    className: "bg-purple-500 h-2 rounded-full transition-all",
    style: {
      width: `${leaveBalance.paternity.remaining / leaveBalance.paternity.total * 100}%`
    }
  })))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg max-w-2xl mx-auto"
  }, React.createElement("div", {
    className: "space-y-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Status *"), React.createElement("div", {
    className: "flex gap-3"
  }, React.createElement("button", {
    onClick: () => {
      setStatus('Present');
      setReason('Present');
    },
    className: `flex-1 py-3 rounded-xl font-semibold ${status === 'Present' ? 'bg-green-500 text-white' : 'bg-gray-200'}`
  }, "\u2713 Present"), React.createElement("button", {
    onClick: () => setStatus('On Leave'),
    className: `flex-1 py-3 rounded-xl font-semibold ${status === 'On Leave' ? 'bg-orange-500 text-white' : 'bg-gray-200'}`
  }, "\uD83D\uDCC5 On Leave"))), status === 'On Leave' && React.createElement(React.Fragment, null, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Reason *"), React.createElement("select", {
    value: reason,
    onChange: e => setReason(e.target.value),
    className: "w-full border-2 px-4 py-3 rounded-xl"
  }, LEAVE_REASONS.filter(r => r !== 'Present').map(r => React.createElement("option", {
    key: r,
    value: r
  }, r)))), reason === 'Comp Off' && React.createElement("div", {
    className: "mt-4 p-4 bg-purple-50 rounded-xl border-2 border-purple-200"
  }, React.createElement("label", {
    className: "block text-sm font-bold mb-2 text-purple-800"
  }, "\uD83D\uDCC5 When did you work? ", React.createElement("span", {
    className: "text-red-500"
  }, "*")), React.createElement("p", {
    className: "text-xs text-purple-600 mb-3"
  }, "Select the date when you worked extra (within last 2 weeks only)"), React.createElement("input", {
    type: "date",
    value: compOffWorkedDate,
    max: getTodayDate(),
    min: (() => { const d = new Date(); d.setDate(d.getDate() - 14); return d.toISOString().split('T')[0]; })(),
    onChange: e => setCompOffWorkedDate(e.target.value),
    className: "w-full border-2 px-4 py-3 rounded-xl border-purple-300 focus:border-purple-500 focus:outline-none"
  }), compOffWorkedDate && React.createElement("p", {
    className: "text-sm text-purple-700 mt-2"
  }, "\u2713 Worked on: ", compOffWorkedDate)), React.createElement("div", {
    className: "bg-blue-50 p-4 rounded-xl border-2 border-blue-200"
  }, React.createElement("label", {
    className: "flex items-center gap-3 cursor-pointer"
  }, React.createElement("input", {
    type: "checkbox",
    checked: isDateRange,
    onChange: e => {
      setIsDateRange(e.target.checked);
      if (!e.target.checked) {
        setEndDate(selectedDate);
      }
    },
    className: "w-5 h-5 rounded"
  }), React.createElement("span", {
    className: "font-semibold text-blue-800"
  }, "Apply leave for multiple days")), React.createElement("p", {
    className: "text-sm text-blue-600 mt-1 ml-8"
  }, "Enable this if you're taking 2 or more days of leave"))), React.createElement("div", {
    className: `grid ${isDateRange && status === 'On Leave' ? 'md:grid-cols-2' : 'grid-cols-1'} gap-4`
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, isDateRange && status === 'On Leave' ? 'Start Date' : 'Date'), React.createElement("input", {
    type: "date",
    value: selectedDate,
    min: minDate,
    max: maxDate,
    onChange: e => {
      setSelectedDate(e.target.value);
      if (!isDateRange || e.target.value > endDate) {
        setEndDate(e.target.value);
      }
    },
    className: "w-full border-2 px-4 py-3 rounded-xl"
  }), React.createElement("p", {
    className: "text-xs text-gray-500 mt-1"
  }, status === 'On Leave' ? "\uD83D\uDCC5 Leave: up to 10 days ahead & 2 days back" : "\uD83D\uDCC5 Attendance: today and previous 2 days only")), isDateRange && status === 'On Leave' && React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "End Date"), React.createElement("input", {
    type: "date",
    value: endDate,
    min: selectedDate,
    max: maxDate,
    onChange: e => setEndDate(e.target.value),
    className: "w-full border-2 px-4 py-3 rounded-xl"
  }))), isDateRange && status === 'On Leave' && daysToMark > 0 && React.createElement("div", {
    className: "bg-yellow-50 p-4 rounded-xl border-2 border-yellow-300"
  }, React.createElement("p", {
    className: "font-semibold text-yellow-800"
  }, "\uD83D\uDCC5 ", daysToMark, " day", daysToMark > 1 ? 's' : '', " will be marked as ", reason), React.createElement("p", {
    className: "text-sm text-yellow-700 mt-1"
  }, "From ", selectedDate, " to ", endDate)), status === 'Present' && React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "\uD83D\uDCCD GPS Location ", React.createElement("span", {
    className: "text-red-500"
  }, "*"), gpsVerified && React.createElement("span", {
    className: "text-green-600 text-xs ml-2"
  }, "\u2713 Verified")), React.createElement("div", {
    className: "bg-blue-50 p-3 rounded-xl border-2 border-blue-200 mb-3"
  }, React.createElement("p", {
    className: "text-sm text-blue-800 font-semibold"
  }, "\uD83D\uDCCD GPS verification is mandatory"), React.createElement("p", {
    className: "text-xs text-blue-600 mt-1"
  }, "You must fetch your GPS location to mark attendance. Manual entry is not allowed.")), React.createElement("div", {
    className: "flex gap-2"
  }, React.createElement("input", {
    type: "text",
    value: location,
    readOnly: true,
    className: "flex-1 border-2 px-4 py-3 rounded-xl bg-gray-100 cursor-not-allowed",
    placeholder: "Click 'Get GPS Location' button \u2192"
  }), React.createElement("button", {
    onClick: getLocation,
    disabled: fetchingLocation || gpsVerified,
    className: `px-6 py-3 rounded-xl font-semibold disabled:opacity-50 transition-all ${gpsVerified ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`
  }, fetchingLocation ? '📍 Fetching...' : gpsVerified ? '✓ GPS Verified' : '📍 Get GPS Location')), location && gpsVerified && React.createElement("div", {
    className: "mt-2 p-2 bg-green-50 rounded-lg border border-green-200"
  }, React.createElement("p", {
    className: "text-sm text-green-700"
  }, "\u2713 Location captured: ", location)), !gpsVerified && React.createElement("p", {
    className: "text-xs text-red-500 mt-2"
  }, "\u26A0\uFE0F Please click \"Get GPS Location\" to verify your location before submitting")), hasExistingAttendance && React.createElement("div", {
    className: "bg-amber-50 p-4 rounded-xl border-2 border-amber-300"
  }, React.createElement("p", {
    className: "font-semibold text-amber-800"
  }, "\uD83D\uDD12 Attendance already marked for ", selectedDate), React.createElement("p", {
    className: "text-sm text-amber-700 mt-1"
  }, "Once attendance is submitted, it cannot be modified. Please contact your admin if you need to make changes.")), React.createElement("button", {
    onClick: handleSubmit,
    disabled: submitting || hasExistingAttendance || status === 'Present' && !gpsVerified,
    className: `w-full py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all ${hasExistingAttendance ? 'bg-gray-400 text-white' : status === 'Present' && !gpsVerified ? 'bg-red-400 text-white' : 'avanti-gradient text-white'}`
  }, submitting ? 'Submitting...' : hasExistingAttendance ? '🔒 Already Marked (No Changes Allowed)' : status === 'Present' && !gpsVerified ? '📍 GPS Verification Required' : isDateRange && status === 'On Leave' ? `Submit Leave (${daysToMark} days)` : 'Submit Attendance'), todayRecord && React.createElement("div", {
    className: "mt-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl"
  }, React.createElement("h4", {
    className: "font-bold text-green-800 mb-2"
  }, "\u2713 Already Marked for ", selectedDate), React.createElement("p", null, React.createElement("strong", null, "Status:"), " ", todayRecord.status), React.createElement("p", null, React.createElement("strong", null, "Reason:"), " ", todayRecord.reason), todayRecord.compOffWorkedDate && React.createElement("p", null, React.createElement("strong", null, "Comp Off Worked Date:"), " ", todayRecord.compOffWorkedDate), React.createElement("p", null, React.createElement("strong", null, "Punch-in Time:"), " \u23F0 ", todayRecord.punchInTime || 'Not recorded'), React.createElement("p", null, React.createElement("strong", null, "Location:"), " ", todayRecord.location), todayRecord.gpsVerified && React.createElement("p", {
    className: "text-xs text-green-600 mt-1"
  }, "\u2713 GPS Verified")))));
}
