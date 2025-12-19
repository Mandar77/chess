// File: client/src/App.js
// Location: chess-master/client/src/App.js

import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import MainMenu from './components/MainMenu';
import GameScreen from './components/GameScreen';
import GameHistory from './components/GameHistory';
import OnlineGame from './components/OnlineGame';
import { AuthProvider } from './context/AuthContext';

// ===========================================
// Socket.io Configuration for Production
// ===========================================
const getSocketUrl = () => {
  // Use environment variable if set (production)
  if (process.env.REACT_APP_SOCKET_URL) {
    return process.env.REACT_APP_SOCKET_URL;
  }
  // Fallback for development
  if (process.env.NODE_ENV === 'production') {
    // Same origin in production (if serving from same domain)
    return window.location.origin;
  }
  // Local development
  return 'http://localhost:5000';
};

function App() {
  const [screen, setScreen] = useState('menu');
  const [gameConfig, setGameConfig] = useState(null);
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  useEffect(() => {
    const token = localStorage.getItem('chess_token');
    const socketUrl = getSocketUrl();
    
    console.log('Connecting to Socket.io server:', socketUrl);
    
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'], // Try WebSocket first, fall back to polling
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      withCredentials: true
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('✅ Connected to server');
      setConnectionStatus('connected');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected:', reason);
      setConnectionStatus('disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.log('⚠️ Connection error:', error.message);
      setConnectionStatus('error');
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
      setConnectionStatus('connected');
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}...`);
      setConnectionStatus('reconnecting');
    });

    setSocket(newSocket);

    return () => {
      console.log('Cleaning up socket connection');
      newSocket.close();
    };
  }, []);

  const startGame = (config) => {
    setGameConfig(config);
    if (config.mode === 'online') {
      setScreen('online');
    } else {
      setScreen('game');
    }
  };

  const goToMenu = () => {
    setScreen('menu');
    setGameConfig(null);
  };

  const goToHistory = () => {
    setScreen('history');
  };

  // Show connection status banner if not connected
  const ConnectionBanner = () => {
    if (connectionStatus === 'connected') return null;
    
    const messages = {
      connecting: '🔄 Connecting to server...',
      disconnected: '⚠️ Disconnected. Trying to reconnect...',
      reconnecting: '🔄 Reconnecting...',
      error: '❌ Connection error. Retrying...'
    };
    
    const colors = {
      connecting: 'bg-yellow-600',
      disconnected: 'bg-orange-600',
      reconnecting: 'bg-yellow-600',
      error: 'bg-red-600'
    };

    return (
      <div className={`fixed top-0 left-0 right-0 ${colors[connectionStatus]} text-white text-center py-2 text-sm z-50`}>
        {messages[connectionStatus]}
      </div>
    );
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <ConnectionBanner />
        
        {screen === 'menu' && (
          <MainMenu 
            onStartGame={startGame}
            onViewHistory={goToHistory}
            socket={socket}
          />
        )}
        
        {screen === 'game' && gameConfig && (
          <GameScreen 
            config={gameConfig}
            onBack={goToMenu}
          />
        )}
        
        {screen === 'online' && socket && (
          <OnlineGame
            socket={socket}
            config={gameConfig}
            onBack={goToMenu}
          />
        )}
        
        {screen === 'history' && (
          <GameHistory onBack={goToMenu} />
        )}
      </div>
    </AuthProvider>
  );
}

export default App;