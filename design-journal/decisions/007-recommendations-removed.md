---
id: decision-007-recommendations-removed
type: decision
date: 2026-10-21
topic: interface
summary: Why the Recommendations tab was removed, what code went with it, and where a copy is kept.
tags: [recommendations, tabs, removal]
status: accepted
related: [decision-001-sanctum-copy-and-study-log, decision-003-progressive-disclosure-rebuild, decision-006-schedule-in-momentum, logbook-2026-10-21, logbook-2026-10-22]
---

# 007 The Recommendations tab is removed

## Context

Jason: "get rid of ... we dont need it", then "i meant recommendations". No agent was ever connected; the tab only ever said so.

## Decision

- Removed the tab, its page (`src/features/Recommendations.tsx`), its data module (`src/data/recommendations.ts`), its styles, its server route (`/api/recommendations`) and its flow checks. Both files are kept in `artefacts/2026-10-21-recommendations-*.ts*`.
- The menu is Course, Momentum, Progress and Pet. `data/README.md` keeps the context an agent reading the study log needs, without the recommendations.json format.
- Clawd's unused "recommendations" pose is left in `Clawd.tsx`; it does nothing on its own.

## Consequences

- An agent can still read `data/study-log.jsonl`; there is no longer anywhere in the site to show what it suggests.
- This replaces the recommendations part of decision 001 (an agent writing `data/recommendations.json`).
- Jason first wrote "get rid of momentum", a slip. Claude asked before deleting anything, which avoided removing the wrong tab.

## Checks

- The tab-count check now expects four tabs. All flow checks pass. Not yet committed at the end of the session.
