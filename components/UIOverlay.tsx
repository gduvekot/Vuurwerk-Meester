import React from 'react';
import { ScoreStats } from '../types';

interface UIOverlayProps {
  stats: ScoreStats;
  timeLeft: number;
  lastFeedback: string | null;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ stats, timeLeft, lastFeedback }) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-6 flex flex-col justify-between">
      {/* Top Bar */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <div className="text-white text-4xl font-bold drop-shadow-lg font-mono">
            {stats.score.toLocaleString()}
          </div>
          <div className="text-pink-400 text-xl font-bold drop-shadow-md">
            x{stats.combo} COMBO
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className={`text-4xl font-bold font-mono drop-shadow-lg ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            {Math.ceil(timeLeft)}s
          </div>
          <div className="text-slate-400 text-sm font-semibold">
            TIJD
          </div>
        </div>
      </div>

      {/* Center Feedback */}
      <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
         {lastFeedback && (
             <div className="text-4xl md:text-6xl font-black text-white italic drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] animate-bounce tracking-wider">
                 {lastFeedback}
             </div>
         )}
      </div>

      {/* Bottom Hints */}
      <div className="text-center text-white/50 text-sm mb-4">
        Tik of druk op SPATIE op het hoogste punt!
      </div>
    </div>
  );
};

export default UIOverlay;