/* The course, taken from the official exam guide: Claude Certified Architect –
 * Foundations, version 1.0, effective July 2026 (exam code CCAR-F). Checked
 * against the February 2026 draft (version 0.1): the 30 task statements and
 * the four exercises are word for word the same in both.
 *
 * The guide is the authority. Each unit is one task statement, kept whole and
 * numbered as in the guide. "understand" condenses the guide's "Knowledge of"
 * list and "able" condenses its "Skills in" list, one line for each of the
 * guide's lines, in plain English. Nothing here is added from other sources.
 *
 * Each line in "able" is a milestone: the Progress page counts them. Their ids
 * ("1.1.2") are stable and are what the study log records, so never renumber
 * them; add new ones at the end of a unit.
 *
 * Sections are in study order, not guide order (decision 002). */

export type Unit = {
  /** The guide's task statement number, such as "1.1". */
  id: string
  /** A name of two to five words, for lists. */
  short: string
  /** The task statement, as the guide words it. */
  title: string
  /** One or two plain sentences: what this is about. */
  summary: string
  /** What to understand (from "Knowledge of"). */
  understand: string[]
  /** What to be able to do (from "Skills in"). Each line is a milestone. */
  able: string[]
}

export type Tone = 'peach' | 'lavender' | 'sky' | 'butter' | 'rose' | 'sand'

export type Section = {
  id: string
  /** One to three words, for chips. */
  short: string
  /** Its pastel colour. Never green: green means study time. */
  tone: Tone
  /** "Domain 3", or "Practice" for the guide's exercises. */
  label: string
  title: string
  /** Share of the exam's scored items, from the guide. Absent for Practice. */
  weight?: number
  /** Why this section sits where it does in the study order. */
  why: string
  units: Unit[]
}

export const GUIDE = {
  name: 'Claude Certified Architect – Foundations exam guide',
  version: 'Version 1.0, effective July 2026',
  short: 'version 1.0 (July 2026)',
  code: 'CCAR-F',
}

export const EXAM = {
  /** The planned exam day: 20 March, then 22 May, 29 May, 26 June, 27 March
   * 24 April, 9 May, 5 May and now 15 May (26 November 2026): 100 days of study from
   * 1 December with three rest days a month, then practice exams. */
  day: '2027-05-15',
  items: 60,
  format: 'Multiple-choice and multiple-response items. Each item says how many answers to choose.',
  minutes: 120,
  pass: 'A scaled score of 720 on a scale of 100 to 1,000',
  scenarios: 'Four scenarios, picked at random from the six in the guide',
}

