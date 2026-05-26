'use client';

import React, { useEffect } from 'react';
import { Plus, BookOpen, Calendar, Award, Sparkles, HelpCircle, Layers } from 'lucide-react';
import { useAssignmentStore, IAssignment } from '../store/assignmentStore';
import AssignmentForm from '../components/AssignmentForm';
import QuestionPaperView from '../components/QuestionPaperView';
import styles from './page.module.css';

export default function Page() {
  const {
    assignments,
    isLoading,
    showCreationForm,
    activeAssignment,
    setCreationForm,
    selectAssignment,
    fetchAssignments,
  } = useAssignmentStore();

  // 1. Fetch assignments list on page load
  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // 2. Loading state fallback
  if (isLoading && assignments.length === 0) {
    return (
      <main className={styles.mainWrapper}>
        <div className={styles.loaderContainer}>
          <div className={styles.pulsingSpinner} />
          <span style={{ fontSize: '14px', color: 'var(--muted)', fontWeight: 550 }}>
            Syncing classroom assets with local database...
          </span>
        </div>
      </main>
    );
  }

  // 3. Conditional Page Renderers
  let contentArea;

  if (showCreationForm) {
    contentArea = <AssignmentForm />;
  } else if (activeAssignment) {
    contentArea = <QuestionPaperView />;
  } else if (assignments.length === 0) {
    // Figma Exact Match 0-State screen
    contentArea = (
      <div className={styles.emptyStateContainer}>
        {/* Large custom styled SVG magnifying document matching Figma asset */}
        <div className={styles.magnifierGraphic}>
          <svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Background Canvas Ring */}
            <circle cx="90" cy="90" r="64" fill="#F1F5F9" />
            <circle cx="90" cy="90" r="54" fill="#E2E8F0" />
            
            {/* Document Sheet Graphic */}
            <rect x="68" y="52" width="44" height="60" rx="4" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="2.5" />
            <line x1="76" y1="68" x2="104" y2="68" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="76" y1="80" x2="104" y2="80" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="76" y1="92" x2="92" y2="92" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />

            {/* Red-Magnifier Glass Border overlaps Document */}
            <circle cx="106" cy="106" r="26" fill="#FFFFFF" stroke="#EF4444" strokeWidth="4.5" />
            <line x1="123" y1="123" x2="142" y2="142" stroke="#EF4444" strokeWidth="5.5" strokeLinecap="round" />

            {/* Red Cross X Inside Magnifier */}
            <line x1="98" y1="98" x2="114" y2="114" stroke="#EF4444" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="114" y1="98" x2="98" y2="114" stroke="#EF4444" strokeWidth="3.5" strokeLinecap="round" />
            
            {/* Decorative Sparkle items */}
            <path d="M42 56L45 48L48 56L56 59L48 62L45 70L42 62L34 59L42 56Z" fill="#38BDF8" opacity="0.6" />
            <circle cx="140" cy="62" r="3" fill="#60A5FA" opacity="0.6" />
          </svg>
        </div>

        {/* Description headers */}
        <h2 className={styles.emptyTitle}>No assignments yet</h2>
        <p className={styles.emptyDesc}>
          Create your first assignment to start collecting and grading student submissions. You can set up rubrics,
          define marking criteria, and let AI assist with grading.
        </p>

        {/* Action button */}
        <button className={styles.emptyBtn} onClick={() => setCreationForm(true)}>
          <Plus size={18} />
          <span>Create Your First Assignment</span>
        </button>
      </div>
    );
  } else {
    // High-fidelity Assessments Grid View
    contentArea = (
      <div className="animate-fade">
        <div className={styles.dashboardHeader}>
          <div className={styles.titleArea}>
            <h1>Assessments Suite</h1>
            <p>Select any assessment sheet to view full exam prints, answers, and PDF options.</p>
          </div>

          <button className={styles.createBtn} onClick={() => setCreationForm(true)}>
            <Plus size={16} />
            <span>Create Assignment</span>
          </button>
        </div>

        {/* Grid collection */}
        <div className={styles.cardsGrid}>
          {assignments.map((assignment: IAssignment) => {
            // Count total questions & sections
            let questionCount = 0;
            let totalMarks = 0;
            assignment.sections.forEach((sec) => {
              questionCount += sec.questions.length;
              sec.questions.forEach((q) => {
                totalMarks += q.marks;
              });
            });

            return (
              <div
                key={assignment._id}
                className={styles.assignmentCard}
                onClick={() => selectAssignment(assignment)}
                role="button"
                aria-label={`Open assignment: ${assignment.title}`}
              >
                {/* Subject & Status */}
                <div className={styles.cardHeader}>
                  <span className={styles.subjectBadge}>{assignment.subject}</span>
                  <span
                    className={`${styles.statusIndicator} ${
                      assignment.status === 'completed'
                        ? styles.statusCompleted
                        : assignment.status === 'failed'
                        ? styles.statusFailed
                        : styles.statusQueued
                    }`}
                  >
                    {assignment.status === 'completed'
                      ? 'Ready'
                      : assignment.status === 'failed'
                      ? 'Error'
                      : 'AI Generating'}
                  </span>
                </div>

                {/* Title */}
                <h3 className={styles.cardTitle}>{assignment.title}</h3>

                {/* Meta details list */}
                <div className={styles.cardDetails}>
                  <div className={styles.cardMetaRow}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Layers size={13} style={{ color: 'var(--muted)' }} />
                      <span>{assignment.grade}</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <HelpCircle size={13} style={{ color: 'var(--muted)' }} />
                      <span>
                        {assignment.sections.length} Sec ({questionCount} Qs)
                      </span>
                    </span>
                  </div>

                  <div className={styles.cardMetaRow}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} style={{ color: 'var(--muted)' }} />
                      <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                      <Award size={13} style={{ color: 'var(--brand-orange)' }} />
                      <span>{totalMarks} Marks</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <main className={styles.mainWrapper}>
      <div className={styles.content}>{contentArea}</div>
    </main>
  );
}
