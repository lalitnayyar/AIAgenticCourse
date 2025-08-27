import React, { useState, useEffect } from 'react';
import { useDatabaseProgress } from '../context/DatabaseProgressContext';

const AuditLogPage = () => {
  const [auditLogs, setAuditLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [filters, setFilters] = useState({
    type: 'all',
    dateRange: 'all',
    search: ''
  });
  const [loading, setLoading] = useState(true);
  const { getAuditLogs, clearAuditLogs } = useDatabaseProgress();

  useEffect(() => {
    loadAuditLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [auditLogs, filters]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const logs = await getAuditLogs();
      setAuditLogs(logs || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...auditLogs];

    // Filter by type
    if (filters.type !== 'all') {
      filtered = filtered.filter(log => log.type === filters.type);
    }

    // Filter by date range
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          cutoffDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        default:
          break;
      }
      
      filtered = filtered.filter(log => new Date(log.timestamp) >= cutoffDate);
    }

    // Filter by search term
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(log => 
        log.action.toLowerCase().includes(searchLower) ||
        log.details.toLowerCase().includes(searchLower) ||
        log.username?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    setFilteredLogs(filtered);
  };

  const handleClearLogs = async () => {
    if (window.confirm('Are you sure you want to clear all audit logs? This action cannot be undone.')) {
      try {
        await clearAuditLogs();
        await loadAuditLogs();
      } catch (error) {
        console.error('Error clearing audit logs:', error);
      }
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'login': return '🔐';
      case 'logout': return '🚪';
      case 'progress': return '📈';
      case 'timer': return '⏱️';
      case 'system': return '⚙️';
      case 'error': return '❌';
      case 'admin': return '👑';
      default: return '📝';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'login': return 'bg-green-900 text-green-300 border-green-500';
      case 'logout': return 'bg-blue-900 text-blue-300 border-blue-500';
      case 'progress': return 'bg-purple-900 text-purple-300 border-purple-500';
      case 'timer': return 'bg-yellow-900 text-yellow-300 border-yellow-500';
      case 'system': return 'bg-gray-900 text-gray-300 border-gray-500';
      case 'error': return 'bg-red-900 text-red-300 border-red-500';
      case 'admin': return 'bg-orange-900 text-orange-300 border-orange-500';
      default: return 'bg-gray-900 text-gray-300 border-gray-500';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen text-white">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen text-white">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-yellow-400 to-red-500 bg-clip-text text-transparent">
          📋 Audit Log
        </h1>

        {/* Controls */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              {/* Type Filter */}
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              >
                <option value="all">All Types</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="progress">Progress</option>
                <option value="timer">Timer</option>
                <option value="system">System</option>
                <option value="admin">Admin</option>
                <option value="error">Error</option>
              </select>

              {/* Date Range Filter */}
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
              </select>

              {/* Search */}
              <input
                type="text"
                placeholder="Search logs..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white min-w-64"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={exportLogs}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white transition"
              >
                📥 Export
              </button>
              <button
                onClick={loadAuditLogs}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-white transition"
              >
                🔄 Refresh
              </button>
              <button
                onClick={handleClearLogs}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white transition"
              >
                🗑️ Clear All
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-4 flex gap-6 text-sm text-gray-400">
            <span>Total Logs: {auditLogs.length}</span>
            <span>Filtered: {filteredLogs.length}</span>
            <span>Types: {new Set(auditLogs.map(log => log.type)).size}</span>
          </div>
        </div>

        {/* Logs List */}
        <div className="space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-8 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold mb-2">No Audit Logs Found</h3>
              <p className="text-gray-400">
                {auditLogs.length === 0 
                  ? 'No audit logs have been recorded yet.'
                  : 'No logs match your current filters.'
                }
              </p>
            </div>
          ) : (
            filteredLogs.map((log, index) => (
              <div
                key={index}
                className={`rounded-lg border p-4 transition hover:bg-opacity-80 ${getTypeColor(log.type)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{getTypeIcon(log.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold">{log.action}</h3>
                        <span className="px-2 py-1 rounded text-xs bg-black bg-opacity-30">
                          {log.type}
                        </span>
                      </div>
                      <p className="text-sm opacity-90 mb-2">{log.details}</p>
                      <div className="flex items-center space-x-4 text-xs opacity-75">
                        {log.username && (
                          <span>👤 {log.username}</span>
                        )}
                        {log.deviceId && (
                          <span>📱 {log.deviceId.substring(0, 8)}...</span>
                        )}
                        {log.sessionId && (
                          <span>🔑 Session: {log.sessionId.substring(0, 8)}...</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm opacity-75">
                    <div>{formatTimestamp(log.timestamp)}</div>
                    <div className="text-xs">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More (if needed for pagination) */}
        {filteredLogs.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              Showing {filteredLogs.length} of {auditLogs.length} total logs
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogPage;
