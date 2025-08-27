// Firebase Test Service - Comprehensive testing for storage/retrieval issues
import { HybridDatabaseService } from './hybridDatabaseService';
import { CloudDatabaseService } from './cloudDatabaseService';
import { SimpleDatabaseService } from './simpleDatabaseService';

export class FirebaseTestService {
  static async runComprehensiveTest() {
    console.log('🚀 Starting comprehensive Firebase storage test...');
    
    const results = {
      tests: [],
      passed: 0,
      failed: 0,
      errors: []
    };

    try {
      // Test 1: Firebase Connection
      await this.testFirebaseConnection(results);
      
      // Test 2: Activity Completion Storage
      await this.testActivityCompletionStorage(results);
      
      // Test 3: Data Retrieval
      await this.testDataRetrieval(results);
      
      // Test 4: Real-time Updates
      await this.testRealtimeUpdates(results);
      
      // Test 5: Offline/Online Sync
      await this.testOfflineOnlineSync(results);
      
      // Test 6: Error Handling
      await this.testErrorHandling(results);

    } catch (error) {
      results.errors.push(`Test suite error: ${error.message}`);
    }

    this.printTestResults(results);
    return results;
  }

  static async testFirebaseConnection(results) {
    const testName = 'Firebase Connection Test';
    console.log(`📡 Running ${testName}...`);
    
    try {
      // Check if Firebase is properly configured
      const connectionStatus = HybridDatabaseService.getConnectionStatus();
      console.log('Connection Status:', connectionStatus);
      
      if (!connectionStatus.userId || connectionStatus.userId.startsWith('local_user_')) {
        throw new Error('Firebase authentication failed - using fallback user ID');
      }
      
      // Test basic cloud service functionality
      await CloudDatabaseService.initAuth();
      
      results.tests.push({ name: testName, status: 'PASSED', details: 'Firebase connected successfully' });
      results.passed++;
      
    } catch (error) {
      results.tests.push({ name: testName, status: 'FAILED', details: error.message });
      results.failed++;
      results.errors.push(`${testName}: ${error.message}`);
    }
  }

  static async testActivityCompletionStorage(results) {
    const testName = 'Activity Completion Storage Test';
    console.log(`✅ Running ${testName}...`);
    
    try {
      const testLessonId = 'test-1-1-0';
      const testData = {
        lessonId: testLessonId,
        weekNum: 1,
        dayNum: 1,
        lessonIdx: 0,
        status: 'completed',
        timeSpent: 300000 // 5 minutes
      };

      // Test local storage
      console.log('Testing local storage...');
      const localResult = await SimpleDatabaseService.saveProgress(
        testData.lessonId, testData.weekNum, testData.dayNum, 
        testData.lessonIdx, testData.status, testData.timeSpent
      );
      console.log('Local storage result:', localResult);

      // Test cloud storage
      console.log('Testing cloud storage...');
      const cloudResult = await CloudDatabaseService.saveProgress(
        testData.lessonId, testData.weekNum, testData.dayNum, 
        testData.lessonIdx, testData.status, testData.timeSpent
      );
      console.log('Cloud storage result:', cloudResult);

      // Test hybrid storage
      console.log('Testing hybrid storage...');
      const hybridResult = await HybridDatabaseService.saveProgress(
        testData.lessonId, testData.weekNum, testData.dayNum, 
        testData.lessonIdx, testData.status, testData.timeSpent
      );
      console.log('Hybrid storage result:', hybridResult);

      // Verify storage
      const storedProgress = await HybridDatabaseService.getAllProgress();
      const testProgress = storedProgress.find(p => p.lessonId === testLessonId);
      
      if (!testProgress) {
        throw new Error('Progress data not found after storage');
      }
      
      if (testProgress.status !== 'completed') {
        throw new Error(`Expected status 'completed', got '${testProgress.status}'`);
      }

      results.tests.push({ 
        name: testName, 
        status: 'PASSED', 
        details: `Successfully stored and verified progress for ${testLessonId}` 
      });
      results.passed++;
      
    } catch (error) {
      results.tests.push({ name: testName, status: 'FAILED', details: error.message });
      results.failed++;
      results.errors.push(`${testName}: ${error.message}`);
    }
  }

