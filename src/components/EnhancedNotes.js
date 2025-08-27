import React, { useState, useEffect } from "react";
import { HybridDatabaseService } from "../services/hybridDatabaseService";

const EnhancedNotes = ({ plan }) => {
  const [notes, setNotes] = useState({});
  const [allNotes, setAllNotes] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedDay, setSelectedDay] = useState(1);
  const [input, setInput] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ show: false, message: '', progress: 0 });
  const [searchTerm, setSearchTerm] = useState("");

  // Load all notes on component mount
  useEffect(() => {
    loadAllNotes();
  }, []);

  // Load existing note when week/day selection changes
  useEffect(() => {
    loadCurrentNote();
  }, [selectedWeek, selectedDay]);

  const loadAllNotes = async () => {
    try {
      console.log('📚 Loading all notes from database...');
      setSyncProgress({ show: true, message: 'Loading notes...', progress: 25 });
      
      const notesData = await HybridDatabaseService.getAllNotes();
      setSyncProgress({ show: true, message: 'Processing notes...', progress: 75 });
      
      const notesMap = {};
      
      (notesData || []).forEach(note => {
        const key = `${note.weekNum}-${note.dayNum}`;
        notesMap[key] = note.content;
      });
      
      setNotes(notesMap);
      setAllNotes(notesData || []);
      
      console.log(`✅ Loaded ${(notesData || []).length} notes successfully`);
      setSyncProgress({ show: true, message: 'Notes loaded!', progress: 100 });
      
      // Hide progress after delay
      setTimeout(() => setSyncProgress({ show: false, message: '', progress: 0 }), 1000);
    } catch (error) {
      console.error('❌ Error loading notes:', error);
      setSyncProgress({ show: false, message: '', progress: 0 });
    }
  };

  const loadCurrentNote = async () => {
    try {
      console.log(`📖 Loading note for Week ${selectedWeek}, Day ${selectedDay}`);
      const note = await HybridDatabaseService.getNote(selectedWeek, selectedDay);
      if (note) {
        setInput(note.content);
        setTags(note.tags ? note.tags.join(', ') : '');
        console.log(`✅ Loaded existing note (${note.content.length} characters)`);
      } else {
        setInput("");
        setTags("");
        console.log('📝 No existing note found, starting fresh');
      }
    } catch (error) {
      console.error('❌ Error loading current note:', error);
    }
  };

  const handleSave = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setSyncProgress({ show: true, message: 'Saving note...', progress: 0 });
    
    try {
      console.log(`💾 Saving note for Week ${selectedWeek}, Day ${selectedDay} (${input.length} characters)`);
      setSyncProgress({ show: true, message: 'Processing note...', progress: 25 });
      
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      console.log(`🏷️ Tags: [${tagsArray.join(', ')}]`);
      
      setSyncProgress({ show: true, message: 'Saving to database...', progress: 50 });
      await HybridDatabaseService.saveNote(selectedWeek, selectedDay, input, tagsArray);
      
      // Update local state
      const noteKey = `${selectedWeek}-${selectedDay}`;
      setNotes(prev => ({ ...prev, [noteKey]: input }));
      
      setSyncProgress({ show: true, message: 'Syncing to cloud...', progress: 75 });
      
      // Reload all notes to get updated data
      await loadAllNotes();
      
      // Log event
      await HybridDatabaseService.logEvent('note_saved', 'notes', {
        weekNum: selectedWeek,
        dayNum: selectedDay,
        contentLength: input.length,
        tagsCount: tagsArray.length
      });
      
      console.log(`✅ Note saved successfully for Week ${selectedWeek}, Day ${selectedDay}`);
      setSyncProgress({ show: true, message: 'Note saved!', progress: 100 });
      
      // Hide progress after delay
      setTimeout(() => setSyncProgress({ show: false, message: '', progress: 0 }), 1500);
      
    } catch (error) {
      console.error('❌ Error saving note:', error);
      setSyncProgress({ show: false, message: '', progress: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setSyncProgress({ show: true, message: 'Deleting note...', progress: 0 });
    
    try {
      console.log(`🗑️ Deleting note for Week ${selectedWeek}, Day ${selectedDay}`);
      setSyncProgress({ show: true, message: 'Removing from database...', progress: 50 });
      
      await HybridDatabaseService.deleteNote(selectedWeek, selectedDay);
      
      // Update local state
      const noteKey = `${selectedWeek}-${selectedDay}`;
      const updatedNotes = { ...notes };
      delete updatedNotes[noteKey];
      setNotes(updatedNotes);
      setInput("");
      setTags("");
      
      setSyncProgress({ show: true, message: 'Syncing changes...', progress: 75 });
      
      // Reload all notes
      await loadAllNotes();
      
      console.log(`✅ Note deleted successfully for Week ${selectedWeek}, Day ${selectedDay}`);
      setSyncProgress({ show: true, message: 'Note deleted!', progress: 100 });
      
      // Hide progress after delay
      setTimeout(() => setSyncProgress({ show: false, message: '', progress: 0 }), 1500);
      
    } catch (error) {
      console.error('❌ Error deleting note:', error);
      setSyncProgress({ show: false, message: '', progress: 0 });
    } finally {
      setLoading(false);
    }
  };

  const noteKey = `${selectedWeek}-${selectedDay}`;
  const currentWeek = plan.weeks.find(w => w.week === selectedWeek);
  const currentDay = currentWeek?.days.find(d => d.day === selectedDay);

  // Filter notes based on search term
  const filteredNotes = (allNotes || []).filter(note => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      note.content.toLowerCase().includes(searchLower) ||
      (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchLower)))
    );
  });

  return (
    <div className="p-8 bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen text-white">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
          Enhanced Learning Notes
        </h2>
        
        {/* Search and Stats */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Search Notes:</label>
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by content or tags..."
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{(allNotes || []).length}</div>
              <div className="text-sm text-gray-400">Total Notes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {(allNotes || []).reduce((sum, note) => sum + (note?.content?.length || 0), 0)}
              </div>
              <div className="text-sm text-gray-400">Total Characters</div>
            </div>
          </div>
        </div>

        {/* Progress Popup */}
        {syncProgress.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full mx-4 border border-gray-600">
              <div className="text-center">
                <div className="text-lg font-semibold text-white mb-4">
                  🔄 {syncProgress.message}
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${syncProgress.progress}%` }}
                  ></div>
                </div>
                <div className="text-sm text-gray-400">
                  {syncProgress.progress}% complete
                </div>
              </div>
            </div>
          </div>
        )}

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
          
          {/* Tags Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Tags (comma-separated):</label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="e.g., important, code-snippet, question"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-green-500"
            />
          </div>

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
            <div className="flex gap-3">
              {notes[noteKey] && (
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition transform hover:scale-105 disabled:opacity-50"
                >
                  🗑️ Delete
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!input.trim() || loading}
                className={`font-bold py-2 px-6 rounded-lg transition transform hover:scale-105 ${
                  input.trim() && !loading
                    ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white' 
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {loading ? '💾 Saving...' : '💾 Save Note'}
              </button>
            </div>
          </div>
        </div>

        {/* Saved Notes Display */}
        {notes[noteKey] && (
          <div className="bg-gray-800 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-purple-400">
                📝 Current Note
              </h3>
              <button
                onClick={() => setInput(notes[noteKey])}
                className="text-blue-400 hover:text-blue-300 text-sm px-3 py-1 rounded hover:bg-blue-900/20 transition"
              >
                ✏️ Edit Note
              </button>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-gray-200 whitespace-pre-line leading-relaxed">
                {notes[noteKey]}
              </p>
            </div>
          </div>
        )}

        {/* All Notes Summary */}
        {filteredNotes.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 mb-8">
            <h3 className="text-xl font-bold mb-4 text-yellow-400">
              📚 {searchTerm ? `Search Results (${filteredNotes.length})` : 'All Your Notes'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map((note) => {
                const weekData = plan.weeks.find(w => w.week === note.weekNum);
                return (
                  <div 
                    key={`${note.weekNum}-${note.dayNum}`}
                    className="bg-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-600 transition"
                    onClick={() => {
                      setSelectedWeek(note.weekNum);
                      setSelectedDay(note.dayNum);
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-blue-400">
                        Week {note.weekNum}, Day {note.dayNum}
                      </span>
                      <span className="text-xs text-gray-400">
                        {note.content.length} chars
                      </span>
                    </div>
                    {weekData && (
                      <div className="text-xs text-gray-500 mb-2">
                        {weekData.title}
                      </div>
                    )}
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {note.tags.map((tag, idx) => (
                          <span key={idx} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-sm text-gray-300 line-clamp-3">
                      {note.content.substring(0, 100)}...
                    </p>
                    <div className="text-xs text-gray-500 mt-2">
                      Last modified: {new Date(note.lastModified).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Enhanced Tips */}
        <div className="mt-8 bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-6">
          <h4 className="text-lg font-bold mb-2 text-yellow-400">💡 Enhanced Note-Taking Features</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Use tags to categorize and search your notes efficiently</li>
            <li>• All notes are automatically timestamped and stored locally</li>
            <li>• Search functionality helps you find specific content quickly</li>
            <li>• Click on any note card to jump to that week/day</li>
            <li>• Your notes are backed up in a local database for reliability</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EnhancedNotes;
