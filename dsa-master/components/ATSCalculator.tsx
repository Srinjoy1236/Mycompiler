'use client';

import React, { useState } from 'react';

interface ATSScore {
  overall: number;
  keywords: { [key: string]: number };
  format: number;
  readability: number;
  feedback: string[];
  suggestions: string[];
}

export default function ATSCalculator() {
  const [file, setFile] = useState<File | null>(null);
  const [score, setScore] = useState<ATSScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateATSScore = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch('/api/analyze-resume', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze resume');
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setScore(result);
    } catch (error) {
      console.error('Error analyzing resume:', error);
      setError(error instanceof Error ? error.message : 'Failed to analyze resume');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Please upload a PDF file');
        return;
      }
      setFile(file);
      setError(null);
    }
  };

  const handleAnalyze = () => {
    if (!file) {
      setError('Please select a PDF file first');
      return;
    }
    calculateATSScore(file);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-100 to-gray-200 dark:from-[#151821] dark:via-[#1D1E26] dark:to-[#1F2937]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative bg-white/50 dark:bg-[#1D1E26]/50 rounded-lg p-6 shadow-lg backdrop-blur-sm">
          <div className="bg-white/70 dark:bg-gray-800/30 rounded-lg p-4 shadow-sm backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">ATS Score Calculator</h2>
            
            <div className="mb-6 space-y-4">
              <label className="block mb-2 text-gray-600 dark:text-gray-400">Upload Resume (PDF)</label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-400
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-orange-500 file:text-white
                  hover:file:bg-orange-600
                  cursor-pointer"
              />
              
              <button
                onClick={handleAnalyze}
                disabled={!file || loading}
                className={`w-full py-2 px-4 rounded-lg font-semibold text-white
                  ${!file || loading 
                    ? 'bg-gray-500 cursor-not-allowed' 
                    : 'bg-orange-500 hover:bg-orange-600'}`}
              >
                {loading ? 'Analyzing...' : 'Analyze Resume'}
              </button>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
                {error}
              </div>
            )}

            {loading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                <p className="mt-2 text-gray-400">Analyzing resume...</p>
              </div>
            )}

            {score && (
              <div className="space-y-4">
                <div className="bg-white/60 dark:bg-gray-800/20 backdrop-blur-sm p-4 rounded-lg shadow-sm">
                  <h3 className="text-xl mb-2 text-gray-900 dark:text-white">Overall ATS Score</h3>
                  <div className="text-4xl font-bold text-orange-500">{score.overall}%</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/60 dark:bg-gray-800/20 backdrop-blur-sm p-4 rounded-lg shadow-sm">
                    <h3 className="text-lg mb-2 text-gray-900 dark:text-white">Format Score</h3>
                    <div className="text-2xl font-bold text-green-500">{score.format}%</div>
                  </div>
                  <div className="bg-white/60 dark:bg-gray-800/20 backdrop-blur-sm p-4 rounded-lg shadow-sm">
                    <h3 className="text-lg mb-2 text-gray-900 dark:text-white">Readability Score</h3>
                    <div className="text-2xl font-bold text-blue-500">{score.readability}%</div>
                  </div>
                </div>

                <div className="bg-white/60 dark:bg-gray-800/20 backdrop-blur-sm p-4 rounded-lg shadow-sm">
                  <h3 className="text-lg mb-2 text-gray-900 dark:text-white">Keyword Matches</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(score.keywords || {}).length > 0 ? (
                      Object.entries(score.keywords).map(([keyword, count]) => (
                        <div key={keyword} className="flex justify-between items-center p-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="capitalize text-gray-700 dark:text-gray-300">{keyword}</span>
                          <span className="text-orange-500 font-semibold">{count}</span>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-gray-500 dark:text-gray-400 text-center py-4">
                        No keyword matches found
                      </div>
                    )}
                  </div>
                </div>

                {score.feedback?.length > 0 && (
                  <div className="bg-white/60 dark:bg-gray-800/20 backdrop-blur-sm p-4 rounded-lg shadow-sm">
                    <h3 className="text-lg mb-2 text-gray-900 dark:text-white">Positive Feedback</h3>
                    <ul className="space-y-2">
                      {score.feedback.map((item, index) => (
                        <li key={index} className="text-green-500">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {score.suggestions?.length > 0 && (
                  <div className="bg-white/60 dark:bg-gray-800/20 backdrop-blur-sm p-4 rounded-lg shadow-sm">
                    <h3 className="text-lg mb-2 text-gray-900 dark:text-white">Suggestions for Improvement</h3>
                    <ul className="space-y-2">
                      {score.suggestions.map((item, index) => (
                        <li key={index} className="text-orange-500">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 