import React from 'react';
import { ScoreStats } from '../types';

interface UIOverlayProps {
  stats: ScoreStats;
  timeLeft: number;
  lastFeedback: string | null;
  paused?: boolean;
  onTogglePause?: (p?: boolean) => void;
  onStop?: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ stats, timeLeft, lastFeedback, paused = false, onTogglePause, onStop }) => {
  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-6 flex flex-col justify-between">
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
        </div>
      </div>
      <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
         {lastFeedback && (
             <div className="text-4xl md:text-6xl font-black text-white italic drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] animate-bounce tracking-wider">
                 {lastFeedback}
             </div>
         )}
      </div>
      {/* Pause button (enabled) */}
      <div className="absolute top-16 right-6 pointer-events-auto z-40">
        <button
          onClick={() => onTogglePause && onTogglePause(true)}
          className="bg-white/10 text-white px-3 py-2 rounded-md hover:bg-white/20 transition drop-shadow-sm"
          aria-label="Pauze"
        >
          Pauze
        </button>
      </div>

      {/* Pause modal */}
      {paused && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-auto z-50">
          <div className="bg-slate-800 p-6 rounded-lg text-center">
            <h3 className="text-2xl text-white font-bold mb-4">Gepauzeerd</h3>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => onTogglePause && onTogglePause(false)}
                className="px-6 py-2 bg-green-600 text-white rounded-md font-semibold hover:bg-green-500 transition"
              >
                Doorgaan
              </button>
              <button
                onClick={() => onStop && onStop()}
                className="px-6 py-2 bg-red-600 text-white rounded-md font-semibold hover:bg-red-500 transition"
              >
                Stoppen
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="text-center text-white/50 text-sm mb-4">
        Tik of druk op SPATIE op het hoogste punt!
      </div>
    </div>
  );
};

export default UIOverlay;