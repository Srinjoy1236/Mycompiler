// components/Navbar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '../contexts/ThemeContext';

export default function Navbar() {
  const { darkMode, toggleTheme } = useTheme();
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/30 dark:bg-[#151821]/30 border-b border-white/20 dark:border-gray-800/50 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link 
              href="/" 
              className={`flex items-center font-bold text-xl ${
                pathname === '/' 
                  ? 'text-orange-500 dark:text-orange-400' 
                  : 'text-gray-800/90 dark:text-white/90'
              } hover:text-orange-500 dark:hover:text-orange-400 transition-colors`}
            >
              DSA Master
            </Link>
            
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/code-editor"
                className={`inline-flex items-center px-3 py-2 ${
                  pathname === '/code-editor' 
                    ? 'text-orange-500 dark:text-orange-400' 
                    : 'text-gray-700/90 dark:text-gray-300/90'
                } hover:text-orange-500 dark:hover:text-orange-400 hover:bg-white/20 dark:hover:bg-gray-800/30 rounded-md transition-all`}
              >
                Code Editor
              </Link>
              <Link
                href="/ats-score"
                className={`inline-flex items-center px-3 py-2 ${
                  pathname === '/ats-score' 
                    ? 'text-orange-500 dark:text-orange-400' 
                    : 'text-gray-700/90 dark:text-gray-300/90'
                } hover:text-orange-500 dark:hover:text-orange-400 hover:bg-white/20 dark:hover:bg-gray-800/30 rounded-md transition-all`}
              >
                ATS Score
              </Link>
              <Link
                href="/profile"
                className={`inline-flex items-center px-3 py-2 ${
                  pathname === '/profile' 
                    ? 'text-orange-500 dark:text-orange-400' 
                    : 'text-gray-700/90 dark:text-gray-300/90'
                } hover:text-orange-500 dark:hover:text-orange-400 hover:bg-white/20 dark:hover:bg-gray-800/30 rounded-md transition-all`}
              >
                Profile
              </Link>
            </div>
          </div>

          <div className="flex items-center">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-lg bg-white/20 dark:bg-gray-700/30 hover:bg-white/30 dark:hover:bg-gray-600/50 backdrop-blur-lg shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-all"
              aria-label="Toggle theme"
            >
              {darkMode ? '🌞' : '🌙'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}