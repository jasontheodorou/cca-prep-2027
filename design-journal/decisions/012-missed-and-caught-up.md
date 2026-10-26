---
id: decision-012-missed-and-caught-up
type: decision
date: 2026-10-26
topic: schedule
summary: A missed day shows as a light red box in Momentum, needs no time, and a Caught up button flashes green and turns the day green.
tags: [schedule, momentum, missed, catch-up]
status: accepted
related: [decision-009-new-study-plan, decision-008-study-rewards, logbook-2026-10-26]
---

# 012 Missed days show red, and can be caught up

## Context

Jason: "If a session is missed in the momentum tab, it needs to be marked with a light red box to show I didn't do it. That can then be remedied with a new 'caught up' button that flashes to green. If missed, I shouldn't need to enter any time spent on it." Decision 009 had no catch-up and kept missed days plain.

## Options considered

- Treat every past planned day with nothing logged as missed. Rejected: Jason said "if a session is missed", and the page has always kept unmarked days plain.
- Log the plan's minutes when a day is caught up, as Done does. Rejected: the time was spent on another day, and Jason asked not to enter time for missed days.
- A new mark, `caught`, with no time. Chosen.

## Decision

- `session.set` takes a fourth status, `caught` (src/data/events.ts, data/README.md).
- A day marked Missed shows as a light red box: `--missed` wash, `--trap` dark red date, and square corners so it differs by shape as well as colour. Skipped optional days stay plain.
- On today's card and in the day sheet, a missed day shows "Missed." and a Caught up button. The button flashes to green over 700 ms (straight away with reduced motion), then the day is marked caught up and its dot turns green.
- Missed and caught-up days hide the time controls and the minutes form.
- Caught up counts as done for the week's ripple. Take back on a caught-up day returns it to missed.
- The full calendar's key adds "Missed" and reads "Study logged or caught up".

## Consequences

- Caught-up days add no minutes, so weekly totals do not include them.
- The old line "It does not move to another day. Carry on with the plan as it is." is gone from today's card.
