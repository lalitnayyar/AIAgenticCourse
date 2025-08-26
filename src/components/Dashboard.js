import React, { useState } from "react";
import { useProgress } from "../context/ProgressContext";

const Dashboard = ({ plan }) => {
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const saved = localStorage.getItem('dashboardSelectedWeek');
    return saved ? parseInt(saved) : 1;
  });

  const { 
    completedLessons, 
    getCurrentWeek, 
    getStreak, 
    getTotalTimeSpent, 
    getExpectedTimeForCompleted, 
    formatTime 
  } = useProgress();
  
  // Save selected week to localStorage
  const handleWeekChange = (weekNum) => {
    setSelectedWeek(weekNum);
    localStorage.setItem('dashboardSelectedWeek', weekNum.toString());
  };

  // Calculate expected duration for selected week
  const getSelectedWeekExpectedTime = () => {
    const week = plan.weeks.find(w => w.week === selectedWeek);
    if (!week) return 0;
    
    return week.days.reduce((weekTotal, day) => {
      const dayTotal = day.lessons.reduce((dayTotal, lesson) => {
        let lessonSeconds = 0;
        const duration = lesson.duration;
        
        // Handle mm:ss format (e.g., "06:15")
        if (duration.includes(':')) {
          const [minutes, seconds] = duration.split(':').map(Number);
          lessonSeconds = (minutes * 60) + seconds;
        } else {
          // Handle text format (e.g., "3h 20m 32s")
          const hourMatch = duration.match(/(\d+)h/);
          const minuteMatch = duration.match(/(\d+)m/);
          const secondMatch = duration.match(/(\d+)s/);
          
          if (hourMatch) lessonSeconds += parseInt(hourMatch[1]) * 3600;
          if (minuteMatch) lessonSeconds += parseInt(minuteMatch[1]) * 60;
          if (secondMatch) lessonSeconds += parseInt(secondMatch[1]);
        }
        
        return dayTotal + (lessonSeconds * 1000); // Convert to milliseconds
      }, 0);
      return weekTotal + dayTotal;
    }, 0);
  };

  const totalLessons = plan.weeks.reduce((total, week) => 
    total + week.days.reduce((dayTotal, day) => dayTotal + day.lessons.length, 0), 0
  );
  
  const completedCount = completedLessons.size;
  const progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const currentWeek = getCurrentWeek(plan);
  const streak = getStreak();
  const totalTimeSpent = getTotalTimeSpent();
  const expectedTime = getExpectedTimeForCompleted(plan);
  const selectedWeekExpectedTime = getSelectedWeekExpectedTime();
  
  return (
    <div className="p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen text-white">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Agentic AI Learning Portal
        </h1>
        
        {/* Progress Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold">{progressPercentage}%</div>
            <div className="text-sm opacity-90">Overall Progress</div>
          </div>
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-center">
            <select
              value={selectedWeek}
              onChange={(e) => handleWeekChange(parseInt(e.target.value))}
              className="bg-transparent text-white text-3xl font-bold border-none outline-none cursor-pointer mb-2 text-center w-full"
            >
              {plan.weeks.map(week => (
                <option key={week.week} value={week.week} className="bg-blue-600 text-white">
                  Week {week.week}
                </option>
              ))}
            </select>
            <div className="text-sm opacity-90">Selected Week</div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold">🔥 {streak}</div>
            <div className="text-sm opacity-90">Day Streak</div>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold">{completedCount}/{totalLessons}</div>
            <div className="text-sm opacity-90">Lessons Done</div>
          </div>
        </div>

        {/* Time Tracking Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3 text-cyan-400">⏱️ Time Spent</h3>
            <div className="text-2xl font-bold text-white mb-2">
              {formatTime(totalTimeSpent)}
            </div>
            <div className="text-sm text-gray-400">Total learning time</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3 text-yellow-400">🎯 Expected Duration</h3>
            <div className="text-2xl font-bold text-white mb-2">
              {formatTime(selectedWeekExpectedTime)}
            </div>
            <div className="text-sm text-gray-400">Week {selectedWeek} total time</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3 text-pink-400">📊 Efficiency</h3>
            <div className="text-2xl font-bold text-white mb-2">
              {expectedTime > 0 ? Math.round((expectedTime / Math.max(totalTimeSpent, 1)) * 100) : 0}%
            </div>
            <div className="text-sm text-gray-400">Time efficiency ratio</div>
          </div>
        </div>

        {/* Course Overview */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Course Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plan.weeks.map((week) => (
              <div key={week.week} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Week {week.week}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    week.color === 'orange' ? 'bg-orange-500' : 'bg-blue-500'
                  }`}>
                    {week.title}
                  </span>
                </div>
                <div className="text-sm text-gray-300">
                  {week.days.reduce((total, day) => total + day.lessons.length, 0)} lessons
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <a href="/planner" className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold py-6 rounded-xl text-center transition transform hover:scale-105">
            📅 Weekly Planner
          </a>
          <a href="/notes" className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold py-6 rounded-xl text-center transition transform hover:scale-105">
            📝 My Notes
          </a>
          <a href="/progress" className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-6 rounded-xl text-center transition transform hover:scale-105">
            📊 Progress Tracker
          </a>
        </div>

        {/* Motivational Quote */}
        <div className="mt-8 text-center">
          <blockquote className="text-xl italic text-gray-300">
            "The future belongs to those who learn more skills and combine them in creative ways."
          </blockquote>
          <cite className="text-sm text-gray-500 mt-2 block">- Robert Greene</cite>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
