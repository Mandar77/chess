// File: server/index.js
// Location: chess-master/server/index.js

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');

const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/games');
const { setupSocketHandlers } = require('./socket/gameSocket');
const { initDatabase } = require('./db/init');

const app = express();
const server = http.createServer(app);

// ===========================================
// CORS Configuration for Production
// ===========================================
const allowedOrigins = [
  process.env.FRONTEND_URL,                    // Your Cloudflare Pages URL
  'https://your-app.pages.dev',                // Replace with your actual domain
  'http://localhost:3000',                     // Local development
  'http://localhost:5173',                     // Vite dev server
].filter(Boolean); // Remove any undefined values

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// ===========================================
// Socket.io Configuration
// ===========================================
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  // Important for production stability
  pingTimeout: 60000,      // How long to wait for pong response
  pingInterval: 25000,     // How often to ping clients
  transports: ['websocket', 'polling'], // WebSocket preferred, polling fallback
  allowUpgrades: true
});

// ===========================================
// Middleware
// ===========================================

// Security headers (but allow WebSocket and inline scripts for Socket.io)
app.use(helmet({
  contentSecurityPolicy: false,  // Disable CSP for Socket.io compatibility
  crossOriginEmbedderPolicy: false
}));

// Compress responses
app.use(compression());

// CORS
app.use(cors(corsOptions));

// Parse JSON bodies
app.use(express.json());

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ===========================================
// API Routes
// ===========================================
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);

// ===========================================
// Health Check Endpoint (Important for Koyeb!)
// ===========================================
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Also add a root health check
app.get('/', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    // In production, serve the React app
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  } else {
    res.json({ 
      message: 'Chess Master API Server',
      version: '1.0.0',
      status: 'running'
    });
  }
});

// ===========================================
// Socket.io Setup
// ===========================================
setupSocketHandlers(io);

// ===========================================
// Serve Static Files in Production
// ===========================================
if (process.env.NODE_ENV === 'production') {
  // Serve React build files
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // Handle React Router - send all non-API requests to React
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/') || req.path === '/health') {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// ===========================================
// Error Handling Middleware
// ===========================================
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS not allowed' });
  }
  
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message 
  });
});

// ===========================================
// Start Server
// ===========================================
const PORT = process.env.PORT || 8080;

initDatabase()
  .then(() => {
    server.listen(PORT, '0.0.0.0', () => {
      console.log('='.repeat(50));
      console.log(`🚀 Chess Master Server`);
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log('='.repeat(50));
    });
  })
  .catch(err => {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
  });

// ===========================================
// Graceful Shutdown
// ===========================================
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});