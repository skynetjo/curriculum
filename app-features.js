// ✅ CURRICULUM TRACKER v5.5.0 - CHUNK 3: Feature Pages
// Loaded in parallel with app.js, executes after app-admin.js
// Contains: AdminAttendanceAnalytics, SchoolInfoView, OrgChartDirectory,
//           SocialWall, TimesheetPage, RoadmapPage, TeacherExamStats,
//           StudentFeedbackView, TeacherSelfProfile, AdminClassroomObservations
// Size: ~427KB | Lines: 9083
// ReactDOM.render() is at the end of this file (mounts the app)

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
  const filteredStudentAttendance = useMemo(() => {
    return studentAttendance.filter(a => {
      if (!schoolMatchesFilter(a.school, filterSchools)) return false;
      if (filterGrade !== 'All' && a.grade !== filterGrade) return false;
      if (a.date < startDate || a.date > endDate) return false;
      return true;
    });
  }, [studentAttendance, filterSchools, filterGrade, startDate, endDate]);
  const filteredTeacherAttendance = useMemo(() => {
    return teacherAttendance.filter(a => {
      if (!schoolMatchesFilter(a.school, filterSchools)) return false;
      if (a.date < startDate || a.date > endDate) return false;
      return true;
    });
  }, [teacherAttendance, filterSchools, startDate, endDate]);
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
  const handleExportStudents = () => {
    const exportData = filteredStudentAttendance.map(a => ({
      Date: a.date,
      School: a.school,
      Grade: a.grade,
      'Student Name': a.studentName,
      Status: a.status,
      Remarks: a.remarks || '',
      'Marked By': a.markedBy
    }));
    exportToExcel(exportData, `student_attendance_${startDate}_to_${endDate}`);
  };
  const handleExportTeachers = () => {
    const exportData = filteredTeacherAttendance.map(a => ({
      Date: a.date,
      'Teacher Name': a.teacherName,
      School: a.school,
      'Punch-In Time': a.punchInTime || 'Not recorded',
      Status: a.status,
      Reason: a.reason,
      Location: a.location
    }));
    exportToExcel(exportData, `teacher_attendance_${startDate}_to_${endDate}`);
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
    className: "px-4 py-2 bg-green-600 text-white rounded-xl font-semibold"
  }, "\uD83D\uDCE5 Export Students"), React.createElement("button", {
    onClick: handleExportTeachers,
    className: "px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold"
  }, "\uD83D\uDCE5 Export Teachers"))), showLockManagement && React.createElement("div", {
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
  }, "No records found")) : filteredTeacherAttendance.slice(0, 50).map((a, idx) => React.createElement("tr", {
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
  }, "\uD83D\uDCCD ", a.location))))))));
}
function SchoolInfoView({
  currentUser,
  schoolInfo,
  setSchoolInfo
}) {
  const mySchool = currentUser.school;
  const existingInfo = schoolInfo.find(info => info.school === mySchool);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    principalName: '',
    principalPhone: '',
    principalEmail: '',
    vicePrincipalName: '',
    vicePrincipalPhone: '',
    vicePrincipalEmail: '',
    coordinatorName: '',
    coordinatorPhone: '',
    coordinatorEmail: '',
    wifiInClassroom: 'No',
    wifiInstalledBy: '',
    wifiWorking: 'No',
    wifiMonthlyBill: '',
    wifiConnectionType: '',
    wifiNetworkName: '',
    bothClassesWifi: 'No',
    modules11Received: '',
    modules11Distributed: '',
    modules11Stock: '',
    modules11Remarks: '',
    modules12Received: '',
    modules12Distributed: '',
    modules12Stock: '',
    modules12Remarks: '',
    referenceBooks: [],
    chromebooks11Distributed: 'No',
    chromebooks11Count: '',
    chromebooks11Working: '',
    chromebooks11Brand: '',
    chromebooks11DistributedDate: '',
    chromebooks11TestMethod: '',
    chromebooks11JNVLabAccess: '',
    chromebooks11JNVCount: '',
    chromebooks12Distributed: 'No',
    chromebooks12Count: '',
    chromebooks12Working: '',
    chromebooks12Brand: '',
    chromebooks12DistributedDate: '',
    chromebooks12TestMethod: '',
    chromebooks12JNVLabAccess: '',
    chromebooks12JNVCount: '',
    printerAvailable: 'No',
    printerWorking: 'No',
    printerBrand: '',
    printerIssuedDate: '',
    otherAssets: [],
    meetingMinutes: []
  });
  useEffect(() => {
    if (existingInfo) {
      setFormData(prev => ({
        ...prev,
        ...existingInfo,
        referenceBooks: existingInfo.referenceBooks || [],
        otherAssets: existingInfo.otherAssets || [],
        meetingMinutes: existingInfo.meetingMinutes || []
      }));
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  }, [existingInfo]);
  const handleAddBook = () => {
    setFormData({
      ...formData,
      referenceBooks: [...formData.referenceBooks, {
        bookName: '',
        publisher: '',
        author: '',
        price: '',
        inStock: '',
        distributed: ''
      }]
    });
  };
  const handleRemoveBook = index => {
    const updated = [...formData.referenceBooks];
    updated.splice(index, 1);
    setFormData({
      ...formData,
      referenceBooks: updated
    });
  };
  const handleBookChange = (index, field, value) => {
    const updated = [...formData.referenceBooks];
    updated[index][field] = value;
    setFormData({
      ...formData,
      referenceBooks: updated
    });
  };
  const handleAddAsset = () => {
    setFormData({
      ...formData,
      otherAssets: [...formData.otherAssets, {
        assetName: '',
        assetQuantity: '',
        assetCondition: '',
        assetNotes: ''
      }]
    });
  };
  const handleRemoveAsset = index => {
    const updated = [...formData.otherAssets];
    updated.splice(index, 1);
    setFormData({
      ...formData,
      otherAssets: updated
    });
  };
  const handleAssetChange = (index, field, value) => {
    const updated = [...formData.otherAssets];
    updated[index][field] = value;
    setFormData({
      ...formData,
      otherAssets: updated
    });
  };
  const handleAddMeeting = () => {
    setFormData({
      ...formData,
      meetingMinutes: [{
        meetingDate: new Date().toISOString().split('T')[0],
        meetingTime: new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }),
        attendees: '',
        discussedPoints: '',
        actionPoints: '',
        updatedBy: currentUser.name,
        updatedAt: new Date().toISOString()
      }, ...(formData.meetingMinutes || [])]
    });
  };
  const handleRemoveMeeting = index => {
    const updated = [...(formData.meetingMinutes || [])];
    updated.splice(index, 1);
    setFormData({
      ...formData,
      meetingMinutes: updated
    });
  };
  const handleMeetingChange = (index, field, value) => {
    const updated = [...(formData.meetingMinutes || [])];
    updated[index][field] = value;
    updated[index].updatedBy = currentUser.name;
    updated[index].updatedAt = new Date().toISOString();
    setFormData({
      ...formData,
      meetingMinutes: updated
    });
  };
  const handleSubmit = async () => {
    const docId = mySchool.replace(/\s+/g, '_');
    const existingDoc = await db.collection('schoolInformation').doc(docId).get();
    const schoolInfoExists = existingDoc.exists && existingDoc.data().principalName;
    if (!schoolInfoExists) {
      const requiredFields = [{
        field: 'principalName',
        label: 'Principal Name'
      }, {
        field: 'principalPhone',
        label: 'Principal Phone Number'
      }, {
        field: 'principalEmail',
        label: 'Principal Email ID'
      }, {
        field: 'vicePrincipalName',
        label: 'Vice Principal Name'
      }, {
        field: 'vicePrincipalPhone',
        label: 'Vice Principal Phone Number'
      }, {
        field: 'vicePrincipalEmail',
        label: 'Vice Principal Email ID'
      }, {
        field: 'coordinatorName',
        label: 'Avanti Coordinator Name'
      }, {
        field: 'coordinatorPhone',
        label: 'Avanti Coordinator Phone Number'
      }, {
        field: 'coordinatorEmail',
        label: 'Avanti Coordinator Email ID'
      }];
      const missingFields = [];
      for (const {
        field,
        label
      } of requiredFields) {
        if (!formData[field] || formData[field].toString().trim() === '') {
          missingFields.push(label);
        }
      }
      const phoneFields = [{
        field: 'principalPhone',
        label: 'Principal Phone'
      }, {
        field: 'vicePrincipalPhone',
        label: 'Vice Principal Phone'
      }, {
        field: 'coordinatorPhone',
        label: 'Coordinator Phone'
      }];
      const invalidPhones = [];
      for (const {
        field,
        label
      } of phoneFields) {
        const phone = formData[field]?.toString().replace(/\D/g, '');
        if (phone && phone.length !== 10) {
          invalidPhones.push(label + ' (must be 10 digits)');
        }
      }
      const emailFields = [{
        field: 'principalEmail',
        label: 'Principal Email'
      }, {
        field: 'vicePrincipalEmail',
        label: 'Vice Principal Email'
      }, {
        field: 'coordinatorEmail',
        label: 'Coordinator Email'
      }];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = [];
      for (const {
        field,
        label
      } of emailFields) {
        if (formData[field] && !emailRegex.test(formData[field])) {
          invalidEmails.push(label + ' (invalid format)');
        }
      }
      let errorMessage = '';
      if (missingFields.length > 0) {
        errorMessage += '❌ Missing required fields:\n• ' + missingFields.join('\n• ') + '\n\n';
      }
      if (invalidPhones.length > 0) {
        errorMessage += '❌ Invalid phone numbers:\n• ' + invalidPhones.join('\n• ') + '\n\n';
      }
      if (invalidEmails.length > 0) {
        errorMessage += '❌ Invalid email addresses:\n• ' + invalidEmails.join('\n• ');
      }
      if (errorMessage) {
        alert(errorMessage);
        return;
      }
    }
    setIsSaving(true);
    try {
      const docId = mySchool.replace(/\s+/g, '_');
      const now = new Date().toISOString();
      const userId = currentUser.afid || currentUser.id || currentUser.docId || currentUser.email;
      const historyEntry = {
        updatedBy: userId,
        updatedByName: currentUser.name,
        updatedAt: now
      };
      const dataToSave = {
        ...formData,
        school: mySchool,
        updatedBy: userId,
        updatedByName: currentUser.name,
        updatedAt: now
      };
      await db.collection('schoolInfo').doc(docId).set({
        ...dataToSave,
        updateHistory: firebase.firestore.FieldValue.arrayUnion(historyEntry)
      }, {
        merge: true
      });
      const existingHistory = existingInfo?.updateHistory || [];
      const updatedInfo = {
        ...dataToSave,
        docId: docId,
        updateHistory: [...existingHistory, historyEntry]
      };
      setSchoolInfo(prev => {
        const idx = prev.findIndex(s => s.school === mySchool);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = updatedInfo;
          return updated;
        } else {
          return [...prev, updatedInfo];
        }
      });
      setIsEditing(false);
      setIsSaving(false);
      alert('✅ School information saved successfully!');
    } catch (e) {
      console.error('Save error:', e);
      setIsSaving(false);
      alert('❌ Failed to save: ' + e.message);
    }
  };
  const generateMonthYearOptions = () => {
    const options = [];
    for (let year = 2022; year <= 2025; year++) {
      for (let month = 1; month <= 12; month++) {
        const monthName = new Date(year, month - 1).toLocaleString('default', {
          month: 'long'
        });
        options.push(`${monthName} ${year}`);
      }
    }
    return options;
  };
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("div", {
    className: "flex justify-between items-center"
  }, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "\uD83C\uDFEB School Information - ", mySchool), !isEditing && existingInfo && React.createElement("button", {
    onClick: () => setIsEditing(true),
    className: "px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
  }, "\u270F\uFE0F Edit Information"), isEditing && existingInfo && React.createElement("button", {
    onClick: () => {
      setFormData({
        ...existingInfo
      });
      setIsEditing(false);
    },
    className: "px-6 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700"
  }, "\u274C Cancel")), existingInfo && React.createElement("div", {
    className: "bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-xl text-sm"
  }, React.createElement("div", null, "Last updated:", ' ', existingInfo.updatedAt ? new Date(existingInfo.updatedAt).toLocaleString() : 'Not filled yet', existingInfo.updatedByName && React.createElement(React.Fragment, null, " by ", React.createElement("span", {
    className: "font-semibold"
  }, existingInfo.updatedByName))), existingInfo.updateHistory && existingInfo.updateHistory.length > 0 && React.createElement("div", {
    className: "mt-2"
  }, React.createElement("div", {
    className: "font-semibold mb-1"
  }, "Edit History (Newest First)"), React.createElement("ul", {
    className: "max-h-32 overflow-y-auto space-y-1"
  }, existingInfo.updateHistory.slice().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).map((entry, idx) => React.createElement("li", {
    key: idx
  }, new Date(entry.updatedAt).toLocaleString(), " \u2014 ", entry.updatedByName || entry.updatedBy))))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg space-y-6"
  }, React.createElement("div", {
    className: "border-4 border-blue-500 rounded-2xl p-6 bg-blue-50"
  }, React.createElement("h3", {
    className: "text-2xl font-bold mb-4 text-blue-800"
  }, "\uD83D\uDC68\u200D\uD83D\uDCBC Principal Information"), React.createElement("div", {
    className: "grid md:grid-cols-3 gap-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Principal Name *"), React.createElement("input", {
    type: "text",
    value: formData.principalName,
    onChange: e => setFormData({
      ...formData,
      principalName: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Phone Number *"), React.createElement("input", {
    type: "tel",
    value: formData.principalPhone,
    onChange: e => setFormData({
      ...formData,
      principalPhone: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Email ID *"), React.createElement("input", {
    type: "email",
    value: formData.principalEmail,
    onChange: e => setFormData({
      ...formData,
      principalEmail: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  })))), React.createElement("div", {
    className: "border-4 border-green-500 rounded-2xl p-6 bg-green-50"
  }, React.createElement("h3", {
    className: "text-2xl font-bold mb-4 text-green-800"
  }, "\uD83D\uDC68\u200D\uD83D\uDCBC Vice Principal Information"), React.createElement("div", {
    className: "grid md:grid-cols-3 gap-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Vice Principal Name *"), React.createElement("input", {
    type: "text",
    value: formData.vicePrincipalName,
    onChange: e => setFormData({
      ...formData,
      vicePrincipalName: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Phone Number *"), React.createElement("input", {
    type: "tel",
    value: formData.vicePrincipalPhone,
    onChange: e => setFormData({
      ...formData,
      vicePrincipalPhone: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Email ID *"), React.createElement("input", {
    type: "email",
    value: formData.vicePrincipalEmail,
    onChange: e => setFormData({
      ...formData,
      vicePrincipalEmail: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  })))), React.createElement("div", {
    className: "border-4 border-orange-500 rounded-2xl p-6 bg-orange-50"
  }, React.createElement("h3", {
    className: "text-2xl font-bold mb-4 text-orange-800"
  }, "\uD83D\uDC68\u200D\uD83D\uDCBC Avanti Coordinator Information"), React.createElement("div", {
    className: "grid md:grid-cols-3 gap-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Coordinator Name *"), React.createElement("input", {
    type: "text",
    value: formData.coordinatorName,
    onChange: e => setFormData({
      ...formData,
      coordinatorName: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Phone Number *"), React.createElement("input", {
    type: "tel",
    value: formData.coordinatorPhone,
    onChange: e => setFormData({
      ...formData,
      coordinatorPhone: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Email ID *"), React.createElement("input", {
    type: "email",
    value: formData.coordinatorEmail,
    onChange: e => setFormData({
      ...formData,
      coordinatorEmail: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  })))), React.createElement("div", {
    className: "border-4 border-purple-500 rounded-2xl p-6 bg-purple-50"
  }, React.createElement("h3", {
    className: "text-2xl font-bold mb-4 text-purple-800"
  }, "\uD83D\uDCF6 WiFi Connection Details"), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "WiFi in Classroom? *"), React.createElement("select", {
    value: formData.wifiInClassroom,
    onChange: e => setFormData({
      ...formData,
      wifiInClassroom: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  }, React.createElement("option", {
    value: "No"
  }, "No"), React.createElement("option", {
    value: "Yes"
  }, "Yes"))), formData.wifiInClassroom === 'Yes' && React.createElement(React.Fragment, null, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Installed By *"), React.createElement("select", {
    value: formData.wifiInstalledBy,
    onChange: e => setFormData({
      ...formData,
      wifiInstalledBy: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  }, React.createElement("option", {
    value: ""
  }, "Select"), React.createElement("option", {
    value: "Avanti"
  }, "Avanti"), React.createElement("option", {
    value: "JNV"
  }, "JNV"))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Working Condition? *"), React.createElement("select", {
    value: formData.wifiWorking,
    onChange: e => setFormData({
      ...formData,
      wifiWorking: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  }, React.createElement("option", {
    value: "No"
  }, "No"), React.createElement("option", {
    value: "Yes"
  }, "Yes"))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Monthly Bill Amount *"), React.createElement("input", {
    type: "text",
    value: formData.wifiMonthlyBill,
    onChange: e => setFormData({
      ...formData,
      wifiMonthlyBill: e.target.value
    }),
    disabled: !isEditing,
    placeholder: "\u20B9 Amount",
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Connection Type *"), React.createElement("select", {
    value: formData.wifiConnectionType,
    onChange: e => setFormData({
      ...formData,
      wifiConnectionType: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  }, React.createElement("option", {
    value: ""
  }, "Select"), React.createElement("option", {
    value: "Postpaid"
  }, "Postpaid"), React.createElement("option", {
    value: "Prepaid"
  }, "Prepaid"))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Network Name *"), React.createElement("select", {
    value: formData.wifiNetworkName,
    onChange: e => setFormData({
      ...formData,
      wifiNetworkName: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  }, React.createElement("option", {
    value: ""
  }, "Select"), React.createElement("option", {
    value: "Airtel"
  }, "Airtel"), React.createElement("option", {
    value: "Jio"
  }, "Jio"), React.createElement("option", {
    value: "Local"
  }, "Local"), React.createElement("option", {
    value: "BSNL"
  }, "BSNL"))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Both 11th & 12th have WiFi? *"), React.createElement("select", {
    value: formData.bothClassesWifi,
    onChange: e => setFormData({
      ...formData,
      bothClassesWifi: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  }, React.createElement("option", {
    value: "No"
  }, "No"), React.createElement("option", {
    value: "Yes"
  }, "Yes")))))), React.createElement("div", {
    className: "border-4 border-green-500 rounded-2xl p-6 bg-green-50"
  }, React.createElement("h3", {
    className: "text-2xl font-bold mb-4 text-green-800"
  }, "\uD83D\uDCDA Modules - Class 11th"), React.createElement("div", {
    className: "grid md:grid-cols-3 gap-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Modules Received (AY 2025-26) *"), React.createElement("input", {
    type: "number",
    min: "0",
    value: formData.modules11Received,
    onChange: e => setFormData({
      ...formData,
      modules11Received: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed",
    placeholder: "Enter number only"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Modules Distributed to 11th *"), React.createElement("input", {
    type: "number",
    min: "0",
    value: formData.modules11Distributed,
    onChange: e => setFormData({
      ...formData,
      modules11Distributed: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed",
    placeholder: "Enter number only"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Modules in Stock (11th) *"), React.createElement("input", {
    type: "number",
    min: "0",
    value: formData.modules11Stock,
    onChange: e => setFormData({
      ...formData,
      modules11Stock: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed",
    placeholder: "Enter number only"
  }))), React.createElement("div", {
    className: "mt-4"
  }, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "\uD83D\uDCDD Remarks for Class 11th Modules"), React.createElement("textarea", {
    value: formData.modules11Remarks || '',
    onChange: e => setFormData({
      ...formData,
      modules11Remarks: e.target.value
    }),
    disabled: !isEditing,
    placeholder: "Add any remarks about 11th class modules here...",
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed",
    rows: "2"
  }))), React.createElement("div", {
    className: "border-4 border-blue-500 rounded-2xl p-6 bg-blue-50"
  }, React.createElement("h3", {
    className: "text-2xl font-bold mb-4 text-blue-800"
  }, "\uD83D\uDCDA Modules - Class 12th"), React.createElement("div", {
    className: "grid md:grid-cols-3 gap-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Modules Received (AY 2025-26) *"), React.createElement("input", {
    type: "number",
    min: "0",
    value: formData.modules12Received,
    onChange: e => setFormData({
      ...formData,
      modules12Received: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed",
    placeholder: "Enter number only"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Modules Distributed to 12th *"), React.createElement("input", {
    type: "number",
    min: "0",
    value: formData.modules12Distributed,
    onChange: e => setFormData({
      ...formData,
      modules12Distributed: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed",
    placeholder: "Enter number only"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Modules in Stock (12th) *"), React.createElement("input", {
    type: "number",
    min: "0",
    value: formData.modules12Stock,
    onChange: e => setFormData({
      ...formData,
      modules12Stock: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed",
    placeholder: "Enter number only"
  }))), React.createElement("div", {
    className: "mt-4"
  }, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "\uD83D\uDCDD Remarks for Class 12th Modules"), React.createElement("textarea", {
    value: formData.modules12Remarks || '',
    onChange: e => setFormData({
      ...formData,
      modules12Remarks: e.target.value
    }),
    disabled: !isEditing,
    placeholder: "Add any remarks about 12th class modules here...",
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed",
    rows: "2"
  }))), React.createElement("div", {
    className: "border-4 border-yellow-500 rounded-2xl p-6 bg-yellow-50"
  }, React.createElement("div", {
    className: "flex justify-between items-center mb-4"
  }, React.createElement("h3", {
    className: "text-2xl font-bold text-yellow-800"
  }, "\uD83D\uDCD6 Other Reference Books (AY 2025-26)"), isEditing && React.createElement("button", {
    onClick: handleAddBook,
    className: "px-6 py-3 bg-yellow-600 text-white rounded-xl font-semibold"
  }, "+ Add Book")), formData.referenceBooks.map((book, idx) => React.createElement("div", {
    key: idx,
    className: "bg-white p-4 rounded-xl mb-4 border-2 border-yellow-300"
  }, React.createElement("div", {
    className: "flex justify-between items-center mb-3"
  }, React.createElement("h4", {
    className: "font-bold text-lg"
  }, "Book ", idx + 1), isEditing && React.createElement("button", {
    onClick: () => handleRemoveBook(idx),
    className: "px-4 py-2 bg-red-500 text-white rounded-lg"
  }, "Remove")), React.createElement("div", {
    className: "grid md:grid-cols-3 gap-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Book Name *"), React.createElement("input", {
    type: "text",
    value: book.bookName,
    onChange: e => handleBookChange(idx, 'bookName', e.target.value),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Publisher Name *"), React.createElement("input", {
    type: "text",
    value: book.publisher,
    onChange: e => handleBookChange(idx, 'publisher', e.target.value),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Author Name *"), React.createElement("input", {
    type: "text",
    value: book.author,
    onChange: e => handleBookChange(idx, 'author', e.target.value),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Price *"), React.createElement("input", {
    type: "text",
    value: book.price,
    onChange: e => handleBookChange(idx, 'price', e.target.value),
    placeholder: "\u20B9 Amount",
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "In Stock *"), React.createElement("input", {
    type: "number",
    value: book.inStock,
    onChange: e => handleBookChange(idx, 'inStock', e.target.value),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Distributed *"), React.createElement("input", {
    type: "number",
    value: book.distributed,
    onChange: e => handleBookChange(idx, 'distributed', e.target.value),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  })))))), React.createElement("div", {
    className: "border-4 border-indigo-500 rounded-2xl p-6 bg-indigo-50"
  }, React.createElement("h3", {
    className: "text-2xl font-bold mb-4 text-indigo-800"
  }, "\uD83D\uDCBB Chromebooks/Laptops - Class 11th"), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Distributed from Avanti? *"), React.createElement("select", {
    value: formData.chromebooks11Distributed,
    onChange: e => setFormData({
      ...formData,
      chromebooks11Distributed: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  }, React.createElement("option", {
    value: "No"
  }, "No"), React.createElement("option", {
    value: "Yes"
  }, "Yes"))), formData.chromebooks11Distributed === 'Yes' ? React.createElement(React.Fragment, null, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Number Distributed *"), React.createElement("input", {
    type: "number",
    min: "0",
    value: formData.chromebooks11Count,
    onChange: e => setFormData({
      ...formData,
      chromebooks11Count: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed",
    placeholder: "Enter number only"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Working Condition *"), React.createElement("input", {
    type: "number",
    min: "0",
    value: formData.chromebooks11Working,
    onChange: e => setFormData({
      ...formData,
      chromebooks11Working: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed",
    placeholder: "Enter number only"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Brand Name *"), React.createElement("input", {
    type: "text",
    value: formData.chromebooks11Brand,
    onChange: e => setFormData({
      ...formData,
      chromebooks11Brand: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  })), React.createElement("div", {
    className: "md:col-span-2"
  }, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "When Distributed? *"), React.createElement("select", {
    value: formData.chromebooks11DistributedDate,
    onChange: e => setFormData({
      ...formData,
      chromebooks11DistributedDate: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  }, React.createElement("option", {
    value: ""
  }, "Select Month & Year"), generateMonthYearOptions().map(opt => React.createElement("option", {
    key: opt,
    value: opt
  }, opt))))) : React.createElement(React.Fragment, null, React.createElement("div", {
    className: "md:col-span-2"
  }, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "How do you conduct tests? *"), React.createElement("textarea", {
    value: formData.chromebooks11TestMethod,
    onChange: e => setFormData({
      ...formData,
      chromebooks11TestMethod: e.target.value
    }),
    disabled: !isEditing,
    rows: "3",
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "JNV Computer Lab/Tablets Accessible? *"), React.createElement("input", {
    type: "text",
    value: formData.chromebooks11JNVLabAccess,
    onChange: e => setFormData({
      ...formData,
      chromebooks11JNVLabAccess: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "How many tabs/computers in JNV? *"), React.createElement("input", {
    type: "number",
    min: "0",
    value: formData.chromebooks11JNVCount,
    onChange: e => setFormData({
      ...formData,
      chromebooks11JNVCount: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed",
    placeholder: "Enter number only"
  }))))), React.createElement("div", {
    className: "border-4 border-pink-500 rounded-2xl p-6 bg-pink-50"
  }, React.createElement("h3", {
    className: "text-2xl font-bold mb-4 text-pink-800"
  }, "\uD83D\uDCBB Chromebooks/Laptops - Class 12th"), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Distributed from Avanti? *"), React.createElement("select", {
    value: formData.chromebooks12Distributed,
    onChange: e => setFormData({
      ...formData,
      chromebooks12Distributed: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  }, React.createElement("option", {
    value: "No"
  }, "No"), React.createElement("option", {
    value: "Yes"
  }, "Yes"))), formData.chromebooks12Distributed === 'Yes' ? React.createElement(React.Fragment, null, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Number Distributed *"), React.createElement("input", {
    type: "number",
    min: "0",
    value: formData.chromebooks12Count,
    onChange: e => setFormData({
      ...formData,
      chromebooks12Count: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed",
    placeholder: "Enter number only"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Working Condition *"), React.createElement("input", {
    type: "number",
    min: "0",
    value: formData.chromebooks12Working,
    onChange: e => setFormData({
      ...formData,
      chromebooks12Working: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed",
    placeholder: "Enter number only"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Brand Name *"), React.createElement("input", {
    type: "text",
    value: formData.chromebooks12Brand,
    onChange: e => setFormData({
      ...formData,
      chromebooks12Brand: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  })), React.createElement("div", {
    className: "md:col-span-2"
  }, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "When Distributed? *"), React.createElement("select", {
    value: formData.chromebooks12DistributedDate,
    onChange: e => setFormData({
      ...formData,
      chromebooks12DistributedDate: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  }, React.createElement("option", {
    value: ""
  }, "Select Month & Year"), generateMonthYearOptions().map(opt => React.createElement("option", {
    key: opt,
    value: opt
  }, opt))))) : React.createElement(React.Fragment, null, React.createElement("div", {
    className: "md:col-span-2"
  }, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "How do you conduct tests? *"), React.createElement("textarea", {
    value: formData.chromebooks12TestMethod,
    onChange: e => setFormData({
      ...formData,
      chromebooks12TestMethod: e.target.value
    }),
    disabled: !isEditing,
    rows: "3",
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "JNV Computer Lab/Tablets Accessible? *"), React.createElement("input", {
    type: "text",
    value: formData.chromebooks12JNVLabAccess,
    onChange: e => setFormData({
      ...formData,
      chromebooks12JNVLabAccess: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "How many tabs/computers in JNV? *"), React.createElement("input", {
    type: "number",
    min: "0",
    value: formData.chromebooks12JNVCount,
    onChange: e => setFormData({
      ...formData,
      chromebooks12JNVCount: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed",
    placeholder: "Enter number only"
  }))))), React.createElement("div", {
    className: "border-4 border-cyan-500 rounded-2xl p-6 bg-cyan-50"
  }, React.createElement("h3", {
    className: "text-2xl font-bold mb-4 text-cyan-800"
  }, "\uD83D\uDDA8\uFE0F Printer Information"), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Printer Available? *"), React.createElement("select", {
    value: formData.printerAvailable,
    onChange: e => setFormData({
      ...formData,
      printerAvailable: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  }, React.createElement("option", {
    value: "No"
  }, "No"), React.createElement("option", {
    value: "Yes"
  }, "Yes"))), formData.printerAvailable === 'Yes' && React.createElement(React.Fragment, null, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Working Condition? *"), React.createElement("select", {
    value: formData.printerWorking,
    onChange: e => setFormData({
      ...formData,
      printerWorking: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  }, React.createElement("option", {
    value: "No"
  }, "No"), React.createElement("option", {
    value: "Yes"
  }, "Yes"))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Printer Brand *"), React.createElement("input", {
    type: "text",
    value: formData.printerBrand,
    onChange: e => setFormData({
      ...formData,
      printerBrand: e.target.value
    }),
    disabled: !isEditing,
    placeholder: "e.g., HP, Canon, Epson",
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "When Issued? *"), React.createElement("select", {
    value: formData.printerIssuedDate,
    onChange: e => setFormData({
      ...formData,
      printerIssuedDate: e.target.value
    }),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  }, React.createElement("option", {
    value: ""
  }, "Select Month & Year"), generateMonthYearOptions().map(opt => React.createElement("option", {
    key: opt,
    value: opt
  }, opt))))))), React.createElement("div", {
    className: "border-4 border-teal-500 rounded-2xl p-6 bg-teal-50"
  }, React.createElement("div", {
    className: "flex justify-between items-center mb-4"
  }, React.createElement("h3", {
    className: "text-2xl font-bold text-teal-800"
  }, "\uD83D\uDCE6 Other Assets"), isEditing && React.createElement("button", {
    onClick: handleAddAsset,
    className: "px-6 py-3 bg-teal-600 text-white rounded-xl font-semibold"
  }, "+ Add Asset")), formData.otherAssets.length === 0 ? React.createElement("p", {
    className: "text-gray-600 text-center py-4"
  }, "No other assets added yet. Click \"+ Add Asset\" to add.") : formData.otherAssets.map((asset, idx) => React.createElement("div", {
    key: idx,
    className: "bg-white p-4 rounded-xl mb-4 border-2 border-teal-300"
  }, React.createElement("div", {
    className: "flex justify-between items-center mb-3"
  }, React.createElement("h4", {
    className: "font-bold text-lg"
  }, "Asset ", idx + 1), isEditing && React.createElement("button", {
    onClick: () => handleRemoveAsset(idx),
    className: "px-4 py-2 bg-red-500 text-white rounded-lg"
  }, "Remove")), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Asset Name *"), React.createElement("input", {
    type: "text",
    value: asset.assetName,
    onChange: e => handleAssetChange(idx, 'assetName', e.target.value),
    placeholder: "e.g., Projector, Whiteboard",
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Quantity *"), React.createElement("input", {
    type: "number",
    value: asset.assetQuantity,
    onChange: e => handleAssetChange(idx, 'assetQuantity', e.target.value),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Condition *"), React.createElement("select", {
    value: asset.assetCondition,
    onChange: e => handleAssetChange(idx, 'assetCondition', e.target.value),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  }, React.createElement("option", {
    value: ""
  }, "Select"), React.createElement("option", {
    value: "Working"
  }, "Working"), React.createElement("option", {
    value: "Not Working"
  }, "Not Working"), React.createElement("option", {
    value: "Needs Repair"
  }, "Needs Repair"))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Notes"), React.createElement("input", {
    type: "text",
    value: asset.assetNotes,
    onChange: e => handleAssetChange(idx, 'assetNotes', e.target.value),
    placeholder: "Additional details",
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  })))))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg mt-6"
  }, React.createElement("div", {
    className: "flex justify-between items-center mb-4"
  }, React.createElement("h3", {
    className: "text-xl font-bold text-purple-700"
  }, "\uD83D\uDCDD Minutes of Meeting"), isEditing && React.createElement("button", {
    onClick: handleAddMeeting,
    className: "px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold"
  }, "+ Add New Meeting")), (formData.meetingMinutes || []).length === 0 ? React.createElement("p", {
    className: "text-gray-500 text-center py-4"
  }, "No meeting records yet") : React.createElement("div", {
    className: "space-y-4"
  }, (formData.meetingMinutes || []).map((meeting, idx) => React.createElement("div", {
    key: idx,
    className: "border-2 border-purple-200 rounded-xl p-4 bg-purple-50"
  }, React.createElement("div", {
    className: "flex justify-between items-start mb-3"
  }, React.createElement("div", {
    className: "flex gap-4 items-center"
  }, React.createElement("span", {
    className: "px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-semibold"
  }, "Meeting #", (formData.meetingMinutes || []).length - idx), React.createElement("span", {
    className: "text-sm text-gray-500"
  }, "Last updated: ", meeting.updatedAt ? new Date(meeting.updatedAt).toLocaleString() : 'N/A', " by ", meeting.updatedBy || 'Unknown')), isEditing && React.createElement("button", {
    onClick: () => handleRemoveMeeting(idx),
    className: "px-3 py-1 bg-red-500 text-white rounded-lg text-sm"
  }, "Remove")), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4 mb-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "\uD83D\uDCC5 Date *"), React.createElement("input", {
    type: "date",
    value: meeting.meetingDate || '',
    onChange: e => handleMeetingChange(idx, 'meetingDate', e.target.value),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "\uD83D\uDD50 Time *"), React.createElement("input", {
    type: "time",
    value: meeting.meetingTime || '',
    onChange: e => handleMeetingChange(idx, 'meetingTime', e.target.value),
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  }))), React.createElement("div", {
    className: "mb-4"
  }, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "\uD83D\uDC65 Attendees *"), React.createElement("input", {
    type: "text",
    value: meeting.attendees || '',
    onChange: e => handleMeetingChange(idx, 'attendees', e.target.value),
    placeholder: "e.g., Principal, Vice Principal, Team Lead, Teacher A, Teacher B",
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed"
  })), React.createElement("div", {
    className: "mb-4"
  }, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "\uD83D\uDCAC Discussed Points *"), React.createElement("textarea", {
    value: meeting.discussedPoints || '',
    onChange: e => handleMeetingChange(idx, 'discussedPoints', e.target.value),
    placeholder: "Enter the key points discussed in the meeting...",
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed",
    rows: "4"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "\u2705 Action Points"), React.createElement("textarea", {
    value: meeting.actionPoints || '',
    onChange: e => handleMeetingChange(idx, 'actionPoints', e.target.value),
    placeholder: "Enter action items and next steps...",
    disabled: !isEditing,
    className: "w-full border-2 px-4 py-3 rounded-xl disabled:bg-gray-100 disabled:cursor-not-allowed",
    rows: "3"
  })), !isEditing && meeting.meetingDate && React.createElement("div", {
    className: "mt-4 pt-3 border-t border-purple-200"
  }, React.createElement("button", {
    onClick: () => {
      const printWindow = window.open('', '_blank');
      const meetingNum = (formData.meetingMinutes || []).length - idx;
      const dateStr = meeting.meetingDate ? new Date(meeting.meetingDate).toLocaleDateString('en-IN', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }) : 'Not specified';
      const timeStr = meeting.meetingTime || 'Not specified';
      const attendeesStr = meeting.attendees || 'Not specified';
      const discussedStr = (meeting.discussedPoints || 'No discussion points recorded').replace(/\n/g, '<br>');
      const actionStr = (meeting.actionPoints || 'No action items recorded').replace(/\n/g, '<br>');
      const updatedStr = meeting.updatedAt ? new Date(meeting.updatedAt).toLocaleString('en-IN') : 'N/A';
      const updatedByStr = meeting.updatedBy ? ' by <strong>' + meeting.updatedBy + '</strong>' : '';
      const nowStr = new Date().toLocaleString('en-IN');
      printWindow.document.write('<!DOCTYPE html><html><head><title>Meeting Minutes - ' + mySchool + '</title>' + '<style>@media print { @page { margin: 1cm; size: A4; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }' + 'body { font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 800px; margin: 0 auto; }' + '.header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #7C3AED; padding-bottom: 15px; margin-bottom: 20px; }' + '.logo { font-size: 24px; font-weight: bold; color: #7C3AED; }' + '.meeting-badge { background: #7C3AED; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; }' + '.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }' + '.info-item { padding: 12px; background: #F9FAFB; border-radius: 8px; border-left: 4px solid #7C3AED; }' + '.info-item label { font-size: 11px; color: #6B7280; text-transform: uppercase; display: block; margin-bottom: 4px; }' + '.info-item span { font-weight: bold; color: #1F2937; font-size: 14px; }' + '.section { margin-top: 20px; padding: 15px; background: #FAF5FF; border-radius: 8px; border: 1px solid #E9D5FF; }' + '.section-title { font-weight: bold; color: #7C3AED; margin-bottom: 10px; font-size: 14px; }' + '.section-content { white-space: pre-wrap; line-height: 1.8; font-size: 13px; color: #374151; }' + '.footer { margin-top: 30px; padding-top: 15px; border-top: 2px solid #E9D5FF; font-size: 11px; color: #6B7280; display: flex; justify-content: space-between; }' + '</style></head><body>' + '<div class="header"><div><div class="logo">अवंती Avanti Fellows</div>' + '<h1 style="margin: 10px 0 5px; font-size: 22px; color: #1F2937;">Minutes of Meeting</h1>' + '<p style="margin: 0; color: #6B7280; font-size: 14px;">🏫 ' + mySchool + '</p></div>' + '<div class="meeting-badge">Meeting #' + meetingNum + '</div></div>' + '<div class="info-grid"><div class="info-item"><label>📅 Date</label><span>' + dateStr + '</span></div>' + '<div class="info-item"><label>🕐 Time</label><span>' + timeStr + '</span></div></div>' + '<div class="section"><div class="section-title">👥 Attendees</div><div class="section-content">' + attendeesStr + '</div></div>' + '<div class="section"><div class="section-title">💬 Discussion Points</div><div class="section-content">' + discussedStr + '</div></div>' + '<div class="section" style="background: #F0FDF4; border-color: #BBF7D0;"><div class="section-title" style="color: #059669;">✅ Action Items</div><div class="section-content">' + actionStr + '</div></div>' + '<div class="footer"><div><strong>Last Updated:</strong> ' + updatedStr + updatedByStr + '</div><div>Generated on: ' + nowStr + '</div></div>' + '<script>window.onload = function() { setTimeout(function() { window.print(); }, 500); }</scr' + 'ipt></body></html>');
      printWindow.document.close();
    },
    className: "px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold text-sm hover:bg-purple-700 flex items-center gap-2"
  }, "\uD83D\uDCC4 Export to PDF")))))), isEditing && React.createElement("button", {
    onClick: handleSubmit,
    disabled: isSaving,
    className: `w-full text-white py-4 rounded-xl font-bold text-xl ${isSaving ? 'bg-gray-400 cursor-not-allowed' : 'avanti-gradient hover:opacity-90'}`
  }, isSaving ? '⏳ Saving...' : '💾 Save School Information')));
}
function AdminSchoolInfo({
  schoolInfo,
  setSchoolInfo,
  currentUser
}) {
  const [editingSchool, setEditingSchool] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [showMeetingForm, setShowMeetingForm] = useState(null);
  const [newMeeting, setNewMeeting] = useState({ meetingDate: '', meetingTime: '', attendees: '', discussedPoints: '', actionPoints: '' });

  const startEditing = (info) => {
    setEditingSchool(info.school);
    setEditFormData({ ...info });
  };

  const cancelEditing = () => {
    setEditingSchool(null);
    setEditFormData({});
  };

  const saveSchoolInfo = async () => {
    if (!editFormData.school) return;
    setIsSaving(true);
    try {
      const docId = editFormData.school.replace(/\s+/g, '_');
      const now = new Date().toISOString();
      const userId = currentUser?.afid || currentUser?.id || currentUser?.email || 'unknown';
      const historyEntry = { updatedBy: userId, updatedByName: currentUser?.name || 'Manager', updatedAt: now };
      await db.collection('schoolInfo').doc(docId).set({
        ...editFormData,
        updatedBy: userId,
        updatedByName: currentUser?.name || 'Manager',
        updatedAt: now,
        updateHistory: firebase.firestore.FieldValue.arrayUnion(historyEntry)
      }, { merge: true });
      if (setSchoolInfo) {
        setSchoolInfo(prev => {
          const idx = prev.findIndex(s => s.school === editFormData.school);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = { ...editFormData, updatedAt: now, updatedByName: currentUser?.name };
            return updated;
          }
          return prev;
        });
      }
      setEditingSchool(null);
      setEditFormData({});
      alert('School information updated!');
    } catch (e) {
      alert('Failed to save: ' + e.message);
    }
    setIsSaving(false);
  };

  const addMeetingNote = async (schoolName) => {
    if (!newMeeting.discussedPoints?.trim()) {
      alert('Please enter discussion points');
      return;
    }
    setIsSaving(true);
    try {
      const info = schoolInfo.find(s => s.school === schoolName);
      const docId = schoolName.replace(/\s+/g, '_');
      const now = new Date().toISOString();
      const userId = currentUser?.afid || currentUser?.id || currentUser?.email || 'unknown';
      const meetingEntry = { ...newMeeting, updatedBy: currentUser?.name || 'Manager', updatedAt: now };
      const existingMeetings = info?.meetingMinutes || [];
      const updatedMeetings = [meetingEntry, ...existingMeetings];
      await db.collection('schoolInfo').doc(docId).set({
        school: schoolName,
        meetingMinutes: updatedMeetings,
        updatedBy: userId,
        updatedByName: currentUser?.name || 'Manager',
        updatedAt: now
      }, { merge: true });
      if (setSchoolInfo) {
        setSchoolInfo(prev => {
          const idx = prev.findIndex(s => s.school === schoolName);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], meetingMinutes: updatedMeetings, updatedAt: now };
            return updated;
          }
          return [...prev, { school: schoolName, meetingMinutes: updatedMeetings, updatedAt: now }];
        });
      }
      setShowMeetingForm(null);
      setNewMeeting({ meetingDate: '', meetingTime: '', attendees: '', discussedPoints: '', actionPoints: '' });
      alert('Meeting note added!');
    } catch (e) {
      alert('Failed to save: ' + e.message);
    }
    setIsSaving(false);
  };

  const handleExport = () => {
    const exportData = schoolInfo.map(info => ({
      School: info.school,
      'Principal Name': info.principalName,
      'Principal Phone': info.principalPhone,
      'Principal Email': info.principalEmail,
      'Vice Principal Name': info.vicePrincipalName,
      'Vice Principal Phone': info.vicePrincipalPhone,
      'Vice Principal Email': info.vicePrincipalEmail,
      'Coordinator Name': info.coordinatorName,
      'Coordinator Phone': info.coordinatorPhone,
      'Coordinator Email': info.coordinatorEmail,
      'WiFi in Classroom': info.wifiInClassroom,
      'WiFi Installed By': info.wifiInstalledBy,
      'WiFi Working': info.wifiWorking,
      'WiFi Monthly Bill': info.wifiMonthlyBill,
      'WiFi Connection Type': info.wifiConnectionType,
      'WiFi Network Name': info.wifiNetworkName,
      'Both Classes WiFi': info.bothClassesWifi,
      'Modules 11 Received': info.modules11Received,
      'Modules 11 Distributed': info.modules11Distributed,
      'Modules 11 Stock': info.modules11Stock,
      'Modules 11 Remarks': info.modules11Remarks || '',
      'Modules 12 Received': info.modules12Received,
      'Modules 12 Distributed': info.modules12Distributed,
      'Modules 12 Stock': info.modules12Stock,
      'Modules 12 Remarks': info.modules12Remarks || '',
      'Chromebooks 11 Distributed': info.chromebooks11Distributed,
      'Chromebooks 11 Count': info.chromebooks11Count,
      'Chromebooks 11 Working': info.chromebooks11Working,
      'Chromebooks 11 Brand': info.chromebooks11Brand,
      'Chromebooks 11 Date': info.chromebooks11DistributedDate,
      'Chromebooks 12 Distributed': info.chromebooks12Distributed,
      'Chromebooks 12 Count': info.chromebooks12Count,
      'Chromebooks 12 Working': info.chromebooks12Working,
      'Chromebooks 12 Brand': info.chromebooks12Brand,
      'Chromebooks 12 Date': info.chromebooks12DistributedDate,
      'Printer Available': info.printerAvailable,
      'Printer Working': info.printerWorking,
      'Printer Brand': info.printerBrand,
      'Printer Issued Date': info.printerIssuedDate,
      'Other Assets Count': info.otherAssets ? info.otherAssets.length : 0,
      'Last Updated': info.updatedAt ? new Date(info.updatedAt).toLocaleString() : ''
    }));
    exportToExcel(exportData, 'school_information');
  };
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("div", {
    className: "flex justify-between items-center"
  }, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "\uD83C\uDFEB School Information"), React.createElement("button", {
    onClick: handleExport,
    className: "px-6 py-3 bg-green-600 text-white rounded-xl font-semibold"
  }, "\uD83D\uDCE5 Export to Excel")), schoolInfo.length === 0 ? React.createElement("div", {
    className: "bg-white p-8 rounded-2xl text-center"
  }, React.createElement("p", {
    className: "text-gray-600"
  }, "No school information available yet. Teachers need to fill the forms.")) : React.createElement("div", {
    className: "space-y-6"
  }, schoolInfo.map(info => React.createElement("div", {
    key: info.id || info.school,
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("div", {
    className: "flex justify-between items-start mb-4 flex-wrap gap-4"
  }, React.createElement("div", null, React.createElement("h3", {
    className: "text-2xl font-bold"
  }, info.school), React.createElement("div", {
    className: "text-sm text-gray-600 mt-1"
  }, "Last updated: ", info.updatedAt ? new Date(info.updatedAt).toLocaleString() : 'N/A', info.updatedByName && React.createElement("span", null, " by ", info.updatedByName))), React.createElement("div", {
    className: "flex gap-2 flex-wrap"
  }, React.createElement("button", {
    onClick: () => setShowMeetingForm(showMeetingForm === info.school ? null : info.school),
    className: "px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
  }, showMeetingForm === info.school ? "\u274C Cancel" : "\uD83D\uDCDD Add Meeting Note"))), showMeetingForm === info.school && React.createElement("div", {
    className: "mb-6 p-4 bg-purple-50 rounded-xl border-2 border-purple-200"
  }, React.createElement("h4", {
    className: "font-bold text-purple-800 mb-4"
  }, "\uD83D\uDCDD Add New Meeting Note"), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4 mb-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-semibold mb-1"
  }, "Meeting Date"), React.createElement("input", {
    type: "date",
    value: newMeeting.meetingDate,
    onChange: e => setNewMeeting({ ...newMeeting, meetingDate: e.target.value }),
    className: "w-full border-2 px-3 py-2 rounded-lg"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-semibold mb-1"
  }, "Meeting Time"), React.createElement("input", {
    type: "time",
    value: newMeeting.meetingTime,
    onChange: e => setNewMeeting({ ...newMeeting, meetingTime: e.target.value }),
    className: "w-full border-2 px-3 py-2 rounded-lg"
  }))), React.createElement("div", {
    className: "mb-4"
  }, React.createElement("label", {
    className: "block text-sm font-semibold mb-1"
  }, "\uD83D\uDC65 Attendees"), React.createElement("input", {
    type: "text",
    placeholder: "e.g., Principal, Coordinator, Teachers",
    value: newMeeting.attendees,
    onChange: e => setNewMeeting({ ...newMeeting, attendees: e.target.value }),
    className: "w-full border-2 px-3 py-2 rounded-lg"
  })), React.createElement("div", {
    className: "mb-4"
  }, React.createElement("label", {
    className: "block text-sm font-semibold mb-1"
  }, "\uD83D\uDCAC Discussion Points *"), React.createElement("textarea", {
    placeholder: "Enter points discussed in the meeting...",
    value: newMeeting.discussedPoints,
    onChange: e => setNewMeeting({ ...newMeeting, discussedPoints: e.target.value }),
    rows: 4,
    className: "w-full border-2 px-3 py-2 rounded-lg"
  })), React.createElement("div", {
    className: "mb-4"
  }, React.createElement("label", {
    className: "block text-sm font-semibold mb-1"
  }, "\u2705 Action Items"), React.createElement("textarea", {
    placeholder: "Enter action items and follow-ups...",
    value: newMeeting.actionPoints,
    onChange: e => setNewMeeting({ ...newMeeting, actionPoints: e.target.value }),
    rows: 3,
    className: "w-full border-2 px-3 py-2 rounded-lg"
  })), React.createElement("button", {
    onClick: () => addMeetingNote(info.school),
    disabled: isSaving,
    className: "px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 disabled:bg-gray-400"
  }, isSaving ? "\u23F3 Saving..." : "\uD83D\uDCBE Save Meeting Note")), info.updateHistory && info.updateHistory.length > 0 && React.createElement("div", {
    className: "mb-4 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded"
  }, React.createElement("div", {
    className: "font-semibold mb-1"
  }, "Edit history"), React.createElement("ul", {
    className: "text-xs max-h-32 overflow-y-auto space-y-1"
  }, info.updateHistory.slice().sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt)).map((entry, idx) => React.createElement("li", {
    key: idx
  }, new Date(entry.updatedAt).toLocaleString(), " \u2014 ", entry.updatedByName || entry.updatedBy)))), React.createElement("div", {
    className: "border-2 border-blue-300 rounded-xl p-4 mb-4 bg-blue-50"
  }, React.createElement("h4", {
    className: "font-bold text-lg mb-3 text-blue-800"
  }, "\uD83D\uDC68\u200D\uD83D\uDCBC Principal"), React.createElement("div", {
    className: "grid md:grid-cols-3 gap-3 text-sm"
  }, React.createElement("div", null, React.createElement("strong", null, "Name:"), " ", info.principalName || '—'), React.createElement("div", null, React.createElement("strong", null, "Phone:"), " ", info.principalPhone || '—'), React.createElement("div", null, React.createElement("strong", null, "Email:"), " ", info.principalEmail || '—'))), React.createElement("div", {
    className: "border-2 border-green-300 rounded-xl p-4 mb-4 bg-green-50"
  }, React.createElement("h4", {
    className: "font-bold text-lg mb-3 text-green-800"
  }, "\uD83D\uDC68\u200D\uD83D\uDCBC Vice Principal"), React.createElement("div", {
    className: "grid md:grid-cols-3 gap-3 text-sm"
  }, React.createElement("div", null, React.createElement("strong", null, "Name:"), " ", info.vicePrincipalName || '—'), React.createElement("div", null, React.createElement("strong", null, "Phone:"), " ", info.vicePrincipalPhone || '—'), React.createElement("div", null, React.createElement("strong", null, "Email:"), " ", info.vicePrincipalEmail || '—'))), React.createElement("div", {
    className: "border-2 border-orange-300 rounded-xl p-4 mb-4 bg-orange-50"
  }, React.createElement("h4", {
    className: "font-bold text-lg mb-3 text-orange-800"
  }, "\uD83D\uDC68\u200D\uD83D\uDCBC Avanti Coordinator"), React.createElement("div", {
    className: "grid md:grid-cols-3 gap-3 text-sm"
  }, React.createElement("div", null, React.createElement("strong", null, "Name:"), " ", info.coordinatorName || '—'), React.createElement("div", null, React.createElement("strong", null, "Phone:"), " ", info.coordinatorPhone || '—'), React.createElement("div", null, React.createElement("strong", null, "Email:"), " ", info.coordinatorEmail || '—'))), React.createElement("div", {
    className: "border-2 border-purple-300 rounded-xl p-4 mb-4 bg-purple-50"
  }, React.createElement("h4", {
    className: "font-bold text-lg mb-3 text-purple-800"
  }, "\uD83D\uDCF6 WiFi Connection"), React.createElement("div", {
    className: "grid md:grid-cols-3 gap-3 text-sm"
  }, React.createElement("div", null, React.createElement("strong", null, "WiFi Available:"), " ", info.wifiInClassroom || '—'), info.wifiInClassroom === 'Yes' && React.createElement(React.Fragment, null, React.createElement("div", null, React.createElement("strong", null, "Installed By:"), " ", info.wifiInstalledBy || '—'), React.createElement("div", null, React.createElement("strong", null, "Working:"), " ", info.wifiWorking || '—'), React.createElement("div", null, React.createElement("strong", null, "Monthly Bill:"), " \u20B9", info.wifiMonthlyBill || '—'), React.createElement("div", null, React.createElement("strong", null, "Connection Type:"), " ", info.wifiConnectionType || '—'), React.createElement("div", null, React.createElement("strong", null, "Network:"), " ", info.wifiNetworkName || '—'), React.createElement("div", null, React.createElement("strong", null, "Both Classes WiFi:"), " ", info.bothClassesWifi || '—')))), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4 mb-4"
  }, React.createElement("div", {
    className: "border-2 border-green-300 rounded-xl p-4 bg-green-50"
  }, React.createElement("h4", {
    className: "font-bold text-lg mb-3 text-green-800"
  }, "\uD83D\uDCDA Modules - Class 11"), React.createElement("div", {
    className: "space-y-2 text-sm"
  }, React.createElement("div", null, React.createElement("strong", null, "Received:"), " ", info.modules11Received || '—'), React.createElement("div", null, React.createElement("strong", null, "Distributed:"), " ", info.modules11Distributed || '—'), React.createElement("div", null, React.createElement("strong", null, "In Stock:"), " ", info.modules11Stock || '—'), info.modules11Remarks && React.createElement("div", {
    className: "mt-2 p-2 bg-white rounded border border-green-200"
  }, React.createElement("strong", null, "\uD83D\uDCDD Remarks:"), " ", info.modules11Remarks))), React.createElement("div", {
    className: "border-2 border-blue-300 rounded-xl p-4 bg-blue-50"
  }, React.createElement("h4", {
    className: "font-bold text-lg mb-3 text-blue-800"
  }, "\uD83D\uDCDA Modules - Class 12"), React.createElement("div", {
    className: "space-y-2 text-sm"
  }, React.createElement("div", null, React.createElement("strong", null, "Received:"), " ", info.modules12Received || '—'), React.createElement("div", null, React.createElement("strong", null, "Distributed:"), " ", info.modules12Distributed || '—'), React.createElement("div", null, React.createElement("strong", null, "In Stock:"), " ", info.modules12Stock || '—'), info.modules12Remarks && React.createElement("div", {
    className: "mt-2 p-2 bg-white rounded border border-blue-200"
  }, React.createElement("strong", null, "\uD83D\uDCDD Remarks:"), " ", info.modules12Remarks)))), info.referenceBooks && info.referenceBooks.length > 0 && React.createElement("div", {
    className: "border-2 border-yellow-300 rounded-xl p-4 mb-4 bg-yellow-50"
  }, React.createElement("h4", {
    className: "font-bold text-lg mb-3 text-yellow-800"
  }, "\uD83D\uDCD6 Reference Books"), React.createElement("div", {
    className: "overflow-x-auto"
  }, React.createElement("table", {
    className: "w-full text-sm"
  }, React.createElement("thead", {
    className: "bg-yellow-200"
  }, React.createElement("tr", null, React.createElement("th", {
    className: "p-2 text-left"
  }, "Book Name"), React.createElement("th", {
    className: "p-2 text-left"
  }, "Publisher"), React.createElement("th", {
    className: "p-2 text-left"
  }, "Author"), React.createElement("th", {
    className: "p-2 text-left"
  }, "Price"), React.createElement("th", {
    className: "p-2 text-left"
  }, "In Stock"), React.createElement("th", {
    className: "p-2 text-left"
  }, "Distributed"))), React.createElement("tbody", null, info.referenceBooks.map((book, idx) => React.createElement("tr", {
    key: idx,
    className: "border-b border-yellow-200"
  }, React.createElement("td", {
    className: "p-2"
  }, book.bookName || '—'), React.createElement("td", {
    className: "p-2"
  }, book.publisher || '—'), React.createElement("td", {
    className: "p-2"
  }, book.author || '—'), React.createElement("td", {
    className: "p-2"
  }, "\u20B9", book.price || '—'), React.createElement("td", {
    className: "p-2"
  }, book.inStock || '—'), React.createElement("td", {
    className: "p-2"
  }, book.distributed || '—'))))))), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4 mb-4"
  }, React.createElement("div", {
    className: "border-2 border-indigo-300 rounded-xl p-4 bg-indigo-50"
  }, React.createElement("h4", {
    className: "font-bold text-lg mb-3 text-indigo-800"
  }, "\uD83D\uDCBB Chromebooks - Class 11"), React.createElement("div", {
    className: "space-y-2 text-sm"
  }, React.createElement("div", null, React.createElement("strong", null, "Distributed from Avanti:"), " ", info.chromebooks11Distributed || '—'), info.chromebooks11Distributed === 'Yes' ? React.createElement(React.Fragment, null, React.createElement("div", null, React.createElement("strong", null, "Count:"), " ", info.chromebooks11Count || '—'), React.createElement("div", null, React.createElement("strong", null, "Working:"), " ", info.chromebooks11Working || '—'), React.createElement("div", null, React.createElement("strong", null, "Brand:"), " ", info.chromebooks11Brand || '—'), React.createElement("div", null, React.createElement("strong", null, "Distributed:"), " ", info.chromebooks11DistributedDate || '—')) : React.createElement(React.Fragment, null, React.createElement("div", null, React.createElement("strong", null, "Test Method:"), " ", info.chromebooks11TestMethod || '—'), React.createElement("div", null, React.createElement("strong", null, "JNV Lab Access:"), " ", info.chromebooks11JNVLabAccess || '—'), React.createElement("div", null, React.createElement("strong", null, "JNV Devices:"), " ", info.chromebooks11JNVCount || '—')))), React.createElement("div", {
    className: "border-2 border-pink-300 rounded-xl p-4 bg-pink-50"
  }, React.createElement("h4", {
    className: "font-bold text-lg mb-3 text-pink-800"
  }, "\uD83D\uDCBB Chromebooks - Class 12"), React.createElement("div", {
    className: "space-y-2 text-sm"
  }, React.createElement("div", null, React.createElement("strong", null, "Distributed from Avanti:"), " ", info.chromebooks12Distributed || '—'), info.chromebooks12Distributed === 'Yes' ? React.createElement(React.Fragment, null, React.createElement("div", null, React.createElement("strong", null, "Count:"), " ", info.chromebooks12Count || '—'), React.createElement("div", null, React.createElement("strong", null, "Working:"), " ", info.chromebooks12Working || '—'), React.createElement("div", null, React.createElement("strong", null, "Brand:"), " ", info.chromebooks12Brand || '—'), React.createElement("div", null, React.createElement("strong", null, "Distributed:"), " ", info.chromebooks12DistributedDate || '—')) : React.createElement(React.Fragment, null, React.createElement("div", null, React.createElement("strong", null, "Test Method:"), " ", info.chromebooks12TestMethod || '—'), React.createElement("div", null, React.createElement("strong", null, "JNV Lab Access:"), " ", info.chromebooks12JNVLabAccess || '—'), React.createElement("div", null, React.createElement("strong", null, "JNV Devices:"), " ", info.chromebooks12JNVCount || '—'))))), React.createElement("div", {
    className: "border-2 border-cyan-300 rounded-xl p-4 mb-4 bg-cyan-50"
  }, React.createElement("h4", {
    className: "font-bold text-lg mb-3 text-cyan-800"
  }, "\uD83D\uDDA8\uFE0F Printer"), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-3 text-sm"
  }, React.createElement("div", null, React.createElement("strong", null, "Printer Available:"), " ", info.printerAvailable || '—'), info.printerAvailable === 'Yes' && React.createElement(React.Fragment, null, React.createElement("div", null, React.createElement("strong", null, "Working:"), " ", info.printerWorking || '—'), React.createElement("div", null, React.createElement("strong", null, "Brand:"), " ", info.printerBrand || '—'), React.createElement("div", null, React.createElement("strong", null, "Issued:"), " ", info.printerIssuedDate || '—')))), info.otherAssets && info.otherAssets.length > 0 && React.createElement("div", {
    className: "border-2 border-teal-300 rounded-xl p-4 mb-4 bg-teal-50"
  }, React.createElement("h4", {
    className: "font-bold text-lg mb-3 text-teal-800"
  }, "\uD83D\uDCE6 Other Assets (", info.otherAssets.length, ")"), React.createElement("div", {
    className: "overflow-x-auto"
  }, React.createElement("table", {
    className: "w-full text-sm"
  }, React.createElement("thead", {
    className: "bg-teal-200"
  }, React.createElement("tr", null, React.createElement("th", {
    className: "p-2 text-left"
  }, "Asset Name"), React.createElement("th", {
    className: "p-2 text-left"
  }, "Quantity"), React.createElement("th", {
    className: "p-2 text-left"
  }, "Condition"), React.createElement("th", {
    className: "p-2 text-left"
  }, "Notes"))), React.createElement("tbody", null, info.otherAssets.map((asset, idx) => React.createElement("tr", {
    key: idx,
    className: "border-b border-teal-200"
  }, React.createElement("td", {
    className: "p-2 font-semibold"
  }, asset.assetName || '—'), React.createElement("td", {
    className: "p-2"
  }, asset.assetQuantity || '—'), React.createElement("td", {
    className: "p-2"
  }, React.createElement("span", {
    className: `px-2 py-1 rounded-full text-xs font-bold ${asset.assetCondition === 'Working' ? 'bg-green-100 text-green-700' : asset.assetCondition === 'Not Working' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`
  }, asset.assetCondition || '—')), React.createElement("td", {
    className: "p-2"
  }, asset.assetNotes || '—'))))))), info.meetingMinutes && info.meetingMinutes.length > 0 && React.createElement("div", {
    className: "border-2 border-purple-300 rounded-xl p-4 bg-purple-50"
  }, React.createElement("h4", {
    className: "font-bold text-lg mb-3 text-purple-800"
  }, "\uD83D\uDCDD Meeting Minutes (", info.meetingMinutes.length, ")"), React.createElement("div", {
    className: "space-y-3"
  }, info.meetingMinutes.map((meeting, idx) => React.createElement("div", {
    key: idx,
    className: "bg-white p-4 rounded-lg border border-purple-200"
  }, React.createElement("div", {
    className: "flex justify-between items-start mb-3"
  }, React.createElement("div", {
    className: "flex items-center gap-3"
  }, React.createElement("span", {
    className: "px-3 py-1 bg-purple-600 text-white rounded-full text-xs font-semibold"
  }, "Meeting #", info.meetingMinutes.length - idx), React.createElement("span", {
    className: "text-sm text-gray-600"
  }, meeting.meetingDate ? new Date(meeting.meetingDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }) : 'No date', meeting.meetingTime && ` at ${meeting.meetingTime}`)), React.createElement("button", {
    onClick: () => {
      const printWindow = window.open('', '_blank');
      const meetingNum = info.meetingMinutes.length - idx;
      const schoolName = info.school;
      const dateStr = meeting.meetingDate ? new Date(meeting.meetingDate).toLocaleDateString('en-IN', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }) : 'N/A';
      const timeStr = meeting.meetingTime || 'N/A';
      const attendeesStr = meeting.attendees || 'Not specified';
      const discussedStr = (meeting.discussedPoints || 'No points recorded').replace(/\n/g, '<br>');
      const actionStr = (meeting.actionPoints || 'No action items').replace(/\n/g, '<br>');
      const updatedStr = meeting.updatedAt ? new Date(meeting.updatedAt).toLocaleString('en-IN') : 'N/A';
      const updatedByStr = meeting.updatedBy || 'Unknown';
      const nowStr = new Date().toLocaleString('en-IN');
      printWindow.document.write('<!DOCTYPE html><html><head><title>Meeting Minutes - ' + schoolName + '</title>' + '<style>@media print { @page { margin: 1cm; size: A4; } body { -webkit-print-color-adjust: exact; } }' + 'body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; color: #333; }' + '.header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #7C3AED; padding-bottom: 15px; margin-bottom: 20px; }' + '.logo { font-size: 24px; font-weight: bold; color: #7C3AED; }' + '.meeting-badge { background: #7C3AED; color: white; padding: 8px 16px; border-radius: 20px; }' + '.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }' + '.info-item { padding: 12px; background: #F9FAFB; border-radius: 8px; border-left: 4px solid #7C3AED; }' + '.info-item label { font-size: 11px; color: #6B7280; text-transform: uppercase; display: block; margin-bottom: 4px; }' + '.info-item span { font-weight: bold; color: #1F2937; }' + '.section { margin-top: 20px; padding: 15px; background: #FAF5FF; border-radius: 8px; border: 1px solid #E9D5FF; }' + '.section-title { font-weight: bold; color: #7C3AED; margin-bottom: 10px; }' + '.section-content { white-space: pre-wrap; line-height: 1.8; }' + '.footer { margin-top: 30px; padding-top: 15px; border-top: 2px solid #E9D5FF; font-size: 11px; color: #666; display: flex; justify-content: space-between; }' + '</style></head><body>' + '<div class="header"><div><div class="logo">अवंती Avanti Fellows</div>' + '<h1 style="margin: 10px 0 5px; font-size: 22px;">Minutes of Meeting</h1>' + '<p style="margin: 0; color: #666;">🏫 ' + schoolName + '</p></div>' + '<div class="meeting-badge">Meeting #' + meetingNum + '</div></div>' + '<div class="info-grid"><div class="info-item"><label>📅 Date</label><span>' + dateStr + '</span></div>' + '<div class="info-item"><label>🕐 Time</label><span>' + timeStr + '</span></div></div>' + '<div class="section"><div class="section-title">👥 Attendees</div><div class="section-content">' + attendeesStr + '</div></div>' + '<div class="section"><div class="section-title">💬 Discussion Points</div><div class="section-content">' + discussedStr + '</div></div>' + '<div class="section" style="background: #F0FDF4; border-color: #BBF7D0;"><div class="section-title" style="color: #059669;">✅ Action Items</div><div class="section-content">' + actionStr + '</div></div>' + '<div class="footer"><div>Updated: ' + updatedStr + ' by ' + updatedByStr + '</div><div>Generated: ' + nowStr + '</div></div>' + '<script>window.onload = function() { setTimeout(function() { window.print(); }, 500); }</scr' + 'ipt></body></html>');
      printWindow.document.close();
    },
    className: "px-3 py-1 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700"
  }, "\uD83D\uDCC4 Export PDF")), React.createElement("div", {
    className: "text-sm space-y-2"
  }, React.createElement("div", null, React.createElement("strong", {
    className: "text-purple-700"
  }, "\uD83D\uDC65 Attendees:"), " ", meeting.attendees || 'Not specified'), React.createElement("div", null, React.createElement("strong", {
    className: "text-purple-700"
  }, "\uD83D\uDCAC Discussed:"), " ", meeting.discussedPoints?.substring(0, 150), meeting.discussedPoints?.length > 150 ? '...' : '' || 'No points'), meeting.actionPoints && React.createElement("div", null, React.createElement("strong", {
    className: "text-green-700"
  }, "\u2705 Actions:"), " ", meeting.actionPoints.substring(0, 100), meeting.actionPoints.length > 100 ? '...' : ''))))))))));
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
      'CoE Cuttak': 'from-green-500 to-green-600',
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
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [managersSnap, apcsSnap, teachersSnap] = await Promise.all([db.collection('managers').get(), db.collection('apcs').get(), db.collection('teachers').get()]);
        const managersData = managersSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setManagers(managersData);
        const apcsData = apcsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setApcs(apcsData);
        const teachersData = teachersSnap.docs.map(doc => ({
          docId: doc.id,
          ...doc.data()
        }));
        setAllTeachers(teachersData);
      } catch (error) {
        console.error('Error:', error);
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
        const managersSnap = await db.collection('managers').get();
        const managers = managersSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          role: 'Manager'
        }));
        const apcsSnap = await db.collection('apcs').get();
        const apcs = apcsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          role: 'APC'
        }));
        const teachersSnap = await db.collection('teachers').get();
        const allTeachers = teachersSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          role: 'Teacher'
        }));
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
        const postsSnap = await db.collection('socialPosts').orderBy('createdAt', 'desc').limit(50).get();
        setPosts(postsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })));
      } catch (error) {
        console.error('[SocialWall] Error:', error);
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
        const currentMonth = now.toISOString().slice(0, 7);
        const currentStartDate = currentMonth + '-01';
        const currentEndDate = currentMonth + '-31';
        const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
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
  }, new Date().toLocaleDateString('en-IN', {
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
  }, "(", new Date(new Date().setMonth(new Date().getMonth() - 1)).toLocaleDateString('en-IN', {
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
function TimesheetPage({
  currentUser,
  teachers,
  curriculum,
  isAdmin = false,
  isSuperAdmin = false,
  accessibleSchools = [],
  managers = []
}) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activityType, setActivityType] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [otherTopicText, setOtherTopicText] = useState('');
  const [otherChapterText, setOtherChapterText] = useState('');
  const [testType, setTestType] = useState('');
  const [notes, setNotes] = useState('');
  const [startHour, setStartHour] = useState('');
  const [startMinute, setStartMinute] = useState('');
  const [startPeriod, setStartPeriod] = useState('AM');
  const [endHour, setEndHour] = useState('');
  const [endMinute, setEndMinute] = useState('');
  const [endPeriod, setEndPeriod] = useState('PM');
  const [submitting, setSubmitting] = useState(false);
  const [timesheetEntries, setTimesheetEntries] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState(isAdmin ? 'analytics' : 'entry');
  const [filterSchool, setFilterSchool] = useState('All');
  const [filterTeacher, setFilterTeacher] = useState('All');
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const mySubject = currentUser.subject;
  const mySchool = currentUser.school;
  const myAfid = currentUser.afid || currentUser.uid || currentUser.id;
  const isManager = isAdmin || currentUser.role === 'apm' || currentUser.role === 'pm' || currentUser.role === 'aph' || currentUser.role === MANAGER_ROLES.APM || currentUser.role === MANAGER_ROLES.PM || currentUser.role === MANAGER_ROLES.APH || currentUser.role === 'super_admin' || currentUser.role === 'director' || currentUser.role === 'assoc_director' || currentUser.role === 'training' || currentUser.role === MANAGER_ROLES.DIRECTOR || currentUser.role === MANAGER_ROLES.ASSOC_DIRECTOR || currentUser.role === MANAGER_ROLES.TRAINING;
  const isViewOnly = currentUser.role === 'director' || currentUser.role === 'assoc_director' || currentUser.role === 'training' || currentUser.role === MANAGER_ROLES.DIRECTOR || currentUser.role === MANAGER_ROLES.ASSOC_DIRECTOR || currentUser.role === MANAGER_ROLES.TRAINING;
  const canEnterTimesheet = !isManager && (currentUser.userType === 'teacher' || currentUser.userType === 'apc' || currentUser.role === 'apc' || currentUser.role === MANAGER_ROLES.APC || !currentUser.role && currentUser.subject);
  const stableMySchool = useMemo(() => mySchool, [mySchool]);
  const stableMySubject = useMemo(() => mySubject, [mySubject]);
  const HOURS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
  const PERIODS = ['AM', 'PM'];
  const to24Hour = (hour, period) => {
    let h = parseInt(hour);
    if (period === 'AM' && h === 12) h = 0;
    if (period === 'PM' && h !== 12) h += 12;
    return h;
  };
  const getTimeString = (hour, minute, period) => {
    if (!hour || !minute) return '';
    const h24 = to24Hour(hour, period);
    return `${h24.toString().padStart(2, '0')}:${minute}`;
  };
  const ACTIVITY_TYPES = [{
    id: 'teaching',
    label: '📚 Teaching',
    icon: '📚'
  }, {
    id: 'class_preparation',
    label: '📖 Preparation for Class',
    icon: '📖'
  }, {
    id: 'tests',
    label: '📝 Tests',
    icon: '📝'
  }, {
    id: 'mentoring',
    label: '👥 Mentoring',
    icon: '👥'
  }, {
    id: 'class_cancelled',
    label: '🚫 Class Cancelled',
    icon: '🚫'
  }, {
    id: 'class_observation',
    label: '👁️ Class Observation',
    icon: '👁️'
  }, {
    id: 'jnv_school_work',
    label: '🏫 JNV School Work',
    icon: '🏫'
  }, {
    id: 'data_entry',
    label: '💻 Data Entry',
    icon: '💻'
  }, {
    id: 'weekly_checkin',
    label: '🗓️ Weekly Check-in Meetings',
    icon: '🗓️'
  }, {
    id: 'others',
    label: '📋 Others',
    icon: '📋'
  }];
  const TEST_TYPES = [{
    id: 'chapter_test',
    label: 'Chapter Test'
  }, {
    id: 'aiet',
    label: 'AIET'
  }];
  const getSubjectInitial = () => {
    const subject = mySubject?.toLowerCase()?.trim();
    if (!subject) return '';
    if (subject.includes('physics')) return 'p';
    if (subject.includes('chemistry')) return 'c';
    if (subject.includes('math') || subject.includes('maths') || subject.includes('mathematics')) return 'm';
    if (subject.includes('biology') || subject.includes('bio')) return 'b';
    return subject.charAt(0);
  };
  const getChaptersForSubject = grade => {
    if (!grade) return [];
    const chaptersMap = new Map();
    const subjectKey = mySubject?.toLowerCase()?.trim();
    const gradeStr = String(grade);
    const subjectInitial = getSubjectInitial();
    const chapterMatchesGradeAndSubject = chapterName => {
      if (!chapterName) return false;
      const name = chapterName.toLowerCase();
      const match = name.match(/^(\d{2})([a-z])(\d+)/i);
      if (match) {
        const chapterGrade = match[1];
        const chapterSubject = match[2].toLowerCase();
        if (chapterGrade !== gradeStr) return false;
        if (subjectInitial && chapterSubject !== subjectInitial) return false;
        return true;
      }
      return name.includes(subjectKey);
    };
    const getChapterKey = name => {
      const match = name.match(/^(\d{2}[a-zA-Z]\d+)/);
      return match ? match[1].toUpperCase() : name.toLowerCase().trim();
    };
    Object.entries(curriculum).forEach(([key, data]) => {
      const keyLower = key.toLowerCase();
      const matchesSubject = subjectKey && keyLower.includes(subjectKey);
      const matchesSchool = keyLower.includes(mySchool?.toLowerCase() || '');
      if (matchesSubject || matchesSchool) {
        if (data.chapters && Array.isArray(data.chapters)) {
          data.chapters.forEach(ch => {
            if (ch.name) {
              if (chapterMatchesGradeAndSubject(ch.name)) {
                const chapterKey = getChapterKey(ch.name);
                if (!chaptersMap.has(chapterKey)) {
                  chaptersMap.set(chapterKey, {
                    name: ch.name,
                    topics: ch.topics || []
                  });
                } else {
                  const existing = chaptersMap.get(chapterKey);
                  const newTopics = ch.topics || [];
                  const existingTopicNames = new Set(existing.topics.map(t => (t.name || t).toLowerCase()));
                  newTopics.forEach(t => {
                    const topicName = (t.name || t).toLowerCase();
                    if (!existingTopicNames.has(topicName)) {
                      existing.topics.push(t);
                    }
                  });
                }
              }
            }
          });
        }
      }
    });
    const chapters = Array.from(chaptersMap.values());
    chapters.sort((a, b) => {
      const matchA = a.name.match(/^(\d{2})([a-zA-Z])(\d+)/);
      const matchB = b.name.match(/^(\d{2})([a-zA-Z])(\d+)/);
      if (matchA && matchB) {
        if (matchA[1] !== matchB[1]) return matchA[1].localeCompare(matchB[1]);
        if (matchA[2].toLowerCase() !== matchB[2].toLowerCase()) return matchA[2].localeCompare(matchB[2]);
        return parseInt(matchA[3]) - parseInt(matchB[3]);
      }
      return a.name.localeCompare(b.name);
    });
    return chapters;
  };
  const getTopicsForChapter = () => {
    if (!selectedClass || !selectedChapter || selectedChapter === 'Others') return [];
    const chapters = getChaptersForSubject(selectedClass);
    const chapter = chapters.find(ch => ch.name === selectedChapter);
    return chapter?.topics || [];
  };
  const calculateHours = () => {
    if (!startHour || !startMinute || !endHour || !endMinute) return 0;
    try {
      const startH24 = to24Hour(startHour, startPeriod);
      const endH24 = to24Hour(endHour, endPeriod);
      const startMinutes = startH24 * 60 + parseInt(startMinute);
      const endMinutes = endH24 * 60 + parseInt(endMinute);
      let diffMinutes = endMinutes - startMinutes;
      if (diffMinutes < 0) {
        diffMinutes += 24 * 60;
      }
      const hours = diffMinutes / 60;
      return hours > 0 ? hours.toFixed(2) : 0;
    } catch (e) {
      console.error('Error calculating hours:', e);
      return 0;
    }
  };
  const hoursWorked = calculateHours();
  const startTime = getTimeString(startHour, startMinute, startPeriod);
  const endTime = getTimeString(endHour, endMinute, endPeriod);
  const dataFetchedRef = useRef(false);
  const lastFetchParamsRef = useRef('');
  const [fetchError, setFetchError] = useState(null);
  useEffect(() => {
    const fetchParamsHash = JSON.stringify({
      isAdmin,
      isSuperAdmin,
      myAfid,
      managersCount: managers?.length || 0,
      currentUserName: currentUser?.name,
      currentUserRole: currentUser?.role
    });
    if (dataFetchedRef.current && lastFetchParamsRef.current === fetchParamsHash) {
      return;
    }
    const fetchWithTimeout = (promise, timeoutMs = 15000) => {
      return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout - slow connection')), timeoutMs))]);
    };
    const fetchData = async () => {
      try {
        setLoading(true);
        setFetchError(null);
        const myManagerId = currentUser.managerId || currentUser.id || currentUser.uid || currentUser.afid;
        const myManagerName = currentUser.name;
        const myManagerProfile = managers.find(m => m.id === myManagerId || m.name === myManagerName);
        const myDirectSchools = myManagerProfile?.directSchools || [];
        const myRole = myManagerProfile?.role || currentUser.role || '';
        const isDirector = myRole === 'director' || myRole === 'assoc_director' || myRole === 'training';
        const hasViewAllAccess = isSuperAdmin || isDirector;
        console.log('Timesheet - Fetching data:', {
          isAdmin,
          isSuperAdmin,
          isDirector,
          myRole,
          schools: myDirectSchools.length
        });
        let schoolsToManage = [...myDirectSchools];
        if (myRole === 'pm') {
          const apmSchools = new Set();
          managers.forEach(m => {
            if (m.role === 'apm' && m.status === 'active' && m.directSchools) {
              m.directSchools.forEach(school => apmSchools.add(school?.toLowerCase?.() || school));
            }
          });
          schoolsToManage = myDirectSchools.filter(school => !apmSchools.has(school?.toLowerCase?.() || school));
        }
        let entriesQuery;
        if (isAdmin) {
          if (hasViewAllAccess) {
            entriesQuery = db.collection('timesheetEntries').orderBy('date', 'desc').limit(500);
          } else {
            entriesQuery = db.collection('timesheetEntries').orderBy('date', 'desc').limit(500);
          }
        } else {
          entriesQuery = db.collection('timesheetEntries').where('teacherAfid', '==', myAfid).orderBy('date', 'desc').limit(100);
        }
        const entriesSnap = await entriesQuery.get();
        let entries = entriesSnap.docs.map(d => ({
          ...d.data(),
          id: d.id,
          date: d.data().date || '',
          createdAt: d.data().createdAt?.toDate?.() || new Date()
        }));
        if (isAdmin && !hasViewAllAccess) {
          entries = entries.filter(e => {
            const entrySchoolLower = (e.school || '').toString().toLowerCase().trim();
            const schoolMatch = schoolsToManage.some(s => s && s.toString().toLowerCase().trim() === entrySchoolLower);
            const assignedToMe = e.lineManagerId === myManagerId || e.lineManagerName === myManagerName;
            return schoolMatch || assignedToMe;
          });
        }
        setTimesheetEntries(entries);
        if (isAdmin && !isDirector) {
          let allPendingEntries = [];
          try {
            const pendingSnap = await db.collection('timesheetEntries').where('status', '==', 'pending').get();
            allPendingEntries = pendingSnap.docs.map(d => ({
              ...d.data(),
              id: d.id
            }));
          } catch (e) {
            console.error('Error fetching pending entries:', e);
          }
          if (!isSuperAdmin && allPendingEntries.length > 0) {
            allPendingEntries = allPendingEntries.filter(entry => {
              const managerIdMatch = entry.lineManagerId === myManagerId;
              const managerNameMatch = entry.lineManagerName === myManagerName;
              const entrySchoolLower = (entry.school || '').toString().toLowerCase().trim();
              const schoolMatch = schoolsToManage.some(s => s && s.toString().toLowerCase().trim() === entrySchoolLower);
              return managerIdMatch || managerNameMatch || schoolMatch;
            });
          }
          allPendingEntries.sort((a, b) => {
            const dateA = a.date || '';
            const dateB = b.date || '';
            return dateB.localeCompare(dateA);
          });
          setPendingApprovals(allPendingEntries);
        } else if (isDirector) {
          setPendingApprovals([]);
        }
        dataFetchedRef.current = true;
        lastFetchParamsRef.current = fetchParamsHash;
      } catch (error) {
        console.error('Error fetching timesheet data:', error);
        if (error.message.includes('timeout')) {
          setFetchError('Slow connection. Data may be loading from cache.');
        } else if (!navigator.onLine) {
          setFetchError('You are offline. Showing cached data if available.');
        } else {
          setFetchError('Could not load data. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin, isSuperAdmin, myAfid, currentUser?.name, currentUser?.role, managers?.length]);
  const handleSubmit = async e => {
    e.preventDefault();
    if (!activityType) {
      alert('Please select an activity type');
      return;
    }
    if (!startHour || !startMinute || !endHour || !endMinute) {
      alert('Please select start and end time');
      return;
    }
    if (parseFloat(hoursWorked) <= 0) {
      alert('End time must be after start time');
      return;
    }
    if (activityType === 'teaching' && (!selectedClass || !selectedChapter)) {
      alert('Please select class and chapter for teaching');
      return;
    }
    if (activityType === 'tests') {
      if (!testType || !selectedClass) {
        alert('Please select test type and class');
        return;
      }
      if (testType === 'chapter_test' && !selectedChapter) {
        alert('Please select chapter for Chapter Test');
        return;
      }
    }
    if (activityType === 'mentoring' && !selectedClass) {
      alert('Please select class for mentoring');
      return;
    }
    if (activityType === 'class_cancelled' && !selectedClass) {
      alert('Please select class for cancelled class');
      return;
    }
    if (activityType === 'class_preparation' && !selectedClass) {
      alert('Please select class for preparation');
      return;
    }
    try {
      setSubmitting(true);
      let lineManagerId = null;
      let lineManagerName = null;
      console.log('Timesheet - Looking up line manager for:', {
        teacherName: currentUser.name,
        teacherAfid: myAfid,
        school: mySchool,
        managersAvailable: managers.length
      });
      console.log('Timesheet - Available managers:', managers.map(m => ({
        id: m.id,
        name: m.name,
        role: m.role,
        directSchools: m.directSchools,
        status: m.status
      })));
      const apm = managers.find(m => m.role === 'apm' && m.status === 'active' && m.directSchools?.includes(mySchool));
      if (apm) {
        lineManagerId = apm.id;
        lineManagerName = apm.name;
        console.log('Timesheet - Found APM for school:', {
          apmId: apm.id,
          apmName: apm.name,
          school: mySchool,
          apmDirectSchools: apm.directSchools
        });
      }
      if (!lineManagerId) {
        const pm = managers.find(m => m.role === 'pm' && m.status === 'active' && m.directSchools?.includes(mySchool));
        if (pm) {
          lineManagerId = pm.id;
          lineManagerName = pm.name;
          console.log('Timesheet - Found PM for school:', {
            pmId: pm.id,
            pmName: pm.name,
            school: mySchool
          });
        }
      }
      if (!lineManagerId) {
        const anyManager = managers.find(m => m.directSchools?.includes(mySchool) && m.status === 'active');
        if (anyManager) {
          lineManagerId = anyManager.id;
          lineManagerName = anyManager.name;
          console.log('Timesheet - Found fallback manager for school:', {
            managerId: anyManager.id,
            managerName: anyManager.name,
            school: mySchool
          });
        }
      }
      if (!lineManagerId) {
        console.log('Timesheet - No manager found in local data, checking Firestore...');
        try {
          const managersSnap = await db.collection('managers').where('directSchools', 'array-contains', mySchool).where('status', '==', 'active').limit(1).get();
          if (!managersSnap.empty) {
            const managerDoc = managersSnap.docs[0];
            lineManagerId = managerDoc.id;
            lineManagerName = managerDoc.data().name;
            console.log('Timesheet - Found manager from Firestore:', {
              lineManagerId,
              lineManagerName
            });
          }
        } catch (e) {
          console.error('Timesheet - Error fetching manager from Firestore:', e);
        }
      }
      console.log('Timesheet Entry - Final Line Manager Assignment:', {
        teacherName: currentUser.name,
        school: mySchool,
        lineManagerId,
        lineManagerName,
        success: !!lineManagerId
      });
      if (!lineManagerId) {
        console.warn('⚠️ Timesheet - No line manager found for school:', mySchool);
        alert('⚠️ Warning: No line manager found for your school. Please contact admin to set up manager assignment for ' + mySchool);
      }
      const entry = {
        date: selectedDate,
        activityType: activityType,
        teacherAfid: myAfid,
        teacherName: currentUser.name,
        teacherEmail: currentUser.email,
        school: mySchool,
        subject: mySubject,
        class: selectedClass || null,
        chapter: selectedChapter === 'Others' ? otherChapterText : selectedChapter || null,
        topic: selectedTopic === 'Others' ? otherTopicText : selectedTopic || null,
        testType: testType || null,
        notes: notes || '',
        startTime: startTime,
        endTime: endTime,
        hours: parseFloat(hoursWorked),
        status: 'pending',
        lineManagerId: lineManagerId,
        lineManagerName: lineManagerName,
        submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      const docRef = await db.collection('timesheetEntries').add(entry);
      setTimesheetEntries(prev => [{
        ...entry,
        id: docRef.id,
        createdAt: new Date()
      }, ...prev]);
      setActivityType('');
      setSelectedClass('');
      setSelectedChapter('');
      setSelectedTopic('');
      setOtherTopicText('');
      setOtherChapterText('');
      setTestType('');
      setNotes('');
      setStartHour('');
      setStartMinute('');
      setStartPeriod('AM');
      setEndHour('');
      setEndMinute('');
      setEndPeriod('PM');
      alert('✅ Timesheet entry submitted for approval!');
    } catch (error) {
      console.error('Error submitting timesheet:', error);
      alert('Error submitting entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  const handleApproval = async (entryId, action) => {
    try {
      await db.collection('timesheetEntries').doc(entryId).update({
        status: action,
        approvedBy: currentUser.name,
        approvedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      setPendingApprovals(prev => prev.filter(e => e.id !== entryId));
      setTimesheetEntries(prev => prev.map(e => e.id === entryId ? {
        ...e,
        status: action
      } : e));
      alert(`✅ Entry ${action}!`);
    } catch (error) {
      console.error('Error updating approval:', error);
      alert('Error updating entry');
    }
  };
  const handleApproveAll = async () => {
    if (pendingApprovals.length === 0) {
      alert('No pending approvals to process');
      return;
    }
    const confirmBulk = confirm(`⚠️ Approve All Entries\n\nAre you sure you want to approve all ${pendingApprovals.length} pending timesheet entries?\n\nThis action will:\n• Approve ${pendingApprovals.length} timesheet logs\n• Mark them as approved by ${currentUser.name}\n\nClick OK to proceed.`);
    if (!confirmBulk) return;
    try {
      const batch = db.batch();
      pendingApprovals.forEach(entry => {
        const entryRef = db.collection('timesheetEntries').doc(entry.id);
        batch.update(entryRef, {
          status: 'approved',
          approvedBy: currentUser.name,
          approvedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      });
      await batch.commit();
      const approvedIds = pendingApprovals.map(e => e.id);
      setPendingApprovals([]);
      setTimesheetEntries(prev => prev.map(e => approvedIds.includes(e.id) ? {
        ...e,
        status: 'approved'
      } : e));
      alert(`✅ Successfully approved all ${approvedIds.length} timesheet entries!`);
    } catch (error) {
      console.error('Error bulk approving:', error);
      alert('❌ Error approving entries. Some entries may have been approved. Please refresh and try again.');
    }
  };
  const handleDeleteEntry = async (entryId, teacherName) => {
    if (!isAdmin) {
      alert('❌ Only Managers and APMs can delete entries');
      return;
    }
    const confirmDelete = confirm(`⚠️ Delete Entry\n\nAre you sure you want to delete this timesheet entry for ${teacherName}?\n\nThis action cannot be undone.`);
    if (!confirmDelete) return;
    try {
      await db.collection('timesheetEntries').doc(entryId).delete();
      setPendingApprovals(prev => prev.filter(e => e.id !== entryId));
      setTimesheetEntries(prev => prev.filter(e => e.id !== entryId));
      alert('✅ Entry deleted successfully!');
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('❌ Error deleting entry. Please try again.');
    }
  };
  const filteredEntries = useMemo(() => {
    return timesheetEntries.filter(entry => {
      const matchesSchool = filterSchool === 'All' || entry.school === filterSchool;
      const matchesTeacher = filterTeacher === 'All' || entry.teacherAfid === filterTeacher;
      const matchesMonth = entry.date?.startsWith(filterMonth);
      return matchesSchool && matchesTeacher && matchesMonth;
    });
  }, [timesheetEntries, filterSchool, filterTeacher, filterMonth]);
  const handleExportTimesheet = () => {
    if (filteredEntries.length === 0) {
      alert('No entries to export. Try adjusting your filters.');
      return;
    }
    const headers = ['Date', 'Teacher Name', 'Teacher AFID', 'School', 'Subject', 'Activity Type', 'Class', 'Chapter', 'Topic', 'Start Time', 'End Time', 'Hours', 'Notes', 'Status', 'Approved By', 'Line Manager'];
    const getActivityLabel = activityId => {
      const activity = ACTIVITY_TYPES.find(t => t.id === activityId);
      return activity ? activity.label.replace(/[^\w\s]/g, '').trim() : activityId;
    };
    const rows = filteredEntries.map(entry => [entry.date || '', entry.teacherName || '', entry.teacherAfid || '', entry.school || '', entry.subject || '', getActivityLabel(entry.activityType), entry.class || '', entry.chapter || '', entry.topic || '', entry.startTime || '', entry.endTime || '', entry.hours || '', (entry.notes || '').replace(/"/g, '""').replace(/\n/g, ' '), entry.status || 'pending', entry.approvedBy || '', entry.lineManagerName || '']);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;'
    });
    const link = document.createElement('a');
    const monthName = new Date(filterMonth + '-01').toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric'
    });
    const fileName = `Timesheet_${filterSchool === 'All' ? 'AllSchools' : filterSchool}_${monthName.replace(' ', '_')}.csv`;
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  };
  const chartData = useMemo(() => {
    const byType = {};
    filteredEntries.forEach(entry => {
      const type = entry.activityType || 'others';
      byType[type] = (byType[type] || 0) + (parseFloat(entry.hours) || 0);
    });
    return byType;
  }, [filteredEntries]);
  const teacherAggregates = useMemo(() => {
    const byTeacher = {};
    filteredEntries.forEach(entry => {
      const key = entry.teacherAfid;
      if (!byTeacher[key]) {
        byTeacher[key] = {
          name: entry.teacherName,
          school: entry.school,
          totalHours: 0,
          approved: 0,
          pending: 0
        };
      }
      byTeacher[key].totalHours += parseFloat(entry.hours) || 0;
      if (entry.status === 'approved') byTeacher[key].approved += parseFloat(entry.hours) || 0;
      if (entry.status === 'pending') byTeacher[key].pending += parseFloat(entry.hours) || 0;
    });
    return Object.values(byTeacher).sort((a, b) => b.totalHours - a.totalHours);
  }, [filteredEntries]);
  useEffect(() => {
    if (!chartRef.current || Object.keys(chartData).length === 0) return;
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    const labels = ACTIVITY_TYPES.map(t => t.label.replace(/^[^\s]+\s/, ''));
    const data = ACTIVITY_TYPES.map(t => chartData[t.id] || 0);
    const colors = ['#F4B41A', '#3B82F6', '#10B981', '#8B5CF6', '#EF4444', '#6B7280'];
    chartInstance.current = new Chart(chartRef.current, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              font: {
                size: 12
              }
            }
          },
          title: {
            display: true,
            text: 'Hours by Activity Type',
            font: {
              size: 16,
              weight: 'bold'
            }
          }
        }
      }
    });
    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [chartData]);
  const myMonthlyHours = useMemo(() => {
    return timesheetEntries.filter(e => e.teacherAfid === myAfid && e.date?.startsWith(filterMonth)).reduce((sum, e) => sum + (parseFloat(e.hours) || 0), 0);
  }, [timesheetEntries, myAfid, filterMonth]);
  const uniqueTeachers = useMemo(() => {
    const map = {};
    timesheetEntries.forEach(e => {
      if (e.teacherAfid && !map[e.teacherAfid]) {
        map[e.teacherAfid] = {
          afid: e.teacherAfid,
          name: e.teacherName
        };
      }
    });
    return Object.values(map);
  }, [timesheetEntries]);
  if (loading) {
    return React.createElement("div", {
      className: "flex items-center justify-center h-64"
    }, React.createElement("div", {
      className: "text-center"
    }, React.createElement("div", {
      className: "w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"
    }), React.createElement("p", {
      className: "text-gray-500 font-medium"
    }, "Loading Timesheet..."), React.createElement("p", {
      className: "text-xs text-gray-400 mt-2"
    }, navigator.onLine ? '📶 Connected' : '📴 Offline - Loading from cache')));
  }
  if (fetchError) {
    return React.createElement("div", {
      className: "flex items-center justify-center h-64"
    }, React.createElement("div", {
      className: "text-center"
    }, React.createElement("div", {
      className: "text-5xl mb-4"
    }, "\u26A0\uFE0F"), React.createElement("p", {
      className: "text-gray-700 font-medium mb-2"
    }, "Could not load timesheet"), React.createElement("p", {
      className: "text-sm text-gray-500 mb-4"
    }, fetchError), React.createElement("button", {
      onClick: () => {
        dataFetchedRef.current = false;
        lastFetchParamsRef.current = '';
        setFetchError(null);
        setLoading(true);
      },
      className: "px-6 py-2 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600"
    }, "\uD83D\uDD04 Retry")));
  }
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("div", {
    className: "bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("div", {
    className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
  }, React.createElement("div", null, React.createElement("h1", {
    className: "text-2xl md:text-3xl font-bold flex items-center gap-3"
  }, "\u23F1\uFE0F Timesheet"), React.createElement("p", {
    className: "opacity-90 mt-1"
  }, "Track your daily activities and work hours")), React.createElement("div", {
    className: "flex gap-3"
  }, React.createElement("div", {
    className: "bg-white/20 px-4 py-2 rounded-xl text-center"
  }, React.createElement("div", {
    className: "text-2xl font-bold"
  }, myMonthlyHours.toFixed(1)), React.createElement("div", {
    className: "text-xs opacity-90"
  }, "Hours This Month"))))), React.createElement("div", {
    className: "flex flex-wrap gap-2 bg-white p-2 rounded-xl shadow"
  }, canEnterTimesheet && React.createElement(React.Fragment, null, React.createElement("button", {
    onClick: () => setActiveView('entry'),
    className: `px-4 py-2 rounded-lg font-semibold transition-all ${activeView === 'entry' ? 'avanti-gradient text-white' : 'bg-gray-100 hover:bg-gray-200'}`
  }, "\u2795 New Entry"), React.createElement("button", {
    onClick: () => setActiveView('myLogs'),
    className: `px-4 py-2 rounded-lg font-semibold transition-all ${activeView === 'myLogs' ? 'avanti-gradient text-white' : 'bg-gray-100 hover:bg-gray-200'}`
  }, "\uD83D\uDCCB My Logs")), isAdmin && React.createElement("button", {
    onClick: () => setActiveView('approvals'),
    className: `px-4 py-2 rounded-lg font-semibold transition-all ${activeView === 'approvals' ? 'avanti-gradient text-white' : 'bg-gray-100 hover:bg-gray-200'}`
  }, "\u2705 Approvals ", pendingApprovals.length > 0 && React.createElement("span", {
    className: "ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full"
  }, pendingApprovals.length)), isAdmin && React.createElement("button", {
    onClick: () => setActiveView('allEntries'),
    className: `px-4 py-2 rounded-lg font-semibold transition-all ${activeView === 'allEntries' ? 'avanti-gradient text-white' : 'bg-gray-100 hover:bg-gray-200'}`
  }, "\uD83D\uDCCB All Entries"), React.createElement("button", {
    onClick: () => setActiveView('analytics'),
    className: `px-4 py-2 rounded-lg font-semibold transition-all ${activeView === 'analytics' ? 'avanti-gradient text-white' : 'bg-gray-100 hover:bg-gray-200'}`
  }, "\uD83D\uDCCA Analytics")), activeView === 'entry' && canEnterTimesheet && React.createElement("div", {
    className: "grid md:grid-cols-3 gap-6"
  }, React.createElement("div", {
    className: "md:col-span-2 bg-white p-8 rounded-2xl shadow-lg"
  }, React.createElement("h2", {
    className: "text-2xl font-bold mb-8 flex items-center gap-3"
  }, React.createElement("span", {
    className: "text-3xl"
  }, "\uD83D\uDCDD"), " Log Activity"), React.createElement("form", {
    onSubmit: handleSubmit,
    className: "space-y-6"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-base font-semibold text-gray-700 mb-3"
  }, "\uD83D\uDCC5 Date"), React.createElement("input", {
    type: "date",
    value: selectedDate,
    onChange: e => setSelectedDate(e.target.value),
    min: (() => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return yesterday.toISOString().split('T')[0];
    })(),
    max: new Date().toISOString().split('T')[0],
    className: "w-full border-2 border-gray-200 px-5 py-4 rounded-xl text-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all",
    required: true
  }), React.createElement("p", {
    className: "text-xs text-gray-500 mt-2"
  }, "\uD83D\uDCCC You can only log activities for today or yesterday")), React.createElement("div", null, React.createElement("label", {
    className: "block text-base font-semibold text-gray-700 mb-3"
  }, "\uD83C\uDFAF Activity Type"), React.createElement("select", {
    value: activityType,
    onChange: e => {
      setActivityType(e.target.value);
      setSelectedClass('');
      setSelectedChapter('');
      setSelectedTopic('');
      setTestType('');
    },
    className: "w-full border-2 border-gray-200 px-5 py-4 rounded-xl text-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200 transition-all appearance-none bg-white cursor-pointer",
    required: true
  }, React.createElement("option", {
    value: ""
  }, "-- Select Activity --"), ACTIVITY_TYPES.map(type => React.createElement("option", {
    key: type.id,
    value: type.id
  }, type.label)))), activityType === 'teaching' && React.createElement(React.Fragment, null, React.createElement("div", {
    className: "grid md:grid-cols-2 gap-5"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-base font-semibold text-gray-700 mb-3"
  }, "\uD83C\uDF93 Class"), React.createElement("select", {
    value: selectedClass,
    onChange: e => {
      setSelectedClass(e.target.value);
      setSelectedChapter('');
      setSelectedTopic('');
      setOtherChapterText('');
      setOtherTopicText('');
    },
    className: "w-full border-2 border-gray-200 px-5 py-4 rounded-xl text-lg focus:border-yellow-500 transition-all",
    required: true
  }, React.createElement("option", {
    value: ""
  }, "-- Select Class --"), React.createElement("option", {
    value: "11"
  }, "Class 11"), React.createElement("option", {
    value: "12"
  }, "Class 12"))), React.createElement("div", null, React.createElement("label", {
    className: "block text-base font-semibold text-gray-700 mb-3"
  }, "\uD83D\uDCD6 Chapter"), React.createElement("select", {
    value: selectedChapter,
    onChange: e => {
      setSelectedChapter(e.target.value);
      setSelectedTopic('');
      setOtherTopicText('');
      if (e.target.value !== 'Others') setOtherChapterText('');
    },
    className: "w-full border-2 border-gray-200 px-5 py-4 rounded-xl text-lg focus:border-yellow-500 transition-all",
    required: true,
    disabled: !selectedClass
  }, React.createElement("option", {
    value: ""
  }, "-- Select Chapter --"), getChaptersForSubject(selectedClass).map((ch, idx) => React.createElement("option", {
    key: idx,
    value: ch.name
  }, ch.name)), React.createElement("option", {
    value: "Others"
  }, "Others")))), selectedChapter === 'Others' && React.createElement("div", null, React.createElement("label", {
    className: "block text-base font-semibold text-gray-700 mb-3"
  }, "\u270F\uFE0F Enter Chapter Name"), React.createElement("input", {
    type: "text",
    value: otherChapterText,
    onChange: e => setOtherChapterText(e.target.value),
    placeholder: "Enter the chapter name...",
    className: "w-full border-2 border-gray-200 px-5 py-4 rounded-xl text-lg focus:border-yellow-500 transition-all",
    required: true
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-base font-semibold text-gray-700 mb-3"
  }, "\uD83D\uDCD1 Topic"), React.createElement("select", {
    value: selectedTopic,
    onChange: e => {
      setSelectedTopic(e.target.value);
      if (e.target.value !== 'Others') setOtherTopicText('');
    },
    className: "w-full border-2 border-gray-200 px-5 py-4 rounded-xl text-lg focus:border-yellow-500 transition-all",
    disabled: !selectedChapter
  }, React.createElement("option", {
    value: ""
  }, "-- Select Topic (Optional) --"), getTopicsForChapter().map((topic, idx) => React.createElement("option", {
    key: idx,
    value: typeof topic === 'string' ? topic : topic.name
  }, typeof topic === 'string' ? topic : topic.name)), React.createElement("option", {
    value: "Others"
  }, "Others"))), selectedTopic === 'Others' && React.createElement("div", null, React.createElement("label", {
    className: "block text-base font-semibold text-gray-700 mb-3"
  }, "\u270F\uFE0F Enter Topic Name"), React.createElement("input", {
    type: "text",
    value: otherTopicText,
    onChange: e => setOtherTopicText(e.target.value),
    placeholder: "Enter the topic name...",
    className: "w-full border-2 border-gray-200 px-5 py-4 rounded-xl text-lg focus:border-yellow-500 transition-all",
    required: true
  }))), activityType === 'tests' && React.createElement(React.Fragment, null, React.createElement("div", null, React.createElement("label", {
    className: "block text-base font-semibold text-gray-700 mb-3"
  }, "\uD83D\uDCDD Test Type"), React.createElement("select", {
    value: testType,
    onChange: e => {
      setTestType(e.target.value);
      if (e.target.value === 'aiet') {
        setSelectedChapter('');
      }
    },
    className: "w-full border-2 border-gray-200 px-5 py-4 rounded-xl text-lg focus:border-yellow-500 transition-all",
    required: true
  }, React.createElement("option", {
    value: ""
  }, "-- Select Test Type --"), TEST_TYPES.map(t => React.createElement("option", {
    key: t.id,
    value: t.id
  }, t.label)))), React.createElement("div", null, React.createElement("label", {
    className: "block text-base font-semibold text-gray-700 mb-3"
  }, "\uD83C\uDF93 Class"), React.createElement("select", {
    value: selectedClass,
    onChange: e => {
      setSelectedClass(e.target.value);
      setSelectedChapter('');
    },
    className: "w-full border-2 border-gray-200 px-5 py-4 rounded-xl text-lg focus:border-yellow-500 transition-all",
    required: true
  }, React.createElement("option", {
    value: ""
  }, "-- Select Class --"), React.createElement("option", {
    value: "11"
  }, "Class 11"), React.createElement("option", {
    value: "12"
  }, "Class 12"))), testType === 'chapter_test' && React.createElement("div", null, React.createElement("label", {
    className: "block text-base font-semibold text-gray-700 mb-3"
  }, "\uD83D\uDCD6 Chapter"), React.createElement("select", {
    value: selectedChapter,
    onChange: e => setSelectedChapter(e.target.value),
    className: "w-full border-2 border-gray-200 px-5 py-4 rounded-xl text-lg focus:border-yellow-500 transition-all",
    required: true,
    disabled: !selectedClass
  }, React.createElement("option", {
    value: ""
  }, "-- Select Chapter --"), getChaptersForSubject(selectedClass).map((ch, idx) => React.createElement("option", {
    key: idx,
    value: ch.name
  }, ch.name)), React.createElement("option", {
    value: "Others"
  }, "Others"))), testType === 'aiet' && React.createElement("div", {
    className: "bg-blue-50 border border-blue-200 p-4 rounded-xl"
  }, React.createElement("p", {
    className: "text-blue-700 text-sm"
  }, React.createElement("strong", null, "\u2139\uFE0F AIET:"), " All India Entrance Test - covers full syllabus, no specific chapter selection needed.")), React.createElement("div", null, React.createElement("label", {
    className: "block text-base font-semibold text-gray-700 mb-3"
  }, "\uD83D\uDCDD Notes"), React.createElement("textarea", {
    value: notes,
    onChange: e => setNotes(e.target.value),
    placeholder: "Add any notes about the test...",
    className: "w-full border-2 border-gray-200 px-5 py-4 rounded-xl text-lg focus:border-yellow-500 transition-all min-h-[100px] resize-y"
  }))), activityType === 'mentoring' && React.createElement(React.Fragment, null, React.createElement("div", null, React.createElement("label", {
    className: "block text-base font-semibold text-gray-700 mb-3"
  }, "\uD83C\uDF93 Class"), React.createElement("select", {
    value: selectedClass,
    onChange: e => setSelectedClass(e.target.value),
    className: "w-full border-2 border-gray-200 px-5 py-4 rounded-xl text-lg focus:border-yellow-500 transition-all",
    required: true
  }, React.createElement("option", {
    value: ""
  }, "-- Select Class --"), React.createElement("option", {
    value: "11"
  }, "Class 11"), React.createElement("option", {
    value: "12"
  }, "Class 12"))), React.createElement("div", null, React.createElement("label", {
    className: "block text-base font-semibold text-gray-700 mb-3"
  }, "\uD83D\uDCDD Notes"), React.createElement("textarea", {
    value: notes,
    onChange: e => setNotes(e.target.value),
    placeholder: "What did you discuss during mentoring?",
    className: "w-full border-2 border-gray-200 px-5 py-4 rounded-xl text-lg focus:border-yellow-500 transition-all min-h-[100px] resize-y"
  }))), activityType === 'class_cancelled' && React.createElement(React.Fragment, null, React.createElement("div", null, React.createElement("label", {
    className: "block text-base font-semibold text-gray-700 mb-3"
  }, "\uD83C\uDF93 Class"), React.createElement("select", {
    value: selectedClass,
    onChange: e => setSelectedClass(e.target.value),
    className: "w-full border-2 border-gray-200 px-5 py-4 rounded-xl text-lg focus:border-yellow-500 transition-all",
    required: true
  }, React.createElement("option", {
    value: ""
  }, "-- Select Class --"), React.createElement("option", {
    value: "11"
  }, "Class 11"), React.createElement("option", {
    value: "12"
  }, "Class 12"))), React.createElement("div", null, React.createElement("label", {
    className: "block text-base font-semibold text-gray-700 mb-3"
  }, "\uD83D\uDCDD Reason for Cancellation"), React.createElement("textarea", {
    value: notes,
    onChange: e => setNotes(e.target.value),
    placeholder: "Please provide the reason why the class was cancelled...",
    className: "w-full border-2 border-gray-200 px-5 py-4 rounded-xl text-lg focus:border-yellow-500 transition-all min-h-[100px] resize-y",
    required: true
  }))), activityType === 'class_observation' && React.createElement(React.Fragment, null, React.createElement("div", {
    className: "bg-blue-50 border border-blue-200 p-4 rounded-xl mb-4"
  }, React.createElement("p", {
    className: "text-blue-700 text-sm"
  }, React.createElement("strong", null, "\uD83D\uDC41\uFE0F Class Observation:"), " Record time spent observing classes for quality assessment and feedback.")), React.createElement("div", null, React.createElement("label", {
    className: "block text-base font-semibold text-gray-700 mb-3"
  }, "\uD83C\uDF93 Class Observed"), React.createElement("select", {
    value: selectedClass,
    onChange: e => setSelectedClass(e.target.value),
    className: "w-full border-2 border-gray-200 px-5 py-4 rounded-xl text-lg focus:border-yellow-500 transition-all",
    required: true
  }, React.createElement("option", {
    value: ""
  }, "-- Select Class --"), React.createElement("option", {
    value: "11"
  }, "Class 11"), React.createElement("option", {
    value: "12"
  }, "Class 12"))), React.createElement("div", null, React.createElement("label", {
    className: "block text-base font-semibold text-gray-700 mb-3"
  }, "\uD83D\uDCDD Observation Notes"), React.createElement("textarea", {
    value: notes,
    onChange: e => setNotes(e.target.value),
    placeholder: "Enter observation details, feedback points, areas of improvement...",
    className: "w-full border-2 border-gray-200 px-5 py-4 rounded-xl text-lg focus:border-yellow-500 transition-all min-h-[120px] resize-y",
    required: true
  }))), activityType === 'jnv_school_work' && React.createElement(React.Fragment, null, React.createElement("div", {
    className: "bg-green-50 border border-green-200 p-4 rounded-xl mb-4"
  }, React.createElement("p", {
    className: "text-green-700 text-sm"
  }, React.createElement("strong", null, "\uD83C\uDFEB JNV School Work:"), " Record time spent on JNV-related administrative or school work.")), React.createElement("div", null, React.createElement("label", {
    className: "block text-base font-semibold text-gray-700 mb-3"
  }, "\uD83D\uDCDD Work Description"), React.createElement("textarea", {
    value: notes,
    onChange: e => setNotes(e.target.value),
    placeholder: "Describe the JNV school work done (e.g., exam supervision, duty assignments, administrative tasks, coordination meetings...)",
    className: "w-full border-2 border-gray-200 px-5 py-4 rounded-xl text-lg focus:border-yellow-500 transition-all min-h-[120px] resize-y",
    required: true
  }))), activityType === 'class_preparation' && React.createElement(React.Fragment, null, React.createElement("div", null, React.createElement("label", {
    className: "block text-base font-semibold text-gray-700 mb-3"
  }, "\uD83C\uDF93 Class"), React.createElement("select", {
    value: selectedClass,
    onChange: e => setSelectedClass(e.target.value),
    className: "w-full border-2 border-gray-200 px-5 py-4 rounded-xl text-lg focus:border-yellow-500 transition-all",
    required: true
  }, React.createElement("option", {
    value: ""
  }, "-- Select Class --"), React.createElement("option", {
    value: "11"
  }, "Class 11"), React.createElement("option", {
    value: "12"
  }, "Class 12"))), React.createElement("div", null, React.createElement("label", {
    className: "block text-base font-semibold text-gray-700 mb-3"
  }, "\uD83D\uDCDD Preparation Notes"), React.createElement("textarea", {
    value: notes,
    onChange: e => setNotes(e.target.value),
    placeholder: "What did you prepare? (e.g., lesson plan, teaching materials, practice problems, lab setup...)",
    className: "w-full border-2 border-gray-200 px-5 py-4 rounded-xl text-lg focus:border-yellow-500 transition-all min-h-[120px] resize-y",
    required: true
  }))), (activityType === 'data_entry' || activityType === 'weekly_checkin' || activityType === 'others') && React.createElement("div", null, React.createElement("label", {
    className: "block text-base font-semibold text-gray-700 mb-3"
  }, "\uD83D\uDCDD Notes / Description"), React.createElement("textarea", {
    value: notes,
    onChange: e => setNotes(e.target.value),
    placeholder: "Describe what you worked on...",
    className: "w-full border-2 border-gray-200 px-5 py-4 rounded-xl text-lg focus:border-yellow-500 transition-all min-h-[120px] resize-y",
    required: true
  })), React.createElement("div", {
    className: "bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-2xl border-2 border-yellow-200"
  }, React.createElement("div", {
    className: "text-base font-bold text-gray-700 mb-5 flex items-center gap-2"
  }, React.createElement("span", {
    className: "text-xl"
  }, "\u23F0"), " Work Duration"), React.createElement("div", {
    className: "mb-6"
  }, React.createElement("label", {
    className: "block text-base font-semibold text-gray-600 mb-3"
  }, "\uD83D\uDFE2 Start Time"), React.createElement("div", {
    className: "flex gap-3 items-center flex-wrap"
  }, React.createElement("select", {
    value: startHour,
    onChange: e => setStartHour(e.target.value),
    className: "border-2 border-gray-200 px-4 py-4 rounded-xl text-lg font-medium focus:border-yellow-500 transition-all min-w-[90px] text-center"
  }, React.createElement("option", {
    value: ""
  }, "Hour"), HOURS.map(h => React.createElement("option", {
    key: h,
    value: h
  }, h))), React.createElement("span", {
    className: "text-2xl font-bold text-gray-400"
  }, ":"), React.createElement("select", {
    value: startMinute,
    onChange: e => setStartMinute(e.target.value),
    className: "border-2 border-gray-200 px-4 py-4 rounded-xl text-lg font-medium focus:border-yellow-500 transition-all min-w-[90px] text-center"
  }, React.createElement("option", {
    value: ""
  }, "Min"), MINUTES.map(m => React.createElement("option", {
    key: m,
    value: m
  }, m))), React.createElement("select", {
    value: startPeriod,
    onChange: e => setStartPeriod(e.target.value),
    className: "border-2 border-yellow-300 bg-yellow-100 px-4 py-4 rounded-xl text-lg font-bold focus:border-yellow-500 transition-all min-w-[80px] text-center"
  }, PERIODS.map(p => React.createElement("option", {
    key: p,
    value: p
  }, p))), startHour && startMinute && React.createElement("span", {
    className: "text-gray-600 font-medium ml-2"
  }, "(", startHour, ":", startMinute, " ", startPeriod, ")"))), React.createElement("div", {
    className: "mb-6"
  }, React.createElement("label", {
    className: "block text-base font-semibold text-gray-600 mb-3"
  }, "\uD83D\uDD34 End Time"), React.createElement("div", {
    className: "flex gap-3 items-center flex-wrap"
  }, React.createElement("select", {
    value: endHour,
    onChange: e => setEndHour(e.target.value),
    className: "border-2 border-gray-200 px-4 py-4 rounded-xl text-lg font-medium focus:border-yellow-500 transition-all min-w-[90px] text-center"
  }, React.createElement("option", {
    value: ""
  }, "Hour"), HOURS.map(h => React.createElement("option", {
    key: h,
    value: h
  }, h))), React.createElement("span", {
    className: "text-2xl font-bold text-gray-400"
  }, ":"), React.createElement("select", {
    value: endMinute,
    onChange: e => setEndMinute(e.target.value),
    className: "border-2 border-gray-200 px-4 py-4 rounded-xl text-lg font-medium focus:border-yellow-500 transition-all min-w-[90px] text-center"
  }, React.createElement("option", {
    value: ""
  }, "Min"), MINUTES.map(m => React.createElement("option", {
    key: m,
    value: m
  }, m))), React.createElement("select", {
    value: endPeriod,
    onChange: e => setEndPeriod(e.target.value),
    className: "border-2 border-orange-300 bg-orange-100 px-4 py-4 rounded-xl text-lg font-bold focus:border-orange-500 transition-all min-w-[80px] text-center"
  }, PERIODS.map(p => React.createElement("option", {
    key: p,
    value: p
  }, p))), endHour && endMinute && React.createElement("span", {
    className: "text-gray-600 font-medium ml-2"
  }, "(", endHour, ":", endMinute, " ", endPeriod, ")"))), React.createElement("div", {
    className: `p-5 rounded-xl text-center ${parseFloat(hoursWorked) > 0 ? 'bg-green-100 border-2 border-green-300' : 'bg-white border-2 border-gray-200'}`
  }, React.createElement("div", {
    className: "text-sm font-semibold text-gray-600 mb-2"
  }, "\u23F1\uFE0F Total Hours"), React.createElement("div", {
    className: `text-4xl font-bold ${parseFloat(hoursWorked) > 0 ? 'text-green-600' : 'text-gray-400'}`
  }, hoursWorked || '0.00', React.createElement("span", {
    className: "text-lg font-medium ml-1"
  }, "hrs")), parseFloat(hoursWorked) > 0 && React.createElement("div", {
    className: "text-sm text-green-600 mt-1"
  }, "(", Math.floor(parseFloat(hoursWorked)), " hours ", Math.round(parseFloat(hoursWorked) % 1 * 60), " minutes)")), parseFloat(hoursWorked) <= 0 && startHour && startMinute && endHour && endMinute && React.createElement("div", {
    className: "mt-3 text-sm text-red-500 text-center font-medium"
  }, "\u26A0\uFE0F End time must be after start time")), React.createElement("button", {
    type: "submit",
    disabled: submitting || !activityType,
    className: "w-full avanti-gradient text-white py-5 rounded-xl font-bold text-xl hover:shadow-xl transition-all disabled:opacity-50 transform hover:scale-[1.02] active:scale-[0.98]"
  }, submitting ? '⏳ Submitting...' : '✅ Submit for Approval'))), React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("div", {
    className: "bg-white p-6 rounded-xl shadow-lg"
  }, React.createElement("h3", {
    className: "font-bold text-lg mb-4"
  }, "\uD83D\uDCC5 Today's Logs"), timesheetEntries.filter(e => e.date === new Date().toISOString().split('T')[0] && e.teacherAfid === myAfid).length === 0 ? React.createElement("p", {
    className: "text-gray-500 text-center py-4"
  }, "No entries today") : React.createElement("div", {
    className: "space-y-2"
  }, timesheetEntries.filter(e => e.date === new Date().toISOString().split('T')[0] && e.teacherAfid === myAfid).map(entry => React.createElement("div", {
    key: entry.id,
    className: "p-3 bg-gray-50 rounded-lg"
  }, React.createElement("div", {
    className: "flex justify-between items-center"
  }, React.createElement("span", {
    className: "font-semibold"
  }, ACTIVITY_TYPES.find(t => t.id === entry.activityType)?.icon, " ", ACTIVITY_TYPES.find(t => t.id === entry.activityType)?.label.replace(/^[^\s]+\s/, '')), React.createElement("span", {
    className: "text-yellow-600 font-bold"
  }, entry.hours, "h")), React.createElement("div", {
    className: "text-xs text-gray-500 mt-1"
  }, entry.startTime, " - ", entry.endTime, React.createElement("span", {
    className: `ml-2 px-2 py-0.5 rounded-full text-xs ${entry.status === 'approved' ? 'bg-green-100 text-green-700' : entry.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`
  }, entry.status)))))), React.createElement("div", {
    className: "bg-white p-6 rounded-xl shadow-lg"
  }, React.createElement("h3", {
    className: "font-bold text-lg mb-4"
  }, "\uD83D\uDCCA This Month's Breakdown"), React.createElement("div", {
    style: {
      height: '200px'
    }
  }, React.createElement("canvas", {
    ref: chartRef
  }))))), activeView === 'myLogs' && canEnterTimesheet && React.createElement("div", {
    className: "bg-white p-6 rounded-xl shadow-lg"
  }, React.createElement("div", {
    className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6"
  }, React.createElement("h2", {
    className: "text-xl font-bold"
  }, "\uD83D\uDCCB My Activity Logs"), React.createElement("div", {
    className: "flex gap-3"
  }, React.createElement("input", {
    type: "month",
    value: filterMonth,
    onChange: e => setFilterMonth(e.target.value),
    className: "border-2 px-4 py-2 rounded-xl"
  }))), React.createElement("div", {
    className: "grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
  }, React.createElement("div", {
    className: "bg-yellow-50 p-4 rounded-xl border-l-4 border-yellow-500"
  }, React.createElement("div", {
    className: "text-sm text-yellow-700"
  }, "Total Hours"), React.createElement("div", {
    className: "text-2xl font-bold text-yellow-600"
  }, timesheetEntries.filter(e => e.teacherAfid === myAfid && e.date?.startsWith(filterMonth)).reduce((s, e) => s + (parseFloat(e.hours) || 0), 0).toFixed(1), "h")), React.createElement("div", {
    className: "bg-green-50 p-4 rounded-xl border-l-4 border-green-500"
  }, React.createElement("div", {
    className: "text-sm text-green-700"
  }, "Approved"), React.createElement("div", {
    className: "text-2xl font-bold text-green-600"
  }, timesheetEntries.filter(e => e.teacherAfid === myAfid && e.date?.startsWith(filterMonth) && e.status === 'approved').reduce((s, e) => s + (parseFloat(e.hours) || 0), 0).toFixed(1), "h")), React.createElement("div", {
    className: "bg-orange-50 p-4 rounded-xl border-l-4 border-orange-500"
  }, React.createElement("div", {
    className: "text-sm text-orange-700"
  }, "Pending"), React.createElement("div", {
    className: "text-2xl font-bold text-orange-600"
  }, timesheetEntries.filter(e => e.teacherAfid === myAfid && e.date?.startsWith(filterMonth) && e.status === 'pending').reduce((s, e) => s + (parseFloat(e.hours) || 0), 0).toFixed(1), "h")), React.createElement("div", {
    className: "bg-blue-50 p-4 rounded-xl border-l-4 border-blue-500"
  }, React.createElement("div", {
    className: "text-sm text-blue-700"
  }, "Total Entries"), React.createElement("div", {
    className: "text-2xl font-bold text-blue-600"
  }, timesheetEntries.filter(e => e.teacherAfid === myAfid && e.date?.startsWith(filterMonth)).length))), React.createElement("div", {
    className: "overflow-x-auto"
  }, React.createElement("table", {
    className: "w-full"
  }, React.createElement("thead", {
    className: "avanti-gradient-light"
  }, React.createElement("tr", null, React.createElement("th", {
    className: "p-3 text-left"
  }, "Date"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Activity"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Details"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Hours"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Approver"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Status"))), React.createElement("tbody", null, timesheetEntries.filter(e => e.teacherAfid === myAfid && e.date?.startsWith(filterMonth)).sort((a, b) => new Date(b.date) - new Date(a.date)).map(entry => React.createElement("tr", {
    key: entry.id,
    className: "border-b hover:bg-gray-50"
  }, React.createElement("td", {
    className: "p-3"
  }, React.createElement("div", {
    className: "font-semibold"
  }, new Date(entry.date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short'
  })), React.createElement("div", {
    className: "text-xs text-gray-500"
  }, entry.startTime, " - ", entry.endTime)), React.createElement("td", {
    className: "p-3"
  }, React.createElement("span", {
    className: "px-3 py-1 bg-gray-100 rounded-full text-sm"
  }, ACTIVITY_TYPES.find(t => t.id === entry.activityType)?.icon, " ", ACTIVITY_TYPES.find(t => t.id === entry.activityType)?.label.replace(/^[^\s]+\s/, ''))), React.createElement("td", {
    className: "p-3"
  }, React.createElement("div", {
    className: "text-sm"
  }, entry.class && React.createElement("span", {
    className: "text-blue-600"
  }, "Class ", entry.class), entry.chapter && React.createElement("span", {
    className: "text-gray-600"
  }, " | ", entry.chapter), entry.topic && React.createElement("span", {
    className: "text-gray-500"
  }, " | ", entry.topic), entry.testType && React.createElement("span", {
    className: "text-purple-600"
  }, " (", entry.testType === 'chapter_test' ? 'Chapter Test' : 'AIET', ")")), entry.notes && React.createElement("div", {
    className: "text-xs text-gray-500 mt-1 truncate max-w-xs"
  }, entry.notes)), React.createElement("td", {
    className: "p-3"
  }, React.createElement("span", {
    className: "text-lg font-bold text-yellow-600"
  }, entry.hours, "h")), React.createElement("td", {
    className: "p-3"
  }, React.createElement("div", {
    className: "text-sm"
  }, entry.status === 'approved' || entry.status === 'rejected' ? React.createElement("span", {
    className: "text-gray-600"
  }, entry.approvedBy || 'Manager') : React.createElement("span", {
    className: "text-orange-600"
  }, entry.lineManagerName || 'Pending assignment'))), React.createElement("td", {
    className: "p-3"
  }, React.createElement("span", {
    className: `px-3 py-1 rounded-full text-sm font-semibold ${entry.status === 'approved' ? 'bg-green-100 text-green-700' : entry.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`
  }, entry.status === 'approved' ? '✅ Approved' : entry.status === 'rejected' ? '❌ Rejected' : '⏳ Pending')))))), timesheetEntries.filter(e => e.teacherAfid === myAfid && e.date?.startsWith(filterMonth)).length === 0 && React.createElement("div", {
    className: "text-center py-12 text-gray-500"
  }, React.createElement("div", {
    className: "text-4xl mb-2"
  }, "\uD83D\uDCED"), React.createElement("div", null, "No entries for this month")))), activeView === 'approvals' && isAdmin && React.createElement("div", {
    className: "bg-white p-6 rounded-xl shadow-lg"
  }, React.createElement("h2", {
    className: "text-xl font-bold mb-6 flex items-center gap-2"
  }, React.createElement("span", {
    className: "text-2xl"
  }, "\u2705"), " Pending Approvals", pendingApprovals.length > 0 && React.createElement("span", {
    className: "px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
  }, pendingApprovals.length, " pending"), isViewOnly && React.createElement("span", {
    className: "px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm ml-2"
  }, "View Only")), !isViewOnly && pendingApprovals.length > 0 && React.createElement("div", {
    className: "mb-4 p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center justify-between"
  }, React.createElement("div", null, React.createElement("p", {
    className: "text-green-800 font-bold"
  }, "\u26A1 Quick Action"), React.createElement("p", {
    className: "text-sm text-green-600"
  }, "Approve all ", pendingApprovals.length, " pending entries at once")), React.createElement("button", {
    onClick: handleApproveAll,
    className: "px-6 py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 shadow-lg"
  }, "\u2705 Approve All (", pendingApprovals.length, ")")), isViewOnly && pendingApprovals.length > 0 && React.createElement("div", {
    className: "mb-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl"
  }, React.createElement("p", {
    className: "text-blue-700 font-semibold"
  }, "\uD83D\uDC41\uFE0F View Only Mode"), React.createElement("p", {
    className: "text-sm text-blue-600"
  }, "As a Director/Associate Director, you can view all timesheet entries but cannot approve or reject them.")), pendingApprovals.length === 0 ? React.createElement("div", {
    className: "text-center py-12 text-gray-500"
  }, React.createElement("div", {
    className: "text-6xl mb-4"
  }, "\u2728"), React.createElement("div", {
    className: "text-xl font-semibold"
  }, "All caught up!"), React.createElement("div", {
    className: "text-sm mt-2"
  }, "No pending approvals")) : React.createElement("div", {
    className: "space-y-4"
  }, pendingApprovals.map(entry => React.createElement("div", {
    key: entry.id,
    className: "border-2 border-yellow-200 bg-yellow-50 p-4 rounded-xl"
  }, React.createElement("div", {
    className: "flex flex-col md:flex-row justify-between gap-4"
  }, React.createElement("div", {
    className: "flex-1"
  }, React.createElement("div", {
    className: "flex items-center gap-3 mb-2 flex-wrap"
  }, React.createElement("span", {
    className: "font-bold text-lg"
  }, entry.teacherName), React.createElement("span", {
    className: "px-2 py-0.5 bg-gray-200 rounded text-xs"
  }, entry.school), React.createElement("span", {
    className: "px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
  }, entry.subject), entry.lineManagerName && React.createElement("span", {
    className: "px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs"
  }, "\uD83D\uDC64 Assigned to: ", entry.lineManagerName)), React.createElement("div", {
    className: "text-sm text-gray-600 space-y-1"
  }, React.createElement("div", null, React.createElement("strong", null, "Date:"), " ", new Date(entry.date).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })), React.createElement("div", null, React.createElement("strong", null, "Activity:"), " ", ACTIVITY_TYPES.find(t => t.id === entry.activityType)?.label), React.createElement("div", null, React.createElement("strong", null, "Time:"), " ", entry.startTime, " - ", entry.endTime, " (", React.createElement("span", {
    className: "text-yellow-600 font-bold"
  }, entry.hours, "h"), ")"), entry.class && React.createElement("div", null, React.createElement("strong", null, "Class:"), " ", entry.class), entry.chapter && React.createElement("div", null, React.createElement("strong", null, "Chapter:"), " ", entry.chapter), entry.topic && React.createElement("div", null, React.createElement("strong", null, "Topic:"), " ", entry.topic), entry.notes && React.createElement("div", null, React.createElement("strong", null, "Notes:"), " ", entry.notes))), !isViewOnly && React.createElement("div", {
    className: "flex flex-row md:flex-col gap-2"
  }, React.createElement("button", {
    onClick: () => handleApproval(entry.id, 'approved'),
    className: "px-6 py-2 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600"
  }, "\u2705 Approve"), React.createElement("button", {
    onClick: () => handleApproval(entry.id, 'rejected'),
    className: "px-6 py-2 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600"
  }, "\u274C Reject"), React.createElement("button", {
    onClick: () => handleDeleteEntry(entry.id, entry.teacherName),
    className: "px-6 py-2 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700",
    title: "Delete this entry permanently"
  }, "\uD83D\uDDD1\uFE0F Delete"))))))), activeView === 'allEntries' && isAdmin && React.createElement("div", {
    className: "bg-white p-6 rounded-xl shadow-lg"
  }, React.createElement("h2", {
    className: "text-xl font-bold mb-6 flex items-center gap-2"
  }, React.createElement("span", {
    className: "text-2xl"
  }, "\uD83D\uDCCB"), " All Timesheet Entries", React.createElement("span", {
    className: "ml-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
  }, filteredEntries.length, " entries")), React.createElement("div", {
    className: "bg-gray-50 p-4 rounded-xl mb-6 flex flex-wrap gap-4 items-end"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-xs text-gray-500 mb-1"
  }, "Month"), React.createElement("input", {
    type: "month",
    value: filterMonth,
    onChange: e => setFilterMonth(e.target.value),
    className: "border-2 px-3 py-2 rounded-lg"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-xs text-gray-500 mb-1"
  }, "School"), React.createElement("select", {
    value: filterSchool,
    onChange: e => setFilterSchool(e.target.value),
    className: "border-2 px-3 py-2 rounded-lg"
  }, React.createElement("option", {
    value: "All"
  }, "All Schools"), accessibleSchools.map(school => React.createElement("option", {
    key: school,
    value: school
  }, school)))), React.createElement("div", null, React.createElement("label", {
    className: "block text-xs text-gray-500 mb-1"
  }, "Teacher"), React.createElement("select", {
    value: filterTeacher,
    onChange: e => setFilterTeacher(e.target.value),
    className: "border-2 px-3 py-2 rounded-lg"
  }, React.createElement("option", {
    value: "All"
  }, "All Teachers"), uniqueTeachers.map(t => React.createElement("option", {
    key: t.afid,
    value: t.afid
  }, t.name)))), React.createElement("div", {
    className: "ml-auto"
  }, React.createElement("button", {
    onClick: handleExportTimesheet,
    className: "px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 flex items-center gap-2 shadow-md",
    title: "Export filtered entries to CSV"
  }, React.createElement("i", {
    className: "fa-solid fa-download"
  }), " Export CSV"))), filteredEntries.length === 0 ? React.createElement("div", {
    className: "text-center py-12 text-gray-500"
  }, React.createElement("div", {
    className: "text-6xl mb-4"
  }, "\uD83D\uDCED"), React.createElement("div", {
    className: "text-xl font-semibold"
  }, "No entries found"), React.createElement("div", {
    className: "text-sm mt-2"
  }, "Try adjusting your filters")) : React.createElement("div", {
    className: "space-y-4 max-h-[600px] overflow-y-auto"
  }, filteredEntries.map(entry => React.createElement("div", {
    key: entry.id,
    className: `border-2 p-4 rounded-xl ${entry.status === 'approved' ? 'border-green-200 bg-green-50' : entry.status === 'rejected' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`
  }, React.createElement("div", {
    className: "flex flex-col md:flex-row justify-between gap-4"
  }, React.createElement("div", {
    className: "flex-1"
  }, React.createElement("div", {
    className: "flex items-center gap-3 mb-2 flex-wrap"
  }, React.createElement("span", {
    className: "font-bold text-lg"
  }, entry.teacherName), React.createElement("span", {
    className: "px-2 py-0.5 bg-gray-200 rounded text-xs"
  }, entry.school), React.createElement("span", {
    className: "px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
  }, entry.subject), React.createElement("span", {
    className: `px-2 py-0.5 rounded text-xs font-semibold ${entry.status === 'approved' ? 'bg-green-200 text-green-700' : entry.status === 'rejected' ? 'bg-red-200 text-red-700' : 'bg-yellow-200 text-yellow-700'}`
  }, entry.status === 'approved' ? '✅ Approved' : entry.status === 'rejected' ? '❌ Rejected' : '⏳ Pending')), React.createElement("div", {
    className: "text-sm text-gray-600 space-y-1"
  }, React.createElement("div", null, React.createElement("strong", null, "Date:"), " ", new Date(entry.date).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })), React.createElement("div", null, React.createElement("strong", null, "Activity:"), " ", ACTIVITY_TYPES.find(t => t.id === entry.activityType)?.label), React.createElement("div", null, React.createElement("strong", null, "Time:"), " ", entry.startTime, " - ", entry.endTime, " (", React.createElement("span", {
    className: "text-yellow-600 font-bold"
  }, entry.hours, "h"), ")"), entry.class && React.createElement("div", null, React.createElement("strong", null, "Class:"), " ", entry.class), entry.chapter && React.createElement("div", null, React.createElement("strong", null, "Chapter:"), " ", entry.chapter), entry.topic && React.createElement("div", null, React.createElement("strong", null, "Topic:"), " ", entry.topic), entry.notes && React.createElement("div", null, React.createElement("strong", null, "Notes:"), " ", entry.notes), entry.approvedBy && React.createElement("div", {
    className: "text-xs text-gray-500 mt-2"
  }, "Processed by: ", entry.approvedBy))), React.createElement("div", {
    className: "flex flex-row md:flex-col gap-2"
  }, React.createElement("button", {
    onClick: () => handleDeleteEntry(entry.id, entry.teacherName),
    className: "px-6 py-2 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700",
    title: "Delete this entry permanently"
  }, "\uD83D\uDDD1\uFE0F Delete"))))))), activeView === 'analytics' && React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("div", {
    className: "bg-white p-4 rounded-xl shadow flex flex-wrap gap-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-xs text-gray-500 mb-1"
  }, "Month"), React.createElement("input", {
    type: "month",
    value: filterMonth,
    onChange: e => setFilterMonth(e.target.value),
    className: "border-2 px-3 py-2 rounded-lg"
  })), isAdmin && React.createElement(React.Fragment, null, React.createElement("div", null, React.createElement("label", {
    className: "block text-xs text-gray-500 mb-1"
  }, "School"), React.createElement("select", {
    value: filterSchool,
    onChange: e => setFilterSchool(e.target.value),
    className: "border-2 px-3 py-2 rounded-lg"
  }, React.createElement("option", {
    value: "All"
  }, "All Schools"), accessibleSchools.map(school => React.createElement("option", {
    key: school,
    value: school
  }, school)))), React.createElement("div", null, React.createElement("label", {
    className: "block text-xs text-gray-500 mb-1"
  }, "Teacher"), React.createElement("select", {
    value: filterTeacher,
    onChange: e => setFilterTeacher(e.target.value),
    className: "border-2 px-3 py-2 rounded-lg"
  }, React.createElement("option", {
    value: "All"
  }, "All Teachers"), uniqueTeachers.map(t => React.createElement("option", {
    key: t.afid,
    value: t.afid
  }, t.name)))))), React.createElement("div", {
    className: "grid grid-cols-2 md:grid-cols-4 gap-4"
  }, React.createElement("div", {
    className: "bg-white p-4 rounded-xl shadow border-l-4 border-yellow-500"
  }, React.createElement("div", {
    className: "text-sm text-gray-500"
  }, "Total Hours"), React.createElement("div", {
    className: "text-3xl font-bold text-yellow-600"
  }, filteredEntries.reduce((s, e) => s + (parseFloat(e.hours) || 0), 0).toFixed(1), "h")), React.createElement("div", {
    className: "bg-white p-4 rounded-xl shadow border-l-4 border-green-500"
  }, React.createElement("div", {
    className: "text-sm text-gray-500"
  }, "Approved"), React.createElement("div", {
    className: "text-3xl font-bold text-green-600"
  }, filteredEntries.filter(e => e.status === 'approved').reduce((s, e) => s + (parseFloat(e.hours) || 0), 0).toFixed(1), "h")), React.createElement("div", {
    className: "bg-white p-4 rounded-xl shadow border-l-4 border-blue-500"
  }, React.createElement("div", {
    className: "text-sm text-gray-500"
  }, "Total Entries"), React.createElement("div", {
    className: "text-3xl font-bold text-blue-600"
  }, filteredEntries.length)), React.createElement("div", {
    className: "bg-white p-4 rounded-xl shadow border-l-4 border-purple-500"
  }, React.createElement("div", {
    className: "text-sm text-gray-500"
  }, "Active Teachers"), React.createElement("div", {
    className: "text-3xl font-bold text-purple-600"
  }, new Set(filteredEntries.map(e => e.teacherAfid)).size))), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-6"
  }, React.createElement("div", {
    className: "bg-white p-6 rounded-xl shadow-lg"
  }, React.createElement("h3", {
    className: "font-bold text-lg mb-4"
  }, "\uD83D\uDCCA Hours by Activity Type"), React.createElement("div", {
    style: {
      height: '300px'
    }
  }, React.createElement("canvas", {
    id: "analyticsChart"
  }))), React.createElement("div", {
    className: "bg-white p-6 rounded-xl shadow-lg"
  }, React.createElement("h3", {
    className: "font-bold text-lg mb-4"
  }, "\uD83C\uDFC6 Teacher Leaderboard"), React.createElement("div", {
    className: "space-y-3 max-h-[350px] overflow-y-auto"
  }, teacherAggregates.slice(0, 10).map((teacher, idx) => React.createElement("div", {
    key: teacher.name,
    className: `flex items-center gap-3 p-3 rounded-xl ${idx === 0 ? 'bg-yellow-50 border-2 border-yellow-300' : 'bg-gray-50'}`
  }, React.createElement("div", {
    className: `w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-400' : 'bg-gray-300'}`
  }, idx + 1), React.createElement("div", {
    className: "flex-1"
  }, React.createElement("div", {
    className: "font-semibold"
  }, teacher.name, " ", idx === 0 && '🏆'), React.createElement("div", {
    className: "text-xs text-gray-500"
  }, teacher.school)), React.createElement("div", {
    className: "text-right"
  }, React.createElement("div", {
    className: "font-bold text-yellow-600"
  }, teacher.totalHours.toFixed(1), "h"), React.createElement("div", {
    className: "text-xs text-green-600"
  }, teacher.approved.toFixed(1), "h approved")))))))));
}
function RoadmapPage({
  currentUser
}) {
  const [features, setFeatures] = useState([]);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDetails, setNewDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('votes');
  useEffect(() => {
    const unsubscribe = db.collection('featureRequests').orderBy('votes', 'desc').onSnapshot(snap => {
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFeatures(data);
      setLoading(false);
    }, error => {
      console.error('Error fetching features:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  const handleSubmit = async () => {
    if (!newTitle.trim()) return;
    setSubmitting(true);
    try {
      await db.collection('featureRequests').add({
        title: newTitle.trim(),
        details: newDetails.trim(),
        authorId: currentUser.afid || currentUser.uid,
        authorName: currentUser.name,
        authorSchool: currentUser.school,
        status: 'pending',
        votes: 0,
        voters: [],
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      setNewTitle('');
      setNewDetails('');
      setShowNewRequest(false);
      alert('✅ Feature request submitted!');
    } catch (error) {
      console.error('Error submitting feature:', error);
      alert('Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };
  const handleVote = async featureId => {
    const userId = currentUser.afid || currentUser.uid;
    const feature = features.find(f => f.id === featureId);
    if (!feature) return;
    const hasVoted = feature.voters?.includes(userId);
    try {
      if (hasVoted) {
        await db.collection('featureRequests').doc(featureId).update({
          votes: firebase.firestore.FieldValue.increment(-1),
          voters: firebase.firestore.FieldValue.arrayRemove(userId)
        });
      } else {
        await db.collection('featureRequests').doc(featureId).update({
          votes: firebase.firestore.FieldValue.increment(1),
          voters: firebase.firestore.FieldValue.arrayUnion(userId)
        });
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };
  const getStatusBadge = status => {
    const badges = {
      'pending': {
        bg: 'bg-gray-200',
        text: 'text-gray-700',
        label: 'Pending'
      },
      'planned': {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        label: 'Planned'
      },
      'in-progress': {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        label: 'In Progress'
      },
      'done': {
        bg: 'bg-green-100',
        text: 'text-green-700',
        label: 'Done'
      },
      'rejected': {
        bg: 'bg-red-100',
        text: 'text-red-700',
        label: 'Not Planned'
      }
    };
    return badges[status] || badges.pending;
  };
  const sortedFeatures = useMemo(() => {
    if (sortBy === 'votes') {
      return [...features].sort((a, b) => (b.votes || 0) - (a.votes || 0));
    }
    return [...features].sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB - dateA;
    });
  }, [features, sortBy]);
  const roadmapFeatures = features.filter(f => f.status === 'planned' || f.status === 'in-progress');
  const doneFeatures = features.filter(f => f.status === 'done');
  if (loading) {
    return React.createElement("div", {
      className: "flex items-center justify-center h-64"
    }, React.createElement("div", {
      className: "text-center"
    }, React.createElement("div", {
      className: "animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent mx-auto"
    }), React.createElement("p", {
      className: "mt-4 text-gray-600"
    }, "Loading roadmap...")));
  }
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("div", {
    className: "flex items-center justify-between flex-wrap gap-4"
  }, React.createElement("div", null, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "\uD83D\uDDFA\uFE0F Roadmap & Feature Requests"), React.createElement("p", {
    className: "text-gray-600"
  }, "Help shape the future of Curriculum Tracker")), React.createElement("button", {
    onClick: () => setShowNewRequest(true),
    className: "px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl font-bold hover:shadow-lg transition-all"
  }, "\u2728 Request Feature")), React.createElement("div", {
    className: "bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-indigo-200"
  }, React.createElement("div", {
    className: "flex items-center gap-3 mb-6"
  }, React.createElement("span", {
    className: "text-3xl"
  }, "\uD83D\uDE80"), React.createElement("div", null, React.createElement("h3", {
    className: "text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
  }, "Official Roadmap Timeline"), React.createElement("p", {
    className: "text-gray-600 text-sm"
  }, "Features we're planning to build"))), React.createElement("div", {
    className: "grid md:grid-cols-2 lg:grid-cols-3 gap-4"
  }, React.createElement("div", {
    className: "bg-white rounded-xl p-5 shadow-lg border-l-4 border-blue-500"
  }, React.createElement("div", {
    className: "flex items-center gap-2 mb-3"
  }, React.createElement("span", {
    className: "px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold"
  }, "Q1 2025"), React.createElement("span", {
    className: "text-sm text-gray-500"
  }, "Jan - Mar")), React.createElement("div", {
    className: "space-y-3"
  }, React.createElement("div", {
    className: "p-3 bg-blue-50 rounded-lg"
  }, React.createElement("div", {
    className: "font-semibold flex items-center gap-2"
  }, "\uD83D\uDC64 Individual Student Profile"), React.createElement("p", {
    className: "text-xs text-gray-600 mt-1"
  }, "Student academic level, AIET exam reports, chapter test reports, performance analytics")), React.createElement("div", {
    className: "p-3 bg-blue-50 rounded-lg"
  }, React.createElement("div", {
    className: "font-semibold flex items-center gap-2"
  }, "\uD83D\uDCDD Teacher Timesheet"), React.createElement("p", {
    className: "text-xs text-gray-600 mt-1"
  }, "Daily logs - what chapter/topic taught, time spent, activities conducted")))), React.createElement("div", {
    className: "bg-white rounded-xl p-5 shadow-lg border-l-4 border-green-500"
  }, React.createElement("div", {
    className: "flex items-center gap-2 mb-3"
  }, React.createElement("span", {
    className: "px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold"
  }, "Q2 2025"), React.createElement("span", {
    className: "text-sm text-gray-500"
  }, "Apr - Jun")), React.createElement("div", {
    className: "space-y-3"
  }, React.createElement("div", {
    className: "p-3 bg-green-50 rounded-lg"
  }, React.createElement("div", {
    className: "font-semibold flex items-center gap-2"
  }, "\uD83D\uDCC5 Exam Schedule Manager"), React.createElement("p", {
    className: "text-xs text-gray-600 mt-1"
  }, "Create, track and manage exam schedules across schools")), React.createElement("div", {
    className: "p-3 bg-green-50 rounded-lg"
  }, React.createElement("div", {
    className: "font-semibold flex items-center gap-2"
  }, "\uD83D\uDCCA Advanced Analytics Dashboard"), React.createElement("p", {
    className: "text-xs text-gray-600 mt-1"
  }, "Cross-school comparisons, trend analysis, predictive insights")))), React.createElement("div", {
    className: "bg-white rounded-xl p-5 shadow-lg border-l-4 border-orange-500"
  }, React.createElement("div", {
    className: "flex items-center gap-2 mb-3"
  }, React.createElement("span", {
    className: "px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold"
  }, "Q3 2025"), React.createElement("span", {
    className: "text-sm text-gray-500"
  }, "Jul - Sep")), React.createElement("div", {
    className: "space-y-3"
  }, React.createElement("div", {
    className: "p-3 bg-orange-50 rounded-lg"
  }, React.createElement("div", {
    className: "font-semibold flex items-center gap-2"
  }, "\uD83D\uDCF1 Offline Mode"), React.createElement("p", {
    className: "text-xs text-gray-600 mt-1"
  }, "Full offline support with automatic sync when connected")), React.createElement("div", {
    className: "p-3 bg-orange-50 rounded-lg"
  }, React.createElement("div", {
    className: "font-semibold flex items-center gap-2"
  }, "\uD83D\uDD14 Smart Notifications"), React.createElement("p", {
    className: "text-xs text-gray-600 mt-1"
  }, "Auto reminders for curriculum deadlines, pending tasks")))), React.createElement("div", {
    className: "bg-white rounded-xl p-5 shadow-lg border-l-4 border-purple-500"
  }, React.createElement("div", {
    className: "flex items-center gap-2 mb-3"
  }, React.createElement("span", {
    className: "px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold"
  }, "Q4 2025"), React.createElement("span", {
    className: "text-sm text-gray-500"
  }, "Oct - Dec")), React.createElement("div", {
    className: "space-y-3"
  }, React.createElement("div", {
    className: "p-3 bg-purple-50 rounded-lg"
  }, React.createElement("div", {
    className: "font-semibold flex items-center gap-2"
  }, "\uD83D\uDCDA Resource Library"), React.createElement("p", {
    className: "text-xs text-gray-600 mt-1"
  }, "Shared teaching materials, lesson plans, worksheets")), React.createElement("div", {
    className: "p-3 bg-purple-50 rounded-lg"
  }, React.createElement("div", {
    className: "font-semibold flex items-center gap-2"
  }, "\uD83C\uDFAF Goal Tracking"), React.createElement("p", {
    className: "text-xs text-gray-600 mt-1"
  }, "Set and track personal & school goals")))), React.createElement("div", {
    className: "bg-white rounded-xl p-5 shadow-lg border-l-4 border-gray-400"
  }, React.createElement("div", {
    className: "flex items-center gap-2 mb-3"
  }, React.createElement("span", {
    className: "px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold"
  }, "2026+"), React.createElement("span", {
    className: "text-sm text-gray-500"
  }, "Future")), React.createElement("div", {
    className: "space-y-3"
  }, React.createElement("div", {
    className: "p-3 bg-gray-50 rounded-lg"
  }, React.createElement("div", {
    className: "font-semibold flex items-center gap-2"
  }, "\uD83E\uDD16 AI Insights"), React.createElement("p", {
    className: "text-xs text-gray-600 mt-1"
  }, "AI-powered suggestions for curriculum pacing")), React.createElement("div", {
    className: "p-3 bg-gray-50 rounded-lg"
  }, React.createElement("div", {
    className: "font-semibold flex items-center gap-2"
  }, "\uD83D\uDC65 Parent Portal"), React.createElement("p", {
    className: "text-xs text-gray-600 mt-1"
  }, "Parent access to student progress reports")))), React.createElement("div", {
    className: "bg-gradient-to-br from-pink-100 to-purple-100 rounded-xl p-5 shadow-lg border-2 border-dashed border-pink-300"
  }, React.createElement("div", {
    className: "flex items-center gap-2 mb-3"
  }, React.createElement("span", {
    className: "text-2xl"
  }, "\u2728"), React.createElement("span", {
    className: "font-bold text-pink-700"
  }, "Want a Feature?")), React.createElement("p", {
    className: "text-sm text-gray-600 mb-4"
  }, "Have an idea? Request it below and vote for features you want!"), React.createElement("button", {
    onClick: () => setShowNewRequest(true),
    className: "w-full py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all text-sm"
  }, "\u2728 Request Feature")))), roadmapFeatures.length > 0 && React.createElement("div", {
    className: "bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "\uD83D\uDCCD Coming Soon"), React.createElement("div", {
    className: "grid md:grid-cols-2 gap-4"
  }, roadmapFeatures.map(feature => React.createElement("div", {
    key: feature.id,
    className: "bg-white rounded-xl p-4 shadow"
  }, React.createElement("div", {
    className: "flex items-start justify-between gap-2"
  }, React.createElement("div", {
    className: "flex-1"
  }, React.createElement("div", {
    className: "font-bold"
  }, feature.title), feature.details && React.createElement("p", {
    className: "text-sm text-gray-600 mt-1"
  }, feature.details)), React.createElement("span", {
    className: `${getStatusBadge(feature.status).bg} ${getStatusBadge(feature.status).text} px-3 py-1 rounded-full text-xs font-bold`
  }, getStatusBadge(feature.status).label)))))), doneFeatures.length > 0 && React.createElement("div", {
    className: "bg-green-50 rounded-2xl p-6"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "\u2705 Recently Completed"), React.createElement("div", {
    className: "flex flex-wrap gap-2"
  }, doneFeatures.slice(0, 10).map(feature => React.createElement("span", {
    key: feature.id,
    className: "bg-white px-4 py-2 rounded-lg shadow text-sm"
  }, "\u2713 ", feature.title)))), React.createElement("div", {
    className: "bg-white rounded-2xl shadow-lg p-6"
  }, React.createElement("div", {
    className: "flex items-center justify-between mb-4"
  }, React.createElement("h3", {
    className: "text-xl font-bold"
  }, "\uD83D\uDCA1 Feature Requests"), React.createElement("select", {
    value: sortBy,
    onChange: e => setSortBy(e.target.value),
    className: "border-2 px-4 py-2 rounded-lg"
  }, React.createElement("option", {
    value: "votes"
  }, "Most Voted"), React.createElement("option", {
    value: "recent"
  }, "Most Recent"))), sortedFeatures.length === 0 ? React.createElement("div", {
    className: "text-center py-12 text-gray-500"
  }, React.createElement("div", {
    className: "text-6xl mb-4"
  }, "\uD83D\uDCA1"), React.createElement("p", null, "No feature requests yet"), React.createElement("p", {
    className: "text-sm"
  }, "Be the first to suggest an improvement!")) : React.createElement("div", {
    className: "space-y-3"
  }, sortedFeatures.map(feature => {
    const userId = currentUser.afid || currentUser.uid;
    const hasVoted = feature.voters?.includes(userId);
    const badge = getStatusBadge(feature.status);
    return React.createElement("div", {
      key: feature.id,
      className: "border-2 rounded-xl p-4 hover:border-yellow-400 transition-all"
    }, React.createElement("div", {
      className: "flex items-start gap-4"
    }, React.createElement("button", {
      onClick: () => handleVote(feature.id),
      className: `flex flex-col items-center px-3 py-2 rounded-lg min-w-[60px] transition-all ${hasVoted ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 hover:bg-gray-200'}`
    }, React.createElement("span", {
      className: "text-xl"
    }, "\u25B2"), React.createElement("span", {
      className: "font-bold"
    }, feature.votes || 0)), React.createElement("div", {
      className: "flex-1"
    }, React.createElement("div", {
      className: "flex items-start justify-between gap-2"
    }, React.createElement("div", {
      className: "font-bold text-lg"
    }, feature.title), React.createElement("span", {
      className: `${badge.bg} ${badge.text} px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap`
    }, badge.label)), feature.details && React.createElement("p", {
      className: "text-gray-600 mt-1"
    }, feature.details), React.createElement("div", {
      className: "text-sm text-gray-400 mt-2"
    }, "Requested by ", feature.authorName, " from ", feature.authorSchool))));
  }))), showNewRequest && React.createElement("div", {
    className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
  }, React.createElement("div", {
    className: "bg-white rounded-2xl max-w-lg w-full p-6"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "\u2728 Request a Feature"), React.createElement("div", {
    className: "space-y-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Feature Title *"), React.createElement("input", {
    type: "text",
    value: newTitle,
    onChange: e => setNewTitle(e.target.value),
    placeholder: "e.g., Dark mode support",
    className: "w-full border-2 rounded-xl px-4 py-3"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Details (Optional)"), React.createElement("textarea", {
    value: newDetails,
    onChange: e => setNewDetails(e.target.value),
    placeholder: "Describe the feature in more detail...",
    className: "w-full border-2 rounded-xl px-4 py-3 h-24 resize-none"
  }))), React.createElement("div", {
    className: "flex gap-3 mt-6"
  }, React.createElement("button", {
    onClick: handleSubmit,
    disabled: submitting || !newTitle.trim(),
    className: "flex-1 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl font-bold disabled:opacity-50"
  }, submitting ? '⏳ Submitting...' : '📤 Submit Request'), React.createElement("button", {
    onClick: () => setShowNewRequest(false),
    className: "px-6 py-3 bg-gray-200 rounded-xl font-bold"
  }, "Cancel")))));
}
function TeacherExamStats({
  currentUser
}) {
  const [examRegistrations, setExamRegistrations] = useState([]);
  const [students, setStudents] = useState([]);
  const [filterGrade, setFilterGrade] = useState('All');
  const [filterGender, setFilterGender] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterExam, setFilterExam] = useState('All');
  useEffect(() => {
    const fetchData = async () => {
      const regsSnap = await db.collection('studentExamRegistrations').get();
      setExamRegistrations(regsSnap.docs.map(d => ({
        ...d.data(),
        id: d.id
      })));
      const stuSnap = await db.collection('students').where('school', '==', currentUser.school).get();
      const studentsData = stuSnap.docs.map(d => {
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
      setStudents(studentsData);
    };
    fetchData();
  }, [currentUser.school]);
  const gradeOptions = Array.from(new Set(students.map(s => s.grade).filter(Boolean))).sort();
  const genderOptions = Array.from(new Set(students.map(s => s.gender).filter(Boolean))).sort();
  const examOptions = Array.from(new Set(examRegistrations.flatMap(r => (r.exams || []).map(e => e.examName)).filter(Boolean))).sort();
  const filteredStudents = students.filter(s => {
    if (filterGrade !== 'All' && s.grade !== filterGrade) return false;
    if (filterGender !== 'All' && (s.gender || '') !== filterGender) return false;
    return true;
  });
  const detailRows = [];
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
        exam
      });
    });
  });
  const totalStudents = filteredStudents.length;
  const studentsWithRegs = new Set(detailRows.map(r => r.reg.studentId)).size;
  const pendingStudents = totalStudents - studentsWithRegs;
  const examStats = {};
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
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "\uD83D\uDCCA Exam Statistics - ", currentUser.school), React.createElement("div", {
    className: "grid md:grid-cols-3 gap-4"
  }, React.createElement("div", {
    className: "stat-card bg-blue-500 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Total Students"), React.createElement("div", {
    className: "text-5xl font-bold"
  }, totalStudents)), React.createElement("div", {
    className: "stat-card bg-green-500 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Registered"), React.createElement("div", {
    className: "text-5xl font-bold"
  }, studentsWithRegs)), React.createElement("div", {
    className: "stat-card bg-orange-500 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Pending"), React.createElement("div", {
    className: "text-5xl font-bold"
  }, pendingStudents))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "\uD83D\uDD0D Filters"), React.createElement("div", {
    className: "grid md:grid-cols-4 gap-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Grade"), React.createElement("select", {
    value: filterGrade,
    onChange: e => setFilterGrade(e.target.value),
    className: "w-full border-2 px-4 py-3 rounded-xl"
  }, React.createElement("option", {
    value: "All"
  }, "All Grades"), gradeOptions.map(g => React.createElement("option", {
    key: g,
    value: g
  }, "Class ", g)))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Gender"), React.createElement("select", {
    value: filterGender,
    onChange: e => setFilterGender(e.target.value),
    className: "w-full border-2 px-4 py-3 rounded-xl"
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
    className: "w-full border-2 px-4 py-3 rounded-xl"
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
    className: "w-full border-2 px-4 py-3 rounded-xl"
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
  }, "Need Help"))))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "\uD83D\uDCCB Exam-wise Status"), React.createElement("div", {
    className: "overflow-x-auto"
  }, React.createElement("table", {
    className: "w-full"
  }, React.createElement("thead", {
    className: "avanti-gradient-light"
  }, React.createElement("tr", null, React.createElement("th", {
    className: "p-3 text-left"
  }, "Exam"), React.createElement("th", {
    className: "p-3 text-center"
  }, "\u2713 Done"), React.createElement("th", {
    className: "p-3 text-center"
  }, "\u26A0 Partial"), React.createElement("th", {
    className: "p-3 text-center"
  }, "\u2717 Not Done"), React.createElement("th", {
    className: "p-3 text-center"
  }, "\uD83C\uDD98 Need Help"))), React.createElement("tbody", null, Object.keys(examStats).length === 0 ? React.createElement("tr", null, React.createElement("td", {
    colSpan: "5",
    className: "p-8 text-center text-gray-500"
  }, "No registrations yet")) : Object.entries(examStats).map(([examName, stats]) => React.createElement("tr", {
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
    colSpan: "10",
    className: "p-6 text-center text-gray-500"
  }, "No exam registrations found with current filters.")) : detailRows.map((row, idx) => {
    const status = row.exam.registrationStatus || 'No';
    const needHelp = row.exam.needSupport === 'Yes';
    return React.createElement("tr", {
      key: idx,
      className: "border-b hover:bg-gray-50"
    }, React.createElement("td", {
      className: "p-3"
    }, row.student.id), React.createElement("td", {
      className: "p-3"
    }, row.student.name), React.createElement("td", {
      className: "p-3"
    }, row.student.grade), React.createElement("td", {
      className: "p-3"
    }, row.student.gender || '—'), React.createElement("td", {
      className: "p-3"
    }, row.exam.examName), React.createElement("td", {
      className: "p-3"
    }, status === 'Yes' && React.createElement("span", {
      className: "px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold"
    }, "Completed"), status === 'Partially' && React.createElement("span", {
      className: "px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 font-semibold"
    }, "Partial"), status === 'No' && React.createElement("span", {
      className: "px-3 py-1 rounded-full bg-red-100 text-red-700 font-semibold"
    }, "Not Done")), React.createElement("td", {
      className: "p-3"
    }, needHelp ? React.createElement("span", {
      className: "px-3 py-1 rounded-full bg-orange-100 text-orange-700 font-semibold"
    }, "Yes") : 'No'), React.createElement("td", {
      className: "p-3"
    }, row.exam.registrationNumber || '—'), React.createElement("td", {
      className: "p-3"
    }, row.exam.emailUsed || '—'), React.createElement("td", {
      className: "p-3"
    }, row.exam.phoneUsed || '—'));
  }))))));
}
function StudentFeedbackView({
  accessibleSchools = [],
  isSuperAdmin = false,
  isDirector = false
}) {
  const [feedbackList, setFeedbackList] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const hasFullDataAccess = isSuperAdmin || isDirector;
  const [filterSchool, setFilterSchool] = useState('All');
  const [filterGrade, setFilterGrade] = useState('All');
  const [filterTeacher, setFilterTeacher] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const deleteFeedback = async (feedbackId, studentName) => {
    if (!isSuperAdmin) return;
    if (!confirm(`Are you sure you want to delete feedback from "${studentName || 'Unknown'}"?\n\nThis action cannot be undone.`)) return;
    try {
      setDeletingId(feedbackId);
      await db.collection('teacherFeedback').doc(feedbackId).delete();
      setFeedbackList(prev => prev.filter(f => f.id !== feedbackId));
      console.log('[Feedback] ✅ Deleted:', feedbackId);
    } catch (error) {
      console.error('Error deleting feedback:', error);
      alert('Failed to delete feedback: ' + error.message);
    } finally {
      setDeletingId(null);
    }
  };
  const [cleaningDuplicates, setCleaningDuplicates] = useState(false);
  const [duplicateCount, setDuplicateCount] = useState(0);
  const findDuplicates = (list) => {
    const seen = {};
    const duplicateIds = [];
    const sorted = [...list].sort((a, b) => a.submittedAt - b.submittedAt);
    sorted.forEach(f => {
      const dateStr = f.submittedAt ? f.submittedAt.toLocaleDateString('en-IN') : '';
      const timeStr = f.submittedAt ? f.submittedAt.toLocaleTimeString('en-IN') : '';
      const key = `${f.studentId || f.studentName || ''}_${f.teacherId || f.teacherAfid || f.teacherName || ''}_${f.subject || ''}_${dateStr}_${timeStr}`;
      if (seen[key]) {
        duplicateIds.push(f.id);
      } else {
        seen[key] = f.id;
      }
    });
    return duplicateIds;
  };
  useEffect(() => {
    const dupes = findDuplicates(feedbackList);
    setDuplicateCount(dupes.length);
  }, [feedbackList]);
  const cleanDuplicates = async () => {
    if (!isSuperAdmin) return;
    const dupeIds = findDuplicates(feedbackList);
    if (dupeIds.length === 0) {
      alert('No duplicates found!');
      return;
    }
    if (!confirm(`Found ${dupeIds.length} duplicate feedback entries (same student, teacher, subject, date & time).\n\nThis will keep 1 entry per exact timestamp and permanently delete the rest.\n\nProceed?`)) return;
    setCleaningDuplicates(true);
    try {
      let batch = db.batch();
      let batchCount = 0;
      let totalDeleted = 0;
      for (const id of dupeIds) {
        batch.delete(db.collection('teacherFeedback').doc(id));
        batchCount++;
        if (batchCount === 500) {
          await batch.commit();
          totalDeleted += batchCount;
          batch = db.batch();
          batchCount = 0;
        }
      }
      if (batchCount > 0) {
        await batch.commit();
        totalDeleted += batchCount;
      }
      setFeedbackList(prev => prev.filter(f => !dupeIds.includes(f.id)));
      alert(`✅ Cleaned ${totalDeleted} duplicate entries successfully!`);
      console.log('[Feedback] ✅ Removed', totalDeleted, 'duplicates');
    } catch (error) {
      console.error('Error cleaning duplicates:', error);
      alert('Failed to clean duplicates: ' + error.message);
    } finally {
      setCleaningDuplicates(false);
    }
  };
  const getCategoryFromRating = rating => {
    if (rating == null) return null;
    if (rating >= 5) return 'Excellent';
    if (rating >= 4) return 'Good';
    if (rating >= 3) return 'Average';
    return 'Needs Improvement';
  };
  const getExplanationSummary = (responses = {}) => {
    const rating = responses.q4?.rating ?? null;
    return getCategoryFromRating(rating);
  };
  const getDoubtSummary = (responses = {}) => {
    const rating = responses.q3?.rating;
    if (rating == null) return null;
    if (rating >= 5) return 'Always';
    if (rating >= 3) return 'Sometimes';
    return 'Rarely';
  };
  const getPaceSummary = (responses = {}) => {
    const rating = responses.q6?.rating;
    if (rating == null) return null;
    if (rating >= 4) return 'Just Right';
    return 'Needs Change';
  };
  const getCommentsSummary = (responses = {}) => {
    return responses.q10?.text || '';
  };
  const QUESTION_DEFS = [{
    id: 'q1',
    label: 'Q1 Punctuality (1-5)',
    type: 'mcq'
  }, {
    id: 'q2',
    label: 'Q2 Academic Level (1-5)',
    type: 'mcq'
  }, {
    id: 'q3',
    label: 'Q3 Problem Solving (1-5)',
    type: 'mcq'
  }, {
    id: 'q4',
    label: 'Q4 Explanation Clarity (1-5)',
    type: 'mcq'
  }, {
    id: 'q5',
    label: 'Q5 Handwriting & Voice (1-5)',
    type: 'mcq'
  }, {
    id: 'q6',
    label: 'Q6 Time Management (1-5)',
    type: 'mcq'
  }, {
    id: 'q7',
    label: 'Q7 Guidance & Motivation (1-5)',
    type: 'mcq'
  }, {
    id: 'q8',
    label: 'Q8 Student Participation (1-5)',
    type: 'mcq'
  }, {
    id: 'q9',
    label: 'Q9 Equal Attention (1-5)',
    type: 'mcq'
  }, {
    id: 'q10',
    label: 'Q10 What they liked most',
    type: 'text'
  }, {
    id: 'q11',
    label: 'Q11 What can be improved',
    type: 'text'
  }];
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const feedbackSnap = await db.collection('teacherFeedback').get();
        const feedbackData = feedbackSnap.docs.map(doc => {
          const data = doc.data();
          const responses = data.responses || {};
          let submittedAt = new Date();
          if (data.submittedAt) {
            if (typeof data.submittedAt.toDate === 'function') {
              submittedAt = data.submittedAt.toDate();
            } else {
              submittedAt = new Date(data.submittedAt);
            }
          } else if (data.completedAt) {
            submittedAt = new Date(data.completedAt);
          }
          return {
            id: doc.id,
            ...data,
            submittedAt,
            rating: data.rating || data.averageRating || 0,
            explanationQuality: data.explanationQuality || getExplanationSummary(responses),
            doubtResolution: data.doubtResolution || getDoubtSummary(responses),
            teachingPace: data.teachingPace || getPaceSummary(responses),
            comments: data.comments || getCommentsSummary(responses)
          };
        });
        console.log('📊 [Feedback] Fetching ALL students');
        const studentsSnap = await db.collection('students').get();
        const studentsData = studentsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('✅ [Feedback] Loaded', studentsData.length, 'students');
        const teachersSnap = await db.collection('teachers').get();
        const teachersData = teachersSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setFeedbackList(feedbackData);
        setStudents(studentsData);
        setTeachers(teachersData);
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Error loading feedback data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  const schoolOptions = hasFullDataAccess ? SCHOOLS : accessibleSchools;
  const accessibleFeedback = hasFullDataAccess ? feedbackList : feedbackList.filter(f => accessibleSchools.includes(f.school));
  const accessibleTeachers = hasFullDataAccess ? teachers.filter(t => !t.isArchived) : teachers.filter(t => accessibleSchools.includes(t.school) && !t.isArchived);
  const teachersForDropdown = filterSchool === 'All' ? accessibleTeachers : accessibleTeachers.filter(t => t.school === filterSchool);
  const getStudentDetails = studentId => {
    return students.find(s => s.id === studentId) || {};
  };
  const getTeacherName = teacherId => {
    const teacher = teachers.find(t => t.id === teacherId || t.afid === teacherId || t.docId === teacherId);
    if (!teacher) return 'Unknown Teacher';
    return teacher.isArchived ? `${teacher.name} (Archived)` : teacher.name;
  };
  const getTeacherInfo = teacherId => {
    return teachers.find(t => t.id === teacherId || t.afid === teacherId || t.docId === teacherId) || null;
  };
  const filteredFeedback = accessibleFeedback.filter(feedback => {
    const student = getStudentDetails(feedback.studentId);
    // Use stored teacherName if available, otherwise lookup
    const teacherName = feedback.teacherName || getTeacherName(feedback.teacherId || feedback.teacherAfid);
    if (filterSchool !== 'All' && feedback.school !== filterSchool) return false;
    if (filterGrade !== 'All' && student.grade !== filterGrade) return false;
    if (filterTeacher !== 'All' && teacherName !== filterTeacher) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = student.name?.toLowerCase().includes(query);
      const matchesId = student.studentId?.toLowerCase().includes(query);
      if (!matchesName && !matchesId) return false;
    }
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      if (feedback.submittedAt < fromDate) return false;
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (feedback.submittedAt > toDate) return false;
    }
    return true;
  });
  const uniqueGrades = [...new Set(accessibleFeedback.map(f => {
    const student = getStudentDetails(f.studentId);
    return student.grade;
  }))].filter(Boolean).sort();
  const exportToCSV = () => {
    if (filteredFeedback.length === 0) {
      alert('No feedback to export');
      return;
    }
    const baseColumns = ['Date', 'Time', 'School', 'Student ID', 'Student Name', 'Grade', 'Teacher Name', 'Subject', 'Overall Rating (1-5)', 'Explanation Quality (summary)', 'Doubt Resolution (summary)', 'Teaching Pace (summary)', 'Comments (summary)'];
    const questionColumns = [];
    QUESTION_DEFS.forEach(q => {
      questionColumns.push(q.label);
      questionColumns.push(`${q.label} - Explanation`);
    });
    const allHeaders = [...baseColumns, ...questionColumns];
    const csvData = filteredFeedback.map(feedback => {
      const student = getStudentDetails(feedback.studentId);
      const teacherName = feedback.teacherName || getTeacherName(feedback.teacherId || feedback.teacherAfid);
      const responses = feedback.responses || {};
      const row = {};
      allHeaders.forEach(header => {
        row[header] = '';
      });
      row['Date'] = feedback.submittedAt ? feedback.submittedAt.toLocaleDateString('en-IN') : '';
      row['Time'] = feedback.submittedAt ? feedback.submittedAt.toLocaleTimeString('en-IN') : '';
      row['School'] = feedback.school || student?.school || '';
      row['Student ID'] = student?.studentId || student?.id || feedback.studentId || '';
      row['Student Name'] = student?.name || feedback.studentName || '';
      row['Grade'] = student?.grade || feedback.grade || '';
      row['Teacher Name'] = teacherName || '';
      row['Subject'] = feedback.subject || '';
      row['Overall Rating (1-5)'] = (feedback.rating || feedback.averageRating || 0).toString();
      row['Explanation Quality (summary)'] = feedback.explanationQuality || '';
      row['Doubt Resolution (summary)'] = feedback.doubtResolution || '';
      row['Teaching Pace (summary)'] = feedback.teachingPace || '';
      row['Comments (summary)'] = feedback.comments || '';
      QUESTION_DEFS.forEach(q => {
        const resp = responses[q.id] || {};
        let value = '';
        if (q.type === 'mcq') {
          value = resp.rating != null ? String(resp.rating) : '';
        } else if (q.type === 'rating') {
          value = resp.rating != null ? String(resp.rating) : '';
        } else if (q.type === 'yesno') {
          value = resp.answer != null ? String(resp.answer) : '';
        } else if (q.type === 'text') {
          value = resp.text || (typeof resp === 'string' ? resp : '') || '';
        } else {
          value = resp.rating != null ? String(resp.rating) : resp.text || resp.answer || (typeof resp === 'string' ? resp : '');
        }
        row[q.label] = value || '';
        row[`${q.label} - Explanation`] = resp.explanation || '';
      });
      return row;
    });
    const csvContent = [allHeaders.join(','), ...csvData.map(row => allHeaders.map(header => {
      const value = (row[header] ?? '').toString();
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(','))].join('\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], {
      type: 'text/csv;charset=utf-8;'
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `student_feedback_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const getRatingBadge = rating => {
    if (rating >= 4.5) return {
      text: 'Excellent',
      class: 'rating-excellent'
    };
    if (rating >= 3.5) return {
      text: 'Good',
      class: 'rating-good'
    };
    if (rating >= 2.5) return {
      text: 'Average',
      class: 'rating-average'
    };
    return {
      text: 'Needs Improvement',
      class: 'rating-poor'
    };
  };
  const stats = {
    total: filteredFeedback.length,
    avgRating: filteredFeedback.length > 0 ? (filteredFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / filteredFeedback.length).toFixed(1) : 0,
    excellent: filteredFeedback.filter(f => (f.rating || 0) >= 4.5).length,
    good: filteredFeedback.filter(f => (f.rating || 0) >= 3.5 && (f.rating || 0) < 4.5).length,
    average: filteredFeedback.filter(f => (f.rating || 0) >= 2.5 && (f.rating || 0) < 3.5).length,
    poor: filteredFeedback.filter(f => (f.rating || 0) < 2.5).length
  };
  if (loading) {
    return React.createElement("div", {
      className: "flex items-center justify-center min-h-screen"
    }, React.createElement("div", {
      className: "text-2xl font-bold"
    }, "Loading feedback data..."));
  }
  return React.createElement("div", {
    className: "space-y-6 p-6"
  }, React.createElement("div", {
    className: "flex flex-wrap items-center justify-between gap-4"
  }, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "\uD83D\uDCAC Student Feedback"), React.createElement("div", {
    className: "flex flex-wrap gap-3"
  }, isSuperAdmin && duplicateCount > 0 && React.createElement("button", {
    onClick: cleanDuplicates,
    disabled: cleaningDuplicates,
    className: "px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
  }, cleaningDuplicates ? '⏳ Cleaning...' : `🧹 Clean ${duplicateCount} Duplicates`), React.createElement("button", {
    onClick: exportToCSV,
    disabled: filteredFeedback.length === 0,
    className: "px-6 py-3 avanti-gradient text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
  }, "\uD83D\uDCE5 Export to CSV"))), React.createElement("div", {
    className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
  }, React.createElement("div", {
    className: "stat-card bg-blue-500 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Total Feedback"), React.createElement("div", {
    className: "text-3xl font-bold"
  }, stats.total)), React.createElement("div", {
    className: "stat-card bg-purple-500 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Avg Rating"), React.createElement("div", {
    className: "text-3xl font-bold"
  }, "\u2B50 ", stats.avgRating, React.createElement("span", {
    className: "text-lg ml-2 opacity-90"
  }, "(", stats.avgRating > 0 ? ((stats.avgRating / 5) * 100).toFixed(0) : 0, "%)"))), React.createElement("div", {
    className: "stat-card bg-green-500 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Excellent"), React.createElement("div", {
    className: "text-3xl font-bold"
  }, stats.excellent)), React.createElement("div", {
    className: "stat-card bg-blue-400 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Good"), React.createElement("div", {
    className: "text-3xl font-bold"
  }, stats.good)), React.createElement("div", {
    className: "stat-card bg-yellow-500 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Average"), React.createElement("div", {
    className: "text-3xl font-bold"
  }, stats.average)), React.createElement("div", {
    className: "stat-card bg-red-500 text-white"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Poor"), React.createElement("div", {
    className: "text-3xl font-bold"
  }, stats.poor))), React.createElement(MonthlyFeedbackTrendGraph, {
    feedbackData: filteredFeedback
  }), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg space-y-4"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "\uD83D\uDD0D Filters"), React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-semibold mb-2"
  }, "School"), React.createElement("select", {
    value: filterSchool,
    onChange: e => {
      setFilterSchool(e.target.value);
      setFilterTeacher('All');
    },
    className: "w-full p-3 border-2 rounded-xl"
  }, React.createElement("option", {
    value: "All"
  }, "All Schools"), schoolOptions.map(school => React.createElement("option", {
    key: school,
    value: school
  }, school)))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-semibold mb-2"
  }, "Grade"), React.createElement("select", {
    value: filterGrade,
    onChange: e => setFilterGrade(e.target.value),
    className: "w-full p-3 border-2 rounded-xl"
  }, React.createElement("option", {
    value: "All"
  }, "All Grades"), uniqueGrades.map(grade => React.createElement("option", {
    key: grade,
    value: grade
  }, grade)))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-semibold mb-2"
  }, "Teacher"), React.createElement("select", {
    value: filterTeacher,
    onChange: e => setFilterTeacher(e.target.value),
    className: "w-full p-3 border-2 rounded-xl"
  }, React.createElement("option", {
    value: "All"
  }, "All Teachers"), teachersForDropdown.map(teacher => React.createElement("option", {
    key: teacher.id,
    value: teacher.name
  }, teacher.name)))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-semibold mb-2"
  }, "Search Student"), React.createElement("input", {
    type: "text",
    value: searchQuery,
    onChange: e => setSearchQuery(e.target.value),
    placeholder: "Name or ID...",
    className: "w-full p-3 border-2 rounded-xl"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-semibold mb-2"
  }, "From Date"), React.createElement("input", {
    type: "date",
    value: dateFrom,
    onChange: e => setDateFrom(e.target.value),
    className: "w-full p-3 border-2 rounded-xl"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-semibold mb-2"
  }, "To Date"), React.createElement("input", {
    type: "date",
    value: dateTo,
    onChange: e => setDateTo(e.target.value),
    className: "w-full p-3 border-2 rounded-xl"
  }))), React.createElement("button", {
    onClick: () => {
      setFilterSchool('All');
      setFilterGrade('All');
      setFilterTeacher('All');
      setSearchQuery('');
      setDateFrom('');
      setDateTo('');
    },
    className: "mt-4 px-6 py-2 bg-gray-500 text-white rounded-xl font-semibold hover:bg-gray-600"
  }, "Clear All Filters")), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "\uD83D\uDCCB Feedback List (", filteredFeedback.length, " ", filteredFeedback.length === 1 ? 'entry' : 'entries', ")"), React.createElement("div", {
    className: "overflow-x-auto"
  }, filteredFeedback.length === 0 ? React.createElement("div", {
    className: "text-center py-12 text-gray-500"
  }, React.createElement("div", {
    className: "text-6xl mb-4"
  }, "\uD83D\uDCED"), React.createElement("div", {
    className: "text-xl font-semibold"
  }, "No feedback found"), React.createElement("div", {
    className: "text-sm mt-2"
  }, "Try adjusting your filters")) : React.createElement("table", {
    className: "w-full"
  }, React.createElement("thead", {
    className: "avanti-gradient-light"
  }, React.createElement("tr", null, React.createElement("th", {
    className: "p-3 text-left"
  }, "Date"), React.createElement("th", {
    className: "p-3 text-left"
  }, "School"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Student ID"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Student Name"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Grade"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Teacher"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Subject"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Rating"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Explanation"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Doubt Help"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Pace"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Comments"), isSuperAdmin && React.createElement("th", {
    className: "p-3 text-left"
  }, "Action"))), React.createElement("tbody", null, filteredFeedback.map(feedback => {
    const student = getStudentDetails(feedback.studentId);
    const teacherName = feedback.teacherName || getTeacherName(feedback.teacherId || feedback.teacherAfid);
    const ratingBadge = getRatingBadge(feedback.rating);
    return React.createElement("tr", {
      key: feedback.id,
      className: "border-b hover:bg-gray-50"
    }, React.createElement("td", {
      className: "p-3"
    }, React.createElement("div", {
      className: "text-sm font-semibold"
    }, feedback.submittedAt.toLocaleDateString('en-IN')), React.createElement("div", {
      className: "text-xs text-gray-500"
    }, feedback.submittedAt.toLocaleTimeString('en-IN'))), React.createElement("td", {
      className: "p-3 font-semibold"
    }, student.school || 'N/A'), React.createElement("td", {
      className: "p-3"
    }, student.studentId || 'N/A'), React.createElement("td", {
      className: "p-3 font-semibold"
    }, student.name || 'N/A'), React.createElement("td", {
      className: "p-3"
    }, student.grade || 'N/A'), React.createElement("td", {
      className: "p-3 font-semibold"
    }, teacherName), React.createElement("td", {
      className: "p-3"
    }, feedback.subject || 'N/A'), React.createElement("td", {
      className: "p-3"
    }, React.createElement("div", {
      className: `rating-badge ${ratingBadge.class}`
    }, "\u2B50 ", feedback.rating?.toFixed(1) || 0)), React.createElement("td", {
      className: "p-3"
    }, React.createElement("span", {
      className: `px-3 py-1 rounded-full text-sm font-semibold ${feedback.explanationQuality === 'Excellent' ? 'bg-green-100 text-green-700' : feedback.explanationQuality === 'Good' ? 'bg-blue-100 text-blue-700' : feedback.explanationQuality === 'Average' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`
    }, feedback.explanationQuality || 'N/A')), React.createElement("td", {
      className: "p-3"
    }, React.createElement("span", {
      className: `px-3 py-1 rounded-full text-sm font-semibold ${feedback.doubtResolution === 'Always' ? 'bg-green-100 text-green-700' : feedback.doubtResolution === 'Sometimes' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`
    }, feedback.doubtResolution || 'N/A')), React.createElement("td", {
      className: "p-3"
    }, React.createElement("span", {
      className: `px-3 py-1 rounded-full text-sm font-semibold ${feedback.teachingPace === 'Just Right' ? 'bg-green-100 text-green-700' : feedback.teachingPace === 'Too Fast' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`
    }, feedback.teachingPace || 'N/A')), React.createElement("td", {
      className: "p-3"
    }, React.createElement("div", {
      className: "max-w-xs truncate",
      title: feedback.comments
    }, feedback.comments || '-')), isSuperAdmin && React.createElement("td", {
      className: "p-3"
    }, React.createElement("button", {
      onClick: () => deleteFeedback(feedback.id, student.name || feedback.studentName),
      disabled: deletingId === feedback.id,
      className: "px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed",
      title: "Delete this feedback"
    }, deletingId === feedback.id ? '⏳' : '🗑️ Delete')));
  }))))));
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
function AdminClassroomObservations({
  teachers,
  currentUser
}) {
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showObservationForm, setShowObservationForm] = useState(false);
  const [showTeacherProfile, setShowTeacherProfile] = useState(false);
  const [filterSchool, setFilterSchool] = useState('All');
  const [filterSubject, setFilterSubject] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [observationList, setObservationList] = useState([]);
  const [listFilterSchool, setListFilterSchool] = useState('All');
  const [listFilterTeacher, setListFilterTeacher] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const generateObservationPDF = observation => {
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
    })} ${observation.observationTime || ''}</span>
          </div>
          <div class="info-item">
            <label>Observer</label>
            <span>${observation.observerName} (${observation.observerPosition || 'Manager'})</span>
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
          <span>Avanti Fellows - Classroom Observation</span>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };
  useEffect(() => {
    const fetchObservations = async () => {
      try {
        setLoading(true);
        const snapshot = await db.collection('classroomObservations').orderBy('submittedAt', 'desc').get();
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          submittedAt: doc.data().submittedAt?.toDate() || new Date(doc.data().submittedAtISO)
        }));
        setObservationList(data);
      } catch (error) {
        console.error('Error fetching observations:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchObservations();
  }, []);
  const filteredTeachers = teachers.filter(t => {
    if (t.isArchived) return false;
    const matchesSearch = t.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSchool = filterSchool === 'All' || t.school === filterSchool;
    const matchesSubject = filterSubject === 'All' || t.subject === filterSubject;
    return matchesSearch && matchesSchool && matchesSubject;
  });
  const filteredObservations = observationList.filter(obs => {
    const matchesSchool = listFilterSchool === 'All' || obs.school === listFilterSchool;
    const matchesTeacher = listFilterTeacher === 'All' || obs.teacherId === listFilterTeacher;
    const obsDate = new Date(obs.observationDate || obs.submittedAt).toISOString().split('T')[0];
    const matchesDateFrom = !dateFrom || obsDate >= dateFrom;
    const matchesDateTo = !dateTo || obsDate <= dateTo;
    return matchesSchool && matchesTeacher && matchesDateFrom && matchesDateTo;
  });
  const teacherObservationCounts = useMemo(() => {
    const counts = {};
    observationList.forEach(obs => {
      counts[obs.teacherId] = (counts[obs.teacherId] || 0) + 1;
    });
    return counts;
  }, [observationList]);
  const teacherLatestScores = useMemo(() => {
    const scores = {};
    observationList.forEach(obs => {
      if (!scores[obs.teacherId]) {
        scores[obs.teacherId] = obs.percentageScore;
      }
    });
    return scores;
  }, [observationList]);
  const observerInfo = {
    id: currentUser?.afid || currentUser?.uid,
    name: currentUser?.name || currentUser?.email || 'Admin',
    position: currentUser?.position || 'Manager'
  };
  const handleObservationSuccess = async () => {
    const snapshot = await db.collection('classroomObservations').orderBy('submittedAt', 'desc').get();
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      submittedAt: doc.data().submittedAt?.toDate() || new Date(doc.data().submittedAtISO)
    }));
    setObservationList(data);
  };
  const handleExport = () => {
    const exportData = filteredObservations.map(obs => ({
      'Date': new Date(obs.observationDate || obs.submittedAt).toLocaleDateString('en-IN'),
      'Time': obs.observationTime || '',
      'Teacher': obs.teacherName,
      'Subject': obs.teacherSubject,
      'School': obs.school,
      'Grade': obs.grade,
      'Score': obs.totalScore,
      'Max Score': obs.maxScore,
      'Percentage': obs.percentageScore + '%',
      'Flagged Items': obs.flaggedCount,
      'Strengths': obs.strengths || '',
      'Improvements': obs.improvements || '',
      'Observer': obs.observerName
    }));
    exportToExcel(exportData, 'classroom_observations');
  };
  return React.createElement("div", {
    className: "space-y-6"
  }, React.createElement("h2", {
    className: "text-3xl font-bold"
  }, "\uD83D\uDCCB Classroom Observations"), React.createElement("div", {
    className: "grid md:grid-cols-4 gap-4"
  }, React.createElement("div", {
    className: "bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Total Observations"), React.createElement("div", {
    className: "text-3xl font-bold"
  }, observationList.length)), React.createElement("div", {
    className: "bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-xl"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Teachers Observed"), React.createElement("div", {
    className: "text-3xl font-bold"
  }, Object.keys(teacherObservationCounts).length)), React.createElement("div", {
    className: "bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-4 rounded-xl"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "Avg Score"), React.createElement("div", {
    className: "text-3xl font-bold"
  }, observationList.length > 0 ? (observationList.reduce((sum, o) => sum + o.percentageScore, 0) / observationList.length).toFixed(1) + '%' : 'N/A')), React.createElement("div", {
    className: "bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-xl"
  }, React.createElement("div", {
    className: "text-sm opacity-90"
  }, "This Month"), React.createElement("div", {
    className: "text-3xl font-bold"
  }, observationList.filter(o => {
    const d = new Date(o.observationDate || o.submittedAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("h3", {
    className: "text-xl font-bold mb-4"
  }, "\uD83D\uDC65 Select Teacher for Observation"), React.createElement("div", {
    className: "grid md:grid-cols-3 gap-4 mb-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Search Teacher"), React.createElement("input", {
    type: "text",
    value: searchTerm,
    onChange: e => setSearchTerm(e.target.value),
    placeholder: "Type name...",
    className: "w-full border-2 px-4 py-3 rounded-xl"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "School"), React.createElement("select", {
    value: filterSchool,
    onChange: e => setFilterSchool(e.target.value),
    className: "w-full border-2 px-4 py-3 rounded-xl"
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
    className: "w-full border-2 px-4 py-3 rounded-xl"
  }, React.createElement("option", {
    value: "All"
  }, "All Subjects"), SUBJECTS.map(s => React.createElement("option", {
    key: s,
    value: s
  }, s))))), React.createElement("div", {
    className: "grid md:grid-cols-2 lg:grid-cols-3 gap-4"
  }, filteredTeachers.map(teacher => React.createElement("div", {
    key: teacher.docId || teacher.afid,
    className: "border-2 rounded-xl p-4 hover:border-yellow-400 transition"
  }, React.createElement("div", {
    className: "flex justify-between items-start mb-3"
  }, React.createElement("div", null, React.createElement("div", {
    className: "font-bold text-lg"
  }, teacher.name), React.createElement("div", {
    className: "text-sm text-gray-500"
  }, teacher.subject, " | ", teacher.school)), teacherObservationCounts[teacher.afid] && React.createElement("span", {
    className: "px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold"
  }, teacherObservationCounts[teacher.afid], " obs")), teacherLatestScores[teacher.afid] !== undefined && React.createElement("div", {
    className: "mb-3"
  }, React.createElement("span", {
    className: "text-sm text-gray-500"
  }, "Latest Score: "), React.createElement("span", {
    className: `font-bold ${teacherLatestScores[teacher.afid] >= 80 ? 'text-green-600' : teacherLatestScores[teacher.afid] >= 60 ? 'text-yellow-600' : 'text-red-600'}`
  }, teacherLatestScores[teacher.afid], "%")), React.createElement("div", {
    className: "flex gap-2"
  }, React.createElement("button", {
    onClick: () => {
      setSelectedTeacher(teacher);
      setShowObservationForm(true);
    },
    className: "flex-1 px-3 py-2 avanti-gradient text-white rounded-lg text-sm font-semibold"
  }, "\uD83D\uDCDD New Observation"), React.createElement("button", {
    onClick: () => {
      setSelectedTeacher(teacher);
      setShowTeacherProfile(true);
    },
    className: "flex-1 px-3 py-2 bg-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-300"
  }, "\uD83D\uDC64 Profile")))))), React.createElement("div", {
    className: "bg-white p-6 rounded-2xl shadow-lg"
  }, React.createElement("div", {
    className: "flex justify-between items-center mb-4"
  }, React.createElement("h3", {
    className: "text-xl font-bold"
  }, "\uD83D\uDCCA Observation History"), React.createElement("button", {
    onClick: handleExport,
    className: "px-4 py-2 bg-green-600 text-white rounded-xl font-semibold"
  }, "\uD83D\uDCE5 Export to Excel")), React.createElement("div", {
    className: "grid md:grid-cols-4 gap-4 mb-4"
  }, React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "School"), React.createElement("select", {
    value: listFilterSchool,
    onChange: e => setListFilterSchool(e.target.value),
    className: "w-full border-2 px-4 py-2 rounded-xl"
  }, React.createElement("option", {
    value: "All"
  }, "All Schools"), SCHOOLS.map(s => React.createElement("option", {
    key: s,
    value: s
  }, s)))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "Teacher"), React.createElement("select", {
    value: listFilterTeacher,
    onChange: e => setListFilterTeacher(e.target.value),
    className: "w-full border-2 px-4 py-2 rounded-xl"
  }, React.createElement("option", {
    value: "All"
  }, "All Teachers"), teachers.filter(t => !t.isArchived).map(t => React.createElement("option", {
    key: t.afid,
    value: t.afid
  }, t.name)))), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "From Date"), React.createElement("input", {
    type: "date",
    value: dateFrom,
    onChange: e => setDateFrom(e.target.value),
    className: "w-full border-2 px-4 py-2 rounded-xl"
  })), React.createElement("div", null, React.createElement("label", {
    className: "block text-sm font-bold mb-2"
  }, "To Date"), React.createElement("input", {
    type: "date",
    value: dateTo,
    onChange: e => setDateTo(e.target.value),
    className: "w-full border-2 px-4 py-2 rounded-xl"
  }))), loading ? React.createElement("div", {
    className: "text-center py-8"
  }, React.createElement("div", {
    className: "text-4xl mb-2"
  }, "\u23F3"), React.createElement("p", null, "Loading observations...")) : filteredObservations.length === 0 ? React.createElement("div", {
    className: "text-center py-8 text-gray-500"
  }, React.createElement("div", {
    className: "text-4xl mb-2"
  }, "\uD83D\uDCCB"), React.createElement("p", null, "No observations found")) : React.createElement("div", {
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
  }, "Subject"), React.createElement("th", {
    className: "p-3 text-left"
  }, "School"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Grade"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Score"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Flagged"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Observer"), React.createElement("th", {
    className: "p-3 text-left"
  }, "Actions"))), React.createElement("tbody", null, filteredObservations.map(obs => React.createElement("tr", {
    key: obs.id,
    className: "border-b hover:bg-gray-50"
  }, React.createElement("td", {
    className: "p-3"
  }, React.createElement("div", {
    className: "font-semibold"
  }, new Date(obs.observationDate || obs.submittedAt).toLocaleDateString('en-IN')), React.createElement("div", {
    className: "text-xs text-gray-500"
  }, obs.observationTime)), React.createElement("td", {
    className: "p-3 font-semibold"
  }, obs.teacherName), React.createElement("td", {
    className: "p-3"
  }, obs.teacherSubject), React.createElement("td", {
    className: "p-3"
  }, obs.school), React.createElement("td", {
    className: "p-3"
  }, "Class ", obs.grade), React.createElement("td", {
    className: "p-3"
  }, React.createElement("span", {
    className: `px-3 py-1 rounded-full font-bold ${obs.percentageScore >= 80 ? 'bg-green-100 text-green-700' : obs.percentageScore >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`
  }, obs.percentageScore, "%")), React.createElement("td", {
    className: "p-3"
  }, React.createElement("span", {
    className: "px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm"
  }, obs.flaggedCount)), React.createElement("td", {
    className: "p-3 text-sm"
  }, obs.observerName), React.createElement("td", {
    className: "p-3"
  }, React.createElement("div", {
    className: "flex gap-2"
  }, React.createElement("button", {
    onClick: () => {
      const teacher = teachers.find(t => t.afid === obs.teacherId);
      if (teacher) {
        setSelectedTeacher(teacher);
        setShowTeacherProfile(true);
      }
    },
    className: "px-3 py-1 bg-blue-600 text-white rounded-lg text-sm"
  }, "View"), React.createElement("button", {
    onClick: () => generateObservationPDF(obs),
    className: "px-3 py-1 bg-green-600 text-white rounded-lg text-sm",
    title: "Download/Print PDF"
  }, "\uD83D\uDCC4 PDF"))))))))), showObservationForm && selectedTeacher && React.createElement(ClassroomObservationForm, {
    teacher: selectedTeacher,
    observerInfo: observerInfo,
    onClose: () => {
      setShowObservationForm(false);
      setSelectedTeacher(null);
    },
    onSubmitSuccess: handleObservationSuccess
  }), showTeacherProfile && selectedTeacher && React.createElement(TeacherProfileView, {
    teacher: selectedTeacher,
    currentUser: currentUser,
    onClose: () => {
      setShowTeacherProfile(false);
      setSelectedTeacher(null);
    }
  }), React.createElement(NetworkStatus, null));
}

// ✅ Mount the React application
ReactDOM.render(React.createElement(App, null), document.getElementById('root'));
