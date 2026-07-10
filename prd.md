# Frogger — Product Requirements

**Status:** v1 core playable; polish incomplete  
**Design source of truth:** `docs/plans/2026-04-30-frogger-design.md`

## Product goal

A faithful browser clone of the 1981 Konami arcade *Frogger*: chunky pixels, classic palette, arcade-style sprites, keyboard controls, music + SFX.

## Current state (as of 2026-07-09)

**Playable end-to-end:** hop, road collision, river ride/drown, homes, scoring, timer, lives, level speed scaling, game over + restart, mute, persisted hi-score, synthesised arcade-style audio, ATTRACT → READY → PLAYING, diving turtles, crocs, snakes, fly & lady-frog bonuses.

**Still open:** pixel font loading, mute indicator, tests, touch controls.

## Stack

- Vite + TypeScript (no UI framework)
- Canvas 2D (`imageSmoothingEnabled = false`)
- Web Audio API (synthesised music/SFX — no audio files)
- Static deploy; no runtime deps

## Non-goals (v1)

Lady frog, fly bonus, alligator in homes, diving turtles, mobile touch, external audio assets.

## Success criteria for “done” polish

1. Boot into ATTRACT → Enter starts READY → PLAYING
2. Death / home / level clear show brief READY or banner, then resume
3. Debug overlay does not steal movement keys
4. HUD uses a loaded pixel font (or intentional monospace fallback)
5. `npm run build` clean; game playable at `npm run dev`
