import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import HybridDatabaseService from '../services/hybridDatabaseService';
import consoleLogService from '../services/consoleLogService';

const Navigation = () => {
  const { user, logout, isAdmin } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [logCount, setLogCount] = useState(0);
  const [loggingEnabled, setLoggingEnabled] = useState(false);

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

  useEffect(() => {
    // Update log count on mount
    setLogCount(consoleLogService.getLogCount());
    
    // Check if logging is enabled
    setLoggingEnabled(consoleLogService.isCapturing);

    // Listen for log updates
    const handleLogCaptured = (event) => {
      setLogCount(event.detail.totalLogs);
    };

    const handleLogsCleared = () => {
      setLogCount(0);
    };

    window.addEventListener('consoleLogCaptured', handleLogCaptured);
    window.addEventListener('consoleLogsCleared', handleLogsCleared);

    return () => {
      window.removeEventListener('consoleLogCaptured', handleLogCaptured);
      window.removeEventListener('consoleLogsCleared', handleLogsCleared);
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('🔄 Manual force sync triggered...');
      
      // Force comprehensive data sync
      if (HybridDatabaseService.isOnline) {
        console.log('☁️ Starting comprehensive data synchronization...');
        
        // Sync all progress data first
        const progressData = await HybridDatabaseService.getAllProgress();
        console.log(`📊 Force synced ${progressData.length} progress records`);
        
        // Force sync from cloud
        await HybridDatabaseService.syncFromCloud();
        console.log('☁️ Cloud sync completed');
        
        // Trigger dashboard refresh
        window.dispatchEvent(new CustomEvent('dashboardRefresh'));
        console.log('🔄 Dashboard refresh triggered');
        
        alert(`✅ Data sync completed! Synced ${progressData.length} progress records.`);
      } else {
        console.log('📴 Offline - cannot sync with cloud');
        alert('⚠️ Device is offline. Cannot sync with cloud.');
      }
      
      // Reload the page to refresh all data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('❌ Force sync failed:', error);
      alert('❌ Sync failed. Please check console logs and try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDownloadLogs = () => {
    const result = consoleLogService.downloadLogs();
    console.log(`📄 ${result}`);
  };

  const handleClearLogs = () => {
    if (window.confirm('Clear all captured console logs?')) {
      consoleLogService.clearLogs();
      console.log('🗑️ Console logs cleared');
    }
  };

  const toggleLogging = () => {
    if (loggingEnabled) {
      consoleLogService.stopCapturing();
      setLoggingEnabled(false);
      console.log('📴 Console logging disabled');
    } else {
      consoleLogService.startCapturing();
      setLoggingEnabled(true);
      console.log('📱 Console logging enabled');
    }
  };

  return (
    <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo/Title */}
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Learning Portal
          </h1>
          <div className="hidden md:flex space-x-4 items-center">
            <a href="/" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition">
              🏠 Dashboard
            </a>
            <a href="/planner" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition">
              📅 Planner
            </a>
            <a href="/schedule" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition">
              📅 Schedule
            </a>
            <a href="/audit" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
              Audit Log
            </a>
            <a href="/debug" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
              Session Debug
            </a>
            <a href="/progress" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition">
              📊 Progress
            </a>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              {refreshing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Syncing...
                </>
              ) : (
                <>
                  <span>🔄</span>
                  Force Sync
                </>
              )}
            </button>
            
            {/* Console Log Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleLogging}
                className={`${loggingEnabled ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'} text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-2`}
                title={loggingEnabled ? "Disable console logging" : "Enable console logging"}
              >
                <span>{loggingEnabled ? '📴' : '📱'}</span>
                {loggingEnabled ? 'Disable' : 'Enable'} Logs
              </button>
              <button
                onClick={handleDownloadLogs}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
                title="Download console logs for troubleshooting"
                disabled={!loggingEnabled}
              >
                <span>📄</span>
                Logs ({logCount})
              </button>
              <button
                onClick={handleClearLogs}
                className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-2 rounded-lg transition-colors"
                title="Clear captured logs"
                disabled={!loggingEnabled}
              >
                🗑️
              </button>
            </div>

            {/* Emergency Data Recovery Button */}
            <button
              onClick={async () => {
                if (window.DataRecoveryService) {
                  const result = await window.DataRecoveryService.forceDataRefresh();
                  if (result.success) {
                    alert('Data recovery completed! Page will reload.');
                  } else {
                    alert(`Recovery failed: ${result.error}`);
                  }
                } else {
                  window.location.reload();
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors flex items-center gap-2"
              title="Emergency data recovery and page reload"
            >
              <span>🚨</span>
              Recovery
            </button>
            {isAdmin() && (
              <>
                <a href="/users" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition">
                  👥 Users
                </a>
                <a href="/reset" className="text-red-300 hover:text-red-200 px-3 py-2 rounded-md text-sm font-medium transition">
                  🗑️ Reset DB
                </a>
              </>
            )}
          </div>
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-300">
            <span className="text-gray-500">Welcome,</span>
            <span className="font-semibold text-white ml-1">{user?.username}</span>
            {user?.role === 'admin' && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                ADMIN
              </span>
            )}
          </div>
          
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition transform hover:scale-105"
          >
            🚪 Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
