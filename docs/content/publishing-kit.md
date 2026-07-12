# Publishing kit

## Recommended content set

| Asset | File | Use |
|---|---|---|
| Project showcase | `project-showcase.md` | Portfolio/news post, 5–7 minute read |
| Full retrospective | `../AI-DEVELOPMENT-RETROSPECTIVE.md` | Long-form thought-leadership article |
| Technical tutorial | `tutorial-build-canvas-arcade-game-with-ai.md` | Educational/SEO article |
| Mobile screenshot | `../images/frogger-mobile-gameplay.jpg` | Hero or inline result image |

## Recommended publication order

1. Publish the project showcase with the live-game link.
2. Publish the AI retrospective one week later.
3. Publish the technical tutorial as evergreen content.
4. Cross-link all three and the GitHub repository.

## Metadata

### Project showcase

- **SEO title:** We Rebuilt Frogger as an AI Development Experiment
- **Meta description:** We built a mobile browser reconstruction of Frogger with an AI coding agent—and learned why human taste, visual feedback and verification still matter.
- **Slug:** `/experiments/ai-built-frogger`
- **Primary keyword:** AI coding experiment
- **Secondary keywords:** AI game development, Canvas game, TypeScript arcade game

### Retrospective

- **SEO title:** What We Learned Building an Arcade Game With an AI Agent
- **Meta description:** A practical retrospective on AI-assisted product development, visual iteration, mobile debugging and why convincing wrong answers still need human review.
- **Slug:** `/insights/ai-assisted-game-development-retrospective`

### Tutorial

- **SEO title:** Build a Mobile Canvas Arcade Game With an AI Coding Agent
- **Meta description:** Learn fixed-step game loops, tile movement, Canvas sprites, Web Audio, touch controls, PWA design, testing and AI-assisted development workflow.
- **Slug:** `/tutorials/build-mobile-canvas-game-with-ai`

## Suggested image plan

1. **Hero:** completed game running on a phone.
2. **Architecture:** simple fixed-step loop/state-machine diagram.
3. **Attract reconstruction:** three frames—frog row, group rise, completed title.
4. **Mobile geometry:** annotated 32 px sprite centred inside a 34 px row.
5. **Verification:** terminal crop showing tests/build/audit passing.

Use original screenshots of this implementation. If publishing reference comparisons, clearly identify source material and limit it to commentary/analysis context.

## Hero-image brief

> A modern smartphone displaying a crisp retro pixel-art lane-crossing arcade game, deep navy river, magenta banks, colourful traffic, green frog character and tactile on-screen D-pad. Dark studio background, subtle neon reflections, premium editorial technology photography, no third-party logos, landscape crop with negative space for headline.

Recommended ratio: 16:9 for website/social preview; create a 1:1 crop for social feeds.

## Social copy

### LinkedIn — project launch

We’ve just finished a practical AI development experiment: rebuilding a classic lane-crossing arcade experience as a mobile-first TypeScript/Canvas game.

The interesting part wasn’t whether an AI agent could generate code. It could.

The interesting part was what happened after the first “working” version:

- visual reference analysis
- incorrect sprite assumptions
- a rejected video shortcut
- mobile row geometry
- doubled Web Audio tracks
- background audio lifecycle bugs
- frame-level Canvas verification

The final lesson: AI supplied enormous implementation speed, but human taste and product judgement remained the quality system.

Play it: https://blittersptyltd.github.io/grok-frogger/

Source and retrospective: https://github.com/blittersptyltd/grok-frogger

### LinkedIn — tutorial

We documented the architecture behind our AI-assisted browser arcade experiment.

The tutorial covers:

- fixed-timestep Canvas loops
- discrete movement with animated interpolation
- mobile-first row geometry
- sprite-atlas sampling artefacts
- Web Audio lifecycle ownership
- touch and PWA constraints
- turning visual bugs into measurable tests
- how to brief an AI coding agent without surrendering product judgement

The examples are designed for building an original arcade-style game with your own art and identity.

### X / short post

We rebuilt a classic arcade experience as a mobile TypeScript/Canvas PWA with an AI coding agent.

The code was the easy part. Visual intent, mobile feel and rejecting convincing wrong answers were the real experiment.

Play + source: https://github.com/blittersptyltd/grok-frogger

### Short teaser

Can an AI agent build a polished game from a product brief?

Yes—but only if a human keeps testing the actual experience, catches the convincing wrong answers and refuses shortcuts that miss the point.

## Calls to action

- **Primary:** Play the experiment
- **Secondary:** Read the build retrospective
- **Technical:** Explore the source and architecture
- **Educational:** Follow the Canvas game tutorial

## Editorial/legal note

Describe this as an educational, non-commercial fan reconstruction and AI development experiment. Do not imply affiliation with Konami. Encourage tutorial readers to use original names, graphics, audio and visual identity.
