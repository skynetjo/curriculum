// ✅ TIMETABLE PAGE v1.1.0 - Avanti Fellows Curriculum Tracker
// Fixes: canEdit() now works for teachers (userType check), admin school picker added


// ─── Admin wrapper (shown in Admin view schoolinfo section) ──────────────────
function TimetableAdminSection({ currentUser, availableSchools, isSuperAdmin }) {
@@ -55,6 +56,7 @@ function TimetablePage({ currentUser, mySchool }) {
  var [teachers, setTeachers] = useState([]);
  var [timetable11, setTimetable11] = useState({});
  var [timetable12, setTimetable12] = useState({});

  var [isSaving, setIsSaving] = useState(false);
  var [isLoading, setIsLoading] = useState(true);
  var [saveMsg, setSaveMsg] = useState('');
@@ -63,8 +65,37 @@ function TimetablePage({ currentUser, mySchool }) {
  var [lastSaved, setLastSaved] = useState(null);

  var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  var PERIODS = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8'];
  var PERIOD_LABELS = ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6', 'Period 7', 'Period 8'];

  // ─── Load data ───────────────────────────────────────────────────────────────
  useEffect(function() {
@@ -74,6 +105,7 @@ function TimetablePage({ currentUser, mySchool }) {
    setTeachers([]);
    setTimetable11({});
    setTimetable12({});

    setLastSaved(null);
    Promise.all([
      db.collection('teachers').where('school', '==', mySchool).get(),
@@ -85,14 +117,23 @@ function TimetablePage({ currentUser, mySchool }) {
        .filter(function(t) { return !t.isArchived; })
        .sort(function(a, b) { return (a.name || '').localeCompare(b.name || ''); });
      setTeachers(tList);



      if (results[1].exists) {
        setTimetable11(results[1].data().slots || {});
        setLastSaved(results[1].data().updatedAt || null);


      }
      if (results[2].exists) {
        setTimetable12(results[2].data().slots || {});
        if (!results[1].exists && results[2].data().updatedAt) setLastSaved(results[2].data().updatedAt);


      }


    }).catch(function(e) {
      console.error('Timetable load error:', e);
    }).finally(function() { setIsLoading(false); });
@@ -102,23 +143,20 @@ function TimetablePage({ currentUser, mySchool }) {
  useEffect(function() {
    var found = [];
    DAYS.forEach(function(day) {
      PERIODS.forEach(function(period) {
        var key = day + '_' + period;

        var s11 = timetable11[key] || {};
        var s12 = timetable12[key] || {};
        if (s11.teacherId && s12.teacherId && s11.teacherId === s12.teacherId) {
          found.push({ day: day, period: period, teacherName: s11.teacherName || 'Unknown' });
        }
      });
    });
    setConflicts(found);
  }, [timetable11, timetable12]);

  // ─── Role check ───────────────────────────────────────────────────────────────
  // ✅ FIX: Check BOTH userType AND role.
  // Teachers → userType='teacher' (no role field)
  // Managers → userType='manager', role='pm'/'apm' etc.
  // Super Admin → userType='superadmin'
  function canEdit() {
    if (!currentUser) return false;
    var utype = (currentUser.userType || '').toLowerCase();
@@ -133,59 +171,134 @@ function TimetablePage({ currentUser, mySchool }) {

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  function getTId(t) { return t.afid || t.docId; }

  function getSubjects() {
    var seen = {}; var subs = [];

    teachers.forEach(function(t) {
      if (t.subject && !seen[t.subject]) { seen[t.subject] = true; subs.push(t.subject); }
    });



    return subs.sort();
  }

  function getTeachersForSubject(subject) {
    if (!subject) return teachers;
    return teachers.filter(function(t) { return t.subject === subject; });
  }
  function getSlot(grade, day, period) {
    var key = day + '_' + period;

    return grade === '11' ? (timetable11[key] || {}) : (timetable12[key] || {});
  }
  function updateSlot(grade, day, period, updates) {
    var key = day + '_' + period;

    var setter = grade === '11' ? setTimetable11 : setTimetable12;
    setter(function(prev) {
      return Object.assign({}, prev, { [key]: Object.assign({}, prev[key] || {}, updates) });
    });
  }
  function clearSlot(grade, day, period) {
    var key = day + '_' + period;

    var setter = grade === '11' ? setTimetable11 : setTimetable12;
    setter(function(prev) {
      var next = Object.assign({}, prev);
      delete next[key];
      return next;
    });
  }
  function isConflict(day, period) {
    return conflicts.some(function(c) { return c.day === day && c.period === period; });

  }
  function handleSubjectChange(grade, day, period, subject) {
    var current = getSlot(grade, day, period);



















    var updates = { subject: subject };
    if (current.teacherId) {
      var t = teachers.find(function(x) { return getTId(x) === current.teacherId; });
      if (t && t.subject !== subject) { updates.teacherId = ''; updates.teacherName = ''; }



    }
    updateSlot(grade, day, period, updates);
  }
  function handleTeacherChange(grade, day, period, teacherId) {










    var t = teachers.find(function(x) { return getTId(x) === teacherId; });
    var current = getSlot(grade, day, period);
    updateSlot(grade, day, period, {
      teacherId: teacherId,
      teacherName: t ? (t.name || '') : '',
      subject: t ? (t.subject || current.subject || '') : (current.subject || '')
    });
  }// ─── Save ─────────────────────────────────────────────────────────────────────
  async function saveTimetable() {
    if (conflicts.length > 0) {
@@ -199,6 +312,7 @@ function TimetablePage({ currentUser, mySchool }) {
      var now = new Date().toISOString();
      var base = {
        school: mySchool, updatedAt: now,

        updatedBy: (currentUser && (currentUser.afid || currentUser.email)) || '',
        updatedByName: (currentUser && currentUser.name) || ''
      };
@@ -216,18 +330,29 @@ function TimetablePage({ currentUser, mySchool }) {
  // ─── Export CSV ───────────────────────────────────────────────────────────────
  function exportCSV() {
    var tt = activeClass === '11' ? timetable11 : timetable12;
    var rows = [['Day'].concat(PERIOD_LABELS)];
DAYS.forEach(function(day) {
      var row = [day];
      PERIODS.forEach(function(p) {
        var slot = tt[day + '_' + p] || {};
        row.push(slot.subject ? slot.subject + (slot.teacherName ? ' (' + slot.teacherName + ')' : '') : '');
});
      rows.push(row);
    });

    var csv = rows.map(function(r) {
      return r.map(function(c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(',');
    }).join('\n');

    var blob = new Blob([csv], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
@@ -250,11 +375,12 @@ function TimetablePage({ currentUser, mySchool }) {
    function getTeacherSchedule(teacherId) {
      var schedule = {};
      DAYS.forEach(function(day) {
        PERIODS.forEach(function(period) {
          var key = day + '_' + period;

          var s11 = timetable11[key] || {}; var s12 = timetable12[key] || {};
          if (s11.teacherId === teacherId) schedule[key] = { grade: '11', subject: s11.subject || '' };
          else if (s12.teacherId === teacherId) schedule[key] = { grade: '12', subject: s12.subject || '' };
        });
      });
      return schedule;
@@ -296,17 +422,20 @@ function TimetablePage({ currentUser, mySchool }) {
                  React.createElement('thead', null,
                    React.createElement('tr', { className: 'bg-gray-100' },
                      React.createElement('th', { className: 'border p-2 text-left' }, 'Day'),
                      PERIOD_LABELS.map(function(p, i) {
                        return React.createElement('th', { key: i, className: 'border p-2 text-center' }, p);
                      })
                    )
                  ),
                  React.createElement('tbody', null,
                    DAYS.map(function(day) {
                      return React.createElement('tr', { key: day, className: 'odd:bg-white even:bg-gray-50' },
                        React.createElement('td', { className: 'border p-2 font-semibold whitespace-nowrap' }, day),
                        PERIODS.map(function(period, i) {
                          var slot = sch[day + '_' + period];



                          return React.createElement('td', { key: i, className: 'border p-1 text-center ' + (slot ? 'bg-green-50' : '') },
                            slot
                              ? React.createElement('div', null,
@@ -362,6 +491,14 @@ function TimetablePage({ currentUser, mySchool }) {
        )
      ),
      React.createElement('div', { className: 'flex flex-wrap gap-2' },
        React.createElement('button', {
          onClick: function() { setActiveView('teacher'); },
          className: 'px-3 py-2 bg-purple-600 text-white rounded-xl font-semibold text-xs hover:bg-purple-700'
@@ -409,7 +546,7 @@ function TimetablePage({ currentUser, mySchool }) {
        })
      ),
      React.createElement('div', { className: 'text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full' },
        totalFilled + ' / ' + (DAYS.length * PERIODS.length) + ' periods filled'
      ),
      !editable && React.createElement('span', { className: 'text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full border border-yellow-200' }, '👁️ View only')
    ),
@@ -419,30 +556,73 @@ function TimetablePage({ currentUser, mySchool }) {

    // Grid
    React.createElement('div', { className: 'overflow-x-auto rounded-2xl shadow-lg' },
      React.createElement('div', { className: 'min-w-[700px]' },
        React.createElement('div', {
          className: 'grid bg-gray-800 text-white text-xs font-bold',
          style: { gridTemplateColumns: '80px repeat(8, 1fr)' }
        },
          React.createElement('div', { className: 'p-2 border-r border-gray-600' }, 'Day'),
          PERIOD_LABELS.map(function(p) {
            return React.createElement('div', { key: p, className: 'p-2 border-r border-gray-600 text-center' }, p);
          })
        ),
        DAYS.map(function(day, dayIdx) {
          return React.createElement('div', {
            key: day,
            className: 'grid border-b border-gray-200 ' + (dayIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'),
            style: { gridTemplateColumns: '80px repeat(8, 1fr)' }
          },
            React.createElement('div', {
              className: 'p-2 border-r border-gray-200 font-bold text-xs text-gray-700 flex items-center justify-center bg-gray-100'
            }, day.substring(0, 3).toUpperCase()),
            PERIODS.map(function(period, pIdx) {
              var slot = getSlot(activeClass, day, period);
              var conflict = isConflict(day, period);
              var teachersForSub = getTeachersForSubject(slot.subject);

              var cellBg = conflict ? 'bg-red-50' : (slot.subject || slot.teacherName) ? 'bg-purple-50' : '';
              return React.createElement('div', {
                key: pIdx,
                className: 'border-r border-b border-gray-200 p-1 ' + cellBg,
@@ -453,24 +633,25 @@ function TimetablePage({ currentUser, mySchool }) {
                  ? React.createElement('div', { className: 'space-y-1' },
                      React.createElement('select', {
                        value: slot.subject || '',
                        onChange: function(e) { handleSubjectChange(activeClass, day, period, e.target.value); },
                        className: 'w-full border border-gray-300 rounded-lg text-xs p-1 focus:border-purple-400 focus:outline-none bg-white'
                      },
                        React.createElement('option', { value: '' }, '— Sub —'),
                        subjects.map(function(s) { return React.createElement('option', { key: s, value: s }, s); })
                      ),
                      React.createElement('select', {
                        value: slot.teacherId || '',
                        onChange: function(e) { handleTeacherChange(activeClass, day, period, e.target.value); },
                        className: 'w-full border rounded-lg text-xs p-1 focus:border-purple-400 focus:outline-none bg-white ' + (conflict ? 'border-red-400' : 'border-gray-300')
                      },
                        React.createElement('option', { value: '' }, '— Teacher —'),

                        teachersForSub.map(function(t) {
                          return React.createElement('option', { key: getTId(t), value: getTId(t) }, t.name);
                        })
                      ),
                      (slot.subject || slot.teacherId) && React.createElement('button', {
                        onClick: function() { clearSlot(activeClass, day, period); },
                        className: 'w-full text-xs text-gray-400 hover:text-red-500 text-right leading-none'
                      }, '✕ clear')
                    )
@@ -491,7 +672,8 @@ function TimetablePage({ currentUser, mySchool }) {

    // Legend
    React.createElement('div', { className: 'flex flex-wrap gap-4 text-xs text-gray-500 p-3 bg-gray-50 rounded-xl' },
      React.createElement('span', null, React.createElement('span', { className: 'inline-block w-3 h-3 bg-purple-50 border border-purple-200 rounded mr-1' }), 'Filled'),

      React.createElement('span', null, React.createElement('span', { className: 'inline-block w-3 h-3 bg-red-50 border border-red-300 rounded mr-1' }), 'Conflict — same teacher double-booked')
    ),
