import { Game, TouchUiElements, isTouchUiPreferred } from "./game/Game";
import {
  canUseBrowserFullscreen,
  isFullscreenActive,
  isStandaloneDisplay,
  onFullscreenChange,
  toggleFullscreen,
} from "./fullscreen";
import {
  getDeferredInstallPrompt,
  getInstallGuidance,
  promptInstall,
  setupInstallability,
} from "./install";

const BOOT_SEEN_KEY = "frogger-boot-install-seen";

const canvas = document.getElementById("game") as HTMLCanvasElement | null;
if (!canvas) throw new Error("#game canvas not found");

const app = document.getElementById("app") as HTMLElement | null;
const bootGate = document.getElementById("boot-gate");
const bootLead = document.getElementById("boot-lead");
const bootPrimary = document.getElementById("boot-primary") as HTMLButtonElement | null;
const bootSecondary = document.getElementById("boot-secondary") as HTMLButtonElement | null;
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
void setupInstallability().then(() => {
  // If Android install prompt arrives later, refresh primary label while gate is open.
  if (bootGate && !bootGate.hidden) renderBootCard();
});

const browserFs = canUseBrowserFullscreen();

function hasSeenBoot(): boolean {
  try {
    return localStorage.getItem(BOOT_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function markBootSeen(): void {
  try {
    localStorage.setItem(BOOT_SEEN_KEY, "1");
  } catch {
    // private mode / blocked storage — ignore
  }
}

function dismissBootGate(): void {
  if (bootGate) bootGate.hidden = true;
  markBootSeen();
}

function renderSteps(steps: string[]): void {
  if (!bootHelp || !bootHelpSteps) return;
  bootHelpSteps.replaceChildren(
    ...steps.map((step) => {
      const li = document.createElement("li");
      li.textContent = step;
      return li;
    })
  );
  bootHelp.hidden = steps.length === 0;
}

function renderBootCard(): void {
  const hasNative = Boolean(getDeferredInstallPrompt());
  const guidance = getInstallGuidance(hasNative);

  if (bootLead) bootLead.textContent = guidance.lead;
  renderSteps(guidance.steps);

  // Reason: first-play card always shows the install how-to; primary is "got it"
  // unless Chromium can fire a real install prompt right now.
  if (bootPrimary) {
    // Reason: clear CTA — no "how to" wording; steps below already explain.
    bootPrimary.textContent = "ADD TO HOME SCREEN";
  }
  if (bootSecondary) bootSecondary.textContent = "PLAY IN BROWSER";


  if (fullscreenBtn) {
    fullscreenBtn.hidden = !browserFs;
    syncFullscreenButton();
  }
}

function syncFullscreenButton(): void {
  if (!fullscreenBtn || fullscreenBtn.hidden) return;
  const active = isFullscreenActive();
  fullscreenBtn.textContent = active ? "EXIT" : "FULL";
  fullscreenBtn.setAttribute("aria-label", active ? "Exit fullscreen" : "Fullscreen");
}

async function handlePrimary(): Promise<void> {
  // Android/desktop Chromium: try native install when available.
  if (getDeferredInstallPrompt()) {
    const outcome = await promptInstall();
    if (outcome === "accepted") {
      dismissBootGate();
      return;
    }
    // Dismissed / failed — still let them play.
  }
  dismissBootGate();
}

function openBootCard(): void {
  if (!bootGate) return;
  if (isStandaloneDisplay() || hasSeenBoot()) {
    dismissBootGate();
    // Still mark so we don't leave gate half-open if standalone.
    if (bootGate) bootGate.hidden = true;
    return;
  }
  if (isStandaloneDisplay()) {
    bootGate.hidden = true;
    return;
  }
  renderBootCard();
  bootGate.hidden = false;
}

function setupBootGate(): void {
  if (!bootGate) return;

  if (isStandaloneDisplay()) {
    bootGate.hidden = true;
    return;
  }

  // First browser play: show install instructions expanded.
  openBootCard();

  bootSecondary?.addEventListener("click", () => {
    dismissBootGate();
  });

  bootPrimary?.addEventListener("click", () => {
    void handlePrimary();
  });
}

setupBootGate();
window.addEventListener("frogger-install-available", () => {
  if (bootGate && !bootGate.hidden) renderBootCard();
});
window.addEventListener("frogger-installed", () => {
  dismissBootGate();
});

fullscreenBtn?.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  if (!browserFs) return;
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