export const COURSE: Section[] = [
  {
    id: 'd3',
    short: 'Claude Code',
    tone: 'peach',
    label: 'Domain 3',
    title: 'Claude Code configuration and workflows',
    weight: 20,
    why: 'First, because you use Claude Code every day. Much of it will be revision, which gives an early, solid fifth of the exam.',
    units: [
      {
        id: '3.1',
        short: 'CLAUDE.md levels',
        title: 'Configure CLAUDE.md files with appropriate hierarchy, scoping, and modular organization',
        summary: 'Where instructions for Claude Code live, who they apply to, and how to split them into smaller files.',
        understand: [
          'The three levels of CLAUDE.md: user (~/.claude/CLAUDE.md), project (.claude/CLAUDE.md or root CLAUDE.md) and directory (CLAUDE.md in a subfolder).',
          'User-level instructions apply only to that user. They are not shared with teammates through version control.',
          'The @import syntax pulls other files into CLAUDE.md, to keep it modular.',
          'The .claude/rules/ folder holds topic-specific rule files, as an alternative to one large CLAUDE.md.',
        ],
        able: [
          'Diagnose hierarchy problems, such as a new teammate missing instructions that sit at user level instead of project level.',
          'Use @import to include only the standards files each package needs.',
          'Split a large CLAUDE.md into focused files in .claude/rules/, such as testing.md and deployment.md.',
          'Use the /memory command to check which memory files are loaded and explain inconsistent behaviour.',
        ],
      },
      {
        id: '3.2',
        short: 'Commands and skills',
        title: 'Create and configure custom slash commands and skills',
        summary: 'Making reusable commands and skills, deciding who gets them, and limiting what they can do.',
        understand: [
          'Project commands in .claude/commands/ are shared through version control. User commands in ~/.claude/commands/ are personal.',
          'Skills live in .claude/skills/ with a SKILL.md file whose frontmatter can set context: fork, allowed-tools and argument-hint.',
          'context: fork runs a skill in an isolated sub-agent, so its output does not clutter the main conversation.',
          'Personal variants of a skill go in ~/.claude/skills/ under a different name, so teammates are not affected.',
        ],
        able: [
          'Create project slash commands in .claude/commands/ so the whole team gets them.',
          'Use context: fork for skills with verbose or exploratory output.',
          'Set allowed-tools in a skill’s frontmatter to restrict what it can do while it runs.',
          'Use argument-hint so developers are prompted for required arguments.',
          'Choose between a skill (loaded on demand for a task) and CLAUDE.md (always loaded, universal standards).',
        ],
      },
      {
        id: '3.3',
        short: 'Path-specific rules',
        title: 'Apply path-specific rules for conditional convention loading',
        summary: 'Rules that load only when Claude edits files matching a pattern, wherever those files are.',
        understand: [
          'Files in .claude/rules/ can have YAML frontmatter with a paths field of glob patterns.',
          'Path-scoped rules load only when editing matching files, which saves context and tokens.',
          'Glob rules beat directory CLAUDE.md files for conventions that span many folders, such as test files.',
        ],
        able: [
          'Write .claude/rules/ files with paths frontmatter, such as paths: ["terraform/**/*"].',
          'Use glob patterns to apply conventions by file type wherever files sit, such as **/*.test.tsx.',
          'Choose path-specific rules over subdirectory CLAUDE.md files when files are spread across the codebase.',
        ],
      },
      {
        id: '3.4',
        short: 'Plan first, or just do it',
        title: 'Determine when to use plan mode vs direct execution',
        summary: 'Judging when a task needs exploring and planning first, and when to just make the change.',
        understand: [
          'Plan mode is for complex work: large changes, several valid approaches, architectural decisions, many files.',
          'Direct execution suits simple, well-scoped changes, such as one validation check in one function.',
          'Plan mode lets you explore and design safely before changing anything, which avoids costly rework.',
          'The Explore subagent keeps verbose discovery out of the main conversation and returns a summary.',
        ],
        able: [
          'Choose plan mode for tasks with architectural impact, such as a library migration touching 45+ files.',
          'Choose direct execution for clear, contained changes, such as a single-file bug fix with a stack trace.',
          'Use the Explore subagent in verbose discovery phases so the context window does not run out.',
          'Combine the two: plan the investigation, then execute the agreed approach directly.',
        ],
      },
      {
        id: '3.5',
        short: 'Refining in rounds',
        title: 'Apply iterative refinement techniques for progressive improvement',
        summary: 'Ways to steer Claude towards the right result over several rounds: examples, tests and questions.',
        understand: [
          'Concrete input and output examples communicate a transformation best when prose is read inconsistently.',
          'Test-driven iteration: write the tests first, then improve by sharing test failures.',
          'The interview pattern: Claude asks questions to surface things the developer had not considered.',
          'When to send all issues in one message (they interact) and when to fix them one by one (they are independent).',
        ],
        able: [
          'Give 2 or 3 concrete input and output examples when descriptions produce inconsistent results.',
          'Write tests for expected behaviour, edge cases and performance first, then iterate on the failures.',
          'Use the interview pattern before building in an unfamiliar area, such as cache invalidation.',
          'Give specific test cases with input and expected output to fix edge cases, such as null values.',
          'Send interacting issues together in one detailed message, and independent issues one at a time.',
        ],
      },
      {
        id: '3.6',
        short: 'Claude Code in CI',
        title: 'Integrate Claude Code into CI/CD pipelines',
        summary: 'Running Claude Code unattended in a build pipeline for reviews and tests, with structured output.',
        understand: [
          'The -p (or --print) flag runs Claude Code non-interactively in automated pipelines.',
          '--output-format json and --json-schema enforce structured output in CI.',
          'CLAUDE.md gives CI runs their project context: testing standards, fixtures and review criteria.',
          'The session that wrote some code is worse at reviewing it than an independent review instance.',
        ],
        able: [
          'Run Claude Code in CI with -p so it never hangs waiting for input.',
          'Use --output-format json with --json-schema to produce findings that can be posted as inline PR comments.',
          'On re-review after new commits, include earlier findings and report only new or unresolved issues.',
          'Give existing test files as context so generated tests do not duplicate covered scenarios.',
          'Document testing standards, valuable test criteria and fixtures in CLAUDE.md to improve generated tests.',
        ],
      },
    ],
  },
  {
    id: 'd1',
    short: 'Agents',
    tone: 'lavender',
    label: 'Domain 1',
    title: 'Agentic architecture and orchestration',
    weight: 27,
    why: 'The largest part of the exam, and the base for tools, context and reliability. Start with the agentic loop.',
    units: [
      {
        id: '1.1',
        short: 'The agentic loop',
        title: 'Design and implement agentic loops for autonomous task execution',
        summary: 'The basic loop: ask Claude, run the tools it asks for, send back the results, and stop at the right moment.',
        understand: [
          'The loop: send a request, check stop_reason ("tool_use" or "end_turn"), run the requested tools, return the results.',
          'Tool results are added to the conversation history so the model can decide its next action.',
          'The difference between the model choosing the next tool from context and a fixed decision tree or tool sequence.',
        ],
        able: [
          'Continue the loop when stop_reason is "tool_use" and end it when stop_reason is "end_turn".',
          'Add tool results to the conversation between iterations.',
          'Avoid anti-patterns: parsing natural language to decide when to stop, iteration caps as the main stop, or treating assistant text as "done".',
        ],
      },
      {
        id: '1.2',
        short: 'Coordinators and subagents',
        title: 'Orchestrate multi-agent systems with coordinator-subagent patterns',
        summary: 'One coordinator agent splits the work, hands parts to specialist subagents and brings the results together.',
        understand: [
          'Hub and spoke: the coordinator handles all communication between subagents, errors and routing.',
          'Subagents have isolated context. They do not inherit the coordinator’s conversation.',
          'The coordinator decomposes the task, delegates, aggregates results and picks which subagents a query needs.',
          'Decomposing too narrowly leaves gaps in coverage of broad topics.',
        ],
        able: [
          'Design a coordinator that picks only the subagents a query needs, instead of always running the full pipeline.',
          'Split research scope between subagents to avoid duplication, such as by subtopic or source type.',
          'Build refinement loops: the coordinator checks the synthesis for gaps, re-delegates targeted queries and re-runs synthesis.',
          'Route all subagent communication through the coordinator, for observability, consistent errors and controlled flow.',
        ],
      },
      {
        id: '1.3',
        short: 'Starting subagents',
        title: 'Configure subagent invocation, context passing, and spawning',
        summary: 'How subagents are started, what they are told, and how to run several at once.',
        understand: [
          'The Task tool spawns subagents. A coordinator’s allowedTools must include "Task".',
          'A subagent’s context must be written into its prompt. Nothing is inherited or shared between runs automatically.',
          'AgentDefinition sets each subagent type’s description, system prompt and tool restrictions.',
          'Fork-based sessions explore different approaches from the same starting analysis.',
        ],
        able: [
          'Put earlier agents’ complete findings into the next subagent’s prompt, such as search results passed to synthesis.',
          'Use structured formats that keep content separate from metadata (URLs, document names, pages) to preserve attribution.',
          'Spawn subagents in parallel by emitting several Task calls in one coordinator response.',
          'Write coordinator prompts that set goals and quality criteria, not step-by-step procedures.',
        ],
      },
      {
        id: '1.4',
        short: 'Enforced steps and handoffs',
        title: 'Implement multi-step workflows with enforcement and handoff patterns',
        summary: 'Making sure required steps happen in order, and handing over cleanly to a human.',
        understand: [
          'The difference between programmatic enforcement (hooks, prerequisite gates) and guidance in the prompt.',
          'When compliance must be guaranteed, such as identity checks before payments, prompts alone sometimes fail.',
          'Structured handoffs for escalation include customer details, root cause and recommended actions.',
        ],
        able: [
          'Block downstream tool calls until prerequisites are done, such as no process_refund before a verified get_customer.',
          'Split a request with several concerns into separate items, investigate them in parallel, then give one answer.',
          'Write structured handoff summaries (customer ID, root cause, amount, recommended action) for humans without the transcript.',
        ],
      },
      {
        id: '1.5',
        short: 'Hooks',
        title: 'Apply Agent SDK hooks for tool call interception and data normalization',
        summary: 'Hooks are code that runs around tool calls, to clean data or enforce rules every time.',
        understand: [
          'Hooks such as PostToolUse can transform tool results before the model sees them.',
          'Hooks can intercept outgoing tool calls to enforce rules, such as blocking refunds over a limit.',
          'Hooks give deterministic guarantees. Prompt instructions give only probable compliance.',
        ],
        able: [
          'Use PostToolUse hooks to normalise mixed formats (Unix timestamps, ISO 8601, numeric status codes) from different tools.',
          'Use interception hooks to block policy-breaking actions, such as refunds over $500, and redirect to escalation.',
          'Choose hooks over prompts when business rules need guaranteed compliance.',
        ],
      },
      {
        id: '1.6',
        short: 'Breaking work down',
        title: 'Design task decomposition strategies for complex workflows',
        summary: 'Choosing between a fixed sequence of steps and a plan that adapts to what is found.',
        understand: [
          'When to use a fixed pipeline (prompt chaining) and when to decompose dynamically from findings.',
          'Prompt chaining splits a review into steps, such as each file on its own, then a cross-file pass.',
          'Adaptive investigation plans create subtasks from what each step discovers.',
        ],
        able: [
          'Choose prompt chaining for predictable multi-aspect reviews and dynamic decomposition for open-ended investigations.',
          'Split large code reviews into per-file passes plus a cross-file integration pass, to avoid diluted attention.',
          'Decompose open-ended tasks by mapping structure, finding high-impact areas, then following a prioritised plan that adapts.',
        ],
      },
      {
        id: '1.7',
        short: 'Resume and fork sessions',
        title: 'Manage session state, resumption, and forking',
        summary: 'Continuing earlier work, branching to compare approaches, and knowing when to start fresh.',
        understand: [
          '--resume <session-name> continues a specific earlier conversation.',
          'fork_session creates independent branches from a shared analysis.',
          'When resuming after code changes, tell the agent which files changed.',
          'A new session with a structured summary is more reliable than resuming with stale tool results.',
        ],
        able: [
          'Use --resume with named sessions to continue an investigation across work sessions.',
          'Use fork_session to compare two approaches from one shared codebase analysis.',
          'Choose resuming when earlier context is still valid, and a fresh start with a summary when tool results are stale.',
          'Tell a resumed session exactly which files changed, so it re-checks those instead of re-exploring everything.',
        ],
      },
    ],
  },
  {
    id: 'd2',
    short: 'Tools and MCP',
    tone: 'sky',
    label: 'Domain 2',
    title: 'Tool design and MCP integration',
    weight: 18,
    why: 'Agents are only as good as their tools. This follows directly from the agentic loop.',
    units: [
      {
        id: '2.1',
        short: 'Clear tool descriptions',
        title: 'Design effective tool interfaces with clear descriptions and boundaries',
        summary: 'Writing tool names and descriptions so the model picks the right tool every time.',
        understand: [
          'Descriptions are the main way a model chooses tools. Thin descriptions make choices between similar tools unreliable.',
          'Good descriptions include input formats, example queries, edge cases and when not to use the tool.',
          'Overlapping descriptions cause misrouting, such as analyze_content against analyze_document.',
          'Keywords in the system prompt can create unintended links to particular tools.',
        ],
        able: [
          'Write descriptions that separate each tool’s purpose, inputs, outputs and when to use it over similar tools.',
          'Rename tools and rewrite descriptions to remove overlap, such as analyze_content to extract_web_results.',
          'Split generic tools into specific ones with clear contracts, such as extract_data_points, summarize_content and verify_claim_against_source.',
          'Check system prompts for keyword-sensitive wording that overrides good tool descriptions.',
        ],
      },
      {
        id: '2.2',
        short: 'Helpful tool errors',
        title: 'Implement structured error responses for MCP tools',
        summary: 'Telling the agent exactly what went wrong, so it can decide whether to retry, explain or escalate.',
        understand: [
          'MCP’s isError flag tells the agent a tool call failed.',
          'Error types: transient (timeouts, outages), validation (bad input), business (policy) and permission.',
          'A generic "Operation failed" stops the agent choosing the right recovery.',
          'Retryable and non-retryable errors differ, and structured metadata prevents wasted retries.',
        ],
        able: [
          'Return error metadata: errorCategory (transient, validation, permission), isRetryable and a readable description.',
          'For business rule breaches, return retriable: false with a customer-friendly explanation.',
          'Recover from transient failures inside subagents, and pass up only unresolved errors with partial results and what was tried.',
          'Tell apart access failures (a retry decision is needed) and valid empty results (the query worked and found nothing).',
        ],
      },
      {
        id: '2.3',
        short: 'The right tools per agent',
        title: 'Distribute tools appropriately across agents and configure tool choice',
        summary: 'Giving each agent only the tools it needs, and controlling whether and which tool it must call.',
        understand: [
          'Too many tools (such as 18 instead of 4 or 5) makes tool choice less reliable.',
          'Agents given tools outside their role tend to misuse them, such as a synthesis agent searching the web.',
          'Scoped access: only the tools a role needs, plus limited cross-role tools for frequent needs.',
          'tool_choice options: "auto", "any" and forced selection ({"type": "tool", "name": "..."}).',
        ],
        able: [
          'Limit each subagent’s tools to its role.',
          'Replace generic tools with constrained ones, such as fetch_url with load_document that validates URLs.',
          'Give scoped cross-role tools for frequent needs, such as verify_fact for synthesis, and route complex cases via the coordinator.',
          'Force a specific tool first with tool_choice, such as extract_metadata before enrichment, then continue in later turns.',
          'Set tool_choice: "any" to make sure the model calls a tool instead of replying in text.',
        ],
      },
      {
        id: '2.4',
        short: 'Connecting MCP servers',
        title: 'Integrate MCP servers into Claude Code and agent workflows',
        summary: 'Connecting MCP servers at team or personal level, handling secrets, and exposing data as resources.',
        understand: [
          'Scope: project level (.mcp.json) for shared team tools, user level (~/.claude.json) for personal or experimental ones.',
          '.mcp.json expands environment variables, such as ${GITHUB_TOKEN}, so secrets are not committed.',
          'Tools from all configured servers are discovered at connection and available at the same time.',
          'MCP resources expose catalogues (issues, documentation, schemas) so agents need fewer exploratory calls.',
        ],
        able: [
          'Configure shared servers in project .mcp.json with environment variables for tokens.',
          'Configure personal or experimental servers in ~/.claude.json.',
          'Improve MCP tool descriptions so the agent does not prefer built-in tools, such as Grep, over more capable MCP tools.',
          'Choose existing community servers for standard integrations, such as Jira, and build custom ones only for team-specific needs.',
          'Expose content catalogues as MCP resources so agents can see what data exists without exploring.',
        ],
      },
      {
        id: '2.5',
        short: 'Built-in tools',
        title: 'Select and apply built-in tools (Read, Write, Edit, Bash, Grep, Glob) effectively',
        summary: 'Picking the right built-in tool to search, read and change files.',
        understand: [
          'Grep searches file contents, such as function names, error messages or imports.',
          'Glob matches file paths, such as by name or extension.',
          'Read and Write handle whole files. Edit makes targeted changes by matching unique text.',
          'When Edit fails because the text is not unique, Read then Write is the reliable fallback.',
        ],
        able: [
          'Use Grep to search code content, such as every caller of a function.',
          'Use Glob to find files by pattern, such as **/*.test.tsx.',
          'Use Read then Write when Edit cannot find a unique anchor.',
          'Build understanding step by step: Grep for entry points, then Read to follow imports, instead of reading everything first.',
          'Trace usage through wrapper modules by listing exported names, then searching for each one.',
        ],
      },
    ],
  },
  {
    id: 'd4',
    short: 'Prompts and output',
    tone: 'butter',
    label: 'Domain 4',
    title: 'Prompt engineering and structured output',
    weight: 20,
    why: 'Prompts and schemas are how you control what agents produce. It draws on the tool work in Domain 2.',
    units: [
      {
        id: '4.1',
        short: 'Explicit review criteria',
        title: 'Design prompts with explicit criteria to improve precision and reduce false positives',
        summary: 'Saying exactly what counts as a problem, so reviews flag real issues and little else.',
        understand: [
          'Explicit criteria beat vague instructions, such as "flag comments only when they contradict the code" over "check comments are accurate".',
          'General instructions such as "be conservative" do not improve precision as well as specific categories.',
          'False positives erode trust: one noisy category undermines confidence in the accurate ones.',
        ],
        able: [
          'Write review criteria that say what to report (bugs, security) and what to skip (minor style, local patterns).',
          'Switch off high false-positive categories for a while to restore trust, while improving their prompts.',
          'Define severity levels with concrete code examples for each, so classification is consistent.',
        ],
      },
      {
        id: '4.2',
        short: 'Few-shot examples',
        title: 'Apply few-shot prompting to improve output consistency and quality',
        summary: 'Using a few well-chosen examples to show the model what good output and good judgement look like.',
        understand: [
          'Few-shot examples are the most effective way to get consistent, actionable output when instructions alone are inconsistent.',
          'Examples show how to handle ambiguous cases, such as which tool to choose for an unclear request.',
          'Examples help the model generalise judgement to new patterns, not only match listed cases.',
          'Examples reduce hallucination in extraction, such as informal measurements or varied document layouts.',
        ],
        able: [
          'Write 2 to 4 targeted examples for ambiguous cases, showing why one action beats plausible alternatives.',
          'Use examples that show the exact output format: location, issue, severity, suggested fix.',
          'Use examples that separate acceptable code patterns from real issues, to reduce false positives.',
          'Use examples showing varied document structures, such as inline citations against bibliographies.',
          'Add examples of correct extraction from varied formats to fix empty or null required fields.',
        ],
      },
      {
        id: '4.3',
        short: 'Structured output',
        title: 'Enforce structured output using tool use and JSON schemas',
        summary: 'Getting reliably shaped data back by defining a tool with a JSON schema.',
        understand: [
          'tool_use with a JSON schema is the most reliable way to get schema-compliant output with no JSON syntax errors.',
          'tool_choice: "auto" may return text, "any" must call some tool, and forced selection must call the named tool.',
          'Strict schemas stop syntax errors but not meaning errors, such as line items that do not add up to the total.',
          'Schema design: required against optional fields, and enums with "other" plus a detail string.',
        ],
        able: [
          'Define extraction tools with JSON schemas as input parameters, and read the data from the tool_use response.',
          'Set tool_choice: "any" when there are several extraction schemas and the document type is unknown.',
          'Force a specific tool, such as extract_metadata, so it runs before enrichment steps.',
          'Make fields optional (nullable) when documents may not contain them, so the model does not invent values.',
          'Add enum values such as "unclear" for ambiguous cases, and "other" plus detail for open categories.',
          'Put format normalisation rules in the prompt alongside strict schemas, for inconsistent source formats.',
        ],
      },
      {
        id: '4.4',
        short: 'Validate and retry',
        title: 'Implement validation, retry, and feedback loops for extraction quality',
        summary: 'Checking extracted data, retrying with the specific error, and knowing when a retry cannot help.',
        understand: [
          'Retry with error feedback: add the specific validation errors to the prompt on retry.',
          'Retries do not help when the information is not in the document at all.',
          'A detected_pattern field records which code constructs trigger findings, so dismissals can be analysed.',
          'Semantic errors (values do not add up, wrong field) differ from syntax errors (removed by tool use).',
        ],
        able: [
          'Retry with the original document, the failed extraction and the specific validation errors.',
          'Tell when retries will fail (information is elsewhere) and when they will work (format or structure errors).',
          'Add detected_pattern to findings so false positive patterns can be analysed when developers dismiss them.',
          'Design self-checks, such as calculated_total beside stated_total, and a conflict_detected flag for inconsistent sources.',
        ],
      },
      {
        id: '4.5',
        short: 'Batch processing',
        title: 'Design efficient batch processing strategies',
        summary: 'When to use the cheaper, slower Message Batches API, and how to handle its failures.',
        understand: [
          'The Message Batches API saves 50%, takes up to 24 hours and has no guaranteed response time.',
          'Batches suit work nobody is waiting for (overnight reports, weekly audits), not blocking checks such as pre-merge.',
          'A batch request cannot run tools mid-request and send results back.',
          'custom_id fields match each request to its response.',
        ],
        able: [
          'Match the API to the wait: synchronous for blocking pre-merge checks, batches for overnight or weekly analysis.',
          'Work out how often to submit batches to meet a deadline, such as every 4 hours for a 30-hour service level.',
          'Resubmit only failed documents by custom_id, with changes such as chunking documents that were too long.',
          'Refine prompts on a sample before running large batches, to get more right first time.',
        ],
      },
      {
        id: '4.6',
        short: 'Independent reviews',
        title: 'Design multi-instance and multi-pass review architectures',
        summary: 'Using a fresh instance and several focused passes to review work properly.',
        understand: [
          'A model reviewing its own work in the same session keeps its earlier reasoning and is less likely to question it.',
          'An independent instance, without that context, catches subtle issues better than self-review or extended thinking.',
          'Multi-pass review: per-file passes for local issues plus cross-file passes, to avoid diluted attention and contradictions.',
        ],
        able: [
          'Use a second, independent Claude instance to review generated code.',
          'Split large multi-file reviews into per-file passes and a separate integration pass for cross-file data flow.',
          'Run verification passes where the model states its confidence for each finding, to route reviews.',
        ],
      },
    ],
  },
  {
    id: 'd5',
    short: 'Context and reliability',
    tone: 'rose',
    label: 'Domain 5',
    title: 'Context management and reliability',
    weight: 15,
    why: 'Last of the domains, because it ties the others together: long sessions, escalation, errors and evidence.',
    units: [
      {
        id: '5.1',
        short: 'Keeping key facts',
        title: 'Manage conversation context to preserve critical information across long interactions',
        summary: 'Keeping the facts that matter intact as conversations and tool results grow.',
        understand: [
          'Progressive summarisation can blur numbers, percentages, dates and what the customer expects.',
          'The "lost in the middle" effect: models handle the start and end of long inputs well and may miss the middle.',
          'Tool results pile up in context and cost tokens out of proportion to their use, such as 40+ fields when 5 matter.',
          'Each API request needs the complete conversation history to stay coherent.',
        ],
        able: [
          'Keep transactional facts (amounts, dates, order numbers, statuses) in a persistent "case facts" block in each prompt.',
          'Keep structured issue data in a separate context layer when a session covers several issues.',
          'Trim verbose tool outputs to the relevant fields before they build up.',
          'Put key findings first in long inputs, with clear section headers for the detail.',
          'Require subagents to include metadata (dates, sources, method) in their output for accurate synthesis.',
          'Have upstream agents return structured data instead of verbose reasoning when downstream context is limited.',
        ],
      },
      {
        id: '5.2',
        short: 'When to escalate',
        title: 'Design effective escalation and ambiguity resolution patterns',
        summary: 'Knowing when an agent should hand over to a person, and when to ask for more information.',
        understand: [
          'Good escalation triggers: the customer asks for a human, a policy gap or exception, or no real progress.',
          'Escalate at once when a customer demands it. Offer to resolve when the issue is simple.',
          'Sentiment and self-reported confidence are unreliable signs of how complex a case is.',
          'Several matching customers need more identifiers, not a guess.',
        ],
        able: [
          'Add explicit escalation criteria, with few-shot examples, to the system prompt.',
          'Honour requests for a human immediately, without investigating first.',
          'Acknowledge frustration and offer to resolve when the agent can, escalating only if the customer asks again.',
          'Escalate when policy is unclear or silent on the request, such as competitor price matching.',
          'Ask for more identifiers when a lookup returns several matches.',
        ],
      },
      {
        id: '5.3',
        short: 'Passing errors up',
        title: 'Implement error propagation strategies across multi-agent systems',
        summary: 'Passing failures up in a way that lets the coordinator recover sensibly.',
        understand: [
          'Structured error context (failure type, query tried, partial results, alternatives) lets the coordinator recover.',
          'Access failures (such as timeouts) differ from valid empty results.',
          'Generic statuses such as "search unavailable" hide useful context.',
          'Hiding errors (empty results marked as success) and ending the whole workflow on one failure are both anti-patterns.',
        ],
        able: [
          'Return structured error context: failure type, what was tried, partial results and possible alternatives.',
          'Report access failures and valid empty results differently.',
          'Recover from transient failures inside subagents and pass up only what they cannot resolve, with context.',
          'Annotate synthesis output to show which findings are well supported and where sources were missing.',
        ],
      },
      {
        id: '5.4',
        short: 'Big codebases',
        title: 'Manage context effectively in large codebase exploration',
        summary: 'Working through a big codebase without losing track as context fills up.',
        understand: [
          'In long sessions, answers drift and refer to "typical patterns" instead of the specific classes found earlier.',
          'Scratchpad files keep key findings across context boundaries.',
          'Subagents can hold verbose exploration while the main agent keeps the overview.',
          'For crash recovery, each agent exports its state to a known place and the coordinator loads a manifest on resume.',
        ],
        able: [
          'Spawn subagents for specific questions, such as "find all test files", while the main agent coordinates.',
          'Keep scratchpad files of key findings and refer back to them.',
          'Summarise one phase’s findings before spawning subagents for the next, and give them the summary.',
          'Design crash recovery with exported state manifests that the coordinator loads and passes to agents.',
          'Use /compact to reduce context during long exploration sessions.',
        ],
      },
      {
        id: '5.5',
        short: 'Human review',
        title: 'Design human review workflows and confidence calibration',
        summary: 'Deciding which outputs people should check, using measured accuracy rather than overall averages.',
        understand: [
          'An overall accuracy figure, such as 97%, can hide poor results on certain document types or fields.',
          'Stratified random sampling measures error rates in high-confidence output and finds new error patterns.',
          'Field-level confidence scores, calibrated on labelled validation sets, direct review effort.',
          'Check accuracy by document type and field before automating high-confidence extractions.',
        ],
        able: [
          'Sample high-confidence extractions with stratified random sampling to keep measuring error rates.',
          'Analyse accuracy by document type and field before reducing human review.',
          'Have the model output field-level confidence, then set review thresholds using labelled validation sets.',
          'Send low-confidence or contradictory extractions to human review, to use limited reviewer time well.',
        ],
      },
      {
        id: '5.6',
        short: 'Sources and conflicts',
        title: 'Preserve information provenance and handle uncertainty in multi-source synthesis',
        summary: 'Keeping track of where each claim came from, and showing disagreements honestly.',
        understand: [
          'Summarising can lose which source said what, unless claim-to-source links are kept.',
          'Structured claim-to-source mappings must be kept and merged by the synthesis agent.',
          'When credible sources disagree, note the conflict with its sources instead of picking one value.',
          'Dates of publication or collection stop differences over time being read as contradictions.',
        ],
        able: [
          'Require subagents to output claim-to-source mappings (URLs, document names, excerpts) that survive synthesis.',
          'Structure reports to separate well-established findings from contested ones, keeping the sources’ own framing.',
          'Include conflicting values with annotations and let the coordinator decide how to reconcile them.',
          'Require publication or collection dates in subagent output.',
          'Present each kind of content suitably: financial data as tables, news as prose, technical findings as lists.',
        ],
      },
    ],
  },
  {
    id: 'practice',
    short: 'Exercises',
    tone: 'sand',
    label: 'Practice',
    title: 'Preparation exercises',
    why: 'The guide’s own hands-on exercises. Each draws on several domains, so they come last.',
    units: [
      {
        id: 'E1',
        short: 'Support agent',
        title: 'Exercise 1: Build a multi-tool agent with escalation logic',
        summary: 'An agentic loop with well-described tools, structured errors, a rule-enforcing hook and multi-concern requests. Domains 1, 2 and 5.',
        understand: [],
        able: [
          'Define 3 or 4 MCP tools with clear descriptions, including two similar tools that need careful wording.',
          'Build a loop that handles "tool_use" and "end_turn" correctly.',
          'Add structured error responses and check the agent retries transient errors and explains business errors.',
          'Add a hook that blocks operations over a threshold and redirects to escalation.',
          'Test messages with several concerns and check the agent splits, handles and combines them.',
        ],
      },
      {
        id: 'E2',
        short: 'Team Claude Code setup',
        title: 'Exercise 2: Configure Claude Code for a team development workflow',
        summary: 'CLAUDE.md hierarchy, path rules, a forked skill, two MCP servers and plan mode against direct execution. Domains 3 and 2.',
        understand: [],
        able: [
          'Write a project CLAUDE.md with coding standards and testing conventions.',
          'Add .claude/rules/ files with glob paths and check they load only for matching files.',
          'Create a project skill with context: fork and allowed-tools, and check it runs in isolation.',
          'Configure a project MCP server with environment variables and a personal one in ~/.claude.json, and check both work.',
          'Try plan mode and direct execution on a one-file fix, a multi-file migration and a feature with several approaches.',
        ],
      },
      {
        id: 'E3',
        short: 'Extraction pipeline',
        title: 'Exercise 3: Build a structured data extraction pipeline',
        summary: 'A schema with optional fields, a validation and retry loop, few-shot examples, a batch run and human review routing. Domains 4 and 5.',
        understand: [],
        able: [
          'Define an extraction tool with required, optional and nullable fields and an "other" plus detail enum, and check absent fields come back null.',
          'Build a validation and retry loop, and note which errors a retry can fix.',
          'Add few-shot examples for varied document formats and check handling improves.',
          'Run a batch of 100 documents, resubmit failures by custom_id and compare processing time with the deadline.',
          'Route low-confidence fields to human review and analyse accuracy by document type and field.',
        ],
      },
      {
        id: 'E4',
        short: 'Research pipeline',
        title: 'Exercise 4: Design and debug a multi-agent research pipeline',
        summary: 'A coordinator with parallel subagents, attributed findings, structured errors and conflicting sources. Domains 1, 2 and 5.',
        understand: [],
        able: [
          'Build a coordinator with "Task" in allowedTools that passes findings to subagents in their prompts.',
          'Run subagents in parallel from one response and measure the time saved.',
          'Give each finding a claim, excerpt, source and date, and check synthesis keeps the attribution.',
          'Simulate a subagent timeout and check the coordinator continues with partial results and notes the gaps.',
          'Test conflicting statistics and check the report keeps both values with sources.',
        ],
      },
    ],
  },
]

/** Every milestone, with its stable id ("1.1.2" is unit 1.1, line 2). */
export const milestoneId = (unit: Unit, index: number) => `${unit.id}.${index + 1}`

export const ALL_MILESTONES = COURSE.flatMap((s) => s.units.flatMap((u) => u.able.map((_, i) => milestoneId(u, i))))
