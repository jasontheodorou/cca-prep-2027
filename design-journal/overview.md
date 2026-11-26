---
id: overview-cca-prep-2027
type: overview
date: 2026-11-16
summary: One-screen state of the cca-prep site and Jason's exam study: what it does now, what is open and what to watch out for.
tags: [overview]
status: active
related: [decision-009-new-study-plan, decision-010-study-notes, decision-011-night-mode, decision-012-missed-and-caught-up, decision-013-infra-bar-shortcut, decision-015-shareable-app-separate-project, decision-016-thirty-minutes-a-day-two-tries, decision-017-pass-by-30-june, decision-018-live-site-with-gate-and-storage, decision-019-step-by-step-help, logbook-2026-11-11, logbook-2026-11-10, logbook-2026-11-09, weekly-2026-W44]
---

# cca-prep-2027 Overview

## What this is

A calm, minimal study site, built from sanctum, for Jason's Claude Certified Architect (Foundations) exam. The exam is planned for Saturday 15 May 2027. It is not booked (decision 021).

## Where things stand

- Five tabs: Course, Progress, Momentum, Notes, Pet.
- Jason uses only the live site, https://cca-prep-2027.vercel.app, behind a password gate (decision 018). Do not start or offer the local server. Run locally only to test a code change before a deploy.
- The site password was changed on 11 November to one Jason chose. It is in the Mac Keychain as `cca-prep-2027-site-password`. The study log and notes are in a private Vercel Blob store.
- Momentum shows today's job. The plan is 100 one-hour study days from 1 December 2026 to 13 April 2027. Christmas, the February holiday and three rest days a month are off and not counted (decision 021). Days 1 to 10 skim the whole course, 11 to 40 study the lessons that carry the most marks, 41 to 50 are hard practice and 51 to 100 are ten five-day sprints. 14 April to 13 May is six practice exams. Most days hold two half-hour jobs and the calendar shows December to May. `scripts/build-plan.py` writes the schedule; run `scripts/build-how-to.py` after it.
- Days with no study guide link have a "Show me how, step by step" button with numbered steps (decision 019). 38 sets of steps exist, in `scripts/build-how-to.py`.
- Notes saves Markdown. EXAM TRAP shows in dark red; typing |word marks one word infra.
- A shareable version for colleagues is a separate project, cca-prep-engine (decision 015). This site stays personal.
- Everything is committed and pushed. The logbook and weekly notes are kept off GitHub on purpose.

## Recent sessions

- 26 Nov: plan rebuilt as 100 study days in four phases from 1 December, three rest days a month, exam moved to 15 May.
- 11 Nov: changed the site password, moved to online only, added step-by-step help for days with no study guide link.
- 10 Nov: deadline to pass set at 30 June, exam moved to 26 June, site went live behind a password gate.
- 9 Nov: rebuilt the plan for 30 minutes a day with hands-on practice.

## Open questions

- Is the practice project `~/projects/refund-helper` or practice-helper? The how-to steps assume refund-helper.
- Should days that have a study guide link also get step-by-step help? Some cards are short, such as "Build 1.1: the agent loop".
- Are the new steps clear enough? Jason has not said.
- What is "jev"? Jason thinks it compresses prompts.
- Does Shortbread's face still flicker?

## Next steps

- 1 December, day 1: read how the exam works, then book it for 15 May.
- Fix the folder name in `scripts/build-how-to.py` if the practice project is not refund-helper.
- Move the API key out of `~/.zshrc` into the course folder only.

## Key decisions

- [001](decisions/001-sanctum-copy-and-study-log.md) Separate app, append-only study log
- [002](decisions/002-course-order-and-milestones.md) Course order and milestones
- [003](decisions/003-progressive-disclosure-rebuild.md) Progressive disclosure
- [004](decisions/004-white-geist-pet.md) White, Geist, Pet tab
- [007](decisions/007-recommendations-removed.md) Recommendations removed
- [008](decisions/008-study-rewards.md) Small rewards for studying
- [009](decisions/009-new-study-plan.md) New study plan
- [010](decisions/010-study-notes.md) Notes tab
- [011](decisions/011-night-mode.md) Night mode
- [012](decisions/012-missed-and-caught-up.md) Missed and Caught up
- [013](decisions/013-infra-bar-shortcut.md) Infra bar shortcut
- [015](decisions/015-shareable-app-separate-project.md) Shareable app is a separate project
- [016](decisions/016-thirty-minutes-a-day-two-tries.md) Thirty minutes a day
- [017](decisions/017-pass-by-30-june.md) Pass by 30 June, exam on 26 June
- [018](decisions/018-live-site-with-gate-and-storage.md) Live site with password gate and storage
- [019](decisions/019-step-by-step-help.md) Step-by-step help for days with no study guide link
- [020](decisions/020-one-hour-a-day-exam-in-march.md) One hour a day, exam on 27 March (replaced the same day)
- [021](decisions/021-one-hundred-days-four-phases.md) One hundred days in four phases, exam on 24 April

## Watch out for

- Commit as the personal email in this repo, or Vercel blocks the deploy.
- To change a Vercel setting, remove it and add it again, check `vercel env ls`, then redeploy. `--force` did not replace the value.
- The Keychain item's account name is `cca-prep-2027`. A different account name makes a second item.
- Renaming a day's title in `build-plan.py` loses its how-to steps until `build-how-to.py` uses the same title.
- `.preship`, the pre-push check, is missing from the project folder.
- Never write the site password in the journal or in chat summaries.
- The browser check "it says missed work is not moved" fails, and has for weeks.
- After notes editor code changes, the open tab needs a page reload.
- `pip3` is the old Python 3.9. Use `python3 -m pip install --user --break-system-packages`.
- `ANTHROPIC_API_KEY` is in `~/.zshrc`, so Claude Code may bill the key instead of the claude.ai login.
- On this Mac, add `--system-certs` when a `uv` download fails (Netskope).
- Fixes made in cca-prep-engine do not reach this site unless copied by hand.
- No guilt: no streaks, badges or counts of missed days.
- The official exam guide (v1.0, July 2026) is the only authority for course content.
