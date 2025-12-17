import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Lightbulb, Eye, Loader2, BookOpen } from 'lucide-react';
import ChessBoard from './ChessBoard';
import {
  INITIAL_GAME_STATE,
  cloneGameState,
  applyMoveToBoard,
  getAllMoves,
  minimax,
  isInCheck,
  findKing,
  moveToNotation,
  posToNotation
} from '../utils/chessLogic';

const GameAnalysis = ({ game, onClose }) => {
  const [moveIndex, setMoveIndex] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [gameState, setGameState] = useState(cloneGameState(INITIAL_GAME_STATE));
  const [optimalMove, setOptimalMove] = useState(null);
  const [checkPos, setCheckPos] = useState(null);

  const moves = game.moves || [];

  useEffect(() => {
    let state = cloneGameState(INITIAL_GAME_STATE);
    
    for (let i = 0; i < moveIndex && i < moves.length; i++) {
      const m = moves[i];
      applyMoveToBoard(state, m.from, m.to);
      state.turn = state.turn === 'white' ? 'black' : 'white';
    }
    
    setGameState(state);
    setOptimalMove(null);
    setAnalysis(null);

    const isWhiteTurn = state.turn === 'white';
    if (isInCheck(state.board, isWhiteTurn)) {
      setCheckPos(findKing(state.board, isWhiteTurn));
    } else {
      setCheckPos(null);
    }
  }, [moveIndex, moves]);

  const analyzePosition = async () => {
    setLoading(true);
    
    const isWhiteTurn = gameState.turn === 'white';
    const availableMoves = getAllMoves(gameState, isWhiteTurn);

    if (availableMoves.length === 0) {
      setAnalysis({ text: "No legal moves available at this position.", optimal: null });
      setLoading(false);
      return;
    }

    // Find best move using minimax
    let bestMove = availableMoves[0];
    let bestEval = isWhiteTurn ? -Infinity : Infinity;

    for (const move of availableMoves) {
      const testState = cloneGameState(gameState);
      applyMoveToBoard(testState, move.from, move.to);
      testState.turn = isWhiteTurn ? 'black' : 'white';
      
      const evalScore = minimax(testState, 3, -Infinity, Infinity, !isWhiteTurn);
      
      if ((isWhiteTurn && evalScore > bestEval) || (!isWhiteTurn && evalScore < bestEval)) {
        bestEval = evalScore;
        bestMove = move;
      }
    }

    setOptimalMove(bestMove);

    const actualMove = moves[moveIndex];
    const optimalNotation = moveToNotation(gameState, bestMove.from, bestMove.to);
    const actualNotation = actualMove ? moveToNotation(gameState, actualMove.from, actualMove.to) : null;
    const piece = gameState.board[bestMove.from.row][bestMove.from.col];
    const pieceName = { p: 'pawn', n: 'knight', b: 'bishop', r: 'rook', q: 'queen', k: 'king' }[piece.toLowerCase()];

    const prompt = `You are a chess coach analyzing a position. Move ${moveIndex + 1} for ${isWhiteTurn ? 'White' : 'Black'}.

Optimal move: ${optimalNotation} (${pieceName} from ${posToNotation(bestMove.from)} to ${posToNotation(bestMove.to)})
${actualMove ? `Player played: ${actualNotation}` : 'Current position to analyze.'}
Evaluation: ${bestEval > 0 ? 'White advantage' : bestEval < 0 ? 'Black advantage' : 'Equal'} (${bestEval.toFixed(1)})

Give a brief 2-3 sentence analysis: why is the optimal move strong, and ${actualMove ? 'was the actual move good?' : 'what ideas to consider?'} Be educational and encouraging.`;

    // Try Gemini API
    const apiKey = localStorage.getItem('chess_gemini_key');
    
    try {
      if (apiKey) {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { maxOutputTokens: 300 }
            })
          }
        );

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (text) {
          setAnalysis({
            text,
            optimal: optimalNotation,
            actual: actualNotation,
            eval: bestEval
          });
          setLoading(false);
          return;
        }
      }
      throw new Error('API unavailable');
    } catch (err) {
      // Fallback to local analysis
      const isGoodMove = actualMove &&
        actualMove.from.row === bestMove.from.row &&
        actualMove.from.col === bestMove.from.col &&
        actualMove.to.row === bestMove.to.row &&
        actualMove.to.col === bestMove.to.col;

      setAnalysis({
        text: isGoodMove
          ? `Excellent! ${optimalNotation} is the optimal move. This ${pieceName} move ${bestEval > 0 ? "maintains White's advantage" : bestEval < 0 ? "maintains Black's pressure" : 'keeps the position balanced'} by controlling key squares and improving piece activity.`
          : `The optimal move here is ${optimalNotation}. ${actualNotation ? `Playing ${actualNotation} ${Math.abs(bestEval) < 1 ? 'is also reasonable' : 'misses some tactical opportunities'}.` : ''} The ${pieceName} move improves piece coordination and board control.`,
        optimal: optimalNotation,
        actual: actualNotation,
        eval: bestEval,
        isLocal: true
      });
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-auto">
      <div className="bg-white rounded-xl p-4 sm:p-6 max-w-3xl w-full max-h-[95vh] overflow-auto shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen size={24} /> Game Analysis
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex flex-col items-center">
            <ChessBoard
              board={gameState.board}
              interactive={false}
              highlights={optimalMove ? [{ ...optimalMove.from }, { ...optimalMove.to }] : []}
              inCheck={checkPos}
            />
            
            <div className="flex items-center gap-2 mt-4">
              <button
                onClick={() => setMoveIndex(0)}
                disabled={moveIndex === 0}
                className="p-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-40 transition"
              >
                ⏮
              </button>
              <button
                onClick={() => setMoveIndex(Math.max(0, moveIndex - 1))}
                disabled={moveIndex === 0}
                className="p-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-40 transition"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="px-4 py-2 bg-gray-100 rounded min-w-[100px] text-center font-medium">
                Move {moveIndex}/{moves.length}
              </span>
              <button
                onClick={() => setMoveIndex(Math.min(moves.length, moveIndex + 1))}
                disabled={moveIndex >= moves.length}
                className="p-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-40 transition"
              >
                <ChevronRight size={20} />
              </button>
              <button
                onClick={() => setMoveIndex(moves.length)}
                disabled={moveIndex >= moves.length}
                className="p-2 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-40 transition"
              >
                ⏭
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Game Info</h3>
              <p className="text-sm text-gray-600">
                vs {game.game_type === 'ai' ? `Computer (${game.difficulty})` : game.black_username || 'Player 2'}
              </p>
              <p className="text-sm">
                Result:{' '}
                <span className={`font-medium ${
                  game.result === 'win' || game.result === 'checkmate' ? 'text-green-600' :
                  game.result === 'loss' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {game.result?.toUpperCase()}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                {new Date(game.ended_at || game.started_at).toLocaleDateString()}
              </p>
            </div>

            <button
              onClick={analyzePosition}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Lightbulb size={20} />}
              {loading ? 'Analyzing...' : 'Get AI Analysis'}
            </button>

            {analysis && (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-start gap-2 mb-2">
                  <Eye className="text-purple-600 mt-1 flex-shrink-0" size={18} />
                  <div>
                    <p className="font-semibold text-purple-800">
                      Optimal: {analysis.optimal}
                      {analysis.eval !== undefined && (
                        <span className={`ml-2 text-sm ${
                          analysis.eval > 0.5 ? 'text-green-600' :
                          analysis.eval < -0.5 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          ({analysis.eval > 0 ? '+' : ''}{analysis.eval.toFixed(1)})
                        </span>
                      )}
                    </p>
                    {analysis.actual && (
                      <p className="text-sm text-gray-600">You played: {analysis.actual}</p>
                    )}
                  </div>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">{analysis.text}</p>
                {analysis.isLocal && (
                  <p className="text-xs text-gray-500 mt-2 italic">
                    💡 Add Gemini API key in settings for AI-powered analysis
                  </p>
                )}
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-auto">
              <h3 className="font-semibold mb-2">Move History</h3>
              <div className="flex flex-wrap gap-1">
                {moves.map((m, i) => (
                  <button
                    key={i}
                    onClick={() => setMoveIndex(i + 1)}
                    className={`px-2 py-1 text-xs rounded transition ${
                      i + 1 === moveIndex
                        ? 'bg-blue-600 text-white'
                        : 'bg-white hover:bg-gray-200'
                    }`}
                  >
                    {i % 2 === 0 ? `${Math.floor(i / 2) + 1}.` : ''}
                    {m.notation || `${posToNotation(m.from)}-${posToNotation(m.to)}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameAnalysis;