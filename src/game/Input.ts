import { Direction } from "../types";

// Captures one-shot directional presses (no key-repeat: must release & re-press).
// The game polls consumeHop() each frame and acts on a single queued direction.
export class Input {
  private heldKeys = new Set<string>();
  private queued: Direction | null = null;

  constructor() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", () => this.heldKeys.clear());
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    const dir = directionFor(e.code);
    if (!dir) return;
    e.preventDefault();
    if (this.heldKeys.has(e.code)) return; // ignore auto-repeat
    this.heldKeys.add(e.code);
    this.queued = dir;
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.heldKeys.delete(e.code);
  };

  // Returns the buffered direction without clearing it. Use this when the frog
  // is currently mid-hop — we want the input to stay queued until it can fire.
  peek(): Direction | null {
    return this.queued;
  }

  consumeHop(): Direction | null {
    const dir = this.queued;
    this.queued = null;
    return dir;
  }

  clear(): void {
    this.queued = null;
  }
}

function directionFor(code: string): Direction | null {
  switch (code) {
    case "ArrowUp":
    case "KeyW":
      return "up";
    case "ArrowDown":
    case "KeyS":
      return "down";
    case "ArrowLeft":
    case "KeyA":
      return "left";
    case "ArrowRight":
    case "KeyD":
      return "right";
    default:
      return null;
  }
}
