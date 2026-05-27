import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ProgressModal from '../components/ProgressModal';

export const metadata: Metadata = {
  title: 'VedaAI — AI-Powered Assessment Creator',
  description:
    'Design dynamic, multi-section exam papers with Google Gemini AI. Built for educators who demand precision.',
  keywords: ['AI assessment', 'question paper generator', 'VedaAI', 'exam creator', 'Gemini AI'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Sidebar />
        <ProgressModal />
        <div className="shell">
          <Header />
          <main className="shell__content">{children}</main>
        </div>
      </body>
    </html>
  );
}
