---
id: overview-cca-prep-2027
type: overview
date: 2026-10-22
summary: One-screen state of the cca-prep site: what it does now, what is open and what to watch out for.
tags: [overview]
status: active
related: [decision-006-schedule-in-momentum, decision-007-recommendations-removed, decision-008-study-rewards, logbook-2026-10-22]
---

# cca-prep-2027 — Overview

## What this is

A calm, minimal study site, built from sanctum, for Jason's Claude Certified Architect – Foundations exam. The exam is planned for Saturday 20 March 2027 (not yet booked).

## Where things stand

- Five tabs: Course, Progress, Momentum, Notes, Pet. Notes holds notes saved as Markdown in notes/, committed automatically (decision 010). Recommendations was removed on 21 October (decision 007).
- Momentum shows today's job from the study plan (study-plan.md, imported by scripts/import-plan.py), with links to claudecertificationguide.com, Done and Missed. Missed days are not moved (decision 009).
- Seven small reward animations play when Jason studies (decision 008).
- Page titles and explainers are hidden unless manager mode is on. A day-to-night switch gives a soft night mode (decision 011). Both switches fade in only when the pointer is near them.
- Runs locally at `localhost:3005` (Vellum moved it from 3025). Pushed to GitHub up to commit 739613d; the Recommendations removal is not yet committed.

## Recent sessions

- 21–22 Oct: schedule in Momentum, plain words, rewards, Shortbread flicker fix, Recommendations removed, Vercel deploy unblocked.
- 18 Oct: first build from sanctum, rebuilt for progressive disclosure, restyled white with Geist and a Pet tab.

## Open questions

- What caused the 404 Jason saw? Needs the address shown in the browser.
- Does Shortbread's face still flicker after the second fix?
- Where should the notes folder and study data live? Only `src/data/store.ts` would change.

## Next steps

- Commit and push the Recommendations removal.
- Jason to use the schedule day to day and react.

## Key decisions

- 001 Separate app from sanctum, append-only study log
- 002 Course order and milestones
- 003 Progressive disclosure
- 004 White, Geist, Pet tab
- 006 Schedule in Momentum with catch-up
- 007 Recommendations removed
- 008 Small rewards for studying

## Watch out for

- Commit as the personal email in this repo, or Vercel blocks the deploy.
- Study marks only save through the local server; the Vercel copy cannot save them.
- Name new CSS animations with a unique prefix; a clash blanked the site's text once.
- No guilt: no streaks, badges, red, or counts of missed days. Green means study time only.
- The official exam guide (v1.0, July 2026) is the only authority for course content.
