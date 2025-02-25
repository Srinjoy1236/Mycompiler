'use client';

import React, { useEffect } from 'react';
import { useProgress } from '../contexts/ProgressContext';

export default function StriverSheet() {
  const { progress, updateTopic } = useProgress();

  useEffect(() => {
    // Function to handle messages from Striver's website
    const handleMessage = (event: MessageEvent) => {
      if (event.origin === 'https://takeuforward.org') {
        const { topicId, isCompleted } = event.data;
        if (topicId && typeof isCompleted === 'boolean') {
          updateTopic(topicId, isCompleted);
        }
      }
    };

    // Add message listener
    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [updateTopic]);

  return null;
} 