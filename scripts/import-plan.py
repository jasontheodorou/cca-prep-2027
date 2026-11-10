#!/usr/bin/env python3
"""Reads Jason's study plan (Markdown) and writes src/content/schedule.json.

No longer how the schedule is made. Since 9 November 2026 build-plan.py
writes it (decision 016) and borrows this file's list of lesson pages.
Running this would bring back the old plan.

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
# Plain English for each day and week (reading age 14), checked against the plan's own words.
PLAIN = json.loads((Path(__file__).resolve().parent / 'plain-plan.json').read_text())
SECTIONS = {'1': 'Agents', '2': 'Tools and MCP', '3': 'Claude Code', '4': 'Prompts and output', '5': 'Context and reliability'}
LESSON_STEPS = 'Read it, then do its quick quiz, its common-mistakes box and its practice question.'
unplain = []
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
    out = [{'label': f'Open lesson {u}', 'href': SITE + LESSONS[u][1]} for u in lessons]
    t = text.lower()
    if '/diagnostic' in t:
        out.append({'label': 'Starting test', 'href': SITE + '/diagnostic'})
    drills = re.findall(r'drill(?: mode)?,? domains? (\d)(?: and (\d))?', t)
    for a, b in drills:
        for n in filter(None, (a, b)):
            out.append({'label': f'Practice questions: {SECTIONS[n]}', 'href': f'{SITE}/drill?domain={n}'})
    if 'drill' in t and not drills:
        out.append({'label': 'Practice questions', 'href': SITE + '/drill'})
    for n in re.findall(r'/quick-reference/domain-(\d)', t):
        out.append({'label': f'Quick reference: {SECTIONS[n]}', 'href': f'{SITE}/quick-reference/domain-{n}'})
    if 'quick reference' in t and '/quick-reference/' not in t:
        out.append({'label': 'Quick reference', 'href': SITE + '/quick-reference'})
    if '/exercises' in t or 'build exercise' in t:
        out.append({'label': 'Hands-on exercises', 'href': SITE + '/exercises'})
    if 'mock exam' in t:
        out.append({'label': 'Practice exam', 'href': SITE + '/mock-exam'})
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
    plain = PLAIN['days'].get(day.isoformat())
    if plain and plain['was'] == task.strip():
        out['title'] = plain['title']
        out['task'] = plain['task'] or (LESSON_STEPS if plain['title'].startswith('Lesson') else '')
    else:
        unplain.append(day.isoformat())
    step = re.search(r'(?:Sandbox step|sandbox as step) (\d+)', text)
    if step and step.group(1) in STEPS:
        out['build'] = STEPS[step.group(1)]
    return out


def off(day, week, kind, title, task, minutes=0):
    return {'day': day.isoformat(), 'kind': kind, 'minutes': minutes, 'week': week, 'title': title,
            'task': task, 'units': [], 'links': []}


FIXED = {'Off', 'Optional', 'Exam'}


def pull_ahead(days, start):
    """Moves the study days from start['from'] into the study days from
    start['on'], up to the first break, keeping days off on their dates."""
    if not start:
        return days
    # Only up to the first break: work never moves across a holiday, so the
    # day gained becomes a spare day just before it, and later weeks keep
    # their dates (and the days off work they were planned around).
    brk = next((d['day'] for d in days if d['kind'] == 'Off' and d['day'] > start['on']), '9999')
    tasks = [d for d in days if d['kind'] not in FIXED and start['from'] <= d['day'] < brk]
    slots = [d['day'] for d in days if d['kind'] not in FIXED and start['on'] <= d['day'] < brk]
    by_day = {d['day']: d for d in days}
    for day, task in zip(slots, tasks):
        by_day[day] = {**task, 'day': day}
    for day in slots[len(tasks):]:
        week = by_day[day]['week']
        by_day[day] = {'day': day, 'kind': 'Spare', 'minutes': 0, 'week': week, 'title': start['spare']['title'],
                       'task': start['spare']['task'], 'units': [], 'links': []}
    t = start.get('today')
    if t:
        old = by_day.get(t['day'])
        by_day[t['day']] = {'day': t['day'], 'kind': 'Daily', 'minutes': 30, 'week': old['week'] if old else '',
                            'title': t['title'], 'task': t['task'], 'units': [], 'links': []}
    return [by_day[k] for k in sorted(by_day)]


def stretch(days, plan):
    """Spreads the work not yet done out to a later exam day (see
    plain-plan.json, 'stretch'). Days off keep their dates."""
    if not plan:
        return days
    D = date.fromisoformat
    resume, on, exam = D(plan['resume']), D(plan['on']), D(plan['exam'])
    old_exam = D(days[-1]['day'])
    taper_from = old_exam - timedelta(days=5)
    fixed = {D(d['day']): d for d in days if d['kind'] in ('Off', 'Optional') and D(d['day']) >= on}
    work = [d for d in days if d['kind'] not in FIXED | {'Spare'} and resume <= D(d['day']) < taper_from]
    taper = [d for d in days if taper_from <= D(d['day']) < old_exam]
    # Where each piece of work sat among the old plan's study days, as a share of them.
    old_slots = [D(d['day']) for d in days if d['kind'] not in FIXED and resume <= D(d['day']) < taper_from]
    new_end = exam - timedelta(days=len(taper))
    new_slots = [on + timedelta(days=i) for i in range((new_end - on).days) if on + timedelta(days=i) not in fixed]
    allowed = {'Long block': {5}, 'Half-day': {2}}  # Saturday, Wednesday
    short_days = {0, 1, 3, 6}                        # Monday, Tuesday, Thursday, Sunday
    # Packing and coming back belong next to a holiday, wherever the work around them moves.
    edges = {'Pack for your holiday': [], 'Welcome back': []}
    for s in work:
        if s['title'] in edges:
            edges[s['title']].append(s)
    work = [s for s in work if s['title'] not in edges]
    taken, last, out = {}, {}, []
    holidays = sorted(k for k, d in fixed.items() if d['kind'] == 'Off')
    starts = [k for k in holidays if k - timedelta(days=1) not in fixed]
    ends = [k for k in holidays if k + timedelta(days=1) not in fixed]
    for a, b in zip(starts, ends):
        if b - a < timedelta(days=6) or a.month == 12:
            continue  # Christmas has its own goodbye, the day the answer rules are written
        for title, day in (('Pack for your holiday', a - timedelta(days=1)), ('Welcome back', b + timedelta(days=1))):
            if edges[title] and day in new_slots:
                taken[day] = {**edges[title].pop(0), 'day': day.isoformat()}
    for s in work:
        share = old_slots.index(D(s['day'])) / len(old_slots)
        target = new_slots[int(share * len(new_slots))]
        ok = allowed.get(s['kind'], short_days)
        group = s['kind'] if s['kind'] in allowed else 'short'
        start = max(target - timedelta(days=3) if group != 'short' else target, last.get(group, on - timedelta(days=1)) + timedelta(days=1))
        day = next((d for d in new_slots if d >= start and d.weekday() in ok and d not in taken), None)
        if day is None:
            sys.exit(f'No room before the exam for {s["day"]} {s["title"]}')
        task = s['task']
        if day + timedelta(days=1) not in fixed:
            task = task.replace(' Then stop for Christmas.', '')
        taken[day] = {**s, 'day': day.isoformat(), 'task': task}
        last[group] = day
    out = [d for d in days if D(d['day']) < resume]
    for d in days:
        if resume <= D(d['day']) < on and d['kind'] not in FIXED:
            out.append({**d, 'kind': 'Off', 'minutes': 0, 'title': plan['moved']['title'], 'task': plan['moved']['task'], 'units': [], 'links': []})
        elif resume <= D(d['day']) < on:
            out.append(d)
    week = work[0]['week']
    for d in new_slots:
        if d in taken:
            week = taken[d]['week']
            out.append(taken[d])
        else:
            out.append({'day': d.isoformat(), 'kind': 'Off', 'minutes': 0, 'week': week, 'title': plan['rest']['title'],
                        'task': plan['rest']['task'], 'units': [], 'links': []})
    out += [d for k, d in fixed.items() if k < new_end]
    for i, t in enumerate(taper):
        out.append({**t, 'day': (new_end + timedelta(days=i)).isoformat()})
    out.append({**days[-1], 'day': exam.isoformat()})
    return sorted(out, key=lambda s: s['day'])


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
                    days.append(off(d, label, 'Optional', 'Flashcards, if you like', '10 minutes, so you do not forget them. Skip it if the house is busy.', 10))
                elif christmas:
                    days.append(off(d, label, 'Off', 'Christmas', 'Time off. No studying.'))
                else:
                    days.append(off(d, label, 'Off', 'Holiday', 'Time off. If you like, 10 minutes of flashcards on travel days. Nothing else.'))
                d += timedelta(days=1)
            continue
        exam = re.search(r'(\w+day) (\d+) (\w+) — EXAM DAY', head)
        if exam:
            m = MONTHS[exam.group(3)]
            days.append(off(date(year(m), m, int(exam.group(2))), 'Exam day', 'Exam', 'Exam day',
                            'Nothing new today. Have breakfast, read your page of answer rules once, then put it away.'))
    for d in days:
        d['week'] = PLAIN['weeks'].get(d['week'], d['week'])
    days.sort(key=lambda s: s['day'])
    days = pull_ahead(days, PLAIN.get('start'))
    days = stretch(days, PLAIN.get('stretch'))
    for a, b in zip(days, days[1:]):
        if date.fromisoformat(b['day']) - date.fromisoformat(a['day']) != timedelta(days=1):
            sys.exit(f'Gap in the plan between {a["day"]} and {b["day"]}')
    OUT.write_text(json.dumps(days, indent=1, ensure_ascii=False) + '\n')
    hours = sum(s['minutes'] for s in days) / 60
    if unplain:
        print('No plain English yet (the plan\'s own words are used): ' + ', '.join(unplain))
    print(f'{len(days)} days, {days[0]["day"]} to {days[-1]["day"]}, {hours:.0f} hours planned. Wrote {OUT}')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '~/Desktop/study-plan.md')
