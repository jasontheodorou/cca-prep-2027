# cca-prep-2027

A small, calm site for preparing for the Claude Certified Architect – Foundations exam (planned for the week of 15 March 2027). It shows one small thing first and reveals more only when asked.

Four tabs:

- **Course**: the unit to look at next, then six section chips. A unit opens in a sheet: a summary, then its ideas one card at a time, then the things to tick.
- **Momentum**: today's time in one tap, this week as seven dots (green where you studied), every week to the exam on request.
- **Progress**: one ring for the whole course and one bar per section. The figures are the share ticked, not a predicted score.
- **Recommendations**: shows what a connected agent writes. No agent is connected yet.

## Running locally

```
npm install
npm start
```

Opens at http://localhost:3025.

## Where records are kept

Study time and ticks are appended to `data/study-log.jsonl` by the local dev server, as in sanctum. The browser keeps a copy, so changes made while the server is stopped are sent when it is back. A deployed static site has no server, so it would not save anything. See `data/README.md` for the format and for how an agent should write recommendations.

Only `src/data/store.ts` and `src/data/recommendations.ts` know where data lives. Moving the records to a folder of Markdown files, or connecting an agent another way, means changing those two files.

## Checks

```
npm run verify        # console errors, sideways scroll, alt text, skip link
npm run check:flows   # tabs, logging, editing, ticking, recommendation states
```

`check:flows` runs its own server on port 3026 with a temporary data folder, so it never touches your study log.

## Course content

`src/content/course.ts` is a plain-English condensation of the official exam guide, version 1.0 (July 2026). Keep this repository private.

## Before pushing to GitHub

Run `.preship` from this directory. It'll scan for secrets, client data, missing documentation, and verify the remote. Fix anything it flags.
