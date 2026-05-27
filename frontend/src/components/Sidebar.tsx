'use client';

import React from 'react';
import { Home, Users, FileText, Sparkles, FolderOpen, Settings, Plus } from 'lucide-react';
import { useAssignmentStore } from '../store/assignmentStore';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { icon: Home, label: 'Home', id: 'home' },
  { icon: Users, label: 'My Groups', id: 'groups' },
  { icon: Sparkles, label: "AI Teacher's Toolkit", id: 'toolkit' },
  { icon: FolderOpen, label: 'My Library', id: 'library' },
] as const;

export default function Sidebar() {
  const { setCreationForm, showCreationForm, activeAssignment, selectAssignment } = useAssignmentStore();

  const isAssignmentsActive = !showCreationForm && activeAssignment === null;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoArea}>
        <div className={styles.logoIcon} aria-hidden="true">V</div>
        <div className={styles.logoText}>
          Veda<span>AI</span>
        </div>
      </div>

      <button
        className={`${styles.createBtn} ${showCreationForm ? styles.createBtnActive : ''}`}
        onClick={() => setCreationForm(true)}
        aria-label="Create new assignment"
        id="sidebar-create-btn"
      >
        <Plus size={16} aria-hidden="true" />
        <span>Create Assignment</span>
      </button>

      <nav className={styles.nav} aria-label="Main navigation">
        {NAV_ITEMS.map(({ icon: Icon, label, id }) => (
          <a key={id} href="#" className={styles.navLink} aria-label={label}>
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
          </a>
        ))}

        <a
          href="#"
          className={`${styles.navLink} ${isAssignmentsActive ? styles.active : ''}`}
          aria-current={isAssignmentsActive ? 'page' : undefined}
          onClick={(e) => {
            e.preventDefault();
            selectAssignment(null);
            setCreationForm(false);
          }}
        >
          <FileText size={20} aria-hidden="true" />
          <span>Assignments</span>
        </a>
      </nav>

      <footer className={styles.footer}>
        <a href="#" className={styles.settingsLink} aria-label="Settings">
          <Settings size={20} aria-hidden="true" />
          <span>Settings</span>
        </a>

        <div className={styles.schoolProfile}>
          <div className={styles.schoolAvatar} aria-hidden="true">🏫</div>
          <div className={styles.schoolInfo}>
            <span className={styles.schoolName}>Delhi Public School</span>
            <span className={styles.schoolCity}>Bokaro Steel City</span>
          </div>
        </div>
      </footer>
    </aside>
  );
}
