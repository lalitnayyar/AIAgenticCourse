import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Planner from './components/Planner';
import Notes from './components/Notes';
import Progress from './components/Progress';
import Schedule from './components/Schedule';
import DateTime from './components/DateTime';
import DisclaimerBubble from './components/DisclaimerBubble';
import { ProgressProvider } from './context/ProgressContext';
import plan from './learning_plan.json';
import './App.css';

function App() {
  return (
    <ProgressProvider>
      <Router>
        <nav className="bg-gray-900 shadow-lg p-4 flex gap-6 justify-center border-b border-gray-700">
          <Link to="/" className="text-white hover:text-blue-400 font-bold transition">
            🏠 Dashboard
          </Link>
          <Link to="/planner" className="text-white hover:text-blue-400 font-bold transition">
            📅 Planner
          </Link>
          <Link to="/schedule" className="text-white hover:text-blue-400 font-bold transition">
            🗓️ Schedule
          </Link>
          <Link to="/notes" className="text-white hover:text-blue-400 font-bold transition">
            📝 Notes
          </Link>
          <Link to="/progress" className="text-white hover:text-blue-400 font-bold transition">
            📊 Progress
          </Link>
        </nav>
        <Routes>
          <Route path="/" element={<Dashboard plan={plan} />} />
          <Route path="/planner" element={<Planner plan={plan} />} />
          <Route path="/schedule" element={<Schedule plan={plan} />} />
          <Route path="/notes" element={<Notes plan={plan} />} />
          <Route path="/progress" element={<Progress plan={plan} />} />
        </Routes>
        <DateTime />
        <DisclaimerBubble />
      </Router>
    </ProgressProvider>
  );
}

export default App;
