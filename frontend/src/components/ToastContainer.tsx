'use client';

import React from 'react';
import { useAssignmentStore } from '../store/assignmentStore';
import { Info, CheckCircle, AlertCircle, X } from 'lucide-react';
import styles from './ToastContainer.module.css';

export default function ToastContainer() {
  const { toast, hideToast } = useAssignmentStore();

  if (!toast) return null;

  const Icon = toast.type === 'success' 
    ? CheckCircle 
    : toast.type === 'error' 
    ? AlertCircle 
    : Info;

  const statusClass = toast.type === 'success'
    ? styles.success
    : toast.type === 'error'
    ? styles.error
    : styles.info;

  return (
    <div className={`${styles.toast} ${statusClass}`} role="alert">
      <Icon size={16} className={styles.icon} aria-hidden="true" />
      <span className={styles.message}>{toast.message}</span>
      <button className={styles.closeBtn} onClick={hideToast} aria-label="Dismiss notification">
        <X size={14} />
      </button>
    </div>
  );
}
