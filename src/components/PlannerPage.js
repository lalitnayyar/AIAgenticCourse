import React, { useState, useEffect } from 'react';
import { useDatabaseProgress } from '../context/DatabaseProgressContext';

const PlannerPage = ({ plan }) => {
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [liveTimers, setLiveTimers] = useState({});
  const [plannerItems, setPlannerItems] = useState([]);
  const [newItem, setNewItem] = useState({ title: '', priority: 'medium', dueDate: '' });

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
    toggleLesson, 
    timeTracking, 
    startTimer, 
    stopTimer,
    getLessonTime,
    isTimerActive,
    formatTime,
    savePlannerItem,
    getPlannerItems,
    deletePlannerItem
  } = useDatabaseProgress();

  useEffect(() => {
    loadPlannerItems();
  }, []);

  // Load fresh data when component mounts - optimized for speed
  useEffect(() => {
    const loadFreshData = async () => {
      try {
        // Load planner items only
        await loadPlannerItems();
      } catch (error) {
        console.error('Error loading fresh data:', error);
      }
    };
    
    loadFreshData();
  }, []);

  // Live timer updater once per second for currently selected week
  useEffect(() => {
    const interval = setInterval(() => {
      const updated = {};
      const week = activePlan.weeks.find(w => w.week === selectedWeek);
      if (week) {
        week.days.forEach((day, dayIndex) => {
          day.lessons.forEach((lesson, lessonIndex) => {
            if (isTimerActive(selectedWeek, dayIndex + 1, lessonIndex)) {
              const key = `${selectedWeek}-${dayIndex + 1}-${lessonIndex}`;
              updated[key] = getLessonTime(selectedWeek, dayIndex + 1, lessonIndex);
            }
          });
        });
      }
      setLiveTimers(updated);
    }, 1000);
    return () => clearInterval(interval);
  }, [activePlan, selectedWeek, isTimerActive, getLessonTime]);

  const getDisplayTime = (weekNum, dayNum, lessonIdx) => {
    const key = `${weekNum}-${dayNum}-${lessonIdx}`;
    const active = isTimerActive(weekNum, dayNum, lessonIdx);
    if (active && liveTimers[key] !== undefined) return liveTimers[key];
    return getLessonTime(weekNum, dayNum, lessonIdx);
  };

  // Listen for external data changes and refresh
  useEffect(() => {
    const handleDataRefresh = () => {
      console.log('🔄 Planner: Received data refresh event');
      loadPlannerItems();
    };

    window.addEventListener('plannerRefresh', handleDataRefresh);
    return () => {
      window.removeEventListener('plannerRefresh', handleDataRefresh);
    };
  }, []);

  const loadPlannerItems = async () => {
    try {
      const items = await getPlannerItems();
      setPlannerItems(items || []);
    } catch (error) {
      console.error('Error loading planner items:', error);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.title.trim()) return;
    
    const item = {
      id: Date.now().toString(),
      title: newItem.title,
      priority: newItem.priority,
      dueDate: newItem.dueDate,
      completed: false,
      createdAt: new Date().toISOString()
    };
    
    // Add to UI immediately
    setPlannerItems(prev => [...prev, item]);
    setNewItem({ title: '', priority: 'medium', dueDate: '' });
    
    // Background persistence
    setTimeout(async () => {
      try {
        await savePlannerItem(item);
      } catch (error) {
        console.error('Background planner item save failed:', error);
        // Remove from UI on error
        setPlannerItems(prev => prev.filter(p => p.id !== item.id));
      }
    }, 0);
  };

  const handleDeleteItem = async (itemId) => {
    try {
      // Remove from UI immediately
      const itemToDelete = plannerItems.find(p => p.id === itemId);
      setPlannerItems(prev => prev.filter(p => p.id !== itemId));
      
      // Background deletion
      setTimeout(async () => {
        try {
          await deletePlannerItem(itemId);
        } catch (error) {
          console.error('Background planner item deletion failed:', error);
          // Restore on error
          if (itemToDelete) {
            setPlannerItems(prev => [...prev, itemToDelete]);
          }
        }
      }, 0);
      
    } catch (error) {
      console.error('Error deleting planner item:', error);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const currentWeek = activePlan.weeks.find(w => w.week === selectedWeek);

  return (
    <div className="p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen text-white">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          📅 Learning Planner
        </h1>

        {/* Week Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Select Week</h2>
          <div className="flex flex-wrap gap-2">
            {activePlan.weeks.map((week) => (
              <button
                key={week.week}
                onClick={() => setSelectedWeek(week.week)}
                className={`px-4 py-2 rounded-lg transition ${
                  selectedWeek === week.week
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Week {week.week}
              </button>
            ))}
          </div>
        </div>

        {/* Current Week Lessons */}
        {currentWeek && (
          <div className="mb-8 bg-gray-800 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4">Week {selectedWeek}: {currentWeek.title}</h2>
            <p className="text-gray-400 mb-6">{currentWeek.description}</p>
            
            {currentWeek.days.map((day, dayIndex) => (
              <div key={dayIndex} className="mb-6">
                <h3 className="text-xl font-semibold mb-3 text-cyan-400">
                  Day {dayIndex + 1} ({day.lessons.length} lessons)
                </h3>
                <div className="grid gap-3">
                  {day.lessons.map((lesson, lessonIndex) => {
                    const lessonId = `${selectedWeek}-${dayIndex + 1}-${lessonIndex}`;
                    const isCompleted = completedLessons.has(lessonId);
                    const isTimerActive = timeTracking[lessonId]?.isActive;
                    
                    return (
                      <div
                        key={lessonIndex}
                        className={`p-4 rounded-lg border transition ${
                          isCompleted
                            ? 'bg-green-900/50 border-green-500'
                            : 'bg-gray-700 border-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={isCompleted}
                              onChange={() => {
                                // Immediate toggle - no await for instant response
                                toggleLesson(selectedWeek, dayIndex + 1, lessonIndex, lesson.title);
                              }}
                              className="w-5 h-5 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                            />
                            <div>
                              <h4 className="font-medium">{lesson.title}</h4>
                              <p className="text-sm text-gray-400">Duration: {lesson.duration}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm ${isTimerActive ? 'text-green-300' : 'text-gray-400'}`}>
                              {(() => {
                                const ms = getDisplayTime(selectedWeek, dayIndex + 1, lessonIndex);
                                return ms > 0 ? formatTime(ms) : '0s';
                              })()}
                            </span>
                            <button
                              onClick={() =>
                                isTimerActive
                                  ? stopTimer(selectedWeek, dayIndex + 1, lessonIndex, lesson.title)
                                  : startTimer(selectedWeek, dayIndex + 1, lessonIndex, lesson.title)
                              }
                              className={`px-3 py-1 rounded text-sm ${
                                isTimerActive
                                  ? 'bg-red-600 hover:bg-red-700'
                                  : 'bg-blue-600 hover:bg-blue-700'
                              }`}
                            >
                              {isTimerActive ? '⏹️ Stop' : '▶️ Start'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Planner Items */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">📋 My Planner</h2>
          
          {/* Add New Item */}
          <div className="mb-6 p-4 bg-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Add New Task</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                placeholder="Task title"
                value={newItem.title}
                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                className="bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
              />
              <select
                value={newItem.priority}
                onChange={(e) => setNewItem({ ...newItem, priority: e.target.value })}
                className="bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <input
                type="date"
                value={newItem.dueDate}
                onChange={(e) => setNewItem({ ...newItem, dueDate: e.target.value })}
                className="bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
              />
              <button
                onClick={handleAddItem}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white transition"
              >
                ➕ Add Task
              </button>
            </div>
          </div>

          {/* Planner Items List */}
          <div className="space-y-3">
            {plannerItems.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No planner items yet. Add your first task above!</p>
            ) : (
              plannerItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-lg border transition ${
                    item.completed
                      ? 'bg-green-900/50 border-green-500'
                      : 'bg-gray-700 border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor(item.priority)}`}></div>
                      <div>
                        <h4 className={`font-medium ${item.completed ? 'line-through text-gray-400' : ''}`}>
                          {item.title}
                        </h4>
                        {item.dueDate && (
                          <p className="text-sm text-gray-400">Due: {item.dueDate}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(item.priority)} text-white`}>
                        {item.priority}
                      </span>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-400 hover:text-red-300 px-2 py-1"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlannerPage;
