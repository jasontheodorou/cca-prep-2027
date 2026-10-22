# CCAR-F Study Plan

**Claude Certified Architect – Foundations**
**22 October 2026 → Exam: Saturday 20 March 2027**

---

## How to use this

Your budget is 30 minutes a day minimum, one 2-hour block each week (parked on Saturday mornings), a half-day off work each week for the 8 weeks before the exam, and two full days off on Thursday 18 and Friday 19 March.

That is roughly 5 hours a week until late January, then about 8. Over 21 weeks, minus Christmas and two holidays, it is comfortably enough — provided the daily 30 minutes actually happens. The daily habit matters more than any single long session.

Two holiday weeks are pencilled in at **w/c 23 November** and **w/c 8 February**. If yours fall elsewhere, swap the holiday week with the nearest study week and keep the order of everything else intact. Do not try to compress two weeks into one.

Your main text is **claudecertificationguide.com** (30 free lessons, no sign-up). The authority is still Anthropic's Exam Guide v1.0 PDF — where the site and the guide disagree, the guide wins.

---

## 1. Where the marks are

Aim for **45 of 60**. The pass is a scaled 720 out of 1,000 and the raw percentage is never published, so build a buffer rather than aiming at the line.

| Domain | Weight | Approx. questions | Lessons | Character | Priority |
|---|---|---|---|---|---|
| 1. Agentic Architecture & Orchestration | 27% | ~16 | 1.1–1.7 | Most judgement, needs hands-on | First |
| 3. Claude Code Configuration & Workflows | 20% | ~12 | 3.1–3.6 | Mostly recall: paths, flags, frontmatter | Cheapest marks |
| 4. Prompt Engineering & Structured Output | 20% | ~12 | 4.1–4.6 | Half judgement, half recall | Second |
| 2. Tool Design & MCP Integration | 18% | ~11 | 2.1–2.5 | Overlaps heavily with Domain 5 | Third |
| 5. Context Management & Reliability | 15% | ~9 | 5.1–5.6 | Overlaps heavily with Domain 2 | Third |

Domain 3 is the best return on your time: twelve questions that mostly turn on knowing where a file goes or which flag to pass. Domains 2 and 5 share the same error-handling and context ideas — study them as one 20-question block.

You cannot pass on Domain 3 alone, but you can pass on **Domain 1 + Domain 3 + the answer patterns below**. That is the spine of this plan.

---

## 2. The answer patterns

Most questions are decided by nine judgement rules, not by recall. Learn these first and you will guess well even on material you never studied. Write them out in your own words on one page in December, and re-read that page every fortnight after.

1. **Fix the root cause the evidence points at.** If the coordinator's logs show a bad decomposition, the fault is the coordinator — not the subagents that executed their assignments correctly.

2. **Be proportionate.** When two options both work, the cheaper, smaller one wins as a *first step*. Better tool descriptions beat adding few-shot examples. Prompt criteria beat training a classifier.

3. **Determinism where it matters.** If a rule must never be broken — verify identity before refunding, block refunds over $500 — enforce it in code with a hook or a prerequisite gate. Prompts have a non-zero failure rate.

4. **Model self-confidence and customer sentiment are never valid routing signals.** Any option that routes on a 1–10 confidence score or on detected frustration is wrong.

5. **Structured beats generic, everywhere.** Errors carry a category, a retryable flag, what was attempted, and partial results. Findings carry their source and their date.

6. **Never suppress and never nuke.** Returning an empty result as success hides the failure. Terminating the whole workflow on one subagent failure throws away recoverable work.

7. **Least privilege on tools.** Give an agent a narrow tool for its common case and route the rest through the coordinator. Giving it everything, or eighteen tools, degrades selection.

8. **Split the work to beat attention dilution.** Per-file passes plus a cross-file pass. A bigger context window does not fix attention quality.

9. **Explicit criteria beat vague instructions.** "Be conservative" and "only report high-confidence findings" never win. Named categories with concrete examples do.

### Distractor tells

An option is usually wrong when it:

