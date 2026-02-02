import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import { ToastProvider } from '@/components/ui/toast';
import { NavigationProgress } from '@/components/ui/navigation-progress';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'RepCoach - Sales Training & Audit Platform',
  description: 'Practice scripts with AI personas, auto-score calls against the CLOSER framework, and track team performance.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
