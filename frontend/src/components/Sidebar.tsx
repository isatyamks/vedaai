'use client';

import React from 'react';
import { Home, Users, FileText, Sparkles, FolderOpen, Settings, Plus } from 'lucide-react';
import { useAssignmentStore } from '../store/assignmentStore';
import styles from './Sidebar.module.css';

export default function Sidebar() {
  const { setCreationForm, showCreationForm, activeAssignment, selectAssignment } = useAssignmentStore();

  const handleCreateClick = () => {
    setCreationForm(true);
  };

  const isAssignmentsActive = showCreationForm === false && activeAssignment === null;
  const isCreateActive = showCreationForm === true;

  return (
    <aside className={styles.sidebar}>
      {/* Brand Header */}
      <div className={styles.logoArea}>
        <div className={styles.logoIcon}>V</div>
        <div className={styles.logoText}>
          Veda<span>AI</span>
        </div>
      </div>

      {/* Primary Action Button */}
      <button 
        className={`${styles.createBtn} ${isCreateActive ? styles.activeCreate : ''}`} 
        onClick={handleCreateClick}
        aria-label="Create new assignment"
      >
        <Plus size={16} />
        <span>Create Assignment</span>
      </button>

      {/* Navigation List */}
      <nav className={styles.nav}>
        <a href="#" className={styles.navLink}>
          <Home size={20} />
          <span>Home</span>
        </a>
        <a href="#" className={styles.navLink}>
          <Users size={20} />
          <span>My Groups</span>
        </a>
        <a 
          href="#" 
          className={`${styles.navLink} ${isAssignmentsActive ? styles.active : ''}`}
          onClick={(e) => {
            e.preventDefault();
            selectAssignment(null); // Return to standard list
          }}
        >
          <FileText size={20} />
          <span>Assignments</span>
        </a>
        <a href="#" className={styles.navLink}>
          <Sparkles size={20} />
          <span>AI Teacher's Toolkit</span>
        </a>
        <a href="#" className={styles.navLink}>
          <FolderOpen size={20} />
          <span>My Library</span>
        </a>
      </nav>

      {/* Sidebar footer area */}
      <div className={styles.footer}>
        <a href="#" className={styles.settingsLink}>
          <Settings size={20} />
          <span>Settings</span>
        </a>

        {/* Delhi Public School profile card */}
        <div className={styles.schoolProfile}>
          <div className={styles.schoolAvatar}>🏫</div>
          <div className={styles.schoolInfo}>
            <span className={styles.schoolName}>Delhi Public School</span>
            <span className={styles.schoolCity}>Bokaro Steel City</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
