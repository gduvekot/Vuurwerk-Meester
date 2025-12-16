import React, { useState, useEffect, useRef } from 'react';

// GEWIJZIGDE IMPORTS: Alle constanten die we nodig hebben
import {
  FIREWORK_COLORS,
  GAME_DURATION_MS,
  COMBO_MULTIPLIER_STEP,
  BASE_LAUNCH_INTERVAL_MS,
  LAUNCH_MODIFIERS,
  Difficulty
} from './constants';

import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import GameOverModal from './components/GameOverModal';
import { GameState, ScoreStats } from './types';
import { audioManager } from './utils/audio';
audioManager.loadTrack('./audio/song.mp3')
const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_MS / 1000);
  const [paused, setPausedState] = useState(false);
  const startTimeRef = useRef<number>(0);
  const [stats, setStats] = useState<ScoreStats>({
    score: 0,
    combo: 0,
    maxCombo: 0,
    hits: 0,
    misses: 0,
    perfects: 0
  });
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);

  const [selectedColors, setSelectedColors] = useState<string[]>([
    '#ef4444',
    '#f97316',
    '#eab308',
    '#22c55e'
  ]);
  const [customColor, setCustomColor] = useState('#ff0000');

  // NIEUWE STATEN voor moeilijkheidsgraad en snelheid
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(Difficulty.NORMAL);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0); // Dynamische versneller

  // Ref voor de gekozen basisinterval
  const baseGameIntervalRef = useRef(BASE_LAUNCH_INTERVAL_MS);


  const startGame = () => {
    // 1. Bepaal de basis lanceerinterval op basis van moeilijkheidsgraad
    const initialInterval = BASE_LAUNCH_INTERVAL_MS * LAUNCH_MODIFIERS[selectedDifficulty];
    baseGameIntervalRef.current = initialInterval; // Sla op voor GameCanvas
    setSpeedMultiplier(1.0); // Reset de dynamische versneller

    setStats({
      score: 0,
      combo: 0,
      maxCombo: 0,
      hits: 0,
      misses: 0,
      perfects: 0
    });
    setTimeLeft(GAME_DURATION_MS / 1000);

    audioManager.resume();
    audioManager.start();

    setGameState(GameState.PLAYING);
  };

  const endGame = () => {
    setGameState(GameState.GAME_OVER);
    audioManager.stop();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    // FUNCTIE: Berekent de dynamische versneller (agressiever in de laatste 15s)
    const calculateSpeedMultiplier = (remainingTimeSeconds: number): number => {
      if (remainingTimeSeconds > 15) {
        return 1.0;  // Normale snelheid
      } else if (remainingTimeSeconds > 10) {
        return 1.35; // Versnelling 1 (35% sneller)
      } else if (remainingTimeSeconds > 5) {
        return 1.8;  // Versnelling 2 (80% sneller)
      } else if (remainingTimeSeconds > 0) {
        return 2.5;  // Versnelling 3 (150% sneller - CHAOS!)
      }
      return 1.0;
    };

    // Start or stop the timer depending on gameState and paused
    if (gameState === GameState.PLAYING && !paused) {
      // calculate startTime so remaining continues from current `timeLeft`
      startTimeRef.current = Date.now() - Math.round((GAME_DURATION_MS - timeLeft * 1000));
      timerRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, (GAME_DURATION_MS - elapsed) / 1000);
        setTimeLeft(remaining);

        // Pas dynamische snelheidsaanpassing toe
        const newMultiplier = calculateSpeedMultiplier(remaining);
        if (newMultiplier !== speedMultiplier) {
          setSpeedMultiplier(newMultiplier);
        }
        if (remaining <= 0) {
          endGame();
        }
      }, 100);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };

  }, [gameState, paused, timeLeft, endGame, speedMultiplier]); // speedMultiplier is toegevoegd als dependency

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && gameState === GameState.PLAYING) {
        setPausedState(!paused);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [paused, gameState]);

  const handleScoreUpdate = (points: number, accuracy: 'perfect' | 'good' | 'miss' | 'wet') => {
    setStats(prev => {
      let newCombo = prev.combo;
      let newScore = prev.score;
      let newHits = prev.hits;
      let newMisses = prev.misses;
      let newPerfects = prev.perfects;

      if (accuracy === 'miss' || accuracy === 'wet') {
        newCombo = 0;
        newMisses++;
        showFeedback(accuracy === 'wet' ? 'TE LAAT!' : 'TE VROEG!');
      } else {
        newCombo++;
        newHits++;
        if (accuracy === 'perfect') {
          newPerfects++;
          showFeedback('PERFECT!');
        } else {
          showFeedback('GOED!');
        }

        const multiplier = 1 + (newCombo * COMBO_MULTIPLIER_STEP);
        newScore += Math.round(points * multiplier);
      }

      return {
        score: newScore,
        combo: newCombo,
        maxCombo: Math.max(prev.maxCombo, newCombo),
        hits: newHits,
        misses: newMisses,
        perfects: newPerfects
      };
    });
  };

  const showFeedback = (text: string) => {
    setLastFeedback(text);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = window.setTimeout(() => {
      setLastFeedback(null);
    }, 800);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900 select-none">
      <GameCanvas
        gameState={gameState}
        onScoreUpdate={handleScoreUpdate}
        onGameOver={endGame}
        colors={selectedColors}
        timeLeft={timeLeft}
        paused={paused}
        // DE NIEUWE PROPS!
        baseLaunchInterval={baseGameIntervalRef.current}
        speedMultiplier={speedMultiplier}
        selectedDifficulty={selectedDifficulty}
      />

      {gameState === GameState.MENU && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-50 backdrop-blur-sm">

          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-red-500 via-yellow-500 to-purple-600 mb-8 drop-shadow-2xl">
            Scalda Spark
          </h1>

          <p className="text-slate-300 mb-6 text-center max-w-md leading-relaxed text-lg">
            Luister naar de beat! 🎵
            <br />
            Wacht tot de vuurpijl op de maat zijn hoogste punt bereikt en druk op{' '}
            <strong>SPATIE</strong>.
          </p>

          {/* 🎯 Selectie moeilijkheidsgraad (NIEUW) */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <p className="text-slate-300 font-semibold">
              Kies moeilijkheidsgraad
            </p>

            <div className="flex gap-4 mt-3">
              {Object.values(Difficulty).map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDifficulty(d)}
                  className={`px-4 py-2 rounded-lg font-semibold transition
                    ${selectedDifficulty === d
                      ? 'bg-violet-600 text-white shadow-lg'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* 🎨 KLEURKEUZE */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <p className="text-slate-300 font-semibold">
              Kies je vuurwerkkleuren
            </p>

            <div className="flex gap-2 flex-wrap justify-center mt-3">
              {selectedColors.map(color => (
                <button
                  key={color}
                  onClick={() =>
                    setSelectedColors(prev => prev.filter(c => c !== color))
                  }
                  className="w-8 h-8 rounded-full border-2 border-white opacity-80 hover:scale-110 transition"
                  style={{ backgroundColor: color }}
                  title="Klik om te verwijderen"
                />
              ))}
            </div>

            {selectedColors.length === 0 && (
              <p className="text-red-400 text-sm">
                Kies minimaal één kleur
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 mt-4">
            <input
              type="color"
              value={customColor}
              onChange={e => setCustomColor(e.target.value)}
              className="w-12 h-12 rounded-lg border border-slate-600 cursor-pointer bg-transparent"
            />

            <button
              onClick={() => {
                if (!selectedColors.includes(customColor)) {
                  setSelectedColors(prev => [...prev, customColor]);
                }
              }}
              className="px-4 py-2 rounded-lg bg-slate-700 text-white font-semibold hover:bg-slate-600 transition"
            >
              Voeg kleur toe
            </button>
          </div><br></br>
          <button
            onClick={startGame}
            disabled={selectedColors.length === 0}
            className={`px-12 py-4 rounded-full text-white font-bold text-2xl transition
              ${selectedColors.length === 0
                ? 'bg-slate-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-pink-500 to-violet-600 hover:scale-105 animate-pulse shadow-[0_0_30px_rgba(168,85,247,0.5)]'
              }`}
          >
            START SHOW 🔊
          </button>

        </div>
      )}


      {gameState === GameState.PLAYING && (
        <UIOverlay
          stats={stats}
          timeLeft={timeLeft}
          lastFeedback={lastFeedback}
        />
      )}

      {gameState === GameState.GAME_OVER && (
        <GameOverModal
          stats={stats}
          onRestart={startGame}
        />
      )}
    </div>
  );
};

export default App;