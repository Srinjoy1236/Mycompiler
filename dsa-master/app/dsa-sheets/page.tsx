// app/dsa-sheets/page.tsx
'use client';

import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export default function DSASheets() {
  const { darkMode } = useTheme();

  const sheets = [
    { name: "Striver's A2Z DSA Sheet", progress: 6, total: 455 },
    { name: "Striver's SDE Sheet", progress: 0, total: 300 },
    { name: "Striver's 75 Sheet", progress: 0, total: 75 },
  ];

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">DSA Sheets</h1>
        {sheets.map((sheet) => (
          <div key={sheet.name} className="mb-4 p-4 bg-gray-200 dark:bg-gray-700 rounded-lg">
            <h3 className="font-bold">{sheet.name}</h3>
            <p>Progress: {sheet.progress}/{sheet.total} ({((sheet.progress / sheet.total) * 100).toFixed(1)}%)</p>
            <div className="w-full bg-gray-300 dark:bg-gray-600 h-2 rounded mt-2">
              <div className="bg-orange-500 h-2 rounded" style={{ width: `${(sheet.progress / sheet.total) * 100}%` }}></div>
            </div>
            <button className="mt-2 bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
              Show Revision
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}