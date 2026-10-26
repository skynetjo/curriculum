#!/usr/bin/env node
// Curriculum Tracker build step (safe no-op).
//
// This script used to split app.js into app.js / app-admin.js / app-features.js
// at fixed line numbers taken from v5.5.2. app.js has since changed, so running
// that split now cuts app.js in the middle of a function and the app fails to load.
// index.html also loads app.js and admin.js directly, not the split chunks.
//
// The site is deployed as static files, so no build is needed. This file is kept
// (instead of deleted) so any Vercel build command that still calls it succeeds.

const fs = require('fs');
const path = require('path');

for (const f of ['app.js', 'admin.js', 'post-app.js', 'init.js']) {
  if (!fs.existsSync(path.join(__dirname, f))) {
    console.error(`❌ Build check: ${f} is missing`);
    process.exit(1);
  }
}
console.log('✅ Build: static site, nothing to compile. app.js and admin.js are served as-is.');
