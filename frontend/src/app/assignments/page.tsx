'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, FilePlus2, Plus } from 'lucide-react';
import { useAssignmentStore, IAssignment } from '../../store/assignmentStore';
import styles from './page.module.css';

function computeTotals(assignment: IAssignment) {
  let questions = 0;
  let marks = 0;
  assignment.sections.forEach((s) =>
    s.questions.forEach((q) => { questions++; marks += q.marks; })
  );
  return { questions, marks };
}

function timeAgo(dateString: string) {
  if (!dateString) return 'Just now';
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString();
}

function SkeletonGrid() {
  return (
    <div className={styles.cardsGrid}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className={styles.skeletonCard}>
          <div className={styles.cardHeader}>
            <div className={`${styles.shimmer} ${styles.skBadge}`} />
            <div className={`${styles.shimmer} ${styles.skDot}`} />
          </div>
          <div className={`${styles.shimmer} ${styles.skLine} ${styles.medium}`} />
          <div className={`${styles.shimmer} ${styles.skLine} ${styles.short}`} />
          <div className={styles.cardFooter}>
            <div className={`${styles.shimmer} ${styles.skLine}`} style={{ width: '30%' }} />
            <div className={`${styles.shimmer} ${styles.skLine}`} style={{ width: '25%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className={styles.emptyStateContainer}>
      <div className={styles.emptyIconWrap}>
        <FilePlus2 size={28} />
      </div>
      <h2 className={styles.emptyTitle}>No assignments yet</h2>
      <p className={styles.emptyDesc}>
        Create your first assignment to get started. AI will generate a structured paper based on your parameters.
      </p>
      <button id="empty-create-btn" className={styles.emptyBtn} onClick={onCreateClick}>
        <Plus size={16} />
        <span>New Assignment</span>
      </button>
    </div>
  );
}

function AssignmentCard({ assignment, onClick }: { assignment: IAssignment; onClick: () => void }) {
  const { questions, marks } = computeTotals(assignment);

  const statusLabel =
    assignment.status === 'completed' ? 'Ready' :
    assignment.status === 'failed' ? 'Error' : 'Generating';

  const dotClass =
    assignment.status === 'completed' ? styles.dotCompleted :
    assignment.status === 'failed' ? styles.dotFailed : styles.dotQueued;

  return (
    <div
      className={styles.assignmentCard}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      aria-label={`Open assignment: ${assignment.title}`}
    >
      <div className={styles.cardHeader}>
        <span className={styles.subjectBadge}>{assignment.subject}</span>
        <span className={styles.statusIndicator}>
          <span className={`${styles.statusDot} ${dotClass}`} />
          {statusLabel}
        </span>
      </div>

      <h3 className={styles.cardTitle}>{assignment.title}</h3>

      <div className={styles.cardDetails}>
        <div className={styles.cardMetaInline}>
          <span>Class {assignment.grade}</span>
          <span className={styles.bullet}>•</span>
          <span>{questions} Qs</span>
          <span className={styles.bullet}>•</span>
          <span className={styles.marksItem}>{marks} Marks</span>
        </div>
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.timeAgo}>
          <Clock size={12} />
          {timeAgo(assignment.createdAt)}
        </div>
        <div>
          Due {new Date(assignment.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </div>
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
    searchQuery,
    sortBy,
  } = useAssignmentStore();

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const filtered = useMemo(() => {
    let result = [...assignments];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (a) => a.title.toLowerCase().includes(q) || a.subject.toLowerCase().includes(q)
      );
    }
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }
    return result;
  }, [assignments, searchQuery, sortBy]);

  const handleSelect = (assignment: IAssignment) => {
    selectAssignment(assignment);
    router.push(`/assignment/${assignment._id}`);
  };

  if (isLoading && assignments.length === 0) {
    return <SkeletonGrid />;
  }

  if (assignments.length === 0) {
    return <EmptyState onCreateClick={() => router.push('/create')} />;
  }

  if (filtered.length === 0) {
    return (
      <div className={styles.emptyStateContainer}>
        <div className={styles.emptyIconWrap}><FilePlus2 size={28} /></div>
        <h2 className={styles.emptyTitle}>No results</h2>
        <p className={styles.emptyDesc}>No assignments match your search.</p>
      </div>
    );
  }

  return (
    <div className={`${styles.cardsGrid} animate-fade`}>
      {filtered.map((a) => (
        <AssignmentCard key={a._id} assignment={a} onClick={() => handleSelect(a)} />
      ))}
    </div>
  );
}
