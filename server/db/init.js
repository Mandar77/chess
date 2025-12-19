// File: server/db/init.js
// Location: chess-master/server/db/init.js

const { Pool } = require('pg');

// ===========================================
// Database Connection Pool
// ===========================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // SSL configuration for production (Neon, Supabase, etc.)
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false,
  // Connection pool settings
  max: 10,                    // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,   // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if can't connect
});

// Log connection status
pool.on('connect', () => {
  console.log('📦 Database client connected');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
});

// ===========================================
// Initialize Database Tables
// ===========================================
const initDatabase = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Initializing database...');

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
    console.log('  ✓ Users table ready');

    // Create games table
    await client.query(`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        white_player_id INTEGER REFERENCES users(id),
        black_player_id INTEGER,
        game_type VARCHAR(20) NOT NULL,
        difficulty VARCHAR(20),
        time_control INTEGER DEFAULT 10,
        result VARCHAR(20),
        winner_id INTEGER REFERENCES users(id),
        pgn TEXT,
        moves JSONB DEFAULT '[]',
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP,
        is_completed BOOLEAN DEFAULT FALSE
      )
    `);
    console.log('  ✓ Games table ready');

    // Create indexes for faster queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_games_white_player ON games(white_player_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_games_black_player ON games(black_player_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_games_completed ON games(is_completed);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `);
    console.log('  ✓ Indexes created');

    console.log('✅ Database initialized successfully');
  } catch (err) {
    console.error('❌ Database initialization error:', err.message);
    throw err;
  } finally {
    client.release();
  }
};

// ===========================================
// Test Database Connection
// ===========================================
const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('📡 Database connected at:', result.rows[0].now);
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    return false;
  }
};

module.exports = { pool, initDatabase, testConnection };