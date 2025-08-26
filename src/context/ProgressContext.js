import React, { createContext, useContext, useState, useEffect } from 'react';

const ProgressContext = createContext();

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};

export const ProgressProvider = ({ children }) => {
  const [completedLessons, setCompletedLessons] = useState(() => {
    const saved = localStorage.getItem('completedLessons');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [auditTrail, setAuditTrail] = useState(() => {
    const saved = localStorage.getItem('auditTrail');
    return saved ? JSON.parse(saved) : [];
  });

  const [timeTracking, setTimeTracking] = useState(() => {
    const saved = localStorage.getItem('timeTracking');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('completedLessons', JSON.stringify([...completedLessons]));
  }, [completedLessons]);

  useEffect(() => {
    localStorage.setItem('auditTrail', JSON.stringify(auditTrail));
  }, [auditTrail]);

  useEffect(() => {
    localStorage.setItem('timeTracking', JSON.stringify(timeTracking));
  }, [timeTracking]);

  const toggleLesson = (weekNum, dayNum, lessonIdx, lessonTitle = '') => {
    const lessonId = `${weekNum}-${dayNum}-${lessonIdx}`;
    const newCompleted = new Set(completedLessons);
    const isCompleting = !newCompleted.has(lessonId);
    
    if (newCompleted.has(lessonId)) {
      newCompleted.delete(lessonId);
    } else {
      newCompleted.add(lessonId);
    }
    setCompletedLessons(newCompleted);

    // Add to audit trail
    const auditEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action: isCompleting ? 'completed' : 'uncompleted',
      lessonId,
      week: weekNum,
      day: dayNum,
      lessonIndex: lessonIdx,
      lessonTitle: lessonTitle || `Week ${weekNum}, Day ${dayNum}, Lesson ${lessonIdx + 1}`,
      totalCompleted: isCompleting ? newCompleted.size : newCompleted.size
    };
    
    setAuditTrail(prev => [auditEntry, ...prev].slice(0, 100)); // Keep last 100 entries

    // Track time spent if completing
    if (isCompleting) {
      const now = Date.now();
      setTimeTracking(prev => ({
        ...prev,
        [lessonId]: {
          startTime: now,
          completedTime: now,
          timeSpent: 0 // Will be calculated when lesson is actually worked on
        }
      }));
    }
  };

  const isLessonCompleted = (weekNum, dayNum, lessonIdx) => {
    const lessonId = `${weekNum}-${dayNum}-${lessonIdx}`;
    return completedLessons.has(lessonId);
  };

  const getWeekProgress = (week) => {
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
    
    return {
      completed: weekCompleted,
      total: weekLessons,
      percentage: weekLessons > 0 ? Math.round((weekCompleted / weekLessons) * 100) : 0
    };
  };

  const getCurrentWeek = (plan) => {
    for (let week of plan.weeks) {
      const progress = getWeekProgress(week);
      if (progress.percentage < 100) {
        return week.week;
      }
    }
    return plan.weeks.length; // All weeks completed
  };

  const getStreak = () => {
    // Simple streak calculation - can be enhanced
    return Math.min(Math.floor(completedLessons.size / 5), 30);
  };

  const getTotalTimeSpent = () => {
    return Object.values(timeTracking).reduce((total, lesson) => {
      let lessonTime = lesson.totalTime || 0;
      // Add current session time if timer is active
      if (lesson.isActive && lesson.startTime) {
        lessonTime += Date.now() - lesson.startTime;
      }
      return total + lessonTime;
    }, 0);
  };

  const getExpectedTimeForCompleted = (plan) => {
    let totalExpected = 0;
    completedLessons.forEach(lessonId => {
      const [weekNum, dayNum, lessonIdx] = lessonId.split('-').map(Number);
      const week = plan.weeks.find(w => w.week === weekNum);
      if (week) {
        const day = week.days.find(d => d.day === dayNum);
        if (day && day.lessons[lessonIdx]) {
          const duration = day.lessons[lessonIdx].duration;
          if (duration) {
            let totalSeconds = 0;
            
            // Handle mm:ss format (e.g., "06:15")
            if (duration.includes(':')) {
              const [minutes, seconds] = duration.split(':').map(Number);
              totalSeconds = (minutes * 60) + seconds;
            } else {
              // Handle text format (e.g., "3h 20m 32s")
              const hourMatch = duration.match(/(\d+)h/);
              const minuteMatch = duration.match(/(\d+)m/);
              const secondMatch = duration.match(/(\d+)s/);
              
              if (hourMatch) totalSeconds += parseInt(hourMatch[1]) * 3600;
              if (minuteMatch) totalSeconds += parseInt(minuteMatch[1]) * 60;
              if (secondMatch) totalSeconds += parseInt(secondMatch[1]);
            }
            
            totalExpected += totalSeconds * 1000; // Convert to milliseconds
          }
        }
      }
    });
    return totalExpected;
  };

  const getDayProgress = (week, dayNum) => {
    const day = week.days.find(d => d.day === dayNum);
    if (!day) return { completed: 0, total: 0, percentage: 0 };
    
    let completed = 0;
    day.lessons.forEach((lesson, idx) => {
      const lessonId = `${week.week}-${dayNum}-${idx}`;
      if (completedLessons.has(lessonId)) {
        completed++;
      }
    });
    
    return {
      completed,
      total: day.lessons.length,
      percentage: day.lessons.length > 0 ? Math.round((completed / day.lessons.length) * 100) : 0
    };
  };

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const startLessonTimer = (weekNum, dayNum, lessonIdx, lessonTitle) => {
    const lessonId = `${weekNum}-${dayNum}-${lessonIdx}`;
    const now = Date.now();
    
    setTimeTracking(prev => ({
      ...prev,
      [lessonId]: {
        ...prev[lessonId],
        startTime: now,
        isActive: true
      }
    }));

    // Add to audit trail
    const auditEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action: 'timer_started',
      lessonId,
      week: weekNum,
      day: dayNum,
      lessonIndex: lessonIdx,
      lessonTitle: lessonTitle || `Week ${weekNum}, Day ${dayNum}, Lesson ${lessonIdx + 1}`,
      totalCompleted: completedLessons.size
    };
    
    setAuditTrail(prev => [auditEntry, ...prev].slice(0, 100));
  };

  const stopLessonTimer = (weekNum, dayNum, lessonIdx, lessonTitle) => {
    const lessonId = `${weekNum}-${dayNum}-${lessonIdx}`;
    const now = Date.now();
    
    setTimeTracking(prev => {
      const lessonTime = prev[lessonId] || { totalTime: 0 };
      let sessionTime = 0;
      
      if (lessonTime.startTime && lessonTime.isActive) {
        sessionTime = now - lessonTime.startTime;
      }
      
      return {
        ...prev,
        [lessonId]: {
          ...lessonTime,
          totalTime: (lessonTime.totalTime || 0) + sessionTime,
          isActive: false,
          startTime: null,
          lastSession: sessionTime
        }
      };
    });

    // Add to audit trail
    const auditEntry = {
      id: Date.now() + 1, // Ensure unique ID
      timestamp: new Date().toISOString(),
      action: 'timer_stopped',
      lessonId,
      week: weekNum,
      day: dayNum,
      lessonIndex: lessonIdx,
      lessonTitle: lessonTitle || `Week ${weekNum}, Day ${dayNum}, Lesson ${lessonIdx + 1}`,
      totalCompleted: completedLessons.size
    };
    
    setAuditTrail(prev => [auditEntry, ...prev].slice(0, 100));
  };

  const getLessonTime = (weekNum, dayNum, lessonIdx) => {
    const lessonId = `${weekNum}-${dayNum}-${lessonIdx}`;
    const lessonTime = timeTracking[lessonId];
    
    if (!lessonTime) return 0;
    
    let totalTime = lessonTime.totalTime || 0;
    
    // Add current session time if timer is active
    if (lessonTime.isActive && lessonTime.startTime) {
      totalTime += Date.now() - lessonTime.startTime;
    }
    
    return totalTime;
  };

  const isTimerActive = (weekNum, dayNum, lessonIdx) => {
    const lessonId = `${weekNum}-${dayNum}-${lessonIdx}`;
    const lessonTime = timeTracking[lessonId];
    return lessonTime?.isActive || false;
  };

  return (
    <ProgressContext.Provider value={{
      completedLessons,
      auditTrail,
      timeTracking,
      toggleLesson,
      isLessonCompleted,
      getWeekProgress,
      getCurrentWeek,
      getStreak,
      getTotalTimeSpent,
      getExpectedTimeForCompleted,
      getDayProgress,
      formatTime,
      startLessonTimer,
      stopLessonTimer,
      getLessonTime,
      isTimerActive
    }}>
      {children}
    </ProgressContext.Provider>
  );
};
