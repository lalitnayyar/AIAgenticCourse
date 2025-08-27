import React, { useState, useEffect } from "react";
import { useDatabaseProgress } from "../context/DatabaseProgressContext";
import HybridDatabaseService from '../services/hybridDatabaseService';

const EnhancedDashboard = ({ plan }) => {
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const saved = localStorage.getItem('dashboardSelectedWeek');
    return saved ? parseInt(saved) : 1;
  });
  const [dashboardStats, setDashboardStats] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [storageStats, setStorageStats] = useState({});

  // Default plan structure if none provided
  const defaultPlan = {
    weeks: [
      {
        week: 1,
        title: "Foundation",
        description: "Getting started with the basics",
        days: [
          {
            lessons: [
              { title: "Introduction", duration: "5 min" },
              { title: "Setup", duration: "10 min" },
              { title: "First Steps", duration: "15 min" }
            ]
          }
        ]
      }
    ]
  };

  const activePlan = plan || defaultPlan;

  const { 
    completedLessons, 
    getCurrentWeek, 
    getStreak, 
    getTotalTimeSpent, 
    getExpectedTimeForCompleted, 
    formatTime,
    auditTrail,
    saveDashboardFigure,
    getStorageStats
  } = useDatabaseProgress();

  // Debounce dashboard saves to prevent excessive database writes
  const [saveTimeout, setSaveTimeout] = useState(null);

  useEffect(() => {
    loadDashboardData();
    loadStorageStats();
  }, [completedLessons, selectedWeek]);

  // Listen for dashboard refresh events
  useEffect(() => {
    const handleDashboardRefresh = () => {
      console.log('🔄 Dashboard refresh event received');
      loadDashboardData();
      loadStorageStats();
    };

    window.addEventListener('dashboardRefresh', handleDashboardRefresh);
    return () => window.removeEventListener('dashboardRefresh', handleDashboardRefresh);
  }, []);

  const loadDashboardData = async () => {
    try {
      // Calculate and save current stats
      const totalLessons = activePlan.weeks.reduce((total, week) => 
        total + week.days.reduce((dayTotal, day) => dayTotal + day.lessons.length, 0), 0
      );
      
      const completedCount = completedLessons.size;
      const progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
      const currentWeek = getCurrentWeek(activePlan);
      const streak = getStreak();
      const totalTimeSpent = getTotalTimeSpent();
      const expectedTime = getExpectedTimeForCompleted(activePlan);
      
      // Fix efficiency calculation - should be actual vs expected
      let efficiency = 0;
      if (expectedTime > 0 && totalTimeSpent > 0) {
        // If we spent less time than expected, we're more efficient
        efficiency = Math.min(Math.round((expectedTime / totalTimeSpent) * 100), 999);
      } else if (expectedTime > 0) {
        // If no time spent yet, efficiency is 0
        efficiency = 0;
      }
      
      console.log('Dashboard calculations:', {
        totalLessons,
        completedCount,
        progressPercentage,
        totalTimeSpent: formatTime(totalTimeSpent),
        expectedTime: formatTime(expectedTime),
        efficiency: `${efficiency}%`
      });

      const stats = {
        totalLessons,
        completedCount,
        progressPercentage,
        currentWeek,
        streak,
        totalTimeSpent,
        expectedTime,
        efficiency,
        selectedWeekExpectedTime: getSelectedWeekExpectedTime()
      };

      setDashboardStats(stats);

      // Debounced save to prevent excessive database writes
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      
      const newTimeout = setTimeout(async () => {
        try {
          // Save all metrics in a single batch to reduce database calls
          await Promise.all([
            saveDashboardFigure('progress_percentage', progressPercentage),
            saveDashboardFigure('completed_lessons', completedCount),
            saveDashboardFigure('current_streak', streak),
            saveDashboardFigure('total_time_spent', totalTimeSpent),
            saveDashboardFigure('efficiency_ratio', efficiency)
          ]);
        } catch (error) {
          console.warn('Failed to save dashboard metrics:', error);
        }
      }, 1000); // 1 second debounce
      
      setSaveTimeout(newTimeout);

      // Load recent activity
      const recentLogs = auditTrail.slice(0, 10);
      setRecentActivity(recentLogs);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const loadStorageStats = async () => {
    try {
      const stats = await HybridDatabaseService.getStorageStats();
      // Extract just the counts from the stats object
      const counts = {};
      if (stats.local) {
        Object.assign(counts, stats.local);
      }
      if (stats.cloud && Object.keys(stats.cloud).length > 0) {
        // Use cloud stats if available, otherwise use local
        Object.assign(counts, stats.cloud);
      }
      setStorageStats(counts);
    } catch (error) {
      console.error('Error loading storage stats:', error);
      setStorageStats({});
    }
  };

  const handleWeekChange = async (weekNum) => {
    setSelectedWeek(weekNum);
    localStorage.setItem('dashboardSelectedWeek', weekNum.toString());
    
    // Log week selection event
    try {
      await HybridDatabaseService.logEvent('week_selected', 'dashboard', {
        selectedWeek: weekNum,
        previousWeek: selectedWeek
      });
    } catch (logError) {
      console.warn('Failed to log week selection:', logError);
    }
  };

  const getSelectedWeekExpectedTime = () => {
    const week = activePlan.weeks.find(w => w.week === selectedWeek);
    if (!week) return 0;
    
    return week.days.reduce((weekTotal, day) => {
      const dayTotal = day.lessons.reduce((dayTotal, lesson) => {
        let lessonSeconds = 0;
        const duration = lesson.duration;
        
        if (duration.includes(':')) {
          const [minutes, seconds] = duration.split(':').map(Number);
          lessonSeconds = (minutes * 60) + seconds;
        } else {
          const hourMatch = duration.match(/(\d+)h/);
          const minuteMatch = duration.match(/(\d+)m/);
          const secondMatch = duration.match(/(\d+)s/);
          
          if (hourMatch) lessonSeconds += parseInt(hourMatch[1]) * 3600;
          if (minuteMatch) lessonSeconds += parseInt(minuteMatch[1]) * 60;
          if (secondMatch) lessonSeconds += parseInt(secondMatch[1]);
        }
        
        return dayTotal + (lessonSeconds * 1000);
      }, 0);
      return weekTotal + dayTotal;
    }, 0);
  };

  const getActivityIcon = (action) => {
    switch (action) {
      case 'lesson_completed': return '✅';
      case 'lesson_uncompleted': return '❌';
      case 'timer_started': return '▶️';
      case 'timer_stopped': return '⏹️';
      case 'note_saved': return '📝';
      case 'note_updated': return '✏️';
      case 'note_deleted': return '🗑️';
      default: return '📊';
    }
  };

  const {
    totalLessons = 0,
    completedCount = 0,
    progressPercentage = 0,
    currentWeek = 1,
    streak = 0,
    totalTimeSpent = 0,
    expectedTime = 0,
    efficiency = 0,
    selectedWeekExpectedTime = 0
  } = dashboardStats;

  return (
    <div className="p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen text-white">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Enhanced Agentic AI Learning Portal
        </h1>
        
        {/* Progress Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold">{progressPercentage}%</div>
            <div className="text-sm opacity-90">Overall Progress</div>
            <div className="text-xs opacity-75 mt-1">{completedCount}/{totalLessons} lessons</div>
          </div>
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-center">
            <select
              value={selectedWeek}
              onChange={(e) => handleWeekChange(parseInt(e.target.value))}
              className="bg-transparent text-white text-3xl font-bold border-none outline-none cursor-pointer mb-2 text-center w-full"
            >
              {activePlan.weeks.map(week => (
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

        {/* Enhanced Time Tracking Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
              {efficiency}%
            </div>
            <div className="text-sm text-gray-400">Time efficiency ratio</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-3 text-green-400">💾 Data Storage</h3>
            <div className="text-2xl font-bold text-white mb-2">
              {Object.values(storageStats).reduce((sum, count) => sum + (typeof count === 'number' ? count : 0), 0)}
            </div>
            <div className="text-sm text-gray-400">Total records stored</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4 text-blue-400">📈 Recent Activity</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, idx) => (
                  <div key={activity.id || idx} className="flex items-center gap-3 bg-gray-700 rounded-lg p-3">
                    <span className="text-xl">{getActivityIcon(activity.action)}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {typeof activity.action === 'string' ? activity.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Activity'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {typeof activity.details === 'string' ? activity.details : 
                         (activity.details && typeof activity.details === 'object') ? 
                           (activity.details.lessonTitle || 
                            (activity.details.week ? `Week ${activity.details.week}, Day ${activity.details.day}` : 
                             JSON.stringify(activity.details))) :
                         activity.entityType || 'Activity'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'No timestamp'}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-400 text-center py-4">
                  No recent activity
                </div>
              )}
            </div>
          </div>

          {/* Storage Statistics */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4 text-purple-400">💾 Storage Statistics</h3>
            <div className="space-y-3">
              {Object.entries(storageStats).map(([table, count]) => (
                <div key={table} className="flex justify-between items-center bg-gray-700 rounded-lg p-3">
                  <span className="text-sm font-medium capitalize">
                    {table.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="text-lg font-bold text-blue-400">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Course Overview */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Course Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activePlan.weeks.map((week) => {
              const weekLessons = week.days.reduce((total, day) => total + day.lessons.length, 0);
              let weekCompleted = 0;
              
              week.days.forEach(day => {
                day.lessons.forEach((lesson, idx) => {
                  const lessonId = `${week.week}-${day.day}-${idx}`;
                  if (completedLessons.has(lessonId)) {
                    weekCompleted++;
                  }
                });
              });
              
              const weekProgress = weekLessons > 0 ? Math.round((weekCompleted / weekLessons) * 100) : 0;
              
              return (
                <div key={week.week} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Week {week.week}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      week.color === 'orange' ? 'bg-orange-500' : 'bg-blue-500'
                    }`}>
                      {week.title}
                    </span>
                  </div>
                  <div className="text-sm text-gray-300 mb-2">
                    {weekCompleted}/{weekLessons} lessons ({weekProgress}%)
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${weekProgress}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Enhanced Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <a href="/planner" className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold py-6 rounded-xl text-center transition transform hover:scale-105">
            📅 Weekly Planner
          </a>
          <a href="/notes" className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white font-bold py-6 rounded-xl text-center transition transform hover:scale-105">
            📝 Enhanced Notes
          </a>
          <a href="/progress" className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-6 rounded-xl text-center transition transform hover:scale-105">
            📊 Progress Tracker
          </a>
          <button 
            onClick={loadDashboardData}
            className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold py-6 rounded-xl text-center transition transform hover:scale-105"
          >
            🔄 Refresh Data
          </button>
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

export default EnhancedDashboard;
