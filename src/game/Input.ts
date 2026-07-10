import { Direction } from "../types";

const SWIPE_MIN_PX = 28;
const TAP_MAX_PX = 14;

// Captures one-shot directional presses (no key-repeat: must release & re-press).
// Also accepts D-pad presses and canvas swipes. The game polls consumeHop() /
// consumeConfirm() each frame.
export class Input {
  private heldKeys = new Set<string>();
  private queued: Direction | null = null;
  private confirmQueued = false;
  private swipeStart: { x: number; y: number; id: number } | null = null;

  constructor() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", () => this.heldKeys.clear());
  }

  /** Wire canvas swipe + tap-to-confirm. */
  attachSwipeSurface(el: HTMLElement): void {
    el.addEventListener("pointerdown", this.onSwipeDown);
    el.addEventListener("pointerup", this.onSwipeUp);
    el.addEventListener("pointercancel", this.onSwipeCancel);
    // Reason: stop browser pan/zoom from eating hop gestures on the playfield.
    el.style.touchAction = "none";
  }

  /** Wire `[data-dir]` buttons inside a D-pad root. */
  attachDpad(root: HTMLElement): void {
    const setPressed = (btn: HTMLElement, on: boolean): void => {
      btn.classList.toggle("is-pressed", on);
    };

    root.addEventListener("pointerdown", (e) => {
      const target = (e.target as HTMLElement | null)?.closest?.("[data-dir]");
      if (!(target instanceof HTMLElement)) return;
      const dir = target.dataset.dir as Direction | undefined;
      if (!dir || !isDirection(dir)) return;
      e.preventDefault();
      e.stopPropagation();
      setPressed(target, true);
      this.queueHop(dir);
    });

    const clearPressed = (e: PointerEvent): void => {
      const target = (e.target as HTMLElement | null)?.closest?.("[data-dir]");
      if (target instanceof HTMLElement) setPressed(target, false);
    };
    root.addEventListener("pointerup", clearPressed);
    root.addEventListener("pointercancel", clearPressed);
    root.addEventListener("pointerleave", clearPressed);
    root.style.touchAction = "none";
  }

  /** Wire a Start / Continue button. */
  attachConfirmButton(btn: HTMLElement): void {
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      this.queueConfirm();
    });
  }

  queueHop(dir: Direction): void {
    this.queued = dir;
  }

  queueConfirm(): void {
    this.confirmQueued = true;
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.code === "Enter" || e.code === "Space") {
      e.preventDefault();
      this.queueConfirm();
      return;
    }
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

  private onSwipeDown = (e: PointerEvent): void => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    this.swipeStart = { x: e.clientX, y: e.clientY, id: e.pointerId };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Capture can fail on some browsers; swipe still works via up coords.
    }
  };

  private onSwipeUp = (e: PointerEvent): void => {
    if (!this.swipeStart || this.swipeStart.id !== e.pointerId) return;
    const dx = e.clientX - this.swipeStart.x;
    const dy = e.clientY - this.swipeStart.y;
    this.swipeStart = null;

    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const dist = Math.max(absX, absY);

    if (dist < TAP_MAX_PX) {
      // Short tap on the playfield = confirm (start / continue).
      this.queueConfirm();
      return;
    }
    if (dist < SWIPE_MIN_PX) return;

    if (absX > absY) {
      this.queueHop(dx > 0 ? "right" : "left");
    } else {
      this.queueHop(dy > 0 ? "down" : "up");
    }
  };

  private onSwipeCancel = (e: PointerEvent): void => {
    if (this.swipeStart?.id === e.pointerId) this.swipeStart = null;
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

  consumeConfirm(): boolean {
    if (!this.confirmQueued) return false;
    this.confirmQueued = false;
    return true;
  }

  clear(): void {
    this.queued = null;
    this.confirmQueued = false;
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

function isDirection(value: string): value is Direction {
  return value === "up" || value === "down" || value === "left" || value === "right";
}
