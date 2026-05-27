'use client';

import React from 'react';
import { Plus, Archive, FileText } from 'lucide-react';
import styles from '../page.module.css';

export default function LibraryPage() {
  const folders = [
    { title: 'CBSE Board Prep — Science', count: 12, size: '2.4 MB' },
    { title: 'Weekly Assessment Archive', count: 48, size: '11.8 MB' },
    { title: 'Remedial Worksheets', count: 8, size: '890 KB' },
  ];

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.content}>
        <div className={styles.dashboardHeader}>
          <div className={styles.titleArea}>
            <h1>My Library</h1>
            <p>Archive and organize all your generated assessments, answer keys, and syllabus worksheets.</p>
          </div>
          <button className={styles.createBtn}>
            <Plus size={16} />
            <span>Create Folder</span>
          </button>
        </div>

        <div className={styles.cardsGrid}>
          {folders.map((folder) => (
            <div key={folder.title} className={styles.assignmentCard}>
              <div className={styles.cardHeader}>
                <span className={styles.subjectBadge}>Verified</span>
                <Archive size={16} style={{ color: 'var(--muted)' }} />
              </div>
              <h3 className={styles.cardTitle}>{folder.title}</h3>
              <div className={styles.cardDetails}>
                <div className={styles.cardMetaRow}>
                  <span className={styles.metaItem}>
                    <FileText size={14} />
                    {folder.count} Documents
                  </span>
                  <span className={styles.metaItem}>
                    {folder.size}
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
