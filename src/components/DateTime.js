import React, { useState, useEffect } from 'react';

const DateTime = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDateTime = (date) => {
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg border border-gray-600 z-50">
      <div className="text-sm font-medium">
        {formatDateTime(currentTime)}
      </div>
    </div>
  );
};

export default DateTime;
