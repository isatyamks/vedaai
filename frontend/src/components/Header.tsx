'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, ChevronDown, Sun, Moon } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useAssignmentStore } from '../store/assignmentStore';
import styles from './Header.module.css';

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

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { activeAssignment, isLoading } = useAssignmentStore();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = (savedTheme as 'light' | 'dark') || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  };

  const showBackBtn = pathname !== '/assignments';

  const breadcrumb = pathname.startsWith('/assignment/') && activeAssignment
    ? activeAssignment.title
    : BREADCRUMBS[pathname] ?? 'Assignments';

  return (
    <header className={styles.header}>
      {isLoading && (
        <div className={styles.topLoader} aria-hidden="true">
          <div className={styles.topLoaderBar} />
        </div>
      )}
      <button
        className={styles.breadcrumb}
        onClick={() => router.push('/assignments')}
        disabled={!showBackBtn}
        aria-label="Navigate back"
      >
        {showBackBtn && (
          <span className={styles.backIcon}>
            <ArrowLeft size={16} />
          </span>
        )}
        <span className={styles.breadcrumbLabel}>{breadcrumb}</span>
      </button>

      <div className={styles.actions}>
        <button
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        <button className={styles.bellButton} aria-label="Notifications" aria-disabled="true">
          <Bell size={20} />
        </button>

        <div className={styles.profileCard} role="button" tabIndex={0} aria-label="User menu">
          <div className={styles.avatar} aria-hidden="true">T</div>
          <span className={styles.username}>Teacher</span>
          <ChevronDown size={14} className={styles.chevron} aria-hidden="true" />
        </div>
      </div>
    </header>
  );
}
