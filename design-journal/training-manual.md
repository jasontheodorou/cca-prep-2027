---
id: training-manual
type: manual
date: 2026-04-19
topic: knowledge-base
tags: [lessons, insights, techniques, patterns]
status: accepted
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

_No entries yet. The first will be added automatically the first time a session produces material that clears the "would a designer thank me for this in six months?" bar._

## Name new CSS animations so they cannot clash

Added 2026-10-21. A `@keyframes` name is global: a second `@keyframes rise` later in the file silently replaces the first everywhere it is used. The reward animations reused `rise`, ending on white text, and blanked the unit cards and sheets. Prefix every new set of animations (here `dl-`), and grep `@keyframes <name>` before adding one.
