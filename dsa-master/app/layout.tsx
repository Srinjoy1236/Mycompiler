import { ReactNode } from 'react';
import '../styles/globals.css';
import { ThemeProvider } from '../contexts/ThemeContext';
import { ProgressProvider } from '../contexts/ProgressContext';
import Navbar from '../components/Navbar';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning={true} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
        <ThemeProvider>
          <ProgressProvider>
            <Navbar />
            <main>{children}</main>
          </ProgressProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}