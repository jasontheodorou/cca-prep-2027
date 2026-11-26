#!/usr/bin/env python3
"""Writes src/content/schedule.json: the 100-day plan.

  python3 scripts/build-plan.py

Jason, 26 November 2026: "Structure it so I've got exactly 100 days to pass
this." Ten days "tearing through the entire course", 30 days on "the highest
value areas which make up the chunkiest bit of the course's marking
structure", ten days of "hard technical practice of everything learnt in the
last 40 days", then 50 days of "learning, practicing, testing in short agile
sprints". After the 100 days, "approximately 3 further weeks to drill mock
exams". Then: "this will go to end of april now and thats fine". See
design-journal/decisions/021.

The calendar rules are:
  - day 1 is 1 December 2026 and day 100 is 13 April 2027. Only study days
    are counted. Christmas and the February holiday are off;
  - every month has three rest days, spread evenly. Jason, 26 November:
    "instead of spare days can we please have 3 x off/rest days per month.
    If we need to push this into may that is fine";
  - one session a day, never more than 60 minutes;
  - most days hold two half-hour jobs, kept in the day's "parts";
  - 14 April to 7 May is practice exams. No day is left empty: Jason,
    26 November, "whats up with april why so many dead days". 8 May is rest
    and Sunday 9 May is the exam.
Uses the standard library only.
"""

import importlib.util
import json
import sys
from datetime import date, timedelta
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE.parent / 'src' / 'content' / 'schedule.json'

# The study site's lesson pages and section names, from the old importer.
sys.dont_write_bytecode = True
_spec = importlib.util.spec_from_file_location('import_plan', HERE / 'import-plan.py')
_old = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_old)
SITE, LESSONS, SECTIONS = _old.SITE, _old.LESSONS, _old.SECTIONS

D = date.fromisoformat
START = D('2026-12-01')
EXAM = D('2027-05-09')          # two days after the last study day
RESTS_A_MONTH = 3
DAYS = 100                      # days of study before the practice exams
DAY = 60                        # minutes in a study day
HOLIDAYS = [
    (D('2026-12-21'), D('2027-01-03'), 'Christmas'),
    (D('2027-02-08'), D('2027-02-14'), 'Holiday'),
]
CHRISTMAS_OPTIONAL = {D('2026-12-28'), D('2026-12-30'), D('2027-01-02')}


def lesson_link(u):
    return {'label': f'Open lesson {u}', 'href': SITE + LESSONS[u][1]}


def drill(n):
    return {'label': f'Practice questions: {SECTIONS[n]}', 'href': f'{SITE}/drill?domain={n}'}


def quick(n):
    return {'label': f'Quick reference: {SECTIONS[n]}', 'href': f'{SITE}/quick-reference/domain-{n}'}


EXERCISES = {'label': 'Hands-on exercises', 'href': SITE + '/exercises'}
MOCK = {'label': 'Practice exam', 'href': SITE + '/mock-exam'}
DIAGNOSTIC = {'label': 'Test of all five sections', 'href': SITE + '/diagnostic'}
DRILL_ALL = {'label': 'Practice questions', 'href': SITE + '/drill'}


def read(title, task, units=(), links=()):
    """A reading, question or writing job of half an hour."""
    return {'kind': 'Daily', 'title': title, 'task': task, 'units': list(units), 'links': list(links)}


def practice(title, task, units=(), links=()):
    """A hands-on job of half an hour in the practice project."""
    return {'kind': 'Practice', 'title': title, 'task': task, 'units': list(units), 'links': list(links)}


def two(a, b, title):
    """One study day made of two half-hour jobs. The jobs' own titles are kept
    in "parts", which is how build-how-to.py finds their step-by-step help."""
    links = []
    for link in a['links'] + b['links']:
        if link not in links:
            links.append(link)
    return {'kind': 'Practice' if 'Practice' in (a['kind'], b['kind']) else 'Daily',
            'title': title,
            'task': f'First half hour: {a["task"]}\nSecond half hour: {b["task"]}',
            'units': list(dict.fromkeys(a['units'] + b['units'])),
            'links': links,
            'parts': [a['title'], b['title']]}


def hour(session):
    """One study day with a single job that takes the whole hour."""
    return {**session, 'parts': [session['title']]}


