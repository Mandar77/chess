// File: client/src/components/MainMenu.js

import React, { useState } from 'react';
import { User, LogIn, LogOut, Users, Bot, History, Globe, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';
import SettingsModal from './SettingsModal';

const MainMenu = ({ onStartGame, onViewHistory, socket }) => {
  const { user, logout, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
                onClick={() => onStartGame({ mode: 'ai', difficulty: diff })}
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
          onClick={() => onStartGame({ mode: 'local' })}
          className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition flex items-center justify-center gap-2"
        >
          <Users size={20} /> Play vs Friend (Local)
        </button>

        {/* Play Online */}
        <button
          onClick={() => onStartGame({ mode: 'online' })}
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
    </div>
  );
};

export default MainMenu;