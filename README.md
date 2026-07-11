# Frogger

Browser clone of the 1981 arcade classic. Vite + TypeScript + Canvas 2D.

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173/grok-frogger/
npm run build    # typecheck + production bundle → dist/
npm run preview  # serve dist/
```

## Play online

GitHub Pages (after deploy workflow succeeds):

**https://blittersptyltd.github.io/grok-frogger/**

## Controls

| Input | Action |
|---|---|
| Enter / Space / tap playfield / **START** | Start from attract; continue after game over |
| Arrow keys / WASD | Hop (one hop per press) |
| On-screen D-pad | Hop (phones / tablets / narrow windows) |
| Swipe on playfield | Hop in swipe direction |
| M / **MUTE** | Mute / unmute |
| **ICON** | Add to Home Screen / install help |
| **FULL** | Toggle browser fullscreen (Android/desktop where supported) |
| `` ` `` (backtick) | Toggle collision debug overlay |

Touch chrome (D-pad + START/MUTE/FULL) appears automatically on coarse-pointer devices and viewports ≤820px. Portrait: pad under the game. Landscape phones: pad beside the game.

On first load a boot chooser prioritises **Add to Home Screen** / install (requires a tap — browsers block auto-fullscreen). On iPhone / Telegram / other in-app browsers, fullscreen API cannot hide chrome — the UI shows **Add to Home Screen** steps instead. Install the PWA/home-screen icon for true fullscreen. The chooser is skipped when already running standalone.

## Project layout

```
src/
  main.ts              # boot + fullscreen gate
  fullscreen.ts        # Fullscreen API helpers
  types.ts             # dimensions, palette, GameState
  game/
    Game.ts            # loop, state machine, scoring, collisions
    Frog.ts / Lane.ts / Obstacle.ts / Homes.ts / World.ts / HUD.ts
    Input.ts / Audio.ts / Sprites.ts / Constants.ts
public/sprites/cut/    # runtime sprites (one PNG per sprite)
scripts/               # one-off sprite extraction helpers
```

## Specs & tasks

- Design: `docs/plans/2026-04-30-frogger-design.md`
- PRD / status: `prd.md`
- Next work: `tasks.md`
- Agent context: `AGENTS.md`, `.cursor/rules/`

## Notes

- Audio is synthesised via Web Audio (no `public/audio/`). Themes approximate the arcade intro (Inu no omawari-san) and main loop (Araiguma Rascal). First keypress unlocks audio (browser policy).
- Intermediate sprite dumps under `public/sprites/` are gitignored; the game loads only `public/sprites/cut/*.png`.
