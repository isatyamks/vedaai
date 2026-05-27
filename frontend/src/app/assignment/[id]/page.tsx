'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAssignmentStore } from '../../../store/assignmentStore';
import QuestionPaperView from '../../../components/QuestionPaperView';
import styles from './page.module.css';

export default function AssignmentDetailPage() {
  const { id } = useParams() as { id: string };
  const { activeAssignment, fetchAssignmentDetails, isLoading } = useAssignmentStore();

  useEffect(() => {
    if (id) fetchAssignmentDetails(id);
  }, [id, fetchAssignmentDetails]);

  if (isLoading && !activeAssignment) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.loaderContainer}>
          <div className={styles.pulsingSpinner} />
          <span className={styles.loaderText}>Fetching details...</span>
        </div>
      </div>
    );
  }

  if (!activeAssignment) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.emptyStateContainer}>
          <h2 className={styles.emptyTitle}>Assessment not found</h2>
          <p className={styles.emptyDesc}>The requested assessment could not be loaded or doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.content}>
        <QuestionPaperView />
      </div>
    </div>
  );
}
