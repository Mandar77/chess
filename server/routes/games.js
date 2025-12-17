// Game routes
const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { createGame, updateGame, getRecentGames, getGameById } = require('../db/queries');

const router = express.Router();

// Create new game
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { gameType, difficulty, opponentId } = req.body;
    const userId = req.user.userId;

    const game = await createGame(
      userId,
      gameType === 'ai' ? null : opponentId,
      gameType,
      difficulty
    );

    res.status(201).json(game);
  } catch (error) {
    console.error('Create game error:', error);
    res.status(500).json({ error: 'Failed to create game' });
  }
});

// Save completed game
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { moves, result, winnerId } = req.body;

    const game = await updateGame(id, moves, result, winnerId);
    res.json(game);
  } catch (error) {
    console.error('Update game error:', error);
    res.status(500).json({ error: 'Failed to update game' });
  }
});

// Get recent games for user
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const games = await getRecentGames(req.user.userId, limit);
    res.json(games);
  } catch (error) {
    console.error('Get games error:', error);
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// Get specific game
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const game = await getGameById(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json(game);
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({ error: 'Failed to fetch game' });
  }
});

module.exports = router;
