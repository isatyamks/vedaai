'use client';

import React from 'react';
import { ArrowLeft, Bell, ChevronDown } from 'lucide-react';
import { useAssignmentStore } from '../store/assignmentStore';
import styles from './Header.module.css';

export default function Header() {
  const { showCreationForm, activeAssignment, selectAssignment, setCreationForm } = useAssignmentStore();

  const handleBack = () => {
    selectAssignment(null);
    setCreationForm(false);
  };

  const breadcrumb = showCreationForm
    ? 'Create Assignment'
    : activeAssignment
    ? activeAssignment.title
    : 'Assignments';

  return (
    <header className={styles.header}>
      <button className={styles.breadcrumb} onClick={handleBack} aria-label="Navigate back">
        <span className={styles.backIcon}>
          <ArrowLeft size={16} />
        </span>
        <span className={styles.breadcrumbLabel}>{breadcrumb}</span>
      </button>

      <div className={styles.actions}>
        <button className={styles.bellButton} aria-label="View notifications">
          <Bell size={20} />
          <span className={styles.badge} aria-hidden="true" />
        </button>

        <div className={styles.profileCard} role="button" tabIndex={0} aria-label="Open user menu">
          <div className={styles.avatar} aria-hidden="true">JD</div>
          <span className={styles.username}>John Doe</span>
          <ChevronDown size={14} className={styles.chevron} aria-hidden="true" />
        </div>
      </div>
    </header>
  );
}
