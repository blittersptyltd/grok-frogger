import { Game, TouchUiElements, isTouchUiPreferred } from "./game/Game";
import {
  enterFullscreen,
  isFullscreenActive,
  isFullscreenSupported,
  isIOSLike,
  isStandaloneDisplay,
  onFullscreenChange,
  toggleFullscreen,
} from "./fullscreen";

const canvas = document.getElementById("game") as HTMLCanvasElement | null;
if (!canvas) throw new Error("#game canvas not found");

const app = document.getElementById("app") as HTMLElement | null;
const bootGate = document.getElementById("boot-gate");
const bootWindowed = document.getElementById("boot-windowed") as HTMLButtonElement | null;
const bootFullscreen = document.getElementById("boot-fullscreen") as HTMLButtonElement | null;
const bootNote = document.getElementById("boot-note");
const fullscreenBtn = document.getElementById("btn-fullscreen") as HTMLButtonElement | null;

document.body.classList.toggle("touch-ui", isTouchUiPreferred());

const touch: TouchUiElements = {
  enabled: isTouchUiPreferred(),
  dpad: document.getElementById("dpad"),
  actionBtn: document.getElementById("btn-action") as HTMLButtonElement | null,
  muteBtn: document.getElementById("btn-mute") as HTMLButtonElement | null,
};

const game = new Game(canvas, touch);
void game.start();

function dismissBootGate(): void {
  if (bootGate) bootGate.hidden = true;
}

function syncFullscreenButton(): void {
  if (!fullscreenBtn) return;
  const active = isFullscreenActive();
  fullscreenBtn.textContent = active ? "EXIT" : "FULL";
  fullscreenBtn.setAttribute("aria-label", active ? "Exit fullscreen" : "Fullscreen");
}

function setupBootGate(): void {
  // Home-screen / installed PWA already feels fullscreen — skip the chooser.
  if (!bootGate || isStandaloneDisplay()) {
    dismissBootGate();
    return;
  }

  const ios = isIOSLike();
  const supported = isFullscreenSupported();

  if (bootNote) {
    if (ios) {
      bootNote.hidden = false;
      bootNote.textContent =
        "iPhone tip: browser fullscreen is limited. For true fullscreen use Share → Add to Home Screen.";
    } else if (!supported) {
      bootNote.hidden = false;
      bootNote.textContent = "Fullscreen is not supported in this browser. Use WINDOWED.";
    } else {
      bootNote.hidden = true;
      bootNote.textContent = "";
    }
  }

  if (bootFullscreen) {
    // Still offer the button on iOS; if the API fails we fall back to windowed.
    bootFullscreen.disabled = !supported && !ios ? true : false;
  }

  bootWindowed?.addEventListener("click", () => {
    dismissBootGate();
  });

  bootFullscreen?.addEventListener("click", async () => {
    const target = app ?? document.documentElement;
    const ok = await enterFullscreen(target);
    dismissBootGate();
    syncFullscreenButton();
    // Resize listeners on Game pick up the new viewport; nudge once more.
    window.dispatchEvent(new Event("resize"));
    if (!ok && bootNote && ios) {
      // Gate is already dismissed; nothing else to do — playfield still fills 100dvh.
      console.info("[frogger] Fullscreen API unavailable; continuing windowed.");
    }
  });
}

setupBootGate();
syncFullscreenButton();

fullscreenBtn?.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  const target = app ?? document.documentElement;
  void toggleFullscreen(target).then(() => {
    syncFullscreenButton();
    window.dispatchEvent(new Event("resize"));
  });
});

onFullscreenChange(() => {
  syncFullscreenButton();
  window.dispatchEvent(new Event("resize"));
});

// Prevent iOS rubber-band scroll while the on-screen pad is active.
document.addEventListener(
  "touchmove",
  (e) => {
    if (document.body.classList.contains("touch-ui")) e.preventDefault();
  },
  { passive: false }
);
