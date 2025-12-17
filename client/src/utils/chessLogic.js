// File: client/src/utils/chessLogic.js

export const PIECES = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟'
};

export const INITIAL_BOARD = [
  ['r','n','b','q','k','b','n','r'],
  ['p','p','p','p','p','p','p','p'],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['','','','','','','',''],
  ['P','P','P','P','P','P','P','P'],
  ['R','N','B','Q','K','B','N','R']
];

export const INITIAL_GAME_STATE = {
  board: INITIAL_BOARD.map(row => [...row]),
  turn: 'white',
  castlingRights: {
    whiteKingSide: true,
    whiteQueenSide: true,
    blackKingSide: true,
    blackQueenSide: true
  },
  enPassantTarget: null,
  halfMoveClock: 0,
  fullMoveNumber: 1,
  moves: []
};

export const cloneBoard = (board) => board.map(row => [...row]);

export const cloneGameState = (state) => ({
  ...state,
  board: cloneBoard(state.board),
  castlingRights: { ...state.castlingRights },
  enPassantTarget: state.enPassantTarget ? { ...state.enPassantTarget } : null,
  moves: [...state.moves]
});

export const findKing = (board, isWhite) => {
  const king = isWhite ? 'K' : 'k';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === king) return { row: r, col: c };
    }
  }
  return null;
};

export const isPathClear = (board, from, to) => {
  const dr = Math.sign(to.row - from.row);
  const dc = Math.sign(to.col - from.col);
  let r = from.row + dr;
  let c = from.col + dc;
  while (r !== to.row || c !== to.col) {
    if (board[r][c]) return false;
    r += dr;
    c += dc;
  }
  return true;
};

export const canPieceAttack = (board, from, to, piece) => {
  const type = piece.toLowerCase();
  const dr = to.row - from.row;
  const dc = to.col - from.col;
  const isWhite = piece === piece.toUpperCase();

  switch (type) {
    case 'p': {
      const dir = isWhite ? -1 : 1;
      return Math.abs(dc) === 1 && dr === dir;
    }
    case 'r':
      return (dr === 0 || dc === 0) && (dr !== 0 || dc !== 0) && isPathClear(board, from, to);
    case 'b':
      return Math.abs(dr) === Math.abs(dc) && dr !== 0 && isPathClear(board, from, to);
    case 'q':
      return (dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc)) && 
             (dr !== 0 || dc !== 0) && isPathClear(board, from, to);
    case 'n':
      return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || 
             (Math.abs(dr) === 1 && Math.abs(dc) === 2);
    case 'k':
      return Math.abs(dr) <= 1 && Math.abs(dc) <= 1 && (dr !== 0 || dc !== 0);
    default:
      return false;
  }
};

export const isSquareAttacked = (board, pos, byWhite) => {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p) continue;
      const pieceIsWhite = p === p.toUpperCase();
      if (pieceIsWhite !== byWhite) continue;
      if (canPieceAttack(board, { row: r, col: c }, pos, p)) return true;
    }
  }
  return false;
};

export const isInCheck = (board, isWhite) => {
  const kingPos = findKing(board, isWhite);
  if (!kingPos) return false;
  return isSquareAttacked(board, kingPos, !isWhite);
};

const addPawnMoves = (board, pos, isWhite, enPassantTarget, moves) => {
  const dir = isWhite ? -1 : 1;
  const startRow = isWhite ? 6 : 1;
  const { row, col } = pos;

  if (board[row + dir]?.[col] === '') {
    moves.push({ row: row + dir, col, type: 'normal' });
    if (row === startRow && board[row + 2 * dir]?.[col] === '') {
      moves.push({ row: row + 2 * dir, col, type: 'double' });
    }
  }

  for (const dc of [-1, 1]) {
    const newCol = col + dc;
    if (newCol < 0 || newCol > 7) continue;
    const target = board[row + dir]?.[newCol];
    if (target && target !== '') {
      const targetIsWhite = target === target.toUpperCase();
      if (targetIsWhite !== isWhite) {
        moves.push({ row: row + dir, col: newCol, type: 'capture' });
      }
    }
    if (enPassantTarget && enPassantTarget.row === row + dir && enPassantTarget.col === newCol) {
      moves.push({ row: row + dir, col: newCol, type: 'enpassant' });
    }
  }
};

