import { TILE, COLS, PALETTE, TOTAL_ROWS } from "../types";
import { ROW } from "./World";
import { SpriteSheet } from "./Sprites";

export interface HUDState {
  score: number;
  hiScore: number;
  lives: number;
  level: number;
  timeRemaining: number; // 0..1
}

export function drawHUD(
  ctx: CanvasRenderingContext2D,
  state: HUDState,
  sprites?: SpriteSheet
): void {
  drawTopHUD(ctx, state);
  drawBottomHUD(ctx, state, sprites);
}

function drawTopHUD(ctx: CanvasRenderingContext2D, state: HUDState): void {
  const y = ROW.HUD_TOP * TILE;
  ctx.fillStyle = PALETTE.black;
  ctx.fillRect(0, y, COLS * TILE, TILE);

  // Single line, ~14px font so labels + numbers fit
  ctx.font = `bold 14px "Press Start 2P", monospace`;
  ctx.textBaseline = "middle";
  const midY = y + TILE / 2;

  // Left: 1-UP and score on one line
  ctx.textAlign = "left";
  ctx.fillStyle = PALETTE.hudCyan;
  ctx.fillText("1-UP", 6, midY);
  ctx.fillStyle = PALETTE.white;
  ctx.fillText(pad(state.score, 5), 6 + 50, midY);

  // Right: HI-SCORE label and value on one line, right-aligned
  ctx.textAlign = "right";
  ctx.fillStyle = PALETTE.white;
  ctx.fillText(pad(state.hiScore, 5), COLS * TILE - 6, midY);
  ctx.fillStyle = PALETTE.hudCyan;
  ctx.fillText("HI-SCORE", COLS * TILE - 6 - 60, midY);
}

function drawBottomHUD(
  ctx: CanvasRenderingContext2D,
  state: HUDState,
  sprites?: SpriteSheet
): void {
  const y = ROW.HUD_BOTTOM * TILE;
  ctx.fillStyle = PALETTE.black;
  ctx.fillRect(0, y, COLS * TILE, TILE);

  // Lives: small frog icons on the left (arcade "extra man")
  const lifeSize = TILE / 2;
  for (let i = 0; i < state.lives; i++) {
    const lx = 4 + i * (lifeSize + 2);
    const ly = y + (TILE - lifeSize) / 2;
    drawLifeIcon(ctx, lx, ly, lifeSize, sprites);
  }

  // Level indicator (small, after lives)
  ctx.font = `bold 12px "Press Start 2P", monospace`;
  ctx.textBaseline = "middle";
  ctx.fillStyle = PALETTE.hudYellow;
  ctx.textAlign = "left";
  ctx.fillText(`L=${state.level}`, 4 + state.lives * (lifeSize + 2) + 6, y + TILE / 2);

  // TIME label and bar on right
  ctx.font = `bold 14px "Press Start 2P", monospace`;
  ctx.fillStyle = PALETTE.hudYellow;
  ctx.textAlign = "right";
  ctx.fillText("TIME", COLS * TILE - 4, y + TILE / 2);

  const barW = COLS * TILE * 0.55;
  const barH = TILE / 3;
  const barX = COLS * TILE - 4 - 60 - barW;
  const barY = y + TILE / 2 - barH / 2;

  // Bar background
  ctx.fillStyle = "#222";
  ctx.fillRect(barX, barY, barW, barH);

  // Bar fill
  const fillW = Math.max(0, Math.min(1, state.timeRemaining)) * barW;
  ctx.fillStyle = PALETTE.timeBar;
  ctx.fillRect(barX, barY, fillW, barH);
}

function drawLifeIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  sprites?: SpriteSheet
): void {
  // Prefer the real frog sprite scaled down; fall back to a tiny drawn frog.
  if (sprites?.isReady()) {
    sprites.drawCentered(ctx, "frog_idle", x + size / 2, y + size / 2, size);
    return;
  }
  ctx.fillStyle = PALETTE.frogGreen;
  ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
  ctx.fillStyle = PALETTE.black;
  ctx.fillRect(x + size * 0.25, y + size * 0.3, 2, 2);
  ctx.fillRect(x + size * 0.6, y + size * 0.3, 2, 2);
}

function pad(n: number, width: number): string {
  return n.toString().padStart(width, "0");
}

export function _hudHeightInRows(): number {
  // Helper for layout sanity: top + playfield + bottom = TOTAL_ROWS
  return TOTAL_ROWS;
}
