export const TILE = 32;
export const COLS = 14;
export const PLAYFIELD_ROWS = 13;
// Original Frogger uses a two-line top scoreboard. Additional logical depth is
// applied below for mobile readability without stretching 32px content sprites.
export const HUD_TOP_ROWS = 2;
export const HUD_BOTTOM_ROWS = 1;
// Extra logical depth for the home band. Rows below it shift by the same amount,
// preserving sprite proportions while giving the mobile playfield more air.
export const HOME_DEPTH_EXTRA = 8;
export const PLAY_ROW_GAP = 2;
// River 1 through the start strip span twelve intervals before the bottom HUD.
export const PLAY_ROW_GAP_COUNT = 12;
export const TOTAL_ROWS = HUD_TOP_ROWS + PLAYFIELD_ROWS + HUD_BOTTOM_ROWS;

export const WIDTH = COLS * TILE;
export const HEIGHT =
  TOTAL_ROWS * TILE + HOME_DEPTH_EXTRA + PLAY_ROW_GAP * PLAY_ROW_GAP_COUNT;

export type GameState =
  | "ATTRACT"
  | "READY"
  | "PLAYING"
  | "DYING"
  | "LEVEL_COMPLETE"
  | "GAME_OVER";

export type Direction = "up" | "down" | "left" | "right";

// Colors sampled from sheet-v2 / arcade palette for a closer match.
export const PALETTE = {
  black: "#000000",
  water: "#0000A8",
  grass: "#1DC300",
  grassDark: "#008000",
  grassSpeck: "#E03E00",
  median: "#8500D9",
  medianDot: "#E00000",
  medianDotAlt: "#0000D9",
  road: "#000000",
  frogGreen: "#00FF00",
  frogDark: "#008000",
  hudYellow: "#FFFF00",
  hudCyan: "#00FFFF",
  white: "#FFFFFF",
  timeBar: "#00FF00",
} as const;