const addSlidingMoves = (board, pos, isWhite, directions, moves) => {
  for (const [dr, dc] of directions) {
    let r = pos.row + dr;
    let c = pos.col + dc;
    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const target = board[r][c];
      if (!target || target === '') {
        moves.push({ row: r, col: c, type: 'normal' });
      } else {
        const targetIsWhite = target === target.toUpperCase();
        if (targetIsWhite !== isWhite) {
          moves.push({ row: r, col: c, type: 'capture' });
        }
        break;
      }
      r += dr;
      c += dc;
    }
  }
};

const addKnightMoves = (board, pos, isWhite, moves) => {
  const jumps = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
  for (const [dr, dc] of jumps) {
    const r = pos.row + dr;
    const c = pos.col + dc;
    if (r < 0 || r > 7 || c < 0 || c > 7) continue;
    const target = board[r][c];
    if (!target || target === '') {
      moves.push({ row: r, col: c, type: 'normal' });
    } else {
      const targetIsWhite = target === target.toUpperCase();
      if (targetIsWhite !== isWhite) {
        moves.push({ row: r, col: c, type: 'capture' });
      }
    }
  }
};

const addKingMoves = (board, pos, isWhite, castlingRights, moves) => {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = pos.row + dr;
      const c = pos.col + dc;
      if (r < 0 || r > 7 || c < 0 || c > 7) continue;
      const target = board[r][c];
      if (!target || target === '') {
        moves.push({ row: r, col: c, type: 'normal' });
      } else {
        const targetIsWhite = target === target.toUpperCase();
        if (targetIsWhite !== isWhite) {
          moves.push({ row: r, col: c, type: 'capture' });
        }
      }
    }
  }

  const row = isWhite ? 7 : 0;
  if (pos.row !== row || pos.col !== 4) return;
  if (isSquareAttacked(board, pos, !isWhite)) return;

  const canKingSide = isWhite ? castlingRights.whiteKingSide : castlingRights.blackKingSide;
  if (canKingSide) {
    const rookPresent = board[row][7] === (isWhite ? 'R' : 'r');
    if (rookPresent && (!board[row][5] || board[row][5] === '') && (!board[row][6] || board[row][6] === '') &&
        !isSquareAttacked(board, { row, col: 5 }, !isWhite) && !isSquareAttacked(board, { row, col: 6 }, !isWhite)) {
      moves.push({ row, col: 6, type: 'castle-king' });
    }
  }

  const canQueenSide = isWhite ? castlingRights.whiteQueenSide : castlingRights.blackQueenSide;
  if (canQueenSide) {
    const rookPresent = board[row][0] === (isWhite ? 'R' : 'r');
    if (rookPresent && (!board[row][1] || board[row][1] === '') && (!board[row][2] || board[row][2] === '') && 
        (!board[row][3] || board[row][3] === '') && !isSquareAttacked(board, { row, col: 2 }, !isWhite) && 
        !isSquareAttacked(board, { row, col: 3 }, !isWhite)) {
      moves.push({ row, col: 2, type: 'castle-queen' });
    }
  }
};

export const getValidMoves = (gameState, pos) => {
  const { board, castlingRights, enPassantTarget, turn } = gameState;
  const piece = board[pos.row][pos.col];
  if (!piece || piece === '') return [];
  const isWhite = piece === piece.toUpperCase();
  if ((turn === 'white' && !isWhite) || (turn === 'black' && isWhite)) return [];
  
  const moves = [];
  const type = piece.toLowerCase();

  switch (type) {
    case 'p': addPawnMoves(board, pos, isWhite, enPassantTarget, moves); break;
    case 'r': addSlidingMoves(board, pos, isWhite, [[0,1],[0,-1],[1,0],[-1,0]], moves); break;
    case 'b': addSlidingMoves(board, pos, isWhite, [[1,1],[1,-1],[-1,1],[-1,-1]], moves); break;
    case 'q': addSlidingMoves(board, pos, isWhite, [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]], moves); break;
    case 'n': addKnightMoves(board, pos, isWhite, moves); break;
    case 'k': addKingMoves(board, pos, isWhite, castlingRights, moves); break;
    default: break;
  }

  return moves.filter(move => {
    const testState = cloneGameState(gameState);
    applyMoveToBoard(testState, pos, move);
    return !isInCheck(testState.board, isWhite);
  });
};

