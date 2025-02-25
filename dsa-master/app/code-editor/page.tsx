'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from '../../contexts/ThemeContext';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { autocompletion } from '@codemirror/autocomplete';
import { Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

// Dynamically import CodeMirror
const CodeMirror = dynamic(
  () => import('@uiw/react-codemirror'),
  { 
    ssr: false,
    loading: () => <div className="h-[400px] bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
  }
);

// Update the modernGlassTheme with a lighter background and better color combinations
const modernGlassTheme = EditorView.theme({
  '&': {
    backgroundColor: 'rgba(17, 19, 23, 0.7) !important',
    backdropFilter: 'blur(10px)',
    color: '#E2E8F0 !important'
  },
  '.cm-editor': {
    backgroundColor: 'transparent !important'
  },
  '.cm-content': {
    caretColor: '#FFFFFF',
    fontFamily: 'JetBrains Mono, monospace',
    backgroundColor: 'transparent !important'
  },
  '.cm-cursor': {
    borderLeftColor: '#FFFFFF !important',
    borderLeftWidth: '2px !important',
    borderLeftStyle: 'solid !important',
    animation: 'blink 1s step-end infinite !important'
  },
  '@keyframes blink': {
    'from, to': { borderLeftColor: '#FFFFFF !important' },
    '50%': { borderLeftColor: 'transparent !important' }
  },
  '.cm-gutters': {
    backgroundColor: 'rgba(15, 17, 21, 0.7) !important',
    color: '#64748B',
    border: 'none',
    borderRight: '1px solid rgba(255, 255, 255, 0.1)'
  },
  // VS Code-like color scheme from the image
  '.cm-keyword': { color: '#FF69B4 !important' },     // Pink for keywords (import, class, extends)
  '.cm-def': { color: '#61AFEF !important' },         // Light blue for definitions
  '.cm-variable': { color: '#E06C75 !important' },    // Soft red for variables
  '.cm-property': { color: '#E5C07B !important' },    // Yellow for properties
  '.cm-type': { color: '#C678DD !important' },        // Purple for types (Component)
  '.cm-string': { color: '#98C379 !important' },      // Green for strings
  '.cm-punctuation': { color: '#ABB2BF !important' }, // Light gray for punctuation
  '.cm-operator': { color: '#C678DD !important' },    // Purple for operators
  '.cm-meta': { color: '#E06C75 !important' },        // Soft red for meta
  '.cm-tag': { color: '#E06C75 !important' },         // Soft red for HTML tags
  '.cm-bracket': { color: '#ABB2BF !important' },     // Light gray for brackets
  '.cm-attribute': { color: '#98C379 !important' },   // Green for attributes
  '.cm-comment': { color: '#5C6370 !important' },     // Gray for comments
  '.cm-className': { color: '#E5C07B !important' },   // Yellow for class names

  // Additional styling
  '.cm-line': {
    backgroundColor: 'transparent !important'
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(255, 255, 255, 0.05) !important'
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(255, 255, 255, 0.05) !important'
  }
});

// Add this type definition at the top with other imports
interface Problem {
  title: string;
  completed: boolean;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  code: string;
  timestamp: string;
  language: string;
}

export default function CodeEditor() {
  const { darkMode } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [code, setCode] = useState<string>('');
  const [language, setLanguage] = useState<string>('cpp');
  const [output, setOutput] = useState<string>('');
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [fontSize, setFontSize] = useState<number>(14);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [note, setNote] = useState('');
  const noteRef = useRef<HTMLDivElement>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [problemTitle, setProblemTitle] = useState('New File');
  const [isEditing, setIsEditing] = useState(false);
  const [input, setInput] = useState<string>('');
  const [showInput, setShowInput] = useState<boolean>(false);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Easy');
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [showSolution, setShowSolution] = useState<boolean>(false);
  const [solution, setSolution] = useState<string>('');
  const [submissionCount, setSubmissionCount] = useState<number>(0);

  // Table headers for the problem section
  const tableHeaders = ['STATUS', 'PROBLEM', 'ARTICLE', 'YOUTUBE', 'PRACTICE', 'NOTE', 'DIFFICULTY', 'REVISION'];

  // Group all useEffect hooks together
  useEffect(() => {
    setMounted(true);
    // Load initial problems
    const savedProblems = JSON.parse(localStorage.getItem('problems') || '[]');
    setProblems(savedProblems);
  }, []);

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

  useEffect(() => {
    // Load problem from URL params
    const searchParams = new URLSearchParams(window.location.search);
    const problemTitle = searchParams.get('problem');
    
    if (problemTitle) {
      const existingProblems = JSON.parse(localStorage.getItem('problems') || '[]');
      const problem = existingProblems.find(
        (p: any) => p.title.toLowerCase() === decodeURIComponent(problemTitle).toLowerCase()
      );
      
      if (problem) {
        setProblemTitle(problem.title);
        setCode(problem.code || '');
        setIsCompleted(problem.completed);
        setDifficulty(problem.difficulty);
      }
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (noteRef.current && !noteRef.current.contains(event.target as Node)) {
        setIsNoteOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const savedNote = localStorage.getItem('code-note');
    if (savedNote) {
      setNote(savedNote);
    }
  }, []);

  useEffect(() => {
    const savedCompletion = localStorage.getItem('problem-completion');
    if (savedCompletion) {
      setIsCompleted(savedCompletion === 'true');
    }
  }, []);

  // Update the handleCodeChange function to save code immediately
  const handleCodeChange = (value: string) => {
    setCode(value);
    
    // Save the updated code to localStorage
    const existingProblems = JSON.parse(localStorage.getItem('problems') || '[]');
    const existingIndex = existingProblems.findIndex(
      (problem: any) => problem.title.toLowerCase() === problemTitle.toLowerCase()
    );

    if (existingIndex !== -1) {
      existingProblems[existingIndex] = {
        ...existingProblems[existingIndex],
        code: value
      };
      localStorage.setItem('problems', JSON.stringify(existingProblems));
    }
  };

  // Save note to localStorage
  const saveNote = () => {
    localStorage.setItem('code-note', note);
    setIsNoteOpen(false);
  };

  // Function to handle completion toggle
  const toggleCompletion = () => {
    setIsCompleted(!isCompleted);
    // You can add logic here to save the completion status
    localStorage.setItem('problem-completion', (!isCompleted).toString());
  };

  // Update the saveProblemToLocalStorage function
  const saveProblemToLocalStorage = (title: string, completed: boolean) => {
    const existingProblems = JSON.parse(localStorage.getItem('problems') || '[]');
    
    const existingIndex = existingProblems.findIndex(
      (problem: any) => problem.title.toLowerCase() === title.toLowerCase()
    );

    if (existingIndex !== -1) {
      existingProblems[existingIndex] = {
        ...existingProblems[existingIndex],
        completed,
        difficulty,
        code // Save the current code
      };
    } else {
      existingProblems.push({ 
        title, 
        completed,
        difficulty,
        code // Save the current code
      });
    }

    localStorage.setItem('problems', JSON.stringify(existingProblems));
    setProblems(existingProblems);
    setIsEditing(false);
    return true; // Return true to indicate success
  };
  
  if (!mounted) return null;

  const runCode = async () => {
    try {
      setOutput('Executing code...');
      
      let processedCode = code;
      if (!code.includes('#include')) {
        processedCode = `#include <iostream>\n#include <bits/stdc++.h>\nusing namespace std;\n\n${code}`;
      }
      if (!code.includes('main')) {
        processedCode = `${processedCode}\n\nint main() {\n    ${code}\n    return 0;\n}`;
      }
      
      const response = await fetch('http://localhost:5000/api/run-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: processedCode,
          language,
          input: input + '\n',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        setOutput(`Error: ${data.error}`);
      } else {
        setOutput(data.output);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to execute code';
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
      setSubmissionCount(prev => prev + 1); // Increment submission count
      setOutput(data.result || 'Code submitted successfully!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit code';
      console.error('Error submitting code:', error);
      setOutput(`Error: ${errorMessage}`);
    }
  };

  // Update the handleCreateNewFile function
  const handleCreateNewFile = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newFileName.trim()) {
      const newProblem: Problem = {
        title: newFileName,
        completed: false,
        difficulty: difficulty,
        code: '',
        timestamp: new Date().toISOString(),
        language: language
      };

      // Save to localStorage
      const existingProblems = JSON.parse(localStorage.getItem('problems') || '[]');
      const existingIndex = existingProblems.findIndex(
        (problem: Problem) => problem.title.toLowerCase() === newFileName.toLowerCase()
      );

      if (existingIndex === -1) {
        existingProblems.push(newProblem);
        localStorage.setItem('problems', JSON.stringify(existingProblems));
        setProblems(existingProblems);
      }

      // Update current state
      setProblemTitle(newFileName);
      setCode('');
      setIsCompleted(false);
      setDifficulty(difficulty);
      setOutput('');
      setIsNewFileModalOpen(false);
      setNewFileName('');
      
      // Update URL with the new problem name
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set('problem', encodeURIComponent(newFileName));
      window.history.pushState({}, '', `${window.location.pathname}?${searchParams.toString()}`);
    }
  };

  // Add this function to get difficulty color
  const getDifficultyColor = (difficulty: 'Easy' | 'Medium' | 'Hard') => {
    switch (difficulty) {
      case 'Easy':
        return 'text-emerald-400';
      case 'Medium':
        return 'text-yellow-400';
      case 'Hard':
        return 'text-rose-400';
      default:
        return 'text-white/90';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800">
      {/* New File Modal */}
      {isNewFileModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={() => setIsNewFileModalOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div 
            className="relative bg-white/10 backdrop-blur-xl p-6 rounded-lg shadow-lg border border-white/20 w-96 transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4 text-white/90 font-['JetBrains_Mono']">Create New File</h3>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={handleCreateNewFile}
              placeholder="Enter file name..."
              className="w-full bg-black/20 text-white/90 px-4 py-2 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 font-['JetBrains_Mono'] mb-4"
              autoFocus
            />
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as 'Easy' | 'Medium' | 'Hard')}
              className="w-full bg-black/20 text-white px-4 py-2 rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 font-['JetBrains_Mono'] mb-4 [&>option]:bg-[#1a1b26] [&>option]:text-white"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
            <div className="text-sm text-white/60 mt-2 font-['JetBrains_Mono']">Press Enter to create</div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Code Editor Section */}
          <div className="bg-[#1a1b26]/80 backdrop-blur-xl rounded-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/20 hover:shadow-[0_8px_32px_rgba(31,41,55,0.4)] transition-all">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold font-['JetBrains_Mono'] text-white">Code Here</h2>
                <select
                  value={difficulty}
                  onChange={(e) => {
                    setDifficulty(e.target.value as 'Easy' | 'Medium' | 'Hard');
                    const existingProblems = JSON.parse(localStorage.getItem('problems') || '[]');
                    const existingIndex = existingProblems.findIndex(
                      (problem: any) => problem.title.toLowerCase() === problemTitle.toLowerCase()
                    );
                    if (existingIndex !== -1) {
                      existingProblems[existingIndex].difficulty = e.target.value;
                      localStorage.setItem('problems', JSON.stringify(existingProblems));
                    }
                  }}
                  className="bg-white/15 text-white px-4 py-2 rounded-lg backdrop-blur-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 hover:bg-white/20 transition-all [&>option]:bg-[#1a1b26] [&>option]:text-white"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsNewFileModalOpen(true)}
                  className="bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-lg backdrop-blur-xl transition-all border border-white/20 flex items-center gap-2 hover:shadow-lg"
                >
                  <span>New File</span>
                  <span className="text-sm opacity-60">⌘N</span>
                </button>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-white/15 text-white px-4 py-2 rounded-lg backdrop-blur-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 hover:bg-white/20 transition-all [&>option]:bg-[#1a1b26] [&>option]:text-white"
                >
                  <option value="cpp">C++</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="javascript">JavaScript</option>
                </select>
              </div>
            </div>
            <CodeMirror
              value={code}
              height="600px"
              extensions={[...extensions, modernGlassTheme]}
              theme="dark"
              onChange={handleCodeChange}
              className="overflow-hidden rounded-lg font-['JetBrains_Mono'] bg-gradient-to-b from-black/20 to-black/10"
              style={{ fontSize: `${fontSize}px` }}
              basicSetup={{
                lineNumbers: true,
                highlightActiveLineGutter: true,
                highlightActiveLine: true,
                foldGutter: true,
              }}
            />
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={runCode}
                className="bg-white/15 hover:bg-white/25 text-white px-6 py-2 rounded-lg backdrop-blur-xl transition-all border border-white/20 flex items-center gap-2 hover:shadow-lg"
              >
                <span>Run</span>
                <span className="text-sm opacity-60">⌘R</span>
              </button>
              <button
                onClick={submitCode}
                className="bg-white/15 hover:bg-white/25 text-white px-6 py-2 rounded-lg backdrop-blur-xl transition-all border border-white/20 flex items-center gap-2 hover:shadow-lg"
              >
                <span>Submit</span>
                <span className="text-sm opacity-60">⌘S</span>
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-[#1a1b26]/80 backdrop-blur-xl rounded-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/20 hover:shadow-[0_8px_32px_rgba(31,41,55,0.4)] transition-all">
            <div className="mb-4">
              <button
                onClick={() => setShowInput(!showInput)}
                className="bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-lg backdrop-blur-xl transition-all border border-white/20 flex items-center gap-2 hover:shadow-lg text-sm mb-2"
              >
                <span>{showInput ? 'Hide Input' : 'Show Input'}</span>
                <span className="text-xs opacity-60">⌘I</span>
              </button>
              
              {showInput && (
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter your input here..."
                  className="w-full h-20 bg-black/30 text-white p-4 rounded-lg resize-none font-['JetBrains_Mono'] focus:outline-none focus:ring-2 focus:ring-white/30 border border-white/20"
                  style={{ fontSize: `${fontSize}px` }}
                />
              )}
            </div>

            <h2 className="text-lg font-bold mb-4 font-['JetBrains_Mono'] text-white">Output</h2>
            <pre 
              className="bg-black/30 p-4 rounded-lg h-[300px] overflow-auto font-['JetBrains_Mono'] text-white border border-white/20"
              style={{ fontSize: `${fontSize}px` }}
            >
              {output || 'Run your code to see output here...'}
            </pre>

            {/* Solution Section */}
            <div className="mt-4">
              <button
                onClick={() => submissionCount >= 5 && setShowSolution(!showSolution)}
                className={`bg-white/15 ${submissionCount >= 5 ? 'hover:bg-white/25' : 'opacity-50 cursor-not-allowed'} text-white px-4 py-2 rounded-lg backdrop-blur-xl transition-all border border-white/20 flex items-center gap-2 hover:shadow-lg text-sm mb-2`}
              >
                <span>
                  {submissionCount >= 5 
                    ? (showSolution ? 'Hide Solution' : 'Show Solution')
                    : `Submit ${5 - submissionCount} more times to unlock solution`}
                </span>
                <span className="text-xs opacity-60">⌘L</span>
              </button>
              
              {showSolution && submissionCount >= 5 && (
                <textarea
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  placeholder="Write your solution explanation here..."
                  className="w-full h-48 bg-black/30 text-white p-4 rounded-lg resize-none font-['JetBrains_Mono'] focus:outline-none focus:ring-2 focus:ring-white/30 border border-white/20"
                  style={{ fontSize: `${fontSize}px` }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}