---
id: glossary
type: glossary
date: 2026-04-19
topic: knowledge-base
summary: Plain definitions of words with a special meaning in this project, such as COMPASS, Caught up, infra, EXAM TRAP, Shortbread, the build brief, the gaps list and cca-prep-engine.
tags: [vocabulary, convention]
status: accepted
related: [decision-015-shareable-app-separate-project, decision-006-schedule-in-momentum, decision-004-white-geist-pet, decision-009-new-study-plan, decision-010-study-notes, decision-012-missed-and-caught-up, decision-013-infra-bar-shortcut, logbook-2026-10-26, logbook-2026-10-28, exp-2026-10-28-stage3-unsourced-fact]
---

# Glossary — cca-prep-2027

Short, unambiguous definitions of project-specific vocabulary. For humans onboarding, and for any AI scanner resolving terms without guessing.

---

## COMPASS

Jason's study system for the exam (18 October 2026), combining Tim Ferriss's DiSSS and CaFE into one ordered list in plain words:

- **Cut** into pieces. (Deconstruction)
- **Optimise** for what really matters: the 20% that earns 80% of the marks. (Selection; "Only" and "Omit" were tried first)
- **Map** how you will learn. (Sequencing)
- **Plan** your time in pomodoros. (Frequency)
- **Anchor** every new idea to one you have already learnt. (Encoding)
- **Squeeze** what you have learnt onto one page. (Compression)
- **Set** up the stakes so you do not give up. (Stakes)

Replaces the word DiSSS, which Jason found ugly. Not shown in the app.

## Catch-up

Minutes from a missed Core, Preparation leave or Light review session, moved to later Flexible or Optional buffer days, at most 60 minutes on any day. Worked out afresh from the marks; the schedule file never changes. See decision 006. Outdated: the new plan has no catch-up (decision 009). A missed day can instead be marked Caught up (decision 012).

## Caught up

A button on a missed day in Momentum. It flashes green and turns the day's light red box green, with no time logged. See decision 012.

## Shortbread

The 3D bear on the Pet tab, copied unchanged from the sanctum project. A flat picture of him also peeks in as a reward after a session is marked Done. See decisions 004 and 008.

## Plain words file

`scripts/plain-words.json`. It maps each sentence in the schedule spreadsheet to a very simple version. The importer swaps the simple version in, so the spreadsheet itself never changes. Outdated since 22 October: the new plan uses `scripts/plain-plan.json`, a plain title and task for each study day, keyed by date.

## Infra, code and Wflow

Three marks in the notes editor, each shown in Paper Mono on its own tint (lilac, sand, light green). Code and Wflow words come from a word list (`notes/terms.json`) and are marked everywhere. Infra is marked one place at a time by typing a bar before the word, such as `|agent`; the bar then hides. See decisions 010 and 013.

## EXAM TRAP

Words Jason types in a note to flag a common exam mistake. The editor shows them in dark red, but the saved file keeps plain words.

## SDK practice folder

`~/projects/anthropic-sdk`, outside this project. It holds the Anthropic Python SDK, installed with `uv` on 26 October 2026, for the course's coding exercises. Run files there with `uv run python file.py`. Since the same day, plain `python3` (3.13) also has the SDK, so scripts on the Desktop run too.

## Build brief

`~/Desktop/build-brief-1.1-to-1.3.md`, outside this project. It joins the build exercises from lessons 1.1 to 1.3 on claudecertificationguide.com into one project in three stages: a tool loop, a coordinator with subagents, then sources and parallel subagents. Each stage is a script on the Desktop (such as `stage2_coordinator.py`, `stage3_context.py`) that writes a report. Finished on 28 October 2026, with the stage 2 fusion fix left out on purpose.

## Gaps list

A separate list in the stage 3 finding format where a subagent puts notes such as "my sources are weak" or "I found nothing on this". It keeps those notes out of the list of facts. See exp-2026-10-28-stage3-unsourced-fact.

## cca-prep-engine

The shareable version of this app, in `~/projects/cca-prep-engine`, started 29 October 2026. It works for any Claude exam, keeps each person's data in their browser and uses Claude to build study plans. It has its own journal. See decision-015-shareable-app-separate-project.

## Long session dot

The small dot under a date on the Momentum calendar. It marks a day planned at 2 hours or more; the key calls it "Long session: 2 hours or more".