- Invents a feature that does not exist (`--batch`, `CLAUDE_HEADLESS`, a `.claude/config.json` commands array)
- Shifts work onto humans (making developers split their PRs)
- Adds ML infrastructure or a classifier before prompting has been tried
- Relies on consensus across repeated runs
- Fixes tool *availability* when the problem is tool *ordering*, or vice versa

---

## 3. The sandbox project

Build one repo and keep extending it until March. Repetition on the same codebase is what makes this stick, and it removes the overhead of starting something new each week.

Make it a **fake returns-and-refunds support agent**, because that scenario touches Domains 1, 2 and 5 at once. Use a JSON file as the backend. Nothing needs to be real.

| Step | What you build | Scheduled |
|---|---|---|
| 1 | Repo, root `CLAUDE.md`, three MCP tools (`get_customer`, `lookup_order`, `process_refund`) over a JSON file | Sat 24 Oct |
| 2 | The agentic loop: send → inspect `stop_reason` → run tool → append result → repeat. Terminate only on `end_turn` | Sat 31 Oct |
| 3 | Structured errors on every tool: `errorCategory`, `isRetryable`, readable message. Force each category | Sat 7 Nov |
| 4 | A `PostToolUse` hook normalising three date formats; an interception hook blocking refunds over $500 | Sat 9 Jan |
| 5 | The Claude Code layer: `.claude/rules/` with glob frontmatter, `/review` in `.claude/commands/`, a skill with `context: fork` and `allowed-tools`, `.mcp.json` with `${SOME_TOKEN}` | Sat 14 Nov |
| 6 | An extraction tool as a JSON schema. Feed it documents with missing fields; confirm null, not invention | Sat 5 Dec |
| 7 | A validation-retry loop sending back the document, the failed extraction, and the specific error | Sat 12 Dec |
| 8 | A coordinator spawning two subagents via the Task tool, in parallel, in one response. Findings carry source and date | Sat 16 Jan |
| 9 | Make a subagent time out. Coordinator gets structured error context and still finishes, annotating coverage gaps | Sat 23 Jan |
| 10 | A GitHub Action running `claude -p` with `--output-format json` to post review comments | Sat 21 Nov |

After every session, write **three sentences in `NOTES.md`** saying what surprised you. That file is your revision material in March. It is non-negotiable and takes two minutes.

---

## 4. How to use claudecertificationguide.com

Each of the 30 lessons has the same shape, and you should use it the same way every time:

1. **What You Need to Know** — the body text. Read it once, properly.
2. **Concept Check** — do it immediately. If you score badly, re-read before moving on.
3. **Exam Traps** — the highest-value boxes on the site. These are what the examiner actually tests.
4. **Practice Scenario** — answer before revealing. Say *why* the other three are wrong, out loud.
5. **Build Exercise** — only on Saturdays, folded into your sandbox. Don't do these on weeknights.
6. **Mark Complete** — tick it, so the progress bar keeps you honest.

Other pages, and when they're used in this plan:

- **`/diagnostic`** — sat twice: Fri 23 Oct (cold baseline) and Wed 6 Jan (post-Christmas check)
- **`/drill?domain=N`** — Drill Mode, your Sunday and weekday workhorse. Used ~20 times below
- **`/exercises`** — Build Exercises, folded into Saturday sessions
- **`/quick-reference/domain-N`** — your flashcard source. Harvest from here, don't invent cards
- **`/glossary/domain-N`** — when a term in a lesson doesn't land
- **`/mock-exam`** — three full timed sits: 27 Feb, 13 Mar, 18 Mar

**One caution.** Lesson 1.1 has a "Current state" box noting that the real Messages API returns more `stop_reason` values than the two the exam keys (`pause_turn`, `max_tokens`, `refusal` and others). That is true and useful for your actual work. **On the exam, answer `tool_use` and `end_turn`.** The exam is keyed to Guide v1.0. Watch for similar "current state" boxes elsewhere and keep the two mental models separate.

---

## 5. The weekly shape

| Day | Length | What |
|---|---|---|
| Mon–Fri | 30 min | 10 min flashcards, then one lesson / drill / writing task |
| Saturday | 2 hrs | The build block: sandbox step or mock exam |
| Sunday | 30 min | Drill Mode, or answering your own questions cold |
| Half-day (from w/c 25 Jan) | 3–4 hrs | Scenario walkthrough or timed practice set, midweek |

