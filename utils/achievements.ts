import { Achievement, ScoreStats } from '../types';

const STORAGE_KEY = 'vuurwerk-achievements';
const META_KEY = 'vuurwerk-achievements-meta';

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'a1', key: 'first_launch', title: 'Welkom!', description: 'Speel je eerste spel.', unlocked: false },
  { id: 'a2', key: 'first_point', title: 'Eerste punt', description: 'Verdien je eerste punt.', unlocked: false },
  // verhoogde thresholds
  { id: 'a3', key: 'score_5k', title: 'Kleiner dan 5k? Niet meer', description: 'Score 5.000 punten in één run.', unlocked: false },
  { id: 'a4', key: 'score_10k', title: 'Vuurwerkmeester', description: 'Score 10.000 punten in één run.', unlocked: false },
  { id: 'a5', key: 'score_25k', title: 'Explosieve tien', description: 'Score 25.000 punten in één run.', unlocked: false },
  { id: 'a6', key: 'score_50k', title: 'Showstopper', description: 'Score 50.000 punten in één run.', unlocked: false },
  { id: 'a7', key: 'combo_10', title: 'Op dreef', description: 'Behaal een combo van 10.', unlocked: false },
  { id: 'a8', key: 'combo_20', title: 'Combo koning', description: 'Behaal een combo van 20.', unlocked: false },
  { id: 'a9', key: 'combo_40', title: 'Combo legende', description: 'Behaal een combo van 40.', unlocked: false },
  { id: 'a10', key: 'perfect_5', title: 'Perfect begin', description: 'Behaal 5 PERFECTS in één run.', unlocked: false },
  { id: 'a11', key: 'perfect_25', title: 'Perfect speler', description: 'Behaal 25 PERFECTS in één run.', unlocked: false },
  { id: 'a12', key: 'perfect_100_total', title: 'Onberispelijk', description: 'Behaal 100 PERFECTS totaal over meerdere runs.', unlocked: false, progress: 0, goal: 100 },
  { id: 'a13', key: 'no_miss', title: 'Foutloos', description: 'Maak geen enkele miss in een run.', unlocked: false },
  { id: 'a14', key: 'flawless', title: 'Volmaakte show', description: 'Alle hits zijn PERFECTS (geen misses).', unlocked: false },
  { id: 'a15', key: 'play_10', title: 'Regular', description: 'Speel 10 spellen.', unlocked: false, progress: 0, goal: 10 },
  { id: 'a16', key: 'play_50', title: 'Toegewijd', description: 'Speel 50 spellen.', unlocked: false, progress: 0, goal: 50 },
  { id: 'a17', key: 'full_time', title: 'Tot het einde', description: 'Speel een volledige ronde tot de timer 0 bereikt.', unlocked: false },
  { id: 'a18', key: 'high_accuracy', title: 'Nauwkeurige schutter', description: 'Behaal een nauwkeurigheid van 95% of hoger.', unlocked: false },
  { id: 'a19', key: 'combo_100', title: 'Razer', description: 'Behaal een combo van 100.', unlocked: false },
  { id: 'a20', key: 'collector_10', title: 'Verzamelaar', description: 'Ontgrendel 10 achievements.', unlocked: false, progress: 0, goal: 10 }
];

export interface AchievementsMeta {
  gamesPlayed: number;
}

function loadAchievements(): Achievement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_ACHIEVEMENTS.map(a => ({ ...a }));
    const parsed = JSON.parse(raw) as Achievement[];
    // ensure all achievements exist (in case of updates)
    const merged = DEFAULT_ACHIEVEMENTS.map(def => {
      const found = parsed.find(p => p.key === def.key);
      // Ensure progress and goal fields are initialized
      const base = found ? { ...def, ...found } : { ...def };
      if (base.progress == null) base.progress = def.progress ?? 0;
      if (base.goal == null && def.goal != null) base.goal = def.goal;
      return base;
    });
    return merged;
  } catch (e) {
    console.error('Failed to load achievements:', e);
    return DEFAULT_ACHIEVEMENTS.map(a => ({ ...a }));
  }
}

function saveAchievements(list: Achievement[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save achievements:', e);
  }
}

function loadMeta(): AchievementsMeta {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return { gamesPlayed: 0 };
    return JSON.parse(raw) as AchievementsMeta;
  } catch (e) {
    return { gamesPlayed: 0 };
  }
}

