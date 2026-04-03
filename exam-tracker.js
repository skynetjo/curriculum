// ============================================================
// EXAM CONDUCT TRACKER - exam-tracker.js  v2.0.0
// Avanti Fellows Curriculum Tracker
//
// v2.0.0 changes:
//   1. Exam Mode: Online / Offline per conduct record
//   2. Admin CRUD: Add / Edit / Delete exams in schedule
//      (only super_admin and director can do this)
//   3. Manager access: works via accessibleSchools prop —
//      hierarchy already handled by app.js, no extra changes
// ============================================================

(function () {
  'use strict';

  const { useState, useEffect, useCallback, useMemo } = React;

  const getDb = () => (window._earlyDb || firebase.firestore());

  function fmtDate(d) {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }); }
    catch { return d; }
  }
  function monthLabel(d) {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('en-IN', { month:'short', year:'numeric' }); }
    catch { return ''; }
  }
  function uid() { return 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2,6); }

  // ── Status config ────────────────────────────────────────
  const S = {
    conducted: { label:'Conducted',   e:'✅', c:'#065F46', bg:'#ECFDF5', b:'#6EE7B7' },
    partial:   { label:'Partial',     e:'⚠️', c:'#92400E', bg:'#FFFBEB', b:'#FCD34D' },
    missed:    { label:'Missed',      e:'❌', c:'#991B1B', bg:'#FEF2F2', b:'#FCA5A5' },
    upcoming:  { label:'Upcoming',    e:'🗓️', c:'#3730A3', bg:'#EEF2FF', b:'#A5B4FC' },
    unset:     { label:'Not Updated', e:'⏳', c:'#6B7280', bg:'#F9FAFB', b:'#D1D5DB' },
  };
  function statusKey(cond, date) {
    if (!cond) return new Date(date) > new Date() ? 'upcoming' : 'unset';
    return cond.status || 'unset';
  }

  // ── Seed schedule ────────────────────────────────────────
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

  // ── Shared UI bits ───────────────────────────────────────
  function pill(text, bg, color, border) {
    return React.createElement('span', {
      style:{ background:bg, color, border:`1px solid ${border||'transparent'}`,
              padding:'3px 9px', borderRadius:'99px', fontSize:'12px', fontWeight:'600',
              display:'inline-flex', alignItems:'center', gap:'4px', whiteSpace:'nowrap' }
    }, text);
  }

  function ModePill({ mode }) {
    if (!mode) return null;
    return mode === 'Online'
      ? pill('🌐 Online',  '#EFF6FF', '#1D4ED8', '#BFDBFE')
      : pill('📄 Offline', '#F5F3FF', '#6D28D9', '#DDD6FE');
  }

  function StatCard({ label, value, sub, color, emoji }) {
    return React.createElement('div', {
      style:{ background:'#fff', borderRadius:'14px', padding:'16px 14px',
              boxShadow:'0 2px 10px rgba(0,0,0,0.07)', borderLeft:`4px solid ${color}`,
              display:'flex', alignItems:'center', gap:'12px' }
    },
      React.createElement('div', { style:{ fontSize:'26px' } }, emoji),
      React.createElement('div', null,
        React.createElement('div', { style:{ fontSize:'22px', fontWeight:'800', color, lineHeight:'1.1' } }, value),
        React.createElement('div', { style:{ fontSize:'12px', color:'#6B7280', fontWeight:'600' } }, label),
        sub && React.createElement('div', { style:{ fontSize:'11px', color:'#9CA3AF' } }, sub)
      )
    );
  }

  // ─────────────────────────────────────────────────────────
  // 1. CONDUCT UPDATE MODAL
  // ─────────────────────────────────────────────────────────
  function ConductModal({ exam, conduct, school, onSave, onClose }) {
    const [status, setStatus]           = useState(conduct?.status       || 'conducted');
    const [mode,   setMode]             = useState(conduct?.mode         || 'Offline');
    const [participants, setParticipants] = useState(conduct?.participants != null ? String(conduct.participants) : '');
    const [avgScore, setAvgScore]       = useState(conduct?.avgScore     != null ? String(conduct.avgScore)     : '');
    const [topScore, setTopScore]       = useState(conduct?.topScore     != null ? String(conduct.topScore)     : '');
    const [notes, setNotes]             = useState(conduct?.notes        || '');
    const [saving, setSaving]           = useState(false);

    const handleSave = async () => {
      setSaving(true);
      try {
        await onSave({ status, mode,
          participants: participants !== '' ? Number(participants) : null,
          avgScore:     avgScore     !== '' ? Number(avgScore)     : null,
          topScore:     topScore     !== '' ? Number(topScore)     : null,
          notes });
        onClose();
      } catch { alert('Save failed. Try again.'); setSaving(false); }
    };

    const cfg = S[status] || S.unset;
    const inp = { padding:'9px 11px', border:'1.5px solid #E5E7EB', borderRadius:'10px', fontSize:'14px',
                  outline:'none', boxSizing:'border-box', width:'100%', fontFamily:'inherit',
                  background: status === 'missed' ? '#F9FAFB' : '#fff' };

    return React.createElement('div', {
      style:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:10000,
              display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' },
      onClick: onClose
    },
      React.createElement('div', {
        onClick: e => e.stopPropagation(),
        style:{ background:'#fff', borderRadius:'20px', width:'100%', maxWidth:'480px',
                padding:'26px', boxShadow:'0 20px 60px rgba(0,0,0,0.25)', maxHeight:'92vh', overflowY:'auto' }
      },
        // Header
        React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'18px' } },
          React.createElement('div', null,
            React.createElement('div', { style:{ fontSize:'11px', color:'#6B7280', fontWeight:'700', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:'3px' } },
              fmtDate(exam.date) + ' · ' + school),
            React.createElement('h3', { style:{ fontSize:'16px', fontWeight:'700', color:'#1F2937', marginBottom:'6px', lineHeight:'1.3' } }, exam.testName),
            React.createElement('div', { style:{ display:'flex', gap:'6px', flexWrap:'wrap' } },
              pill('G'+exam.grade,    '#EEF2FF','#4F46E5','#C7D2FE'),
              pill(exam.stream,       '#F0FDF4','#15803D','#BBF7D0'),
              pill(exam.format,       '#FEF3C7','#92400E','#FDE68A'),
            )
          ),
          React.createElement('button', {
            onClick:onClose,
            style:{ background:'#F3F4F6', border:'none', borderRadius:'50%', width:'34px', height:'34px',
                    cursor:'pointer', fontSize:'18px', color:'#6B7280' }
          }, '×')
        ),

        // Status
        React.createElement('p', { style:{ fontSize:'12px', fontWeight:'700', color:'#374151', marginBottom:'8px' } }, 'Exam Status'),
        React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', marginBottom:'16px' } },
          ['conducted','partial','missed'].map(s => {
            const c = S[s]; const active = status === s;
            return React.createElement('button', { key:s, onClick:()=>setStatus(s),
              style:{ padding:'10px 4px', border:`2px solid ${active?c.c:'#E5E7EB'}`,
                      borderRadius:'12px', background:active?c.bg:'#fff', cursor:'pointer', textAlign:'center' }
            },
              React.createElement('div', { style:{ fontSize:'18px', marginBottom:'3px' } }, c.e),
              React.createElement('div', { style:{ fontSize:'12px', fontWeight:active?'700':'500', color:active?c.c:'#6B7280' } }, c.label)
            );
          })
        ),

        // Exam Mode — NEW
        React.createElement('p', { style:{ fontSize:'12px', fontWeight:'700', color:'#374151', marginBottom:'8px' } }, 'Exam Mode'),
        React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'16px' } },
          [['Online','🌐','#1D4ED8','#EFF6FF','#BFDBFE'],['Offline','📄','#6D28D9','#F5F3FF','#DDD6FE']].map(([m,ic,ac,bg,br]) => {
            const active = mode === m;
            return React.createElement('button', { key:m, onClick:()=>setMode(m),
              style:{ padding:'10px', border:`2px solid ${active?ac:'#E5E7EB'}`, borderRadius:'12px',
                      background:active?bg:'#fff', cursor:'pointer', display:'flex', alignItems:'center',
                      justifyContent:'center', gap:'8px' }
            },
              React.createElement('span', { style:{ fontSize:'18px' } }, ic),
              React.createElement('span', { style:{ fontSize:'13px', fontWeight:active?'700':'500', color:active?ac:'#6B7280' } }, m)
            );
          })
        ),

        // Results
        status !== 'missed' && React.createElement('div', null,
          React.createElement('p', { style:{ fontSize:'12px', fontWeight:'700', color:'#374151', marginBottom:'8px' } }, 'Results'),
          React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', marginBottom:'14px' } },
            [['👥 Students present', participants, setParticipants,'e.g. 28'],
             ['📊 Avg score (%)',     avgScore,     setAvgScore,    'e.g. 64'],
             ['🏆 Top score (%)',     topScore,     setTopScore,    'e.g. 89']
            ].map(([lbl,val,set,ph]) =>
              React.createElement('div', { key:lbl },
                React.createElement('label', { style:{ fontSize:'11px', fontWeight:'600', color:'#374151', display:'block', marginBottom:'5px' } }, lbl),
                React.createElement('input', { type:'number', min:'0', max:'200', value:val, placeholder:ph,
                  onChange:e=>set(e.target.value), style:inp })
              )
            )
          )
        ),

        // Notes
        React.createElement('div', { style:{ marginBottom:'20px' } },
          React.createElement('label', { style:{ fontSize:'12px', fontWeight:'700', color:'#374151', display:'block', marginBottom:'6px' } }, '📝 Notes / Remarks'),
          React.createElement('textarea', { value:notes, onChange:e=>setNotes(e.target.value),
            placeholder:'Any remarks about this exam…', rows:3, style:{...inp, resize:'vertical'} })
        ),

        React.createElement('button', { onClick:handleSave, disabled:saving,
          style:{ width:'100%', padding:'13px', background:saving?'#9CA3AF':'linear-gradient(135deg,#F4B41A,#E8A219)',
                  color:'#fff', border:'none', borderRadius:'12px', fontSize:'15px', fontWeight:'700',
                  cursor:saving?'default':'pointer' }
        }, saving ? '⏳ Saving…' : '💾 Save Exam Record')
      )
    );
  }

  // ─────────────────────────────────────────────────────────
  // 2. SCHEDULE MODAL (Admin Add / Edit)
  // ─────────────────────────────────────────────────────────
  function ScheduleModal({ exam, onSave, onClose }) {
    const blank = { date:'', grade:'11', stream:'Engineering', testName:'', format:'MT', purpose:'Monthly Test' };
    const [form, setForm] = useState(exam ? { ...exam } : blank);
    const [saving, setSaving] = useState(false);
    const set = (k, v) => setForm(p => ({ ...p, [k]:v }));

    const handleSave = async () => {
      if (!form.date || !form.testName.trim()) { alert('Date and Test Name are required.'); return; }
      setSaving(true);
      try {
        const docId = form.id || uid();
        await getDb().collection('examSchedule').doc(docId).set({ ...form, id:docId }, { merge:true });
        onSave({ ...form, id:docId }); onClose();
      } catch { alert('Save failed.'); setSaving(false); }
    };

    const lbl = { fontSize:'12px', fontWeight:'700', color:'#374151', display:'block', marginBottom:'5px' };
    const inp = { width:'100%', padding:'9px 11px', border:'1.5px solid #E5E7EB', borderRadius:'10px',
                  fontSize:'13px', outline:'none', boxSizing:'border-box', fontFamily:'inherit' };

    return React.createElement('div', {
      style:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:10001,
              display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' },
      onClick: onClose
    },
      React.createElement('div', { onClick:e=>e.stopPropagation(),
        style:{ background:'#fff', borderRadius:'20px', width:'100%', maxWidth:'500px',
                padding:'26px', boxShadow:'0 20px 60px rgba(0,0,0,0.3)', maxHeight:'92vh', overflowY:'auto' }
      },
        React.createElement('div', { style:{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' } },
          React.createElement('h3', { style:{ fontSize:'17px', fontWeight:'700', color:'#1F2937' } },
            exam?.id ? '✏️ Edit Exam in Schedule' : '➕ Add New Exam to Schedule'),
          React.createElement('button', { onClick:onClose,
            style:{ background:'#F3F4F6', border:'none', borderRadius:'50%', width:'34px', height:'34px',
                    cursor:'pointer', fontSize:'18px', color:'#6B7280' } }, '×')
        ),

        React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'14px' } },
          React.createElement('div', null,
            React.createElement('label', { style:lbl }, 'Date *'),
            React.createElement('input', { type:'date', value:form.date, onChange:e=>set('date',e.target.value), style:inp })
          ),
          React.createElement('div', null,
            React.createElement('label', { style:lbl }, 'Grade'),
            React.createElement('select', { value:form.grade, onChange:e=>set('grade',e.target.value), style:{...inp, background:'#F9FAFB'} },
              ['6','7','8','9','10','11','12'].map(g => React.createElement('option', {key:g, value:g}, 'Grade '+g))
            )
          ),
          React.createElement('div', null,
            React.createElement('label', { style:lbl }, 'Stream'),
            React.createElement('select', { value:form.stream, onChange:e=>set('stream',e.target.value), style:{...inp, background:'#F9FAFB'} },
              STREAMS.map(s => React.createElement('option', {key:s, value:s}, s))
            )
          ),
          React.createElement('div', null,
            React.createElement('label', { style:lbl }, 'Format'),
            React.createElement('select', { value:form.format, onChange:e=>set('format',e.target.value), style:{...inp, background:'#F9FAFB'} },
              FORMATS.map(f => React.createElement('option', {key:f, value:f}, f))
            )
          )
        ),
        React.createElement('div', { style:{ marginBottom:'14px' } },
          React.createElement('label', { style:lbl }, 'Test Name *'),
          React.createElement('input', { type:'text', value:form.testName, placeholder:'e.g. AIET-09-G11-PCM',
            onChange:e=>set('testName',e.target.value), style:inp })
        ),
        React.createElement('div', { style:{ marginBottom:'22px' } },
          React.createElement('label', { style:lbl }, 'Purpose'),
          React.createElement('select', { value:form.purpose, onChange:e=>set('purpose',e.target.value), style:{...inp, background:'#F9FAFB'} },
            PURPOSES.map(p => React.createElement('option', {key:p, value:p}, p))
          )
        ),
        React.createElement('div', { style:{ display:'flex', gap:'10px' } },
          React.createElement('button', { onClick:onClose,
            style:{ flex:1, padding:'12px', background:'#F3F4F6', border:'none', borderRadius:'12px',
                    fontSize:'14px', fontWeight:'600', cursor:'pointer', color:'#374151' } }, 'Cancel'),
          React.createElement('button', { onClick:handleSave, disabled:saving,
            style:{ flex:2, padding:'12px', background:saving?'#9CA3AF':'linear-gradient(135deg,#1a1a2e,#2d2d4e)',
                    color:'#fff', border:'none', borderRadius:'12px', fontSize:'14px', fontWeight:'700', cursor:saving?'default':'pointer' }
          }, saving ? '⏳ Saving…' : (exam?.id ? '✏️ Update Exam' : '➕ Add Exam'))
        )
      )
    );
  }

  // ─────────────────────────────────────────────────────────
  // 3. DELETE CONFIRM
  // ─────────────────────────────────────────────────────────
  function DeleteConfirm({ exam, onConfirm, onClose }) {
    const [busy, setBusy] = useState(false);
    return React.createElement('div', {
      style:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:10002,
              display:'flex', alignItems:'center', justifyContent:'center', padding:'16px' },
      onClick: onClose
    },
      React.createElement('div', { onClick:e=>e.stopPropagation(),
        style:{ background:'#fff', borderRadius:'20px', width:'100%', maxWidth:'380px', padding:'26px',
                boxShadow:'0 20px 60px rgba(0,0,0,0.3)', textAlign:'center' }
      },
        React.createElement('div', { style:{ fontSize:'40px', marginBottom:'12px' } }, '🗑️'),
        React.createElement('h3', { style:{ fontSize:'17px', fontWeight:'700', color:'#1F2937', marginBottom:'8px' } }, 'Delete this exam?'),
        React.createElement('p', { style:{ fontSize:'13px', color:'#374151', marginBottom:'4px', fontWeight:'500' } }, exam.testName),
        React.createElement('p', { style:{ fontSize:'12px', color:'#9CA3AF', marginBottom:'22px' } },
          'Removes it from the schedule for all schools. Conduct records already saved will not be deleted.'),
        React.createElement('div', { style:{ display:'flex', gap:'10px' } },
          React.createElement('button', { onClick:onClose,
            style:{ flex:1, padding:'12px', background:'#F3F4F6', border:'none', borderRadius:'12px',
                    fontSize:'14px', fontWeight:'600', cursor:'pointer', color:'#374151' } }, 'Cancel'),
          React.createElement('button', { disabled:busy,
            onClick: async () => {
              setBusy(true);
              try { await getDb().collection('examSchedule').doc(exam.id).delete(); onConfirm(exam.id); onClose(); }
              catch { alert('Delete failed.'); setBusy(false); }
            },
            style:{ flex:2, padding:'12px', background:busy?'#9CA3AF':'#DC2626',
                    color:'#fff', border:'none', borderRadius:'12px', fontSize:'14px', fontWeight:'700', cursor:busy?'default':'pointer' }
          }, busy ? '⏳ Deleting…' : '🗑️ Yes, Delete')
        )
      )
    );
  }

  // ─────────────────────────────────────────────────────────
  // TABLE ROW
  // ─────────────────────────────────────────────────────────
  function ExamRow({ exam, cond, onUpdate, onEdit, onDelete, canManage }) {
    const sk   = statusKey(cond, exam.date);
    const scfg = S[sk];
    const needsUpdate = new Date(exam.date) < new Date() && sk === 'unset';
    const stm  = { Engineering:{bg:'#FFF7ED',c:'#C2410C'}, Medical:{bg:'#F0FDF4',c:'#15803D'}, Foundation:{bg:'#F5F3FF',c:'#7C3AED'} };
    const sc   = stm[exam.stream] || { bg:'#F3F4F6', c:'#374151' };

    return React.createElement('tr', {
      style:{ background: needsUpdate ? '#FFFBEB' : '#fff', borderBottom:'1px solid #F3F4F6', verticalAlign:'middle' }
    },
      React.createElement('td', { style:{ padding:'11px 10px', whiteSpace:'nowrap', fontSize:'13px', color:'#374151', fontWeight:'600' } }, fmtDate(exam.date)),
      React.createElement('td', { style:{ padding:'11px 8px', textAlign:'center' } }, pill('G'+exam.grade,'#EEF2FF','#4F46E5','#C7D2FE')),
      React.createElement('td', { style:{ padding:'11px 8px' } }, pill(exam.stream, sc.bg, sc.c)),
      React.createElement('td', { style:{ padding:'11px 10px' } },
        React.createElement('div', { style:{ fontWeight:'600', fontSize:'13px', color:'#1F2937' } }, exam.testName),
        React.createElement('div', { style:{ fontSize:'11px', color:'#9CA3AF', marginTop:'2px' } }, exam.format + ' · ' + exam.purpose)
      ),
      React.createElement('td', { style:{ padding:'11px 8px', textAlign:'center' } },
        pill(scfg.e+' '+scfg.label, scfg.bg, scfg.c, scfg.b)
      ),
      React.createElement('td', { style:{ padding:'11px 8px', textAlign:'center' } },
        React.createElement(ModePill, { mode: cond?.mode||null })
      ),
      React.createElement('td', { style:{ padding:'11px 8px', textAlign:'center', fontSize:'13px', fontWeight:'600', color:'#374151' } },
        cond?.participants != null ? cond.participants : React.createElement('span', {style:{color:'#D1D5DB'}},'—')
      ),
      React.createElement('td', { style:{ padding:'11px 8px', textAlign:'center' } },
        cond?.avgScore != null
          ? React.createElement('div', { style:{ display:'flex', flexDirection:'column', alignItems:'center' } },
              React.createElement('span', { style:{ fontWeight:'700', fontSize:'13px',
                color: cond.avgScore>=70?'#059669':cond.avgScore>=50?'#D97706':'#DC2626' } }, cond.avgScore+'%'),
              cond.topScore != null && React.createElement('span', {style:{fontSize:'11px',color:'#9CA3AF'}}, 'Top: '+cond.topScore+'%')
            )
          : React.createElement('span', {style:{color:'#D1D5DB',fontSize:'13px'}},'—')
      ),
      React.createElement('td', { style:{ padding:'11px 8px', maxWidth:'120px' } },
        cond?.notes
          ? React.createElement('span', { title:cond.notes,
              style:{ fontSize:'12px', color:'#6B7280', display:'block', overflow:'hidden',
                      textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'110px' } }, cond.notes)
          : React.createElement('span', {style:{color:'#E5E7EB',fontSize:'12px'}},'—')
      ),
      // Update conduct
      React.createElement('td', { style:{ padding:'11px 8px', textAlign:'center' } },
        React.createElement('button', { onClick:()=>onUpdate(exam),
          style:{ background: needsUpdate ? 'linear-gradient(135deg,#F59E0B,#D97706)' : 'linear-gradient(135deg,#6366F1,#4F46E5)',
                  color:'#fff', border:'none', borderRadius:'7px', padding:'6px 11px',
                  fontSize:'11px', fontWeight:'600', cursor:'pointer' }
        }, needsUpdate ? '⚠️ Update' : '✏️ Edit')
      ),
      // Admin schedule controls
      canManage && React.createElement('td', { style:{ padding:'11px 8px', textAlign:'center' } },
        React.createElement('div', { style:{ display:'flex', gap:'4px', justifyContent:'center' } },
          React.createElement('button', { onClick:()=>onEdit(exam), title:'Edit exam schedule entry',
            style:{ background:'#F3F4F6', border:'none', borderRadius:'7px', padding:'6px 9px', fontSize:'13px', cursor:'pointer' }
          }, '🖊'),
          React.createElement('button', { onClick:()=>onDelete(exam), title:'Delete exam from schedule',
            style:{ background:'#FEF2F2', border:'none', borderRadius:'7px', padding:'6px 9px', fontSize:'13px', cursor:'pointer' }
          }, '🗑')
        )
      )
    );
  }

  // ─────────────────────────────────────────────────────────
  // MAIN COMPONENT
  // ─────────────────────────────────────────────────────────
  function ExamConductTracker({ currentUser, isAdmin, accessibleSchools }) {
    const school     = currentUser?.school || '';
    const role       = currentUser?.role   || '';
    const isSA       = role === 'super_admin' || currentUser?.email === 'admin@avantifellows.org' || currentUser?.isSuperAdmin;
    const isDir      = role === 'director' || role === 'assoc_director';
    const canManage  = isAdmin && (isSA || isDir); // Add/Edit/Delete schedule

    const schools = accessibleSchools || (school ? [school] : []);

    const [exams,        setExams]        = useState(SEED);
    const [conductMap,   setConductMap]   = useState({});
    const [loading,      setLoading]      = useState(true);

    // Filters
    const [fGrade,   setFGrade]   = useState('All');
    const [fStream,  setFStream]  = useState('All');
    const [fMonth,   setFMonth]   = useState('All');
    const [fStatus,  setFStatus]  = useState('All');
    const [fMode,    setFMode]    = useState('All');
    const [fSchool,  setFSchool]  = useState(isAdmin ? 'All' : school);
    const [search,   setSearch]   = useState('');

    // Modal state
    const [conductModal,  setConductModal]  = useState(null); // exam to update conduct
    const [scheduleModal, setScheduleModal] = useState(null); // exam to edit schedule, or true = add new
    const [deleteTarget,  setDeleteTarget]  = useState(null); // exam to delete

    // School for reading/writing conduct records
    const activeSchool = useMemo(() => {
      if (!isAdmin) return school;
      return fSchool !== 'All' ? fSchool : (schools[0] || '');
    }, [isAdmin, school, fSchool, schools]);

    // Load data
    useEffect(() => {
      setLoading(true);
      // Load custom schedule if any
      getDb().collection('examSchedule').orderBy('date').get()
        .then(snap => { if (snap.docs.length > 0) setExams(snap.docs.map(d => ({id:d.id,...d.data()}))); })
        .catch(() => {});
      // Load conduct records
      const toLoad = isAdmin ? schools : [school];
      Promise.all(toLoad.map(sc =>
        getDb().collection('examConduct').where('school','==',sc).get()
          .then(snap => snap.docs.map(d => ({id:d.id,...d.data()})))
          .catch(() => [])
      )).then(res => {
        const map = {}; res.flat().forEach(r => { map[r.id] = r; });
        setConductMap(map); setLoading(false);
      });
    }, [school, isAdmin, schools.join(',')]);

    // Save conduct
    const saveConductRecord = useCallback(async (exam, data) => {
      const sc = activeSchool;
      if (!sc) throw new Error('No school selected');
      const docId  = `${sc}_${exam.id}`;
      const payload = { ...data, school:sc, examId:exam.id, examName:exam.testName,
        examDate:exam.date, grade:exam.grade, stream:exam.stream,
        updatedBy: currentUser?.name || currentUser?.email || 'Unknown',
        updatedAt: new Date().toISOString() };
      await getDb().collection('examConduct').doc(docId).set(payload, { merge:true });
      setConductMap(prev => ({ ...prev, [docId]:{ id:docId, ...payload } }));
    }, [activeSchool, currentUser]);

    // Schedule CRUD
    const onScheduleSaved = useCallback(exam => {
      setExams(prev => {
        const idx = prev.findIndex(e => e.id === exam.id);
        if (idx >= 0) { const c = [...prev]; c[idx] = exam; return c; }
        return [...prev, exam].sort((a,b) => a.date.localeCompare(b.date));
      });
    }, []);
    const onScheduleDeleted = useCallback(id => setExams(prev => prev.filter(e => e.id !== id)), []);

    // Filter options
    const gradeOpts  = useMemo(() => ['All', ...Array.from(new Set(exams.map(e=>e.grade))).sort((a,b)=>Number(a)-Number(b))], [exams]);
    const streamOpts = useMemo(() => ['All', ...Array.from(new Set(exams.map(e=>e.stream))).sort()], [exams]);
    const monthOpts  = useMemo(() => ['All', ...Array.from(new Set(exams.map(e=>monthLabel(e.date)).filter(Boolean)))], [exams]);

    // Filtered exams
    const filtered = useMemo(() => {
      const sc = activeSchool || school;
      return exams.filter(e => {
        if (fGrade  !== 'All' && e.grade  !== fGrade)  return false;
        if (fStream !== 'All' && e.stream !== fStream) return false;
        if (fMonth  !== 'All' && monthLabel(e.date) !== fMonth) return false;
        if (search) { const q = search.toLowerCase();
          if (!e.testName.toLowerCase().includes(q) && !e.stream.toLowerCase().includes(q) &&
              !e.grade.includes(q) && !e.format.toLowerCase().includes(q)) return false; }
        const cond = conductMap[`${sc}_${e.id}`];
        if (fMode !== 'All' && (!cond || cond.mode !== fMode)) return false;
        if (fStatus !== 'All') {
          const k = statusKey(cond, e.date);
          if (fStatus === 'pending'   && !['unset','upcoming'].includes(k)) return false;
          if (fStatus === 'conducted' && k !== 'conducted') return false;
          if (fStatus === 'missed'    && k !== 'missed')    return false;
          if (fStatus === 'partial'   && k !== 'partial')   return false;
        }
        return true;
      });
    }, [exams, fGrade, fStream, fMonth, fStatus, fMode, search, conductMap, activeSchool, school]);

    // Summary stats
    const stats = useMemo(() => {
      const sc = activeSchool || school;
      const past = exams.filter(e => new Date(e.date) < new Date());
      let conducted=0, missed=0, partial=0, online=0, offline=0, totalScore=0, scoreCount=0;
      past.forEach(e => {
        const c = conductMap[`${sc}_${e.id}`]; if (!c) return;
        if (c.status==='conducted') conducted++;
        if (c.status==='missed')   missed++;
        if (c.status==='partial')  partial++;
        if (c.mode==='Online')     online++;
        if (c.mode==='Offline')    offline++;
        if (c.avgScore != null) { totalScore += c.avgScore; scoreCount++; }
      });
      const pending  = past.length - conducted - missed - partial;
      const avgScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : null;
      return { total:exams.length, past:past.length, conducted, missed, partial, pending, online, offline, avgScore };
    }, [exams, conductMap, activeSchool, school]);

    const conductDocId = conductModal ? `${activeSchool||school}_${conductModal.id}` : null;
    const selInp = { padding:'9px 11px', border:'1.5px solid #E5E7EB', borderRadius:'9px',
                     fontSize:'13px', background:'#F9FAFB', cursor:'pointer', outline:'none' };

    return React.createElement('div', { style:{ minHeight:'100vh', background:'#F8FAFC', paddingBottom:'60px' } },

      // Header
      React.createElement('div', { style:{ background:'linear-gradient(135deg,#1a1a2e,#16213e)', padding:'22px 24px 18px', color:'#fff', marginBottom:'22px' } },
        React.createElement('div', { style:{ maxWidth:'1250px', margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'12px' } },
          React.createElement('div', null,
            React.createElement('h1', { style:{ fontSize:'23px', fontWeight:'800', marginBottom:'4px' } }, '📋 Exam Conduct Tracker'),
            React.createElement('p', { style:{ color:'rgba(255,255,255,0.65)', fontSize:'13px' } },
              isAdmin
                ? (activeSchool && activeSchool !== 'All' ? 'Viewing: ' + activeSchool : `${schools.length} school${schools.length!==1?'s':''} accessible`)
                : `Tracking exams for ${school}`)
          ),
          canManage && React.createElement('button', { onClick:()=>setScheduleModal(true),
            style:{ background:'linear-gradient(135deg,#F4B41A,#E8A219)', color:'#fff', border:'none',
                    borderRadius:'10px', padding:'10px 18px', fontSize:'13px', fontWeight:'700',
                    cursor:'pointer', boxShadow:'0 4px 12px rgba(244,180,26,0.4)' }
          }, '➕ Add Exam to Schedule')
        )
      ),

      React.createElement('div', { style:{ maxWidth:'1250px', margin:'0 auto', padding:'0 16px' } },

        // Stats
        React.createElement('div', { style:{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(145px,1fr))', gap:'12px', marginBottom:'22px' } },
          React.createElement(StatCard, { label:'Total Exams',  value:stats.total,     emoji:'📅', color:'#6366F1', sub:`${stats.past} past` }),
          React.createElement(StatCard, { label:'Conducted',    value:stats.conducted,  emoji:'✅', color:'#10B981', sub:stats.past>0?`${Math.round(stats.conducted/stats.past*100)}% rate`:'' }),
          React.createElement(StatCard, { label:'Not Updated',  value:stats.pending,    emoji:'⏳', color:'#F59E0B', sub:'need review' }),
          React.createElement(StatCard, { label:'Missed',       value:stats.missed,     emoji:'❌', color:'#EF4444' }),
          React.createElement(StatCard, { label:'Online',       value:stats.online,     emoji:'🌐', color:'#1D4ED8', sub:'conducted online' }),
          React.createElement(StatCard, { label:'Offline',      value:stats.offline,    emoji:'📄', color:'#6D28D9', sub:'conducted offline' }),
          React.createElement(StatCard, { label:'Avg Score',    value:stats.avgScore!=null?stats.avgScore+'%':'—', emoji:'📊', color:'#3B82F6', sub:'across conducted' }),
        ),

        // Filters
        React.createElement('div', { style:{ background:'#fff', borderRadius:'14px', padding:'16px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)', marginBottom:'16px' } },
          React.createElement('div', { style:{ display:'flex', flexWrap:'wrap', gap:'10px', alignItems:'center' } },

            // School picker (admin with multiple schools)
            isAdmin && schools.length > 1 && React.createElement('select', {
              value:fSchool, onChange:e=>setFSchool(e.target.value),
              style:{...selInp, minWidth:'160px', fontWeight:'600', color:'#1D4ED8', borderColor:'#BFDBFE' }
            }, ['All',...schools].map(s => React.createElement('option',{key:s,value:s}, s==='All'?'🏫 All Schools':s))),

            // Search
            React.createElement('div', { style:{ flex:'1', minWidth:'170px', position:'relative' } },
              React.createElement('span', { style:{ position:'absolute', left:'11px', top:'50%', transform:'translateY(-50%)', fontSize:'14px' } }, '🔍'),
              React.createElement('input', { type:'text', value:search, onChange:e=>setSearch(e.target.value),
                placeholder:'Search exam…',
                style:{ width:'100%', padding:'9px 11px 9px 34px', border:'1.5px solid #E5E7EB', borderRadius:'9px',
                         fontSize:'13px', outline:'none', boxSizing:'border-box' } })
            ),

            // Month
            React.createElement('select', { value:fMonth,  onChange:e=>setFMonth(e.target.value),  style:{...selInp, minWidth:'115px'} },
              monthOpts.map(o => React.createElement('option',{key:o,value:o}, o==='All'?'All Months':o))),

            // Grade
            React.createElement('select', { value:fGrade,  onChange:e=>setFGrade(e.target.value),  style:{...selInp, minWidth:'110px'} },
              gradeOpts.map(o => React.createElement('option',{key:o,value:o}, o==='All'?'All Grades':'Grade '+o))),

            // Stream
            React.createElement('select', { value:fStream, onChange:e=>setFStream(e.target.value), style:{...selInp, minWidth:'120px'} },
              streamOpts.map(o => React.createElement('option',{key:o,value:o}, o==='All'?'All Streams':o))),

            // Status
            React.createElement('select', { value:fStatus, onChange:e=>setFStatus(e.target.value), style:{...selInp, minWidth:'140px'} },
              [['All','All Statuses'],['conducted','✅ Conducted'],['partial','⚠️ Partial'],
               ['missed','❌ Missed'],['pending','⏳ Not Updated']].map(([v,l])=>
                React.createElement('option',{key:v,value:v},l))),

            // Mode — NEW filter
            React.createElement('select', { value:fMode,   onChange:e=>setFMode(e.target.value),   style:{...selInp, minWidth:'125px'} },
              [['All','All Modes'],['Online','🌐 Online'],['Offline','📄 Offline']].map(([v,l])=>
                React.createElement('option',{key:v,value:v},l))),

            // Reset
            React.createElement('button', {
              onClick:()=>{ setFGrade('All');setFStream('All');setFMonth('All');setFStatus('All');setFMode('All');setSearch(''); },
              style:{ padding:'9px 13px', background:'#F3F4F6', border:'none', borderRadius:'9px',
                       fontSize:'12px', cursor:'pointer', fontWeight:'600', color:'#6B7280' }
            }, '↺ Reset')
          ),
          React.createElement('div', { style:{ marginTop:'10px', fontSize:'12px', color:'#9CA3AF' } },
            `Showing ${filtered.length} of ${exams.length} exams`)
        ),

        // Table
        loading
          ? React.createElement('div', { style:{ textAlign:'center', padding:'80px', color:'#9CA3AF', fontSize:'15px' } }, '⏳ Loading…')
          : React.createElement('div', { style:{ background:'#fff', borderRadius:'14px', boxShadow:'0 2px 10px rgba(0,0,0,0.07)', overflow:'hidden' } },
              React.createElement('div', { style:{ overflowX:'auto' } },
                React.createElement('table', { style:{ width:'100%', borderCollapse:'collapse', minWidth: canManage?'1080px':'960px' } },
                  React.createElement('thead', null,
                    React.createElement('tr', { style:{ background:'linear-gradient(135deg,#1a1a2e,#16213e)', color:'#fff' } },
                      ['Date','Grade','Stream','Test Name','Status','Mode','Students','Avg Score','Notes','Update',
                       ...(canManage?['Schedule']:[])].map(h =>
                        React.createElement('th', { key:h,
                          style:{ padding:'12px 10px', textAlign:['Grade','Status','Mode','Students','Avg Score','Update','Schedule'].includes(h)?'center':'left',
                                   fontSize:'11px', fontWeight:'700', textTransform:'uppercase', letterSpacing:'.05em', whiteSpace:'nowrap' }
                        }, h)
                      )
                    )
                  ),
                  React.createElement('tbody', null,
                    filtered.length === 0
                      ? React.createElement('tr', null,
                          React.createElement('td', { colSpan: canManage?11:10,
                            style:{ padding:'60px', textAlign:'center', color:'#9CA3AF', fontSize:'15px' }
                          }, '📭 No exams match your filters'))
                      : filtered.map(exam => {
                          const sc = activeSchool || school;
                          return React.createElement(ExamRow, {
                            key:exam.id, exam,
                            cond: conductMap[`${sc}_${exam.id}`] || null,
                            onUpdate: setConductModal,
                            onEdit:   setScheduleModal,
                            onDelete: setDeleteTarget,
                            canManage,
                          });
                        })
                  )
                )
              ),
              React.createElement('div', { style:{ padding:'11px 16px', background:'#F9FAFB', borderTop:'1px solid #F3F4F6',
                                                    display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'8px' } },
                React.createElement('span', { style:{ fontSize:'12px', color:'#9CA3AF' } }, '⚠️ Yellow rows = past exams that need updating'),
                React.createElement('span', { style:{ fontSize:'12px', color:'#9CA3AF' } }, 'Refreshed: ' + new Date().toLocaleTimeString('en-IN'))
              )
            ),

        // Legend
        React.createElement('div', { style:{ marginTop:'14px', display:'flex', gap:'8px', flexWrap:'wrap' } },
          Object.values(S).map(s => pill(s.e+' '+s.label, s.bg, s.c, s.b)),
          pill('🌐 Online',  '#EFF6FF','#1D4ED8','#BFDBFE'),
          pill('📄 Offline', '#F5F3FF','#6D28D9','#DDD6FE'),
        )
      ),

      // Modals
      conductModal && React.createElement(ConductModal, {
        exam: conductModal,
        conduct: conductMap[conductDocId] || null,
        school: activeSchool || school,
        onClose: () => setConductModal(null),
        onSave: data => saveConductRecord(conductModal, data),
      }),

      scheduleModal && React.createElement(ScheduleModal, {
        exam: scheduleModal === true ? null : scheduleModal,
        onClose: () => setScheduleModal(null),
        onSave: onScheduleSaved,
      }),

      deleteTarget && React.createElement(DeleteConfirm, {
        exam: deleteTarget,
        onClose: () => setDeleteTarget(null),
        onConfirm: onScheduleDeleted,
      })
    );
  }

  window.ExamConductTracker = ExamConductTracker;
  console.log('✅ ExamConductTracker v2.0.0 loaded');

})();
