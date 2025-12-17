import React, { useState } from 'react';
import { PIECES } from '../utils/chessLogic';

const ChessBoard = ({ 
  board, 
  onMove, 
  selectedSquare, 
  validMoves = [], 
  highlights = [],
  inCheck = null,
  lastMove = null,
  interactive = true, 
  flipped = false 
}) => {
  const [dragPiece, setDragPiece] = useState(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });

  const getSquareColor = (r, c) => {
    if (lastMove && ((lastMove.from.row === r && lastMove.from.col === c) ||
        (lastMove.to.row === r && lastMove.to.col === c))) {
      return 'bg-yellow-300';
    }
    return (r + c) % 2 === 0 ? 'bg-amber-200' : 'bg-amber-600';
  };

  const isValidTarget = (r, c) => validMoves?.some(m => m.row === r && m.col === c);
  const isSelected = (r, c) => selectedSquare?.row === r && selectedSquare?.col === c;
  const isKingInCheck = (r, c) => inCheck?.row === r && inCheck?.col === c;
  const isHighlighted = (r, c) => highlights?.some(h => h.row === r && h.col === c);

  const handleDragStart = (e, r, c) => {
    if (!interactive || !board[r][c]) return;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ row: r, col: c }));
    setDragPiece({ row: r, col: c });
    onMove?.(r, c, 'select');
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDrag = (e) => {
    if (e.clientX === 0 && e.clientY === 0) return;
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  const handleDragEnd = () => setDragPiece(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, r, c) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('text/plain');
    if (data) {
      const from = JSON.parse(data);
      onMove?.(r, c, 'drop', from);
    }
    setDragPiece(null);
  };

  const handleClick = (r, c) => {
    if (!interactive) return;
    onMove?.(r, c, 'click');
  };

  const renderPiece = (piece, r, c) => {
    if (!piece) return null;
    const isWhitePiece = piece === piece.toUpperCase();
    const isDragging = dragPiece?.row === r && dragPiece?.col === c;

    return (
      <span
        draggable={interactive}
        onDragStart={(e) => handleDragStart(e, r, c)}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className={`text-3xl sm:text-4xl select-none cursor-grab active:cursor-grabbing transition-opacity
          ${isDragging ? 'opacity-30' : 'opacity-100'}
          ${isWhitePiece 
            ? 'text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]' 
            : 'text-gray-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]'
          }`}
        style={{
          textShadow: isWhitePiece 
            ? '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 2px 2px 3px rgba(0,0,0,0.5)'
            : '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff'
        }}
      >
        {PIECES[piece]}
      </span>
    );
  };

  const renderBoard = () => {
    const rows = flipped ? [...Array(8)].map((_, i) => 7 - i) : [...Array(8)].map((_, i) => i);
    const cols = flipped ? [...Array(8)].map((_, i) => 7 - i) : [...Array(8)].map((_, i) => i);

    return rows.map(r => (
      <div key={r} className="flex">
        {cols.map(c => {
          const piece = board[r][c];
          return (
            <div
              key={c}
              onClick={() => handleClick(r, c)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, r, c)}
              className={`w-11 h-11 sm:w-14 sm:h-14 flex items-center justify-center relative
                ${getSquareColor(r, c)}
                ${isSelected(r, c) ? 'ring-4 ring-blue-500 ring-inset' : ''}
                ${isHighlighted(r, c) ? 'ring-4 ring-green-400 ring-inset' : ''}
                ${isKingInCheck(r, c) ? 'bg-red-500 ring-4 ring-red-600 ring-inset animate-pulse' : ''}
                ${interactive ? 'hover:brightness-110 cursor-pointer' : ''}
              `}
            >
              {isValidTarget(r, c) && (
                <div className={`absolute ${board[r][c] 
                  ? 'inset-1 ring-4 ring-inset ring-red-400 rounded-full' 
                  : 'w-4 h-4 rounded-full bg-blue-500/60'}`} 
                />
              )}
              {renderPiece(piece, r, c)}
              {c === (flipped ? 7 : 0) && (
                <span className="absolute left-0.5 top-0.5 text-xs font-bold opacity-60 pointer-events-none">
                  {8 - r}
                </span>
              )}
              {r === (flipped ? 0 : 7) && (
                <span className="absolute right-0.5 bottom-0.5 text-xs font-bold opacity-60 pointer-events-none">
                  {String.fromCharCode(97 + c)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    ));
  };

  return (
    <div className="relative">
      <div className="inline-block border-4 border-amber-900 rounded-lg shadow-2xl">
        {renderBoard()}
      </div>
      {dragPiece && dragPos.x > 0 && (
        <div 
          className="fixed pointer-events-none z-50 text-4xl sm:text-5xl"
          style={{ left: dragPos.x - 24, top: dragPos.y - 24 }}
        >
          <span 
            className={board[dragPiece.row][dragPiece.col] === board[dragPiece.row][dragPiece.col].toUpperCase()
              ? 'text-white' : 'text-gray-900'}
            style={{
              textShadow: board[dragPiece.row][dragPiece.col] === board[dragPiece.row][dragPiece.col].toUpperCase()
                ? '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000'
                : '2px 2px 0 #fff, -2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff'
            }}
          >
            {PIECES[board[dragPiece.row][dragPiece.col]]}
          </span>
        </div>
      )}
    </div>
  );
};

export default ChessBoard;