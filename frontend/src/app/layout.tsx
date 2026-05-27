import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ProgressModal from '../components/ProgressModal';
import ToastContainer from '../components/ToastContainer';

export const metadata: Metadata = {
  title: 'Veda AI — School Test & Exam Maker',
  description:
    'Create structured test papers and school exam sheets for modern classrooms.',
  keywords: ['assessment platform', 'question paper generator', 'Veda AI', 'exam creator', 'educational software'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Sidebar />
        <ProgressModal />
        <ToastContainer />
        <div className="shell">
          <Header />
          <main className="shell__content">{children}</main>
        </div>
      </body>
    </html>
  );
}
