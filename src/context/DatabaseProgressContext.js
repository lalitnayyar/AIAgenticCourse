import React, { createContext, useContext, useState, useEffect } from 'react';
import HybridDatabaseService from '../services/hybridDatabaseService';
import { useAuth } from './AuthContext';

const DatabaseProgressContext = createContext();

export const useDatabaseProgress = () => {
  const context = useContext(DatabaseProgressContext);
  if (!context) {
    throw new Error('useDatabaseProgress must be used within a DatabaseProgressProvider');
  }
  return context;
};

export const DatabaseProgressProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [auditTrail, setAuditTrail] = useState([]);
  const [timeTracking, setTimeTracking] = useState({});
  const [dashboardFigures, setDashboardFigures] = useState({});
  const [loading, setLoading] = useState(true);

  // Initialize database and load data when user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    const initDB = async () => {
      try {
        setLoading(true);
        console.log(`🔐 Initializing database for user: ${user.username}`);
        
        // Ensure current user is set in database service
        HybridDatabaseService.setCurrentUser(user.username);
        
        // Set a timeout to prevent infinite loading
        const initTimeout = setTimeout(() => {
          console.warn('Database initialization taking too long, proceeding with local storage only');
          setLoading(false);
        }, 10000); // 10 second timeout
        
        await HybridDatabaseService.initialize();
        console.log('Hybrid database initialized');
        
        clearTimeout(initTimeout);
        loadAllData();
        
        // Disable real-time cloud updates to prevent checkbox state conflicts
        // try {
        //   HybridDatabaseService.subscribeToCloudUpdates((collection, data) => {
        //     console.log(`🔄 Received cloud update for ${collection}:`, data.length, 'items');
        //     // Only reload dashboard, not planner data to prevent checkbox flickering
        //     if (collection !== 'progress') {
        //       setTimeout(() => {
        //         loadAllData();
        //         window.dispatchEvent(new CustomEvent('dashboardRefresh'));
        //       }, 500);
        //     } else {
        //       // For progress updates, only refresh dashboard
        //       window.dispatchEvent(new CustomEvent('dashboardRefresh'));
        //     }
        //   });
        // } catch (subscriptionError) {
        //   console.warn('⚠️ Failed to subscribe to cloud updates:', subscriptionError);
        // }
        
        setLoading(false);
      } catch (error) {
        console.error('Database initialization failed:', error);
        console.log('Falling back to local storage only');
        setLoading(false);
        
        // Try to load data anyway with local storage
        try {
          loadAllData();
        } catch (loadError) {
          console.error('Failed to load data:', loadError);
        }
      }
    };

    initDB();
    
    // Cleanup subscriptions on unmount
    return () => {
      try {
        HybridDatabaseService.unsubscribeFromCloudUpdates();
      } catch (error) {
        console.warn('Error during cleanup:', error);
      }
    };
  }, [isAuthenticated, user]);

  // Load all data from database with cloud-first approach
  const loadAllData = async () => {
    try {
      console.log('💾 Loading all data from database...');
      
      // Force cloud sync first if online
      const connectionStatus = HybridDatabaseService.getConnectionStatus();
      console.log('Connection status:', connectionStatus);
      if (connectionStatus.isOnline) {
        try {
          console.log('☁️ Force syncing from cloud before loading...');
          await HybridDatabaseService.syncFromCloud();
        } catch (syncError) {
          console.warn('Sync failed, loading local data:', syncError);
        }
      }
      
      // Load progress data
      const progressData = await HybridDatabaseService.getAllProgress();
      const completedSet = new Set();
      
      progressData.forEach(item => {
        if (item.status === 'completed') {
          completedSet.add(item.lessonId);
        }
      });
      
      setCompletedLessons(completedSet);
      console.log(`📊 Loaded ${completedSet.size} completed lessons`);

      // Load time tracking data
      const timeData = await HybridDatabaseService.getAllTimeTracking();
      const timeTrackingMap = {};
      
      timeData.forEach(item => {
        timeTrackingMap[item.lessonId] = {
          totalTime: item.totalTime || 0,
          isActive: item.isActive || false,
          startTime: item.startTime
        };
      });
      
      setTimeTracking(timeTrackingMap);
      console.log(`⏱️ Loaded time tracking for ${Object.keys(timeTrackingMap).length} lessons`);

      // Load dashboard figures
      const dashboardData = await HybridDatabaseService.getAllDashboardFigures();
      const dashboardMap = {};
      
      dashboardData.forEach(item => {
        dashboardMap[item.key] = item.value;
      });
      
      setDashboardFigures(dashboardMap);
      console.log(`📈 Loaded ${Object.keys(dashboardMap).length} dashboard figures`);

      // Load audit trail
      const logs = await HybridDatabaseService.getAuditLogs(100);
      setAuditTrail(logs || []);
      console.log(`📝 Loaded ${(logs || []).length} audit log entries`);

      console.log('✅ All data loaded successfully');
      
    } catch (error) {
      console.error('❌ Error loading data:', error);
      // Set default values to prevent UI errors
      setCompletedLessons(new Set());
      setTimeTracking({});
      setDashboardFigures({});
      setAuditTrail([]);
    }
  };

  // ULTRA-FAST lesson toggle - millisecond response
  const toggleLesson = async (weekNum, dayNum, lessonIdx, lessonTitle = '') => {
    const lessonId = `${weekNum}-${dayNum}-${lessonIdx}`;
    const isCompleting = !completedLessons.has(lessonId);
    
    // Create new completed set
    const newCompleted = new Set(completedLessons);
    
    // Toggle the lesson state
    if (isCompleting) {
      newCompleted.add(lessonId);
    } else {
      newCompleted.delete(lessonId);
    }
    
    // Update local state immediately for responsive UI
    setCompletedLessons(newCompleted);

    // Persist to database and log; revert on failure
    try {
      const status = isCompleting ? 'completed' : 'in_progress';
      const timeSpent = getLessonTime(weekNum, dayNum, lessonIdx) || 0;

      await HybridDatabaseService.saveProgress(
        lessonId,
        weekNum,
        dayNum,
        lessonIdx,
        status,
        timeSpent
      );

      // Lightweight audit entry (non-blocking intent)
      try {
        await HybridDatabaseService.logAudit(
          isCompleting ? 'lesson_completed' : 'lesson_reopened',
          'lesson',
          lessonId,
          {
            week: weekNum,
            day: dayNum,
            lessonIndex: lessonIdx,
            lessonTitle: lessonTitle || `Week ${weekNum}, Day ${dayNum}, Lesson ${lessonIdx + 1}`,
            status,
            timestamp: new Date().toISOString()
          }
        );
      } catch (auditErr) {
        // ignore audit failures
      }

      // Optionally refresh dashboard listeners
      try {
        window.dispatchEvent(new CustomEvent('dashboardRefresh'));
      } catch {}
    } catch (err) {
      console.error('❌ Failed to persist lesson toggle, reverting:', err);
      // Revert optimistic update
      setCompletedLessons(prev => {
        const reverted = new Set(prev);
        if (isCompleting) {
          reverted.delete(lessonId);
        } else {
          reverted.add(lessonId);
        }
        return reverted;
      });
    }
  };

  const startLessonTimer = async (weekNum, dayNum, lessonIdx, lessonTitle) => {
    const lessonId = `${weekNum}-${dayNum}-${lessonIdx}`;
    const now = Date.now();
    
    console.log(`⏱️ Starting timer for ${lessonId}`);
    
    try {
      // Check if timer is already active
      if (timeTracking[lessonId]?.isActive) {
        console.warn(`Timer already active for ${lessonId}`);
        return;
      }

      // Update local state immediately
      setTimeTracking(prev => ({
        ...prev,
        [lessonId]: {
          ...prev[lessonId],
          totalTime: prev[lessonId]?.totalTime || 0,
          startTime: now,
          isActive: true
        }
      }));

      console.log(`✅ Timer started for ${lessonId} at ${new Date(now).toLocaleTimeString()}`);

      // Save timer state to ensure cross-session persistence
      try {
        await HybridDatabaseService.saveProgress(
          lessonId, weekNum, dayNum, lessonIdx, 
          completedLessons.has(lessonId) ? 'completed' : 'in_progress',
          timeTracking[lessonId]?.totalTime || 0
        );
      } catch (saveError) {
        console.warn('⚠️ Failed to save timer state:', saveError);
      }

      // Log event
      try {
        await HybridDatabaseService.logEvent('timer_started', 'learning', {
          lessonId,
          week: weekNum,
          day: dayNum,
          lessonIndex: lessonIdx,
          lessonTitle: lessonTitle || `Week ${weekNum}, Day ${dayNum}, Lesson ${lessonIdx + 1}`,
          startTime: now
        });

        // Log audit
        await HybridDatabaseService.logAudit(
          'timer_started',
          'lesson',
          lessonId,
          {
            week: weekNum,
            day: dayNum,
            lessonIndex: lessonIdx,
            lessonTitle: lessonTitle || `Week ${weekNum}, Day ${dayNum}, Lesson ${lessonIdx + 1}`,
            startTime: now,
            timestamp: new Date().toISOString()
          }
        );
      } catch (logError) {
        console.warn('Failed to log timer start event:', logError);
      }

    } catch (error) {
      console.error('❌ Error starting timer:', error);
      // Revert timer state on error
      setTimeTracking(prev => ({
        ...prev,
        [lessonId]: {
          ...prev[lessonId],
          isActive: false,
          startTime: null
        }
      }));
    }
  };

  const stopLessonTimer = async (weekNum, dayNum, lessonIdx, lessonTitle) => {
    const lessonId = `${weekNum}-${dayNum}-${lessonIdx}`;
    const now = Date.now();
    
    console.log(`⏹️ Stopping timer for ${lessonId}`);
    
    try {
      // Get current timer state before updating
      const currentLessonTime = timeTracking[lessonId];
      
      if (!currentLessonTime?.isActive) {
        console.warn(`Timer not active for ${lessonId}`);
        return;
      }

      let sessionTime = 0;
      let newTotalTime = currentLessonTime.totalTime || 0;
      
      if (currentLessonTime.startTime) {
        sessionTime = now - currentLessonTime.startTime;
        newTotalTime += sessionTime;
      }

      console.log(`📊 Session time: ${sessionTime}ms, Total time: ${newTotalTime}ms`);

      // Update state first
      setTimeTracking(prev => ({
        ...prev,
        [lessonId]: {
          ...prev[lessonId],
          totalTime: newTotalTime,
          isActive: false,
          startTime: null,
          lastSession: sessionTime,
          lastStopped: now
        }
      }));

      // Save to database with the calculated time
      try {
        await HybridDatabaseService.saveProgress(
          lessonId, 
          weekNum, 
          dayNum, 
          lessonIdx, 
          completedLessons.has(lessonId) ? 'completed' : 'in_progress',
          newTotalTime
        );
        console.log(`💾 Progress saved for ${lessonId}`);
      } catch (saveError) {
        console.error('❌ Failed to save progress:', saveError);
      }

      // Log event
      try {
        await HybridDatabaseService.logEvent('timer_stopped', 'learning', {
          lessonId,
          week: weekNum,
          day: dayNum,
          lessonIndex: lessonIdx,
          lessonTitle: lessonTitle || `Week ${weekNum}, Day ${dayNum}, Lesson ${lessonIdx + 1}`,
          sessionTime,
          totalTime: newTotalTime,
          stopTime: now
        });

        // Log audit
        await HybridDatabaseService.logAudit(
          'timer_stopped',
          'lesson',
          lessonId,
          {
            week: weekNum,
            day: dayNum,
            lessonIndex: lessonIdx,
            lessonTitle: lessonTitle || `Week ${weekNum}, Day ${dayNum}, Lesson ${lessonIdx + 1}`,
            sessionTime,
            totalTime: newTotalTime,
            stopTime: now,
            timestamp: new Date().toISOString()
          }
        );
      } catch (logError) {
        console.warn('Failed to log timer stop event:', logError);
      }

      // Update dashboard figures
      const totalTime = getTotalTimeSpent();
      await saveDashboardFigure('total_time_spent', totalTime);

      console.log(`✅ Timer stopped for ${lessonId}`);

    } catch (error) {
      console.error('❌ Error stopping timer:', error);
      // Try to revert timer state on error
      setTimeTracking(prev => ({
        ...prev,
        [lessonId]: {
          ...prev[lessonId],
          isActive: false,
          startTime: null
        }
      }));
    }
  };

  const saveDashboardFigure = async (type, value) => {
    try {
      // Local-only save for instant response
      await HybridDatabaseService.saveDashboardFigure(type, value, {
        timestamp: new Date().toISOString(),
        source: 'progress_context'
      });
    } catch (error) {
      // Silently fail to prevent UI blocking
    }
  };

  // Calculate completion rate
  const calculateCompletionRate = (completed, plan = null) => {
    if (!plan) return 0;
    const totalLessons = plan.weeks.reduce((total, week) => 
      total + week.days.reduce((dayTotal, day) => dayTotal + day.lessons.length, 0), 0
    );
    return totalLessons > 0 ? Math.round((completed.size / totalLessons) * 100) : 0;
  };

  // Existing helper functions
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
    return plan.weeks.length;
  };

  const getStreak = () => {
    return Math.min(Math.floor(completedLessons.size / 5), 30);
  };

  const getTotalTimeSpent = () => {
    return Object.values(timeTracking).reduce((total, lesson) => {
      let lessonTime = lesson.totalTime || 0;
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
            
            if (duration.includes(':')) {
              const [minutes, seconds] = duration.split(':').map(Number);
              totalSeconds = (minutes * 60) + seconds;
            } else {
              const hourMatch = duration.match(/(\d+)h/);
              const minuteMatch = duration.match(/(\d+)m/);
              const secondMatch = duration.match(/(\d+)s/);
              
              if (hourMatch) totalSeconds += parseInt(hourMatch[1]) * 3600;
              if (minuteMatch) totalSeconds += parseInt(minuteMatch[1]) * 60;
              if (secondMatch) totalSeconds += parseInt(secondMatch[1]);
            }
            
            totalExpected += totalSeconds * 1000;
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

  const getLessonTime = (weekNum, dayNum, lessonIdx) => {
    const lessonId = `${weekNum}-${dayNum}-${lessonIdx}`;
    const lessonTime = timeTracking[lessonId];
    
    if (!lessonTime) return 0;
    
    let totalTime = lessonTime.totalTime || 0;
    
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

  // Database-specific methods
  const getStorageStats = async () => {
    try {
      return await HybridDatabaseService.getStorageStats();
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {};
    }
  };

  const exportData = async () => {
    try {
      return await HybridDatabaseService.exportData();
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  };

  const clearAllData = async () => {
    try {
      await HybridDatabaseService.clearAllData();
      setCompletedLessons(new Set());
      setAuditTrail([]);
      setTimeTracking({});
      setDashboardFigures({});
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Initializing database...</p>
        </div>
      </div>
    );
  }

  return (
    <DatabaseProgressContext.Provider value={{
      // State
      isInitialized,
      completedLessons,
      auditTrail,
      timeTracking,
      dashboardFigures,
      loading,
      
      // Lesson methods
      toggleLesson,
      isLessonCompleted,
      
      // Progress methods
      getWeekProgress,
      getCurrentWeek,
      getStreak,
      getDayProgress,
      
      // Time methods
      getTotalTimeSpent,
      getExpectedTimeForCompleted,
      formatTime,
      startTimer: startLessonTimer,
      stopTimer: stopLessonTimer,
      startLessonTimer,
      stopLessonTimer,
      getLessonTime,
      isTimerActive,
      
      // Dashboard methods
      saveDashboardFigure,
      
      // Database methods
      getStorageStats,
      exportData,
      clearAllData,
      loadAllData,
      getAuditLogs: () => HybridDatabaseService.getAuditLogs(100),
      getPlannerItems: () => HybridDatabaseService.getData('plannerItems'),
      savePlannerItem: (item) => HybridDatabaseService.saveData('plannerItems', item),
      deletePlannerItem: (itemId) => HybridDatabaseService.deleteData('plannerItems', itemId),
      clearAuditLogs: () => HybridDatabaseService.clearCollection('auditLogs'),
      
      // Database service access
      HybridDatabaseService,
      
      // Connection status
      getConnectionStatus: () => HybridDatabaseService.getConnectionStatus()
    }}>
      {children}
    </DatabaseProgressContext.Provider>
  );
};
