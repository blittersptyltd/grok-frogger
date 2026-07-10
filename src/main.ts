import { Game, TouchUiElements, isTouchUiPreferred } from "./game/Game";

const canvas = document.getElementById("game") as HTMLCanvasElement | null;
if (!canvas) throw new Error("#game canvas not found");

document.body.classList.toggle("touch-ui", isTouchUiPreferred());

const touch: TouchUiElements = {
  enabled: isTouchUiPreferred(),
  dpad: document.getElementById("dpad"),
  actionBtn: document.getElementById("btn-action") as HTMLButtonElement | null,
  muteBtn: document.getElementById("btn-mute") as HTMLButtonElement | null,
};

const game = new Game(canvas, touch);
void game.start();

// Prevent iOS rubber-band scroll while the on-screen pad is active.
document.addEventListener(
  "touchmove",
  (e) => {
    if (document.body.classList.contains("touch-ui")) e.preventDefault();
  },
  { passive: false }
);
