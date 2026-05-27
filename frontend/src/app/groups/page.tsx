'use client';

import React from 'react';
import { Plus, Shield, GraduationCap } from 'lucide-react';
import { useAssignmentStore } from '../../store/assignmentStore';
import styles from '../page.module.css';

export default function GroupsPage() {
  const { showToast } = useAssignmentStore();
  const groups = [
    { name: 'Class 8 — Science', students: 32, code: '8-A' },
    { name: 'Class 9 — Maths', students: 28, code: '9-B' },
    { name: 'Class 10 — Physics', students: 30, code: '10-C' },
  ];

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.content}>
        <div className={styles.dashboardHeader}>
          <div className={styles.titleArea}>
            <h1>My Classes</h1>
            <p>Manage your classrooms, student enrollment, and active test papers.</p>
          </div>
          <button 
            className={styles.createBtn} 
            onClick={() => showToast('Class Creation coming soon in Veda AI v1.5!', 'info')}
          >
            <Plus size={16} />
            <span>Add Class</span>
          </button>
        </div>

        <div className={styles.cardsGrid}>
          {groups.map((group) => (
            <div 
              key={group.code} 
              className={styles.assignmentCard}
              onClick={() => showToast(`Opening roster for ${group.name}...`, 'success')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && showToast(`Opening roster for ${group.name}...`, 'success')}
              aria-label={`Open class: ${group.name}`}
            >
              <div className={styles.cardHeader}>
                <span className={styles.subjectBadge}>Active</span>
                <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 'bold' }}>{group.code}</span>
              </div>
              <h3 className={styles.cardTitle}>{group.name}</h3>
              <div className={styles.cardDetails}>
                <div className={styles.cardMetaRow}>
                  <span className={styles.metaItem}>
                    <GraduationCap size={14} />
                    {group.students} Enrolled Students
                  </span>
                  <span className={styles.metaItem}>
                    <Shield size={14} />
                    Active
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
