'use client';

import React, { useState } from 'react';
import { Printer, Download, RotateCw, CheckCircle, FileText } from 'lucide-react';
import { useAssignmentStore, ISection } from '../store/assignmentStore';
import styles from './QuestionPaperView.module.css';

export default function QuestionPaperView() {
  const { activeAssignment, regenerateAssignment, isLoading } = useAssignmentStore();

  // Student details input states
  const [studentName, setStudentName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [sectionCode, setSectionCode] = useState('');

  if (!activeAssignment) return null;

  // Calculate total marks dynamically
  let totalMarks = 0;
  activeAssignment.sections.forEach((s) => {
    s.questions.forEach((q) => {
      totalMarks += q.marks;
    });
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Standard file transfer download linking directly to PDF Kit Stream
    window.open(`http://localhost:5000/api/assignments/${activeAssignment._id}/pdf`, '_blank');
  };

  const handleRegenerate = async () => {
    if (confirm('Are you sure you want to regenerate all questions for this assignment? This will replace current questions.')) {
      await regenerateAssignment(activeAssignment._id);
    }
  };

  return (
    <div className={styles.container}>
      {/* 1. floating Header Actions bar */}
      <div className={styles.actionsBar}>
        <div className={styles.actionsLeft}>
          <span className={styles.titleHint}>ACTIVE ASSESSMENT VIEW</span>
          <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} style={{ color: 'var(--brand-orange)' }} />
            <span>{activeAssignment.title}</span>
          </h2>
        </div>

        <div className={styles.actionsRight}>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={handlePrint}>
            <Printer size={16} />
            <span>Print Sheet</span>
          </button>
          
          <button className={`${styles.btn} ${styles.btnRegen}`} onClick={handleRegenerate} disabled={isLoading}>
            <RotateCw size={16} className={isLoading ? 'animate-spin' : ''} />
            <span>{isLoading ? 'Regenerating...' : 'Regenerate'}</span>
          </button>

          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleDownloadPDF}>
            <Download size={16} />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* 2. Structured Printable Exam Paper Sheet */}
      <article className={styles.paperSheet}>
        {/* Background Subtle Watermark */}
        <div className={styles.watermark}>VEDA AI EXAM SYSTEM</div>

        {/* Paper Header */}
        <header className={styles.paperHeader}>
          <h1 className={styles.paperTitle}>{activeAssignment.title}</h1>
          <div className={styles.paperMeta}>
            <span><strong>SUBJECT:</strong> {activeAssignment.subject.toUpperCase()}</span>
            <span><strong>CLASS LEVEL:</strong> {activeAssignment.grade.toUpperCase()}</span>
            <span><strong>DATE:</strong> {new Date(activeAssignment.dueDate).toLocaleDateString()}</span>
          </div>
          <hr className={styles.divider} />
        </header>

        {/* Student metadata input block matching Figma */}
        <section className={styles.studentBox}>
          <div className={styles.studentField}>
            <span>STUDENT NAME:</span>
            <input
              type="text"
              placeholder="Enter full name"
              className={styles.studentInputLine}
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
            />
          </div>
          <div className={styles.studentField}>
            <span>ROLL NO:</span>
            <input
              type="text"
              placeholder="e.g. 45"
              className={styles.studentInputLine}
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
            />
          </div>
          <div className={styles.studentField}>
            <span>SECTION:</span>
            <input
              type="text"
              placeholder="e.g. A"
              className={styles.studentInputLine}
              value={sectionCode}
              onChange={(e) => setSectionCode(e.target.value)}
            />
          </div>
        </section>

        {/* Instructions Block */}
        {activeAssignment.additionalInstructions && (
          <section className={styles.instructionsBlock}>
            <div className={styles.instructionsTitle}>GENERAL INSTRUCTIONS:</div>
            <p style={{ fontStyle: 'italic' }}>{activeAssignment.additionalInstructions}</p>
          </section>
        )}

        {/* Total Marks display */}
        <div className={styles.marksSummary}>
          <span>TOTAL MARKS: {totalMarks}</span>
        </div>

        {/* Rendering Sections */}
        {activeAssignment.sections && activeAssignment.sections.length > 0 ? (
          activeAssignment.sections.map((section: ISection, sIdx: number) => (
            <section key={section._id || sIdx} className={styles.sectionBlock}>
              {/* Section Divider */}
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>{section.title}</h3>
                <p className={styles.sectionInstruction}>Instruction: {section.instruction}</p>
              </div>

              {/* Questions Loop */}
              <div className={styles.questionsList}>
                {section.questions.map((question, qIdx) => (
                  <div key={question._id || qIdx} className={styles.questionRow}>
                    {/* Index */}
                    <span className={styles.questionNum}>{qIdx + 1}.</span>

                    {/* Question Content */}
                    <div className={styles.questionContent}>
                      <p className={styles.questionText}>{question.text}</p>
                      
                      {/* MCQ Grid if options are available */}
                      {question.options && question.options.length > 0 && (
                        <div className={styles.mcqGrid}>
                          {question.options.map((opt, oIdx) => (
                            <div key={oIdx} className={styles.mcqOption}>
                              <span className={styles.mcqLetter}>{String.fromCharCode(65 + oIdx)})</span>
                              <span>{opt}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Question tags showing difficulty badges */}
                      <div className={`${styles.tagRow} no-print`}>
                        <span
                          className={`${styles.diffBadge} ${
                            question.difficulty === 'Easy'
                              ? styles.badgeEasy
                              : question.difficulty === 'Moderate'
                              ? styles.badgeModerate
                              : styles.badgeHard
                          }`}
                        >
                          {question.difficulty}
                        </span>
                        {question.correctAnswer && (
                          <span
                            style={{
                              fontSize: '11px',
                              color: '#166534',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <CheckCircle size={10} />
                            <span>Correct: {question.correctAnswer}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Marks right aligned */}
                    <span className={styles.questionMarks}>[{question.marks} M]</span>
                  </div>
                ))}
              </div>
            </section>
          ))
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0' }}>
            No question sections available on this assignment.
          </div>
        )}
      </article>
    </div>
  );
}
