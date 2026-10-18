---
id: overview-cca-prep-2027
type: overview
project: cca-prep-2027
status: active
last-updated: 2026-10-18
---

# cca-prep-2027 — Overview

**One-sentence description:** A calm, minimal site, built from sanctum, for Jason's preparation for the Claude Certified Architect – Foundations exam, planned for the week of 15 March 2027.

## Current state

Rebuilt on 18 October 2026 for progressive disclosure (decision 003): five tabs (Course, Momentum, Progress, Recommendations, Pet last). Course holds the exam guide's 30 task statements and 4 exercises in study order. Momentum logs minutes per day and shows study days in green. Progress counts ticked milestones (the guide's "Skills in" lines, 147 in all). Recommendations shows only what an agent writes to `data/recommendations.json`; none is connected. Data is sanctum's append-only log pattern (`data/study-log.jsonl`, dev server only).

## Active goals

- Jason to use it and react to the first build.
- Jason to decide the Markdown folder, storage and agent connection. Only `src/data/store.ts` and `src/data/recommendations.ts` need to change.

## Key constraints

- Five tabs, Pet last. White, Geist, muted section colours (decision 004). Green means study time only.
- The official exam guide (v1.0, July 2026, `~/Desktop/cca.pdf`) is the only authority for course content.
- No backend, auth, external service or agent framework without asking Jason.
- No guilt: missed days stay plain; no streaks, badges or score predictions.

## Stakeholders

- Jason Theodorou decides.

## Stack / environment

- Runs on `localhost:3025`
- Project directory: `/Users/jason.theodorou/projects/cca-prep-2027`
- Vite, React 19, TypeScript, Mantine, Framer Motion, React Router (as sanctum)
- Checks: `npm run verify`, `npm run check:flows`

---

**Note to Claude:** this file is injected into every session as persistent project memory. Keep it concise — one screen. Update it whenever the project state changes meaningfully (new goal, phase change, stakeholder shift). Don't let it accrete detail; detail belongs in the logbook, decisions, experiments.
