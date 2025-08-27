import React, { useState, useEffect } from 'react';

const LoginPage = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [consoleLogs, setConsoleLogs] = useState([]);

  useEffect(() => {
    // Capture console logs
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const captureLog = (level, ...args) => {
      const timestamp = new Date().toISOString();
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      setConsoleLogs(prev => [...prev, {
        timestamp,
        level,
        message
      }]);
    };

    console.log = (...args) => {
      originalLog(...args);
      captureLog('log', ...args);
    };

    console.error = (...args) => {
      originalError(...args);
      captureLog('error', ...args);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      captureLog('warn', ...args);
    };

    // Initialize auth service
    const initAuth = async () => {
      try {
        const { authService } = await import('../services/authService');
        await authService.initialize();
      } catch (error) {
        console.error('Failed to initialize auth service:', error);
      }
    };
    initAuth();

    // Cleanup
    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear errors when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { authService } = await import('../services/authService');
      
      if (isLogin) {
        // Login
        console.log(`🔑 Attempting login for: ${formData.username}`);
        const result = await authService.login(formData.username, formData.password);
        
        if (result.success) {
          console.log('✅ Login successful');
          setSuccess('Login successful! Redirecting...');
          setTimeout(() => {
            if (onLoginSuccess && typeof onLoginSuccess === 'function') {
              onLoginSuccess(result.user);
            } else {
              window.location.href = '/';
            }
          }, 1000);
        } else {
          setError(result.error || 'Login failed');
        }
      } else {
        // Register
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return;
        }

        console.log(`📝 Attempting registration for: ${formData.username}`);
        const result = await authService.register(formData.username, formData.password);
        
        if (result.success) {
          setSuccess('Registration successful! You can now login.');
          setIsLogin(true);
          setFormData({ username: formData.username, password: '', confirmPassword: '' });
        } else {
          setError(result.error || 'Registration failed');
        }
      }
    } catch (error) {
      console.error('❌ Authentication error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async () => {
    setFormData({ username: 'admin', password: 'admin', confirmPassword: '' });
    setLoading(true);
    setError('');
    
    try {
      const { authService } = await import('../services/authService');
      const result = await authService.login('admin', 'admin');
      if (result.success) {
        setSuccess('Admin login successful! Redirecting...');
        setTimeout(() => {
          if (onLoginSuccess && typeof onLoginSuccess === 'function') {
            onLoginSuccess(result.user);
          } else {
            window.location.href = '/';
          }
        }, 1000);
      } else {
        setError(result.error || 'Admin login failed');
      }
    } catch (error) {
      setError('Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadConsoleLogs = () => {
    const logText = consoleLogs.map(log => 
      `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `console-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearConsoleLogs = () => {
    setConsoleLogs([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          {/* Logo */}
          <div className="mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
              </svg>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
            Learning Portal
          </h1>
          <p className="text-gray-400">
            {isLogin ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-800 rounded-xl p-8 shadow-2xl border border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Enter your username"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Enter your password"
              />
            </div>

            {/* Confirm Password (Register only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Confirm your password"
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/50 border border-red-500 rounded-lg p-3">
                <p className="text-red-400 text-sm">❌ {error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-900/50 border border-green-500 rounded-lg p-3">
                <p className="text-green-400 text-sm">✅ {success}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition transform hover:scale-105 ${
                loading
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isLogin ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                isLogin ? '🔑 Sign In' : '📝 Create Account'
              )}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setSuccess('');
                setFormData({ username: '', password: '', confirmPassword: '' });
              }}
              className="text-blue-400 hover:text-blue-300 text-sm transition"
            >
              {isLogin 
                ? "Don't have an account? Create one" 
                : "Already have an account? Sign in"
              }
            </button>
          </div>

          {/* Quick Admin Login */}
          {isLogin && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <button
                type="button"
                onClick={handleQuickLogin}
                disabled={loading}
                className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition"
              >
                👑 Quick Admin Login (admin/admin)
              </button>
            </div>
          )}

          {/* Console Log Controls */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={downloadConsoleLogs}
                className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition flex items-center justify-center"
              >
                📄 Download Logs ({consoleLogs.length})
              </button>
              <button
                type="button"
                onClick={clearConsoleLogs}
                className="py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition"
              >
                🗑️ Clear
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Captures all console logs for debugging
            </p>
          </div>

          {/* Default Credentials Info */}
          <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-600">
            <h4 className="text-sm font-semibold text-yellow-400 mb-2">💡 Default Credentials</h4>
            <p className="text-xs text-gray-400">
              <strong>Username:</strong> admin<br />
              <strong>Password:</strong> admin
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 text-center">
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
            <div className="flex items-center justify-center space-x-2">
              <span>🔒</span>
              <span>Secure Authentication</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span>☁️</span>
              <span>Cloud Sync</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span>👥</span>
              <span>Multi-User Support</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span>📱</span>
              <span>Cross-Device Access</span>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-gray-900/30 rounded-lg border border-gray-700/50">
          <div className="text-center">
            <h4 className="text-sm font-semibold text-yellow-400 mb-2">⚠️ Important Disclaimer</h4>
            <div className="text-xs text-gray-400 space-y-2">
              <p>
                This Learning Portal is designed for educational purposes. By accessing this system, you agree to use it responsibly and in accordance with applicable policies.
              </p>
              <p>
                <strong>Data Privacy:</strong> Your learning progress and personal data are stored securely with encryption. We do not share your information with third parties.
              </p>
              <p>
                <strong>Multi-Device Access:</strong> You can access your account from up to 4 devices simultaneously. Admin users have unlimited device access.
              </p>
              <p>
                <strong>Support:</strong> For technical issues or questions, please contact Lalit Nayyar at <a href="mailto:lalitnayyar@gmail.com" className="text-blue-400 hover:text-blue-300 underline">lalitnayyar@gmail.com</a>
              </p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            © 2024 Learning Portal by Lalit Nayyar. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
