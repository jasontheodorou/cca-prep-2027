---
id: exp-2026-10-28-stage2-missing-fusion
type: experiment
date: 2026-10-28
topic: build brief stage 2
summary: Why the stage 2 coordinator's report left out fusion power, and why the one-line fix was never made.
tags: [subagents, coordinator, task-decomposition, build-brief]
status: abandoned
related: [logbook-2026-10-28, exp-2026-10-28-stage3-unsourced-fact, training-manual, weekly-2026-W44]
---

# Stage 2: the report left out fusion

## Hypothesis

A coordinator that splits "renewable energy" into subtopics and hands each to a subagent will produce a report covering all six energy types the brief requires: solar, wind, geothermal, tidal, biomass and fusion.

## Approach

`~/Desktop/stage2_coordinator.py` ran on 27 October at 10:21 and wrote `stage2_report.md`. Its `split_topic` prompt allowed "Between 5 and 8 subtopics. No more than 8." The report was checked against the brief's done-when list on 28 October.

## Result

Five of six boxes passed. The coordinator made 8 broad subtopics: solar, wind, hydropower and ocean, geothermal, bioenergy, storage and fuels, grid, and economics and policy. It spent three slots on topics that are not energy sources and gave fusion none. No subagent was asked about fusion, so the report had no fusion section.

## Conclusion

The gap came from how the coordinator split the work, not from the subagents. This is the point of lesson 1.2. The proposed fix was one line in `split_topic`: "Between 6 and 10 subtopics. Each energy source, including fusion, gets its own subtopic." Jason chose not to make it ("can we just move on", then "ok we dont need that"), so the fix is untested.