export const applyMoveToBoard = (gameState, from, to) => {
  const { board, castlingRights } = gameState;
  const piece = board[from.row][from.col];
  const isWhite = piece === piece.toUpperCase();
  const type = piece.toLowerCase();

  if (to.type === 'enpassant') {
    const capturedRow = isWhite ? to.row + 1 : to.row - 1;
    board[capturedRow][to.col] = '';
  }

  if (to.type === 'castle-king') {
    board[from.row][5] = board[from.row][7];
    board[from.row][7] = '';
  } else if (to.type === 'castle-queen') {
    board[from.row][3] = board[from.row][0];
    board[from.row][0] = '';
  }

  board[to.row][to.col] = piece;
  board[from.row][from.col] = '';

  if (type === 'p' && Math.abs(to.row - from.row) === 2) {
    gameState.enPassantTarget = { row: (from.row + to.row) / 2, col: from.col };
  } else {
    gameState.enPassantTarget = null;
  }

  if (type === 'k') {
    if (isWhite) { castlingRights.whiteKingSide = false; castlingRights.whiteQueenSide = false; }
    else { castlingRights.blackKingSide = false; castlingRights.blackQueenSide = false; }
  }
  if (type === 'r') {
    if (from.row === 7 && from.col === 0) castlingRights.whiteQueenSide = false;
    if (from.row === 7 && from.col === 7) castlingRights.whiteKingSide = false;
    if (from.row === 0 && from.col === 0) castlingRights.blackQueenSide = false;
    if (from.row === 0 && from.col === 7) castlingRights.blackKingSide = false;
  }
  if (to.row === 7 && to.col === 0) castlingRights.whiteQueenSide = false;
  if (to.row === 7 && to.col === 7) castlingRights.whiteKingSide = false;
  if (to.row === 0 && to.col === 0) castlingRights.blackQueenSide = false;
  if (to.row === 0 && to.col === 7) castlingRights.blackKingSide = false;
};

export const needsPromotion = (board, to) => {
  const piece = board[to.row][to.col];
  if (!piece || piece.toLowerCase() !== 'p') return false;
  return to.row === 0 || to.row === 7;
};

export const promotePawn = (board, pos, promoteTo) => {
  const piece = board[pos.row][pos.col];
  const isWhite = piece === piece.toUpperCase();
  board[pos.row][pos.col] = isWhite ? promoteTo.toUpperCase() : promoteTo.toLowerCase();
};

export const getAllMoves = (gameState, isWhite) => {
  const moves = [];
  const testState = { ...gameState, turn: isWhite ? 'white' : 'black' };
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = gameState.board[r][c];
      if (p && p !== '' && (p === p.toUpperCase()) === isWhite) {
        const pieceMoves = getValidMoves(testState, { row: r, col: c });
        pieceMoves.forEach(to => moves.push({ from: { row: r, col: c }, to }));
      }
    }
  }
  return moves;
};

export const getGameStatus = (gameState) => {
  const isWhiteTurn = gameState.turn === 'white';
  const moves = getAllMoves(gameState, isWhiteTurn);
  if (moves.length === 0) {
    if (isInCheck(gameState.board, isWhiteTurn)) {
      return { over: true, result: 'checkmate', winner: isWhiteTurn ? 'black' : 'white' };
    }
    return { over: true, result: 'stalemate', winner: null };
  }
  return { over: false };
};

export const posToNotation = (pos) => String.fromCharCode(97 + pos.col) + (8 - pos.row);

