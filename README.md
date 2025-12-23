# ♟️ Chess Master

A full-featured chess application with real-time multiplayer support, computer opponents, and AI-powered game analysis using Google's Gemini API.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://chess-865.pages.dev/)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-green)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**🌐 Live Demo:** [chess-865.pages.dev](https://chess-865.pages.dev/)

---

## 📋 Table of Contents

- [Features](#-features)
- [Screenshots](#-screenshots)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
- [Usage](#-usage)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Troubleshooting](#-troubleshooting)
- [Roadmap](#-roadmap)
- [License](#-license)
- [Acknowledgments](#-acknowledgments)

---

## ✨ Features

### Core Gameplay
- **Player vs Player (Online)** — Challenge friends or random opponents in real-time multiplayer matches with seamless WebSocket-based communication
- **Player vs Computer** — Practice against a built-in computer opponent with adjustable difficulty levels
- **Real-time Updates** — All moves are synchronized instantly across connected clients using Socket.IO

### Game Management
- **Game History** — Review all your past games with full move notation
- **Move Validation** — Server-side validation ensures all moves comply with official chess rules
- **Timer Support** — Configurable game clocks for timed matches
- **Resign & Draw** — Offer draws or resign gracefully mid-game

### AI-Powered Analysis
- **Gemini Integration** — Leverage Google's Gemini API for intelligent post-game analysis
- **Move-by-Move Insights** — Get detailed feedback on each move's strategic value
- **Blunder Detection** — Identify critical mistakes and missed opportunities
- **Improvement Suggestions** — Receive personalized recommendations to enhance your gameplay

### User Experience
- **User Authentication** — Secure account creation and login with JWT tokens
- **Responsive Design** — Fully optimized for desktop, tablet, and mobile devices
- **Clean Interface** — Intuitive UI with smooth animations and clear visual feedback
- **Game Notifications** — Real-time alerts for game invites, moves, and results

---

## 📸 Screenshots

| Home Screen | Game Board | AI Analysis |
|-------------|------------|-------------|
| ![Home](screenshots/home.png) | ![Game](screenshots/game.png) | ![Analysis](screenshots/analysis.png) |

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React** | UI component library and state management |
| **Socket.IO Client** | Real-time bidirectional communication |
| **Lucide React** | Modern, customizable icon library |
| **CSS Modules / Tailwind** | Styling and responsive design |

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | JavaScript runtime environment |
| **Express** | Web application framework |
| **Socket.IO** | WebSocket server for real-time features |
| **PostgreSQL** | Relational database for persistent storage |
| **bcryptjs** | Secure password hashing |
| **jsonwebtoken** | JWT-based authentication |
| **cors** | Cross-origin resource sharing middleware |
| **helmet** | Security headers middleware |
| **compression** | Response compression for performance |
| **uuid** | Unique identifier generation |
| **dotenv** | Environment variable management |

---

## 🏗 Architecture

```
┌─────────────────┐         ┌─────────────────┐
│                 │  HTTP   │                 │
│  React Client   │◄───────►│  Express Server │
│                 │         │                 │
└────────┬────────┘         └────────┬────────┘
         │                           │
         │ WebSocket                 │
         │                           │
         └──────────┐   ┌────────────┘
                    │   │
                    ▼   ▼
              ┌─────────────┐
              │  Socket.IO  │
              └──────┬──────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│   PostgreSQL    │     │   Gemini API    │
│   (Game Data)   │     │   (Analysis)    │
└─────────────────┘     └─────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher) — [Download](https://nodejs.org/)
- **npm** (v9.0.0 or higher) or **yarn** (v1.22.0 or higher)
- **PostgreSQL** (v14.0 or higher) — [Download](https://www.postgresql.org/download/)
- **Git** — [Download](https://git-scm.com/)

Optional:
- **Gemini API Key** — [Get one here](https://makersuite.google.com/app/apikey) (required for AI analysis)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Mandar77/chess.git
   cd chess-master
   ```

2. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Set up the database**
   ```bash
   # Connect to PostgreSQL
   psql -U postgres

   # Create the database
   CREATE DATABASE chess_master;

   # Exit psql
   \q

   # Run migrations (from server directory)
   cd ../server
   npm run migrate
   ```

5. **Configure environment variables**
   ```bash
   # In the server directory
   cp .env.example .env
   # Edit .env with your configuration
   ```

6. **Start the development servers**

   In one terminal (backend):
   ```bash
   cd server
   npm run dev
   ```

   In another terminal (frontend):
   ```bash
   cd client
   npm start
   ```

7. **Open your browser**
   Navigate to `http://localhost:3000`

### Environment Variables

Create a `.env` file in the `server` directory with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/chess_master
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chess_master
DB_USER=your_username
DB_PASSWORD=your_password

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# CORS Configuration
CLIENT_URL=http://localhost:3000

# Gemini API (Optional - for AI analysis)
GEMINI_API_KEY=your_gemini_api_key
```

---

## 📖 Usage

### Creating an Account
1. Click **Sign Up** on the homepage
2. Enter your email, username, and password
3. Verify your email (if enabled)
4. Log in to access all features

### Playing a Game

**vs Player:**
1. Click **Play Online**
2. Choose to create a new game or join an existing one
3. Share the game code with your opponent
4. Play in real-time!

**vs Computer:**
1. Click **Play vs Computer**
2. Select difficulty level (Easy, Medium, Hard)
3. Choose your color (White or Black)
4. Start playing!

### AI Game Analysis
1. Complete a game
2. Navigate to **Game History**
3. Select a game and click **Analyze**
4. Wait for Gemini to process your game
5. Review move-by-move insights and recommendations

### Adding Your Gemini API Key
1. Log in to your account
2. Click the **Settings** icon (gear)
3. Navigate to **API Configuration**
4. Paste your Gemini API key
5. Click **Save**

---

## 📡 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create a new user account |
| POST | `/api/auth/login` | Authenticate and receive JWT |
| POST | `/api/auth/logout` | Invalidate current session |
| GET | `/api/auth/me` | Get current user profile |

### Game Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/games` | Create a new game |
| GET | `/api/games` | List user's games |
| GET | `/api/games/:id` | Get specific game details |
| PUT | `/api/games/:id/move` | Make a move |
| PUT | `/api/games/:id/resign` | Resign from game |
| PUT | `/api/games/:id/draw` | Offer/accept draw |

### Analysis Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analysis/:gameId` | Request AI analysis |
| GET | `/api/analysis/:gameId` | Get analysis results |

### WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `join_game` | Client → Server | Join a game room |
| `make_move` | Client → Server | Send a move |
| `move_made` | Server → Client | Broadcast move to opponent |
| `game_over` | Server → Client | Notify game completion |
| `opponent_joined` | Server → Client | Notify opponent connection |
| `opponent_disconnected` | Server → Client | Notify opponent disconnection |

---

## 🗄 Database Schema

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    gemini_api_key VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Games table
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    white_player_id UUID REFERENCES users(id),
    black_player_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending',
    result VARCHAR(20),
    pgn TEXT,
    time_control INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Moves table
CREATE TABLE moves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    move_number INTEGER NOT NULL,
    notation VARCHAR(10) NOT NULL,
    fen VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analysis table
CREATE TABLE analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    analysis_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🌐 Deployment

### Deploying to Cloudflare Pages (Frontend)

1. Connect your GitHub repository to Cloudflare Pages
2. Configure build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `build`
3. Add environment variables in the Cloudflare dashboard
4. Deploy!

### Deploying Backend (Railway/Render/Heroku)

**Railway:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

**Environment Variables for Production:**
```env
NODE_ENV=production
DATABASE_URL=your_production_database_url
JWT_SECRET=your_production_jwt_secret
CLIENT_URL=https://chess-865.pages.dev
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
   ```bash
   git clone https://github.com/Mandar77/chess.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow the existing code style
   - Write meaningful commit messages
   - Add tests for new features

4. **Run tests**
   ```bash
   npm test
   ```

5. **Commit your changes**
   ```bash
   git commit -m "feat: add amazing feature"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

7. **Open a Pull Request**

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation changes
- `style:` — Code style changes (formatting, etc.)
- `refactor:` — Code refactoring
- `test:` — Adding or updating tests
- `chore:` — Maintenance tasks

---

## 🔧 Troubleshooting

### Common Issues

**WebSocket connection failed**
```
Error: WebSocket connection to 'ws://localhost:5000' failed
```
**Solution:** Ensure the backend server is running and CORS is properly configured.

**Database connection error**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:** Verify PostgreSQL is running and connection credentials are correct.

**JWT token expired**
```
Error: TokenExpiredError: jwt expired
```
**Solution:** Log out and log back in to receive a fresh token.

**Gemini API rate limit**
```
Error: 429 Too Many Requests
```
**Solution:** Wait a few minutes before requesting another analysis, or upgrade your Gemini API plan.

### Getting Help

- 📖 Check the [Wiki](https://github.com/Mandar77/chess/wiki)
- 🐛 Report bugs via [Issues](https://github.com/Mandar77/chess/issues)

---

## 🗺 Roadmap

- [x] Core chess gameplay
- [x] Player vs Player mode
- [x] Player vs Computer mode
- [x] User authentication
- [x] Game history
- [x] Gemini AI integration
- [ ] ELO rating system
- [ ] Tournaments
- [ ] Puzzles and training
- [ ] Opening explorer
- [ ] Mobile app (React Native)
- [ ] Spectator mode
- [ ] Chat functionality
- [ ] Themes and customization

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Chess Master

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

- [Chess.js](https://github.com/jhlywa/chess.js) — Chess move validation library
- [React Chessboard](https://github.com/Clariity/react-chessboard) — Chessboard UI component
- [Socket.IO](https://socket.io/) — Real-time communication
- [Google Gemini](https://deepmind.google/technologies/gemini/) — AI-powered analysis
- [Lucide](https://lucide.dev/) — Beautiful icons

---

<p align="center">
  Made with ♟️ and ❤️
</p>

<p align="center">
  <a href="https://chess-865.pages.dev/">Live Demo</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-contributing">Contributing</a>
</p>