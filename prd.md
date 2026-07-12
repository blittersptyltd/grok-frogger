# Frogger — completed product brief

**Status:** Complete

**Live:** https://blittersptyltd.github.io/grok-frogger/

**Architecture:** `docs/ARCHITECTURE.md`

## Product goal

Create a faithful, mobile-first browser reconstruction of the 1981 arcade game *Frogger* while using the work as a practical experiment in human-directed, AI-assisted product development.

## Delivered scope

- complete road, river, home, scoring, timer, lives and level loop
- progressive turtles, flies, crocodiles, snakes and lady-frog bonuses
- cabinet-style rotating attract sequence and scripted demonstration
- synthesised music and sound effects with mobile-safe lifecycle handling
- keyboard, swipe and on-screen D-pad controls
- responsive 448×544 logical playfield
- fullscreen/install guidance and installable PWA
- persisted high score and collision debug overlay
- Vitest regression coverage
- GitHub Actions and GitHub Pages deployment
- public architecture, retrospective and tutorial documentation

## Product principles

1. Preserve crisp pixel proportions; never stretch sprites to hide layout problems.
2. Keep rendering and collision geometry sourced from the same coordinates.
3. Treat attract and ready states as silent; gameplay owns music.
4. Explain browser/PWA limitations honestly.
5. Use direct visual comparison and real execution output as acceptance evidence.
6. Prefer a lean browser-native implementation over unnecessary framework or backend infrastructure.

## Completion criteria

- [x] End-to-end gameplay is stable on desktop and mobile.
- [x] Attract, ready, gameplay, death, level and game-over states transition correctly.
- [x] Arcade glyph rendering is clean and integer-aligned.
- [x] Mobile controls, PWA installation and audio backgrounding are handled.
- [x] `npm run check` passes tests, build and dependency audit.
- [x] Live GitHub Pages deployment succeeds.
- [x] Repository and website-ready documentation explain the experiment.

Future work is optional enhancement rather than incomplete core scope.
