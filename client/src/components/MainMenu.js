// File: client/src/components/MainMenu.js

import React, { useState } from 'react';
import { User, LogIn, LogOut, Users, Bot, History, Globe, Settings, Clock, X, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';
import SettingsModal from './SettingsModal';

// Game Setup Modal Component
const GameSetupModal = ({ mode, difficulty, onStart, onClose }) => {
  const [timeControl, setTimeControl] = useState(10);
  
  const timeOptions = [
    { value: 5, label: '5 min', desc: 'Blitz' },
    { value: 10, label: '10 min', desc: 'Rapid' },
    { value: 15, label: '15 min', desc: 'Standard' }
  ];

  const getModeTitle = () => {
    if (mode === 'ai') return `vs Computer (${difficulty})`;
    if (mode === 'local') return 'vs Friend (Local)';
    if (mode === 'online') return 'Online Match';
    return 'New Game';
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-sm shadow-2xl border border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">{getModeTitle()}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        {/* Time Control Selection */}
        <div className="mb-6">
          <p className="text-slate-300 text-sm font-medium mb-3 flex items-center gap-2">
            <Clock size={16} /> Select Time Control
          </p>
          <div className="grid grid-cols-3 gap-2">
            {timeOptions.map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => setTimeControl(value)}
                className={`py-3 px-2 rounded-lg font-medium transition flex flex-col items-center gap-1 border-2 ${
                  timeControl === value 
                    ? 'bg-blue-600 border-blue-400 text-white' 
                    : 'bg-slate-700 border-slate-600 text-slate-300 hover:border-slate-500'
                }`}
              >
                <span className="text-lg font-bold">{label}</span>
                <span className="text-xs opacity-75">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={() => onStart(timeControl)}
          className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:opacity-90 transition flex items-center justify-center gap-2"
        >
          <Play size={20} /> Start Game
        </button>
      </div>
    </div>
  );
};

const MainMenu = ({ onStartGame, onViewHistory, socket }) => {
  const { user, logout, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [gameSetup, setGameSetup] = useState(null); // { mode, difficulty }

  const handleGameSelect = (mode, difficulty = null) => {
    setGameSetup({ mode, difficulty });
  };

  const handleStartGame = (timeControl) => {
    onStartGame({
      mode: gameSetup.mode,
      difficulty: gameSetup.difficulty,
      timeControl: timeControl // in minutes
    });
    setGameSetup(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2">♔ Chess Master</h1>
        <p className="text-slate-400">Challenge yourself or play with friends</p>
      </div>

      {/* Main Menu Card */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 w-full max-w-md space-y-4">
        
        {/* User Section */}
        {user ? (
          <div className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
            <div className="flex items-center gap-2 text-white">
              <User size={20} />
              <div>
                <p className="font-medium">{user.username}</p>
                <p className="text-xs text-slate-400">
                  ELO: {user.eloRating || 1200} • Games: {user.gamesPlayed || 0}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowSettings(true)} 
                className="text-slate-300 hover:text-white p-1 transition"
                title="Settings"
              >
                <Settings size={20} />
              </button>
              <button 
                onClick={logout} 
                className="text-slate-300 hover:text-white transition"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setShowLogin(true)}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <LogIn size={20} /> Login
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="py-3 px-4 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition"
              title="Settings"
            >
              <Settings size={20} />
            </button>
          </div>
        )}

        {/* Play vs Computer */}
        <div className="space-y-2">
          <p className="text-slate-300 text-sm font-medium flex items-center gap-2">
            <Bot size={16} /> Play vs Computer
          </p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { diff: 'easy', emoji: '🌱', color: 'bg-green-600 hover:bg-green-700' },
              { diff: 'medium', emoji: '🔥', color: 'bg-yellow-600 hover:bg-yellow-700' },
              { diff: 'hard', emoji: '💀', color: 'bg-red-600 hover:bg-red-700' }
            ].map(({ diff, emoji, color }) => (
              <button
                key={diff}
                onClick={() => handleGameSelect('ai', diff)}
                className={`py-3 rounded-lg font-medium transition flex flex-col items-center gap-1 ${color} text-white`}
              >
                <span className="text-lg">{emoji}</span>
                <span className="text-xs capitalize">{diff}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Play vs Friend (Local) */}
        <button
          onClick={() => handleGameSelect('local')}
          className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition flex items-center justify-center gap-2"
        >
          <Users size={20} /> Play vs Friend (Local)
        </button>

        {/* Play Online */}
        <button
          onClick={() => handleGameSelect('online')}
          disabled={!user}
          className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-medium hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Globe size={20} /> Play Online
          {!user && <span className="text-xs opacity-75">(Login required)</span>}
        </button>

        {/* Game History */}
        {user && (
          <button
            onClick={onViewHistory}
            className="w-full py-3 bg-slate-600 text-white rounded-lg font-medium hover:bg-slate-700 transition flex items-center justify-center gap-2"
          >
            <History size={20} /> Game History
          </button>
        )}

        {/* API Key Hint */}
        {!localStorage.getItem('chess_gemini_key') && (
          <p className="text-xs text-center text-slate-400">
            💡 Add Gemini API key in ⚙️ for AI-powered game analysis
          </p>
        )}
      </div>

      {/* Version */}
      <p className="mt-6 text-slate-500 text-xs">Chess Master v1.0</p>

      {/* Modals */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {gameSetup && (
        <GameSetupModal 
          mode={gameSetup.mode}
          difficulty={gameSetup.difficulty}
          onStart={handleStartGame}
          onClose={() => setGameSetup(null)}
        />
      )}
    </div>
  );
};

export default MainMenu;