// File: client/src/components/ChessTimer.js

import React from 'react';
import { Clock } from 'lucide-react';

const ChessTimer = ({ 
  whiteTime, 
  blackTime, 
  activePlayer, 
  gameOver,
  orientation = 'vertical' // 'vertical' or 'horizontal'
}) => {
  
  const formatTime = (seconds) => {
    if (seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerStyle = (player) => {
    const isActive = activePlayer === player && !gameOver;
    const time = player === 'white' ? whiteTime : blackTime;
    const isLow = time <= 30; // Less than 30 seconds
    const isCritical = time <= 10; // Less than 10 seconds
    
    let bgColor = 'bg-slate-700';
    let textColor = 'text-white';
    let borderColor = 'border-slate-600';
    
    if (isActive) {
      if (isCritical) {
        bgColor = 'bg-red-600 animate-pulse';
        borderColor = 'border-red-400';
      } else if (isLow) {
        bgColor = 'bg-orange-600';
        borderColor = 'border-orange-400';
      } else {
        bgColor = player === 'white' ? 'bg-white' : 'bg-slate-800';
        textColor = player === 'white' ? 'text-slate-900' : 'text-white';
        borderColor = 'border-green-500';
      }
    } else {
      bgColor = player === 'white' ? 'bg-slate-200' : 'bg-slate-700';
      textColor = player === 'white' ? 'text-slate-600' : 'text-slate-400';
    }
    
    return `${bgColor} ${textColor} ${borderColor}`;
  };

  const TimerBox = ({ player, time, label }) => (
    <div className={`rounded-lg border-2 p-3 transition-all duration-300 ${getTimerStyle(player)}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-full ${player === 'white' ? 'bg-white border border-slate-400' : 'bg-slate-900'}`} />
          <span className="font-medium text-sm">{label}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock size={16} className="opacity-70" />
          <span className="font-mono text-xl font-bold min-w-[60px] text-right">
            {formatTime(time)}
          </span>
        </div>
      </div>
    </div>
  );

  if (orientation === 'horizontal') {
    return (
      <div className="flex gap-4 justify-center">
        <TimerBox player="white" time={whiteTime} label="White" />
        <TimerBox player="black" time={blackTime} label="Black" />
      </div>
    );
  }

  // Vertical orientation (default) - black on top, white on bottom
  return (
    <div className="flex flex-col gap-2 min-w-[160px]">
      <TimerBox player="black" time={blackTime} label="Black" />
      <div className="flex-1" /> {/* Spacer */}
      <TimerBox player="white" time={whiteTime} label="White" />
    </div>
  );
};

export default ChessTimer;