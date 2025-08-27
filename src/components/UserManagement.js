import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import RefreshButton from './RefreshButton';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'user'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Import services directly
      const HybridDatabaseService = (await import('../services/hybridDatabaseService')).default;
      const authService = (await import('../services/authService')).default;
      
      const allUsers = await authService.getAllUsers();
      console.log('Loaded users:', allUsers);
      setUsers(allUsers || []);
    } catch (error) {
      setError(`Failed to load users: ${error.message}`);
      console.error('Error loading users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Dynamic import with timeout
      const authServiceModule = await Promise.race([
        import('../services/authService'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Import timeout')), 5000))
      ]);
      
      const authService = authServiceModule.default || authServiceModule.authService;
      if (!authService) {
        throw new Error('Auth service not available');
      }
      
      const result = await authService.register(formData.username, formData.password, formData.role);
      
      if (result.success) {
        setSuccess('User created successfully!');
        setFormData({ username: '', password: '', role: 'user' });
        setShowCreateForm(false);
        await loadUsers();
      } else {
        setError(result.error || 'Failed to create user');
      }
    } catch (error) {
      setError('An error occurred while creating the user');
      console.error('Error creating user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Dynamic import with timeout
      const authServiceModule = await Promise.race([
        import('../services/authService'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Import timeout')), 5000))
      ]);
      
      const authService = authServiceModule.default || authServiceModule.authService;
      if (!authService) {
        throw new Error('Auth service not available');
      }
      
      const updates = { role: formData.role };
      if (formData.password) {
        updates.password = formData.password;
      }

      const result = await authService.updateUser(editingUser.username, updates);
      
      if (result.success) {
        setSuccess('User updated successfully!');
        setEditingUser(null);
        setFormData({ username: '', password: '', role: 'user' });
        await loadUsers();
      } else {
        setError(result.error || 'Failed to update user');
      }
    } catch (error) {
      setError('An error occurred while updating the user');
      console.error('Error updating user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Dynamic import with timeout
      const authServiceModule = await Promise.race([
        import('../services/authService'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Import timeout')), 5000))
      ]);
      
      const authService = authServiceModule.default || authServiceModule.authService;
      if (!authService) {
        throw new Error('Auth service not available');
      }
      
      const result = await authService.deleteUser(username);
      
      if (result.success) {
        setSuccess('User deleted successfully!');
        await loadUsers();
      } else {
        setError(result.error || 'Failed to delete user');
      }
    } catch (error) {
      setError('An error occurred while deleting the user');
      console.error('Error deleting user:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      password: '',
      role: user.role
    });
    setShowCreateForm(false);
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setFormData({ username: '', password: '', role: 'user' });
    setError('');
    setSuccess('');
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'user': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            👥 User Management
          </h1>
          <div className="flex items-center space-x-4">
            <RefreshButton onRefreshComplete={(result) => {
              if (result.success) {
                loadUsers();
                setSuccess(`Refreshed ${result.usersRefreshed} users from cloud`);
              }
            }} />
            <button
              onClick={() => {
                setShowCreateForm(true);
                setEditingUser(null);
                setFormData({ username: '', password: '', role: 'user' });
              }}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-2 px-4 rounded-lg transition transform hover:scale-105"
            >
              ➕ Create User
            </button>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">❌ {error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-900/50 border border-green-500 rounded-lg p-4 mb-6">
            <p className="text-green-400">✅ {success}</p>
          </div>
        )}

        {/* Create/Edit User Form */}
        {(showCreateForm || editingUser) && (
          <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
            <h3 className="text-xl font-bold mb-4 text-blue-400">
              {editingUser ? `✏️ Edit User: ${editingUser.username}` : '➕ Create New User'}
            </h3>
            
            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    disabled={editingUser}
                    required={!editingUser}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    placeholder="Enter username"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password {editingUser && '(leave empty to keep current)'}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={!editingUser}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-2 px-4 rounded-lg transition transform hover:scale-105 disabled:opacity-50"
                >
                  {loading ? '⏳ Processing...' : (editingUser ? '💾 Update User' : '➕ Create User')}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    cancelEdit();
                  }}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition"
                >
                  ❌ Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users List */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h3 className="text-xl font-bold mb-4 text-purple-400">
            👥 All Users ({users.length})
          </h3>

          {loading && !users.length ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-4">👤</div>
              <p>No users found. Create the first user to get started!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-300">Username</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-300">Role</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-300">Created</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-300">Last Login</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-300">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.username} className="border-b border-gray-700 hover:bg-gray-700/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <span className="font-medium">{user.username}</span>
                          {user.username === 'admin' && (
                            <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded">
                              Current
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold text-white ${getRoleColor(user.role)}`}>
                          {user.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">
                        {formatDate(user.lastLogin)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          user.isActive ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditUser(user)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded transition"
                          >
                            ✏️ Edit
                          </button>
                          {user.username !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUser(user.username)}
                              disabled={loading}
                              className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded transition disabled:opacity-50"
                            >
                              🗑️ Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* User Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="text-2xl font-bold text-blue-400">{users.length}</div>
            <div className="text-sm text-gray-400">Total Users</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="text-2xl font-bold text-green-400">
              {users.filter(u => u.isActive).length}
            </div>
            <div className="text-sm text-gray-400">Active Users</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="text-2xl font-bold text-red-400">
              {users.filter(u => u.role === 'admin').length}
            </div>
            <div className="text-sm text-gray-400">Administrators</div>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="text-2xl font-bold text-purple-400">
              {users.filter(u => u.lastLogin).length}
            </div>
            <div className="text-sm text-gray-400">Users with Login</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
