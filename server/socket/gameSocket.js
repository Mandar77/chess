// Socket.io handlers for real-time multiplayer
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Store active games and waiting players
const waitingPlayers = new Map(); // socketId -> { userId, username, socket }
const activeGames = new Map(); // gameId -> { white, black, moves, board, turn }
const playerGames = new Map(); // odirectSocketId -> gameId

const setupSocketHandlers = (io) => {
  // Authentication middleware for sockets
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (!err) {
          socket.userId = decoded.userId;
          socket.username = decoded.username;
        }
      });
    }
    next();
  });

  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.username || 'Guest'} (${socket.id})`);

    // Find online match
    socket.on('find_match', () => {
      if (!socket.userId) {
        socket.emit('error', { message: 'Must be logged in to play online' });
        return;
      }

      // Check if already in queue or game
      if (playerGames.has(socket.id)) {
        socket.emit('error', { message: 'Already in a game' });
        return;
      }

      // Try to match with waiting player
      for (const [waitingId, player] of waitingPlayers) {
        if (player.userId !== socket.userId) {
          // Found a match!
          waitingPlayers.delete(waitingId);
          
          const gameId = uuidv4();
          const isWhite = Math.random() > 0.5;
          
          const gameState = {
            id: gameId,
            white: isWhite ? socket : player.socket,
            black: isWhite ? player.socket : socket,
            whiteId: isWhite ? socket.userId : player.userId,
            blackId: isWhite ? player.userId : socket.userId,
            whiteName: isWhite ? socket.username : player.username,
            blackName: isWhite ? player.username : socket.username,
            moves: [],
            turn: 'white',
            startTime: Date.now()
          };
          
          activeGames.set(gameId, gameState);
          playerGames.set(socket.id, gameId);
          playerGames.set(player.socket.id, gameId);
          
          // Notify both players
          socket.emit('match_found', {
            gameId,
            color: isWhite ? 'white' : 'black',
            opponent: isWhite ? player.username : socket.username
          });
          
          player.socket.emit('match_found', {
            gameId,
            color: isWhite ? 'black' : 'white',
            opponent: isWhite ? socket.username : player.username
          });
          
          console.log(`🎮 Match created: ${socket.username} vs ${player.username}`);
          return;
        }
      }

      // No match found, add to waiting queue
      waitingPlayers.set(socket.id, {
        userId: socket.userId,
        username: socket.username,
        socket
      });
      
      socket.emit('waiting_for_match', {
        position: waitingPlayers.size
      });
      
      console.log(`⏳ ${socket.username} waiting for match`);
    });

    // Cancel matchmaking
    socket.on('cancel_matchmaking', () => {
      waitingPlayers.delete(socket.id);
      socket.emit('matchmaking_cancelled');
    });

    // Make a move
    socket.on('make_move', ({ gameId, move }) => {
      const game = activeGames.get(gameId);
      if (!game) {
        socket.emit('error', { message: 'Game not found' });
        return;
      }

      const isWhite = game.white.id === socket.id;
      const isBlack = game.black.id === socket.id;
      
      if (!isWhite && !isBlack) {
        socket.emit('error', { message: 'Not in this game' });
        return;
      }

      const expectedTurn = game.turn === 'white' ? isWhite : isBlack;
      if (!expectedTurn) {
        socket.emit('error', { message: 'Not your turn' });
        return;
      }

      // Record move
      game.moves.push(move);
      game.turn = game.turn === 'white' ? 'black' : 'white';

      // Broadcast move to opponent
      const opponent = isWhite ? game.black : game.white;
      opponent.emit('opponent_move', { move });
      
      // Confirm move to sender
      socket.emit('move_confirmed', { move });
    });

    // Game over
    socket.on('game_over', ({ gameId, result, winnerId }) => {
      const game = activeGames.get(gameId);
      if (!game) return;

      // Notify both players
      game.white.emit('game_ended', { result, winnerId, moves: game.moves });
      game.black.emit('game_ended', { result, winnerId, moves: game.moves });

      // Cleanup
      playerGames.delete(game.white.id);
      playerGames.delete(game.black.id);
      activeGames.delete(gameId);
      
      console.log(`🏁 Game ended: ${result}`);
    });

    // Resign
    socket.on('resign', ({ gameId }) => {
      const game = activeGames.get(gameId);
      if (!game) return;

      const isWhite = game.white.id === socket.id;
      const winnerId = isWhite ? game.blackId : game.whiteId;
      
      game.white.emit('game_ended', { 
        result: 'resignation', 
        winnerId,
        resignedBy: socket.username 
      });
      game.black.emit('game_ended', { 
        result: 'resignation', 
        winnerId,
        resignedBy: socket.username 
      });

      playerGames.delete(game.white.id);
      playerGames.delete(game.black.id);
      activeGames.delete(gameId);
    });

    // Offer draw
    socket.on('offer_draw', ({ gameId }) => {
      const game = activeGames.get(gameId);
      if (!game) return;

      const opponent = game.white.id === socket.id ? game.black : game.white;
      opponent.emit('draw_offered', { from: socket.username });
    });

    // Respond to draw offer
    socket.on('draw_response', ({ gameId, accepted }) => {
      const game = activeGames.get(gameId);
      if (!game) return;

      if (accepted) {
        game.white.emit('game_ended', { result: 'draw', winnerId: null });
        game.black.emit('game_ended', { result: 'draw', winnerId: null });
        
        playerGames.delete(game.white.id);
        playerGames.delete(game.black.id);
        activeGames.delete(gameId);
      } else {
        const opponent = game.white.id === socket.id ? game.black : game.white;
        opponent.emit('draw_declined');
      }
    });

    // Chat message
    socket.on('chat_message', ({ gameId, message }) => {
      const game = activeGames.get(gameId);
      if (!game) return;

      const opponent = game.white.id === socket.id ? game.black : game.white;
      opponent.emit('chat_message', {
        from: socket.username,
        message,
        timestamp: Date.now()
      });
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.username || 'Guest'}`);
      
      // Remove from waiting queue
      waitingPlayers.delete(socket.id);
      
      // Handle active game
      const gameId = playerGames.get(socket.id);
      if (gameId) {
        const game = activeGames.get(gameId);
        if (game) {
          const opponent = game.white.id === socket.id ? game.black : game.white;
          opponent.emit('opponent_disconnected', {
            message: 'Your opponent has disconnected'
          });
          
          // Give 30 seconds to reconnect, then end game
          setTimeout(() => {
            if (activeGames.has(gameId)) {
              const winnerId = game.white.id === socket.id ? game.blackId : game.whiteId;
              opponent.emit('game_ended', { 
                result: 'disconnect', 
                winnerId 
              });
              activeGames.delete(gameId);
            }
          }, 30000);
        }
        playerGames.delete(socket.id);
      }
    });
  });
};

module.exports = { setupSocketHandlers };