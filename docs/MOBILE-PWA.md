# Mobile and PWA design

Frogger began as a fixed Canvas game and evolved into a mobile-first installable experience.

## Input model

All movement paths feed the same one-hop queue:

- Arrow keys
- WASD
- on-screen D-pad
- directional swipe

Movement is one action per press or swipe. Key repeat is ignored and hops cannot be interrupted midway.

A short tap or START confirms menus. Attract mode clears stale movement input but preserves confirmation so a swipe cannot leak into the first gameplay frame.

## Responsive layout

Touch controls appear for coarse pointers and narrow viewports.

- portrait: Canvas above, controls below
- landscape phone: Canvas and controls can sit side-by-side
- desktop: keyboard-first layout

The Canvas has a fixed logical coordinate system and is scaled by CSS to fit the stage.

## Why fractional CSS scaling is necessary

An early integer-only scaling rule worked on desktop but failed on phones. Once the D-pad reserved vertical space, the available scale could be less than one. Flooring that value produced zero and clamping back to one overflowed the screen.

The final rule uses:

- integer scaling when the board fits at 1× or larger
- fractional down-scaling when the available area is smaller than the logical Canvas
- nearest-neighbour internal rendering to preserve pixel structure

## A deeper mobile board

The final logical playfield is 448×544 px.

Mobile review showed that original 32 px rows felt compressed once sprites were enlarged and surrounded by touch UI. Instead of stretching the complete Canvas vertically, the geometry was changed explicitly:

- home band receives 8 extra logical pixels
- gameplay rows receive 2 extra pixels of depth
- 32 px sprites remain unchanged
- `rowContentY()` centres sprites and hitboxes inside taller rows
- all rows below the homes shift through a shared `rowY()` mapping

This keeps visuals and collision bounds aligned while creating more breathing room.

## Fullscreen reality

Browsers do not allow reliable automatic fullscreen on load. It requires a user gesture and support differs by platform.

The game therefore uses a boot chooser and contextual help:

- browsers with Fullscreen API support can enter fullscreen after a tap
- iPhone Safari directs users to **Add to Home Screen**
- in-app browsers explain that their chrome cannot be hidden
- standalone PWA mode skips irrelevant installation prompts

The important UX choice was to explain platform limitations rather than expose a button that silently does nothing.

## Audio lifecycle

Mobile browsers made audio lifecycle a product issue, not merely an implementation detail.

The final rules are:

- user gesture unlocks Web Audio
- attract and ready screens are silent
- only gameplay starts the soundtrack
- duplicate asynchronous starts are guarded
- scheduled oscillators are tracked and stopped at state transitions
- the AudioContext suspends on visibility hide, pagehide and page freeze

The last rule prevents music continuing after the browser or installed app is backgrounded.

## Service worker and installation

The project ships static assets, a web manifest and service worker. GitHub Pages can therefore host the complete installable application without a backend.

The PWA is deliberately simple: installation and offline/static delivery support the game, rather than becoming a second application architecture.
