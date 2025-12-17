import React, { useRef } from 'react';
import { Achievement } from '../types';

interface Props {
  onClose: () => void;
  onReset: () => void;
  onExport: () => void;
  onImport: (data: string) => void;
  achievements: Achievement[];
}

const AdvancedModal: React.FC<Props> = ({ onClose, onReset, onExport, onImport, achievements }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleImport = () => {
    const el = inputRef.current;
    if (!el || !el.files || el.files.length === 0) return;
    const file = el.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') onImport(reader.result);
    };
    reader.readAsText(file);
  };

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-bold text-white">Geavanceerd</h3>
          <button onClick={onClose} className="text-slate-300 hover:text-white">Sluiten</button>
        </div>

        <div className="space-y-4 text-slate-200">
          <div>
            <button onClick={onReset} className="px-4 py-2 bg-red-600 rounded-md text-white">Reset alle data</button>
          </div>

          <div>
            <button onClick={onExport} className="px-4 py-2 bg-blue-600 rounded-md text-white mr-2">Exporteer Leaderboard & Achievements</button>
            <input ref={inputRef} type="file" accept="application/json" className="text-sm text-slate-400" />
            <button onClick={handleImport} className="px-3 py-2 bg-emerald-600 rounded-md text-white ml-2">Importeer</button>
          </div>

          <div>
            <div className="text-sm text-slate-300">Achievements opgeslagen: {achievements.length}</div>
          </div>

        </div>

        <div className="mt-4 text-right">
          <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white">Sluiten</button>
        </div>
      </div>
    </div>
  );
};

export default AdvancedModal;
