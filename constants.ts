export const GRAVITY = 0.15;
export const BPM = 120;
export const BEAT_MS = 60000 / BPM;
export const BEATS_PER_MEASURE = 4;

// Launch timing
export const LAUNCH_INTERVAL_MS = BEAT_MS * 2; 
export const FLIGHT_DURATION_BEATS = 2; 

export const GAME_DURATION_MS = 60000; 

export const COLORS = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#eab308', // yellow-500
  '#22c55e', // green-500
  '#3b82f6', // blue-500
  '#a855f7',
  '#ec4899',
  '#ffffff', 
];

// Physics thresholds
export const APEX_THRESHOLD = 1.8; 
export const LATE_THRESHOLD = 2.0; 
export const EARLY_THRESHOLD = -2.0; 

// Scoring
export const SCORE_PERFECT = 100;
export const SCORE_GOOD = 50;
export const COMBO_MULTIPLIER_STEP = 0.1;

// Particles
export const EXPLOSION_PARTICLES = 40;
export const EXPLOSION_SPEED = 4;
export const PARTICLE_DECAY = 0.015;