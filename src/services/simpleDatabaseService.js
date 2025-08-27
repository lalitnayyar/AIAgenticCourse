// Simple database service using localStorage with structured data
export class SimpleDatabaseService {
  static getStorageKey(table, userId = null) {
    if (userId && table !== 'users') {
      return `learningPortal_${userId}_${table}`;
    }
    return `learningPortal_${table}`;
  }

  static setCurrentUser(userId) {
    this.currentUserId = userId;
  }

  static generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generic CRUD operations
  static async saveData(table, data, docId = null) {
    return await this.save(table, { ...data, id: docId });
  }

  static async getData(table, docId = null) {
    if (docId) {
      return await this.findOne(table, item => item.id === docId);
    }
    return await this.getAll(table);
  }

  static async save(table, data) {
    try {
      const key = this.getStorageKey(table, this.currentUserId);
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      
      const record = {
        id: data.id || this.generateId(),
        ...data,
        timestamp: data.timestamp || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const index = existing.findIndex(item => item.id === record.id);
      if (index >= 0) {
        existing[index] = record;
      } else {
        existing.push(record);
      }
      
      localStorage.setItem(key, JSON.stringify(existing));
      return record.id;
    } catch (error) {
      console.error(`Error saving to ${table}:`, error);
      throw error;
    }
  }

  static async getAll(table) {
    try {
      const key = this.getStorageKey(table, this.currentUserId);
      const data = JSON.parse(localStorage.getItem(key) || '[]');
      console.log(`📱 Local storage key: ${key}, found ${data.length} records`);
      return data;
    } catch (error) {
      console.error(`Error getting all from ${table}:`, error);
      return [];
    }
  }

  static async findOne(table, predicate) {
    try {
      const data = await this.getAll(table);
      return data.find(predicate);
    } catch (error) {
      console.error(`Error finding in ${table}:`, error);
      return null;
    }
  }

  static async findMany(table, predicate) {
    try {
      const data = await this.getAll(table);
      return predicate ? data.filter(predicate) : data;
    } catch (error) {
      console.error(`Error finding many in ${table}:`, error);
      return [];
    }
  }

  static async delete(table, id) {
    try {
      const key = this.getStorageKey(table, this.currentUserId);
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const filtered = existing.filter(item => item.id !== id);
      localStorage.setItem(key, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error(`Error deleting from ${table}:`, error);
      return false;
    }
  }

  static async clear(table) {
    try {
      const key = this.getStorageKey(table);
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error clearing ${table}:`, error);
      return false;
    }
  }

  // Dashboard Figures
  static async saveDashboardFigure(type, value, metadata = {}) {
    return await this.save('dashboardFigures', {
      type,
      value,
      metadata
    });
  }

  static async getDashboardFigures(type = null, limit = 100) {
    const figures = await this.getAll('dashboardFigures');
    let filtered = type ? figures.filter(f => f.type === type) : figures;
    return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
  }

  static async getLatestDashboardFigure(type) {
    const figures = await this.getDashboardFigures(type, 1);
    return figures[0] || null;
  }

  // Notes
  static async saveNote(weekNum, dayNum, content, tags = []) {
    const existing = await this.findOne('notes', note => 
      note.weekNum === weekNum && note.dayNum === dayNum
    );

    if (existing) {
      return await this.save('notes', {
        ...existing,
        content,
        tags,
        lastModified: new Date().toISOString()
      });
    } else {
      return await this.save('notes', {
        weekNum,
        dayNum,
        content,
        tags,
        lastModified: new Date().toISOString()
      });
    }
  }

  static async getNote(weekNum, dayNum) {
    return await this.findOne('notes', note => 
      note.weekNum === weekNum && note.dayNum === dayNum
    );
  }

  static async getAllNotes() {
    const notes = await this.getAll('notes');
    return notes.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
  }

  static async deleteNote(weekNum, dayNum) {
    const note = await this.getNote(weekNum, dayNum);
    if (note) {
      return await this.delete('notes', note.id);
    }
    return false;
  }

  // Progress
  static async saveProgress(lessonId, weekNum, dayNum, lessonIndex, status, timeSpent = 0) {
    const existing = await this.findOne('progress', p => p.lessonId === lessonId);

    const progressData = {
      lessonId,
      weekNum,
      dayNum,
      lessonIndex,
      status,
      timeSpent,
      completedAt: status === 'completed' ? new Date().toISOString() : null
    };

    if (existing) {
      return await this.save('progress', { ...existing, ...progressData });
    } else {
      return await this.save('progress', {
        ...progressData,
        startedAt: new Date().toISOString()
      });
    }
  }

  static async getProgress(lessonId) {
    return await this.findOne('progress', p => p.lessonId === lessonId);
  }

  static async getAllProgress() {
    const progress = await this.getAll('progress');
    return progress.sort((a, b) => new Date(b.completedAt || b.timestamp) - new Date(a.completedAt || a.timestamp));
  }

  static async getWeekProgress(weekNum) {
    return await this.findMany('progress', p => p.weekNum === weekNum);
  }

  // Planners
  static async savePlanner(weekNum, dayNum, planType, content, priority = 'medium', dueDate = null) {
    return await this.save('planners', {
      weekNum,
      dayNum,
      planType,
      content,
      priority,
      dueDate,
      completed: false,
      createdAt: new Date().toISOString()
    });
  }

  static async updatePlanner(id, updates) {
    const existing = await this.findOne('planners', p => p.id === id);
    if (existing) {
      return await this.save('planners', { ...existing, ...updates });
    }
    return null;
  }

  static async getPlanner(id) {
    return await this.findOne('planners', p => p.id === id);
  }

  static async getPlannersByWeek(weekNum) {
    const planners = await this.findMany('planners', p => p.weekNum === weekNum);
    return planners.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  }

  static async getAllPlanners() {
    const planners = await this.getAll('planners');
    return planners.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static async deletePlanner(id) {
    return await this.delete('planners', id);
  }

  // Audit Logs
  static async logAudit(action, entityType, entityId, details = {}, userId = 'anonymous') {
    return await this.save('auditLogs', {
      action,
      entityType,
      entityId,
      details,
      userId
    });
  }

  static async getAuditLogs(limit = 100, entityType = null) {
    const logs = await this.getAll('auditLogs');
    let filtered = entityType ? logs.filter(log => log.entityType === entityType) : logs;
    return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
  }

  // Events
  static async logEvent(eventType, category, data = {}, sessionId = null) {
    return await this.save('events', {
      eventType,
      category,
      data,
      sessionId: sessionId || `session_${Date.now()}`
    });
  }

  static async getEvents(limit = 100, category = null, eventType = null) {
    const events = await this.getAll('events');
    let filtered = events;
    
    if (category && eventType) {
      filtered = events.filter(e => e.category === category && e.eventType === eventType);
    } else if (category) {
      filtered = events.filter(e => e.category === category);
    } else if (eventType) {
      filtered = events.filter(e => e.eventType === eventType);
    }
    
    return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
  }

  // Settings
  static async saveSetting(key, value) {
    const existing = await this.findOne('settings', s => s.key === key);
    
    if (existing) {
      return await this.save('settings', {
        ...existing,
        value,
        updatedAt: new Date().toISOString()
      });
    } else {
      return await this.save('settings', {
        key,
        value,
        updatedAt: new Date().toISOString()
      });
    }
  }

  static async getSetting(key, defaultValue = null) {
    const setting = await this.findOne('settings', s => s.key === key);
    return setting ? setting.value : defaultValue;
  }

  // Migration
  static async migrateFromLocalStorage() {
    try {
      console.log('Starting migration from localStorage...');

      // Migrate completed lessons
      const completedLessons = localStorage.getItem('completedLessons');
      if (completedLessons) {
        const lessons = JSON.parse(completedLessons);
        for (const lessonId of lessons) {
          const [weekNum, dayNum, lessonIndex] = lessonId.split('-').map(Number);
          await this.saveProgress(lessonId, weekNum, dayNum, lessonIndex, 'completed');
        }
      }

      // Migrate notes
      const notes = localStorage.getItem('learningNotes');
      if (notes) {
        const notesObj = JSON.parse(notes);
        for (const [key, content] of Object.entries(notesObj)) {
          const [weekNum, dayNum] = key.split('-').map(Number);
          await this.saveNote(weekNum, dayNum, content);
        }
      }

      // Migrate audit trail
      const auditTrail = localStorage.getItem('auditTrail');
      if (auditTrail) {
        const logs = JSON.parse(auditTrail);
        for (const log of logs) {
          await this.logAudit(
            log.action,
            'lesson',
            log.lessonId,
            {
              week: log.week,
              day: log.day,
              lessonIndex: log.lessonIndex,
              lessonTitle: log.lessonTitle,
              totalCompleted: log.totalCompleted,
              originalTimestamp: log.timestamp
            }
          );
        }
      }

      // Mark migration as complete
      await this.saveSetting('migration_completed', true);
      await this.logEvent('migration_completed', 'system', { 
        migratedAt: new Date().toISOString() 
      });

      console.log('Migration completed successfully!');
      return true;
    } catch (error) {
      console.error('Error during migration:', error);
      throw error;
    }
  }

  // Utility Methods
  static async clearAllData() {
    try {
      const tables = ['dashboardFigures', 'notes', 'auditLogs', 'progress', 'planners', 'events', 'settings'];
      for (const table of tables) {
        await this.clear(table);
      }
      console.log('All data cleared successfully');
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }

  static async exportData() {
    try {
      const tables = ['dashboardFigures', 'notes', 'auditLogs', 'progress', 'planners', 'events', 'settings'];
      const data = {};
      
      for (const table of tables) {
        data[table] = await this.getAll(table);
      }
      
      return {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        data
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  // User Management Methods
  static async createUser(userData) {
    return await this.saveUser(userData);
  }

  static async saveUser(userData) {
    try {
      console.log(`💾 Saving user to local storage: ${userData.username}`);
      const key = this.getStorageKey('users');
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      
      const userIndex = existing.findIndex(user => user.username === userData.username);
      if (userIndex >= 0) {
        existing[userIndex] = userData;
        console.log(`🔄 Updated existing user: ${userData.username}`);
      } else {
        existing.push(userData);
        console.log(`➕ Added new user: ${userData.username}`);
      }
      
      localStorage.setItem(key, JSON.stringify(existing));
      console.log(`✅ User saved successfully: ${userData.username}`);
      
      // Verify save worked
      const savedUser = await this.getUser(userData.username);
      console.log(`🔍 Verification - user exists after save: ${savedUser ? 'YES' : 'NO'}`);
      
      return savedUser;
    } catch (error) {
      console.error('❌ Error saving user:', error);
      throw error;
    }
  }

  static async getUser(username) {
    try {
      const key = this.getStorageKey('users');
      const users = JSON.parse(localStorage.getItem(key) || '[]');
      return users.find(user => user.username === username) || null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  static async getAllUsers() {
    try {
      const key = this.getStorageKey('users');
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  static async updateUser(username, updates) {
    try {
      const key = this.getStorageKey('users');
      const users = JSON.parse(localStorage.getItem(key) || '[]');
      const userIndex = users.findIndex(user => user.username === username);
      
      if (userIndex >= 0) {
        users[userIndex] = { ...users[userIndex], ...updates };
        localStorage.setItem(key, JSON.stringify(users));
        return users[userIndex];
      }
      return null;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  static async deleteUser(username) {
    try {
      const key = this.getStorageKey('users');
      const users = JSON.parse(localStorage.getItem(key) || '[]');
      const filtered = users.filter(user => user.username !== username);
      localStorage.setItem(key, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  static async resetUserData(username) {
    try {
      // Reset user-specific data while keeping user account
      const userTables = ['progress', 'timeTracking', 'notes', 'planners', 'dashboardFigures', 'auditLogs'];
      
      for (const table of userTables) {
        const key = this.getStorageKey(table, username);
        localStorage.removeItem(key);
      }
      
      return true;
    } catch (error) {
      console.error('Error resetting user data:', error);
      throw error;
    }
  }

  // Session Management
  static async createSession(sessionData) {
    return await this.save('sessions', sessionData);
  }

  static async getSession(sessionId) {
    return await this.get('sessions', sessionId);
  }

  static async updateSession(sessionId, updates) {
    const session = await this.get('sessions', sessionId);
    if (session) {
      return await this.save('sessions', { ...session, ...updates });
    }
    return null;
  }

  static async deleteSession(sessionId) {
    return await this.delete('sessions', sessionId);
  }

  static async getUserSessions(userId) {
    const sessions = await this.getAll('sessions');
    return sessions.filter(session => session.userId === userId);
  }

  static async getSessionsByUser(userId) {
    return await this.getUserSessions(userId);
  }

  static async getAllSessions() {
    return await this.getAll('sessions');
  }

  static async cleanupExpiredSessions() {
    const sessions = await this.getAll('sessions');
    const now = Date.now();
    const validSessions = sessions.filter(session => {
      return session.expiresAt && new Date(session.expiresAt).getTime() > now;
    });
    
    const key = this.getStorageKey('sessions');
    localStorage.setItem(key, JSON.stringify(validSessions));
    return sessions.length - validSessions.length;
  }

  static async getStorageStats() {
    try {
      const tables = ['dashboardFigures', 'notes', 'auditLogs', 'progress', 'planners', 'events', 'settings', 'users', 'sessions'];
      const stats = {};
      
      for (const table of tables) {
        const data = await this.getAll(table);
        stats[table] = data.length;
      }
      
      return stats;
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {};
    }
  }

  static async clearAllData() {
    try {
      const tables = ['dashboardFigures', 'notes', 'auditLogs', 'progress', 'planners', 'events', 'settings', 'users', 'sessions'];
      
      for (const table of tables) {
        const key = this.getStorageKey(table);
        localStorage.removeItem(key);
      }
      
      return true;
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }

  static async importData(data) {
    try {
      if (!data || !data.data) {
        throw new Error('Invalid import data format');
      }
      
      for (const [table, records] of Object.entries(data.data)) {
        const key = this.getStorageKey(table);
        localStorage.setItem(key, JSON.stringify(records));
      }
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      throw error;
    }
  }
}

// Initialize simple database
export const initializeSimpleDatabase = async () => {
  try {
    // Check if migration is needed
    const migrationCompleted = await SimpleDatabaseService.getSetting('migration_completed', false);
    
    if (!migrationCompleted) {
      await SimpleDatabaseService.migrateFromLocalStorage();
    }
    
    console.log('Simple database initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing simple database:', error);
    throw error;
  }
};
