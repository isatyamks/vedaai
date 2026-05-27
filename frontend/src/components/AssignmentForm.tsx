'use client';

import React, { useState, useCallback } from 'react';
import { Upload, Plus, X, Calendar, AlertCircle, FileText, Mic, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useAssignmentStore, ISectionConfig } from '../store/assignmentStore';
import styles from './AssignmentForm.module.css';

type QuestionType = 'MCQ' | 'Short' | 'Long';

interface TypeOption {
  label: string;
  value: QuestionType;
}

const TYPE_OPTIONS: TypeOption[] = [
  { label: 'Multiple Choice Questions', value: 'MCQ' },
  { label: 'Short Answer Questions', value: 'Short' },
  { label: 'Descriptive / Essay Questions', value: 'Long' },
  { label: 'True / False Questions', value: 'MCQ' },
  { label: 'Fill in the Blanks', value: 'Short' },
  { label: 'Diagram / Graph-Based Questions', value: 'Long' },
  { label: 'Numerical Problems', value: 'Long' },
];

const SUBJECTS = [
  'Science (General)', 'Mathematics', 'Physics', 'Chemistry',
  'Biology', 'Computer Science', 'History', 'Geography', 'English Literature',
];

const GRADES = [
  'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9',
  'Grade 10', 'Grade 11', 'Grade 12', 'Undergraduate',
];

interface SectionRow {
  id: number;
  typeLabel: string;
  backendType: QuestionType;
  count: number;
  marks: number;
}

let idCounter = 2;

const DEFAULT_ROWS: SectionRow[] = [
  { id: 1, typeLabel: 'Multiple Choice Questions', backendType: 'MCQ', count: 4, marks: 1 },
  { id: 2, typeLabel: 'Short Answer Questions', backendType: 'Short', count: 4, marks: 4 },
];