def lesson(u, name, build, test, short=False):
    """Three half-hour jobs: read it, build it, test it. A short lesson builds
    and tests in one job."""
    link = [lesson_link(u)]
    mistakes = ' Then read the lesson\'s common-mistakes box and answer its practice question.'
    tag = lambda s, role, short_: {**s, '_role': role, '_u': u, '_name': name, '_short': short_}
    r = tag(read(f'Lesson {u}: {name}', 'Read it, then do its quick quiz. Stop at 30 minutes, even if you are not finished.', [u], link), 'read', f'Lesson {u}')
    if short:
        return [r, tag(practice(f'Build and test {u}: {build[0]}', f'{build[1]} {test[1]}' + mistakes, [u], link), 'build', f'Build and test {u}')]
    return [
        r,
        tag(practice(f'Build {u}: {build[0]}', build[1], [u], link), 'build', f'Build {u}'),
        tag(practice(f'Test {u}: {test[0]}', test[1] + mistakes, [u], link), 'test', f'Test {u}'),
    ]


def _pair(a, b):
    """Names a day made of two half-hour jobs."""
    ra, rb = a.get('_role'), b.get('_role')
    same = ra and rb and a.get('_u') == b.get('_u')
    lower = lambda t: t[0].lower() + t[1:]
    if ra == 'read' and rb == 'build' and same:
        title = a['title']
    elif ra == 'build' and rb == 'test' and same:
        title = f'Build and test {a["_u"]}: {a["_name"]}'
    elif ra == rb == 'step' and same:
        title = f'Exercise {a["_u"]}, steps {a["_i"]} and {b["_i"]} of 5'
    else:
        second = f'lesson {b["_u"]}: {b["_name"]}' if rb == 'read' else lower(b.get('_short', b['title']))
        title = f'{a.get("_short", a["title"])}, then {second}'
    return two(a, b, title)


def days(items):
    """Pairs the half-hour jobs, in order, into whole days. Whole days already
    in the list pass through."""
    out, half = [], None
    for s in items:
        if 'parts' in s:
            if half:
                sys.exit(f'"{half["title"]}" has no second job before "{s["title"]}"')
            out.append(s)
        elif half:
            out.append(_pair(half, s))
            half = None
        else:
            half = s
    if half:
        sys.exit(f'"{half["title"]}" has no second job')
    return out


def exercise(number, name, intro, steps, section=None):
    """The five steps of one of the exam guide's four exercises, half an hour
    each. The Progress page has a tick for each step (E1.1 and so on)."""
    jobs = []
    for i, (title, task) in enumerate(steps, 1):
        task = (intro + ' ' if i == 1 else '') + task + f' Tick step {i} of exercise {number} on the Progress page.'
        job = practice(f'Exercise {number}, step {i} of {len(steps)}: {title}', task, [f'E{number}'], [EXERCISES])
        jobs.append({**job, '_role': 'step', '_u': number, '_i': i, '_short': f'Exercise {number}, step {i}'})
    return jobs


def phase(week, sessions):
    return [{**s, 'week': week} for s in days(sessions)]


