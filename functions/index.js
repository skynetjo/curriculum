const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { defineSecret } = require('firebase-functions/params');
const { setGlobalOptions } = require('firebase-functions/v2');
const logger = require('firebase-functions/logger');
const admin = require('firebase-admin');

const { parseTimetableDocId, diffAffectedTeacherIds, teacherRowsFromSlots, renderScheduleHtml, DAY_ORDER } = require('./lib/timetable');
const { sendMail } = require('./lib/mailer');

admin.initializeApp();
const db = admin.firestore();

// Must match the region your Firestore database lives in, or the trigger
// will fail to deploy — see functions/README.md.
setGlobalOptions({ region: 'us-central1', maxInstances: 10 });

const GMAIL_USER = defineSecret('GMAIL_USER');
const GMAIL_APP_PASSWORD = defineSecret('GMAIL_APP_PASSWORD');

async function resolveTeacher(teacherId) {
  const byDoc = await db.collection('teachers').doc(teacherId).get();
  if (byDoc.exists) return { docId: byDoc.id, ...byDoc.data() };
  const byAfid = await db.collection('teachers').where('afid', '==', teacherId).limit(1).get();
  if (!byAfid.empty) return { docId: byAfid.docs[0].id, ...byAfid.docs[0].data() };
  return null;
}

// Fires on every create/update/delete of a timetables/{school}_class{11|12}
// doc and emails only the teachers whose own slot actually changed.
exports.onTimetableWrite = onDocumentWritten({
  document: 'timetables/{docId}',
  secrets: [GMAIL_USER, GMAIL_APP_PASSWORD]
}, async event => {
  const docId = event.params.docId;
  const parsed = parseTimetableDocId(docId);
  if (!parsed) {
    logger.info(`Skipping ${docId}: doesn't match {school}_class11/12`);
    return;
  }
  const beforeData = event.data.before.exists ? event.data.before.data() : null;
  const afterData = event.data.after.exists ? event.data.after.data() : null;
  if (!afterData) return; // Document deleted — nothing to notify about.

  const affectedTeacherIds = diffAffectedTeacherIds(beforeData?.slots, afterData.slots);
  if (affectedTeacherIds.size === 0) {
    logger.info(`No teacher-affecting slot changes on ${docId}`);
    return;
  }

  const user = GMAIL_USER.value();
  const pass = GMAIL_APP_PASSWORD.value();

  for (const teacherId of affectedTeacherIds) {
    const teacher = await resolveTeacher(teacherId);
    if (!teacher || !teacher.email || teacher.isArchived) continue;
    const rows = teacherRowsFromSlots(afterData.slots, teacherId, parsed.grade);
    const html = `
      <p>Hi ${teacher.name || ''},</p>
      <p>Your Class ${parsed.grade} timetable at <strong>${parsed.school}</strong> was just updated. Here is your current schedule for this class:</p>
      ${renderScheduleHtml(rows, afterData.periodLabels, afterData.periodTimes)}
      <p style="color:#888;font-size:12px;">Automated message from Curriculum Tracker.</p>
    `;
    try {
      await sendMail({ user, pass, to: teacher.email, subject: `Timetable updated: Class ${parsed.grade} at ${parsed.school}`, html });
      logger.info(`Sent update email to ${teacher.email} for ${docId}`);
    } catch (err) {
      logger.error(`Failed to email ${teacher.email} for ${docId}:`, err);
    }
  }
});

// Runs once a day and emails each teacher their schedule for that day only,
// merging Class 11 + Class 12 slots at their school. Teachers with no
// periods that day (including school-wide weekly-off days) are skipped.
exports.dailyScheduleDigest = onSchedule({
  schedule: '0 6 * * *',
  timeZone: 'Asia/Kolkata',
  secrets: [GMAIL_USER, GMAIL_APP_PASSWORD]
}, async () => {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' });
  if (!DAY_ORDER.includes(today)) {
    logger.error(`Unexpected weekday name: ${today}`);
    return;
  }

  const [timetablesSnap, teachersSnap] = await Promise.all([
    db.collection('timetables').get(),
    db.collection('teachers').get()
  ]);

  const teachersById = new Map();
  const teachersByAfid = new Map();
  teachersSnap.docs.forEach(d => {
    const data = { docId: d.id, ...d.data() };
    teachersById.set(d.id, data);
    if (data.afid) teachersByAfid.set(data.afid, data);
  });
  const resolveById = teacherId => teachersById.get(teacherId) || teachersByAfid.get(teacherId) || null;

  // school -> teacherId -> rows[]
  const bySchool = new Map();
  timetablesSnap.docs.forEach(doc => {
    const parsed = parseTimetableDocId(doc.id);
    if (!parsed) return;
    const data = doc.data();
    if (data.weeklyOffDays && data.weeklyOffDays[today]) return; // school-wide day off

    if (!bySchool.has(parsed.school)) bySchool.set(parsed.school, new Map());
    const teacherRows = bySchool.get(parsed.school);

    const teacherIdsToday = new Set();
    Object.keys(data.slots || {}).forEach(key => {
      const slot = data.slots[key];
      if (slot && slot.teacherId) teacherIdsToday.add(slot.teacherId);
    });
    teacherIdsToday.forEach(teacherId => {
      const rows = teacherRowsFromSlots(data.slots, teacherId, parsed.grade, today);
      if (rows.length === 0) return;
      const existing = teacherRows.get(teacherId) || [];
      teacherRows.set(teacherId, existing.concat(rows));
    });
  });

  const user = GMAIL_USER.value();
  const pass = GMAIL_APP_PASSWORD.value();
  let sent = 0;

  for (const [school, teacherRows] of bySchool) {
    for (const [teacherId, rows] of teacherRows) {
      const teacher = resolveById(teacherId);
      if (!teacher || !teacher.email || teacher.isArchived) continue;
      if (rows.length === 0) continue;
      const html = `
        <p>Hi ${teacher.name || ''},</p>
        <p>Here is your schedule for <strong>${today}</strong> at <strong>${school}</strong>:</p>
        ${renderScheduleHtml(rows)}
        <p style="color:#888;font-size:12px;">Automated daily digest from Curriculum Tracker.</p>
      `;
      try {
        await sendMail({ user, pass, to: teacher.email, subject: `Your schedule for ${today} — ${school}`, html });
        sent++;
      } catch (err) {
        logger.error(`Failed to email ${teacher.email}:`, err);
      }
    }
  }
  logger.info(`Daily digest: sent ${sent} email(s) for ${today}`);
});
