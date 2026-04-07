// ✅ TIMETABLE PAGE v1.2.0 - Avanti Fellows Curriculum Tracker
// Updates: configurable periods/timings, break/assembly/lunch labels, CBSE teacher option,
// auto teacher by subject (changeable), extra subject options, add/remove period rows

// ─── Admin wrapper (shown in Admin view schoolinfo section) ──────────────────
function TimetableAdminSection({ currentUser, availableSchools, isSuperAdmin }) {
  var schools = availableSchools && availableSchools.length > 0
    ? availableSchools
    : (typeof SCHOOLS !== 'undefined' ? SCHOOLS : []);
  var [selectedSchool, setSelectedSchool] = useState(
    schools.length === 1 ? schools[0] : ''
  );

  if (!selectedSchool) {
    return React.createElement('div', { className: 'space-y-4' },
      React.createElement('div', { className: 'bg-white rounded-2xl shadow p-6' },
        React.createElement('h4', { className: 'font-bold text-gray-700 mb-3' }, '🏫 Select a School to View / Edit Timetable'),
        React.createElement('select', {
          value: selectedSchool,
          onChange: function(e) { setSelectedSchool(e.target.value); },
          className: 'w-full border-2 border-gray-200 rounded-xl p-3 text-sm focus:border-purple-400 focus:outline-none bg-white'
        },
          React.createElement('option', { value: '' }, '— Select School —'),
          schools.map(function(s) {
            return React.createElement('option', { key: s, value: s }, s);
          })
        )
      )
    );
  }

  return React.createElement('div', { className: 'space-y-3' },
    React.createElement('div', { className: 'flex items-center gap-3 flex-wrap' },
      React.createElement('label', { className: 'text-sm font-semibold text-gray-600' }, '🏫 School:'),
      React.createElement('select', {
        value: selectedSchool,
        onChange: function(e) { setSelectedSchool(e.target.value); },
        className: 'border-2 border-gray-200 rounded-xl p-2 text-sm focus:border-purple-400 focus:outline-none bg-white'
      },
        schools.map(function(s) {
          return React.createElement('option', { key: s, value: s }, s);
        })
      )
    ),
    React.createElement(TimetablePage, {
      currentUser: currentUser,
      mySchool: selectedSchool
    })
  );
}