ALL_LESSONS = [
    lesson('1.4', 'forcing steps to happen, and handing over to a person',
            ('check who the customer is first', 'Stop process_refund from running until get_customer has checked who the customer is. Do it in code, not in the prompt.'),
            ('the block and the handover note', 'Ask for a refund without saying who you are, and check it is blocked. Then make the agent write a handover note for a person: customer, cause, amount, what to do next.')),
    lesson('1.5', 'hooks',
            ('two hooks', 'Add a hook that runs after each tool and puts every date into one format. Add a second hook that stops any refund over $500 and passes it to a person.'),
            ('the $500 rule', 'Ask for a $600 refund and a $40 refund. Check the first is stopped and the second goes through. Feed in three date formats and check one comes out.')),
    lesson('1.6', 'breaking a big job into smaller ones',
            ('a review in small passes', 'Make a code review that reads each file of your project in its own pass, then does one more pass across all the files together.'),
            ('small passes against one big pass', 'Run the same review as one big pass. Compare what each way found, and write down which one missed more.')),
    lesson('1.7', 'picking up where you left off',
            ('a session you can come back to', 'Start a named Claude Code session on your project and ask it to map the code. Close it. Open it again with --resume and carry on.'),
            ('resume and fork', 'Change one file, resume the session and tell it which file changed. Then fork the session and try two different fixes side by side.')),
    lesson('3.1', 'where CLAUDE.md files go',
            ('three levels of CLAUDE.md', 'Give your practice project a CLAUDE.md. Add one at user level too. Move one long part into its own file and pull it in with @import.'),
            ('which files load', 'Run /memory and check which files loaded. Move a project rule to user level, and write why a new teammate would never get it.')),
    lesson('3.2', 'your own commands and skills',
            ('a command and a skill', 'Make a /review command in .claude/commands/. Make a skill that has context: fork, allowed-tools and argument-hint at the top.'),
            ('what the skill can do', 'Run both. Check the skill cannot use a tool you left out. Check its long output stays out of your main chat.')),
    lesson('3.3', 'rules for certain files only',
            ('two rules with paths', 'Add two files in .claude/rules/ with paths at the top. One covers test files wherever they sit. One covers a single folder.'),
            ('when a rule loads', 'Open a file that matches a rule, then one that does not. Each time, ask Claude which rules it has loaded.')),
    lesson('3.4', 'plan first, or just do it',
            ('a change planned first', 'Ask Claude for a change that touches many files. Use plan mode, agree the plan, then let it do the work.'),
            ('a fix done directly', 'Give Claude a one-line bug with its error message and let it fix it directly. Write one line on when each way is the right one.')),
    lesson('3.5', 'improving the result over several rounds',
            ('tests first', 'Pick a small function. Write its tests first, with odd cases such as empty values. Then ask Claude to make them pass.'),
            ('vague words against examples', 'Ask for a feature in vague words. Ask again with three examples of what goes in and what comes out. Compare the two results.')),
    lesson('3.6', 'Claude Code in automatic checks',
            ('Claude Code run by a script', 'Run Claude Code from a script with -p and --output-format json. Add --json-schema so the findings come out in a fixed shape.'),
            ('a review that runs itself', 'Put your script in a GitHub Action that reviews a pull request, or run it twice by hand. On the second run, check it reports only new problems.')),
    lesson('4.1', 'clear instructions that avoid false alarms',
            ('a review prompt with clear rules', 'Write a code review prompt. Say what to report (bugs, security) and what to skip (style). Give one code example for each level of seriousness.'),
            ('count the false alarms', 'Run your prompt on three files and count the false alarms. Rewrite the vaguest rule and run it again.')),
    lesson('4.2', 'teaching with examples',
            ('three examples in your prompt', 'Add three examples to your review prompt. Each one shows a tricky case, the right answer and why. Show the exact output format.'),
            ('the same files again', 'Run it on the same three files as last time. Check the format is the same every time and that there are fewer false alarms.')),
    lesson('4.3', 'getting answers in a fixed format',
            ('a tool that pulls facts from a letter', 'Add a tool that pulls set facts out of a refund letter, described as a JSON schema. Let any fact be left empty. Add "unclear" and "other" to each list of choices.'),
            ('letters with facts missing', 'Feed it letters with facts missing. Check it leaves them empty and makes nothing up. Then force the tool with tool_choice.')),
    lesson('4.4', 'checking answers and trying again',
            ('check, then try again', 'Add a check on each answer. If the check fails, send back the letter, the failed answer and the exact error, and try again.'),
            ('what a retry can fix', 'Cause one mistake a retry can fix (a wrong format) and one it cannot (the fact is not in the letter). Watch what happens to each.')),
    lesson('4.5', 'sending lots of work at once',
            ('ten letters in one batch', 'Send ten letters through the Message Batches API. Give each one a custom_id. Results can take hours, so collect them tomorrow.'),
            ('send only the failures again', 'Collect yesterday\'s results. Make two letters fail on purpose and send only those again, by custom_id. Write when you would not use a batch.')),
    lesson('4.6', 'getting a second, independent check',
            ('a second Claude as reviewer', 'Have one Claude write a small function. Have a second, fresh Claude review it, without seeing how the first one got there.'),
            ('fresh eyes against the same eyes', 'Ask the first Claude to review its own work in the same chat. Compare what each review found.')),
    lesson('2.1', 'describing tools clearly',
            ('two tools that look alike', 'Add a second tool that looks a lot like lookup_order. Write both descriptions so it is clear what each is for, what goes in and when to use it.'),
            ('which tool Claude picks', 'Ask ten questions and note which tool Claude picks each time. Make one description vague and watch the picks go wrong.')),
    lesson('2.2', 'helpful error messages from tools',
            ('errors that say what went wrong', 'Make every tool report an error with three things: errorCategory, isRetryable and a plain message.'),
            ('four kinds of error', 'Cause four errors: a timeout, a bad input, no permission and a broken shop rule. Check the agent retries only the timeout. Check "found nothing" is not an error.')),
    lesson('2.3', 'which agent gets which tools',
            ('fewer tools for each helper', 'Give each helper agent only the tools its job needs. Swap one do-anything tool for a narrow one.'),
            ('forcing a tool', 'Use tool_choice to force one tool to run first. Then set it to "any". Write down what Claude does each time.')),
    lesson('2.4', 'connecting MCP servers',
            ('your tools as an MCP server', 'Put your tools in an MCP server. List it in the project\'s .mcp.json, with its token written as ${SOME_TOKEN}.'),
            ('two places for servers', 'Add a personal server in ~/.claude.json. Check Claude Code sees both. Then offer your list of orders as an MCP resource.')),
    lesson('2.5', 'Claude Code\'s built-in tools',
            ('find things with Grep and Glob', 'In Claude Code, find every place process_refund is called, using Grep. Find every test file, using Glob.'),
            ('when Edit cannot find the place', 'Ask for an edit where the same text appears twice, so Edit cannot find one place. Watch Claude use Read, then Write.'), short=True),
    lesson('5.1', 'keeping track in long conversations',
            ('a block of case facts', 'Keep a short block of case facts (customer, order, amount, dates) and put it in every prompt. Cut tool results down to the fields that matter.'),
            ('a long chat about two orders', 'Have a long chat about two orders. Check the agent still has both amounts right at the end. Take the block out and try again.')),
    lesson('5.2', 'when to pass to a person, and unclear requests',
            ('rules for passing to a person', 'Write rules in the system prompt for when to pass a customer to a person. Add three examples.'),
            ('four hard messages', 'Try four messages: "get me a human", an angry customer, a request the rules do not cover, and a name that matches two customers.')),
    lesson('5.3', 'passing errors between agents',
            ('a helper that fails well', 'Make one helper agent time out on purpose. Make it report what failed, what it tried and what it did manage to find.'),
            ('the main agent carries on', 'Check the main agent still finishes and says which part is missing. Check "found nothing" is reported differently from "could not look".')),
    lesson('5.4', 'finding your way around a big codebase',
            ('explore with a notes file', 'Explore a big codebase with Claude Code. Have it keep a notes file of what it finds, and use helper agents for single questions.'),
            ('carry on from the notes', 'Use /compact part of the way through. Then start a new session from the notes file alone and check it can carry on.')),
    lesson('5.5', 'when a person should check the work',
            ('a score for each fact', 'Make your fact-finding tool give a confidence score for each fact. Send the low scores to a list for a person to check.'),
            ('check the confident answers too', 'Run 20 letters. Check a random few of the confident answers by hand, for each type of letter. Write down where it was wrong.')),
    lesson('5.6', 'where facts came from',
            ('every claim with its source', 'Make each helper agent return every claim with its source, a quote and a date. Make the final report keep them.'),
            ('two sources that disagree', 'Give it two sources that disagree on a number. Check the report shows both numbers with their sources, and does not pick one.')),
]
L = {jobs[0]['_u']: jobs for jobs in ALL_LESSONS}


