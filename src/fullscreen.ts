// Fullscreen helpers for browser + mobile.
// Reason: requestFullscreen must run inside a user gesture; iOS Safari often
// rejects non-video fullscreen, so callers always get a boolean + graceful fallback.

export function isIOSLike(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iOSDevice = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ can report as Mac; coarse pointer + touch spots it.
  const iPadOsDesktopUa =
    navigator.platform === "MacIntel" && (navigator.maxTouchPoints || 0) > 1;
  return iOSDevice || iPadOsDesktopUa;
}

export function isStandaloneDisplay(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    // iOS legacy standalone flag when launched from home screen.
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export function isFullscreenSupported(): boolean {
  const el = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void> | void;
    webkitRequestFullScreen?: () => Promise<void> | void;
  };
  return Boolean(
    document.fullscreenEnabled ||
      // Safari
      (document as Document & { webkitFullscreenEnabled?: boolean }).webkitFullscreenEnabled ||
      el.requestFullscreen ||
      el.webkitRequestFullscreen ||
      el.webkitRequestFullScreen
  );
}

export function isFullscreenActive(): boolean {
  const doc = document as Document & { webkitFullscreenElement?: Element | null };
  return Boolean(document.fullscreenElement || doc.webkitFullscreenElement);
}

export async function enterFullscreen(target: HTMLElement = document.documentElement): Promise<boolean> {
  if (isFullscreenActive()) return true;

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
    // User denied, policy block, or iOS limitation.
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
