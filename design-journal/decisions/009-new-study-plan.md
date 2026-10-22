---
id: decision-009-new-study-plan
type: decision
date: 2026-10-22
topic: schedule
summary: Momentum now runs on Jason's new Markdown study plan (exam Saturday 20 March 2027), with links to claudecertificationguide.com and no catch-up.
tags: [schedule, momentum, study-plan, catch-up]
status: accepted
related: [decision-006-schedule-in-momentum, logbook-2026-10-22]
---

# 009 Momentum runs on the new study plan

## Context

Jason wrote a new study plan (`~/Desktop/study-plan.md`, copy at `artefacts/2026-10-22-study-plan.md`): 22 October 2026 to the exam on Saturday 20 March 2027, 30 minutes a day, a 2-hour Saturday block, a half-day a week from 25 January, two days off on 18 and 19 March, holidays in the weeks of 23 November and 8 February, and Christmas off. His main text is claudecertificationguide.com. Asked which plan was better, Claude judged the new one stronger on exam weighting, answer patterns, retrieval practice, mocks and realism (about 114 hours against 154), and weaker on its clash with the Playbook launch, a re-reading-heavy second pass, unchecked third-party claims and no catch-up. Jason: "ok apply this new plan and rewrite the momentum section to apply it."

## Options considered

- Keep the old catch-up (missed minutes spread over flexible days). Rejected: the new plan has no flexible days and says never squeeze two weeks into one.
- Apply the plan with Claude's three suggested changes (move holiday two, swap re-reading for retrieval, check the flashcards). Not done: the holidays are Jason's, and the changes were suggestions, not asked for.
- Apply the plan as written. Chosen.

## Decision

- `scripts/import-plan.py` reads section 6 of the plan (one table per week; holiday, Christmas and exam weeks from their headings) into `src/content/schedule.json`: 150 days, 114 planned hours. Each day has its week, a short title, the rest of the task, its length from the plan's tags ([2h] 120, [HALF-DAY] 210, [FULL DAY OFF] 360 or 300, "15 min flashcards, then stop" 15, otherwise 30), the lessons it names, and links to the study site's pages (lessons, drill by domain, diagnostic, quick reference, exercises, mock exam). Sandbox days carry their step's description from section 3.
- The old spreadsheet importer and plain-words map were removed (copies in artefacts). The plan's wording is kept, with Markdown and shouting removed.
- No catch-up. Missed says: "It does not move to another day. Carry on with the plan as it is." Optional Christmas flashcard days say "It was optional".
- Today's card: week, title, length, "Start with 10 minutes of flashcards" on study days, the task, link pills that open the study site in a new tab, Done, Missed and the full plan. Off days show their title and task with no buttons.
- The day's plan sheet adds the plan's standing rules where they apply: the six-step way of working a lesson, the three sentences in NOTES.md after sandbox days, and "If a day has to go, make it this one" on Fridays.
- Dots: planned days washed; days of 2 hours or more deeper with a small mark (the old catch-up mark, reused); the exam day ringed.
- The exam date is now Saturday 20 March 2027 (`EXAM.day` in course.ts, `EXAM_DAY` from the schedule).

## Consequences

- The Course tab still lists sections in the old order (Claude Code first); the plan starts with Domain 1. Not changed, as only Momentum was asked for.
- Marks already recorded (21 October) stay in the study log; 21 October has no planned day in the new plan.
- The plan's clash with the Playbook launch (holiday two in the week of the 9 February early access) is unchanged.
