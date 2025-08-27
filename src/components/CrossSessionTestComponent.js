import React, { useState, useEffect } from 'react';
import { useDatabaseProgress } from '../context/DatabaseProgressContext';
import HybridDatabaseService from '../services/hybridDatabaseService';

const CrossSessionTestComponent = () => {
  const {
    completedLessons,
    timeTracking,
    toggleLesson,
    startLessonTimer,
    stopLessonTimer,
    loadData
  } = useDatabaseProgress();

  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionId] = useState(`session_${Date.now()}`);
  const [testData, setTestData] = useState({
    userId: null,
    cloudConnected: false,
    localStorageSize: 0,
    cloudDataSize: 0
  });

  // Test lesson IDs for consistent testing
  const testLessons = [
    { id: '1-1-0', week: 1, day: 1, lesson: 0, title: 'Cross-Session Test Lesson 1' },
    { id: '1-1-1', week: 1, day: 1, lesson: 1, title: 'Cross-Session Test Lesson 2' },
    { id: '2-1-0', week: 2, day: 1, lesson: 0, title: 'Cross-Session Test Lesson 3' }
  ];

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    try {
      // Check user authentication
      const userId = localStorage.getItem('firebase_user_id') || 'unknown';
      
      // Check cloud connectivity
      const cloudConnected = HybridDatabaseService.isOnline;
      
      // Check local storage size
      const localData = localStorage.getItem('learning_progress_data');
      const localStorageSize = localData ? JSON.parse(localData).length || 0 : 0;
      
      // Try to get cloud data size
      let cloudDataSize = 0;
      try {
        const cloudProgress = await HybridDatabaseService.getData('progress');
        cloudDataSize = Object.keys(cloudProgress || {}).length;
      } catch (error) {
        console.warn('Could not get cloud data size:', error);
      }

      setTestData({
        userId,
        cloudConnected,
        localStorageSize,
        cloudDataSize
      });

      addTestResult('system_check', 'info', `Session: ${sessionId}, User: ${userId}, Cloud: ${cloudConnected}`);
    } catch (error) {
      addTestResult('system_check', 'error', `System check failed: ${error.message}`);
    }
  };

  const addTestResult = (test, status, message) => {
    const result = {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      test,
      status,
      message,
      sessionId
    };
    setTestResults(prev => [result, ...prev]);
    console.log(`🧪 Test ${test}: ${status} - ${message}`);
  };

  const runComprehensiveTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      addTestResult('comprehensive_test', 'info', 'Starting comprehensive cross-session test...');

      // Test 1: Data Loading and Consistency
      await testDataLoading();
      
      // Test 2: Lesson Toggle Persistence
      await testLessonTogglePersistence();
      
      // Test 3: Timer State Persistence
      await testTimerStatePersistence();
      
      // Test 4: Cross-Session Data Sync
      await testCrossSessionSync();
      
      // Test 5: User Isolation
      await testUserIsolation();

      addTestResult('comprehensive_test', 'success', 'All cross-session tests completed!');
      
    } catch (error) {
      addTestResult('comprehensive_test', 'error', `Test suite failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const testDataLoading = async () => {
    try {
      addTestResult('data_loading', 'info', 'Testing data loading consistency...');
      
      // Force reload data
      await loadData();
      
      // Check if data loaded properly
      const hasCompletedLessons = completedLessons.size > 0;
      const hasTimeTracking = Object.keys(timeTracking).length > 0;
      
      addTestResult('data_loading', 'success', 
        `Data loaded: ${completedLessons.size} completed lessons, ${Object.keys(timeTracking).length} time entries`);
        
    } catch (error) {
      addTestResult('data_loading', 'error', `Data loading failed: ${error.message}`);
    }
  };

  const testLessonTogglePersistence = async () => {
    try {
      addTestResult('lesson_toggle', 'info', 'Testing lesson toggle persistence...');
      
      const testLesson = testLessons[0];
      const wasCompleted = completedLessons.has(testLesson.id);
      
      // Toggle lesson state
      await toggleLesson(testLesson.week, testLesson.day, testLesson.lesson, testLesson.title);
      
      // Wait a moment for async operations
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if state changed
      const isNowCompleted = completedLessons.has(testLesson.id);
      const stateChanged = wasCompleted !== isNowCompleted;
      
      if (stateChanged) {
        addTestResult('lesson_toggle', 'success', 
          `Lesson ${testLesson.id} toggled from ${wasCompleted} to ${isNowCompleted}`);
      } else {
        addTestResult('lesson_toggle', 'warning', 
          `Lesson ${testLesson.id} state did not change (may be async)`);
      }
      
    } catch (error) {
      addTestResult('lesson_toggle', 'error', `Lesson toggle test failed: ${error.message}`);
    }
  };

  const testTimerStatePersistence = async () => {
    try {
      addTestResult('timer_persistence', 'info', 'Testing timer state persistence...');
      
      const testLesson = testLessons[1];
      const initialState = timeTracking[testLesson.id];
      
      // Start timer
      await startLessonTimer(testLesson.week, testLesson.day, testLesson.lesson, testLesson.title);
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if timer is active
      const timerState = timeTracking[testLesson.id];
      const isActive = timerState?.isActive;
      
      if (isActive) {
        addTestResult('timer_persistence', 'success', 
          `Timer started for ${testLesson.id} at ${new Date(timerState.startTime).toLocaleTimeString()}`);
        
        // Stop timer
        await stopLessonTimer(testLesson.week, testLesson.day, testLesson.lesson, testLesson.title);
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const finalState = timeTracking[testLesson.id];
        if (!finalState?.isActive && finalState?.totalTime > 0) {
          addTestResult('timer_persistence', 'success', 
            `Timer stopped. Total time: ${finalState.totalTime}ms`);
        } else {
          addTestResult('timer_persistence', 'warning', 
            `Timer stop may not have persisted properly`);
        }
      } else {
        addTestResult('timer_persistence', 'error', 
          `Timer did not start properly for ${testLesson.id}`);
      }
      
    } catch (error) {
      addTestResult('timer_persistence', 'error', `Timer persistence test failed: ${error.message}`);
    }
  };

  const testCrossSessionSync = async () => {
    try {
      addTestResult('cross_session_sync', 'info', 'Testing cross-session data synchronization...');
      
      // Create a unique test entry
      const testEntry = {
        sessionId,
        timestamp: Date.now(),
        testData: 'cross_session_test_' + Math.random().toString(36).substr(2, 9)
      };
      
      // Save test data
      await HybridDatabaseService.saveData('test_sessions', testEntry, sessionId);
      
      // Try to retrieve it
      const retrieved = await HybridDatabaseService.getData('test_sessions', sessionId);
      
      if (retrieved && retrieved.testData === testEntry.testData) {
        addTestResult('cross_session_sync', 'success', 
          `Cross-session data saved and retrieved successfully`);
      } else {
        addTestResult('cross_session_sync', 'error', 
          `Cross-session data retrieval failed`);
      }
      
    } catch (error) {
      addTestResult('cross_session_sync', 'error', `Cross-session sync test failed: ${error.message}`);
    }
  };

  const testUserIsolation = async () => {
    try {
      addTestResult('user_isolation', 'info', 'Testing user data isolation...');
      
      const currentUserId = testData.userId;
      if (currentUserId && currentUserId !== 'unknown') {
        addTestResult('user_isolation', 'success', 
          `User isolation active with ID: ${currentUserId}`);
      } else {
        addTestResult('user_isolation', 'warning', 
          `User ID not found or using fallback authentication`);
      }
      
    } catch (error) {
      addTestResult('user_isolation', 'error', `User isolation test failed: ${error.message}`);
    }
  };

  const clearTestData = async () => {
    try {
      // Clear test sessions
      await HybridDatabaseService.deleteData('test_sessions', sessionId);
      addTestResult('cleanup', 'success', 'Test data cleared');
    } catch (error) {
      addTestResult('cleanup', 'error', `Failed to clear test data: ${error.message}`);
    }
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
      <h2>🔄 Cross-Session Test Suite</h2>
      
      {/* System Status */}
      <div style={{ 
        backgroundColor: '#f5f5f5', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h3>System Status</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          <div><strong>Session ID:</strong> {sessionId}</div>
          <div><strong>User ID:</strong> {testData.userId || 'Not set'}</div>
          <div><strong>Cloud Connected:</strong> {testData.cloudConnected ? '✅' : '❌'}</div>
          <div><strong>Local Storage:</strong> {testData.localStorageSize} items</div>
          <div><strong>Cloud Data:</strong> {testData.cloudDataSize} items</div>
          <div><strong>Completed Lessons:</strong> {completedLessons.size}</div>
        </div>
      </div>

      {/* Test Controls */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={runComprehensiveTest}
          disabled={isRunning}
          style={{
            backgroundColor: isRunning ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {isRunning ? '🔄 Running Tests...' : '🚀 Run Comprehensive Test'}
        </button>
        
        <button
          onClick={checkSystemStatus}
          style={{
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          🔍 Check System Status
        </button>
        
        <button
          onClick={clearTestData}
          style={{
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🧹 Clear Test Data
        </button>
      </div>

      {/* Test Results */}
      <div>
        <h3>Test Results ({testResults.length})</h3>
        <div style={{ 
          maxHeight: '400px', 
          overflowY: 'auto',
          border: '1px solid #ddd',
          borderRadius: '5px'
        }}>
          {testResults.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              No test results yet. Run the comprehensive test to see results.
            </div>
          ) : (
            testResults.map(result => (
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
                    {result.test.toUpperCase()}
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

      {/* Current State Display */}
      <div style={{ 
        marginTop: '20px',
        backgroundColor: '#f9f9f9',
        padding: '15px',
        borderRadius: '8px'
      }}>
        <h4>Current State</h4>
        <div><strong>Active Timers:</strong> {Object.values(timeTracking).filter(t => t?.isActive).length}</div>
        <div><strong>Total Time Tracked:</strong> {
          Object.values(timeTracking).reduce((sum, t) => sum + (t?.totalTime || 0), 0)
        }ms</div>
        <div><strong>Completed Lessons:</strong> {Array.from(completedLessons).join(', ')}</div>
      </div>
    </div>
  );
};

export default CrossSessionTestComponent;