Friday is the designated soft day. If one day a week has to go, make it Friday — never the Saturday block, and never the flashcards.

**Writing your own questions** is the single highest-value weeknight activity. Inventing three plausible wrong answers forces you to articulate why the right one wins, which is exactly the skill being tested.

---

# 6. The day-by-day plan

Every date from today to the exam. `[2h]` marks the weekly long block. `[HALF-DAY]` marks your work study time. Default is 30 minutes, always opening with 10 minutes of flashcards.

---

## Week 0 — Thu 22 to Sun 25 October · Setup and baseline

| Date | Day | Task |
|---|---|---|
| 22 Oct | Thu | Read Exam Guide sections 3, 4 and 5 only — exam details, blueprint, the six scenarios. Do **not** read the objectives yet. |
| 23 Oct | Fri | Sit `/diagnostic` cold. Expect a bad score; that is the point. Record the per-domain split in `NOTES.md`. |
| 24 Oct | Sat | **[2h]** Sandbox step 1. Repo, `CLAUDE.md`, three stub MCP tools over a JSON file. |
| 25 Oct | Sun | Create the flashcard deck. Harvest the first 15 cards from `/quick-reference/domain-1`. |

---

## Week 1 — Mon 26 Oct to Sun 1 Nov · Domain 1, first half

| Date | Day | Task |
|---|---|---|
| 26 Oct | Mon | Lesson **1.1 Agentic Loops**. Read, Concept Check, Exam Traps, Practice Scenario. |
| 27 Oct | Tue | Lesson **1.2 Multi-Agent Orchestration**. |
| 28 Oct | Wed | Lesson **1.3 Subagent Invocation and Context Passing**. |
| 29 Oct | Thu | Lesson **1.4 Workflow Enforcement and Handoff**. |
| 30 Oct | Fri | Lesson **1.5 Agent SDK Hooks**. |
| 31 Oct | Sat | **[2h]** Build Exercise "Build a Multi-Tool Agent Loop" (45 min), then port it into your sandbox as step 2. |
| 1 Nov | Sun | Drill Mode, domain 1, 20 questions. Log every wrong answer with the reason. |

---

## Week 2 — Mon 2 to Sun 8 November · Domain 1, second half

| Date | Day | Task |
|---|---|---|
| 2 Nov | Mon | Lesson **1.6 Task Decomposition Strategies**. |
| 3 Nov | Tue | Lesson **1.7 Session State and Resumption**. |
| 4 Nov | Wed | Re-read the Exam Traps boxes on all seven Domain 1 lessons. Nothing else. |
| 5 Nov | Thu | Write four practice questions on Domain 1, each with three plausible distractors. Don't write the explanations. |
| 6 Nov | Fri | Answer yesterday's four cold, then write why each wrong option fails. |
| 7 Nov | Sat | **[2h]** Sandbox step 3 — structured errors on every tool. Force a transient, a validation, a business and a permission error, and watch the agent's behaviour differ. |
| 8 Nov | Sun | Drill Mode, domain 1, 20 questions. Target 70%+. |

---

## Week 3 — Mon 9 to Sun 15 November · Domain 3, the cheap marks

| Date | Day | Task |
|---|---|---|
| 9 Nov | Mon | Lesson **3.1 CLAUDE.md hierarchy and scoping**. |
| 10 Nov | Tue | Lesson **3.2 Custom slash commands and skills**. |
| 11 Nov | Wed | Lesson **3.3 Path-specific rules**. |
| 12 Nov | Thu | Lesson **3.4 Plan mode vs direct execution**. |
| 13 Nov | Fri | Lesson **3.5 Iterative refinement techniques**. |
| 14 Nov | Sat | **[2h]** Sandbox step 5 — the entire Claude Code config layer in your repo. Verify the path rules fire only on matching files. |
| 15 Nov | Sun | Harvest every path and frontmatter key from `/quick-reference/domain-3` into the deck. Drill domain 3, 15 questions. |

---

## Week 4 — Mon 16 to Sun 22 November · Domain 3 finish, Domain 4 open

