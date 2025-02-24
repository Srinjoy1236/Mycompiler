import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Problem {
  title: string;
  completed: boolean;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  code: string;
  language?: string;
  timestamp?: string;
}

export default function Dashboard() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // Load problems from localStorage
    const savedProblems = JSON.parse(localStorage.getItem('problems') || '[]');
    setProblems(savedProblems);

    // Add event listener for storage changes
    const handleStorageChange = () => {
      const updatedProblems = JSON.parse(localStorage.getItem('problems') || '[]');
      
      // Check for duplicates before updating
      const newProblem = updatedProblems[updatedProblems.length - 1];
      if (newProblem) {
        const isDuplicate = updatedProblems.slice(0, -1).some(
          (problem: Problem) => problem.title.toLowerCase() === newProblem.title.toLowerCase()
        );

        if (isDuplicate) {
          setErrorMessage(`Problem "${newProblem.title}" already exists`);
          // Remove the duplicate from localStorage
          localStorage.setItem('problems', JSON.stringify(updatedProblems.slice(0, -1)));
          return;
        }
      }
      
      setErrorMessage('');
      setProblems(updatedProblems);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const getDifficultyColor = (difficulty: 'Easy' | 'Medium' | 'Hard') => {
    switch (difficulty) {
      case 'Easy':
        return 'text-emerald-400';
      case 'Medium':
        return 'text-amber-400';
      case 'Hard':
        return 'text-rose-400';
      default:
        return 'text-white/90';
    }
  };

  // Add this function to handle deletion
  const handleDelete = (titleToDelete: string) => {
    const existingProblems = JSON.parse(localStorage.getItem('problems') || '[]');
    const updatedProblems = existingProblems.filter(
      (problem: Problem) => problem.title !== titleToDelete
    );
    localStorage.setItem('problems', JSON.stringify(updatedProblems));
    setProblems(updatedProblems);
  };

  const handleProblemClick = (problem: Problem) => {
    // Navigate to code editor with the problem's code
    const encodedTitle = encodeURIComponent(problem.title);
    window.location.href = `/code-editor?problem=${encodedTitle}`;
  };

  return (
    <div className="bg-[#1a1b26]/50 backdrop-blur-md rounded-lg p-4 shadow-lg border border-white/5">
      <h2 className="text-2xl font-bold font-['JetBrains_Mono'] text-white/90 mb-4">Your Problems</h2>
      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg mb-4">
          {errorMessage}
        </div>
      )}
      <div className="grid gap-2">
        {problems.map((problem: Problem, index: number) => (
          <div key={problem.title} className="flex items-center justify-between bg-[#1a1b26]/50 p-3 rounded-lg hover:bg-[#1a1b26]/70 transition-all group">
            <div className="flex items-center gap-4">
              <div className={`w-2 h-2 rounded-full ${problem.completed ? 'bg-green-400' : 'bg-gray-400'}`} />
              <Link 
                href={`/code-editor?problem=${encodeURIComponent(problem.title)}`}
                className="text-white hover:text-orange-400 transition-colors"
              >
                {problem.title}
              </Link>
              <span className={`text-sm ${getDifficultyColor(problem.difficulty)}`}>
                {problem.difficulty}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white/60 text-sm font-['JetBrains_Mono'] lowercase bg-white/5 px-2 py-0.5 rounded">
                {problem.language || 'cpp'}
              </span>
              <span className="text-white/40 text-sm font-['JetBrains_Mono']">
                {problem.timestamp ? new Date(problem.timestamp).toLocaleDateString() : 'Invalid Date'}
              </span>
              <button
                onClick={() => handleDelete(problem.title)}
                className="opacity-0 group-hover:opacity-100 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 px-3 py-1.5 rounded-lg text-sm transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 