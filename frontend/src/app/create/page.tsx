'use client';

import React from 'react';
import AssignmentForm from '../../components/AssignmentForm';
import styles from '../page.module.css';

export default function CreatePage() {
  return (
    <div className={styles.pageWrapper}>
      <AssignmentForm />
    </div>
  );
}
