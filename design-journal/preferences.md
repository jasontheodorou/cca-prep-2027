---
id: preferences
type: preferences
date: 2026-10-22
summary: What Jason likes, rejects and asks for, in Jason's own words, for the schedule, wording, step-by-step help, rewards, layout, the notes editor, hosting and passwords, sharing the app and how course concepts are explained.
tags: [preferences, taste, wording, schedule, rewards, learning, notes, billing, sharing, hosting]
status: active
related: [decision-019-step-by-step-help, logbook-2026-11-11, decision-015-shareable-app-separate-project, logbook-2026-11-02, decision-006-schedule-in-momentum, decision-007-recommendations-removed, decision-008-study-rewards, decision-013-infra-bar-shortcut, logbook-2026-10-26, logbook-2026-10-28]
---

# Preferences

Taste, wording, process and tools, grouped by topic. Each entry quotes the
person with a date, and says what it means in practice.

## Layout and tabs

- Keep to the existing tabs. The schedule went under Momentum, not a new tab: "it would need to live under momentum" (21 October 2026). Recommendations was removed: "we dont need it" (21 October 2026). Menu is now Course, Progress, Momentum, Notes, Pet (22 October 2026).

## Schedule in Momentum

- 21 October 2026, "Well done", after: soft plum wash for planned days (no dark rings), sanctum's pop-out card on hover, plain words at a very low reading age, cards cut to about 17 words, and the session sheet fitting one screen. Means: keep schedule text short and plain, and never make Jason scroll a day's plan.
- "I don't like the black outline" (21 October 2026). Avoid dark outlines on calendar days.

## Wording

- Wants very plain words: "write everything in plain English for a total dumbo to understand ... Reading age of 5" (21 October 2026). Then cut card text twice: "can we cut it by 30%", "Lose another 10%. There should be no need to scroll down". Means: short sentences, few words, and measure the cut.

- A short task card is not enough when the day has no study guide link: "'build some tools by hand' isnt' enough instruction for todays task" (11 November 2026). Asked for "some kind of pop out instruction section that explains what I need to do in dumbo language", "step by step and clear". Means: keep the card short, and give every such day numbered steps with one action each, text to copy, and a way to tell it is finished (decision 019).

## Notes editor

- Prefers typed markup to word lists for marking terms. Dropped a shared infra list after "agent" got marked everywhere, then: "we use it as essentially a form of markdown syntax" (26 October 2026). Means: marks apply where typed, and the marker character hides once used.
- Changed the infra marker twice in one sitting: _ first, then "ok forget that let's use | instead, using _ creates problems" (26 October 2026). Means: avoid characters that already mean something in Markdown.
- Wants names kept exactly as typed: "retain the case for infra as I have written it e.g. AgentDefinition not agentdefinition" (26 October 2026).

## Learning

- Wants course concepts explained very simply, then tied to what Jason already knows. Asked "in dumbo language what did I actually do" (26 October 2026), then tested each idea with his own guesses ("so its for people who want to build python web apps"). Means: say what the thing is for in one line, then correct or confirm each guess directly with "Yes", "Partly" or "No".
- Short explanations should have a paragraph break after every sentence or two. Asked for "5 sentences" in "dumbo language", then on getting one block: "good but give me that with some para breaks you goofball" (28 October 2026). Means: never send a short explanation as one dense paragraph.
- Skips exercise steps that are not needed to learn the point. Left the stage 2 fusion fix with "can we just move on", then "ok we dont need that" once it was explained (28 October 2026). Means: explain the lesson behind a failed check, offer the fix once, and move on if he declines.
- For secrets, wants one command that prompts for the value: "give me a command that then prompts me to enter the api key on a new line" (26 October 2026). Means: never ask for a key in chat; give a hidden-input command that stores it in the Keychain.
- Types the course's commands himself with `!` in the Claude Code prompt when that is the point of the exercise (26 October 2026). Means: give one copy-paste line at a time, and explain any error before the next step.

## Tools, hosting and billing

- Wants Claude Code on the claude.ai subscription, not paid API billing: "stop using api and use claude.ai" (26 October 2026). Means: keep any API key for course code out of the shell setup that Claude Code reads. The key was put back in `~/.zshrc` later that day, so this is not settled.

- Uses only the online site: "I will only use the vercel site from now on, not the localhost" (11 November 2026). Means: when asked to open the project, give https://cca-prep-2027.vercel.app and do not start the local server. Run locally only to test a code change before it goes live.
- Picks his own site password. Replaced a random four-word one with his own choice, and answered advice that it was easier to guess with "yeah yeah" (11 November 2026). Means: set what he asks for, say a risk once, and do not repeat it.
- Expects finished work to be live: "push everything live if you aint already" (11 November 2026). Means: commit, push and deploy without waiting to be asked, then say what was checked on the live site.

## Sharing the app

- Wants a light helper, not a product: "it doesnt need to be enterprise grade just a lil helper" (29 October 2026). Means: prefer no server, no sign-in and no database when sharing.
- Wants a simple password only: "nothing much too personal here just study notes for an exam right" (29 October 2026). Means: one shared password, no accounts.
- Wants to set it up once and hand out a link, while a cloned copy should "work straight out the box" (29 October 2026). Means: no settings needed to run; optional settings for Claude features.
- Keeps Shortbread in shared versions: "I think that Shortbread should stay honestly" (29 October 2026).
- Not worried about API cost: "We have so much juice on the API key" (29 October 2026). Means: using Claude for features is fine; still suggest a spending limit.

## Rewards and motion

- Likes small rewards for studying, but only if they stay out of the way: "add them all as long as they dont clutter the design" (21 October 2026). Means: each reward plays once and leaves nothing on screen; no streaks, badges or counts of misses.
