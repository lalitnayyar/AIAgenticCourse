import React, { useState, useEffect } from "react";
import { HybridDatabaseService } from "../services/hybridDatabaseService";

const EnhancedPlanner = ({ plan }) => {
  const [planners, setPlanners] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [newPlan, setNewPlan] = useState({
    dayNum: 1,
    planType: 'task',
    content: '',
    priority: 'medium',
    dueDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadPlanners();
  }, [selectedWeek]);

  const loadPlanners = async () => {
    try {
      const plannersData = await HybridDatabaseService.getPlannersByWeek(selectedWeek);
      setPlanners(plannersData);
    } catch (error) {
      console.error('Error loading planners:', error);
    }
  };

  const handleAddPlan = async () => {
    if (!newPlan.content.trim()) return;

    const tempId = Date.now().toString();
    const newPlanItem = {
      id: tempId,
      weekNum: selectedWeek,
      dayNum: newPlan.dayNum,
      planType: newPlan.planType,
      content: newPlan.content,
      priority: newPlan.priority,
      dueDate: newPlan.dueDate || null,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add to UI immediately
    setPlanners(prev => [...prev, newPlanItem]);
    
    // Reset form immediately
    setNewPlan({
      dayNum: 1,
      planType: 'task',
      content: '',
      priority: 'medium',
      dueDate: ''
    });

    // Background persistence
    setTimeout(async () => {
      try {
        const savedPlan = await HybridDatabaseService.savePlanner(
          selectedWeek,
          newPlanItem.dayNum,
          newPlanItem.planType,
          newPlanItem.content,
          newPlanItem.priority,
          newPlanItem.dueDate
        );
        
        // Update with real ID if different
        if (savedPlan.id !== tempId) {
          setPlanners(prev => prev.map(p => 
            p.id === tempId ? { ...p, id: savedPlan.id } : p
          ));
        }
        
        // Background audit log
        HybridDatabaseService.logAuditAsync('planner_created', 'planners', savedPlan.id, {
          weekNum: selectedWeek,
          dayNum: newPlanItem.dayNum,
          planType: newPlanItem.planType,
          priority: newPlanItem.priority
        }).catch(() => {});
        
      } catch (error) {
        console.error('Background plan save failed:', error);
        // Remove from UI on error
        setPlanners(prev => prev.filter(p => p.id !== tempId));
      }
    }, 0);
  };

  const handleToggleComplete = async (plannerId, completed) => {
    try {
      // Update local state immediately
      setPlanners(prev => prev.map(p => 
        p.id === plannerId ? { ...p, completed: !completed } : p
      ));
      
      // Background persistence
      setTimeout(async () => {
        try {
          await HybridDatabaseService.updatePlanner(plannerId, { completed: !completed });
          // Background audit log
          HybridDatabaseService.logAuditAsync('planner_toggled', 'planners', plannerId, {
            completed: !completed
          }).catch(() => {});
        } catch (error) {
          console.error('Background planner update failed:', error);
          // Reload on error
          loadPlanners();
        }
      }, 0);

    } catch (error) {
      console.error('Error toggling plan completion:', error);
    }
  };

  const handleDeletePlan = async (plannerId) => {
    try {
      // Remove from UI immediately
      const planToDelete = planners.find(p => p.id === plannerId);
      setPlanners(prev => prev.filter(p => p.id !== plannerId));
      
      // Background deletion
      setTimeout(async () => {
        try {
          await HybridDatabaseService.deletePlanner(plannerId);
        } catch (error) {
          console.error('Background plan deletion failed:', error);
          // Restore on error
          if (planToDelete) {
            setPlanners(prev => [...prev, planToDelete]);
          }
        }
      }, 0);
      
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  };

  const handleUpdatePlan = async (plannerId, updates) => {
    try {
      // Update UI immediately
      setPlanners(prev => prev.map(p => 
        p.id === plannerId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      ));
      
      // Background persistence
      setTimeout(async () => {
        try {
          await HybridDatabaseService.updatePlanner(plannerId, updates);
        } catch (error) {
          console.error('Background plan update failed:', error);
          // Reload on error
          loadPlanners();
        }
      }, 0);
      
    } catch (error) {
      console.error('Error updating plan:', error);
    }
  };

  const currentWeek = plan.weeks.find(w => w.week === selectedWeek);
  
  const filteredPlanners = planners.filter(planner => {
    switch (filter) {
      case 'completed': return planner.completed;
      case 'pending': return !planner.completed;
      case 'high': return planner.priority === 'high';
      case 'medium': return planner.priority === 'medium';
      case 'low': return planner.priority === 'low';
      default: return true;
    }
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-900/20';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20';
      case 'low': return 'text-green-400 bg-green-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getPlanTypeIcon = (planType) => {
    switch (planType) {
      case 'task': return '📋';
      case 'study': return '📚';
      case 'review': return '🔍';
      case 'practice': return '💻';
      case 'meeting': return '🤝';
      case 'deadline': return '⏰';
      default: return '📝';
    }
  };

  const completedCount = planners.filter(p => p.completed).length;
  const highPriorityCount = planners.filter(p => p.priority === 'high' && !p.completed).length;

  return (
    <div className="p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen text-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Enhanced Learning Planner
        </h2>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold">{planners.length}</div>
            <div className="text-sm opacity-90">Total Plans</div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold">{completedCount}</div>
            <div className="text-sm opacity-90">Completed</div>
          </div>
          <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold">{highPriorityCount}</div>
            <div className="text-sm opacity-90">High Priority</div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold">
              {planners.length > 0 ? Math.round((completedCount / planners.length) * 100) : 0}%
            </div>
            <div className="text-sm opacity-90">Completion Rate</div>
          </div>
        </div>

        {/* Week Selection and Filters */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Select Week:</label>
              <select
                value={selectedWeek}
                onChange={e => setSelectedWeek(Number(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
              >
                {plan.weeks.map(week => (
                  <option key={week.week} value={week.week}>
                    Week {week.week}: {week.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Filter Plans:</label>
              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Plans</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  // Immediate visual feedback
                  setLoading(true);
                  setTimeout(() => setLoading(false), 200);
                  // Background refresh
                  setTimeout(() => loadPlanners(), 0);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
                disabled={loading}
              >
                {loading ? '🔄 Refreshing...' : '🔄 Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Add New Plan */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <h3 className="text-xl font-bold mb-4 text-green-400">📝 Add New Plan</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Day:</label>
              <select
                value={newPlan.dayNum}
                onChange={e => setNewPlan({...newPlan, dayNum: Number(e.target.value)})}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-green-500"
              >
                {currentWeek?.days.map(day => (
                  <option key={day.day} value={day.day}>
                    Day {day.day}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Type:</label>
              <select
                value={newPlan.planType}
                onChange={e => setNewPlan({...newPlan, planType: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-green-500"
              >
                <option value="task">Task</option>
                <option value="study">Study</option>
                <option value="review">Review</option>
                <option value="practice">Practice</option>
                <option value="meeting">Meeting</option>
                <option value="deadline">Deadline</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Priority:</label>
              <select
                value={newPlan.priority}
                onChange={e => setNewPlan({...newPlan, priority: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-green-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Due Date:</label>
              <input
                type="date"
                value={newPlan.dueDate}
                onChange={e => setNewPlan({...newPlan, dueDate: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAddPlan}
                disabled={!newPlan.content.trim() || loading}
                className={`w-full font-bold py-2 px-4 rounded-lg transition ${
                  newPlan.content.trim() && !loading
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {loading ? '➕ Adding...' : '➕ Add Plan'}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Plan Content:</label>
            <textarea
              value={newPlan.content}
              onChange={e => setNewPlan({...newPlan, content: e.target.value})}
              placeholder="Describe your plan, task, or goal..."
              className="w-full h-24 bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>
        </div>

        {/* Plans List */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4 text-blue-400">
            📅 Plans for Week {selectedWeek} ({filteredPlanners.length} {filter !== 'all' ? `${filter} ` : ''}plans)
          </h3>
          
          {filteredPlanners.length > 0 ? (
            <div className="space-y-4">
              {filteredPlanners.map((planner) => (
                <div
                  key={planner.id}
                  className={`bg-gray-700 rounded-lg p-4 transition-all ${
                    planner.completed ? 'opacity-75' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <button
                        onClick={() => handleToggleComplete(planner.id, planner.completed)}
                        className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                          planner.completed
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-400 hover:border-green-400'
                        }`}
                      >
                        {planner.completed && '✓'}
                      </button>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{getPlanTypeIcon(planner.planType)}</span>
                          <span className="font-semibold">Day {planner.dayNum}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(planner.priority)}`}>
                            {planner.priority.toUpperCase()}
                          </span>
                          {planner.dueDate && (
                            <span className="text-xs text-gray-400">
                              Due: {new Date(planner.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        
                        <p className={`text-gray-200 leading-relaxed ${
                          planner.completed ? 'line-through' : ''
                        }`}>
                          {planner.content}
                        </p>
                        
                        <div className="text-xs text-gray-500 mt-2">
                          Created: {new Date(planner.createdAt).toLocaleDateString()}
                          {planner.updatedAt !== planner.createdAt && (
                            <span> • Updated: {new Date(planner.updatedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => {
                          const newContent = prompt('Edit plan content:', planner.content);
                          if (newContent && newContent !== planner.content) {
                            handleUpdatePlan(planner.id, { content: newContent });
                          }
                        }}
                        className="text-blue-400 hover:text-blue-300 p-1 rounded hover:bg-blue-900/20 transition"
                        title="Edit plan"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this plan?')) {
                            handleDeletePlan(planner.id);
                          }
                        }}
                        className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-900/20 transition"
                        title="Delete plan"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-4">📋</div>
              <p>No plans found for the selected criteria.</p>
              <p className="text-sm mt-2">Add a new plan to get started!</p>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="mt-8 bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-6">
          <h4 className="text-lg font-bold mb-2 text-yellow-400">💡 Planning Tips</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Use different plan types to categorize your activities</li>
            <li>• Set priorities to focus on what matters most</li>
            <li>• Add due dates for time-sensitive tasks</li>
            <li>• Review and update your plans regularly</li>
            <li>• Break down large tasks into smaller, manageable plans</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EnhancedPlanner;
