# Study records

This folder holds Jason's own study records from the exam prep site. Everything here except this guide is ignored by git.

Since 10 November 2026 the online site is the main copy and keeps the log in a private store. The file here can be out of date: run `node --env-file=.env.local scripts/pull-from-live.mjs` before reading it.

It exists so an agent can read it. Read the study log; never edit or rewrite it.

## study-log.jsonl

One JSON object per line, appended in time order. Nothing is ever changed or deleted: to find the current state, replay the lines from the top. The same rules are in code at `src/data/events.ts` (`replay` rebuilds the state).

Every event has `id`, `at` (when it was recorded, ISO 8601 with Jason's UTC offset) and `type`.

| type | fields | meaning |
|---|---|---|
| `effort.set` | `day` (YYYY-MM-DD), `minutes`, `note` | The study time for that day. The latest event for a day replaces earlier ones. `minutes` 0 with an empty `note` removes the day's entry. |
| `milestone.set` | `milestone` (such as `1.1.2`), `done` (true or false) | Jason marked a milestone as done, or took the mark back. |
| `session.set` | `day` (YYYY-MM-DD), `status` (`done`, `missed`, `caught` or `none`) | Jason marked that day's planned session. `caught` means he missed it and caught up later; no time is logged for it. `none` takes the mark back. Missed work moves to later flexible days; the rules are in `src/lib/schedule.ts`. |

A milestone id is a unit id and a line number: `1.1.2` is the second "able to do" line of task statement 1.1, and `E3.4` is step 4 of exercise 3. The units, their lines and their study order are in `src/content/course.ts`, taken from the official exam guide, version 1.0 (July 2026).

Time logged and milestones ticked are separate on purpose. Time shows effort; ticks show what Jason says he can do. Never infer one from the other.

## Context for an agent reading the log

- The exam is planned for Saturday 26 June 2027 (an assumption, not a booking). Jason's own deadline to pass is 30 June 2027. The day-by-day plan is in `src/content/schedule.json`; days marked done or missed are `session.set` events. The exam has 60 items in 120 minutes, across 4 of the 6 scenarios in the guide.
- Jason is a busy parent with limited energy and childcare commitments. Since 10 November 2026 the plan is 30 minutes a day at most, six days a week, with Friday spare. Each lesson takes three days: read it, build it, test it. Each section ends with one of the guide's four exercises, one step a day. The plan is made by `scripts/build-plan.py`.
- Missed days are normal. Anything written for Jason should notice what is working, be specific and small, and never frame gaps as failure. Do not predict exam scores or chances of passing.
