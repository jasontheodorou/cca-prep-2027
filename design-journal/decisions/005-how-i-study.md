---
id: decision-005-how-i-study
type: decision
date: 2026-10-18
topic: routine
tags: [routine, method, disss, progressive-disclosure]
status: superseded
related: [decision-003-progressive-disclosure-rebuild, decision-004-white-geist-pet, logbook-2026-10-18]
---

# 005 How I study: a slim card on Course and seven cards in a sheet

## Context

Jason brought a ChatGPT prompt for a "Routine" tab built on DiSSS. I reviewed it: the method is sound, but it was written before the rebuild (it assumed a fifth tab, Sanctum's look and one long page), it repeated what Progress already says and it left out the two employer days. Jason said "DISSS is such an ugly acronym and I feel this could all be explained better", approved a rewrite and said "ok do it".

## Decision

- No new tab. Course gets one slim card under its two cards: today's part of the week (weekend: "Your longer session, if it fits this week") and a "How I study" link.
- The link opens a sheet with seven cards, one at a time: Aim for something you can show; Make it small; Learn in the right order; Work each task like this; Your week; When the week does not go to plan; End the week. Each card's reason is behind "Why this works".
- No acronym on screen. Its four parts map to cards 2 to 5 (noted in `src/content/routine.ts`).
- The sheet keeps one height, so Back and Next never move; a long card scrolls inside with a fade at the bottom. The week is six tiles, three across on desktop.
- Nothing is tracked. All text lives in `src/content/routine.ts`.
- Sheets now give focus back to whatever opened them.

## Removed, same day

Jason: "This does not feel quite right. It feels overcomplicated. Remove this from the page please." The card, sheet, styles and checks were removed. The text is kept at `design-journal/artefacts/2026-10-18-how-i-study-routine.ts`. Kept from this work: sheets give focus back to whatever opened them.

Lesson: the method was explained well, but it added a second layer (a card and seven steps) to a page whose job is one next step. Ask before adding a teaching layer to Course.