| Date | Day | Task |
|---|---|---|
| 16 Nov | Mon | Lesson **3.6 Claude Code in CI/CD**. |
| 17 Nov | Tue | Drill domain 3, 20 questions. Target 80%+ — this domain is recall, so anything lower is a deck problem. |
| 18 Nov | Wed | Lesson **4.1 Explicit criteria and false positives**. |
| 19 Nov | Thu | Lesson **4.2 Few-shot prompting**. |
| 20 Nov | Fri | Flashcards, full deck. Re-read Domain 3 Exam Traps. |
| 21 Nov | Sat | **[2h]** Sandbox step 10 — GitHub Action with `claude -p --output-format json`. Done now while 3.6 is fresh. |
| 22 Nov | Sun | Pack for the holiday. 15 min flashcards, then stop. |

---

## Week 5 — Mon 23 to Sun 29 November · HOLIDAY ONE

**Off.** Optional 10 minutes of flashcards on travel days. Nothing else. Do not take the laptop.

---

## Week 6 — Mon 30 Nov to Sun 6 December · Domain 4

| Date | Day | Task |
|---|---|---|
| 30 Nov | Mon | Re-entry. Flashcards, full deck, plus read `NOTES.md` end to end. |
| 1 Dec | Tue | Lesson **4.3 Structured output via tool_use and JSON schemas**. |
| 2 Dec | Wed | Lesson **4.4 Validation, retry and feedback loops**. |
| 3 Dec | Thu | Lesson **4.5 Batch processing strategies**. |
| 4 Dec | Fri | Lesson **4.6 Multi-instance and multi-pass review**. |
| 5 Dec | Sat | **[2h]** Sandbox step 6 — extraction tool with a JSON schema. Feed it documents with fields missing and confirm it returns null rather than inventing. |
| 6 Dec | Sun | Drill domain 4, 20 questions. |

---

## Week 7 — Mon 7 to Sun 13 December · Domain 2

| Date | Day | Task |
|---|---|---|
| 7 Dec | Mon | Lesson **2.1 Tool interfaces, descriptions and boundaries**. |
| 8 Dec | Tue | Lesson **2.2 Structured error responses for MCP tools**. |
| 9 Dec | Wed | Lesson **2.3 Tool distribution and tool_choice**. |
| 10 Dec | Thu | Lesson **2.4 MCP server integration**. |
| 11 Dec | Fri | Lesson **2.5 Built-in tools (Read, Write, Edit, Bash, Grep, Glob)**. |
| 12 Dec | Sat | **[2h]** Sandbox step 7 — validation-retry loop. Test one error a retry can fix (bad format) and one it cannot (absent information). |
| 13 Dec | Sun | Drill domain 2, 20 questions. |

---

## Week 8 — Mon 14 to Sun 20 December · Domain 5, then stop

| Date | Day | Task |
|---|---|---|
| 14 Dec | Mon | Lesson **5.1 Conversation context across long interactions**. |
| 15 Dec | Tue | Lesson **5.2 Escalation and ambiguity resolution**. |
| 16 Dec | Wed | Lesson **5.3 Error propagation across multi-agent systems**. |
| 17 Dec | Thu | Lesson **5.4 Context in large codebase exploration**. |
| 18 Dec | Fri | Lesson **5.5 Human review and confidence calibration**. |
| 19 Dec | Sat | **[2h]** Lesson **5.6 Information provenance**, then Drill domain 5, 20 questions. **All 30 lessons now complete.** |
| 20 Dec | Sun | Write the nine answer patterns out in your own words, one page, by hand. Then put everything down. |

---

## Mon 21 December to Sun 3 January · CHRISTMAS — OFF

Optional only: 10 minutes of flashcards on **28 Dec**, **30 Dec** and **2 Jan** to stop the deck going cold. Skip it guilt-free if the house is chaos. You have built two months of slack into this plan precisely so that this fortnight costs you nothing.

---

## Week 9 — Mon 4 to Sun 10 January · Restart and measure

