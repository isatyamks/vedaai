'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Plus, Search, ChevronDown, Check, RotateCw, X } from 'lucide-react';
import { useAssignmentStore } from '../store/assignmentStore';
import styles from './TopBar.module.css';

const PAGE_TITLES: Record<string, string> = {
  '/home': 'Home',
  '/groups': 'My Classes',
  '/analytics': 'Analytics',
  '/library': 'My Library',
  '/settings': 'Settings',
};

const SORT_OPTIONS: { value: 'newest' | 'oldest' | 'name'; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'name',   label: 'Name (A–Z)' },
];

function SortDropdown() {
  const { sortBy, setSortBy } = useAssignmentStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const currentLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? 'Newest First';

  return (
    <div className={styles.dropdownWrap} ref={ref}>
      <button
        className={`${styles.filterBtn} ${open ? styles.filterBtnActive : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Sort assignments"
      >
        <span className={styles.filterBtnLabel}>
          Sort: <strong>{currentLabel}</strong>
        </span>
        <ChevronDown size={13} className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`} />
      </button>

      {open && (
        <div className={styles.dropdown} role="listbox" aria-label="Sort options">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`${styles.dropdownItem} ${sortBy === opt.value ? styles.dropdownItemActive : ''}`}
              role="option"
              aria-selected={sortBy === opt.value}
              onClick={() => { setSortBy(opt.value); setOpen(false); }}
            >
              <span>{opt.label}</span>
              {sortBy === opt.value && <Check size={13} className={styles.checkIcon} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SearchInput() {
  const { searchQuery, setSearchQuery } = useAssignmentStore();
  const [local, setLocal] = useState(searchQuery);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce store write by 200ms — feels instant but avoids re-sorting every keystroke
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocal(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSearchQuery(val), 200);
  }, [setSearchQuery]);

  const handleClear = () => {
    setLocal('');
    setSearchQuery('');
    inputRef.current?.focus();
  };

  // Sync if store is cleared externally
  useEffect(() => {
    if (searchQuery === '') setLocal('');
  }, [searchQuery]);

  return (
    <div className={styles.searchWrap}>
      <Search size={14} className={styles.searchIcon} aria-hidden="true" />
      <input
        ref={inputRef}
        type="text"
        className={styles.searchInput}
        placeholder="Search Assignment"
        value={local}
        onChange={handleChange}
        aria-label="Search assignments"
        autoComplete="off"
        spellCheck={false}
      />
      {local && (
        <button className={styles.searchClear} onClick={handleClear} aria-label="Clear search">
          <X size={11} strokeWidth={3} />
        </button>
      )}
    </div>
  );
}

function AssignmentsBar() {
  const router = useRouter();
  const { assignments } = useAssignmentStore();

  return (
    <>
      <div className={styles.left}>
        <SortDropdown />
        <SearchInput />
      </div>
      <div className={styles.right}>
        {assignments.length > 0 && (
          <span className={styles.countLabel}>{assignments.length} paper{assignments.length !== 1 ? 's' : ''}</span>
        )}
        <button
          id="topbar-create-btn"
          className={styles.createBtn}
          onClick={() => router.push('/create')}
        >
          <Plus size={15} strokeWidth={2.5} aria-hidden="true" />
          <span>Create Assignment</span>
        </button>
      </div>
    </>
  );
}

function CreateBar() {
  return (
    <div className={styles.left}>
      <span className={styles.pageTitle}>New Assignment</span>
    </div>
  );
}

function AssignmentDetailBar() {
  const { activeAssignment, regenerateAssignment, isLoading } = useAssignmentStore();
  if (!activeAssignment) return null;

  return (
    <>
      <div className={styles.left}>
        <span className={styles.pageTitle} title={activeAssignment.title}>
          {activeAssignment.subject} · Class {activeAssignment.grade}
        </span>
        {activeAssignment.status === 'completed' && (
          <span className={styles.readyBadge}>Ready</span>
        )}
        {activeAssignment.status === 'failed' && (
          <span className={styles.failedBadge}>Failed</span>
        )}
        {(activeAssignment.status === 'queued' || activeAssignment.status === 'processing') && (
          <span className={styles.processingBadge}>Generating…</span>
        )}
      </div>
      <div className={styles.right}>
        {activeAssignment.status === 'completed' && (
          <button
            className={styles.iconBtn}
            onClick={() => regenerateAssignment(activeAssignment._id)}
            disabled={isLoading}
            aria-label="Regenerate"
          >
            <RotateCw size={14} />
            <span>Regenerate</span>
          </button>
        )}
      </div>
    </>
  );
}

function GenericBar({ title }: { title: string }) {
  return (
    <div className={styles.left}>
      <span className={styles.pageTitle}>{title}</span>
    </div>
  );
}

export default function TopBar() {
  const pathname = usePathname();

  const isAssignments = pathname === '/assignments';
  const isCreate = pathname === '/create';
  const isDetail = pathname.startsWith('/assignment/');
  const genericTitle = PAGE_TITLES[pathname];

  return (
    <div className={styles.topbar} role="banner">
      {isAssignments && <AssignmentsBar />}
      {isCreate && <CreateBar />}
      {isDetail && <AssignmentDetailBar />}
      {!isAssignments && !isCreate && !isDetail && genericTitle && (
        <GenericBar title={genericTitle} />
      )}
    </div>
  );
}
