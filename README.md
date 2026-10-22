# cca-prep-2027

A small, calm site for preparing for the Claude Certified Architect – Foundations exam (planned for Saturday 20 March 2027). It shows one small thing first and reveals more only when asked.

Four tabs, and Pet:

- **Course**: the unit to look at next, then six section chips. A unit opens in a sheet: a summary, then its ideas one card at a time, then the things to tick.
- **Momentum**: today's job from the study plan, with links to its pages on claudecertificationguide.com, Done and Missed (missed days are not moved, as the plan says), time in one tap, this week as seven dots (green where you studied), every week to the exam on request.

## The study plan

`src/content/schedule.json` is made from the study plan, a Markdown file:

```
python3 scripts/import-plan.py ~/Desktop/study-plan.md
```

Change the plan, then run this again. Only its day-by-day section is read.
- **Study**: notes on one side, the open note on the other. Headings, bold, lists, links, pasted screenshots and YouTube videos. Everything saves itself as Markdown in `notes/`, committed to git a minute after the last change, and each note is tagged with the exam task statements it covers.
- **Progress**: one ring for the whole course and one bar per section. The figures are the share ticked, not a predicted score.

## Running locally

```
npm install
npm start
```

Opens at http://localhost:3025 (Vellum runs it at http://localhost:3005).

## Where records are kept

Study time and ticks are appended to `data/study-log.jsonl` by the local dev server, as in sanctum. The browser keeps a copy, so changes made while the server is stopped are sent when it is back. A deployed static site has no server, so it would not save anything. See `data/README.md` for the format.

Only `src/data/store.ts` knows where data lives. Moving the records to a folder of Markdown files means changing that file.

## Checks

```
npm run verify        # console errors, sideways scroll, alt text, skip link
npm run check:flows   # tabs, logging, editing, ticking, the schedule
```

`check:flows` runs its own server on port 3026 with a temporary data folder, so it never touches your study log.

## Course content

`src/content/course.ts` is a plain-English condensation of the official exam guide, version 1.0 (July 2026). Keep this repository private.

## Before pushing to GitHub

Run `.preship` from this directory. It'll scan for secrets, client data, missing documentation, and verify the remote. Fix anything it flags.
