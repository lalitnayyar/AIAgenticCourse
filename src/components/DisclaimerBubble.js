import React, { useState } from 'react';

const DisclaimerBubble = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Bubble */}
      <div 
        className="fixed bottom-20 left-6 z-50 cursor-pointer group"
        onClick={() => setIsOpen(true)}
      >
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 animate-pulse">
          <div className="w-8 h-8 flex items-center justify-center">
            <span className="text-white text-lg font-bold">ℹ️</span>
          </div>
        </div>
        
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          Course Info
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full mx-4 overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-700 p-6 text-white relative">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="flex items-center space-x-4">
                <img 
                  src="/course-logo.svg" 
                  alt="Course Logo" 
                  className="w-16 h-16 rounded-full bg-white p-2"
                />
                <div>
                  <h2 className="text-xl font-bold">Course Information</h2>
                  <p className="text-blue-100 text-sm">Agentic AI Engineering</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Author Info */}
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">👨‍💻 Course Author</h3>
                <p className="text-gray-700 font-medium">Lalit Nayyar</p>
                <a 
                  href="mailto:lalitnayyar@gmail.com"
                  className="text-blue-600 hover:text-blue-800 transition-colors text-sm"
                >
                  📧 lalitnayyar@gmail.com
                </a>
              </div>

              {/* Course Link */}
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-semibold text-gray-800 mb-2">🎓 Original Course</h3>
                <p className="text-gray-600 text-sm mb-3">
                  The Complete Agentic AI Engineering Course
                </p>
                <a
                  href="https://www.udemy.com/course/the-complete-agentic-ai-engineering-course/?couponCode=MT260825G1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2 rounded-lg hover:from-orange-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105"
                >
                  <span>🚀 View on Udemy</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>

              {/* Disclaimer */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                  <span className="mr-2">⚠️</span>
                  Disclaimer
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  This learning portal is a personal study tool created for tracking progress through 
                  "The Complete Agentic AI Engineering Course" by Lalit Nayyar. This portal is not 
                  affiliated with or endorsed by Udemy. All course content and materials belong to 
                  their respective owners.
                </p>
              </div>

              {/* Portal Info */}
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-gray-500 text-xs">
                  Personal Learning Portal • Built with React & Tailwind CSS
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  © 2025 • For Educational Use Only
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DisclaimerBubble;