EMPTY = 'Start in a new, empty folder and do not look at your practice project.'

EXERCISE_2 = exercise(2, 'Claude Code for a team', EMPTY, [
    ('a CLAUDE.md for a team', 'Write a project CLAUDE.md with rules for how code is written and how it is tested.'),
    ('rules for some files only', 'Add two files in .claude/rules/ with paths at the top. Check each one loads only for files that match.'),
    ('a skill that runs apart', 'Make a project skill with context: fork and allowed-tools. Check it runs apart from your main chat.'),
    ('two MCP servers', 'Set up a project MCP server with its token in an environment variable, and a personal one in ~/.claude.json. Check both work.'),
    ('plan mode or not', 'Try plan mode and doing it directly on three jobs: a one-file fix, a change across many files, and a feature with several ways to build it.'),
])

EXERCISE_3 = exercise(3, 'Facts from documents', EMPTY, [
    ('the fact-finding tool', 'Make a tool with facts that must be there, facts that may be empty, and a list with "other" plus a note. Check missing facts come back empty.'),
    ('check and try again', 'Add the step that checks each answer and tries again. Write down which errors a retry can fix and which it cannot.'),
    ('examples for odd documents', 'Add examples for documents laid out in different ways. Check the answers get better.'),
    ('a batch of 100', 'Send 100 documents as one batch. Tomorrow, send only the failures again by custom_id. Compare the time it took with a deadline you set.'),
    ('unsure answers go to a person', 'Send facts with low confidence to a person to check. Work out how often the tool is right, for each type of document and each fact.'),
])

