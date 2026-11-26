# cca-prep-2027

A small, calm site for preparing for the Claude Certified Architect – Foundations exam (planned for Wednesday 5 May 2027). It shows one small thing first and reveals more only when asked.

Four tabs, and Pet:

- **Course**: the unit to look at next, then six section chips. A unit opens in a sheet: a summary, then its ideas one card at a time, then the things to tick.
- **Momentum**: today's job from the study plan, with links to its pages on claudecertificationguide.com, Done and Missed (missed days are not moved, as the plan says), time in one tap, this week as seven dots (green where you studied), every week to the exam on request.

## The study plan

`src/content/schedule.json` is made by a script that holds the plan as lists of days:

```
python3 scripts/build-plan.py
```

Change the lists in the script, then run it again. The plan is 100 days of study from 1 December 2026 to 13 April 2027, with Christmas, the February holiday and three rest days a month off and not counted: 10 days to skim the whole course, 30 on the lessons that carry the most marks, 10 of hard practice and 50 in ten five-day sprints. Practice exams follow until the exam. No day is longer than one hour and most days hold two half-hour jobs. Run `scripts/build-how-to.py` afterwards. The exam is planned for Wednesday 5 May 2027.
- **Study**: notes on one side, the open note on the other. Headings, bold, lists, links, pasted screenshots and YouTube videos. Everything saves itself as Markdown in `notes/`, committed to git a minute after the last change, and each note is tagged with the exam task statements it covers.
- **Progress**: one ring for the whole course and one bar per section. The figures are the share ticked, not a predicted score.

## Running locally

```
npm install
npm start
```

Opens at http://localhost:3025 (Vellum runs it at http://localhost:3005).

## Where records are kept

The online site at https://cca-prep-2027.vercel.app is the main copy since 10 November 2026. Its functions in `api/` keep the study log and the notes in a private Vercel Blob store. The local dev server keeps its own copies in `data/study-log.jsonl` and `notes/`, as in sanctum. The two do not sync by themselves:

```
vercel env pull .env.local --yes
node --env-file=.env.local scripts/pull-from-live.mjs   # online to this machine
node --env-file=.env.local scripts/push-to-live.mjs     # this machine to online
```

The browser keeps a copy of the study log, so changes made while offline are sent later. See `data/README.md` for the format.

## The password gate

`middleware.ts` runs on Vercel before every page, file and API call. Nothing is served without the gate's cookie except the sign-in page. The password is the `SITE_PASSWORD` setting on the Vercel project, and a copy is in the Mac Keychain:

```
security find-generic-password -s cca-prep-2027-site-password -w
```

To change it, run `vercel env add SITE_PASSWORD -e production -e preview --sensitive --force` and deploy again. Every browser is then signed out.

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
