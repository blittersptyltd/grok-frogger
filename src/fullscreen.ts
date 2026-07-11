// Fullscreen helpers for browser + mobile.
// Reason: requestFullscreen must run inside a user gesture. iOS Safari and
// in-app browsers (Telegram etc.) usually cannot hide browser chrome for a
// canvas game — true fullscreen there means "Add to Home Screen" / open in Safari.

export function isIOSLike(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iOSDevice = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ can report as Mac; touch points spot it.
  const iPadOsDesktopUa =
    navigator.platform === "MacIntel" && (navigator.maxTouchPoints || 0) > 1;
  return iOSDevice || iPadOsDesktopUa;
}

export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const w = window as Window & { TelegramWebviewProxy?: unknown };
  return Boolean(
    w.TelegramWebviewProxy ||
      /Telegram/i.test(ua) ||
      /FBAN|FBAV|FB_IAB|FBIOS/i.test(ua) ||
      /Instagram/i.test(ua) ||
      /Line\//i.test(ua) ||
      /Twitter/i.test(ua) ||
      /LinkedInApp/i.test(ua) ||
      /Snapchat/i.test(ua) ||
      /GSA\//i.test(ua) || // Google Search app webview
      (/Android/i.test(ua) && /\bwv\b/.test(ua))
  );
}

export function isStandaloneDisplay(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    // iOS legacy standalone flag when launched from home screen.
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export function isFullscreenApiPresent(): boolean {
  const el = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
    webkitRequestFullScreen?: () => Promise<void> | void;
  };
  return Boolean(
    document.fullscreenEnabled ||
      (document as Document & { webkitFullscreenEnabled?: boolean }).webkitFullscreenEnabled ||
      el.requestFullscreen ||
      el.webkitRequestFullscreen ||
      el.webkitRequestFullScreen
  );
}

/** True only when browser fullscreen is likely to hide chrome. */
export function canUseBrowserFullscreen(): boolean {
  // iOS + in-app browsers almost never hide their UI for non-video elements.
  if (isIOSLike() || isInAppBrowser()) return false;
  return isFullscreenApiPresent();
}

export function isFullscreenActive(): boolean {
  const doc = document as Document & { webkitFullscreenElement?: Element | null };
  return Boolean(document.fullscreenElement || doc.webkitFullscreenElement);
}

export async function enterFullscreen(target: HTMLElement = document.documentElement): Promise<boolean> {
  if (isFullscreenActive()) return true;
  if (!canUseBrowserFullscreen()) return false;

  const el = target as HTMLElement & {
    requestFullscreen?: (opts?: FullscreenOptions) => Promise<void>;
    webkitRequestFullscreen?: () => Promise<void> | void;
    webkitRequestFullScreen?: () => Promise<void> | void;
  };

  try {
    if (el.requestFullscreen) {
      await el.requestFullscreen({ navigationUI: "hide" });
      return isFullscreenActive();
    }
    if (el.webkitRequestFullscreen) {
      await Promise.resolve(el.webkitRequestFullscreen());
      return isFullscreenActive();
    }
    if (el.webkitRequestFullScreen) {
      await Promise.resolve(el.webkitRequestFullScreen());
      return isFullscreenActive();
    }
  } catch {
    return false;
  }
  return false;
}

export async function exitFullscreen(): Promise<void> {
  if (!isFullscreenActive()) return;
  const doc = document as Document & {
    exitFullscreen?: () => Promise<void>;
    webkitExitFullscreen?: () => Promise<void> | void;
    webkitCancelFullScreen?: () => Promise<void> | void;
  };
  try {
    if (doc.exitFullscreen) await doc.exitFullscreen();
    else if (doc.webkitExitFullscreen) await Promise.resolve(doc.webkitExitFullscreen());
    else if (doc.webkitCancelFullScreen) await Promise.resolve(doc.webkitCancelFullScreen());
  } catch {
    // Ignore exit failures.
  }
}

export async function toggleFullscreen(target: HTMLElement = document.documentElement): Promise<boolean> {
  if (isFullscreenActive()) {
    await exitFullscreen();
    return false;
  }
  return enterFullscreen(target);
}

export function onFullscreenChange(cb: () => void): () => void {
  const handler = (): void => cb();
  document.addEventListener("fullscreenchange", handler);
  document.addEventListener("webkitfullscreenchange", handler);
  return () => {
    document.removeEventListener("fullscreenchange", handler);
    document.removeEventListener("webkitfullscreenchange", handler);
  };
}

export type FullscreenHelp = {
  lead: string;
  steps: string[];
  secondaryLabel: string;
};

export function getMobileFullscreenHelp(): FullscreenHelp {
  if (isInAppBrowser()) {
    return {
      lead: "This in-app browser (e.g. Telegram) cannot hide its bars.",
      steps: [
        "Tap the ⋯ or Open-in-browser control (bottom of Telegram).",
        "Choose Open in Safari (or Chrome).",
        "In Safari: Share → Add to Home Screen.",
        "Open the Frogger icon from your home screen — no browser chrome.",
      ],
      secondaryLabel: "HOW TO GO FULL SCREEN",
    };
  }
  if (isIOSLike()) {
    return {
      lead: "iPhone browsers can’t hide their UI for games.",
      steps: [
        "Tap Share (square with ↑).",
        "Tap Add to Home Screen → Add.",
        "Open Frogger from your home screen icon.",
        "That launches without Safari’s bars — true fullscreen.",
      ],
      secondaryLabel: "HOW TO GO FULL SCREEN",
    };
  }
  return {
    lead: "Use browser fullscreen, or install as an app.",
    steps: [
      "Tap FULLSCREEN below if your browser supports it.",
      "Or use your browser menu → Install app / Add to Home screen.",
    ],
    secondaryLabel: "FULLSCREEN",
  };
}
