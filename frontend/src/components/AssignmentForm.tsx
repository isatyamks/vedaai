'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Plus, X, Calendar, AlertCircle, FileText, Mic, ArrowLeft, ArrowRight } from 'lucide-react';
import { useAssignmentStore, ISectionConfig } from '../store/assignmentStore';
import styles from './AssignmentForm.module.css';

type QuestionType = 'MCQ' | 'Short' | 'Long';

interface TypeOption {
  label: string;
  value: QuestionType;
}

const TYPE_OPTIONS: TypeOption[] = [
  { label: 'Multiple Choice (MCQ)', value: 'MCQ' },
  { label: 'Short Answer Questions', value: 'Short' },
  { label: 'Descriptive / Essay Questions', value: 'Long' },
  { label: 'True / False Questions', value: 'MCQ' },
  { label: 'Fill in the Blanks', value: 'Short' },
  { label: 'Numerical Problems', value: 'Long' },
];

const SUBJECTS = [
  'Science', 'Mathematics', 'Physics', 'Chemistry',
  'Biology', 'Computer Science', 'History', 'Geography', 'English',
];

const GRADES = [
  'Class 6', 'Class 7', 'Class 8', 'Class 9',
  'Class 10', 'Class 11', 'Class 12',
];

const NCERT_CHAPTERS: Record<string, Record<string, string[]>> = {
  'Class 10': {
    'Science': [
      'Chemical Reactions and Equations',
      'Acids, Bases and Salts',
      'Metals and Non-metals',
      'Carbon and its Compounds',
      'Life Processes',
      'Control and Coordination',
      'How do Organisms Reproduce?',
      'Heredity and Evolution',
      'Light — Reflection and Refraction',
      'Human Eye and Colorful World',
      'Electricity',
      'Magnetic Effects of Electric Current',
      'Our Environment'
    ],
    'Mathematics': [
      'Real Numbers',
      'Polynomials',
      'Pair of Linear Equations in Two Variables',
      'Quadratic Equations',
      'Arithmetic Progressions',
      'Triangles',
      'Coordinate Geometry',
      'Introduction to Trigonometry',
      'Some Applications of Trigonometry',
      'Circles',
      'Surface Areas and Volumes',
      'Statistics',
      'Probability'
    ],
  },
  'Class 9': {
    'Science': [
      'Matter in Our Surroundings',
      'Is Matter Around Us Pure',
      'Atoms and Molecules',
      'Structure of the Atom',
      'The Fundamental Unit of Life',
      'Tissues',
      'Motion',
      'Force and Laws of Motion',
      'Gravitation',
      'Work and Energy',
      'Sound',
      'Improvement in Food Resources'
    ],
    'Mathematics': [
      'Number Systems',
      'Polynomials',
      'Coordinate Geometry',
      'Linear Equations in Two Variables',
      'Introduction to Euclid\'s Geometry',
      'Lines and Angles',
      'Triangles',
      'Quadrilaterals',
      'Circles',
      'Heron\'s Formula',
      'Surface Areas and Volumes',
      'Statistics'
    ],
  },
  'Class 12': {
    'Physics': [
      'Electric Charges and Fields',
      'Electrostatic Potential and Capacitance',
      'Current Electricity',
      'Moving Charges and Magnetism',
      'Magnetism and Matter',
      'Electromagnetic Induction',
      'Alternating Current',
      'Electromagnetic Waves',
      'Ray Optics and Optical Instruments',
      'Wave Optics',
      'Dual Nature of Radiation and Matter',
      'Atoms',
      'Nuclei',
      'Semiconductor Electronics'
    ],
    'Chemistry': [
      'Solutions',
      'Electrochemistry',
      'Chemical Kinetics',
      'd- and f-Block Elements',
      'Coordination Compounds',
      'Haloalkanes and Haloarenes',
      'Alcohols, Phenols and Ethers',
      'Aldehydes, Ketones and Carboxylic Acids',
      'Amines',
      'Biomolecules'
    ],
    'Biology': [
      'Sexual Reproduction in Flowering Plants',
      'Human Reproduction',
      'Reproductive Health',
      'Principles of Inheritance and Variation',
      'Molecular Basis of Inheritance',
      'Evolution',
      'Human Health and Disease',
      'Microbes in Human Welfare',
      'Biotechnology: Principles and Processes',
      'Biotechnology and its Applications',
      'Organisms and Populations',
      'Ecosystem',
      'Biodiversity and Conservation'
    ],
  },
  'Class 11': {
    'Physics': [
      'Units and Measurements',
      'Motion in a Straight Line',
      'Motion in a Plane',
      'Laws of Motion',
      'Work, Energy and Power',
      'System of Particles and Rotational Motion',
      'Gravitation',
      'Mechanical Properties of Solids',
      'Mechanical Properties of Fluids',
      'Thermal Properties of Matter',
      'Thermodynamics',
      'Kinetic Theory',
      'Oscillations',
      'Waves'
    ],
    'Chemistry': [
      'Some Basic Concepts of Chemistry',
      'Structure of Atom',
      'Classification of Elements and Periodicity in Properties',
      'Chemical Bonding and Molecular Structure',
      'Chemical Thermodynamics',
      'Equilibrium',
      'Redox Reactions',
      'Organic Chemistry — Some Basic Principles and Techniques',
      'Hydrocarbons'
    ],
    'Biology': [
      'The Living World',
      'Biological Classification',
      'Plant Kingdom',
      'Animal Kingdom',
      'Morphology of Flowering Plants',
      'Anatomy of Flowering Plants',
      'Structural Organisation in Animals',
      'Cell: The Unit of Life',
      'Biomolecules',
      'Cell Cycle and Cell Division',
      'Photosynthesis in Higher Plants',
      'Respiration in Plants',
      'Plant Growth and Development',
      'Breathing and Exchange of Gases',
      'Body Fluids and Circulation',
      'Excretory Products and their Elimination',
      'Locomotion and Movement',
      'Neural Control and Coordination',
      'Chemical Coordination and Integration'
    ],
  },
  'Class 8': {
    'Science': [
      'Crop Production and Management',
      'Microorganisms: Friend and Foe',
      'Coal and Petroleum',
      'Combustion and Flame',
      'Conservation of Plants and Animals',
      'Reproduction in Animals',
      'Reaching the Age of Adolescence',
      'Force and Pressure',
      'Friction',
      'Sound',
      'Chemical Effects of Electric Current',
      'Some Natural Phenomena',
      'Light'
    ],
    'Mathematics': [
      'Rational Numbers',
      'Linear Equations in One Variable',
      'Understanding Quadrilaterals',
      'Data Handling',
      'Squares and Square Roots',
      'Cubes and Cube Roots',
      'Comparing Quantities',
      'Algebraic Expressions and Identities',
      'Mensuration',
      'Exponents and Powers',
      'Direct and Inverse Proportions',
      'Factorisation',
      'Introduction to Graphs'
    ]
  },
};

