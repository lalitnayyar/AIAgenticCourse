import Dexie from 'dexie';

// Define the database schema
export class LearningPortalDB extends Dexie {
  constructor() {
    super('LearningPortalDB');
    
    this.version(1).stores({
      // Dashboard figures and metrics
      dashboardFigures: '++id, type, timestamp',
      
      // Notes with full-text search capability
      notes: '++id, weekNum, dayNum, timestamp',
      
      // Audit logs for all user actions
      auditLogs: '++id, timestamp, action, entityType',
      
      // Progress tracking with detailed metrics
      progress: '++id, lessonId, weekNum, dayNum, status, completedAt',
      
      // Planner data for scheduling and planning
      planners: '++id, weekNum, dayNum, completed, createdAt',
      
      // Events for comprehensive activity tracking
      events: '++id, timestamp, eventType, category',
      
      // User settings and preferences
      settings: '++id, key'
    });

    // Define hooks for automatic timestamping
    this.auditLogs.hook('creating', function (primKey, obj, trans) {
      obj.timestamp = new Date().toISOString();
    });

    this.events.hook('creating', function (primKey, obj, trans) {
      obj.timestamp = new Date().toISOString();
      obj.sessionId = obj.sessionId || generateSessionId();
    });

    this.notes.hook('creating', function (primKey, obj, trans) {
      obj.timestamp = new Date().toISOString();
      obj.lastModified = new Date().toISOString();
    });

    this.notes.hook('updating', function (modifications, primKey, obj, trans) {
      modifications.lastModified = new Date().toISOString();
    });

    this.planners.hook('creating', function (primKey, obj, trans) {
      obj.createdAt = new Date().toISOString();
      obj.updatedAt = new Date().toISOString();
    });

    this.planners.hook('updating', function (modifications, primKey, obj, trans) {
      modifications.updatedAt = new Date().toISOString();
    });
  }
}

// Create database instance
export const db = new LearningPortalDB();

// Clear existing database if schema has changed
const clearDatabaseOnSchemaChange = async () => {
  try {
    // Check if we need to clear the database due to schema changes
    const schemaVersion = await db.settings.where('key').equals('schema_version').first();
    const currentSchemaVersion = '1.1'; // Updated version due to compound index changes
    
    if (!schemaVersion || schemaVersion.value !== currentSchemaVersion) {
      console.log('Schema change detected, clearing database...');
      await db.delete();
      await db.open();
      
      // Set new schema version
      await db.settings.add({
        key: 'schema_version',
        value: currentSchemaVersion,
        updatedAt: new Date().toISOString()
      });
      
      console.log('Database cleared and reinitialized with new schema');
    }
  } catch (error) {
    console.log('Database initialization or schema check failed, clearing database...');
    try {
      await db.delete();
      await db.open();
      await db.settings.add({
        key: 'schema_version',
        value: '1.1',
        updatedAt: new Date().toISOString()
      });
    } catch (clearError) {
      console.error('Failed to clear database:', clearError);
    }
  }
};

// Generate unique session ID
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Database service class with CRUD operations
export class DatabaseService {
  
  // Dashboard Figures Methods
  static async saveDashboardFigure(type, value, metadata = {}) {
    try {
      const figure = {
        type,
        value,
        timestamp: new Date().toISOString(),
        metadata
      };
      
      const id = await db.dashboardFigures.add(figure);
      await this.logEvent('dashboard_figure_saved', 'dashboard', { figureId: id, type, value });
      return id;
    } catch (error) {
      console.error('Error saving dashboard figure:', error);
      throw error;
    }
  }

  static async getDashboardFigures(type = null, limit = 100) {
    try {
      let query = db.dashboardFigures.orderBy('timestamp').reverse();
      if (type) {
        query = query.filter(figure => figure.type === type);
      }
      return await query.limit(limit).toArray();
    } catch (error) {
      console.error('Error getting dashboard figures:', error);
      return [];
    }
  }

  static async getLatestDashboardFigure(type) {
    try {
      return await db.dashboardFigures
        .where('type')
        .equals(type)
        .orderBy('timestamp')
        .reverse()
        .first();
    } catch (error) {
      console.error('Error getting latest dashboard figure:', error);
      return null;
    }
  }

