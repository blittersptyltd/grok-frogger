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

| Key | Action |
|---|---|
| Enter | Start from attract / return to attract after game over |
| Arrow keys / WASD | Hop (one hop per press) |
| M | Mute / unmute |
| `` ` `` (backtick) | Toggle collision debug overlay |

## Project layout

```
src/
  main.ts              # boot
  types.ts             # dimensions, palette, GameState
  game/
    Game.ts            # loop, state machine, scoring, collisions
    Frog.ts / Lane.ts / Obstacle.ts / Homes.ts / World.ts / HUD.ts
    Input.ts / Audio.ts / Sprites.ts / Constants.ts
public/sprites/cut/    # runtime sprites (one PNG per sprite)
scripts/               # one-off sprite extraction helpers
docs/plans/            # design doc
```

## Specs & tasks

- Design: `docs/plans/2026-04-30-frogger-design.md`
- PRD / status: `prd.md`
- Next work: `tasks.md`
- Agent context: `AGENTS.md`, `.cursor/rules/`

## Notes

- Audio is synthesised via Web Audio (no `public/audio/`). Themes approximate the arcade intro (Inu no omawari-san) and main loop (Araiguma Rascal). First keypress unlocks audio (browser policy).
- Intermediate sprite dumps under `public/sprites/` are gitignored; the game loads only `public/sprites/cut/*.png`.