EXERCISE_1 = exercise(1, 'The support agent', EMPTY, [
    ('the tools', 'Make three or four tools with clear descriptions. Two of them should be alike, so the wording has to tell them apart.'),
    ('the loop', 'Write the agent loop. Carry on when stop_reason is tool_use and stop when it is end_turn.'),
    ('clear errors', 'Make the tools report errors in a clear shape. Check the agent retries a timeout and explains a broken shop rule to the customer.'),
    ('the hook', 'Add a hook that blocks any refund over a set amount and passes it to a person.'),
    ('several requests in one message', 'Send messages that ask for several things at once. Check the agent splits them up, deals with each and gives one answer.'),
])

EXERCISE_4 = exercise(4, 'Agents doing research', EMPTY, [
    ('the main agent', 'Make a main agent that is allowed the Task tool and passes what it has found to each helper in the helper\'s prompt.'),
    ('helpers at the same time', 'Start the helpers at the same time from one reply. Time it against running them one after another.'),
    ('every finding with its source', 'Give each finding a claim, a quote, a source and a date. Check the final report keeps them.'),
    ('a helper that times out', 'Make one helper time out. Check the main agent carries on with what it has and says what is missing.'),
    ('numbers that disagree', 'Give it two sources with different numbers. Check the report keeps both, each with its source.'),
])

EX = {1: EXERCISE_1, 2: EXERCISE_2, 3: EXERCISE_3, 4: EXERCISE_4}


def situation(number, about=''):
    return read(f'Exam situation {number}', f'In the exam guide, read situation {number}{about}. Write five questions it could lead to, then answer them.')


def quiz(n):
    return read(f'Practice questions: {SECTIONS[n]}', 'Answer 20 practice questions. Write down the number of each one you get wrong.', links=[drill(n)])


FIX = {
    '1': 'Pick the two questions you got most wrong. Build or run each one in your practice project until you can see why the right answer is right.',
    '3': 'Copy every file location and setting name you got wrong onto a flashcard. Then make each one for real in your practice project.',
    '4': 'Pick the two questions you got most wrong. Change your review prompt or your fact-finding tool to try each one out.',
    '2': 'Pick the two questions you got most wrong. Change a tool, its description or its error in your practice project to try each one out.',
    '5': 'Pick the two questions you got most wrong. Build or run each one in your practice project until you can see why the right answer is right.',
}


def fix(n):
    return practice(f'Fix what you got wrong: {SECTIONS[n]}', FIX[n])


def mistakes(n):
    return read(f'Common mistakes: {SECTIONS[n]}', 'Read every common-mistakes box in this section. Turn anything you had forgotten into a flashcard.', links=[quick(n)])


def own(n):
    return read('Write four questions of your own', f'Write four exam-style questions about {SECTIONS[n]}. Give each one the right answer and three wrong answers that sound right.')


MEMORY = {
    '1': 'With an empty file and no notes, write the agent loop and the block on refunds over $500. Then compare them with your practice project.',
    '3': 'In an empty folder and with no notes, make a CLAUDE.md, a rule with paths, a command and a skill. Check each one loads.',
    '4': 'With no notes, write a fact-finding tool that allows empty facts, "unclear" and "other". Add the step that checks the answer and tries again.',
    '2': 'With no notes, write three tool descriptions and one error with errorCategory and isRetryable. Check Claude picks the right tool.',
    '5': 'With no notes, make a helper agent fail and report it properly. Then make a report show both of two numbers that disagree.',
}


def memory(n):
    return practice(f'Build from memory: {SECTIONS[n]}', MEMORY[n])


