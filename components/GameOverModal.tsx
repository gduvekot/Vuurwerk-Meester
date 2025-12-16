import React, { useEffect, useState } from 'react';
import { ScoreStats, JudgeResult } from '../types';

interface GameOverModalProps {
  stats: ScoreStats;
  onRestart: () => void;
  onViewLeaderboard: (name: string) => void;
  onBackToMenu: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({ stats, onRestart, onViewLeaderboard, onBackToMenu }) => {
  const [judgeResult, setJudgeResult] = useState<JudgeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  const accuracy = stats.hits + stats.misses > 0 
    ? Math.round((stats.hits / (stats.hits + stats.misses)) * 100) 
    : 0;

  const handleSaveScore = () => {
    if (playerName.trim()) {
      onViewLeaderboard(playerName);
      setShowNameInput(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveScore();
    }
  };

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
              {accuracy}%
            </div>
          </div>
        </div>

        {!showNameInput ? (
          <div className="space-y-3">
            <button 
              onClick={() => setShowNameInput(true)}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg transform transition active:scale-95 text-lg"
            >
              📊 Naar Leaderboard
            </button>
            <button 
              onClick={onRestart}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3 rounded-xl shadow-lg transform transition active:scale-95"
            >
              Nog een Show!
            </button>
            <button 
              onClick={onBackToMenu}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl shadow-lg transform transition active:scale-95"
            >
              🏠 Menu
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Voer je naam in:
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Bijvoorbeeld: PyroBoss"
                maxLength={20}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowNameInput(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-lg transition"
              >
                Terug
              </button>
              <button
                onClick={handleSaveScore}
                disabled={!playerName.trim()}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-slate-600 disabled:to-slate-600 disabled:opacity-50 text-white font-bold py-2 rounded-lg transform transition active:scale-95"
              >
                Opslaan 🎉
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameOverModal;