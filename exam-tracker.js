// ============================================================
// EXAM CONDUCT TRACKER  v4.5.0
// Avanti Fellows Curriculum Tracker
//
// v4.5.0 fixes:
//   1. CoE Cuttak spelling fix in SCHOOL_TOTALS
//   2. Subject avg cards (P/C/M/B) added above the table
//
// v4.4.0 additions:
//   2. ATTENDANCE DISPLAY — Students column now shows
//      "X / Total (Y%)" with colour-coded % (green ≥80,
//      amber ≥60, red <60). Totals hard-coded per school+grade.
//
// v4.3.0 fix:
//   1. RESULTS UPLOAD — fix: conductMap now updates instantly
//      after bulk upload so tracker reflects data without
//      needing a page refresh. Also passes mode to parent.
//      Upload the student-level results CSV (from dashboard)
//      to auto-fill conduct records: participants, avg score,
//      and subject-wise avg accuracy (P/C/M/B) for each
//      school × exam combination. Preview table with match
//      confirmation + per-row Online/Offline mode selector.
//      Unmatched test names are highlighted and skipped.
//
// v4.1.0 additions:
//   1. SUBJECT AVG SCORES — Physics, Chemistry, Maths, Biology
//      avg accuracy shown in table row (compact chips) and
//      editable fields in the Conduct modal.
//      Auto-populated from CSV import; also manually editable.
//
// v4.0.0 fixes:
//   1. DELETE PERSISTENCE — global deletes now written to
//      Firestore `deletedExamIds` doc so they survive refresh
//   2. ROLE GATES — hide/restore/bulk-action only for
//      isAdmin (managers + admins). Teachers see read-only.
//   3. CSV BULK UPLOAD — super_admin only. Uploads to
//      `examSchedule` collection with preview + confirm step.
//      Download sample CSV template included.
// ============================================================

