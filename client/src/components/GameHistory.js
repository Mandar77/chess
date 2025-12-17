import React, { useState, useEffect } from 'react';
import { ChevronLeft, Trophy, Lightbulb, Loader2 } from 'lucide-react';
import GameAnalysis from './GameAnalysis';

const GameHistory = ({ onBack }) => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analysisGame, setAnalysisGame] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const token = localStorage.getItem('chess_token');
      const res = await fetch('/api/games/history?limit=10', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setGames(data);
      } else {
        setError('Failed to load games');
      }
    } catch (err) {
      console.error('Failed to fetch games:', err);
      setError('Failed to load games');
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-white" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <button
          onClick={onBack}
          className="mb-4 text-slate-300 hover:text-white flex items-center gap-2 transition"
        >
          <ChevronLeft size={20} /> Back to Menu
        </button>

        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Trophy size={28} /> Your Games
        </h2>

        {/* Error State */}
        {error && (
          <div className="text-center text-red-400 py-8">
            <p>{error}</p>
            <button 
              onClick={fetchGames}
              className="mt-4 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!error && games.length === 0 && (
          <div className="text-center text-slate-400 py-12">
            <Trophy size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">No games played yet</p>
            <p className="text-sm mt-2">Start a game to see your history here!</p>
          </div>
        )}

        {/* Games List */}
        {!error && games.length > 0 && (
          <div className="space-y-3">
            {games.map(game => (
              <div
                key={game.id}
                className="bg-white/10 backdrop-blur rounded-lg p-4 flex items-center justify-between hover:bg-white/15 transition"
              >
                <div>
                  <p className="text-white font-medium">
                    vs {game.game_type === 'ai' 
                      ? `Computer (${game.difficulty || 'medium'})` 
                      : game.black_username || 'Player 2'}
                  </p>
                  <p className="text-slate-400 text-sm">
                    {game.ended_at 
                      ? new Date(game.ended_at).toLocaleDateString() 
                      : 'In progress'} 
                    {' • '}
                    {game.moves?.length || 0} moves
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium
                      ${game.result === 'win' || game.result === 'checkmate' 
                        ? 'bg-green-600' 
                        : game.result === 'loss' 
                          ? 'bg-red-600' 
                          : 'bg-yellow-600'} text-white`}
                  >
                    {game.result || 'ongoing'}
                  </span>
                  
                  {game.moves && game.moves.length > 0 && (
                    <button
                      onClick={() => setAnalysisGame(game)}
                      title="Analyze Game"
                      className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                      <Lightbulb size={20} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Summary */}
        {!error && games.length > 0 && (
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">
                {games.filter(g => g.result === 'win' || g.result === 'checkmate').length}
              </p>
              <p className="text-slate-400 text-sm">Wins</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">
                {games.filter(g => g.result === 'loss').length}
              </p>
              <p className="text-slate-400 text-sm">Losses</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-white">
                {games.filter(g => g.result === 'draw' || g.result === 'stalemate').length}
              </p>
              <p className="text-slate-400 text-sm">Draws</p>
            </div>
          </div>
        )}
      </div>

      {/* Analysis Modal */}
      {analysisGame && (
        <GameAnalysis
          game={analysisGame}
          onClose={() => setAnalysisGame(null)}
        />
      )}
    </div>
  );
};

export default GameHistory;
