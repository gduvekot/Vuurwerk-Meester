import React, { useState } from 'react';

interface Props {
  onClose: () => void;
}

const steps = [
  {
    title: 'Welkom bij Scalda Spark',
    text: 'Luister naar de beat en druk op SPATIE op het hoogste punt van de vuurpijl.'
  },
  {
    title: 'Score en Combo',
    text: 'Perfecte timing geeft meer punten en verhoogt je combo. Misses breken je combo.'
  },
  {
    title: 'Kleuren en effecten',
    text: 'Je kunt kleuren kiezen in het menu. Probeer verschillende combinaties!' 
  },
  {
    title: 'Oefenen',
    text: 'Gebruik de Oefenmodus om zonder timer te trainen en het ritme te leren.'
  }
];

const TutorialModal: React.FC<Props> = ({ onClose }) => {
  const [index, setIndex] = useState(0);
  const step = steps[index];

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <h3 className="text-2xl font-bold text-white mb-2">{step.title}</h3>
        <p className="text-slate-300 mb-4">{step.text}</p>

        <div className="flex justify-between">
          <div>
            <button
              onClick={() => setIndex(Math.max(0, index - 1))}
              disabled={index === 0}
              className="px-3 py-2 bg-slate-700 rounded-md text-white mr-2 disabled:opacity-50"
            >
              Vorige
            </button>
            <button
              onClick={() => setIndex(Math.min(steps.length - 1, index + 1))}
              disabled={index === steps.length - 1}
              className="px-3 py-2 bg-slate-700 rounded-md text-white disabled:opacity-50"
            >
              Volgende
            </button>
          </div>

          <div>
            <button onClick={onClose} className="px-4 py-2 bg-emerald-600 rounded-md text-white">Sluiten</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;
