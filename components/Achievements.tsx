import React from 'react';
import { Achievement } from '../types';

interface Props {
  achievements: Achievement[];
  onClose: () => void;
}

const Achievements: React.FC<Props> = ({ achievements, onClose }) => {
  const handleReset = () => {
    if (confirm('Weet je zeker dat je alle achievements wilt resetten?')) {
      // lazy import to avoid circular
      const mod = require('../utils/achievements');
      if (mod.resetAchievementsAndMeta) mod.resetAchievementsAndMeta();
      else {
        if (mod.resetAchievements) mod.resetAchievements();
        try { localStorage.removeItem('vuurwerk-achievements-meta'); } catch(e) {}
      }
      window.location.reload();
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-50 backdrop-blur-sm pointer-events-auto" style={{ zIndex: 60 }}>
      <div className="w-11/12 max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-3xl font-bold text-white">Achievements</h2>
          <div className="flex items-center gap-3">
            <button onClick={handleReset} className="text-red-400 hover:text-red-300">Reset</button>
            <button onClick={onClose} className="text-slate-300 hover:text-white">Sluiten</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] overflow-auto pr-2">
          {achievements.map(a => (
            <div key={a.key} className={`p-3 rounded-lg flex items-start gap-3 transition ${a.unlocked ? 'bg-emerald-800/20 border border-emerald-500' : 'bg-slate-800/40 border border-slate-700'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${a.unlocked ? 'bg-emerald-500 text-slate-900' : 'bg-slate-700 text-slate-300'}`}>
                {a.unlocked ? '★' : '☆'}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-white font-semibold">{a.title}</div>
                    <div className="text-slate-300 text-sm">{a.description}</div>
                    {a.goal && !a.unlocked && (
                      <div className="mt-2">
                        <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div className="bg-emerald-500 h-2" style={{ width: `${Math.round(((a.progress||0)/(a.goal||1))*100)}%` }} />
                        </div>
                        <div className="text-slate-400 text-xs mt-1">{(a.progress||0)}/{a.goal}</div>
                      </div>
                    )}
                  </div>
                  <div className="text-slate-400 text-xs text-right">
                    {a.unlocked && a.unlockedAt ? new Date(a.unlockedAt).toLocaleDateString() : 'Locked'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 text-right">
          <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white">Terug</button>
        </div>
      </div>
    </div>
  );
};

export default Achievements;