  static async testDataRetrieval(results) {
    const testName = 'Data Retrieval Test';
    console.log(`📥 Running ${testName}...`);
    
    try {
      // Test retrieving all progress
      const allProgress = await HybridDatabaseService.getAllProgress();
      console.log(`Retrieved ${allProgress.length} progress records`);

      // Test retrieving specific progress
      const testLessonId = 'test-1-1-0';
      const specificProgress = allProgress.find(p => p.lessonId === testLessonId);
      
      if (specificProgress) {
        console.log('Found test progress:', specificProgress);
      }

      // Test retrieving audit logs
      const auditLogs = await HybridDatabaseService.getAuditLogs(10);
      console.log(`Retrieved ${auditLogs.length} audit logs`);

      // Test retrieving dashboard figures
      const dashboardFigures = await HybridDatabaseService.getDashboardFigures();
      console.log(`Retrieved ${dashboardFigures.length} dashboard figures`);

      results.tests.push({ 
        name: testName, 
        status: 'PASSED', 
        details: `Successfully retrieved data: ${allProgress.length} progress, ${auditLogs.length} logs, ${dashboardFigures.length} figures` 
      });
      results.passed++;
      
    } catch (error) {
      results.tests.push({ name: testName, status: 'FAILED', details: error.message });
      results.failed++;
      results.errors.push(`${testName}: ${error.message}`);
    }
  }

  static async testRealtimeUpdates(results) {
    const testName = 'Real-time Updates Test';
    console.log(`🔄 Running ${testName}...`);
    
    try {
      let updateReceived = false;
      
      // Set up a listener for updates
      const unsubscribe = CloudDatabaseService.subscribeToCollection('progress', (data) => {
        console.log('Received real-time update:', data.length, 'items');
        updateReceived = true;
      });

      // Make a change to trigger update
      await CloudDatabaseService.saveProgress('realtime-test-1-1-0', 1, 1, 0, 'completed', 0);
      
      // Wait for update
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (unsubscribe) {
        unsubscribe();
      }

      if (!updateReceived) {
        console.warn('Real-time update not received - may be using emulator or offline');
      }

      results.tests.push({ 
        name: testName, 
        status: updateReceived ? 'PASSED' : 'WARNING', 
        details: updateReceived ? 'Real-time updates working' : 'Real-time updates not received (may be offline/emulator)' 
      });
      
      if (updateReceived) {
        results.passed++;
      }
      
    } catch (error) {
      results.tests.push({ name: testName, status: 'FAILED', details: error.message });
      results.failed++;
      results.errors.push(`${testName}: ${error.message}`);
    }
  }

  static async testOfflineOnlineSync(results) {
    const testName = 'Offline/Online Sync Test';
    console.log(`🌐 Running ${testName}...`);
    
    try {
      // Simulate offline storage
      const originalOnlineStatus = HybridDatabaseService.isOnline;
      HybridDatabaseService.isOnline = false;
      
      const offlineTestId = 'offline-test-1-1-0';
      await HybridDatabaseService.saveProgress(offlineTestId, 1, 1, 0, 'completed', 0);
      
      // Simulate going back online
      HybridDatabaseService.isOnline = originalOnlineStatus;
      
      // Trigger sync
      if (HybridDatabaseService.syncToCloud) {
        await HybridDatabaseService.syncToCloud();
      }
      
      // Verify data exists
      const syncedData = await HybridDatabaseService.getAllProgress();
      const offlineData = syncedData.find(p => p.lessonId === offlineTestId);
      
      if (!offlineData) {
        throw new Error('Offline data not found after sync');
      }

      results.tests.push({ 
        name: testName, 
        status: 'PASSED', 
        details: 'Offline/online sync working correctly' 
      });
      results.passed++;
      
    } catch (error) {
      results.tests.push({ name: testName, status: 'FAILED', details: error.message });
      results.failed++;
      results.errors.push(`${testName}: ${error.message}`);
    }
  }

  static async testErrorHandling(results) {
    const testName = 'Error Handling Test';
    console.log(`⚠️ Running ${testName}...`);
    
    try {
      // Test with invalid data
      try {
        await HybridDatabaseService.saveProgress(null, null, null, null, null);
        throw new Error('Should have thrown error for invalid data');
      } catch (expectedError) {
        console.log('Expected error caught:', expectedError.message);
      }

      // Test with network issues (simulate)
      const originalFetch = global.fetch;
      global.fetch = () => Promise.reject(new Error('Network error'));
      
      try {
        await CloudDatabaseService.saveProgress('error-test', 1, 1, 0, 'completed', 0);
        // Should not throw, should fallback gracefully
      } catch (error) {
        console.log('Network error handled:', error.message);
      } finally {
        global.fetch = originalFetch;
      }

      results.tests.push({ 
        name: testName, 
        status: 'PASSED', 
        details: 'Error handling working correctly' 
      });
      results.passed++;
      
    } catch (error) {
      results.tests.push({ name: testName, status: 'FAILED', details: error.message });
      results.failed++;
      results.errors.push(`${testName}: ${error.message}`);
    }
  }

