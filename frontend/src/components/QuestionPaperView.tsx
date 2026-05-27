'use client';

import React, { useState } from 'react';
import { Download, RotateCw, Printer } from 'lucide-react';
import { useAssignmentStore, ISection } from '../store/assignmentStore';
import styles from './QuestionPaperView.module.css';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:5000';

function computeMarks(sections: ISection[]): number {
  let marks = 0;
  sections.forEach((s) => s.questions.forEach((q) => { marks += q.marks; }));
  return marks;
}

export default function QuestionPaperView() {
  const { activeAssignment, regenerateAssignment, isLoading } = useAssignmentStore();

  const [studentName, setStudentName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [classSec, setClassSec] = useState('');
  const [selectedSet, setSelectedSet] = useState('A');

  if (!activeAssignment) return null;

  const sets = activeAssignment.sets || [];
  const currentSet = sets.find((s) => s.setName === selectedSet) || {
    setName: 'A',
    sections: activeAssignment.sections,
  };
  const sectionsToRender = currentSet.sections || [];
  const totalMarks = computeMarks(sectionsToRender);

  const handleDownload = () => {
    window.open(`${BACKEND_URL}/api/assignments/${activeAssignment._id}/pdf?set=${selectedSet}`, '_blank');
  };

  const handleRegenerate = async () => {
    if (!confirm('Regenerate all questions? Existing questions will be replaced.')) return;
    await regenerateAssignment(activeAssignment._id);
  };

  let globalQNum = 0;

  return (
    <div className={styles.wrapper}>
      <div className={styles.actionsBar}>
        {sets.length > 1 && (
          <div className={styles.setSelectorWrap}>
            <span className={styles.setLabel}>Exam Set:</span>
            {sets.map((set) => (
              <button
                key={set.setName}
                type="button"
                className={`${styles.setTabBtn} ${selectedSet === set.setName ? styles.setTabBtnActive : ''}`}
                onClick={() => setSelectedSet(set.setName)}
              >
                Set {set.setName}
              </button>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px', marginLeft: 'auto' }}>
          <button
            className={`${styles.actionBtn} ${styles.printBtn}`}
            onClick={handleDownload}
            aria-label="Download current set as PDF"
          >
            <Download size={14} aria-hidden="true" />
            Download PDF
          </button>
          <button
            className={`${styles.actionBtn} ${styles.printBtn}`}
            onClick={() => window.print()}
            aria-label="Print exam paper"
          >
            <Printer size={14} aria-hidden="true" />
            Print
          </button>
          <button
            className={`${styles.actionBtn} ${styles.regenBtn}`}
            onClick={handleRegenerate}
            disabled={isLoading}
            aria-label="Regenerate questions"
          >
            <RotateCw size={14} className={isLoading ? 'animate-spin' : ''} aria-hidden="true" />
            {isLoading ? 'Regenerating…' : 'Regenerate'}
          </button>
        </div>
      </div>

      <article className={styles.paper}>
        <div className={styles.watermark} aria-hidden="true">VEDA AI</div>

        <header className={styles.schoolHeader}>
          <div className={styles.schoolName}>Delhi Public School, Sector-4, Bokaro</div>
          <div className={styles.subjectLine}>
            Subject: {activeAssignment.subject}&nbsp;|&nbsp;Class: {activeAssignment.grade}
            {sets.length > 1 && (
              <span style={{ fontWeight: '800', marginLeft: '8px', color: 'var(--brand-orange)' }}>
                &nbsp;|&nbsp;SET {selectedSet}
              </span>
            )}
          </div>
        </header>

        <hr className={styles.boldRule} />

        <div className={styles.metaRow}>
          <span>Time Allowed: 45 minutes</span>
          <span>Maximum Marks: {totalMarks}</span>
        </div>

        <hr className={styles.thinRule} />

        <p className={styles.generalInstructions}>
          {activeAssignment.additionalInstructions || 'All questions are compulsory unless stated otherwise.'}
        </p>

        <div className={styles.studentFields}>
          <div className={styles.studentField}>
            <label htmlFor="student-name">Name:</label>
            <input
              id="student-name"
              className={styles.fieldLine}
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="__________________________"
            />
          </div>
          <div className={styles.studentField}>
            <label htmlFor="roll-no">Roll No:</label>
            <input
              id="roll-no"
              className={styles.fieldLine}
              type="text"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              placeholder="________"
            />
          </div>
          <div className={styles.studentField}>
            <label htmlFor="class-sec">Class/Sec:</label>
            <input
              id="class-sec"
              className={styles.fieldLine}
              type="text"
              value={classSec}
              onChange={(e) => setClassSec(e.target.value)}
              placeholder="______"
            />
          </div>
        </div>

        <hr className={styles.boldRule} />

        {sectionsToRender.map((section, sIdx) => {
          const label = String.fromCharCode(65 + sIdx);
          return (
            <section key={section._id ?? sIdx} className={styles.sectionBlock}>
              <div className={styles.sectionTitle}>Section {label}</div>
              <div className={styles.sectionInstruction}>{section.instruction}</div>

              {section.questions.map((q, qIdx) => {
                globalQNum++;
                return (
                  <div key={q._id ?? qIdx} className={styles.questionItem}>
                    <span className={styles.qNum}>{globalQNum}.</span>
                    <div className={styles.qBody}>
                      <span className={styles.qText}>{q.text}</span>

                      {q.options && q.options.length > 0 && (
                        <div className={styles.mcqGrid}>
                          {q.options.map((opt, oIdx) => (
                            <span key={oIdx} className={styles.mcqOpt}>
                              ({String.fromCharCode(97 + oIdx)}) {opt}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className={styles.qMeta}>
                        <span className={styles.qMarks}>[{q.marks} Mark{q.marks !== 1 ? 's' : ''}]</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>
          );
        })}

        <div className={styles.endLine}>— End of Question Paper —</div>

      </article>
    </div>
  );
}
