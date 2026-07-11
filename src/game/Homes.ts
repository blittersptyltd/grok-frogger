import { TILE } from "../types";
import { ROW, HOME_ALCOVE, homeAlcoveX } from "./World";
import { SpriteSheet } from "./Sprites";

const ALCOVE_HIT_PADDING = 4;
const FILLED_FROG_Y_OFFSET = 5;

type HomeOccupant = "fly" | "croc" | null;

export class Homes {
  private filled: boolean[];
  private sprites: SpriteSheet;
  /** Occupant of each empty alcove (fly bonus or lethal croc head). */
  private occupants: HomeOccupant[];
  private relocateTimer = 0;
  private relocateInterval = 7;
  private flyEnabled = false;
  private crocEnabled = false;

  constructor(sprites: SpriteSheet) {
    this.sprites = sprites;
    this.filled = new Array(HOME_ALCOVE.count).fill(false);
    this.occupants = new Array(HOME_ALCOVE.count).fill(null);
  }

  reset(): void {
    this.filled.fill(false);
    this.occupants.fill(null);
    this.relocateTimer = 0;
  }

  setBonuses(opts: { fly: boolean; crocHead: boolean; intervalSec: number }): void {
    this.flyEnabled = opts.fly;
    this.crocEnabled = opts.crocHead;
    this.relocateInterval = opts.intervalSec;
    if (!opts.fly && !opts.crocHead) {
      this.occupants.fill(null);
      this.relocateTimer = 0;
    } else if (!this.occupants.some(Boolean)) {
      this.relocateOccupants();
    }
  }

  filledCount(): number {
    return this.filled.filter(Boolean).length;
  }

  allFilled(): boolean {
    return this.filled.every(Boolean);
  }

  emptySlots(): number[] {
    const out: number[] = [];
    for (let i = 0; i < HOME_ALCOVE.count; i++) {
      if (!this.filled[i]) out.push(i);
    }
    return out;
  }

  update(dt: number): void {
    if (!this.flyEnabled && !this.crocEnabled) return;
    this.relocateTimer += dt;
    if (this.relocateTimer >= this.relocateInterval) {
      this.relocateTimer = 0;
      this.relocateOccupants();
    }
    // Clear occupants from filled slots.
    for (let i = 0; i < HOME_ALCOVE.count; i++) {
      if (this.filled[i]) this.occupants[i] = null;
    }
  }

  private relocateOccupants(): void {
    this.occupants.fill(null);
    const empty = this.emptySlots();
    if (empty.length === 0) return;

    // Shuffle empty slots.
    for (let i = empty.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [empty[i], empty[j]] = [empty[j], empty[i]];
    }

    let next = 0;
    // Reason: fly and croc head never share a slot; arcade shows one hazard/bonus at a time per bay.
    if (this.flyEnabled && next < empty.length) {
      this.occupants[empty[next++]] = "fly";
    }
    if (this.crocEnabled && next < empty.length) {
      this.occupants[empty[next++]] = "croc";
    }
  }

  // Tries to seat the frog. Croc head = death. Fly = bonus. Empty = seat.
  tryFill(frogTileX: number): { slot: number; flyBonus: boolean } | "death" {
    const cx = frogTileX + TILE / 2;
    for (let i = 0; i < HOME_ALCOVE.count; i++) {
      const ax = homeAlcoveX(i);
      const left = ax - ALCOVE_HIT_PADDING;
      const right = ax + HOME_ALCOVE.width + ALCOVE_HIT_PADDING;
      if (cx >= left && cx <= right) {
        if (this.filled[i]) return "death";
        if (this.occupants[i] === "croc") return "death";
        const flyBonus = this.occupants[i] === "fly";
        this.filled[i] = true;
        this.occupants[i] = null;
        return { slot: i, flyBonus };
      }
    }
    return "death";
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const y = ROW.HOMES * TILE;
    for (let i = 0; i < HOME_ALCOVE.count; i++) {
      const ax = homeAlcoveX(i);
      const cx = ax + HOME_ALCOVE.width / 2;
      const cy = y + HOME_ALCOVE.topInset + HOME_ALCOVE.height / 2 + 2;

      if (this.filled[i]) {
        // Reason: seat the frog lower in the bay so its head clears the top hedge.
        this.sprites.drawCentered(
          ctx,
          "frog_in_home",
          cx,
          cy + FILLED_FROG_Y_OFFSET,
          TILE * 0.9
        );
      } else if (this.occupants[i] === "fly") {
        const flyY = y + HOME_ALCOVE.topInset + HOME_ALCOVE.height * 0.45;
        this.sprites.drawCentered(ctx, "bonus_fly", cx, flyY, TILE * 0.55);
      } else if (this.occupants[i] === "croc") {
        // Head-only hazard sits in the alcove mouth.
        this.sprites.drawCentered(ctx, "croc_head", cx, cy, TILE * 0.95);
      }
    }
  }
}
