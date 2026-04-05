
// ============================================================
// CHANGE 1: In admin.js, find this exact block (around line 140):
//
//     })
//   }] : []), {
//     id: 'analytics',
//
// Replace with:
//
//     })
//   }] : []), ...(isSuperAdmin ? [{
//     id: 'archivesyllabus',
//     label: 'Archive Syllabus',
//     icon: React.createElement("i", {
//       className: "fa-solid fa-box-archive"
//     })
//   }] : []), {
//     id: 'analytics',
//
// ============================================================
// CHANGE 2: In admin.js, find this exact text (around line 494):
//
//   }), activeTab === 'analytics' && React.createElement(AdminAnalytics, {
//
// Add BEFORE that line:
//
//   activeTab === 'archivesyllabus' && isSuperAdmin && React.createElement(SyllabusArchiveManager, {
//     curriculum: curriculum,
//     academicYearSettings: academicYearSettings,
//   }),
//
// ============================================================
// CHANGE 3: Paste everything below this line at the very END of admin.js
// ============================================================

function SyllabusArchiveManager({ curriculum, academicYearSettings }) {
  const GRADES = ['11', '12'];

  const [selections, setSelections] = useState({});
  const [academicYear, setAcademicYear] = useState(
    academicYearSettings?.currentYear || CURRENT_ACADEMIC_YEAR || '2024-25'
  );
  const [step, setStep] = useState('select'); // 'select' | 'preview' | 'archiving' | 'done'
  const [previewData, setPreviewData] = useState([]);
  const [archiveLog, setArchiveLog] = useState([]);
  const [archiveProgress, setArchiveProgress] = useState(0);
  const [isArchiving, setIsArchiving] = useState(false);
  const logEndRef = useRef(null);

  // Auto-scroll log to bottom
  useEffect(() => {
    if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [archiveLog]);

  // --- Helpers ---
  const getKey = (school, subject, grade, isNEET) =>
    isNEET ? `${school}|NEET_${subject}|${grade}` : `${school}|${subject}|${grade}`;

  const getDocId = (school, subject, grade, isNEET) =>
    isNEET ? `${school}_NEET_${subject}_${grade}` : `${school}_${subject}_${grade}`;

  const getChapterCount = (school, subject, grade, isNEET) => {
    const docId = getDocId(school, subject, grade, isNEET);
    return (curriculum[docId]?.chapters || []).length;
  };

  const hasNEETBatch = (school, subject, grade) => {
    if (school !== 'EMRS Bhopal') return false;
    if (subject !== 'Physics' && subject !== 'Chemistry') return false;
    const docId = getDocId(school, subject, grade, true);
    return (curriculum[docId]?.chapters || []).length > 0;
  };

  const toggleSelection = (school, subject, grade, isNEET) => {
    const key = getKey(school, subject, grade, isNEET);
    setSelections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const selectedCombos = Object.entries(selections)
    .filter(([, checked]) => checked)
    .map(([key]) => {
      const isNEET = key.includes('|NEET_');
      if (isNEET) {
        const [school, neetSubject, grade] = key.split('|');
        const subject = neetSubject.replace('NEET_', '');
        return { school, subject, grade, isNEET: true };
      }
      const [school, subject, grade] = key.split('|');
      return { school, subject, grade, isNEET: false };
    });

  // --- Quick select helpers ---
  const selectAllForSchool = school => {
    const newSel = { ...selections };
    SUBJECTS.forEach(subject => {
      GRADES.forEach(grade => {
        newSel[getKey(school, subject, grade, false)] = true;
        if (hasNEETBatch(school, subject, grade)) {
          newSel[getKey(school, subject, grade, true)] = true;
        }
      });
    });
    setSelections(newSel);
  };

  const deselectAllForSchool = school => {
    const newSel = { ...selections };
    SUBJECTS.forEach(subject => {
      GRADES.forEach(grade => {
        newSel[getKey(school, subject, grade, false)] = false;
        newSel[getKey(school, subject, grade, true)] = false;
      });
    });
    setSelections(newSel);
  };

  const selectAll = () => {
    const newSel = {};
    SCHOOLS.forEach(school => {
      SUBJECTS.forEach(subject => {
        GRADES.forEach(grade => {
          newSel[getKey(school, subject, grade, false)] = true;
          if (hasNEETBatch(school, subject, grade)) {
            newSel[getKey(school, subject, grade, true)] = true;
          }
        });
      });
    });
    setSelections(newSel);
  };

  const deselectAll = () => setSelections({});

  // --- Build preview (uses in-memory curriculum state, no Firestore calls) ---
  const buildPreview = () => {
    if (!academicYear || !academicYear.match(/^\d{4}-\d{2,4}$/)) {
      alert('Please enter a valid academic year (e.g., 2024-25)');
      return;
    }
    if (selectedCombos.length === 0) {
      alert('Please select at least one combination to archive');
      return;
    }
    const preview = selectedCombos.map(({ school, subject, grade, isNEET }) => {
      const docId = getDocId(school, subject, grade, isNEET);
      const chapters = curriculum[docId]?.chapters || [];
      return {
        school,
        subject,
        grade,
        isNEET,
        docId,
        chapterCount: chapters.length,
        chapterIds: chapters.map(ch => ch.id),
        label: isNEET ? `${subject} (NEET)` : subject,
      };
    });
    setPreviewData(preview);
    setStep('preview');
  };

  // --- Execute archive ---
  const executeArchive = async () => {
    setStep('archiving');
    setArchiveLog([]);
    setArchiveProgress(0);
    setIsArchiving(true);

    const addLog = msg =>
      setArchiveLog(prev => [...prev, `${new Date().toLocaleTimeString()} — ${msg}`]);

    try {
      addLog(`🗄️  Starting Syllabus Archive | Academic Year: ${academicYear}`);
      addLog(`📋 ${previewData.length} curriculum(s) selected`);

      const total = previewData.length;

      for (let i = 0; i < previewData.length; i++) {
        const { school, subject, grade, isNEET, docId, chapterIds, label } = previewData[i];
        addLog(`\n📚 [${i + 1}/${total}] ${school} — ${label} Grade ${grade}`);

        // ── Step A: Archive the curriculum document ──
        const currDocRef = db.collection('curriculum').doc(docId);
        const currDoc = await currDocRef.get();

        if (currDoc.exists) {
          await db.collection('archives').doc(`curriculum_${academicYear}_${docId}`).set({
            ...currDoc.data(),
            originalDocId: docId,
            school,
            subject: isNEET ? `NEET_${subject}` : subject,
            grade,
            academicYear,
            archivedAt: new Date().toISOString(),
            type: 'curriculum',
          });
          addLog(`   ✅ Curriculum archived (${chapterIds.length} chapters)`);
        } else {
          addLog(`   ⚠️  No curriculum document found — skipping curriculum archive`);
        }

        // ── Step B: Archive chapterProgress docs in safe batches ──
        // Firestore batch limit = 500 ops. Each progress doc = 2 ops (set + delete).
        // So we process 200 chapters per batch to stay safe.
        const BATCH_CHUNK = 200;
        let progressArchived = 0;

        for (let j = 0; j < chapterIds.length; j += BATCH_CHUNK) {
          const chunk = chapterIds.slice(j, j + BATCH_CHUNK);
          const batch = db.batch();

          for (const chapterId of chunk) {
            const progressDocId = `${school}_${chapterId}`;
            const progressRef = db.collection('chapterProgress').doc(progressDocId);
            const progressDoc = await progressRef.get();

            if (progressDoc.exists) {
              const archiveRef = db.collection('archives').doc(
                `chapterProgress_${academicYear}_${progressDocId}`
              );
              batch.set(archiveRef, {
                ...progressDoc.data(),
                originalDocId: progressDocId,
                academicYear,
                archivedAt: new Date().toISOString(),
                type: 'chapterProgress',
              });
              batch.delete(progressRef);
              progressArchived++;
            }
          }

          await batch.commit();
        }

        addLog(`   ✅ ${progressArchived} progress records archived & deleted`);

        // ── Step C: Clear the live curriculum (chapters = []) ──
        // This makes it ready for new syllabus upload without losing the doc.
        await currDocRef.set({ chapters: [] });
        addLog(`   ✅ Live curriculum cleared — ready for new syllabus`);

        setArchiveProgress(Math.round(((i + 1) / total) * 100));
      }

      addLog(`\n🎉 Archive complete! ${previewData.length} curriculum(s) archived for ${academicYear}.`);
      addLog(`📦 All data saved in Firestore > archives collection.`);
      setStep('done');
    } catch (e) {
      addLog(`\n❌ Error: ${e.message}`);
      console.error('SyllabusArchiveManager error:', e);
    } finally {
      setIsArchiving(false);
    }
  };

  const resetAll = () => {
    setStep('select');
    setSelections({});
    setPreviewData([]);
    setArchiveLog([]);
    setArchiveProgress(0);
  };

  // ── RENDER: Step 1 — Select ──
  if (step === 'select') {
    return React.createElement('div', { className: 'p-6 max-w-5xl mx-auto' },

      // Page header
      React.createElement('div', { className: 'mb-6' },
        React.createElement('h2', { className: 'text-2xl font-bold text-gray-800 mb-1' },
          '🗄️ Archive Syllabus'
        ),
        React.createElement('p', { className: 'text-gray-500 text-sm' },
          'Select the school + subject + grade combinations to archive. Schools still in progress can be left unchecked — you do not need to archive everything at once.'
        )
      ),

      // Academic Year input
      React.createElement('div', { className: 'mb-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 flex flex-wrap items-end gap-6' },
        React.createElement('div', null,
          React.createElement('label', { className: 'block font-semibold text-yellow-800 mb-2 text-sm' },
            '📅 Academic Year Being Archived'
          ),
          React.createElement('input', {
            type: 'text',
            value: academicYear,
            onChange: e => setAcademicYear(e.target.value),
            placeholder: '2024-25',
            className: 'border-2 border-yellow-300 rounded-lg px-3 py-2 font-mono text-gray-800 w-36 focus:outline-none focus:border-yellow-500 text-sm',
          }),
          React.createElement('p', { className: 'text-xs text-yellow-700 mt-1' },
            'Format: YYYY-YY  e.g. 2024-25'
          )
        ),
        React.createElement('div', { className: 'bg-yellow-100 border border-yellow-300 rounded-lg px-4 py-2 text-sm text-yellow-800' },
          React.createElement('strong', null, '💡 What gets archived: '),
          'The chapter list (syllabus) + all teacher progress records for the selected combinations. The live curriculum will be cleared so new syllabus can be uploaded.'
        )
      ),

      // Quick select bar
      React.createElement('div', { className: 'flex flex-wrap gap-2 mb-5 items-center' },
        React.createElement('button', {
          onClick: selectAll,
          className: 'px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors',
        }, '☑️  Select All'),
        React.createElement('button', {
          onClick: deselectAll,
          className: 'px-3 py-1.5 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors',
        }, '⬜  Clear All'),
        React.createElement('span', { className: 'ml-auto text-sm font-semibold text-gray-600' },
          `${selectedCombos.length} combination${selectedCombos.length !== 1 ? 's' : ''} selected`
        )
      ),

      // School blocks
      ...SCHOOLS.map(school =>
        React.createElement('div', {
          key: school,
          className: 'mb-5 bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm',
        },

          // School header
          React.createElement('div', {
            className: 'bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between',
          },
            React.createElement('h3', { className: 'font-bold text-gray-800 text-sm' },
              `🏫 ${school}`
            ),
            React.createElement('div', { className: 'flex gap-2' },
              React.createElement('button', {
                onClick: () => selectAllForSchool(school),
                className: 'text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-medium transition-colors',
              }, 'Select All'),
              React.createElement('button', {
                onClick: () => deselectAllForSchool(school),
                className: 'text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 font-medium transition-colors',
              }, 'Clear')
            )
          ),

          // Subject × Grade grid
          React.createElement('div', { className: 'overflow-x-auto' },
            React.createElement('table', { className: 'w-full text-sm' },

              React.createElement('thead', null,
                React.createElement('tr', { className: 'text-gray-500 text-xs uppercase tracking-wide' },
                  React.createElement('th', { className: 'text-left px-4 py-2 font-semibold w-44' }, 'Subject'),
                  ...GRADES.map(grade =>
                    React.createElement('th', { key: grade, className: 'text-center px-6 py-2 font-semibold' },
                      `Grade ${grade}`
                    )
                  )
                )
              ),

              React.createElement('tbody', null,
                ...SUBJECTS.flatMap(subject => {
                  const rows = [];

                  // Regular row
                  rows.push(
                    React.createElement('tr', {
                      key: `${subject}-regular`,
                      className: 'border-t border-gray-100 hover:bg-gray-50 transition-colors',
                    },
                      React.createElement('td', { className: 'px-4 py-3 font-medium text-gray-700' }, subject),
                      ...GRADES.map(grade => {
                        const count = getChapterCount(school, subject, grade, false);
                        const key = getKey(school, subject, grade, false);
                        const checked = !!selections[key];
                        return React.createElement('td', {
                          key: grade,
                          className: 'px-6 py-3 text-center',
                        },
                          React.createElement('label', {
                            className: 'inline-flex flex-col items-center gap-1 cursor-pointer',
                          },
                            React.createElement('input', {
                              type: 'checkbox',
                              checked,
                              onChange: () => toggleSelection(school, subject, grade, false),
                              className: 'w-4 h-4 rounded accent-blue-600 cursor-pointer',
                            }),
                            React.createElement('span', {
                              className: `text-xs font-medium ${count > 0 ? 'text-green-700' : 'text-gray-400'}`,
                            }, `${count} ch`)
                          )
                        );
                      })
                    )
                  );

                  // NEET batch row (only for EMRS Bhopal + Physics/Chemistry if data exists)
                  const showNEET = GRADES.some(grade => hasNEETBatch(school, subject, grade));
                  if (showNEET) {
                    rows.push(
                      React.createElement('tr', {
                        key: `${subject}-neet`,
                        className: 'border-t border-orange-100 bg-orange-50 hover:bg-orange-100 transition-colors',
                      },
                        React.createElement('td', { className: 'px-4 py-2.5 text-orange-700 font-medium text-xs' },
                          `${subject} `,
                          React.createElement('span', {
                            className: 'bg-orange-200 text-orange-800 px-1.5 py-0.5 rounded text-xs font-bold',
                          }, 'NEET Batch')
                        ),
                        ...GRADES.map(grade => {
                          const count = getChapterCount(school, subject, grade, true);
                          const key = getKey(school, subject, grade, true);
                          const checked = !!selections[key];
                          return React.createElement('td', {
                            key: grade,
                            className: 'px-6 py-2.5 text-center',
                          },
                            React.createElement('label', {
                              className: 'inline-flex flex-col items-center gap-1 cursor-pointer',
                            },
                              React.createElement('input', {
                                type: 'checkbox',
                                checked,
                                onChange: () => toggleSelection(school, subject, grade, true),
                                className: 'w-4 h-4 rounded accent-orange-500 cursor-pointer',
                              }),
                              React.createElement('span', {
                                className: `text-xs font-medium ${count > 0 ? 'text-orange-700' : 'text-gray-400'}`,
                              }, `${count} ch`)
                            )
                          );
                        })
                      )
                    );
                  }

                  return rows;
                })
              )
            )
          )
        )
      ),

      // Footer action bar
      React.createElement('div', { className: 'mt-6 flex items-center justify-between bg-white border-2 border-gray-200 rounded-xl p-4' },
        React.createElement('div', { className: 'text-sm text-gray-500' },
          selectedCombos.length === 0
            ? 'Select combinations above to continue'
            : `${selectedCombos.length} combination${selectedCombos.length !== 1 ? 's' : ''} ready to archive`
        ),
        React.createElement('button', {
          onClick: buildPreview,
          disabled: selectedCombos.length === 0,
          className: 'px-6 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors',
        }, `Preview Archive →`)
      )
    );
  }

  // ── RENDER: Step 2 — Preview ──
  if (step === 'preview') {
    const totalChapters = previewData.reduce((sum, d) => sum + d.chapterCount, 0);

    return React.createElement('div', { className: 'p-6 max-w-3xl mx-auto' },

      React.createElement('h2', { className: 'text-2xl font-bold text-gray-800 mb-1' },
        '🔍 Review Before Archiving'
      ),
      React.createElement('p', { className: 'text-gray-500 text-sm mb-6' },
        `This is what will be archived under Academic Year: `,
        React.createElement('strong', null, academicYear)
      ),

      // Warning box
      React.createElement('div', { className: 'bg-orange-50 border-2 border-orange-300 rounded-xl p-5 mb-6' },
        React.createElement('p', { className: 'font-bold text-orange-800 mb-2' }, '⚠️ This action will:'),
        React.createElement('ul', { className: 'text-sm text-orange-700 space-y-1 list-disc ml-5' },
          React.createElement('li', null,
            `Archive the syllabus (chapter list) for `,
            React.createElement('strong', null, `${previewData.length} combination(s)`)
          ),
          React.createElement('li', null,
            `Archive and permanently delete all chapter progress records for those combinations`
          ),
          React.createElement('li', null,
            `Clear the live curriculum (set chapters to empty) so new syllabus can be uploaded`
          ),
          React.createElement('li', null,
            `All archived data is saved in Firestore under the `,
            React.createElement('code', { className: 'bg-orange-100 px-1 rounded' }, 'archives'),
            ` collection`
          )
        )
      ),

      // Preview table
      React.createElement('div', { className: 'bg-white border-2 border-gray-200 rounded-xl overflow-hidden mb-6' },
        React.createElement('table', { className: 'w-full text-sm' },
          React.createElement('thead', null,
            React.createElement('tr', { className: 'bg-gray-50 border-b border-gray-200 text-gray-600 text-xs uppercase tracking-wide' },
              React.createElement('th', { className: 'text-left px-4 py-3' }, 'School'),
              React.createElement('th', { className: 'text-left px-4 py-3' }, 'Subject'),
              React.createElement('th', { className: 'text-center px-4 py-3' }, 'Grade'),
              React.createElement('th', { className: 'text-center px-4 py-3' }, 'Chapters to Archive')
            )
          ),
          React.createElement('tbody', null,
            ...previewData.map((row, idx) =>
              React.createElement('tr', {
                key: idx,
                className: `border-t border-gray-100 ${row.isNEET ? 'bg-orange-50' : ''}`,
              },
                React.createElement('td', { className: 'px-4 py-3 text-gray-800' }, row.school),
                React.createElement('td', { className: 'px-4 py-3 text-gray-800 font-medium' },
                  row.label,
                  row.isNEET && React.createElement('span', {
                    className: 'ml-2 text-xs bg-orange-200 text-orange-800 px-1.5 py-0.5 rounded font-bold',
                  }, 'NEET')
                ),
                React.createElement('td', { className: 'px-4 py-3 text-center text-gray-700' }, row.grade),
                React.createElement('td', { className: 'px-4 py-3 text-center' },
                  React.createElement('span', {
                    className: `font-bold ${row.chapterCount > 0 ? 'text-blue-700' : 'text-gray-400'}`,
                  }, row.chapterCount),
                  row.chapterCount === 0 && React.createElement('span', {
                    className: 'ml-1 text-xs text-gray-400',
                  }, '(empty)')
                )
              )
            ),

            // Totals row
            React.createElement('tr', { className: 'bg-gray-100 border-t-2 border-gray-300' },
              React.createElement('td', {
                className: 'px-4 py-3 font-bold text-gray-800',
                colSpan: 3,
              }, `Total (${previewData.length} combinations)`),
              React.createElement('td', { className: 'px-4 py-3 text-center font-bold text-blue-800 text-base' },
                totalChapters
              )
            )
          )
        )
      ),

      // Action buttons
      React.createElement('div', { className: 'flex gap-4' },
        React.createElement('button', {
          onClick: () => setStep('select'),
          className: 'px-5 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors',
        }, '← Back & Edit'),
        React.createElement('button', {
          onClick: executeArchive,
          className: 'px-7 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2',
        },
          '🗄️  Confirm & Archive — AY ',
          academicYear
        )
      )
    );
  }

  // ── RENDER: Step 3 — Archiving ──
  if (step === 'archiving') {
    return React.createElement('div', { className: 'p-6 max-w-2xl mx-auto' },

      React.createElement('h2', { className: 'text-2xl font-bold text-gray-800 mb-6' },
        '⏳ Archiving in Progress...'
      ),

      // Progress bar
      React.createElement('div', { className: 'mb-5' },
        React.createElement('div', { className: 'flex justify-between text-sm text-gray-600 mb-1.5' },
          React.createElement('span', { className: 'font-medium' }, 'Progress'),
          React.createElement('span', { className: 'font-bold' }, `${archiveProgress}%`)
        ),
        React.createElement('div', { className: 'h-4 bg-gray-200 rounded-full overflow-hidden' },
          React.createElement('div', {
            className: 'h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 rounded-full',
            style: { width: `${archiveProgress}%` },
          })
        )
      ),

      // Live log
      React.createElement('div', {
        className: 'bg-gray-900 text-green-400 font-mono text-xs p-4 rounded-xl h-72 overflow-y-auto space-y-0.5 leading-relaxed',
      },
        ...archiveLog.map((line, i) =>
          React.createElement('div', { key: i, className: 'whitespace-pre-wrap' }, line)
        ),
        React.createElement('div', { ref: logEndRef })
      ),

      React.createElement('p', { className: 'text-center text-sm text-gray-400 mt-4' },
        '⚠️ Please do not close this tab while archiving is in progress'
      )
    );
  }

  // ── RENDER: Step 4 — Done ──
  if (step === 'done') {
    const totalChapters = previewData.reduce((sum, d) => sum + d.chapterCount, 0);

    return React.createElement('div', { className: 'p-6 max-w-2xl mx-auto' },

      // Success banner
      React.createElement('div', { className: 'text-center mb-8' },
        React.createElement('div', { className: 'text-6xl mb-3' }, '🎉'),
        React.createElement('h2', { className: 'text-2xl font-bold text-gray-800 mb-2' },
          'Archive Complete!'
        ),
        React.createElement('p', { className: 'text-gray-600' },
          `${previewData.length} curriculum(s) with ${totalChapters} chapters archived for `,
          React.createElement('strong', null, academicYear),
          '. The curricula are now empty and ready for new syllabus upload.'
        )
      ),

      // Summary cards
      React.createElement('div', { className: 'grid grid-cols-3 gap-4 mb-6' },
        React.createElement('div', { className: 'bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center' },
          React.createElement('div', { className: 'text-2xl font-bold text-blue-800' }, previewData.length),
          React.createElement('div', { className: 'text-xs text-blue-600 mt-1' }, 'Curricula Archived')
        ),
        React.createElement('div', { className: 'bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center' },
          React.createElement('div', { className: 'text-2xl font-bold text-green-800' }, totalChapters),
          React.createElement('div', { className: 'text-xs text-green-600 mt-1' }, 'Chapters Saved')
        ),
        React.createElement('div', { className: 'bg-purple-50 border-2 border-purple-200 rounded-xl p-4 text-center' },
          React.createElement('div', { className: 'text-2xl font-bold text-purple-800' }, academicYear),
          React.createElement('div', { className: 'text-xs text-purple-600 mt-1' }, 'Academic Year Tagged')
        )
      ),

      // Archive log (collapsed, scrollable)
      React.createElement('details', { className: 'mb-6' },
        React.createElement('summary', { className: 'cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-700 mb-2' },
          '📋 View archive log'
        ),
        React.createElement('div', {
          className: 'bg-gray-900 text-green-400 font-mono text-xs p-4 rounded-xl h-48 overflow-y-auto space-y-0.5 leading-relaxed mt-2',
        },
          ...archiveLog.map((line, i) =>
            React.createElement('div', { key: i, className: 'whitespace-pre-wrap' }, line)
          )
        )
      ),

      // Action buttons
      React.createElement('div', { className: 'flex gap-4 flex-wrap' },
        React.createElement('button', {
          onClick: resetAll,
          className: 'px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors',
        }, '🔄 Archive More Subjects'),
        React.createElement('a', {
          href: '#',
          onClick: e => { e.preventDefault(); window.location.reload(); },
          className: 'px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-colors inline-block text-center',
        }, '🔃 Reload App')
      ),
      React.createElement('p', { className: 'text-xs text-gray-400 mt-4' },
        '💡 Tip: After archiving, go to the Curriculum tab to upload new syllabus for the selected schools and subjects.'
      )
    );
  }

  return null;
}
