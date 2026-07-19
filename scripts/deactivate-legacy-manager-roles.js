#!/usr/bin/env node
/**
 * One-off maintenance script: deactivates every active manager whose
 * role is one of the roles removed from the org hierarchy —
 * Director, Associate Director, Program Head, and Training Department —
 * as part of collapsing the hierarchy down to just Senior Program
 * Manager / Program Manager / Associate Program Manager.
 *
 * This does NOT delete anyone. It sets `status: 'inactive'` (the same
 * soft-delete the app's "Deactivate" button uses) so historical data
 * stays intact, but the person loses access and drops out of the
 * active hierarchy. Reactivating someone afterwards (via the app's
 * "Reactivate" button, or by hand) fully undoes this.
 *
 * This script NEVER writes to Firestore unless you pass --confirm.
 * Without --confirm it only prints a report of what it WOULD do.
 *
 * With --confirm, it first writes a full JSON backup of every
 * `managers` document about to be changed (its state BEFORE the
 * update) to ./backups/<timestamp>/ before making any changes.
 *
 * ── Setup ──────────────────────────────────────────────────────────
 * 1. npm install firebase-admin   (in this scripts/ folder or the repo root)
 * 2. Get a service account key: Firebase Console → Project Settings →
 *    Service Accounts → Generate new private key. Save it somewhere
 *    OUTSIDE the git repo (e.g. ~/keys/curriculum-dbb10-key.json).
 *    Never commit this file.
 * 3. Run:
 *      GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json node scripts/deactivate-legacy-manager-roles.js
 *    This does a DRY RUN and prints a report. Check it carefully.
 * 4. Once you're satisfied, re-run with --confirm to actually update:
 *      GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json node scripts/deactivate-legacy-manager-roles.js --confirm
 *
 * Note: any Program Manager / Associate Program Manager whose
 * `reportsTo` pointed at one of these deactivated people will show up
 * as "Unassigned" in the app afterwards — reassign them to a Senior
 * Program Manager from the Manager & School Management screen.
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

const LEGACY_ROLES = ['director', 'assoc_director', 'aph', 'training'];
const ROLE_LABELS = {
  director: 'Director',
  assoc_director: 'Associate Director',
  aph: 'Program Head',
  training: 'Training Department'
};

const CONFIRM = process.argv.includes('--confirm');

async function main() {
  admin.initializeApp({ credential: admin.applicationDefault() });
  const db = getFirestore();

  console.log('Fetching managers collection...');
  const managersSnap = await db.collection('managers').get();
  console.log(`Found ${managersSnap.size} manager documents.\n`);

  const toDeactivate = [];
  const byRole = {};

  managersSnap.forEach(doc => {
    const data = doc.data();
    if (data.status !== 'active') return;
    if (!LEGACY_ROLES.includes(data.role)) return;
    toDeactivate.push(doc);
    byRole[data.role] = (byRole[data.role] || 0) + 1;
  });

  console.log('Active managers to deactivate (legacy roles removed from the hierarchy):');
  console.log('─'.repeat(50));
  LEGACY_ROLES.forEach(role => {
    console.log(`  ${ROLE_LABELS[role].padEnd(20)} ${byRole[role] || 0} person(s)`);
  });
  console.log('─'.repeat(50));
  console.log(`TOTAL: ${toDeactivate.length}\n`);

  if (toDeactivate.length > 0) {
    console.log('Names:');
    toDeactivate.forEach(doc => {
      const data = doc.data();
      console.log(`  - ${data.name || '(no name)'} <${data.email || 'no email'}> — ${ROLE_LABELS[data.role]}`);
    });
    console.log('');
  }

  if (!CONFIRM) {
    console.log('DRY RUN — no data was changed.');
    console.log('If it looks right, re-run with --confirm to actually update.');
    return;
  }

  if (toDeactivate.length === 0) {
    console.log('Nothing to deactivate. Done.');
    return;
  }

  // ── Backup the pre-update state before writing anything ────────────
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'backups', `deactivate-legacy-manager-roles-${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });
  const backupData = toDeactivate.map(d => ({ id: d.id, ...d.data() }));
  fs.writeFileSync(path.join(backupDir, 'managers-before-deactivation.json'), JSON.stringify(backupData, null, 2));
  console.log(`Backed up ${backupData.length} pre-update document(s) to ${backupDir}\n`);

  console.log(`Updating ${toDeactivate.length} document(s)...`);
  const BATCH_SIZE = 450;
  for (let i = 0; i < toDeactivate.length; i += BATCH_SIZE) {
    const batch = db.batch();
    toDeactivate.slice(i, i + BATCH_SIZE).forEach(doc => {
      batch.update(doc.ref, {
        status: 'inactive',
        deactivatedAt: new Date().toISOString(),
        deactivatedReason: 'Role removed from org hierarchy (Director/Associate Director/Program Head/Training Department consolidated into Senior Program Manager)'
      });
    });
    await batch.commit();
    console.log(`  Committed ${Math.min(i + BATCH_SIZE, toDeactivate.length)} / ${toDeactivate.length}`);
  }

  console.log(`\nDone. Deactivated ${toDeactivate.length} manager(s).`);
  console.log(`Backup saved at: ${backupDir}`);
}

main().catch(err => {
  console.error('FAILED:', err);
  process.exit(1);
});