// ─── Main Timetable Component ────────────────────────────────────────────────
function TimetablePage({ currentUser, mySchool }) {
  var [activeClass, setActiveClass] = useState('11');
  var [activeView, setActiveView] = useState('grid');
  var [teachers, setTeachers] = useState([]);
  var [timetable11, setTimetable11] = useState({});
  var [timetable12, setTimetable12] = useState({});
  var [periodConfigs, setPeriodConfigs] = useState([]);
  var [isSaving, setIsSaving] = useState(false);
  var [isLoading, setIsLoading] = useState(true);
  var [saveMsg, setSaveMsg] = useState('');
  var [conflicts, setConflicts] = useState([]);
  var [teacherFilter, setTeacherFilter] = useState('');
  var [lastSaved, setLastSaved] = useState(null);

  var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  var EXTRA_SUBJECTS = ['English', 'CS', 'Hindi', 'PT', 'Other'];

  function getDefaultPeriodConfigs() {
    return [
      { id: 'P1', label: 'Period 1', time: '08:00 - 08:45', type: 'class' },
      { id: 'P2', label: 'Period 2', time: '08:45 - 09:30', type: 'class' },
      { id: 'P3', label: 'Assembly', time: '09:30 - 09:45', type: 'assembly' },
      { id: 'P4', label: 'Period 3', time: '09:45 - 10:30', type: 'class' },
      { id: 'P5', label: 'Lunch', time: '10:30 - 11:00', type: 'lunch' },
      { id: 'P6', label: 'Period 4', time: '11:00 - 11:45', type: 'class' },
      { id: 'P7', label: 'Period 5', time: '11:45 - 12:30', type: 'class' },
      { id: 'P8', label: 'Break', time: '12:30 - 12:45', type: 'break' }
    ];
  }
  function normalizePeriodConfigs(list) {
    var fallback = getDefaultPeriodConfigs();
    if (!Array.isArray(list) || list.length === 0) return fallback;
    return list.map(function(p, idx) {
      var fallbackP = fallback[idx] || {};
      return {
        id: p.id || ('P' + (idx + 1)),
        label: p.label || fallbackP.label || ('Period ' + (idx + 1)),
        time: p.time || fallbackP.time || '',
        type: p.type || fallbackP.type || 'class'
      };
    });
  }

  function periodIds() {
    return periodConfigs.map(function(p) { return p.id; });
  }

  // ─── Load data ───────────────────────────────────────────────────────────────
  useEffect(function() {
    if (!mySchool) return;
    var db = getFirestore();
    setIsLoading(true);
    setTeachers([]);
    setTimetable11({});
    setTimetable12({});
    setPeriodConfigs(getDefaultPeriodConfigs());
    setLastSaved(null);
    Promise.all([
      db.collection('teachers').where('school', '==', mySchool).get(),
      db.collection('timetables').doc(mySchool + '_class11').get(),
      db.collection('timetables').doc(mySchool + '_class12').get()
    ]).then(function(results) {
      var tList = results[0].docs
        .map(function(d) { return Object.assign({}, d.data(), { docId: d.id }); })
        .filter(function(t) { return !t.isArchived; })
        .sort(function(a, b) { return (a.name || '').localeCompare(b.name || ''); });
      setTeachers(tList);

      var loadedPeriodConfigs = null;

      if (results[1].exists) {
        var d11 = results[1].data();
        setTimetable11(d11.slots || {});
        loadedPeriodConfigs = d11.periodConfigs || loadedPeriodConfigs;
        setLastSaved(d11.updatedAt || null);
      }
      if (results[2].exists) {
        var d12 = results[2].data();
        setTimetable12(d12.slots || {});
        loadedPeriodConfigs = loadedPeriodConfigs || d12.periodConfigs;
        if (!results[1].exists && d12.updatedAt) setLastSaved(d12.updatedAt);
      }

      setPeriodConfigs(normalizePeriodConfigs(loadedPeriodConfigs));
    }).catch(function(e) {
      console.error('Timetable load error:', e);
    }).finally(function() { setIsLoading(false); });
  }, [mySchool]);

  // ─── Conflict detection ───────────────────────────────────────────────────────
  useEffect(function() {
    var found = [];
    DAYS.forEach(function(day) {
      periodConfigs.forEach(function(periodCfg) {
        if (periodCfg.type !== 'class') return;
        var key = day + '_' + periodCfg.id;
        var s11 = timetable11[key] || {};
        var s12 = timetable12[key] || {};
        if (s11.teacherId && s12.teacherId && s11.teacherId === s12.teacherId) {
          found.push({ day: day, periodId: periodCfg.id, period: periodCfg.label || periodCfg.id, teacherName: s11.teacherName || 'Unknown' });
        }
      });
    });
    setConflicts(found);
  }, [timetable11, timetable12, periodConfigs]);

  // ─── Role check ───────────────────────────────────────────────────────────────
  function canEdit() {
    if (!currentUser) return false;
    var utype = (currentUser.userType || '').toLowerCase();
    var role  = (currentUser.role  || '').toLowerCase();
    if (utype === 'teacher' || utype === 'apc') return true;
    if (utype === 'manager' || utype === 'superadmin') return true;
    var editableRoles = ['super_admin', 'manager', 'admin', 'apc', 'pm', 'apm',
      'program_manager', 'associate_program_manager', 'program_head',
      'aph', 'director', 'assoc_director'];
    return editableRoles.indexOf(role) !== -1;
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  function getTId(t) { return t.afid || t.docId; }

  function getSubjects() {
    var seen = {};
    var subs = [];
    teachers.forEach(function(t) {
      if (t.subject && !seen[t.subject]) { seen[t.subject] = true; subs.push(t.subject); }
    });
    EXTRA_SUBJECTS.forEach(function(s) {
      if (!seen[s]) { seen[s] = true; subs.push(s); }
    });
    return subs.sort();
  }

  function getTeachersForSubject(subject) {
    if (!subject || subject === 'Other') return teachers;
    return teachers.filter(function(t) { return (t.subject || '').toLowerCase() === String(subject).toLowerCase(); });
  }

  function getSlot(grade, day, periodId) {
    var key = day + '_' + periodId;
    return grade === '11' ? (timetable11[key] || {}) : (timetable12[key] || {});
  }

  function updateSlot(grade, day, periodId, updates) {
    var key = day + '_' + periodId;
    var setter = grade === '11' ? setTimetable11 : setTimetable12;
    setter(function(prev) {
      return Object.assign({}, prev, { [key]: Object.assign({}, prev[key] || {}, updates) });
    });
  }

  function clearSlot(grade, day, periodId) {
    var key = day + '_' + periodId;
    var setter = grade === '11' ? setTimetable11 : setTimetable12;
    setter(function(prev) {
      var next = Object.assign({}, prev);
      delete next[key];
      return next;
    });
  }

  function isConflict(day, periodId) {
    return conflicts.some(function(c) { return c.day === day && c.periodId === periodId; });
  }

  function findDefaultTeacherForSubject(subject) {
    if (!subject || subject === 'Other') return null;
    var match = teachers.find(function(t) {
      return (t.subject || '').toLowerCase() === String(subject).toLowerCase();
    });
    return match || null;
  }

  function handleSubjectChange(grade, day, periodId, subject) {
    var defaultTeacher = findDefaultTeacherForSubject(subject);
    if (defaultTeacher) {
      updateSlot(grade, day, periodId, {
        subject: subject,
        teacherId: getTId(defaultTeacher),
        teacherName: defaultTeacher.name || ''
      });
      return;
    }

    var current = getSlot(grade, day, periodId);
    var updates = { subject: subject };
    if (current.teacherId && current.teacherId !== '__cbse__') {
      var t = teachers.find(function(x) { return getTId(x) === current.teacherId; });
      if (t && (t.subject || '').toLowerCase() !== String(subject).toLowerCase()) {
        updates.teacherId = '';
        updates.teacherName = '';
      }
    }
    updateSlot(grade, day, periodId, updates);
  }

  function handleTeacherChange(grade, day, periodId, teacherId) {
    var current = getSlot(grade, day, periodId);
    if (teacherId === '__cbse__') {
      updateSlot(grade, day, periodId, {
        teacherId: '__cbse__',
        teacherName: 'CBSE Teacher',
        subject: current.subject || ''
      });
      return;
    }
    var t = teachers.find(function(x) { return getTId(x) === teacherId; });
    updateSlot(grade, day, periodId, {
      teacherId: teacherId,
      teacherName: t ? (t.name || '') : '',
      subject: t ? (t.subject || current.subject || '') : (current.subject || '')
    });
  }

  function updatePeriodConfig(periodId, updates) {
    setPeriodConfigs(function(prev) {
      return prev.map(function(p) {
        return p.id === periodId ? Object.assign({}, p, updates) : p;
      });
    });
  }

  function addPeriodColumn() {
    setPeriodConfigs(function(prev) {
      var id = 'P' + (prev.length + 1);
      return prev.concat([{ id: id, label: 'Period ' + (prev.length + 1), time: '', type: 'class' }]);
    });
  }

  function removeLastPeriodColumn() {
    setPeriodConfigs(function(prev) {
      if (prev.length <= 1) return prev;
      var removed = prev[prev.length - 1];
      var next = prev.slice(0, -1);
      ['11', '12'].forEach(function(grade) {
        var setter = grade === '11' ? setTimetable11 : setTimetable12;
        setter(function(existing) {
          var cleaned = Object.assign({}, existing);
          DAYS.forEach(function(day) {
            delete cleaned[day + '_' + removed.id];
          });
          return cleaned;
        });
      });
      return next;
    });
  }

  // ─── Save ─────────────────────────────────────────────────────────────────────
  async function saveTimetable() {
    if (conflicts.length > 0) {
      setSaveMsg('❌ Fix all conflicts before saving!');
      setTimeout(function() { setSaveMsg(''); }, 4000);
      return;
    }
    setIsSaving(true); setSaveMsg('');
    try {
      var db = getFirestore();
      var now = new Date().toISOString();
      var base = {
        school: mySchool, updatedAt: now,
        periodConfigs: periodConfigs,
        updatedBy: (currentUser && (currentUser.afid || currentUser.email)) || '',
        updatedByName: (currentUser && currentUser.name) || ''
      };
      await Promise.all([
        db.collection('timetables').doc(mySchool + '_class11').set(Object.assign({}, base, { grade: '11', slots: timetable11 })),
        db.collection('timetables').doc(mySchool + '_class12').set(Object.assign({}, base, { grade: '12', slots: timetable12 }))
      ]);
      setLastSaved(now);
      setSaveMsg('✅ Saved successfully!');
    } catch(e) { setSaveMsg('❌ Error: ' + e.message); }
    setIsSaving(false);
    setTimeout(function() { setSaveMsg(''); }, 4000);
  }

  // ─── Export CSV ───────────────────────────────────────────────────────────────
  function exportCSV() {
    var tt = activeClass === '11' ? timetable11 : timetable12;
    var header = ['Day'];
    periodConfigs.forEach(function(p) {
      header.push((p.label || p.id) + (p.time ? ' (' + p.time + ')' : ''));
    });
    var rows = [header];

    DAYS.forEach(function(day) {
      var row = [day];
      periodConfigs.forEach(function(p) {
        var slot = tt[day + '_' + p.id] || {};
        if (p.type !== 'class') {
          row.push((p.label || p.id) + (p.time ? ' [' + p.time + ']' : ''));
        } else {
          row.push(slot.subject ? slot.subject + (slot.teacherName ? ' (' + slot.teacherName + ')' : '') : '');
        }
      });
      rows.push(row);
    });

    var csv = rows.map(function(r) {
      return r.map(function(c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(',');
    }).join('\n');

    var blob = new Blob([csv], { type: 'text/csv' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'Timetable_Class' + activeClass + '_' + (mySchool || '').replace(/\s+/g, '_') + '.csv';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  // ─── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return React.createElement('div', { className: 'text-center py-16 text-gray-500' },
      React.createElement('div', { className: 'text-4xl mb-3' }, '⏳'),
      React.createElement('p', null, 'Loading timetable...')
    );
  }

  // ─── Teacher-wise view ────────────────────────────────────────────────────────
  if (activeView === 'teacher') {
    function getTeacherSchedule(teacherId) {
      var schedule = {};
      DAYS.forEach(function(day) {
        periodConfigs.forEach(function(periodCfg) {
          if (periodCfg.type !== 'class') return;
          var key = day + '_' + periodCfg.id;
          var s11 = timetable11[key] || {}; var s12 = timetable12[key] || {};
          if (s11.teacherId === teacherId) schedule[key] = { grade: '11', subject: s11.subject || '', periodLabel: periodCfg.label || periodCfg.id };
          else if (s12.teacherId === teacherId) schedule[key] = { grade: '12', subject: s12.subject || '', periodLabel: periodCfg.label || periodCfg.id };
        });
      });
      return schedule;
    }
    var selT = teacherFilter ? teachers.find(function(t) { return getTId(t) === teacherFilter; }) : null;

    return React.createElement('div', { className: 'space-y-4' },
      React.createElement('div', { className: 'flex flex-wrap gap-2 items-center justify-between' },
        React.createElement('h3', { className: 'text-xl font-bold text-gray-800' }, '👩‍🏫 Teacher-Wise View'),
        React.createElement('button', {
          onClick: function() { setActiveView('grid'); },
          className: 'px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700'
        }, '⬅️ Back to Grid')
      ),
      React.createElement('div', { className: 'bg-white p-4 rounded-2xl shadow' },
        React.createElement('select', {
          value: teacherFilter,
          onChange: function(e) { setTeacherFilter(e.target.value); },
          className: 'w-full border-2 border-gray-200 rounded-xl p-3 text-sm focus:border-purple-400 focus:outline-none bg-white'
        },
          React.createElement('option', { value: '' }, '— All Teachers —'),
          teachers.map(function(t) {
            return React.createElement('option', { key: getTId(t), value: getTId(t) },
              t.name + (t.subject ? ' (' + t.subject + ')' : '')
            );
          })
        )
      ),
      selT
        ? (function() {
            var sch = getTeacherSchedule(getTId(selT));
            return React.createElement('div', { className: 'space-y-3' },
              React.createElement('div', { className: 'bg-purple-50 border border-purple-200 rounded-2xl p-4' },
                React.createElement('h4', { className: 'font-bold text-purple-800 text-lg' }, selT.name + ' — ' + (selT.subject || 'N/A')),
                React.createElement('p', { className: 'text-sm text-purple-600 mt-1' }, Object.keys(sch).length + ' periods assigned this week')
              ),
              React.createElement('div', { className: 'overflow-x-auto' },
                React.createElement('table', { className: 'w-full min-w-[600px] border-collapse text-xs' },
                  React.createElement('thead', null,
                    React.createElement('tr', { className: 'bg-gray-100' },
                      React.createElement('th', { className: 'border p-2 text-left' }, 'Day'),
                      periodConfigs.map(function(p, i) {
                        return React.createElement('th', { key: i, className: 'border p-2 text-center' }, p.label || p.id);
                      })
                    )
                  ),
                  React.createElement('tbody', null,
                    DAYS.map(function(day) {
                      return React.createElement('tr', { key: day, className: 'odd:bg-white even:bg-gray-50' },
                        React.createElement('td', { className: 'border p-2 font-semibold whitespace-nowrap' }, day),
                        periodConfigs.map(function(periodCfg, i) {
                          var slot = sch[day + '_' + periodCfg.id];
                          if (periodCfg.type !== 'class') {
                            return React.createElement('td', { key: i, className: 'border p-1 text-center text-gray-400' }, '—');
                          }
                          return React.createElement('td', { key: i, className: 'border p-1 text-center ' + (slot ? 'bg-green-50' : '') },
                            slot
                              ? React.createElement('div', null,
                                  React.createElement('div', { className: 'font-bold text-green-700' }, slot.subject),
                                  React.createElement('div', { className: 'text-gray-500' }, 'Cl ' + slot.grade)
                                )
                              : React.createElement('span', { className: 'text-gray-300' }, '—')
                          );
                        })
                      );
                    })
                  )
                )
              )
            );
          })()
        : React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
            teachers.map(function(t) {
              var sch = getTeacherSchedule(getTId(t));
              var count = Object.keys(sch).length;
              return React.createElement('div', {
                key: getTId(t),
                className: 'bg-white rounded-2xl shadow p-4 border-l-4 border-purple-400 cursor-pointer hover:shadow-md',
                onClick: function() { setTeacherFilter(getTId(t)); }
              },
                React.createElement('div', { className: 'font-bold text-gray-800' }, t.name),
                React.createElement('div', { className: 'text-sm text-gray-500 mb-2' }, t.subject || '—'),
                React.createElement('span', {
                  className: 'px-3 py-1 rounded-full text-xs font-semibold ' + (count > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')
                }, count + ' period' + (count !== 1 ? 's' : '') + ' assigned')
              );
            })
          )
    );
  }

  // ─── Grid view ────────────────────────────────────────────────────────────────
  var currentTT = activeClass === '11' ? timetable11 : timetable12;
  var totalFilled = Object.keys(currentTT).filter(function(k) {
    return currentTT[k] && (currentTT[k].subject || currentTT[k].teacherName);
  }).length;
  var subjects = getSubjects();
  var editable = canEdit();

  return React.createElement('div', { className: 'space-y-4' },

    // Top bar
    React.createElement('div', { className: 'flex flex-wrap gap-3 items-start justify-between' },
      React.createElement('div', null,
        React.createElement('h3', { className: 'text-xl font-bold text-gray-800' }, '📅 Class Timetable — ' + mySchool),
        lastSaved && React.createElement('p', { className: 'text-xs text-gray-400 mt-1' },
          'Last saved: ' + new Date(lastSaved).toLocaleString('en-IN')
        )
      ),
      React.createElement('div', { className: 'flex flex-wrap gap-2' },
        editable && React.createElement('button', {
          onClick: addPeriodColumn,
          className: 'px-3 py-2 bg-indigo-600 text-white rounded-xl font-semibold text-xs hover:bg-indigo-700'
        }, '➕ Add Row/Period'),
        editable && React.createElement('button', {
          onClick: removeLastPeriodColumn,
          className: 'px-3 py-2 bg-orange-500 text-white rounded-xl font-semibold text-xs hover:bg-orange-600'
        }, '➖ Remove Last'),
        React.createElement('button', {
          onClick: function() { setActiveView('teacher'); },
          className: 'px-3 py-2 bg-purple-600 text-white rounded-xl font-semibold text-xs hover:bg-purple-700'
        }, '👩‍🏫 Teacher View'),
        React.createElement('button', {
          onClick: exportCSV,
          className: 'px-3 py-2 bg-blue-600 text-white rounded-xl font-semibold text-xs hover:bg-blue-700'
        }, '📤 Export CSV'),
        editable && React.createElement('button', {
          onClick: saveTimetable, disabled: isSaving,
          className: 'px-4 py-2 rounded-xl font-semibold text-sm text-white ' + (isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700')
        }, isSaving ? '⏳ Saving...' : '💾 Save')
      )
    ),

    // Save message
    saveMsg && React.createElement('div', {
      className: 'p-3 rounded-xl text-sm font-semibold ' + (saveMsg.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200')
    }, saveMsg),

    // Conflicts
    conflicts.length > 0 && React.createElement('div', { className: 'bg-red-50 border-l-4 border-red-500 rounded-xl p-4' },
      React.createElement('h4', { className: 'font-bold text-red-700 mb-2' },
        '⚠️ ' + conflicts.length + ' Conflict' + (conflicts.length > 1 ? 's' : '') + ' Detected!'
      ),
      React.createElement('ul', { className: 'space-y-1' },
        conflicts.map(function(c, i) {
          return React.createElement('li', { key: i, className: 'text-sm text-red-600' },
            '🔴 ' + c.teacherName + ' — assigned to BOTH Class 11 & 12 on ' + c.day + ' ' + c.period
          );
        })
      ),
      React.createElement('p', { className: 'text-xs text-red-500 mt-2' }, 'Fix conflicts before saving.')
    ),

    // Class tabs + stats
    React.createElement('div', { className: 'flex flex-wrap gap-3 items-center' },
      React.createElement('div', { className: 'flex gap-2' },
        ['11', '12'].map(function(cls) {
          return React.createElement('button', {
            key: cls,
            onClick: function() { setActiveClass(cls); },
            className: 'px-5 py-2 rounded-xl font-bold text-sm ' + (activeClass === cls ? 'avanti-gradient text-white shadow-md' : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-purple-300')
          }, (cls === '11' ? '📗' : '📘') + ' Class ' + cls);
        })
      ),
      React.createElement('div', { className: 'text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full' },
        totalFilled + ' / ' + (DAYS.length * periodIds().length) + ' periods filled'
      ),
      !editable && React.createElement('span', { className: 'text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full border border-yellow-200' }, '👁️ View only')
    ),

    // Mobile scroll hint
    React.createElement('p', { className: 'text-xs text-blue-600 bg-blue-50 p-2 rounded-lg md:hidden' }, '👉 Scroll right to see all periods'),

    // Grid
    React.createElement('div', { className: 'overflow-x-auto rounded-2xl shadow-lg' },
      React.createElement('div', { className: 'min-w-[900px]' },
        React.createElement('div', {
          className: 'grid bg-gray-800 text-white text-xs font-bold',
          style: { gridTemplateColumns: '90px repeat(' + periodIds().length + ', minmax(145px, 1fr))' }
        },
          React.createElement('div', { className: 'p-2 border-r border-gray-600' }, 'Day'),
          periodConfigs.map(function(p) {
            return React.createElement('div', { key: p.id, className: 'p-2 border-r border-gray-600 text-center' },
              editable
                ? React.createElement('div', { className: 'space-y-1' },
                    React.createElement('input', {
                      value: p.label || '',
                      onChange: function(e) { updatePeriodConfig(p.id, { label: e.target.value }); },
                      className: 'w-full rounded bg-white/10 border border-white/20 text-[11px] p-1 text-center',
                      placeholder: 'Period label'
                    }),
                    React.createElement('input', {
                      value: p.time || '',
                      onChange: function(e) { updatePeriodConfig(p.id, { time: e.target.value }); },
                      className: 'w-full rounded bg-white/10 border border-white/20 text-[11px] p-1 text-center',
                      placeholder: 'Time'
                    }),
                    React.createElement('select', {
                      value: p.type || 'class',
                      onChange: function(e) { updatePeriodConfig(p.id, { type: e.target.value }); },
                      className: 'w-full rounded bg-white/10 border border-white/20 text-[11px] p-1 text-center'
                    },
                      React.createElement('option', { value: 'class' }, 'Class'),
                      React.createElement('option', { value: 'assembly' }, 'Assembly'),
                      React.createElement('option', { value: 'lunch' }, 'Lunch'),
                      React.createElement('option', { value: 'break' }, 'Break'),
                      React.createElement('option', { value: 'custom' }, 'Custom')
                    )
                  )
                : React.createElement('div', { className: 'leading-tight' },
                    React.createElement('div', null, p.label || p.id),
                    React.createElement('div', { className: 'text-[10px] opacity-90 mt-1' }, p.time || '—')
                  )
            );
          })
        ),
        DAYS.map(function(day, dayIdx) {
          return React.createElement('div', {
            key: day,
            className: 'grid border-b border-gray-200 ' + (dayIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'),
            style: { gridTemplateColumns: '90px repeat(' + periodIds().length + ', minmax(145px, 1fr))' }
          },
            React.createElement('div', {
              className: 'p-2 border-r border-gray-200 font-bold text-xs text-gray-700 flex items-center justify-center bg-gray-100'
            }, day.substring(0, 3).toUpperCase()),
            periodConfigs.map(function(periodCfg, pIdx) {
              var slot = getSlot(activeClass, day, periodCfg.id);
              var conflict = isConflict(day, periodCfg.id);
              var teachersForSub = getTeachersForSubject(slot.subject);
              var isClassPeriod = periodCfg.type === 'class';
              var cellBg = conflict ? 'bg-red-50' : (slot.subject || slot.teacherName) ? 'bg-purple-50' : '';

              if (!isClassPeriod) {
                return React.createElement('div', {
                  key: pIdx,
                  className: 'border-r border-b border-gray-200 p-2 bg-amber-50'
                },
                  React.createElement('div', { className: 'text-xs font-semibold text-amber-700' }, periodCfg.label || 'Special Period'),
                  React.createElement('div', { className: 'text-[11px] text-amber-600 mt-1' }, periodCfg.time || 'Edit timing in header')
                );
              }

              return React.createElement('div', {
                key: pIdx,
                className: 'border-r border-b border-gray-200 p-1 ' + cellBg,
                style: { minHeight: editable ? '95px' : '55px' }
              },
                conflict && React.createElement('div', { className: 'text-xs font-bold text-red-500 text-center leading-none mb-1' }, '⚠️'),
                editable
                  ? React.createElement('div', { className: 'space-y-1' },
                      React.createElement('select', {
                        value: slot.subject || '',
                        onChange: function(e) { handleSubjectChange(activeClass, day, periodCfg.id, e.target.value); },
                        className: 'w-full border border-gray-300 rounded-lg text-xs p-1 focus:border-purple-400 focus:outline-none bg-white'
                      },
                        React.createElement('option', { value: '' }, '— Sub —'),
                        subjects.map(function(s) { return React.createElement('option', { key: s, value: s }, s); })
                      ),
                      React.createElement('select', {
                        value: slot.teacherId || '',
                        onChange: function(e) { handleTeacherChange(activeClass, day, periodCfg.id, e.target.value); },
                        className: 'w-full border rounded-lg text-xs p-1 focus:border-purple-400 focus:outline-none bg-white ' + (conflict ? 'border-red-400' : 'border-gray-300')
                      },
                        React.createElement('option', { value: '' }, '— Teacher —'),
                        React.createElement('option', { value: '__cbse__' }, 'CBSE Teacher'),
                        teachersForSub.map(function(t) {
                          return React.createElement('option', { key: getTId(t), value: getTId(t) }, t.name);
                        })
                      ),
                      (slot.subject || slot.teacherId) && React.createElement('button', {
                        onClick: function() { clearSlot(activeClass, day, periodCfg.id); },
                        className: 'w-full text-xs text-gray-400 hover:text-red-500 text-right leading-none'
                      }, '✕ clear')
                    )
                  : React.createElement('div', { className: 'p-1' },
                      slot.subject
                        ? React.createElement('div', null,
                            React.createElement('div', { className: 'text-xs font-bold text-purple-700' }, slot.subject),
                            React.createElement('div', { className: 'text-xs text-gray-600 mt-1' }, slot.teacherName || '—')
                          )
                        : React.createElement('span', { className: 'text-gray-300 text-xs' }, '—')
                    )
              );
            })
          );
        })
      )
    ),

    // Legend
    React.createElement('div', { className: 'flex flex-wrap gap-4 text-xs text-gray-500 p-3 bg-gray-50 rounded-xl' },
      React.createElement('span', null, React.createElement('span', { className: 'inline-block w-3 h-3 bg-purple-50 border border-purple-200 rounded mr-1' }), 'Filled class'),
      React.createElement('span', null, React.createElement('span', { className: 'inline-block w-3 h-3 bg-amber-50 border border-amber-200 rounded mr-1' }), 'Break/Assembly/Lunch period'),
      React.createElement('span', null, React.createElement('span', { className: 'inline-block w-3 h-3 bg-red-50 border border-red-300 rounded mr-1' }), 'Conflict — same teacher double-booked')
    ),

    // Teachers list
    teachers.length === 0
      ? React.createElement('div', { className: 'bg-yellow-50 border border-yellow-300 rounded-xl p-4 text-sm text-yellow-800' },
          '⚠️ No teachers found for "' + mySchool + '". Teachers must be added to the system first.'
        )
      : React.createElement('div', { className: 'bg-white rounded-2xl shadow p-4' },
          React.createElement('h4', { className: 'font-bold text-gray-700 mb-3 text-sm' }, '👥 Teachers at ' + mySchool + ' (' + teachers.length + ')'),
          React.createElement('div', { className: 'flex flex-wrap gap-2' },
            teachers.map(function(t) {
              return React.createElement('div', {
                key: getTId(t),
                className: 'flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1 text-xs'
              },
                React.createElement('span', { className: 'w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs' },
                  (t.name || '?').charAt(0).toUpperCase()
                ),
                React.createElement('span', { className: 'font-medium text-gray-700' }, t.name),
                t.subject && React.createElement('span', { className: 'text-gray-400' }, '· ' + t.subject)
              );
            })
          )
        )
  );
}