export const moveToNotation = (gameState, from, to) => {
  const { board } = gameState;
  const piece = board[from.row][from.col];
  const p = piece.toUpperCase();
  if (to.type === 'castle-king') return 'O-O';
  if (to.type === 'castle-queen') return 'O-O-O';
  const capture = (board[to.row][to.col] && board[to.row][to.col] !== '') || to.type === 'enpassant' ? 'x' : '';
  const dest = posToNotation(to);
  if (p === 'P') return capture ? posToNotation(from)[0] + 'x' + dest : dest;
  return p + capture + dest;
};

export const evaluateBoard = (board) => {
  const pieceValues = { p: 1, n: 3, b: 3.2, r: 5, q: 9, k: 0 };
  const pawnTable = [[0,0,0,0,0,0,0,0],[.5,.5,.5,.5,.5,.5,.5,.5],[.1,.1,.2,.3,.3,.2,.1,.1],[.05,.05,.1,.25,.25,.1,.05,.05],[0,0,0,.2,.2,0,0,0],[.05,-.05,-.1,0,0,-.1,-.05,.05],[.05,.1,.1,-.2,-.2,.1,.1,.05],[0,0,0,0,0,0,0,0]];
  const knightTable = [[-.5,-.4,-.3,-.3,-.3,-.3,-.4,-.5],[-.4,-.2,0,0,0,0,-.2,-.4],[-.3,0,.1,.15,.15,.1,0,-.3],[-.3,.05,.15,.2,.2,.15,.05,-.3],[-.3,0,.15,.2,.2,.15,0,-.3],[-.3,.05,.1,.15,.15,.1,.05,-.3],[-.4,-.2,0,.05,.05,0,-.2,-.4],[-.5,-.4,-.3,-.3,-.3,-.3,-.4,-.5]];
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c];
      if (!p || p === '') continue;
      const isWhite = p === p.toUpperCase();
      const type = p.toLowerCase();
      let value = pieceValues[type] || 0;
      if (type === 'p') value += isWhite ? pawnTable[r][c] : pawnTable[7-r][c];
      else if (type === 'n') value += isWhite ? knightTable[r][c] : knightTable[7-r][c];
      else value += (3.5 - Math.abs(3.5 - c)) * 0.05 + (3.5 - Math.abs(3.5 - r)) * 0.05;
      score += isWhite ? value : -value;
    }
  }
  return score;
};

export const minimax = (gameState, depth, alpha, beta, isMaximizing) => {
  if (depth === 0) return evaluateBoard(gameState.board);
  const moves = getAllMoves(gameState, isMaximizing);
  if (moves.length === 0) {
    if (isInCheck(gameState.board, isMaximizing)) return isMaximizing ? -1000 : 1000;
    return 0;
  }
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const newState = cloneGameState(gameState);
      applyMoveToBoard(newState, move.from, move.to);
      newState.turn = 'black';
      const evalScore = minimax(newState, depth - 1, alpha, beta, false);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const newState = cloneGameState(gameState);
      applyMoveToBoard(newState, move.from, move.to);
      newState.turn = 'white';
      const evalScore = minimax(newState, depth - 1, alpha, beta, true);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
};

export const getAIMove = (gameState, difficulty) => {
  const depths = { easy: 1, medium: 2, hard: 3 };
  const depth = depths[difficulty] || 2;
  const isWhite = gameState.turn === 'white';
  const moves = getAllMoves(gameState, isWhite);
  if (moves.length === 0) return null;
  if (difficulty === 'easy' && Math.random() < 0.3) return moves[Math.floor(Math.random() * moves.length)];
  let bestMove = moves[0];
  let bestEval = isWhite ? -Infinity : Infinity;
  for (const move of moves) {
    const newState = cloneGameState(gameState);
    applyMoveToBoard(newState, move.from, move.to);
    newState.turn = isWhite ? 'black' : 'white';
    const evalScore = minimax(newState, depth - 1, -Infinity, Infinity, !isWhite);
    if ((isWhite && evalScore > bestEval) || (!isWhite && evalScore < bestEval)) {
      bestEval = evalScore;
      bestMove = move;
    }
  }
  return bestMove;
};