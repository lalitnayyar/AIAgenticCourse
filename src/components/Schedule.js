import React, { useState, useEffect } from 'react';
import { useProgress } from '../context/ProgressContext';

const Schedule = ({ plan }) => {
  const [startDate, setStartDate] = useState(() => {
    const saved = localStorage.getItem('courseStartDate');
    return saved || '2025-08-26';
  });
  
  const { formatTime } = useProgress();

  // Save start date to localStorage when changed
  useEffect(() => {
    localStorage.setItem('courseStartDate', startDate);
  }, [startDate]);

  const calculateWeekDates = () => {
    const start = new Date(startDate);
    const weeks = [];
    
    plan.weeks.forEach((week, weekIndex) => {
      const weekStart = new Date(start);
      weekStart.setDate(start.getDate() + (weekIndex * 7));
      
      const days = week.days.map((day, dayIndex) => {
        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + dayIndex);
        
        return {
          ...day,
          date: dayDate,
          formattedDate: dayDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          })
        };
      });

      // Calculate total expected time for the week (sum of all daily durations)
      const totalWeekTimeMs = week.days.reduce((weekTotal, day) => {
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

      weeks.push({
        ...week,
        days,
        weekStart,
        weekEnd: new Date(weekStart.getTime() + (6 * 24 * 60 * 60 * 1000)),
        totalExpectedTime: totalWeekTimeMs // Already in milliseconds
      });
    });
    
    return weeks;
  };

  const weekSchedule = calculateWeekDates();
  const courseEndDate = weekSchedule[weekSchedule.length - 1]?.weekEnd;

  return (
    <div className="p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen text-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Course Schedule
        </h2>

        {/* Course Overview */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-blue-400">Start Date:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">Course Duration</div>
              <div className="text-2xl font-bold text-green-400">6 Weeks</div>
              <div className="text-sm text-gray-400">
                {new Date(startDate).toLocaleDateString()} - {courseEndDate?.toLocaleDateString()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-1">Total Expected Time</div>
              <div className="text-2xl font-bold text-purple-400">
                {formatTime(weekSchedule.reduce((total, week) => total + week.totalExpectedTime, 0))}
              </div>
              <div className="text-sm text-gray-400">Across all weeks</div>
            </div>
          </div>
        </div>

        {/* Weekly Schedule */}
        <div className="space-y-8">
          {weekSchedule.map((week) => (
            <div key={week.week} className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Week {week.week}: {week.title}
                  </h3>
                  <div className="text-sm text-gray-400">
                    {week.weekStart.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })} - {week.weekEnd.toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-4 py-2 rounded-lg ${
                    week.color === 'orange' ? 'bg-orange-500' : 'bg-blue-500'
                  }`}>
                    <div className="text-lg font-bold text-white">
                      {formatTime(week.totalExpectedTime)}
                    </div>
                    <div className="text-xs text-white/80">Expected Duration</div>
                  </div>
                </div>
              </div>

              {/* Week Projects */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-3 text-yellow-400">📋 Week Projects</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {week.projects.map((project, idx) => (
                    <div 
                      key={idx}
                      className={`p-3 rounded-lg text-sm font-medium text-center ${
                        project.includes('Project') 
                          ? 'bg-yellow-500 text-black' 
                          : week.color === 'orange' 
                            ? 'bg-orange-500 text-white' 
                            : 'bg-blue-500 text-white'
                      }`}
                    >
                      {project}
                    </div>
                  ))}
                </div>
              </div>

              {/* Daily Schedule */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {week.days.map((day) => {
                  const dayDurationMs = day.lessons.reduce((total, lesson) => {
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
                    
                    return total + (lessonSeconds * 1000); // Convert to milliseconds
                  }, 0);

                  const isToday = day.date.toDateString() === new Date().toDateString();
                  const isPast = day.date < new Date() && !isToday;
                  const isFuture = day.date > new Date();

                  return (
                    <div 
                      key={day.day} 
                      className={`bg-gray-700 rounded-lg p-4 border-2 transition ${
                        isToday 
                          ? 'border-green-500 bg-green-900/20' 
                          : isPast 
                            ? 'border-gray-600 opacity-75' 
                            : isFuture 
                              ? 'border-blue-500/50' 
                              : 'border-gray-600'
                      }`}
                    >
                      <div className="text-center mb-3">
                        <div className={`text-lg font-bold ${
                          isToday ? 'text-green-400' : 'text-white'
                        }`}>
                          Day {day.day}
                        </div>
                        <div className="text-sm text-gray-400">
                          {day.formattedDate}
                        </div>
                        {isToday && (
                          <div className="text-xs text-green-400 font-medium mt-1">
                            📅 TODAY
                          </div>
                        )}
                      </div>

                      <div className="text-center mb-3">
                        <div className="text-sm font-medium text-cyan-400">
                          {formatTime(dayDurationMs)}
                        </div>
                        <div className="text-xs text-gray-500">Expected</div>
                      </div>

                      <div className="space-y-2">
                        {day.lessons.map((lesson, idx) => (
                          <div 
                            key={idx}
                            className="bg-gray-600 rounded p-2 text-xs"
                          >
                            <div className="font-medium text-white mb-1 line-clamp-2">
                              {lesson.title}
                            </div>
                            <div className="text-gray-400 text-right">
                              {lesson.duration}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Schedule Summary */}
        <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-6 mt-8">
          <h3 className="text-xl font-bold mb-4 text-yellow-400">📊 Schedule Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-400">6</div>
              <div className="text-sm text-gray-300">Weeks</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">30</div>
              <div className="text-sm text-gray-300">Days</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">
                {plan.weeks.reduce((total, week) => 
                  total + week.days.reduce((dayTotal, day) => dayTotal + day.lessons.length, 0), 0
                )}
              </div>
              <div className="text-sm text-gray-300">Total Lessons</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-400">
                {formatTime(weekSchedule.reduce((total, week) => total + week.totalExpectedTime, 0))}
              </div>
              <div className="text-sm text-gray-300">Total Duration</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;
