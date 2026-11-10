---
id: decision-014-exam-moved-to-may
type: decision
date: 2026-11-02
topic: schedule
summary: The exam moves to Saturday 22 May 2027 and the rest of the plan is spread out, from about 5 to 8 hours a week down to about 4.
tags: [schedule, momentum, study-plan, exam-date]
status: superseded
related: [decision-009-new-study-plan, logbook-2026-11-02, decision-016-thirty-minutes-a-day-two-tries]
---

# 014 The exam moves to May, and the plan is spread out

## Context

Jason, 2 November 2026: "I am struggling to find time to study for this. Push the exam date to May 2027 please. adjust study times accordingly", then "pace everything out to that date". He was at lesson 1.4; the plan had him at 1.7.

## Options considered

- Add catch-up weeks between the plan's weeks. Rejected: normal weeks would stay as heavy as they are now.
- Fill days one after another with no fixed weekdays. Rejected: 2-hour blocks would land on work nights.
- Spread each piece of work by its share of the old plan across the new study days, with fixed weekdays. Chosen.

## Decision

- Exam: Saturday 22 May 2027 (`EXAM.day` in course.ts; the schedule's last day).
- `stretch()` in `scripts/import-plan.py`, set by `stretch` in `scripts/plain-plan.json`. Work from 28 October (lesson 1.4) onwards restarts on 2 November.
- 30-minute days on Monday, Tuesday, Thursday and Sunday; half-days on Wednesday; the 2-hour block on Saturday. Wednesday and Friday are usually days off, and about one Saturday in three is free.
- Holidays and Christmas keep their dates. "Pack for your holiday" and "Welcome back" stay next to the November and February holidays.
- The last five days keep the plan's taper: 17 to 21 May.
- 29 October to 1 November had no study marked and became "Moved to later" days.

## Consequences

- Same 114 hours in all; about 4 hours a normal week, 7 to 7½ hours in half-day weeks from mid-March.
- Week names (such as "Week 8 · then a break") no longer match calendar weeks.
- The browser check "it says missed work is not moved" already failed before this change.
- Old schedule kept at `artefacts/2026-11-02-schedule-march-exam.json`.
