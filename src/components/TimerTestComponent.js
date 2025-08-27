import React, { useState, useEffect } from 'react';
import { useDatabaseProgress } from '../context/DatabaseProgressContext';

const TimerTestComponent = () => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testLessonId, setTestLessonId] = useState('timer-test-1-1-0');
  const [realTimeDisplay, setRealTimeDisplay] = useState({});

  const {
    timeTracking,
    isTimerActive,
    startLessonTimer,
    stopLessonTimer,
    getLessonTime,
    formatTime
  } = useDatabaseProgress();

  // Real-time timer display update
  useEffect(() => {
    const interval = setInterval(() => {
      const [weekNum, dayNum, lessonIdx] = testLessonId.split('-').slice(-3).map(Number);
      const currentTime = getLessonTime(weekNum, dayNum, lessonIdx);
      const isActive = isTimerActive(weekNum, dayNum, lessonIdx);
      
      setRealTimeDisplay({
        currentTime,
        isActive,
        formatted: formatTime(currentTime)
      });
    }, 100); // Update every 100ms for smooth display

    return () => clearInterval(interval);
  }, [testLessonId, getLessonTime, isTimerActive, formatTime]);

  const addResult = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, { timestamp, message, type }]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const runTimerTest = async () => {
    setIsRunning(true);
    clearResults();
    
    const [weekNum, dayNum, lessonIdx] = testLessonId.split('-').slice(-3).map(Number);
    const lessonTitle = `Timer Test Lesson ${testLessonId}`;
    
    try {
      addResult('🧪 Starting comprehensive timer test...', 'info');
      
      // Test 1: Initial state
      addResult('📋 Test 1: Checking initial timer state', 'info');
      const initialActive = isTimerActive(weekNum, dayNum, lessonIdx);
      const initialTime = getLessonTime(weekNum, dayNum, lessonIdx);
      addResult(`Initial state - Active: ${initialActive}, Time: ${formatTime(initialTime)}`, 'info');
      
      // Test 2: Start timer
      addResult('▶️ Test 2: Starting timer', 'info');
      await startLessonTimer(weekNum, dayNum, lessonIdx, lessonTitle);
      
      // Wait and check if timer started
      await new Promise(resolve => setTimeout(resolve, 500));
      const afterStartActive = isTimerActive(weekNum, dayNum, lessonIdx);
      const afterStartTime = getLessonTime(weekNum, dayNum, lessonIdx);
      
      if (afterStartActive) {
        addResult('✅ Timer started successfully', 'success');
      } else {
        addResult('❌ Timer failed to start', 'error');
        return;
      }
      
      // Test 3: Let timer run for 3 seconds
      addResult('⏱️ Test 3: Running timer for 3 seconds...', 'info');
      for (let i = 3; i > 0; i--) {
        addResult(`Timer running... ${i} seconds remaining`, 'info');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const currentTime = getLessonTime(weekNum, dayNum, lessonIdx);
        addResult(`Current time: ${formatTime(currentTime)}`, 'info');
      }
      
      // Test 4: Stop timer
      addResult('⏹️ Test 4: Stopping timer', 'info');
      const beforeStopTime = getLessonTime(weekNum, dayNum, lessonIdx);
      await stopLessonTimer(weekNum, dayNum, lessonIdx, lessonTitle);
      
      // Wait and check if timer stopped
      await new Promise(resolve => setTimeout(resolve, 500));
      const afterStopActive = isTimerActive(weekNum, dayNum, lessonIdx);
      const afterStopTime = getLessonTime(weekNum, dayNum, lessonIdx);
      
      if (!afterStopActive) {
        addResult('✅ Timer stopped successfully', 'success');
      } else {
        addResult('❌ Timer failed to stop', 'error');
      }
      
      // Test 5: Verify time calculation
      addResult('🧮 Test 5: Verifying time calculations', 'info');
      addResult(`Time before stop: ${formatTime(beforeStopTime)}`, 'info');
      addResult(`Time after stop: ${formatTime(afterStopTime)}`, 'info');
      
      if (afterStopTime >= 3000) { // Should be at least 3 seconds
        addResult('✅ Time calculation correct (≥3 seconds)', 'success');
      } else {
        addResult(`❌ Time calculation incorrect (${formatTime(afterStopTime)} < 3 seconds)`, 'error');
      }
      
      // Test 6: Start timer again (cumulative test)
      addResult('🔄 Test 6: Testing cumulative time tracking', 'info');
      await startLessonTimer(weekNum, dayNum, lessonIdx, lessonTitle);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Run for 2 more seconds
      await stopLessonTimer(weekNum, dayNum, lessonIdx, lessonTitle);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      const finalTime = getLessonTime(weekNum, dayNum, lessonIdx);
      addResult(`Final cumulative time: ${formatTime(finalTime)}`, 'info');
      
      if (finalTime >= 5000) { // Should be at least 5 seconds total
        addResult('✅ Cumulative time tracking working correctly', 'success');
      } else {
        addResult(`❌ Cumulative time tracking failed (${formatTime(finalTime)} < 5 seconds)`, 'error');
      }
      
      addResult('🎉 Timer test completed!', 'success');
      
    } catch (error) {
      addResult(`❌ Timer test failed: ${error.message}`, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  const manualTimerToggle = async () => {
    const [weekNum, dayNum, lessonIdx] = testLessonId.split('-').slice(-3).map(Number);
    const lessonTitle = `Manual Test ${testLessonId}`;
    const isActive = isTimerActive(weekNum, dayNum, lessonIdx);
    
    try {
      if (isActive) {
        addResult('⏹️ Manually stopping timer', 'info');
        await stopLessonTimer(weekNum, dayNum, lessonIdx, lessonTitle);
      } else {
        addResult('▶️ Manually starting timer', 'info');
        await startLessonTimer(weekNum, dayNum, lessonIdx, lessonTitle);
      }
    } catch (error) {
      addResult(`❌ Manual toggle failed: ${error.message}`, 'error');
    }
  };

  const checkTimerState = () => {
    const [weekNum, dayNum, lessonIdx] = testLessonId.split('-').slice(-3).map(Number);
    const isActive = isTimerActive(weekNum, dayNum, lessonIdx);
    const currentTime = getLessonTime(weekNum, dayNum, lessonIdx);
    const trackingData = timeTracking[testLessonId];
    
    addResult('📊 Current Timer State:', 'info');
    addResult(`- Active: ${isActive}`, 'info');
    addResult(`- Current Time: ${formatTime(currentTime)}`, 'info');
    addResult(`- Raw Tracking Data: ${JSON.stringify(trackingData, null, 2)}`, 'info');
  };

  return (
    <div className="p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen text-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
          ⏱️ Timer Test Suite
        </h2>

        {/* Test Controls */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Test Lesson ID:</label>
              <input
                type="text"
                value={testLessonId}
                onChange={e => setTestLessonId(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., timer-test-1-1-0"
                disabled={isRunning}
              />
            </div>
            
            <div className="flex items-end gap-2">
              <button
                onClick={runTimerTest}
                disabled={isRunning}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                {isRunning ? '🔄 Running...' : '🧪 Run Full Test'}
              </button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={manualTimerToggle}
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              {realTimeDisplay.isActive ? '⏹️ Stop Timer' : '▶️ Start Timer'}
            </button>
            <button
              onClick={checkTimerState}
              disabled={isRunning}
              className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              📊 Check State
            </button>
            <button
              onClick={clearResults}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              🗑️ Clear
            </button>
          </div>
        </div>

        {/* Real-time Timer Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`rounded-xl p-6 text-center ${
            realTimeDisplay.isActive 
              ? 'bg-gradient-to-r from-green-500 to-green-600' 
              : 'bg-gradient-to-r from-gray-500 to-gray-600'
          }`}>
            <div className="text-2xl font-bold">
              {realTimeDisplay.isActive ? '🟢 ACTIVE' : '🔴 STOPPED'}
            </div>
            <div className="text-sm opacity-90">Timer Status</div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-center">
            <div className="text-2xl font-bold font-mono">
              {realTimeDisplay.formatted || '0s'}
            </div>
            <div className="text-sm opacity-90">Current Time</div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-center">
            <div className="text-2xl font-bold">
              {testLessonId.split('-').slice(-3).join('-')}
            </div>
            <div className="text-sm opacity-90">Test Lesson</div>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-orange-400">🔍 Test Results</h3>
            <div className="text-sm text-gray-400">
              {testResults.length} entries
            </div>
          </div>
          
          <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
            {testResults.length === 0 ? (
              <div className="text-gray-500 italic">No test results yet. Run a test to see output.</div>
            ) : (
              testResults.map((result, idx) => (
                <div key={idx} className={`mb-1 ${
                  result.type === 'error' ? 'text-red-400' :
                  result.type === 'success' ? 'text-green-400' :
                  result.type === 'warning' ? 'text-yellow-400' :
                  'text-gray-300'
                }`}>
                  <span className="text-gray-500">[{result.timestamp}]</span> {result.message}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-6">
          <h4 className="text-lg font-bold mb-2 text-yellow-400">🔧 Testing Instructions</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• <strong>Run Full Test:</strong> Comprehensive automated test of timer functionality</li>
            <li>• <strong>Manual Toggle:</strong> Manually start/stop timer to test button behavior</li>
            <li>• <strong>Check State:</strong> View current timer state and raw data</li>
            <li>• <strong>Real-time Display:</strong> Shows live timer status and current time</li>
            <li>• Watch browser console for detailed logging during timer operations</li>
            <li>• Test verifies: start/stop functionality, time calculations, cumulative tracking, and data storage</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TimerTestComponent;
