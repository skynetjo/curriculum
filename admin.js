// ✅ CURRICULUM TRACKER v5.6.8 - CHUNK 2: Admin + Attendance Features
// Loaded in parallel with app.js, executes after app.js
// Contains: AdminView, TeacherManagement, StudentManagement,
//           StudentAttendanceView

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
  leaveAdjustments,
  setLeaveAdjustments,
  managers,
  isSuperAdmin,
  accessibleSchools,
  academicYearSettings,
  floatingCelebration,
  setFloatingCelebration
}) {
  const [activeTab, setActiveTab] = useState(isSuperAdmin ? 'managers' : 'teachers');
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
  }] : []), {
    id: 'teachers',
    label: 'Teachers',
    icon: React.createElement("i", {
      className: "fa-solid fa-users"
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
  }), activeTab === 'attendance' && React.createElement(AdminAttendanceAnalytics, {
    students: filteredStudents,
    teachers: filteredTeachers,
    studentAttendance: filteredStudentAttendance,
    teacherAttendance: filteredTeacherAttendance,
    accessibleSchools: availableSchools,
    isSuperAdmin: isSuperAdmin,
    isDirector: isDirector
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
  }), activeTab === 'timetable' && React.createElement(TimetableAdminSection, {
    currentUser: currentUser,
    availableSchools: availableSchools
  }))), React.createElement("footer", {
    className: "bg-gray-800 text-white text-center py-4"
  }, React.createElement("p", null, "Made by Anand with \u2764\uFE0F")));
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
function AdminTeacherAttendanceOverride({ accessibleSchools, isSuperAdmin }) {
  if (!isSuperAdmin) return null;
  const REASONS_PRESENT = ['Present'];
  const REASONS_LEAVE = ['Personal Leave', 'Sick Leave', 'Weekly Off', 'Public Holiday', 'Organization Holiday', 'School Holiday', 'Emergency Leave', 'Maternity Leave', 'Paternity Leave', 'Comp Off'];
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [teachers, setTeachers] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loadingData, setLoadingData] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!selectedSchool) { setTeachers([]); setAttendanceMap({}); return; }
    setLoadingData(true);
    let teacherList = [];
    db.collection('teachers').where('school', '==', selectedSchool).where('isArchived', '==', false).get()
      .then(snap => {
        teacherList = snap.docs.map(d => ({ ...d.data(), docId: d.id }));
        setTeachers(teacherList);
        return db.collection('teacherAttendance').where('school', '==', selectedSchool).where('date', '==', selectedDate).get();
      })
      .then(snap => {
        const map = {};
        snap.docs.forEach(d => { map[d.data().teacherId] = { ...d.data(), docId: d.id }; });
        setAttendanceMap(map);
        setLoadingData(false);
      })
      .catch(() => setLoadingData(false));
  }, [selectedSchool, selectedDate]);
  const openEdit = teacher => {
    const existing = attendanceMap[teacher.afid] || null;
    const initStatus = existing ? existing.status : 'Present';
    const initReason = existing ? existing.reason : 'Present';
    setEditModal({ teacher, existing, status: initStatus, reason: initReason });
  };
  const saveAttendance = async () => {
    if (!editModal) return;
    setSaving(true);
    const { teacher, existing, status, reason } = editModal;
    const docId = `${teacher.afid}_${selectedDate}`;
    const record = {
      teacherId: teacher.afid,
      teacherName: teacher.name,
      school: teacher.school,
      date: selectedDate,
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
      setAttendanceMap(prev => ({ ...prev, [teacher.afid]: { ...record, docId } }));
      setEditModal(null);
    } catch (e) { alert('Error saving: ' + e.message); }
    setSaving(false);
  };
  const reasonsForStatus = status => status === 'Present' ? REASONS_PRESENT : REASONS_LEAVE;
  return React.createElement('div', { className: 'space-y-6' },
    React.createElement('div', null,
      React.createElement('h2', { className: 'text-3xl font-bold' }, '\uD83D\uDCCB Mark Teacher Attendance'),
      React.createElement('p', { className: 'text-gray-500 mt-1' }, 'Mark or edit teacher attendance for any date (Super Admin only)')),
    React.createElement('div', { className: 'bg-white p-6 rounded-2xl shadow-lg border border-gray-200' },
      React.createElement('div', { className: 'flex gap-4 flex-wrap' },
        React.createElement('div', { style: { flex: '1', minWidth: '200px' } },
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Date'),
          React.createElement('input', {
            type: 'date',
            value: selectedDate,
            onChange: e => setSelectedDate(e.target.value),
            className: 'w-full border border-gray-300 rounded-lg p-2 focus:border-blue-400 focus:outline-none'
          })),
        React.createElement('div', { style: { flex: '1', minWidth: '200px' } },
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'School'),
          React.createElement('select', {
            value: selectedSchool,
            onChange: e => setSelectedSchool(e.target.value),
            className: 'w-full border border-gray-300 rounded-lg p-2 focus:border-blue-400 focus:outline-none'
          },
            React.createElement('option', { value: '' }, '-- Select School --'),
            APPROVED_SCHOOLS.map(s => React.createElement('option', { key: s, value: s }, s)))))),
    selectedSchool && React.createElement('div', { className: 'bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden' },
      loadingData
        ? React.createElement('div', { className: 'text-center py-12 text-gray-500' }, '\u23F3 Loading teachers and attendance...')
        : teachers.length === 0
          ? React.createElement('div', { className: 'text-center py-12 text-gray-400' }, 'No active teachers found for this school.')
          : React.createElement('div', null,
              React.createElement('div', { className: 'px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center' },
                React.createElement('span', { className: 'font-semibold text-gray-700' }, selectedSchool + ' \u2014 ' + selectedDate),
                React.createElement('span', { className: 'text-sm text-gray-500' }, teachers.length + ' teachers, ' + Object.keys(attendanceMap).length + ' marked')),
              React.createElement('div', { className: 'overflow-x-auto' },
                React.createElement('table', { className: 'w-full' },
                  React.createElement('thead', null,
                    React.createElement('tr', { className: 'bg-gray-50 border-b-2 border-gray-200' },
                      React.createElement('th', { className: 'text-left p-3 text-sm font-semibold text-gray-600' }, 'Teacher'),
                      React.createElement('th', { className: 'text-left p-3 text-sm font-semibold text-gray-600' }, 'AFID'),
                      React.createElement('th', { className: 'text-left p-3 text-sm font-semibold text-gray-600' }, 'Status'),
                      React.createElement('th', { className: 'text-left p-3 text-sm font-semibold text-gray-600' }, 'Reason'),
                      React.createElement('th', { className: 'text-center p-3 text-sm font-semibold text-gray-600' }, 'Action'))),
                  React.createElement('tbody', null,
                    teachers.map(t => {
                      const rec = attendanceMap[t.afid];
                      return React.createElement('tr', { key: t.afid, className: 'border-b border-gray-100 hover:bg-gray-50' },
                        React.createElement('td', { className: 'p-3' },
                          React.createElement('div', { className: 'font-medium text-gray-800' }, t.name),
                          rec && rec.markedByAdmin && React.createElement('span', { className: 'text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-bold ml-1' }, 'Admin Override')),
                        React.createElement('td', { className: 'p-3 text-gray-500 text-sm font-mono' }, t.afid),
                        React.createElement('td', { className: 'p-3' },
                          rec
                            ? React.createElement('span', { className: `px-2 py-1 rounded-full text-xs font-bold ${rec.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}` }, rec.status)
                            : React.createElement('span', { className: 'px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500' }, 'Not Marked')),
                        React.createElement('td', { className: 'p-3 text-sm text-gray-600' }, rec ? rec.reason : '\u2014'),
                        React.createElement('td', { className: 'p-3 text-center' },
                          React.createElement('button', {
                            onClick: () => openEdit(t),
                            className: `px-3 py-1 rounded-lg text-sm font-semibold transition-colors ${rec ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`
                          }, rec ? '\u270F\uFE0F Edit' : '+ Mark')));
                    })))))),
    editModal && React.createElement('div', {
      className: 'fixed inset-0 flex items-center justify-center z-50',
      style: { background: 'rgba(0,0,0,0.55)' },
      onClick: e => { if (e.target === e.currentTarget) setEditModal(null); }
    },
      React.createElement('div', { className: 'bg-white rounded-2xl p-6 shadow-2xl w-full max-w-md mx-4' },
        React.createElement('h3', { className: 'text-xl font-bold mb-1' },
          (editModal.existing ? '\u270F\uFE0F Edit' : '\u2795 Mark') + ' Attendance'),
        React.createElement('p', { className: 'text-gray-500 text-sm mb-4' }, editModal.teacher.name + ' \u2014 ' + selectedDate),
        React.createElement('div', { className: 'space-y-4' },
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' }, 'Status'),
            React.createElement('div', { className: 'flex gap-3' },
              ['Present', 'On Leave'].map(s =>
                React.createElement('button', {
                  key: s,
                  onClick: () => setEditModal(prev => ({
                    ...prev,
                    status: s,
                    reason: reasonsForStatus(s)[0]
                  })),
                  className: `flex-1 py-2 rounded-lg font-semibold border-2 transition-colors ${editModal.status === s ? (s === 'Present' ? 'bg-green-500 text-white border-green-500' : 'bg-orange-500 text-white border-orange-500') : 'border-gray-300 text-gray-600 hover:border-gray-400'}`
                }, s)))),
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-semibold text-gray-700 mb-2' }, 'Reason'),
            React.createElement('select', {
              value: editModal.reason,
              onChange: e => setEditModal(prev => ({ ...prev, reason: e.target.value })),
              className: 'w-full border border-gray-300 rounded-lg p-2 focus:border-blue-400 focus:outline-none'
            },
              reasonsForStatus(editModal.status).map(r =>
                React.createElement('option', { key: r, value: r }, r)))),
          editModal.existing && React.createElement('div', { className: 'text-xs bg-blue-50 text-blue-700 rounded-lg p-3 border border-blue-200' },
            'Current: ', React.createElement('strong', null, editModal.existing.status), ' \u2014 ', editModal.existing.reason,
            editModal.existing.markedByAdmin ? ' (previously admin-marked)' : ' (teacher-submitted)'),
          React.createElement('div', { className: 'text-xs bg-yellow-50 text-yellow-700 rounded-lg p-3 border border-yellow-200' },
            '\u26A0\uFE0F This will be saved as an admin override and will overwrite any existing record.')),
        React.createElement('div', { className: 'flex gap-3 mt-6' },
          React.createElement('button', {
            onClick: () => setEditModal(null),
            className: 'flex-1 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 font-medium'
          }, 'Cancel'),
          React.createElement('button', {
            onClick: saveAttendance,
            disabled: saving,
            className: 'flex-1 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50'
          }, saving ? 'Saving...' : 'Save')))));
}
function LeaveManagementPanel() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [leaveData, setLeaveData] = useState(null);
  const [loadingLeave, setLoadingLeave] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ entitled: 0, maternity: 0, paternity: 0 });
  const [saving, setSaving] = useState(false);
  const [leaveAdjustments, setLeaveAdjustments] = useState({});
  useEffect(() => {
    Promise.all([
      db.collection('teachers').where('isArchived', '==', false).get(),
      db.collection('leaveAdjustments').get()
    ]).then(([tSnap, adjSnap]) => {
      setTeachers(tSnap.docs.map(d => ({ ...d.data(), docId: d.id })).filter(t => APPROVED_SCHOOLS.includes(t.school)));
      const adjMap = {};
      adjSnap.docs.forEach(d => { adjMap[d.id] = d.data(); });
      setLeaveAdjustments(adjMap);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);
  const filteredTeachers = teachers.filter(t =>
    t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.afid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.school?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const openTeacherLeave = async teacher => {
    setSelectedTeacher(teacher);
    setLoadingLeave(true);
    setLeaveData(null);
    const adj = (leaveAdjustments[teacher.afid] || { entitled: 0, maternity: 0, paternity: 0 });
    setAdjustForm({ entitled: adj.entitled || 0, maternity: adj.maternity || 0, paternity: adj.paternity || 0 });
    try {
      const snap = await db.collection('teacherAttendance')
        .where('teacherId', '==', teacher.afid)
        .where('status', '==', 'On Leave')
        .get();
      const leaves = snap.docs.map(d => d.data());
      const balance = calculateLeaveBalance(leaves, teacher.afid, leaveAdjustments);
      setLeaveData(balance);
    } catch (e) { setLeaveData(null); }
    setLoadingLeave(false);
  };
  const handleSave = async () => {
    if (!selectedTeacher) return;
    setSaving(true);
    try {
      const adj = { entitled: parseInt(adjustForm.entitled) || 0, maternity: parseInt(adjustForm.maternity) || 0, paternity: parseInt(adjustForm.paternity) || 0, updatedAt: new Date().toISOString(), updatedBy: 'admin' };
      await db.collection('leaveAdjustments').doc(selectedTeacher.afid).set(adj);
      const newAdjs = { ...leaveAdjustments, [selectedTeacher.afid]: adj };
      setLeaveAdjustments(newAdjs);
      const snap = await db.collection('teacherAttendance').where('teacherId', '==', selectedTeacher.afid).where('status', '==', 'On Leave').get();
      const leaves = snap.docs.map(d => d.data());
      setLeaveData(calculateLeaveBalance(leaves, selectedTeacher.afid, newAdjs));
      alert('\u2705 Leave adjustment saved!');
    } catch (e) { alert('\u274c Failed: ' + e.message); }
    setSaving(false);
  };
  const handleReset = async () => {
    if (!selectedTeacher) return;
    if (!confirm('Reset all leave adjustments for ' + selectedTeacher.name + ' to zero?')) return;
    setSaving(true);
    try {
      await db.collection('leaveAdjustments').doc(selectedTeacher.afid).set({ entitled: 0, maternity: 0, paternity: 0, updatedAt: new Date().toISOString(), updatedBy: 'admin' });
      setAdjustForm({ entitled: 0, maternity: 0, paternity: 0 });
      const newAdjs = { ...leaveAdjustments, [selectedTeacher.afid]: { entitled: 0, maternity: 0, paternity: 0 } };
      setLeaveAdjustments(newAdjs);
      const snap = await db.collection('teacherAttendance').where('teacherId', '==', selectedTeacher.afid).where('status', '==', 'On Leave').get();
      setLeaveData(calculateLeaveBalance(snap.docs.map(d => d.data()), selectedTeacher.afid, newAdjs));
      alert('\u2705 Leave adjustments reset to zero!');
    } catch (e) { alert('\u274c Failed: ' + e.message); }
    setSaving(false);
  };
  return React.createElement('div', { className: 'bg-white p-6 rounded-2xl shadow-lg' },
    React.createElement('h3', { className: 'text-xl font-bold mb-2 flex items-center gap-2' }, '\ud83d\udcc5 Leave Management'),
    React.createElement('p', { className: 'text-sm text-gray-500 mb-4' }, 'View and adjust teacher leave balances. Positive adjustment = deduct from balance. Negative = add back days.'),
    loading ? React.createElement('div', { className: 'text-center py-6 text-gray-400' }, 'Loading teachers...') :
    React.createElement('div', { className: 'flex gap-6' },
      React.createElement('div', { className: 'w-64 flex-shrink-0' },
        React.createElement('input', {
          type: 'text',
          placeholder: 'Search by name, AFID, school...',
          value: searchTerm,
          onChange: e => setSearchTerm(e.target.value),
          className: 'w-full border-2 px-3 py-2 rounded-xl mb-3 text-sm'
        }),
        React.createElement('div', { className: 'max-h-96 overflow-y-auto space-y-1' },
          filteredTeachers.map(t => React.createElement('button', {
            key: t.docId,
            onClick: () => openTeacherLeave(t),
            className: `w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedTeacher?.afid === t.afid ? 'bg-blue-100 border-2 border-blue-400 font-semibold' : 'hover:bg-gray-100 border-2 border-transparent'}`
          },
            React.createElement('div', { className: 'font-medium' }, t.name),
            React.createElement('div', { className: 'text-xs text-gray-500' }, t.school + ' \u2022 ' + t.afid))))),
      selectedTeacher ? React.createElement('div', { className: 'flex-1' },
        React.createElement('div', { className: 'flex items-center justify-between mb-4' },
          React.createElement('h4', { className: 'font-bold text-lg' }, selectedTeacher.name),
          React.createElement('span', { className: 'text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-lg' }, selectedTeacher.school)),
        loadingLeave ? React.createElement('div', { className: 'text-center py-8 text-gray-400' }, '\u23f3 Loading leave history...') :
        leaveData ? React.createElement('div', { className: 'space-y-4' },
          React.createElement('div', { className: 'grid grid-cols-3 gap-3 mb-4' },
            React.createElement('div', { className: 'bg-blue-50 border-2 border-blue-200 rounded-xl p-3 text-center' },
              React.createElement('div', { className: 'text-xs text-blue-600 font-medium mb-1' }, 'Entitled'),
              React.createElement('div', { className: 'text-2xl font-bold text-blue-700' }, leaveData.entitled.remaining),
              React.createElement('div', { className: 'text-xs text-blue-500' }, 'of ' + leaveData.entitled.total + ' remaining'),
              React.createElement('div', { className: 'text-xs text-gray-500 mt-1' }, leaveData.entitled.used + ' used')),
            React.createElement('div', { className: 'bg-pink-50 border-2 border-pink-200 rounded-xl p-3 text-center' },
              React.createElement('div', { className: 'text-xs text-pink-600 font-medium mb-1' }, 'Maternity'),
              React.createElement('div', { className: 'text-2xl font-bold text-pink-700' }, leaveData.maternity.remaining),
              React.createElement('div', { className: 'text-xs text-pink-500' }, 'of ' + leaveData.maternity.total + ' remaining'),
              React.createElement('div', { className: 'text-xs text-gray-500 mt-1' }, leaveData.maternity.used + ' used')),
            React.createElement('div', { className: 'bg-purple-50 border-2 border-purple-200 rounded-xl p-3 text-center' },
              React.createElement('div', { className: 'text-xs text-purple-600 font-medium mb-1' }, 'Paternity'),
              React.createElement('div', { className: 'text-2xl font-bold text-purple-700' }, leaveData.paternity.remaining),
              React.createElement('div', { className: 'text-xs text-purple-500' }, 'of ' + leaveData.paternity.total + ' remaining'),
              React.createElement('div', { className: 'text-xs text-gray-500 mt-1' }, leaveData.paternity.used + ' used'))),
          React.createElement('div', { className: 'bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4' },
            React.createElement('p', { className: 'text-sm font-bold text-yellow-800 mb-3' }, '\u270f\ufe0f Adjust Leave Balance'),
            React.createElement('p', { className: 'text-xs text-yellow-700 mb-3' }, 'Enter positive days to deduct from balance, negative to add back days.'),
            React.createElement('div', { className: 'grid grid-cols-3 gap-3 mb-3' },
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-xs font-bold text-blue-700 mb-1' }, 'Entitled adj.'),
                React.createElement('input', { type: 'number', min: '-35', max: '35', value: adjustForm.entitled, onChange: e => setAdjustForm({ ...adjustForm, entitled: parseInt(e.target.value) || 0 }), className: 'w-full border-2 px-2 py-1 rounded-lg text-center font-bold' })),
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-xs font-bold text-pink-700 mb-1' }, 'Maternity adj.'),
                React.createElement('input', { type: 'number', min: '-180', max: '180', value: adjustForm.maternity, onChange: e => setAdjustForm({ ...adjustForm, maternity: parseInt(e.target.value) || 0 }), className: 'w-full border-2 px-2 py-1 rounded-lg text-center font-bold' })),
              React.createElement('div', null,
                React.createElement('label', { className: 'block text-xs font-bold text-purple-700 mb-1' }, 'Paternity adj.'),
                React.createElement('input', { type: 'number', min: '-15', max: '15', value: adjustForm.paternity, onChange: e => setAdjustForm({ ...adjustForm, paternity: parseInt(e.target.value) || 0 }), className: 'w-full border-2 px-2 py-1 rounded-lg text-center font-bold' }))),
            React.createElement('div', { className: 'flex gap-2' },
              React.createElement('button', { onClick: handleSave, disabled: saving, className: 'flex-1 bg-green-600 text-white py-2 rounded-xl font-semibold text-sm disabled:opacity-50' }, saving ? 'Saving...' : '\ud83d\udcbe Save Adjustment'),
              React.createElement('button', { onClick: handleReset, disabled: saving, className: 'px-4 py-2 bg-red-100 text-red-700 rounded-xl font-semibold text-sm hover:bg-red-200 disabled:opacity-50' }, '\ud83d\udd04 Reset to 0')))) :
        React.createElement('div', { className: 'text-center py-8 text-gray-400' }, 'Could not load leave data')) :
      React.createElement('div', { className: 'flex-1 flex items-center justify-center text-gray-400 py-12' },
        React.createElement('div', { className: 'text-center' },
          React.createElement('div', { className: 'text-4xl mb-3' }, '\u27a4'),
          React.createElement('p', null, 'Select a teacher to view and adjust their leave balance')))));
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
  const handleDeleteAsset = async asset => {
    const isAssigned = asset.status === 'assigned';
    const confirmMsg = isAssigned ? `\u26A0\uFE0F WARNING: This asset is currently assigned to ${asset.currentAssignee?.studentName}.\n\nAre you sure you want to permanently delete "${asset.title}" (Copy #${asset.copyNumber || 1})?\n\nThis action cannot be undone.` : `Are you sure you want to permanently delete "${asset.title}" (Copy #${asset.copyNumber || 1})?\n\nThis action cannot be undone.`;
    if (!confirm(confirmMsg)) return;
    try {
      await db.collection('assets').doc(asset.docId).delete();
      setAssets(prev => prev.filter(a => a.docId !== asset.docId));
      alert('Asset deleted successfully.');
    } catch (error) {
      console.error('Error deleting asset:', error);
      alert('Failed to delete asset: ' + error.message);
    }
  };
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
  }, "Copy #"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Actions"))), React.createElement("tbody", null, filteredAssets.length === 0 ? React.createElement("tr", null, React.createElement("td", {
    colSpan: "7",
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
  }, asset.copyNumber || 1), React.createElement("td", {
    className: "p-3"
  }, React.createElement("button", {
    onClick: () => handleDeleteAsset(asset),
    className: "px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium transition-colors",
    title: "Delete this asset"
  }, "🗑️ Delete")))))), filteredAssets.length > 100 && React.createElement("p", {
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