RULES = read('Write your nine answer rules', 'By hand, on one page, write the nine rules from your plan that help you pick the right answer. Use your own words.')
EXPLAIN = read('Explain it out loud', 'With no notes, explain in three minutes how one main agent runs several helpers. Then do the same for hooks. Check both against your Notes.')
MIXED = read('Practice questions: every section', 'Answer six questions in each of the five sections. Write down each score.', links=[DRILL_ALL])
SHAKY = practice('Your shakiest topic', 'Pick the topic you are least sure of so far. Read its common-mistakes box, then build it again in your practice project from an empty file.')
REVIEW = read('Sprint review', 'Write three lines in Notes: what you learnt, what you got wrong and what to look at again. Then go through your flashcards.')


# Days 1 to 10: the whole course, fast. Nothing is built.
def skim(units, name, title=None):
    a, b = units[0], units[-1]
    return hour(read(title or f'The whole course: {name}, lessons {a} to {b}',
                     f'Skim these {len(units)} lessons, about {60 // len(units)} minutes each. Read the headings, the summary and the common-mistakes box. Build nothing. Write one line on each in Notes.',
                     units, [lesson_link(u) for u in units]))


SURVEY = phase('See the whole course', [
    two(read('The exam guide: how the exam works', 'Read the start of the exam guide: how the exam is marked, the five sections and their share of the marks, and the six situations. Write the five shares in Notes.'),
        read('Book your exam', 'Book the exam for Sunday 9 May. Check the name on your ID matches the booking exactly.'),
        'How the exam works, then book it'),
    skim(['1.1', '1.2', '1.3', '1.4'], 'Agents'),
    skim(['1.5', '1.6', '1.7'], 'Agents'),
    skim(['3.1', '3.2', '3.3'], 'Claude Code'),
    skim(['3.4', '3.5', '3.6'], 'Claude Code'),
    skim(['4.1', '4.2', '4.3'], 'Prompts and output'),
    skim(['4.4', '4.5', '4.6'], 'Prompts and output'),
    skim(['2.1', '2.2', '2.3'], 'Tools and MCP'),
    skim(['2.4', '2.5', '5.1', '5.2'], '', 'The whole course: lessons 2.4, 2.5, 5.1 and 5.2'),
    skim(['5.3', '5.4', '5.5', '5.6'], 'Context and reliability'),
])

# Days 11 to 40: the lessons that carry the most marks. The exam guide gives
# each section a share of the marks: Agents 27%, Claude Code 20%, Prompts 20%,
# Tools and MCP 18%, Context 15%. The 30 days are split in those shares. The
# guide gives no marks for single lessons, so the lessons picked in each
# section are its first ones, which the later ones build on.
CORE = [
    *phase('What decides the mark · Where you start', [
        hour(read('Test all five sections', 'Take the test of all five sections on the study site. Write each section\'s score in Notes. This is your starting line.', links=[DIAGNOSTIC])),
    ]),
    *phase('What decides the mark · Agents', [
        practice('Add three tools',
                 'Add three tools that read your JSON file: get_customer, lookup_order and process_refund. Run each one by hand and check what comes back.', ['2.1']),
        {**practice('Build 1.1: the agent loop',
                    'Write the loop: send a message, run the tool Claude asks for, add the result, and repeat. Stop only when stop_reason is end_turn. Then ask for a refund that needs two tools and print stop_reason each time round.', ['1.1'], [lesson_link('1.1')]),
         '_short': 'Build the agent loop'},
        {**practice('Build 1.2 and 1.3: one main agent, two helpers',
                    'Make a main agent that starts two helper agents in one reply, using the Task tool. Put everything each helper needs into its prompt.', ['1.2', '1.3'], [lesson_link('1.2'), lesson_link('1.3')]),
         '_short': 'Build two helpers'},
        {**practice('Test 1.2 and 1.3: what a helper knows',
                    'Leave one fact out of a helper\'s prompt and watch it fail. A helper knows only what you pass it. Put the fact back and run it again.', ['1.2', '1.3'], [lesson_link('1.2'), lesson_link('1.3')]),
         '_short': 'Test what a helper knows'},
        read('Make your flashcards',
             'Make a set of flashcards, on paper or in an app. Copy 15 facts from the quick reference page for Agents.', links=[quick('1')]),
        *L['1.4'], *L['1.5'], *L['1.6'],
        two(quiz('1'), fix('1'), 'Questions on Agents, then fix what you got wrong'),
    ]),
    *phase('What decides the mark · Claude Code', [*L['3.1'], *L['3.2'], *L['3.3'], *L['3.4']]),
    *phase('What decides the mark · Prompts and output', [*L['4.1'], *L['4.2'], *L['4.3'], *L['4.4']]),
    *phase('What decides the mark · Tools and MCP', [*L['2.1'], *L['2.2'], *L['2.3'], *L['2.4']]),
    *phase('What decides the mark · Context and reliability', [*L['5.1'], *L['5.2']]),
]

