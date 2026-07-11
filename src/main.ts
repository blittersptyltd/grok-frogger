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

const canvas = document.getElementById("game") as HTMLCanvasElement | null;
if (!canvas) throw new Error("#game canvas not found");

const app = document.getElementById("app") as HTMLElement | null;
const bootGate = document.getElementById("boot-gate");
const bootLead = document.getElementById("boot-lead");
const bootPrimary = document.getElementById("boot-primary") as HTMLButtonElement | null;
const bootSecondary = document.getElementById("boot-secondary") as HTMLButtonElement | null;
const bootHelp = document.getElementById("boot-help");
const bootHelpSteps = document.getElementById("boot-help-steps");
const installBtn = document.getElementById("btn-install") as HTMLButtonElement | null;
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
void setupInstallability().then(() => refreshBootLabels());

const browserFs = canUseBrowserFullscreen();
let helpVisible = false;

function dismissBootGate(): void {
  if (bootGate) bootGate.hidden = true;
  helpVisible = false;
}

function showSteps(steps: string[], lead?: string): void {
  if (!bootHelp || !bootHelpSteps) return;
  bootHelpSteps.replaceChildren(
    ...steps.map((step) => {
      const li = document.createElement("li");
      li.textContent = step;
      return li;
    })
  );
  bootHelp.hidden = steps.length === 0;
  helpVisible = steps.length > 0;
  if (lead && bootLead) bootLead.textContent = lead;
  if (bootPrimary) bootPrimary.textContent = helpVisible ? "GOT IT — PLAY" : bootPrimary.textContent;
}

function refreshBootLabels(): void {
  if (isStandaloneDisplay()) {
    dismissBootGate();
    if (installBtn) installBtn.hidden = true;
    return;
  }

  const guidance = getInstallGuidance(Boolean(getDeferredInstallPrompt()));
  if (bootLead) bootLead.textContent = guidance.lead;
  if (bootPrimary) bootPrimary.textContent = guidance.primaryLabel;
  if (bootSecondary) bootSecondary.textContent = guidance.secondaryLabel;

  if (installBtn) {
    installBtn.hidden = false;
    installBtn.textContent = "ICON";
    installBtn.setAttribute("aria-label", "Add to Home Screen");
  }

  // FULL only useful when browser fullscreen actually hides chrome.
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

async function handleInstallPrimary(): Promise<void> {
  // After steps are shown, primary becomes "GOT IT — PLAY".
  if (helpVisible) {
    dismissBootGate();
    return;
  }

  const guidance = getInstallGuidance(Boolean(getDeferredInstallPrompt()));

  if (guidance.mode === "native-prompt") {
    const outcome = await promptInstall();
    if (outcome === "accepted") {
      dismissBootGate();
      return;
    }
    // Prompt unavailable/dismissed — fall through to manual steps if any.
    if (guidance.steps.length) showSteps(guidance.steps, guidance.lead);
    else dismissBootGate();
    return;
  }

  if (guidance.steps.length) {
    showSteps(guidance.steps, guidance.lead);
    if (bootPrimary) bootPrimary.textContent = "GOT IT — PLAY";
    return;
  }

  // Desktop without deferred prompt: show menu steps.
  if (guidance.mode === "desktop") {
    showSteps(guidance.steps.length ? guidance.steps : [
      "Use your browser menu to Install app / Add to Home screen.",
    ], guidance.lead);
    if (bootPrimary) bootPrimary.textContent = "GOT IT — PLAY";
    return;
  }

  dismissBootGate();
}

function setupBootGate(): void {
  if (!bootGate || isStandaloneDisplay()) {
    dismissBootGate();
    return;
  }

  refreshBootLabels();

  bootSecondary?.addEventListener("click", () => {
    dismissBootGate();
  });

  bootPrimary?.addEventListener("click", () => {
    void handleInstallPrimary();
  });
}

setupBootGate();
window.addEventListener("frogger-install-available", () => refreshBootLabels());
window.addEventListener("frogger-installed", () => {
  dismissBootGate();
  if (installBtn) installBtn.hidden = true;
});

installBtn?.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  if (bootGate) {
    bootGate.hidden = false;
    helpVisible = false;
    if (bootHelp) bootHelp.hidden = true;
    refreshBootLabels();
    void handleInstallPrimary();
  }
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
