// Database query functions
const { pool } = require('./init');

// User queries
const createUser = async (username, email, passwordHash) => {
  const result = await pool.query(
    'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, elo_rating',
    [username, email, passwordHash]
  );
  return result.rows[0];
};

const findUserByUsername = async (username) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE username = $1',
    [username]
  );
  return result.rows[0];
};

const findUserByEmail = async (email) => {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0];
};

const findUserById = async (id) => {
  const result = await pool.query(
    'SELECT id, username, email, elo_rating, games_played, games_won, created_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0];
};

const updateUserStats = async (userId, won) => {
  await pool.query(
    `UPDATE users SET 
      games_played = games_played + 1,
      games_won = games_won + $2,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1`,
    [userId, won ? 1 : 0]
  );
};

// Game queries
const createGame = async (whitePlayerId, blackPlayerId, gameType, difficulty = null) => {
  const result = await pool.query(
    `INSERT INTO games (white_player_id, black_player_id, game_type, difficulty) 
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [whitePlayerId, blackPlayerId, gameType, difficulty]
  );
  return result.rows[0];
};

const updateGame = async (gameId, moves, result, winnerId) => {
  const res = await pool.query(
    `UPDATE games SET 
      moves = $2,
      result = $3,
      winner_id = $4,
      ended_at = CURRENT_TIMESTAMP,
      is_completed = TRUE
    WHERE id = $1 RETURNING *`,
    [gameId, JSON.stringify(moves), result, winnerId]
  );
  return res.rows[0];
};

const getRecentGames = async (userId, limit = 10) => {
  const result = await pool.query(
    `SELECT g.*, 
      w.username as white_username,
      b.username as black_username
    FROM games g
    LEFT JOIN users w ON g.white_player_id = w.id
    LEFT JOIN users b ON g.black_player_id = b.id
    WHERE (g.white_player_id = $1 OR g.black_player_id = $1)
      AND g.is_completed = TRUE
    ORDER BY g.ended_at DESC
    LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
};

const getGameById = async (gameId) => {
  const result = await pool.query(
    `SELECT g.*, 
      w.username as white_username,
      b.username as black_username
    FROM games g
    LEFT JOIN users w ON g.white_player_id = w.id
    LEFT JOIN users b ON g.black_player_id = b.id
    WHERE g.id = $1`,
    [gameId]
  );
  return result.rows[0];
};

module.exports = {
  createUser,
  findUserByUsername,
  findUserByEmail,
  findUserById,
  updateUserStats,
  createGame,
  updateGame,
  getRecentGames,
  getGameById
};
