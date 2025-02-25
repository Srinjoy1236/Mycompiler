import React from 'react';
import { Line } from 'react-chartjs-2';
import { useTheme } from '../contexts/ThemeContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface StatisticsProps {
  problems: Array<{
    title: string;
    completed: boolean;
    difficulty: string;
    timestamp: string;
  }>;
}

export default function Statistics({ problems }: StatisticsProps) {
  const { darkMode } = useTheme();

  // Process data for the chart
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const problemsByDay = problems.reduce((acc: any, problem) => {
    const day = problem.timestamp?.split('T')[0];
    if (day) {
      acc[day] = (acc[day] || 0) + 1;
    }
    return acc;
  }, {});

  const chartData = {
    labels: last7Days,
    datasets: [
      {
        label: 'Problems Solved',
        data: last7Days.map(day => problemsByDay[day] || 0),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: darkMode ? 'white' : '#1f2937'
        }
      },
      title: {
        display: true,
        text: 'Daily Problem Solving Stats',
        color: darkMode ? 'white' : '#1f2937'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: darkMode ? 'white' : '#4b5563'
        },
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        }
      },
      x: {
        ticks: {
          color: darkMode ? 'white' : '#4b5563'
        },
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        }
      }
    }
  };

  const difficultyStats = problems.reduce((acc: any, problem) => {
    acc[problem.difficulty] = (acc[problem.difficulty] || 0) + 1;
    return acc;
  }, {});

  // Calculate statistics
  const totalSolved = problems.length;
  const todaySolved = problems.filter(p => 
    new Date(p.timestamp).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="relative bg-white/50 dark:bg-[#1D1E26] rounded-lg p-6 shadow-lg backdrop-blur-sm">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Your Progress</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/70 dark:bg-gray-800/50 rounded-lg p-4 shadow-sm">
          <h3 className="text-lg text-gray-600 dark:text-gray-400 mb-2">Total Solved</h3>
          <p className="text-4xl font-bold text-green-600 dark:text-green-500">{totalSolved}</p>
        </div>

        <div className="bg-white/70 dark:bg-gray-800/50 rounded-lg p-4 shadow-sm">
          <h3 className="text-lg text-gray-600 dark:text-gray-400 mb-2">Today's Solved</h3>
          <p className="text-4xl font-bold text-blue-600 dark:text-blue-500">{todaySolved}</p>
        </div>

        <div className="bg-white/70 dark:bg-gray-800/50 rounded-lg p-4 shadow-sm">
          <h3 className="text-lg text-gray-600 dark:text-gray-400 mb-2">Difficulty Breakdown</h3>
          <div className="flex gap-4 text-sm">
            <span className="text-green-600 dark:text-green-500">Easy: {difficultyStats.Easy || 0}</span>
            <span className="text-orange-600 dark:text-orange-500">Medium: {difficultyStats.Medium || 0}</span>
            <span className="text-red-600 dark:text-red-500">Hard: {difficultyStats.Hard || 0}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white/70 dark:bg-[#0F172A] p-4 rounded-lg shadow-sm">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
} 