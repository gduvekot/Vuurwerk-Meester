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
import { getAchievements, evaluateEndOfGame, getMeta, resetAchievementsAndMeta } from './utils/achievements';
import TutorialModal from './components/TutorialModal';
import AdvancedModal from './components/AdvancedModal';
import { GameState, ScoreStats, LeaderboardEntry } from './types';
import { audioManager } from './utils/audio';
const SONGS = [
  { id: '1', title: 'NORMAL: DJ Ruben - ID', url: './audio/djruben.mp3', bpm: 132, delay: 250 },
  { id: '2', title: 'FAST: DJ Ruben - Burn', url: './audio/djrubenburn.mp3', bpm: 138, delay: 1500 },
  { id: '3', title: 'NORMAL: DJ Ruben - Nostalgia', url: './audio/djrubennostalgia.mp3', bpm: 132, delay: 700 },
  { id: '4', title: 'SLOW: Martin Garrix - Peace of Mind', url: './audio/MartinGarrix1.mp3', bpm: 126, delay: 1500 },
  { id: '5', title: 'SLOW: Oliver Heldens - Disco Voyager', url: './audio/HiLo.mp3', bpm: 125, delay: 1250 },
    { id: '6', title: 'NORMAL: Charlie Kirk song remix', url: './audio/charliekirkremix.mp3', bpm: 133, delay: 0 }

];

