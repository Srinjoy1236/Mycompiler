import { ReactNode } from 'react';
import '../styles/globals.css';
import { ThemeProvider } from '../contexts/ThemeContext';
import Navbar from '../components/Navbar';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
        <ThemeProvider>
          <div className="min-h-screen">
            <Navbar />
            <main>{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}