# Days 41 to 50: the exam guide's exercises, built in empty folders, and the
# main pieces written again from memory. The exercise steps that need lessons
# not yet studied wait for the sprints.
PRACTICE = phase('Hard practice', [
    *EX[1], memory('1'),
    *EX[2], memory('3'),
    *EX[3][:3], memory('4'),
    *EX[4][:2],
    memory('2'), MIXED,
])


# Days 51 to 100: ten sprints of five days. Learn one new lesson, practise,
# test, review, and go again.
def sprint(k, u, n, extras):
    jobs = [*L[u], *extras]
    if len(jobs) != 6:
        sys.exit(f'Sprint {k} has {len(jobs)} jobs in its first three days, not 6')
    return phase(f'Sprint {k} of 10 · Lesson {u}', [
        *jobs,
        two(quiz(n), fix(n), f'Sprint {k} test: {SECTIONS[n]}'),
        two(mistakes(n), REVIEW, f'Sprint {k} review: {SECTIONS[n]}'),
    ])


SPRINTS = [
    *sprint(1, '1.7', '1', [situation(1, ', about a customer support agent'), situation(3, ', about several agents doing research together'), SHAKY]),
    *sprint(2, '3.5', '3', [situation(2), situation(5), SHAKY]),
    *sprint(3, '3.6', '3', [own('3'), memory('3'), SHAKY]),
    *sprint(4, '4.5', '4', [EX[3][3], situation(6, ', about pulling facts out of documents'), SHAKY]),
    *sprint(5, '4.6', '4', [own('4'), memory('4'), SHAKY]),
    *sprint(6, '2.5', '2', [situation(4), own('2'), memory('2'), SHAKY]),
    *sprint(7, '5.3', '5', [EX[4][2], EX[4][3], SHAKY]),
    *sprint(8, '5.4', '5', [RULES, own('5'), SHAKY]),
    *sprint(9, '5.5', '5', [EX[3][4], memory('1'), SHAKY]),
    *sprint(10, '5.6', '5', [EX[4][4], memory('5'), EXPLAIN]),
]


# After day 100: practice exams until the exam.
def mock(number):
    again = 'Read its common-mistakes box, then build it again in your practice project from an empty file.'
    return phase(f'Practice exams · Exam {number} of 5', [
        hour(read(f'Practice exam {number}, questions 1 to 30', 'Questions 1 to 30 of the practice exam. One hour, no notes. Note where you stopped and carry on tomorrow.', links=[MOCK])),
        hour(read(f'Practice exam {number}, questions 31 to 60', 'Questions 31 to 60 of the practice exam. One hour, no notes.', links=[MOCK])),
        two(read(f'Mark practice exam {number}', 'Write each section\'s score in Notes. List the three topics you did worst on by number, such as 2.3, 5.1 and 1.6.'),
            read('Learn from your wrong answers', f'For every question you got wrong in practice exam {number}, write one sentence on why the right answer is right.'),
            f'Mark practice exam {number}'),
        two(practice('Your weakest topic', again), practice('Your second-weakest topic', again), f'Your two weakest topics after exam {number}'),
    ])


MOCKS = [
    *mock(1), *mock(2), *mock(3), *mock(4), *mock(5),
    *phase('Practice exams · Last days', [
        two(read('The six exam situations', 'Read all six situations in the exam guide again. For each, say out loud the three questions you would expect.'),
            read('The sample questions', 'Answer the 12 sample questions in the exam guide without looking. Then read the guide\'s list of what is not in the exam.'),
            'The exam guide: situations and sample questions'),
        two(read('Common mistakes: every section', 'Read the common-mistakes boxes you marked as hard. Skip the ones you know.'),
            read('Last study day', 'Say your nine answer rules out loud. Go through all your flashcards once. Then stop. Nothing new today.'),
            'Common mistakes, then your last look'),
    ]),
]

