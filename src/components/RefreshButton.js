import React, { useState } from 'react';
import HybridDatabaseService from '../services/hybridDatabaseService';

const RefreshButton = ({ onRefreshComplete }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      console.log('🔄 Manual refresh initiated...');
      const result = await HybridDatabaseService.refreshAllData();
      
      if (result.success) {
        setLastRefresh(new Date());
        console.log('✅ Refresh completed successfully');
        
        if (onRefreshComplete) {
          onRefreshComplete(result);
        }
        
        // Show success notification
        if (window.showNotification) {
          window.showNotification('Data refreshed successfully!', 'success');
        }
      } else {
        console.error('❌ Refresh failed:', result.error);
        if (window.showNotification) {
          window.showNotification(`Refresh failed: ${result.error}`, 'error');
        }
      }
    } catch (error) {
      console.error('❌ Refresh error:', error);
      if (window.showNotification) {
        window.showNotification(`Refresh error: ${error.message}`, 'error');
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className={`
          flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
          ${isRefreshing 
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg'
          }
        `}
        title="Refresh data from cloud to sync across devices"
      >
        <svg 
          className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
          />
        </svg>
        <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
      </button>
      
      {lastRefresh && (
        <span className="text-xs text-gray-400">
          Last: {lastRefresh.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

export default RefreshButton;
