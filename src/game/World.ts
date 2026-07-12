import { TILE, COLS, HEIGHT, HOME_DEPTH_EXTRA, PALETTE } from "../types";

// Playfield row indices. Rows 0–1 = two-line top HUD; homes start at row 2.
export const ROW = {
  HUD_TOP: 0,
  HOMES: 2,
  RIVER_1: 3,
  RIVER_2: 4,
  RIVER_3: 5,
  RIVER_4: 6,
  RIVER_5: 7,
  MEDIAN: 8,
  ROAD_1: 9,
  ROAD_2: 10,
  ROAD_3: 11,
  ROAD_4: 12,
  ROAD_5: 13,
  START: 14,
  HUD_BOTTOM: 15,
} as const;

export function rowY(row: number): number {
  return row * TILE + (row > ROW.HOMES ? HOME_DEPTH_EXTRA : 0);
}

export function rowHeight(row: number): number {
  return row === ROW.HOMES ? TILE + HOME_DEPTH_EXTRA : TILE;
}

type RowKind = "hud" | "homes" | "river" | "median" | "road" | "start";

const ROW_KINDS: Record<number, RowKind> = {
  [ROW.HUD_TOP]: "hud",
  [ROW.HOMES]: "homes",
  [ROW.RIVER_1]: "river",
  [ROW.RIVER_2]: "river",
  [ROW.RIVER_3]: "river",
  [ROW.RIVER_4]: "river",
  [ROW.RIVER_5]: "river",
  [ROW.MEDIAN]: "median",
  [ROW.ROAD_1]: "road",
  [ROW.ROAD_2]: "road",
  [ROW.ROAD_3]: "road",
  [ROW.ROAD_4]: "road",
  [ROW.ROAD_5]: "road",
  [ROW.START]: "start",
  [ROW.HUD_BOTTOM]: "hud",
};

export function rowKind(row: number): RowKind {
  return ROW_KINDS[row] ?? "hud";
}

// Home alcove geometry (px), exposed so collision code can use it later.
export const HOME_ALCOVE = {
  count: 5,
  // Total playfield width = COLS * TILE = 448px.
  // 5 alcoves, each 48px wide, with 6 hedge gaps (incl. edges) of (448 - 5*48)/6 ≈ 34.66px.
  width: 48,
  // Alcove starts a bit below the top of the row (a 6px hedge wall caps the top).
  topInset: 6,
  // Alcove extends down into the river row a touch — looks more like the arcade.
  height: TILE + HOME_DEPTH_EXTRA - 6,
} as const;

export function homeAlcoveX(index: number): number {
  // Returns the left edge x of alcove `index` (0..4)
  const total = COLS * TILE;
  const gap = (total - HOME_ALCOVE.count * HOME_ALCOVE.width) / (HOME_ALCOVE.count + 1);
  return Math.round(gap + index * (HOME_ALCOVE.width + gap));
}

export function drawWorldBackground(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = PALETTE.black;
  ctx.fillRect(0, 0, COLS * TILE, HEIGHT);

  for (const [rowStr, kind] of Object.entries(ROW_KINDS)) {
    const row = Number(rowStr);
    const y = rowY(row);
    switch (kind) {
      case "homes":
        drawHomeRow(ctx, y);
        break;
      case "river":
        ctx.fillStyle = PALETTE.water;
        ctx.fillRect(0, y, COLS * TILE, TILE);
        break;
      case "median":
      case "start":
        drawMedianStrip(ctx, y);
        break;
      case "road":
        drawRoadRow(ctx, y, row);
        break;
      case "hud":
        // black, already filled
        break;
    }
  }
}

