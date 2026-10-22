---
id: decision-008-study-rewards
type: decision
date: 2026-10-21
topic: interface
summary: Which small reward animations play when Jason studies, the rules they follow, and the clash that broke the site's text.
tags: [rewards, animation, motivation, momentum, progress]
status: accepted
related: [decision-004-white-geist-pet, decision-006-schedule-in-momentum, logbook-2026-10-21, logbook-2026-10-22]
---

# 008 Small reward animations for studying

## Context

Jason asked for "micro dopamine hit releasing animations and interactions ... to reward me engaging with it". The project already rules out streaks, badges and anything that makes a missed day feel bad.

## Options considered

Seven ideas were proposed. Claude recommended starting with three (the Done ripple, missed work clearing and Shortbread peeking in), and leaving Course alone because a second layer there was rejected on 18 October. Jason chose all seven: "add them all as long as they dont clutter the design".

## Decision

All seven, in `src/components/Delight.tsx` and the end of `src/styles.css`:

- Done: a green ripple crosses the Today card, the minutes count up and a tick draws itself.
- Logging time: today's week dot fills like rising water, with one ripple.
- Missed work cleared: finishing a day that carried catch-up floats its small dot away.
- Shortbread peeks up at the bottom right after Done, hops and sends a heart. He is a saved picture (`public/shortbread-peek.png`), so no second 3D scene runs.
- Ticking a milestone springs the box and bursts six flecks in the section colour.
- The Progress ring sweeps from its value at the last visit to today's.
- The first time every main session in a week is done, the seven dots bounce once. This is remembered per week in the browser and never counted.

## Why

Each reward marks something done and never points at something missed. Each plays once and leaves nothing on screen, which keeps the design clean.

## Consequences

- Reduced-motion settings turn every reward off.
- One flow check read the minutes mid count-up and failed; it now waits.
- The first build broke the site. The dot-fill animation was named `rise`, the same as the existing text entrance, and it ended on white. Unit titles and sheet text vanished on the white page. All reward animations are now prefixed `dl-`.
- The floating dot and the full-week bounce were only checked by reading the code, because the test data had no catch-up and no full week.

## Checks

All flow checks pass. Frames were captured during each animation on an empty data copy. Pushed as commit 6b6ff0b.
