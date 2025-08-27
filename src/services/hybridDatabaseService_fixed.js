import SimpleDatabaseService from './simpleDatabaseService';
import CloudDatabaseService from './cloudDatabaseService';

class HybridDatabaseServiceClass {
  constructor() {
    this.localService = new SimpleDatabaseService();
    this.cloudService = new CloudDatabaseService();
    this.isOnline = navigator.onLine;
    
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
    
    // Initialize cloud service and sync
    this.initialize();
  }

  async initialize() {
    try {
      console.log('🚀 Starting ultra-fast hybrid database initialization...');
      
      // Clear old global user ID approach
      localStorage.removeItem('global_user_id');
      localStorage.removeItem('persistent_user_id');
      localStorage.removeItem('firebase_user_id');
      localStorage.removeItem('fallback_user_id');
      
      console.log('👤 Using authenticated user-based data isolation');
      
      // Ultra-fast cloud initialization with immediate fallback
      const cloudInitPromise = this.cloudService.initAuth();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Cloud initialization timeout')), 500) // Reduced to 500ms
      );
      
      try {
        // Try to initialize cloud with ultra-short timeout
        await Promise.race([cloudInitPromise, timeoutPromise]);
        console.log('✅ Cloud service initialized');
        this.isOnline = true;
        
        // Skip initial cloud sync for faster startup
        // Cloud sync will happen on-demand when needed
        
      } catch (cloudError) {
        console.warn('⚠️ Cloud initialization failed, using local storage only');
        this.isOnline = false;
      }
      
      console.log('✅ Ultra-fast hybrid database initialization completed');
    } catch (error) {
      console.error('❌ Hybrid service initialization failed:', error);
      this.isOnline = false;
    }
  }

  // Generic save method with dual storage - ULTRA-OPTIMIZED
  async saveData(collection, data, docId = null, method = 'saveData') {
    try {
      // Always save locally first for immediate response
      let localResult;
      if (method === 'saveData') {
        localResult = await this.localService[method](collection, data, docId);
      } else {
        localResult = await this.localService[method](...arguments);
      }
      
      // Skip cloud save for performance - only sync when explicitly requested
      // This eliminates the hundreds of background Firebase calls causing delays
      
      return localResult;
    } catch (error) {
      console.error(`❌ Error in hybrid save for ${collection}:`, error);
      throw error;
    }
  }

  // Dashboard Figures - ULTRA-FAST local-only saves
  async saveDashboardFigure(type, value, metadata = {}) {
    try {
      // Save locally immediately - no cloud operations
      return await this.localService.saveDashboardFigure(type, value, metadata);
    } catch (error) {
      console.error('Dashboard figure save failed:', error);
      throw error;
    }
  }

  async getDashboardFigures() {
    // Local-only for performance
    return await this.localService.getDashboardFigures();
  }

  // Notes
  async saveNote(weekNum, dayNum, content, tags = []) {
    // Local-only for performance
    return await this.localService.saveNote(weekNum, dayNum, content, tags);
  }

  async getNote(weekNum, dayNum) {
    // Local-only for performance
    return await this.localService.getNote(weekNum, dayNum);
  }

  async getAllNotes() {
    // Local-only for performance
    return await this.localService.getAllNotes();
  }

  async deleteNote(weekNum, dayNum) {
    // Local-only for performance
    return await this.localService.deleteNote(weekNum, dayNum);
  }

  // Progress - ULTRA-FAST local-only method
  async saveProgress(lessonId, weekNum, dayNum, lessonIdx, status, timeSpent = 0) {
    // Local-only save for instant response
    return await this.localService.saveProgress(
      lessonId, weekNum, dayNum, lessonIdx, status, timeSpent
    );
  }

  // Optimized local-only progress save for immediate UI response
  async saveProgressLocal(lessonId, weekNum, dayNum, lessonIdx, status, timeSpent = 0) {
    try {
      return await this.localService.saveProgress(
        lessonId, weekNum, dayNum, lessonIdx, status, timeSpent
      );
    } catch (error) {
      console.error('❌ Local progress save failed:', error);
      throw error;
    }
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
    return await this.localService.getAllProgress();
  }

  async getProgressByWeek(weekNum) {
    // Local-only for performance
    return await this.localService.getProgressByWeek(weekNum);
  }

  // Planners
  async savePlanner(weekNum, dayNum, planType, content, priority = 'medium', dueDate = null) {
    return await this.saveData('planners', { weekNum, dayNum, planType, content, priority, dueDate }, null, 'savePlanner');
  }

  async getPlannersByWeek(weekNum) {
    // Local-only for performance
    return await this.localService.getPlannersByWeek(weekNum);
  }

  async updatePlanner(plannerId, updates) {
    // Local-only for performance
    return await this.localService.updatePlanner(plannerId, updates);
  }

  async deletePlanner(plannerId) {
    // Local-only for performance
    return await this.localService.deletePlanner(plannerId);
  }

  // Settings
  async saveSetting(key, value) {
    // Local-only for performance
    return await this.localService.saveSetting(key, value);
  }

  async getSetting(key) {
    // Local-only for performance
    return await this.localService.getSetting(key);
  }

  async getAllSettings() {
    // Local-only for performance
    return await this.localService.getAllSettings();
  }

  // Audit Logs
  async logAudit(action, category, targetId, metadata = {}) {
    // Local-only for performance
    return await this.localService.logAudit(action, category, targetId, metadata);
  }

  async logEvent(eventType, category, metadata = {}) {
    // Local-only for performance
    return await this.localService.logEvent(eventType, category, metadata);
  }

  async getAuditLogs(limit = 100) {
    // Local-only for performance
    return await this.localService.getAuditLogs(limit);
  }

  // User Management
  async createUser(userData) {
    // Local-only for performance
    return await this.localService.createUser(userData);
  }

  async getUser(userId) {
    // Local-only for performance
    return await this.localService.getUser(userId);
  }

  async updateUser(userId, updates) {
    // Local-only for performance
    return await this.localService.updateUser(userId, updates);
  }

  async deleteUser(userId) {
    // Local-only for performance
    return await this.localService.deleteUser(userId);
  }

  async getAllUsers() {
    // Local-only for performance
    return await this.localService.getAllUsers();
  }

  // Session Management
  async createSession(sessionData) {
    // Local-only for performance
    return await this.localService.createSession(sessionData);
  }

  async getSession(sessionId) {
    // Local-only for performance
    return await this.localService.getSession(sessionId);
  }

  async updateSession(sessionId, updates) {
    // Local-only for performance
    return await this.localService.updateSession(sessionId, updates);
  }

  async deleteSession(sessionId) {
    // Local-only for performance
    return await this.localService.deleteSession(sessionId);
  }

  async getSessionsByUser(userId) {
    // Local-only for performance
    return await this.localService.getSessionsByUser(userId);
  }

  async getAllSessions() {
    // Local-only for performance
    return await this.localService.getAllSessions();
  }

  // Utility methods
  async clearAllData() {
    // Local-only for performance
    return await this.localService.clearAllData();
  }

  async exportData() {
    // Local-only for performance
    return await this.localService.exportData();
  }

  async importData(data) {
    // Local-only for performance
    return await this.localService.importData(data);
  }

  // Cloud sync methods (disabled for performance)
  async syncToCloud() {
    // Disabled for performance
    console.log('Cloud sync disabled for performance');
    return;
  }

  async syncFromCloud() {
    // Disabled for performance
    console.log('Cloud sync disabled for performance');
    return;
  }

  async forceSyncToCloud() {
    // Disabled for performance
    console.log('Cloud sync disabled for performance');
    return;
  }
}

// Create and export singleton instance
const HybridDatabaseService = new HybridDatabaseServiceClass();
export default HybridDatabaseService;
