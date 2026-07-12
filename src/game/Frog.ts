import { TILE, COLS, Direction } from "../types";
import { ROW, rowY } from "./World";
import { SpriteSheet } from "./Sprites";

const HOP_DURATION = 0.10; // seconds per hop — snappy, arcade-faithful
const HOP_ARC_PX = 0;      // arcade had no arc; tile-stepped slide only
const PLAYFIELD_MIN_ROW = ROW.HOMES;
const PLAYFIELD_MAX_ROW = ROW.START;
const PLAYFIELD_MIN_COL = 0;
const PLAYFIELD_MAX_COL = COLS - 1;

export type DeathKind = "splat" | "drown";

export class Frog {
  // Logical grid position (the frog's "home tile" after the current hop completes)
  col: number;
  row: number;
  facing: Direction = "up";

  private sprites: SpriteSheet;

  // Sub-pixel drift accumulator from riding logs/turtles. Lets the frog hop
  // off a moving platform and land on a clean tile boundary.
  private driftX = 0;

  // Hop animation state
  private hopFrom: { col: number; row: number } | null = null;
  private hopT = 0;

  // Dying animation state. When set, draw() picks death sprites instead of the
  // live frog.
  private dying: { kind: DeathKind; t: number; duration: number } | null = null;

  constructor(col: number, row: number, sprites: SpriteSheet) {
    this.col = col;
    this.row = row;
    this.sprites = sprites;
  }

  reset(col: number, row: number): void {
    this.col = col;
    this.row = row;
    this.facing = "up";
    this.hopFrom = null;
    this.hopT = 0;
    this.driftX = 0;
    this.dying = null;
  }

  startDying(kind: DeathKind, duration: number): void {
    this.dying = { kind, t: 0, duration };
    // Cancel any in-progress hop so the death sprite renders at the current tile.
    this.hopFrom = null;
    this.hopT = 0;
  }

  isDying(): boolean {
    return this.dying !== null;
  }

  // Move continuously by `dx` pixels (used while riding a log/turtle).
  // Drift accumulates sub-tile; the next hop snaps the frog back to the grid.
  drift(dx: number): void {
    this.driftX += dx;
  }

  isHopping(): boolean {
    return this.hopFrom !== null;
  }

  // Logical tile-anchored position (top-left of the frog's destination tile,
  // including any drift from riding a platform). Used for collision so the
  // hitbox commits to the destination the moment a hop starts — matching the
  // arcade behaviour and avoiding visual-vs-logical drift during animation.
  tilePosition(): { x: number; y: number } {
    return { x: this.col * TILE + this.driftX, y: rowY(this.row) };
  }

  tryHop(dir: Direction): void {
    if (this.isHopping()) return;
    // Snap any accumulated drift to the nearest column before hopping so the
    // frog leaves a moving platform on a clean tile boundary.
    this.snapDrift();
    let dCol = 0;
    let dRow = 0;
    switch (dir) {
      case "up":    dRow = -1; break;
      case "down":  dRow =  1; break;
      case "left":  dCol = -1; break;
      case "right": dCol =  1; break;
    }
    const nextCol = this.col + dCol;
    const nextRow = this.row + dRow;
    this.facing = dir;
    if (
      nextCol < PLAYFIELD_MIN_COL ||
      nextCol > PLAYFIELD_MAX_COL ||
      nextRow < PLAYFIELD_MIN_ROW ||
      nextRow > PLAYFIELD_MAX_ROW
    ) {
      // Edge clamp: the frog turns to face but doesn't move.
      return;
    }
    this.hopFrom = { col: this.col, row: this.row };
    this.col = nextCol;
    this.row = nextRow;
    this.hopT = 0;
  }

  private snapDrift(): void {
    if (this.driftX === 0) return;
    const colShift = Math.round(this.driftX / TILE);
    this.col += colShift;
    this.driftX = 0;
  }

  update(dt: number): void {
    if (this.dying) {
      this.dying.t += dt;
      return;
    }
    if (!this.hopFrom) return;
    this.hopT += dt;
    if (this.hopT >= HOP_DURATION) {
      this.hopFrom = null;
      this.hopT = 0;
    }
  }

  // Pixel position (top-left of the frog's tile), accounting for hop tween
  // and any drift carried while riding a platform.
  pixelPosition(): { x: number; y: number; t: number } {
    if (!this.hopFrom) {
      return { x: this.col * TILE + this.driftX, y: rowY(this.row), t: 0 };
    }
    const t = Math.min(1, this.hopT / HOP_DURATION);
    const fromX = this.hopFrom.col * TILE;
    const fromY = rowY(this.hopFrom.row);
    const toX = this.col * TILE;
    const toY = rowY(this.row);
    return {
      x: fromX + (toX - fromX) * t,
      y: fromY + (toY - fromY) * t,
      t,
    };
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.dying) {
      this.drawDying(ctx);
      return;
    }
    const { x, y, t } = this.pixelPosition();
    const arc = t > 0 ? Math.sin(t * Math.PI) * HOP_ARC_PX : 0;
    const isMidHop = t > 0 && t < 1;
    const name = isMidHop ? "frog_hop" : "frog_idle";
    const cx = x + TILE / 2;
    const cy = y + TILE / 2 - arc;
    let rotation = 0;
    switch (this.facing) {
      case "up":    rotation = 0; break;
      case "right": rotation = Math.PI / 2; break;
      case "down":  rotation = Math.PI; break;
      case "left":  rotation = -Math.PI / 2; break;
    }
    // Slightly oversize the visual for mobile readability; collision remains
    // tile-based and arcade-faithful.
    this.sprites.drawCentered(ctx, name, cx, cy, TILE * 1.12, rotation);
  }

  private drawDying(ctx: CanvasRenderingContext2D): void {
    if (!this.dying) return;
    const pos = this.tilePosition();
    const cx = pos.x + TILE / 2;
    const cy = pos.y + TILE / 2;
    const progress = Math.min(1, this.dying.t / this.dying.duration);

    if (this.dying.kind === "splat") {
      // Skull-and-crossbones holds for the full death window. A subtle blink
      // in the last third reads as "you're about to respawn".
      const blink = progress > 0.66 ? Math.floor(this.dying.t * 8) % 2 === 0 : true;
      if (blink) {
        this.sprites.drawCentered(ctx, "frog_squash", cx, cy, TILE);
      }
    } else {
      // Drown: cycle three expanding-ripple frames over the death duration.
      const frameNames: Array<"frog_drown_1" | "frog_drown_2" | "frog_drown_3"> = [
        "frog_drown_1",
        "frog_drown_2",
        "frog_drown_3",
      ];
      const idx = Math.min(2, Math.floor(progress * 3));
      this.sprites.drawCentered(ctx, frameNames[idx], cx, cy, TILE);
    }
  }
}

export const FROG_START_COL = Math.floor(COLS / 2);
export const FROG_START_ROW = ROW.START;
