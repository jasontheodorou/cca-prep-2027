---
id: decision-004-white-geist-pet
type: decision
date: 2026-10-18
topic: interface
summary: The settled look (full width, Geist font, white, muted section colours) and why the Pet tab with Shortbread was added.
tags: [layout, type, colour, pet]
status: accepted
related: [decision-003-progressive-disclosure-rebuild, decision-008-study-rewards, experiment-2026-10-22-shortbread-face-flicker, logbook-2026-10-18, decision-015-shareable-app-separate-project]
---

# 004 Full width, Geist, white, and a Pet tab

## Context

Feedback on the rebuild, in order: it used a third of the screen; use the cc image in the header; Paper Mono then Fraunces and Figtree were rejected ("use some more modern ui fonts"); colours "a bit goofy", then "not that muted, just a BIT less lively"; shapes uneven; "use a white background"; "exam prep" should link home; add Pet with Shortbread from sanctum. Approved: "fonts and colours look good now".

## Decision

- Width up to 1,440px with 56px sides. On screens 960px and wider, Course, Momentum and Progress lay their two parts side by side; nothing extra is shown.
- `~/Desktop/cc.svg` is the header mark and the favicon. The name links to Course.
- Geist for everything. White background, neutral greys.
- Section colours: the first build's, blended 35% (tints) and 25% (inks) towards grey. Green still means study time only.
- Equal sizes: section tiles share one row height; paired cards share a height with actions on one bottom line.
- Pet is a fifth tab, last as in sanctum, with Shortbread copied unchanged (`src/features/shortbread-pet.js`, storage key `cca-prep.pet`). This replaces the "exactly four tabs" rule from the first brief.