function getNCERTChapters(selectedClass: string, selectedSubject: string): string[] {
  if (!selectedClass || !selectedSubject) return [];
  
  const classChapters = NCERT_CHAPTERS[selectedClass];
  if (classChapters && classChapters[selectedSubject]) {
    return classChapters[selectedSubject];
  }
  
  const sub = selectedSubject.toLowerCase();
  if (sub.includes('math')) {
    return [
      'Chapter 1: Number Systems & Arithmetic',
      'Chapter 2: Algebraic Expressions & Equations',
      'Chapter 3: Geometry & Coordinate Shapes',
      'Chapter 4: Mensuration & Surface Areas',
      'Chapter 5: Data Handling, Statistics & Probability'
    ];
  }
  if (sub.includes('science') || sub.includes('physics') || sub.includes('chem') || sub.includes('bio')) {
    return [
      'Chapter 1: Structure & Properties of Matter',
      'Chapter 2: Cells, Life Processes & Living Organisms',
      'Chapter 3: Motion, Forces & Law of Inertia',
      'Chapter 4: Work, Heat, Energy & Power Cycles',
      'Chapter 5: Natural Resources, Ecology & Environment'
    ];
  }
  if (sub.includes('history') || sub.includes('social') || sub.includes('civics') || sub.includes('geography')) {
    return [
      'Chapter 1: Historical Eras, Cultures & Modernity',
      'Chapter 2: Nationalism, Struggle & Constitutional Design',
      'Chapter 3: Geography, Ecosystems & Resources',
      'Chapter 4: Economic Sectors, Development & Trade',
      'Chapter 5: Globalization, Human Capital & Demography'
    ];
  }
  if (sub.includes('computer') || sub.includes('coding') || sub.includes('tech')) {
    return [
      'Chapter 1: Digital Systems & Hardware Principles',
      'Chapter 2: Core Algorithms & Programming Methods',
      'Chapter 3: Database structures & Queries',
      'Chapter 4: Cyber Security, Ethics & Privacy rules',
      'Chapter 5: Network Protocols & Internet Services'
    ];
  }
  return [
    'Chapter 1: Foundation Concepts & Basic Principles',
    'Chapter 2: Analysis, Structure & In-depth Exercises',
    'Chapter 3: Advanced Applications & Critical Problems',
    'Chapter 4: Core Themes, Literature Reading & Writing',
    'Chapter 5: Practice Exercises, Review & Case Studies'
  ];
}

