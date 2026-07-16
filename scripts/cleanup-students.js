#!/usr/bin/env node
/**
 * One-off maintenance script: trims the `students` roster down to
 * Grade 11 only, at a fixed set of schools, and cascades the deletion
 * to related student records (attendance, profiles, exam
 * registrations, asset assignments, book requests).
 *
 * KEEP a student iff:
 *   school is one of KEEP_SCHOOLS   AND   grade === '11'
 * Everything else is deleted, including Grade 12 at the kept schools.
 *
 * This script NEVER writes to Firestore unless you pass --confirm.
 * Without --confirm it only prints a report of what it WOULD do.
 *
 * With --confirm, it first writes a full JSON backup of every
 * document it is about to delete to ./backups/<timestamp>/ before
 * deleting anything, so there is a local copy to restore from if
 * needed (Firestore deletes themselves cannot be undone).
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
 * 4. Once you're satisfied, re-run with --confirm to actually delete:
 *      GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json node scripts/cleanup-students.js --confirm
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

const KEEP_SCHOOLS = ['CoE Barwani', 'CoE Cuttak', 'CoE Mahisagar', 'JNV Bharuch', 'EMRS Bhopal'];
const KEEP_GRADE = '11';

const CONFIRM = process.argv.includes('--confirm');

function shouldKeep(student) {
  const school = (student.school || '').toString().trim();
  const grade = (student.grade || '').toString().trim();
  return KEEP_SCHOOLS.includes(school) && grade === KEEP_GRADE;
}

async function main() {
  admin.initializeApp({ credential: admin.applicationDefault() });
  const db = getFirestore();

  console.log('Fetching students collection...');
  const studentsSnap = await db.collection('students').get();
  console.log(`Found ${studentsSnap.size} student documents.\n`);

  const toDelete = [];
  const toKeep = [];
  const breakdown = {}; // `${school}||${grade}` -> { count, decision }

  studentsSnap.forEach(doc => {
    const data = doc.data();
    const keep = shouldKeep(data);
    const school = (data.school || '(missing school)').toString().trim() || '(blank school)';
    const grade = (data.grade || '(missing grade)').toString().trim() || '(blank grade)';
    const key = `${school}||${grade}`;
    if (!breakdown[key]) breakdown[key] = { school, grade, count: 0, decision: keep ? 'KEEP' : 'DELETE' };
    breakdown[key].count++;
    if (keep) {
      toKeep.push(doc);
    } else {
      toDelete.push(doc);
    }
  });

  console.log('School / Grade breakdown:');
  console.log('─'.repeat(70));
  const rows = Object.values(breakdown).sort((a, b) => a.school.localeCompare(b.school) || a.grade.localeCompare(b.grade));
  rows.forEach(r => {
    console.log(`${r.decision.padEnd(7)} ${r.school.padEnd(20)} Grade ${r.grade.padEnd(6)} ${r.count} student(s)`);
  });
  console.log('─'.repeat(70));
  console.log(`TOTAL: ${studentsSnap.size}   KEEP: ${toKeep.length}   DELETE: ${toDelete.length}\n`);

  if (!CONFIRM) {
    console.log('DRY RUN — no data was changed. Review the breakdown above.');
    console.log('If it looks right, re-run with --confirm to actually delete.');
    return;
  }

  if (toDelete.length === 0) {
    console.log('Nothing to delete. Done.');
    return;
  }

  // ── Gather related records for every student being deleted ────────
  const studentIds = toDelete
    .map(doc => (doc.data().id || '').toString().trim())
    .filter(Boolean);

  console.log(`Gathering related records for ${studentIds.length} student ID(s) across 5 collections...`);

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

  console.log('Related records found:');
  Object.entries(relatedCollections).forEach(([name, docs]) => {
    console.log(`  ${name}: ${docs.length}`);
  });
  console.log();

  // ── Backup everything before deleting ──────────────────────────────
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'backups', `students-cleanup-${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });

  const backupFile = (name, docs) => {
    const data = docs.map(d => ({ id: d.id, ...d.data() }));
    fs.writeFileSync(path.join(backupDir, `${name}.json`), JSON.stringify(data, null, 2));
    console.log(`  Backed up ${data.length} doc(s) to ${name}.json`);
  };

  console.log(`Writing backup to ${backupDir} ...`);
  backupFile('students', toDelete);
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

  console.log(`Deleting ${allDocsToDelete.length} document(s) total...`);
  const BATCH_SIZE = 450;
  for (let i = 0; i < allDocsToDelete.length; i += BATCH_SIZE) {
    const batch = db.batch();
    allDocsToDelete.slice(i, i + BATCH_SIZE).forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    console.log(`  Committed ${Math.min(i + BATCH_SIZE, allDocsToDelete.length)} / ${allDocsToDelete.length}`);
  }

  console.log('\nDone. Deleted:');
  console.log(`  students: ${toDelete.length}`);
  Object.entries(relatedCollections).forEach(([name, docs]) => console.log(`  ${name}: ${docs.length}`));
  console.log(`\nBackup saved at: ${backupDir}`);
}

main().catch(err => {
  console.error('FAILED:', err);
  process.exit(1);
});
