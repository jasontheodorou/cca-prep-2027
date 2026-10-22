import { COURSE, type Unit } from '../content/course'

/* Auto-tagging: which exam task statements a note covers, worked out from
 * its words. A task statement's own number ("1.3", "lesson 1.3") is the
 * strongest sign. Otherwise each statement has the terms the exam uses for
 * it: a term in capitals or code style, such as PostToolUse, counts double
 * because nothing else uses it. A note is tagged with a statement when it
 * scores 2 or more, and with at most four, strongest first. */

const TERMS: Record<string, string[]> = {
  '1.1': ['agentic loop', 'stop_reason', 'tool_use', 'end_turn', 'loop termination', 'iteration cap'],
  '1.2': ['coordinator', 'hub-and-spoke', 'hub and spoke', 'orchestration', 'orchestrator'],
  '1.3': ['subagent', 'task tool', 'allowedtools', 'context passing', 'spawn'],
  '1.4': ['handoff', 'hand off', 'prerequisite', 'enforcement', 'gate', 'workflow enforcement'],
  '1.5': ['hook', 'posttooluse', 'pretooluse', 'agent sdk hooks', 'interception'],
  '1.6': ['decomposition', 'decompose', 'prompt chaining', 'per-file pass', 'cross-file'],
  '1.7': ['resume', 'fork_session', 'session state', '--resume', 'resumption'],
  '2.1': ['tool description', 'tool interface', 'tool schema', 'tool boundaries', 'tool selection'],
  '2.2': ['iserror', 'errorcategory', 'isretryable', 'structured error', 'transient', 'retryable'],
  '2.3': ['tool_choice', 'tool distribution', 'least privilege', 'too many tools'],
  '2.4': ['mcp server', '.mcp.json', '~/.claude.json', 'mcp resource', 'environment variable expansion'],
  '2.5': ['grep', 'glob', 'built-in tools', 'read tool', 'edit tool', 'bash tool'],
  '3.1': ['claude.md', '@import', '/memory', 'memory file', 'user-level', 'project-level'],
  '3.2': ['slash command', '.claude/commands', 'skill.md', 'context: fork', 'allowed-tools', 'argument-hint', 'skill'],
  '3.3': ['.claude/rules', 'path-specific', 'paths:', 'glob pattern', 'conditional loading'],
  '3.4': ['plan mode', 'direct execution', 'explore subagent'],
  '3.5': ['iterative refinement', 'test-driven', 'interview pattern', 'input/output examples'],
  '3.6': ['ci/cd', 'github action', 'claude -p', '--print', '--output-format', '--json-schema', 'pipeline'],
  '4.1': ['explicit criteria', 'false positive', 'system prompt', 'be conservative'],
  '4.2': ['few-shot', 'few shot', 'examples in the prompt'],
  '4.3': ['json schema', 'structured output', 'extraction', 'nullable', 'strict schema'],
  '4.4': ['validation', 'retry loop', 'validation-retry', 'feedback loop', 'self-correction'],
  '4.5': ['batch', 'message batches', 'custom_id', 'batches api'],
  '4.6': ['multi-pass', 'multi-instance', 'independent review', 'self-review', 'second instance'],
  '5.1': ['context window', 'lost in the middle', 'case facts', 'summarisation', 'summarization', 'long conversation'],
  '5.2': ['escalation', 'escalate', 'ambiguity', 'human handoff', 'sentiment'],
  '5.3': ['error propagation', 'partial results', 'coverage gap', 'subagent failure', 'timeout'],
  '5.4': ['codebase exploration', 'context degradation', '/compact', 'scratchpad', 'large codebase'],
  '5.5': ['human review', 'confidence calibration', 'calibration', 'stratified', 'confidence score'],
  '5.6': ['provenance', 'attribution', 'multi-source', 'conflicting sources', 'publication date'],
}

const UNITS = new Map<string, Unit>(COURSE.flatMap((s) => s.units).map((u) => [u.id, u]))

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\/-]/g, '\\$&')
const special = (term: string) => /[_.:/@~-]/.test(term) || term.length > 14

const PATTERNS = Object.entries(TERMS).map(([id, terms]) => ({
  id,
  // "1.5", but not "1.50", "v1.5" or "1.5 hours".
  number: new RegExp(`(?<![\\w.])${escape(id)}(?![\\d])(?!\\s*(?:h\\b|hrs?\\b|hours?|mins?\\b|minutes|%))`, 'gi'),
  terms: terms.map((t) => ({ re: new RegExp(`(?<![a-z])${escape(t)}(?![a-z])`, 'gi'), weight: special(t) ? 2 : 1 })),
}))

export function autoTags(text: string): string[] {
  const scores = PATTERNS.map(({ id, number, terms }) => {
    let score = Math.min((text.match(number)?.length ?? 0) * 3, 6)
    for (const t of terms) score += Math.min(text.match(t.re)?.length ?? 0, 3) * t.weight
    return { id, score }
  })
  return scores
    .filter((s) => s.score >= 2)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, 4)
    .map((s) => s.id)
}

/** "1.1 The agentic loop" */
export const tagName = (id: string) => `${id} ${UNITS.get(id)?.short ?? ''}`.trim()
