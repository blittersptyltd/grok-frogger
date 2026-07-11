// Home-screen / PWA install helpers.
// Android Chrome can show a native install prompt via beforeinstallprompt.
// iOS has no install API — only Share → Add to Home Screen (we show steps).

import { isInAppBrowser, isIOSLike, isStandaloneDisplay } from "./fullscreen";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let swRegistered = false;

export function getDeferredInstallPrompt(): BeforeInstallPromptEvent | null {
  return deferredPrompt;
}

export function clearDeferredInstallPrompt(): void {
  deferredPrompt = null;
}

/** Register SW (needed for Chromium installability) + capture install prompt. */
export async function setupInstallability(): Promise<void> {
  if (isStandaloneDisplay()) return;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new Event("frogger-install-available"));
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    window.dispatchEvent(new Event("frogger-installed"));
  });

  if (!("serviceWorker" in navigator)) return;
  try {
    // Vite base is /grok-frogger/ on Pages; keep SW + scope under that path.
    const base = import.meta.env.BASE_URL || "/";
    const reg = await navigator.serviceWorker.register(`${base}sw.js`, { scope: base });
    swRegistered = Boolean(reg);
  } catch (err) {
    console.info("[frogger] service worker registration failed", err);
  }
}

export async function promptInstall(): Promise<"accepted" | "dismissed" | "unavailable"> {
  const promptEvent = deferredPrompt;
  if (!promptEvent) return "unavailable";
  try {
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    deferredPrompt = null;
    return choice.outcome;
  } catch {
    return "unavailable";
  }
}

export type InstallGuidance = {
  mode: "standalone" | "native-prompt" | "ios" | "in-app" | "desktop";
  lead: string;
  primaryLabel: string;
  secondaryLabel: string;
  steps: string[];
};

export function getInstallGuidance(hasNativePrompt: boolean): InstallGuidance {
  if (isStandaloneDisplay()) {
    return {
      mode: "standalone",
      lead: "Running as home-screen app.",
      primaryLabel: "PLAY",
      secondaryLabel: "PLAY",
      steps: [],
    };
  }

  if (isInAppBrowser()) {
    return {
      mode: "in-app",
      lead: "Open in Safari first, then add the home-screen icon.",
      primaryLabel: "GOT IT — PLAY",
      secondaryLabel: "PLAY IN BROWSER",
      steps: [
        "In Telegram/etc, tap ⋯ or the Open-in-browser control.",
        "Choose Open in Safari.",
        "In Safari: Share (□↑) → Add to Home Screen → Add.",
        "Open the Frogger icon — no browser bars.",
      ],
    };
  }

  if (isIOSLike()) {
    return {
      mode: "ios",
      lead: "Add Frogger to your Home Screen for true fullscreen.",
      primaryLabel: "GOT IT — PLAY",
      secondaryLabel: "PLAY IN BROWSER",
      steps: [
        "Tap Share (square with ↑) at the bottom of Safari.",
        "Scroll and tap Add to Home Screen.",
        "Tap Add (top right).",
        "Open the new Frogger icon on your Home Screen.",
      ],
    };
  }

  if (hasNativePrompt) {
    return {
      mode: "native-prompt",
      lead: "Install Frogger for a full-screen home-screen icon.",
      primaryLabel: "ADD TO HOME SCREEN",
      secondaryLabel: "PLAY IN BROWSER",
      steps: [],
    };
  }

  return {
    mode: "desktop",
    lead: "Install as an app, or play in this browser window.",
    primaryLabel: "GOT IT — PLAY",
    secondaryLabel: "PLAY IN BROWSER",
    steps: [
      "Chrome/Edge: menu (⋮) → Install app / Cast, save, and share → Install page as app.",
      "Or use the browser address-bar install icon if shown.",
      "On phones: browser menu → Add to Home screen / Install app.",
    ],
  };
}

export function isServiceWorkerRegistered(): boolean {
  return swRegistered;
}