const App: React.FC = () => {
  const [beatActive, setBeatActive] = useState(false);
  const [selectedSongUrl, setSelectedSongUrl] = useState<string>(SONGS[0].url);
  const [isLoading, setIsLoading] = useState(false);
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_MS / 1000);
  const [currentBpm, setCurrentBpm] = useState(128);
  const [paused, setPausedState] = useState(false);
  const [bestScore, setBestScore] = useState<number>(0);
  const startTimeRef = useRef<number>(0);
  const [stats, setStats] = useState<ScoreStats>({
    score: 0,
    bestScore: 0,
    combo: 0,
    maxCombo: 0,
    hits: 0,
    misses: 0,
    perfects: 0
  });
  const [lastFeedback, setLastFeedback] = useState<string | null>(null);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [playerRank, setPlayerRank] = useState<number | undefined>(undefined);
  const [achievements, setAchievements] = useState(() => getAchievements());
  const [showAchievements, setShowAchievements] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);
  const [loopTrack, setLoopTrack] = useState(false);

  const timerRef = useRef<number | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);

  const [selectedColors, setSelectedColors] = useState<string[]>([
    '#ef4444',
    '#f97316',
    '#eab308',
    '#22c55e'
  ]);
  const [customColor, setCustomColor] = useState('#ff0000');
  const [toast, setToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const charlieTitleClicks = useRef<number>(0);
  const charlieTitleTimer = useRef<number | null>(null);
  const keyBuffer = useRef<string>('');
  const charlieCooldown = useRef<number>(0);

  const [selectedTrailColors, setSelectedTrailColors] = useState<string[]>([
    '#ffffff',
  ]);

  const [customTrailColor, setCustomTrailColor] = useState('#ffffff');

  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>(Difficulty.NORMAL);
  const [speedMultiplier, setSpeedMultiplier] = useState(1.0); 

  const baseGameIntervalRef = useRef(BASE_LAUNCH_INTERVAL_MS);

  const handleBeat = () => {
    console.log("2. App: Ik heb het signaal ontvangen!"); 
    setBeatActive(true);
    setTimeout(() => setBeatActive(false), 100);
  };

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

  useEffect(() => {
    const storedScore = localStorage.getItem('vuurwerk-best-score');
    if (storedScore) {
      setBestScore(parseInt(storedScore, 10));
    }
  }, []);

  const showToast = (text: string, duration = 3500) => {
    setToast(text);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => setToast(null), duration);
  };


  const startGame = async () => {
    const selectedSong = SONGS.find(s => s.url === selectedSongUrl);
    const initialInterval = BASE_LAUNCH_INTERVAL_MS * LAUNCH_MODIFIERS[selectedDifficulty];
    baseGameIntervalRef.current = initialInterval; 
    setSpeedMultiplier(1.0); 

    setStats({
      score: 0,
      bestScore: bestScore,
      combo: 0,
      maxCombo: 0,
      hits: 0,
      misses: 0,
      perfects: 0
    });

    setIsLoading(true);

    try {
      if (!practiceMode) {
        console.log(`Laden: ${selectedSong.title} met ${selectedSong.bpm} BPM`);
        audioManager.setBpm(selectedSong.bpm);
        setCurrentBpm(selectedSong.bpm);
        updateSongSettings(selectedSong.bpm, selectedSong.delay);
        await audioManager.loadTrack(selectedSong.url);
        setTimeLeft(GAME_DURATION_MS / 1000);
        audioManager.resume();
  setGameState(GameState.PLAYING);
        setTimeout(() => {
          audioManager.start();
        }, selectedSong.delay || 0);
      } else {
        setTimeLeft(0);
        setGameState(GameState.PLAYING);
      }
    } catch (error) {
      console.error("Fout:", error);
      alert("Kon track niet laden.");
    } finally {
      setIsLoading(false);
    }
  };

  const endGame = () => {
    const completedFullRun = timeLeft <= 0;

    if (!practiceMode && stats.score > bestScore) {
      const newScore = stats.score;
      setBestScore(newScore);
      localStorage.setItem('vuurwerk-best-score', newScore.toString());
    }

    const updated = evaluateEndOfGame(stats, completedFullRun);
    setAchievements(updated);

    setGameState(GameState.GAME_OVER);
    audioManager.stop();
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleTitleClick = () => {
    charlieTitleClicks.current += 1;
    if (charlieTitleTimer.current) clearTimeout(charlieTitleTimer.current as number);
    charlieTitleTimer.current = window.setTimeout(() => { charlieTitleClicks.current = 0; }, 3000);

    if (charlieTitleClicks.current >= 7 && Date.now() - (charlieCooldown.current || 0) > 8000) {
      charlieTitleClicks.current = 0;
      charlieCooldown.current = Date.now();
      const prev = selectedColors;
      setSelectedColors(['#FFD700', '#FFEC8B', '#FFFFFF']);
      showToast('Charlie Kirk approves your golden show!');
      setTimeout(() => setSelectedColors(prev), 8000);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toUpperCase();
      if (k.length === 1 && /[A-Z]/.test(k)) {
        keyBuffer.current = (keyBuffer.current + k).slice(-12);
        if (keyBuffer.current.endsWith('CHARLIE') && Date.now() - (charlieCooldown.current || 0) > 8000) {
          charlieCooldown.current = Date.now();
          setStats(prev => ({ ...prev, score: prev.score + 3000 }));
          setLastFeedback('CHARLIE BLAST!');
          showToast('Charlie Blast activated! +3000 score');
          setTimeout(() => setLastFeedback(null), 1200);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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

    try {
      const lower = playerName.toLowerCase();
      if (lower.includes('charlie') || lower.includes('kirk')) {
        newEntry.name = 'Charlie Kirk';
        showToast('Charlie detected in leaderboard!');
      }
    } catch (e) {}

    const updatedLeaderboard = [...leaderboard, newEntry];
    setLeaderboard(updatedLeaderboard);

    localStorage.setItem('vuurwerk-leaderboard', JSON.stringify(updatedLeaderboard));

    const sortedByScore = updatedLeaderboard
      .sort((a, b) => b.score - a.score);
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
    const calculateSpeedMultiplier = (remainingTimeSeconds: number): number => {
      if (remainingTimeSeconds > 15) {
        return 1.0; 
      } else if (remainingTimeSeconds > 10) {
        return 1; 
      } else if (remainingTimeSeconds > 5) {
        return 1; 
      } else if (remainingTimeSeconds > 0) {
        return 1; 
      }
      return 1.0;
    };

    // Start or stop the timer depending on gameState, paused and practiceMode
    if (gameState === GameState.PLAYING && !paused && !practiceMode) {
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
  }, [gameState, paused, timeLeft, endGame, speedMultiplier, practiceMode]); // speedMultiplier is toegevoegd als dependency

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && gameState === GameState.PLAYING) {
        setPausedState(!paused);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [paused, gameState]);

  useEffect(() => {
    if (paused) {
      audioManager.pause();
    } else {
      audioManager.resume();
    }
  }, [paused]);

  useEffect(() => {
    audioManager.setLoop(loopTrack);
  }, [loopTrack]);

  const handleScoreUpdate = (points: number, accuracy: 'perfect' | 'good' | 'miss' | 'wet') => {
    setStats(prev => {
      let newCombo = prev.combo;
      let newScore = prev.score;
      let newHits = prev.hits;
      let newMisses = prev.misses;
      let newPerfects = prev.perfects;
      let newBestScore = prev.bestScore;

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
        bestScore: newBestScore,
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
        trailColors={selectedTrailColors}
        timeLeft={timeLeft}
        paused={paused}
        baseLaunchInterval={baseGameIntervalRef.current}
        speedMultiplier={speedMultiplier}
        selectedDifficulty={selectedDifficulty}
         onBeat={handleBeat} 
      />

      {toast && (
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }} className="pointer-events-none">
          <div className="bg-black/80 text-white px-4 py-2 rounded-md shadow-lg">{toast}</div>
        </div>
      )}

      {gameState === GameState.MENU && (
        <div className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm">
          <div className="h-full flex flex-col items-center px-4 pt-8 pb-6">

            {/* LOGO */}
            <img
              src="/img/logo.png"
              alt="Scalda Spark logo"
              className="w-20 md:w-28 mb-4 drop-shadow-xl select-none pointer-events-none"
            />

            {/* TITEL */}
            <h1
              onClick={handleTitleClick}
              className="cursor-pointer text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-red-500 via-yellow-500 to-purple-600 mb-4 text-center"
            >
              Scalda Spark
            </h1>

            {/* BESTE SCORE */}
            <div className="mb-6 px-6 py-2 bg-slate-800/80 rounded-full border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
              <p className="text-yellow-400 font-bold text-lg tracking-wider">
                🏆 BESTE SCORE: {bestScore}
              </p>
            </div>

            {/* INSTRUCTIE */}
            <p className="text-slate-300 mb-6 text-center  text-base leading-relaxed">
              Luister naar de beat 🎵
              Wacht tot de vuurpijl zijn hoogste punt bereikt en druk op{' '} SPATIE.
            </p>

            {/* TRACK SELECT */}
            <div className="flex flex-col items-center gap-2 mb-6 w-full max-w-xs">
              <label className="text-slate-300 font-semibold">
                Kies een track
              </label>

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

            {/* KLEUREN */}
            <div className="flex flex-row gap-8 mb-8 justify-center w-full max-w-3xl">

              {/* VUURWERK */}
              <div className="flex flex-col items-center gap-3">
                <p className="text-slate-300 font-semibold">
                  Vuurwerkkleuren
                </p>

                <div className="flex gap-2 flex-wrap justify-center">
                  {selectedColors.map(color => (
                    <button
                      key={color}
                      onClick={() =>
                        setSelectedColors(prev => prev.filter(c => c !== color))
                      }
                      className="w-8 h-8 rounded-full border-2 border-white opacity-80 hover:scale-110 transition"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                {selectedColors.length === 0 && (
                  <p className="text-red-400 text-sm">
                    Kies minimaal één kleur
                  </p>
                )}

                <div className="flex items-center gap-3">
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
                    Voeg toe
                  </button>
                </div>
              </div>

              {/* TRAIL */}
              <div className="flex flex-col items-center gap-3">
                <p className="text-slate-300 font-semibold">
                  Traalkleuren
                </p>

                <div className="flex gap-2 flex-wrap justify-center">
                  {selectedTrailColors.map(color => (
                    <button
                      key={color}
                      onClick={() =>
                        setSelectedTrailColors(prev => prev.filter(c => c !== color))
                      }
                      className="w-8 h-8 rounded-full border-2 border-white opacity-80 hover:scale-110 transition"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                {selectedTrailColors.length === 0 && (
                  <p className="text-red-400 text-sm">
                    Kies minimaal één kleur
                  </p>
                )}

                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={customTrailColor}
                    onChange={e => setCustomTrailColor(e.target.value)}
                    className="w-12 h-12 rounded-lg border border-slate-600 cursor-pointer bg-transparent"
                  />

                  <button
                    onClick={() => {
                      if (!selectedTrailColors.includes(customTrailColor)) {
                        setSelectedTrailColors(prev => [...prev, customTrailColor]);
                      }
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-700 text-white font-semibold hover:bg-slate-600 transition"
                  >
                    Voeg toe
                  </button>
                </div>
              </div>
            </div>

            {/* START BUTTON */}
            <div className="mt-4">
              <button
                onClick={startGame}
                disabled={selectedColors.length === 0}
                className={`px-12 py-4 rounded-full text-white font-bold text-2xl transition
                  ${selectedColors.length === 0
                    ? 'bg-slate-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-pink-500 to-violet-600 hover:scale-105 shadow-[0_0_30px_rgba(168,85,247,0.5)]'
                  }`}
              >
                START SHOW 🔊
              </button>
            </div>

          </div>
        </div>
      )}


      {gameState === GameState.MENU && (
        <div className="absolute bottom-6 left-6 z-50 pointer-events-auto flex items-center gap-3">
          <button
            onClick={() => setShowTutorial(true)}
            aria-label="Tutorial"
            className="w-12 h-12 rounded-full bg-slate-700 text-white flex items-center justify-center text-xl shadow-lg hover:scale-105 transition"
          >
            ❓
          </button>

          <button
            onClick={() => {
              setPracticeMode(p => !p);
            }}
            aria-label="Practice"
            className={`w-12 h-12 rounded-full text-white flex items-center justify-center text-xl shadow-lg hover:scale-105 transition ${practiceMode ? 'bg-emerald-600' : 'bg-slate-700'}`}
          >
            🧪
          </button>

          <button
            onClick={() => setShowAdvanced(true)}
            aria-label="Advanced"
            className="w-12 h-12 rounded-full bg-slate-700 text-white flex items-center justify-center text-xl shadow-lg hover:scale-105 transition"
          >
            ⚙️
          </button>
        </div>
      )}

      {gameState === GameState.MENU && (
        <div className="absolute bottom-6 right-6 z-50 pointer-events-auto flex items-center gap-3">
          <button
            onClick={handleViewLeaderboard}
            aria-label="Leaderboard"
            className="w-12 h-12 rounded-full bg-amber-600 text-white flex items-center justify-center text-xl shadow-lg hover:scale-105 transition"
          >
            🏆
          </button>

          <button
            onClick={() => setShowCredits(true)}
            aria-label="Credits"
            className="w-12 h-12 rounded-full bg-slate-700 text-white flex items-center justify-center text-xl shadow-lg hover:scale-105 transition"
          >
            🧾
          </button>

          <button
            onClick={() => setShowAchievements(true)}
            aria-label="Achievements"
            className="w-12 h-12 rounded-full bg-sky-600 text-white flex items-center justify-center text-xl shadow-lg hover:scale-105 transition"
          >
            🎖
          </button>
        </div>
      )}

      {showCredits && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Credits</h2>
              <button onClick={() => setShowCredits(false)} className="text-slate-300 hover:text-white">Sluiten</button>
            </div>

            <style>{`
              .credits-viewport { height: 260px; overflow: hidden; position: relative; }
              .credits-scroller { display: block; width: 100%; }
              .credits-list { display: flex; flex-direction: column; gap: 18px; }
              .credits-item { padding: 12px; border-radius: 8px; background: rgba(255,255,255,0.02); }
              @keyframes credits-scroll { 0% { transform: translateY(0%); } 100% { transform: translateY(-50%); } }
              .credits-animate { animation: credits-scroll 18s linear infinite; }
            `}</style>

            <div className="credits-viewport mt-2">
              <div className="credits-scroller credits-animate">
                <div className="credits-list">
                  <div className="credits-item">
                    <div className="text-white font-semibold">Lead Design</div>
                    <div className="text-slate-300 text-sm">Vlad, Yana, Abdulkarim, Ruben, Gijs</div>
                  </div>

                  <div className="credits-item">
                    <div className="text-white font-semibold">Gameplay & Mechanics</div>
                    <div className="text-slate-300 text-sm">Vlad, Yana, Abdulkarim, Ruben, Gijs</div>
                  </div>

                  <div className="credits-item">
                    <div className="text-white font-semibold">Audio & Sound Design</div>
                    <div className="text-slate-300 text-sm">Vlad, Yana, Abdulkarim, Ruben, Gijs</div>
                  </div>

                  <div className="credits-item">
                    <div className="text-white font-semibold">UI / UX & Accessibility</div>
                    <div className="text-slate-300 text-sm">Vlad, Yana, Abdulkarim, Ruben, Gijs</div>
                  </div>

                  <div className="credits-item">
                    <div className="text-white font-semibold">Visual Effects & Particles</div>
                    <div className="text-slate-300 text-sm">Vlad, Yana, Abdulkarim, Ruben, Gijs</div>
                  </div>

                  <div className="credits-item">
                    <div className="text-white font-semibold">Achievements & Progression</div>
                    <div className="text-slate-300 text-sm">Vlad, Yana, Abdulkarim, Ruben, Gijs</div>
                  </div>

                  <div className="credits-item">
                    <div className="text-white font-semibold">QA, Balancing & Playtesting</div>
                    <div className="text-slate-300 text-sm">Vlad, Yana, Abdulkarim, Ruben, Gijs</div>
                  </div>

                  <div className="credits-item">
                    <div className="text-white font-semibold">Build, DevOps & Packaging</div>
                    <div className="text-slate-300 text-sm">Vlad, Yana, Abdulkarim, Ruben, Gijs</div>
                  </div><br></br>
                </div>

                <div className="credits-list" aria-hidden="true">
                  <div className="credits-item">
                    <div className="text-white font-semibold">Lead Design</div>
                    <div className="text-slate-300 text-sm">Vlad, Yana, Abdulkarim, Ruben, Gijs</div>
                  </div>

                  <div className="credits-item">
                    <div className="text-white font-semibold">Gameplay & Mechanics</div>
                    <div className="text-slate-300 text-sm">Vlad, Yana, Abdulkarim, Ruben, Gijs</div>
                  </div>

                  <div className="credits-item">
                    <div className="text-white font-semibold">Audio & Sound Design</div>
                    <div className="text-slate-300 text-sm">Vlad, Yana, Abdulkarim, Ruben, Gijs</div>
                  </div>

                  <div className="credits-item">
                    <div className="text-white font-semibold">UI / UX & Accessibility</div>
                    <div className="text-slate-300 text-sm">Vlad, Yana, Abdulkarim, Ruben, Gijs</div>
                  </div>

                  <div className="credits-item">
                    <div className="text-white font-semibold">Visual Effects & Particles</div>
                    <div className="text-slate-300 text-sm">Vlad, Yana, Abdulkarim, Ruben, Gijs</div>
                  </div>

                  <div className="credits-item">
                    <div className="text-white font-semibold">Achievements & Progression</div>
                    <div className="text-slate-300 text-sm">Vlad, Yana, Abdulkarim, Ruben, Gijs</div>
                  </div>

                  <div className="credits-item">
                    <div className="text-white font-semibold">QA, Balancing & Playtesting</div>
                    <div className="text-slate-300 text-sm">Vlad, Yana, Abdulkarim, Ruben, Gijs</div>
                  </div>

                  <div className="credits-item">
                    <div className="text-white font-semibold">Build, DevOps & Packaging</div>
                    <div className="text-slate-300 text-sm">Vlad, Yana, Abdulkarim, Ruben, Gijs</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-right">
              <button onClick={() => setShowCredits(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white">Sluiten</button>
            </div>
          </div>
        </div>
      )}


      {gameState === GameState.PLAYING && (
        <>
          <UIOverlay
            stats={stats}
            timeLeft={timeLeft}
            lastFeedback={lastFeedback}
            paused={paused}
            onTogglePause={setPausedState}
            onStop={handleStopGame}
            practiceMode={practiceMode}
            beatActive={beatActive}
          />

          {practiceMode && (
            <div className="absolute top-6 right-6 z-50 pointer-events-auto">
              <button
                onClick={handleStopGame}
                aria-label="Stop"
                className="px-4 py-2 bg-red-600 text-white rounded-full font-bold shadow-lg hover:scale-105 transition"
              >
                STOP
              </button>
            </div>
          )}
        </>
      )}

      {gameState === GameState.GAME_OVER && (
        <GameOverModal
          stats={stats}
          onRestart={startGame}
          onViewLeaderboard={practiceMode ? (name: string) => alert('Oefenmodus: niet opslaan naar leaderboard') : handleSaveToLeaderboard}
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

      {showTutorial && (
        <TutorialModal onClose={() => setShowTutorial(false)} />
      )}

      {showAdvanced && (
        <AdvancedModal
          onClose={() => setShowAdvanced(false)}
          onReset={() => {
            try {
              localStorage.removeItem('vuurwerk-leaderboard');
              resetAchievementsAndMeta();
              setLeaderboard([]);
              setAchievements(getAchievements());
              alert('Data gereset');
            } catch (e) {
              alert('Reset mislukt');
            }
          }}
          onExport={() => {
            try {
              const data = { leaderboard, achievements };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'vuurwerk-export.json';
              a.click();
              URL.revokeObjectURL(url);
            } catch (e) {
              alert('Export mislukt');
            }
          }}
          onImport={(text) => {
            try {
              const parsed = JSON.parse(text);
              if (parsed.leaderboard) {
                localStorage.setItem('vuurwerk-leaderboard', JSON.stringify(parsed.leaderboard));
                setLeaderboard(parsed.leaderboard);
              }
              if (parsed.achievements) {
                localStorage.setItem('vuurwerk-achievements', JSON.stringify(parsed.achievements));
                setAchievements(getAchievements());
              }
              alert('Import geslaagd');
            } catch (e) {
              alert('Import mislukt');
            }
          }}
          achievements={achievements}
        />
      )}

      

    </div>

    
    
  );
  
  
};





export default App;