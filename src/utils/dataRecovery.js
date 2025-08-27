// Data Recovery Utility for Learning Portal
// Handles data persistence issues and recovery after refresh/reset

export class DataRecoveryService {
  static async forceDataRefresh() {
    try {
      console.log('🔄 Starting force data refresh...');
      
      // Import services dynamically
      const { HybridDatabaseService } = await import('../services/hybridDatabaseService');
      const { authService } = await import('../services/authService');
      
      // Ensure user is authenticated
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        console.warn('No authenticated user found');
        return { success: false, error: 'Not authenticated' };
      }
      
      // Force sync from cloud first
      if (HybridDatabaseService.isOnline) {
        await HybridDatabaseService.syncFromCloud();
        console.log('☁️ Cloud sync completed');
      }
      
      // Reload all data collections
      const collections = ['progress', 'dashboardFigures', 'notes', 'planners', 'auditLogs'];
      const results = {};
      
      for (const collection of collections) {
        try {
          const data = await HybridDatabaseService.getData(collection);
          results[collection] = data.length;
          console.log(`📊 ${collection}: ${data.length} items loaded`);
        } catch (error) {
          console.error(`Failed to load ${collection}:`, error);
          results[collection] = 0;
        }
      }
      
      // Trigger page reload to refresh UI state
      window.location.reload();
      
      return { success: true, results };
    } catch (error) {
      console.error('❌ Force refresh failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  static async recoverProgressData() {
    try {
      console.log('🔧 Attempting progress data recovery...');
      
      const { HybridDatabaseService } = await import('../services/hybridDatabaseService');
      
      // Try to recover from cloud first
      if (HybridDatabaseService.isOnline) {
        const cloudProgress = await HybridDatabaseService.cloudService.getData('progress');
        if (cloudProgress.length > 0) {
          // Save to local storage
          for (const item of cloudProgress) {
            await HybridDatabaseService.localService.saveData('progress', item, item.id);
          }
          console.log(`✅ Recovered ${cloudProgress.length} progress items from cloud`);
          return { success: true, recovered: cloudProgress.length };
        }
      }
      
      // Try to recover from localStorage backup
      const backupKey = 'learning_portal_progress_backup';
      const backup = localStorage.getItem(backupKey);
      if (backup) {
        const progressData = JSON.parse(backup);
        for (const item of progressData) {
          await HybridDatabaseService.saveProgress(
            item.id, item.week, item.day, item.lessonIndex, item.status, item.timeSpent || 0
          );
        }
        console.log(`✅ Recovered ${progressData.length} progress items from backup`);
        return { success: true, recovered: progressData.length };
      }
      
      return { success: false, error: 'No recovery data found' };
    } catch (error) {
      console.error('❌ Progress recovery failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  static async createProgressBackup() {
    try {
      const { HybridDatabaseService } = await import('../services/hybridDatabaseService');
      
      const progressData = await HybridDatabaseService.getData('progress');
      const backupKey = 'learning_portal_progress_backup';
      const backupData = {
        timestamp: new Date().toISOString(),
        data: progressData
      };
      
      localStorage.setItem(backupKey, JSON.stringify(progressData));
      localStorage.setItem(backupKey + '_meta', JSON.stringify(backupData));
      
      console.log(`💾 Progress backup created: ${progressData.length} items`);
      return { success: true, items: progressData.length };
    } catch (error) {
      console.error('❌ Backup creation failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  static async fixEfficiencyCalculation() {
    try {
      console.log('🔧 Fixing efficiency calculation...');
      
      const { HybridDatabaseService } = await import('../services/hybridDatabaseService');
      
      // Get current dashboard figures
      const figures = await HybridDatabaseService.getData('dashboardFigures');
      
      // Find and fix efficiency ratio
      const efficiencyFigure = figures.find(f => f.id === 'efficiency_ratio');
      if (efficiencyFigure && efficiencyFigure.value > 1000) {
        // Reset to reasonable value
        await HybridDatabaseService.saveDashboardFigure('efficiency_ratio', 0);
        console.log('✅ Efficiency calculation reset');
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ Efficiency fix failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  static async validateDataIntegrity() {
    try {
      console.log('🔍 Validating data integrity...');
      
      const { HybridDatabaseService } = await import('../services/hybridDatabaseService');
      
      const report = {
        progress: 0,
        dashboardFigures: 0,
        notes: 0,
        planners: 0,
        auditLogs: 0,
        issues: []
      };
      
      // Check each collection
      const collections = Object.keys(report).filter(k => k !== 'issues');
      
      for (const collection of collections) {
        try {
          const data = await HybridDatabaseService.getData(collection);
          report[collection] = data.length;
          
          // Check for data quality issues
          if (collection === 'dashboardFigures') {
            const efficiency = data.find(d => d.id === 'efficiency_ratio');
            if (efficiency && efficiency.value > 1000) {
              report.issues.push('Efficiency calculation is invalid');
            }
          }
        } catch (error) {
          report.issues.push(`Failed to load ${collection}: ${error.message}`);
        }
      }
      
      console.log('📊 Data integrity report:', report);
      return { success: true, report };
    } catch (error) {
      console.error('❌ Data validation failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Auto-backup progress data periodically
export const setupAutoBackup = () => {
  // Create backup every 5 minutes
  setInterval(async () => {
    try {
      await DataRecoveryService.createProgressBackup();
    } catch (error) {
      console.warn('Auto-backup failed:', error);
    }
  }, 5 * 60 * 1000);
  
  console.log('🔄 Auto-backup enabled (every 5 minutes)');
};

// Add to window for debugging
if (typeof window !== 'undefined') {
  window.DataRecoveryService = DataRecoveryService;
}
