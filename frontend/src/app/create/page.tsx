'use client';

import React from 'react';
import AssignmentForm from '../../components/AssignmentForm';
import styles from '../assignments/page.module.css';

export default function CreatePage() {
  return (
    <div className={styles.pageWrapper}>
      <AssignmentForm />
    </div>
  );
}
