#!/usr/bin/env node
/**
 * One-off maintenance script: trims the `students` roster down to a
 * fixed set of schools, and promotes the survivors from Grade 11 to
 * Grade 12.
 *
 * For every student document:
 *   - If school is NOT one of KEEP_SCHOOLS  → DELETE (cascades to
 *     related records: studentAttendance, studentProfiles,
 *     studentExamRegistrations, assetAssignments, bookRequests).
 *   - If school IS one of KEEP_SCHOOLS:
 *       - If grade is Grade/Class 11 (in any of the text formats the
 *         `grade` field is stored in, e.g. "11", "Class 11", "Grade 11")
 *         → PROMOTE: update the `grade` field in place to the Grade 12
 *         equivalent (e.g. "11" → "12", "Class 11" → "Class 12").
 *       - Otherwise (already Grade 12, or some other grade) → left
 *         untouched.
 *
 * This script NEVER writes to Firestore unless you pass --confirm.
 * Without --confirm it only prints a report of what it WOULD do.
 *
 * With --confirm, it first writes a full JSON backup of every document
 * it is about to delete or modify to ./backups/<timestamp>/ before
 * touching anything, so there is a local copy to restore from if
 * needed (Firestore deletes cannot be undone, and this makes the grade
 * update reversible too).
 *
 * ── Setup ──────────────────────────────────────────────────────────
 * 1. npm install firebase-admin   (in this scripts/ folder or the repo root)
 * 2. Get a service account key: Firebase Console → Project Settings →
 *    Service Accounts → Generate new private key. Save it somewhere
 *    OUTSIDE the git repo (e.g. ~/keys/curriculum-dbb10-key.json).
 *    Never commit this file.
 * 3. Run:
 *      GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json node scripts/cleanup-students.js
 *    This does a DRY RUN and prints a report. Check it carefully.
 * 4. Once you're satisfied, re-run with --confirm to apply it:
 *      GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json node scripts/cleanup-students.js --confirm
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

const KEEP_SCHOOLS = ['CoE Barwani', 'CoE Cuttak', 'CoE Mahisagar', 'EMRS Bhopal', 'JNV Bharuch'];

const CONFIRM = process.argv.includes('--confirm');

function extractGradeNumber(gradeValue) {
  const match = (gradeValue || '').toString().match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

// Preserves whatever surrounding text the grade is stored with
// (e.g. "Class 11" -> "Class 12", "11" -> "12").
function promotedGradeValue(gradeValue) {
  return gradeValue.toString().replace(/\d+/, '12');
}

async function main() {
  admin.initializeApp({ credential: admin.applicationDefault() });
  const db = getFirestore();

  console.log('Fetching students collection...');
  const studentsSnap = await db.collection('students').get();
  console.log(`Found ${studentsSnap.size} student documents.\n`);

  const toDelete = [];
  const toPromote = []; // { doc, oldGrade, newGrade }
  const breakdown = {}; // `${school}||${grade}` -> { count, decision }

  studentsSnap.forEach(doc => {
    const data = doc.data();
    const school = (data.school || '').toString().trim();
    const gradeRaw = (data.grade || '').toString().trim();
    const keepSchool = KEEP_SCHOOLS.includes(school);
    const gradeNum = extractGradeNumber(gradeRaw);

    let decision;
    if (!keepSchool) {
      decision = 'DELETE';
      toDelete.push(doc);
    } else if (gradeNum === 11) {
      decision = 'PROMOTE';
      toPromote.push({ doc, oldGrade: gradeRaw, newGrade: promotedGradeValue(gradeRaw) });
    } else {
      decision = 'KEEP AS IS';
    }

    const schoolKey = school || '(blank school)';
    const gradeKey = gradeRaw || '(blank grade)';
    const key = `${schoolKey}||${gradeKey}`;
    if (!breakdown[key]) breakdown[key] = { school: schoolKey, grade: gradeKey, count: 0, decision };
    breakdown[key].count++;
  });

  console.log('School / Grade breakdown:');
  console.log('─'.repeat(70));
  const rows = Object.values(breakdown).sort((a, b) => a.school.localeCompare(b.school) || a.grade.localeCompare(b.grade));
  rows.forEach(r => {
    console.log(`${r.decision.padEnd(10)} ${r.school.padEnd(20)} Grade ${r.grade.padEnd(10)} ${r.count} student(s)`);
  });
  console.log('─'.repeat(70));
  console.log(`TOTAL: ${studentsSnap.size}   DELETE: ${toDelete.length}   PROMOTE (11→12): ${toPromote.length}   UNCHANGED: ${studentsSnap.size - toDelete.length - toPromote.length}\n`);

  if (!CONFIRM) {
    console.log('DRY RUN — no data was changed. Review the breakdown above.');
    console.log('If it looks right, re-run with --confirm to apply it.');
    return;
  }

  if (toDelete.length === 0 && toPromote.length === 0) {
    console.log('Nothing to do. Done.');
    return;
  }

  // ── Gather related records for every student being deleted ────────
  const studentIds = toDelete
    .map(doc => (doc.data().id || '').toString().trim())
    .filter(Boolean);

  console.log(`Gathering related records for ${studentIds.length} student ID(s) being deleted, across 5 collections...`);

  const relatedCollections = {
    studentAttendance: [],
    studentProfiles: [],
    studentExamRegistrations: [],
    assetAssignments: [],
    bookRequests: []
  };

  // studentAttendance / assetAssignments / bookRequests are queried by `studentId` field.
  // studentProfiles / studentExamRegistrations are keyed directly by student id as the doc id.
  const CHUNK = 30; // Firestore 'in' queries max 30 values
  for (let i = 0; i < studentIds.length; i += CHUNK) {
    const chunk = studentIds.slice(i, i + CHUNK);

    const [attSnap, assignSnap, bookSnap] = await Promise.all([
      db.collection('studentAttendance').where('studentId', 'in', chunk).get(),
      db.collection('assetAssignments').where('studentId', 'in', chunk).get(),
      db.collection('bookRequests').where('studentId', 'in', chunk).get()
    ]);
    relatedCollections.studentAttendance.push(...attSnap.docs);
    relatedCollections.assetAssignments.push(...assignSnap.docs);
    relatedCollections.bookRequests.push(...bookSnap.docs);

    const profileGets = await Promise.all(chunk.map(id => db.collection('studentProfiles').doc(id).get()));
    relatedCollections.studentProfiles.push(...profileGets.filter(d => d.exists));

    const examGets = await Promise.all(chunk.map(id => db.collection('studentExamRegistrations').doc(id).get()));
    relatedCollections.studentExamRegistrations.push(...examGets.filter(d => d.exists));
  }

  console.log('Related records found (for deleted students):');
  Object.entries(relatedCollections).forEach(([name, docs]) => {
    console.log(`  ${name}: ${docs.length}`);
  });
  console.log();

  // ── Backup everything before writing ───────────────────────────────
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'backups', `students-cleanup-${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });

  const backupFile = (name, docs) => {
    const data = docs.map(d => ({ documentPath: d.ref.path, data: d.data() }));
    fs.writeFileSync(path.join(backupDir, `${name}.json`), JSON.stringify(data, null, 2));
    console.log(`  Backed up ${data.length} doc(s) to ${name}.json`);
  };

  console.log(`Writing backup to ${backupDir} ...`);
  backupFile('students-deleted', toDelete);
  backupFile('students-promoted-before', toPromote.map(p => p.doc));
  Object.entries(relatedCollections).forEach(([name, docs]) => backupFile(name, docs));
  console.log();

  // ── Delete in batches of <=500 (Firestore limit) ───────────────────
  const allDocsToDelete = [
    ...toDelete,
    ...relatedCollections.studentAttendance,
    ...relatedCollections.studentProfiles,
    ...relatedCollections.studentExamRegistrations,
    ...relatedCollections.assetAssignments,
    ...relatedCollections.bookRequests
  ];

  const BATCH_SIZE = 450;

  if (allDocsToDelete.length > 0) {
    console.log(`Deleting ${allDocsToDelete.length} document(s) total...`);
    for (let i = 0; i < allDocsToDelete.length; i += BATCH_SIZE) {
      const batch = db.batch();
      allDocsToDelete.slice(i, i + BATCH_SIZE).forEach(doc => batch.delete(doc.ref));
      await batch.commit();
      console.log(`  Committed ${Math.min(i + BATCH_SIZE, allDocsToDelete.length)} / ${allDocsToDelete.length}`);
    }
  }

  // ── Promote Grade 11 → Grade 12 at the kept schools ────────────────
  if (toPromote.length > 0) {
    console.log(`\nPromoting ${toPromote.length} student(s) from Grade 11 to Grade 12...`);
    const updatedAt = new Date().toISOString();
    for (let i = 0; i < toPromote.length; i += BATCH_SIZE) {
      const batch = db.batch();
      toPromote.slice(i, i + BATCH_SIZE).forEach(({ doc, newGrade }) => {
        batch.update(doc.ref, { grade: newGrade, updatedAt });
      });
      await batch.commit();
      console.log(`  Committed ${Math.min(i + BATCH_SIZE, toPromote.length)} / ${toPromote.length}`);
    }
  }

  console.log('\nDone.');
  console.log(`  students deleted: ${toDelete.length}`);
  Object.entries(relatedCollections).forEach(([name, docs]) => console.log(`  ${name} deleted: ${docs.length}`));
  console.log(`  students promoted (Grade 11 → 12): ${toPromote.length}`);
  console.log(`\nBackup saved at: ${backupDir}`);
}

main().catch(err => {
  console.error('FAILED:', err);
  process.exit(1);
});
