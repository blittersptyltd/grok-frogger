import { TILE, COLS, PALETTE, TOTAL_ROWS } from "../types";
import { ROW, rowY } from "./World";
import { SpriteSheet } from "./Sprites";

export interface HUDState {
  score: number;
  hiScore: number;
  lives: number;
  level: number;
  timeRemaining: number; // 0..1
}

export type ArcadeColour = "grey" | "yellow" | "red" | "green" | "cyan";

const GLYPH_SIZE = 9;
const GLYPH_SCALE = 2;
const GLYPH_ROWS = ["0123456789ABCDEFG", "HIJKLMNOPQRSTUVWX", "YZ-@="];
const COLOUR_BLOCK: Record<ArcadeColour, number> = {
  grey: 0,
  yellow: 27,
  red: 54,
  green: 81,
  cyan: 108,
};

export function drawHUD(
  ctx: CanvasRenderingContext2D,
  state: HUDState,
  sprites?: SpriteSheet
): void {
  drawTopHUD(ctx, state, sprites);
  drawBottomHUD(ctx, state, sprites);
}

export function drawScoreHUD(
  ctx: CanvasRenderingContext2D,
  state: HUDState,
  sprites?: SpriteSheet
): void {
  drawTopHUD(ctx, state, sprites);
}

function drawTopHUD(
  ctx: CanvasRenderingContext2D,
  state: HUDState,
  sprites?: SpriteSheet
): void {
  const y = rowY(ROW.HUD_TOP);
  ctx.fillStyle = PALETTE.black;
  ctx.fillRect(0, y, COLS * TILE, TILE * 2);

  // Original two-line arrangement: labels above, red score digits below.
  drawArcadeText(ctx, sprites, "1-UP", 36, y + 2, "grey");
  drawArcadeText(ctx, sprites, "HI-SCORE", 160, y + 2, "grey");
  drawArcadeText(ctx, sprites, pad(state.score, 5), 36, y + 30, "red");
  drawArcadeText(ctx, sprites, pad(state.hiScore, 5), 196, y + 30, "red");
}

function drawBottomHUD(
  ctx: CanvasRenderingContext2D,
  state: HUDState,
  sprites?: SpriteSheet
): void {
  const y = rowY(ROW.HUD_BOTTOM);
  ctx.fillStyle = PALETTE.black;
  ctx.fillRect(0, y, COLS * TILE, TILE);

  const lifeSize = TILE / 2;
  for (let i = 0; i < state.lives; i++) {
    const lx = 4 + i * (lifeSize + 2);
    const ly = y + (TILE - lifeSize) / 2;
    drawLifeIcon(ctx, lx, ly, lifeSize, sprites);
  }

  drawArcadeText(
    ctx,
    sprites,
    `L${state.level}`,
    4 + state.lives * (lifeSize + 2) + 6,
    y + 7,
    "grey",
    1
  );

  drawArcadeText(ctx, sprites, "TIME", COLS * TILE - 76, y + 7, "yellow", 1);

  const barW = COLS * TILE * 0.55;
  const barH = TILE / 3;
  const barX = COLS * TILE - 82 - barW;
  const barY = y + TILE / 2 - barH / 2;

  ctx.fillStyle = "#222";
  ctx.fillRect(barX, barY, barW, barH);

  const fillW = Math.max(0, Math.min(1, state.timeRemaining)) * barW;
  ctx.fillStyle = PALETTE.timeBar;
  ctx.fillRect(barX, barY, fillW, barH);
}

export function drawArcadeText(
  ctx: CanvasRenderingContext2D,
  sprites: SpriteSheet | undefined,
  text: string,
  x: number,
  y: number,
  colour: ArcadeColour,
  scale = GLYPH_SCALE
): void {
  // Integer destination geometry prevents neighbouring 9px atlas cells from
  // bleeding into the glyph as thin leading fragments ("|CREDIT", "|1 JUMP").
  const pixelScale = Math.max(1, Math.round(scale));
  const drawX = Math.round(x);
  const drawY = Math.round(y);

  if (!sprites?.isReady()) {
    ctx.fillStyle = colour === "red"
      ? "#ff2020"
      : colour === "yellow"
        ? PALETTE.hudYellow
        : colour === "green"
          ? PALETTE.frogGreen
          : colour === "cyan"
            ? "#14f0ff"
            : PALETTE.white;
    ctx.font = `bold ${GLYPH_SIZE * pixelScale}px monospace`;
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillText(text, drawX, drawY);
    return;
  }

  let cx = drawX;
  for (const char of text.toUpperCase()) {
    if (char === " ") {
      cx += GLYPH_SIZE * pixelScale;
      continue;
    }
    const pos = glyphPosition(char);
    if (pos) {
      sprites.drawCropped(
        ctx,
        "arcade_font",
        pos.col * GLYPH_SIZE,
        COLOUR_BLOCK[colour] + pos.row * GLYPH_SIZE,
        GLYPH_SIZE,
        GLYPH_SIZE,
        cx,
        drawY,
        GLYPH_SIZE * pixelScale,
        GLYPH_SIZE * pixelScale
      );
    }
    cx += GLYPH_SIZE * pixelScale;
  }
}

export function arcadeTextWidth(text: string, scale = GLYPH_SCALE): number {
  return text.length * GLYPH_SIZE * Math.max(1, Math.round(scale));
}

function glyphPosition(char: string): { col: number; row: number } | null {
  for (let row = 0; row < GLYPH_ROWS.length; row++) {
    const col = GLYPH_ROWS[row].indexOf(char);
    if (col !== -1) return { col, row };
  }
  return null;
}

function drawLifeIcon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  sprites?: SpriteSheet
): void {
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
  return TOTAL_ROWS;
}
