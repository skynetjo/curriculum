// Mirrors the small slice of TimetablePage's (app.js) schedule model that
// this backend needs — the doc ID convention, the default period grid, and
// the shape of a `slots` entry. Kept minimal on purpose: this does not need
// to know about self-study columns or break-row rendering — it only reads
// whatever ended up stored in `slots`.

// Placeholder "teachers" are stored as '__cbse_<Subject>' (e.g. '__cbse_English').
const CBSE_TEACHER_PREFIX = '__cbse_';
// At centres with a NEET section, Maths and Biology run at the same time.
// That slot has subject 'Maths/Biology', teacherId = Maths teacher and
// teacherId2 = Biology teacher.
const SPLIT_SUBJECT = 'Maths/Biology';
const SPLIT_PARTS = SPLIT_SUBJECT.split('/');
const TIMETABLE_DOC_SUFFIX = /_class(11|12)$/;

// Default period grid, copied from FULL_SCHEDULE in app.js (period rows only).
// A school's own periodLabels/periodTimes arrays (stored on the timetable
// doc, indexed the same way) override these when present.
const DEFAULT_PERIODS = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8'];
const DEFAULT_PERIOD_LABELS = ['Period 1', 'Period 2', 'Period 3 (CBSE)', 'Period 4', 'Period 5', 'Period 6', 'Period 7', 'Period 8'];
const DEFAULT_PERIOD_TIMES = ['6:00 – 7:00 AM', '7:30 – 9:00 AM', '9:30 – 10:30 AM', '10:30 AM – 12:00 PM', '12:00 – 1:30 PM', '3:00 – 4:30 PM', '5:00 – 8:00 PM', '9:00 – 10:30 PM'];

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function parseTimetableDocId(docId) {
  const match = docId.match(TIMETABLE_DOC_SUFFIX);
  if (!match) return null;
  return { school: docId.slice(0, match.index), grade: match[1] };
}

function isPlaceholderTeacherId(teacherId) {
  return typeof teacherId === 'string' && teacherId.startsWith(CBSE_TEACHER_PREFIX);
}

// All real teachers in a slot (two for a Maths/Biology split slot).
function slotTeacherIds(slot) {
  if (!slot) return [];
  return [slot.teacherId, slot.teacherId2].filter(id => id && !isPlaceholderTeacherId(id));
}

// The subject a teacher actually teaches in a slot (their half of a split slot).
function slotSubjectFor(slot, teacherId) {
  if (slot.subject === SPLIT_SUBJECT) return SPLIT_PARTS[teacherId === slot.teacherId2 ? 1 : 0];
  return slot.subject || '';
}

function slotsEqual(a, b) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return (a.teacherId || '') === (b.teacherId || '') &&
    (a.teacherId2 || '') === (b.teacherId2 || '') &&
    (a.subject || '') === (b.subject || '');
}

// Returns the set of teacherIds whose slot actually changed between two
// `slots` maps (added, removed, or reassigned/re-subjected).
function diffAffectedTeacherIds(beforeSlots, afterSlots) {
  const keys = new Set([...Object.keys(beforeSlots || {}), ...Object.keys(afterSlots || {})]);
  const affected = new Set();
  keys.forEach(key => {
    const before = (beforeSlots || {})[key];
    const after = (afterSlots || {})[key];
    if (slotsEqual(before, after)) return;
    slotTeacherIds(before).forEach(id => affected.add(id));
    slotTeacherIds(after).forEach(id => affected.add(id));
  });
  return affected;
}

function splitSlotKey(key) {
  const idx = key.lastIndexOf('_');
  return { day: key.slice(0, idx), period: key.slice(idx + 1) };
}

function periodLabel(periodKey, periodLabels) {
  const idx = DEFAULT_PERIODS.indexOf(periodKey);
  if (idx === -1) return periodKey;
  if (Array.isArray(periodLabels) && periodLabels[idx]) return periodLabels[idx];
  return DEFAULT_PERIOD_LABELS[idx];
}

function periodTime(periodKey, periodTimes) {
  const idx = DEFAULT_PERIODS.indexOf(periodKey);
  if (idx === -1) return '';
  if (Array.isArray(periodTimes) && periodTimes[idx]) return periodTimes[idx];
  return DEFAULT_PERIOD_TIMES[idx];
}

// Builds { day: [{ period, subject, grade }] } for one teacher from one
// grade's `slots` map, optionally restricted to a single day.
function teacherRowsFromSlots(slots, teacherId, grade, onlyDay) {
  const rows = [];
  Object.keys(slots || {}).forEach(key => {
    const slot = slots[key];
    if (!slotTeacherIds(slot).includes(teacherId)) return;
    const { day, period } = splitSlotKey(key);
    if (onlyDay && day !== onlyDay) return;
    rows.push({ day, period, subject: slotSubjectFor(slot, teacherId), grade });
  });
  return rows;
}

function groupRowsByDay(rows) {
  const byDay = {};
  rows.forEach(r => {
    if (!byDay[r.day]) byDay[r.day] = [];
    byDay[r.day].push(r);
  });
  DAY_ORDER.forEach(day => {
    if (byDay[day]) byDay[day].sort((a, b) => a.period.localeCompare(b.period));
  });
  return byDay;
}

function renderScheduleHtml(rows, periodLabels, periodTimes) {
  if (rows.length === 0) return '<p>No periods scheduled.</p>';
  const byDay = groupRowsByDay(rows);
  const days = DAY_ORDER.filter(d => byDay[d]);
  return days.map(day => {
    const items = byDay[day].map(r => {
      const label = periodLabel(r.period, periodLabels);
      const time = periodTime(r.period, periodTimes);
      const gradeTag = r.grade ? ` &mdash; Class ${r.grade}` : '';
      return `<li>${label}${time ? ` (${time})` : ''}: <strong>${escapeHtml(r.subject)}</strong>${gradeTag}</li>`;
    }).join('');
    return `<h3 style="margin:16px 0 4px;font-size:15px;">${day}</h3><ul style="margin:0 0 8px;padding-left:20px;">${items}</ul>`;
  }).join('');
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

module.exports = {
  DAY_ORDER,
  parseTimetableDocId,
  slotTeacherIds,
  diffAffectedTeacherIds,
  splitSlotKey,
  teacherRowsFromSlots,
  renderScheduleHtml,
  escapeHtml
};
