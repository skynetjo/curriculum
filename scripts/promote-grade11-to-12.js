#!/usr/bin/env node
/**
 * One-off maintenance script: promotes every Grade 11 student at a
 * fixed set of schools up to Grade 12 (annual year-end rollover).
 *
 * Updates `grade: '11' -> '12'` on the `students` collection for:
 *   CoE Barwani, CoE Cuttak, CoE Mahisagar, JNV Bharuch, EMRS Bhopal
 *
 * This is typically run right after scripts/cleanup-students.js,
 * which removes the outgoing (graduated) Grade 12 batch — this script
 * then moves the current Grade 11 batch up to fill Grade 12.
 * They are separate scripts on purpose so each can be run and
 * verified independently.
 *
 * This script NEVER writes to Firestore unless you pass --confirm.
 * Without --confirm it only prints a report of what it WOULD do.
 *
 * With --confirm, it first writes a full JSON backup of every
 * `students` document about to be changed (its state BEFORE the
 * update) to ./backups/<timestamp>/ before making any changes.
 *
 * ── Setup ──────────────────────────────────────────────────────────
 * 1. npm install firebase-admin   (in this scripts/ folder or the repo root)
 * 2. Get a service account key: Firebase Console → Project Settings →
 *    Service Accounts → Generate new private key. Save it somewhere
 *    OUTSIDE the git repo (e.g. ~/keys/curriculum-dbb10-key.json).
 *    Never commit this file.
 * 3. Run:
 *      GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json node scripts/promote-grade11-to-12.js
 *    This does a DRY RUN and prints a report. Check it carefully.
 * 4. Once you're satisfied, re-run with --confirm to actually update:
 *      GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json node scripts/promote-grade11-to-12.js --confirm
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

const PROMOTE_SCHOOLS = ['CoE Barwani', 'CoE Cuttak', 'CoE Mahisagar', 'JNV Bharuch', 'EMRS Bhopal'];
const FROM_GRADE = '11';
const TO_GRADE = '12';

const CONFIRM = process.argv.includes('--confirm');

function matches(student) {
  const school = (student.school || '').toString().trim();
  const grade = (student.grade || '').toString().trim();
  return PROMOTE_SCHOOLS.includes(school) && grade === FROM_GRADE;
}

async function main() {
  admin.initializeApp({ credential: admin.applicationDefault() });
  const db = getFirestore();

  console.log('Fetching students collection...');
  const studentsSnap = await db.collection('students').get();
  console.log(`Found ${studentsSnap.size} student documents.\n`);

  const toPromote = [];
  const bySchool = {};

  studentsSnap.forEach(doc => {
    const data = doc.data();
    if (!matches(data)) return;
    toPromote.push(doc);
    const school = (data.school || '').toString().trim();
    bySchool[school] = (bySchool[school] || 0) + 1;
  });

  console.log(`Students to promote from Grade ${FROM_GRADE} to Grade ${TO_GRADE}:`);
  console.log('─'.repeat(50));
  PROMOTE_SCHOOLS.forEach(school => {
    console.log(`  ${school.padEnd(20)} ${bySchool[school] || 0} student(s)`);
  });
  console.log('─'.repeat(50));
  console.log(`TOTAL: ${toPromote.length}\n`);

  if (!CONFIRM) {
    console.log('DRY RUN — no data was changed.');
    console.log('If it looks right, re-run with --confirm to actually update.');
    return;
  }

  if (toPromote.length === 0) {
    console.log('Nothing to promote. Done.');
    return;
  }

  // ── Backup the pre-update state before writing anything ────────────
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'backups', `promote-grade11-to-12-${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });
  const backupData = toPromote.map(d => ({ id: d.id, ...d.data() }));
  fs.writeFileSync(path.join(backupDir, 'students-before-promotion.json'), JSON.stringify(backupData, null, 2));
  console.log(`Backed up ${backupData.length} pre-update document(s) to ${backupDir}\n`);

  console.log(`Updating ${toPromote.length} document(s)...`);
  const BATCH_SIZE = 450;
  for (let i = 0; i < toPromote.length; i += BATCH_SIZE) {
    const batch = db.batch();
    toPromote.slice(i, i + BATCH_SIZE).forEach(doc => {
      batch.update(doc.ref, { grade: TO_GRADE, gradePromotedAt: new Date().toISOString() });
    });
    await batch.commit();
    console.log(`  Committed ${Math.min(i + BATCH_SIZE, toPromote.length)} / ${toPromote.length}`);
  }

  console.log(`\nDone. Promoted ${toPromote.length} student(s) from Grade ${FROM_GRADE} to Grade ${TO_GRADE}.`);
  console.log(`Backup saved at: ${backupDir}`);
}

main().catch(err => {
  console.error('FAILED:', err);
  process.exit(1);
});
