import React, { useState, useEffect } from "react";

const Notes = ({ plan }) => {
  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('learningNotes');
    return saved ? JSON.parse(saved) : {};
  });
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedDay, setSelectedDay] = useState(1);
  const [input, setInput] = useState("");

  // Save notes to localStorage whenever notes state changes
  useEffect(() => {
    localStorage.setItem('learningNotes', JSON.stringify(notes));
  }, [notes]);

  // Load existing note when week/day selection changes
  useEffect(() => {
    const noteKey = `${selectedWeek}-${selectedDay}`;
    if (notes[noteKey]) {
      setInput(notes[noteKey]);
    } else {
      setInput("");
    }
  }, [selectedWeek, selectedDay, notes]);

  const handleSave = () => {
    const noteKey = `${selectedWeek}-${selectedDay}`;
    const updatedNotes = { ...notes, [noteKey]: input };
    setNotes(updatedNotes);
  };

  const noteKey = `${selectedWeek}-${selectedDay}`;
  const currentWeek = plan.weeks.find(w => w.week === selectedWeek);
  const currentDay = currentWeek?.days.find(d => d.day === selectedDay);

  return (
    <div className="p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen text-white">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Learning Notes
        </h2>
        
        {/* Week and Day Selection */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Select Week:</label>
              <select
                value={selectedWeek}
                onChange={e => setSelectedWeek(Number(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
              >
                {plan.weeks.map(week => (
                  <option key={week.week} value={week.week}>
                    Week {week.week}: {week.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Select Day:</label>
              <select
                value={selectedDay}
                onChange={e => setSelectedDay(Number(e.target.value))}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
              >
                {currentWeek?.days.map(day => (
                  <option key={day.day} value={day.day}>
                    Day {day.day} ({day.lessons.length} lessons)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Current Day Lessons */}
        {currentDay && (
          <div className="bg-gray-800 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold mb-4 text-blue-400">
              Week {selectedWeek}, Day {selectedDay} - Lessons
            </h3>
            <div className="space-y-2">
              {currentDay.lessons.map((lesson, idx) => (
                <div key={idx} className="bg-gray-700 rounded-lg p-3 flex justify-between items-center">
                  <span className="text-sm">{lesson.title}</span>
                  <span className="text-xs text-gray-400 bg-gray-600 px-2 py-1 rounded">
                    {lesson.duration}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes Editor */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <h3 className="text-xl font-bold mb-4 text-green-400">
            Notes for Week {selectedWeek}, Day {selectedDay}
          </h3>
          <textarea
            className="w-full h-48 bg-gray-700 border border-gray-600 rounded-lg p-4 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 resize-none"
            placeholder="Write your notes, insights, code snippets, or questions here..."
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-400">
              {input.length} characters
            </span>
            <button
              onClick={handleSave}
              disabled={!input.trim()}
              className={`font-bold py-2 px-6 rounded-lg transition transform hover:scale-105 ${
                input.trim() 
                  ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white' 
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              💾 Save Note
            </button>
          </div>
        </div>

        {/* Saved Notes Display */}
        {notes[noteKey] && (
          <div className="bg-gray-800 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-purple-400">
                📝 Saved Notes
              </h3>
              <button
                onClick={() => {
                  const updatedNotes = { ...notes };
                  delete updatedNotes[noteKey];
                  setNotes(updatedNotes);
                  setInput("");
                }}
                className="text-red-400 hover:text-red-300 text-sm px-3 py-1 rounded hover:bg-red-900/20 transition"
              >
                🗑️ Delete
              </button>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-gray-200 whitespace-pre-line leading-relaxed">
                {notes[noteKey]}
              </p>
            </div>
            <button
              onClick={() => setInput(notes[noteKey])}
              className="mt-3 text-blue-400 hover:text-blue-300 text-sm px-3 py-1 rounded hover:bg-blue-900/20 transition"
            >
              ✏️ Edit Note
            </button>
          </div>
        )}

        {/* All Notes Summary */}
        {Object.keys(notes).length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold mb-4 text-yellow-400">
              📚 All Your Notes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(notes).map(([key, note]) => {
                const [week, day] = key.split('-');
                const weekData = plan.weeks.find(w => w.week === parseInt(week));
                return (
                  <div 
                    key={key} 
                    className="bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition"
                    onClick={() => {
                      setSelectedWeek(parseInt(week));
                      setSelectedDay(parseInt(day));
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-blue-400">
                        Week {week}, Day {day}
                      </span>
                      <span className="text-xs text-gray-400">
                        {note.length} chars
                      </span>
                    </div>
                    {weekData && (
                      <div className="text-xs text-gray-500 mb-2">
                        {weekData.title}
                      </div>
                    )}
                    <p className="text-sm text-gray-300 line-clamp-3">
                      {note.substring(0, 100)}...
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Tips */}
        <div className="mt-8 bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-6">
          <h4 className="text-lg font-bold mb-2 text-yellow-400">💡 Note-Taking Tips</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Document key concepts and breakthrough moments</li>
            <li>• Save code snippets and implementation details</li>
            <li>• Record questions to research later</li>
            <li>• Note connections between different frameworks</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Notes;
