#!/usr/bin/env python3
"""Reads Jason's study plan (Markdown) and writes src/content/schedule.json.

The plan is the source: change it, then run this again.

  python3 scripts/import-plan.py ~/Desktop/study-plan.md

Only section 6, "The day-by-day plan", is read: one table per week, plus
the weeks with no table (holidays, Christmas, exam day), which are filled
in from their headings. Each day gets its length from the plan's tags
([2h], [HALF-DAY], [FULL DAY OFF]; 30 minutes otherwise), the lessons it
names, and links to the study site's pages it uses. Uses the standard
library only.
"""

import json
import re
import sys
from datetime import date, timedelta
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / 'src' / 'content' / 'schedule.json'
SITE = 'https://claudecertificationguide.com'
MONTHS = {m: i + 1 for i, m in enumerate(
    ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'])}
SHORT = {k[:3]: v for k, v in MONTHS.items()}

# The study site's lesson pages, as linked from its own menu (22 October 2026).
LESSONS = {
    '1.1': ('Agentic Loops', '/learn/1-agentic-architecture/1-1-agentic-loops'),
    '1.2': ('Multi-Agent Orchestration', '/learn/1-agentic-architecture/1-2-orchestration-patterns'),
    '1.3': ('Subagent Invocation and Context Passing', '/learn/1-agentic-architecture/1-3-subagent-invocation-context'),
    '1.4': ('Workflow Enforcement and Handoff', '/learn/1-agentic-architecture/1-4-workflow-enforcement-handoff'),
    '1.5': ('Agent SDK Hooks', '/learn/1-agentic-architecture/1-5-agent-sdk-hooks'),
    '1.6': ('Task Decomposition Strategies', '/learn/1-agentic-architecture/1-6-task-decomposition'),
    '1.7': ('Session State and Resumption', '/learn/1-agentic-architecture/1-7-session-state-resumption'),
    '2.1': ('Tool Interface Design', '/learn/2-tool-design-mcp/2-1-tool-schema-design'),
    '2.2': ('Structured Error Responses', '/learn/2-tool-design-mcp/2-2-structured-error-responses'),
    '2.3': ('Tool Distribution and Tool Choice', '/learn/2-tool-design-mcp/2-3-tool-distribution-choice'),
    '2.4': ('MCP Server Integration', '/learn/2-tool-design-mcp/2-4-mcp-server-integration'),
    '2.5': ('Built-in Tools', '/learn/2-tool-design-mcp/2-5-built-in-tools'),
    '3.1': ('CLAUDE.md Hierarchy', '/learn/3-claude-code-config/3-1-claude-md-hierarchy'),
    '3.2': ('Custom Slash Commands and Skills', '/learn/3-claude-code-config/3-2-slash-commands-skills'),
    '3.3': ('Path-Specific Rules', '/learn/3-claude-code-config/3-3-path-specific-rules'),
    '3.4': ('Plan Mode vs Direct Execution', '/learn/3-claude-code-config/3-4-plan-mode-execution'),
    '3.5': ('Iterative Refinement Techniques', '/learn/3-claude-code-config/3-5-iterative-refinement'),
    '3.6': ('CI/CD Integration', '/learn/3-claude-code-config/3-6-cicd-integration'),
    '4.1': ('System Prompts with Explicit Criteria', '/learn/4-prompt-engineering/4-1-system-prompts'),
    '4.2': ('Few-Shot Prompting', '/learn/4-prompt-engineering/4-2-few-shot-prompting'),
    '4.3': ('Structured Output with Tool Use', '/learn/4-prompt-engineering/4-3-structured-output'),
    '4.4': ('Validation, Retry and Feedback Loops', '/learn/4-prompt-engineering/4-4-validation-retry-loops'),
    '4.5': ('Batch Processing Strategies', '/learn/4-prompt-engineering/4-5-batch-processing'),
    '4.6': ('Multi-Instance and Multi-Pass Review', '/learn/4-prompt-engineering/4-6-multi-pass-review'),
    '5.1': ('Context Window Management', '/learn/5-context-management/5-1-context-window-management'),
    '5.2': ('Escalation and Ambiguity Resolution', '/learn/5-context-management/5-2-escalation-ambiguity'),
    '5.3': ('Error Propagation in Multi-Agent Systems', '/learn/5-context-management/5-3-error-propagation'),
    '5.4': ('Codebase Exploration and Context Degradation', '/learn/5-context-management/5-4-codebase-exploration'),
    '5.5': ('Human Review and Confidence Calibration', '/learn/5-context-management/5-5-human-review-calibration'),
    '5.6': ('Information Provenance', '/learn/5-context-management/5-6-information-provenance'),
}


def year(month):
    return 2026 if month >= 10 else 2027


def clean(text):
    """The plan's Markdown, as plain text."""
    text = re.sub(r'\*\*|`|(?<=\s)\*|\*(?=\s)', '', text).strip()
    # Shouted words read as ordinary ones: "MOCK EXAM ONE" becomes "Mock exam one".
    # File names such as CLAUDE.md and NOTES.md keep their capitals.
    return re.sub(r'\b[A-Z][A-Z -]{3,}[A-Z]\b(?!\.)', lambda m: m.group(0).capitalize(), text)


def units(text):
    found = []
    # A range such as 4.3–4.5 names every lesson in it.
    for a, b, c in re.findall(r'\b([1-5])\.([1-7])\s*[–-]\s*\1\.([1-7])\b', text):
        found += [f'{a}.{n}' for n in range(int(b), int(c) + 1)]
    found += re.findall(r'\b([1-5]\.[1-7])\b', text)
    return [u for i, u in enumerate(found) if u in LESSONS and u not in found[:i]]


def links(text, lessons):
    out = [{'label': f'Lesson {u}', 'href': SITE + LESSONS[u][1]} for u in lessons]
    t = text.lower()
    if '/diagnostic' in t:
        out.append({'label': 'Diagnostic test', 'href': SITE + '/diagnostic'})
    drills = re.findall(r'drill(?: mode)?,? domains? (\d)(?: and (\d))?', t)
    for a, b in drills:
        for n in filter(None, (a, b)):
            out.append({'label': f'Drill domain {n}', 'href': f'{SITE}/drill?domain={n}'})
    if 'drill' in t and not drills:
        out.append({'label': 'Drill mode', 'href': SITE + '/drill'})
    for n in re.findall(r'/quick-reference/domain-(\d)', t):
        out.append({'label': f'Quick reference, domain {n}', 'href': f'{SITE}/quick-reference/domain-{n}'})
    if 'quick reference' in t and '/quick-reference/' not in t:
        out.append({'label': 'Quick reference', 'href': SITE + '/quick-reference'})
    if '/exercises' in t or 'build exercise' in t:
        out.append({'label': 'Build exercises', 'href': SITE + '/exercises'})
    if 'mock exam' in t:
        out.append({'label': 'Mock exam', 'href': SITE + '/mock-exam'})
    seen = set()
    return [l for l in out if not (l['href'] in seen or seen.add(l['href']))]


def split(task):
    """A short title for the day, and the rest of its task."""
    m = re.match(r'(?:Lesson|Re-read) ([1-5]\.[1-7])(?: and ([1-5]\.[1-7]))? ?([^.—]*)\.?\s*(.*)', task)
    if m and task.startswith('Lesson'):
        u = m.group(1)
        return f'Lesson {u} {LESSONS[u][0]}', m.group(4)
    m = re.match(r'(.+?[.!])\s+(.*)', task)
    return (m.group(1).rstrip('.'), m.group(2)) if m else (task.rstrip('.'), '')


STEPS = {}


def session(day, week, task):
    tags = re.findall(r'\[(2h|HALF-DAY|FULL DAY OFF)\]', task)
    text = clean(re.sub(r'\s*\[(2h|HALF-DAY|FULL DAY OFF)\]\s*', ' ', task))
    if 'FULL DAY OFF' in tags:
        kind, minutes = 'Full day', 360 if '5pm' in text else 300
    elif 'HALF-DAY' in tags:
        kind, minutes = 'Half-day', 210
    elif '2h' in tags:
        kind, minutes = 'Long block', 120
    elif re.search(r'15 min flashcards, then stop', text):
        kind, minutes = 'Short day', 15
    else:
        kind, minutes = 'Daily', 30
    lessons = units(text)
    title, detail = split(text)
    out = {'day': day.isoformat(), 'kind': kind, 'minutes': minutes, 'week': week, 'title': title,
           'task': detail, 'units': lessons, 'links': links(text, lessons)}
    # A sandbox day carries that step's fuller description from section 3.
    step = re.search(r'(?:Sandbox step|sandbox as step) (\d+)', text)
    if step and step.group(1) in STEPS:
        out['build'] = STEPS[step.group(1)]
    return out


def off(day, week, kind, title, task, minutes=0):
    return {'day': day.isoformat(), 'kind': kind, 'minutes': minutes, 'week': week, 'title': title,
            'task': task, 'units': [], 'links': []}


def main(path):
    text = Path(path).expanduser().read_text()
    sandbox = text[text.index('## 3. The sandbox project'):text.index('## 4.')]
    for n, what in re.findall(r'^\| (\d+) \| (.+?) \| [^|]+ \|$', sandbox, re.M):
        STEPS[n] = clean(what)
    start = text.index('# 6. The day-by-day plan')
    end = text.index('# 7. The flashcard deck')
    blocks = re.split(r'\n## ', text[start:end])[1:]
    days = []
    for block in blocks:
        head, _, body = block.partition('\n')
        rows = re.findall(r'^\| (\d{1,2}) (\w{3}) \| \w{3} \| (.+?) \|$', body, re.M)
        if head.startswith('Week'):
            name = head.split('·', 1)[1].strip() if '·' in head else ''
            number = re.match(r'Week (\d+)', head).group(1)
            parts = [p.strip() for p in name.split('·')]
            week = ' · '.join([f'Week {number}'] + [p.capitalize() if p.isupper() else p for p in parts])
        else:
            week = head.split('·')[-1].split('—')[0].strip().capitalize() if '·' in head else head
        if rows:
            for d, mon, task in rows:
                m = SHORT[mon]
                days.append(session(date(year(m), m, int(d)), week, task))
            continue
        # A week with no table: a holiday, Christmas, or exam day.
        span = re.search(r'Mon (\d+)(?: (\w+))? to Sun (\d+) (\w+)', head)
        if span:
            m2 = MONTHS[span.group(4)]
            m1 = MONTHS[span.group(2)] if span.group(2) else m2
            a, b = date(year(m1), m1, int(span.group(1))), date(year(m2), m2, int(span.group(3)))
            christmas = 'CHRISTMAS' in head
            # Christmas names its optional flashcard days, such as **28 Dec**.
            optional = {date(year(SHORT[mm]), SHORT[mm], int(dd)) for dd, mm in re.findall(r'\*\*(\d+) (\w{3})\*\*', body)}
            label = 'Christmas · Off' if christmas else week
            d = a
            while d <= b:
                if christmas and d in optional:
                    days.append(off(d, label, 'Optional', 'Optional flashcards', '10 minutes, to stop the deck going cold. Skip it guilt-free if the house is chaos.', 10))
                elif christmas:
                    days.append(off(d, label, 'Off', 'Christmas', 'Off. Put everything down.'))
                else:
                    days.append(off(d, label, 'Off', 'Holiday', 'Off. Optional 10 minutes of flashcards on travel days. Nothing else.'))
                d += timedelta(days=1)
            continue
        exam = re.search(r'(\w+day) (\d+) (\w+) — EXAM DAY', head)
        if exam:
            m = MONTHS[exam.group(3)]
            days.append(off(date(year(m), m, int(exam.group(2))), 'Exam day', 'Exam', 'Exam day',
                            'Nothing new. Breakfast, your one-page answer patterns once over coffee, then put it away.'))
    days.sort(key=lambda s: s['day'])
    for a, b in zip(days, days[1:]):
        if date.fromisoformat(b['day']) - date.fromisoformat(a['day']) != timedelta(days=1):
            sys.exit(f'Gap in the plan between {a["day"]} and {b["day"]}')
    OUT.write_text(json.dumps(days, indent=1, ensure_ascii=False) + '\n')
    hours = sum(s['minutes'] for s in days) / 60
    print(f'{len(days)} days, {days[0]["day"]} to {days[-1]["day"]}, {hours:.0f} hours planned. Wrote {OUT}')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '~/Desktop/study-plan.md')
