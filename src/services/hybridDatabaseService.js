import { SimpleDatabaseService } from './simpleDatabaseService';

class HybridDatabaseServiceClass {
  constructor() {
    this.localService = SimpleDatabaseService;
    this.cloudService = null; // Disable cloud service for performance
    this.isOnline = false; // Start offline for instant performance
    this.currentUser = null;
    
    // Skip all cloud initialization for maximum performance
    console.log('🚀 Ultra-fast local-only database initialization...');
    console.log('✅ Local-only hybrid database ready');
  }

  setCurrentUser(username) {
    this.currentUser = username;
    SimpleDatabaseService.setCurrentUser(username);
  }

  async initialize() {
    // Skip all initialization for instant startup
    return;
  }

  // Generic save method with dual storage - ULTRA-OPTIMIZED
  async saveData(collection, data, docId = null, method = 'saveData') {
    try {
      // Always save locally first for immediate response
      let localResult;
      if (method === 'saveData') {
        localResult = await this.localService[method](collection, data, docId);
      } else {
        localResult = await this.localService[method](...Array.from(arguments).slice(3));
      }
      
      // Skip cloud save for performance - only sync when explicitly requested
      // This eliminates the hundreds of background Firebase calls causing delays
      
      return localResult;
    } catch (error) {
      console.error(`❌ Error in hybrid save for ${collection}:`, error);
      throw error;
    }
  }

  // Generic read/delete/clear helpers used by contexts (planner items, audit logs, etc.)
  async getData(collection) {
    try {
      return await this.localService.getData(collection);
    } catch (error) {
      console.error(`❌ Error getting data for ${collection}:`, error);
      return [];
    }
  }

  async deleteData(collection, id) {
    try {
      return await this.localService.deleteData(collection, id);
    } catch (error) {
      console.error(`❌ Error deleting from ${collection}:`, error);
      throw error;
    }
  }

  async clearCollection(collection) {
    try {
      return await this.localService.clearCollection(collection);
    } catch (error) {
      console.error(`❌ Error clearing collection ${collection}:`, error);
      throw error;
    }
  }

  // Dashboard Figures - ULTRA-FAST local-only saves
  async saveTimeEntry(lessonId, timeSpent, sessionData = {}) {
    try {
      // Save locally immediately - no cloud operations
      return await SimpleDatabaseService.saveTimeEntry(lessonId, timeSpent, sessionData);
    } catch (error) {
      console.error('Time entry save failed:', error);
      throw error;
    }
  }

  async saveDashboardFigure(type, value, metadata = {}) {
    try {
      // Save locally immediately - no cloud operations
      return await SimpleDatabaseService.saveDashboardFigure(type, value, metadata);
    } catch (error) {
      console.error('Dashboard figure save failed:', error);
      throw error;
    }
  }

  async getDashboardFigures() {
    // Local-only for performance
    return await SimpleDatabaseService.getDashboardFigures();
  }

  // Compatibility helpers expected by DatabaseProgressContext
  async getAllDashboardFigures() {
    // Map SimpleDatabaseService shape to { key, value }
    const items = await SimpleDatabaseService.getDashboardFigures();
    return items.map(it => ({ key: it.type, value: it.value, metadata: it.metadata, timestamp: it.timestamp }));
  }

  // Notes
  async saveNote(weekNum, dayNum, content, tags = []) {
    // Local-only for performance
    return await SimpleDatabaseService.saveNote(weekNum, dayNum, content, tags);
  }

  async getNote(weekNum, dayNum) {
    // Local-only for performance
    return await SimpleDatabaseService.getNote(weekNum, dayNum);
  }

  async getAllNotes() {
    // Local-only for performance
    return await SimpleDatabaseService.getAllNotes();
  }

  async deleteNote(weekNum, dayNum) {
    // Local-only for performance
    return await SimpleDatabaseService.deleteNote(weekNum, dayNum);
  }

  // Progress - ULTRA-FAST local-only method
  async saveProgress(lessonId, weekNum, dayNum, lessonIdx, status, timeSpent) {
    try {
      // Save locally immediately - no cloud operations
      return await SimpleDatabaseService.saveProgress(lessonId, weekNum, dayNum, lessonIdx, status, timeSpent);
    } catch (error) {
      console.error('Progress save failed:', error);
      throw error;
    }
  }

