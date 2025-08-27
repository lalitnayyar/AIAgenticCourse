import HybridDatabaseService from './hybridDatabaseService';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.listeners = [];
  }

  // Initialize auth service
  async initialize() {
    try {
      console.log('🔧 Initializing auth service...');
      
      // Create default admin user with timeout
      const initTimeout = setTimeout(() => {
        console.warn('⏰ Auth initialization timeout, proceeding anyway');
      }, 10000);
      
      try {
        await this.createDefaultAdmin();
        clearTimeout(initTimeout);
      } catch (error) {
        clearTimeout(initTimeout);
        console.warn('⚠️ Default user creation failed, continuing:', error);
      }
      
      // Check for existing session
      const savedUser = localStorage.getItem('currentUser');
      const sessionToken = localStorage.getItem('sessionToken');
      
      if (savedUser && sessionToken) {
        const user = JSON.parse(savedUser);
        console.log(`🔍 Found saved session for user: ${user.username}`);
        
        // Validate session with timeout
        try {
          const isValid = await Promise.race([
            this.validateSession(user.username, sessionToken),
            new Promise((resolve) => setTimeout(() => resolve(false), 5000))
          ]);
          
          if (isValid) {
            this.currentUser = user;
            this.isAuthenticated = true;
            console.log(`✅ Session restored for user: ${user.username}`);
            this.notifyListeners();
            return true;
          } else {
            console.log('❌ Session validation failed, clearing local storage');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('sessionToken');
          }
        } catch (error) {
          console.warn('⚠️ Session validation error:', error);
          localStorage.removeItem('currentUser');
          localStorage.removeItem('sessionToken');
        }
      }
      
      console.log('📝 No valid session found, user needs to login');
      return false;
    } catch (error) {
      console.error('❌ Error initializing auth service:', error);
      return false;
    }
  }

  // Create default admin user if it doesn't exist
  async createDefaultAdmin() {
    try {
      console.log('🔧 Creating default admin users...');
      
      // Create users synchronously to ensure they exist before login attempt
      await this.createUserWithTimeout('admin', 'admin', 'admin');
      await this.createUserWithTimeout('lalitnayyar', 'lalitnayyar', 'user');
      
      console.log('✅ Default users creation completed');
      
    } catch (error) {
      console.error('❌ Error creating default users:', error);
    }
  }
  
  // Helper method to create user with timeout
  async createUserWithTimeout(username, password, role, timeoutMs = 5000) {
    try {
      console.log(`🔧 Creating default user: ${username}`);
      
      // Check if user already exists locally first
      const existingUser = await HybridDatabaseService.getUser(username);
      if (existingUser) {
        console.log(`✅ User ${username} already exists locally`);
        return;
      }
      
      const user = {
        username,
        password: await this.hashPassword(password),
        role,
        createdAt: new Date().toISOString(),
        lastLogin: null,
        isActive: true,
        sessions: []
      };
      
      // Save directly to local storage first
      const savedUser = await HybridDatabaseService.createUser(user);
      console.log(`👑 Default user "${username}" created locally`);
      
      // Skip cloud save for performance
      
    } catch (error) {
      console.error(`❌ Error creating user ${username}:`, error);
    }
  }

  // Simple password hashing (in production, use bcrypt or similar)
  async hashPassword(password) {
    try {
      // Check if crypto.subtle is available
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'learning_portal_salt');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } else {
        // Fallback to simple hash for compatibility
        console.warn('crypto.subtle not available, using fallback hash');
        return this.simpleHash(password + 'learning_portal_salt');
      }
    } catch (error) {
      console.warn('Crypto hash failed, using fallback:', error);
      return this.simpleHash(password + 'learning_portal_salt');
    }
  }

  // Simple fallback hash function
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Generate session token
  generateSessionToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Generate device ID based on browser fingerprint
  getDeviceId() {
    // Create a simple device fingerprint
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    // Simple hash of the fingerprint
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  // Login user
  async login(username, password) {
    try {
      console.log(`🔑 Attempting login for user: ${username}`);
      
      // Try local first, then cloud if not found
      let user = await HybridDatabaseService.getUser(username);
      
      // If not found locally, create default users and try again
      if (!user) {
        console.log('🔧 User not found, creating default users...');
        await this.createDefaultAdmin();
        
        // Wait a moment for localStorage to sync
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Try local storage directly after creation
        user = await HybridDatabaseService.localService.getUser(username);
        console.log(`🔍 After creating defaults, found user: ${user ? 'YES' : 'NO'}`);
        
        // If still not found, try creating the specific user again with both hash methods
        if (!user && (username === 'admin' || username === 'lalitnayyar')) {
          console.log(`🔧 Retrying creation for ${username}...`);
          const password = username === 'admin' ? 'admin' : 'lalitnayyar';
          const role = username === 'admin' ? 'admin' : 'user';
          
          // Create user with fallback hash to ensure compatibility
          const userObj = {
            username,
            password: this.simpleHash(password + 'learning_portal_salt'), // Use fallback hash
            role,
            createdAt: new Date().toISOString(),
            lastLogin: null,
            isActive: true,
            sessions: []
          };
          
          await HybridDatabaseService.createUser(userObj);
          console.log(`👑 Created ${username} with fallback hash for compatibility`);
          
          await new Promise(resolve => setTimeout(resolve, 100));
          user = await HybridDatabaseService.getUser(username);
          console.log(`🔍 After retry, found user: ${user ? 'YES' : 'NO'}`);
        }
      }
      
      if (!user) {
        console.log(`❌ User not found anywhere: ${username}`);
        throw new Error('User not found');
      }

      if (!user.isActive) {
        console.log(`❌ User account disabled: ${username}`);
        throw new Error('User account is disabled');
      }

      const hashedPassword = await this.hashPassword(password);
      const fallbackHash = this.simpleHash(password + 'learning_portal_salt');
      
      console.log(`🔍 Password verification for ${username}:`);
      console.log(`🔍 Input password: ${password}`);
      console.log(`🔍 Generated hash: ${hashedPassword}`);
      
      // Perform data consistency check 
      const consistencyResult = await HybridDatabaseService.performConsistencyCheck();
      console.log(`✅ Data consistency check completed`);
      console.log(`🔍 Fallback hash: ${fallbackHash}`);
      console.log(`🔍 Stored hash: ${user.password}`);
      console.log(`🔍 Crypto match: ${user.password === hashedPassword}`);
      console.log(`🔍 Fallback match: ${user.password === fallbackHash}`);
      
      // Check both crypto.subtle hash and fallback hash for compatibility
      if (user.password !== hashedPassword && user.password !== fallbackHash) {
        console.log(`❌ Invalid password for user: ${username} - no hash matched`);
        throw new Error('Invalid credentials');
      }
      
      // If password doesn't match the crypto hash but matches fallback, update to crypto hash
      if (user.password !== hashedPassword && user.password === fallbackHash) {
        console.log(`🔧 Updating ${username} to use crypto hash for better security`);
        await HybridDatabaseService.updateUser(username, { password: hashedPassword });
        user.password = hashedPassword;
        console.log(`✅ Updated ${username} to use crypto hash`);
      }

      console.log(`✅ Password verified for user: ${username}`);

      // Generate session token with device info
      const sessionToken = this.generateSessionToken();
      const deviceId = this.getDeviceId();
      
      console.log(`🔧 Generated session token and device ID for: ${username}`);
      
      // Update last login and manage multiple sessions
      user.lastLogin = new Date().toISOString();
      
      // Initialize sessions array if it doesn't exist
      if (!user.sessions) {
        user.sessions = [];
        console.log(`📝 Initialized sessions array for user: ${username}`);
      }
      
      // Clean up old sessions (older than 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const originalSessionCount = user.sessions.length;
      user.sessions = user.sessions.filter(session => session.createdAt > thirtyDaysAgo);
      
      if (user.sessions.length !== originalSessionCount) {
        console.log(`🧹 Cleaned up ${originalSessionCount - user.sessions.length} expired sessions for: ${username}`);
      }
      
      // Always add new session for concurrent login support
      // Don't check for existing device sessions to allow multiple concurrent logins
      user.sessions.push({
        token: sessionToken,
        deviceId: deviceId,
        userAgent: navigator.userAgent,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString()
      });
      console.log(`➕ Added new concurrent session for device: ${deviceId}`);
      
      // Apply session limits based on user role (increased limits for concurrent access)
      const maxSessions = user.role === 'admin' ? Infinity : 10; // Increased from 4 to 10
      if (user.sessions.length > maxSessions) {
        // Remove oldest sessions, keep the most recent ones
        const removedSessions = user.sessions.length - maxSessions;
        user.sessions = user.sessions.sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed)).slice(0, maxSessions);
        console.log(`⚠️ Session limit reached. Removed ${removedSessions} oldest sessions for: ${username}`);
      }
      
      console.log(`💾 Saving user data with ${user.sessions.length} active sessions`);
      await HybridDatabaseService.saveUser(user);

      // Set current user
      this.currentUser = {
        username: user.username,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      };
      this.isAuthenticated = true;

      // Save to localStorage
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      localStorage.setItem('sessionToken', sessionToken);

      console.log(`✅ Login successful for user: ${username}`);
      
      // Log authentication event
      try {
        await HybridDatabaseService.logEvent('user_login', 'auth', {
          username: username,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        });
      } catch (logError) {
        console.warn('Failed to log login event:', logError);
      }

      this.notifyListeners();
      return { success: true, user: this.currentUser };

    } catch (error) {
      console.error('❌ Login failed:', error.message);
      
      // Log failed login attempt
      try {
        await HybridDatabaseService.logEvent('login_failed', 'auth', {
          username: username,
          error: error.message,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        });
      } catch (logError) {
        console.warn('Failed to log login failure:', logError);
      }

      return { success: false, error: error.message };
    }
  }

  // Register new user
  async register(username, password, role = 'user') {
    try {
      console.log(`📝 Attempting to register user: ${username}`);

      // Check if user already exists
      const existingUser = await HybridDatabaseService.getUser(username);
      if (existingUser) {
        throw new Error('Username already exists');
      }

      // Validate username and password
      if (username.length < 3) {
        throw new Error('Username must be at least 3 characters long');
      }
      if (password.length < 4) {
        throw new Error('Password must be at least 4 characters long');
      }

      const hashedPassword = await this.hashPassword(password);
      const newUser = {
        username: username,
        password: hashedPassword,
        role: role,
        createdAt: new Date().toISOString(),
        lastLogin: null,
        isActive: true,
        sessions: []
      };

      await HybridDatabaseService.saveUser(newUser);
      console.log(`✅ User registered successfully: ${username}`);

      // Log registration event
      await HybridDatabaseService.logEvent('user_registered', 'auth', {
        username: username,
        role: role,
        timestamp: new Date().toISOString()
      });

      return { success: true, message: 'User registered successfully' };

    } catch (error) {
      console.error('❌ Registration failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Validate session
  async validateSession(username, sessionToken) {
    try {
      console.log(`🔍 Validating session for user: ${username}`);
      
      const user = await HybridDatabaseService.getUser(username);
      if (!user) {
        console.log(`❌ User not found during session validation: ${username}`);
        return false;
      }
      
      if (!user.isActive) {
        console.log(`❌ User account disabled during session validation: ${username}`);
        return false;
      }

      // Check if session exists in user's sessions array
      if (!user.sessions || !Array.isArray(user.sessions)) {
        console.log(`❌ No sessions array found for user: ${username}`);
        return false;
      }

      const session = user.sessions.find(s => s.token === sessionToken);
      if (!session) {
        console.log(`❌ Session token not found for user: ${username}`);
        console.log(`Available sessions: ${user.sessions.length}`);
        return false;
      }

      console.log(`✅ Valid session found for user: ${username}`);

      // Update last used time for this session
      session.lastUsed = new Date().toISOString();
      await HybridDatabaseService.saveUser(user);

      return true;
    } catch (error) {
      console.error('❌ Session validation failed:', error);
      return false;
    }
  }

  // Logout user
  async logout() {
    try {
      if (this.currentUser) {
        console.log(`🚪 Logging out user: ${this.currentUser.username}`);
        
        // Log logout event
        await HybridDatabaseService.logEvent('user_logout', 'auth', {
          username: this.currentUser.username,
          timestamp: new Date().toISOString()
        });

        // Remove current session from database
        const currentSessionToken = localStorage.getItem('sessionToken');
        if (currentSessionToken) {
          const user = await HybridDatabaseService.getUser(this.currentUser.username);
          if (user && user.sessions) {
            // Remove only the current session, keep other device sessions
            user.sessions = user.sessions.filter(session => session.token !== currentSessionToken);
            await HybridDatabaseService.saveUser(user);
          }
        }
      }

      // Clear local state
      this.currentUser = null;
      this.isAuthenticated = false;
      localStorage.removeItem('currentUser');
      localStorage.removeItem('sessionToken');

      console.log('✅ Logout successful');
      this.notifyListeners();

    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Check if user is authenticated
  isUserAuthenticated() {
    return this.isAuthenticated;
  }

  // Check if user has admin role
  isAdmin() {
    return this.currentUser && this.currentUser.role === 'admin';
  }

  // Get user ID for database operations
  getUserId() {
    return this.currentUser ? this.currentUser.username : null;
  }

  // Add authentication state listener
  addListener(callback) {
    this.listeners.push(callback);
  }

  // Remove authentication state listener
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notify all listeners of auth state change
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback({
          isAuthenticated: this.isAuthenticated,
          user: this.currentUser
        });
      } catch (error) {
        console.error('❌ Error notifying auth listener:', error);
      }
    });
  }

  // Get all users (admin only)
  async getAllUsers() {
    if (!this.isAdmin()) {
      throw new Error('Access denied: Admin privileges required');
    }

    try {
      console.log('📋 Getting all users for admin...');
      
      // Get users directly from local storage first (faster)
      let users = await HybridDatabaseService.getAllUsers();
      console.log(`💾 Found ${users.length} users in local storage`);
      
      // If no users found locally, try to create default users
      if (users.length === 0) {
        console.log('🔧 No users found, creating default users...');
        await this.createDefaultAdmin();
        users = await HybridDatabaseService.getAllUsers();
        console.log(`✅ After creating defaults: ${users.length} users`);
      }
      
      return users;
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  }

  // Update user (admin only)
  async updateUser(username, updates) {
    if (!this.isAdmin()) {
      throw new Error('Access denied: Admin privileges required');
    }

    try {
      const user = await HybridDatabaseService.getUser(username);
      if (!user) {
        throw new Error('User not found');
      }

      // Hash password if being updated
      if (updates.password) {
        updates.password = await this.hashPassword(updates.password);
      }

      const updatedUser = { ...user, ...updates };
      await HybridDatabaseService.saveUser(updatedUser);

      console.log(`✅ User updated: ${username}`);
      return { success: true, message: 'User updated successfully' };

    } catch (error) {
      console.error('❌ Error updating user:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete user (admin only)
  async deleteUser(username) {
    if (!this.isAdmin()) {
      throw new Error('Access denied: Admin privileges required');
    }

    if (username === 'admin') {
      throw new Error('Cannot delete admin user');
    }

    try {
      await HybridDatabaseService.deleteUser(username);
      console.log(`✅ User deleted: ${username}`);
      return { success: true, message: 'User deleted successfully' };

    } catch (error) {
      console.error('❌ Error deleting user:', error);
      return { success: false, error: error.message };
    }
  }

  // Get active sessions for a user (admin only)
  async getUserSessions(username) {
    if (!this.isAdmin()) {
      throw new Error('Access denied: Admin privileges required');
    }

    try {
      const user = await HybridDatabaseService.getUser(username);
      if (!user) {
        throw new Error('User not found');
      }

      return user.sessions || [];
    } catch (error) {
      console.error('❌ Error getting user sessions:', error);
      throw error;
    }
  }

  // Revoke a specific session (admin only)
  async revokeSession(username, sessionToken) {
    if (!this.isAdmin()) {
      throw new Error('Access denied: Admin privileges required');
    }

    try {
      const user = await HybridDatabaseService.getUser(username);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.sessions) {
        user.sessions = user.sessions.filter(session => session.token !== sessionToken);
        await HybridDatabaseService.saveUser(user);
      }

      console.log(`✅ Session revoked for user: ${username}`);
      return { success: true, message: 'Session revoked successfully' };

    } catch (error) {
      console.error('❌ Error revoking session:', error);
      return { success: false, error: error.message };
    }
  }

  // Clean up expired sessions for all users (admin only)
  async cleanupExpiredSessions() {
    if (!this.isAdmin()) {
      throw new Error('Access denied: Admin privileges required');
    }

    try {
      const users = await HybridDatabaseService.getAllUsers();
      let cleanedCount = 0;

      for (const user of users) {
        if (user.sessions && user.sessions.length > 0) {
          const originalCount = user.sessions.length;
          
          // Remove sessions older than 30 days
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          user.sessions = user.sessions.filter(session => session.createdAt > thirtyDaysAgo);
          
          if (user.sessions.length !== originalCount) {
            await HybridDatabaseService.saveUser(user);
            cleanedCount += (originalCount - user.sessions.length);
          }
        }
      }

      console.log(`✅ Cleaned up ${cleanedCount} expired sessions`);
      return { success: true, message: `Cleaned up ${cleanedCount} expired sessions` };

    } catch (error) {
      console.error('❌ Error cleaning up sessions:', error);
      return { success: false, error: error.message };
    }
  }

  // Get session limits for different user roles
  getSessionLimits() {
    return {
      admin: 'unlimited',
      user: 4
    };
  }

  // Get current session info
  getCurrentSessionInfo() {
    const sessionToken = localStorage.getItem('sessionToken');
    const deviceId = this.getDeviceId();
    
    return {
      sessionToken: sessionToken ? sessionToken.substring(0, 8) + '...' : null,
      deviceId: deviceId,
      userAgent: navigator.userAgent,
      isAuthenticated: this.isAuthenticated,
      currentUser: this.currentUser
    };
  }

  // Force sync user data from cloud
  async forceSync() {
    try {
      console.log('🔄 Force syncing authentication data...');
      
      if (this.currentUser) {
        // Refresh current user data from cloud
        const freshUserData = await HybridDatabaseService.getUser(this.currentUser.username);
        if (freshUserData) {
          // Update current user info
          this.currentUser = {
            username: freshUserData.username,
            role: freshUserData.role,
            createdAt: freshUserData.createdAt,
            lastLogin: freshUserData.lastLogin
          };
          
          // Update localStorage
          localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
          
          console.log('✅ User data synced successfully');
          this.notifyListeners();
          return { success: true, message: 'User data synced successfully' };
        }
      }
      
      return { success: false, message: 'No current user to sync' };
    } catch (error) {
      console.error('❌ Error syncing user data:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const authService = new AuthService();
export { authService };
export default authService;
