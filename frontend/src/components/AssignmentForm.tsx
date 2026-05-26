'use client';

import React, { useState } from 'react';
import { Upload, Plus, Trash2, BookOpen, AlertCircle, FileText, Sparkles } from 'lucide-react';
import { useAssignmentStore, ISectionConfig } from '../store/assignmentStore';
import styles from './AssignmentForm.module.css';

export default function AssignmentForm() {
  const { createAssignment, isLoading, errorMessage } = useAssignmentStore();

  // Basic Details State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [instructions, setInstructions] = useState('');

  // Dynamic Sections State
  const [sections, setSections] = useState<ISectionConfig[]>([
    { title: 'Section A: Multiple Choice Questions', type: 'MCQ', count: 5, marksPerQuestion: 2, difficulty: 'Easy' },
    { title: 'Section B: Short Answer Questions', type: 'Short', count: 3, marksPerQuestion: 5, difficulty: 'Moderate' },
  ]);

  // Mock File Upload State
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form Validation State
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 1. Dynamic Section Action Handlers
  const addSection = () => {
    const sectionIndex = String.fromCharCode(65 + sections.length); // A, B, C...
    const newSection: ISectionConfig = {
      title: `Section ${sectionIndex}: New Section`,
      type: 'Short',
      count: 3,
      marksPerQuestion: 5,
      difficulty: 'Moderate',
    };
    setSections([...sections, newSection]);
  };

  const updateSection = (index: number, key: keyof ISectionConfig, value: any) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], [key]: value };
    setSections(updated);
  };

  const deleteSection = (index: number) => {
    const filtered = sections.filter((_, idx) => idx !== index);
    // Renormalize titles (e.g. Section A, Section B...)
    const normalized = filtered.map((sec, idx) => {
      const char = String.fromCharCode(65 + idx);
      const cleanTitle = sec.title.replace(/^Section [A-Z]:\s*/, '');
      return {
        ...sec,
        title: `Section ${char}: ${cleanTitle}`,
      };
    });
    setSections(normalized);
  };

  const incrementCount = (index: number, key: 'count' | 'marksPerQuestion', amount: number) => {
    const currentVal = sections[index][key] as number;
    const newVal = Math.max(1, currentVal + amount); // Minimum is 1
    updateSection(index, key, newVal);
  };

  // 2. Mock File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      // Simulate small file extraction delay
      setTimeout(() => {
        setUploadedFile(file.name);
        setIsUploading(false);
        // Append context info to instructions automatically
        const parsedContext = `[Attached Context File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]\nExtract questions from the attached syllabus or reading file structure automatically.`;
        setInstructions((prev) => (prev ? `${parsedContext}\n\n${prev}` : parsedContext));
      }, 1500);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
  };

  // 3. Form Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) newErrors.title = 'Assignment title is required.';
    if (!subject) newErrors.subject = 'Please select a subject area.';
    if (!grade) newErrors.grade = 'Please select a grade/class level.';
    if (!dueDate) newErrors.dueDate = 'Due date is required.';

    if (sections.length === 0) {
      newErrors.sections = 'At least one assessment section must be added.';
    }

    // Check each section
    sections.forEach((sec, idx) => {
      if (!sec.title.trim()) {
        newErrors[`section_${idx}_title`] = 'Section title is required.';
      }
      if (sec.count <= 0) {
        newErrors[`section_${idx}_count`] = 'Question count must be greater than 0.';
      }
      if (sec.marksPerQuestion <= 0) {
        newErrors[`section_${idx}_marks`] = 'Marks per question must be greater than 0.';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 4. Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    await createAssignment({
      title,
      subject,
      grade,
      dueDate,
      additionalInstructions: instructions,
      sections,
    });
  };

  return (
    <form className={styles.formContainer} onSubmit={handleSubmit} noValidate>
      {/* 1. Basic Assignment Configurations */}
      <div className={styles.card}>
        <div className={styles.sectionHeader}>
          <h3>
            <BookOpen size={18} className={styles.headerIcon} />
            <span>Assignment Specifications</span>
          </h3>
        </div>

        <div className={styles.grid}>
          {/* Assignment Title */}
          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label className={styles.label}>ASSIGNMENT TITLE</label>
            <input
              type="text"
              className={styles.input}
              placeholder="e.g. Mid-Term Examination on Organic Chemistry"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {errors.title && <span className={styles.errorMsg}>{errors.title}</span>}
          </div>

          {/* Subject Selector */}
          <div className={styles.formGroup}>
            <label className={styles.label}>SUBJECT</label>
            <select className={styles.select} value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="">Select Subject</option>
              <option value="Science (General)">Science (General)</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Biology">Biology</option>
              <option value="Computer Science">Computer Science</option>
              <option value="History">History</option>
              <option value="Geography">Geography</option>
              <option value="English Literature">English Literature</option>
            </select>
            {errors.subject && <span className={styles.errorMsg}>{errors.subject}</span>}
          </div>

          {/* Class Grade */}
          <div className={styles.formGroup}>
            <label className={styles.label}>GRADE / CLASS</label>
            <select className={styles.select} value={grade} onChange={(e) => setGrade(e.target.value)}>
              <option value="">Select Grade</option>
              <option value="Grade 6">Grade 6</option>
              <option value="Grade 7">Grade 7</option>
              <option value="Grade 8">Grade 8</option>
              <option value="Grade 9">Grade 9</option>
              <option value="Grade 10">Grade 10</option>
              <option value="Grade 11">Grade 11</option>
              <option value="Grade 12">Grade 12</option>
              <option value="Undergraduate">Undergraduate University</option>
            </select>
            {errors.grade && <span className={styles.errorMsg}>{errors.grade}</span>}
          </div>

          {/* Due Date */}
          <div className={styles.formGroup}>
            <label className={styles.label}>DUE DATE</label>
            <input
              type="date"
              className={styles.input}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            {errors.dueDate && <span className={styles.errorMsg}>{errors.dueDate}</span>}
          </div>

          {/* Reference Material File Upload */}
          <div className={styles.formGroup}>
            <label className={styles.label}>REFERENCE MATERIAL (OPTIONAL)</label>
            {!uploadedFile && !isUploading ? (
              <label className={styles.uploadZone}>
                <input
                  type="file"
                  accept=".pdf,.txt,.docx"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <div className={styles.uploadIcon}>
                  <Upload size={18} />
                </div>
                <div className={styles.uploadText}>
                  <span>Click to upload PDF / text</span> or drag syllabus
                </div>
              </label>
            ) : isUploading ? (
              <div className={styles.uploadZone}>
                <div className="animate-spin" style={{ animation: 'spin 1s linear infinite' }}>⏳</div>
                <span className={styles.uploadText}>Parsing file content via AI...</span>
              </div>
            ) : (
              <div className={styles.uploadedFileBar}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} />
                  <span>{uploadedFile}</span>
                </div>
                <button type="button" className={styles.removeFileBtn} onClick={removeFile}>
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Additional Instructions */}
          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label className={styles.label}>ADDITIONAL INSTRUCTIONS / TOPICS</label>
            <textarea
              className={styles.textarea}
              placeholder="e.g. Focus on molecular bonds and thermodynamic properties. Include 1 diagram description."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 2. Structured Section Builder */}
      <div className={styles.card}>
        <div className={styles.sectionHeader}>
          <h3>
            <FileText size={18} className={styles.headerIcon} />
            <span>Question Paper Layout</span>
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {sections.map((section, idx) => (
            <div key={idx} className={styles.sectionCard}>
              <div className={styles.sectionHeaderRow}>
                {/* Editable Section Title */}
                <input
                  type="text"
                  className={styles.input}
                  style={{ fontWeight: 700, fontSize: '15px', width: '320px', padding: '6px 12px' }}
                  value={section.title}
                  onChange={(e) => updateSection(idx, 'title', e.target.value)}
                />
                <button type="button" className={styles.deleteSectionBtn} onClick={() => deleteSection(idx)}>
                  <Trash2 size={14} />
                  <span>Delete Section</span>
                </button>
              </div>

              <div className={styles.sectionControls}>
                {/* Question Type */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>QUESTION TYPE</label>
                  <select
                    className={styles.select}
                    value={section.type}
                    onChange={(e) => updateSection(idx, 'type', e.target.value)}
                  >
                    <option value="MCQ">Multiple Choice (MCQ)</option>
                    <option value="Short">Short Answer (Short)</option>
                    <option value="Long">Descriptive Essay (Long)</option>
                  </select>
                </div>

                {/* Number of Questions */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>NUMBER OF QUESTIONS</label>
                  <div className={styles.counterGroup}>
                    <button type="button" className={styles.counterBtn} onClick={() => incrementCount(idx, 'count', -1)}>-</button>
                    <span className={styles.counterValue}>{section.count}</span>
                    <button type="button" className={styles.counterBtn} onClick={() => incrementCount(idx, 'count', 1)}>+</button>
                  </div>
                </div>

                {/* Marks per Question */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>MARKS PER QUESTION</label>
                  <div className={styles.counterGroup}>
                    <button type="button" className={styles.counterBtn} onClick={() => incrementCount(idx, 'marksPerQuestion', -1)}>-</button>
                    <span className={styles.counterValue}>{section.marksPerQuestion}</span>
                    <button type="button" className={styles.counterBtn} onClick={() => incrementCount(idx, 'marksPerQuestion', 1)}>+</button>
                  </div>
                </div>

                {/* Difficulty Selector */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>DIFFICULTY TARGET</label>
                  <div className={styles.difficultyGroup}>
                    {['Easy', 'Moderate', 'Hard'].map((diff) => (
                      <div
                        key={diff}
                        className={`${styles.diffBadgeOption} ${
                          diff === 'Easy' ? styles.diffEasy : diff === 'Moderate' ? styles.diffModerate : styles.diffHard
                        } ${section.difficulty === diff ? styles.selected : ''}`}
                        onClick={() => updateSection(idx, 'difficulty', diff)}
                      >
                        {diff}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {errors.sections && <span className={styles.errorMsg}>{errors.sections}</span>}

          {/* Add Section Button */}
          <button type="button" className={styles.addSectionBtn} onClick={addSection}>
            <Plus size={16} />
            <span>Add Section Category</span>
          </button>
        </div>
      </div>

      {/* Global Server Error Logs */}
      {errorMessage && (
        <div className={styles.globalError}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className={styles.submitRow}>
        <button type="submit" className={styles.submitBtn} disabled={isLoading}>
          <Sparkles size={16} />
          <span>{isLoading ? 'Sending Request...' : 'Generate Exam Paper with AI'}</span>
        </button>
      </div>
    </form>
  );
}
