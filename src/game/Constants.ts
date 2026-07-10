// Game-wide tunable constants.

export const DEATH_DURATION = 1.2;
export const FROG_HITBOX_INSET = 4;

export const SCORE_PER_STEP = 10;
export const SCORE_PER_HOME = 50;
export const SCORE_PER_TIME_SECOND = 10;
export const SCORE_LEVEL_BONUS = 1000;
export const EXTRA_LIFE_AT = 20000;

export const TIME_LIMIT_SECONDS = 30;
export const READY_DURATION = 1.5;
export const LEVEL_COMPLETE_DURATION = 2.0;
export const GAME_OVER_DURATION = 3.5;

// Persist hi-score across sessions in the browser's local storage.
export const HIGH_SCORE_KEY = "FROGGER_HI_SCORE";

// Per-level speed scaling. Soft-caps at level 7 so late game stays brutal but fair.
export function levelSpeedMultiplier(level: number): number {
  return 1 + Math.min(level - 1, 6) * 0.12;
}
