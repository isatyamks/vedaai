'use client';

import React from 'react';
import { ArrowLeft, Bell, ChevronDown } from 'lucide-react';
import { useAssignmentStore } from '../store/assignmentStore';
import styles from './Header.module.css';

export default function Header() {
  const { showCreationForm, activeAssignment, selectAssignment, setCreationForm } = useAssignmentStore();

  const handleBackClick = () => {
    // Navigate back to listing view
    selectAssignment(null);
    setCreationForm(false);
  };

  // Determine Title text dynamically based on state
  let breadcrumbLabel = 'Assignments';
  if (showCreationForm) {
    breadcrumbLabel = 'Create Assignment';
  } else if (activeAssignment) {
    breadcrumbLabel = activeAssignment.title;
  }

  return (
    <header className={styles.header}>
      {/* Dynamic Breadcrumbs */}
      <div className={styles.breadcrumb} onClick={handleBackClick} role="button" aria-label="Go back">
        <span className={styles.backIcon}>
          <ArrowLeft size={16} />
        </span>
        <span>{breadcrumbLabel}</span>
      </div>

      {/* Top Bar Right Area */}
      <div className={styles.actions}>
        {/* Notifications Icon with Indicator */}
        <button className={styles.bellButton} aria-label="Notifications">
          <Bell size={20} />
          <span className={styles.badge} />
        </button>

        {/* Profile Card dropdown */}
        <div className={styles.profileCard}>
          <div className={styles.avatar}>JD</div>
          <span className={styles.username}>John Doe</span>
          <ChevronDown size={14} className={styles.chevron} />
        </div>
      </div>
    </header>
  );
}
