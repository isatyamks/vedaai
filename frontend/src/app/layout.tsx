import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import ProgressModal from '../components/ProgressModal';
import ToastContainer from '../components/ToastContainer';

export const metadata: Metadata = {
  title: 'Veda AI — School Test & Exam Maker',
  description: 'Create structured assignments and school exam sheets for modern classrooms.',
  keywords: ['assessment platform', 'question paper generator', 'Veda AI', 'exam creator', 'educational software'],
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <Sidebar />
        <TopBar />
        <ProgressModal />
        <ToastContainer />
        <main className="shell">
          {children}
        </main>
      </body>
    </html>
  );
}
