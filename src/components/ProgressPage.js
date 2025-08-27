import React, { useState, useEffect } from 'react';
import { useDatabaseProgress } from '../context/DatabaseProgressContext';

const ProgressPage = ({ plan }) => {
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [progressStats, setProgressStats] = useState({});
  const { 
    completedLessons, 
    timeTracking, 
    getProgressStats,
    getAuditLogs
  } = useDatabaseProgress();

  useEffect(() => {
    loadProgressStats();
  }, [completedLessons, timeTracking]);

  const loadProgressStats = async () => {
    try {
      const stats = await getProgressStats();
      setProgressStats(stats || {});
    } catch (error) {
      console.error('Error loading progress stats:', error);
    }
  };

  const calculateWeekProgress = (weekNumber) => {
    const week = plan.weeks.find(w => w.week === weekNumber);
    if (!week) return { completed: 0, total: 0, percentage: 0 };

    let completed = 0;
    let total = 0;

    week.days.forEach((day, dayIndex) => {
      day.lessons.forEach((lesson, lessonIndex) => {
        const lessonId = `${weekNumber}-${dayIndex + 1}-${lessonIndex}`;
        total++;
        if (completedLessons.has(lessonId)) {
          completed++;
        }
      });
    });

    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  };

  const calculateTotalTimeForWeek = (weekNumber) => {
    const week = plan.weeks.find(w => w.week === weekNumber);
    if (!week) return 0;

    let totalTime = 0;
    week.days.forEach((day, dayIndex) => {
      day.lessons.forEach((lesson, lessonIndex) => {
        const lessonId = `${weekNumber}-${dayIndex + 1}-${lessonIndex}`;
        if (timeTracking[lessonId]?.totalTime) {
          totalTime += timeTracking[lessonId].totalTime;
        }
      });
    });

    return totalTime;
  };

  const formatTime = (milliseconds) => {
    const minutes = Math.floor(milliseconds / 60000);
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const currentWeek = plan.weeks.find(w => w.week === selectedWeek);
  const weekProgress = calculateWeekProgress(selectedWeek);
  const weekTime = calculateTotalTimeForWeek(selectedWeek);

  return (
    <div className="p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen text-white">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
          📊 Progress Tracking
        </h1>

        {/* Overall Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold">{completedLessons.size}</div>
            <div className="text-blue-200">Lessons Completed</div>
          </div>
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold">
              {Object.values(timeTracking).reduce((total, lesson) => 
                total + (lesson.totalTime || 0), 0) > 0 
                ? formatTime(Object.values(timeTracking).reduce((total, lesson) => 
                    total + (lesson.totalTime || 0), 0))
                : '0m'
              }
            </div>
            <div className="text-green-200">Total Study Time</div>
          </div>
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold">{plan.weeks.length}</div>
            <div className="text-purple-200">Total Weeks</div>
          </div>
          <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold">
              {Math.round(
                (completedLessons.size / 
                plan.weeks.reduce((total, week) => 
                  total + week.days.reduce((dayTotal, day) => dayTotal + day.lessons.length, 0), 0)
                ) * 100
              ) || 0}%
            </div>
            <div className="text-orange-200">Overall Progress</div>
          </div>
        </div>

        {/* Week Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Weekly Progress</h2>
          <div className="flex flex-wrap gap-2 mb-6">
            {plan.weeks.map((week) => {
              const progress = calculateWeekProgress(week.week);
              return (
                <button
                  key={week.week}
                  onClick={() => setSelectedWeek(week.week)}
                  className={`px-4 py-2 rounded-lg transition relative ${
                    selectedWeek === week.week
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <div>Week {week.week}</div>
                  <div className="text-xs">{progress.percentage}%</div>
                  <div className={`absolute bottom-0 left-0 h-1 rounded-b ${getProgressColor(progress.percentage)}`}
                       style={{ width: `${progress.percentage}%` }}></div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Week Details */}
        {currentWeek && (
          <div className="bg-gray-800 rounded-xl p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">Week {selectedWeek}: {currentWeek.title}</h2>
                <p className="text-gray-400">{currentWeek.description}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-400">{weekProgress.percentage}%</div>
                <div className="text-sm text-gray-400">
                  {weekProgress.completed}/{weekProgress.total} lessons
                </div>
                <div className="text-sm text-gray-400">
                  Time: {formatTime(weekTime)}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Progress</span>
                <span>{weekProgress.completed}/{weekProgress.total} completed</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(weekProgress.percentage)}`}
                  style={{ width: `${weekProgress.percentage}%` }}
                ></div>
              </div>
            </div>

            {/* Daily Breakdown */}
            <div className="space-y-4">
              {currentWeek.days.map((day, dayIndex) => {
                const dayLessons = day.lessons;
                const completedInDay = dayLessons.filter((lesson, lessonIndex) => {
                  const lessonId = `${selectedWeek}-${dayIndex + 1}-${lessonIndex}`;
                  return completedLessons.has(lessonId);
                }).length;
                
                const dayProgress = Math.round((completedInDay / dayLessons.length) * 100);
                const dayTime = dayLessons.reduce((total, lesson, lessonIndex) => {
                  const lessonId = `${selectedWeek}-${dayIndex + 1}-${lessonIndex}`;
                  return total + (timeTracking[lessonId]?.totalTime || 0);
                }, 0);

                return (
                  <div key={dayIndex} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-cyan-400">
                        Day {dayIndex + 1}
                      </h3>
                      <div className="text-right">
                        <div className="text-sm font-medium">{dayProgress}%</div>
                        <div className="text-xs text-gray-400">
                          {completedInDay}/{dayLessons.length} • {formatTime(dayTime)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-600 rounded-full h-2 mb-3">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(dayProgress)}`}
                        style={{ width: `${dayProgress}%` }}
                      ></div>
                    </div>

                    <div className="space-y-2">
                      {dayLessons.map((lesson, lessonIndex) => {
                        const lessonId = `${selectedWeek}-${dayIndex + 1}-${lessonIndex}`;
                        const isCompleted = completedLessons.has(lessonId);
                        const lessonTime = timeTracking[lessonId]?.totalTime || 0;

                        return (
                          <div key={lessonIndex} className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                              <span className={isCompleted ? 'text-green-400' : 'text-gray-300'}>
                                {lesson.title}
                              </span>
                            </div>
                            <div className="text-gray-400">
                              {formatTime(lessonTime)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Progress Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">📈 Study Patterns</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Average Session Time</span>
                <span className="font-medium">
                  {Object.values(timeTracking).length > 0
                    ? formatTime(
                        Object.values(timeTracking).reduce((total, lesson) => 
                          total + (lesson.totalTime || 0), 0) / Object.values(timeTracking).length
                      )
                    : '0m'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Longest Session</span>
                <span className="font-medium">
                  {Object.values(timeTracking).length > 0
                    ? formatTime(
                        Math.max(...Object.values(timeTracking).map(lesson => lesson.totalTime || 0))
                      )
                    : '0m'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Active Learning Days</span>
                <span className="font-medium">
                  {new Set(
                    Object.values(timeTracking)
                      .filter(lesson => lesson.totalTime > 0)
                      .map(lesson => lesson.lastUpdated?.split('T')[0])
                  ).size}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4">🎯 Achievements</h3>
            <div className="space-y-3">
              <div className={`flex items-center space-x-2 ${completedLessons.size >= 10 ? 'text-green-400' : 'text-gray-500'}`}>
                <span>{completedLessons.size >= 10 ? '🏆' : '🔒'}</span>
                <span>Complete 10 lessons</span>
              </div>
              <div className={`flex items-center space-x-2 ${completedLessons.size >= 50 ? 'text-green-400' : 'text-gray-500'}`}>
                <span>{completedLessons.size >= 50 ? '🏆' : '🔒'}</span>
                <span>Complete 50 lessons</span>
              </div>
              <div className={`flex items-center space-x-2 ${
                Object.values(timeTracking).reduce((total, lesson) => total + (lesson.totalTime || 0), 0) >= 3600000 
                ? 'text-green-400' : 'text-gray-500'
              }`}>
                <span>{
                  Object.values(timeTracking).reduce((total, lesson) => total + (lesson.totalTime || 0), 0) >= 3600000 
                  ? '🏆' : '🔒'
                }</span>
                <span>Study for 60+ hours</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;
