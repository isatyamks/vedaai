'use client';

import React from 'react';
import { Blocks } from 'lucide-react';

export default function ComingSoon({ title, description }: { title: string, description: string }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      width: '100%',
      minHeight: '70vh',
      padding: '40px',
      textAlign: 'center',
      animation: 'fade 0.5s ease-out'
    }}>
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '56px',
        height: '56px',
        borderRadius: '16px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '20px',
      }}>
        <Blocks size={24} className="text-muted" style={{ color: 'var(--muted)' }} />
      </div>
      <h2 style={{
        fontSize: '22px',
        fontWeight: '600',
        letterSpacing: '-0.01em',
        color: 'var(--primary)',
        marginBottom: '8px',
        fontFamily: 'var(--font-sans)'
      }}>
        {title}
      </h2>
      <p style={{
        fontSize: '14px',
        color: 'var(--muted)',
        maxWidth: '400px',
        lineHeight: '1.5',
        fontFamily: 'var(--font-sans)'
      }}>
        {description}
      </p>
      <div style={{
        marginTop: '24px',
        padding: '6px 16px',
        background: 'var(--bg-hover)',
        border: '1px solid var(--border)',
        borderRadius: '99px',
        fontSize: '11px',
        fontWeight: '600',
        color: 'var(--secondary)',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        fontFamily: 'var(--font-sans)'
      }}>
        Coming Soon
      </div>
    </div>
  );
}
