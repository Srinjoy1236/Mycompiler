// app/profile/page.tsx
'use client';

import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

export default function Profile() {
  const { darkMode } = useTheme();

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
        <div className="p-4 bg-gray-200 dark:bg-gray-700 rounded-lg">
          <p>Name: John Doe</p>
          <p>Email: john@example.com</p>
          <p>Progress: 30/455 topics completed</p>
        </div>
      </div>
    </div>
  );
} 