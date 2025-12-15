import React, { useState, useEffect, useRef } from 'react';
import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import GameOverModal from './components/GameOverModal';
import { GameState, ScoreStats } from './types';
import { GAME_DURATION_MS, COMBO_MULTIPLIER_STEP } from './constants';
import { audioManager } from './utils/audio';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_MS / 1000);
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

  const startGame = () => {
    // Reset Stats
    setStats({
      score: 0,
      combo: 0,
      maxCombo: 0,
      hits: 0,
      misses: 0,
      perfects: 0
    });
    setTimeLeft(GAME_DURATION_MS / 1000);
    
    // Resume Audio Context (needs user gesture which this click provides)
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
    if (gameState === GameState.PLAYING) {
      const startTime = Date.now();
      timerRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, (GAME_DURATION_MS - elapsed) / 1000);
        setTimeLeft(remaining);
        
        if (remaining <= 0) {
          endGame();
        }
      }, 100);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState]);

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
      />

      {gameState === GameState.MENU && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-50 backdrop-blur-sm">
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-red-500 via-yellow-500 to-purple-600 mb-8 drop-shadow-2xl">
            Vuurwerk<br/>Meester
          </h1>
          <p className="text-slate-300 mb-8 text-center max-w-md leading-relaxed text-lg">
            Luister naar de beat! 🎵
            <br/>
            Wacht tot de vuurpijl op de maat zijn hoogste punt bereikt en druk op <strong>SPATIE</strong>.
          </p>
          <button 
            onClick={startGame}
            className="px-12 py-4 bg-gradient-to-r from-pink-500 to-violet-600 rounded-full text-white font-bold text-2xl hover:scale-105 transition-transform shadow-[0_0_30px_rgba(168,85,247,0.5)] animate-pulse"
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