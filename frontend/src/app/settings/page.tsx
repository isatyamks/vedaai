'use client';

import React from 'react';
import { Sliders, ShieldCheck, Database } from 'lucide-react';
import styles from '../page.module.css';

export default function SettingsPage() {
  const options = [
    { title: 'Test Paper Settings', desc: 'Select exam generation options, adjust strictness, and configure syllabus templates.', icon: Sliders },
    { title: 'Data Store & Backup', desc: 'Manage database connection, backup your records, and clear saved cache.', icon: Database },
    { title: 'Access & Permissions', desc: 'Manage school teacher accounts, set system password keys, and update login info.', icon: ShieldCheck },
  ];

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.content}>
        <div className={styles.dashboardHeader}>
          <div className={styles.titleArea}>
            <h1>Settings</h1>
            <p>Configure Veda AI server endpoints, assessment parameters, and workspace guidelines.</p>
          </div>
        </div>

        <div className={styles.cardsGrid}>
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <div key={opt.title} className={styles.assignmentCard}>
                <div className={styles.cardHeader}>
                  <span className={styles.subjectBadge}>System</span>
                  <Icon size={18} style={{ color: 'var(--brand-orange)' }} />
                </div>
                <h3 className={styles.cardTitle}>{opt.title}</h3>
                <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: '1.5' }}>{opt.desc}</p>
                <div className={styles.cardDetails}>
                  <div className={styles.cardMetaRow}>
                    <span className={styles.metaItem}>
                      v1.0.0 Stable
                    </span>
                    <span className={styles.metaItem} style={{ fontWeight: '600', color: 'var(--brand-orange)' }}>
                      Configure
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
