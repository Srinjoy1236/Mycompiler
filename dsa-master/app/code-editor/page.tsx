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
import path from 'path';

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

interface JavaInstallationStatus {
  installed: boolean;
  version?: string;
  message: string;
  downloadInfo?: {
    message: string;
    platform: string;
    arch: string;
    downloadUrl: string;
  };
  error?: string;
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
  const [javaStatus, setJavaStatus] = useState<JavaInstallationStatus | null>(null);
  const [showJavaInstructions, setShowJavaInstructions] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [isCodeSaved, setIsCodeSaved] = useState(false);

  // Table headers for the problem section
  const tableHeaders = ['STATUS', 'PROBLEM', 'ARTICLE', 'YOUTUBE', 'PRACTICE', 'NOTE', 'DIFFICULTY', 'REVISION'];

  // Group all useEffect hooks together
  useEffect(() => {
    setMounted(true);
    // Load initial problems
    const savedProblems = JSON.parse(localStorage.getItem('problems') || '[]');
    setProblems(savedProblems);
    
    // Load problem from URL params
    const searchParams = new URLSearchParams(window.location.search);
    const problemParam = searchParams.get('problem');
    
    if (problemParam) {
      const decodedTitle = decodeURIComponent(problemParam);
      const problem = savedProblems.find(
        (p: any) => p.title.toLowerCase() === decodedTitle.toLowerCase()
      );
      
      if (problem) {
        setProblemTitle(problem.title);
        setCode(problem.code || '');
        setIsCompleted(problem.completed);
        setDifficulty(problem.difficulty);
        setLanguage(problem.language || 'cpp');
      }
    }
    
    // Set initial template for Java with Scanner
    const initialJavaTemplate = `import java.util.Scanner;

public class HelloWorld {
    public static void main(String[] args) {
        // Creates a reader instance which takes
        // input from standard input - keyboard
        Scanner reader = new Scanner(System.in);
        System.out.print("Enter a number: ");
        
        // nextInt() reads the next integer from the keyboard
        int number = reader.nextInt();
        
        // println() prints the following line to the output
        System.out.println("You entered: " + number);
        
        reader.close();
    }
}`;
    
    if (!problemParam) {
      setCode(initialJavaTemplate);
    }
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

  useEffect(() => {
    // Check Java installation when language is set to Java
    if (language === 'java') {
      checkJavaInstallation();
    }
  }, [language]);

  useEffect(() => {
    if (isCodeSaved) {
      const timer = setTimeout(() => {
        setIsCodeSaved(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isCodeSaved]);

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
      setIsCodeSaved(true); // Trigger the animation
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
    // For Java files, verify class name matches file name
    let updatedCode = code;
    if (language === 'java') {
      const classMatch = code.match(/public\s+class\s+(\w+)/);
      const className = classMatch ? classMatch[1] : null;
      
      // Check against the current file name being saved (title parameter)
      if (className && className !== title.trim()) {
        // Update the class name in the code to match the new file name
        updatedCode = code.replace(
          /public\s+class\s+\w+/,
          `public class ${title.trim()}`
        );
        setCode(updatedCode);
      }
    }

    const existingProblems = JSON.parse(localStorage.getItem('problems') || '[]');
    
    const existingIndex = existingProblems.findIndex(
      (problem: any) => problem.title.toLowerCase() === title.toLowerCase()
    );

    if (existingIndex !== -1) {
      existingProblems[existingIndex] = {
        ...existingProblems[existingIndex],
        completed,
        difficulty,
        code: updatedCode,
        language,
        timestamp: new Date().toISOString()
      };
    } else {
      existingProblems.push({ 
        title, 
        completed,
        difficulty,
        code: updatedCode,
        language,
        timestamp: new Date().toISOString()
      });
    }

    localStorage.setItem('problems', JSON.stringify(existingProblems));
    setProblems(existingProblems);
    setIsEditing(false);
    return true;
  };
  
  if (!mounted) return null;

  const checkJavaInstallation = async (): Promise<JavaInstallationStatus> => {
    try {
      const response = await fetch('http://localhost:5000/api/check-java', {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      setJavaStatus(data);
      setShowJavaInstructions(!data.installed);
      return data;
    } catch (error) {
      console.error('Error checking Java installation:', error);
      const errorStatus: JavaInstallationStatus = {
        installed: false,
        message: 'Error checking Java installation. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      setJavaStatus(errorStatus);
      return errorStatus;
    }
  };

  const runCode = async () => {
    try {
      // Validate that code is not empty
      if (!code || code.trim() === '') {
        setOutput('Error: Please enter some code before running.');
        return;
      }

      setOutput('Executing code...');
      
      let processedCode = code;
      let processedLanguage = language.toLowerCase();
      
      // Special handling for Java code
      if (processedLanguage === 'java') {
        // Clean up the code first
        processedCode = code.trim();
        
        // Extract the class name from the code
        const classMatch = processedCode.match(/(?:public\s+)?class\s+(\w+)/);
        const currentClassName = classMatch ? classMatch[1] : null;
        
        // If no class definition found, wrap the code in a class
        if (!classMatch) {
          const className = problemTitle !== 'New File' ? problemTitle.trim() : 'HelloWorld';
          processedCode = `
public class ${className} {
    public static void main(String[] args) {
${code.split('\n').map(line => '        ' + line.trimRight()).join('\n')}
    }
}`.trim();
        }

        // Validate Java code structure
        if (!processedCode.includes('public class') || !processedCode.includes('public static void main')) {
          setOutput('Error: Invalid Java code structure. Make sure you have a public class and main method.');
          return;
        }
      }
      
      // Format input for Java - ensure each number is on a new line
      const formattedInput = input.split(/[\s,]+/).join('\n');
      
      const response = await fetch('http://localhost:5000/api/run-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          code: processedCode,
          language: processedLanguage,
          input: formattedInput,
          problemTitle: problemTitle.trim()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute code. Please try again.');
      }

      const data = await response.json();
      
      // Enhanced Java output handling
      if (processedLanguage === 'java') {
        // Check for compilation errors first
        if (data.stderr) {
          setOutput(`Compilation Error:\n${data.stderr}`);
          return;
        }
        
        // Handle the output
        let outputText = '';
        let inputs = formattedInput.split('\n');
        let inputIndex = 0;
        
        // Process the output line by line
        const outputLines = (data.stdout || '').split('\n');
        for (const line of outputLines) {
          outputText += line.trim() + '\n';
        }
        
        // Clean up the output
        outputText = outputText
          .replace(/null|undefined/g, '')
          .trim();
        
        setOutput(outputText || 'Program executed successfully with no output.');
      } else {
        // Handle non-Java output
        let outputText = '';
        if (data.stdout) outputText += data.stdout;
        if (data.output && data.output !== data.stdout) outputText += data.output;
        if (data.result && data.result !== data.stdout && data.result !== data.output) outputText += data.result;
        
        setOutput(outputText.trim() || 'Program executed successfully with no output.');
      }

    } catch (error: any) {
      console.error('Error details:', error);
      setOutput(`Error: ${error.message}`);
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
        title: newFileName.trim(),
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
        
        // Update current state
        setProblemTitle(newFileName.trim());
        setCode('');
        setIsCompleted(false);
        setDifficulty(difficulty);
        setOutput('');
        
        // Update URL with the new problem name
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set('problem', encodeURIComponent(newFileName.trim()));
        window.history.pushState({}, '', `${window.location.pathname}?${searchParams.toString()}`);
      } else {
        setOutput('Error: A problem with this name already exists');
      }
      
      setIsNewFileModalOpen(false);
      setNewFileName('');
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

  const JavaInstallationModal = () => {
    if (!showJavaInstructions || !javaStatus) return null;

    const handleInstallJDK = async () => {
      try {
        setOutput('Initializing Java compiler...');
        
        const response = await fetch('http://localhost:5000/api/install-jdk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        
        if (data.success) {
          setOutput(
            'Online Java compiler is ready to use!\n\n' +
            'Features:\n' +
            data.features.capabilities.map((cap: string) => `- ${cap}`).join('\n')
          );
          setShowJavaInstructions(false);
          // Update Java status
          await checkJavaInstallation();
        } else {
          throw new Error(data.error || 'Failed to initialize Java compiler');
        }
      } catch (error: any) {
        console.error('Error in JDK installation:', error);
        setOutput(
          'Failed to initialize Java compiler:\n' +
          (error.message || 'Unknown error occurred') + '\n\n' +
          'Please try again or contact support if the issue persists.'
        );
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        <div className="relative bg-white/10 backdrop-blur-xl p-6 rounded-lg shadow-lg border border-white/20 w-[500px] transform transition-all">
          <h3 className="text-xl font-bold mb-4 text-white/90">Java Installation Required</h3>
          <div className="text-white/80 space-y-4">
            <p>{javaStatus.message}</p>
            {javaStatus.downloadInfo && (
              <>
                <p className="font-semibold">{javaStatus.downloadInfo.message}</p>
                <div className="flex flex-col gap-4">
                  <button
                    onClick={handleInstallJDK}
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Install JDK Automatically
                  </button>
                  <a
                    href={javaStatus.downloadInfo.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-lg transition-colors text-center"
                  >
                    Download JDK Manually
                  </a>
                </div>
                <div className="mt-4 text-sm opacity-75">
                  <p>System Information:</p>
                  <ul className="list-disc list-inside mt-2">
                    <li>Platform: {javaStatus.downloadInfo.platform}</li>
                    <li>Architecture: {javaStatus.downloadInfo.arch}</li>
                  </ul>
                </div>
              </>
            )}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowJavaInstructions(false)}
                className="bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-lg transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleRename = () => {
    if (newName.trim()) {
      // Update the Java class name in the code if the language is Java
      let updatedCode = code;
      if (language === 'java') {
        // Find all class declarations in the code
        const classMatch = code.match(/(?:public\s+)?class\s+(\w+)/);
        if (classMatch) {
          // Replace the class name with the new name
          updatedCode = code.replace(
            /(?:public\s+)?class\s+\w+/,
            `public class ${newName.trim()}`
          );
          setCode(updatedCode); // Update the code state immediately
        } else {
          // If no class found, create a new class with the new name
          updatedCode = `public class ${newName.trim()} {
    public static void main(String[] args) {
${code.split('\n').map(line => '        ' + line.trimRight()).join('\n')}
    }
}`;
          setCode(updatedCode);
        }
      }
      
      // Save the problem with the new name and updated code
      const success = saveProblemToLocalStorage(newName.trim(), isCompleted);
      
      if (success) {
        setProblemTitle(newName.trim());
        
        // Update URL with the new name
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set('problem', encodeURIComponent(newName.trim()));
        window.history.pushState({}, '', `${window.location.pathname}?${searchParams.toString()}`);
        
        setIsRenaming(false);
        setNewName('');
        setIsCodeSaved(true); // Show the save animation
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800">
      <JavaInstallationModal />
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
        <div className="grid grid-cols-12 gap-6">
          {/* Code Editor Section - Now spans 8 columns */}
          <div className="col-span-8 bg-[#1a1b26]/80 backdrop-blur-xl rounded-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/20 hover:shadow-[0_8px_32px_rgba(31,41,55,0.4)] transition-all">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                {isRenaming ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                      placeholder="Enter new name..."
                      className="bg-white/15 text-white h-9 px-4 py-2 rounded-lg backdrop-blur-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 text-sm min-w-[200px]"
                      autoFocus
                    />
                    <button
                      onClick={handleRename}
                      className="bg-white/15 hover:bg-white/25 text-white h-9 px-4 py-2 rounded-lg backdrop-blur-xl transition-all border border-white/20 text-sm min-w-[80px]"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-lg font-bold font-['JetBrains_Mono'] text-white flex items-center gap-3">
                      <span>{problemTitle}</span>
                      <button
                        onClick={() => {
                          setIsRenaming(true);
                          setNewName(problemTitle);
                        }}
                        className="text-sm bg-white/15 hover:bg-white/25 text-white h-8 px-3 py-1.5 rounded-lg backdrop-blur-xl transition-all border border-white/20"
                      >
                        Rename
                      </button>
                    </h2>
                  </>
                )}
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
                  className="bg-white/15 text-white h-9 px-4 py-2 rounded-lg backdrop-blur-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 hover:bg-white/20 transition-all [&>option]:bg-[#1a1b26] [&>option]:text-white text-sm min-w-[120px]"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsNewFileModalOpen(true)}
                  className="bg-white/15 hover:bg-white/25 text-white h-9 px-4 py-2 rounded-lg backdrop-blur-xl transition-all border border-white/20 flex items-center gap-2 hover:shadow-lg text-sm min-w-[120px] justify-center"
                >
                  <span>New File</span>
                  <span className="text-xs opacity-60">⌘N</span>
                </button>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="bg-white/15 text-white h-9 px-4 py-2 rounded-lg backdrop-blur-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 hover:bg-white/20 transition-all [&>option]:bg-[#1a1b26] [&>option]:text-white text-sm min-w-[120px]"
                >
                  <option value="cpp">C++</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="javascript">JavaScript</option>
                </select>
              </div>
            </div>
            <div className="relative">
              {isCodeSaved && (
                <div className="absolute top-0 left-0 right-0 flex justify-center">
                  <div className="bg-green-500/80 text-white px-3 py-1.5 rounded-lg backdrop-blur-sm animate-fade-up text-sm">
                    Code saved!
                  </div>
                </div>
              )}
              <CodeMirror
                value={code}
                height="750px"
                extensions={[...extensions, modernGlassTheme]}
                theme="dark"
                onChange={handleCodeChange}
                className={`overflow-hidden rounded-lg font-['JetBrains_Mono'] bg-gradient-to-b from-black/20 to-black/10 transition-transform duration-300 ${
                  isCodeSaved ? 'transform -translate-y-2' : ''
                }`}
                style={{ fontSize: `${fontSize}px` }}
                basicSetup={{
                  lineNumbers: true,
                  highlightActiveLineGutter: true,
                  highlightActiveLine: true,
                  foldGutter: true,
                }}
              />
            </div>
            
            <div className="flex items-center gap-4 mt-4">
              <button
                onClick={runCode}
                className="bg-white/15 hover:bg-white/25 text-white h-9 px-4 py-2 rounded-lg backdrop-blur-xl transition-all border border-white/20 flex items-center gap-2 hover:shadow-lg text-sm min-w-[120px] justify-center"
              >
                <span>Run</span>
                <span className="text-xs opacity-60">⌘R</span>
              </button>
              <button
                onClick={submitCode}
                className="bg-white/15 hover:bg-white/25 text-white h-9 px-4 py-2 rounded-lg backdrop-blur-xl transition-all border border-white/20 flex items-center gap-2 hover:shadow-lg text-sm min-w-[120px] justify-center"
              >
                <span>Submit</span>
                <span className="text-xs opacity-60">⌘S</span>
              </button>
            </div>
          </div>

          {/* Output Section - Now spans 4 columns */}
          <div className="col-span-4 bg-[#1a1b26]/80 backdrop-blur-xl rounded-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/20 hover:shadow-[0_8px_32px_rgba(31,41,55,0.4)] transition-all">
            <div className="mb-4">
              <button
                onClick={() => setShowInput(!showInput)}
                className="bg-white/15 hover:bg-white/25 text-white h-9 px-4 py-2 rounded-lg backdrop-blur-xl transition-all border border-white/20 flex items-center gap-2 hover:shadow-lg text-sm min-w-[120px] justify-center mb-4"
              >
                <span>{showInput ? 'Hide Input' : 'Show Input'}</span>
                <span className="text-xs opacity-60">⌘I</span>
              </button>
              
              {showInput && (
                <div className="resize-y overflow-auto min-h-[80px] max-h-[200px]">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter your input here..."
                    className="w-full h-full bg-black/30 text-white p-3 rounded-lg resize-none font-['JetBrains_Mono'] focus:outline-none focus:ring-2 focus:ring-white/30 border border-white/20 text-sm"
                    style={{ fontSize: `${fontSize}px` }}
                  />
                </div>
              )}
            </div>

            <h2 className="text-lg font-bold mb-4 font-['JetBrains_Mono'] text-white">Output</h2>
            <div className="resize-y overflow-auto min-h-[200px] max-h-[400px]">
              <pre 
                className="h-full bg-black/30 p-3 rounded-lg overflow-auto font-['JetBrains_Mono'] text-white border border-white/20 text-sm"
                style={{ fontSize: `${fontSize}px` }}
              >
                {output || 'Run your code to see output here...'}
              </pre>
            </div>

            {/* Solution Section */}
            <div className="mt-12 space-y-6">
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => submissionCount >= 5 && setShowSolution(!showSolution)}
                  className={`bg-white/15 ${submissionCount >= 5 ? 'hover:bg-white/25' : 'opacity-50 cursor-not-allowed'} text-white h-11 px-4 py-2.5 rounded-lg backdrop-blur-xl transition-all border border-white/20 flex items-center gap-2 hover:shadow-lg text-sm min-w-[120px] justify-center`}
                >
                  <span>
                    {submissionCount >= 5 
                      ? (showSolution ? 'Hide Solution' : 'Show Solution')
                      : `Submit ${5 - submissionCount} more times to unlock solution`}
                  </span>
                  <span className="text-xs opacity-60">⌘L</span>
                </button>
                
                {showSolution && submissionCount >= 5 && (
                  <div className="mt-2">
                    <textarea
                      value={solution}
                      onChange={(e) => setSolution(e.target.value)}
                      placeholder="Write your solution explanation here..."
                      className="w-full h-full min-h-[150px] bg-black/30 text-white p-3 rounded-lg resize-y font-['JetBrains_Mono'] focus:outline-none focus:ring-2 focus:ring-white/30 border border-white/20 text-sm"
                      style={{ fontSize: `${fontSize}px` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}