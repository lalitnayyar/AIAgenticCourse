import React, { useState } from 'react';

const TestPlanner = () => {
  const [completedLessons, setCompletedLessons] = useState(new Set());

  const toggleLesson = (weekNum, dayNum, lessonIdx, lessonTitle = '') => {
    const lessonId = `${weekNum}-${dayNum}-${lessonIdx}`;
    const newCompleted = new Set(completedLessons);
    
    if (newCompleted.has(lessonId)) {
      newCompleted.delete(lessonId);
    } else {
      newCompleted.add(lessonId);
    }
    
    setCompletedLessons(newCompleted);
  };

  const isLessonCompleted = (weekNum, dayNum, lessonIdx) => {
    const lessonId = `${weekNum}-${dayNum}-${lessonIdx}`;
    return completedLessons.has(lessonId);
  };

  const testLessons = [
    { title: "Test Lesson 1", duration: "5 min" },
    { title: "Test Lesson 2", duration: "10 min" },
    { title: "Test Lesson 3", duration: "15 min" }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Test Planner</h1>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Week 1: Test Week</h2>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Day 1 (3 lessons)</h3>
            
            {testLessons.map((lesson, idx) => {
              const isCompleted = isLessonCompleted(1, 1, idx);
              
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-lg transition ${
                    isCompleted ? 'bg-green-900 border-green-500 border' : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={() => toggleLesson(1, 1, idx, lesson.title)}
                        className="h-5 w-5 text-green-600 rounded focus:ring-green-500"
                      />
                      <span className={`font-medium ${isCompleted ? 'line-through text-gray-400' : 'text-white'}`}>
                        {lesson.title}
                      </span>
                    </div>
                    <span className="text-sm text-gray-400 bg-gray-600 px-2 py-1 rounded">
                      {lesson.duration}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 p-4 bg-gray-700 rounded">
            <h4 className="font-medium mb-2">Debug Info:</h4>
            <p>Completed Lessons: {completedLessons.size}</p>
            <p>Completed IDs: {Array.from(completedLessons).join(', ') || 'None'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPlanner;
