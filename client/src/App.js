import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import MainMenu from './components/MainMenu';
import GameScreen from './components/GameScreen';
import GameHistory from './components/GameHistory';
import OnlineGame from './components/OnlineGame';
import { AuthProvider } from './context/AuthContext';

function App() {
  const [screen, setScreen] = useState('menu');
  const [gameConfig, setGameConfig] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const token = localStorage.getItem('chess_token');
    const newSocket = io(
      process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000',
      { 
        auth: { token },
        transports: ['websocket', 'polling']
      }
    );
    
    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    setSocket(newSocket);
    
    return () => {
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

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
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