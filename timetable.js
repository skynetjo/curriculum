// ✅ TIMETABLE PAGE v1.0.0 - Avanti Fellows Curriculum Tracker
// Handles: Class 11/12 timetable, teacher assignment, conflict detection, save/export

function TimetablePage({ currentUser, mySchool }) {
  const [activeClass, setActiveClass] = useState('11');
  const [activeView, setActiveView] = useState('grid'); // 'grid' or 'teacher'
  const [teachers, setTeachers] = useState([]);
  const [timetable11, setTimetable11] = useState({});
  const [timetable12, setTimetable12] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState('');
  const [conflicts, setConflicts] = useState([]);
  const [teacherFilter, setTeacherFilter] = useState('');
  const [lastSaved, setLastSaved] = useState(null);

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const PERIODS = ['Period 1', 'Period 2', 'Period 3', 'Period 4', 'Period 5', 'Period 6', 'Period 7', 'Period 8'];

  // ─── Load data ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mySchool) return;
    const db = getFirestore();
    setIsLoading(true);
    Promise.all([
      db.collection('teachers').where('school', '==', mySchool).get(),
      db.collection('timetables').doc(mySchool + '_class11').get(),
      db.collection('timetables').doc(mySchool + '_class12').get()
    ]).then(function(results) {
      var teachersSnap = results[0];
      var tt11Doc = results[1];
      var tt12Doc = results[2];
      var tList = teachersSnap.docs
        .map(function(d) { return Object.assign({}, d.data(), { docId: d.id }); })
        .filter(function(t) { return !t.isArchived; })
        .sort(function(a, b) { return (a.name || '').localeCompare(b.name || ''); });
      setTeachers(tList);
      if (tt11Doc.exists) {
        setTimetable11(tt11Doc.data().slots || {});
        setLastSaved(tt11Doc.data().updatedAt || null);
      }
      if (tt12Doc.exists) {
        setTimetable12(tt12Doc.data().slots || {});
        if (!lastSaved && tt12Doc.data().updatedAt) setLastSaved(tt12Doc.data().updatedAt);
      }
    }).catch(function(e) {
      console.error('Timetable load error:', e);
    }).finally(function() {
      setIsLoading(false);
    });
  }, [mySchool]);

  // ─── Conflict detection ─────────────────────────────────────────────────────
  useEffect(() => {
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

  // ─── Helper functions ───────────────────────────────────────────────────────
  function getTeacherId(t) { return t.afid || t.docId; }
  function getSubjects() {
    var seen = {};
    var subs = [];
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
      var newSlot = Object.assign({}, prev[key] || {}, updates);
      return Object.assign({}, prev, { [key]: newSlot });
    });
  }
  function isConflict(day, period) {
    return conflicts.some(function(c) { return c.day === day && c.period === period; });
  }
  function canEdit() {
    var role = (currentUser && currentUser.role) || '';
    return ['super_admin', 'manager', 'admin', 'teacher', 'apc'].indexOf(role) !== -1;
  }

  // ─── Event handlers ─────────────────────────────────────────────────────────
  function handleSubjectChange(grade, day, period, subject) {
    var current = getSlot(grade, day, period);
    var updates = { subject: subject };
    if (current.teacherId) {
      var t = teachers.find(function(x) { return getTeacherId(x) === current.teacherId; });
      if (t && t.subject !== subject) {
        updates.teacherId = '';
        updates.teacherName = '';
      }
    }
    updateSlot(grade, day, period, updates);
  }
  function handleTeacherChange(grade, day, period, teacherId) {
    var t = teachers.find(function(x) { return getTeacherId(x) === teacherId; });
    var current = getSlot(grade, day, period);
    updateSlot(grade, day, period, {
      teacherId: teacherId,
      teacherName: t ? (t.name || '') : '',
      subject: t ? (t.subject || current.subject || '') : (current.subject || '')
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

  // ─── Save ───────────────────────────────────────────────────────────────────
  async function saveTimetable() {
    setIsSaving(true);
    setSaveMsg('');
    try {
      var db = getFirestore();
      var now = new Date().toISOString();
      var base = {
        school: mySchool,
        updatedAt: now,
        updatedBy: (currentUser && (currentUser.afid || currentUser.email)) || '',
        updatedByName: (currentUser && currentUser.name) || ''
      };
      await Promise.all([
        db.collection('timetables').doc(mySchool + '_class11').set(Object.assign({}, base, { grade: '11', slots: timetable11 })),
        db.collection('timetables').doc(mySchool + '_class12').set(Object.assign({}, base, { grade: '12', slots: timetable12 }))
      ]);
      setLastSaved(now);
      setSaveMsg('✅ Timetable saved successfully!');
    } catch (e) {
      setSaveMsg('❌ Error saving: ' + e.message);
    }
    setIsSaving(false);
    setTimeout(function() { setSaveMsg(''); }, 4000);
  }

  // ─── Export CSV ─────────────────────────────────────────────────────────────
  function exportCSV() {
    var tt = activeClass === '11' ? timetable11 : timetable12;
    var rows = [['Day \\ Period'].concat(PERIODS)];
    DAYS.forEach(function(day) {
      var row = [day];
      PERIODS.forEach(function(p) {
        var slot = tt[day + '_' + p] || {};
        row.push(slot.subject ? (slot.subject + (slot.teacherName ? ' (' + slot.teacherName + ')' : '')) : '');
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
    a.download = 'Timetable_Class' + activeClass + '_' + mySchool.replace(/\s+/g, '_') + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ─── Loading state ───────────────────────────────────────────────────────────
  if (isLoading) {
    return React.createElement('div', { className: 'text-center py-16 text-gray-500' },
      React.createElement('div', { className: 'text-4xl mb-3' }, '⏳'),
      React.createElement('p', null, 'Loading timetable data...')
    );
  }

  // ─── Teacher-wise view ───────────────────────────────────────────────────────
  if (activeView === 'teacher') {
    var filteredTeachers = teacherFilter
      ? teachers.filter(function(t) { return getTeacherId(t) === teacherFilter; })
      : teachers;
    var selectedTeacher = teacherFilter
      ? teachers.find(function(t) { return getTeacherId(t) === teacherFilter; })
      : null;

    // Build teacher schedule across both classes
    function getTeacherSchedule(teacherId) {
      var schedule = {};
      DAYS.forEach(function(day) {
        PERIODS.forEach(function(period) {
          var key = day + '_' + period;
          var s11 = timetable11[key] || {};
          var s12 = timetable12[key] || {};
          if (s11.teacherId === teacherId) {
            schedule[key] = { grade: '11', subject: s11.subject || '' };
          } else if (s12.teacherId === teacherId) {
            schedule[key] = { grade: '12', subject: s12.subject || '' };
          }
        });
      });
      return schedule;
    }

    return React.createElement('div', { className: 'space-y-4' },
      // View toggle
      React.createElement('div', { className: 'flex flex-wrap gap-2 items-center justify-between' },
        React.createElement('h3', { className: 'text-xl font-bold text-gray-800' }, '👩‍🏫 Teacher-Wise View'),
        React.createElement('button', {
          onClick: function() { setActiveView('grid'); },
          className: 'px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold text-sm hover:bg-purple-700'
        }, '⬅️ Back to Grid')
      ),
      // Teacher selector
      React.createElement('div', { className: 'bg-white p-4 rounded-2xl shadow' },
        React.createElement('label', { className: 'block font-bold text-sm mb-2 text-gray-700' }, '🔍 Select Teacher'),
        React.createElement('select', {
          value: teacherFilter,
          onChange: function(e) { setTeacherFilter(e.target.value); },
          className: 'w-full border-2 border-gray-200 rounded-xl p-3 text-sm focus:border-purple-400 focus:outline-none bg-white'
        },
          React.createElement('option', { value: '' }, '— Show all teachers —'),
          teachers.map(function(t) {
            return React.createElement('option', { key: getTeacherId(t), value: getTeacherId(t) },
              t.name + (t.subject ? ' (' + t.subject + ')' : '')
            );
          })
        )
      ),
      // Schedule display
      selectedTeacher
        ? (function() {
            var schedule = getTeacherSchedule(getTeacherId(selectedTeacher));
            var totalSlots = Object.keys(schedule).length;
            return React.createElement('div', { className: 'space-y-4' },
              React.createElement('div', { className: 'bg-purple-50 border border-purple-200 rounded-2xl p-4' },
                React.createElement('h4', { className: 'font-bold text-purple-800 text-lg' },
                  selectedTeacher.name + ' — ' + (selectedTeacher.subject || 'N/A')
                ),
                React.createElement('p', { className: 'text-sm text-purple-600 mt-1' },
                  '📊 Total periods assigned: ' + totalSlots + ' / ' + (DAYS.length * PERIODS.length)
                )
              ),
              React.createElement('div', { className: 'overflow-x-auto' },
                React.createElement('table', { className: 'w-full min-w-[600px] border-collapse text-sm' },
                  React.createElement('thead', null,
                    React.createElement('tr', { className: 'bg-gray-100' },
                      React.createElement('th', { className: 'border p-2 text-left font-bold text-gray-700' }, 'Day'),
                      PERIODS.map(function(p) {
                        return React.createElement('th', { key: p, className: 'border p-2 text-center font-bold text-gray-700 text-xs' }, p);
                      })
                    )
                  ),
                  React.createElement('tbody', null,
                    DAYS.map(function(day) {
                      return React.createElement('tr', { key: day, className: 'odd:bg-white even:bg-gray-50' },
                        React.createElement('td', { className: 'border p-2 font-semibold text-gray-700 text-xs whitespace-nowrap' }, day),
                        PERIODS.map(function(period) {
                          var key = day + '_' + period;
                          var slot = schedule[key];
                          return React.createElement('td', {
                            key: period,
                            className: 'border p-1 text-center ' + (slot ? 'bg-green-50' : '')
                          },
                            slot
                              ? React.createElement('div', null,
                                  React.createElement('div', { className: 'text-xs font-bold text-green-700' }, slot.subject),
                                  React.createElement('div', { className: 'text-xs text-gray-500' }, 'Cl ' + slot.grade)
                                )
                              : React.createElement('span', { className: 'text-gray-300 text-xs' }, '—')
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
              var schedule = getTeacherSchedule(getTeacherId(t));
              var count = Object.keys(schedule).length;
              return React.createElement('div', {
                key: getTeacherId(t),
                className: 'bg-white rounded-2xl shadow p-4 border-l-4 border-purple-400'
              },
                React.createElement('div', { className: 'font-bold text-gray-800' }, t.name),
                React.createElement('div', { className: 'text-sm text-gray-500 mb-2' }, t.subject || 'No subject'),
                React.createElement('div', { className: 'text-sm' },
                  React.createElement('span', {
                    className: 'px-3 py-1 rounded-full text-xs font-semibold ' + (count > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500')
                  }, count + ' period' + (count !== 1 ? 's' : '') + ' assigned')
                )
              );
            })
          )
    );
  }

  // ─── Grid view ───────────────────────────────────────────────────────────────
  var currentTT = activeClass === '11' ? timetable11 : timetable12;
  var subjects = getSubjects();
  var totalFilled = Object.keys(currentTT).filter(function(k) {
    return currentTT[k] && (currentTT[k].subject || currentTT[k].teacherName);
  }).length;
  var totalSlots = DAYS.length * PERIODS.length;

  return React.createElement('div', { className: 'space-y-4' },

    // ── Top bar ──
    React.createElement('div', { className: 'flex flex-wrap gap-3 items-start justify-between' },
      React.createElement('div', null,
        React.createElement('h3', { className: 'text-xl font-bold text-gray-800' }, '📅 Class Timetable'),
        lastSaved && React.createElement('p', { className: 'text-xs text-gray-400 mt-1' },
          'Last saved: ' + new Date(lastSaved).toLocaleString('en-IN')
        )
      ),
      React.createElement('div', { className: 'flex flex-wrap gap-2' },
        React.createElement('button', {
          onClick: function() { setActiveView('teacher'); },
          className: 'px-3 py-2 bg-purple-600 text-white rounded-xl font-semibold text-xs hover:bg-purple-700'
        }, '👩‍🏫 Teacher View'),
        React.createElement('button', {
          onClick: exportCSV,
          className: 'px-3 py-2 bg-blue-600 text-white rounded-xl font-semibold text-xs hover:bg-blue-700'
        }, '📤 Export CSV'),
        React.createElement('button', {
          onClick: saveTimetable,
          disabled: isSaving,
          className: 'px-4 py-2 rounded-xl font-semibold text-sm text-white ' + (isSaving ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700')
        }, isSaving ? '⏳ Saving...' : '💾 Save')
      )
    ),

    // ── Save message ──
    saveMsg && React.createElement('div', {
      className: 'p-3 rounded-xl text-sm font-semibold ' +
        (saveMsg.startsWith('✅') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200')
    }, saveMsg),

    // ── Conflict alerts ──
    conflicts.length > 0 && React.createElement('div', {
      className: 'bg-red-50 border-l-4 border-red-500 rounded-xl p-4'
    },
      React.createElement('h4', { className: 'font-bold text-red-700 mb-2' },
        '⚠️ ' + conflicts.length + ' Conflict' + (conflicts.length > 1 ? 's' : '') + ' Detected!'
      ),
      React.createElement('ul', { className: 'space-y-1' },
        conflicts.map(function(c, i) {
          return React.createElement('li', { key: i, className: 'text-sm text-red-600' },
            '🔴 ' + c.teacherName + ' is assigned to BOTH Class 11 & 12 on ' + c.day + ' — ' + c.period
          );
        })
      ),
      React.createElement('p', { className: 'text-xs text-red-500 mt-2' },
        'Please fix conflicts before saving. A teacher cannot teach two classes at the same time.'
      )
    ),

    // ── Class tabs + progress ──
    React.createElement('div', { className: 'flex flex-wrap gap-3 items-center' },
      React.createElement('div', { className: 'flex gap-2' },
        React.createElement('button', {
          onClick: function() { setActiveClass('11'); },
          className: 'px-5 py-2 rounded-xl font-bold text-sm transition-all ' +
            (activeClass === '11' ? 'avanti-gradient text-white shadow-md' : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-purple-300')
        }, '📗 Class 11'),
        React.createElement('button', {
          onClick: function() { setActiveClass('12'); },
          className: 'px-5 py-2 rounded-xl font-bold text-sm transition-all ' +
            (activeClass === '12' ? 'avanti-gradient text-white shadow-md' : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-purple-300')
        }, '📘 Class 12')
      ),
      React.createElement('div', { className: 'text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full' },
        totalFilled + ' / ' + totalSlots + ' periods filled'
      )
    ),

    // ── MOBILE NOTE ──
    React.createElement('p', { className: 'text-xs text-blue-600 bg-blue-50 p-2 rounded-lg md:hidden' },
      '👉 Scroll horizontally to see all periods'
    ),

    // ── Timetable grid ──
    React.createElement('div', { className: 'overflow-x-auto rounded-2xl shadow-lg' },
      React.createElement('div', { className: 'min-w-[700px]' },
        // Period header row
        React.createElement('div', {
          className: 'grid bg-gray-800 text-white text-xs font-bold',
          style: { gridTemplateColumns: '100px repeat(8, 1fr)' }
        },
          React.createElement('div', { className: 'p-2 border-r border-gray-600' }, 'Day'),
          PERIODS.map(function(p) {
            return React.createElement('div', {
              key: p,
              className: 'p-2 border-r border-gray-600 text-center'
            }, p);
          })
        ),
        // Day rows
        DAYS.map(function(day, dayIdx) {
          return React.createElement('div', {
            key: day,
            className: 'grid border-b border-gray-200 ' + (dayIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'),
            style: { gridTemplateColumns: '100px repeat(8, 1fr)' }
          },
            // Day label
            React.createElement('div', {
              className: 'p-2 border-r border-gray-200 font-bold text-xs text-gray-700 flex items-center justify-center bg-gray-100'
            },
              day.substring(0, 3).toUpperCase()
            ),
            // Period cells
            PERIODS.map(function(period) {
              var slot = getSlot(activeClass, day, period);
              var conflict = isConflict(day, period);
              var teachersForSubject = getTeachersForSubject(slot.subject);
              var cellBg = conflict
                ? 'bg-red-50 border-red-300'
                : (slot.subject || slot.teacherName) ? 'bg-purple-50 border-purple-200' : 'border-gray-200';

              return React.createElement('div', {
                key: period,
                className: 'border-r border-b p-1 ' + cellBg + ' relative',
                style: { minHeight: '90px' }
              },
                conflict && React.createElement('div', {
                  className: 'text-xs font-bold text-red-600 text-center mb-1',
                  title: 'Teacher conflict detected!'
                }, '⚠️ Conflict'),

                canEdit()
                  ? React.createElement('div', { className: 'space-y-1' },
                      // Subject dropdown
                      React.createElement('select', {
                        value: slot.subject || '',
                        onChange: function(e) { handleSubjectChange(activeClass, day, period, e.target.value); },
                        className: 'w-full border border-gray-300 rounded-lg text-xs p-1 focus:border-purple-400 focus:outline-none bg-white',
                        title: 'Select subject'
                      },
                        React.createElement('option', { value: '' }, '— Subject —'),
                        subjects.map(function(s) {
                          return React.createElement('option', { key: s, value: s }, s);
                        })
                      ),
                      // Teacher dropdown (filtered by subject)
                      React.createElement('select', {
                        value: slot.teacherId || '',
                        onChange: function(e) { handleTeacherChange(activeClass, day, period, e.target.value); },
                        className: 'w-full border border-gray-300 rounded-lg text-xs p-1 focus:border-purple-400 focus:outline-none bg-white ' +
                          (conflict ? 'border-red-400' : ''),
                        title: 'Select teacher'
                      },
                        React.createElement('option', { value: '' }, '— Teacher —'),
                        teachersForSubject.map(function(t) {
                          return React.createElement('option', { key: getTeacherId(t), value: getTeacherId(t) },
                            t.name
                          );
                        })
                      ),
                      // Clear button (shows only if slot has data)
                      (slot.subject || slot.teacherId) && React.createElement('button', {
                        onClick: function() { clearSlot(activeClass, day, period); },
                        className: 'w-full text-xs text-gray-400 hover:text-red-500 text-right pr-1',
                        title: 'Clear this slot'
                      }, '✕ Clear')
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

    // ── Legend ──
    React.createElement('div', { className: 'flex flex-wrap gap-4 text-xs text-gray-500 p-3 bg-gray-50 rounded-xl' },
      React.createElement('span', null,
        React.createElement('span', { className: 'inline-block w-3 h-3 bg-purple-50 border border-purple-200 rounded mr-1' }),
        'Filled slot'
      ),
      React.createElement('span', null,
        React.createElement('span', { className: 'inline-block w-3 h-3 bg-red-50 border border-red-300 rounded mr-1' }),
        'Conflict — same teacher in Class 11 & 12 same period'
      ),
      React.createElement('span', null, '💡 Teacher list auto-loads from your school\'s teacher database')
    ),

    // ── Teachers at this school summary ──
    teachers.length === 0
      ? React.createElement('div', { className: 'bg-yellow-50 border border-yellow-300 rounded-xl p-4 text-sm text-yellow-800' },
          '⚠️ No teachers found for "' + mySchool + '". Teachers must be added to the system first before you can assign them to the timetable.'
        )
      : React.createElement('div', { className: 'bg-white rounded-2xl shadow p-4' },
          React.createElement('h4', { className: 'font-bold text-gray-700 mb-3 text-sm' },
            '👥 Teachers at ' + mySchool + ' (' + teachers.length + ')'
          ),
          React.createElement('div', { className: 'flex flex-wrap gap-2' },
            teachers.map(function(t) {
              return React.createElement('div', {
                key: getTeacherId(t),
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
