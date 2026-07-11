/* Minimal service worker so Chromium can offer "Install app" / Add to Home Screen.
   Network-first passthrough — no offline cache complexity for v1. */
const VERSION = "frogger-sw-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(Promise.resolve(VERSION));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Reason: Chrome installability still expects a fetch handler.
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
