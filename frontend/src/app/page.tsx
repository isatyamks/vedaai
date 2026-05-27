'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Calendar, Award, Layers, HelpCircle } from 'lucide-react';
import { useAssignmentStore, IAssignment } from '../store/assignmentStore';
import styles from './page.module.css';

function computeTotals(assignment: IAssignment) {
  let questions = 0;
  let marks = 0;
  assignment.sections.forEach((s) =>
    s.questions.forEach((q) => {
      questions++;
      marks += q.marks;
    })
  );
  return { questions, marks };
}

function LoadingScreen() {
  return (
    <div className={styles.loaderContainer}>
      <div className={styles.pulsingSpinner} />
      <span className={styles.loaderText}>Loading test papers...</span>
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className={styles.emptyStateContainer}>
      <div className={styles.magnifierGraphic}>
        <svg width="180" height="180" viewBox="0 0 180 180" fill="none">
          <circle cx="90" cy="90" r="64" fill="#F1F5F9" />
          <circle cx="90" cy="90" r="54" fill="#E2E8F0" />
          <rect x="68" y="52" width="44" height="60" rx="4" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="2.5" />
          <line x1="76" y1="68" x2="104" y2="68" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="76" y1="80" x2="104" y2="80" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="76" y1="92" x2="92" y2="92" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="106" cy="106" r="26" fill="#FFFFFF" stroke="#EF4444" strokeWidth="4.5" />
          <line x1="123" y1="123" x2="142" y2="142" stroke="#EF4444" strokeWidth="5.5" strokeLinecap="round" />
          <line x1="98" y1="98" x2="114" y2="114" stroke="#EF4444" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="114" y1="98" x2="98" y2="114" stroke="#EF4444" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M42 56L45 48L48 56L56 59L48 62L45 70L42 62L34 59L42 56Z" fill="#38BDF8" opacity="0.6" />
          <circle cx="140" cy="62" r="3" fill="#60A5FA" opacity="0.6" />
        </svg>
      </div>
      <h2 className={styles.emptyTitle}>No test papers yet</h2>
      <p className={styles.emptyDesc}>
        Create your first test paper to get started. Choose your questions and layout parameters, and create a structured paper ready to print.
      </p>
      <button id="empty-create-btn" className={styles.emptyBtn} onClick={onCreateClick}>
        <Plus size={18} />
        <span>Create Your First Test Paper</span>
      </button>
    </div>
  );
}

function AssignmentCard({
  assignment,
  onClick,
}: {
  assignment: IAssignment;
  onClick: () => void;
}) {
  const { questions, marks } = computeTotals(assignment);

  const statusLabel =
    assignment.status === 'completed' ? 'Ready' : assignment.status === 'failed' ? 'Error' : 'Generating';

  const statusClass =
    assignment.status === 'completed'
      ? styles.statusCompleted
      : assignment.status === 'failed'
      ? styles.statusFailed
      : styles.statusQueued;

  return (
    <div
      className={styles.assignmentCard}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-label={`Open test paper: ${assignment.title}`}
    >
      <div className={styles.cardHeader}>
        <span className={styles.subjectBadge}>{assignment.subject}</span>
        <span className={`${styles.statusIndicator} ${statusClass}`}>{statusLabel}</span>
      </div>

      <h3 className={styles.cardTitle}>{assignment.title}</h3>

      <div className={styles.cardDetails}>
        <div className={styles.cardMetaRow}>
          <span className={styles.metaItem}>
            <Layers size={13} />
            {assignment.grade}
          </span>
          <span className={styles.metaItem}>
            <HelpCircle size={13} />
            {assignment.sections.length} sections · {questions} Qs
          </span>
        </div>
        <div className={styles.cardMetaRow}>
          <span className={styles.metaItem}>
            <Calendar size={13} />
            Due {new Date(assignment.dueDate).toLocaleDateString()}
          </span>
          <span className={`${styles.metaItem} ${styles.marksItem}`}>
            <Award size={13} />
            {marks} Marks
          </span>
        </div>
      </div>
    </div>
  );
}

function Dashboard({
  assignments,
  onCreateClick,
  onSelectAssignment,
}: {
  assignments: IAssignment[];
  onCreateClick: () => void;
  onSelectAssignment: (a: IAssignment) => void;
}) {
  return (
    <div className="animate-fade">
      <div className={styles.dashboardHeader}>
        <div className={styles.titleArea}>
          <h1>My Test Papers</h1>
          <p>Select a test paper to view details, answer keys, and print options.</p>
        </div>
        <button id="dashboard-create-btn" className={styles.createBtn} onClick={onCreateClick}>
          <Plus size={16} />
          <span>Create Test Paper</span>
        </button>
      </div>

      <div className={styles.cardsGrid}>
        {assignments.map((assignment) => (
          <AssignmentCard
            key={assignment._id}
            assignment={assignment}
            onClick={() => onSelectAssignment(assignment)}
          />
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  const router = useRouter();
  const {
    assignments,
    isLoading,
    fetchAssignments,
    selectAssignment,
  } = useAssignmentStore();

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleSelectAssignment = (assignment: IAssignment) => {
    selectAssignment(assignment);
    router.push(`/assignment/${assignment._id}`);
  };

  const handleCreateClick = () => {
    router.push('/create');
  };

  if (isLoading && assignments.length === 0) {
    return (
      <div className={styles.pageWrapper}>
        <LoadingScreen />
      </div>
    );
  }

  if (assignments.length === 0) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.content}>
          <EmptyState onCreateClick={handleCreateClick} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.content}>
        <Dashboard
          assignments={assignments}
          onCreateClick={handleCreateClick}
          onSelectAssignment={handleSelectAssignment}
        />
      </div>
    </div>
  );
}
