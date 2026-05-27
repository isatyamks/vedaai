'use client';

import React, { useMemo } from 'react';
import { Check, Loader, AlertTriangle } from 'lucide-react';
import { useAssignmentStore, IActiveJob } from '../store/assignmentStore';
import styles from './ProgressModal.module.css';

const STEPS: { label: string; threshold: number }[] = [
  { label: 'Preparing to make test paper', threshold: 0 },
  { label: 'Checking selected rules and sections', threshold: 15 },
  { label: 'Writing questions matching difficulty rules', threshold: 40 },
  { label: 'Creating final test paper layout', threshold: 70 },
];

function StepIcon({ isDone, isActive }: { isDone: boolean; isActive: boolean }) {
  if (isDone) return <Check size={12} className={styles.stepCompleted} />;
  if (isActive) return <Loader size={12} className={`${styles.stepActive} animate-spin`} />;
  return <span className={styles.stepPending}>•</span>;
}

function ProgressRing({ progress }: { progress: number }) {
  const r = 48;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={styles.progressRingContainer}>
      <svg className={styles.svgRing} width="120" height="120" aria-hidden="true">
        <circle className={styles.ringBg} cx="60" cy="60" r={r} />
        <circle
          className={styles.ringBar}
          cx="60"
          cy="60"
          r={r}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className={styles.progressText}>{progress}%</div>
    </div>
  );
}

export default function ProgressModal() {
  const { activeJob, clearActiveJob } = useAssignmentStore();

  if (!activeJob) return null;

  const { progress, status, message } = activeJob;
  const isTerminal = status === 'completed' || status === 'failed';

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Test paper creation progress">
      <div className={styles.modal}>
        {status === 'failed' ? (
          <div className={styles.failedIcon}>
            <AlertTriangle size={40} aria-hidden="true" />
          </div>
        ) : status === 'completed' ? (
          <div className={styles.successIcon}>
            <Check size={40} strokeWidth={3} aria-hidden="true" />
          </div>
        ) : (
          <ProgressRing progress={progress} />
        )}

        <div className={styles.statusText}>
          <h4 className={styles.statusTitle}>
            {status === 'failed'
              ? 'Failed to Create'
              : status === 'completed'
              ? 'Test Paper Ready!'
              : 'Creating Test Paper...'}
          </h4>
          <p className={styles.statusDesc}>{message ?? 'Processing your request...'}</p>
        </div>

        <div className={styles.stepsList} aria-label="Progress steps">
          {STEPS.map((step, i) => {
            const isDone = progress > step.threshold;
            const nextThreshold = STEPS[i + 1]?.threshold ?? 95;
            const isActive = progress >= step.threshold && progress < nextThreshold && !isDone;
            return (
              <div key={step.label} className={styles.stepRow}>
                <div className={styles.stepIconWrap}>
                  <StepIcon isDone={isDone} isActive={isActive} />
                </div>
                <span style={{ fontWeight: isActive ? 600 : 400 }}>{step.label}</span>
              </div>
            );
          })}
        </div>

        {isTerminal && (
          <button className={styles.okButton} onClick={clearActiveJob}>
            {status === 'failed' ? 'Close & Retry' : 'View Exam Paper'}
          </button>
        )}
      </div>
    </div>
  );
}