function saveMeta(meta: AchievementsMeta) {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch (e) {
    console.error('Failed to save achievements meta:', e);
  }
}

export function getAchievements(): Achievement[] {
  return loadAchievements();
}

export function unlockAchievement(key: string): Achievement | null {
  const list = loadAchievements();
  const idx = list.findIndex(a => a.key === key);
  if (idx === -1) return null;
  if (list[idx].unlocked) return list[idx];
  list[idx].unlocked = true;
  list[idx].unlockedAt = Date.now();
  saveAchievements(list);
  return list[idx];
}

export function resetAchievements() {
  const list = DEFAULT_ACHIEVEMENTS.map(a => ({ ...a }));
  saveAchievements(list);
}

export function evaluateEndOfGame(stats: ScoreStats, completedFullRun: boolean) {
  const meta = loadMeta();
  meta.gamesPlayed = (meta.gamesPlayed || 0) + 1;
  meta.totalPerfects = (meta.totalPerfects || 0) + (stats.perfects || 0);
  meta.totalScore = (meta.totalScore || 0) + (stats.score || 0);
  saveMeta(meta);

  const unlocked: string[] = [];

  if (meta.gamesPlayed >= 1) unlocked.push('first_launch');
  if (stats.score > 0) unlocked.push('first_point');
  if (stats.score >= 5000) unlocked.push('score_5k');
  if (stats.score >= 10000) unlocked.push('score_10k');
  if (stats.score >= 25000) unlocked.push('score_25k');
  if (stats.score >= 50000) unlocked.push('score_50k');
  if (stats.maxCombo >= 10) unlocked.push('combo_10');
  if (stats.maxCombo >= 20) unlocked.push('combo_20');
  if (stats.maxCombo >= 40) unlocked.push('combo_40');
  if (stats.perfects >= 5) unlocked.push('perfect_5');
  if (stats.perfects >= 25) unlocked.push('perfect_25');
  // perfect_100_total is cumulative
  if (meta.totalPerfects >= 100) unlocked.push('perfect_100_total');
  if (stats.misses === 0 && stats.hits > 0) unlocked.push('no_miss');
  if (stats.misses === 0 && stats.hits > 0 && stats.perfects === stats.hits) unlocked.push('flawless');
  if (meta.gamesPlayed >= 10) unlocked.push('play_10');
  if (meta.gamesPlayed >= 50) unlocked.push('play_50');
  if (completedFullRun) unlocked.push('full_time');
  const accuracy = stats.hits + stats.misses > 0 ? (stats.hits / (stats.hits + stats.misses)) * 100 : 0;
  if (accuracy >= 95) unlocked.push('high_accuracy');
  if (stats.maxCombo >= 100) unlocked.push('combo_100');

  // load and update progress/unlock
  const current = loadAchievements();

  // increment progress for achievements with goals
  current.forEach(a => {
    if (a.goal && !a.unlocked) {
      if (a.key === 'play_10' || a.key === 'play_50') {
        a.progress = meta.gamesPlayed;
      }
      if (a.key === 'perfect_100_total') {
        a.progress = meta.totalPerfects;
      }
      if (a.key === 'collector_10') {
        a.progress = current.filter(x => x.unlocked).length;
      }
      // clamp
      if (a.progress > a.goal) a.progress = a.goal;
      if (a.progress >= (a.goal || 0)) {
        a.unlocked = true;
        a.unlockedAt = Date.now();
      }
    }
  });

  // unlock direct ones
  unlocked.forEach(k => {
    const idx = current.findIndex(a => a.key === k);
    if (idx !== -1 && !current[idx].unlocked) {
      current[idx].unlocked = true;
      current[idx].unlockedAt = Date.now();
    }
  });

  // after possible new unlocks, update collector progress/unlock
  const collectorIdx = current.findIndex(a => a.key === 'collector_10');
  if (collectorIdx !== -1) {
    current[collectorIdx].progress = current.filter(x => x.unlocked).length;
    if ((current[collectorIdx].progress || 0) >= (current[collectorIdx].goal || 0)) {
      current[collectorIdx].unlocked = true;
      current[collectorIdx].unlockedAt = Date.now();
    }
  }

  saveAchievements(current);
  return current;
}

export function getMeta(): AchievementsMeta {
  return loadMeta();
}

export function resetAchievementsAndMeta() {
  resetAchievements();
  saveMeta({ gamesPlayed: 0 });
}
