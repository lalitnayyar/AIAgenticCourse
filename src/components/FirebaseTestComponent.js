import React, { useState, useEffect } from 'react';
import { useDatabaseProgress } from '../context/DatabaseProgressContext';
import { FirebaseTestService } from '../services/firebaseTestService';
import { HybridDatabaseService } from '../services/hybridDatabaseService';

const FirebaseTestComponent = () => {
  const [testResults, setTestResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [debugLog, setDebugLog] = useState([]);
  const [selectedTest, setSelectedTest] = useState('comprehensive');
  const [testLessonId, setTestLessonId] = useState('test-1-1-0');

  const {
    completedLessons,
    toggleLesson,
    isLessonCompleted,
    getConnectionStatus
  } = useDatabaseProgress();

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLog(prev => [...prev, { timestamp, message, type }]);
  };

  const clearLog = () => {
    setDebugLog([]);
  };

  const runComprehensiveTest = async () => {
    setIsRunning(true);
    clearLog();
    addLog('🚀 Starting comprehensive Firebase test...', 'info');
    
    try {
      const results = await FirebaseTestService.runComprehensiveTest();
      setTestResults(results);
      addLog(`✅ Test completed: ${results.passed} passed, ${results.failed} failed`, 'success');
    } catch (error) {
      addLog(`❌ Test failed: ${error.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const runSingleActivityTest = async () => {
    setIsRunning(true);
    addLog(`🔄 Testing single activity toggle for ${testLessonId}...`, 'info');
    
    try {
      const [weekNum, dayNum, lessonIdx] = testLessonId.split('-').map(Number);
      const success = await FirebaseTestService.testSingleActivityToggle(
        weekNum, dayNum, lessonIdx, `Test Lesson ${testLessonId}`
      );
      
      if (success) {
        addLog('✅ Single activity test passed', 'success');
      } else {
        addLog('❌ Single activity test failed', 'error');
      }
    } catch (error) {
      addLog(`❌ Single activity test error: ${error.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const debugStorageFlow = async () => {
    setIsRunning(true);
    addLog(`🔍 Debugging storage flow for ${testLessonId}...`, 'info');
    
    try {
      const [weekNum, dayNum, lessonIdx] = testLessonId.split('-').map(Number);
      const result = await FirebaseTestService.debugStorageFlow(
        testLessonId, weekNum, dayNum, lessonIdx, 'completed'
      );
      
      result.steps.forEach(step => {
        addLog(step, result.success ? 'info' : 'error');
      });
      
      if (result.success) {
        addLog('✅ Storage flow debug completed', 'success');
      } else {
        addLog(`❌ Storage flow debug failed: ${result.error}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Debug error: ${error.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const testRealActivityToggle = async () => {
    setIsRunning(true);
    addLog(`🎯 Testing real activity toggle for ${testLessonId}...`, 'info');
    
    try {
      const [weekNum, dayNum, lessonIdx] = testLessonId.split('-').map(Number);
      const wasCompleted = isLessonCompleted(weekNum, dayNum, lessonIdx);
      
      addLog(`Current state: ${wasCompleted ? 'completed' : 'not completed'}`, 'info');
      
      // Toggle the lesson
      await toggleLesson(weekNum, dayNum, lessonIdx, `Test Lesson ${testLessonId}`);
      
      // Wait a moment for state to update
      setTimeout(() => {
        const newState = isLessonCompleted(weekNum, dayNum, lessonIdx);
        addLog(`New state: ${newState ? 'completed' : 'not completed'}`, 'info');
        
        if (newState !== wasCompleted) {
          addLog('✅ Real activity toggle successful', 'success');
        } else {
          addLog('❌ Real activity toggle failed - state unchanged', 'error');
        }
        setIsRunning(false);
      }, 1000);
      
    } catch (error) {
      addLog(`❌ Real activity toggle error: ${error.message}`, 'error');
      setIsRunning(false);
    }
  };

  const checkStorageStats = async () => {
    addLog('📊 Checking storage statistics...', 'info');
    
    try {
      const stats = await HybridDatabaseService.getStorageStats();
      addLog(`Storage stats: ${JSON.stringify(stats, null, 2)}`, 'info');
      
      const connectionStatus = getConnectionStatus();
      addLog(`Connection status: ${JSON.stringify(connectionStatus, null, 2)}`, 'info');
      
      const allProgress = await HybridDatabaseService.getAllProgress();
      addLog(`Total progress records: ${allProgress.length}`, 'info');
      
      const testProgress = allProgress.find(p => p.lessonId === testLessonId);
      if (testProgress) {
        addLog(`Test lesson progress: ${JSON.stringify(testProgress, null, 2)}`, 'info');
      } else {
        addLog(`No progress found for ${testLessonId}`, 'warning');
      }
      
    } catch (error) {
      addLog(`❌ Storage stats error: ${error.message}`, 'error');
    }
  };

  const runSelectedTest = () => {
    switch (selectedTest) {
      case 'comprehensive':
        runComprehensiveTest();
        break;
      case 'single':
        runSingleActivityTest();
        break;
      case 'debug':
        debugStorageFlow();
        break;
      case 'real':
        testRealActivityToggle();
        break;
      default:
        addLog('Unknown test selected', 'error');
    }
  };

  return (
    <div className="p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen text-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent">
          🧪 Firebase Storage Test Suite
        </h2>

        {/* Test Controls */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Test Type:</label>
              <select
                value={selectedTest}
                onChange={e => setSelectedTest(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
                disabled={isRunning}
              >
                <option value="comprehensive">Comprehensive Test</option>
                <option value="single">Single Activity Test</option>
                <option value="debug">Debug Storage Flow</option>
                <option value="real">Real Activity Toggle</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Test Lesson ID:</label>
              <input
                type="text"
                value={testLessonId}
                onChange={e => setTestLessonId(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., test-1-1-0"
                disabled={isRunning}
              />
            </div>
            
            <div className="flex items-end gap-2">
              <button
                onClick={runSelectedTest}
                disabled={isRunning}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                {isRunning ? '🔄 Running...' : '🚀 Run Test'}
              </button>
              <button
                onClick={checkStorageStats}
                disabled={isRunning}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                📊 Stats
              </button>
            </div>
          </div>
        </div>

        {/* Current Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-center">
            <div className="text-2xl font-bold">{completedLessons.size}</div>
            <div className="text-sm opacity-90">Completed Lessons</div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-center">
            <div className="text-2xl font-bold">
              {isLessonCompleted(...testLessonId.split('-').map(Number)) ? '✅' : '❌'}
            </div>
            <div className="text-sm opacity-90">Test Lesson Status</div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-center">
            <div className="text-2xl font-bold">{getConnectionStatus()?.isOnline ? '🌐' : '📴'}</div>
            <div className="text-sm opacity-90">Connection Status</div>
          </div>
        </div>

        {/* Test Results */}
        {testResults && (
          <div className="bg-gray-800 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold mb-4 text-green-400">📋 Test Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-green-900 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{testResults.passed}</div>
                <div className="text-sm">Passed</div>
              </div>
              <div className="bg-red-900 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{testResults.failed}</div>
                <div className="text-sm">Failed</div>
              </div>
              <div className="bg-blue-900 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{testResults.tests.length}</div>
                <div className="text-sm">Total Tests</div>
              </div>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {testResults.tests.map((test, idx) => (
                <div key={idx} className={`p-3 rounded-lg ${
                  test.status === 'PASSED' ? 'bg-green-900' : 
                  test.status === 'WARNING' ? 'bg-yellow-900' : 'bg-red-900'
                }`}>
                  <div className="font-medium">
                    {test.status === 'PASSED' ? '✅' : test.status === 'WARNING' ? '⚠️' : '❌'} {test.name}
                  </div>
                  <div className="text-sm opacity-75">{test.details}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Debug Log */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-orange-400">🔍 Debug Log</h3>
            <button
              onClick={clearLog}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm transition"
            >
              Clear Log
            </button>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
            {debugLog.length === 0 ? (
              <div className="text-gray-500 italic">No log entries yet. Run a test to see debug information.</div>
            ) : (
              debugLog.map((entry, idx) => (
                <div key={idx} className={`mb-1 ${
                  entry.type === 'error' ? 'text-red-400' :
                  entry.type === 'success' ? 'text-green-400' :
                  entry.type === 'warning' ? 'text-yellow-400' :
                  'text-gray-300'
                }`}>
                  <span className="text-gray-500">[{entry.timestamp}]</span> {entry.message}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-6">
          <h4 className="text-lg font-bold mb-2 text-yellow-400">🔧 Testing Instructions</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• <strong>Comprehensive Test:</strong> Runs all Firebase storage and retrieval tests</li>
            <li>• <strong>Single Activity Test:</strong> Tests activity completion toggle for a specific lesson</li>
            <li>• <strong>Debug Storage Flow:</strong> Traces the complete storage process step by step</li>
            <li>• <strong>Real Activity Toggle:</strong> Tests the actual UI toggle functionality</li>
            <li>• <strong>Stats:</strong> Shows current storage statistics and connection status</li>
            <li>• Check browser console for additional debug information</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FirebaseTestComponent;
