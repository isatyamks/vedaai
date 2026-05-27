'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, HelpCircle, Bell, ChevronDown, Sun, Moon } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useAssignmentStore } from '../store/assignmentStore';
import styles from './Header.module.css';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { activeAssignment, isLoading } = useAssignmentStore();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme as 'light' | 'dark');
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  };

  const handleBack = () => {
    if (pathname !== '/') {
      router.push('/');
    }
  };

  let breadcrumb = 'Assignments';
  if (pathname === '/') {
    breadcrumb = 'Assignments';
  } else if (pathname === '/create') {
    breadcrumb = 'Create Assignment';
  } else if (pathname.startsWith('/assignment/') && activeAssignment) {
    breadcrumb = activeAssignment.title;
  } else if (pathname === '/groups') {
    breadcrumb = 'My Classes';
  } else if (pathname === '/toolkit') {
    breadcrumb = "Teacher Tools";
  } else if (pathname === '/library') {
    breadcrumb = 'My Library';
  } else if (pathname === '/settings') {
    breadcrumb = 'Settings';
  }

  const showBackBtn = pathname !== '/';

  return (
    <header className={styles.header}>
      {isLoading && (
        <div className={styles.topLoader} aria-hidden="true">
          <div className={styles.topLoaderBar} />
        </div>
      )}
      <button 
        className={styles.breadcrumb} 
        onClick={handleBack} 
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

        <button className={styles.bellButton} aria-label="View notifications">
          <Bell size={20} />
          <span className={styles.badge} aria-hidden="true" />
        </button>

        <div className={styles.profileCard} role="button" tabIndex={0} aria-label="Open user menu">
          <div className={styles.avatar} aria-hidden="true">JD</div>
          <span className={styles.username}>John Doe</span>
          <ChevronDown size={14} className={styles.chevron} aria-hidden="true" />
        </div>
      </div>
    </header>
  );
}
