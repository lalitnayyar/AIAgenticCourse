import React from "react";
import { useProgress } from "../context/ProgressContext";
import AuditTrail from "./AuditTrail";

const Progress = ({ plan }) => {
  const { completedLessons, auditTrail, getWeekProgress, getDayProgress } = useProgress();
  const totalLessons = plan.weeks.reduce((total, week) => 
    total + week.days.reduce((dayTotal, day) => dayTotal + day.lessons.length, 0), 0
  );
  
  const completedCount = completedLessons.size;
  const progressPercentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  return (
    <div className="p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen text-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Progress Tracker
        </h2>
        
        {/* Overall Progress */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <h3 className="text-2xl font-bold mb-4 text-green-400">Overall Progress</h3>
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg">Course Completion</span>
            <span className="text-2xl font-bold text-green-400">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
            <div 
              className="bg-gradient-to-r from-green-400 to-green-600 h-4 rounded-full transition-all duration-500" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-400">{completedCount}</div>
              <div className="text-sm text-gray-300">Lessons Completed</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-400">{totalLessons - completedCount}</div>
              <div className="text-sm text-gray-300">Lessons Remaining</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-400">{totalLessons}</div>
              <div className="text-sm text-gray-300">Total Lessons</div>
            </div>
          </div>
        </div>

        {/* Weekly Progress */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <h3 className="text-2xl font-bold mb-6 text-blue-400">Weekly Progress</h3>
          <div className="space-y-6">
            {plan.weeks.map((week) => {
              const weekProgress = getWeekProgress(week);
              return (
                <div key={week.week} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded text-sm font-medium ${
                        week.color === 'orange' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
                      }`}>
                        Week {week.week}
                      </span>
                      <span className="font-semibold">{week.title}</span>
                    </div>
                    <span className="text-lg font-bold text-green-400">
                      {weekProgress.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-3 mb-4">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${
                        week.color === 'orange' 
                          ? 'bg-gradient-to-r from-orange-400 to-orange-600' 
                          : 'bg-gradient-to-r from-blue-400 to-blue-600'
                      }`}
                      style={{ width: `${weekProgress.percentage}%` }}
                    ></div>
                  </div>
                  
                  {/* Day-wise Progress Bars */}
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    {week.days.map((day) => {
                      const dayProgress = getDayProgress(week, day.day);
                      return (
                        <div key={day.day} className="text-center">
                          <div className="text-xs text-gray-400 mb-1">Day {day.day}</div>
                          <div className="w-full bg-gray-600 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                dayProgress.percentage === 100 
                                  ? 'bg-green-500' 
                                  : dayProgress.percentage > 0 
                                    ? week.color === 'orange' 
                                      ? 'bg-orange-400' 
                                      : 'bg-blue-400'
                                    : 'bg-gray-600'
                              }`}
                              style={{ width: `${dayProgress.percentage}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {dayProgress.completed}/{dayProgress.total}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-300">
                    <span>{weekProgress.completed} / {weekProgress.total} lessons completed</span>
                    <span>{weekProgress.total - weekProgress.completed} remaining</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Audit Trail */}
        <AuditTrail />

        {/* Achievement Badges */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h3 className="text-2xl font-bold mb-6 text-yellow-400">Achievements</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-lg text-center ${
              progressPercentage >= 10 ? 'bg-green-900 border-green-500 border' : 'bg-gray-700'
            }`}>
              <div className="text-2xl mb-2">🚀</div>
              <div className="text-sm font-medium">Getting Started</div>
              <div className="text-xs text-gray-400">Complete 10% of course</div>
            </div>
            <div className={`p-4 rounded-lg text-center ${
              progressPercentage >= 25 ? 'bg-blue-900 border-blue-500 border' : 'bg-gray-700'
            }`}>
              <div className="text-2xl mb-2">📚</div>
              <div className="text-sm font-medium">Quarter Master</div>
              <div className="text-xs text-gray-400">Complete 25% of course</div>
            </div>
            <div className={`p-4 rounded-lg text-center ${
              progressPercentage >= 50 ? 'bg-purple-900 border-purple-500 border' : 'bg-gray-700'
            }`}>
              <div className="text-2xl mb-2">⚡</div>
              <div className="text-sm font-medium">Halfway Hero</div>
              <div className="text-xs text-gray-400">Complete 50% of course</div>
            </div>
            <div className={`p-4 rounded-lg text-center ${
              progressPercentage >= 100 ? 'bg-yellow-900 border-yellow-500 border' : 'bg-gray-700'
            }`}>
              <div className="text-2xl mb-2">🏆</div>
              <div className="text-sm font-medium">AI Master</div>
              <div className="text-xs text-gray-400">Complete entire course</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Progress;