PLAN = SURVEY + CORE + PRACTICE + SPRINTS


def off(day, week, title, task, kind='Off', minutes=0):
    return {'day': day.isoformat(), 'kind': kind, 'minutes': minutes, 'week': week, 'title': title, 'task': task, 'units': [], 'links': []}


def holiday(day):
    for a, b, name in HOLIDAYS:
        if a <= day <= b:
            return name
    return None


def rest_days(year, month):
    """Three rest days, spread evenly over the month's days that are not
    holiday. One that would fall just before a holiday moves three days
    earlier, so the break does not swallow it."""
    d, days = date(year, month, 1), []
    while d.month == month:
        if not holiday(d):
            days.append(d)
        d += timedelta(days=1)
    out = []
    for k in range(1, RESTS_A_MONTH + 1):
        r = days[len(days) * k // (RESTS_A_MONTH + 1)]
        if any(holiday(r + timedelta(days=i)) for i in (1, 2)):
            r -= timedelta(days=3)
        out.append(r)
    return out


def main():
    if len(PLAN) != DAYS:
        sys.exit(f'The plan has {len(PLAN)} days, not {DAYS}')
    last_study = EXAM - timedelta(days=2)
    queue, out, n, week = PLAN + MOCKS, [], 0, PLAN[0]['week']
    rests, d = set(), START
    while d <= EXAM:
        rests.update(rest_days(d.year, d.month))
        d += timedelta(days=28)
    d = START
    while d <= last_study:
        name = holiday(d)
        if name == 'Christmas' and d in CHRISTMAS_OPTIONAL:
            out.append(off(d, 'Christmas · Time off', 'Flashcards, if you like', '10 minutes, so you do not forget them. Skip it if the house is busy.', 'Optional', 10))
        elif name == 'Christmas':
            out.append(off(d, 'Christmas · Time off', 'Christmas', 'Time off. No studying. The 100 days do not count this one.'))
        elif name:
            out.append(off(d, 'Holiday', 'Holiday', 'Time off. No studying. The 100 days do not count this one.'))
        elif d in rests:
            out.append(off(d, week, 'Rest day', 'A day off. No studying. The 100 days do not count this one.'))
        elif n < len(queue):
            s = queue[n]
            n += 1
            week = f'Day {n} of {DAYS} · {s["week"]}' if n <= DAYS else s['week']
            out.append({'day': d.isoformat(), 'kind': s['kind'], 'minutes': DAY, 'week': week,
                        'title': s['title'], 'task': s['task'], 'units': s['units'], 'links': s['links'], 'parts': s['parts']})
        else:
            out.append(off(d, week, 'Spare day', 'Nothing planned. Catch up on a missed day, or rest.'))
        d += timedelta(days=1)
    if n < len(queue):
        sys.exit(f'{len(queue) - n} days do not fit before the exam, starting with "{queue[n]["title"]}"')
    day100 = [s for s in out if s['week'].startswith(f'Day {DAYS} of')][0]['day']
    out.append(off(EXAM - timedelta(days=1), 'Practice exams · Last days', 'Rest', 'No studying. Get your ID ready and go to bed early.'))
    out.append(off(EXAM, 'Exam day', 'Exam day', 'Nothing new today. Have breakfast, read your page of answer rules once, then put it away.', 'Exam'))

    # Help is keyed by a day's title, so one title must always mean the same jobs.
    seen = {}
    for s in out:
        if seen.setdefault(s['title'], s.get('parts')) != s.get('parts'):
            sys.exit(f'Two different days are both called "{s["title"]}"')
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False) + '\n')

    hands_on = [s for s in out if s['week'].startswith('Day ') and s['kind'] == 'Practice']
    spare = [s for s in out if s['title'] == 'Spare day']
    if spare:
        sys.exit(f'{len(spare)} empty days before the exam, from {spare[0]["day"]}. Move EXAM earlier.')
    rest = [s for s in out if s['title'] == 'Rest day']
    print(f'{DAYS} study days, {START} to {day100}: {len(hands_on)} with hands-on work')
    print(f'{len(MOCKS)} practice-exam days to {last_study}, {len(rest)} rest days. Exam {EXAM}. Wrote {OUT}')


if __name__ == '__main__':
    main()
