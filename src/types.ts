export const TILE = 32;
export const COLS = 14;
export const PLAYFIELD_ROWS = 13;
// Original Frogger uses a two-line top scoreboard; the extra row also restores
// the arcade 14×16 playfield aspect ratio for portrait/mobile screens.
export const HUD_TOP_ROWS = 2;
export const HUD_BOTTOM_ROWS = 1;
export const TOTAL_ROWS = HUD_TOP_ROWS + PLAYFIELD_ROWS + HUD_BOTTOM_ROWS;

export const WIDTH = COLS * TILE;
export const HEIGHT = TOTAL_ROWS * TILE;

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