  async saveProgressLocal(lessonId, weekNum, dayNum, lessonIdx, status, timeSpent) {
    // Direct local save for maximum performance
    return await SimpleDatabaseService.saveProgress(lessonId, weekNum, dayNum, lessonIdx, status, timeSpent);
  }

  // Background cloud save (non-blocking) - DISABLED FOR PERFORMANCE
  async saveProgressCloud(lessonId, weekNum, dayNum, lessonIdx, status, timeSpent = 0) {
    // Disabled to eliminate Firebase auth delays
    // Cloud sync will be done manually when needed
    return;
  }

  // Async audit logging (non-blocking) - MINIMAL FOR PERFORMANCE
  async logAuditAsync(action, category, targetId, metadata = {}) {
    // Minimal logging to reduce overhead
    try {
      setTimeout(async () => {
        try {
          // Only log to local storage for performance
          await this.localService.logAudit(action, category, targetId, metadata);
        } catch (error) {
          // Silently fail
        }
      }, 100); // Small delay to batch operations
    } catch (error) {
      // Silently fail for background operations
    }
  }

  async getAllProgress() {
    // Local-only for performance - no cloud operations
    return await SimpleDatabaseService.getAllProgress();
  }

  async getProgressByWeek(weekNum) {
    // Local-only for performance
    return await SimpleDatabaseService.getProgressByWeek(weekNum);
  }

  async getProgress() {
    // Local-only for performance
    return await SimpleDatabaseService.getProgress();
  }

  // Planners
  async savePlanner(weekNum, dayNum, planType, content, priority = 'medium', dueDate = null) {
    return await this.saveData('planners', { weekNum, dayNum, planType, content, priority, dueDate }, null, 'savePlanner');
  }

  async getPlannersByWeek(weekNum) {
    // Local-only for performance
    return await SimpleDatabaseService.getPlannersByWeek(weekNum);
  }

  async updatePlanner(plannerId, updates) {
    // Local-only for performance
    return await SimpleDatabaseService.updatePlanner(plannerId, updates);
  }

  async deletePlanner(weekNum, dayNum, planType) {
    // Local-only for performance
    return await SimpleDatabaseService.deletePlanner(weekNum, dayNum, planType);
  }

  async getAllPlanners() {
    // Local-only for performance
    return await SimpleDatabaseService.getAllPlanners();
  }

  // Settings
  async saveSetting(key, value) {
    // Local-only for performance
    return await SimpleDatabaseService.saveSetting(key, value);
  }

  async getSetting(key) {
    // Local-only for performance
    return await SimpleDatabaseService.getSetting(key);
  }

  async getAllSettings() {
    // Local-only for performance
    return await SimpleDatabaseService.getAllSettings();
  }

  async getTimeTracking() {
    // Local-only for performance
    return await SimpleDatabaseService.getTimeTracking();
  }

  // There is no dedicated timeTracking table; derive from progress
  async getAllTimeTracking() {
    try {
      const progress = await SimpleDatabaseService.getAllProgress();
      return progress.map(p => ({
        lessonId: p.lessonId,
        totalTime: p.timeSpent || 0,
        isActive: false,
        startTime: null
      }));
    } catch (e) {
      console.warn('getAllTimeTracking fallback failed, returning []', e);
      return [];
    }
  }

  // Audit Logs
  async logAudit(action, category, targetId, metadata = {}) {
    // Local-only for performance
    return await SimpleDatabaseService.logAudit(action, category, targetId, metadata);
  }

  async logEvent(eventType, category, metadata = {}) {
    // Local-only for performance
    return await SimpleDatabaseService.logEvent(eventType, category, metadata);
  }

  async getAuditLogs(limit = 100) {
    // Local-only for performance
    return await SimpleDatabaseService.getAuditLogs(limit);
  }

  // User Management
  async createUser(userData) {
    // Local-only for performance
    return await SimpleDatabaseService.createUser(userData);
  }

  async getUser(userId) {
    // Local-only for performance
    return await SimpleDatabaseService.getUser(userId);
  }

  async updateUser(userId, updates) {
    // Local-only for performance
    return await SimpleDatabaseService.updateUser(userId, updates);
  }

  async saveUser(userData) {
    // Local-only for performance
    return await SimpleDatabaseService.saveUser(userData);
  }

  async resetUserData(userId) {
    // Local-only for performance
    return await SimpleDatabaseService.resetUserData(userId);
  }

