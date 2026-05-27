'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, Users, FileText, BarChart3, Library, Settings, Plus, Sun, Moon, ArrowLeft } from 'lucide-react';
import styles from './Sidebar.module.css';
import { useAssignmentStore } from '../store/assignmentStore';

const NAV_ITEMS = [
  { icon: LayoutGrid, label: 'Home', path: '/home' },
  { icon: Users, label: 'My Classes', path: '/groups' },
  { icon: FileText, label: 'Assignments', path: '/assignments' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Library, label: 'My Library', path: '/library' },
] as const;

const BREADCRUMBS: Record<string, string> = {
  '/assignments': 'Assignments',
  '/create': 'Create Assignment',
  '/groups': 'My Classes',
  '/toolkit': 'Teacher Tools',
  '/library': 'My Library',
  '/settings': 'Settings',
  '/home': 'Home',
  '/analytics': 'Analytics',
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { assignments, activeAssignment, isLoading } = useAssignmentStore();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved ?? (prefersDark ? 'dark' : 'light');
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  const isDeepPage = pathname.startsWith('/assignment/') || pathname === '/create';

  const pageLabel = pathname.startsWith('/assignment/') && activeAssignment
    ? activeAssignment.title
    : BREADCRUMBS[pathname] ?? '';

  return (
    <aside className={styles.sidebar}>
      {/* Loading bar */}
      {isLoading && (
        <div className={styles.loadingBar} aria-hidden="true">
          <div className={styles.loadingBarFill} />
        </div>
      )}

      {/* Logo */}
      <div className={styles.logoArea}>
        <Image src="/logo.png" alt="VedaAI" width={32} height={32} className={styles.logoImage} priority />
        <div className={styles.logoText}>
          Veda<span>AI</span>
        </div>
      </div>

      {/* Breadcrumb / back nav — only shown on deep pages */}
      {isDeepPage && (
        <button
          className={styles.backBtn}
          onClick={() => router.push('/assignments')}
          aria-label="Go back to assignments"
        >
          <ArrowLeft size={14} strokeWidth={2.5} />
          <span>{pageLabel || 'Back'}</span>
        </button>
      )}

      {/* Create button — hidden on deep pages to reduce noise */}
      {!isDeepPage && (
        <Link
          href="/create"
          className={`${styles.createBtn} ${pathname === '/create' ? styles.createBtnActive : ''}`}
          aria-label="Create new assignment"
          id="sidebar-create-btn"
        >
          <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
          <span>Create Assignment</span>
        </Link>
      )}

      {/* Navigation */}
      <nav className={styles.nav} aria-label="Main navigation">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
          const isActive = pathname === path;
          const badge = path === '/assignments' && assignments.length > 0 ? assignments.length : undefined;
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

      {/* Footer */}
      <footer className={styles.footer}>
        <Link
          href="/settings"
          className={`${styles.settingsLink} ${pathname === '/settings' ? styles.active : ''}`}
          aria-label="Settings"
        >
          <Settings size={18} strokeWidth={2.25} aria-hidden="true" />
          <span>Settings</span>
        </Link>

        {/* User profile + theme toggle */}
        <div className={styles.userRow}>
          <div className={styles.avatar} aria-hidden="true">T</div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>Teacher</span>
            <span className={styles.userRole}>Admin</span>
          </div>
          <button
            className={styles.themeBtn}
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
          </button>
        </div>
      </footer>
    </aside>
  );
}
