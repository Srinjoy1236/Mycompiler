'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface TopicProgress {
  [key: string]: boolean; // Store completion status for each topic
}

interface ProgressContextType {
  progress: {
    completed: number;
    total: number;
    topics: TopicProgress;
  };
  updateTopic: (topicId: string, isCompleted: boolean) => void;
}

const ProgressContext = createContext<ProgressContextType>({
  progress: {
    completed: 30,
    total: 455,
    topics: {}
  },
  updateTopic: () => {}
});

export const ProgressProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [progress, setProgress] = useState({
    completed: 30,
    total: 455,
    topics: {}
  });

  // Load progress from localStorage on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem('dsaProgress');
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    }
  }, []);

  const updateTopic = (topicId: string, isCompleted: boolean) => {
    setProgress(prev => {
      const newTopics = { ...prev.topics, [topicId]: isCompleted };
      const completedCount = Object.values(newTopics).filter(Boolean).length;
      
      const newProgress = {
        ...prev,
        completed: completedCount,
        topics: newTopics
      };

      // Save to localStorage
      localStorage.setItem('dsaProgress', JSON.stringify(newProgress));
      return newProgress;
    });
  };

  return (
    <ProgressContext.Provider value={{ progress, updateTopic }}>
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = () => useContext(ProgressContext); 