import React, { useState, useEffect } from 'react';

const DatabaseNotification = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const handleDatabaseOperation = (event) => {
      const { operation, collection, status, details } = event.detail;
      
      const notification = {
        id: Date.now() + Math.random(),
        operation,
        collection,
        status,
        details,
        timestamp: new Date().toLocaleTimeString()
      };

      setNotifications(prev => [...prev, notification]);

      // Auto-remove notification after 3 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 3000);
    };

    // Listen for database operation events
    window.addEventListener('databaseOperation', handleDatabaseOperation);

    return () => {
      window.removeEventListener('databaseOperation', handleDatabaseOperation);
    };
  }, []);

  const getOperationIcon = (operation) => {
    switch (operation) {
      case 'insert': return '➕';
      case 'update': return '✏️';
      case 'select': return '🔍';
      case 'delete': return '🗑️';
      case 'sync': return '☁️';
      default: return '💾';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`${getStatusColor(notification.status)} text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-slide-in-left max-w-xs`}
        >
          <span className="text-lg">{getOperationIcon(notification.operation)}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">
              {notification.operation.toUpperCase()} {notification.collection}
            </div>
            {notification.details && (
              <div className="text-xs opacity-90 truncate">
                {notification.details}
              </div>
            )}
          </div>
          <div className="text-xs opacity-75">
            {notification.timestamp}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DatabaseNotification;
