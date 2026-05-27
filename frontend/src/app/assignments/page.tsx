'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Clock, FilePlus2, Search, Filter, ArrowDownUp } from 'lucide-react';
import { useAssignmentStore, IAssignment } from '../../store/assignmentStore';
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
    <div className={styles.skeletonGrid}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className={styles.skeletonCard}>
          <div className={styles.cardHeader}>
            <div className={`${styles.shimmer} ${styles.skBadge}`} />
            <div className={`${styles.shimmer} ${styles.skDot}`} />
          </div>
          <div className={`${styles.shimmer} ${styles.skLine} ${styles.medium}`} style={{ marginTop: '4px' }} />
          <div className={`${styles.shimmer} ${styles.skLine} ${styles.short}`} style={{ marginTop: 'auto' }} />
          <div className={styles.cardFooter}>
            <div className={`${styles.shimmer} ${styles.skLine}`} style={{ width: '30%' }} />
            <div className={`${styles.shimmer} ${styles.skLine}`} style={{ width: '25%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonDashboard() {
  return (
    <div className="animate-fade">
      <div className={styles.dashboardHeader}>
        <button disabled className={styles.createBtn} style={{ opacity: 0.5 }}>
          <Plus size={16} />
          <span>Create Assignment</span>
        </button>
      </div>
      <SkeletonGrid />
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

  const dotClass =
    assignment.status === 'completed'
      ? styles.dotCompleted
      : assignment.status === 'failed'
      ? styles.dotFailed
      : styles.dotQueued;

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

function Dashboard({
  assignments,
  onCreateClick,
  onSelectAssignment,
}: {
  assignments: IAssignment[];
  onCreateClick: () => void;
  onSelectAssignment: (a: IAssignment) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');

  useEffect(() => {
    setIsFiltering(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setIsFiltering(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, sortBy]);

  const filteredAssignments = useMemo(() => {
    let result = [...assignments];
    if (debouncedQuery) {
      const lowerQ = debouncedQuery.toLowerCase();
      result = result.filter(
        a => a.title.toLowerCase().includes(lowerQ) || a.subject.toLowerCase().includes(lowerQ)
      );
    }
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }
    return result;
  }, [assignments, debouncedQuery, sortBy]);

  return (
    <div className="animate-fade">
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <button className={styles.toolbarBtn} onClick={() => setSortBy(sortBy === 'newest' ? 'oldest' : 'newest')}>
            <Filter size={16} />
            <span>Filter By</span>
          </button>
          
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search Assignment" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>
        
        <button id="dashboard-create-btn" className={styles.createBtn} onClick={onCreateClick}>
          <Plus size={16} />
          <span>Create Assignment</span>
        </button>
      </div>

      {isFiltering ? (
        <SkeletonGrid />
      ) : filteredAssignments.length === 0 ? (
        <div className={styles.emptyStateContainer}>
          <div className={styles.emptyIconWrap}>
            <FilePlus2 size={28} />
          </div>
          <h2 className={styles.emptyTitle}>No assignments found</h2>
          <p className={styles.emptyDesc}>
            Try adjusting your search query or filters.
          </p>
        </div>
      ) : (
        <div className={styles.cardsGrid}>
          {filteredAssignments.map((assignment) => (
            <AssignmentCard
              key={assignment._id}
              assignment={assignment}
              onClick={() => onSelectAssignment(assignment)}
            />
          ))}
        </div>
      )}
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
        <div className={styles.content}>
          <SkeletonDashboard />
        </div>
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
