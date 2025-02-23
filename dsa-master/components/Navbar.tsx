// components/Navbar.tsx
'use client';

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import Link from 'next/link';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/solid';

const Navbar = () => {
  const { darkMode, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto flex justify-between items-center p-4">
        <Link href="/" className="text-gray-900 dark:text-white text-xl font-bold">
          DSA Master
        </Link>
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="text-gray-900 dark:text-white">
            {isOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>
        <div className={`md:flex ${isOpen ? 'block' : 'hidden'} md:space-x-4`}>
          <Link href="/" className="text-gray-900 dark:text-white hover:text-orange-500 px-2 py-1">
            Dashboard
          </Link>
          <Link href="/dsa-sheets" className="text-gray-900 dark:text-white hover:text-orange-500 px-2 py-1">
            DSA Sheets
          </Link>
          <Link href="/code-editor" className="text-gray-900 dark:text-white hover:text-orange-500 px-2 py-1">
            Code Editor
          </Link>
          <Link href="/profile" className="text-gray-900 dark:text-white hover:text-orange-500 px-2 py-1">
            Profile
          </Link>
          <button
            onClick={toggleTheme}
            className="text-gray-900 dark:text-white hover:text-orange-500 px-2 py-1"
          >
            {darkMode ? '🌞' : '🌙'}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;