// ============================================================
// EXAM CONDUCT TRACKER - exam-tracker.js
// Version: 1.0.0 | Avanti Fellows Curriculum Tracker
// Add this file to your project root and reference it in
// index.html AFTER app.js loads.
//
// INTEGRATION STEPS (see bottom of this file for details):
//   1. Upload this file to your Vercel project root
//   2. Add <script src="/exam-tracker.js?v=1.0.0"></script>
//      in index.html, right before </body>
//   3. In app.js add nav item + tab render (see INTEGRATION
//      NOTES at the very end of this file)
// ============================================================

(function () {
  'use strict';

  const { useState, useEffect, useRef, useCallback, useMemo } = React;

  // ── Helpers ─────────────────────────────────────────────
  const getDb = () => (window._earlyDb || firebase.firestore());

  function fmtDate(dateStr) {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  }

  function monthLabel(dateStr) {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    } catch { return ''; }
  }

  // ── Master Exam Schedule (seeded from Avanti schedule) ───
  // Admin can edit / extend this via Firestore collection
  // 'examSchedule'. If collection is empty the JS seed is used.
  const SEED_EXAMS = [
    { id: 'e001', date: '2025-07-26', grade: '12', stream: 'Medical',      testName: 'AIET-01-G12-PCB',                          format: 'MT',         purpose: 'Monthly Test' },
    { id: 'e002', date: '2025-07-28', grade: '11', stream: 'Engineering',  testName: 'JNV-G11-BASELINE',                         format: 'MT',         purpose: 'Baseline' },
    { id: 'e003', date: '2025-08-06', grade: '11', stream: 'Engineering',  testName: 'AIET-01-G11-PCM',                          format: 'MT',         purpose: 'Monthly Test' },
    { id: 'e004', date: '2025-08-06', grade: '11', stream: 'Medical',      testName: 'AIET-01-G11-PCB',                          format: 'MT',         purpose: 'Monthly Test' },
    { id: 'e005', date: '2025-08-29', grade: '12', stream: 'Engineering',  testName: 'AIET-02-G12-PCM',                          format: 'MT',         purpose: 'Monthly Test' },
    { id: 'e006', date: '2025-08-29', grade: '12', stream: 'Medical',      testName: 'AIET-02-G12-PCB',                          format: 'MT',         purpose: 'Monthly Test' },
    { id: 'e007', date: '2025-08-29', grade: '11', stream: 'Engineering',  testName: 'AIET-02-G11-PCM',                          format: 'MT',         purpose: 'Monthly Test' },
    { id: 'e008', date: '2025-08-29', grade: '11', stream: 'Medical',      testName: 'AIET-02-G11-PCB',                          format: 'MT',         purpose: 'Monthly Test' },
    { id: 'e009', date: '2025-09-03', grade: '11', stream: 'Engineering',  testName: 'NVS-01 G11 JEE',                           format: 'MT',         purpose: 'Monthly Test' },
    { id: 'e010', date: '2025-09-03', grade: '11', stream: 'Medical',      testName: 'NVS-01 G11 NEET',                          format: 'MT',         purpose: 'Monthly Test' },
    { id: 'e011', date: '2025-09-03', grade: '12', stream: 'Engineering',  testName: 'NVS-01 G12 JEE',                           format: 'MT',         purpose: 'Monthly Test' },
    { id: 'e012', date: '2025-09-03', grade: '12', stream: 'Medical',      testName: 'NVS-01 G12 NEET',                          format: 'MT',         purpose: 'Monthly Test' },
    { id: 'e013', date: '2025-09-26', grade: '11', stream: 'Engineering',  testName: 'AIET-03-G11-PCM',                          format: 'MT',         purpose: 'Monthly Test' },
    { id: 'e014', date: '2025-09-26', grade: '11', stream: 'Medical',      testName: 'AIET-03-G11-PCB',                          format: 'MT',         purpose: 'Monthly Test' },
    { id: 'e015', date: '2025-09-26', grade: '12', stream: 'Engineering',  testName: 'AIET-03-G12-PCM',                          format: 'MT',         purpose: 'Monthly Test' },
    { id: 'e016', date: '2025-09-26', grade: '12', stream: 'Medical',      testName: 'AIET-03-G12-PCB',                          format: 'MT',         purpose: 'Monthly Test' },
    { id: 'e017', date: '2025-10-05', grade: '11', stream: 'Engineering',  testName: 'AIET 03 - G11 - PCM - ADVANCED PAPER',     format: 'Major Test', purpose: 'Monthly Test' },
    { id: 'e018', date: '2025-10-05', grade: '12', stream: 'Engineering',  testName: 'AIET 03 - G12 - PCM - ADVANCED PAPER',     format: 'Major Test', purpose: 'Monthly Test' },
    { id: 'e019', date: '2025-10-05', grade: '12', stream: 'Engineering',  testName: 'G12-CET-01-PCMA',                          format: 'Major Test', purpose: 'Monthly Test' },
    { id: 'e020', date: '2025-10-05', grade: '12', stream: 'Medical',      testName: 'G12-CET-01-PCB',                           format: 'Major Test', purpose: 'Monthly Test' },
    { id: 'e021', date: '2025-10-05', grade: '11', stream: 'Engineering',  testName: 'G11-CET-01-PCMA',                          format: 'Major Test', purpose: 'Monthly Test' },
    { id: 'e022', date: '2025-10-05', grade: '11', stream: 'Medical',      testName: 'G11-CET-01-PCB',                           format: 'Major Test', purpose: 'Monthly Test' },
    { id: 'e023', date: '2025-10-29', grade: '11', stream: 'Engineering',  testName: 'AIET-04-G11-PCM',                          format: 'MT',         purpose: 'Monthly Test' },
    { id: 'e024', date: '2025-10-29', grade: '11', stream: 'Medical',      testName: 'AIET-04-G11-PCB',                          format: 'MT',         purpose: 'Monthly Test' },
    { id: 'e025', date: '2025-10-29', grade: '12', stream: 'Engineering',  testName: 'AIET-04-G12-PCM',                          format: 'MT',         purpose: 'Monthly Test' },
    { id: 'e026', date: '2025-10-29', grade: '12', stream: 'Medical',      testName: 'AIET-04-G12-PCB',                          format: 'MT',         purpose: 'Monthly Test' },
    { id: 'e027', date: '2025-11-15', grade: '6',  stream: 'Foundation',   testName: 'Midline G06 Foundation 2025-26',            format: 'MT',         purpose: 'Midline' },
    { id: 'e028', date: '2025-11-15', grade: '7',  stream: 'Foundation',   testName: 'Midline G07 Foundation 2025-26',            format: 'MT',         purpose: 'Midline' },
    { id: 'e029', date: '2025-11-15', grade: '8',  stream: 'Foundation',   testName: 'Midline G08 Foundation 2025-26',            format: 'MT',         purpose: 'Midline' },
    { id: 'e030', date: '2025-11-15', grade: '9',  stream: 'Foundation',   testName: 'Midline G09 Foundation 2025-26',            format: 'MT',         purpose: 'Midline' },
    { id: 'e031', date: '2025-11-15', grade: '10', stream: 'Foundation',   testName: 'Midline G10 Foundation 2025-26',            format: 'MT',         purpose: 'Midline' },
    { id: 'e032', date: '2025-11-14', grade: '11', stream: 'Engineering',  testName: 'AIET-05-G11-PCM',                          format: 'Major Test', purpose: 'Monthly Test' },
    { id: 'e033', date: '2025-11-14', grade: '11', stream: 'Medical',      testName: 'AIET-05-G11-PCB',                          format: 'Major Test', purpose: 'Monthly Test' },
    { id: 'e034', date: '2025-11-14', grade: '12', stream: 'Engineering',  testName: 'AIET-05-G12-PCM',                          format: 'Major Test', purpose: 'Monthly Test' },
    { id: 'e035', date: '2025-11-14', grade: '12', stream: 'Medical',      testName: 'AIET-05-G12-PCB',                          format: 'Major Test', purpose: 'Monthly Test' },
    { id: 'e036', date: '2025-12-01', grade: '12', stream: 'Engineering',  testName: 'Mock-01-G12-PCM',                          format: 'Mock Test',  purpose: 'Practice Test' },
    { id: 'e037', date: '2025-12-01', grade: '12', stream: 'Medical',      testName: 'Mock-01-G12-PCB',                          format: 'Mock Test',  purpose: 'Practice Test' },
    { id: 'e038', date: '2025-12-28', grade: '11', stream: 'Engineering',  testName: 'AIET-06-G11-PCM',                          format: 'MT',         purpose: 'Monthly Test' },
    { id: 'e039', date: '2025-12-28', grade: '11', stream: 'Medical',      testName: 'AIET-06-G11-PCB',                          format: 'MT',         purpose: 'Monthly Test' },
    { id: 'e040', date: '2025-12-28', grade: '12', stream: 'Engineering',  testName: 'AIET-06-G12-PCM',                          format: 'MT',         purpose: 'Monthly Test' },
    { id: 'e041', date: '2025-12-28', grade: '12', stream: 'Medical',      testName: 'AIET-06-G12-PCB',                          format: 'MT',         purpose: 'Monthly Test' },
    { id: 'e042', date: '2026-01-25', grade: '11', stream: 'Engineering',  testName: 'AIET-07-G11-PCM',                          format: 'MT',         purpose: 'Monthly Test' },
    { id: 'e043', date: '2026-01-25', grade: '11', stream: 'Medical',      testName: 'AIET-07-G11-PCB',                          format: 'MT',         purpose: 'Monthly Test' },
    { id: 'e044', date: '2026-01-25', grade: '12', stream: 'Engineering',  testName: 'AIET-07-G12-PCM',                          format: 'MT',         purpose: 'Monthly Test' },
    { id: 'e045', date: '2026-01-25', grade: '12', stream: 'Medical',      testName: 'AIET-07-G12-PCB',                          format: 'MT',         purpose: 'Monthly Test' },
    { id: 'e046', date: '2026-02-22', grade: '11', stream: 'Engineering',  testName: 'AIET-08-G11-PCM',                          format: 'MT',         purpose: 'Monthly Test' },
    { id: 'e047', date: '2026-02-22', grade: '11', stream: 'Medical',      testName: 'AIET-08-G11-PCB',                          format: 'MT',         purpose: 'Monthly Test' },
    { id: 'e048', date: '2026-02-22', grade: '12', stream: 'Engineering',  testName: 'AIET-08-G12-PCM',                          format: 'MT',         purpose: 'Monthly Test' },
    { id: 'e049', date: '2026-02-22', grade: '12', stream: 'Medical',      testName: 'AIET-08-G12-PCB',                          format: 'MT',         purpose: 'Monthly Test' },
    { id: 'e050', date: '2026-03-22', grade: '12', stream: 'Engineering',  testName: 'Mock-02-G12-PCM (Pre-Final)',               format: 'Mock Test',  purpose: 'Practice Test' },
    { id: 'e051', date: '2026-03-22', grade: '12', stream: 'Medical',      testName: 'Mock-02-G12-PCB (Pre-Final)',               format: 'Mock Test',  purpose: 'Practice Test' },
  ];

  // ── Status config ────────────────────────────────────────
  const STATUS_CFG = {
    conducted:  { label: 'Conducted',   emoji: '✅', color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0' },
    partial:    { label: 'Partial',     emoji: '⚠️', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
    missed:     { label: 'Missed',      emoji: '❌', color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
    upcoming:   { label: 'Upcoming',    emoji: '🗓️', color: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE' },
    unset:      { label: 'Not Updated', emoji: '⏳', color: '#9CA3AF', bg: '#F9FAFB', border: '#E5E7EB' },
  };

  function getStatusKey(conduct, examDate) {
    if (!conduct) {
      return new Date(examDate) > new Date() ? 'upcoming' : 'unset';
    }
    return conduct.status || 'unset';
  }

  // ── Update Modal ─────────────────────────────────────────
  function ExamUpdateModal({ exam, conduct, onSave, onClose }) {
    const [status,      setStatus]      = useState(conduct?.status      || 'conducted');
    const [participants,setParticipants]= useState(conduct?.participants != null ? String(conduct.participants) : '');
    const [avgScore,    setAvgScore]    = useState(conduct?.avgScore     != null ? String(conduct.avgScore)     : '');
    const [topScore,    setTopScore]    = useState(conduct?.topScore     != null ? String(conduct.topScore)     : '');
    const [notes,       setNotes]       = useState(conduct?.notes       || '');
    const [saving,      setSaving]      = useState(false);

    const handleSave = async () => {
      setSaving(true);
      try {
        await onSave({
          status,
          participants: participants !== '' ? Number(participants) : null,
          avgScore:     avgScore     !== '' ? Number(avgScore)     : null,
          topScore:     topScore     !== '' ? Number(topScore)     : null,
          notes,
        });
        onClose();
      } catch (e) {
        alert('Failed to save. Please try again.');
        setSaving(false);
      }
    };

    const scfg = STATUS_CFG[status] || STATUS_CFG.unset;

    return React.createElement('div', {
      style: { position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:10000,
               display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' },
      onClick: onClose
    },
      React.createElement('div', {
        style: { background:'#fff', borderRadius:'20px', width:'100%', maxWidth:'480px',
                 padding:'28px', boxShadow:'0 20px 60px rgba(0,0,0,0.25)', maxHeight:'90vh', overflowY:'auto' },
        onClick: e => e.stopPropagation()
      },
        // Header
        React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'20px' } },
          React.createElement('div', null,
            React.createElement('div', { style:{ fontSize:'12px', color:'#6B7280', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'4px' } }, fmtDate(exam.date)),
            React.createElement('h3', { style:{ fontSize:'17px', fontWeight:'700', color:'#1F2937', lineHeight:'1.3', marginBottom:'6px' } }, exam.testName),
            React.createElement('div', { style:{ display:'flex', gap:'8px', flexWrap:'wrap' } },
              React.createElement('span', { style:{ background:'#EEF2FF', color:'#6366F1', padding:'2px 10px', borderRadius:'99px', fontSize:'12px', fontWeight:'600' } }, 'G' + exam.grade),
              React.createElement('span', { style:{ background:'#F0FDF4', color:'#16A34A', padding:'2px 10px', borderRadius:'99px', fontSize:'12px', fontWeight:'600' } }, exam.stream),
              React.createElement('span', { style:{ background:'#FEF3C7', color:'#92400E', padding:'2px 10px', borderRadius:'99px', fontSize:'12px', fontWeight:'600' } }, exam.format),
            )
          ),
          React.createElement('button', {
            onClick: onClose,
            style: { background:'#F3F4F6', border:'none', borderRadius:'50%', width:'36px', height:'36px',
                     cursor:'pointer', fontSize:'18px', color:'#6B7280', display:'flex', alignItems:'center', justifyContent:'center' }
          }, '×')
        ),

        // Status buttons
        React.createElement('div', { style:{ marginBottom:'20px' } },
          React.createElement('label', { style:{ fontSize:'13px', fontWeight:'700', color:'#374151', display:'block', marginBottom:'10px' } }, 'Exam Status'),
          React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px' } },
            ['conducted', 'partial', 'missed'].map(s => {
              const cfg = STATUS_CFG[s];
              const active = status === s;
              return React.createElement('button', {
                key: s,
                onClick: () => setStatus(s),
                style: {
                  padding:'10px 6px', border:`2px solid ${active ? cfg.color : '#E5E7EB'}`,
                  borderRadius:'12px', background: active ? cfg.bg : '#fff',
                  cursor:'pointer', transition:'all .15s', textAlign:'center'
                }
              },
                React.createElement('div', { style:{ fontSize:'20px', marginBottom:'3px' } }, cfg.emoji),
                React.createElement('div', { style:{ fontSize:'12px', fontWeight:active?'700':'500', color: active ? cfg.color : '#6B7280' } }, cfg.label)
              );
            })
          )
        ),

        // Numeric inputs
        React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px', marginBottom:'16px' } },
          [
            { label:'Students Present', value:participants, set:setParticipants, placeholder:'e.g. 28', icon:'👥' },
            { label:'Avg Score (%)',     value:avgScore,     set:setAvgScore,     placeholder:'e.g. 64',  icon:'📊' },
            { label:'Top Score (%)',     value:topScore,     set:setTopScore,     placeholder:'e.g. 89',  icon:'🏆' },
          ].map(({ label, value, set, placeholder, icon }) =>
            React.createElement('div', { key: label },
              React.createElement('label', { style:{ fontSize:'12px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'6px' } }, icon + ' ' + label),
              React.createElement('input', {
                type:'number', min:'0', max:'100',
                value, onChange: e => set(e.target.value),
                placeholder,
                style:{ width:'100%', padding:'10px 12px', border:'1.5px solid #E5E7EB', borderRadius:'10px',
                         fontSize:'14px', outline:'none', boxSizing:'border-box',
                         background: status==='missed' ? '#F9FAFB' : '#fff' },
                disabled: status === 'missed'
              })
            )
          )
        ),

        // Notes
        React.createElement('div', { style:{ marginBottom:'24px' } },
          React.createElement('label', { style:{ fontSize:'12px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'6px' } }, '📝 Notes / Remarks'),
          React.createElement('textarea', {
            value: notes,
            onChange: e => setNotes(e.target.value),
            placeholder: 'Any remarks about this exam (optional)…',
            rows: 3,
            style:{ width:'100%', padding:'10px 12px', border:'1.5px solid #E5E7EB', borderRadius:'10px',
                    fontSize:'14px', resize:'vertical', outline:'none', boxSizing:'border-box', fontFamily:'inherit' }
          })
        ),

        // Save button
        React.createElement('button', {
          onClick: handleSave,
          disabled: saving,
          style:{ width:'100%', padding:'14px', background: saving ? '#9CA3AF' : 'linear-gradient(135deg,#F4B41A,#E8A219)',
                  color:'#fff', border:'none', borderRadius:'12px', fontSize:'15px', fontWeight:'700',
                  cursor: saving ? 'default' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }
        },
          saving
            ? React.createElement('span', null, '⏳ Saving…')
            : React.createElement('span', null, '💾 Save Exam Record')
        )
      )
    );
  }

  // ── Summary Card ─────────────────────────────────────────
  function SummaryCard({ label, value, sub, color, emoji }) {
    return React.createElement('div', {
      style:{ background:'#fff', borderRadius:'16px', padding:'20px 18px',
              boxShadow:'0 2px 12px rgba(0,0,0,0.08)', borderLeft:`4px solid ${color}`,
              display:'flex', alignItems:'center', gap:'14px' }
    },
      React.createElement('div', { style:{ fontSize:'32px', lineHeight:'1' } }, emoji),
      React.createElement('div', null,
        React.createElement('div', { style:{ fontSize:'26px', fontWeight:'800', color, lineHeight:'1.1' } }, value),
        React.createElement('div', { style:{ fontSize:'13px', color:'#6B7280', fontWeight:'600', marginTop:'2px' } }, label),
        sub && React.createElement('div', { style:{ fontSize:'11px', color:'#9CA3AF', marginTop:'2px' } }, sub)
      )
    );
  }

  // ── Exam Row ─────────────────────────────────────────────
  function ExamRow({ exam, conduct, onEdit, isAPC }) {
    const statusKey = getStatusKey(conduct, exam.date);
    const scfg = STATUS_CFG[statusKey];
    const isPast = new Date(exam.date) < new Date();
    const needsUpdate = isPast && statusKey === 'unset';

    return React.createElement('tr', {
      style:{ background: needsUpdate ? '#FFFBEB' : '#fff',
              borderBottom:'1px solid #F3F4F6', transition:'background 0.15s' }
    },
      // Date
      React.createElement('td', { style:{ padding:'14px 12px', whiteSpace:'nowrap', fontSize:'13px', color:'#374151', fontWeight:'600' } },
        fmtDate(exam.date)
      ),
      // Grade
      React.createElement('td', { style:{ padding:'14px 8px', textAlign:'center' } },
        React.createElement('span', { style:{ background:'#EEF2FF', color:'#6366F1', padding:'3px 10px', borderRadius:'99px', fontSize:'12px', fontWeight:'700' } }, 'G' + exam.grade)
      ),
      // Stream
      React.createElement('td', { style:{ padding:'14px 8px' } },
        React.createElement('span', {
          style:{ background: exam.stream==='Engineering' ? '#FFF7ED' : exam.stream==='Medical' ? '#F0FDF4' : '#F5F3FF',
                  color:      exam.stream==='Engineering' ? '#C2410C'  : exam.stream==='Medical' ? '#15803D'  : '#7C3AED',
                  padding:'3px 10px', borderRadius:'99px', fontSize:'12px', fontWeight:'600' }
        }, exam.stream)
      ),
      // Test Name
      React.createElement('td', { style:{ padding:'14px 12px', maxWidth:'220px' } },
        React.createElement('div', { style:{ fontWeight:'600', fontSize:'13px', color:'#1F2937' } }, exam.testName),
        React.createElement('div', { style:{ fontSize:'11px', color:'#9CA3AF', marginTop:'2px' } }, exam.format + ' · ' + exam.purpose)
      ),
      // Status
      React.createElement('td', { style:{ padding:'14px 8px', textAlign:'center' } },
        React.createElement('span', {
          style:{ background: scfg.bg, color: scfg.color, border:`1px solid ${scfg.border}`,
                  padding:'4px 10px', borderRadius:'99px', fontSize:'12px', fontWeight:'600',
                  display:'inline-flex', alignItems:'center', gap:'4px', whiteSpace:'nowrap' }
        }, scfg.emoji + ' ' + scfg.label)
      ),
      // Participants
      React.createElement('td', { style:{ padding:'14px 8px', textAlign:'center', fontSize:'13px', color:'#374151', fontWeight:'600' } },
        conduct?.participants != null ? conduct.participants : React.createElement('span', { style:{ color:'#D1D5DB' } }, '—')
      ),
      // Avg Score
      React.createElement('td', { style:{ padding:'14px 8px', textAlign:'center' } },
        conduct?.avgScore != null
          ? React.createElement('div', { style:{ display:'flex', flexDirection:'column', alignItems:'center', gap:'2px' } },
              React.createElement('span', {
                style:{ fontWeight:'700', fontSize:'14px',
                        color: conduct.avgScore >= 70 ? '#10B981' : conduct.avgScore >= 50 ? '#F59E0B' : '#EF4444' }
              }, conduct.avgScore + '%'),
              conduct.topScore != null && React.createElement('span', { style:{ fontSize:'11px', color:'#9CA3AF' } }, 'Top: ' + conduct.topScore + '%')
            )
          : React.createElement('span', { style:{ color:'#D1D5DB', fontSize:'13px' } }, '—')
      ),
      // Notes
      React.createElement('td', { style:{ padding:'14px 8px', maxWidth:'140px' } },
        conduct?.notes
          ? React.createElement('span', { title: conduct.notes, style:{ fontSize:'12px', color:'#6B7280',
              display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'130px' } },
              conduct.notes)
          : React.createElement('span', { style:{ color:'#E5E7EB', fontSize:'12px' } }, '—')
      ),
      // Action
      React.createElement('td', { style:{ padding:'14px 10px', textAlign:'center' } },
        React.createElement('button', {
          onClick: () => onEdit(exam),
          style:{ background: needsUpdate ? 'linear-gradient(135deg,#F59E0B,#D97706)' : 'linear-gradient(135deg,#6366F1,#4F46E5)',
                  color:'#fff', border:'none', borderRadius:'8px', padding:'7px 14px',
                  fontSize:'12px', fontWeight:'600', cursor:'pointer', whiteSpace:'nowrap',
                  boxShadow:'0 2px 6px rgba(0,0,0,0.15)' }
        }, needsUpdate ? '⚠️ Update' : '✏️ Edit')
      )
    );
  }

  // ── Main Component ───────────────────────────────────────
  function ExamConductTracker({ currentUser, isAdmin, accessibleSchools }) {
    const school = currentUser?.school || '';
    const isAPC = currentUser?.role === 'apc' || currentUser?.role === 'training';
    const schools = accessibleSchools || [school];

    const [exams,        setExams]        = useState(SEED_EXAMS);
    const [conductMap,   setConductMap]   = useState({});   // key: school_examId
    const [filterGrade,  setFilterGrade]  = useState('All');
    const [filterStream, setFilterStream] = useState('All');
    const [filterMonth,  setFilterMonth]  = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [filterSchool, setFilterSchool] = useState(isAdmin ? 'All' : school);
    const [searchText,   setSearchText]   = useState('');
    const [editExam,     setEditExam]     = useState(null);
    const [loading,      setLoading]      = useState(true);
    const [saving,       setSaving]       = useState(false);

    // ── Load conduct data ──────────────────────────────────
    useEffect(() => {
      if (!school && !isAdmin) return;
      setLoading(true);
      const schoolsToLoad = isAdmin ? schools : [school];

      Promise.all(schoolsToLoad.map(sc =>
        getDb().collection('examConduct')
          .where('school', '==', sc)
          .get()
          .then(snap => snap.docs.map(d => ({ id: d.id, ...d.data() })))
          .catch(() => [])
      )).then(results => {
        const map = {};
        results.flat().forEach(rec => { map[rec.id] = rec; });
        setConductMap(map);
        setLoading(false);
      });

      // Also try to load custom exam schedule from Firestore
      getDb().collection('examSchedule').orderBy('date').get()
        .then(snap => {
          if (snap.docs.length > 0) {
            setExams(snap.docs.map(d => ({ id: d.id, ...d.data() })));
          }
        })
        .catch(() => {});
    }, [school, isAdmin]);

    // ── Save conduct data ──────────────────────────────────
    const handleSave = useCallback(async (exam, data) => {
      const sc = filterSchool !== 'All' ? filterSchool : school;
      const docId = `${sc}_${exam.id}`;
      const payload = {
        ...data,
        school: sc,
        examId: exam.id,
        examName: exam.testName,
        examDate: exam.date,
        grade: exam.grade,
        stream: exam.stream,
        updatedBy: currentUser?.name || currentUser?.email || 'Unknown',
        updatedAt: new Date().toISOString(),
      };
      await getDb().collection('examConduct').doc(docId).set(payload, { merge: true });
      setConductMap(prev => ({ ...prev, [docId]: { id: docId, ...payload } }));
    }, [school, filterSchool, currentUser]);

    // ── Derived filter options ─────────────────────────────
    const gradeOptions  = useMemo(() => ['All', ...Array.from(new Set(exams.map(e => e.grade))).sort((a,b)=>Number(a)-Number(b))], [exams]);
    const streamOptions = useMemo(() => ['All', ...Array.from(new Set(exams.map(e => e.stream))).sort()], [exams]);
    const monthOptions  = useMemo(() => {
      const months = Array.from(new Set(exams.map(e => monthLabel(e.date)))).filter(Boolean);
      return ['All', ...months];
    }, [exams]);

    // ── Filtered exams ─────────────────────────────────────
    const displaySchool = isAdmin && filterSchool !== 'All' ? filterSchool : school;

    const filteredExams = useMemo(() => {
      return exams.filter(e => {
        if (filterGrade  !== 'All' && e.grade  !== filterGrade)  return false;
        if (filterStream !== 'All' && e.stream !== filterStream) return false;
        if (filterMonth  !== 'All' && monthLabel(e.date) !== filterMonth) return false;
        if (searchText) {
          const q = searchText.toLowerCase();
          if (!e.testName.toLowerCase().includes(q) && !e.stream.toLowerCase().includes(q)) return false;
        }
        if (filterStatus !== 'All') {
          const sc = isAdmin && filterSchool !== 'All' ? filterSchool : school;
          const docId = `${sc}_${e.id}`;
          const cond = conductMap[docId];
          const key = getStatusKey(cond, e.date);
          if (filterStatus === 'pending'   && !['unset','upcoming'].includes(key)) return false;
          if (filterStatus === 'conducted' && key !== 'conducted') return false;
          if (filterStatus === 'missed'    && key !== 'missed')    return false;
          if (filterStatus === 'partial'   && key !== 'partial')   return false;
        }
        return true;
      });
    }, [exams, filterGrade, filterStream, filterMonth, filterStatus, searchText, conductMap, school, filterSchool, isAdmin]);

    // ── Summary stats ──────────────────────────────────────
    const stats = useMemo(() => {
      const sc = isAdmin && filterSchool !== 'All' ? filterSchool : school;
      const past = exams.filter(e => new Date(e.date) < new Date());
      let conducted=0, missed=0, partial=0, totalScore=0, scoreCount=0;
      past.forEach(e => {
        const docId = `${sc}_${e.id}`;
        const cond = conductMap[docId];
        if (!cond) return;
        if (cond.status === 'conducted') conducted++;
        if (cond.status === 'missed')    missed++;
        if (cond.status === 'partial')   partial++;
        if (cond.avgScore != null) { totalScore += cond.avgScore; scoreCount++; }
      });
      const pending = past.length - conducted - missed - partial;
      const avgScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : null;
      return { total: exams.length, past: past.length, conducted, missed, partial, pending, avgScore };
    }, [exams, conductMap, school, filterSchool, isAdmin]);

    const editDocId = editExam ? `${isAdmin && filterSchool !== 'All' ? filterSchool : school}_${editExam.id}` : null;

    // ── Render ─────────────────────────────────────────────
    return React.createElement('div', { style:{ minHeight:'100vh', background:'#F8FAFC', padding:'0 0 60px' } },

      // ── Page Header ──────────────────────────────────────
      React.createElement('div', { style:{ background:'linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)', padding:'28px 28px 20px', color:'#fff', marginBottom:'28px' } },
        React.createElement('div', { style:{ maxWidth:'1200px', margin:'0 auto' } },
          React.createElement('h1', { style:{ fontSize:'26px', fontWeight:'800', marginBottom:'6px' } }, '📋 Exam Conduct Tracker'),
          React.createElement('p', { style:{ color:'rgba(255,255,255,0.7)', fontSize:'14px' } },
            isAdmin ? 'Track exam conduct status across all centres' : `Tracking exams for ${school}`)
        )
      ),

      React.createElement('div', { style:{ maxWidth:'1200px', margin:'0 auto', padding:'0 20px' } },

        // ── Summary Cards ───────────────────────────────────
        React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:'16px', marginBottom:'28px' } },
          React.createElement(SummaryCard, { label:'Total Exams',      value: stats.total,     emoji:'📅', color:'#6366F1', sub: `${stats.past} past` }),
          React.createElement(SummaryCard, { label:'Conducted',        value: stats.conducted,  emoji:'✅', color:'#10B981', sub: stats.past > 0 ? `${Math.round(stats.conducted/stats.past*100)}% rate` : '' }),
          React.createElement(SummaryCard, { label:'Not Updated',      value: stats.pending,    emoji:'⏳', color:'#F59E0B', sub: 'need review' }),
          React.createElement(SummaryCard, { label:'Missed',           value: stats.missed,     emoji:'❌', color:'#EF4444', sub: '' }),
          React.createElement(SummaryCard, { label:'Avg Score',        value: stats.avgScore != null ? stats.avgScore + '%' : '—', emoji:'📊', color:'#3B82F6', sub: 'across conducted' }),
        ),

        // ── Filters ─────────────────────────────────────────
        React.createElement('div', { style:{ background:'#fff', borderRadius:'16px', padding:'20px', boxShadow:'0 2px 12px rgba(0,0,0,0.08)', marginBottom:'20px' } },
          React.createElement('div', { style:{ display:'flex', flexWrap:'wrap', gap:'12px', alignItems:'center' } },
            // Search
            React.createElement('div', { style:{ flex:'1', minWidth:'200px', position:'relative' } },
              React.createElement('span', { style:{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', fontSize:'16px' } }, '🔍'),
              React.createElement('input', {
                type:'text', value: searchText,
                onChange: e => setSearchText(e.target.value),
                placeholder: 'Search exam name…',
                style:{ width:'100%', padding:'10px 12px 10px 36px', border:'1.5px solid #E5E7EB',
                         borderRadius:'10px', fontSize:'13px', outline:'none', boxSizing:'border-box' }
              })
            ),
            // Month filter
            ...([
              { label:'Month', value:filterMonth, set:setFilterMonth, opts:monthOptions },
              { label:'Grade', value:filterGrade, set:setFilterGrade, opts:gradeOptions },
              { label:'Stream',value:filterStream,set:setFilterStream,opts:streamOptions },
            ].map(({ label, value, set, opts }) =>
              React.createElement('select', {
                key: label, value, onChange: e => set(e.target.value),
                style:{ padding:'10px 12px', border:'1.5px solid #E5E7EB', borderRadius:'10px',
                         fontSize:'13px', outline:'none', background:'#F9FAFB', cursor:'pointer',
                         minWidth:'120px' }
              },
                opts.map(o => React.createElement('option', { key: o, value: o }, o === 'All' ? `All ${label}s` : (label === 'Grade' && o !== 'All' ? 'Grade ' + o : o)))
              )
            )),
            // Status filter
            React.createElement('select', {
              value: filterStatus, onChange: e => setFilterStatus(e.target.value),
              style:{ padding:'10px 12px', border:'1.5px solid #E5E7EB', borderRadius:'10px',
                       fontSize:'13px', outline:'none', background:'#F9FAFB', cursor:'pointer', minWidth:'140px' }
            },
              [['All','All Statuses'],['conducted','✅ Conducted'],['partial','⚠️ Partial'],
               ['missed','❌ Missed'],['pending','⏳ Not Updated']].map(([v,l]) =>
                React.createElement('option', { key:v, value:v }, l)
              )
            ),
            // School filter (admin only)
            isAdmin && React.createElement('select', {
              value: filterSchool, onChange: e => setFilterSchool(e.target.value),
              style:{ padding:'10px 12px', border:'1.5px solid #E5E7EB', borderRadius:'10px',
                       fontSize:'13px', outline:'none', background:'#F9FAFB', cursor:'pointer', minWidth:'160px' }
            },
              ['All', ...schools].map(s => React.createElement('option', { key:s, value:s }, s === 'All' ? 'All Schools' : s))
            ),
            // Reset
            React.createElement('button', {
              onClick: () => { setFilterGrade('All'); setFilterStream('All'); setFilterMonth('All'); setFilterStatus('All'); setSearchText(''); },
              style:{ padding:'10px 14px', background:'#F3F4F6', border:'none', borderRadius:'10px',
                       fontSize:'13px', cursor:'pointer', fontWeight:'600', color:'#6B7280' }
            }, '↺ Reset')
          ),
          // Results count
          React.createElement('div', { style:{ marginTop:'12px', fontSize:'12px', color:'#9CA3AF', fontWeight:'500' } },
            `Showing ${filteredExams.length} of ${exams.length} exams`
          )
        ),

        // ── Table ────────────────────────────────────────────
        loading
          ? React.createElement('div', { style:{ textAlign:'center', padding:'80px', color:'#9CA3AF', fontSize:'16px' } }, '⏳ Loading exam data…')
          : React.createElement('div', { style:{ background:'#fff', borderRadius:'16px', boxShadow:'0 2px 12px rgba(0,0,0,0.08)', overflow:'hidden' } },
              React.createElement('div', { style:{ overflowX:'auto' } },
                React.createElement('table', { style:{ width:'100%', borderCollapse:'collapse', minWidth:'900px' } },
                  // Head
                  React.createElement('thead', null,
                    React.createElement('tr', { style:{ background:'linear-gradient(135deg,#1a1a2e,#16213e)', color:'#fff' } },
                      ['Date','Grade','Stream','Test Name','Status','Students','Avg Score','Notes','Action'].map(h =>
                        React.createElement('th', {
                          key: h,
                          style:{ padding:'14px 12px', textAlign: ['Students','Avg Score','Status','Grade','Action'].includes(h) ? 'center' : 'left',
                                   fontSize:'12px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'0.05em',
                                   whiteSpace:'nowrap' }
                        }, h)
                      )
                    )
                  ),
                  // Body
                  React.createElement('tbody', null,
                    filteredExams.length === 0
                      ? React.createElement('tr', null,
                          React.createElement('td', { colSpan:9, style:{ padding:'60px', textAlign:'center', color:'#9CA3AF', fontSize:'15px' } },
                            '📭 No exams match your filters'
                          )
                        )
                      : filteredExams.map(exam => {
                          const sc = isAdmin && filterSchool !== 'All' ? filterSchool : school;
                          const docId = `${sc}_${exam.id}`;
                          return React.createElement(ExamRow, {
                            key: exam.id,
                            exam,
                            conduct: conductMap[docId] || null,
                            onEdit: setEditExam,
                            isAPC,
                          });
                        })
                  )
                )
              ),

              // Table footer
              React.createElement('div', { style:{ padding:'14px 20px', background:'#F9FAFB', borderTop:'1px solid #F3F4F6',
                                                    display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'8px' } },
                React.createElement('span', { style:{ fontSize:'12px', color:'#9CA3AF' } }, '⚠️ Exams highlighted in yellow are past due and need updating'),
                React.createElement('span', { style:{ fontSize:'12px', color:'#9CA3AF' } }, `Last loaded: ${new Date().toLocaleTimeString('en-IN')}`)
              )
            ),

        // ── Legend ───────────────────────────────────────────
        React.createElement('div', { style:{ marginTop:'20px', display:'flex', gap:'12px', flexWrap:'wrap' } },
          Object.entries(STATUS_CFG).map(([key, cfg]) =>
            React.createElement('span', {
              key,
              style:{ background: cfg.bg, color: cfg.color, border:`1px solid ${cfg.border}`,
                       padding:'4px 12px', borderRadius:'99px', fontSize:'12px', fontWeight:'600' }
            }, cfg.emoji + ' ' + cfg.label)
          )
        )
      ),

      // ── Update Modal ─────────────────────────────────────
      editExam && React.createElement(ExamUpdateModal, {
        exam: editExam,
        conduct: conductMap[editDocId] || null,
        onClose: () => setEditExam(null),
        onSave: data => handleSave(editExam, data),
      })
    );
  }

  // ── Expose globally ──────────────────────────────────────
  window.ExamConductTracker = ExamConductTracker;
  console.log('✅ ExamConductTracker v1.0.0 loaded');

})();


/* ============================================================
   INTEGRATION NOTES — READ CAREFULLY
   ============================================================

   STEP 1: Add this file to your Vercel project root (same
   folder as app.js, init.js, index.html).

   STEP 2: In index.html, find the line:
      <script src="/post-app.js?v=5.5.5" defer></script>
   Add BEFORE it:
      <script src="/exam-tracker.js?v=1.0.0" defer></script>

   STEP 3: In app.js, add the nav item.
   There are TWO teacher nav arrays. Search for:
      id: 'examstats',
      label: 'Exam Stats',
   In BOTH places, add after the examstats block:
      }, {
        id: 'examtracker',
        label: 'Exam Tracker',
        icon: React.createElement("i", {
          className: "fa-solid fa-clipboard-list"
        })

   STEP 4: In app.js, add the tab render.
   Search for:
      }), activeTab === 'examstats' && React.createElement(TeacherExamStats, {
        currentUser: currentUser
   Add this line RIGHT AFTER the TeacherExamStats block closes:
      }), activeTab === 'examtracker' && React.createElement(window.ExamConductTracker, {
        currentUser: currentUser,
        isAdmin: false
   
   STEP 5: For Admin panel, search for:
      }), activeTab === 'examstats' && React.createElement(AdminExamStats, {
   Add after it closes:
      }), activeTab === 'examtracker' && React.createElement(window.ExamConductTracker, {
        currentUser: currentUser,
        isAdmin: true,
        accessibleSchools: availableSchools

   STEP 6: Update version numbers in index.html, sw.js,
   post-app.js, and version.json to trigger an auto-update
   on all teacher devices.

   Firebase collection used: 'examConduct'
   Document ID format:       '{school}_{examId}'
   ============================================================ */