| Date | Day | Task |
|---|---|---|
| 4 Jan | Mon | Flashcards, full deck. It will hurt. That is normal and it comes back fast. |
| 5 Jan | Tue | Flashcards again, plus re-read your one-page answer patterns. |
| 6 Jan | Wed | Sit `/diagnostic` again. Compare with 23 October, per domain. Record both in `NOTES.md`. |
| 7 Jan | Thu | Read the Quick Reference pages for your two worst domains. |
| 8 Jan | Fri | Write four questions on your single worst domain. |
| 9 Jan | Sat | **[2h]** Sandbox step 4 — `PostToolUse` date normalisation hook, plus the $500 interception hook redirecting to escalation. |
| 10 Jan | Sun | Answer Friday's four cold. Drill your worst domain, 20 questions. |

---

## Week 10 — Mon 11 to Sun 17 January · Domain 1, second pass

| Date | Day | Task |
|---|---|---|
| 11 Jan | Mon | Re-read **1.1 and 1.2** — Exam Traps first, then Concept Check. |
| 12 Jan | Tue | Re-read **1.3 and 1.4**. |
| 13 Jan | Wed | Re-read **1.5 and 1.6**. |
| 14 Jan | Thu | Re-read **1.7**. Drill domain 1, 15 questions. |
| 15 Jan | Fri | Drill domain 1, 20 questions. Target 85%. |
| 16 Jan | Sat | **[2h]** Sandbox step 8 — coordinator spawning two subagents in parallel via the Task tool, in a single response. Confirm `allowedTools` includes `Task`. |
| 17 Jan | Sun | Explain hub-and-spoke orchestration out loud from memory in under three minutes. Write it down, then compare against lesson 1.2. |

---

## Week 11 — Mon 18 to Sun 24 January · Domain 3, second pass

| Date | Day | Task |
|---|---|---|
| 18 Jan | Mon | Re-read **3.1 and 3.2**. |
| 19 Jan | Tue | Re-read **3.3 and 3.4**. |
| 20 Jan | Wed | Re-read **3.5 and 3.6**. |
| 21 Jan | Thu | Drill domain 3, 20 questions. Target 90% — this is pure recall. |
| 22 Jan | Fri | From memory, write out the complete path table: user / project / directory CLAUDE.md, commands, skills, rules, `.mcp.json`, `~/.claude.json`. Check against Quick Reference. |
| 23 Jan | Sat | **[2h]** Sandbox step 9 — force a subagent timeout. Coordinator receives structured error context, proceeds on partial results, and annotates coverage gaps. |
| 24 Jan | Sun | Drill domain 3 again. Anything still under 90% becomes a flashcard tonight. |

---

## Week 12 — Mon 25 to Sun 31 January · Domain 4, second pass · HALF-DAYS BEGIN

| Date | Day | Task |
|---|---|---|
| 25 Jan | Mon | Re-read **4.1 and 4.2**. |
| 26 Jan | Tue | Re-read **4.3 and 4.4**. |
| 27 Jan | Wed | **[HALF-DAY]** Scenario 6 walkthrough — Structured Data Extraction. Read the scenario in the Exam Guide, write ten questions it could produce, answer them, then re-read 4.3–4.5 against your answers. |
| 28 Jan | Thu | Re-read **4.5 and 4.6**. |
| 29 Jan | Fri | Drill domain 4, 20 questions. |
| 30 Jan | Sat | **[2h]** Harden sandbox step 6 — enum with `"other"` + detail and `"unclear"`, nullable fields throughout, format normalisation rules in the prompt alongside the strict schema. |
| 31 Jan | Sun | Batch API facts onto cards (50%, 24h, no SLA, `custom_id`, no multi-turn tool calling). Drill domain 4 again. |

---

## Week 13 — Mon 1 to Sun 7 February · Domain 2, second pass

| Date | Day | Task |
|---|---|---|
| 1 Feb | Mon | Re-read **2.1 and 2.2**. |
| 2 Feb | Tue | Re-read **2.3 and 2.4**. |
| 3 Feb | Wed | **[HALF-DAY]** Scenario 1 walkthrough — Customer Support Resolution Agent. Ten questions, answered. Then Drill domains 2 and 5, 30 questions combined. |
| 4 Feb | Thu | Re-read **2.5**. |
| 5 Feb | Fri | Drill domain 2, 20 questions. Target 85%. |
| 6 Feb | Sat | **[2h]** Rewrite every tool description in your sandbox to the 2.1 standard: input formats, example queries, edge cases, and when to use it versus the similar tool. |
| 7 Feb | Sun | Pack. 15 min flashcards, then stop. |

