import { TILE, COLS } from "../types";
import { SpriteSheet, SpriteName } from "./Sprites";
import { rowContentY } from "./World";

export type ObstacleKind =
  | "car_yellow"
  | "car_purple"
  | "car_white"
  | "car_green"
  | "truck"
  | "log_short"
  | "log_med"
  | "log_long"
  | "turtle_pair"
  | "turtle_trio"
  | "croc"
  | "snake";

// All sprites are sourced from 16×16 cells in sheet-v2 and rendered at 2×.
const KIND_WIDTHS: Record<ObstacleKind, number> = {
  car_yellow: TILE,
  car_white: TILE,
  truck: TILE * 2,
  car_purple: TILE,
  car_green: TILE,
  log_short: TILE * 3,
  log_med: TILE * 4,
  log_long: TILE * 5,
  turtle_pair: TILE * 2,
  turtle_trio: TILE * 3,
  croc: TILE * 3, // full-body river croc (~46px source × ~2)
  snake: TILE * 2,
};

export function isLog(kind: ObstacleKind): boolean {
  return kind === "log_short" || kind === "log_med" || kind === "log_long";
}

export function isTurtle(kind: ObstacleKind): boolean {
  return kind === "turtle_pair" || kind === "turtle_trio";
}

// Rideable when the frog can stand on it. Diving turtles are rideable only
// while surfaced; crocs are rideable on the body but kill on the head.
export function isPotentiallyRideable(kind: ObstacleKind): boolean {
  return isLog(kind) || isTurtle(kind) || kind === "croc";
}

const VEHICLE_SPRITE: Partial<Record<ObstacleKind, SpriteName>> = {
  car_yellow: "car_yellow",
  car_purple: "car_purple",
  car_white: "car_white",
  car_green: "car_green",
  truck: "truck",
};

const VEHICLE_NATURAL_DIR: Partial<Record<ObstacleKind, 1 | -1>> = {
  car_yellow: -1,
  car_white: 1,
  truck: -1,
  car_purple: -1,
  car_green: 1,
};

const LOG_SRC_Y = 2;
const LOG_SRC_H = 10;
const LOG_SCALE = 2;
const LOG_SECTION_W = 16 * LOG_SCALE;
const LOG_HEIGHT = 24;
const LOG_Y_OFFSET = (TILE - LOG_HEIGHT) / 2;
const LOG_SEAM_OVERLAP = 4;

// Diving turtle cycle (seconds): surface → dive → submerged → rise.
const DIVE_SURFACE = 2.4;
const DIVE_DIVING = 0.55;
const DIVE_UNDER = 1.6;
const DIVE_RISING = 0.55;
const DIVE_CYCLE = DIVE_SURFACE + DIVE_DIVING + DIVE_UNDER + DIVE_RISING;

export type DivePhase = "surface" | "diving" | "under" | "rising";

export class Obstacle {
  x: number;
  readonly row: number;
  readonly direction: 1 | -1;
  readonly speed: number;
  readonly kind: ObstacleKind;
  readonly width: number;
  private sprites: SpriteSheet | null;
  /** Phase offset so neighbouring turtle groups don't dive in sync. */
  private diveOffset: number;
  private diveEnabled: boolean;

  constructor(
    x: number,
    row: number,
    direction: 1 | -1,
    speed: number,
    kind: ObstacleKind,
    sprites: SpriteSheet | null = null,
    options: { dive?: boolean; diveOffset?: number } = {}
  ) {
    this.x = x;
    this.row = row;
    this.direction = direction;
    this.speed = speed;
    this.kind = kind;
    this.width = KIND_WIDTHS[kind];
    this.sprites = sprites;
    this.diveEnabled = Boolean(options.dive && isTurtle(kind));
    this.diveOffset = options.diveOffset ?? Math.random() * DIVE_CYCLE;
  }

  update(dt: number): void {
    this.x += this.direction * this.speed * dt;
    if (this.diveEnabled) this.diveOffset = (this.diveOffset + dt) % DIVE_CYCLE;
  }

  isOffscreen(): boolean {
    if (this.direction === 1) return this.x > COLS * TILE + 4;
    return this.x + this.width < -4;
  }

  bounds(): { x: number; y: number; w: number; h: number } {
    return { x: this.x, y: rowContentY(this.row), w: this.width, h: TILE };
  }

  divePhase(): DivePhase {
    if (!this.diveEnabled) return "surface";
    const t = this.diveOffset;
    if (t < DIVE_SURFACE) return "surface";
    if (t < DIVE_SURFACE + DIVE_DIVING) return "diving";
    if (t < DIVE_SURFACE + DIVE_DIVING + DIVE_UNDER) return "under";
    return "rising";
  }

