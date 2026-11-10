---
id: index
type: index
summary: Every journal entry with a one-line summary. Rebuilt automatically, so do not edit it.
---

# Index

## Start here

- `overview.md`: One-screen state of the cca-prep site and Jason's exam study: what it does now, what is open and what to watch out for.
- `preferences.md`: What Jason likes, rejects and asks for, in Jason's own words, for the schedule, wording, rewards, layout, the notes editor, sharing the app and how course concepts are explained.
- `glossary.md`: Plain definitions of words with a special meaning in this project, such as COMPASS, Caught up, infra, EXAM TRAP, Shortbread, the build brief, the gaps list and cca-prep-engine.
- `training-manual.md`: Lessons from this project that apply elsewhere, on CSS animation names, 3D flicker, deploy identity, sharing a personal app safely, uv and pip on a locked-down Mac, rich-text editor pitfalls, API key protection, prompt caching and multi-agent design.

## Decisions

- `decisions/001-sanctum-copy-and-study-log.md` (2026-10-18, accepted): Why cca-prep is a separate app copied from sanctum, and how study records are kept in an append-only log file.
- `decisions/002-course-order-and-milestones.md` (2026-10-18, accepted): How the exam guide was turned into course units, in what order, and how 147 milestones measure progress.
- `decisions/003-progressive-disclosure-rebuild.md` (2026-10-18, accepted): Why the site was rebuilt to show one thing at a time, and how each tab hides detail until asked.
- `decisions/004-white-geist-pet.md` (2026-10-18, accepted): The settled look (full width, Geist font, white, muted section colours) and why the Pet tab with Shortbread was added.
- `decisions/005-how-i-study.md` (2026-10-18, superseded): A "How I study" card and seven-step sheet on Course, removed the same day because it felt overcomplicated.
- `decisions/006-schedule-in-momentum.md` (2026-10-21, superseded): How the day-by-day study schedule is imported into Momentum, marked Done or Missed, and how missed work is spread over later days.
- `decisions/007-recommendations-removed.md` (2026-10-21, accepted): Why the Recommendations tab was removed, what code went with it, and where a copy is kept.
- `decisions/008-study-rewards.md` (2026-10-21, accepted): Which small reward animations play when Jason studies, the rules they follow, and the clash that broke the site's text.
- `decisions/009-new-study-plan.md` (2026-10-22, accepted): Momentum now runs on Jason's new Markdown study plan (exam Saturday 20 March 2027), with links to claudecertificationguide.com and no catch-up.
- `decisions/010-study-notes.md` (2026-10-22, accepted): A Study tab for notes, a minimal Notion-like editor saving Markdown files to notes/ in git, auto-tagged with exam task statements.
- `decisions/011-night-mode.md` (2026-10-22, accepted): A soft night mode for every page, switched by a day-to-night toggle that, like the manager switch, stays hidden until the pointer comes near.
- `decisions/012-missed-and-caught-up.md` (2026-10-26, accepted): A missed day shows as a light red box in Momentum, needs no time, and a Caught up button flashes green and turns the day green.
- `decisions/013-infra-bar-shortcut.md` (2026-10-26, accepted): Infra is no longer on the word list; typing |word marks that one word infra and hides the bar, like a Markdown shortcut.
- `decisions/014-exam-moved-to-may.md` (2026-11-02, accepted): The exam moves to Saturday 22 May 2027 and the rest of the plan is spread out, from about 5 to 8 hours a week down to about 4.
- `decisions/015-shareable-app-separate-project.md` (2026-11-02, accepted): Why the shareable version for colleagues became a separate project, cca-prep-engine, and why cca-prep-2027 stays Jason's personal study site.

## Experiments

- `experiments/2026-10-22-shortbread-face-flicker.md` (2026-10-22, inconclusive): Two attempts to stop Shortbread's face flickering, why the first missed, and why the fix could not be seen in testing.
- `experiments/2026-10-28-stage2-missing-fusion.md` (2026-10-28, abandoned): Why the stage 2 coordinator's report left out fusion power, and why the one-line fix was never made.
- `experiments/2026-10-28-stage3-unsourced-fact.md` (2026-10-28, complete): Why a research subagent's note about weak sources showed up as a "fact" with no source, and how a separate gaps list fixed it on the second run.
- `experiments/README.md` (2026-04-19, accepted): experiments/

## Weekly round-ups

- `weekly/2026-W44.md` (2026-11-02, complete): The week of the notes editor shortcuts, the Python and API key set-up, and the finished build brief for lessons 1.1 to 1.3 with its two agent design lessons.
- `weekly/2026-W43.md` (2026-10-26, complete): The week the study schedule moved into Momentum, was replaced by a new plan, and the Notes tab with code, infra and workflow marks was built.
- `weekly/2026-W42.md` (2026-10-19, complete): The week the project was created and built in one day, with its first five decisions.

## Logbook, newest first

- `logbook/2026-11-02.md` (2026-11-02, active): Moved the exam to 22 May 2027 and spread the plan out; also, from a session begun 29 October, the notes push, the Friday dot, and the spin-off of a shareable app for any Claude exam.
- `logbook/2026-10-28.md` (2026-10-28, active): The day the build brief for lessons 1.1 to 1.3 was finished, why stage 3 first flagged an "unsourced fact", and why the stage 2 fusion gap was left unfixed.
- `logbook/2026-10-27.md` (2026-10-27, active): Short session that opened the project and restarted the local site on port 3005 after it had stopped.
- `logbook/2026-10-26.md` (2026-10-26, active): Notes editor changes (EXAM TRAP in red, the | infra shortcut, Caught up days in Momentum), the push to main, and setting up Python 3.13, the Anthropic SDK and an API key for the course exercises.
- `logbook/2026-10-23.md` (2026-10-23, active): Opened the project, started the site on port 3005, pushed all outstanding work to GitHub.
- `logbook/2026-10-22.md` (2026-10-22, active): Loose ends from the long 21 October session, including the blocked Vercel deploy caused by the wrong commit email.
- `logbook/2026-10-21.md` (2026-10-21, complete): The day the study schedule went into Momentum with catch-up, the text was made very plain, reward animations were added and the Recommendations tab was removed.
- `logbook/2026-10-18.md` (2026-10-18, complete): How the site was first built from sanctum and the exam guide, then rebuilt and restyled on the same day.

## Artefacts

- `artefacts/2026-10-18-compass-phone.png`
- `artefacts/2026-10-18-compass.html`
- `artefacts/2026-10-18-compass.png`
- `artefacts/2026-10-18-how-i-study-routine.ts`
- `artefacts/2026-10-21-dsp-schedule.xlsx`
- `artefacts/2026-10-21-recommendations-data.ts`
- `artefacts/2026-10-21-recommendations-tab.tsx`
- `artefacts/2026-10-21-shortbread-pet-before.js`
- `artefacts/2026-10-22-old-import-schedule.py.txt`
- `artefacts/2026-10-22-old-Momentum.tsx.txt`
- `artefacts/2026-10-22-old-plain-words.json`
- `artefacts/2026-10-22-old-schedule.json`
- `artefacts/2026-10-22-old-schedule.ts.txt`
- `artefacts/2026-10-22-study-plan.md`
- `artefacts/2026-10-22-styles-before-dark-mode.css`
- `artefacts/2026-10-28-stage3-context-before.py.txt`
- `artefacts/2026-10-28-stage3-report-run1.md`
- `artefacts/2026-11-02-import-plan-before.py.txt`
- `artefacts/2026-11-02-schedule-march-exam.json`
- `artefacts/README.md`
