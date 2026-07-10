// Per-level difficulty & feature unlocks. Speed still scales via
// levelSpeedMultiplier; this layer adds hazards and bonuses.

export interface LevelFeatures {
  /** Some turtle groups dive/submerge (not all). */
  divingTurtles: boolean;
  /** Chance (0..1) a turtle group is a diving one. */
  diveChance: number;
  /** Open-mouth crocs appear on some long-log spawns. */
  crocodiles: boolean;
  /** Snake patrols the median bank. */
  snakes: boolean;
  /** Bonus fly appears in a random empty home. */
  flyBonus: boolean;
  /** Lady frog rides a random log; hop on for points. */
  ladyFrog: boolean;
  /** Chance (0..1) a long-log spawn is replaced by a croc. */
  crocChance: number;
  /** Seconds between fly appearing / relocating. */
  flyIntervalSec: number;
  /** Seconds a lady frog stays on a log before despawning. */
  ladyDurationSec: number;
}

export function featuresForLevel(level: number): LevelFeatures {
  // Reason: unlock arcade extras gradually so early levels stay readable.
  // Only a minority of turtle groups dive — arcade leaves safe platforms.
  return {
    divingTurtles: level >= 2,
    diveChance: level >= 5 ? 0.35 : level >= 3 ? 0.28 : level >= 2 ? 0.22 : 0,
    crocodiles: level >= 3,
    snakes: level >= 3,
    flyBonus: level >= 2,
    ladyFrog: level >= 2, // earlier so players see her before L4
    crocChance: level >= 5 ? 0.4 : level >= 3 ? 0.25 : 0,
    flyIntervalSec: Math.max(4, 9 - level),
    ladyDurationSec: Math.max(8, 14 - level),
  };
}

export const SCORE_FLY_BONUS = 200;
export const SCORE_LADY_BONUS = 200;
