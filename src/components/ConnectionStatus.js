import React, { useState, useEffect } from 'react';
import { useDatabaseProgress } from '../context/DatabaseProgressContext';

const ConnectionStatus = () => {
  const { getConnectionStatus } = useDatabaseProgress();
  const [status, setStatus] = useState({
    isOnline: false,
    lastSync: null,
    syncInProgress: false,
    userId: null
  });

  useEffect(() => {
    const updateStatus = () => {
      if (getConnectionStatus) {
        setStatus(getConnectionStatus());
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 5000); // Update every 5 seconds

    // Listen for immediate connection status changes from service
    const onConnChange = (e) => {
      setStatus(prev => ({ ...prev, isOnline: !!(e?.detail?.isOnline) }));
    };
    window.addEventListener('connectionStatusChanged', onConnChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('connectionStatusChanged', onConnChange);
    };
  }, [getConnectionStatus]);

  const formatLastSync = (lastSync) => {
    if (!lastSync) return 'Never';
    const date = new Date(lastSync);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex items-center space-x-2 text-sm">
      {/* Connection Indicator */}
      <div className="flex items-center space-x-1">
        <div 
          className={`w-2 h-2 rounded-full ${
            status.isOnline ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span className={status.isOnline ? 'text-green-600' : 'text-red-600'}>
          {status.isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Sync Status */}
      {status.syncInProgress && (
        <div className="flex items-center space-x-1 text-blue-600">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          <span>Syncing...</span>
        </div>
      )}

      {/* Last Sync */}
      <span className="text-gray-500">
        Last sync: {formatLastSync(status.lastSync)}
      </span>

      {/* User ID (shortened) */}
      {status.userId && (
        <span className="text-gray-400 text-xs">
          ID: {status.userId.substring(0, 8)}...
        </span>
      )}
    </div>
  );
};

export default ConnectionStatus;
