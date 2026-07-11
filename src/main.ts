import { Game, TouchUiElements, isTouchUiPreferred } from "./game/Game";
import {
  canUseBrowserFullscreen,
  enterFullscreen,
  getMobileFullscreenHelp,
  isFullscreenActive,
  isInAppBrowser,
  isIOSLike,
  isStandaloneDisplay,
  onFullscreenChange,
  toggleFullscreen,
} from "./fullscreen";

const canvas = document.getElementById("game") as HTMLCanvasElement | null;
if (!canvas) throw new Error("#game canvas not found");

const app = document.getElementById("app") as HTMLElement | null;
const bootGate = document.getElementById("boot-gate");
const bootLead = document.getElementById("boot-lead");
const bootWindowed = document.getElementById("boot-windowed") as HTMLButtonElement | null;
const bootFullscreen = document.getElementById("boot-fullscreen") as HTMLButtonElement | null;
const bootHelp = document.getElementById("boot-help");
const bootHelpSteps = document.getElementById("boot-help-steps");
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

const browserFs = canUseBrowserFullscreen();
const needsInstallPath = isIOSLike() || isInAppBrowser();

function dismissBootGate(): void {
  if (bootGate) bootGate.hidden = true;
}

function showHelp(): void {
  if (!bootHelp || !bootHelpSteps) return;
  const help = getMobileFullscreenHelp();
  bootHelpSteps.replaceChildren(
    ...help.steps.map((step) => {
      const li = document.createElement("li");
      li.textContent = step;
      return li;
    })
  );
  bootHelp.hidden = false;
  if (bootLead) bootLead.textContent = help.lead;
  if (bootFullscreen) bootFullscreen.textContent = "GOT IT — PLAY";
}

function syncFullscreenButton(): void {
  if (!fullscreenBtn) return;
  if (needsInstallPath) {
    // Reason: iOS / Telegram cannot hide chrome; repurpose as a tip launcher.
    fullscreenBtn.textContent = "TIP";
    fullscreenBtn.setAttribute("aria-label", "How to go full screen");
    return;
  }
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

  const help = getMobileFullscreenHelp();
  if (bootLead) {
    bootLead.textContent = needsInstallPath
      ? help.lead
      : "Choose display mode";
  }
  if (bootFullscreen) {
    bootFullscreen.textContent = needsInstallPath ? help.secondaryLabel : "FULLSCREEN";
  }

  bootWindowed?.addEventListener("click", () => {
    dismissBootGate();
  });

  bootFullscreen?.addEventListener("click", async () => {
    // Second press after showing help = just play.
    if (bootHelp && !bootHelp.hidden) {
      dismissBootGate();
      return;
    }

    if (browserFs) {
      const target = app ?? document.documentElement;
      await enterFullscreen(target);
      dismissBootGate();
      syncFullscreenButton();
      window.dispatchEvent(new Event("resize"));
      return;
    }

    // iOS / in-app: explain the real path instead of a no-op API call.
    showHelp();
  });
}

setupBootGate();
syncFullscreenButton();

fullscreenBtn?.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  if (needsInstallPath) {
    // Re-open the boot gate with install instructions mid-session.
    if (bootGate) {
      bootGate.hidden = false;
      showHelp();
    }
    return;
  }
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
