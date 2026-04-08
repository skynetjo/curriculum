// ============================================================
// 📅 TIMETABLE PAGE - Avanti Fellows Curriculum Tracker
// Version: 5.6.8 | Add <script src="timetable.js"></script>
// in index.html BEFORE app.js closing </body>
// ============================================================

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const GRADES = ['Class 11', 'Class 12'];
const TIME_SLOTS = [
  '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
  '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM'
];

// ─── Notification helper ───────────────────────────────────────────────
async function scheduleTimetableNotification(slot, teacherName, subject, grade) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') await Notification.requestPermission();
  if (Notification.permission !== 'granted') return;
  // Calculate ms until next occurrence of this day+time
  const dayMap = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
  const now = new Date();
  const targetDay = dayMap[slot.day];
  const [timePart, ampm] = slot.startTime.split(' ');
  let [h, m] = timePart.split(':').map(Number);
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  const next = new Date();
  next.setHours(h, m, 0, 0);
  let diff = targetDay - now.getDay();
  if (diff < 0 || (diff === 0 && next <= now)) diff += 7;
  next.setDate(next.getDate() + diff);
  const delay = next.getTime() - Date.now() - 5 * 60 * 1000; // 5 min before
  if (delay > 0) {
    setTimeout(() => {
      new Notification('📚 Class Reminder - Avanti', {
        body: `${grade} | ${subject} with ${teacherName} starting at ${slot.startTime}`,
        icon: '/icon-192.png'
      });
    }, delay);
  }
}