(function () {
  'use strict';

  const { useState, useEffect, useRef, useCallback, useMemo } = React;
  const getDb = () => (window._earlyDb || firebase.firestore());

  // ── helpers ──────────────────────────────────────────────
  function fmtDate(d) {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}); }
    catch { return d; }
  }
  function monthLbl(d) {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('en-IN',{month:'short',year:'numeric'}); }
    catch { return ''; }
  }
  function uid() { return 'e'+Date.now().toString(36)+Math.random().toString(36).slice(2,6); }
  // Master sort: by date ascending, then testName alphabetically for same-day exams
  function sortExams(arr) {
    return arr.slice().sort(function(a, b) {
      var da = a.date ? new Date(a.date).getTime() : 0;
      var db = b.date ? new Date(b.date).getTime() : 0;
      if (da !== db) return da - db;
      return (a.testName||'').localeCompare(b.testName||'');
    });
  }

  // ── status ───────────────────────────────────────────────
  const S = {
    conducted:{ label:'Conducted',   e:'✅', c:'#065F46', bg:'#ECFDF5', b:'#6EE7B7' },
    partial:  { label:'Partial',     e:'⚠️', c:'#92400E', bg:'#FFFBEB', b:'#FCD34D' },
    missed:   { label:'Missed',      e:'❌', c:'#991B1B', bg:'#FEF2F2', b:'#FCA5A5' },
    upcoming: { label:'Upcoming',    e:'🗓️', c:'#3730A3', bg:'#EEF2FF', b:'#A5B4FC' },
    unset:    { label:'Not Updated', e:'⏳', c:'#6B7280', bg:'#F9FAFB', b:'#D1D5DB' },
    excluded: { label:'N/A',         e:'🚫', c:'#6B7280', bg:'#F3F4F6', b:'#D1D5DB' },
  };
  function sKey(cond, date) {
    if (!cond) return new Date(date) > new Date() ? 'upcoming' : 'unset';
    if (cond.excluded) return 'excluded';
    return cond.status || 'unset';
  }

  // ── seed (fallback when Firestore schedule is empty) ─────
  const SEED = [
    { id:'e001', date:'2025-07-26', grade:'12', stream:'Medical',     testName:'AIET-01-G12-PCB',                      format:'MT',         purpose:'Monthly Test' },
    { id:'e002', date:'2025-07-28', grade:'11', stream:'Engineering', testName:'JNV-G11-BASELINE',                     format:'MT',         purpose:'Baseline' },
    { id:'e003', date:'2025-08-06', grade:'11', stream:'Engineering', testName:'AIET-01-G11-PCM',                      format:'MT',         purpose:'Monthly Test' },
    { id:'e004', date:'2025-08-06', grade:'11', stream:'Medical',     testName:'AIET-01-G11-PCB',                      format:'MT',         purpose:'Monthly Test' },
    { id:'e005', date:'2025-08-29', grade:'12', stream:'Engineering', testName:'AIET-02-G12-PCM',                      format:'MT',         purpose:'Monthly Test' },
    { id:'e006', date:'2025-08-29', grade:'12', stream:'Medical',     testName:'AIET-02-G12-PCB',                      format:'MT',         purpose:'Monthly Test' },
    { id:'e007', date:'2025-08-29', grade:'11', stream:'Engineering', testName:'AIET-02-G11-PCM',                      format:'MT',         purpose:'Monthly Test' },
    { id:'e008', date:'2025-08-29', grade:'11', stream:'Medical',     testName:'AIET-02-G11-PCB',                      format:'MT',         purpose:'Monthly Test' },
    { id:'e009', date:'2025-09-03', grade:'11', stream:'Engineering', testName:'NVS-01 G11 JEE',                       format:'MT',         purpose:'Monthly Test' },
    { id:'e010', date:'2025-09-03', grade:'11', stream:'Medical',     testName:'NVS-01 G11 NEET',                      format:'MT',         purpose:'Monthly Test' },
    { id:'e011', date:'2025-09-03', grade:'12', stream:'Engineering', testName:'NVS-01 G12 JEE',                       format:'MT',         purpose:'Monthly Test' },
    { id:'e012', date:'2025-09-03', grade:'12', stream:'Medical',     testName:'NVS-01 G12 NEET',                      format:'MT',         purpose:'Monthly Test' },
    { id:'e013', date:'2025-09-26', grade:'11', stream:'Engineering', testName:'AIET-03-G11-PCM',                      format:'MT',         purpose:'Monthly Test' },
    { id:'e014', date:'2025-09-26', grade:'11', stream:'Medical',     testName:'AIET-03-G11-PCB',                      format:'MT',         purpose:'Monthly Test' },
    { id:'e015', date:'2025-09-26', grade:'12', stream:'Engineering', testName:'AIET-03-G12-PCM',                      format:'MT',         purpose:'Monthly Test' },
    { id:'e016', date:'2025-09-26', grade:'12', stream:'Medical',     testName:'AIET-03-G12-PCB',                      format:'MT',         purpose:'Monthly Test' },
    { id:'e017', date:'2025-10-05', grade:'11', stream:'Engineering', testName:'AIET 03 - G11 - PCM - ADVANCED PAPER', format:'Major Test', purpose:'Monthly Test' },
    { id:'e018', date:'2025-10-05', grade:'12', stream:'Engineering', testName:'AIET 03 - G12 - PCM - ADVANCED PAPER', format:'Major Test', purpose:'Monthly Test' },
    { id:'e019', date:'2025-10-05', grade:'12', stream:'Engineering', testName:'G12-CET-01-PCMA',                      format:'Major Test', purpose:'Monthly Test' },
    { id:'e020', date:'2025-10-05', grade:'12', stream:'Medical',     testName:'G12-CET-01-PCB',                       format:'Major Test', purpose:'Monthly Test' },
    { id:'e021', date:'2025-10-05', grade:'11', stream:'Engineering', testName:'G11-CET-01-PCMA',                      format:'Major Test', purpose:'Monthly Test' },
    { id:'e022', date:'2025-10-05', grade:'11', stream:'Medical',     testName:'G11-CET-01-PCB',                       format:'Major Test', purpose:'Monthly Test' },
    { id:'e023', date:'2025-10-29', grade:'11', stream:'Engineering', testName:'AIET-04-G11-PCM',                      format:'MT',         purpose:'Monthly Test' },
    { id:'e024', date:'2025-10-29', grade:'11', stream:'Medical',     testName:'AIET-04-G11-PCB',                      format:'MT',         purpose:'Monthly Test' },
    { id:'e025', date:'2025-10-29', grade:'12', stream:'Engineering', testName:'AIET-04-G12-PCM',                      format:'MT',         purpose:'Monthly Test' },
    { id:'e026', date:'2025-10-29', grade:'12', stream:'Medical',     testName:'AIET-04-G12-PCB',                      format:'MT',         purpose:'Monthly Test' },
    { id:'e027', date:'2025-11-15', grade:'6',  stream:'Foundation',  testName:'Midline G06 Foundation 2025-26',        format:'MT',         purpose:'Midline' },
    { id:'e028', date:'2025-11-15', grade:'7',  stream:'Foundation',  testName:'Midline G07 Foundation 2025-26',        format:'MT',         purpose:'Midline' },
    { id:'e029', date:'2025-11-15', grade:'8',  stream:'Foundation',  testName:'Midline G08 Foundation 2025-26',        format:'MT',         purpose:'Midline' },
    { id:'e030', date:'2025-11-15', grade:'9',  stream:'Foundation',  testName:'Midline G09 Foundation 2025-26',        format:'MT',         purpose:'Midline' },
    { id:'e031', date:'2025-11-15', grade:'10', stream:'Foundation',  testName:'Midline G10 Foundation 2025-26',        format:'MT',         purpose:'Midline' },
    { id:'e032', date:'2025-11-14', grade:'11', stream:'Engineering', testName:'AIET-05-G11-PCM',                       format:'Major Test', purpose:'Monthly Test' },
    { id:'e033', date:'2025-11-14', grade:'11', stream:'Medical',     testName:'AIET-05-G11-PCB',                       format:'Major Test', purpose:'Monthly Test' },
    { id:'e034', date:'2025-11-14', grade:'12', stream:'Engineering', testName:'AIET-05-G12-PCM',                       format:'Major Test', purpose:'Monthly Test' },
    { id:'e035', date:'2025-11-14', grade:'12', stream:'Medical',     testName:'AIET-05-G12-PCB',                       format:'Major Test', purpose:'Monthly Test' },
    { id:'e036', date:'2025-12-01', grade:'12', stream:'Engineering', testName:'Mock-01-G12-PCM',                       format:'Mock Test',  purpose:'Practice Test' },
    { id:'e037', date:'2025-12-01', grade:'12', stream:'Medical',     testName:'Mock-01-G12-PCB',                       format:'Mock Test',  purpose:'Practice Test' },
    { id:'e038', date:'2025-12-28', grade:'11', stream:'Engineering', testName:'AIET-06-G11-PCM',                       format:'MT',         purpose:'Monthly Test' },
    { id:'e039', date:'2025-12-28', grade:'11', stream:'Medical',     testName:'AIET-06-G11-PCB',                       format:'MT',         purpose:'Monthly Test' },
    { id:'e040', date:'2025-12-28', grade:'12', stream:'Engineering', testName:'AIET-06-G12-PCM',                       format:'MT',         purpose:'Monthly Test' },
    { id:'e041', date:'2025-12-28', grade:'12', stream:'Medical',     testName:'AIET-06-G12-PCB',                       format:'MT',         purpose:'Monthly Test' },
    { id:'e042', date:'2026-01-25', grade:'11', stream:'Engineering', testName:'AIET-07-G11-PCM',                       format:'MT',         purpose:'Monthly Test' },
    { id:'e043', date:'2026-01-25', grade:'11', stream:'Medical',     testName:'AIET-07-G11-PCB',                       format:'MT',         purpose:'Monthly Test' },
    { id:'e044', date:'2026-01-25', grade:'12', stream:'Engineering', testName:'AIET-07-G12-PCM',                       format:'MT',         purpose:'Monthly Test' },
    { id:'e045', date:'2026-01-25', grade:'12', stream:'Medical',     testName:'AIET-07-G12-PCB',                       format:'MT',         purpose:'Monthly Test' },
    { id:'e046', date:'2026-02-22', grade:'11', stream:'Engineering', testName:'AIET-08-G11-PCM',                       format:'MT',         purpose:'Monthly Test' },
    { id:'e047', date:'2026-02-22', grade:'11', stream:'Medical',     testName:'AIET-08-G11-PCB',                       format:'MT',         purpose:'Monthly Test' },
    { id:'e048', date:'2026-02-22', grade:'12', stream:'Engineering', testName:'AIET-08-G12-PCM',                       format:'MT',         purpose:'Monthly Test' },
    { id:'e049', date:'2026-02-22', grade:'12', stream:'Medical',     testName:'AIET-08-G12-PCB',                       format:'MT',         purpose:'Monthly Test' },
    { id:'e050', date:'2026-03-22', grade:'12', stream:'Engineering', testName:'Mock-02-G12-PCM (Pre-Final)',            format:'Mock Test',  purpose:'Practice Test' },
    { id:'e051', date:'2026-03-22', grade:'12', stream:'Medical',     testName:'Mock-02-G12-PCB (Pre-Final)',            format:'Mock Test',  purpose:'Practice Test' },
  ];

  const STREAMS  = ['Engineering','Medical','Foundation'];
  const FORMATS  = ['MT','Major Test','Mock Test','Part Test','Baseline','Midline'];
  const PURPOSES = ['Monthly Test','Practice Test','Baseline','Midline','Half Yearly','Final'];

  // Total enrolled students per school per grade
  // Used to show attendance as  "X / Total (Y%)"
  const SCHOOL_TOTALS = {
    'CoE Barwani':  { '11': 40, '12': 41 },
    'CoE Cuttak':  { '11': 40, '12': 40 },
    'CoE Bundi':    { '11': 50, '12': 50 },
    'CoE Mahisagar':{ '11': 33 },
    'EMRS Bhopal':  { '11': 51 },
    'JNV Bharuch':  { '11': 37, '12': 32 },
  };
  function getTotal(school, grade) {
    return (SCHOOL_TOTALS[school] || {})[String(grade)] || null;
  }

  // CSV columns we expect
  const CSV_HEADERS = ['date','grade','stream','testName','format','purpose'];

  // ── tiny UI helpers ──────────────────────────────────────
  function pill(text, bg, color, border) {
    return React.createElement('span',{style:{background:bg,color,border:`1px solid ${border||'transparent'}`,
      padding:'3px 9px',borderRadius:'99px',fontSize:'12px',fontWeight:'600',
      display:'inline-flex',alignItems:'center',gap:'4px',whiteSpace:'nowrap'}},text);
  }
  function ModePill({mode}) {
    if (!mode) return null;
    return mode==='Online'
      ? pill('🌐 Online','#EFF6FF','#1D4ED8','#BFDBFE')
      : pill('📄 Offline','#F5F3FF','#6D28D9','#DDD6FE');
  }
  function StatCard({label,value,sub,color,emoji}) {
    return React.createElement('div',{style:{background:'#fff',borderRadius:'14px',padding:'16px 14px',
      boxShadow:'0 2px 10px rgba(0,0,0,0.07)',borderLeft:`4px solid ${color}`,
      display:'flex',alignItems:'center',gap:'12px'}},
      React.createElement('div',{style:{fontSize:'26px'}},emoji),
      React.createElement('div',null,
        React.createElement('div',{style:{fontSize:'22px',fontWeight:'800',color,lineHeight:'1.1'}},value),
        React.createElement('div',{style:{fontSize:'12px',color:'#6B7280',fontWeight:'600'}},label),
        sub&&React.createElement('div',{style:{fontSize:'11px',color:'#9CA3AF'}},sub)
      )
    );
  }

  // ─────────────────────────────────────────────────────────
  // CSV BULK UPLOAD MODAL  (super_admin only)
  // ─────────────────────────────────────────────────────────
  function CSVUploadModal({ onClose, onSaved }) {
    const [rows,     setRows]     = useState([]);   // parsed preview rows
    const [error,    setError]    = useState('');
    const [saving,   setSaving]   = useState(false);
    const [done,     setDone]     = useState(false);
    const fileRef = useRef(null);

    // Download sample CSV
    function downloadSample() {
      const lines = [
        CSV_HEADERS.join(','),
        '2026-04-10,11,Engineering,AIET-09-G11-PCM,MT,Monthly Test',
        '2026-04-10,11,Medical,AIET-09-G11-PCB,MT,Monthly Test',
        '2026-04-10,12,Engineering,AIET-09-G12-PCM,MT,Monthly Test',
        '2026-04-10,12,Medical,AIET-09-G12-PCB,MT,Monthly Test',
      ].join('\n');
      const a = document.createElement('a');
      a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(lines);
      a.download = 'exam-schedule-sample.csv';
      a.click();
    }

    // Parse uploaded CSV
    function handleFile(e) {
      setError(''); setRows([]); setDone(false);
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(ev) {
        try {
          const text = ev.target.result;
          // Handle Windows line endings
          const lines = text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n').filter(l=>l.trim());
          if (lines.length < 2) { setError('CSV is empty or has no data rows.'); return; }

          // Parse header
          const headers = lines[0].split(',').map(h=>h.trim().toLowerCase().replace(/\s+/g,''));
          const missing = CSV_HEADERS
  .map(h => h.toLowerCase().replace(/\s+/g,''))
  .filter(h => !headers.includes(h));
          if (missing.length > 0) {
            setError(`Missing columns: ${missing.join(', ')}. Download the sample to see the correct format.`);
            return;
          }

          // Parse rows
          const parsed = lines.slice(1).map((line, i) => {
            // Handle quoted fields with commas inside
            const cols = line.match(/(".*?"|[^,]+)(?=,|$)/g) || line.split(',');
            const obj = {};
            headers.forEach((h, idx) => { obj[h] = (cols[idx]||'').replace(/^"|"$/g,'').trim(); });
            return obj;
          }).filter(r => r.testname || r.testName);

          if (parsed.length === 0) { setError('No valid rows found in CSV.'); return; }

          // Normalise to our field names (CSV uses lowercase)
          const normalised = parsed.map(r => ({
            id: uid(),
            date:     r.date     || '',
            grade:    r.grade    || '',
            stream:   r.stream   || '',
            testName: r.testname || r.testName || '',
            format:   r.format   || 'MT',
            purpose:  r.purpose  || 'Monthly Test',
          }));

          normalised.sort((a, b) => {
  const parse = (d) => {
    const [day, mon, year] = d.split('-');
    const months = {
      Jan:0, Feb:1, Mar:2, Apr:3, May:4, Jun:5,
      Jul:6, Aug:7, Sep:8, Oct:9, Nov:10, Dec:11
    };
    return new Date(year, months[mon], day);
  };
  return parse(a.date) - parse(b.date);
});

setRows(normalised);
        } catch(err) {
          setError('Failed to parse CSV: ' + err.message);
        }
      };
      reader.readAsText(file);
    }

    // Save to Firestore examSchedule
    async function confirmUpload() {
      if (!rows.length) return;
      setSaving(true);
      try {
        const db = getDb();
        // Firestore batch max is 500 ops
        const BATCH_SIZE = 400;
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
          const batch = db.batch();
          rows.slice(i, i + BATCH_SIZE).forEach(exam => {
            batch.set(db.collection('examSchedule').doc(exam.id), exam);
          });
          await batch.commit();
        }
        setDone(true);
        onSaved(rows);
      } catch(err) {
        setError('Upload failed: ' + err.message);
        setSaving(false);
      }
    }

    const stm = {Engineering:{bg:'#FFF7ED',c:'#C2410C'},Medical:{bg:'#F0FDF4',c:'#15803D'},Foundation:{bg:'#F5F3FF',c:'#7C3AED'}};

    return React.createElement('div',{style:{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:10003,
      display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'},onClick:onClose},
      React.createElement('div',{onClick:e=>e.stopPropagation(),style:{background:'#fff',borderRadius:'20px',
        width:'100%',maxWidth:'680px',padding:'28px',boxShadow:'0 20px 60px rgba(0,0,0,0.3)',
        maxHeight:'90vh',overflowY:'auto'}},

        // Header
        React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}},
          React.createElement('div',null,
            React.createElement('h3',{style:{fontSize:'18px',fontWeight:'700',color:'#1F2937',marginBottom:'4px'}},'📤 Bulk Upload Exam Schedule'),
            React.createElement('p',{style:{fontSize:'13px',color:'#6B7280'}},'Upload a CSV file to add multiple exams to the schedule at once.')
          ),
          React.createElement('button',{onClick:onClose,style:{background:'#F3F4F6',border:'none',borderRadius:'50%',
            width:'34px',height:'34px',cursor:'pointer',fontSize:'18px',color:'#6B7280'}},'×')
        ),

        // Step 1 — download sample
        React.createElement('div',{style:{background:'#F0FDF4',border:'1px solid #BBF7D0',borderRadius:'12px',
          padding:'14px 16px',marginBottom:'18px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'10px'}},
          React.createElement('div',null,
            React.createElement('p',{style:{fontSize:'13px',fontWeight:'700',color:'#065F46',marginBottom:'2px'}},'Step 1 — Download the sample CSV template'),
            React.createElement('p',{style:{fontSize:'12px',color:'#15803D'}},'Fill in your exam data using the correct column format.')
          ),
          React.createElement('button',{onClick:downloadSample,style:{background:'#15803D',color:'#fff',border:'none',
            borderRadius:'9px',padding:'9px 16px',fontSize:'13px',fontWeight:'600',cursor:'pointer'}},
            '⬇ Download Sample CSV')
        ),

        // Step 2 — upload
        React.createElement('div',{style:{marginBottom:'18px'}},
          React.createElement('p',{style:{fontSize:'13px',fontWeight:'700',color:'#374151',marginBottom:'8px'}},'Step 2 — Upload your filled CSV file'),
          React.createElement('div',{style:{border:'2px dashed #D1D5DB',borderRadius:'12px',padding:'24px',textAlign:'center',
            background:'#FAFAFA',cursor:'pointer'},onClick:()=>fileRef.current&&fileRef.current.click()},
            React.createElement('div',{style:{fontSize:'32px',marginBottom:'8px'}},'📂'),
            React.createElement('p',{style:{fontSize:'14px',color:'#374151',fontWeight:'500',marginBottom:'4px'}},'Click to choose a .csv file'),
            React.createElement('p',{style:{fontSize:'12px',color:'#9CA3AF'}},'Columns required: date, grade, stream, testName, format, purpose'),
            React.createElement('input',{ref:fileRef,type:'file',accept:'.csv',onChange:handleFile,style:{display:'none'}})
          )
        ),

        // Error
        error && React.createElement('div',{style:{background:'#FEF2F2',border:'1px solid #FCA5A5',borderRadius:'10px',
          padding:'12px 14px',marginBottom:'14px',fontSize:'13px',color:'#991B1B',fontWeight:'500'}},
          '❌ ' + error),

        // Done message
        done && React.createElement('div',{style:{background:'#ECFDF5',border:'1px solid #6EE7B7',borderRadius:'10px',
          padding:'16px',marginBottom:'14px',textAlign:'center'}},
          React.createElement('div',{style:{fontSize:'32px',marginBottom:'6px'}},'✅'),
          React.createElement('p',{style:{fontSize:'15px',fontWeight:'700',color:'#065F46'}}),
          React.createElement('p',{style:{fontSize:'14px',fontWeight:'700',color:'#065F46'}},`${rows.length} exams uploaded successfully!`),
          React.createElement('p',{style:{fontSize:'12px',color:'#15803D',marginTop:'4px'}},'The schedule has been updated. You can close this panel.')
        ),

        // Preview table
        !done && rows.length > 0 && React.createElement('div',null,
          React.createElement('p',{style:{fontSize:'13px',fontWeight:'700',color:'#374151',marginBottom:'10px'}},
            `Step 3 — Preview (${rows.length} exams found)`),
          React.createElement('div',{style:{border:'1px solid #E5E7EB',borderRadius:'10px',overflow:'hidden',marginBottom:'16px'}},
            React.createElement('div',{style:{overflowX:'auto',maxHeight:'260px',overflowY:'auto'}},
              React.createElement('table',{style:{width:'100%',borderCollapse:'collapse',minWidth:'560px',fontSize:'12px'}},
                React.createElement('thead',null,
                  React.createElement('tr',{style:{background:'#1a1a2e',color:'#fff',position:'sticky',top:0}},
                    ['Date','Grade','Stream','Test Name','Format','Purpose'].map(h=>
                      React.createElement('th',{key:h,style:{padding:'9px 10px',textAlign:'left',fontWeight:'600',fontSize:'11px',textTransform:'uppercase',letterSpacing:'.04em',whiteSpace:'nowrap'}},h)
                    )
                  )
                ),
                React.createElement('tbody',null,
                  rows.map((r,i)=>React.createElement('tr',{key:r.id,style:{background:i%2===0?'#fff':'#F9FAFB',borderBottom:'1px solid #F3F4F6'}},
                    React.createElement('td',{style:{padding:'8px 10px',whiteSpace:'nowrap',color:'#374151',fontWeight:'500'}},fmtDate(r.date)),
                    React.createElement('td',{style:{padding:'8px 10px',textAlign:'center'}},pill('G'+r.grade,'#EEF2FF','#4F46E5','#C7D2FE')),
                    React.createElement('td',{style:{padding:'8px 10px'}},pill(r.stream,(stm[r.stream]||{bg:'#F3F4F6'}).bg,(stm[r.stream]||{c:'#374151'}).c)),
                    React.createElement('td',{style:{padding:'8px 10px',color:'#1F2937',fontWeight:'600'}},r.testName),
                    React.createElement('td',{style:{padding:'8px 10px',color:'#6B7280'}},r.format),
                    React.createElement('td',{style:{padding:'8px 10px',color:'#6B7280'}},r.purpose)
                  ))
                )
              )
            )
          ),

          // Confirm button
          React.createElement('div',{style:{display:'flex',gap:'10px'}},
            React.createElement('button',{onClick:onClose,style:{flex:1,padding:'12px',background:'#F3F4F6',border:'none',
              borderRadius:'12px',fontSize:'14px',fontWeight:'600',cursor:'pointer',color:'#374151'}},'Cancel'),
            React.createElement('button',{onClick:confirmUpload,disabled:saving,style:{flex:2,padding:'12px',
              background:saving?'#9CA3AF':'linear-gradient(135deg,#15803D,#166534)',
              color:'#fff',border:'none',borderRadius:'12px',fontSize:'14px',fontWeight:'700',cursor:saving?'default':'pointer'}},
              saving?'⏳ Uploading…':`✅ Confirm Upload (${rows.length} exams)`)
          )
        ),

        // Close button when done
        done && React.createElement('button',{onClick:onClose,style:{width:'100%',padding:'12px',background:'#1a1a2e',
          color:'#fff',border:'none',borderRadius:'12px',fontSize:'14px',fontWeight:'700',cursor:'pointer'}},
          '✓ Close')
      )
    );
  }

  // ─────────────────────────────────────────────────────────
  // RESULTS BULK UPLOAD MODAL  (admin + manager)
  // Reads the student-level results CSV and auto-fills
  // examConduct records: participants, avg score, P/C/M/B avg
  // ─────────────────────────────────────────────────────────
  function ResultsBulkUploadModal({ exams, currentUser, onClose, onSaved }) {
    const [rows,    setRows]    = useState([]);
    const [error,   setError]   = useState('');
    const [saving,  setSaving]  = useState(false);
    const [done,    setDone]    = useState(false);
    const [modeMap, setModeMap] = useState({});
    const fileRef = useRef(null);

    function downloadSample() {
      const lines = [
        'Student ID,Student Name,School Name,Student Grade,Test Grade,Gender,Category,Test Name,Total Marks,Total Att Rate,Total Acc,Physics Marks,Physics Att Rate,Physics Acc,Chemistry Marks,Chemistry Att Rate,Chemistry Acc,Maths Marks,Marks Att Rate,Maths Acc,Biology Marks,Biology Att Rate,Biology Acc,start_quiz_time (Date)',
        '1001,Rahul Sharma,JNV Bharuch,12,12,Male,OBC,Mock-09-G12-PCB,350,65.5,78.3,45,55,72.1,80,60,80.5,null,null,null,225,78.9,80.0,"Jan 17, 2026"',
        '1002,Priya Patel,JNV Bharuch,12,12,Female,SC,Mock-09-G12-PCB,310,58.2,70.1,38,48,65.0,72,55,72.3,null,null,null,200,68.2,73.5,"Jan 17, 2026"',
      ].join('\n');
      const a = document.createElement('a');
      a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(lines);
      a.download = 'results-bulk-upload-sample.csv';
      a.click();
    }

    function parseNum(val) {
      if (!val || val === 'null' || val.trim() === '') return null;
      const n = parseFloat(val);
      return isNaN(n) ? null : n;
    }

    function avg(arr) {
      const valid = arr.filter(v => v !== null && v !== undefined);
      if (!valid.length) return null;
      return Math.round((valid.reduce((s, v) => s + v, 0) / valid.length) * 10) / 10;
    }

    // Normalize a header string to a simple key for matching
    function normKey(h) {
      return h.toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    function handleFile(e) {
      setError(''); setRows([]); setDone(false);
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(ev) {
        try {
          const text = ev.target.result;
          const lines = text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n').filter(l=>l.trim());
          if (lines.length < 2) { setError('CSV has no data rows.'); return; }

          // Parse header — normalize for flexible matching
          const rawHeaders = lines[0].split(',').map(h => h.replace(/^"|"$/g,'').trim());
          const normHeaders = rawHeaders.map(normKey);

          // Required columns (normalized)
          const need = { schoolname:'School Name', testname:'Test Name', totalacc:'Total Acc' };
          const missing = Object.entries(need).filter(([k]) => !normHeaders.includes(k)).map(([,v])=>v);
          if (missing.length) {
            setError(`Missing required columns: ${missing.join(', ')}. Use the exact column names from your dashboard export.`);
            return;
          }

          // Helper to find column index
          const idx = key => normHeaders.indexOf(normKey(key));
          const iSchool  = idx('School Name');
          const iTest    = idx('Test Name');
          const iAcc     = idx('Total Acc');
          const iPhysAcc = idx('Physics Acc');
          const iChemAcc = idx('Chemistry Acc');
          const iMathAcc = idx('Maths Acc');     // CSV says "Maths Acc"
          const iBioAcc  = idx('Biology Acc');

          // Parse student rows
          const studentRows = lines.slice(1).map(line => {
            // Handle quoted fields
            const cols = [];
            let inQ = false, cur = '';
            for (let ci = 0; ci < line.length; ci++) {
              const ch = line[ci];
              if (ch === '"') { inQ = !inQ; }
              else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
              else { cur += ch; }
            }
            cols.push(cur.trim());
            return cols;
          }).filter(c => c[iSchool] && c[iTest]);

          if (!studentRows.length) { setError('No valid rows found in CSV.'); return; }

          // Group by school + testName
          const groups = {};
          studentRows.forEach(c => {
            const sc = c[iSchool] || '';
            const tn = c[iTest]   || '';
            if (!sc || !tn) return;
            const key = sc + '||' + tn;
            if (!groups[key]) groups[key] = [];
            groups[key].push(c);
          });

          // Aggregate per group
          const aggregated = Object.entries(groups).map(([key, arr]) => {
            const [schoolName, testName] = key.split('||');
            const participants  = arr.length;
            const avgScore      = avg(arr.map(c => parseNum(c[iAcc])));
            const avgPhysics    = iPhysAcc  >= 0 ? avg(arr.map(c => parseNum(c[iPhysAcc])))  : null;
            const avgChemistry  = iChemAcc  >= 0 ? avg(arr.map(c => parseNum(c[iChemAcc])))  : null;
            const avgMaths      = iMathAcc  >= 0 ? avg(arr.map(c => parseNum(c[iMathAcc])))  : null;
            const avgBiology    = iBioAcc   >= 0 ? avg(arr.map(c => parseNum(c[iBioAcc])))   : null;

            // Match against exam schedule — exact first, then case-insensitive
            const matchedExam = exams.find(ex => ex.testName === testName)
              || exams.find(ex => ex.testName.toLowerCase().trim() === testName.toLowerCase().trim());

            return { schoolName, testName, participants, avgScore, avgPhysics, avgChemistry, avgMaths, avgBiology, matchedExam };
          });

          // Sort: matched first, then by school + test
          aggregated.sort((a, b) => {
            if (!!a.matchedExam !== !!b.matchedExam) return a.matchedExam ? -1 : 1;
            return a.schoolName.localeCompare(b.schoolName) || a.testName.localeCompare(b.testName);
          });

          setRows(aggregated);
          // Default mode = Offline for all rows
          const m = {};
          aggregated.forEach(r => { m[r.schoolName+'||'+r.testName] = 'Offline'; });
          setModeMap(m);

        } catch(err) {
          setError('Could not parse the file. Please make sure it is a valid CSV from the teacher dashboard. Error: ' + err.message);
        }
      };
      reader.readAsText(file);
    }

    async function handleSave() {
      setSaving(true);
      try {
        const db = getDb();
        const matched = rows.filter(r => r.matchedExam);
        const BATCH_SIZE = 400;
        for (let i = 0; i < matched.length; i += BATCH_SIZE) {
          const batch = db.batch();
          matched.slice(i, i + BATCH_SIZE).forEach(r => {
            const exam  = r.matchedExam;
            const sc    = r.schoolName;
            const key   = sc + '||' + r.testName;
            const docId = sc + '_' + exam.id;
            const payload = {
              school:       sc,
              examId:       exam.id,
              examName:     exam.testName,
              examDate:     exam.date,
              grade:        exam.grade,
              stream:       exam.stream,
              excluded:     false,
              status:       'conducted',
              mode:         modeMap[key] || 'Offline',
              participants: r.participants,
              avgScore:     r.avgScore,
              avgPhysics:   r.avgPhysics,
              avgChemistry: r.avgChemistry,
              avgMaths:     r.avgMaths,
              avgBiology:   r.avgBiology,
              notes:        '',
              updatedBy:    currentUser?.name || currentUser?.email || 'Bulk Upload',
              updatedAt:    new Date().toISOString(),
            };
            batch.set(db.collection('examConduct').doc(docId), payload, { merge: true });
          });
          await batch.commit();
        }
        setDone(true);
        // Pass matched rows WITH their selected mode so the parent can update conductMap immediately
        onSaved && onSaved(matched.map(r => ({
          ...r,
          mode: modeMap[r.schoolName+'||'+r.testName] || 'Offline',
        })));
      } catch(err) {
        alert('Upload failed: ' + err.message);
        setSaving(false);
      }
    }

    const matchedCount   = rows.filter(r =>  r.matchedExam).length;
    const unmatchedCount = rows.filter(r => !r.matchedExam).length;
    const btnStyle = (bg, c, extra) => ({padding:'10px 18px',background:bg,color:c,border:'none',borderRadius:'10px',fontSize:'13px',fontWeight:'700',cursor:'pointer',...extra});
    const scoreColor = v => v==null?'#D1D5DB':v>=70?'#059669':v>=50?'#D97706':'#DC2626';

    return React.createElement('div',{style:{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:10002,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'},onClick:onClose},
      React.createElement('div',{onClick:e=>e.stopPropagation(),style:{background:'#fff',borderRadius:'20px',width:'100%',maxWidth:'920px',padding:'26px',boxShadow:'0 20px 60px rgba(0,0,0,0.3)',maxHeight:'93vh',overflowY:'auto'}},

        // ── Header ──
        React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'20px'}},
          React.createElement('div',null,
            React.createElement('h3',{style:{fontSize:'18px',fontWeight:'800',color:'#1F2937',marginBottom:'4px'}},'📊 Bulk Results Upload'),
            React.createElement('p',{style:{fontSize:'13px',color:'#6B7280',margin:0}},'Upload your student results CSV — the system will auto-calculate participants, avg scores, and subject averages per school & exam.')
          ),
          React.createElement('button',{onClick:onClose,style:{background:'#F3F4F6',border:'none',borderRadius:'50%',width:'34px',height:'34px',cursor:'pointer',fontSize:'18px',color:'#6B7280'}},'×')
        ),

        done
          // ── Success ──
          ? React.createElement('div',{style:{textAlign:'center',padding:'40px 20px'}},
              React.createElement('div',{style:{fontSize:'52px',marginBottom:'12px'}},'✅'),
              React.createElement('h3',{style:{fontSize:'18px',fontWeight:'700',color:'#065F46',marginBottom:'6px'}},matchedCount+' exam records saved!'),
              React.createElement('p',{style:{color:'#6B7280',fontSize:'14px',marginBottom:'24px'}},'Conduct records have been updated in the database. Refresh the tracker to see the changes.'),
              React.createElement('button',{onClick:onClose,style:btnStyle('#1a1a2e','#fff')},'✓ Close')
            )

          // ── Upload & Preview ──
          : React.createElement('div',null,

              // Step 1: File picker + sample download
              React.createElement('div',{style:{background:'#F9FAFB',border:'1.5px solid #E5E7EB',borderRadius:'14px',padding:'18px',marginBottom:'16px'}},
                React.createElement('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'10px',marginBottom:'12px'}},
                  React.createElement('p',{style:{fontSize:'14px',fontWeight:'700',color:'#374151',margin:0}},'① Select your student results CSV file'),
                  React.createElement('button',{onClick:downloadSample,style:btnStyle('#EFF6FF','#1D4ED8',{border:'1px solid #BFDBFE',fontSize:'12px',padding:'8px 14px'})},'⬇ Download Sample Format')
                ),
                React.createElement('div',{style:{border:'2px dashed #D1D5DB',borderRadius:'10px',padding:'20px',textAlign:'center',background:'#fff',cursor:'pointer'},onClick:()=>fileRef.current&&fileRef.current.click()},
                  React.createElement('div',{style:{fontSize:'30px',marginBottom:'8px'}},'📂'),
                  React.createElement('p',{style:{fontSize:'14px',fontWeight:'600',color:'#374151',margin:'0 0 4px'}},'Click here to choose your CSV file'),
                  React.createElement('p',{style:{fontSize:'12px',color:'#9CA3AF',margin:0}},'This is the same file you download from the Teacher Dashboard — Teacher_Dashboard_Results_Summary_Table.csv'),
                  React.createElement('input',{ref:fileRef,type:'file',accept:'.csv',onChange:handleFile,style:{display:'none'}})
                )
              ),

              // Error message
              error && React.createElement('div',{style:{background:'#FEF2F2',border:'1px solid #FCA5A5',borderRadius:'10px',padding:'12px 16px',marginBottom:'14px',fontSize:'13px',color:'#991B1B',fontWeight:'600'}},
                '❌ ' + error),

              // Preview table
              rows.length > 0 && React.createElement('div',null,

                // Summary badges
                React.createElement('div',{style:{display:'flex',gap:'10px',flexWrap:'wrap',marginBottom:'14px',alignItems:'center'}},
                  React.createElement('span',{style:{fontSize:'13px',fontWeight:'700',color:'#374151'}},'② Review & Confirm:'),
                  React.createElement('span',{style:{background:'#ECFDF5',color:'#065F46',border:'1px solid #6EE7B7',padding:'5px 12px',borderRadius:'99px',fontSize:'12px',fontWeight:'700'}},
                    '✅ '+matchedCount+' will be uploaded'),
                  unmatchedCount>0 && React.createElement('span',{style:{background:'#FEF2F2',color:'#991B1B',border:'1px solid #FCA5A5',padding:'5px 12px',borderRadius:'99px',fontSize:'12px',fontWeight:'700'}},
                    '⚠ '+unmatchedCount+' unmatched – will be skipped')
                ),

                React.createElement('div',{style:{overflowX:'auto',border:'1px solid #E5E7EB',borderRadius:'12px',marginBottom:'14px'}},
                  React.createElement('table',{style:{width:'100%',borderCollapse:'collapse',fontSize:'12px',minWidth:'780px'}},
                    React.createElement('thead',null,
                      React.createElement('tr',{style:{background:'linear-gradient(135deg,#1a1a2e,#16213e)',color:'#fff'}},
                        ['School','Test Name','Students','Avg Score','Phy','Che','Mat','Bio','Mode','Match?'].map(h=>
                          React.createElement('th',{key:h,style:{padding:'10px 10px',textAlign:'center',fontSize:'11px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'.05em',whiteSpace:'nowrap'}},h)
                        )
                      )
                    ),
                    React.createElement('tbody',null,
                      rows.map((r,i)=>{
                        const key = r.schoolName+'||'+r.testName;
                        const isMatch = !!r.matchedExam;
                        const rowBg = !isMatch ? '#FEF2F2' : i%2===0 ? '#fff' : '#F9FAFB';
                        const td = (content, extra) => React.createElement('td',{style:{padding:'9px 10px',textAlign:'center',borderBottom:'1px solid #F3F4F6',...extra}},content);
                        return React.createElement('tr',{key:i,style:{background:rowBg}},
                          td(r.schoolName,{textAlign:'left',fontWeight:'600',color:'#1F2937',maxWidth:'160px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:'11px'}),
                          td(r.testName,{textAlign:'left',color:'#374151',maxWidth:'200px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}),
                          td(r.participants,{fontWeight:'700',color:'#374151'}),
                          td(r.avgScore!=null?r.avgScore+'%':'—',{fontWeight:'700',color:scoreColor(r.avgScore)}),
                          ...[r.avgPhysics,r.avgChemistry,r.avgMaths,r.avgBiology].map((v,j)=>
                            td(v!=null?v+'%':'—',{key:j,color:scoreColor(v),fontWeight:'600'})
                          ),
                          // Mode dropdown
                          React.createElement('td',{style:{padding:'6px',textAlign:'center',borderBottom:'1px solid #F3F4F6'}},
                            React.createElement('select',{
                              value:modeMap[key]||'Offline',
                              onChange:ev=>setModeMap(prev=>({...prev,[key]:ev.target.value})),
                              disabled:!isMatch,
                              style:{fontSize:'11px',padding:'4px 6px',borderRadius:'6px',border:'1px solid #E5E7EB',cursor:isMatch?'pointer':'not-allowed',background:isMatch?'#fff':'#F3F4F6'}
                            },
                              React.createElement('option',{value:'Offline'},'📄 Offline'),
                              React.createElement('option',{value:'Online'},'🌐 Online')
                            )
                          ),
                          td(isMatch
                            ? React.createElement('span',{style:{color:'#059669',fontWeight:'800'}},'✓ Match')
                            : React.createElement('span',{title:'Test name not found in schedule. Check spelling.',style:{color:'#DC2626',fontWeight:'700',cursor:'help',fontSize:'11px'}},'✗ No match'),
                          {})
                        );
                      })
                    )
                  )
                ),

                // Guidance for unmatched
                unmatchedCount > 0 && React.createElement('div',{style:{background:'#FFFBEB',border:'1px solid #FCD34D',borderRadius:'10px',padding:'12px 16px',marginBottom:'14px',fontSize:'13px',color:'#92400E'}},
                  React.createElement('strong',null,'⚠ Why are some rows unmatched? '),
                  'The "Test Name" in your CSV must exactly match the "Test Name" in the exam schedule. Red rows will be skipped — you can still manually update them using the ✏️ Edit button on the tracker.'
                ),

                // Action buttons
                React.createElement('div',{style:{display:'flex',justifyContent:'flex-end',gap:'10px'}},
                  React.createElement('button',{onClick:onClose,style:btnStyle('#F3F4F6','#374151')},'Cancel'),
                  matchedCount > 0 && React.createElement('button',{
                    onClick:handleSave, disabled:saving,
                    style:btnStyle(saving?'#9CA3AF':'linear-gradient(135deg,#059669,#047857)','#fff',{opacity:saving?0.8:1})
                  }, saving ? '⏳ Saving…' : '✅ Upload '+matchedCount+' Records')
                )
              )
            )
      )
    );
  }

  // ─────────────────────────────────────────────────────────
  // SCHOOL MULTI-SELECT
  // ─────────────────────────────────────────────────────────
  function SchoolMultiSelect({ schools, selected, onChange }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
      function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
      document.addEventListener('mousedown', h);
      return () => document.removeEventListener('mousedown', h);
    }, []);
    const allSel = selected.length === 0 || selected.length === schools.length;
    const label = selected.length === 0 ? '🏫 All Schools'
      : selected.length === 1 ? selected[0]
      : `${selected.length} schools selected`;
    return React.createElement('div',{ref,style:{position:'relative',minWidth:'190px'}},
      React.createElement('button',{onClick:()=>setOpen(!open),style:{width:'100%',padding:'9px 12px',
        border:'1.5px solid #BFDBFE',borderRadius:'9px',background:'#EFF6FF',cursor:'pointer',
        display:'flex',alignItems:'center',justifyContent:'space-between',
        fontSize:'13px',fontWeight:'600',color:'#1D4ED8',gap:'8px'}},
        React.createElement('span',null,label),
        React.createElement('span',{style:{fontSize:'10px'}},open?'▲':'▼')
      ),
      open && React.createElement('div',{style:{position:'absolute',top:'calc(100% + 6px)',left:0,zIndex:9999,
        background:'#fff',border:'1px solid #E5E7EB',borderRadius:'12px',
        boxShadow:'0 8px 30px rgba(0,0,0,0.15)',minWidth:'220px',maxHeight:'320px',overflowY:'auto',padding:'6px'}},
        React.createElement('div',{onClick:()=>onChange([]),style:{display:'flex',alignItems:'center',gap:'10px',
          padding:'9px 12px',borderRadius:'8px',cursor:'pointer',background:allSel?'#EFF6FF':'transparent',marginBottom:'2px'}},
          React.createElement('div',{style:{width:'18px',height:'18px',borderRadius:'4px',flexShrink:0,
            border:'2px solid '+(allSel?'#1D4ED8':'#D1D5DB'),background:allSel?'#1D4ED8':'#fff',
            display:'flex',alignItems:'center',justifyContent:'center'}},
            allSel&&React.createElement('span',{style:{color:'#fff',fontSize:'11px',fontWeight:'800'}},'✓')),
          React.createElement('span',{style:{fontSize:'13px',fontWeight:'700',color:'#1D4ED8'}},'🏫 All Schools')
        ),
        React.createElement('div',{style:{height:'1px',background:'#F3F4F6',margin:'4px 0'}}),
        schools.map(sc=>{
          const chk = selected.includes(sc);
          return React.createElement('div',{key:sc,onClick:()=>onChange(chk?selected.filter(s=>s!==sc):[...selected,sc]),
            style:{display:'flex',alignItems:'center',gap:'10px',padding:'8px 12px',borderRadius:'8px',
              cursor:'pointer',background:chk?'#F0F9FF':'transparent'}},
            React.createElement('div',{style:{width:'18px',height:'18px',borderRadius:'4px',flexShrink:0,
              border:'2px solid '+(chk?'#1D4ED8':'#D1D5DB'),background:chk?'#1D4ED8':'#fff',
              display:'flex',alignItems:'center',justifyContent:'center'}},
              chk&&React.createElement('span',{style:{color:'#fff',fontSize:'11px',fontWeight:'800'}},'✓')),
            React.createElement('span',{style:{fontSize:'13px',color:'#374151'}},sc)
          );
        })
      )
    );
  }

  // ─────────────────────────────────────────────────────────
  // BULK ACTION BAR  (admin / manager only)
  // ─────────────────────────────────────────────────────────
  function BulkActionBar({ count, selectedSchools, allSchools, onHide, onClear }) {
    const label = selectedSchools.length===0?'all schools'
      : selectedSchools.length===1?selectedSchools[0]
      : `${selectedSchools.length} schools`;
    return React.createElement('div',{style:{position:'fixed',bottom:'24px',left:'50%',transform:'translateX(-50%)',
      background:'#1a1a2e',color:'#fff',borderRadius:'14px',padding:'14px 22px',zIndex:9000,
      display:'flex',alignItems:'center',gap:'16px',boxShadow:'0 8px 32px rgba(0,0,0,0.35)',whiteSpace:'nowrap'}},
      React.createElement('span',{style:{fontSize:'14px',fontWeight:'600'}},`${count} exam${count!==1?'s':''} selected`),
      React.createElement('div',{style:{width:'1px',height:'24px',background:'rgba(255,255,255,0.2)'}}),
      React.createElement('button',{onClick:onHide,style:{background:'#DC2626',color:'#fff',border:'none',
        borderRadius:'8px',padding:'8px 14px',fontSize:'13px',fontWeight:'700',cursor:'pointer',
        display:'flex',alignItems:'center',gap:'6px'}},
        '🚫 Hide for ', React.createElement('strong',null,label)
      ),
      React.createElement('button',{onClick:onClear,style:{background:'rgba(255,255,255,0.15)',color:'#fff',
        border:'none',borderRadius:'8px',padding:'8px 12px',fontSize:'13px',cursor:'pointer'}},
        '✕ Clear')
    );
  }

  // ─────────────────────────────────────────────────────────
  // CONDUCT UPDATE MODAL
  // ─────────────────────────────────────────────────────────
  function ConductModal({ exam, conduct, school, onSave, onClose }) {
    const [status,       setStatus]       = useState(conduct?.status       || 'conducted');
    const [mode,         setMode]         = useState(conduct?.mode         || 'Offline');
    const [participants, setParticipants] = useState(conduct?.participants != null ? String(conduct.participants) : '');
    const [avgScore,     setAvgScore]     = useState(conduct?.avgScore     != null ? String(conduct.avgScore)     : '');
    const [topScore,     setTopScore]     = useState(conduct?.topScore     != null ? String(conduct.topScore)     : '');
    const [avgPhysics,   setAvgPhysics]   = useState(conduct?.avgPhysics   != null ? String(conduct.avgPhysics)   : '');
    const [avgChemistry, setAvgChemistry] = useState(conduct?.avgChemistry != null ? String(conduct.avgChemistry) : '');
    const [avgMaths,     setAvgMaths]     = useState(conduct?.avgMaths     != null ? String(conduct.avgMaths)     : '');
    const [avgBiology,   setAvgBiology]   = useState(conduct?.avgBiology   != null ? String(conduct.avgBiology)   : '');
    const [notes,        setNotes]        = useState(conduct?.notes        || '');
    const [saving,       setSaving]       = useState(false);

    const save = async () => {
      setSaving(true);
      try {
        await onSave({status,mode,
          participants:participants!==''?Number(participants):null,
          avgScore:avgScore!==''?Number(avgScore):null,
          topScore:topScore!==''?Number(topScore):null,
          avgPhysics:avgPhysics!==''?Number(avgPhysics):null,
          avgChemistry:avgChemistry!==''?Number(avgChemistry):null,
          avgMaths:avgMaths!==''?Number(avgMaths):null,
          avgBiology:avgBiology!==''?Number(avgBiology):null,
          notes});
        onClose();
      } catch { alert('Save failed. Try again.'); setSaving(false); }
    };
    const inp = {padding:'9px 11px',border:'1.5px solid #E5E7EB',borderRadius:'10px',fontSize:'14px',
      outline:'none',boxSizing:'border-box',width:'100%',fontFamily:'inherit',
      background:status==='missed'?'#F9FAFB':'#fff'};

    return React.createElement('div',{style:{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:10000,
      display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'},onClick:onClose},
      React.createElement('div',{onClick:e=>e.stopPropagation(),style:{background:'#fff',borderRadius:'20px',
        width:'100%',maxWidth:'480px',padding:'26px',boxShadow:'0 20px 60px rgba(0,0,0,0.25)',maxHeight:'92vh',overflowY:'auto'}},
        React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'18px'}},
          React.createElement('div',null,
            React.createElement('div',{style:{fontSize:'11px',color:'#6B7280',fontWeight:'700',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'3px'}},fmtDate(exam.date)+' · '+school),
            React.createElement('h3',{style:{fontSize:'16px',fontWeight:'700',color:'#1F2937',marginBottom:'6px',lineHeight:'1.3'}},exam.testName),
            React.createElement('div',{style:{display:'flex',gap:'6px',flexWrap:'wrap'}},
              pill('G'+exam.grade,'#EEF2FF','#4F46E5','#C7D2FE'),
              pill(exam.stream,'#F0FDF4','#15803D','#BBF7D0'),
              pill(exam.format,'#FEF3C7','#92400E','#FDE68A'),
            )
          ),
          React.createElement('button',{onClick:onClose,style:{background:'#F3F4F6',border:'none',borderRadius:'50%',width:'34px',height:'34px',cursor:'pointer',fontSize:'18px',color:'#6B7280'}},'×')
        ),

        React.createElement('p',{style:{fontSize:'12px',fontWeight:'700',color:'#374151',marginBottom:'8px'}},'Exam Status'),
        React.createElement('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',marginBottom:'16px'}},
          ['conducted','partial','missed'].map(s=>{
            const c=S[s]; const active=status===s;
            return React.createElement('button',{key:s,onClick:()=>setStatus(s),style:{padding:'10px 4px',
              border:`2px solid ${active?c.c:'#E5E7EB'}`,borderRadius:'12px',background:active?c.bg:'#fff',cursor:'pointer',textAlign:'center'}},
              React.createElement('div',{style:{fontSize:'18px',marginBottom:'3px'}},c.e),
              React.createElement('div',{style:{fontSize:'12px',fontWeight:active?'700':'500',color:active?c.c:'#6B7280'}},c.label)
            );
          })
        ),

        React.createElement('p',{style:{fontSize:'12px',fontWeight:'700',color:'#374151',marginBottom:'8px'}},'Exam Mode'),
        React.createElement('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'16px'}},
          [['Online','🌐','#1D4ED8','#EFF6FF'],['Offline','📄','#6D28D9','#F5F3FF']].map(([m,ic,ac,bg])=>{
            const active=mode===m;
            return React.createElement('button',{key:m,onClick:()=>setMode(m),style:{padding:'10px',
              border:`2px solid ${active?ac:'#E5E7EB'}`,borderRadius:'12px',background:active?bg:'#fff',
              cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}},
              React.createElement('span',{style:{fontSize:'18px'}},ic),
              React.createElement('span',{style:{fontSize:'13px',fontWeight:active?'700':'500',color:active?ac:'#6B7280'}},m)
            );
          })
        ),

        status!=='missed' && React.createElement('div',null,
          React.createElement('p',{style:{fontSize:'12px',fontWeight:'700',color:'#374151',marginBottom:'8px'}},'Results'),
          React.createElement('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px',marginBottom:'10px'}},
            [['👥 Students present',participants,setParticipants,'e.g. 28'],
             ['📊 Avg score (%)',    avgScore,   setAvgScore,   'e.g. 64'],
             ['🏆 Top score (%)',    topScore,   setTopScore,   'e.g. 89']
            ].map(([lbl,val,set,ph])=>
              React.createElement('div',{key:lbl},
                React.createElement('label',{style:{fontSize:'11px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}},lbl),
                React.createElement('input',{type:'number',min:'0',max:'200',value:val,placeholder:ph,onChange:e=>set(e.target.value),style:inp})
              )
            )
          ),
          React.createElement('p',{style:{fontSize:'12px',fontWeight:'700',color:'#374151',marginBottom:'8px'}},'Subject Avg Accuracy (%)'),
          React.createElement('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginBottom:'14px'}},
            [['⚛️ Physics',   avgPhysics,   setAvgPhysics,   'e.g. 72', exam.stream!=='Medical'],
             ['🧪 Chemistry', avgChemistry, setAvgChemistry, 'e.g. 68', true],
             ['📐 Maths',     avgMaths,     setAvgMaths,     'e.g. 75', exam.stream!=='Medical'],
             ['🧬 Biology',   avgBiology,   setAvgBiology,   'e.g. 70', exam.stream==='Medical'],
            ].filter(([,,,,show])=>show).map(([lbl,val,set,ph])=>
              React.createElement('div',{key:lbl},
                React.createElement('label',{style:{fontSize:'11px',fontWeight:'600',color:'#374151',display:'block',marginBottom:'5px'}},lbl),
                React.createElement('input',{type:'number',min:'0',max:'100',step:'0.1',value:val,placeholder:ph,onChange:e=>set(e.target.value),style:inp})
              )
            )
          )
        ),

        React.createElement('div',{style:{marginBottom:'20px'}},
          React.createElement('label',{style:{fontSize:'12px',fontWeight:'700',color:'#374151',display:'block',marginBottom:'6px'}},'📝 Notes'),
          React.createElement('textarea',{value:notes,onChange:e=>setNotes(e.target.value),placeholder:'Any remarks…',rows:3,style:{...inp,resize:'vertical'}})
        ),

        React.createElement('button',{onClick:save,disabled:saving,style:{width:'100%',padding:'13px',
          background:saving?'#9CA3AF':'linear-gradient(135deg,#F4B41A,#E8A219)',
          color:'#fff',border:'none',borderRadius:'12px',fontSize:'15px',fontWeight:'700',cursor:saving?'default':'pointer'}},
          saving?'⏳ Saving…':'💾 Save Exam Record')
      )
    );
  }

  // ─────────────────────────────────────────────────────────
  // SCHEDULE ADD / EDIT MODAL  (super_admin / director)
  // ─────────────────────────────────────────────────────────
  function ScheduleModal({ exam, onSave, onClose }) {
    const blank = {date:'',grade:'11',stream:'Engineering',testName:'',format:'MT',purpose:'Monthly Test'};
    const [form,setForm] = useState(exam?{...exam}:blank);
    const [saving,setSaving] = useState(false);
    const set = (k,v)=>setForm(p=>({...p,[k]:v}));
    const save = async()=>{
      if(!form.date||!form.testName.trim()){alert('Date and Test Name required.');return;}
      setSaving(true);
      try{
        const id=form.id||uid();
        await getDb().collection('examSchedule').doc(id).set({...form,id},{merge:true});
        onSave({...form,id}); onClose();
      }catch{alert('Save failed.');setSaving(false);}
    };
    const lbl={fontSize:'12px',fontWeight:'700',color:'#374151',display:'block',marginBottom:'5px'};
    const inp={width:'100%',padding:'9px 11px',border:'1.5px solid #E5E7EB',borderRadius:'10px',fontSize:'13px',outline:'none',boxSizing:'border-box',fontFamily:'inherit'};
    return React.createElement('div',{style:{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:10001,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'},onClick:onClose},
      React.createElement('div',{onClick:e=>e.stopPropagation(),style:{background:'#fff',borderRadius:'20px',width:'100%',maxWidth:'500px',padding:'26px',boxShadow:'0 20px 60px rgba(0,0,0,0.3)',maxHeight:'92vh',overflowY:'auto'}},
        React.createElement('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}},
          React.createElement('h3',{style:{fontSize:'17px',fontWeight:'700',color:'#1F2937'}},exam?.id?'✏️ Edit Exam':'➕ Add Exam to Schedule'),
          React.createElement('button',{onClick:onClose,style:{background:'#F3F4F6',border:'none',borderRadius:'50%',width:'34px',height:'34px',cursor:'pointer',fontSize:'18px',color:'#6B7280'}},'×')
        ),
        React.createElement('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'14px'}},
          React.createElement('div',null,React.createElement('label',{style:lbl},'Date *'),React.createElement('input',{type:'date',value:form.date,onChange:e=>set('date',e.target.value),style:inp})),
          React.createElement('div',null,React.createElement('label',{style:lbl},'Grade'),
            React.createElement('select',{value:form.grade,onChange:e=>set('grade',e.target.value),style:{...inp,background:'#F9FAFB'}},
              ['6','7','8','9','10','11','12'].map(g=>React.createElement('option',{key:g,value:g},'Grade '+g)))),
          React.createElement('div',null,React.createElement('label',{style:lbl},'Stream'),
            React.createElement('select',{value:form.stream,onChange:e=>set('stream',e.target.value),style:{...inp,background:'#F9FAFB'}},
              STREAMS.map(s=>React.createElement('option',{key:s,value:s},s)))),
          React.createElement('div',null,React.createElement('label',{style:lbl},'Format'),
            React.createElement('select',{value:form.format,onChange:e=>set('format',e.target.value),style:{...inp,background:'#F9FAFB'}},
              FORMATS.map(f=>React.createElement('option',{key:f,value:f},f))))
        ),
        React.createElement('div',{style:{marginBottom:'14px'}},
          React.createElement('label',{style:lbl},'Test Name *'),
          React.createElement('input',{type:'text',value:form.testName,placeholder:'e.g. AIET-09-G11-PCM',onChange:e=>set('testName',e.target.value),style:inp})
        ),
        React.createElement('div',{style:{marginBottom:'22px'}},
          React.createElement('label',{style:lbl},'Purpose'),
          React.createElement('select',{value:form.purpose,onChange:e=>set('purpose',e.target.value),style:{...inp,background:'#F9FAFB'}},
            PURPOSES.map(p=>React.createElement('option',{key:p,value:p},p)))
        ),
        React.createElement('div',{style:{display:'flex',gap:'10px'}},
          React.createElement('button',{onClick:onClose,style:{flex:1,padding:'12px',background:'#F3F4F6',border:'none',borderRadius:'12px',fontSize:'14px',fontWeight:'600',cursor:'pointer',color:'#374151'}},'Cancel'),
          React.createElement('button',{onClick:save,disabled:saving,style:{flex:2,padding:'12px',background:saving?'#9CA3AF':'linear-gradient(135deg,#1a1a2e,#2d2d4e)',color:'#fff',border:'none',borderRadius:'12px',fontSize:'14px',fontWeight:'700',cursor:saving?'default':'pointer'}},saving?'⏳ Saving…':exam?.id?'✏️ Update':'➕ Add Exam')
        )
      )
    );
  }

  // ─────────────────────────────────────────────────────────
  // DELETE / HIDE CONFIRM
  // ─────────────────────────────────────────────────────────
  function DeleteConfirm({ exams, schools, isGlobal, onConfirm, onClose }) {
    const [busy,setBusy] = useState(false);
    const count = exams.length;
    const schoolLabel = schools.length===1?schools[0]:`${schools.length} schools`;

    const confirm = async()=>{
      setBusy(true);
      try{
        if(isGlobal){
          // FIX: delete from examSchedule AND record in deletedExamIds so seed is filtered on reload
          await Promise.all(exams.map(e=>getDb().collection('examSchedule').doc(e.id).delete()));
          // Persist deleted seed IDs so they stay gone after refresh
          const deletedIds = exams.map(e=>e.id);
          const ref = getDb().collection('system').doc('deletedExamIds');
          const snap = await ref.get();
          const existing = snap.exists ? (snap.data().ids||[]) : [];
          const merged = Array.from(new Set([...existing,...deletedIds]));
          await ref.set({ids:merged},{merge:true});
        } else {
          const batch = getDb().batch();
          for(const sc of schools){
            for(const e of exams){
              batch.set(getDb().collection('examConduct').doc(`${sc}_${e.id}`),
                {school:sc,examId:e.id,excluded:true,excludedAt:new Date().toISOString()},{merge:true});
            }
          }
          await batch.commit();
        }
        onConfirm(exams.map(e=>e.id),schools,isGlobal);
        onClose();
      }catch(err){alert('Failed: '+err.message);setBusy(false);}
    };

    return React.createElement('div',{style:{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:10002,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px'},onClick:onClose},
      React.createElement('div',{onClick:e=>e.stopPropagation(),style:{background:'#fff',borderRadius:'20px',width:'100%',maxWidth:'420px',padding:'26px',boxShadow:'0 20px 60px rgba(0,0,0,0.3)',textAlign:'center'}},
        React.createElement('div',{style:{fontSize:'40px',marginBottom:'12px'}},isGlobal?'🗑️':'🚫'),
        React.createElement('h3',{style:{fontSize:'17px',fontWeight:'700',color:'#1F2937',marginBottom:'10px'}},
          isGlobal?`Delete ${count} exam${count!==1?'s':''} globally?`:`Hide ${count} exam${count!==1?'s':''} for ${schoolLabel}?`),
        React.createElement('div',{style:{background:'#F9FAFB',borderRadius:'10px',padding:'10px 14px',marginBottom:'14px',textAlign:'left',maxHeight:'140px',overflowY:'auto'}},
          exams.slice(0,8).map(e=>React.createElement('div',{key:e.id,style:{fontSize:'12px',color:'#374151',padding:'3px 0',borderBottom:'1px solid #F3F4F6'}},
            React.createElement('span',{style:{fontWeight:'600'}},e.testName),
            React.createElement('span',{style:{color:'#9CA3AF',marginLeft:'6px'}},fmtDate(e.date))
          )),
          exams.length>8&&React.createElement('div',{style:{fontSize:'12px',color:'#9CA3AF',marginTop:'4px'}},`+${exams.length-8} more…`)
        ),
        isGlobal
          ? React.createElement('p',{style:{fontSize:'12px',color:'#EF4444',marginBottom:'18px',fontWeight:'600'}},
              '⚠️ Removes exam from schedule for ALL schools permanently.')
          : React.createElement('p',{style:{fontSize:'12px',color:'#6B7280',marginBottom:'18px'}},
              `Will be marked as "N/A" for ${schoolLabel} only. Other schools unaffected. Can restore anytime.`),
        React.createElement('div',{style:{display:'flex',gap:'10px'}},
          React.createElement('button',{onClick:onClose,style:{flex:1,padding:'12px',background:'#F3F4F6',border:'none',borderRadius:'12px',fontSize:'14px',fontWeight:'600',cursor:'pointer',color:'#374151'}},'Cancel'),
          React.createElement('button',{disabled:busy,onClick:confirm,style:{flex:2,padding:'12px',background:busy?'#9CA3AF':isGlobal?'#DC2626':'#F59E0B',color:'#fff',border:'none',borderRadius:'12px',fontSize:'14px',fontWeight:'700',cursor:busy?'default':'pointer'}},
            busy?'⏳ Working…':isGlobal?'🗑️ Delete Globally':'🚫 Hide for School(s)')
        )
      )
    );
  }

  // ─────────────────────────────────────────────────────────
  // TABLE ROW
  // ─────────────────────────────────────────────────────────
  function ExamRow({ exam, cond, checked, onCheck, onUpdate, onEditSchedule, onDeleteSchedule, onRestore, canManage, canHide, school }) {
    const sk = sKey(cond, exam.date);
    const scfg = S[sk];
    const isExcluded = sk==='excluded';
    const needsUpdate = new Date(exam.date)<new Date() && sk==='unset';
    const stm = {Engineering:{bg:'#FFF7ED',c:'#C2410C'},Medical:{bg:'#F0FDF4',c:'#15803D'},Foundation:{bg:'#F5F3FF',c:'#7C3AED'}};
    const sc = stm[exam.stream]||{bg:'#F3F4F6',c:'#374151'};
    const rowBg = isExcluded?'#F9FAFB': checked?'#EFF6FF': needsUpdate?'#FFFBEB':'#fff';

    return React.createElement('tr',{style:{background:rowBg,borderBottom:'1px solid #F3F4F6',verticalAlign:'middle',opacity:isExcluded?.55:1}},
      // Checkbox — only for admin/managers who can hide
      React.createElement('td',{style:{padding:'10px 8px',textAlign:'center',width:'36px'}},
        canHide && !isExcluded && React.createElement('input',{type:'checkbox',checked,
          onChange:e=>onCheck(exam.id,e.target.checked),
          style:{width:'16px',height:'16px',cursor:'pointer',accentColor:'#1D4ED8'}})
      ),
      React.createElement('td',{style:{padding:'11px 10px',whiteSpace:'nowrap',fontSize:'13px',color:'#374151',fontWeight:'600'}},fmtDate(exam.date)),
      React.createElement('td',{style:{padding:'11px 8px',textAlign:'center'}},pill('G'+exam.grade,'#EEF2FF','#4F46E5','#C7D2FE')),
      React.createElement('td',{style:{padding:'11px 8px'}},pill(exam.stream,sc.bg,sc.c)),
      React.createElement('td',{style:{padding:'11px 10px'}},
        React.createElement('div',{style:{fontWeight:'600',fontSize:'13px',color:isExcluded?'#9CA3AF':'#1F2937'}},exam.testName),
        React.createElement('div',{style:{fontSize:'11px',color:'#9CA3AF',marginTop:'2px'}},exam.format+' · '+exam.purpose)
      ),
      React.createElement('td',{style:{padding:'11px 8px',textAlign:'center'}},pill(scfg.e+' '+scfg.label,scfg.bg,scfg.c,scfg.b)),
      React.createElement('td',{style:{padding:'11px 8px',textAlign:'center'}},!isExcluded&&React.createElement(ModePill,{mode:cond?.mode||null})),
      React.createElement('td',{style:{padding:'11px 8px',textAlign:'center'}},
        !isExcluded && cond?.participants!=null
          ? (function(){
              const total = getTotal(school, exam.grade);
              const pct   = total ? Math.round(cond.participants/total*100) : null;
              const color = pct==null?'#374151':pct>=80?'#059669':pct>=60?'#D97706':'#DC2626';
              return React.createElement('div',{style:{display:'flex',flexDirection:'column',alignItems:'center',gap:'2px'}},
                React.createElement('span',{style:{fontWeight:'700',fontSize:'13px',color:'#1F2937'}},
                  total ? cond.participants+' / '+total : cond.participants),
                pct!=null&&React.createElement('span',{style:{fontSize:'11px',fontWeight:'700',color}},pct+'%')
              );
            })()
          : React.createElement('span',{style:{color:'#D1D5DB',fontSize:'13px'}},'—')
      ),
      React.createElement('td',{style:{padding:'11px 8px',textAlign:'center'}},
        !isExcluded&&cond?.avgScore!=null
          ? React.createElement('div',{style:{display:'flex',flexDirection:'column',alignItems:'center'}},
              React.createElement('span',{style:{fontWeight:'700',fontSize:'13px',color:cond.avgScore>=70?'#059669':cond.avgScore>=50?'#D97706':'#DC2626'}},cond.avgScore+'%'),
              cond.topScore!=null&&React.createElement('span',{style:{fontSize:'11px',color:'#9CA3AF'}},'Top: '+cond.topScore+'%')
            )
          : React.createElement('span',{style:{color:'#D1D5DB',fontSize:'13px'}},'—')
      ),
      // Subject Avg column
      React.createElement('td',{style:{padding:'8px',textAlign:'center',minWidth:'130px'}},
        !isExcluded && (cond?.avgPhysics!=null||cond?.avgChemistry!=null||cond?.avgMaths!=null||cond?.avgBiology!=null)
          ? React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:'3px',alignItems:'center'}},
              ...[
                cond.avgPhysics   != null ? ['P', cond.avgPhysics,   '#1D4ED8','#DBEAFE'] : null,
                cond.avgChemistry != null ? ['C', cond.avgChemistry, '#7C3AED','#EDE9FE'] : null,
                cond.avgMaths     != null ? ['M', cond.avgMaths,     '#0F766E','#CCFBF1'] : null,
                cond.avgBiology   != null ? ['B', cond.avgBiology,   '#15803D','#DCFCE7'] : null,
              ].filter(Boolean).map(([subj,val,color,bg])=>
                React.createElement('div',{key:subj,style:{display:'flex',alignItems:'center',gap:'5px'}},
                  React.createElement('span',{style:{background:bg,color,fontSize:'10px',fontWeight:'800',
                    padding:'1px 5px',borderRadius:'4px',minWidth:'16px',textAlign:'center'}},subj),
                  React.createElement('span',{style:{fontSize:'12px',fontWeight:'700',
                    color:val>=70?'#059669':val>=50?'#D97706':'#DC2626'}},val+'%')
                )
              )
            )
          : React.createElement('span',{style:{color:'#D1D5DB',fontSize:'12px'}},'—')
      ),
      React.createElement('td',{style:{padding:'11px 8px',maxWidth:'110px'}},
        cond?.notes&&!isExcluded
          ? React.createElement('span',{title:cond.notes,style:{fontSize:'12px',color:'#6B7280',display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'100px'}},cond.notes)
          : React.createElement('span',{style:{color:'#E5E7EB',fontSize:'12px'}},'—')
      ),
      // Action column — Edit for everyone, Restore only for canHide
      React.createElement('td',{style:{padding:'11px 8px',textAlign:'center'}},
        !isExcluded && React.createElement('button',{onClick:()=>onUpdate(exam),style:{
          background:needsUpdate?'linear-gradient(135deg,#F59E0B,#D97706)':'linear-gradient(135deg,#6366F1,#4F46E5)',
          color:'#fff',border:'none',borderRadius:'7px',padding:'6px 11px',fontSize:'11px',fontWeight:'600',cursor:'pointer'}},
          needsUpdate?'⚠️ Update':'✏️ Edit'),
        // Restore — only visible to admins/managers
        isExcluded && canHide && React.createElement('button',{onClick:()=>onRestore(exam),
          style:{background:'#F0FDF4',color:'#15803D',border:'1px solid #BBF7D0',borderRadius:'7px',padding:'6px 10px',fontSize:'11px',fontWeight:'600',cursor:'pointer'}},
          '↩ Restore')
      ),
      // Schedule edit/delete — super_admin / director only
      canManage && React.createElement('td',{style:{padding:'11px 8px',textAlign:'center'}},
        React.createElement('div',{style:{display:'flex',gap:'4px',justifyContent:'center'}},
          React.createElement('button',{onClick:()=>onEditSchedule(exam),title:'Edit schedule entry',style:{background:'#F3F4F6',border:'none',borderRadius:'7px',padding:'6px 9px',fontSize:'13px',cursor:'pointer'}},'🖊'),
          React.createElement('button',{onClick:()=>onDeleteSchedule(exam),title:'Delete from schedule (all schools)',style:{background:'#FEF2F2',border:'none',borderRadius:'7px',padding:'6px 9px',fontSize:'13px',cursor:'pointer'}},'🗑')
        )
      )
    );
  }

  // ─────────────────────────────────────────────────────────
  // SCHOOL SUMMARY TABLE  (managers / admins only)
  // Matrix view: rows = exams, columns = schools, cells = status
  // ─────────────────────────────────────────────────────────
  function SchoolSummaryTable({ exams, conductMap, allSchools }) {
    const [sgGrade,  setSgGrade]  = useState('All');
    const [sgStream, setSgStream] = useState('All');
    const [sgSearch, setSgSearch] = useState('');

    const gOpts = useMemo(()=>['All',...Array.from(new Set(exams.map(e=>e.grade))).sort((a,b)=>Number(a)-Number(b))],[exams]);
    const sOpts = useMemo(()=>['All',...Array.from(new Set(exams.map(e=>e.stream))).sort()],[exams]);

    const rows = useMemo(()=>exams.filter(e=>{
      if(sgGrade!=='All'&&e.grade!==sgGrade) return false;
      if(sgStream!=='All'&&e.stream!==sgStream) return false;
      if(sgSearch){const q=sgSearch.toLowerCase();if(!e.testName.toLowerCase().includes(q)) return false;}
      return true;
    }),[exams,sgGrade,sgStream,sgSearch]);

    const CELL = {
      conducted:{ bg:'#DCFCE7', c:'#15803D', b:'#86EFAC', label:'Conducted' },
      partial:  { bg:'#FEF9C3', c:'#854D0E', b:'#FDE047', label:'Partial'   },
      missed:   { bg:'#FEE2E2', c:'#B91C1C', b:'#FCA5A5', label:'Missed'    },
      upcoming: { bg:'#EEF2FF', c:'#3730A3', b:'#A5B4FC', label:'Upcoming'  },
      unset:    { bg:'#FFF7ED', c:'#C2410C', b:'#FDBA74', label:'Pending'   },
      excluded: { bg:'#F3F4F6', c:'#9CA3AF', b:'#D1D5DB', label:'N/A'       },
    };
    const selInp = {padding:'7px 10px',border:'1.5px solid rgba(255,255,255,0.25)',borderRadius:'8px',fontSize:'12px',background:'rgba(255,255,255,0.1)',color:'#fff',cursor:'pointer',outline:'none'};

    return React.createElement('div',{style:{background:'#fff',borderRadius:'14px',boxShadow:'0 2px 10px rgba(0,0,0,0.07)',marginBottom:'20px',overflow:'hidden'}},

      // Card header
      React.createElement('div',{style:{padding:'14px 18px',borderBottom:'1px solid rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'10px',background:'linear-gradient(135deg,#1a1a2e,#16213e)'}},
        React.createElement('div',null,
          React.createElement('div',{style:{fontWeight:'800',fontSize:'15px',color:'#fff'}},'🏫 School-wise Status Overview'),
          React.createElement('div',{style:{fontSize:'12px',color:'rgba(255,255,255,0.5)',marginTop:'2px'}},
            rows.length+' exam'+(rows.length!==1?'s':'')+' × '+allSchools.length+' school'+(allSchools.length!==1?'s':''))
        ),
        React.createElement('div',{style:{display:'flex',gap:'8px',flexWrap:'wrap',alignItems:'center'}},

          // Exam search input
          React.createElement('div',{style:{position:'relative'}},
            React.createElement('span',{style:{position:'absolute',left:'9px',top:'50%',transform:'translateY(-50%)',fontSize:'13px',opacity:'.7'}},'🔍'),
            React.createElement('input',{type:'text',value:sgSearch,onChange:e=>setSgSearch(e.target.value),
              placeholder:'Search exam…',
              style:{padding:'7px 10px 7px 30px',border:'1.5px solid rgba(255,255,255,0.25)',borderRadius:'8px',
                fontSize:'12px',background:'rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.9)',outline:'none',width:'160px'}})
          ),

          React.createElement('select',{value:sgGrade, onChange:e=>setSgGrade(e.target.value), style:selInp},
            gOpts.map(o=>React.createElement('option',{key:o,value:o,style:{background:'#1a1a2e',color:'#fff'}},o==='All'?'All Grades':'Grade '+o))),
          React.createElement('select',{value:sgStream,onChange:e=>setSgStream(e.target.value),style:selInp},
            sOpts.map(o=>React.createElement('option',{key:o,value:o,style:{background:'#1a1a2e',color:'#fff'}},o==='All'?'All Streams':o))),
          React.createElement('button',{onClick:()=>{setSgGrade('All');setSgStream('All');setSgSearch('');},title:'Reset filters',
            style:{padding:'7px 11px',background:'rgba(255,255,255,0.12)',border:'1px solid rgba(255,255,255,0.2)',borderRadius:'8px',fontSize:'12px',cursor:'pointer',color:'rgba(255,255,255,0.8)',fontWeight:'600'}},'↺')
        )
      ),

      // Scrollable matrix table
      React.createElement('div',{style:{overflowX:'auto'}},
        React.createElement('table',{style:{width:'100%',borderCollapse:'collapse',minWidth:(280+allSchools.length*140)+'px'}},
          React.createElement('thead',null,
            React.createElement('tr',{style:{background:'#F8FAFC'}},
              React.createElement('th',{style:{padding:'11px 16px',textAlign:'left',fontSize:'11px',fontWeight:'700',color:'#6B7280',textTransform:'uppercase',letterSpacing:'.05em',borderBottom:'2px solid #E5E7EB',minWidth:'270px',position:'sticky',left:0,background:'#F8FAFC',zIndex:2,boxShadow:'2px 0 4px rgba(0,0,0,0.04)'}},'Exam'),
              ...allSchools.map(sc=>React.createElement('th',{key:sc,style:{padding:'11px 10px',textAlign:'center',fontSize:'11px',fontWeight:'700',color:'#374151',textTransform:'uppercase',letterSpacing:'.04em',borderBottom:'2px solid #E5E7EB',minWidth:'130px',whiteSpace:'nowrap'}},sc))
            )
          ),
          React.createElement('tbody',null,
            rows.length===0
              ? React.createElement('tr',null,React.createElement('td',{colSpan:allSchools.length+1,style:{padding:'48px',textAlign:'center',color:'#9CA3AF',fontSize:'14px'}},'No exams match the selected filters'))
              : rows.map((exam,i)=>{
                  const rowBg = i%2===0?'#fff':'#FAFAFA';
                  return React.createElement('tr',{key:exam.id,style:{borderBottom:'1px solid #F3F4F6'}},
                    // Sticky exam info cell
                    React.createElement('td',{style:{padding:'10px 16px',position:'sticky',left:0,background:rowBg,zIndex:1,borderRight:'1px solid #E5E7EB',boxShadow:'2px 0 4px rgba(0,0,0,0.03)'}},
                      React.createElement('div',{style:{fontWeight:'700',fontSize:'12px',color:'#111827',marginBottom:'4px',lineHeight:'1.3'}},exam.testName),
                      React.createElement('div',{style:{display:'flex',gap:'5px',flexWrap:'wrap',alignItems:'center'}},
                        React.createElement('span',{style:{background:'#EFF6FF',color:'#1D4ED8',borderRadius:'4px',padding:'1px 7px',fontSize:'10px',fontWeight:'700',border:'1px solid #BFDBFE'}},'G'+exam.grade),
                        React.createElement('span',{style:{background:'#F5F3FF',color:'#6D28D9',borderRadius:'4px',padding:'1px 7px',fontSize:'10px',fontWeight:'700',border:'1px solid #DDD6FE'}},exam.stream),
                        React.createElement('span',{style:{color:'#9CA3AF',fontSize:'10px',fontWeight:'500'}},fmtDate(exam.date))
                      )
                    ),
                    // Status cell per school
                    ...allSchools.map(sc=>{
                      const cond = conductMap[sc+'_'+exam.id];
                      const key  = sKey(cond, exam.date);
                      const cfg  = CELL[key]||CELL.unset;
                      return React.createElement('td',{key:sc,style:{padding:'8px 6px',textAlign:'center',background:rowBg}},
                        React.createElement('span',{style:{
                          display:'inline-block',background:cfg.bg,color:cfg.c,
                          border:'1px solid '+cfg.b,borderRadius:'6px',
                          padding:'4px 11px',fontSize:'11px',fontWeight:'700',whiteSpace:'nowrap',
                        }},cfg.label)
                      );
                    })
                  );
                })
          )
        )
      ),

      // Legend footer
      React.createElement('div',{style:{padding:'10px 16px',background:'#F9FAFB',borderTop:'1px solid #F3F4F6',display:'flex',gap:'8px',flexWrap:'wrap',alignItems:'center'}},
        React.createElement('span',{style:{fontSize:'11px',color:'#9CA3AF',fontWeight:'600',marginRight:'2px'}},'Legend:'),
        ...Object.entries(CELL).map(([k,v])=>
          React.createElement('span',{key:k,style:{background:v.bg,color:v.c,border:'1px solid '+v.b,borderRadius:'5px',padding:'2px 9px',fontSize:'10px',fontWeight:'700'}},v.label)
        )
      )
    );
  }

  // ─────────────────────────────────────────────────────────
  // MAIN COMPONENT
  // ─────────────────────────────────────────────────────────
  function ExamConductTracker({ currentUser, isAdmin, accessibleSchools }) {
    const school = currentUser?.school || '';
    const role   = currentUser?.role   || '';
    const isSA   = role==='super_admin' || currentUser?.email==='admin@avantifellows.org' || currentUser?.isSuperAdmin;
    const isDir  = role==='director' || role==='assoc_director';

    // canManage = can add/edit/delete the schedule (super_admin + director only)
    const canManage = isAdmin && (isSA || isDir);
    // canHide = can hide/restore exams per school (all managers + admins, NOT teachers)
    const canHide   = isAdmin;
    // canCSV = bulk CSV upload (super_admin only)
    const canCSV    = isSA;

    const allSchools = accessibleSchools || (school ? [school] : []);

    const [exams,       setExams]      = useState(SEED);
    const [conductMap,  setConductMap] = useState({});
    const [loading,     setLoading]    = useState(true);
    const [selSchools,  setSelSchools] = useState([]);
    const [selExamIds,  setSelExamIds] = useState(new Set());
    const [fGrade,  setFGrade]  = useState('All');
    const [fStream, setFStream] = useState('All');
    const [fMonth,  setFMonth]  = useState('All');
    const [fStatus, setFStatus] = useState('All');
    const [fMode,   setFMode]   = useState('All');
    const [search,  setSearch]  = useState('');
    const [conductModal,  setConductModal]  = useState(null);
    const [scheduleModal, setScheduleModal] = useState(null);
    const [deleteModal,   setDeleteModal]   = useState(null);
    const [csvModal,      setCSVModal]      = useState(false);
    const [resultsModal,  setResultsModal]  = useState(false);
    const [showSummary,   setShowSummary]   = useState(true);

    const primarySchool = useMemo(()=>
      selSchools.length===1?selSchools[0]:(selSchools[0]||school||allSchools[0]||''),
    [selSchools,school,allSchools]);

    // ── load schedule + conduct + deleted IDs ────────────
    useEffect(()=>{
      setLoading(true);

      // Load deleted exam IDs first, then schedule
      getDb().collection('system').doc('deletedExamIds').get()
        .then(snap=>{
          const deleted = snap.exists ? (snap.data().ids||[]) : [];
          return getDb().collection('examSchedule').get()
            .then(schedSnap=>{
              if(schedSnap.docs.length>0){
                setExams(sortExams(schedSnap.docs
                  .map(d=>({id:d.id,...d.data()}))
                  .filter(e=>!deleted.includes(e.id))));
              } else {
                setExams(sortExams(SEED.filter(e=>!deleted.includes(e.id))));
              }
            });
        })
        .catch(()=>{});

      const toLoad = isAdmin ? allSchools : [school];
      Promise.all(toLoad.map(sc=>
        getDb().collection('examConduct').where('school','==',sc).get()
          .then(snap=>snap.docs.map(d=>({id:d.id,...d.data()})))
          .catch(()=>[])
      )).then(res=>{
        const map={}; res.flat().forEach(r=>{map[r.id]=r;});
        setConductMap(map); setLoading(false);
      });
    },[school,isAdmin,allSchools.join(',')]);

    // ── save conduct ─────────────────────────────────────
    const saveConductRecord = useCallback(async(exam,data)=>{
      const sc=primarySchool; if(!sc) throw new Error('No school selected');
      const docId=`${sc}_${exam.id}`;
      const payload={...data,school:sc,examId:exam.id,examName:exam.testName,
        examDate:exam.date,grade:exam.grade,stream:exam.stream,excluded:false,
        updatedBy:currentUser?.name||currentUser?.email||'Unknown',
        updatedAt:new Date().toISOString()};
      await getDb().collection('examConduct').doc(docId).set(payload,{merge:true});
      setConductMap(prev=>({...prev,[docId]:{id:docId,...payload}}));
    },[primarySchool,currentUser]);

    // ── schedule saved (add/edit) ────────────────────────
    const onScheduleSaved = useCallback(exam=>{
      setExams(prev=>{
        const idx=prev.findIndex(e=>e.id===exam.id);
        if(idx>=0){const c=[...prev];c[idx]=exam;return c;}
        return sortExams([...prev, exam]);
      });
    },[]);

    // ── CSV uploaded ─────────────────────────────────────
    const onCSVSaved = useCallback(newExams=>{
      setExams(prev=>{
        const map={}; prev.forEach(e=>{map[e.id]=e;});
        newExams.forEach(e=>{map[e.id]=e;});
        return sortExams(Object.values(map));
      });
    },[]);

    // ── delete confirmed ─────────────────────────────────
    const onDeleteConfirmed = useCallback((examIds,schools,isGlobal)=>{
      if(isGlobal){
        setExams(prev=>prev.filter(e=>!examIds.includes(e.id)));
      } else {
        const updates={};
        for(const sc of schools) for(const id of examIds){
          const docId=`${sc}_${id}`;
          updates[docId]={...(conductMap[docId]||{}),id:docId,school:sc,examId:id,excluded:true};
        }
        setConductMap(prev=>({...prev,...updates}));
      }
      setSelExamIds(new Set());
    },[conductMap]);

    // ── restore exam for a school ────────────────────────
    const restoreExam = useCallback(async(exam)=>{
      const sc=primarySchool||school;
      const docId=`${sc}_${exam.id}`;
      await getDb().collection('examConduct').doc(docId).set({excluded:false},{merge:true});
      setConductMap(prev=>({...prev,[docId]:{...(prev[docId]||{}),excluded:false}}));
    },[primarySchool,school]);

    // ── checkbox helpers ─────────────────────────────────
    const toggleExam = useCallback((id,checked)=>{
      setSelExamIds(prev=>{const n=new Set(prev);checked?n.add(id):n.delete(id);return n;});
    },[]);
    const toggleAllExams = useCallback(filteredExams=>{
      if(selExamIds.size===filteredExams.length) setSelExamIds(new Set());
      else setSelExamIds(new Set(filteredExams.map(e=>e.id)));
    },[selExamIds]);

    const gradeOpts  = useMemo(()=>['All',...Array.from(new Set(exams.map(e=>e.grade))).sort((a,b)=>Number(a)-Number(b))],[exams]);
    const streamOpts = useMemo(()=>['All',...Array.from(new Set(exams.map(e=>e.stream))).sort()],[exams]);
    const monthOpts  = useMemo(()=>['All',...Array.from(new Set(exams.map(e=>monthLbl(e.date)).filter(Boolean)))],[exams]);

    const filtered = useMemo(()=>{
      const sc=primarySchool||school;
      const result = exams.filter(e=>{
        if(fGrade!=='All'&&e.grade!==fGrade)   return false;
        if(fStream!=='All'&&e.stream!==fStream) return false;
        if(fMonth!=='All'&&monthLbl(e.date)!==fMonth) return false;
        if(search){const q=search.toLowerCase();
          if(!e.testName.toLowerCase().includes(q)&&!e.stream.toLowerCase().includes(q)&&
             !e.grade.includes(q)&&!e.format.toLowerCase().includes(q)) return false;}
        const cond=conductMap[`${sc}_${e.id}`];
        if(fMode!=='All'&&(!cond||cond.mode!==fMode)) return false;
        if(fStatus!=='All'){
          const k=sKey(cond,e.date);
          if(fStatus==='pending'   &&!['unset','upcoming'].includes(k)) return false;
          if(fStatus==='conducted' &&k!=='conducted') return false;
          if(fStatus==='missed'    &&k!=='missed')    return false;
          if(fStatus==='partial'   &&k!=='partial')   return false;
          if(fStatus==='excluded'  &&k!=='excluded')  return false;
        }
        return true;
      });
      return sortExams(result);
    },[exams,fGrade,fStream,fMonth,fStatus,fMode,search,conductMap,primarySchool,school]);

    const stats = useMemo(()=>{
      const sc=primarySchool||school;
      // N/A exams don't apply to this school — exclude from all counts
      const activeExams = exams.filter(e=>{ const c=conductMap[`${sc}_${e.id}`]; return !(c&&c.excluded); });
      const past = activeExams.filter(e=>new Date(e.date)<new Date());
      let conducted=0,missed=0,partial=0,online=0,offline=0,totalScore=0,scoreCount=0;
      let totPhy=0,cntPhy=0,totChe=0,cntChe=0,totMat=0,cntMat=0,totBio=0,cntBio=0;
      past.forEach(e=>{
        const c=conductMap[`${sc}_${e.id}`]; if(!c) return;
        if(c.status==='conducted') conducted++;
        if(c.status==='missed')   missed++;
        if(c.status==='partial')  partial++;
        if(c.mode==='Online')     online++;
        if(c.mode==='Offline')    offline++;
        if(c.avgScore    !=null){totalScore+=c.avgScore;    scoreCount++;}
        if(c.avgPhysics  !=null){totPhy+=c.avgPhysics;   cntPhy++;}
        if(c.avgChemistry!=null){totChe+=c.avgChemistry; cntChe++;}
        if(c.avgMaths    !=null){totMat+=c.avgMaths;     cntMat++;}
        if(c.avgBiology  !=null){totBio+=c.avgBiology;   cntBio++;}
      });
      return{total:activeExams.length,past:past.length,conducted,missed,
             pending:past.length-conducted-missed-partial,online,offline,
             avgScore:   scoreCount>0?Math.round(totalScore/scoreCount):null,
             avgPhysics:   cntPhy>0?Math.round(totPhy/cntPhy*10)/10:null,
             avgChemistry: cntChe>0?Math.round(totChe/cntChe*10)/10:null,
             avgMaths:     cntMat>0?Math.round(totMat/cntMat*10)/10:null,
             avgBiology:   cntBio>0?Math.round(totBio/cntBio*10)/10:null,
      };
    },[exams,conductMap,primarySchool,school]);

    const selExamArr      = exams.filter(e=>selExamIds.has(e.id));
    const schoolsForHide  = selSchools.length>0 ? selSchools : allSchools;
    const conductDocId    = conductModal?`${primarySchool||school}_${conductModal.id}`:null;
    const selInp = {padding:'9px 11px',border:'1.5px solid #E5E7EB',borderRadius:'9px',fontSize:'13px',background:'#F9FAFB',cursor:'pointer',outline:'none'};

    return React.createElement('div',{style:{minHeight:'100vh',background:'#F8FAFC',paddingBottom:'80px'}},

      // Header
      React.createElement('div',{style:{background:'linear-gradient(135deg,#1a1a2e,#16213e)',padding:'22px 24px 18px',color:'#fff',marginBottom:'22px'}},
        React.createElement('div',{style:{maxWidth:'1300px',margin:'0 auto',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'12px'}},
          React.createElement('div',null,
            React.createElement('h1',{style:{fontSize:'23px',fontWeight:'800',marginBottom:'4px'}},'📋 Exam Conduct Tracker'),
            React.createElement('p',{style:{color:'rgba(255,255,255,0.65)',fontSize:'13px'}},
              isAdmin?(selSchools.length===0?`${allSchools.length} schools accessible`:selSchools.length===1?`Viewing: ${selSchools[0]}`:`Viewing ${selSchools.length} schools`):`Tracking exams for ${school}`)
          ),
          React.createElement('div',{style:{display:'flex',gap:'10px',flexWrap:'wrap'}},
            // Results Bulk Upload — admin + manager
            isAdmin && React.createElement('button',{onClick:()=>setResultsModal(true),style:{
              background:'rgba(16,185,129,0.2)',color:'#6EE7B7',border:'1px solid rgba(110,231,183,0.4)',
              borderRadius:'10px',padding:'10px 16px',fontSize:'13px',fontWeight:'600',cursor:'pointer'}},
              '📊 Upload Results'),
            // CSV Upload — super_admin only
            canCSV && React.createElement('button',{onClick:()=>setCSVModal(true),style:{
              background:'rgba(255,255,255,0.15)',color:'#fff',border:'1px solid rgba(255,255,255,0.3)',
              borderRadius:'10px',padding:'10px 16px',fontSize:'13px',fontWeight:'600',cursor:'pointer'}},
              '📤 Bulk Upload CSV'),
            // Add exam — super_admin / director
            canManage && React.createElement('button',{onClick:()=>setScheduleModal(true),style:{
              background:'linear-gradient(135deg,#F4B41A,#E8A219)',color:'#fff',border:'none',
              borderRadius:'10px',padding:'10px 18px',fontSize:'13px',fontWeight:'700',cursor:'pointer',
              boxShadow:'0 4px 12px rgba(244,180,26,0.4)'}},
              '➕ Add Exam')
          )
        )
      ),

      React.createElement('div',{style:{maxWidth:'1300px',margin:'0 auto',padding:'0 16px'}},

        // Stats — row 1: conduct summary
        React.createElement('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:'12px',marginBottom:'12px'}},
          React.createElement(StatCard,{label:'Total Exams',value:stats.total, emoji:'📅',color:'#6366F1',sub:`${stats.past} past`}),
          React.createElement(StatCard,{label:'Conducted',  value:stats.conducted,emoji:'✅',color:'#10B981',sub:stats.past>0?`${Math.round(stats.conducted/stats.past*100)}% rate`:''}),
          React.createElement(StatCard,{label:'Not Updated',value:stats.pending,  emoji:'⏳',color:'#F59E0B',sub:'need review'}),
          React.createElement(StatCard,{label:'Missed',     value:stats.missed,   emoji:'❌',color:'#EF4444'}),
          React.createElement(StatCard,{label:'Online',     value:stats.online,   emoji:'🌐',color:'#1D4ED8',sub:'conducted online'}),
          React.createElement(StatCard,{label:'Offline',    value:stats.offline,  emoji:'📄',color:'#6D28D9',sub:'conducted offline'}),
          React.createElement(StatCard,{label:'Avg Score',  value:stats.avgScore!=null?stats.avgScore+'%':'—',emoji:'📊',color:'#3B82F6',sub:'across conducted'}),
        ),

        // Stats — row 2: subject averages (only shown when data exists)
        (stats.avgPhysics!=null||stats.avgChemistry!=null||stats.avgMaths!=null||stats.avgBiology!=null) &&
        React.createElement('div',{style:{marginBottom:'22px'}},
          React.createElement('div',{style:{fontSize:'11px',fontWeight:'700',color:'#9CA3AF',textTransform:'uppercase',letterSpacing:'.06em',marginBottom:'8px',paddingLeft:'2px'}},'Subject Avg Accuracy (across conducted exams)'),
          React.createElement('div',{style:{display:'flex',gap:'12px',flexWrap:'wrap'}},
            ...[
              stats.avgPhysics   !=null ? {label:'Physics',   val:stats.avgPhysics,   color:'#1D4ED8', bg:'#EFF6FF', border:'#BFDBFE', emoji:'⚛️'} : null,
              stats.avgChemistry !=null ? {label:'Chemistry', val:stats.avgChemistry, color:'#7C3AED', bg:'#F5F3FF', border:'#DDD6FE', emoji:'🧪'} : null,
              stats.avgMaths     !=null ? {label:'Maths',     val:stats.avgMaths,     color:'#0F766E', bg:'#F0FDFA', border:'#99F6E4', emoji:'📐'} : null,
              stats.avgBiology   !=null ? {label:'Biology',   val:stats.avgBiology,   color:'#15803D', bg:'#F0FDF4', border:'#BBF7D0', emoji:'🌿'} : null,
            ].filter(Boolean).map(s=>{
              const scoreColor = s.val>=70?'#059669':s.val>=50?'#D97706':'#DC2626';
              return React.createElement('div',{key:s.label,style:{
                background:s.bg, border:`1.5px solid ${s.border}`, borderRadius:'14px',
                padding:'14px 20px', display:'flex', alignItems:'center', gap:'14px',
                boxShadow:'0 2px 8px rgba(0,0,0,0.05)', flex:'1', minWidth:'160px',
              }},
                React.createElement('div',{style:{fontSize:'28px'}},s.emoji),
                React.createElement('div',null,
                  React.createElement('div',{style:{fontSize:'24px',fontWeight:'800',color:scoreColor,lineHeight:'1.1'}},s.val+'%'),
                  React.createElement('div',{style:{fontSize:'12px',fontWeight:'700',color:s.color,marginTop:'2px'}},'Avg '+s.label),
                  React.createElement('div',{style:{fontSize:'11px',color:'#9CA3AF'}},'accuracy')
                )
              );
            })
          )
        ),

        // School Summary Table — managers / admins only
        isAdmin && allSchools.length > 1 && React.createElement('div',{style:{marginBottom:'4px'}},
          React.createElement('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}},
            React.createElement('div',{style:{fontSize:'12px',color:'#6B7280',fontWeight:'600',textTransform:'uppercase',letterSpacing:'.06em'}},'School Overview'),
            React.createElement('button',{
              onClick:()=>setShowSummary(v=>!v),
              style:{padding:'5px 12px',background:'#F3F4F6',border:'1px solid #E5E7EB',borderRadius:'7px',fontSize:'12px',cursor:'pointer',color:'#374151',fontWeight:'600',display:'flex',alignItems:'center',gap:'5px'}
            }, showSummary ? '▲ Hide' : '▼ Show')
          ),
          showSummary && React.createElement(SchoolSummaryTable,{
            exams,
            conductMap,
            allSchools,
          })
        ),

        // Filters
        React.createElement('div',{style:{background:'#fff',borderRadius:'14px',padding:'16px',boxShadow:'0 2px 10px rgba(0,0,0,0.07)',marginBottom:'16px'}},
          React.createElement('div',{style:{display:'flex',flexWrap:'wrap',gap:'10px',alignItems:'center'}},
            isAdmin&&allSchools.length>1&&React.createElement(SchoolMultiSelect,{schools:allSchools,selected:selSchools,onChange:setSelSchools}),
            React.createElement('div',{style:{flex:'1',minWidth:'170px',position:'relative'}},
              React.createElement('span',{style:{position:'absolute',left:'11px',top:'50%',transform:'translateY(-50%)',fontSize:'14px'}},'🔍'),
              React.createElement('input',{type:'text',value:search,onChange:e=>setSearch(e.target.value),placeholder:'Search exam…',
                style:{width:'100%',padding:'9px 11px 9px 34px',border:'1.5px solid #E5E7EB',borderRadius:'9px',fontSize:'13px',outline:'none',boxSizing:'border-box'}})
            ),
            React.createElement('select',{value:fMonth, onChange:e=>setFMonth(e.target.value), style:{...selInp,minWidth:'115px'}},monthOpts.map(o=>React.createElement('option',{key:o,value:o},o==='All'?'All Months':o))),
            React.createElement('select',{value:fGrade, onChange:e=>setFGrade(e.target.value), style:{...selInp,minWidth:'110px'}},gradeOpts.map(o=>React.createElement('option',{key:o,value:o},o==='All'?'All Grades':'Grade '+o))),
            React.createElement('select',{value:fStream,onChange:e=>setFStream(e.target.value),style:{...selInp,minWidth:'120px'}},streamOpts.map(o=>React.createElement('option',{key:o,value:o},o==='All'?'All Streams':o))),
            React.createElement('select',{value:fStatus,onChange:e=>setFStatus(e.target.value),style:{...selInp,minWidth:'140px'}},
              [['All','All Statuses'],['conducted','✅ Conducted'],['partial','⚠️ Partial'],
               ['missed','❌ Missed'],['pending','⏳ Not Updated'],['excluded','🚫 Hidden']].map(([v,l])=>React.createElement('option',{key:v,value:v},l))),
            React.createElement('select',{value:fMode,  onChange:e=>setFMode(e.target.value),  style:{...selInp,minWidth:'125px'}},
              [['All','All Modes'],['Online','🌐 Online'],['Offline','📄 Offline']].map(([v,l])=>React.createElement('option',{key:v,value:v},l))),
            React.createElement('button',{onClick:()=>{setFGrade('All');setFStream('All');setFMonth('All');setFStatus('All');setFMode('All');setSearch('');},
              style:{padding:'9px 13px',background:'#F3F4F6',border:'none',borderRadius:'9px',fontSize:'12px',cursor:'pointer',fontWeight:'600',color:'#6B7280'}},'↺ Reset')
          ),
          React.createElement('div',{style:{marginTop:'10px',fontSize:'12px',color:'#9CA3AF'}},`Showing ${filtered.length} of ${stats.total} active exams`)
        ),

        // Table
        loading
          ? React.createElement('div',{style:{textAlign:'center',padding:'80px',color:'#9CA3AF',fontSize:'15px'}},'⏳ Loading…')
          : React.createElement('div',{style:{background:'#fff',borderRadius:'14px',boxShadow:'0 2px 10px rgba(0,0,0,0.07)',overflow:'hidden'}},
              React.createElement('div',{style:{overflowX:'auto'}},
                React.createElement('table',{style:{width:'100%',borderCollapse:'collapse',minWidth:canManage?'1280px':'1140px'}},
                  React.createElement('thead',null,
                    React.createElement('tr',{style:{background:'linear-gradient(135deg,#1a1a2e,#16213e)',color:'#fff'}},
                      React.createElement('th',{style:{padding:'12px 8px',width:'36px'}},
                        canHide && React.createElement('input',{type:'checkbox',
                          checked:filtered.length>0&&selExamIds.size===filtered.filter(e=>sKey(conductMap[`${primarySchool||school}_${e.id}`],e.date)!=='excluded').length&&filtered.filter(e=>sKey(conductMap[`${primarySchool||school}_${e.id}`],e.date)!=='excluded').length>0,
                          onChange:()=>toggleAllExams(filtered.filter(e=>sKey(conductMap[`${primarySchool||school}_${e.id}`],e.date)!=='excluded')),
                          style:{width:'16px',height:'16px',cursor:'pointer',accentColor:'#F4B41A'}})
                      ),
                      ['Date','Grade','Stream','Test Name','Status','Mode','Students','Avg Score','Subject Avg','Notes','Update',
                       ...(canManage?['Schedule']:[])
                      ].map(h=>React.createElement('th',{key:h,style:{padding:'12px 10px',
                        textAlign:['Grade','Status','Mode','Students','Avg Score','Subject Avg','Update','Schedule'].includes(h)?'center':'left',
                        fontSize:'11px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'.05em',whiteSpace:'nowrap'}},h))
                    )
                  ),
                  React.createElement('tbody',null,
                    filtered.length===0
                      ? React.createElement('tr',null,React.createElement('td',{colSpan:canManage?13:12,style:{padding:'60px',textAlign:'center',color:'#9CA3AF',fontSize:'15px'}},'📭 No exams match your filters'))
                      : filtered.map(exam=>{
                          const sc=primarySchool||school;
                          return React.createElement(ExamRow,{
                            key:exam.id,exam,
                            cond:conductMap[`${sc}_${exam.id}`]||null,
                            checked:selExamIds.has(exam.id),
                            onCheck:toggleExam,
                            onUpdate:setConductModal,
                            onEditSchedule:setScheduleModal,
                            onDeleteSchedule:e=>setDeleteModal({exams:[e],schools:allSchools,isGlobal:true}),
                            onRestore:restoreExam,
                            canManage,
                            canHide,
                            school: sc,
                          });
                        })
                  )
                )
              ),
              React.createElement('div',{style:{padding:'11px 16px',background:'#F9FAFB',borderTop:'1px solid #F3F4F6',display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:'8px'}},
                React.createElement('span',{style:{fontSize:'12px',color:'#9CA3AF'}},'⚠️ Yellow = past exams needing update · Dimmed = hidden for this school'),
                React.createElement('span',{style:{fontSize:'12px',color:'#9CA3AF'}},'Refreshed: '+new Date().toLocaleTimeString('en-IN'))
              )
            ),

        // Legend
        React.createElement('div',{style:{marginTop:'14px',display:'flex',gap:'8px',flexWrap:'wrap'}},
          Object.values(S).map(s=>pill(s.e+' '+s.label,s.bg,s.c,s.b)),
          pill('🌐 Online','#EFF6FF','#1D4ED8','#BFDBFE'),
          pill('📄 Offline','#F5F3FF','#6D28D9','#DDD6FE'),
        )
      ),

      // Bulk action bar — only for canHide users
      canHide && selExamIds.size>0 && React.createElement(BulkActionBar,{
        count:selExamIds.size,
        selectedSchools:schoolsForHide,
        allSchools,
        onHide:()=>setDeleteModal({exams:selExamArr,schools:schoolsForHide,isGlobal:false}),
        onClear:()=>setSelExamIds(new Set()),
      }),

      // Modals
      conductModal && React.createElement(ConductModal,{
        exam:conductModal,conduct:conductMap[conductDocId]||null,
        school:primarySchool||school,
        onClose:()=>setConductModal(null),
        onSave:data=>saveConductRecord(conductModal,data),
      }),
      scheduleModal && React.createElement(ScheduleModal,{
        exam:scheduleModal===true?null:scheduleModal,
        onClose:()=>setScheduleModal(null),onSave:onScheduleSaved,
      }),
      deleteModal && React.createElement(DeleteConfirm,{
        exams:deleteModal.exams,schools:deleteModal.schools,isGlobal:deleteModal.isGlobal,
        onClose:()=>setDeleteModal(null),onConfirm:onDeleteConfirmed,
      }),
      csvModal && React.createElement(CSVUploadModal,{
        onClose:()=>setCSVModal(false),onSaved:onCSVSaved,
      }),
      resultsModal && React.createElement(ResultsBulkUploadModal,{
        exams,
        currentUser,
        onClose:()=>setResultsModal(false),
        onSaved:(matched)=>{
          // Immediately update conductMap so the tracker reflects the upload
          // without needing a full page refresh
          if (matched && matched.length > 0) {
            setConductMap(prev => {
              const updates = {};
              matched.forEach(r => {
                const exam  = r.matchedExam;
                const sc    = r.schoolName;
                const docId = sc + '_' + exam.id;
                updates[docId] = {
                  id:           docId,
                  school:       sc,
                  examId:       exam.id,
                  examName:     exam.testName,
                  examDate:     exam.date,
                  grade:        exam.grade,
                  stream:       exam.stream,
                  excluded:     false,
                  status:       'conducted',
                  mode:         r.mode || 'Offline',
                  participants: r.participants,
                  avgScore:     r.avgScore,
                  avgPhysics:   r.avgPhysics,
                  avgChemistry: r.avgChemistry,
                  avgMaths:     r.avgMaths,
                  avgBiology:   r.avgBiology,
                  notes:        '',
                };
              });
              return {...prev, ...updates};
            });
          }
          setResultsModal(false);
        },
      })
    );
  }

  window.ExamConductTracker = ExamConductTracker;
  console.log('✅ ExamConductTracker v4.5.0 loaded');

})();