---

## Week 14 — Mon 8 to Sun 14 February · HOLIDAY TWO

**Off.** Optional 10 minutes of flashcards. Nothing else.

---

## Week 15 — Mon 15 to Sun 21 February · Domain 5, second pass

| Date | Day | Task |
|---|---|---|
| 15 Feb | Mon | Re-entry. Flashcards, full deck. |
| 16 Feb | Tue | Re-read **5.1 and 5.2**. |
| 17 Feb | Wed | **[HALF-DAY]** Scenario 3 walkthrough — Multi-Agent Research System. Ten questions, answered. Then re-read 5.3 and 5.6 against your answers. |
| 18 Feb | Thu | Re-read **5.4 and 5.5**. |
| 19 Feb | Fri | Drill domain 5, 20 questions. |
| 20 Feb | Sat | **[2h]** Go to `/exercises` and do any Build Exercise you have not yet touched, from your weakest domain. |
| 21 Feb | Sun | Drill all five domains, 10 questions each. Record the split — this predicts Saturday's mock. |

---

## Week 16 — Mon 22 to Sun 28 February · MOCK ONE

| Date | Day | Task |
|---|---|---|
| 22 Feb | Mon | Light. Flashcards plus your one-page answer patterns. |
| 23 Feb | Tue | Re-read all six scenarios in the Exam Guide. For each, write the three questions you would expect. |
| 24 Feb | Wed | **[HALF-DAY]** Answer your eighteen predicted questions properly, in writing. Then compare your reasoning against the twelve sample questions and explanations in the Exam Guide. |
| 25 Feb | Thu | Rest from content. Flashcards only. Protect Saturday. |
| 26 Feb | Fri | Logistics day: confirm the Pearson VUE booking, check your ID is unexpired and the name matches exactly, run the system check if testing online, clear the room. Then stop. |
| 27 Feb | Sat | **[2h] MOCK EXAM ONE.** Full 60 questions, 120 minutes, timed, no notes. Start at the same clock time as your real slot. |
| 28 Feb | Sun | Mark it. Per-domain breakdown into `NOTES.md`. List your three weakest **task statements by number** (e.g. 2.3, 5.1, 4.4). |

---

## Week 17 — Mon 1 to Sun 7 March · Repair week

| Date | Day | Task |
|---|---|---|
| 1 Mar | Mon | Weakest task statement #1 — re-read the lesson, copy out its Exam Traps by hand. |
| 2 Mar | Tue | Weakest task statement #2 — same treatment. |
| 3 Mar | Wed | **[HALF-DAY]** Weakest task statement #3 — same treatment. Then rebuild that part of the sandbox from scratch with no notes. Then drill those domains. |
| 4 Mar | Thu | Every question you got wrong in Mock One: write one sentence on why the keyed answer wins. |
| 5 Mar | Fri | Drill your two weakest domains, 20 questions each. |
| 6 Mar | Sat | **[2h]** Finish anything unfinished in the sandbox. Then read `NOTES.md` end to end — five months of your own observations. |
| 7 Mar | Sun | Flashcards, full deck. Anything missed twice gets rewritten as a question, not a card. |

---

## Week 18 — Mon 8 to Sun 14 March · MOCK TWO

| Date | Day | Task |
|---|---|---|
| 8 Mar | Mon | Re-read every Domain 1 Exam Traps box. That is 27% of the paper. |
| 9 Mar | Tue | Re-read every Domain 3 and Domain 4 Exam Traps box. |
| 10 Mar | Wed | **[HALF-DAY]** Re-read every Domain 2 and Domain 5 Exam Traps box. Then Drill Mode, 50 mixed questions. |
| 11 Mar | Thu | All five Quick Reference pages, straight through. |
| 12 Mar | Fri | Rest. Flashcards only. |
| 13 Mar | Sat | **[2h] MOCK EXAM TWO.** Same conditions, same clock time. |
| 14 Mar | Sun | Mark it. Any domain under 70% is Monday and Tuesday's work. |

