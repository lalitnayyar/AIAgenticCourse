#!/usr/bin/env node

/**
 * External Firebase Database Reset Script
 * 
 * This standalone script can be run from command line to reset the Firebase database
 * Usage: node scripts/resetDatabase.js [options]
 * 
 * Options:
 *   --user-data    Reset only user data (preserves system settings)
 *   --complete     Complete database reset (DANGEROUS)
 *   --backup       Create backup before reset
 *   --restore      Restore from backup file
 *   --list-backups List available backups
 *   --force        Skip confirmation prompts (use with caution)
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  writeBatch,
  connectFirestoreEmulator 
} = require('firebase/firestore');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Firebase configuration (same as in your app)
const firebaseConfig = {
  apiKey: "AIzaSyBvOkBH0ImFDomRDMfnl_ZmLf_9gCzPY2E",
  authDomain: "learning-portal-b0ced.firebaseapp.com",
  projectId: "learning-portal-b0ced",
  storageBucket: "learning-portal-b0ced.firebasestorage.app",
  messagingSenderId: "1018705492823",
  appId: "1:1018705492823:web:6c9b1c1e8f7d2a3b4c5d6e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// If running in development, connect to emulator
if (process.env.NODE_ENV === 'development' && process.env.USE_EMULATOR === 'true') {
  connectFirestoreEmulator(db, 'localhost', 8080);
}

class DatabaseResetCLI {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async question(query) {
    return new Promise(resolve => {
      this.rl.question(query, resolve);
    });
  }

  close() {
    this.rl.close();
  }

  async createBackup() {
    try {
      console.log('📦 Creating database backup...');
      const timestamp = new Date().toISOString();
      const backup = {
        timestamp,
        collections: {}
      };

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
          console.warn(`⚠️ Failed to backup collection ${collectionName}:`, error.message);
          backup.collections[collectionName] = { error: error.message };
        }
      }

      // Save backup to file
      const backupDir = path.join(__dirname, '..', 'backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const backupFile = path.join(backupDir, `firebase_backup_${timestamp.replace(/[:.]/g, '-')}.json`);
      fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
      
      console.log(`✅ Backup saved to: ${backupFile}`);
      return backupFile;
    } catch (error) {
      console.error('❌ Backup creation failed:', error);
      throw error;
    }
  }

  async resetCollection(collectionName) {
    try {
      console.log(`🗑️ Resetting collection: ${collectionName}`);
      
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

  async resetUserData(force = false) {
    try {
      console.log('🔄 Starting user data reset...');
      
      if (!force) {
        const confirm = await this.question(
          'This will delete ALL user data (users, progress, notes, schedules).\n' +
          'System settings and audit logs will be preserved.\n' +
          'Are you sure? (yes/no): '
        );
        
        if (confirm.toLowerCase() !== 'yes') {
          console.log('Reset cancelled');
          return;
        }
      }

      const userCollections = [
        'portal_users',
        'user_progress', 
        'user_notes',
        'user_schedules'
      ];

      const results = [];
      for (const collectionName of userCollections) {
        const result = await this.resetCollection(collectionName);
        results.push(result);
      }

      console.log('✅ User data reset completed');
      console.log('Summary:');
      results.forEach(r => {
        console.log(`  - ${r.collection}: ${r.deleted} documents deleted`);
      });
      
      return results;
    } catch (error) {
      console.error('❌ User data reset failed:', error);
      throw error;
    }
  }

  async resetEntireDatabase(force = false) {
    try {
      console.log('💥 Starting complete database reset...');
      
      if (!force) {
        const confirm1 = await this.question(
          '⚠️ DANGER: This will delete EVERYTHING in the database!\n' +
          'This action is IRREVERSIBLE!\n' +
          'Are you absolutely sure? (yes/no): '
        );
        
        if (confirm1.toLowerCase() !== 'yes') {
          console.log('Reset cancelled');
          return;
        }

        const confirm2 = await this.question(
          'Type "DELETE EVERYTHING" to confirm complete database reset: '
        );
        
        if (confirm2 !== 'DELETE EVERYTHING') {
          console.log('Reset cancelled - confirmation text did not match');
          return;
        }
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
        const result = await this.resetCollection(collectionName);
        results.push(result);
      }

      console.log('✅ Complete database reset finished');
      console.log('Summary:');
      results.forEach(r => {
        console.log(`  - ${r.collection}: ${r.deleted} documents deleted`);
      });
      
      return results;
    } catch (error) {
      console.error('❌ Complete database reset failed:', error);
      throw error;
    }
  }

  async restoreFromBackup(backupFile) {
    try {
      console.log(`🔄 Restoring from backup: ${backupFile}`);
      
      if (!fs.existsSync(backupFile)) {
        throw new Error(`Backup file not found: ${backupFile}`);
      }

      const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
      
      if (!backupData || !backupData.collections) {
        throw new Error('Invalid backup file format');
      }

      const results = [];
      
      for (const [collectionName, documents] of Object.entries(backupData.collections)) {
        if (documents.error) {
          console.warn(`⚠️ Skipping ${collectionName} due to backup error: ${documents.error}`);
          continue;
        }

        console.log(`📥 Restoring ${documents.length} documents to ${collectionName}`);
        
        const batch = writeBatch(db);
        let restoreCount = 0;

        for (const document of documents) {
          const docRef = doc(db, collectionName, document.id);
          batch.set(docRef, {
            ...document.data,
            restoredAt: new Date().toISOString()
          });
          restoreCount++;
        }

        await batch.commit();
        results.push({ collection: collectionName, restored: restoreCount });
        console.log(`✅ Restored ${restoreCount} documents to ${collectionName}`);
      }

      console.log('✅ Database restore completed');
      console.log('Summary:');
      results.forEach(r => {
        console.log(`  - ${r.collection}: ${r.restored} documents restored`);
      });
      
      return results;
    } catch (error) {
      console.error('❌ Database restore failed:', error);
      throw error;
    }
  }

  listBackups() {
    const backupDir = path.join(__dirname, '..', 'backups');
    
    if (!fs.existsSync(backupDir)) {
      console.log('📭 No backups directory found');
      return [];
    }

    const files = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('firebase_backup_') && file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          file: file,
          path: filePath,
          size: stats.size,
          created: stats.mtime
        };
      })
      .sort((a, b) => b.created - a.created);

    console.log(`📦 Available backups (${files.length}):`);
    files.forEach((backup, index) => {
      console.log(`  ${index + 1}. ${backup.file}`);
      console.log(`     Created: ${backup.created.toLocaleString()}`);
      console.log(`     Size: ${(backup.size / 1024).toFixed(2)} KB`);
      console.log('');
    });

    return files;
  }

  async run() {
    try {
      const args = process.argv.slice(2);
      const force = args.includes('--force');

      if (args.includes('--help') || args.length === 0) {
        console.log(`
Firebase Database Reset Tool

Usage: node scripts/resetDatabase.js [options]

Options:
  --user-data      Reset only user data (preserves system settings)
  --complete       Complete database reset (DANGEROUS)
  --backup         Create backup only
  --restore <file> Restore from backup file
  --list-backups   List available backups
  --force          Skip confirmation prompts (use with caution)
  --help           Show this help message

Examples:
  node scripts/resetDatabase.js --backup
  node scripts/resetDatabase.js --user-data
  node scripts/resetDatabase.js --complete --force
  node scripts/resetDatabase.js --restore backups/firebase_backup_2024-01-01.json
        `);
        return;
      }

      if (args.includes('--list-backups')) {
        this.listBackups();
        return;
      }

      if (args.includes('--backup')) {
        await this.createBackup();
        return;
      }

      if (args.includes('--restore')) {
        const restoreIndex = args.indexOf('--restore');
        const backupFile = args[restoreIndex + 1];
        
        if (!backupFile) {
          console.error('❌ Please specify backup file to restore');
          return;
        }
        
        await this.restoreFromBackup(backupFile);
        return;
      }

      // Create backup before any reset operation (unless forced)
      if (!force) {
        console.log('Creating backup before reset...');
        await this.createBackup();
      }

      if (args.includes('--user-data')) {
        await this.resetUserData(force);
      } else if (args.includes('--complete')) {
        await this.resetEntireDatabase(force);
      } else {
        console.log('❌ Please specify --user-data or --complete');
      }

    } catch (error) {
      console.error('❌ Operation failed:', error);
      process.exit(1);
    } finally {
      this.close();
    }
  }
}

// Run the CLI if this file is executed directly
if (require.main === module) {
  const cli = new DatabaseResetCLI();
  cli.run();
}

module.exports = DatabaseResetCLI;
