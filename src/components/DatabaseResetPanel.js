import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import firebaseResetManager from '../utils/firebaseReset';

const DatabaseResetPanel = () => {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState([]);
  const [safetyCheck, setSafetyCheck] = useState(null);
  const [confirmations, setConfirmations] = useState({
    userDataReset: false,
    completeReset: false,
    productionConfirm: false,
    destructionConfirm: false
  });

  useEffect(() => {
    if (isAdmin()) {
      loadBackups();
      performSafetyCheck();
    }
  }, [isAdmin]);

  const loadBackups = () => {
    const availableBackups = firebaseResetManager.getAvailableBackups();
    setBackups(availableBackups);
  };

  const performSafetyCheck = () => {
    const check = firebaseResetManager.performSafetyCheck();
    setSafetyCheck(check);
  };

  const handleCreateBackup = async () => {
    setLoading(true);
    try {
      await firebaseResetManager.createBackup();
      loadBackups();
      alert('✅ Backup created successfully!');
    } catch (error) {
      alert(`❌ Backup failed: ${error.message}`);
    }
    setLoading(false);
  };

  const handleResetUserData = async () => {
    if (!confirmations.userDataReset) {
      alert('Please confirm user data reset by checking the confirmation box');
      return;
    }

    if (safetyCheck?.isProduction && !confirmations.productionConfirm) {
      alert('Production environment detected. Please confirm production reset.');
      return;
    }

    const confirmed = window.confirm(
      'This will delete ALL user data (users, progress, notes, schedules).\n\n' +
      'Are you absolutely sure you want to continue?'
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      const result = await firebaseResetManager.resetUserData({
        confirmProduction: confirmations.productionConfirm,
        skipBackup: false
      });
      
      loadBackups();
      alert(`✅ User data reset completed!\n\nDeleted:\n${result.results.map(r => `- ${r.collection}: ${r.deleted} documents`).join('\n')}`);
      
      // Reset confirmations
      setConfirmations({
        userDataReset: false,
        completeReset: false,
        productionConfirm: false,
        destructionConfirm: false
      });
    } catch (error) {
      alert(`❌ Reset failed: ${error.message}`);
    }
    setLoading(false);
  };

  const handleCompleteReset = async () => {
    if (!confirmations.completeReset || !confirmations.destructionConfirm) {
      alert('Please confirm complete reset and destruction by checking both confirmation boxes');
      return;
    }

    if (safetyCheck?.isProduction && !confirmations.productionConfirm) {
      alert('Production environment detected. Please confirm production reset.');
      return;
    }

    const confirmed = window.confirm(
      '⚠️ DANGER: This will delete EVERYTHING in the database!\n\n' +
      'This includes:\n' +
      '- All users and authentication data\n' +
      '- All progress and learning data\n' +
      '- All notes and schedules\n' +
      '- All audit logs and settings\n\n' +
      'This action is IRREVERSIBLE!\n\n' +
      'Type "DELETE EVERYTHING" to confirm:'
    );

    if (!confirmed) return;

    const finalConfirm = prompt('Type "DELETE EVERYTHING" to confirm complete database reset:');
    if (finalConfirm !== 'DELETE EVERYTHING') {
      alert('Reset cancelled - confirmation text did not match');
      return;
    }

    setLoading(true);
    try {
      const result = await firebaseResetManager.resetEntireDatabase({
        confirmProduction: confirmations.productionConfirm,
        confirmDestruction: confirmations.destructionConfirm,
        clearLocalStorage: true,
        skipBackup: false
      });
      
      alert(`✅ Complete database reset finished!\n\nDeleted:\n${result.results.map(r => `- ${r.collection}: ${r.deleted} documents`).join('\n')}\n\nPage will reload...`);
      
      // Reload the page after complete reset
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      alert(`❌ Complete reset failed: ${error.message}`);
    }
    setLoading(false);
  };

  const handleRestoreBackup = async (backupKey) => {
    const confirmed = window.confirm(
      `Restore database from backup?\n\n` +
      `This will overwrite current data with backup data.\n` +
      `Backup: ${backupKey}`
    );

    if (!confirmed) return;

    setLoading(true);
    try {
      const backupData = JSON.parse(localStorage.getItem(backupKey));
      const result = await firebaseResetManager.restoreFromBackup(backupData);
      
      alert(`✅ Database restored successfully!\n\nRestored:\n${result.results.map(r => `- ${r.collection}: ${r.restored} documents`).join('\n')}`);
    } catch (error) {
      alert(`❌ Restore failed: ${error.message}`);
    }
    setLoading(false);
  };

  if (!isAdmin()) {
    return (
      <div className="p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-red-500 mb-4">🚫 Access Denied</h1>
          <p className="text-gray-400">Database reset functionality is restricted to administrators only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen text-white">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent mb-2">
            🗑️ Database Reset Panel
          </h1>
          <p className="text-gray-400">
            ⚠️ <strong>WARNING:</strong> This panel contains destructive operations. Use with extreme caution.
          </p>
        </div>

        {/* Safety Check */}
        {safetyCheck && (
          <div className="bg-yellow-900/30 border border-yellow-500 rounded-lg p-4 mb-6">
            <h3 className="text-yellow-400 font-semibold mb-2">🛡️ Safety Check</h3>
            <div className="text-sm text-gray-300">
              <p><strong>Environment:</strong> {safetyCheck.environment}</p>
              <p><strong>Production:</strong> {safetyCheck.isProduction ? '⚠️ YES' : '✅ NO'}</p>
              {safetyCheck.warnings.length > 0 && (
                <div className="mt-2">
                  <strong>Warnings:</strong>
                  <ul className="list-disc list-inside text-yellow-300">
                    {safetyCheck.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Backup Section */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-blue-400 mb-4">📦 Backup Management</h2>
          
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={handleCreateBackup}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : '📦 Create Backup'}
            </button>
            <button
              onClick={loadBackups}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
            >
              🔄 Refresh Backups
            </button>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-300">Available Backups ({backups.length})</h3>
            {backups.length === 0 ? (
              <p className="text-gray-500">No backups available</p>
            ) : (
              <div className="space-y-2">
                {backups.map((backup, index) => (
                  <div key={backup.key} className="bg-gray-700 p-3 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{new Date(backup.timestamp).toLocaleString()}</p>
                      <p className="text-gray-400 text-sm">Collections: {backup.collections.join(', ')}</p>
                    </div>
                    <button
                      onClick={() => handleRestoreBackup(backup.key)}
                      disabled={loading}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition disabled:opacity-50"
                    >
                      📥 Restore
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reset Operations */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-2xl font-bold text-red-400 mb-4">🗑️ Reset Operations</h2>

          {/* User Data Reset */}
          <div className="bg-orange-900/20 border border-orange-500 rounded-lg p-4 mb-6">
            <h3 className="text-orange-400 font-semibold mb-3">Reset User Data Only</h3>
            <p className="text-gray-300 text-sm mb-4">
              Deletes all user accounts, progress, notes, and schedules. Preserves system settings and audit logs.
            </p>
            
            <div className="space-y-2 mb-4">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={confirmations.userDataReset}
                  onChange={(e) => setConfirmations(prev => ({...prev, userDataReset: e.target.checked}))}
                  className="rounded"
                />
                <span>I understand this will delete all user data</span>
              </label>
              
              {safetyCheck?.isProduction && (
                <label className="flex items-center space-x-2 text-sm text-red-300">
                  <input
                    type="checkbox"
                    checked={confirmations.productionConfirm}
                    onChange={(e) => setConfirmations(prev => ({...prev, productionConfirm: e.target.checked}))}
                    className="rounded"
                  />
                  <span>I confirm this is a production environment reset</span>
                </label>
              )}
            </div>

            <button
              onClick={handleResetUserData}
              disabled={loading || !confirmations.userDataReset}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Resetting...' : '🗑️ Reset User Data'}
            </button>
          </div>

          {/* Complete Reset */}
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
            <h3 className="text-red-400 font-semibold mb-3">⚠️ Complete Database Reset</h3>
            <p className="text-gray-300 text-sm mb-4">
              <strong>DANGER:</strong> Deletes EVERYTHING in the database. This action is irreversible!
            </p>
            
            <div className="space-y-2 mb-4">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={confirmations.completeReset}
                  onChange={(e) => setConfirmations(prev => ({...prev, completeReset: e.target.checked}))}
                  className="rounded"
                />
                <span>I understand this will delete the entire database</span>
              </label>
              
              <label className="flex items-center space-x-2 text-sm text-red-300">
                <input
                  type="checkbox"
                  checked={confirmations.destructionConfirm}
                  onChange={(e) => setConfirmations(prev => ({...prev, destructionConfirm: e.target.checked}))}
                  className="rounded"
                />
                <span>I confirm I want to destroy all data permanently</span>
              </label>
              
              {safetyCheck?.isProduction && (
                <label className="flex items-center space-x-2 text-sm text-red-300">
                  <input
                    type="checkbox"
                    checked={confirmations.productionConfirm}
                    onChange={(e) => setConfirmations(prev => ({...prev, productionConfirm: e.target.checked}))}
                    className="rounded"
                  />
                  <span>I confirm this is a production environment reset</span>
                </label>
              )}
            </div>

            <button
              onClick={handleCompleteReset}
              disabled={loading || !confirmations.completeReset || !confirmations.destructionConfirm}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Resetting...' : '💥 RESET EVERYTHING'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseResetPanel;
