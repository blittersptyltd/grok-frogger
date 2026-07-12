# Architecture

## Overview

Frogger is a static TypeScript application built directly on browser primitives. Canvas 2D handles rendering, Web Audio synthesises music and effects, and standard DOM controls provide mobile input and installation guidance.

The project deliberately has no production package dependencies and no backend.

## Runtime flow

`Game` owns a fixed-timestep accumulator:

```text
requestAnimationFrame
  ├─ accumulate elapsed wall time
  ├─ update at fixed 1/60 second steps
  └─ render once per animation frame
```

Fixed updates keep obstacle movement, timers and collision behaviour stable when rendering frame rates vary.

## State machine

```text
ATTRACT
  └─ READY
      └─ PLAYING
          ├─ DYING ──► READY or GAME_OVER
          └─ LEVEL_COMPLETE ──► READY
GAME_OVER ──► ATTRACT
```

`ATTRACT` contains a 93-second rotating cabinet presentation plus a scripted gameplay demonstration. Music is intentionally disabled in attract and ready states.

## Module responsibilities

| Module | Responsibility |
|---|---|
| `Game.ts` | loop, state orchestration, scoring, collision decisions and rendering order |
| `Attract.ts` | pure attract-cycle timing and scripted demo route |
| `Frog.ts` | tile movement, interpolation, facing, death animation and drift |
| `Lane.ts` | spawning, updating and wrapping obstacle groups |
| `Obstacle.ts` | vehicle/platform geometry, animation and special hazard bounds |
| `World.ts` | row map, content centring and background textures |
| `Homes.ts` | home-slot occupancy, flies and crocodile heads |
| `Bonuses.ts` | lady frog, snake and bonus interactions |
| `Levels.ts` | feature unlocks and difficulty configuration |
| `HUD.ts` | score/life/time display and cropped arcade glyph renderer |
| `Audio.ts` | synthesised chiptune voices, sound effects and browser lifecycle |
| `Input.ts` | keyboard, swipe, D-pad and confirmation input |
| `Sprites.ts` | sprite loading, cropping, stretching, flipping and rotation |

## Coordinate system

- logical width: 448 px
- logical height: 544 px
- base tile/content size: 32 px
- columns: 14
- home-depth extension: 8 px
- gameplay-row extension: 2 px per row interval

`World.rowY()` provides the top of each logical row. `rowContentY()` centres a 32 px sprite or collision tile inside a taller visual row. This separation is important: mobile readability improves without stretching sprites or causing invisible collision offsets.

## Rendering

Rendering uses nearest-neighbour Canvas output:

- sprite smoothing is disabled
- runtime sprites are individual PNG cuts
- road, river, hedge and median backgrounds are drawn procedurally
- the arcade font is a cropped sprite atlas with integer-only destination geometry
- DOM/CSS scales the complete Canvas to fit the available stage

Fractional CSS scaling is allowed below 1× because integer-only scaling overflowed narrow mobile layouts. Internal Canvas pixels remain discrete.

## Collision model

- frog movement commits to the destination tile when a hop starts
- vehicles use AABB collision
- river riding uses platform overlap and inherited horizontal velocity
- crocodile bodies are rideable while mouth bounds are lethal
- fully submerged turtles are not rideable
- home arrival tests the frog centre against alcove bounds

The debug overlay (backtick) draws frog and obstacle bounds directly over the game.

## Audio

Music is synthesised with oscillators and gain envelopes rather than audio files.

Important lifecycle rules:

- a user gesture unlocks the AudioContext
- only `PLAYING` may start music
- asynchronous starts are generation-guarded
- scheduled music oscillators are tracked and hard-stopped at transitions
- attract and ready states remain silent
- the AudioContext suspends on page hide, page freeze and browser backgrounding

These constraints prevent doubled tracks and background audio leakage on mobile browsers.

## PWA and responsive shell

The Canvas remains the game surface; controls and installation UI remain DOM elements around it.

- portrait devices place controls below the game
- landscape phones place controls beside it
- swipe and D-pad input share the same one-hop queue
- standalone mode is detected
- iOS/in-app browser limitations are explained rather than hidden
- the service worker provides static installation support

## Testing strategy

Vitest protects pure, high-risk rules:

- attract-cycle boundaries and wrapping
- demo-route direction validity
- mobile row geometry and bottom-HUD fit
- progressive level unlocks
- speed scaling cap

Browser smoke testing remains necessary for Canvas visuals, audio policy, touch behaviour and fullscreen/PWA integration.

## Deployment

GitHub Actions runs the production build and deploys static output to GitHub Pages. The Vite base path is `/grok-frogger/`.
