---
id: decision-011-night-mode
type: decision
date: 2026-10-22
topic: theme
summary: A soft night mode for every page, switched by a day-to-night toggle that, like the manager switch, stays hidden until the pointer comes near.
tags: [dark-mode, theme, colour, top-bar, toggles]
status: accepted
related: [decision-010-study-notes, logbook-2026-10-22]
---

# 011 Night mode

## Context

Jason: "add a dark mode to this whole app, every page and element, and make sure that its tasteful use of colours and doesn't look like an eyesore. Please gravitate towards soft colours in dark mode and not bright neon buttons ... add the dark mode toggle on the left of manager mode one. should just be a day to night toggle." Then: "hide both toggles unless I scroll to that part of the screen when they should fade in. otherwise make them totally hidden. Also lets reorder menu as follows: Course, Progress, Momentum, Notes, Pet".

## Decision

- Every colour written in place in styles.css became a named token (line-strong, faint, on-green, accent-hover, danger, warn, bar-track, topbar, backdrop, lift, wash, pet-glow), so night mode is one block of tokens on `:root[data-theme='dark']`. Light mode looks exactly as before. A copy of the styles before the change is in artefacts.
- Night palette: soft charcoal with a hint of violet (page #16161b, cards #1e1e25), text #e9e7f0, grey text #aeacbb (7.6:1), buttons a soft lavender (#b2a9d6) with dark words instead of a bright fill, study logged a muted sage, planned days a quiet violet wash. The six section tints become deep, low tints with soft pastel marks.
- Ticks inside tinted boxes use the card colour, so they read in both modes. Shortbread's buttons (a copied web component) now read colours from variables, with the old values as fallbacks.
- The switch: a small track with a sun and a moon; the knob covers the one not in use. The choice is remembered in this browser; until one is made, the site follows the computer's setting. A small script in index.html sets it before the page draws, so night never flashes white.
- Both switches sit together left of the tabs and are fully transparent until the pointer is over that part of the top bar, or a key reaches them; then they fade in. "Scroll to" was taken to mean moving the pointer there. Touch screens have no pointer, so there they always show.
- Menu: Course, Progress, Momentum, Notes, Pet. Study is now called Notes, at /notes; /study redirects.

## Checks

Every tab, a unit sheet, the day sheet, every week and the phone layout were screenshotted at night with no page errors. Planned days were too close to empty days at night, so their wash was deepened. All flow checks pass.
