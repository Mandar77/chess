// Database initialization and connection
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false
});

const initDatabase = async () => {
  const client = await pool.connect();
  
  try {
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        elo_rating INTEGER DEFAULT 1200,
        games_played INTEGER DEFAULT 0,
        games_won INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create games table
    await client.query(`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        white_player_id INTEGER REFERENCES users(id),
        black_player_id INTEGER,
        game_type VARCHAR(20) NOT NULL,
        difficulty VARCHAR(20),
        result VARCHAR(20),
        winner_id INTEGER REFERENCES users(id),
        pgn TEXT,
        moves JSONB DEFAULT '[]',
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP,
        is_completed BOOLEAN DEFAULT FALSE
      )
    `);

    // Create index for faster queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_games_white_player ON games(white_player_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_games_black_player ON games(black_player_id);
    `);

    console.log('✅ Database initialized successfully');
  } finally {
    client.release();
  }
};

module.exports = { pool, initDatabase };