---

## Week 19 — Mon 15 to Fri 19 March · Taper

| Date | Day | Task |
|---|---|---|
| 15 Mar | Mon | Weakest domain from Mock Two. If nothing is under 70%, flashcards plus answer patterns. |
| 16 Mar | Tue | Second weakest domain. Or, if clean, answer the twelve Exam Guide sample questions cold. |
| 17 Mar | Wed | **Last new material.** Read the out-of-scope list so you stop over-reading questions. Stop adding cards tonight. |
| 18 Mar | Thu | **[FULL DAY OFF]** Morning: **Mock Exam Three**, timed, 120 minutes. After lunch: mark it, and work *only* on what it caught. Stop by 5pm. |
| 19 Mar | Fri | **[FULL DAY OFF]** Morning: the nine answer patterns out loud, then one full pass of the deck. Early afternoon: your one-page summary and the Domain 3 path table. **Stop by 3pm.** Go for a walk. Early night. No revision after 3pm — none. |

---

## Saturday 20 March — EXAM DAY

Nothing new. Breakfast, your one-page answer patterns once over coffee, then put it away.

---

# 7. The flashcard deck

These are the recall items. Worth roughly 20 marks between them, and they cost almost nothing to learn. Build the deck from `/quick-reference/domain-N` rather than inventing cards. Ten minutes every single day.

## Claude Code paths and commands

| Card | Answer |
|---|---|
| User-level memory, not shared via version control | `~/.claude/CLAUDE.md` |
| Project-level memory, shared with the team | `.claude/CLAUDE.md` or root `CLAUDE.md` |
| Directory-level memory | `CLAUDE.md` in that subdirectory |
| Keep CLAUDE.md modular by referencing external files | `@import` syntax |
| Topic-specific rules with conditional loading | `.claude/rules/` with YAML frontmatter `paths: ["**/*.test.tsx"]` |
| Team slash commands, version controlled | `.claude/commands/` |
| Personal slash commands | `~/.claude/commands/` |
| Skills location and file | `.claude/skills/` with `SKILL.md` |
| Three SKILL.md frontmatter options | `context: fork`, `allowed-tools`, `argument-hint` |
| Run a skill in an isolated subagent context | `context: fork` |
| Verify which memory files are loaded | `/memory` |
| Reduce context during a long exploration session | `/compact` |
| Continue a specific named prior conversation | `--resume <session-name>` |
| Branch from a shared analysis baseline | `fork_session` |
| Isolate verbose discovery, return a summary | The Explore subagent |
| Non-interactive mode for CI | `-p` or `--print` |
| Machine-parseable CI output | `--output-format json` with `--json-schema` |

## MCP

| Card | Answer |
|---|---|
| Project-scoped MCP config, shared | `.mcp.json` |
| User-scoped MCP config, personal/experimental | `~/.claude.json` |
| Credentials without committing secrets | Environment variable expansion, `${GITHUB_TOKEN}` |
| Flag communicating a tool failure to the agent | `isError` |
| The four error categories | transient, validation, business, permission |
| Plus the flag that prevents wasted retries | `isRetryable` |
| Expose a content catalog without exploratory tool calls | MCP **resources** (tools are for actions) |
| When are tools from configured servers available? | All discovered at connection time, simultaneously |
| Standard integration like Jira — build or adopt? | Adopt the community server; build only for team-specific workflows |

## Built-in tools

| Card | Answer |
|---|---|
| Search file *contents* for a pattern | `Grep` |
| Find files by *name or extension* pattern | `Glob` |
| Targeted modification by unique text match | `Edit` |
| Edit fails on a non-unique anchor — fallback? | `Read` + `Write` |
| Build codebase understanding how? | Grep for entry points, then Read to follow imports — not reading everything upfront |

## Agent SDK and Claude API

