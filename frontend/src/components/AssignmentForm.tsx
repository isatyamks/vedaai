'use client';

import React, { useState } from 'react';
import {
  Upload,
  Plus,
  X,
  Calendar,
  AlertCircle,
  FileText,
  Mic,
  ArrowLeft,
  ArrowRight,
  Check,
} from 'lucide-react';
import { useAssignmentStore, ISectionConfig } from '../store/assignmentStore';
import styles from './AssignmentForm.module.css';

// Question type options matching the Figma design
const QUESTION_TYPE_OPTIONS = [
  { label: 'Multiple Choice Questions', value: 'MCQ' },
  { label: 'Short Questions', value: 'Short' },
  { label: 'Diagram / Graph-Based Questions', value: 'Long' },
  { label: 'Numerical Problems', value: 'Long' },
  { label: 'Descriptive / Essay Questions', value: 'Long' },
  { label: 'True / False Questions', value: 'MCQ' },
  { label: 'Fill in the Blanks', value: 'Short' },
];

interface QuestionRow {
  id: number;
  typeLabel: string;
  backendType: 'MCQ' | 'Short' | 'Long';
  count: number;
  marks: number;
}

let rowIdCounter = 3;

export default function AssignmentForm() {
  const { createAssignment, isLoading, errorMessage, setCreationForm } = useAssignmentStore();

  // Step tracker — 1: Upload/Details, 2: Review
  const [step, setStep] = useState(1);

  // Basic Details State
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [instructions, setInstructions] = useState('');
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Question rows (matching Figma's table UI)
  const [rows, setRows] = useState<QuestionRow[]>([
    { id: 1, typeLabel: 'Multiple Choice Questions', backendType: 'MCQ', count: 4, marks: 1 },
    { id: 2, typeLabel: 'Short Questions', backendType: 'Short', count: 4, marks: 4 },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─── Row Actions ──────────────────────────────────────────────────────────

  const addRow = () => {
    rowIdCounter++;
    setRows((prev) => [
      ...prev,
      { id: rowIdCounter, typeLabel: 'Multiple Choice Questions', backendType: 'MCQ', count: 4, marks: 1 },
    ]);
  };

  const removeRow = (id: number) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRowType = (id: number, label: string) => {
    const match = QUESTION_TYPE_OPTIONS.find((o) => o.label === label);
    setRows((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, typeLabel: label, backendType: (match?.value as 'MCQ' | 'Short' | 'Long') || 'Short' }
          : r
      )
    );
  };

  const adjustCount = (id: number, field: 'count' | 'marks', delta: number) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, [field]: Math.max(1, r[field] + delta) } : r
      )
    );
  };

  // ─── File Upload ──────────────────────────────────────────────────────────

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setTimeout(() => {
        setUploadedFile(file.name);
        setIsUploading(false);
        const ctx = `[Reference File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)] — Extract context from attached syllabus.`;
        setInstructions((prev) => (prev ? `${ctx}\n\n${prev}` : ctx));
      }, 1200);
    }
  };

  // ─── Totals ───────────────────────────────────────────────────────────────

  const totalQuestions = rows.reduce((acc, r) => acc + r.count, 0);
  const totalMarks = rows.reduce((acc, r) => acc + r.count * r.marks, 0);

  // ─── Validation ───────────────────────────────────────────────────────────

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!subject) errs.subject = 'Please select a subject.';
    if (!grade) errs.grade = 'Please select a grade.';
    if (!dueDate) errs.dueDate = 'Due date is required.';
    if (rows.length === 0) errs.rows = 'Add at least one question type.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!validate()) return;

    // Build an assignment title from subject + grade
    const autoTitle = `${subject} Assessment — ${grade}`;

    // Map rows → ISectionConfig[]
    const sections: ISectionConfig[] = rows.map((r, idx) => ({
      title: `Section ${String.fromCharCode(65 + idx)}: ${r.typeLabel}`,
      type: r.backendType,
      count: r.count,
      marksPerQuestion: r.marks,
      difficulty: 'Moderate',
    }));

    await createAssignment({
      title: autoTitle,
      subject,
      grade,
      dueDate,
      additionalInstructions: instructions,
      sections,
    });
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className={styles.pageWrapper}>
      {/* Step progress bar */}
      <div className={styles.stepper}>
        <div className={`${styles.step} ${step >= 1 ? styles.stepActive : ''}`}>
          <div className={styles.stepCircle}>
            {step > 1 ? <Check size={13} /> : '1'}
          </div>
          <span>Upload Material</span>
        </div>
        <div className={styles.stepLine} />
        <div className={`${styles.step} ${step >= 2 ? styles.stepActive : ''}`}>
          <div className={styles.stepCircle}>2</div>
          <span>Configure</span>
        </div>
        <div className={styles.stepLine} />
        <div className={`${styles.step} ${step >= 3 ? styles.stepActive : ''}`}>
          <div className={styles.stepCircle}>3</div>
          <span>Review</span>
        </div>
      </div>

      <form
        className={styles.formContainer}
        onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
        noValidate
      >
        {/* ── Section Header ── */}
        <div className={styles.formHeader}>
          <h2>Assignment Details</h2>
          <p>Basic information about your assignment</p>
        </div>

        {/* ── File Upload Zone ── */}
        {!uploadedFile && !isUploading && (
          <label className={styles.uploadZone}>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.docx,.txt"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <div className={styles.uploadIconWrap}>
              <Upload size={28} />
            </div>
            <p className={styles.uploadTitle}>Choose a file or drag &amp; drop it here</p>
            <p className={styles.uploadSubtitle}>PDF, PNG, and DOCX</p>
            <div className={styles.browseBtn}>Browse Files</div>
            <p className={styles.uploadCaption}>Upload images of your preferred document/image</p>
          </label>
        )}

        {isUploading && (
          <div className={styles.uploadZone}>
            <div style={{ fontSize: 28 }}>⏳</div>
            <p className={styles.uploadTitle}>Parsing file...</p>
          </div>
        )}

        {uploadedFile && (
          <div className={styles.uploadedFileBar}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={16} />
              <span>{uploadedFile}</span>
            </div>
            <button type="button" className={styles.removeFileBtn} onClick={() => setUploadedFile(null)}>
              Remove
            </button>
          </div>
        )}

        {/* ── Subject & Grade (hidden from UI but needed for generation) ── */}
        {/* Compact inline row matching Figma's clean layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className={styles.fieldLabel}>Subject</label>
            <select
              className={styles.typeSelect}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              <option value="">Select Subject</option>
              <option>Science (General)</option>
              <option>Mathematics</option>
              <option>Physics</option>
              <option>Chemistry</option>
              <option>Biology</option>
              <option>Computer Science</option>
              <option>History</option>
              <option>Geography</option>
              <option>English Literature</option>
            </select>
            {errors.subject && <span className={styles.errorMsg}>{errors.subject}</span>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className={styles.fieldLabel}>Grade / Class</label>
            <select
              className={styles.typeSelect}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            >
              <option value="">Select Grade</option>
              <option>Grade 6</option>
              <option>Grade 7</option>
              <option>Grade 8</option>
              <option>Grade 9</option>
              <option>Grade 10</option>
              <option>Grade 11</option>
              <option>Grade 12</option>
              <option>Undergraduate</option>
            </select>
            {errors.grade && <span className={styles.errorMsg}>{errors.grade}</span>}
          </div>
        </div>

        {/* ── Due Date ── */}
        <div className={styles.dueDateRow}>
          <label className={styles.fieldLabel}>Due Date</label>
          <div className={styles.dateInputWrap}>
            <input
              type="date"
              className={styles.dateInput}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              placeholder="DD-MM-YYYY"
            />
            <Calendar size={16} className={styles.calendarIcon} />
          </div>
          {errors.dueDate && <span className={styles.errorMsg}>{errors.dueDate}</span>}
        </div>

        {/* ── Question Type Table ── */}
        <div className={styles.tableSection}>
          {/* Table header */}
          <div className={styles.tableHeader}>
            <span className={styles.tableHeaderCell}>Question Type</span>
            <span />
            <span className={styles.tableHeaderCell}>No. of Questions</span>
            <span className={styles.tableHeaderCell}>Marks</span>
          </div>

          {/* Table rows */}
          {rows.map((row) => (
            <div key={row.id} className={styles.tableRow}>
              {/* Type selector */}
              <select
                className={styles.typeSelect}
                value={row.typeLabel}
                onChange={(e) => updateRowType(row.id, e.target.value)}
              >
                {QUESTION_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.label} value={opt.label}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* Remove button */}
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeRow(row.id)}
                aria-label="Remove row"
              >
                <X size={14} />
              </button>

              {/* No. of Questions counter */}
              <div className={styles.counterControl}>
                <button type="button" className={styles.counterBtn} onClick={() => adjustCount(row.id, 'count', -1)}>
                  −
                </button>
                <span className={styles.counterVal}>{row.count}</span>
                <button type="button" className={styles.counterBtn} onClick={() => adjustCount(row.id, 'count', 1)}>
                  +
                </button>
              </div>

              {/* Marks counter */}
              <div className={styles.counterControl}>
                <button type="button" className={styles.counterBtn} onClick={() => adjustCount(row.id, 'marks', -1)}>
                  −
                </button>
                <span className={styles.counterVal}>{row.marks}</span>
                <button type="button" className={styles.counterBtn} onClick={() => adjustCount(row.id, 'marks', 1)}>
                  +
                </button>
              </div>
            </div>
          ))}

          {errors.rows && <span className={styles.errorMsg} style={{ display: 'block', marginTop: 8 }}>{errors.rows}</span>}

          {/* Add question type */}
          <button type="button" className={styles.addTypeBtn} onClick={addRow}>
            <span className={styles.addCircle}>
              <Plus size={14} />
            </span>
            <span>Add question type</span>
          </button>
        </div>

        {/* ── Totals Summary ── */}
        <div className={styles.totalsSummary}>
          <div className={styles.totalItem}>
            Total Questions: <span>{totalQuestions}</span>
          </div>
          <div className={styles.totalItem}>
            Total Marks: <span>{totalMarks}</span>
          </div>
        </div>

        {/* ── Additional Information ── */}
        <div className={styles.additionalSection}>
          <label className={styles.fieldLabel}>Additional Information (For better output)</label>
          <div className={styles.textareaWrap}>
            <textarea
              className={styles.textarea}
              placeholder="e.g. Generate a question paper for 3 hour exam duration..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
            />
            <Mic size={16} className={styles.micIcon} />
          </div>
        </div>

        {/* ── Global Error ── */}
        {errorMessage && (
          <div className={styles.globalError}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* ── Footer Navigation ── */}
        <div className={styles.navFooter}>
          <button
            type="button"
            className={styles.prevBtn}
            onClick={() => setCreationForm(false)}
          >
            <ArrowLeft size={16} />
            <span>Previous</span>
          </button>

          <button
            type="submit"
            className={styles.nextBtn}
            disabled={isLoading}
          >
            <span>{isLoading ? 'Generating...' : 'Next'}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