interface SectionRow {
  id: number;
  typeLabel: string;
  backendType: QuestionType;
  count: number;
  marks: number;
}

let idCounter = 2;

const DEFAULT_ROWS: SectionRow[] = [
  { id: 1, typeLabel: 'Multiple Choice (MCQ)', backendType: 'MCQ', count: 5, marks: 1 },
  { id: 2, typeLabel: 'Short Answer Questions', backendType: 'Short', count: 5, marks: 3 },
];

export default function AssignmentForm() {
  const router = useRouter();
  const { createAssignment, isLoading, errorMessage, showToast } = useAssignmentStore();

  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [setCount, setSetCount] = useState(1);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [instructions, setInstructions] = useState('');
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [rows, setRows] = useState<SectionRow[]>(DEFAULT_ROWS);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const availableChapters = getNCERTChapters(grade, subject);

  useEffect(() => {
    setSelectedChapters([]);
  }, [grade, subject]);

  const handleToggleChapter = useCallback((chapterName: string) => {
    setSelectedChapters((prev) =>
      prev.includes(chapterName)
        ? prev.filter((c) => c !== chapterName)
        : [...prev, chapterName]
    );
  }, []);

  const handleSelectAllChapters = useCallback(() => {
    const chapters = getNCERTChapters(grade, subject);
    setSelectedChapters((prev) =>
      prev.length === chapters.length ? [] : [...chapters]
    );
  }, [grade, subject]);

  const totalQuestions = rows.reduce((sum, r) => sum + r.count, 0);
  const totalMarks = rows.reduce((sum, r) => sum + r.count * r.marks, 0);

  const isBlueprintReady = !!subject && !!grade && !!dueDate && rows.length > 0;
  const missingFields: string[] = [];
  if (!subject) missingFields.push('Subject');
  if (!grade) missingFields.push('Class');
  if (!dueDate) missingFields.push('Due Date');
  if (rows.length === 0) missingFields.push('Sections');

  const addRow = useCallback(() => {
    idCounter++;
    setRows((prev) => [
      ...prev,
      { id: idCounter, typeLabel: TYPE_OPTIONS[0].label, backendType: 'MCQ', count: 5, marks: 1 },
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
    if (!grade) errs.grade = 'Please select a class.';
    if (!dueDate) errs.dueDate = 'Due date is required.';
    if (rows.length === 0) errs.rows = 'Add at least one question section.';
    setErrors(errs);
    
    const hasErrors = Object.keys(errs).length > 0;
    if (hasErrors) {
      showToast('Please select all required fields to create the test paper.', 'error');
    }
    return !hasErrors;
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

    const id = await createAssignment({
      title: `${subject} Test — ${grade}`,
      subject,
      grade,
      dueDate,
      additionalInstructions: instructions,
      sections,
      setCount,
      chapters: selectedChapters,
    });
    if (id) {
      router.push('/');
    }
  };

  return (
    <div className={styles.containerSplit}>
      <form id="assignment-create-form" className={styles.formContainer} onSubmit={handleSubmit} noValidate>
        <div className={styles.formCard}>
          <h3 className={styles.cardSectionTitle}>1. General Details</h3>
          
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
              <p className={styles.uploadTitle}>Upload syllabus notes or chapters here, or click to browse</p>
              <p className={styles.uploadSubtitle}>PDF, PNG, DOCX — max 10 MB</p>
              <span className={styles.browseBtn}>Browse Files</span>
            </label>
          )}

          {isUploading && (
            <div className={styles.uploadZone}>
              <div className={styles.uploadIconWrap}>⏳</div>
              <p className={styles.uploadTitle}>Reading uploaded file...</p>
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
              <label htmlFor="grade-select" className={styles.fieldLabel}>Class / Grade</label>
              <select
                id="grade-select"
                className={styles.typeSelect}
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
              >
                <option value="">Select Class</option>
                {GRADES.map((g) => <option key={g}>{g}</option>)}
              </select>
              {errors.grade && <span className={styles.errorMsg} role="alert">{errors.grade}</span>}
            </div>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup} style={{ flex: 1 }}>
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

            <div className={styles.fieldGroup} style={{ flex: 1 }}>
              <label htmlFor="set-count-select" className={styles.fieldLabel}>Number of Sets (1-4)</label>
              <select
                id="set-count-select"
                className={styles.typeSelect}
                value={setCount}
                onChange={(e) => setSetCount(Number(e.target.value))}
              >
                <option value={1}>1 Set (Default)</option>
                <option value={2}>2 Sets (Anti-Cheating)</option>
                <option value={3}>3 Sets (Anti-Cheating)</option>
                <option value={4}>4 Sets (Anti-Cheating)</option>
              </select>
            </div>
          </div>
        </div>

        <div className={styles.formCard}>
          <div className={styles.chapterHeader}>
            <h3 className={styles.cardSectionTitle} style={{ margin: 0, border: 'none', padding: 0 }}>Syllabus Chapters</h3>
            {availableChapters.length > 0 && (
              <button
                type="button"
                className={styles.selectAllBtn}
                onClick={handleSelectAllChapters}
              >
                {selectedChapters.length === availableChapters.length ? 'Clear All' : 'Select All'}
              </button>
            )}
          </div>
          
          {availableChapters.length > 0 ? (
            <div className={styles.chapterGrid}>
              {availableChapters.map((chapter) => {
                const isActive = selectedChapters.includes(chapter);
                return (
                  <div
                    key={chapter}
                    className={`${styles.chapterItem} ${isActive ? styles.chapterItemActive : ''}`}
                    onClick={() => handleToggleChapter(chapter)}
                  >
                    <input
                      type="checkbox"
                      className={styles.chapterCheckbox}
                      checked={isActive}
                      onChange={() => {}}
                      aria-label={`Cover chapter ${chapter}`}
                    />
                    <span className={styles.chapterName}>{chapter}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyChaptersPrompt}>
              <span>Please select both a Subject and Class / Grade in Card 1 to load NCERT base chapters.</span>
            </div>
          )}
        </div>

        <div className={styles.formCard}>
          <h3 className={styles.cardSectionTitle}>2. Question Layout</h3>
          
          <div className={styles.tableSection}>
            <div className={styles.tableHeader} role="row">
              <span role="columnheader">Type of Questions</span>
              <span />
              <span role="columnheader">Number of Questions</span>
              <span role="columnheader">Marks Per Question</span>
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
              <span className={styles.addCircle} aria-hidden="true"><Plus size={12} /></span>
              <span>Add question type</span>
            </button>
          </div>

          <div className={styles.totalsSummary}>
            <span className={styles.totalItem}>Total Questions: <strong>{totalQuestions}</strong></span>
            <span className={styles.totalItem}>Total Marks: <strong>{totalMarks}</strong></span>
          </div>
        </div>

        <div className={styles.formCard}>
          <h3 className={styles.cardSectionTitle}>3. Special Rules</h3>
          <div className={styles.additionalSection}>
            <label htmlFor="additional-info" className={styles.fieldLabel}>Special instructions for generating questions</label>
            <div className={styles.textareaWrap}>
              <textarea
                id="additional-info"
                className={styles.textarea}
                placeholder="e.g. Focus on chapter 4 chemistry notes, add simple diagrams, or specific guidelines..."
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={4}
              />
              <Mic size={16} className={styles.micIcon} aria-hidden="true" />
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className={styles.globalError} role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className={styles.navFooter}>
          <button type="button" className={styles.prevBtn} onClick={() => router.push('/')}>
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Previous</span>
          </button>
        </div>
      </form>

      {/* Right Column: Live Blueprint Summary Sidebar */}
      <aside className={styles.previewSidebar}>
        <div className={styles.previewHeader}>
          <span className={styles.previewTitle}>Test Summary</span>
          <span className={styles.previewBadge}>
            {subject && grade ? 'Ready' : 'Needs Info'}
          </span>
        </div>

        <div className={styles.previewBody}>
          <div className={styles.previewMetricCircle}>
            <span className={styles.previewMetricNumber}>{totalMarks}</span>
            <span className={styles.previewMetricLabel}>Total Marks</span>
          </div>

          <div className={styles.previewSpecsList}>
            <div className={styles.previewSpecItem}>
              <span className={styles.previewSpecLabel}>Subject</span>
              <span className={styles.previewSpecVal}>{subject || 'Not Selected'}</span>
            </div>
            <div className={styles.previewSpecItem}>
              <span className={styles.previewSpecLabel}>Class / Grade</span>
              <span className={styles.previewSpecVal}>{grade || 'Not Selected'}</span>
            </div>
            <div className={styles.previewSpecItem}>
              <span className={styles.previewSpecLabel}>Questions Count</span>
              <span className={styles.previewSpecVal}>{totalQuestions} Qs</span>
            </div>
            <div className={styles.previewSpecItem}>
              <span className={styles.previewSpecLabel}>Due Date</span>
              <span className={styles.previewSpecVal}>
                {dueDate ? new Date(dueDate).toLocaleDateString() : 'Not Set'}
              </span>
            </div>
          </div>

          <div className={styles.previewSectionsList}>
            <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--muted)', letterSpacing: '0.05em' }}>
              Test Sections ({rows.length})
            </span>
            {rows.map((row, i) => (
              <div key={row.id} className={styles.previewSectionItem}>
                <div className={styles.previewSectionLeft}>
                  <div className={styles.previewSectionIndicator} />
                  <span>Section {String.fromCharCode(65 + i)}: {row.backendType}</span>
                </div>
                <div className={styles.previewSectionRight}>
                  {row.count * row.marks} M
                </div>
              </div>
            ))}
            {rows.length === 0 && (
              <span style={{ fontSize: '12.5px', color: 'var(--muted)', fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>
                No sections defined yet.
              </span>
            )}
          </div>

          {isBlueprintReady ? (
            <button
              type="submit"
              form="assignment-create-form"
              className={styles.compileBtnSidebar}
              disabled={isLoading}
            >
              <span>{isLoading ? 'Creating Test Paper...' : 'Create Test Paper'}</span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              <button
                type="button"
                className={styles.compileBtnSidebarNotReady}
                onClick={() => {
                  validate();
                }}
              >
                <span>Create Test Paper</span>
                <ArrowRight size={16} aria-hidden="true" />
              </button>
              <div className={styles.missingPrompt}>
                <span className={styles.missingPromptLabel}>Requires:</span>
                <span className={styles.missingPromptValue}>{missingFields.join(', ')}</span>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
