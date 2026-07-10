# Mobile touch controls — design

**Date:** 2026-07-10  
**Status:** implemented (hybrid)

## Goal

Play Frogger comfortably in a mobile browser (portrait + landscape) without a keyboard.

## Approach (hybrid)

1. **On-screen D-pad** — four large buttons; one hop per press (matches keyboard one-shot).
2. **Swipe on playfield** — dominant-axis swipe ≥28px queues a hop; short tap confirms start/continue.
3. **START / MUTE** — explicit buttons for attract/game-over and audio.

Touch chrome shows when `(hover: none)`, `(pointer: coarse)`, or `max-width: 820px`.

## Layout

- Portrait: stage on top, controls under (safe-area padding).
- Landscape (short height): stage left, controls right.
- Canvas scales to `#stage` (fractional CSS size allowed when integer scale won’t fit).

## Non-goals

- Hold-to-repeat hops
- Virtual joystick / analog stick
- Separate “mobile build” — same bundle, responsive chrome
