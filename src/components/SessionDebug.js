import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import HybridDatabaseService from '../services/hybridDatabaseService';

const SessionDebug = () => {
  const { user, isAuthenticated } = useAuth();
  const [sessionInfo, setSessionInfo] = useState(null);
  const [userSessions, setUserSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    updateSessionInfo();
  }, [isAuthenticated, user]);

  const updateSessionInfo = async () => {
    try {
      const authService = (await import('../services/authService')).default;
      const info = authService.getCurrentSessionInfo();
      setSessionInfo(info);
    } catch (error) {
      console.error('Failed to get session info:', error);
    }
  };

  const loadUserSessions = async () => {
    try {
      const authService = (await import('../services/authService')).default;
      if (!user || !authService.isAdmin()) return;
      
      setLoading(true);
      const sessions = await authService.getUserSessions(user.username);
      setUserSessions(sessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (sessionToken) => {
    try {
      const { authService } = await import('../services/authService');
      if (!user || !authService.isAdmin()) return;
      
      await authService.revokeSession(user.username, sessionToken);
      await loadUserSessions(); // Refresh the list
    } catch (error) {
      console.error('Error revoking session:', error);
    }
  };

  const cleanupSessions = async () => {
    try {
      const { authService } = await import('../services/authService');
      if (!authService.isAdmin()) return;
      
      setLoading(true);
      const result = await authService.cleanupExpiredSessions();
      console.log(result.message);
      await loadUserSessions(); // Refresh the list
    } catch (error) {
      console.error('Error cleaning up sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const testCrossMachineSync = async () => {
    setLoading(true);
    try {
      console.log('🧪 Testing cross-machine sync...');
      
      // Force refresh data from cloud
      const refreshResult = await HybridDatabaseService.refreshAllData();
      console.log('Refresh result:', refreshResult);
      
      // Force sync auth data
      const { authService } = await import('../services/authService');
      const syncResult = await authService.forceSync();
      console.log('Sync result:', syncResult);
      
      // Update session info
      await updateSessionInfo();
      
      if (authService.isAdmin()) {
        await loadUserSessions();
      }
      
      alert('Cross-machine sync test completed! Check console for details.');
    } catch (error) {
      console.error('Cross-machine sync test failed:', error);
      alert(`Sync test failed: ${error.message}`);
    }
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '20px', border: '1px solid #ddd', margin: '10px', borderRadius: '5px' }}>
        <h3>🔐 Session Debug - Not Authenticated</h3>
        <p>Please login to view session information.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', margin: '10px', borderRadius: '5px' }}>
      <h3>🔐 Session Debug Information</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <h4>Current Session</h4>
        {sessionInfo && (
          <div style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '3px' }}>
            <p><strong>User:</strong> {sessionInfo.currentUser?.username} ({sessionInfo.currentUser?.role})</p>
            <p><strong>Device ID:</strong> {sessionInfo.deviceId}</p>
            <p><strong>Session Token:</strong> {sessionInfo.sessionToken}</p>
            <p><strong>Authenticated:</strong> {sessionInfo.isAuthenticated ? '✅ Yes' : '❌ No'}</p>
            <p><strong>User Agent:</strong> {sessionInfo.userAgent}</p>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>Session Limits</h4>
        <div style={{ backgroundColor: '#e8f4fd', padding: '10px', borderRadius: '3px' }}>
          <p><strong>Regular Users:</strong> Maximum 4 concurrent sessions</p>
          <p><strong>Admin Users:</strong> Unlimited concurrent sessions</p>
          <p><strong>Your Limit:</strong> {user?.role === 'admin' ? 'Unlimited' : '4 sessions'}</p>
        </div>
      </div>

      {authService.isAdmin() && (
        <div style={{ marginBottom: '20px' }}>
          <h4>Admin Session Management</h4>
          <div style={{ marginBottom: '10px' }}>
            <button 
              onClick={loadUserSessions}
              disabled={loading}
              style={{ 
                padding: '8px 16px', 
                marginRight: '10px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              {loading ? 'Loading...' : 'Load My Sessions'}
            </button>
            <button 
              onClick={cleanupSessions}
              disabled={loading}
              style={{ 
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              Cleanup Expired Sessions
            </button>
            <button 
              onClick={testCrossMachineSync}
              disabled={loading}
              style={{ 
                padding: '8px 16px',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              🧪 Test Cross-Machine Sync
            </button>
          </div>

          {userSessions.length > 0 && (
            <div style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '3px' }}>
              <h5>Active Sessions ({userSessions.length})</h5>
              {userSessions.map((session, index) => (
                <div key={index} style={{ 
                  border: '1px solid #dee2e6', 
                  padding: '8px', 
                  margin: '5px 0', 
                  borderRadius: '3px',
                  backgroundColor: 'white'
                }}>
                  <p><strong>Device:</strong> {session.deviceId}</p>
                  <p><strong>Created:</strong> {new Date(session.createdAt).toLocaleString()}</p>
                  <p><strong>Last Used:</strong> {new Date(session.lastUsed).toLocaleString()}</p>
                  <p><strong>User Agent:</strong> {session.userAgent}</p>
                  <button 
                    onClick={() => revokeSession(session.token)}
                    style={{ 
                      padding: '4px 8px',
                      backgroundColor: '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Revoke Session
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p><strong>Instructions for Cross-Device Testing:</strong></p>
        <ol>
          <li>Create a user on this machine using User Management</li>
          <li>Click "🧪 Test Cross-Machine Sync" to force sync data to Firebase</li>
          <li>On another PC/browser, open the portal and click "Refresh" button</li>
          <li>Login with the same credentials - should work on both machines</li>
          <li>Check browser console for detailed authentication logs</li>
          <li>Admin users have unlimited sessions, regular users limited to 4</li>
        </ol>
        <p><strong>Troubleshooting:</strong></p>
        <ul>
          <li>If user not found on another machine, click Refresh button first</li>
          <li>Check Firebase console to verify user data is stored in 'portal_users' collection</li>
          <li>Ensure both machines have internet connection for Firebase sync</li>
        </ul>
      </div>
    </div>
  );
};

export default SessionDebug;
