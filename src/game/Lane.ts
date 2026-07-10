import { TILE, COLS } from "../types";
import { Obstacle, ObstacleKind, isLog } from "./Obstacle";
import { SpriteSheet } from "./Sprites";

export interface LaneConfig {
  row: number;
  direction: 1 | -1;
  speed: number;
  kind: ObstacleKind;
  // Average pixel gap between successive obstacles. Spawning is deterministic
  // off this gap so traffic stays in a steady rhythm (no gaps so big the lane
  // is empty, no spawns so dense the lane is impassable).
  spacing: number;
  /** Chance (0..1) a turtle group dives; rest stay surface-only. */
  diveChance?: number;
  /** Chance (0..1) a log_long spawn is replaced by a crocodile. */
  crocChance?: number;
}

export class Lane {
  readonly cfg: LaneConfig;
  readonly obstacles: Obstacle[] = [];
  private sprites: SpriteSheet | null;

  constructor(cfg: LaneConfig, sprites: SpriteSheet | null = null) {
    this.cfg = cfg;
    this.sprites = sprites;
    const screenW = COLS * TILE;
    const startEdge = cfg.direction === 1 ? -cfg.spacing : screenW;
    for (let i = 0; i < Math.ceil(screenW / cfg.spacing) + 1; i++) {
      const x = startEdge + i * cfg.direction * cfg.spacing;
      this.obstacles.push(this.makeObstacle(x));
    }
  }

  update(dt: number): void {
    for (const o of this.obstacles) o.update(dt);

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      if (this.obstacles[i].isOffscreen()) this.obstacles.splice(i, 1);
    }

    const screenW = COLS * TILE;
    const lastObstacle = this.lastObstacleInDirection();
    if (!lastObstacle) {
      this.spawn(this.cfg.direction === 1 ? -this.cfg.spacing : screenW);
      return;
    }

    const entryEdge = this.cfg.direction === 1 ? -lastObstacle.width : screenW;
    const distFromEntry =
      this.cfg.direction === 1 ? lastObstacle.x - entryEdge : entryEdge - lastObstacle.x;
    if (distFromEntry >= this.cfg.spacing) {
      this.spawn(entryEdge);
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const o of this.obstacles) o.draw(ctx);
  }

  private lastObstacleInDirection(): Obstacle | undefined {
    if (this.obstacles.length === 0) return undefined;
    if (this.cfg.direction === 1) {
      return this.obstacles.reduce((min, o) => (o.x < min.x ? o : min));
    }
    return this.obstacles.reduce((max, o) => (o.x > max.x ? o : max));
  }

  private spawn(x: number): void {
    this.obstacles.push(this.makeObstacle(x));
  }

  private makeObstacle(x: number): Obstacle {
    let kind = this.cfg.kind;
    // Reason: occasionally swap a long log for a croc once unlocked by level.
    if (
      kind === "log_long" &&
      (this.cfg.crocChance ?? 0) > 0 &&
      Math.random() < (this.cfg.crocChance ?? 0)
    ) {
      kind = "croc";
    }
    // Reason: only a fraction of turtle groups dive — keeps river readable.
    const isTurtle = kind === "turtle_pair" || kind === "turtle_trio";
    const dive =
      isTurtle && (this.cfg.diveChance ?? 0) > 0 && Math.random() < (this.cfg.diveChance ?? 0);
    return new Obstacle(x, this.cfg.row, this.cfg.direction, this.cfg.speed, kind, this.sprites, {
      dive,
      diveOffset: Math.random() * 5,
    });
  }

  /** First rideable log currently on-screen (for lady-frog placement). */
  findLogHost(): Obstacle | null {
    for (const o of this.obstacles) {
      if (isLog(o.kind) && !o.isOffscreen()) return o;
    }
    return null;
  }
}
