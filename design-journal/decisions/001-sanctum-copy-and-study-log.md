---
id: decision-001-sanctum-copy-and-study-log
type: decision
date: 2026-10-18
topic: architecture
tags: [sanctum, data, storage, agent]
status: accepted
related: [decision-002-course-order-and-milestones, logbook-2026-10-18]
---

# 001 A separate app built from sanctum, with sanctum's study log

## Context

Jason asked for an exam-prep app using sanctum as the design template, preserving sanctum's functionality, with data access kept apart from the pages and no new backend, auth, service or agent framework without discussion.

## Decision

- A separate project at `~/projects/cca-prep-2027`. Sanctum is not changed. Its tokens, grid, top bar, page frame, footer, form styles, error boundary and storage helpers were copied (`src/sanctum.css` is the copied stylesheet).
- Records follow sanctum's life log: events appended to `data/study-log.jsonl` by a Vite dev-server plugin, with a browser mirror and retry queue. Two event types: `effort.set` and `milestone.set`.
- Recommendations come only from `data/recommendations.json`, written by an agent. No file means "No agent is connected".
- `STUDY_DATA_DIR` moves the data folder, used by the test script.

## Consequences

- Records are readable by an agent today and need no new service.
- The dev-server plugin is a small local process. Jason was told this and can ask for browser-only storage instead.
- Replacing `src/data/store.ts` and `src/data/recommendations.ts` is all the Markdown or agent integration should need.
