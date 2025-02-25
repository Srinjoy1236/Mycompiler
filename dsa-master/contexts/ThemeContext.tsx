// contexts/ThemeContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextType {
  darkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  darkMode: true,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') !== 'light';
    setDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);
    if (isDark) {
      document.documentElement.style.setProperty('--glass-bg', 'rgba(15, 23, 42, 0.7)');
      document.documentElement.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.1)');
    } else {
      document.documentElement.style.setProperty('--glass-bg', 'rgba(255, 255, 255, 0.7)');
      document.documentElement.style.setProperty('--glass-border', 'rgba(0, 0, 0, 0.1)');
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newDarkMode);
    document.documentElement.style.setProperty('--glass-bg', newDarkMode ? 'rgba(15, 23, 42, 0.7)' : 'rgba(255, 255, 255, 0.7)');
    document.documentElement.style.setProperty('--glass-border', newDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)');
  };

  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);