  // Notes Methods
  static async saveNote(weekNum, dayNum, content, tags = []) {
    try {
      const existingNote = await db.notes
        .where('weekNum')
        .equals(weekNum)
        .and(note => note.dayNum === dayNum)
        .first();

      if (existingNote) {
        const id = await db.notes.update(existingNote.id, { 
          content, 
          tags,
          lastModified: new Date().toISOString()
        });
        await this.logEvent('note_updated', 'notes', { noteId: existingNote.id, weekNum, dayNum });
        return existingNote.id;
      } else {
        const note = {
          weekNum,
          dayNum,
          content,
          tags,
          timestamp: new Date().toISOString(),
          lastModified: new Date().toISOString()
        };
        const id = await db.notes.add(note);
        await this.logEvent('note_created', 'notes', { noteId: id, weekNum, dayNum });
        return id;
      }
    } catch (error) {
      console.error('Error saving note:', error);
      throw error;
    }
  }

  static async getNote(weekNum, dayNum) {
    try {
      return await db.notes
        .where('weekNum')
        .equals(weekNum)
        .and(note => note.dayNum === dayNum)
        .first();
    } catch (error) {
      console.error('Error getting note:', error);
      return null;
    }
  }

  static async getAllNotes() {
    try {
      return await db.notes.orderBy('lastModified').reverse().toArray();
    } catch (error) {
      console.error('Error getting all notes:', error);
      return [];
    }
  }