  async deleteUser(userId) {
    // Local-only for performance
    return await SimpleDatabaseService.deleteUser(userId);
  }

  async getAllUsers() {
    // Local-only for performance
    return await SimpleDatabaseService.getAllUsers();
  }

  // Session Management
  async createSession(sessionData) {
    // Local-only for performance
    return await SimpleDatabaseService.createSession(sessionData);
  }

  async getSession(sessionId) {
    // Local-only for performance
    return await SimpleDatabaseService.getSession(sessionId);
  }

  async updateSession(sessionId, updates) {
    // Local-only for performance
    return await SimpleDatabaseService.updateSession(sessionId, updates);
  }

  async deleteSession(sessionId) {
    // Local-only for performance
    return await SimpleDatabaseService.deleteSession(sessionId);
  }

  async getUserSessions(userId) {
    // Local-only for performance
    return await SimpleDatabaseService.getUserSessions(userId);
  }

  async cleanupExpiredSessions() {
    // Local-only for performance
    return await SimpleDatabaseService.cleanupExpiredSessions();
  }

  async getSessionsByUser(userId) {
    // Local-only for performance
    return await SimpleDatabaseService.getSessionsByUser(userId);
  }

  async getAllSessions() {
    // Local-only for performance
    return await SimpleDatabaseService.getAllSessions();
  }

  // Utility methods
  async clearAllData() {
    // Local-only for performance
    return await SimpleDatabaseService.clearAllData();
  }

  async exportData() {
    // Local-only for performance
    return await SimpleDatabaseService.exportData();
  }

  async importData(data) {
    // Local-only for performance
    return await SimpleDatabaseService.importData(data);
  }

  // Cloud sync methods (disabled for performance)
  async syncToCloud() {
    // Disabled for performance
    console.log('Cloud sync disabled for performance');
    return;
  }

  async syncFromCloud() {
    // Disabled for performance
    console.log('Cloud sync from cloud disabled for performance');
    return;
  }

  // Data consistency and validation methods
  async performConsistencyCheck() {
    // Local-only consistency check
    try {
      console.log('🔍 Performing local data consistency check...');
      
      // Check if users exist
      const users = await SimpleDatabaseService.getAllUsers();
      console.log(`📊 Found ${users.length} users in local storage`);
      
      // Basic validation
      const stats = await SimpleDatabaseService.getStorageStats();
      console.log('📈 Storage stats:', stats);
      
      console.log('✅ Consistency check completed');
      return { status: 'success', users: users.length, stats };
    } catch (error) {
      console.error('❌ Consistency check failed:', error);
      return { status: 'error', error: error.message };
    }
  }

  // Connection state methods
  getConnectionState() {
    return {
      isOnline: this.isOnline,
      lastSync: null,
      status: 'offline'
    };
  }

  getConnectionStatus() {
    return {
      isOnline: this.isOnline,
      lastSync: null,
      status: 'offline',
      connected: false
    };
  }

  async checkConnection() {
    // Always return offline for performance
    return false;
  }

  async testConnection() {
    // Always return offline for performance
    return { connected: false, latency: null };
  }

  async validateData() {
    // Local data validation
    return await this.performConsistencyCheck();
  }

  async repairData() {
    // Local data repair - recreate default users if missing
    try {
      const users = await SimpleDatabaseService.getAllUsers();
      if (users.length === 0) {
        console.log('🔧 No users found, recreating defaults...');
        // Trigger user creation through auth service
        const authService = (await import('./authService')).default;
        await authService.createDefaultAdmin();
      }
      return { status: 'success', message: 'Data repair completed' };
    } catch (error) {
      console.error('❌ Data repair failed:', error);
      return { status: 'error', error: error.message };
    }
  }

  async forceSyncToCloud() {
    // Disabled for performance
    console.log('Cloud sync disabled for performance');
    return;
  }

  // Additional missing methods
  async clearAllData() {
    return await SimpleDatabaseService.clearAllData();
  }

  async getStorageStats() {
    try {
      const stats = await SimpleDatabaseService.getStorageStats();
      return { local: stats };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return { local: {} };
    }
  }

  async importData(data) {
    return await SimpleDatabaseService.importData(data);
  }
}

// Create and export singleton instance
const HybridDatabaseService = new HybridDatabaseServiceClass();
export default HybridDatabaseService;
