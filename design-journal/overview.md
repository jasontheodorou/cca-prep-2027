---
id: overview-cca-prep-2027
type: overview
date: 2026-11-10
summary: One-screen state of the cca-prep site and Jason's exam study: what it does now, what is open and what to watch out for.
tags: [overview]
status: active
related: [decision-009-new-study-plan, decision-010-study-notes, decision-011-night-mode, decision-012-missed-and-caught-up, decision-013-infra-bar-shortcut, decision-014-exam-moved-to-may, decision-015-shareable-app-separate-project, decision-016-thirty-minutes-a-day-two-tries, decision-017-pass-by-30-june, decision-018-live-site-with-gate-and-storage, logbook-2026-11-10, logbook-2026-11-09, logbook-2026-11-02, logbook-2026-10-28, weekly-2026-W44]
---

# cca-prep-2027 Overview

## What this is

A calm, minimal study site, built from sanctum, for Jason's Claude Certified Architect (Foundations) exam. The exam is planned for Saturday 26 June 2027, inside Jason's own deadline of 30 June. It is not booked (decisions 016 and 017).

## Where things stand

- Five tabs: Course, Progress, Momentum, Notes, Pet.
- Momentum shows today's job. Since 10 November no day is over 30 minutes, Friday is spare, and each lesson takes three days: read it, build it, test it. Each section ends with one of the exam guide's four exercises. Four optional library days (29 January, 12 March, 7 May, 28 May) repeat the exercises and hold a full practice exam. `scripts/build-plan.py` writes the schedule.
- Notes saves Markdown to notes/ and commits automatically. EXAM TRAP shows in dark red; typing |word marks one word infra.
- Live at https://cca-prep-2027.vercel.app behind a password gate since 10 November, and that is now the main copy. The study log and notes are in a private Vercel Blob store (decision 018). The password is in the Mac Keychain as `cca-prep-2027-site-password`. Local dev still runs at `localhost:3005`; pull the online records first.
- A shareable version for colleagues, for any Claude exam, is being built separately as cca-prep-engine (decision 015). This site stays personal.

## Recent sessions

- 10 Nov: deadline to pass set at 30 June; exam moved to 26 June, four official exercises added, August second try dropped.
- 9 Nov: rebuilt the plan for 30 minutes a day with hands-on practice, a first try on 29 May and a second on 28 August.
- 2 Nov: moved the exam to 22 May 2027 and spread the rest of the plan to that date.
- 29 Oct onward: pushed notes live, explained the Friday dot, started cca-prep-engine.
- 28 Oct: finished the build brief; stage 3's "unsourced fact" was a subagent's note with nowhere to go.

## Open questions

- Did both stage 3 research subagents start in one reply?
- What is "jev"? Jason thinks it compresses prompts.
- Does Shortbread's face still flicker?

## Next steps

- Start the practice project (10 November), build lessons 1.1 to 1.3 in it, then lesson 1.4 on 18 November.
- Commit and push the 2 November schedule change.
- Fix the `dev` script in package.json to use port 3005.
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
- [014](decisions/014-exam-moved-to-may.md) Exam moved to May, plan spread out
- [015](decisions/015-shareable-app-separate-project.md) Shareable app is a separate project

## Watch out for

- Commit as the personal email in this repo, or Vercel blocks the deploy.
- `npm run dev` still says port 3025; the site runs on 3005.
- The browser check "it says missed work is not moved" fails, and did before decision 014.
- Week names in the plan no longer match calendar weeks after the stretch.
- After notes editor code changes, the open tab needs a page reload.
- `pip3` is the old Python 3.9. Use `python3 -m pip install --user --break-system-packages`.
- `ANTHROPIC_API_KEY` is in `~/.zshrc`, so Claude Code may bill the key instead of the claude.ai login.
- On this Mac, add `--system-certs` when a `uv` download fails (Netskope).
- Study marks save only through the local server; Vercel shows notes read only.
- Fixes made in cca-prep-engine do not reach this site unless copied by hand.
- No guilt: no streaks, badges or counts of missed days.
- The official exam guide (v1.0, July 2026) is the only authority for course content.