  /** True when the frog can stand on this obstacle right now. */
  isRideableNow(): boolean {
    if (isLog(this.kind) || this.kind === "croc") return true;
    if (isTurtle(this.kind)) {
      const phase = this.divePhase();
      return phase === "surface" || phase === "diving" || phase === "rising";
    }
    return false;
  }

  /**
   * Croc head kill zone (front ~TILE of the full-body sprite in travel direction).
   * Snake is fully lethal. Returns null if not a lethal hazard.
   */
  lethalBounds(): { x: number; y: number; w: number; h: number } | null {
    if (this.kind === "croc") {
      const b = this.bounds();
      // Mouth is on the leading (right) end of the body sprite.
      if (this.direction === 1) {
        return { x: b.x + b.w - TILE, y: b.y, w: TILE, h: b.h };
      }
      return { x: b.x, y: b.y, w: TILE, h: b.h };
    }
    if (this.kind === "snake") return this.bounds();
    return null;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.sprites?.isReady()) return;
    const { x, y, w, h } = this.bounds();

    if (isLog(this.kind)) {
      this.drawLog(ctx, x, y, w);
    } else if (isTurtle(this.kind)) {
      this.drawTurtles(ctx, x, y);
    } else if (this.kind === "croc") {
      // Full-body river croc faces right natively; animate its mouth while the
      // body stays rideable. lethalBounds() covers only the leading mouth tile.
      const flip = this.direction === -1;
      const frame = Math.floor(performance.now() / 240) % 2 === 0
        ? "croc_body_closed"
        : "croc_body_open";
      this.sprites.drawStretched(ctx, frame, x, y + 1, w, h - 2, flip);
    } else if (this.kind === "snake") {
      const frames: Array<"snake_a" | "snake_b" | "snake_c"> = [
        "snake_a",
        "snake_b",
        "snake_c",
        "snake_b",
      ];
      const frame = frames[Math.floor(performance.now() / 160) % frames.length];
      const flip = this.direction === 1; // snakes face left natively
      this.sprites.drawStretched(ctx, frame, x, y + 8, w, TILE - 10, flip);
    } else {
      const spriteName = VEHICLE_SPRITE[this.kind];
      if (spriteName) {
        const naturalDir = VEHICLE_NATURAL_DIR[this.kind] ?? 1;
        const flip = this.direction !== naturalDir;
        const visualW = w * 1.08;
        const visualH = h * 1.12;
        this.sprites.drawStretched(
          ctx,
          spriteName,
          x - (visualW - w) / 2,
          y - (visualH - h) / 2,
          visualW,
          visualH,
          flip
        );
      }
    }
  }

  private drawLog(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
    const sectionW = LOG_SECTION_W;
    const sectionH = LOG_HEIGHT;
    const dy = y + LOG_Y_OFFSET;
    const step = sectionW - LOG_SEAM_OVERLAP;
    const drawSeg = (name: "log_l" | "log_m" | "log_r", dx: number): void => {
      this.sprites!.drawCropped(ctx, name, 0, LOG_SRC_Y, 16, LOG_SRC_H, dx, dy, sectionW, sectionH);
    };
    drawSeg("log_l", x);
    const middleEnd = x + w - sectionW + LOG_SEAM_OVERLAP;
    for (let mx = x + step; mx < middleEnd; mx += step) {
      drawSeg("log_m", mx);
    }
    drawSeg("log_r", x + w - sectionW);
  }

  private drawTurtles(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const count = this.kind === "turtle_trio" ? 3 : 2;
    const slotW = TILE;
    const phase = this.divePhase();
    const flip = this.direction === 1;

    let frame: SpriteName;
    if (phase === "under") {
      frame = "turtle_submerged";
    } else if (phase === "diving" || phase === "rising") {
      frame = "turtle_dive";
    } else {
      const FRAMES: Array<"turtle_a" | "turtle_b" | "turtle_c"> = [
        "turtle_a",
        "turtle_b",
        "turtle_c",
        "turtle_b",
      ];
      frame = FRAMES[Math.floor(performance.now() / 180) % FRAMES.length];
    }

    for (let i = 0; i < count; i++) {
      const dx = x + slotW * i;
      // Fully submerged: draw a faint ripple only (still visible as a hint).
      if (phase === "under") {
        this.sprites!.drawStretched(ctx, frame, dx + 4, y + 10, slotW - 8, TILE - 16, flip);
      } else {
        this.sprites!.drawStretched(ctx, frame, dx - 2, y - 2, slotW + 4, TILE + 4, flip);
      }
    }
  }
}
