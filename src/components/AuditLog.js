import React, { useState, useEffect } from "react";
import { HybridDatabaseService } from "../services/hybridDatabaseService";

const AuditLog = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState('today');
  const [loading, setLoading] = useState(false);
  const [storageStats, setStorageStats] = useState({});

  useEffect(() => {
    loadAuditData();
    loadStorageStats();
  }, [filter, dateRange]);

  const loadAuditData = async () => {
    setLoading(true);
    try {
      // Load audit logs
      const logs = await HybridDatabaseService.getAuditLogs(200, filter === 'all' ? null : filter);
      const filteredLogs = filterByDateRange(logs);
      setAuditLogs(filteredLogs);

      // Load events
      const eventData = await HybridDatabaseService.getEvents(200, filter === 'all' ? null : filter);
      const filteredEvents = filterByDateRange(eventData);
      setEvents(filteredEvents);

    } catch (error) {
      console.error('Error loading audit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStorageStats = async () => {
    try {
      const stats = await HybridDatabaseService.getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error('Error loading storage stats:', error);
    }
  };

  const filterByDateRange = (data) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    return data.filter(item => {
      const itemDate = new Date(item.timestamp);
      switch (dateRange) {
        case 'today':
          return itemDate >= today;
        case 'yesterday':
          return itemDate >= yesterday && itemDate < today;
        case 'week':
          return itemDate >= weekAgo;
        case 'all':
        default:
          return true;
      }
    });
  };

  const exportData = async () => {
    try {
      setLoading(true);
      const exportedData = await HybridDatabaseService.exportData();
      
      const dataStr = JSON.stringify(exportedData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `learning-portal-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Log export event
      await HybridDatabaseService.logEvent('data_exported', 'system', {
        exportedAt: new Date().toISOString(),
        recordCount: Object.values(storageStats).reduce((sum, count) => sum + count, 0)
      });

      await loadAuditData();
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error exporting data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearAllData = async () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      try {
        setLoading(true);
        await HybridDatabaseService.clearAllData();
        setAuditLogs([]);
        setEvents([]);
        setStorageStats({});
        alert('All data has been cleared successfully.');
      } catch (error) {
        console.error('Error clearing data:', error);
        alert('Error clearing data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'lesson_completed': return '✅';
      case 'lesson_uncompleted': return '❌';
      case 'timer_started': return '▶️';
      case 'timer_stopped': return '⏹️';
      case 'note_created': return '📝';
      case 'note_updated': return '✏️';
      case 'note_deleted': return '🗑️';
      case 'planner_created': return '📅';
      case 'planner_updated': return '📝';
      case 'planner_deleted': return '🗑️';
      case 'data_exported': return '💾';
      case 'migration_completed': return '🔄';
      default: return '📊';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'lesson': return 'text-green-400 bg-green-900/20';
      case 'notes': return 'text-blue-400 bg-blue-900/20';
      case 'planners': return 'text-purple-400 bg-purple-900/20';
      case 'dashboard': return 'text-yellow-400 bg-yellow-900/20';
      case 'system': return 'text-red-400 bg-red-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  return (
    <div className="p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen text-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Audit Log & System Analytics
        </h2>

        {/* Storage Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          {Object.entries(storageStats).map(([table, count]) => (
            <div key={table} className="bg-gradient-to-r from-gray-700 to-gray-600 rounded-xl p-6 text-center">
              <div className="text-2xl font-bold">{count}</div>
              <div className="text-sm opacity-90 capitalize">
                {table.replace(/([A-Z])/g, ' $1').trim()}
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Filter by Category:</label>
              <select
                value={filter}
                onChange={e => setFilter(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="lesson">Lessons</option>
                <option value="notes">Notes</option>
                <option value="planners">Planners</option>
                <option value="dashboard">Dashboard</option>
                <option value="system">System</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date Range:</label>
              <select
                value={dateRange}
                onChange={e => setDateRange(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">Last Week</option>
                <option value="all">All Time</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={exportData}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
              >
                💾 Export Data
              </button>
            </div>
            <div className="flex items-end">
              <button
                onClick={clearAllData}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50"
              >
                🗑️ Clear All Data
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Loading audit data...</p>
          </div>
        )}

        {/* Audit Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4 text-blue-400">📋 Audit Logs ({auditLogs.length})</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {auditLogs.length > 0 ? (
                auditLogs.map((log, idx) => (
                  <div key={log.id || idx} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-xl mt-1">{getActionIcon(log.action)}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">
                            {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(log.entityType)}`}>
                            {log.entityType}
                          </span>
                        </div>
                        <div className="text-sm text-gray-300 mb-2">
                          Entity ID: {log.entityId}
                        </div>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="text-xs text-gray-400 bg-gray-600 rounded p-2 mb-2">
                            {Object.entries(log.details).map(([key, value]) => (
                              <div key={key}>
                                <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No audit logs found for the selected criteria.
                </div>
              )}
            </div>
          </div>

          {/* Events */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4 text-purple-400">📊 Events ({events.length})</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {events.length > 0 ? (
                events.map((event, idx) => (
                  <div key={event.id || idx} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-xl mt-1">{getActionIcon(event.eventType)}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">
                            {event.eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(event.category)}`}>
                            {event.category}
                          </span>
                        </div>
                        {event.data && Object.keys(event.data).length > 0 && (
                          <div className="text-xs text-gray-400 bg-gray-600 rounded p-2 mb-2">
                            {Object.entries(event.data).slice(0, 3).map(([key, value]) => (
                              <div key={key}>
                                <strong>{key}:</strong> {typeof value === 'object' ? JSON.stringify(value).substring(0, 50) + '...' : String(value)}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 flex justify-between">
                          <span>{new Date(event.timestamp).toLocaleString()}</span>
                          <span>Session: {event.sessionId?.substring(0, 8)}...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No events found for the selected criteria.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4 text-green-400">🔧 System Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-blue-400">Database Status</h4>
              <div className="text-sm space-y-1">
                <div>Status: <span className="text-green-400">Connected</span></div>
                <div>Total Records: <span className="text-yellow-400">{Object.values(storageStats).reduce((sum, count) => sum + count, 0)}</span></div>
                <div>Last Updated: <span className="text-gray-400">{new Date().toLocaleString()}</span></div>
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-purple-400">Performance</h4>
              <div className="text-sm space-y-1">
                <div>Load Time: <span className="text-green-400">Fast</span></div>
                <div>Storage Type: <span className="text-blue-400">IndexedDB</span></div>
                <div>Sync Status: <span className="text-yellow-400">Local Only</span></div>
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-orange-400">Actions</h4>
              <div className="space-y-2">
                <button
                  onClick={loadAuditData}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-1 px-3 rounded transition"
                >
                  🔄 Refresh Data
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white text-sm py-1 px-3 rounded transition"
                >
                  ↻ Reload App
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-6">
          <h4 className="text-lg font-bold mb-2 text-yellow-400">💡 Audit Log Features</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• All user actions are automatically logged with timestamps</li>
            <li>• Export your data regularly for backup purposes</li>
            <li>• Use filters to find specific activities or time periods</li>
            <li>• System events track application performance and usage</li>
            <li>• Data is stored locally in your browser's IndexedDB</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AuditLog;
