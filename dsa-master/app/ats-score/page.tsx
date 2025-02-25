'use client';

import React, { useState } from 'react';

interface AnalysisResult {
  overall: number;
  feedback: string[];
  suggestions: string[];
  keywords: { [key: string]: number };
  format: number;
  readability: number;
}

export default function ATSScorePage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!file) {
      alert('Please select a file first');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('resume', file);

      const response = await fetch('/api/analyze-resume', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        console.error('Response status:', response.status);
        console.error('Response text:', await response.text());
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error analyzing resume:', error);
      alert('Failed to analyze resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-white">ATS Score Calculator</h1>
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-[#1a1b26]/80 backdrop-blur-xl rounded-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)] border border-white/20">
            <div className="relative">
              {/* Custom file input styling */}
              <div className="flex w-full gap-4">
                <div className="flex flex-1">
                  <label 
                    htmlFor="file-upload" 
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-l cursor-pointer transition-all"
                  >
                    Choose File
                  </label>
                  <span className="bg-black/20 text-gray-400 px-4 py-2 rounded-r flex-grow">
                    {file ? file.name : 'No file chosen'}
                  </span>
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={!file || loading}
                  className={`px-6 py-2 rounded ${
                    file && !loading
                      ? 'bg-orange-500 hover:bg-orange-600 text-white cursor-pointer' 
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  } transition-all`}
                >
                  {loading ? 'Analyzing...' : 'Analyze'}
                </button>
              </div>
              <input
                id="file-upload"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0] || null;
                  setFile(selectedFile);
                  setResult(null); // Clear previous results when new file is selected
                }}
                className="hidden"
              />
            </div>

            {/* Analysis Results */}
            {result && (
              <div className="mt-8 space-y-6">
                {/* Overall Score */}
                <div className="bg-black/30 rounded-lg p-6 border border-white/10">
                  <h2 className="text-2xl font-bold text-white mb-4">Overall Score: {result.overall}%</h2>
                  <div className="w-full bg-gray-700 rounded-full h-4">
                    <div 
                      className="bg-orange-500 h-4 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${result.overall}%` }}
                    ></div>
                  </div>
                </div>

                {/* Detailed Scores */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-black/30 rounded-lg p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-2">Format Score</h3>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-emerald-500 h-3 rounded-full"
                        style={{ width: `${result.format}%` }}
                      ></div>
                    </div>
                    <p className="text-gray-400 mt-1">{result.format}%</p>
                  </div>
                  <div className="bg-black/30 rounded-lg p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-white mb-2">Readability Score</h3>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-blue-500 h-3 rounded-full"
                        style={{ width: `${result.readability}%` }}
                      ></div>
                    </div>
                    <p className="text-gray-400 mt-1">{result.readability}%</p>
                  </div>
                </div>

                {/* Keywords */}
                <div className="bg-black/30 rounded-lg p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">Keywords Found</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {Object.entries(result.keywords).map(([keyword, count]) => (
                      <div key={keyword} className="bg-black/20 rounded p-3 border border-white/10">
                        <p className="text-white font-medium">{keyword}</p>
                        <p className="text-gray-400 text-sm">Found {count} times</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Feedback and Suggestions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-black/30 rounded-lg p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-green-400 mb-4">Positive Feedback</h3>
                    <ul className="space-y-2">
                      {result.feedback.map((item, index) => (
                        <li key={index} className="text-gray-300 flex items-start gap-2">
                          <span className="text-green-400">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-black/30 rounded-lg p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-4">Suggestions</h3>
                    <ul className="space-y-2">
                      {result.suggestions.map((item, index) => (
                        <li key={index} className="text-gray-300 flex items-start gap-2">
                          <span className="text-yellow-400">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 