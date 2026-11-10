---
id: exp-2026-10-28-stage3-unsourced-fact
type: experiment
date: 2026-10-28
topic: build brief stage 3
summary: Why a research subagent's note about weak sources showed up as a "fact" with no source, and how a separate gaps list fixed it on the second run.
tags: [agent-sdk, subagents, context-passing, provenance]
status: complete
related: [logbook-2026-10-28, exp-2026-10-28-stage2-missing-fusion, training-manual, weekly-2026-W44]
---

# Stage 3: one "fact" with no source

## Hypothesis

If every subagent returns findings in a format that keeps content apart from source, every fact in the synthesis will have a source.

## Approach

Ran `~/Desktop/stage3_context.py` (Claude Agent SDK, coordinator plus web-researcher, doc-analyst and synthesiser subagents, made-up tools). Each finding had `content` (claim, analysis) and `source` (source_url, document_name, page_number, confidence, retrieved_by).

## Result

First run: eight real facts all kept their URL or file and page. The check flagged one item with no source. It was not a fact: the web researcher's note that its sources were weak and some questions were unanswered. The note also said the coordinator had asked for "fact/source" fields, which clashed with the subagent's own format.

Second run, after the fix (14:30): 8 facts, all with a source, no unsourced items, and the note listed under Gaps. The count of research subagents started in one reply was only shown in Jason's Terminal and was not checked.

## Conclusion

Two causes, both about what passes between agents, not the synthesis prompt. The format had nowhere to put gaps or doubts, so a note was squeezed in as a finding. And the coordinator wrote its own format into the subagent prompt, which contradicted the subagent's system prompt. Fix: add a separate `gaps` list to the format, and tell the coordinator not to describe a format to subagents. Copies of the first script and report are in artefacts (2026-10-28-stage3-*).