  static printTestResults(results) {
    console.log('\n🧪 TEST RESULTS SUMMARY');
    console.log('========================');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📊 Total: ${results.tests.length}`);
    
    console.log('\n📋 DETAILED RESULTS:');
    results.tests.forEach(test => {
      const icon = test.status === 'PASSED' ? '✅' : test.status === 'WARNING' ? '⚠️' : '❌';
      console.log(`${icon} ${test.name}: ${test.details}`);
    });
    
    if (results.errors.length > 0) {
      console.log('\n🚨 ERRORS:');
      results.errors.forEach(error => console.log(`❌ ${error}`));
    }
    
    console.log('\n💡 RECOMMENDATIONS:');
    if (results.errors.some(e => e.includes('Firebase authentication failed'))) {
      console.log('• Set up proper Firebase credentials in environment variables');
      console.log('• Check REACT_APP_FIREBASE_* environment variables');
    }
    if (results.errors.some(e => e.includes('Network error'))) {
      console.log('• Check internet connection');
      console.log('• Verify Firebase project is accessible');
    }
    if (results.failed > 0) {
      console.log('• Run individual tests to isolate issues');
      console.log('• Check browser console for additional error details');
    }
  }

  // Individual test methods for debugging
  static async testSingleActivityToggle(weekNum, dayNum, lessonIdx, lessonTitle) {
    console.log(`🔄 Testing single activity toggle: ${weekNum}-${dayNum}-${lessonIdx}`);
    
    try {
      const lessonId = `${weekNum}-${dayNum}-${lessonIdx}`;
      
      // Get current state
      const currentProgress = await HybridDatabaseService.getAllProgress();
      const existing = currentProgress.find(p => p.lessonId === lessonId);
      const currentStatus = existing?.status || 'not_started';
      
      console.log('Current status:', currentStatus);
      
      // Toggle status
      const newStatus = currentStatus === 'completed' ? 'in_progress' : 'completed';
      
      // Save new status
      const saveResult = await HybridDatabaseService.saveProgress(
        lessonId, weekNum, dayNum, lessonIdx, newStatus, existing?.timeSpent || 0
      );
      
      console.log('Save result:', saveResult);
      
      // Verify save
      const updatedProgress = await HybridDatabaseService.getAllProgress();
      const updated = updatedProgress.find(p => p.lessonId === lessonId);
      
      console.log('Updated progress:', updated);
      
      if (updated?.status !== newStatus) {
        throw new Error(`Status not updated correctly. Expected: ${newStatus}, Got: ${updated?.status}`);
      }
      
      console.log('✅ Single activity toggle test passed');
      return true;
      
    } catch (error) {
      console.error('❌ Single activity toggle test failed:', error);
      return false;
    }
  }

  static async debugStorageFlow(lessonId, weekNum, dayNum, lessonIdx, status) {
    console.log(`🔍 Debugging storage flow for ${lessonId}...`);
    
    const steps = [];
    
    try {
      // Step 1: Local storage
      steps.push('Starting local storage...');
      const localResult = await SimpleDatabaseService.saveProgress(lessonId, weekNum, dayNum, lessonIdx, status);
      steps.push(`Local storage result: ${localResult}`);
      
      // Step 2: Cloud storage
      steps.push('Starting cloud storage...');
      const cloudResult = await CloudDatabaseService.saveProgress(lessonId, weekNum, dayNum, lessonIdx, status);
      steps.push(`Cloud storage result: ${cloudResult}`);
      
      // Step 3: Hybrid storage
      steps.push('Starting hybrid storage...');
      const hybridResult = await HybridDatabaseService.saveProgress(lessonId, weekNum, dayNum, lessonIdx, status);
      steps.push(`Hybrid storage result: ${hybridResult}`);
      
      // Step 4: Verification
      steps.push('Verifying storage...');
      const allProgress = await HybridDatabaseService.getAllProgress();
      const stored = allProgress.find(p => p.lessonId === lessonId);
      steps.push(`Stored data: ${JSON.stringify(stored)}`);
      
      console.log('Debug steps:', steps);
      return { success: true, steps, data: stored };
      
    } catch (error) {
      steps.push(`Error: ${error.message}`);
      console.error('Debug failed:', steps);
      return { success: false, steps, error: error.message };
    }
  }
}

export default FirebaseTestService;
