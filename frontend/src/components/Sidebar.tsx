'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Users, FileText, BarChart3, Clock, Settings, Sparkles, School, Library } from 'lucide-react';
import styles from './Sidebar.module.css';

import { useAssignmentStore } from '../store/assignmentStore';

export default function Sidebar() {
  const pathname = usePathname();
  const { assignments } = useAssignmentStore();

  const navItems = [
    { icon: LayoutGrid, label: 'Home', path: '/home' },
    { icon: Users, label: 'My Classes', path: '/groups' },
    { icon: FileText, label: 'Assignments', path: '/', badge: assignments.length > 0 ? assignments.length : undefined },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: Clock, label: 'My Library', path: '/library'},
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoArea}>
        <Image src="/logo.png" alt="VedaAI" width={36} height={36} className={styles.logoImage} priority />
        <div className={styles.logoText}>
          Veda<span>AI</span>
        </div>
      </div>

      <Link
        href="/create"
        className={`${styles.createBtn} ${pathname === '/create' ? styles.createBtnActive : ''}`}
        aria-label="Create new assignment"
        id="sidebar-create-btn"
      >
        <Sparkles size={16} strokeWidth={2.5} aria-hidden="true" />
        <span>Create Assignment</span>
      </Link>

      <nav className={styles.nav} aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const label = item.label;
          const path = item.path;
          const badge = 'badge' in item ? item.badge : undefined;
          const isActive = pathname === path;
          return (
            <Link
              key={path}
              href={path}
              className={`${styles.navLink} ${isActive ? styles.active : ''}`}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={18} strokeWidth={2.25} aria-hidden="true" />
              <span>{label}</span>
              {badge !== undefined && (
                <span className={styles.navBadge}>{badge}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <footer className={styles.footer}>
        <Link
          href="/settings"
          className={`${styles.settingsLink} ${pathname === '/settings' ? styles.active : ''}`}
          aria-label="Settings"
        >
          <Settings size={18} strokeWidth={2.25} aria-hidden="true" />
          <span>Settings</span>
        </Link>

        <div className={styles.schoolProfile}>
          <div className={styles.schoolAvatar} aria-hidden="true">
            <School size={16} strokeWidth={2.5} />
          </div>
          <div className={styles.schoolInfo}>
            <span className={styles.schoolName}>Delhi Public School</span>
            <span className={styles.schoolCity}>Bokaro Steel City</span>
          </div>
        </div>
      </footer>
    </aside>
  );
}
