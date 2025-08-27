import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DatabaseProgressProvider } from './context/DatabaseProgressContext';
import LoginPage from './components/LoginPage';
import EnhancedDashboard from './components/EnhancedDashboard';
import PlannerPage from './components/PlannerPage';
import TestPlanner from './components/TestPlanner';
import ProgressPage from './components/ProgressPage';
import AuditLogPage from './components/AuditLogPage';
import Schedule from './components/Schedule';
import SessionDebug from './components/SessionDebug';
import UserManagement from './components/UserManagement';
import DatabaseResetPanel from './components/DatabaseResetPanel';
import Navigation from './components/Navigation';
import DatabaseNotification from './components/DatabaseNotification';
import ProtectedRoute from './components/ProtectedRoute';
import ConnectionStatus from "./components/ConnectionStatus";
import DateTime from './components/DateTime';
import DisclaimerBubble from './components/DisclaimerBubble';
import plan from './learning_plan.json';
import './App.css';

function App() {
  useEffect(() => {
    // Initialize data recovery service and auto-backup
    const initializeServices = async () => {
      try {
        // Try to import data recovery service if it exists
        console.log('🔧 Attempting to initialize data recovery service...');
        // For now, just log that the app is initialized
        console.log('✅ App initialized successfully');
      } catch (error) {
        console.warn('Failed to initialize data recovery service:', error);
      }
    };
    
    initializeServices();
  }, []);

  return (
    <AuthProvider>
      <DatabaseProgressProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div className="App">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Navigation />
                  <EnhancedDashboard plan={plan} />
                  <ConnectionStatus />
                  <DateTime />
                  <DisclaimerBubble />
                </ProtectedRoute>
              } />
              <Route path="/planner" element={
                <ProtectedRoute>
                  <Navigation />
                  <PlannerPage plan={plan} />
                  <ConnectionStatus />
                  <DateTime />
                  <DisclaimerBubble />
                </ProtectedRoute>
              } />
              <Route path="/test-planner" element={
                <ProtectedRoute>
                  <Navigation />
                  <TestPlanner />
                  <ConnectionStatus />
                  <DateTime />
                  <DisclaimerBubble />
                </ProtectedRoute>
              } />
              <Route path="/progress" element={
                <ProtectedRoute>
                  <Navigation />
                  <ProgressPage plan={plan} />
                  <ConnectionStatus />
                  <DateTime />
                  <DisclaimerBubble />
                </ProtectedRoute>
              } />
              <Route path="/schedule" element={
                <ProtectedRoute>
                  <Navigation />
                  <Schedule plan={plan} />
                  <ConnectionStatus />
                  <DateTime />
                  <DisclaimerBubble />
                </ProtectedRoute>
              } />
              <Route path="/audit" element={
                <ProtectedRoute>
                  <Navigation />
                  <AuditLogPage />
                  <ConnectionStatus />
                  <DateTime />
                  <DisclaimerBubble />
                </ProtectedRoute>
              } />
              <Route path="/debug" element={
                <ProtectedRoute>
                  <Navigation />
                  <SessionDebug />
                  <ConnectionStatus />
                  <DateTime />
                  <DisclaimerBubble />
                </ProtectedRoute>
              } />
              <Route path="/users" element={
                <ProtectedRoute adminOnly={true}>
                  <Navigation />
                  <UserManagement />
                  <ConnectionStatus />
                  <DateTime />
                  <DisclaimerBubble />
                </ProtectedRoute>
              } />
              <Route path="/reset" element={
                <ProtectedRoute adminOnly={true}>
                  <Navigation />
                  <DatabaseResetPanel />
                  <ConnectionStatus />
                  <DateTime />
                  <DisclaimerBubble />
                </ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            {/* Database Operation Notifications */}
            <DatabaseNotification />
          </div>
        </Router>
      </DatabaseProgressProvider>
    </AuthProvider>
  );
}

export default App;

