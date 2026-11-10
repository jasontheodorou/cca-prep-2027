---
id: decision-013-infra-bar-shortcut
type: decision
date: 2026-10-26
topic: notes
summary: Infra is no longer on the word list; typing |word marks that one word infra and hides the bar, like a Markdown shortcut.
tags: [notes, editor, infra, markdown]
status: accepted
related: [decision-010-study-notes, logbook-2026-10-26, training-manual]
---

# 013 Infra words are marked with a | shortcut

## Context

Marking "agent" as infra put the infra band on every "agent" in every note, because infra was on the shared word list. Jason: "from now on something needs _ in front of it to be classified as infra, this is so I don't accidentally make common words marked as infra". Then: "let's use | instead, using _ creates problems". Then: "once the | is added and the text written, turn the text to infra but drop the | from visibility, we use it as essentially a form of markdown syntax".

## Options considered

- Keep infra on the list, but only match words written with _. Tried, then dropped: _ also means italics in Markdown.
- The same with |, with the bar left in the text. Tried, then dropped: Jason wanted the bar hidden.
- Hide the bar but keep it in the text. Rejected: an unseen character makes the cursor and Backspace behave oddly.
- Treat | as a Markdown shortcut that is removed once the word is finished. Chosen.

## Decision

- `applyBars` in src/lib/autoMark.ts runs on every change. It turns each finished "|word" into "word" with the infra mark. A word the cursor is still at the end of waits, as does one just followed by . or - (so "|CLAUDE.md" waits for "md").
- The | only counts at the start of a word, so "a | b" and "x|y" stay as typed.
- Infra is no longer on notes/terms.json. The list rule now controls code and workflow only, so infra marks stay where they are put.
- The Infra button marks or unmarks the selected word in that place only.
- The saved file keeps `<span data-infra>word</span>`, with no bar.

## Consequences

- To make another "agent" infra, type |agent again or use the button there.
- "Messages api." keeps its infra mark in its note, and is off the list.
- An open notes tab keeps the old rules until the page is reloaded. Jason reported "its not working" until he reloaded.
- Infra words show with the capitals typed (`text-transform: none`), because names such as AgentDefinition are case-sensitive in Claude's tools. Workflow words still show in lower case.

## Checks

Tested in a headless browser with saves intercepted: "|agent", "|CLAUDE.md" and "|hooks." became infra with no bar; "a | b" and "x|y" were left alone. A later fix (`blockText`) stopped a Shift+Enter line break earlier in the paragraph from shifting the mark one letter. Jason confirmed it worked after a reload: "ok nwo it is".