// ─── TimetablePage Component ───────────────────────────────────────────
function TimetablePage({ currentUser, teachers = [] }) {
  const { useState, useEffect, useMemo, useCallback, useRef } = React;

  // ── State
  const [selectedSchool, setSelectedSchool] = useState(currentUser?.school || (typeof SCHOOLS !== 'undefined' ? SCHOOLS[0] : ''));
  const [selectedGrade, setSelectedGrade] = useState('Class 11');
  const [timetable, setTimetable] = useState({}); // {day: {slot_idx: {subject, teacherId, startTime, endTime, notes, isOff}}}
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [conflicts, setConflicts] = useState([]); // [{day, slot, teacher, slots:[]}]
  const [viewMode, setViewMode] = useState('grid'); // grid | teacher
  const [selectedTeacher, setSelectedTeacher] = useState('All');
  const [weeklyOffDays, setWeeklyOffDays] = useState({ Sunday: true });
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const db = typeof firebase !== 'undefined' ? firebase.firestore() : null;

  // ── Derived
  const schoolTeachers = useMemo(() =>
    teachers.filter(t => !t.isArchived && t.school === selectedSchool),
    [teachers, selectedSchool]
  );

  const subjectTeacherMap = useMemo(() => {
    const map = {};
    schoolTeachers.forEach(t => {
      if (!map[t.subject]) map[t.subject] = [];
      map[t.subject].push(t);
    });
    return map;
  }, [schoolTeachers]);

  const docId = `${selectedSchool}_${selectedGrade}`.replace(/\s+/g, '_');

  // ── Load from Firestore
  useEffect(() => {
    if (!db) { setLoading(false); return; }
    setLoading(true);
    db.collection('timetables').doc(docId).get()
      .then(snap => {
        if (snap.exists) {
          const data = snap.data();
          setTimetable(data.slots || {});
          setWeeklyOffDays(data.weeklyOffDays || { Sunday: true });
        } else {
          setTimetable({});
        }
      })
      .catch(e => console.error('[Timetable] Load error:', e))
      .finally(() => setLoading(false));
  }, [docId]);

  // ── Conflict Detection
  useEffect(() => {
    const found = [];
    // For each teacher, check if they appear in multiple slots at the same day+time
    const teacherSlots = {}; // teacherId -> [{day, slotKey, time}]
    DAYS.forEach(day => {
      Object.entries(timetable[day] || {}).forEach(([slotKey, slot]) => {
        if (!slot.teacherId || slot.isOff) return;
        if (!teacherSlots[slot.teacherId]) teacherSlots[slot.teacherId] = [];
        teacherSlots[slot.teacherId].push({ day, slotKey, startTime: slot.startTime, subject: slot.subject });
      });
    });
    Object.entries(teacherSlots).forEach(([tid, slots]) => {
      // Check same day + overlapping time
      const byDay = {};
      slots.forEach(s => {
        if (!byDay[s.day]) byDay[s.day] = [];
        byDay[s.day].push(s);
      });
      Object.entries(byDay).forEach(([day, daySlots]) => {
        if (daySlots.length > 1) {
          const teacher = schoolTeachers.find(t => t.afid === tid || t.docId === tid);
          found.push({ teacherName: teacher?.name || tid, day, slots: daySlots });
        }
      });
    });
    setConflicts(found);
  }, [timetable, schoolTeachers]);

  // ── Update a slot
  const updateSlot = useCallback((day, slotKey, field, value) => {
    setTimetable(prev => {
      const updated = { ...prev };
      if (!updated[day]) updated[day] = {};
      if (!updated[day][slotKey]) updated[day][slotKey] = {};
      updated[day][slotKey] = { ...updated[day][slotKey], [field]: value };
      // Auto-fill subject when teacher selected
      if (field === 'teacherId' && value) {
        const teacher = schoolTeachers.find(t => t.afid === value || t.docId === value);
        if (teacher) updated[day][slotKey].subject = teacher.subject;
      }
      return updated;
    });
  }, [schoolTeachers]);

  const toggleSlotOff = useCallback((day, slotKey) => {
    setTimetable(prev => {
      const updated = { ...prev };
      if (!updated[day]) updated[day] = {};
      if (!updated[day][slotKey]) updated[day][slotKey] = {};
      updated[day][slotKey] = { ...updated[day][slotKey], isOff: !updated[day][slotKey]?.isOff };
      return updated;
    });
  }, []);

  // ── Save
  const handleSave = async () => {
    if (!db) return alert('Database not connected');
    setSaving(true);
    try {
      await db.collection('timetables').doc(docId).set({
        school: selectedSchool,
        grade: selectedGrade,
        slots: timetable,
        weeklyOffDays,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedBy: currentUser?.name || 'Admin'
      }, { merge: true });
      setSaveMsg('✅ Saved!');
      setTimeout(() => setSaveMsg(''), 3000);
      // Schedule notifications if enabled
      if (notifEnabled) {
        DAYS.forEach(day => {
          Object.entries(timetable[day] || {}).forEach(([, slot]) => {
            if (slot.teacherId && slot.startTime && !slot.isOff) {
              const teacher = schoolTeachers.find(t => t.afid === slot.teacherId || t.docId === slot.teacherId);
              if (teacher) scheduleTimetableNotification({ day, startTime: slot.startTime }, teacher.name, slot.subject, selectedGrade);
            }
          });
        });
      }
    } catch (e) {
      alert('❌ Save failed: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Export CSV
  const handleExport = () => {
    const rows = [['Day', 'Start Time', 'Subject', 'Teacher', 'Notes', 'Grade', 'School']];
    DAYS.forEach(day => {
      Object.entries(timetable[day] || {}).forEach(([slotKey, slot]) => {
        if (!slot.subject && !slot.teacherId) return;
        const teacher = schoolTeachers.find(t => t.afid === slot.teacherId || t.docId === slot.teacherId);
        rows.push([day, slot.startTime || slotKey, slot.subject || '', teacher?.name || '', slot.notes || '', selectedGrade, selectedSchool]);
      });
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `timetable_${selectedSchool}_${selectedGrade}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  // ── Roles allowed to edit
  const canEdit = ['super_admin', 'director', 'assoc_director', 'pm', 'apm', 'apc'].includes(currentUser?.role);
  const canView = true; // all roles can view

  // ── Teacher-wise view data
  const teacherViewData = useMemo(() => {
    if (selectedTeacher === 'All') return null;
    const slots = [];
    DAYS.forEach(day => {
      Object.entries(timetable[day] || {}).forEach(([slotKey, slot]) => {
        if ((slot.teacherId === selectedTeacher) && !slot.isOff) {
          slots.push({ day, startTime: slot.startTime || slotKey, subject: slot.subject, notes: slot.notes });
        }
      });
    });
    return slots;
  }, [timetable, selectedTeacher]);

  const schools = typeof SCHOOLS !== 'undefined' ? SCHOOLS : [];
  const subjects = typeof SUBJECTS !== 'undefined' ? SUBJECTS : ['Physics', 'Chemistry', 'Maths', 'Biology'];

  if (loading) {
    return React.createElement('div', { className: 'flex items-center justify-center h-64' },
      React.createElement('div', { className: 'text-center' },
        React.createElement('div', { className: 'animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent mx-auto' }),
        React.createElement('p', { className: 'mt-4 text-gray-600' }, 'Loading timetable...')
      )
    );
  }

  return React.createElement('div', { className: 'space-y-4 pb-10' },

    // ── Header
    React.createElement('div', { className: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 rounded-2xl' },
      React.createElement('div', { className: 'flex flex-wrap gap-2 items-center justify-between' },
        React.createElement('div', null,
          React.createElement('h2', { className: 'text-2xl font-bold' }, '📅 Class Timetable'),
          React.createElement('p', { className: 'text-sm opacity-90' }, selectedSchool + ' · ' + selectedGrade)
        ),
        React.createElement('div', { className: 'flex gap-2 flex-wrap' },
          saveMsg && React.createElement('span', { className: 'px-3 py-2 bg-white text-green-700 rounded-xl font-bold text-sm' }, saveMsg),
          canEdit && React.createElement('button', {
            onClick: handleSave,
            disabled: saving,
            className: 'px-4 py-2 bg-white text-orange-600 rounded-xl font-bold text-sm hover:bg-orange-50'
          }, saving ? '⏳ Saving...' : '💾 Save'),
          React.createElement('button', {
            onClick: handleExport,
            className: 'px-4 py-2 bg-white/20 text-white rounded-xl font-bold text-sm hover:bg-white/30'
          }, '📥 Export CSV')
        )
      )
    ),

    // ── Conflicts Banner
    conflicts.length > 0 && React.createElement('div', { className: 'bg-red-50 border-2 border-red-300 p-4 rounded-xl' },
      React.createElement('div', { className: 'font-bold text-red-700 mb-2' }, '⚠️ Conflicts Detected (' + conflicts.length + ')'),
      conflicts.map((c, i) => React.createElement('div', { key: i, className: 'text-sm text-red-600' },
        `${c.teacherName} has ${c.slots.length} classes on ${c.day}: ` + c.slots.map(s => s.subject + ' @ ' + s.startTime).join(' vs ')
      ))
    ),

    // ── Filters Row
    React.createElement('div', { className: 'bg-white p-4 rounded-2xl shadow flex flex-wrap gap-3 items-end' },
      // School
      React.createElement('div', { className: 'flex-1 min-w-[140px]' },
        React.createElement('label', { className: 'block text-xs font-bold text-gray-500 mb-1' }, 'School'),
        React.createElement('select', {
          value: selectedSchool,
          onChange: e => setSelectedSchool(e.target.value),
          className: 'w-full border-2 px-3 py-2 rounded-xl text-sm'
        }, schools.map(s => React.createElement('option', { key: s, value: s }, s)))
      ),
      // Grade
      React.createElement('div', { className: 'flex-1 min-w-[120px]' },
        React.createElement('label', { className: 'block text-xs font-bold text-gray-500 mb-1' }, 'Grade'),
        React.createElement('select', {
          value: selectedGrade,
          onChange: e => setSelectedGrade(e.target.value),
          className: 'w-full border-2 px-3 py-2 rounded-xl text-sm'
        }, GRADES.map(g => React.createElement('option', { key: g, value: g }, g)))
      ),
      // View Mode
      React.createElement('div', { className: 'flex-1 min-w-[120px]' },
        React.createElement('label', { className: 'block text-xs font-bold text-gray-500 mb-1' }, 'View'),
        React.createElement('select', {
          value: viewMode,
          onChange: e => setViewMode(e.target.value),
          className: 'w-full border-2 px-3 py-2 rounded-xl text-sm'
        },
          React.createElement('option', { value: 'grid' }, '📋 Grid View'),
          React.createElement('option', { value: 'teacher' }, '👤 Teacher View')
        )
      ),
      // Teacher filter (for teacher view)
      viewMode === 'teacher' && React.createElement('div', { className: 'flex-1 min-w-[160px]' },
        React.createElement('label', { className: 'block text-xs font-bold text-gray-500 mb-1' }, 'Teacher'),
        React.createElement('select', {
          value: selectedTeacher,
          onChange: e => setSelectedTeacher(e.target.value),
          className: 'w-full border-2 px-3 py-2 rounded-xl text-sm'
        },
          React.createElement('option', { value: 'All' }, '-- Select Teacher --'),
          schoolTeachers.map(t => React.createElement('option', { key: t.afid || t.docId, value: t.afid || t.docId }, t.name + ' (' + t.subject + ')'))
        )
      ),
      // Notification toggle
      React.createElement('div', { className: 'flex items-center gap-2 pt-4' },
        React.createElement('input', {
          type: 'checkbox', id: 'notif', checked: notifEnabled,
          onChange: e => setNotifEnabled(e.target.checked),
          className: 'w-4 h-4 accent-yellow-500'
        }),
        React.createElement('label', { htmlFor: 'notif', className: 'text-sm text-gray-600' }, '🔔 Notify')
      )
    ),

    // ── Weekly Off Days Config
    React.createElement('div', { className: 'bg-white p-4 rounded-2xl shadow' },
      React.createElement('div', { className: 'flex flex-wrap gap-3 items-center' },
        React.createElement('span', { className: 'text-sm font-bold text-gray-600' }, '📆 Weekly Off:'),
        ['Sunday', ...DAYS].map(day =>
          React.createElement('label', { key: day, className: 'flex items-center gap-1 text-sm cursor-pointer' },
            React.createElement('input', {
              type: 'checkbox',
              checked: !!weeklyOffDays[day],
              onChange: e => setWeeklyOffDays(p => ({ ...p, [day]: e.target.checked })),
              className: 'w-4 h-4 accent-yellow-500'
            }),
            day === 'Sunday' ? '☀️ Sunday' : day.slice(0, 3)
          )
        )
      )
    ),

    // ── Grid View
    viewMode === 'grid' && React.createElement('div', { className: 'space-y-4' },
      DAYS.filter(d => !weeklyOffDays[d]).map(day =>
        React.createElement(DayTable, {
          key: day,
          day,
          timetable: timetable[day] || {},
          schoolTeachers,
          subjects,
          canEdit,
          updateSlot: (slotKey, field, value) => updateSlot(day, slotKey, field, value),
          toggleSlotOff: (slotKey) => toggleSlotOff(day, slotKey)
        })
      )
    ),

    // ── Teacher View
    viewMode === 'teacher' && React.createElement('div', { className: 'bg-white rounded-2xl shadow p-4' },
      selectedTeacher === 'All'
        ? React.createElement('div', { className: 'text-center py-12 text-gray-400' }, '👆 Select a teacher above to view their schedule')
        : React.createElement('div', null,
            React.createElement('h3', { className: 'font-bold text-lg mb-4' },
              '📅 Schedule for ' + (schoolTeachers.find(t => (t.afid || t.docId) === selectedTeacher)?.name || selectedTeacher)
            ),
            teacherViewData && teacherViewData.length === 0
              ? React.createElement('div', { className: 'text-center py-8 text-gray-400' }, '📭 No classes assigned yet')
              : React.createElement('div', { className: 'space-y-2' },
                  (teacherViewData || []).map((s, i) =>
                    React.createElement('div', { key: i, className: 'flex items-center gap-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl' },
                      React.createElement('div', { className: 'w-24 font-bold text-yellow-700 text-sm' }, s.day),
                      React.createElement('div', { className: 'w-24 text-sm text-gray-600' }, s.startTime),
                      React.createElement('div', { className: 'flex-1 font-semibold' }, s.subject),
                      s.notes && React.createElement('div', { className: 'text-xs text-gray-400 italic' }, s.notes)
                    )
                  )
                )
          )
    )
  );
}

// ─── DayTable Sub-component ────────────────────────────────────────────
function DayTable({ day, timetable, schoolTeachers, subjects, canEdit, updateSlot, toggleSlotOff }) {
  const [expanded, setExpanded] = React.useState(true);

  const filledSlots = Object.entries(timetable).filter(([, s]) => s.subject || s.teacherId || s.isOff);
  const conflictTeachers = new Set();

  return React.createElement('div', { className: 'bg-white rounded-2xl shadow overflow-hidden' },
    // Day header
    React.createElement('div', {
      className: 'flex justify-between items-center p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-b cursor-pointer',
      onClick: () => setExpanded(e => !e)
    },
      React.createElement('div', { className: 'flex items-center gap-3' },
        React.createElement('span', { className: 'text-xl' }, getDayEmoji(day)),
        React.createElement('span', { className: 'font-bold text-lg' }, day),
        filledSlots.length > 0 && React.createElement('span', { className: 'px-2 py-0.5 bg-yellow-200 text-yellow-800 rounded-full text-xs font-bold' }, filledSlots.length + ' slots')
      ),
      React.createElement('span', { className: 'text-gray-400' }, expanded ? '▲' : '▼')
    ),

    expanded && React.createElement('div', { className: 'overflow-x-auto' },
      // Mobile: card layout; Desktop: table
      React.createElement('div', { className: 'hidden md:block' },
        React.createElement('table', { className: 'w-full text-sm' },
          React.createElement('thead', null,
            React.createElement('tr', { className: 'bg-gray-50 text-gray-500 text-xs uppercase' },
              React.createElement('th', { className: 'p-3 text-left w-32' }, 'Start Time'),
              React.createElement('th', { className: 'p-3 text-left w-32' }, 'End Time'),
              React.createElement('th', { className: 'p-3 text-left' }, 'Subject'),
              React.createElement('th', { className: 'p-3 text-left' }, 'Teacher'),
              React.createElement('th', { className: 'p-3 text-left' }, 'Notes'),
              React.createElement('th', { className: 'p-3 text-left w-20' }, 'Off?'),
              canEdit && React.createElement('th', { className: 'p-3 w-10' }, '')
            )
          ),
          React.createElement('tbody', null,
            TIME_SLOTS.map((slot, idx) => {
              const slotKey = 'slot_' + idx;
              const data = timetable[slotKey] || {};
              const isOff = !!data.isOff;
              return React.createElement('tr', {
                key: slotKey,
                className: `border-b transition ${isOff ? 'bg-gray-100 opacity-60' : 'hover:bg-yellow-50'}`
              },
                React.createElement('td', { className: 'p-2' },
                  canEdit && !isOff
                    ? React.createElement('select', {
                        value: data.startTime || slot,
                        onChange: e => updateSlot(slotKey, 'startTime', e.target.value),
                        className: 'border rounded-lg px-2 py-1 text-sm w-28'
                      }, TIME_SLOTS.map(t => React.createElement('option', { key: t, value: t }, t)))
                    : React.createElement('span', { className: 'text-gray-600' }, data.startTime || slot)
                ),
                React.createElement('td', { className: 'p-2' },
                  canEdit && !isOff
                    ? React.createElement('select', {
                        value: data.endTime || TIME_SLOTS[Math.min(idx + 1, TIME_SLOTS.length - 1)],
                        onChange: e => updateSlot(slotKey, 'endTime', e.target.value),
                        className: 'border rounded-lg px-2 py-1 text-sm w-28'
                      }, TIME_SLOTS.map(t => React.createElement('option', { key: t, value: t }, t)))
                    : React.createElement('span', { className: 'text-gray-600' }, data.endTime || TIME_SLOTS[Math.min(idx + 1, TIME_SLOTS.length - 1)])
                ),
                React.createElement('td', { className: 'p-2' },
                  canEdit && !isOff
                    ? React.createElement('select', {
                        value: data.subject || '',
                        onChange: e => updateSlot(slotKey, 'subject', e.target.value),
                        className: 'border rounded-lg px-2 py-1 text-sm w-32'
                      },
                        React.createElement('option', { value: '' }, '-- Subject --'),
                        subjects.map(s => React.createElement('option', { key: s, value: s }, s))
                      )
                    : React.createElement('span', { className: 'font-semibold' }, data.subject || '—')
                ),
                React.createElement('td', { className: 'p-2' },
                  canEdit && !isOff
                    ? React.createElement('select', {
                        value: data.teacherId || '',
                        onChange: e => updateSlot(slotKey, 'teacherId', e.target.value),
                        className: 'border rounded-lg px-2 py-1 text-sm w-40'
                      },
                        React.createElement('option', { value: '' }, '-- Teacher --'),
                        schoolTeachers
                          .filter(t => !data.subject || t.subject === data.subject)
                          .map(t => React.createElement('option', { key: t.afid || t.docId, value: t.afid || t.docId }, t.name))
                      )
                    : React.createElement('span', null, schoolTeachers.find(t => (t.afid || t.docId) === data.teacherId)?.name || '—')
                ),
                React.createElement('td', { className: 'p-2' },
                  canEdit && !isOff
                    ? React.createElement('input', {
                        type: 'text',
                        value: data.notes || '',
                        onChange: e => updateSlot(slotKey, 'notes', e.target.value),
                        placeholder: 'Optional notes',
                        className: 'border rounded-lg px-2 py-1 text-sm w-full min-w-[100px]'
                      })
                    : React.createElement('span', { className: 'text-gray-400 text-xs' }, data.notes || '')
                ),
                React.createElement('td', { className: 'p-2 text-center' },
                  canEdit
                    ? React.createElement('button', {
                        onClick: () => toggleSlotOff(slotKey),
                        className: `px-2 py-1 rounded-lg text-xs font-bold ${isOff ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`
                      }, isOff ? '✅ On' : '🚫 Off')
                    : (isOff ? React.createElement('span', { className: 'text-xs text-gray-400' }, 'Off') : null)
                ),
                canEdit && React.createElement('td', { className: 'p-2' },
                  (data.subject || data.teacherId) && React.createElement('button', {
                    onClick: () => {
                      updateSlot(slotKey, 'subject', '');
                      updateSlot(slotKey, 'teacherId', '');
                      updateSlot(slotKey, 'notes', '');
                    },
                    className: 'text-red-400 hover:text-red-600 text-xs',
                    title: 'Clear slot'
                  }, '✕')
                )
              );
            })
          )
        )
      ),

      // ── Mobile card layout
      React.createElement('div', { className: 'md:hidden space-y-3 p-3' },
        TIME_SLOTS.map((slot, idx) => {
          const slotKey = 'slot_' + idx;
          const data = timetable[slotKey] || {};
          const isOff = !!data.isOff;
          const teacherName = schoolTeachers.find(t => (t.afid || t.docId) === data.teacherId)?.name;
          if (!data.subject && !data.teacherId && !isOff && !canEdit) return null;
          return React.createElement('div', {
            key: slotKey,
            className: `rounded-xl border-2 p-3 ${isOff ? 'bg-gray-100 border-gray-200 opacity-60' : 'bg-white border-yellow-200'}`
          },
            React.createElement('div', { className: 'flex justify-between items-center mb-2' },
              React.createElement('span', { className: 'text-xs font-bold text-yellow-700' }, slot),
              canEdit && React.createElement('button', {
                onClick: () => toggleSlotOff(slotKey),
                className: `px-2 py-0.5 rounded-lg text-xs font-bold ${isOff ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`
              }, isOff ? '✅ On' : '🚫 Off')
            ),
            !isOff && React.createElement('div', { className: 'space-y-2' },
              React.createElement('select', {
                value: data.subject || '',
                onChange: e => updateSlot(slotKey, 'subject', e.target.value),
                disabled: !canEdit,
                className: 'w-full border rounded-lg px-2 py-2 text-sm'
              },
                React.createElement('option', { value: '' }, '-- Subject --'),
                subjects.map(s => React.createElement('option', { key: s, value: s }, s))
              ),
              React.createElement('select', {
                value: data.teacherId || '',
                onChange: e => updateSlot(slotKey, 'teacherId', e.target.value),
                disabled: !canEdit,
                className: 'w-full border rounded-lg px-2 py-2 text-sm'
              },
                React.createElement('option', { value: '' }, '-- Teacher --'),
                schoolTeachers
                  .filter(t => !data.subject || t.subject === data.subject)
                  .map(t => React.createElement('option', { key: t.afid || t.docId, value: t.afid || t.docId }, t.name + ' · ' + t.subject))
              ),
              canEdit && React.createElement('input', {
                type: 'text',
                value: data.notes || '',
                onChange: e => updateSlot(slotKey, 'notes', e.target.value),
                placeholder: '📝 Notes (optional)',
                className: 'w-full border rounded-lg px-2 py-2 text-sm'
              })
            )
          );
        })
      )
    )
  );
}

function getDayEmoji(day) {
  const map = { Monday: '🔵', Tuesday: '🟢', Wednesday: '🟡', Thursday: '🟠', Friday: '🔴', Saturday: '🟣' };
  return map[day] || '📅';
}

// Export to global scope so app.js can access it
window.TimetablePage = TimetablePage;

// ============================================================
// 👇 HOW TO PLUG THIS INTO app.js:
// ============================================================
// 1. Add <script src="timetable.js"></script> in index.html
//    just before app.js script tag.
//
// 2. In your App component's nav array, add:
//    { id: 'timetable', label: '📅 Timetable', icon: '📅' }
//
// 3. In your page render switch/conditional, add:
//    currentPage === 'timetable' &&
//      React.createElement(TimetablePage, { currentUser, teachers })
//
// 4. Firestore collection used: "timetables"
//    Doc ID format: "CoE_Barwani_Class_11"
// ============================================================
