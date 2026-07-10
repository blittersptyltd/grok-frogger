import { TILE } from "../types";
import { Obstacle, isLog } from "./Obstacle";
import { Lane } from "./Lane";
import { SpriteSheet } from "./Sprites";
import { ROW } from "./World";
import type { Direction } from "../types";

/**
 * Lady frog rides a random log. Hop onto her to pick her up — she then stays
 * visible with the player frog until delivered home (or the player dies).
 * Snake patrols the median bank as a lethal hazard.
 */
export class Bonuses {
  private sprites: SpriteSheet;
  /** Lady waiting on a log (not yet collected). */
  private ladyOnLog: { host: Obstacle; timer: number } | null = null;
  /** True while the player is carrying the lady frog. */
  private carrying = false;
  private ladyCooldown = 0;
  private snake: Obstacle | null = null;

  constructor(sprites: SpriteSheet) {
    this.sprites = sprites;
  }

  reset(): void {
    this.ladyOnLog = null;
    this.carrying = false;
    // Reason: short initial delay so lady appears early in a life.
    this.ladyCooldown = 1.5;
    this.snake = null;
  }

  /** Drop carried lady without scoring (death / life reset). */
  dropLady(): void {
    if (this.carrying) {
      this.carrying = false;
      this.ladyCooldown = 2 + Math.random() * 3;
    }
  }

  isCarryingLady(): boolean {
    return this.carrying;
  }

  /**
   * Deliver lady at home: clears carry state and returns true if she was carried
   * (caller awards bonus).
   */
  deliverLady(): boolean {
    if (!this.carrying) return false;
    this.carrying = false;
    this.ladyCooldown = 3 + Math.random() * 4;
    return true;
  }

  ensureSnake(enabled: boolean, speed: number): void {
    if (!enabled) {
      this.snake = null;
      return;
    }
    if (!this.snake) {
      const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
      const startX = dir === 1 ? -TILE * 2 : 14 * TILE;
      this.snake = new Obstacle(startX, ROW.MEDIAN, dir, speed, "snake", this.sprites);
    }
  }

  update(
    dt: number,
    riverLanes: Lane[],
    opts: { ladyEnabled: boolean; ladyDuration: number; snakeEnabled: boolean; snakeSpeed: number }
  ): void {
    this.ensureSnake(opts.snakeEnabled, opts.snakeSpeed);
    if (this.snake) {
      this.snake.update(dt);
      if (this.snake.isOffscreen()) {
        const dir = this.snake.direction;
        const startX = dir === 1 ? -TILE * 2 : 14 * TILE;
        this.snake = new Obstacle(startX, ROW.MEDIAN, dir, opts.snakeSpeed, "snake", this.sprites);
      }
    }

    if (!opts.ladyEnabled) {
      this.ladyOnLog = null;
      // Keep carrying across feature flag only if already held this life.
      return;
    }

    // While carrying, don't spawn another lady on a log.
    if (this.carrying) {
      this.ladyOnLog = null;
      return;
    }

    if (this.ladyOnLog) {
      this.ladyOnLog.timer -= dt;
      if (
        this.ladyOnLog.timer <= 0 ||
        this.ladyOnLog.host.isOffscreen() ||
        !isLog(this.ladyOnLog.host.kind)
      ) {
        this.ladyOnLog = null;
        this.ladyCooldown = 2 + Math.random() * 3;
      }
      return;
    }

    this.ladyCooldown -= dt;
    if (this.ladyCooldown > 0) return;

    const hosts: Obstacle[] = [];
    for (const lane of riverLanes) {
      const host = lane.findLogHost();
      if (host) hosts.push(host);
    }
    if (hosts.length === 0) {
      this.ladyCooldown = 0.5;
      return;
    }
    const host = hosts[Math.floor(Math.random() * hosts.length)];
    this.ladyOnLog = { host, timer: opts.ladyDuration };
  }

  /**
   * Pick up lady if frog overlaps her on a log. She stays with the player
   * (does not disappear). Returns true on first pickup.
   */
  tryCollectLady(frogHitbox: { x: number; y: number; w: number; h: number }): boolean {
    if (this.carrying || !this.ladyOnLog) return false;
    const host = this.ladyOnLog.host;
    const lx = host.x + host.width / 2 - TILE / 2;
    const ly = host.row * TILE;
    const overlap =
      frogHitbox.x < lx + TILE &&
      frogHitbox.x + frogHitbox.w > lx &&
      frogHitbox.y < ly + TILE &&
      frogHitbox.y + frogHitbox.h > ly;
    if (!overlap) return false;
    this.ladyOnLog = null;
    this.carrying = true;
    return true;
  }

  snakeLethalBounds(): { x: number; y: number; w: number; h: number } | null {
    return this.snake?.lethalBounds() ?? null;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    frogDraw?: { x: number; y: number; facing: Direction } | null
  ): void {
    if (this.snake) this.snake.draw(ctx);

    if (this.carrying && frogDraw) {
      // Reason: arcade lady rides beside/on the player until home delivery.
      const offset = TILE * 0.35;
      let lx = frogDraw.x;
      let ly = frogDraw.y;
      switch (frogDraw.facing) {
        case "up":
          lx += offset;
          break;
        case "down":
          lx -= offset;
          break;
        case "left":
          ly -= offset;
          break;
        case "right":
          ly += offset;
          break;
      }
      this.sprites.drawCentered(ctx, "lady_frog", lx, ly, TILE * 0.75);
      return;
    }

    if (this.ladyOnLog) {
      const host = this.ladyOnLog.host;
      const cx = host.x + host.width / 2;
      const cy = host.row * TILE + TILE / 2;
      this.sprites.drawCentered(ctx, "lady_frog", cx, cy, TILE * 0.85);
    }
  }
}
