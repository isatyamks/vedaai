import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ProgressModal from '../components/ProgressModal';

export const metadata: Metadata = {
  title: 'VedaAI Assessment Creator - Premium AI Classroom Suite',
  description: 'Design dynamic, highly structured, multi-section classroom tests and exam papers with Google Gemini AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {/* Core Sidebar component */}
        <Sidebar />

        {/* Global Progress Modal for background generation tracking */}
        <ProgressModal />

        {/* Outer app shell layout frame */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Sticky Header component */}
          <Header />

          {/* Children layouts offset is handled inside pages */}
          {children}
        </div>
      </body>
    </html>
  );
}