  static async deleteNote(weekNum, dayNum) {
    try {
      const note = await this.getNote(weekNum, dayNum);
      if (note) {
        await db.notes.delete(note.id);
        await this.logEvent('note_deleted', 'notes', { noteId: note.id, weekNum, dayNum });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }

  // Progress Methods
  static async saveProgress(lessonId, weekNum, dayNum, lessonIndex, status, timeSpent = 0) {
    try {
      const existingProgress = await db.progress
        .where('lessonId')
        .equals(lessonId)
        .first();

      const progressData = {
        lessonId,
        weekNum,
        dayNum,
        lessonIndex,
        status,
        timeSpent,
        completedAt: status === 'completed' ? new Date().toISOString() : null
      };

      if (existingProgress) {
        await db.progress.update(existingProgress.id, progressData);
        await this.logEvent('progress_updated', 'progress', { 
          lessonId, 
          status, 
          timeSpent,
          progressId: existingProgress.id 
        });
        return existingProgress.id;
      } else {
        progressData.startedAt = new Date().toISOString();
        const id = await db.progress.add(progressData);
        await this.logEvent('progress_created', 'progress', { 
          lessonId, 
          status, 
          timeSpent,
          progressId: id 
        });
        return id;
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      throw error;
    }
  }

  static async getProgress(lessonId) {
    try {
      return await db.progress
        .where('lessonId')
        .equals(lessonId)
        .first();
    } catch (error) {
      console.error('Error getting progress:', error);
      return null;
    }
  }

  static async getAllProgress() {
    try {
      return await db.progress.orderBy('completedAt').reverse().toArray();
    } catch (error) {
      console.error('Error getting all progress:', error);
      return [];
    }
  }

  static async getWeekProgress(weekNum) {
    try {
      return await db.progress
        .where('weekNum')
        .equals(weekNum)
        .toArray();
    } catch (error) {
      console.error('Error getting week progress:', error);
      return [];
    }
  }

  // Planner Methods
  static async savePlanner(weekNum, dayNum, planType, content, priority = 'medium', dueDate = null) {
    try {
      const planner = {
        weekNum,
        dayNum,
        planType,
        content,
        priority,
        dueDate,
        completed: false
      };

      const id = await db.planners.add(planner);
      await this.logEvent('planner_created', 'planners', { 
        plannerId: id, 
        weekNum, 
        dayNum, 
        planType 
      });
      return id;
    } catch (error) {
      console.error('Error saving planner:', error);
      throw error;
    }
  }

  static async updatePlanner(id, updates) {
    try {
      await db.planners.update(id, updates);
      await this.logEvent('planner_updated', 'planners', { plannerId: id, updates });
      return id;
    } catch (error) {
      console.error('Error updating planner:', error);
      throw error;
    }
  }

  static async getPlanner(id) {
    try {
      return await db.planners.get(id);
    } catch (error) {
      console.error('Error getting planner:', error);
      return null;
    }
  }

  static async getPlannersByWeek(weekNum) {
    try {
      return await db.planners
        .where('weekNum')
        .equals(weekNum)
        .orderBy('createdAt')
        .toArray();
    } catch (error) {
      console.error('Error getting planners by week:', error);
      return [];
    }
  }

  static async getAllPlanners() {
    try {
      return await db.planners.orderBy('createdAt').reverse().toArray();
    } catch (error) {
      console.error('Error getting all planners:', error);
      return [];
    }
  }

  static async deletePlanner(id) {
    try {
      await db.planners.delete(id);
      await this.logEvent('planner_deleted', 'planners', { plannerId: id });
      return true;
    } catch (error) {
      console.error('Error deleting planner:', error);
      throw error;
    }
  }

  // Audit Logs Methods
  static async logAudit(action, entityType, entityId, details = {}, userId = 'anonymous') {
    try {
      const auditLog = {
        action,
        entityType,
        entityId,
        details,
        userId
      };

      return await db.auditLogs.add(auditLog);
    } catch (error) {
      console.error('Error logging audit:', error);
      throw error;
    }
  }

  static async getAuditLogs(limit = 100, entityType = null) {
    try {
      let query = db.auditLogs.orderBy('timestamp').reverse();
      if (entityType) {
        query = query.filter(log => log.entityType === entityType);
      }
      return await query.limit(limit).toArray();
    } catch (error) {
      console.error('Error getting audit logs:', error);
      return [];
    }
  }

  // Events Methods
  static async logEvent(eventType, category, data = {}, sessionId = null) {
    try {
      const event = {
        eventType,
        category,
        data,
        sessionId: sessionId || generateSessionId()
      };

      return await db.events.add(event);
    } catch (error) {
      console.error('Error logging event:', error);
      throw error;
    }
  }

  static async getEvents(limit = 100, category = null, eventType = null) {
    try {
      let query = db.events.orderBy('timestamp').reverse();
      
      if (category && eventType) {
        query = query.filter(event => 
          event.category === category && event.eventType === eventType
        );
      } else if (category) {
        query = query.filter(event => event.category === category);
      } else if (eventType) {
        query = query.filter(event => event.eventType === eventType);
      }
      
      return await query.limit(limit).toArray();
    } catch (error) {
      console.error('Error getting events:', error);
      return [];
    }
  }

  // Settings Methods
  static async saveSetting(key, value) {
    try {
      const existingSetting = await db.settings
        .where('key')
        .equals(key)
        .first();

      if (existingSetting) {
        await db.settings.update(existingSetting.id, { 
          value, 
          updatedAt: new Date().toISOString() 
        });
        return existingSetting.id;
      } else {
        const setting = {
          key,
          value,
          updatedAt: new Date().toISOString()
        };
        return await db.settings.add(setting);
      }
    } catch (error) {
      console.error('Error saving setting:', error);
      throw error;
    }
  }

  static async getSetting(key, defaultValue = null) {
    try {
      const setting = await db.settings
        .where('key')
        .equals(key)
        .first();
      
      return setting ? setting.value : defaultValue;
    } catch (error) {
      console.error('Error getting setting:', error);
      return defaultValue;
    }
  }

  // Migration Methods
  static async migrateFromLocalStorage() {
    try {
      console.log('Starting migration from localStorage to IndexedDB...');

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

      // Migrate time tracking
      const timeTracking = localStorage.getItem('timeTracking');
      if (timeTracking) {
        const tracking = JSON.parse(timeTracking);
        for (const [lessonId, timeData] of Object.entries(tracking)) {
          const [weekNum, dayNum, lessonIndex] = lessonId.split('-').map(Number);
          await this.saveProgress(
            lessonId, 
            weekNum, 
            dayNum, 
            lessonIndex, 
            'in_progress', 
            timeData.totalTime || 0
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
      await db.transaction('rw', db.tables, async () => {
        for (const table of db.tables) {
          await table.clear();
        }
      });
      
      console.log('All data cleared successfully');
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    }
  }

  static async exportData() {
    try {
      const data = {};
      
      for (const table of db.tables) {
        data[table.name] = await table.toArray();
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

  static async getStorageStats() {
    try {
      const stats = {};
      
      for (const table of db.tables) {
        stats[table.name] = await table.count();
      }
      
      return stats;
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {};
    }
  }
}

// Initialize database and perform migration if needed
export const initializeDatabase = async () => {
  try {
    // Clear database if schema has changed
    await clearDatabaseOnSchemaChange();
    
    await db.open();
    
    // Check if migration is needed
    const migrationCompleted = await DatabaseService.getSetting('migration_completed', false);
    
    if (!migrationCompleted) {
      await DatabaseService.migrateFromLocalStorage();
    }
    
    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};
