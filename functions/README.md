# Timetable email notifications (Cloud Functions)

Two Cloud Functions that email teachers about their timetable:

- **`onTimetableWrite`** — fires whenever a `timetables/{school}_class11` or
  `timetables/{school}_class12` document is created or updated. It diffs the
  old and new `slots` map and emails only the teachers whose own slot
  actually changed (added, removed, or reassigned) — not everyone with a
  slot in the document.
- **`dailyScheduleDigest`** — runs once a day at 6:00 AM IST. For every
  school, it skips days marked as a weekly off (per the "Weekly Off"
  checkboxes in the timetable editor), then emails each teacher who has at
  least one period that day their schedule for Class 11 and Class 12
  combined at that school. Teachers with no periods that day get no email.

Email is sent via Gmail SMTP (through `nodemailer`) using an address you
control and an [app password](https://myaccount.google.com/apppasswords)
(not your normal Gmail password — Google requires 2-Step Verification to be
turned on for the account before it will let you generate one). Gmail caps
regular accounts around 500 recipients/day; a Google Workspace account has a
higher cap. If you outgrow that, swap `lib/mailer.js` for a transactional
provider (SendGrid, Mailgun, Resend, etc.) later — everything else in this
folder is provider-agnostic.

## One-time setup

You need the [Firebase CLI](https://firebase.google.com/docs/cli) installed
and logged in (`npm install -g firebase-tools && firebase login`), and your
Firebase project (`curriculum-dbb10`, already set in `.firebaserc` at the
repo root) upgraded to the **Blaze (pay-as-you-go)** plan — Cloud Functions,
even ones that stay within the free tier, require billing to be enabled.
Firebase Console → your project → ⚙️ → Usage and billing → "Modify plan".

1. Install dependencies:
   ```
   cd functions
   npm install
   ```
2. Generate a Gmail app password for the account you want notifications to
   come from, then store both the address and the app password as Cloud
   Functions secrets (you'll be prompted to paste each value — nothing is
   stored in this repo):
   ```
   firebase functions:secrets:set GMAIL_USER
   firebase functions:secrets:set GMAIL_APP_PASSWORD
   ```
3. Deploy:
   ```
   firebase deploy --only functions
   ```
   If deploy fails with a region/location error, your Firestore database
   isn't in `us-central1` — open `functions/index.js` and change the
   `region` passed to `setGlobalOptions(...)` to match (Firebase Console →
   Firestore → your database's location is shown at the top of the page).

## Before relying on this for real

- Deploying does **not** retroactively fire `onTimetableWrite` for existing
  documents — it only reacts to changes made after deployment, so there's no
  risk of an initial mass email blast to every teacher.
- `dailyScheduleDigest` **will** start emailing real teachers at 6 AM IST
  the day after you deploy it. If you want to test first, temporarily point
  a couple of `teachers` documents' `email` field at a test inbox, or
  comment out the `exports.dailyScheduleDigest = ...` block until you've
  verified `onTimetableWrite` looks right.
- Watch the first few runs: `firebase functions:log` (or Firebase Console →
  Functions → Logs) shows how many teachers were affected/emailed and any
  send failures.

## What it doesn't do (yet)

- Doesn't dedupe a teacher who somehow has slots at more than one school on
  the same day — they'd get one email per school.
- The daily digest doesn't include per-school custom period labels/times if
  a school customized them beyond the default 8-period grid in an unusual
  way; it falls back to the app's default period labels/times when a
  school's stored `periodLabels`/`periodTimes` don't cover a period.
