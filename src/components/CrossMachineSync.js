import React, { useState, useEffect } from 'react';
import { useDatabaseProgress } from '../context/DatabaseProgressContext';
import HybridDatabaseService from '../services/hybridDatabaseService';

const CrossMachineSync = () => {
  const {
    completedLessons,
    timeTracking,
    dashboardFigures,
    loadData
  } = useDatabaseProgress();

  const [syncStatus, setSyncStatus] = useState({
    userId: null,
    isOnline: false,
    lastSync: null,
    syncInProgress: false
  });

  const [shareCode, setShareCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [syncResults, setSyncResults] = useState([]);

  useEffect(() => {
    updateSyncStatus();
    
    // Update status every 5 seconds
    const statusInterval = setInterval(updateSyncStatus, 5000);
    
    return () => clearInterval(statusInterval);
  }, []);

  const updateSyncStatus = () => {
    const status = HybridDatabaseService.getConnectionStatus();
    setSyncStatus(status);
    
    // Generate share code from user ID
    const persistentUserId = localStorage.getItem('persistent_user_id');
    if (persistentUserId) {
      setShareCode(btoa(persistentUserId).substring(0, 12).toUpperCase());
    }
  };

  const addSyncResult = (type, message, status = 'info') => {
    const result = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      status
    };
    setSyncResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  const forceSyncFromCloud = async () => {
    try {
      addSyncResult('force_sync', 'Starting force sync from cloud...', 'info');
      
      await HybridDatabaseService.syncFromCloud();
      await loadData();
      
      addSyncResult('force_sync', 'Force sync completed successfully', 'success');
      updateSyncStatus();
    } catch (error) {
      addSyncResult('force_sync', `Force sync failed: ${error.message}`, 'error');
    }
  };

  const syncToCloud = async () => {
    try {
      addSyncResult('sync_to_cloud', 'Starting sync to cloud...', 'info');
      
      await HybridDatabaseService.syncToCloud();
      
      addSyncResult('sync_to_cloud', 'Sync to cloud completed successfully', 'success');
      updateSyncStatus();
    } catch (error) {
      addSyncResult('sync_to_cloud', `Sync to cloud failed: ${error.message}`, 'error');
    }
  };

  const shareUserSession = async () => {
    try {
      const persistentUserId = localStorage.getItem('persistent_user_id');
      if (!persistentUserId) {
        addSyncResult('share_session', 'No user session to share', 'error');
        return;
      }

      // Save share info to cloud for other devices to find
      const shareInfo = {
        userId: persistentUserId,
        timestamp: Date.now(),
        deviceInfo: navigator.userAgent.substring(0, 100),
        shareCode: shareCode
      };

      await HybridDatabaseService.saveData('shared_sessions', shareInfo, shareCode);
      addSyncResult('share_session', `Session shared with code: ${shareCode}`, 'success');
      
    } catch (error) {
      addSyncResult('share_session', `Failed to share session: ${error.message}`, 'error');
    }
  };

  const joinSharedSession = async () => {
    if (!inputCode.trim()) {
      addSyncResult('join_session', 'Please enter a share code', 'error');
      return;
    }

    try {
      addSyncResult('join_session', `Attempting to join session: ${inputCode}`, 'info');
      
      // Get shared session info
      const shareInfo = await HybridDatabaseService.getData('shared_sessions', inputCode.toUpperCase());
      
      if (!shareInfo) {
        addSyncResult('join_session', 'Share code not found', 'error');
        return;
      }

      // Switch to shared user ID
      const sharedUserId = shareInfo.userId;
      localStorage.setItem('persistent_user_id', sharedUserId);
      
      // Reinitialize with new user ID
      await HybridDatabaseService.initialize();
      await loadData();
      
      addSyncResult('join_session', `Successfully joined shared session`, 'success');
      updateSyncStatus();
      setInputCode('');
      
    } catch (error) {
      addSyncResult('join_session', `Failed to join session: ${error.message}`, 'error');
    }
  };

  const resetToNewSession = () => {
    localStorage.removeItem('persistent_user_id');
    localStorage.removeItem('firebase_user_id');
    localStorage.removeItem('fallback_user_id');
    
    addSyncResult('reset_session', 'Session reset. Please refresh the page.', 'info');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return '#4CAF50';
      case 'error': return '#F44336';
      case 'warning': return '#FF9800';
      case 'info': return '#2196F3';
      default: return '#757575';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📋';
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>🔄 Cross-Machine Synchronization</h2>
      
      {/* Current Status */}
      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h3>Current Status</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          <div><strong>User ID:</strong> {syncStatus.userId || 'Not set'}</div>
          <div><strong>Online:</strong> {syncStatus.isOnline ? '✅ Connected' : '❌ Offline'}</div>
          <div><strong>Last Sync:</strong> {syncStatus.lastSync || 'Never'}</div>
          <div><strong>Sync in Progress:</strong> {syncStatus.syncInProgress ? '🔄 Yes' : '✅ No'}</div>
          <div><strong>Completed Lessons:</strong> {completedLessons.size}</div>
          <div><strong>Active Timers:</strong> {Object.values(timeTracking).filter(t => t?.isActive).length}</div>
        </div>
      </div>

      {/* Session Sharing */}
      <div style={{ 
        backgroundColor: '#e3f2fd', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h3>📱 Cross-Machine Session Sharing</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <h4>Share This Session</h4>
          <p>Share this code with another device to sync the same data:</p>
          <div style={{ 
            backgroundColor: '#fff', 
            padding: '10px', 
            border: '2px solid #2196F3',
            borderRadius: '5px',
            fontSize: '18px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '10px'
          }}>
            {shareCode || 'Generating...'}
          </div>
          <button
            onClick={shareUserSession}
            style={{
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            📤 Update Share Code
          </button>
        </div>

        <div>
          <h4>Join Shared Session</h4>
          <p>Enter a share code from another device:</p>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="Enter share code"
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px'
              }}
            />
            <button
              onClick={joinSharedSession}
              style={{
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              📥 Join Session
            </button>
          </div>
        </div>
      </div>

      {/* Sync Controls */}
      <div style={{ marginBottom: '20px' }}>
        <h3>🔄 Manual Sync Controls</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={forceSyncFromCloud}
            disabled={syncStatus.syncInProgress}
            style={{
              backgroundColor: syncStatus.syncInProgress ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: syncStatus.syncInProgress ? 'not-allowed' : 'pointer'
            }}
          >
            ⬇️ Force Sync From Cloud
          </button>
          
          <button
            onClick={syncToCloud}
            disabled={syncStatus.syncInProgress}
            style={{
              backgroundColor: syncStatus.syncInProgress ? '#ccc' : '#2196F3',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: syncStatus.syncInProgress ? 'not-allowed' : 'pointer'
            }}
          >
            ⬆️ Sync To Cloud
          </button>
          
          <button
            onClick={updateSyncStatus}
            style={{
              backgroundColor: '#FF9800',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🔍 Refresh Status
          </button>
          
          <button
            onClick={resetToNewSession}
            style={{
              backgroundColor: '#F44336',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🆕 Reset Session
          </button>
        </div>
      </div>

      {/* Sync Results */}
      <div>
        <h3>📊 Sync Results</h3>
        <div style={{ 
          maxHeight: '300px', 
          overflowY: 'auto',
          border: '1px solid #ddd',
          borderRadius: '5px'
        }}>
          {syncResults.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              No sync operations performed yet.
            </div>
          ) : (
            syncResults.map(result => (
              <div
                key={result.id}
                style={{
                  padding: '10px',
                  borderBottom: '1px solid #eee',
                  backgroundColor: result.status === 'error' ? '#ffebee' : 
                                 result.status === 'success' ? '#e8f5e8' :
                                 result.status === 'warning' ? '#fff3e0' : '#f3f8ff'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '16px' }}>
                    {getStatusIcon(result.status)}
                  </span>
                  <span style={{ 
                    fontWeight: 'bold',
                    color: getStatusColor(result.status)
                  }}>
                    {result.type.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '12px', color: '#666' }}>
                    {result.timestamp}
                  </span>
                </div>
                <div style={{ marginTop: '5px', marginLeft: '26px' }}>
                  {result.message}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Instructions */}
      <div style={{ 
        marginTop: '20px',
        backgroundColor: '#f9f9f9',
        padding: '15px',
        borderRadius: '8px'
      }}>
        <h4>📖 How to Use Cross-Machine Sync</h4>
        <ol>
          <li><strong>Share Session:</strong> Click "Update Share Code" and share the generated code with another device</li>
          <li><strong>Join Session:</strong> On another device, enter the share code and click "Join Session"</li>
          <li><strong>Automatic Sync:</strong> Both devices will now share the same data and sync automatically</li>
          <li><strong>Manual Sync:</strong> Use "Force Sync From Cloud" if data seems out of sync</li>
          <li><strong>Reset:</strong> Use "Reset Session" to start fresh with a new user ID</li>
        </ol>
      </div>
    </div>
  );
};

export default CrossMachineSync;
