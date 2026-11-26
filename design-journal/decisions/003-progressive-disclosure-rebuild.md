---
id: decision-003-progressive-disclosure-rebuild
type: decision
date: 2026-10-18
topic: interface
summary: Why the site was rebuilt to show one thing at a time, and how each tab hides detail until asked.
tags: [progressive-disclosure, rebuild, design]
status: accepted
related: [decision-001-sanctum-copy-and-study-log, decision-002-course-order-and-milestones, decision-006-schedule-in-momentum, decision-007-recommendations-removed, logbook-2026-10-18, decision-019-step-by-step-help]
---

# 003 Rebuilt for progressive disclosure

## Context

Jason on the first build: "Not bad." He asked for a rebuild "from scratch", less tied to sanctum's look, "REALLY good at progressive disclosure", "cute, simple and easy to pick up without getting hit with tons of information". Then: "same basic nav and sections".

## Decision

- Same four tabs and six sections. New interface, no Mantine or Framer Motion: one 760px column, Nunito, soft rounded cards, a pastel colour per section. Green still means study time only; buttons are a deep plum.
- Course shows one "Up next" unit and six section chips. Units appear only for the chosen section.
- A unit opens in a sheet (native dialog, named in the address as `?unit=1.3`): summary and two choices, then ideas one card at a time, then ticks. The guide's wording waits behind a link.
- Momentum: today with one-tap "+15 min / +30 min / +1 hour" and Undo; this week as seven dots; every week to the exam on request; a day sheet to change time or add a note.
- Progress: a ring and one bar per section; units on request; ticks happen in the unit sheet.
- Recommendations: the first suggestion only, "Show 2 more" on request.
- Kept: the study log, course content (with new short names), recommendations reader and checks.
