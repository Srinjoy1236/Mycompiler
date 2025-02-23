'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from '../../contexts/ThemeContext';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { autocompletion } from '@codemirror/autocomplete';
import { Extension } from '@codemirror/state';

// Dynamically import CodeMirror
const CodeMirror = dynamic(
  () => import('@uiw/react-codemirror'),
  { 
    ssr: false,
    loading: () => <div className="h-[400px] bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
  }
);

export default function CodeEditor() {
  const { darkMode } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState<string>('cpp');
  const [output, setOutput] = useState<string>('');
  const [extensions, setExtensions] = useState<Extension[]>([]);

  // Handle mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle extensions
  useEffect(() => {
    if (mounted) {
      const loadedExtensions = [
        autocompletion(),
        language === 'python' ? python() :
        language === 'cpp' ? cpp() :
        language === 'java' ? java() :
        javascript()
      ];
      setExtensions(loadedExtensions);
    }
  }, [language, mounted]);

  if (!mounted) return null;

  const runCode = async () => {
    try {
      setOutput('Executing code...');
      
      const response = await fetch('http://localhost:5000/api/run-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setOutput(data.output || 'No output');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to the server';
      console.error('Error running code:', error);
      setOutput(`Error: ${errorMessage}`);
    }
  };

  const submitCode = async () => {
    try {
      setOutput('Submitting code...');
      
      const response = await fetch('http://localhost:5000/api/submit-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language,
          timestamp: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setOutput(data.result || 'Code submitted successfully!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit code';
      console.error('Error submitting code:', error);
      setOutput(`Error: ${errorMessage}`);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Code Editor</h1>
          <div className="flex items-center space-x-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded"
            >
              <option value="cpp">C++</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="javascript">JavaScript</option>
            </select>
            <button
              onClick={runCode}
              className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
            >
              Run
            </button>
            <button
              onClick={submitCode}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Submit
            </button>
          </div>
        </div>

        <CodeMirror
          value={code}
          height="calc(100vh - 300px)"
          extensions={extensions}
          theme={darkMode ? 'dark' : 'light'}
          onChange={(value: string) => setCode(value)}
          className="mb-4 rounded-lg overflow-hidden"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        />

        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="font-bold mb-2 text-gray-900 dark:text-white">Output:</h3>
          <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200">{output}</pre>
        </div>
      </div>
    </div>
  );
}