// app/dsa-sheets/page.tsx
'use client';

import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useProgress } from '../../contexts/ProgressContext';

export default function DSASheets() {
  const { darkMode } = useTheme();
  const { progress, updateTopic } = useProgress();

  const sheets = [
    { name: "Striver's A2Z DSA Sheet", progress: 6, total: 455 },
    { name: "Striver's SDE Sheet", progress: 0, total: 300 },
    { name: "Striver's 75 Sheet", progress: 0, total: 75 },
  ];

  const handleTopicToggle = (topicId: string, isCompleted: boolean) => {
    updateTopic(topicId, isCompleted);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-100 to-gray-200 dark:from-[#151821] dark:via-[#1D1E26] dark:to-[#1F2937]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative bg-white/50 dark:bg-[#1D1E26]/50 rounded-lg p-6 shadow-lg backdrop-blur-sm">
          <div className="bg-white/70 dark:bg-gray-800/30 rounded-lg p-4 shadow-sm backdrop-blur-sm">
            <h1 className="text-2xl font-bold mb-4">DSA Sheets</h1>
            <div className="grid gap-4">
              {sheets.map((sheet) => (
                <div key={sheet.name} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={sheet.name}
                    checked={progress.topics[sheet.name] || false}
                    onChange={(e) => handleTopicToggle(sheet.name, e.target.checked)}
                  />
                  <label htmlFor={sheet.name}>{sheet.name}</label>
                </div>
              ))}
            </div>
            {sheets.map((sheet) => (
              <div key={sheet.name} className="mb-4 bg-white/60 dark:bg-gray-800/20 backdrop-blur-sm p-4 rounded-lg shadow-sm hover:scale-[1.01] transition-all">
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
      </div>
    </div>
  );
}