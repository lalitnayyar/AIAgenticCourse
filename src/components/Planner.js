import React, { useState, useEffect } from "react";
import { useDatabaseProgress } from "../context/DatabaseProgressContext";

const Planner = ({ plan }) => {
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [liveTimers, setLiveTimers] = useState({});
  const { 
    completedLessons, 
    toggleLesson, 
    isLessonCompleted, 
    startLessonTimer,
    stopLessonTimer,
    getLessonTime,
    isTimerActive,
    formatTime 
  } = useDatabaseProgress();

  const currentWeek = plan.weeks.find(w => w.week === selectedWeek);

  // Update live timers every second for active timers
  useEffect(() => {
    const interval = setInterval(() => {
      const updatedTimers = {};
      let hasActiveTimers = false;

      // Check all lessons in current week for active timers
      if (currentWeek) {
        currentWeek.days.forEach(day => {
          day.lessons.forEach((lesson, idx) => {
            const lessonKey = `${currentWeek.week}-${day.day}-${idx}`;
            if (isTimerActive(currentWeek.week, day.day, idx)) {
              updatedTimers[lessonKey] = getLessonTime(currentWeek.week, day.day, idx);
              hasActiveTimers = true;
            }
          });
        });
      }

      if (hasActiveTimers) {
        setLiveTimers(updatedTimers);
      } else {
        setLiveTimers({});
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentWeek, isTimerActive, getLessonTime]);

  const getDisplayTime = (weekNum, dayNum, lessonIdx) => {
    const lessonKey = `${weekNum}-${dayNum}-${lessonIdx}`;
    const isActive = isTimerActive(weekNum, dayNum, lessonIdx);
    
    if (isActive && liveTimers[lessonKey] !== undefined) {
      return liveTimers[lessonKey];
    }
    
    return getLessonTime(weekNum, dayNum, lessonIdx);
  };

  return (
    <div className="p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen text-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Weekly Learning Planner
        </h2>
        
        {/* Week Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {plan.weeks.map((week) => (
            <button
              key={week.week}
              onClick={() => setSelectedWeek(week.week)}
              className={`px-6 py-3 rounded-lg font-semibold transition ${
                selectedWeek === week.week
                  ? week.color === 'orange' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-blue-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Week {week.week}: {week.title}
            </button>
          ))}
        </div>

        {currentWeek && (
          <div>
            {/* Week Header with Projects */}
            <div className="bg-gray-800 rounded-xl p-6 mb-8">
              <h3 className="text-2xl font-bold mb-4">Week {currentWeek.week}: {currentWeek.title}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                {currentWeek.projects.map((project, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-lg text-sm font-medium text-center ${
                      project.includes('Project') 
                        ? 'bg-yellow-500 text-black' 
                        : currentWeek.color === 'orange' 
                          ? 'bg-orange-500 text-white' 
                          : 'bg-blue-500 text-white'
                    }`}
                  >
                    {project}
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Breakdown */}
            <div className="space-y-6">
              {currentWeek.days.map((day) => (
                <div key={day.day} className="bg-gray-800 rounded-xl p-6">
                  <h4 className="text-xl font-semibold mb-4 text-blue-400">
                    Day {day.day}
                  </h4>
                  <div className="space-y-3">
                    {day.lessons.map((lesson, idx) => {
                      const isCompleted = isLessonCompleted(currentWeek.week, day.day, idx);
                      const timerActive = isTimerActive(currentWeek.week, day.day, idx);
                      const lessonTime = getDisplayTime(currentWeek.week, day.day, idx);
                      
                      return (
                        <div 
                          key={idx} 
                          className={`p-4 rounded-lg transition ${
                            isCompleted ? 'bg-green-900 border-green-500 border' : 'bg-gray-700 hover:bg-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={isCompleted}
                                onChange={() => toggleLesson(currentWeek.week, day.day, idx, lesson.title)}
                                className="h-5 w-5 text-green-600 rounded focus:ring-green-500"
                              />
                              <span className={`font-medium ${isCompleted ? 'line-through text-gray-400' : 'text-white'}`}>
                                {lesson.title}
                              </span>
                            </div>
                            <span className="text-sm text-gray-400 bg-gray-600 px-2 py-1 rounded">
                              {lesson.duration}
                            </span>
                          </div>
                          
                          {/* Time Tracking Controls */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              {!timerActive ? (
                                <button
                                  onClick={() => startLessonTimer(currentWeek.week, day.day, idx, lesson.title)}
                                  className="flex items-center space-x-2 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm font-medium transition"
                                >
                                  <span>▶️</span>
                                  <span>Start</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => stopLessonTimer(currentWeek.week, day.day, idx, lesson.title)}
                                  className="flex items-center space-x-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition animate-pulse"
                                >
                                  <span>⏹️</span>
                                  <span>Stop</span>
                                </button>
                              )}
                              
                              {lessonTime > 0 && (
                                <div className="flex items-center space-x-2 text-sm">
                                  <span className="text-cyan-400">⏱️</span>
                                  <span className={`font-medium ${timerActive ? 'text-green-300 animate-pulse' : 'text-cyan-300'}`}>
                                    {formatTime(lessonTime)}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            {timerActive && (
                              <div className="flex items-center space-x-2 text-sm">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-red-400 font-medium">Recording...</span>
                              </div>
                            )}
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
      </div>
    </div>
  );
};

export default Planner;
