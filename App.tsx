import React, { useState, useEffect, useRef } from 'react';

import {
  FIREWORK_COLORS,
  GAME_DURATION_MS,
  COMBO_MULTIPLIER_STEP,
  BASE_LAUNCH_INTERVAL_MS,
  LAUNCH_MODIFIERS,
  Difficulty,
  updateSongSettings
} from './constants';

import GameCanvas from './components/GameCanvas';
import UIOverlay from './components/UIOverlay';
import GameOverModal from './components/GameOverModal';
import Leaderboard from './components/Leaderboard';
import Achievements from './components/Achievements';
import { getAchievements, evaluateEndOfGame, getMeta } from './utils/achievements';
import { GameState, ScoreStats, LeaderboardEntry } from './types';
import { audioManager } from './utils/audio';

const SONGS = [
  { id: '1', title: 'Progressive House', url: './audio/djruben.mp3', bpm: 132, delay: 400 },
  { id: '2', title: 'Techno', url: './audio/djrubenburn.mp3', bpm: 138, delay: 10 },
  { id: '3', title: 'Progressive House 2', url: './audio/djrubennostalgia.mp3', bpm: 132, delay: 0 }
];

const App: React.FC = () => {
  const [selectedSongUrl, setSelectedSongUrl] = useState<string>(SONGS[0].url);
  const [isLoading, setIsLoading] = useState(false);
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_MS / 1000);
  const [currentBpm, setCurrentBpm] = useState(128);
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
  
  // 🚨 MISS STREAK WARNING
  const [missStreak, setMissStreak] = useState<number>(0);
  const [showWarning, setShowWarning] = useState<boolean>(false);

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerRank, setPlayerRank] = useState<number | undefined>(undefined);
  const [achievements, setAchievements] = useState(() => getAchievements());
  const [showAchievements, setShowAchievements] = useState(false);

  const timerRef = useRef<number | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);

  const [selectedColors, setSelectedColors] = useState<string[]>([
    '#ef4444',
    '#f97316',
    '#eab308',
    '#22c55e'
  ]);
  const [customColor, setCustomColor] = useState('#ff0000');

  // 🎯 MOEILIJKHEIDSGRAAD & SNELHEID
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(Difficulty.NORMAL);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0);
  const baseGameIntervalRef = useRef(BASE_LAUNCH_INTERVAL_MS);

  // Load leaderboard from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('vuurwerk-leaderboard');
    if (saved) {
      try {
        setLeaderboard(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load leaderboard:', e);
      }
    }
  }, []);

  const startGame = async () => {
    const selectedSong = SONGS.find(s => s.url === selectedSongUrl);
    
    // Bepaal de basis lanceerinterval op basis van moeilijkheidsgraad
    const initialInterval = BASE_LAUNCH_INTERVAL_MS * LAUNCH_MODIFIERS[selectedDifficulty];
    baseGameIntervalRef.current = initialInterval;
    setSpeedMultiplier(1.0);

    setStats({
      score: 0,
      combo: 0,
      maxCombo: 0,
      hits: 0,
      misses: 0,
      perfects: 0
    });
    setMissStreak(0);
    setShowWarning(false);

    try {
      console.log(`Laden: ${selectedSong?.title} met ${selectedSong?.bpm} BPM - ${selectedDifficulty}`);
      if (selectedSong) {
        audioManager.setBpm(selectedSong.bpm);
        setCurrentBpm(selectedSong.bpm);
        updateSongSettings(selectedSong.bpm, selectedSong.delay);
        await audioManager.loadTrack(selectedSong.url);
      }
      
      setTimeLeft(GAME_DURATION_MS / 1000);
      audioManager.resume();

      setTimeout(() => {
        audioManager.start();
        setGameState(GameState.PLAYING);
      }, selectedSong?.delay || 0);

    } catch (error) {
      console.error("Fout:", error);
      alert("Kon track niet laden.");
    } finally {
      setIsLoading(false);
    }
  };

  const endGame = () => {
    const completedFullRun = timeLeft <= 0;
    const updated = evaluateEndOfGame(stats, completedFullRun);
    setAchievements(updated);
    setGameState(GameState.GAME_OVER);
    audioManager.stop();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleSaveToLeaderboard = (playerName: string) => {
    const accuracy = stats.hits + stats.misses > 0 
      ? Math.round((stats.hits / (stats.hits + stats.misses)) * 100) 
      : 0;

    const newEntry: LeaderboardEntry = {
      id: `${Date.now()}-${Math.random()}`,
      name: playerName,
      score: stats.score,
      maxCombo: stats.maxCombo,
      perfects: stats.perfects,
      accuracy: accuracy,
      timestamp: Date.now()
    };

    const updatedLeaderboard = [...leaderboard, newEntry];
    setLeaderboard(updatedLeaderboard);
    localStorage.setItem('vuurwerk-leaderboard', JSON.stringify(updatedLeaderboard));

    const sortedByScore = updatedLeaderboard.sort((a, b) => b.score - a.score);
    const rank = sortedByScore.findIndex(e => e.id === newEntry.id);
    setPlayerRank(rank);
    setGameState(GameState.LEADERBOARD);
  };

  const handleBackToMenu = () => {
    setGameState(GameState.MENU);
    setPlayerRank(undefined);
  };

  const handleViewLeaderboard = () => {
    setGameState(GameState.LEADERBOARD);
    setPlayerRank(undefined);
  };

  const handleStopGame = () => {
    setGameState(GameState.GAME_OVER);
    setPausedState(false);
    audioManager.stop();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    // 🚀 PROGRESSIEVE VERSNELLING
    const calculateSpeedMultiplier = (remainingTimeSeconds: number): number => {
      if (remainingTimeSeconds > 15) {
        return 1.0;
      } else if (remainingTimeSeconds > 10) {
        const progress = (15 - remainingTimeSeconds) / 5;
        return 1.0 + (progress * 0.35);
      } else if (remainingTimeSeconds > 5) {
        const progress = (10 - remainingTimeSeconds) / 5;
        return 1.35 + (progress * 0.45);
      } else if (remainingTimeSeconds > 0) {
        const progress = (5 - remainingTimeSeconds) / 5;
        return 1.8 + (progress * 0.7);
      }
      return 1.0;
    };

    if (gameState === GameState.PLAYING && !paused) {
      startTimeRef.current = Date.now() - Math.round((GAME_DURATION_MS - timeLeft * 1000));
      timerRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        const remaining = Math.max(0, (GAME_DURATION_MS - elapsed) / 1000);
        setTimeLeft(remaining);

        const newMultiplier = calculateSpeedMultiplier(remaining);
        if (Math.abs(newMultiplier - speedMultiplier) > 0.01) {
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
  }, [gameState, paused, timeLeft]);

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
        
        // 🚨 MISS STREAK WARNING
        setMissStreak(prev => {
          const newStreak = prev + 1;
          if (newStreak >= 5) {
            setShowWarning(true);
            setTimeout(() => setShowWarning(false), 3000);
            return 0;
          }
          return newStreak;
        });
      } else {
        newCombo++;
        newHits++;
        setMissStreak(0);
        
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
        baseLaunchInterval={baseGameIntervalRef.current}
        speedMultiplier={speedMultiplier}
        selectedDifficulty={selectedDifficulty}
      />

      {/* 🚨 5 MISS WARNING */}
      {showWarning && gameState === GameState.PLAYING && (
        <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-red-600/90 border-4 border-red-400 rounded-2xl px-12 py-8 shadow-2xl animate-bounce">
            <p className="text-white text-4xl font-black text-center mb-2">
              LET OP!
            </p>
            <p className="text-white text-2xl font-bold text-center">
              5x gemist! Je gaat verliezen!
            </p>
          </div>
        </div>
      )}

      {gameState === GameState.MENU && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-40 backdrop-blur-sm overflow-y-auto py-8">
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-red-500 via-yellow-500 to-purple-600 mb-6 drop-shadow-2xl">
            Scalda Spark
          </h1>

          <p className="text-slate-300 mb-4 text-center max-w-md leading-relaxed text-lg px-4">
            Luister naar de beat! 🎵
            <br />
            Wacht tot de vuurpijl op de maat zijn hoogste punt bereikt en druk op{' '}
            <strong>SPATIE</strong>.
          </p>

          {/* 🎯 MOEILIJKHEIDSGRAAD */}
          <div className="flex flex-col items-center gap-3 mb-6 w-full max-w-md px-4">
            <label className="text-slate-300 font-semibold text-lg">Moeilijkheidsgraad</label>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setSelectedDifficulty(Difficulty.EASY)}
                className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all ${
                  selectedDifficulty === Difficulty.EASY
                    ? 'bg-green-600 text-white scale-105 shadow-lg'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Makkelijk
              </button>
              <button
                onClick={() => setSelectedDifficulty(Difficulty.NORMAL)}
                className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all ${
                  selectedDifficulty === Difficulty.NORMAL
                    ? 'bg-blue-600 text-white scale-105 shadow-lg'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Normaal
              </button>
              <button
                onClick={() => setSelectedDifficulty(Difficulty.HARD)}
                className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all ${
                  selectedDifficulty === Difficulty.HARD
                    ? 'bg-red-600 text-white scale-105 shadow-lg'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Moeilijk
              </button>
            </div>
            <p className="text-slate-400 text-sm text-center mt-1">
              {selectedDifficulty === Difficulty.EASY && 'Langzamer tempo, meer tijd om te reageren'}
              {selectedDifficulty === Difficulty.NORMAL && 'Standaard tempo, uitdagend maar eerlijk'}
              {selectedDifficulty === Difficulty.HARD && 'Razendsnel, alleen voor experts!'}
            </p>
          </div>

          {/* 🎵 TRACK SELECTOR */}
          <div className="flex flex-col items-center gap-2 mb-6 w-full max-w-xs px-4">
            <label className="text-slate-300 font-semibold">Kies een track</label>
            <select
              value={selectedSongUrl}
              onChange={(e) => setSelectedSongUrl(e.target.value)}
              className="w-full p-3 rounded-lg bg-slate-800 text-white border border-slate-600 focus:border-purple-500 focus:outline-none cursor-pointer hover:bg-slate-700 transition"
            >
              {SONGS.map((song) => (
                <option key={song.id} value={song.url}>
                  {song.title}
                </option>
              ))}
            </select>
          </div>

          {/* 🎨 KLEURKEUZE */}
          <div className="flex flex-col items-center gap-3 mb-6 px-4">
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

          <div className="flex items-center gap-3 mb-6 px-4">
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
          </div>

          <div className="flex flex-col gap-3 w-full max-w-xs px-4">
            <button
              onClick={startGame}
              disabled={selectedColors.length === 0}
              className={`px-12 py-4 rounded-full text-white font-bold text-2xl transition ${
                selectedColors.length === 0
                  ? 'bg-slate-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-500 to-violet-600 hover:scale-105 animate-pulse shadow-[0_0_30px_rgba(168,85,247,0.5)]'
              }`}
            >
              START SHOW 🔊
            </button>
            <button
              onClick={handleViewLeaderboard}
              className="px-12 py-3 rounded-full text-white font-bold text-lg transition hover:scale-105 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 shadow-[0_0_20px_rgba(217,119,6,0.4)]"
            >
              🏆 LEADERBOARD
            </button>
          </div>
        </div>
      )}

      {gameState === GameState.MENU && (
        <button
          onClick={() => setShowAchievements(true)}
          aria-label="Achievements"
          className="absolute bottom-6 right-6 z-50 pointer-events-auto w-12 h-12 rounded-full bg-sky-600 text-white flex items-center justify-center text-xl shadow-lg hover:scale-105 transition"
        >
          🎖
        </button>
      )}

      {gameState === GameState.PLAYING && (
        <UIOverlay
          stats={stats}
          timeLeft={timeLeft}
          lastFeedback={lastFeedback}
          paused={paused}
          onTogglePause={setPausedState}
          onStop={handleStopGame}
        />
      )}

      {gameState === GameState.GAME_OVER && (
        <GameOverModal
          stats={stats}
          onRestart={startGame}
          onViewLeaderboard={handleSaveToLeaderboard}
          onBackToMenu={handleBackToMenu}
        />
      )}

      {gameState === GameState.LEADERBOARD && (
        <Leaderboard
          entries={leaderboard}
          playerRank={playerRank}
          onBack={handleBackToMenu}
        />
      )}

      {showAchievements && (
        <Achievements
          achievements={achievements}
          onClose={() => setShowAchievements(false)}
        />
      )}
    </div>
  );
};

export default App;