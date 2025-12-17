import React from 'react';
import { PIECES } from '../utils/chessLogic';

const PromotionModal = ({ isWhite, onSelect }) => {
  const pieces = isWhite ? ['Q', 'R', 'B', 'N'] : ['q', 'r', 'b', 'n'];

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 shadow-2xl">
        <h3 className="text-lg font-bold mb-4 text-center">Promote Pawn</h3>
        <div className="flex gap-2">
          {pieces.map(piece => (
            <button
              key={piece}
              onClick={() => onSelect(piece.toLowerCase())}
              className="w-16 h-16 flex items-center justify-center text-5xl bg-amber-200 hover:bg-amber-300 rounded-lg transition"
              style={{
                textShadow: isWhite 
                  ? '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000'
                  : '1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff'
              }}
            >
              <span className={isWhite ? 'text-white' : 'text-gray-900'}>
                {PIECES[piece]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PromotionModal;