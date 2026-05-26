'use client';

import React, { useState } from 'react';
import { Download, RotateCw, Printer } from 'lucide-react';
import { useAssignmentStore, ISection } from '../store/assignmentStore';
import styles from './QuestionPaperView.module.css';

export default function QuestionPaperView() {
  const { activeAssignment, regenerateAssignment, isLoading } = useAssignmentStore();

  const [studentName, setStudentName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [classSec, setClassSec] = useState('');

  if (!activeAssignment) return null;

  // ── Computed totals ────────────────────────────────────────────────────────
  let totalMarks = 0;
  let totalQuestions = 0;
  activeAssignment.sections.forEach((s) => {
    s.questions.forEach((q) => {
      totalMarks += q.marks;
      totalQuestions++;
    });
  });

  // ── Collect MCQ correct answers for answer key ─────────────────────────────
  const hasAnswerKey = activeAssignment.sections.some((s) =>
    s.questions.some((q) => q.correctAnswer)
  );

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleDownloadPDF = () => {
    window.open(`http://localhost:5000/api/assignments/${activeAssignment._id}/pdf`, '_blank');
  };

  const handleRegenerate = async () => {
    if (confirm('Regenerate all questions for this assignment? Current questions will be replaced.')) {
      await regenerateAssignment(activeAssignment._id);
    }
  };

  // ── Difficulty tag class ───────────────────────────────────────────────────
  const tagClass = (d: string) =>
    d === 'Easy' ? styles.tagEasy : d === 'Moderate' ? styles.tagModerate : styles.tagHard;

  // ── Build a flat question list with running numbers ────────────────────────
  let globalQNum = 0;

  return (
    <div className={styles.wrapper}>
      {/* 1. AI Greeting Banner */}
      <div className={styles.aiBanner}>
        <p className={styles.aiMessage}>
          <strong>Certainly!</strong> Here is a customized Question Paper for your{' '}
          <strong>{activeAssignment.subject}</strong> class on <strong>{activeAssignment.grade}</strong>.
          {activeAssignment.additionalInstructions
            ? ` Based on your instructions: "${activeAssignment.additionalInstructions.slice(0, 120)}…"`
            : ' The paper is structured with sections and difficulty-tagged questions for easy grading.'}
        </p>
        <button className={styles.downloadBtn} onClick={handleDownloadPDF}>
          <Download size={14} />
          Download as PDF
        </button>
      </div>

      {/* 2. Secondary action row */}
      <div className={styles.actionsBar}>
        <button className={`${styles.actionBtn} ${styles.printBtn}`} onClick={() => window.print()}>
          <Printer size={14} />
          Print
        </button>
        <button
          className={`${styles.actionBtn} ${styles.regenBtn}`}
          onClick={handleRegenerate}
          disabled={isLoading}
        >
          <RotateCw size={14} className={isLoading ? 'animate-spin' : ''} />
          {isLoading ? 'Regenerating…' : 'Regenerate'}
        </button>
      </div>

      {/* 3. Printable Exam Sheet */}
      <article className={styles.paper}>
        <div className={styles.watermark}>VEDA AI</div>

        {/* School Header */}
        <div className={styles.schoolHeader}>
          <div className={styles.schoolName}>Delhi Public School, Sector-4, Bokaro</div>
          <div className={styles.subjectLine}>
            Subject: {activeAssignment.subject} &nbsp;|&nbsp; Class: {activeAssignment.grade}
          </div>
        </div>

        <hr className={styles.boldRule} />

        {/* Time & Marks */}
        <div className={styles.metaRow}>
          <span>Time Allowed: 45 minutes</span>
          <span>Maximum Marks: {totalMarks}</span>
        </div>

        <hr className={styles.thinRule} />

        {/* General Instructions */}
        <p className={styles.generalInstructions}>
          {activeAssignment.additionalInstructions ||
            'All questions are compulsory unless stated otherwise.'}
        </p>

        {/* Student Fields */}
        <div className={styles.studentFields}>
          <div className={styles.studentField}>
            <span>Name:</span>
            <input
              className={styles.fieldLine}
              type="text"
              placeholder="__________________________"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
            />
          </div>
          <div className={styles.studentField}>
            <span>Roll Number:</span>
            <input
              className={styles.fieldLine}
              type="text"
              placeholder="________"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              style={{ minWidth: 80 }}
            />
          </div>
          <div className={styles.studentField}>
            <span>Class/Sec:</span>
            <input
              className={styles.fieldLine}
              type="text"
              placeholder="______"
              value={classSec}
              onChange={(e) => setClassSec(e.target.value)}
              style={{ minWidth: 64 }}
            />
          </div>
        </div>

        <hr className={styles.boldRule} />

        {/* Question Sections */}
        {activeAssignment.sections.map((section: ISection, sIdx: number) => {
          const sectionLabel = String.fromCharCode(65 + sIdx); // A, B, C…
          return (
            <div key={section._id || sIdx} className={styles.sectionBlock}>
              {/* Section heading */}
              <div className={styles.sectionTitle}>Section {sectionLabel}</div>
              <div className={styles.sectionInstruction}>{section.instruction}</div>

              {/* Questions */}
              {section.questions.map((q, qIdx) => {
                globalQNum++;
                return (
                  <div key={q._id || qIdx} className={styles.questionItem}>
                    <span className={styles.qNum}>{globalQNum}.</span>
                    <div className={styles.qBody}>
                      <span className={styles.qText}>{q.text}</span>

                      {/* MCQ Options */}
                      {q.options && q.options.length > 0 && (
                        <div className={styles.mcqGrid}>
                          {q.options.map((opt, oIdx) => (
                            <span key={oIdx} className={styles.mcqOpt}>
                              ({String.fromCharCode(97 + oIdx)}) {opt}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Tags + Marks */}
                      <div className={styles.qMeta}>
                        <span className={`${styles.tag} ${tagClass(q.difficulty)}`}>
                          {q.difficulty}
                        </span>
                        <span className={styles.qMarks}>[{q.marks} Mark{q.marks !== 1 ? 's' : ''}]</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* End of Paper */}
        <div className={styles.endLine}>— End of Question Paper —</div>

        {/* Answer Key (MCQ only) */}
        {hasAnswerKey && (
          <div className={styles.answerKey}>
            <div className={styles.answerKeyTitle}>Answer Key</div>
            <div className={styles.answerList}>
              {(() => {
                let num = 0;
                return activeAssignment.sections.flatMap((s) =>
                  s.questions
                    .filter((q) => q.correctAnswer)
                    .map((q) => {
                      num++;
                      return (
                        <div key={num} className={styles.answerItem}>
                          <span className={styles.answerNum}>{num}.</span>
                          <span>
                            {q.correctAnswer}
                          </span>
                        </div>
                      );
                    })
                );
              })()}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
