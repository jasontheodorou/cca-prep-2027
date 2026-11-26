---
id: decision-019-step-by-step-help
type: decision
date: 2026-11-11
topic: step-by-step help for days with no study guide link
summary: Days with no study guide link get a "Show me how, step by step" button that opens numbered steps, text to copy and a finish check, so the day's card can stay short.
tags: [momentum, schedule, wording, help]
status: accepted
related: [decision-016-thirty-minutes-a-day-two-tries, decision-003-progressive-disclosure-rebuild, logbook-2026-11-11, preferences, glossary]
---

# 019 Step-by-step help for days with no study guide link

## Context

On 11 November the day's card said "Add three tools that read your JSON file ... Run each one by hand and check what comes back." Jason said: "'build some tools by hand' isn't enough instruction for todays task." He asked for "some kind of pop out instruction section that explains what I need to do in dumbo language, for any task like this which doesn't have a link to the study guide", and added "it should be step by step and clear".

Days with a link can lean on the study guide's lesson. Days with no link had only the card's one or two sentences.

## Options considered

1. Make every card's task longer. This breaks the preference that a day fits one screen with no scrolling.
2. Put the steps inside "See all of today's plan" only. This hides help behind a link that does not say it is help.
3. A "Show me how, step by step" button on the card, opening a pop-out, and the same steps inside the full day plan.

## Decision

Option 3. The card stays short. The button appears only on days with no study guide link that have help written.

Each day's help says what the day is for, gives numbered steps with one action each, gives text to copy where there is code, and says how to tell you have finished. Commands to type are shown in the code font.

The help lives in `src/content/how-to.json`, written by `scripts/build-how-to.py`, keyed by the day's title. Keying by title lets the plan be rebuilt without losing the help. The script lists any future no-link day with no help.

## Why

It keeps progressive disclosure (decision 003): short by default, detail when asked for.

## Consequences

- Renaming a day's title in `build-plan.py` loses its help until the same title is used in `build-how-to.py`.
- The practice project folder is assumed to be `~/projects/refund-helper`.
- Days with a study guide link still have no step-by-step help, even when the card is short, such as "Build 1.1: the agent loop".
- The steps are written by hand, 38 sets so far. Any new no-link day needs its own set.

## Checks

- Type check (`npx tsc -b`) passed.
- A test browser showed the button and pop-out at desktop and phone widths with no errors.
- After the deploy, a signed-in test browser on the live site opened the steps on that day's task.
- Jason has not yet said whether the steps are clear enough.
