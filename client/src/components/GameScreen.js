// File: client/src/components/GameScreen.js

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, RotateCcw, AlertTriangle, Flag } from 'lucide-react';
import ChessBoard from './ChessBoard';
import ChessTimer from './ChessTimer';
import PromotionModal from './PromotionModal';
import { useAuth } from '../context/AuthContext';
import {
  INITIAL_GAME_STATE,
  cloneGameState,
  getValidMoves,
  applyMoveToBoard,
  needsPromotion,
  promotePawn,
  getGameStatus,
  isInCheck,
  findKing,
  getAIMove,
  moveToNotation
} from '../utils/chessLogic';

const GameScreen = ({ config, onBack }) => {
  const { user } = useAuth();
  const [gameState, setGameState] = useState(cloneGameState(INITIAL_GAME_STATE));
  const [selected, setSelected] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [gameOver, setGameOver] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [checkPos, setCheckPos] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [promotionPending, setPromotionPending] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  
  // Timer state
  const initialTime = (config.timeControl || 10) * 60; // Convert minutes to seconds
  const [whiteTime, setWhiteTime] = useState(initialTime);
  const [blackTime, setBlackTime] = useState(initialTime);
  const [gameStarted, setGameStarted] = useState(false);
  const timerRef = useRef(null);

  // Timer logic
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Only run timer if game has started, not over, and not thinking (for AI)
    if (!gameStarted || gameOver || promotionPending) return;
    if (config.mode === 'ai' && gameState.turn === 'black' && thinking) return;

    timerRef.current = setInterval(() => {
      if (gameState.turn === 'white') {
        setWhiteTime(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleTimeOut('white');
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTime(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleTimeOut('black');
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState.turn, gameStarted, gameOver, thinking, promotionPending, config.mode]);

  const handleTimeOut = (player) => {
    const winner = player === 'white' ? 'black' : 'white';
    const status = { 
      over: true, 
      result: 'timeout', 
      winner: winner 
    };
    setGameOver(status);
    saveGame(gameState, status);
  };

  // Check for check position
  useEffect(() => {
    const isWhiteTurn = gameState.turn === 'white';
    if (isInCheck(gameState.board, isWhiteTurn)) {
      setCheckPos(findKing(gameState.board, isWhiteTurn));
    } else {
      setCheckPos(null);
    }
  }, [gameState]);

  // AI move
  useEffect(() => {
    if (config.mode === 'ai' && gameState.turn === 'black' && !gameOver && !promotionPending && gameStarted) {
      setThinking(true);
      const timer = setTimeout(() => {
        const aiMove = getAIMove(gameState, config.difficulty);
        if (aiMove) {
          executeMove(aiMove.from, aiMove.to);
        }
        setThinking(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [gameState.turn, gameOver, promotionPending, config.mode, config.difficulty, gameStarted]);

  const executeMove = useCallback((from, to) => {
    // Start game on first move
    if (!gameStarted) {
      setGameStarted(true);
    }

    const newState = cloneGameState(gameState);
    const notation = moveToNotation(newState, from, to);
    
    applyMoveToBoard(newState, from, to);
    
    if (needsPromotion(newState.board, to)) {
      setPromotionPending({ pos: to, state: newState, notation, from, to });
      return;
    }
    
    finishMove(newState, notation, from, to);
  }, [gameState, gameStarted]);

  const finishMove = (newState, notation, from, to) => {
    newState.turn = newState.turn === 'white' ? 'black' : 'white';
    newState.moves.push({ from, to, notation });
    
    setGameState(newState);
    setMoveHistory(prev => [...prev, notation]);
    setLastMove({ from, to });
    setSelected(null);
    setValidMoves([]);

    const status = getGameStatus(newState);
    if (status.over) {
      setGameOver(status);
      saveGame(newState, status);
    }
  };

  const handlePromotion = (piece) => {
    if (!promotionPending) return;
    
    const { pos, state, notation, from, to } = promotionPending;
    promotePawn(state.board, pos, piece);
    
    const promoNotation = notation + '=' + piece.toUpperCase();
    finishMove(state, promoNotation, from, to);
    setPromotionPending(null);
  };

  const saveGame = async (finalState, status) => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('chess_token');
      
      const createRes = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          gameType: config.mode,
          difficulty: config.difficulty
        })
      });
      
      if (!createRes.ok) return;
      const game = await createRes.json();

      let result;
      if (status.result === 'checkmate' || status.result === 'timeout') {
        result = status.winner === 'white' ? 'win' : 'loss';
      } else if (status.result === 'resignation') {
        result = status.winner === 'white' ? 'win' : 'loss';
      } else {
        result = 'draw';
      }
      
      await fetch(`/api/games/${game.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          moves: finalState.moves,
          result: result,
          winnerId: status.winner === 'white' ? user.id : null
        })
      });
    } catch (err) {
      console.error('Failed to save game:', err);
    }
  };

  const handleBoardAction = useCallback((row, col, action, dragFrom) => {
    if (gameOver || thinking || promotionPending) return;
    if (config.mode === 'ai' && gameState.turn === 'black') return;

    if (action === 'drop' && dragFrom) {
      const moves = getValidMoves(gameState, dragFrom);
      const targetMove = moves.find(m => m.row === row && m.col === col);
      if (targetMove) {
        executeMove(dragFrom, targetMove);
      }
      setSelected(null);
      setValidMoves([]);
      return;
    }

    if (action === 'select') {
      const piece = gameState.board[row][col];
      if (piece && piece !== '') {
        const isWhite = piece === piece.toUpperCase();
        if ((gameState.turn === 'white' && isWhite) || (gameState.turn === 'black' && !isWhite)) {
          setSelected({ row, col });
          setValidMoves(getValidMoves(gameState, { row, col }));
        }
      }
      return;
    }

    if (selected) {
      const targetMove = validMoves.find(m => m.row === row && m.col === col);
      if (targetMove) {
        executeMove(selected, targetMove);
        return;
      }
    }

    const piece = gameState.board[row][col];
    if (piece && piece !== '') {
      const isWhite = piece === piece.toUpperCase();
      if ((gameState.turn === 'white' && isWhite) || (gameState.turn === 'black' && !isWhite)) {
        setSelected({ row, col });
        setValidMoves(getValidMoves(gameState, { row, col }));
        return;
      }
    }

    setSelected(null);
    setValidMoves([]);
  }, [gameState, selected, validMoves, gameOver, thinking, config.mode, promotionPending, executeMove]);

  const resetGame = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setGameState(cloneGameState(INITIAL_GAME_STATE));
    setSelected(null);
    setValidMoves([]);
    setGameOver(null);
    setCheckPos(null);
    setLastMove(null);
    setMoveHistory([]);
    setPromotionPending(null);
    setWhiteTime(initialTime);
    setBlackTime(initialTime);
    setGameStarted(false);
  };

  const resign = () => {
    const status = { 
      over: true, 
      result: 'resignation', 
      winner: gameState.turn === 'white' ? 'black' : 'white' 
    };
    setGameOver(status);
    saveGame(gameState, status);
  };

  const getGameOverMessage = () => {
    if (!gameOver) return '';
    
    switch (gameOver.result) {
      case 'checkmate':
        return `Checkmate! ${gameOver.winner === 'white' ? 'White' : 'Black'} wins!`;
      case 'timeout':
        return `Time out! ${gameOver.winner === 'white' ? 'White' : 'Black'} wins!`;
      case 'stalemate':
        return 'Stalemate - Draw!';
      case 'resignation':
        return `${gameOver.winner === 'white' ? 'White' : 'Black'} wins by resignation!`;
      default:
        return 'Game Over';
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="mb-4 flex items-center gap-4">
        <button onClick={onBack} className="text-slate-300 hover:text-white flex items-center gap-1 transition">
          <ChevronLeft size={20} /> Menu
        </button>
        <span className="text-white font-medium">
          {config.mode === 'ai' ? `vs Computer (${config.difficulty})` : 'vs Friend'}
        </span>
        <span className="text-slate-400 text-sm">
          • {config.timeControl} min
        </span>
      </div>

      {/* Status Bar */}
      <div className="mb-4 flex items-center gap-2">
        {checkPos && !gameOver && (
          <span className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm font-medium flex items-center gap-1 animate-pulse">
            <AlertTriangle size={16} /> Check!
          </span>
        )}
        <div className={`px-4 py-2 rounded-lg font-medium transition-all ${
          gameOver ? 'bg-yellow-500 text-black' 
            : gameState.turn === 'white' ? 'bg-white text-slate-900' 
            : 'bg-slate-700 text-white'
        }`}>
          {gameOver 
            ? getGameOverMessage()
            : thinking 
              ? '🤔 Computer thinking...' 
              : `${gameState.turn === 'white' ? '⚪ White' : '⚫ Black'} to move`}
        </div>
      </div>

      {/* Game Area with Timer */}
      <div className="flex items-center gap-6">
        {/* Left Timer (for larger screens) */}
        <div className="hidden md:block">
          <ChessTimer
            whiteTime={whiteTime}
            blackTime={blackTime}
            activePlayer={gameState.turn}
            gameOver={!!gameOver}
            orientation="vertical"
          />
        </div>

        {/* Chess Board - FIXED: No flipping for local multiplayer */}
        <div className="flex flex-col items-center">
          {/* Mobile Timer - Top (Black's time) */}
          <div className="md:hidden mb-2 w-full">
            <div className={`rounded-lg border-2 p-2 transition-all ${
              gameState.turn === 'black' && !gameOver 
                ? blackTime <= 10 
                  ? 'bg-red-600 border-red-400 animate-pulse' 
                  : blackTime <= 30 
                    ? 'bg-orange-600 border-orange-400'
                    : 'bg-slate-800 border-green-500' 
                : 'bg-slate-700 border-slate-600'
            }`}>
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-900" />
                  <span className="text-sm">Black</span>
                </div>
                <span className="font-mono text-lg font-bold">
                  {Math.floor(blackTime / 60)}:{(blackTime % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>

          <ChessBoard
            board={gameState.board}
            onMove={handleBoardAction}
            selectedSquare={selected}
            validMoves={validMoves}
            interactive={!gameOver && !thinking && !promotionPending}
            inCheck={checkPos}
            lastMove={lastMove}
            flipped={false} // FIXED: Always keep board orientation same
          />

          {/* Mobile Timer - Bottom (White's time) */}
          <div className="md:hidden mt-2 w-full">
            <div className={`rounded-lg border-2 p-2 transition-all ${
              gameState.turn === 'white' && !gameOver 
                ? whiteTime <= 10 
                  ? 'bg-red-600 border-red-400 animate-pulse' 
                  : whiteTime <= 30 
                    ? 'bg-orange-600 border-orange-400'
                    : 'bg-white border-green-500 text-slate-900' 
                : 'bg-slate-200 border-slate-300 text-slate-600'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-white border border-slate-400" />
                  <span className="text-sm">White</span>
                </div>
                <span className="font-mono text-lg font-bold">
                  {Math.floor(whiteTime / 60)}:{(whiteTime % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side spacer for balance */}
        <div className="hidden md:block w-[160px]" />
      </div>

      {/* Controls */}
      <div className="mt-4 flex gap-2">
        <button onClick={resetGame} className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition flex items-center gap-2">
          <RotateCcw size={18} /> New Game
        </button>
        {!gameOver && (
          <button onClick={resign} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2">
            <Flag size={18} /> Resign
          </button>
        )}
      </div>

      {/* Move History */}
      {moveHistory.length > 0 && (
        <div className="mt-4 bg-white/10 backdrop-blur rounded-lg p-3 max-w-sm w-full">
          <p className="text-slate-300 text-sm mb-2">Moves:</p>
          <div className="flex flex-wrap gap-1 max-h-24 overflow-auto">
            {moveHistory.map((notation, i) => (
              <span key={i} className={`text-xs px-2 py-1 rounded ${i % 2 === 0 ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-200'}`}>
                {i % 2 === 0 ? `${Math.floor(i / 2) + 1}.` : ''}{notation}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Promotion Modal */}
      {promotionPending && (
        <PromotionModal isWhite={gameState.turn === 'white'} onSelect={handlePromotion} />
      )}
    </div>
  );
};

export default GameScreen;