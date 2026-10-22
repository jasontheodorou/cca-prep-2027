---
id: decision-006-schedule-in-momentum
type: decision
date: 2026-10-21
topic: schedule
summary: How the day-by-day study schedule is imported into Momentum, marked Done or Missed, and how missed work is spread over later days.
tags: [schedule, catch-up, momentum, plain-language]
status: superseded
related: [decision-003-progressive-disclosure-rebuild, decision-007-recommendations-removed, decision-008-study-rewards, decision-009-new-study-plan, logbook-2026-10-21, logbook-2026-10-22]
---

# 006 The study schedule lives in Momentum, with catch-up on flexible days

## Context

Jason made a day-by-day schedule in Excel with ChatGPT (`~/Desktop/dsp.xlsx`, copy at `artefacts/2026-10-21-dsp-schedule.xlsx`): 157 days, 21 October 2026 to the exam on Friday 26 March 2027, 154 planned hours. He wants to mark missed sessions and have the work added to later sessions, "so I essentially need to catch up". He said "it would need to live under momentum", then "Go for it".

## Options considered

- A new tab (my first idea). Rejected by Jason.
- Missed work added to the next session only. Simple, but one miss can double a day, and the spreadsheet itself says "Never double the next week".
- Missed work spread over later flexible days, capped. Chosen.

## Decision

- `scripts/import-schedule.py` turns the spreadsheet's "Daily plan" sheet into `src/content/schedule.json`. Rerun it when the spreadsheet changes. The site never edits the schedule.
- The Today card shows today's session (focus, kind, length, "Start here") with Done, Missed and "See the whole session". The time block and +15/+30/+1 hour buttons stay below it.
- Done marks the session and raises the day's logged time to the planned time if it was lower. Missed marks it. "Take back" removes either mark.
- New study-log event `session.set` (`done`, `missed`, `none`).
- Catch-up (`src/lib/schedule.ts`), following the spreadsheet's "When behind" rule: a missed Core, Preparation leave or Light review session moves its minutes to the next Flexible or Optional buffer days, at most 60 extra minutes on any day. A missed Flexible hour moves only the catch-up it held. Past unmarked days take nothing. Anything with no room before the exam is shown as left over, with the spreadsheet's advice to look at the date again.
- Week dots and the month calendar ring planned days; a thicker ring means the day includes catch-up. Past days' sheets can mark Done, Missed or Not marked.
- The exam week moved from 15 March to 22 March 2027 to match the schedule.

## Consequences

- The spreadsheet's Status and Actual hours columns are ignored; the site records those.
- A missed 3-hour Saturday spreads over three flexible days; a missed preparation day over five.
- The online copy on Vercel cannot save marks, because the study log is written by a server that only runs on Jason's computer.

## Changed later the same day

- The rings were replaced. Jason: "I don't like the black outline". Planned days now have a soft plum fill; days with catch-up have a deeper fill and a small dot. Hovering a planned day ahead pops out a card (borrowed from sanctum's calendar). Touch screens tap through to the session instead.
- All schedule text is rewritten in very plain words, at Jason's request ("Reading age of 5"). The spreadsheet is left alone: `scripts/plain-words.json` maps each original sentence to its plain version, and the importer swaps it in and lists any sentence with no plain version yet. Exam terms (tool_use, MCP, schema) stay, with a plain explanation, because the exam uses them.
- Pop-out cards cut from 29 to about 17 words on average, over two rounds. The session sheet is 840px wide with labels beside the text, so no day needs scrolling.

## Checks

- Five new flow checks cover marking sessions. All flow checks and the layout check passed, tested on an empty copy of the data so real records were untouched.
- All 112 planned days were opened at 1440x800 and 1280x720; none needed scrolling.
