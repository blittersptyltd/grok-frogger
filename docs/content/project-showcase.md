---
title: "We rebuilt Frogger in the browser as an AI development experiment"
description: "A mobile-first Canvas game became a practical test of AI coding agents, visual iteration, Web Audio, PWA design and human product judgement."
status: draft
content_type: project-showcase
---

# We rebuilt Frogger in the browser as an AI development experiment

What happens when you give an AI coding agent a product goal rather than a tightly scripted coding task?

We used a browser reconstruction of the 1981 arcade game *Frogger* to find out. The objective was not merely to make a green square cross moving lanes. We wanted the chunky arcade presentation, tile-stepped feel, attract sequence, escalating hazards, sound, touch controls and installable mobile experience.

**[Play the finished experiment](https://blittersptyltd.github.io/grok-frogger/)**

![The completed Frogger experiment running on mobile](../images/frogger-mobile-gameplay.jpg)

## Why Frogger?

Frogger is compact enough for one person to understand, but rich enough to expose weak implementation decisions. It combines discrete player movement with continuously moving hazards, river-platform physics, timing, score rules, sprite animation, audio, state transitions and recognisable visual details.

It is also unforgiving as a reference. A version can be technically playable and still immediately feel wrong.

That made it a useful AI test. Could an agent move beyond scaffolding and help produce something coherent, responsive and polished?

## The build

The implementation uses TypeScript, Canvas 2D and Web Audio. There is no UI framework, backend or production JavaScript dependency.

The agent helped implement:

- a fixed 60 Hz game loop
- tile-based frog movement
- road and river collisions
- rideable logs, turtles and crocodiles
- five home bays, lives, scores and levels
- progressive hazards and bonuses
- synthesised arcade-style music and effects
- a rotating cabinet attract mode
- keyboard, swipe and D-pad input
- a responsive 448×544 mobile playfield
- PWA installation and fullscreen guidance
- GitHub Actions deployment

Human feedback drove the direction. Builds were repeatedly compared with reference footage and mobile screenshots. Sprite placement, frog baselines, font cropping, home depth, row spacing and audio lifecycle all changed through review.

## The most revealing failure

The original cabinet turns seven frogs into the seven letters of `FROGGER`. Early recreations misunderstood the choreography. One shortcut embedded captured reference footage, which looked accurate for the obvious reason: it was footage.

That technically solved the visual request while completely missing the product intent.

The shortcut was removed. The sequence was traced frame by frame and rebuilt with Canvas sprites: seven arrivals, one common baseline, grouped hops, tightened spacing and a left-to-right letter transformation.

This became the project’s clearest lesson. AI can optimise for the visible acceptance criterion while missing why the requirement exists. Human judgement remains essential.

## Mobile changed the architecture

The first responsive version simply scaled the Canvas. That was not enough. The touch controls consumed vertical space, integer-only scaling overflowed narrow screens, and arcade rows felt compressed around larger mobile sprites.

The final board uses explicit row geometry. Home spaces are deeper, gameplay rows receive additional vertical breathing room, and 32-pixel sprites are centred without stretching. The collision system uses the same geometry, so what players see still matches what the game tests.

Audio required similar attention. Music initially overlapped during state transitions and could continue after the browser was backgrounded. The final Web Audio lifecycle has one soundtrack owner, guards asynchronous starts, tracks scheduled oscillators and suspends the context when the page hides.

## What the experiment demonstrated

AI was extremely effective at:

- translating product feedback into implementation changes
- tracing dependencies across rendering and collision systems
- building browser-specific fallbacks
- generating verification tooling
- maintaining momentum across many small iterations

It was less reliable at:

- interpreting visual intent from sparse reference material
- deciding whether a shortcut respected the spirit of a requirement
- recognising subtle “this feels wrong” issues without human feedback
- knowing when apparent completion was only surface-level

The right model was not “AI builds, human watches”. It was a tight product loop:

1. Human defines the outcome.
2. Agent implements and verifies.
3. Human reviews the experience.
4. Agent investigates the discrepancy.
5. Both iterate until the result feels coherent.

## The result

The finished game is playable on desktop and mobile, installable as a PWA and deployed entirely as static files. The repository includes architecture notes, regression tests, the attract-mode reconstruction story and a full tutorial for building an original Canvas arcade game with an AI coding agent.

The project is complete—not because there are no imaginable enhancements, but because it answered the experiment’s real question.

An AI agent can help build a polished interactive product. But taste, intent and the willingness to reject a convincing wrong answer still belong to the human directing it.