export default function AssignmentForm() {
  const { createAssignment, isLoading, errorMessage, setCreationForm } = useAssignmentStore();

  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [instructions, setInstructions] = useState('');
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [rows, setRows] = useState<SectionRow[]>(DEFAULT_ROWS);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalQuestions = rows.reduce((sum, r) => sum + r.count, 0);
  const totalMarks = rows.reduce((sum, r) => sum + r.count * r.marks, 0);

  const addRow = useCallback(() => {
    idCounter++;
    setRows((prev) => [
      ...prev,
      { id: idCounter, typeLabel: TYPE_OPTIONS[0].label, backendType: 'MCQ', count: 4, marks: 1 },
    ]);
  }, []);

  const removeRow = useCallback((id: number) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const updateRowType = useCallback((id: number, label: string) => {
    const match = TYPE_OPTIONS.find((o) => o.label === label);
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, typeLabel: label, backendType: match?.value ?? 'Short' } : r
      )
    );
  }, []);

  const adjustField = useCallback((id: number, field: 'count' | 'marks', delta: number) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: Math.max(1, r[field] + delta) } : r))
    );
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setTimeout(() => {
      setUploadedFile(file.name);
      setIsUploading(false);
      const ctx = `[Reference File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)] — Use context from this attached document.`;
      setInstructions((prev) => (prev ? `${ctx}\n\n${prev}` : ctx));
    }, 1200);
  }, []);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!subject) errs.subject = 'Please select a subject.';
    if (!grade) errs.grade = 'Please select a grade.';
    if (!dueDate) errs.dueDate = 'Due date is required.';
    if (rows.length === 0) errs.rows = 'Add at least one question section.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const sections: ISectionConfig[] = rows.map((r, i) => ({
      title: `Section ${String.fromCharCode(65 + i)}: ${r.typeLabel}`,
      type: r.backendType,
      count: r.count,
      marksPerQuestion: r.marks,
      difficulty: 'Moderate',
    }));

    await createAssignment({
      title: `${subject} Assessment — ${grade}`,
      subject,
      grade,
      dueDate,
      additionalInstructions: instructions,
      sections,
    });
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.stepper} aria-label="Form progress">
        <div className={styles.step} data-active="true">
          <div className={styles.stepCircle}>1</div>
          <span>Details</span>
        </div>
        <div className={styles.stepLine} />
        <div className={styles.step}>
          <div className={styles.stepCircle}>2</div>
          <span>Configure</span>
        </div>
        <div className={styles.stepLine} />
        <div className={styles.step}>
          <div className={styles.stepCircle}>3</div>
          <span>Review</span>
        </div>
      </div>

      <form className={styles.formContainer} onSubmit={handleSubmit} noValidate>
        <div className={styles.formHeader}>
          <h2>Assignment Details</h2>
          <p>Configure the basic parameters for your assessment</p>
        </div>

        {!uploadedFile && !isUploading && (
          <label className={styles.uploadZone} htmlFor="file-upload">
            <input
              id="file-upload"
              type="file"
              accept=".pdf,.png,.jpg,.docx,.txt"
              className={styles.hiddenInput}
              onChange={handleFileUpload}
            />
            <div className={styles.uploadIconWrap}>
              <Upload size={28} aria-hidden="true" />
            </div>
            <p className={styles.uploadTitle}>Drop your reference file here, or browse</p>
            <p className={styles.uploadSubtitle}>PDF, PNG, DOCX — max 10 MB</p>
            <span className={styles.browseBtn}>Browse Files</span>
          </label>
        )}

        {isUploading && (
          <div className={styles.uploadZone}>
            <div className={styles.uploadIconWrap}>⏳</div>
            <p className={styles.uploadTitle}>Parsing file...</p>
          </div>
        )}

        {uploadedFile && (
          <div className={styles.uploadedFileBar}>
            <div className={styles.uploadedFileName}>
              <FileText size={16} aria-hidden="true" />
              <span>{uploadedFile}</span>
            </div>
            <button
              type="button"
              className={styles.removeFileBtn}
              onClick={() => setUploadedFile(null)}
              aria-label="Remove uploaded file"
            >
              Remove
            </button>
          </div>
        )}

        <div className={styles.fieldRow}>
          <div className={styles.fieldGroup}>
            <label htmlFor="subject-select" className={styles.fieldLabel}>Subject</label>
            <select
              id="subject-select"
              className={styles.typeSelect}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              <option value="">Select Subject</option>
              {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </select>
            {errors.subject && <span className={styles.errorMsg} role="alert">{errors.subject}</span>}
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="grade-select" className={styles.fieldLabel}>Grade / Class</label>
            <select
              id="grade-select"
              className={styles.typeSelect}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            >
              <option value="">Select Grade</option>
              {GRADES.map((g) => <option key={g}>{g}</option>)}
            </select>
            {errors.grade && <span className={styles.errorMsg} role="alert">{errors.grade}</span>}
          </div>
        </div>

        <div className={styles.dueDateRow}>
          <label htmlFor="due-date" className={styles.fieldLabel}>Due Date</label>
          <div className={styles.dateInputWrap}>
            <input
              id="due-date"
              type="date"
              className={styles.dateInput}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <Calendar size={16} className={styles.calendarIcon} aria-hidden="true" />
          </div>
          {errors.dueDate && <span className={styles.errorMsg} role="alert">{errors.dueDate}</span>}
        </div>

        <div className={styles.tableSection}>
          <div className={styles.tableHeader} role="row">
            <span role="columnheader">Question Type</span>
            <span />
            <span role="columnheader">Questions</span>
            <span role="columnheader">Marks</span>
          </div>

          {rows.map((row) => (
            <div key={row.id} className={styles.tableRow} role="row">
              <select
                className={styles.typeSelect}
                value={row.typeLabel}
                onChange={(e) => updateRowType(row.id, e.target.value)}
                aria-label="Question type"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.label} value={opt.label}>{opt.label}</option>
                ))}
              </select>

              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => removeRow(row.id)}
                aria-label={`Remove ${row.typeLabel} section`}
              >
                <X size={14} aria-hidden="true" />
              </button>

              <div className={styles.counterControl}>
                <button type="button" className={styles.counterBtn} onClick={() => adjustField(row.id, 'count', -1)} aria-label="Decrease question count">−</button>
                <span className={styles.counterVal}>{row.count}</span>
                <button type="button" className={styles.counterBtn} onClick={() => adjustField(row.id, 'count', 1)} aria-label="Increase question count">+</button>
              </div>

              <div className={styles.counterControl}>
                <button type="button" className={styles.counterBtn} onClick={() => adjustField(row.id, 'marks', -1)} aria-label="Decrease marks">−</button>
                <span className={styles.counterVal}>{row.marks}</span>
                <button type="button" className={styles.counterBtn} onClick={() => adjustField(row.id, 'marks', 1)} aria-label="Increase marks">+</button>
              </div>
            </div>
          ))}

          {errors.rows && <span className={styles.errorMsg} role="alert">{errors.rows}</span>}

          <button type="button" className={styles.addTypeBtn} onClick={addRow}>
            <span className={styles.addCircle} aria-hidden="true"><Plus size={14} /></span>
            <span>Add question type</span>
          </button>
        </div>

        <div className={styles.totalsSummary}>
          <span className={styles.totalItem}>Total Questions: <strong>{totalQuestions}</strong></span>
          <span className={styles.totalItem}>Total Marks: <strong>{totalMarks}</strong></span>
        </div>

        <div className={styles.additionalSection}>
          <label htmlFor="additional-info" className={styles.fieldLabel}>Additional Instructions</label>
          <div className={styles.textareaWrap}>
            <textarea
              id="additional-info"
              className={styles.textarea}
              placeholder="e.g. Generate a 3-hour exam paper focused on organic chemistry chapters 4–8…"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
            />
            <Mic size={16} className={styles.micIcon} aria-hidden="true" />
          </div>
        </div>

        {errorMessage && (
          <div className={styles.globalError} role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className={styles.navFooter}>
          <button type="button" className={styles.prevBtn} onClick={() => setCreationForm(false)}>
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Previous</span>
          </button>

          <button type="submit" className={styles.nextBtn} disabled={isLoading}>
            <span>{isLoading ? 'Generating...' : 'Generate Assessment'}</span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </form>
    </div>
  );
}
