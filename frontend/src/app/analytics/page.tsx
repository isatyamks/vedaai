'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import styles from './analytics.module.css';

export default function AnalyticsPage() {
  // Frequently missed concepts
  const gaps = [
    { name: "Ohm's Law Application", val: "23%" },
    { name: "Resistance in Parallel Circuits", val: "18%" },
    { name: "Potential Difference and EMF", val: "15%" },
    { name: "Interpreting Circuit Diagrams", val: "12%" },
    { name: "Series vs Parallel Circuits", val: "8%" },
  ];

  // Actions for teachers
  const actions = [
    "Simran Kaur – Misinterprets series vs parallel logic; needs circuit-building demo.",
    "Revise in class : Ohm’s Law – Use real-life problem-solving (e.g., fan, heater)",
    "Concept of Power – Clarify derivations and differences between formulas.",
    "Extra classes for students who scored less than D",
    "Extra classes for students who scored less than D",
  ];

  // Segmentation pills
  const segments = [
    { grade: 'A', count: 12, bg: '#dcfce7', color: '#15803d' },
    { grade: 'B', count: 15, bg: '#fef3c7', color: '#b45309' },
    { grade: 'C', count: 13, bg: '#ffedd5', color: '#c2410c' },
    { grade: 'Below D', count: 10, bg: '#fecdd3', color: '#be123c' },
  ];

  return (
    <div className={styles.container}>
      {/* Left Column */}
      <div className={styles.leftColumn}>
        
        {/* Overall Class Performance Summary */}
        <div className={styles.performanceCard}>
          <h3 className={styles.cardTitle}>Overall Class Performance Summary</h3>
          <div className={styles.performanceGrid}>
            
            {/* Submissions Card */}
            <div className={styles.submissionsCard}>
              <span className={styles.submissionsTitle}>Submissions</span>
              <div className={styles.gaugeContainer}>
                {/* Handcrafted highly precise semi-circular SVG gauge */}
                <svg className={styles.gaugeSvg} viewBox="0 0 140 90">
                  <path 
                    d="M 20 80 A 50 50 0 0 1 120 80" 
                    className={styles.gaugeBg} 
                    fill="none" 
                    strokeLinecap="round" 
                  />
                  <path 
                    d="M 20 80 A 50 50 0 0 1 120 80" 
                    className={styles.gaugeBar} 
                    fill="none" 
                    strokeLinecap="round" 
                    strokeDasharray="157.08" 
                    strokeDashoffset="15.7" // 90% rate (45/50)
                  />
                </svg>
                <div className={styles.submissionsNum}>
                  <span className={styles.submissionsVal}>45<span style={{ fontSize: '15px', color: '#94a3b8', fontWeight: 'normal' }}> / 50</span></span>
                  <span className={styles.submissionsTotal}>Submissions</span>
                </div>
              </div>
              <div className={styles.submissionsLegend}>
                <div className={styles.legendItem}>
                  <div className={styles.legendSquare} style={{ backgroundColor: '#ff5a36' }} />
                  <span>Submitted</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={styles.legendSquare} style={{ backgroundColor: '#334155' }} />
                  <span>Not Submitted</span>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className={styles.metricsGrid}>
              <div className={styles.metricBox}>
                <span className={styles.metricValue} style={{ color: '#16a34a' }}>82%</span>
                <span className={styles.metricLabel}>Average Score</span>
              </div>
              <div className={styles.metricBox}>
                <span className={styles.metricValue} style={{ color: '#ff5a36' }}>95%</span>
                <span className={styles.metricLabel}>TopScore</span>
              </div>
              <div className={styles.metricBox}>
                <span className={styles.metricValue} style={{ color: '#0f172a' }}>20<span style={{ fontSize: '16px', fontWeight: '500', color: '#64748b' }}>/25</span></span>
                <span className={styles.metricLabel}>Class Median</span>
              </div>
              <div className={styles.metricBox}>
                <span className={styles.metricValue} style={{ color: '#94a3b8' }}>40%</span>
                <span className={styles.metricLabel}>Lowest Score</span>
              </div>
            </div>

          </div>
        </div>

        {/* Student Segmentation (Orange backdrop card) */}
        <div className={styles.segmentationCard}>
          <div className={styles.segmentationPanel}>
            <span className={styles.segmentTitle}>Student Segmentation (Based on grades)</span>
            <div className={styles.segmentPills}>
              {segments.map((pill) => (
                <div 
                  key={pill.grade} 
                  className={styles.segmentPill} 
                  style={{ backgroundColor: pill.bg, color: pill.color }}
                >
                  <span className={styles.pillGrade}>{pill.grade}</span>
                  <span className={styles.pillLabel} style={{ color: pill.color }}>
                    {pill.count} Students
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.teacherBadgeWrap}>
            <div className={styles.teacherRing}>
              <div className={styles.teacherAvatar} aria-label="Female Teacher Avatar">
                👩‍🏫
              </div>
            </div>
          </div>
        </div>

        {/* AI Feedback Summary */}
        <div className={styles.feedbackCard}>
          <h3 className={styles.cardTitle} style={{ margin: 0, border: 'none', padding: 0 }}>AI Feedback Summary</h3>
          <div className={styles.feedbackRow}>
            <CheckCircle2 size={18} aria-hidden="true" />
            <span>Assignment Graded : 87</span>
          </div>
        </div>

      </div>

      {/* Right Column */}
      <div className={styles.rightColumn}>
        
        {/* Learning Gaps Analysis */}
        <div className={styles.whiteCard}>
          <h3 className={styles.cardTitle}>Learning Gaps Analysis</h3>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Frequently missed concepts
          </span>
          <div className={styles.conceptList}>
            {gaps.map((gap, i) => (
              <div key={gap.name} className={styles.conceptItem}>
                <div className={styles.conceptText}>
                  <span className={styles.conceptNum}>{i + 1}.</span>
                  <span>{gap.name}</span>
                </div>
                <span className={styles.conceptVal}>{gap.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Actions for teachers */}
        <div className={styles.whiteCard}>
          <h3 className={styles.cardTitle} style={{ fontSize: '13px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            Recommended Actions for teachers
          </h3>
          <div className={styles.actionsList}>
            {actions.map((act, i) => (
              <div key={i} className={styles.actionItem}>
                <span className={styles.actionNum}>{i + 1}.</span>
                <span>{act}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
