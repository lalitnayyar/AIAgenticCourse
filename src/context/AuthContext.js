import React, { createContext, useContext, useState, useEffect } from 'react';
import HybridDatabaseService from '../services/hybridDatabaseService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      console.log('🔐 Initializing authentication system...');
      setLoading(true);
      
      // Initialize auth service
      const { authService } = await import('../services/authService');
      const hasExistingSession = await authService.initialize();
      
      if (hasExistingSession) {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
          
          // Set current user in database services
          HybridDatabaseService.setCurrentUser(currentUser.username);
          
          console.log(`✅ Session restored for user: ${currentUser.username}`);
        }
      }
      
      // Add auth state listener
      authService.addListener(handleAuthStateChange);
      
    } catch (error) {
      console.error('❌ Error initializing auth:', error);
      setAuthError('Failed to initialize authentication system');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthStateChange = (authState) => {
    console.log('🔄 Auth state changed:', authState);
    
    setUser(authState.user);
    setIsAuthenticated(authState.isAuthenticated);
    
    if (authState.isAuthenticated && authState.user) {
      // Set current user in database services
      HybridDatabaseService.setCurrentUser(authState.user.username);
    } else {
      // Clear current user
      HybridDatabaseService.setCurrentUser(null);
    }
  };

  const login = async (username, password) => {
    try {
      setAuthError('');
      console.log(`🔑 Attempting login for: ${username}`);
      
      const { authService } = await import('../services/authService');
      const result = await authService.login(username, password);
      
      if (result.success) {
        setUser(result.user);
        setIsAuthenticated(true);
        
        // Set current user in database services
        HybridDatabaseService.setCurrentUser(result.user.username);
        
        console.log(`✅ Login successful for: ${username}`);
        return { success: true, user: result.user };
      } else {
        setAuthError(result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      const errorMessage = 'Login failed. Please try again.';
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const register = async (username, password, role = 'user') => {
    try {
      setAuthError('');
      console.log(`📝 Attempting registration for: ${username}`);
      
      const { authService } = await import('../services/authService');
      const result = await authService.register(username, password, role);
      
      if (!result.success) {
        setAuthError(result.error);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Registration error:', error);
      const errorMessage = 'Registration failed. Please try again.';
      setAuthError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Logging out user...');
      
      const { authService } = await import('../services/authService');
      await authService.logout();
      
      setUser(null);
      setIsAuthenticated(false);
      setAuthError('');
      
      // Clear current user from database services
      HybridDatabaseService.setCurrentUser(null);
      
      console.log('✅ Logout successful');
      
    } catch (error) {
      console.error('❌ Logout error:', error);
    }
  };

  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  const getCurrentUser = () => {
    return user;
  };

  const clearError = () => {
    setAuthError('');
  };

  const value = {
    // State
    user,
    isAuthenticated,
    loading,
    authError,
    
    // Methods
    login,
    register,
    logout,
    isAdmin,
    getCurrentUser,
    clearError,
    
    // Auth service methods (for admin functions)
    getAllUsers: async () => {
      const { authService } = await import('../services/authService');
      return authService.getAllUsers();
    },
    updateUser: async (username, updates) => {
      const { authService } = await import('../services/authService');
      return authService.updateUser(username, updates);
    },
    deleteUser: async (username) => {
      const { authService } = await import('../services/authService');
      return authService.deleteUser(username);
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
