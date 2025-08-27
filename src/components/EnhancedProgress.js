import React, { useState, useEffect } from "react";
import { useDatabaseProgress } from "../context/DatabaseProgressContext";
import { HybridDatabaseService } from "../services/hybridDatabaseService";

const EnhancedProgress = ({ plan }) => {
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [auditLogs, setAuditLogs] = useState([]);
  const [progressStats, setProgressStats] = useState({});
  const [timeAnalytics, setTimeAnalytics] = useState({});

  const {
    completedLessons,
    getWeekProgress,
    getDayProgress,
    formatTime,
    getLessonTime,
    isLessonCompleted,
    toggleLesson,
    startLessonTimer,
    stopLessonTimer,
    isTimerActive
  } = useDatabaseProgress();

  useEffect(() => {
    loadProgressData();
  }, [selectedWeek, completedLessons]);

  const loadProgressData = async () => {
    try {
      // Load audit logs for the selected week
      const logs = await HybridDatabaseService.getAuditLogs(50, 'lesson');
      const weekLogs = logs.filter(log => 
        log.details?.week === selectedWeek
      );
      setAuditLogs(weekLogs);

      // Calculate progress statistics
      const weekData = plan.weeks.find(w => w.week === selectedWeek);
      if (weekData) {
        const weekProgress = getWeekProgress(weekData);
        const dayProgressData = weekData.days.map(day => ({
          day: day.day,
          progress: getDayProgress(weekData, day.day)
        }));

        setProgressStats({
          week: weekProgress,
          days: dayProgressData,
          totalLessons: weekData.days.reduce((total, day) => total + day.lessons.length, 0)
        });

        // Calculate time analytics
        let totalTimeSpent = 0;
        let totalExpectedTime = 0;
        const lessonTimes = [];

        weekData.days.forEach(day => {
          day.lessons.forEach((lesson, idx) => {
            const lessonId = `${selectedWeek}-${day.day}-${idx}`;
            const timeSpent = getLessonTime(selectedWeek, day.day, idx);
            totalTimeSpent += timeSpent;

            // Calculate expected time
            let expectedTime = 0;
            const duration = lesson.duration;
            if (duration.includes(':')) {
              const [minutes, seconds] = duration.split(':').map(Number);
              expectedTime = (minutes * 60 + seconds) * 1000;
            } else {
              const hourMatch = duration.match(/(\d+)h/);
              const minuteMatch = duration.match(/(\d+)m/);
              const secondMatch = duration.match(/(\d+)s/);
              
              if (hourMatch) expectedTime += parseInt(hourMatch[1]) * 3600000;
              if (minuteMatch) expectedTime += parseInt(minuteMatch[1]) * 60000;
              if (secondMatch) expectedTime += parseInt(secondMatch[1]) * 1000;
            }
            totalExpectedTime += expectedTime;

            lessonTimes.push({
              lessonId,
              title: lesson.title,
              timeSpent,
              expectedTime,
              completed: isLessonCompleted(selectedWeek, day.day, idx),
              day: day.day
            });
          });
        });

        setTimeAnalytics({
          totalTimeSpent,
          totalExpectedTime,
          efficiency: totalExpectedTime > 0 ? Math.round((totalExpectedTime / Math.max(totalTimeSpent, 1)) * 100) : 0,
          lessonTimes: lessonTimes.sort((a, b) => b.timeSpent - a.timeSpent)
        });
      }
    } catch (error) {
      console.error('Error loading progress data:', error);
    }
  };

  const handleLessonToggle = async (weekNum, dayNum, lessonIdx, lessonTitle) => {
    await toggleLesson(weekNum, dayNum, lessonIdx, lessonTitle);
    await loadProgressData();
  };

  const handleTimerToggle = async (weekNum, dayNum, lessonIdx, lessonTitle) => {
    if (isTimerActive(weekNum, dayNum, lessonIdx)) {
      await stopLessonTimer(weekNum, dayNum, lessonIdx, lessonTitle);
    } else {
      await startLessonTimer(weekNum, dayNum, lessonIdx, lessonTitle);
    }
    await loadProgressData();
  };

  const getActivityIcon = (action) => {
    switch (action) {
      case 'lesson_completed': return '✅';
      case 'lesson_uncompleted': return '❌';
      case 'timer_started': return '▶️';
      case 'timer_stopped': return '⏹️';
      default: return '📊';
    }
  };

  const currentWeek = plan.weeks.find(w => w.week === selectedWeek);

  return (
    <div className="p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen text-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Enhanced Progress Tracker
        </h2>

        {/* Week Selection */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium mb-2">Select Week:</label>
              <select
                value={selectedWeek}
                onChange={e => setSelectedWeek(Number(e.target.value))}
                className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
              >
                {plan.weeks.map(week => (
                  <option key={week.week} value={week.week}>
                    Week {week.week}: {week.title}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={loadProgressData}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Progress Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold">{progressStats.week?.percentage || 0}%</div>
            <div className="text-sm opacity-90">Week Progress</div>
            <div className="text-xs opacity-75 mt-1">
              {progressStats.week?.completed || 0}/{progressStats.week?.total || 0} lessons
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold">{formatTime(timeAnalytics.totalTimeSpent || 0)}</div>
            <div className="text-sm opacity-90">Time Spent</div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold">{timeAnalytics.efficiency || 0}%</div>
            <div className="text-sm opacity-90">Efficiency</div>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold">{auditLogs.length}</div>
            <div className="text-sm opacity-90">Activities</div>
          </div>
        </div>

        {/* Daily Progress */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <h3 className="text-xl font-bold mb-4 text-blue-400">📊 Daily Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {progressStats.days?.map(dayData => (
              <div key={dayData.day} className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-lg font-bold mb-2">Day {dayData.day}</div>
                <div className="text-2xl font-bold text-green-400 mb-1">
                  {dayData.progress.percentage}%
                </div>
                <div className="text-xs text-gray-400">
                  {dayData.progress.completed}/{dayData.progress.total}
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${dayData.progress.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Lesson Progress */}
        {currentWeek && (
          <div className="bg-gray-800 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold mb-4 text-green-400">📚 Lesson Details</h3>
            <div className="space-y-6">
              {currentWeek.days.map(day => (
                <div key={day.day} className="bg-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-semibold mb-3 text-yellow-400">
                    Day {day.day} ({day.lessons.length} lessons)
                  </h4>
                  <div className="space-y-3">
                    {day.lessons.map((lesson, idx) => {
                      const lessonId = `${selectedWeek}-${day.day}-${idx}`;
                      const completed = isLessonCompleted(selectedWeek, day.day, idx);
                      const timeSpent = getLessonTime(selectedWeek, day.day, idx);
                      const timerActive = isTimerActive(selectedWeek, day.day, idx);

                      return (
                        <div key={idx} className="flex items-center justify-between bg-gray-600 rounded-lg p-3">
                          <div className="flex items-center gap-3 flex-1">
                            <button
                              onClick={() => handleLessonToggle(selectedWeek, day.day, idx, lesson.title)}
                              className={`w-6 h-6 rounded border-2 flex items-center justify-center transition ${
                                completed
                                  ? 'bg-green-500 border-green-500 text-white'
                                  : 'border-gray-400 hover:border-green-400'
                              }`}
                            >
                              {completed && '✓'}
                            </button>
                            
                            <div className="flex-1">
                              <div className={`font-medium ${completed ? 'line-through text-gray-400' : 'text-white'}`}>
                                {lesson.title}
                              </div>
                              <div className="text-sm text-gray-400">
                                Expected: {lesson.duration} | Spent: {formatTime(timeSpent)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleTimerToggle(selectedWeek, day.day, idx, lesson.title)}
                              className={`px-3 py-1 rounded text-sm font-medium transition ${
                                timerActive
                                  ? 'bg-red-600 hover:bg-red-700 text-white'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                              }`}
                            >
                              {timerActive ? '⏹️ Stop' : '▶️ Start'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Time Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4 text-purple-400">⏱️ Top Time Consumers</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {timeAnalytics.lessonTimes?.slice(0, 10).map((lesson, idx) => (
                <div key={lesson.lessonId} className="flex items-center justify-between bg-gray-700 rounded-lg p-3">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{lesson.title}</div>
                    <div className="text-xs text-gray-400">Day {lesson.day}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-400">{formatTime(lesson.timeSpent)}</div>
                    <div className="text-xs text-gray-400">
                      vs {formatTime(lesson.expectedTime)} expected
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4 text-orange-400">📈 Recent Activity</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {auditLogs.map((log, idx) => (
                <div key={log.id || idx} className="flex items-center gap-3 bg-gray-700 rounded-lg p-3">
                  <span className="text-xl">{getActivityIcon(log.action)}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div className="text-xs text-gray-400">
                      {log.details?.lessonTitle}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Progress Tips */}
        <div className="mt-8 bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-6">
          <h4 className="text-lg font-bold mb-2 text-yellow-400">💡 Progress Tracking Tips</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Use the timer to track actual time spent on lessons</li>
            <li>• Monitor your efficiency ratio to optimize learning</li>
            <li>• Review daily progress to maintain consistency</li>
            <li>• Check recent activity to see your learning patterns</li>
            <li>• All progress data is automatically saved to local database</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EnhancedProgress;
