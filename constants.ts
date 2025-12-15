export const GRAVITY = 0.15;
export const BPM = 132;
export const BEAT_MS = 60000 / BPM; 
export const BEATS_PER_MEASURE = 4;

export const LAUNCH_INTERVAL_MS = BEAT_MS * 2; 
export const FLIGHT_DURATION_BEATS = 2; 

export const GAME_DURATION_MS = 100000; 

export const FIREWORK_COLORS = [
  { value: '#ef4444', class: 'bg-red-500' },
  { value: '#f97316', class: 'bg-orange-500' },
  { value: '#eab308', class: 'bg-yellow-500' },
  { value: '#22c55e', class: 'bg-green-500' },
  { value: '#3b82f6', class: 'bg-blue-500' },
  { value: '#a855f7', class: 'bg-purple-500' },
  { value: '#ec4899', class: 'bg-pink-500' },
  { value: '#ffffff', class: 'bg-white' }
];


export const APEX_THRESHOLD = 1.8; 
export const LATE_THRESHOLD = 2.0; 
export const EARLY_THRESHOLD = -2.0; 
export const SCORE_PERFECT = 100;
export const SCORE_GOOD = 50;
export const COMBO_MULTIPLIER_STEP = 0.1;
export const EXPLOSION_PARTICLES = 40;
export const EXPLOSION_SPEED = 4;
export const PARTICLE_DECAY = 0.015;