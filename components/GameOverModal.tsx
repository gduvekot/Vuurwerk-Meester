import React, { useEffect, useState } from 'react';
import { ScoreStats, JudgeResult } from '../types';

interface GameOverModalProps {
  stats: ScoreStats;
  onRestart: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ stats, onRestart }) => {
  const [judgeResult, setJudgeResult] = useState<JudgeResult | null>(null);
  const [loading, setLoading] = useState(true);

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl max-w-md w-full p-8 shadow-2xl transform transition-all animate-in fade-in zoom-in duration-300">
        <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-yellow-500 text-center mb-2">
          SHOW AFGELOPEN
        </h2>
        
        <div className="grid grid-cols-2 gap-4 mb-6 text-slate-200">
          <div className="bg-slate-800 p-3 rounded-lg text-center">
            <div className="text-sm text-slate-400">Score</div>
            <div className="text-2xl font-bold">{stats.score}</div>
          </div>
          <div className="bg-slate-800 p-3 rounded-lg text-center">
            <div className="text-sm text-slate-400">Max Combo</div>
            <div className="text-2xl font-bold text-yellow-400">{stats.maxCombo}</div>
          </div>
          <div className="bg-slate-800 p-3 rounded-lg text-center">
            <div className="text-sm text-slate-400">Perfect</div>
            <div className="text-2xl font-bold text-green-400">{stats.perfects}</div>
          </div>
          <div className="bg-slate-800 p-3 rounded-lg text-center">
            <div className="text-sm text-slate-400">Nauwkeurigheid</div>
            <div className="text-2xl font-bold">
              {stats.hits + stats.misses > 0 
                ? Math.round((stats.hits / (stats.hits + stats.misses)) * 100) 
                : 0}%
            </div>
          </div>
        </div>
        <button 
          onClick={onRestart}
          className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg transform transition active:scale-95 text-lg"
        >
          Nog een Show!
        </button>
      </div>
    </div>
  );
};

export default GameOverModal;