// File: client/src/components/GameScreen.js

import React, { useState, useCallback, useEffect } from 'react';
import { ChevronLeft, RotateCcw, AlertTriangle, Flag } from 'lucide-react';
import ChessBoard from './ChessBoard';
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
    if (config.mode === 'ai' && gameState.turn === 'black' && !gameOver && !promotionPending) {
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
  }, [gameState.turn, gameOver, promotionPending, config.mode, config.difficulty]);

  const executeMove = useCallback((from, to) => {
    const newState = cloneGameState(gameState);
    const notation = moveToNotation(newState, from, to);
    
    applyMoveToBoard(newState, from, to);
    
    if (needsPromotion(newState.board, to)) {
      setPromotionPending({ pos: to, state: newState, notation, from, to });
      return;
    }
    
    finishMove(newState, notation, from, to);
  }, [gameState]);

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
      if (status.result === 'checkmate') {
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
    setGameState(cloneGameState(INITIAL_GAME_STATE));
    setSelected(null);
    setValidMoves([]);
    setGameOver(null);
    setCheckPos(null);
    setLastMove(null);
    setMoveHistory([]);
    setPromotionPending(null);
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
            ? gameOver.result === 'checkmate' 
              ? `Checkmate! ${gameOver.winner === 'white' ? 'White' : 'Black'} wins!`
              : gameOver.result === 'stalemate' 
                ? 'Stalemate - Draw!'
                : gameOver.result === 'resignation'
                  ? `${gameOver.winner === 'white' ? 'White' : 'Black'} wins by resignation!`
                  : 'Game Over'
            : thinking 
              ? '🤔 Computer thinking...' 
              : `${gameState.turn === 'white' ? '⚪ White' : '⚫ Black'} to move`}
        </div>
      </div>

      {/* Chess Board */}
      <ChessBoard
        board={gameState.board}
        onMove={handleBoardAction}
        selectedSquare={selected}
        validMoves={validMoves}
        interactive={!gameOver && !thinking && !promotionPending}
        inCheck={checkPos}
        lastMove={lastMove}
        flipped={config.mode === 'local' && gameState.turn === 'black'}
      />

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