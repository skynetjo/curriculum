#!/usr/bin/env node
/**
 * One-off maintenance script: deletes every anonymous Firebase
 * Authentication user (the "(anonymous)" rows in Firebase Console →
 * Authentication → Users) — leftover sessions from when students used
 * to sign in anonymously, before student login was removed.
 *
 * Identifies a user as anonymous the same way Firebase Console does:
 * no email, no phone number, and no linked sign-in provider
 * (`providerData.length === 0`). Teacher and manager accounts sign in
 * with email/password, so they always have at least one provider and
 * are never touched by this script.
 *
 * This script NEVER deletes anything unless you pass --confirm.
 * Without --confirm it only prints a report of what it WOULD delete.
 *
 * With --confirm, it first writes a full JSON backup of every
 * anonymous user record (uid, creation time, last sign-in time) to
 * ./backups/<timestamp>/ before deleting anything. Auth user deletion
 * cannot be undone by Firebase itself, but at least you'll have a
 * record of exactly which uids were removed and when.
 *
 * ── Setup ──────────────────────────────────────────────────────────
 * 1. npm install firebase-admin   (in this scripts/ folder or the repo root)
 * 2. Get a service account key: Firebase Console → Project Settings →
 *    Service Accounts → Generate new private key. Save it somewhere
 *    OUTSIDE the git repo (e.g. ~/keys/curriculum-dbb10-key.json).
 *    Never commit this file.
 * 3. Run:
 *      GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json node scripts/delete-anonymous-auth-users.js
 *    This does a DRY RUN and prints a report. Check it carefully —
 *    in particular, confirm the "sample kept (non-anonymous) users"
 *    list at the bottom really does look like your teachers/managers.
 * 4. Once you're satisfied, re-run with --confirm to actually delete:
 *      GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json node scripts/delete-anonymous-auth-users.js --confirm
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const CONFIRM = process.argv.includes('--confirm');

function isAnonymous(user) {
  return !user.email && !user.phoneNumber && (user.providerData || []).length === 0;
}

async function listAllUsers(auth) {
  const users = [];
  let pageToken;
  do {
    const result = await auth.listUsers(1000, pageToken);
    users.push(...result.users);
    pageToken = result.pageToken;
  } while (pageToken);
  return users;
}

async function main() {
  admin.initializeApp({ credential: admin.applicationDefault() });
  const auth = admin.auth();

  console.log('Fetching all Firebase Auth users...');
  const allUsers = await listAllUsers(auth);
  console.log(`Found ${allUsers.length} total user(s).\n`);

  const anonymous = allUsers.filter(isAnonymous);
  const kept = allUsers.filter(u => !isAnonymous(u));

  console.log(`Anonymous users to delete: ${anonymous.length}`);
  console.log(`Non-anonymous users to keep: ${kept.length}\n`);

  console.log('Sample kept (non-anonymous) users — double check these look like teachers/managers:');
  kept.slice(0, 10).forEach(u => {
    console.log(`  - ${u.email || u.phoneNumber || u.uid}`);
  });
  console.log('');

  if (!CONFIRM) {
    console.log('DRY RUN — no users were deleted.');
    console.log('If the counts and sample above look right, re-run with --confirm to actually delete.');
    return;
  }

  if (anonymous.length === 0) {
    console.log('Nothing to delete. Done.');
    return;
  }

  // ── Backup the list of uids about to be deleted ─────────────────────
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'backups', `delete-anonymous-auth-users-${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });
  const backupData = anonymous.map(u => ({
    uid: u.uid,
    creationTime: u.metadata.creationTime,
    lastSignInTime: u.metadata.lastSignInTime
  }));
  fs.writeFileSync(path.join(backupDir, 'anonymous-users-before-deletion.json'), JSON.stringify(backupData, null, 2));
  console.log(`Backed up ${backupData.length} uid(s) to ${backupDir}\n`);

  console.log(`Deleting ${anonymous.length} anonymous user(s)...`);
  const BATCH_SIZE = 1000; // auth().deleteUsers() max per call
  let deleted = 0;
  for (let i = 0; i < anonymous.length; i += BATCH_SIZE) {
    const batchUids = anonymous.slice(i, i + BATCH_SIZE).map(u => u.uid);
    const result = await auth.deleteUsers(batchUids);
    deleted += result.successCount;
    if (result.failureCount > 0) {
      console.warn(`  ${result.failureCount} failure(s) in this batch:`);
      result.errors.slice(0, 5).forEach(e => console.warn(`    - ${batchUids[e.index]}: ${e.error.message}`));
    }
    console.log(`  Deleted ${Math.min(i + BATCH_SIZE, anonymous.length)} / ${anonymous.length}`);
  }

  console.log(`\nDone. Deleted ${deleted} anonymous user(s).`);
  console.log(`Backup saved at: ${backupDir}`);
}

main().catch(err => {
  console.error('FAILED:', err);
  process.exit(1);
});
