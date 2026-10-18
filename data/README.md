# Study records

This folder holds Jason's own study records from the exam prep site. It stays on this machine: everything here except this guide is ignored by git.

It exists so an agent can read it and recommend what to do next. Read the study log; never edit or rewrite it.

## study-log.jsonl

One JSON object per line, appended in time order. Nothing is ever changed or deleted: to find the current state, replay the lines from the top. The same rules are in code at `src/data/events.ts` (`replay` rebuilds the state).

Every event has `id`, `at` (when it was recorded, ISO 8601 with Jason's UTC offset) and `type`.

| type | fields | meaning |
|---|---|---|
| `effort.set` | `day` (YYYY-MM-DD), `minutes`, `note` | The study time for that day. The latest event for a day replaces earlier ones. `minutes` 0 with an empty `note` removes the day's entry. |
| `milestone.set` | `milestone` (such as `1.1.2`), `done` (true or false) | Jason marked a milestone as done, or took the mark back. |

A milestone id is a unit id and a line number: `1.1.2` is the second "able to do" line of task statement 1.1, and `E3.4` is step 4 of exercise 3. The units, their lines and their study order are in `src/content/course.ts`, taken from the official exam guide, version 1.0 (July 2026).

Time logged and milestones ticked are separate on purpose. Time shows effort; ticks show what Jason says he can do. Never infer one from the other.

## recommendations.json (written by the agent)

The Recommendations tab shows this file and nothing else. Without it, the tab says no agent is connected.

```json
{
  "agent": "Name of the agent",
  "generatedAt": "2026-10-20T07:30:00+01:00",
  "items": [
    { "action": "One short instruction", "reason": "Why, in a sentence.", "unit": "1.3" }
  ]
}
```

- Only the first three items are shown. Fewer is better.
- `unit` is optional. When it is a unit id from the course, the tab links to that unit.

## Context for recommendations

- The exam is planned for the week of 15 March 2027. The exam has 60 items in 120 minutes, across 4 of the 6 scenarios in the guide.
- Jason is a busy parent with limited energy and childcare commitments. The plan is about an hour each weekday and one longer session of three to four hours a week, with flexibility. He also has two full employer-provided preparation days in total.
- Missed days are normal. Suggestions should notice what is working, be specific and small, and never frame gaps as failure. Do not predict exam scores or chances of passing.
