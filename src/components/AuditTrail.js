import React, { useState } from "react";
import { useProgress } from "../context/ProgressContext";

const AuditTrail = () => {
  const { auditTrail } = useProgress();
  const [showAll, setShowAll] = useState(false);

  const displayedTrail = showAll ? auditTrail : auditTrail.slice(0, 10);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'completed':
        return '✅';
      case 'uncompleted':
        return '❌';
      case 'timer_started':
        return '▶️';
      case 'timer_stopped':
        return '⏹️';
      default:
        return '📝';
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'completed':
        return 'text-green-400';
      case 'uncompleted':
        return 'text-red-400';
      case 'timer_started':
        return 'text-cyan-400';
      case 'timer_stopped':
        return 'text-orange-400';
      default:
        return 'text-blue-400';
    }
  };

  const getActionText = (action) => {
    switch (action) {
      case 'completed':
        return 'Completed lesson';
      case 'uncompleted':
        return 'Uncompleted lesson';
      case 'timer_started':
        return 'Started timer for';
      case 'timer_stopped':
        return 'Stopped timer for';
      default:
        return 'Updated';
    }
  };

  if (auditTrail.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 mb-8">
        <h3 className="text-2xl font-bold mb-4 text-purple-400">Learning Audit Trail</h3>
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-4">📝</div>
          <p>No learning activity yet. Start completing lessons to see your progress history!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-purple-400">Learning Audit Trail</h3>
        <div className="text-sm text-gray-400">
          {auditTrail.length} total activities
        </div>
      </div>

      <div className="space-y-3">
        {displayedTrail.map((entry) => (
          <div key={entry.id} className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <span className={`text-2xl ${getActionColor(entry.action)}`}>
                {getActionIcon(entry.action)}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${getActionColor(entry.action)}`}>
                    {getActionText(entry.action)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                </div>
                <div className="text-sm text-gray-300 mt-1">
                  {entry.lessonTitle}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Week {entry.week}, Day {entry.day}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {auditTrail.length > 10 && (
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition"
          >
            {showAll ? 'Show Less' : `Show All ${auditTrail.length} Activities`}
          </button>
        </div>
      )}

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-700 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-green-400">
            {auditTrail.filter(entry => entry.action === 'completed').length}
          </div>
          <div className="text-xs text-gray-400">Completions</div>
        </div>
        <div className="bg-gray-700 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-red-400">
            {auditTrail.filter(entry => entry.action === 'uncompleted').length}
          </div>
          <div className="text-xs text-gray-400">Reversals</div>
        </div>
        <div className="bg-gray-700 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-blue-400">
            {auditTrail.length > 0 ? new Date(auditTrail[0].timestamp).toLocaleDateString() : 'N/A'}
          </div>
          <div className="text-xs text-gray-400">Last Activity</div>
        </div>
        <div className="bg-gray-700 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-purple-400">
            {new Set(auditTrail.map(entry => `${entry.week}-${entry.day}`)).size}
          </div>
          <div className="text-xs text-gray-400">Days Active</div>
        </div>
      </div>
    </div>
  );
};

export default AuditTrail;
