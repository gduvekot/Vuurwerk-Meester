import React, { useState, useEffect } from 'react';
import { LeaderboardEntry } from '../types';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  playerRank?: number;
  onBack: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ entries, playerRank, onBack }) => {
  const [animatedIndex, setAnimatedIndex] = useState<number | null>(null);

  useEffect(() => {
    // Trigger animation for player rank when component mounts
    if (playerRank !== undefined) {
      setTimeout(() => setAnimatedIndex(playerRank), 200);
    }
  }, [playerRank]);

  const sortedEntries = [...entries].sort((a, b) => b.score - a.score).slice(0, 20);

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border-2 border-purple-500 rounded-2xl max-w-2xl w-full shadow-2xl transform transition-all animate-in fade-in duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-t-2xl">
          <h2 className="text-4xl font-black text-white text-center drop-shadow-lg">
            🏆 LEADERBOARD 🏆
          </h2>
          <p className="text-white/80 text-center mt-2 text-sm">Top scores van alle shows</p>
        </div>

        {/* Leaderboard List */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {sortedEntries.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <p className="text-lg">Nog geen scores opgeslagen</p>
              <p className="text-sm mt-2">Speel een show en voer je naam in!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedEntries.map((entry, index) => {
                const isAnimated = animatedIndex === index;
                const isPlayer = playerRank === index;

                return (
                  <div
                    key={entry.id}
                    className={`transform transition-all duration-500 ${
                      isAnimated
                        ? 'scale-100 opacity-100'
                        : 'scale-95 opacity-75'
                    } ${
                      isPlayer
                        ? 'bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border-2 border-yellow-400 shadow-lg'
                        : 'bg-slate-800/50 border border-slate-700'
                    } p-4 rounded-lg flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="font-black text-white text-lg">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold truncate ${isPlayer ? 'text-yellow-300' : 'text-white'}`}>
                          {entry.name}
                          {isPlayer && ' (JIJ!)'}
                        </p>
                        <div className="flex gap-3 text-xs text-slate-400 mt-1">
                          <span>⚡ {entry.maxCombo} combo</span>
                          <span>⭐ {entry.perfects} perfects</span>
                          <span>🎯 {entry.accuracy}%</span>
                        </div>
                      </div>
                    </div>
                    <div className={`text-right flex-shrink-0 ${isPlayer ? 'text-yellow-300' : 'text-white'}`}>
                      <p className="text-2xl font-black">{entry.score.toLocaleString()}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(entry.timestamp).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-800/50 p-4 rounded-b-2xl border-t border-slate-700 flex gap-2 items-center">
          <button
            onClick={() => {
              try {
                const json = JSON.stringify(entries);
                navigator.clipboard.writeText(json);
                alert('Leaderboard gekopieerd naar klembord');
              } catch (e) {
                alert('Kopiëren mislukt');
              }
            }}
            className="px-4 py-2 bg-indigo-600 rounded-md text-white"
          >
            Kopieer
          </button>

          <button
            onClick={() => {
              if ((navigator as any).share) {
                (navigator as any).share({
                  title: 'Leaderboard',
                  text: 'Bekijk mijn scores!',
                }).catch(() => {});
              } else {
                alert('Delen niet ondersteund op dit apparaat');
              }
            }}
            className="px-4 py-2 bg-emerald-600 rounded-md text-white"
          >
            Deel
          </button>

          <div className="flex-1" />

          <button
            onClick={onBack}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold px-4 py-2 rounded-lg shadow-lg transform transition active:scale-95"
          >
            Terug naar Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
