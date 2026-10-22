---
id: training-manual
type: manual
date: 2026-04-19
topic: knowledge-base
summary: Lessons from this project that apply elsewhere, on CSS animation names, 3D flicker and deploy identity.
tags: [lessons, insights, techniques, patterns]
status: accepted
related: [decision-008-study-rewards, experiment-2026-10-22-shortbread-face-flicker, logbook-2026-10-22]
---

# Training Manual — cca-prep-2027

A codified knowledge base for designers joining this project or anyone at Transform UK building related tooling. Written incrementally as the project unfolds. The goal: a new designer should be able to pick up the craft from this document without reading the logbook.

## How to read this manual

Entries fall into four shapes. The shape tells you how to use it:

- **Lesson** — a principle learned the hard way (or near-miss prevented). If you take nothing else from an entry, take this.
- **Insight** — a conceptual framing that unlocks a problem. Often short; the value is in the reframe, not the length.
- **Technique** — a how-to. Step-by-step, or a decision heuristic.
- **Pattern** — a reusable structural template. Architectural, or about how to model a kind of problem.

Each entry is timeless: it should still make sense without the context of the session it came from. Entries are grouped by **topic**. New entries are added to an existing topic where possible; new topics appear only when genuinely new ground is covered.

---

## CSS and animation

### Lesson: Give new CSS animations a unique prefix so they cannot replace old ones

A `@keyframes` name is global. A second `@keyframes rise` later in the stylesheet silently replaces the first everywhere it is used. Here, a new reward animation reused `rise`, ended on white text, and blanked every course card and sheet title. Prefix each new set of animations (here `dl-`) and search for `@keyframes <name>` before adding one. The sign you got it wrong: text or shapes vanish, or move oddly, in places you did not touch.

From decision-008-study-rewards.

## 3D graphics

### Technique: Give each overlapping layer its own depth offset, and test flicker on a real screen

When small shapes sit on a 3D surface (eyes on a face), the graphics card cannot decide which is in front, and they flicker as the model moves. Push the surface behind back with a polygon offset and narrow the camera's near and far range. If three layers overlap, each needs a different offset: two layers pushed back by the same amount still fight each other. Headless test browsers often draw in software and never show this flicker, so a clean screenshot there proves nothing. Ask for a screenshot from the real device.

From experiment-2026-10-22-shortbread-face-flicker.

## Shipping

### Lesson: Check the commit email before the first push to a Vercel-hosted personal repo

Vercel decides who is deploying from the commit author's email. On a work laptop the default email belongs to a different GitHub account. On Vercel's free Hobby plan that account cannot deploy a private project, so the push succeeds but the deploy is blocked. Set the repository's own `user.email` before the first commit. If a deploy is already blocked, add a correctly authored commit on top; do not rewrite `main`.

From logbook-2026-10-22.
