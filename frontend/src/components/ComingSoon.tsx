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
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02), 0 1px 2px rgba(0,0,0,0.04)',
        marginBottom: '20px',
      }}>
        <Blocks size={24} color="#64748b" />
      </div>
      <h2 style={{
        fontSize: '22px',
        fontWeight: '600',
        letterSpacing: '-0.01em',
        color: '#0f172a',
        marginBottom: '8px',
        fontFamily: 'var(--font-sans)'
      }}>
        {title}
      </h2>
      <p style={{
        fontSize: '14px',
        color: '#64748b',
        maxWidth: '400px',
        lineHeight: '1.5',
        fontFamily: 'var(--font-sans)'
      }}>
        {description}
      </p>
      <div style={{
        marginTop: '24px',
        padding: '6px 16px',
        background: '#f1f5f9',
        border: '1px solid #e2e8f0',
        borderRadius: '99px',
        fontSize: '11px',
        fontWeight: '600',
        color: '#475569',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        fontFamily: 'var(--font-sans)'
      }}>
        Coming Soon
      </div>
    </div>
  );
}
