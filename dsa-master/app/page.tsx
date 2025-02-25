'use client';

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import Dashboard from '../components/Dashboard';
import Statistics from '../components/Statistics';

export default function Home() {
  const { darkMode } = useTheme();

  // Get problems from localStorage
  const problems = JSON.parse(localStorage.getItem('problems') || '[]').map((problem: any) => ({
    ...problem,
    timestamp: problem.timestamp || new Date().toISOString()
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-100 to-gray-200 dark:from-[#151821] dark:via-[#1D1E26] dark:to-[#1F2937]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="relative">
          {/* Background decoration */}
          <div className="absolute inset-0 grid grid-cols-2 -space-x-52 opacity-40 dark:opacity-20">
            <div className="blur-[106px] h-56 bg-gradient-to-br from-orange-500 to-purple-400"></div>
            <div className="blur-[106px] h-32 bg-gradient-to-r from-cyan-400 to-sky-300"></div>
          </div>

          {/* Content */}
          <div className="relative">
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Welcome to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-400">
                DSA Master
              </span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mb-8">
              Master Data Structures and Algorithms with our interactive platform. Practice coding, analyze your resume, and track your progress all in one place.
            </p>
            
            <div className="flex flex-col gap-6">
              <Statistics problems={problems} />
              <Dashboard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}