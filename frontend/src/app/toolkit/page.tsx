'use client';

import React from 'react';
import { GraduationCap, CheckCircle } from 'lucide-react';
import { useAssignmentStore } from '../../store/assignmentStore';
import styles from '../page.module.css';

export default function ToolkitPage() {
  const { showToast } = useAssignmentStore();
  const tools = [
    { title: 'Syllabus Matcher', desc: 'Scan questions to verify coverage of Board curriculum guidelines and outcomes.', type: 'Curriculum' },
    { title: 'Difficulty Adjuster', desc: 'Auto-adjust wordings and answer options to perfectly fit class performance metrics.', type: 'Balancing' },
    { title: 'Grading Rubrics', desc: 'Create scoring guidelines and rubrics for descriptive and long questions.', type: 'Evaluation' },
  ];

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.content}>
        <div className={styles.dashboardHeader}>
          <div className={styles.titleArea}>
            <h1>Teacher Tools</h1>
            <p>Advanced tools to check curriculum matching, adjust question difficulties, and make grading rubrics.</p>
          </div>
        </div>

        <div className={styles.cardsGrid}>
          {tools.map((tool) => (
            <div 
              key={tool.title} 
              className={styles.assignmentCard}
              onClick={() => showToast(`Launching ${tool.title}...`, 'success')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && showToast(`Launching ${tool.title}...`, 'success')}
              aria-label={`Launch tool: ${tool.title}`}
            >
              <div className={styles.cardHeader}>
                <span className={styles.subjectBadge}>{tool.type}</span>
                <CheckCircle size={16} style={{ color: 'var(--brand-orange)' }} />
              </div>
              <h3 className={styles.cardTitle}>{tool.title}</h3>
              <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: '1.5' }}>{tool.desc}</p>
              <div className={styles.cardDetails}>
                <div className={styles.cardMetaRow}>
                  <span className={styles.metaItem}>
                    <GraduationCap size={14} />
                    Standard Generator
                  </span>
                  <span className={styles.metaItem} style={{ fontWeight: '600', color: 'var(--brand-orange)' }}>
                    Launch Tool
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
