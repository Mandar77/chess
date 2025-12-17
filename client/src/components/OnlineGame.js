import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, Loader2, Flag, MessageCircle, X, Send } from 'lucide-react';
import ChessBoard from './ChessBoard';
import PromotionModal from './PromotionModal';
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
  moveToNotation
} from '../utils/chessLogic';

const OnlineGame = ({ socket, onBack }) => {
  const [status, setStatus] = useState('idle');
  const [gameState, setGameState] = useState(cloneGameState(INITIAL_GAME_STATE));
  const [gameId, setGameId] = useState(null);
  const [myColor, setMyColor] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [selected, setSelected] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [checkPos, setCheckPos] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [gameOver, setGameOver] = useState(null);
  const [promotionPending, setPromotionPending] = useState(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [drawOffered, setDrawOffered] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.on('waiting_for_match', () => setStatus('searching'));

    socket.on('match_found', ({ gameId, color, opponent }) => {
      setGameId(gameId);
      setMyColor(color);
      setOpponent(opponent);
      setStatus('playing');
      setGameState(cloneGameState(INITIAL_GAME_STATE));
      setMoveHistory([]);
      setMessages([]);
      setGameOver(null);
      setDrawOffered(false);
    });

    socket.on('opponent_move', ({ move }) => {
      setGameState(prev => {
        const newState = cloneGameState(prev);
        const notation = moveToNotation(newState, move.from, move.to);
        applyMoveToBoard(newState, move.from, move.to);
        if (move.promotion) promotePawn(newState.board, move.to, move.promotion);
        newState.turn = newState.turn === 'white' ? 'black' : 'white';
        setMoveHistory(h => [...h, notation + (move.promotion ? '=' + move.promotion.toUpperCase() : '')]);
        setLastMove({ from: move.from, to: move.to });
        const gameStatus = getGameStatus(newState);
        if (gameStatus.over) { setGameOver(gameStatus); setStatus('ended'); }
        return newState;
      });
    });

    socket.on('game_ended', ({ result, winnerId, resignedBy }) => {
      setGameOver({ result, winnerId, resignedBy });
      setStatus('ended');
    });

    socket.on('opponent_disconnected', ({ message }) => {
      setMessages(prev => [...prev, { system: true, text: message }]);
    });

    socket.on('draw_offered', ({ from }) => {
      setDrawOffered(true);
      setMessages(prev => [...prev, { system: true, text: `${from} offered a draw` }]);
    });

    socket.on('draw_declined', () => {
      setMessages(prev => [...prev, { system: true, text: 'Draw offer declined' }]);
    });

    socket.on('chat_message', ({ from, message }) => {
      setMessages(prev => [...prev, { from, text: message }]);
    });

    return () => {
      socket.off('waiting_for_match');
      socket.off('match_found');
      socket.off('opponent_move');
      socket.off('game_ended');
      socket.off('opponent_disconnected');
      socket.off('draw_offered');
      socket.off('draw_declined');
      socket.off('chat_message');
    };
  }, [socket]);

  useEffect(() => {
    const isWhiteTurn = gameState.turn === 'white';
    if (isInCheck(gameState.board, isWhiteTurn)) {
      setCheckPos(findKing(gameState.board, isWhiteTurn));
    } else {
      setCheckPos(null);
    }
  }, [gameState]);

  const findMatch = () => { socket.emit('find_match'); setStatus('searching'); };
  const cancelSearch = () => { socket.emit('cancel_matchmaking'); setStatus('idle'); };

  const executeMove = useCallback((from, to, promotion = null) => {
    const newState = cloneGameState(gameState);
    const notation = moveToNotation(newState, from, to);
    applyMoveToBoard(newState, from, to);
    if (needsPromotion(newState.board, to) && !promotion) {
      setPromotionPending({ from, to, state: newState, notation });
      return;
    }
    if (promotion) promotePawn(newState.board, to, promotion);
    newState.turn = newState.turn === 'white' ? 'black' : 'white';
    setGameState(newState);
    setMoveHistory(prev => [...prev, notation + (promotion ? '=' + promotion.toUpperCase() : '')]);
    setLastMove({ from, to });
    setSelected(null);
    setValidMoves([]);
    socket.emit('make_move', { gameId, move: { from, to, promotion } });
    const gameStatus = getGameStatus(newState);
    if (gameStatus.over) {
      setGameOver(gameStatus);
      setStatus('ended');
      socket.emit('game_over', { gameId, result: gameStatus.result, winnerId: null });
    }
  }, [gameState, gameId, socket]);

  const handlePromotion = (piece) => {
    if (!promotionPending) return;
    executeMove(promotionPending.from, promotionPending.to, piece);
    setPromotionPending(null);
  };

  const handleBoardAction = useCallback((row, col, action, dragFrom) => {
    if (status !== 'playing' || gameOver || promotionPending) return;
    if (gameState.turn !== myColor) return;

    if (action === 'drop' && dragFrom) {
      const moves = getValidMoves(gameState, dragFrom);
      const targetMove = moves.find(m => m.row === row && m.col === col);
      if (targetMove) executeMove(dragFrom, targetMove);
      setSelected(null);
      setValidMoves([]);
      return;
    }

    if (action === 'select') {
      const piece = gameState.board[row][col];
      if (piece) {
        const isWhite = piece === piece.toUpperCase();
        const canSelect = (myColor === 'white' && isWhite) || (myColor === 'black' && !isWhite);
        if (canSelect && gameState.turn === myColor) {
          setSelected({ row, col });
          setValidMoves(getValidMoves(gameState, { row, col }));
        }
      }
      return;
    }

    if (selected) {
      const targetMove = validMoves.find(m => m.row === row && m.col === col);
      if (targetMove) { executeMove(selected, targetMove); return; }
    }

    const piece = gameState.board[row][col];
    if (piece) {
      const isWhite = piece === piece.toUpperCase();
      const canSelect = (myColor === 'white' && isWhite) || (myColor === 'black' && !isWhite);
      if (canSelect) { setSelected({ row, col }); setValidMoves(getValidMoves(gameState, { row, col })); return; }
    }
    setSelected(null);
    setValidMoves([]);
  }, [gameState, selected, validMoves, status, myColor, gameOver, promotionPending, executeMove]);

  const resign = () => socket.emit('resign', { gameId });
  const offerDraw = () => { socket.emit('offer_draw', { gameId }); setMessages(prev => [...prev, { system: true, text: 'You offered a draw' }]); };
  const respondToDraw = (accepted) => { socket.emit('draw_response', { gameId, accepted }); setDrawOffered(false); };
  const sendMessage = () => {
    if (!chatInput.trim()) return;
    socket.emit('chat_message', { gameId, message: chatInput });
    setMessages(prev => [...prev, { from: 'You', text: chatInput }]);
    setChatInput('');
  };

  if (status === 'idle') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <button onClick={onBack} className="absolute top-4 left-4 text-slate-300 hover:text-white flex items-center gap-1">
          <ChevronLeft size={20} /> Back
        </button>
        <h2 className="text-2xl font-bold text-white mb-4">Online Play</h2>
        <button onClick={findMatch} className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-medium text-lg hover:opacity-90 transition">
          Find Match
        </button>
      </div>
    );
  }

  if (status === 'searching') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <Loader2 className="animate-spin text-white mb-4" size={48} />
        <p className="text-white text-lg mb-4">Looking for opponent...</p>
        <button onClick={cancelSearch} className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition">Cancel</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="mb-4 flex items-center gap-4">
        <button onClick={onBack} className="text-slate-300 hover:text-white flex items-center gap-1"><ChevronLeft size={20} /> Leave</button>
        <span className="text-white font-medium">vs {opponent}</span>
        <span className={`px-2 py-1 rounded text-sm ${myColor === 'white' ? 'bg-white text-black' : 'bg-slate-700 text-white'}`}>You: {myColor}</span>
      </div>

      <div className={`mb-4 px-4 py-2 rounded-lg font-medium ${gameOver ? 'bg-yellow-500 text-black' : gameState.turn === myColor ? 'bg-green-600 text-white' : 'bg-slate-600 text-white'}`}>
        {gameOver ? (gameOver.result === 'checkmate' ? `Checkmate! ${gameOver.winner === myColor ? 'You win!' : 'You lose!'}` : gameOver.result === 'draw' ? 'Draw!' : gameOver.result === 'resignation' ? `${gameOver.resignedBy} resigned` : 'Game Over') : (gameState.turn === myColor ? 'Your turn' : "Opponent's turn")}
      </div>

      <ChessBoard board={gameState.board} onMove={handleBoardAction} selectedSquare={selected} validMoves={validMoves} interactive={status === 'playing' && gameState.turn === myColor && !gameOver} inCheck={checkPos} lastMove={lastMove} flipped={myColor === 'black'} />

      <div className="mt-4 flex gap-2">
        {!gameOver && (
          <>
            <button onClick={resign} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"><Flag size={18} /> Resign</button>
            <button onClick={offerDraw} className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition">Offer Draw</button>
          </>
        )}
        <button onClick={() => setShowChat(!showChat)} className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition flex items-center gap-2"><MessageCircle size={18} /> Chat</button>
      </div>

      {drawOffered && (
        <div className="mt-4 bg-yellow-600 text-white px-4 py-2 rounded-lg flex items-center gap-4">
          <span>Draw offered</span>
          <button onClick={() => respondToDraw(true)} className="px-3 py-1 bg-green-600 rounded">Accept</button>
          <button onClick={() => respondToDraw(false)} className="px-3 py-1 bg-red-600 rounded">Decline</button>
        </div>
      )}

      {moveHistory.length > 0 && (
        <div className="mt-4 bg-white/10 backdrop-blur rounded-lg p-3 max-w-sm w-full">
          <p className="text-slate-300 text-sm mb-2">Moves:</p>
          <div className="flex flex-wrap gap-1 max-h-20 overflow-auto">
            {moveHistory.map((n, i) => (<span key={i} className={`text-xs px-2 py-1 rounded ${i % 2 === 0 ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-200'}`}>{i % 2 === 0 ? `${Math.floor(i/2)+1}.` : ''}{n}</span>))}
          </div>
        </div>
      )}

      {showChat && (
        <div className="fixed bottom-4 right-4 w-80 bg-slate-800 rounded-lg shadow-xl overflow-hidden z-50">
          <div className="flex items-center justify-between p-3 bg-slate-700">
            <span className="text-white font-medium">Chat</span>
            <button onClick={() => setShowChat(false)}><X size={18} className="text-white" /></button>
          </div>
          <div className="h-48 overflow-auto p-3 space-y-2">
            {messages.map((m, i) => (<div key={i} className={`text-sm ${m.system ? 'text-yellow-400 italic' : m.from === 'You' ? 'text-blue-400' : 'text-white'}`}>{!m.system && <span className="font-medium">{m.from}: </span>}{m.text}</div>))}
          </div>
          <div className="p-2 border-t border-slate-700 flex gap-2">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Type a message..." className="flex-1 px-3 py-2 bg-slate-700 text-white rounded text-sm outline-none" />
            <button onClick={sendMessage} className="p-2 bg-blue-600 rounded"><Send size={16} className="text-white" /></button>
          </div>
        </div>
      )}

      {promotionPending && <PromotionModal isWhite={myColor === 'white'} onSelect={handlePromotion} />}
    </div>
  );
};

export default OnlineGame;