| Card | Answer |
|---|---|
| The two `stop_reason` values the exam keys | `"tool_use"` → continue; `"end_turn"` → terminate |
| Three loop-termination anti-patterns | Parsing natural language; iteration caps as primary control; checking `content[0].type == "text"` |
| Are iteration caps ever acceptable? | Yes — as a safety net against runaway loops, never as primary control |
| Mechanism for spawning subagents | The `Task` tool; `allowedTools` must include `"Task"` |
| Spawn subagents in parallel | Multiple `Task` calls in a **single** coordinator response |
| Do subagents inherit parent context? | No. It must be explicitly provided in the prompt |
| Hook that transforms results before the model sees them | `PostToolUse` |
| Three `tool_choice` settings | `"auto"`, `"any"`, `{"type": "tool", "name": "..."}` |
| Guarantee a tool is called rather than text | `tool_choice: "any"` |
| What do strict JSON schemas eliminate — and not? | Eliminate syntax errors; **not** semantic errors (totals that don't sum, wrong field) |
| Stop the model fabricating values | Make the field optional / nullable |
| Two extensibility patterns for enums | `"other"` + a detail string; `"unclear"` for ambiguity |
| When is a retry ineffective? | When the information is simply absent from the source document |

## Message Batches API

| Card | Answer |
|---|---|
| Cost saving | 50% |
| Processing window | Up to 24 hours, no guaranteed latency SLA |
| Correlating requests and responses | `custom_id` |
| Key limitation | No multi-turn tool calling within a single request |
| Appropriate / inappropriate | Overnight reports and weekly audits / blocking pre-merge checks |

## Reliability and escalation

| Card | Answer |
|---|---|
| The three valid escalation triggers | Customer explicitly asks for a human; policy gap or ambiguity; inability to make progress |
| Two invalid escalation signals | Sentiment analysis; model self-reported confidence |
| Tool returns multiple customer matches | Ask for an additional identifier — never pick heuristically |
| The "lost in the middle" effect | Beginning and end of long inputs process reliably; middle sections get omitted |
| Protecting numbers from progressive summarisation | A persistent "case facts" block included in every prompt, outside summarised history |
| Measuring error rates in high-confidence extractions | Stratified random sampling |
| Field-level confidence scores are calibrated using | A labelled validation set |
| Risk of a 97% aggregate accuracy figure | It can mask poor performance on specific document types or fields |
| Conflicting statistics from two credible sources | Annotate both with attribution — never arbitrarily pick one |
| Preventing temporal differences reading as contradictions | Require publication / collection dates in structured outputs |
| Why not self-review in the same session? | The model retains its generation reasoning and won't question its own decisions. Use an independent instance |

## Out of scope — memorise so you stop over-reading

Fine-tuning and model training · API auth and billing · MCP server deployment and infrastructure · Claude's internal architecture · Constitutional AI and RLHF · embeddings and vector databases · computer use · vision · streaming and SSE · rate limits, quotas and pricing maths · OAuth and key rotation · cloud provider configuration · benchmarking · prompt caching internals · tokenisation.

If an option leans on one of these, it is almost certainly a distractor.

---

# 8. Exam day

**Logistics.** Unexpired government photo ID, name matching your registration exactly. Clear workspace — no notes, phones, watches, headphones or second monitors. Remain in webcam view throughout if testing online. You accept a confidentiality agreement before the timer starts.

**Pacing.** 120 minutes for 60 questions is two minutes each, which is generous. Read each scenario once, properly — it frames every question beneath it, and you will not need to re-read it. Check the response count on every item; some are multiple-response.

**When stuck**, run the patterns in order:

1. What does the evidence in the stem actually point at? Who is at fault?
2. Is this the *proportionate* fix, or am I reaching for infrastructure?
3. Does this need a guarantee (code, hooks, gates) or guidance (prompts, examples)?
4. Does any option route on confidence or sentiment? Eliminate it.
5. Does any option invent a flag, file or feature? Eliminate it.

Flag and move on rather than burning five minutes. You have roughly 30 minutes of slack if you keep moving.

**Afterwards.** Pass/fail with a scaled score and a per-domain percentage. The credential runs 12 months; renewal is a free, non-proctored assessment, so diarise it for early March 2028.

---

*Plan generated 22 October 2026. Lesson numbering follows claudecertificationguide.com, which maps 1:1 onto the task statements in Anthropic's Exam Guide v1.0 (July 2026).*
