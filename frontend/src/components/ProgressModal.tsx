'use client';

import React from 'react';
import { Check, Loader, X, AlertTriangle } from 'lucide-react';
import { useAssignmentStore } from '../store/assignmentStore';
import styles from './ProgressModal.module.css';

export default function ProgressModal() {
  const { activeJob, clearActiveJob } = useAssignmentStore();

  if (!activeJob) return null;

  const { progress, status, message } = activeJob;

  // SVG circle calculations
  const r = 48;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Check state of step checklist
  const isStep1Done = progress >= 15;
  const isStep2Done = progress >= 40;
  const isStep3Done = progress >= 70;
  const isStep4Done = progress >= 95;

  const handleClose = () => {
    clearActiveJob();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Circular Progress Ring */}
        <div className={styles.progressRingContainer}>
          <svg className={styles.svgRing} width="120" height="120">
            <circle className={styles.ringBg} cx="60" cy="60" r={r} />
            <circle
              className={styles.ringBar}
              cx="60"
              cy="60"
              r={r}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <div className={styles.progressText}>
            {status === 'failed' ? (
              <AlertTriangle size={24} style={{ color: '#ef4444' }} />
            ) : status === 'completed' ? (
              <Check size={28} style={{ color: '#22c55e', strokeWidth: 3 }} />
            ) : (
              `${progress}%`
            )}
          </div>
        </div>

        {/* Progress Title text */}
        <div>
          <h4 className={styles.statusTitle}>
            {status === 'failed'
              ? 'AI Generation Failed'
              : status === 'completed'
              ? 'Assessment Created!'
              : 'Creating Exam Paper...'}
          </h4>
          <p className={styles.statusDesc}>
            {status === 'failed' ? activeJob.message || 'Error occurred.' : message || 'Generating questions...'}
          </p>
        </div>

        {/* Dynamic Queue log checklist */}
        <div className={styles.stepsList}>
          {/* Step 1 */}
          <div className={styles.stepRow}>
            <div
              className={`${styles.stepIcon} ${
                isStep1Done ? styles.stepCompleted : status === 'queued' ? styles.stepActive : styles.stepPending
              }`}
            >
              {isStep1Done ? <Check size={12} /> : <Loader size={12} className="animate-spin" />}
            </div>
            <span style={{ fontWeight: status === 'queued' ? 600 : 400 }}>
              Job queued in BullMQ background queue
            </span>
          </div>

          {/* Step 2 */}
          <div className={styles.stepRow}>
            <div
              className={`${styles.stepIcon} ${
                isStep2Done ? styles.stepCompleted : progress >= 15 && progress < 40 ? styles.stepActive : styles.stepPending
              }`}
            >
              {isStep2Done ? (
                <Check size={12} />
              ) : progress >= 15 && progress < 40 ? (
                <Loader size={12} className="animate-spin" />
              ) : (
                '•'
              )}
            </div>
            <span style={{ fontWeight: progress >= 15 && progress < 40 ? 600 : 400 }}>
              AI prompting constraints optimization
            </span>
          </div>

          {/* Step 3 */}
          <div className={styles.stepRow}>
            <div
              className={`${styles.stepIcon} ${
                isStep3Done ? styles.stepCompleted : progress >= 40 && progress < 70 ? styles.stepActive : styles.stepPending
              }`}
            >
              {isStep3Done ? (
                <Check size={12} />
              ) : progress >= 40 && progress < 70 ? (
                <Loader size={12} className="animate-spin" />
              ) : (
                '•'
              )}
            </div>
            <span style={{ fontWeight: progress >= 40 && progress < 70 ? 600 : 400 }}>
              Querying Gemini AI Structured Models
            </span>
          </div>

          {/* Step 4 */}
          <div className={styles.stepRow}>
            <div
              className={`${styles.stepIcon} ${
                isStep4Done ? styles.stepCompleted : progress >= 70 && progress < 95 ? styles.stepActive : styles.stepPending
              }`}
            >
              {isStep4Done ? (
                <Check size={12} />
              ) : progress >= 70 && progress < 95 ? (
                <Loader size={12} className="animate-spin" />
              ) : (
                '•'
              )}
            </div>
            <span style={{ fontWeight: progress >= 70 && progress < 95 ? 600 : 400 }}>
              Writing structured exam paper to DB
            </span>
          </div>
        </div>

        {/* Finished Action Bar */}
        {(status === 'completed' || status === 'failed') && (
          <button className={styles.okButton} onClick={handleClose}>
            {status === 'failed' ? 'Close & Retry' : 'View Generated Exam Paper'}
          </button>
        )}
      </div>
    </div>
  );
}
