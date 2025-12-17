export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  LEADERBOARD = 'LEADERBOARD'
}

export interface Coordinates {
  x: number;
  y: number;
}

export interface Vector {
  x: number;
  y: number;
}

export interface Color {
  r: number;
  g: number;
  b: number;
}

export enum FireworkStatus {
  RISING = 'RISING',
  EXPLODING = 'EXPLODING',
  DUD = 'DUD',     
  WET = 'WET',    
  DEAD = 'DEAD'
}

export interface Firework {
  id: number;
  pos: Coordinates;
  vel: Vector;
  color: string;
  status: FireworkStatus;
  apexY: number;   
  trail: Coordinates[];
  trailColor: string;
}

export interface Particle {
  id: number;
  pos: { x: number; y: number };
  vel: { x: number; y: number };
  life: number;
  maxLife: number;
  color?: string;
  size: number;
  decay: number;
  image?: HTMLImageElement; // 👈 NIEUW
}

export interface ScoreStats {
  score: number;
  combo: number;
  maxCombo: number;
  hits: number;
  misses: number;
  perfects: number;
}

export interface JudgeResult {
  rankTitle: string;
  critique: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  maxCombo: number;
  perfects: number;
  accuracy: number;
  timestamp: number;
}

export interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: number | null;
  
  progress?: number;
  goal?: number;
}