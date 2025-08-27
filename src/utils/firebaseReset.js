// Firebase Database Reset Utility
// WARNING: This module contains destructive operations
// Use with extreme caution in production environments

import { 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  writeBatch,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

class FirebaseResetManager {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.resetHistory = [];
  }

  // Create backup of all data before reset
  async createBackup() {
    try {
      console.log('📦 Creating database backup...');
      const backup = {
        timestamp: new Date().toISOString(),
        collections: {}
      };

      // Define collections to backup
      const collectionsToBackup = [
        'portal_users',
        'user_progress',
        'user_notes',
        'user_schedules',
        'audit_logs',
        'settings'
      ];

      for (const collectionName of collectionsToBackup) {
        try {
          const collectionRef = collection(db, collectionName);
          const snapshot = await getDocs(collectionRef);
          
          backup.collections[collectionName] = [];
          snapshot.forEach((doc) => {
            backup.collections[collectionName].push({
              id: doc.id,
              data: doc.data()
            });
          });
          
          console.log(`✅ Backed up ${backup.collections[collectionName].length} documents from ${collectionName}`);
        } catch (error) {
          console.warn(`⚠️ Failed to backup collection ${collectionName}:`, error);
          backup.collections[collectionName] = { error: error.message };
        }
      }

      // Save backup to localStorage as fallback
      const backupKey = `firebase_backup_${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(backup));
      
      console.log('✅ Backup created successfully');
      return backup;
    } catch (error) {
      console.error('❌ Backup creation failed:', error);
      throw new Error(`Backup failed: ${error.message}`);
    }
  }

  // Reset specific collection
  async resetCollection(collectionName, options = {}) {
    try {
      console.log(`🗑️ Resetting collection: ${collectionName}`);
      
      if (this.isProduction && !options.confirmProduction) {
        throw new Error('Production reset requires explicit confirmation');
      }

      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);
      
      if (snapshot.empty) {
        console.log(`📭 Collection ${collectionName} is already empty`);
        return { deleted: 0, collection: collectionName };
      }

      const batch = writeBatch(db);
      let deleteCount = 0;

      snapshot.forEach((document) => {
        batch.delete(doc(db, collectionName, document.id));
        deleteCount++;
      });

      await batch.commit();
      
      console.log(`✅ Deleted ${deleteCount} documents from ${collectionName}`);
      return { deleted: deleteCount, collection: collectionName };
    } catch (error) {
      console.error(`❌ Failed to reset collection ${collectionName}:`, error);
      throw error;
    }
  }

  // Reset all user data (preserves system settings)
  async resetUserData(options = {}) {
    try {
      console.log('🔄 Starting user data reset...');
      
      // Safety checks
      if (this.isProduction && !options.confirmProduction) {
        throw new Error('Production reset requires explicit confirmation');
      }

      if (!options.skipBackup) {
        await this.createBackup();
      }

      const userCollections = [
        'portal_users',
        'user_progress', 
        'user_notes',
        'user_schedules'
      ];

      const results = [];
      for (const collectionName of userCollections) {
        const result = await this.resetCollection(collectionName, options);
        results.push(result);
      }

      // Log reset operation
      await this.logResetOperation('user_data', results);
      
      console.log('✅ User data reset completed');
      return {
        success: true,
        results: results,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ User data reset failed:', error);
      throw error;
    }
  }

  // Complete database reset (DANGEROUS)
  async resetEntireDatabase(options = {}) {
    try {
      console.log('💥 Starting complete database reset...');
      
      // Multiple safety checks for complete reset
      if (this.isProduction && !options.confirmProduction) {
        throw new Error('Production reset requires explicit confirmation');
      }

      if (!options.confirmDestruction) {
        throw new Error('Complete reset requires destruction confirmation');
      }

      if (!options.skipBackup) {
        await this.createBackup();
      }

      const allCollections = [
        'portal_users',
        'user_progress',
        'user_notes', 
        'user_schedules',
        'audit_logs',
        'settings'
      ];

      const results = [];
      for (const collectionName of allCollections) {
        const result = await this.resetCollection(collectionName, options);
        results.push(result);
      }

      // Clear local storage as well
      if (options.clearLocalStorage) {
        localStorage.clear();
        console.log('🧹 Local storage cleared');
      }

      console.log('✅ Complete database reset finished');
      return {
        success: true,
        results: results,
        timestamp: new Date().toISOString(),
        type: 'complete_reset'
      };
    } catch (error) {
      console.error('❌ Complete database reset failed:', error);
      throw error;
    }
  }

  // Restore from backup
  async restoreFromBackup(backup) {
    try {
      console.log('🔄 Starting database restore...');
      
      if (!backup || !backup.collections) {
        throw new Error('Invalid backup data');
      }

      const results = [];
      
      for (const [collectionName, documents] of Object.entries(backup.collections)) {
        if (documents.error) {
          console.warn(`⚠️ Skipping ${collectionName} due to backup error`);
          continue;
        }

        console.log(`📥 Restoring ${documents.length} documents to ${collectionName}`);
        
        const batch = writeBatch(db);
        let restoreCount = 0;

        for (const document of documents) {
          const docRef = doc(db, collectionName, document.id);
          batch.set(docRef, {
            ...document.data,
            restoredAt: serverTimestamp()
          });
          restoreCount++;
        }

        await batch.commit();
        results.push({ collection: collectionName, restored: restoreCount });
        console.log(`✅ Restored ${restoreCount} documents to ${collectionName}`);
      }

      console.log('✅ Database restore completed');
      return {
        success: true,
        results: results,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Database restore failed:', error);
      throw error;
    }
  }

  // Log reset operations for audit trail
  async logResetOperation(type, results) {
    try {
      const logEntry = {
        type: 'database_reset',
        resetType: type,
        timestamp: serverTimestamp(),
        results: results,
        userAgent: navigator.userAgent,
        environment: process.env.NODE_ENV
      };

      // Try to save to audit logs if collection still exists
      try {
        const auditRef = collection(db, 'reset_audit');
        await addDoc(auditRef, logEntry);
      } catch (error) {
        // If audit collection doesn't exist, save to localStorage
        const auditKey = `reset_audit_${Date.now()}`;
        localStorage.setItem(auditKey, JSON.stringify(logEntry));
      }
    } catch (error) {
      console.warn('Failed to log reset operation:', error);
    }
  }

  // Get available backups from localStorage
  getAvailableBackups() {
    const backups = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('firebase_backup_')) {
        try {
          const backup = JSON.parse(localStorage.getItem(key));
          backups.push({
            key: key,
            timestamp: backup.timestamp,
            collections: Object.keys(backup.collections)
          });
        } catch (error) {
          console.warn(`Invalid backup found: ${key}`);
        }
      }
    }
    return backups.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Safety check before any destructive operation
  performSafetyCheck() {
    const checks = {
      environment: process.env.NODE_ENV,
      isProduction: this.isProduction,
      timestamp: new Date().toISOString(),
      warnings: []
    };

    if (this.isProduction) {
      checks.warnings.push('PRODUCTION ENVIRONMENT DETECTED');
    }

    if (!navigator.onLine) {
      checks.warnings.push('OFFLINE - Changes may not sync properly');
    }

    return checks;
  }
}

// Create singleton instance
const firebaseResetManager = new FirebaseResetManager();

// Export both the class and instance
export { FirebaseResetManager };
export default firebaseResetManager;
