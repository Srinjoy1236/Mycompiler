'use client';

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import Navbar from '../components/Navbar';
import Link from 'next/link';

export default function Home() {
  const { darkMode } = useTheme();

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <Navbar />
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Welcome to DSA Master</h1>
        <p>Your Progress: 6% complete (30/455 topics)</p>
        <div className="mt-4">
          <h2 className="text-xl font-semibold">Featured Sheets</h2>
          <Link href="/dsa-sheets" className="block mt-2 p-4 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
            <h3 className="font-bold">Striver’s A2Z DSA Sheet</h3>
            <p className="text-sm">Learn DSA from A to Z for free in a well-organized manner.</p>
            <div className="mt-2">
              <div className="w-full bg-gray-300 dark:bg-gray-600 h-2 rounded">
                <div className="bg-orange-500 h-2 rounded" style={{ width: '6%' }}></div>
              </div>
              <button className="mt-2 bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
                Show Revision
              </button>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}