// Home row: arcade-style green hedge with diagonal hatch + orange speckles,
// five water alcoves cut in from below.
function drawHomeRow(ctx: CanvasRenderingContext2D, y: number): void {
  const w = COLS * TILE;

  // Water shows through the deeper mobile-friendly alcoves.
  ctx.fillStyle = PALETTE.water;
  ctx.fillRect(0, y, w, TILE + HOME_DEPTH_EXTRA);

  // Full-row hedge body, then punch alcoves back to water
  fillHedgeTexture(ctx, 0, y, w, TILE + HOME_DEPTH_EXTRA);

  for (let i = 0; i < HOME_ALCOVE.count; i++) {
    const ax = homeAlcoveX(i);
    ctx.fillStyle = PALETTE.water;
    ctx.fillRect(ax, y + HOME_ALCOVE.topInset, HOME_ALCOVE.width, HOME_ALCOVE.height);

    // Darker inner rim so alcoves read as cutouts in the bush
    ctx.fillStyle = PALETTE.grassDark;
    ctx.fillRect(ax - 2, y + HOME_ALCOVE.topInset, 2, HOME_ALCOVE.height);
    ctx.fillRect(ax + HOME_ALCOVE.width, y + HOME_ALCOVE.topInset, 2, HOME_ALCOVE.height);
    ctx.fillRect(ax - 2, y + HOME_ALCOVE.topInset, HOME_ALCOVE.width + 4, 2);
  }
}

// Arcade hedge: lime fill + dark diagonal hatch + sparse orange speckles.
function fillHedgeTexture(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  ctx.fillStyle = PALETTE.grass;
  ctx.fillRect(x, y, w, h);

  // Diagonal hatch (\\) every 4px — matches the arcade bush look.
  ctx.fillStyle = PALETTE.grassDark;
  for (let py = 0; py < h; py++) {
    for (let px = ((py * 2) % 4); px < w; px += 4) {
      ctx.fillRect(x + px, y + py, 1, 1);
    }
  }

  // Sparse orange speckles (deterministic so the bank doesn't shimmer).
  ctx.fillStyle = PALETTE.grassSpeck;
  for (let py = 1; py < h - 1; py += 3) {
    for (let px = 2 + ((py * 5) % 7); px < w - 1; px += 7) {
      ctx.fillRect(x + px, y + py, 2, 1);
    }
  }
}

// Median / start strip: magenta bank with arcade-style red/blue pebble texture.
function drawMedianStrip(ctx: CanvasRenderingContext2D, y: number): void {
  const w = COLS * TILE;
  ctx.fillStyle = PALETTE.median;
  ctx.fillRect(0, y, w, TILE);

  // Dense 2×2 pebble grid with alternating red / deep-blue dots (arcade bank).
  const cell = 4;
  for (let py = 1; py < TILE - 1; py += cell) {
    for (let px = 1; px < w - 1; px += cell) {
      const col = (px / cell) | 0;
      const row = (py / cell) | 0;
      const offset = row % 2 === 0 ? 0 : cell / 2;
      const dotX = px + offset;
      if (dotX >= w - 2) continue;
      ctx.fillStyle = (col + row) % 2 === 0 ? PALETTE.medianDot : PALETTE.medianDotAlt;
      ctx.fillRect(dotX, y + py, 2, 2);
    }
  }
}

// Road: black asphalt with subtle dashed lane dividers between adjacent road rows.
function drawRoadRow(ctx: CanvasRenderingContext2D, y: number, row: number): void {
  const w = COLS * TILE;
  ctx.fillStyle = PALETTE.road;
  ctx.fillRect(0, y, w, TILE);

  // Edge bands: darker gray top/bottom 1px so the road is visible against the page bg
  ctx.fillStyle = "#202020";
  ctx.fillRect(0, y, w, 1);
  ctx.fillRect(0, y + TILE - 1, w, 1);

  const isFirstRoadFromTop = row === ROW.ROAD_1;
  if (!isFirstRoadFromTop) {
    drawDashedLine(ctx, y, w);
  }
}

function drawDashedLine(ctx: CanvasRenderingContext2D, y: number, w: number): void {
  ctx.fillStyle = "#404040";
  const dashW = 12;
  const gapW = 8;
  for (let x = 4; x < w; x += dashW + gapW) {
    ctx.fillRect(x, y, Math.min(dashW, w - x), 1);
  }
}
