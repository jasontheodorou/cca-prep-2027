#!/usr/bin/env python3
"""Writes src/content/schedule.json: the one-hour-a-day plan.

  python3 scripts/build-plan.py

Jason, 26 November 2026: "It needs to be one hour of work a day on this, with
the goal of ultimately taking and passing the exam by march 2027", then "start
the study from december" and the calendar "only go up to end of march 2027".
The exam is planned for Saturday 27 March. See design-journal/decisions/020.

The plan is the lists below, in order. The calendar rules are:
  - one session a day, never more than 60 minutes;
  - most days hold two half-hour jobs, kept in the day's "parts";
  - Friday is a spare day, with nothing planned;
  - four Fridays are library days: optional whole days somewhere quiet. The
    plan works without them;
  - Christmas and the February holiday keep their dates;
  - the plan starts on 1 December. Earlier days are not in it.
Each lesson has three half-hour jobs: read it, build it, test it. Two jobs fit
in a day, so two lessons take three days. Each section ends with one of the
exam guide's four exercises, two steps a day.
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
EXAM = D('2027-03-27')          # the last Saturday in March
DAY = 60                        # minutes in a study day
SPARE_WEEKDAY = 4               # Friday
HOLIDAYS = [
    (D('2026-12-21'), D('2027-01-03'), 'Christmas'),
    (D('2027-02-08'), D('2027-02-14'), 'Holiday'),
]
CHRISTMAS_OPTIONAL = {D('2026-12-28'), D('2026-12-30'), D('2027-01-02')}

# Booking takes a few minutes, so it sits on the first spare Friday.
BOOK = (D('2026-12-04'), 'Book your exam',
        'A small job for a spare day. Book the exam for Saturday 27 March. Check the name on your ID matches the booking exactly.')

# Jason, 9 November 2026: "may need to find a way to get to the british library
# for a few days". Each is a whole day that can move to any date near it.
MOVE = ' Move this day to any date near it that suits you.'
def _again(what):
    return (f'A whole day somewhere quiet. Finish any step of {what} that an hour was too short for. '
            'Then do it all again in an empty folder, from memory.' + MOVE)


LIBRARY = {
    D('2027-01-15'): ('Library day 1, if you can: exercise 2 again', _again('exercise 2')),
    D('2027-01-29'): ('Library day 2, if you can: exercise 3 again', _again('exercise 3')),
    D('2027-03-05'): ('Library day 3, if you can: exercises 1 and 4 again', _again('exercises 1 and 4')),
    D('2027-03-19'): ('Library day 4, if you can: a full practice exam',
                      'A whole day somewhere quiet. Morning: all 60 questions in 2 hours, with no notes, like the real exam. After lunch: mark it, then build your two weakest topics again from an empty file. If you can only manage one library day, make it this one.' + MOVE),
}


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
    tag = lambda s, role: {**s, '_role': role, '_u': u, '_name': name}
    r = tag(read(f'Lesson {u}: {name}', 'Read it, then do its quick quiz. Stop at 30 minutes, even if you are not finished.', [u], link), 'read')
    if short:
        return [r, tag(practice(f'Build and test {u}: {build[0]}', f'{build[1]} {test[1]}' + mistakes, [u], link), 'build')]
    return [
        r,
        tag(practice(f'Build {u}: {build[0]}', build[1], [u], link), 'build'),
        tag(practice(f'Test {u}: {test[0]}', test[1] + mistakes, [u], link), 'test'),
    ]


def _pair(a, b):
    ra, rb = a['_role'], b['_role']
    if ra == 'read' and rb == 'build' and a['_u'] == b['_u']:
        title = a['title']
    elif ra == 'build' and rb == 'test' and a['_u'] == b['_u']:
        title = f'Build and test {a["_u"]}: {a["_name"]}'
    elif ra == 'test' and rb == 'read':
        title = f'Test {a["_u"]}, then lesson {b["_u"]}: {b["_name"]}'
    else:
        sys.exit(f'No way to name a day made of "{a["title"]}" and "{b["title"]}"')
    return two(a, b, title)


def days(items):
    """Pairs the half-hour lesson jobs, in order, into whole days. Whole days
    already in the list pass through."""
    out, half = [], None
    for s in items:
        if '_role' not in s:
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


def closer(n, fix):
    """One day: 20 questions, then fix the worst two."""
    name = SECTIONS[n]
    return [two(
        read(f'Practice questions: {name}', 'Answer 20 practice questions. Write down the number of each one you get wrong.', links=[drill(n)]),
        practice(f'Fix what you got wrong: {name}', fix),
        f'Practice questions: {name}',
    )]


def exercise(number, name, intro, steps, section):
    """One of the exam guide's four exercises, two steps a day. The Progress
    page has a tick for each step (E1.1 and so on). The last day ends with
    writing questions about the section just finished."""
    jobs = []
    for i, (title, task) in enumerate(steps, 1):
        task = (intro + ' ' if i == 1 else '') + task + f' Tick step {i} of exercise {number} on the Progress page.'
        jobs.append(practice(f'Exercise {number}, step {i} of {len(steps)}: {title}', task, [f'E{number}'], [EXERCISES]))
    own = read('Write four questions of your own', f'Write four exam-style questions about {SECTIONS[section]}. Give each one the right answer and three wrong answers that sound right.')
    return phase(f'Exercise {number} · {name}', [
        two(jobs[0], jobs[1], f'Exercise {number}, steps 1 and 2 of 5'),
        two(jobs[2], jobs[3], f'Exercise {number}, steps 3 and 4 of 5'),
        two(jobs[4], own, f'Exercise {number}, step 5 of 5, then write your own questions'),
    ])


def phase(week, sessions):
    return [{**s, 'week': week} for s in days(sessions)]


# "Start your practice project" was done on 10 November 2026.
SETUP = phase('Build what you have learned', [
    two(practice('Add three tools',
                 'Add three tools that read your JSON file: get_customer, lookup_order and process_refund. Run each one by hand and check what comes back.', ['2.1']),
        practice('Build 1.1: the agent loop',
                 'Write the loop: send a message, run the tool Claude asks for, add the result, and repeat. Stop only when stop_reason is end_turn.', ['1.1'], [lesson_link('1.1')]),
        'Add three tools, then build the agent loop'),
    two(practice('Test 1.1: the agent loop',
                 'Ask for a refund that needs two tools. Print stop_reason each time round the loop. Then read lesson 1.1\'s common-mistakes box again.', ['1.1'], [lesson_link('1.1')]),
        practice('Build 1.2 and 1.3: one main agent, two helpers',
                 'Make a main agent that starts two helper agents in one reply, using the Task tool. Put everything each helper needs into its prompt.', ['1.2', '1.3'], [lesson_link('1.2'), lesson_link('1.3')]),
        'Test the agent loop, then build two helpers'),
    two(practice('Test 1.2 and 1.3: what a helper knows',
                 'Leave one fact out of a helper\'s prompt and watch it fail. A helper knows only what you pass it. Put the fact back and run it again.', ['1.2', '1.3'], [lesson_link('1.2'), lesson_link('1.3')]),
        read('Make your flashcards',
             'Make a set of flashcards, on paper or in an app. Copy 15 facts from the quick reference page for Agents.', links=[quick('1')]),
        'Test your helpers, then make your flashcards'),
])

AGENTS = phase('Agents', [
    *lesson('1.4', 'forcing steps to happen, and handing over to a person',
            ('check who the customer is first', 'Stop process_refund from running until get_customer has checked who the customer is. Do it in code, not in the prompt.'),
            ('the block and the handover note', 'Ask for a refund without saying who you are, and check it is blocked. Then make the agent write a handover note for a person: customer, cause, amount, what to do next.')),
    *lesson('1.5', 'hooks',
            ('two hooks', 'Add a hook that runs after each tool and puts every date into one format. Add a second hook that stops any refund over $500 and passes it to a person.'),
            ('the $500 rule', 'Ask for a $600 refund and a $40 refund. Check the first is stopped and the second goes through. Feed in three date formats and check one comes out.')),
    *lesson('1.6', 'breaking a big job into smaller ones',
            ('a review in small passes', 'Make a code review that reads each file of your project in its own pass, then does one more pass across all the files together.'),
            ('small passes against one big pass', 'Run the same review as one big pass. Compare what each way found, and write down which one missed more.')),
    *lesson('1.7', 'picking up where you left off',
            ('a session you can come back to', 'Start a named Claude Code session on your project and ask it to map the code. Close it. Open it again with --resume and carry on.'),
            ('resume and fork', 'Change one file, resume the session and tell it which file changed. Then fork the session and try two different fixes side by side.')),
    *closer('1', 'Pick the two questions you got most wrong. Build or run each one in your practice project until you can see why the right answer is right.'),
])

CLAUDE_CODE = phase('Claude Code', [
    *lesson('3.1', 'where CLAUDE.md files go',
            ('three levels of CLAUDE.md', 'Give your practice project a CLAUDE.md. Add one at user level too. Move one long part into its own file and pull it in with @import.'),
            ('which files load', 'Run /memory and check which files loaded. Move a project rule to user level, and write why a new teammate would never get it.')),
    *lesson('3.2', 'your own commands and skills',
            ('a command and a skill', 'Make a /review command in .claude/commands/. Make a skill that has context: fork, allowed-tools and argument-hint at the top.'),
            ('what the skill can do', 'Run both. Check the skill cannot use a tool you left out. Check its long output stays out of your main chat.')),
    *lesson('3.3', 'rules for certain files only',
            ('two rules with paths', 'Add two files in .claude/rules/ with paths at the top. One covers test files wherever they sit. One covers a single folder.'),
            ('when a rule loads', 'Open a file that matches a rule, then one that does not. Each time, ask Claude which rules it has loaded.')),
    *lesson('3.4', 'plan first, or just do it',
            ('a change planned first', 'Ask Claude for a change that touches many files. Use plan mode, agree the plan, then let it do the work.'),
            ('a fix done directly', 'Give Claude a one-line bug with its error message and let it fix it directly. Write one line on when each way is the right one.')),
    *lesson('3.5', 'improving the result over several rounds',
            ('tests first', 'Pick a small function. Write its tests first, with odd cases such as empty values. Then ask Claude to make them pass.'),
            ('vague words against examples', 'Ask for a feature in vague words. Ask again with three examples of what goes in and what comes out. Compare the two results.')),
    *lesson('3.6', 'Claude Code in automatic checks',
            ('Claude Code run by a script', 'Run Claude Code from a script with -p and --output-format json. Add --json-schema so the findings come out in a fixed shape.'),
            ('a review that runs itself', 'Put your script in a GitHub Action that reviews a pull request, or run it twice by hand. On the second run, check it reports only new problems.')),
    *closer('3', 'Copy every file location and setting name you got wrong onto a flashcard. Then make each one for real in your practice project.'),
])

PROMPTS = phase('Prompts and output', [
    *lesson('4.1', 'clear instructions that avoid false alarms',
            ('a review prompt with clear rules', 'Write a code review prompt. Say what to report (bugs, security) and what to skip (style). Give one code example for each level of seriousness.'),
            ('count the false alarms', 'Run your prompt on three files and count the false alarms. Rewrite the vaguest rule and run it again.')),
    *lesson('4.2', 'teaching with examples',
            ('three examples in your prompt', 'Add three examples to your review prompt. Each one shows a tricky case, the right answer and why. Show the exact output format.'),
            ('the same files again', 'Run it on the same three files as last time. Check the format is the same every time and that there are fewer false alarms.')),
    *lesson('4.3', 'getting answers in a fixed format',
            ('a tool that pulls facts from a letter', 'Add a tool that pulls set facts out of a refund letter, described as a JSON schema. Let any fact be left empty. Add "unclear" and "other" to each list of choices.'),
            ('letters with facts missing', 'Feed it letters with facts missing. Check it leaves them empty and makes nothing up. Then force the tool with tool_choice.')),
    *lesson('4.4', 'checking answers and trying again',
            ('check, then try again', 'Add a check on each answer. If the check fails, send back the letter, the failed answer and the exact error, and try again.'),
            ('what a retry can fix', 'Cause one mistake a retry can fix (a wrong format) and one it cannot (the fact is not in the letter). Watch what happens to each.')),
    *lesson('4.5', 'sending lots of work at once',
            ('ten letters in one batch', 'Send ten letters through the Message Batches API. Give each one a custom_id. Results can take hours, so collect them tomorrow.'),
            ('send only the failures again', 'Collect yesterday\'s results. Make two letters fail on purpose and send only those again, by custom_id. Write when you would not use a batch.')),
    *lesson('4.6', 'getting a second, independent check',
            ('a second Claude as reviewer', 'Have one Claude write a small function. Have a second, fresh Claude review it, without seeing how the first one got there.'),
            ('fresh eyes against the same eyes', 'Ask the first Claude to review its own work in the same chat. Compare what each review found.')),
    *closer('4', 'Pick the two questions you got most wrong. Change your review prompt or your fact-finding tool to try each one out.'),
])

TOOLS = phase('Tools and MCP', [
    *lesson('2.1', 'describing tools clearly',
            ('two tools that look alike', 'Add a second tool that looks a lot like lookup_order. Write both descriptions so it is clear what each is for, what goes in and when to use it.'),
            ('which tool Claude picks', 'Ask ten questions and note which tool Claude picks each time. Make one description vague and watch the picks go wrong.')),
    *lesson('2.2', 'helpful error messages from tools',
            ('errors that say what went wrong', 'Make every tool report an error with three things: errorCategory, isRetryable and a plain message.'),
            ('four kinds of error', 'Cause four errors: a timeout, a bad input, no permission and a broken shop rule. Check the agent retries only the timeout. Check "found nothing" is not an error.')),
    *lesson('2.3', 'which agent gets which tools',
            ('fewer tools for each helper', 'Give each helper agent only the tools its job needs. Swap one do-anything tool for a narrow one.'),
            ('forcing a tool', 'Use tool_choice to force one tool to run first. Then set it to "any". Write down what Claude does each time.')),
    *lesson('2.4', 'connecting MCP servers',
            ('your tools as an MCP server', 'Put your tools in an MCP server. List it in the project\'s .mcp.json, with its token written as ${SOME_TOKEN}.'),
            ('two places for servers', 'Add a personal server in ~/.claude.json. Check Claude Code sees both. Then offer your list of orders as an MCP resource.')),
    *lesson('2.5', 'Claude Code\'s built-in tools',
            ('find things with Grep and Glob', 'In Claude Code, find every place process_refund is called, using Grep. Find every test file, using Glob.'),
            ('when Edit cannot find the place', 'Ask for an edit where the same text appears twice, so Edit cannot find one place. Watch Claude use Read, then Write.'), short=True),
    *closer('2', 'Pick the two questions you got most wrong. Change a tool, its description or its error in your practice project to try each one out.'),
])

CONTEXT = phase('Context and reliability', [
    *lesson('5.1', 'keeping track in long conversations',
            ('a block of case facts', 'Keep a short block of case facts (customer, order, amount, dates) and put it in every prompt. Cut tool results down to the fields that matter.'),
            ('a long chat about two orders', 'Have a long chat about two orders. Check the agent still has both amounts right at the end. Take the block out and try again.')),
    *lesson('5.2', 'when to pass to a person, and unclear requests',
            ('rules for passing to a person', 'Write rules in the system prompt for when to pass a customer to a person. Add three examples.'),
            ('four hard messages', 'Try four messages: "get me a human", an angry customer, a request the rules do not cover, and a name that matches two customers.')),
    *lesson('5.3', 'passing errors between agents',
            ('a helper that fails well', 'Make one helper agent time out on purpose. Make it report what failed, what it tried and what it did manage to find.'),
            ('the main agent carries on', 'Check the main agent still finishes and says which part is missing. Check "found nothing" is reported differently from "could not look".')),
    *lesson('5.4', 'finding your way around a big codebase',
            ('explore with a notes file', 'Explore a big codebase with Claude Code. Have it keep a notes file of what it finds, and use helper agents for single questions.'),
            ('carry on from the notes', 'Use /compact part of the way through. Then start a new session from the notes file alone and check it can carry on.')),
    *lesson('5.5', 'when a person should check the work',
            ('a score for each fact', 'Make your fact-finding tool give a confidence score for each fact. Send the low scores to a list for a person to check.'),
            ('check the confident answers too', 'Run 20 letters. Check a random few of the confident answers by hand, for each type of letter. Write down where it was wrong.')),
    *lesson('5.6', 'where facts came from',
            ('every claim with its source', 'Make each helper agent return every claim with its source, a quote and a date. Make the final report keep them.'),
            ('two sources that disagree', 'Give it two sources that disagree on a number. Check the report shows both numbers with their sources, and does not pick one.')),
    *closer('5', 'Pick the two questions you got most wrong. Build or run each one in your practice project until you can see why the right answer is right.'),
])


def situation(number, about=''):
    return read(f'Exam situation {number}', f'In the exam guide, read situation {number}{about}. Write five questions it could lead to, then answer them.')


RULES = read('Write your nine answer rules', 'By hand, on one page, write the nine rules from your plan that help you pick the right answer. Use your own words.')


def second_look(n, rebuild, then, then_title):
    """Two days: mistakes and a build from memory, then questions and one more job."""
    name = SECTIONS[n]
    return phase(f'Second look · {name}', [
        two(read(f'Common mistakes: {name}', 'Read every common-mistakes box in this section. Turn anything you had forgotten into a flashcard.', links=[quick(n)]),
            practice(f'Build from memory: {name}', rebuild),
            f'Second look: {name}'),
        two(read(f'Practice questions: {name} again', 'Answer 20 practice questions. Write one sentence on each one you get wrong: why is the right answer right?', links=[drill(n)]),
            then,
            f'Questions again: {name}, then {then_title}'),
    ])


REVISION = [
    *second_look('1', 'With an empty file and no notes, write the agent loop and the block on refunds over $500. Then compare them with your practice project.',
                 situation(1, ', about a customer support agent'), 'exam situation 1'),
    *second_look('3', 'In an empty folder and with no notes, make a CLAUDE.md, a rule with paths, a command and a skill. Check each one loads.',
                 situation(2), 'exam situation 2'),
    *phase('Second look · Claude Code', [
        two(situation(3, ', about several agents doing research together'), situation(5), 'Exam situations 3 and 5'),
    ]),
    *second_look('4', 'With no notes, write a fact-finding tool that allows empty facts, "unclear" and "other". Add the step that checks the answer and tries again.',
                 situation(6, ', about pulling facts out of documents'), 'exam situation 6'),
    *second_look('2', 'With no notes, write three tool descriptions and one error with errorCategory and isRetryable. Check Claude picks the right tool.',
                 situation(4), 'exam situation 4'),
    *second_look('5', 'With no notes, make a helper agent fail and report it properly. Then make a report show both of two numbers that disagree.',
                 RULES, 'your nine answer rules'),
]


def weakest():
    again = 'Read its common-mistakes box, then build it again in your practice project from an empty file.'
    return two(practice('Your weakest topic', again), practice('Your second-weakest topic', again), 'Your two weakest topics')


def mock(number):
    return phase(f'Practice exam {number}', [
        hour(read(f'Practice exam {number}, questions 1 to 30', 'Questions 1 to 30 of the practice exam. One hour, no notes. Note where you stopped and carry on tomorrow.', links=[MOCK])),
        hour(read(f'Practice exam {number}, questions 31 to 60', 'Questions 31 to 60 of the practice exam. One hour, no notes.', links=[MOCK])),
        two(read(f'Mark practice exam {number}', 'Write each section\'s score in Notes. List the three topics you did worst on by number, such as 2.3, 5.1 and 1.6.'),
            read('Learn from your wrong answers', f'For every question you got wrong in practice exam {number}, write one sentence on why the right answer is right.'),
            f'Mark practice exam {number}'),
        weakest(),
    ])


EXAMS = [
    *mock(1),
    *mock(2),
    *phase('Last days before the exam', [
        two(read('The six exam situations', 'Read all six situations in the exam guide again. For each, say out loud the three questions you would expect.'),
            read('The sample questions', 'Answer the 12 sample questions in the exam guide without looking. Then read the guide\'s list of what is not in the exam.'),
            'The exam guide: situations and sample questions'),
        two(read('Common mistakes: every section', 'Read the common-mistakes boxes you marked as hard. Skip the ones you know.'),
            read('Last study day', 'Say your nine answer rules out loud. Go through all your flashcards once. Then stop. Nothing new today.'),
            'Last study day'),
    ]),
]

EMPTY = 'Start in a new, empty folder and do not look at your practice project.'

EXERCISE_2 = exercise(2, 'Claude Code for a team', EMPTY, [
    ('a CLAUDE.md for a team', 'Write a project CLAUDE.md with rules for how code is written and how it is tested.'),
    ('rules for some files only', 'Add two files in .claude/rules/ with paths at the top. Check each one loads only for files that match.'),
    ('a skill that runs apart', 'Make a project skill with context: fork and allowed-tools. Check it runs apart from your main chat.'),
    ('two MCP servers', 'Set up a project MCP server with its token in an environment variable, and a personal one in ~/.claude.json. Check both work.'),
    ('plan mode or not', 'Try plan mode and doing it directly on three jobs: a one-file fix, a change across many files, and a feature with several ways to build it.'),
], '3')

EXERCISE_3 = exercise(3, 'Facts from documents', EMPTY, [
    ('the fact-finding tool', 'Make a tool with facts that must be there, facts that may be empty, and a list with "other" plus a note. Check missing facts come back empty.'),
    ('check and try again', 'Add the step that checks each answer and tries again. Write down which errors a retry can fix and which it cannot.'),
    ('examples for odd documents', 'Add examples for documents laid out in different ways. Check the answers get better.'),
    ('a batch of 100', 'Send 100 documents as one batch. Tomorrow, send only the failures again by custom_id. Compare the time it took with a deadline you set.'),
    ('unsure answers go to a person', 'Send facts with low confidence to a person to check. Work out how often the tool is right, for each type of document and each fact.'),
], '4')

EXERCISE_1 = exercise(1, 'The support agent', EMPTY, [
    ('the tools', 'Make three or four tools with clear descriptions. Two of them should be alike, so the wording has to tell them apart.'),
    ('the loop', 'Write the agent loop. Carry on when stop_reason is tool_use and stop when it is end_turn.'),
    ('clear errors', 'Make the tools report errors in a clear shape. Check the agent retries a timeout and explains a broken shop rule to the customer.'),
    ('the hook', 'Add a hook that blocks any refund over a set amount and passes it to a person.'),
    ('several requests in one message', 'Send messages that ask for several things at once. Check the agent splits them up, deals with each and gives one answer.'),
], '2')

EXERCISE_4 = exercise(4, 'Agents doing research', EMPTY, [
    ('the main agent', 'Make a main agent that is allowed the Task tool and passes what it has found to each helper in the helper\'s prompt.'),
    ('helpers at the same time', 'Start the helpers at the same time from one reply. Time it against running them one after another.'),
    ('every finding with its source', 'Give each finding a claim, a quote, a source and a date. Check the final report keeps them.'),
    ('a helper that times out', 'Make one helper time out. Check the main agent carries on with what it has and says what is missing.'),
    ('numbers that disagree', 'Give it two sources with different numbers. Check the report keeps both, each with its source.'),
], '5')

PLAN = (SETUP + AGENTS + CLAUDE_CODE + EXERCISE_2 + PROMPTS + EXERCISE_3 + TOOLS + EXERCISE_1
        + CONTEXT + EXERCISE_4 + REVISION + EXAMS)

def off(day, week, title, task, kind='Off', minutes=0):
    return {'day': day.isoformat(), 'kind': kind, 'minutes': minutes, 'week': week, 'title': title, 'task': task, 'units': [], 'links': []}


def holiday(day):
    for a, b, name in HOLIDAYS:
        if a <= day <= b:
            return name
    return None


def fill(first, last, sessions, spare_week):
    """One session on each study day from first to last. Returns the days and
    the sessions that did not fit."""
    out, queue, week = [], list(sessions), spare_week
    d = first
    while d <= last:
        name = holiday(d)
        if name == 'Christmas' and d in CHRISTMAS_OPTIONAL:
            out.append(off(d, 'Christmas · Time off', 'Flashcards, if you like', '10 minutes, so you do not forget them. Skip it if the house is busy.', 'Optional', 10))
        elif name == 'Christmas':
            out.append(off(d, 'Christmas · Time off', 'Christmas', 'Time off. No studying.'))
        elif name:
            out.append(off(d, 'Holiday', 'Holiday', 'Time off. No studying.'))
        elif d in LIBRARY:
            out.append(off(d, week, *LIBRARY[d], 'Optional', 300))
        elif d == BOOK[0]:
            out.append(off(d, week, BOOK[1], BOOK[2], 'Optional', 15))
        elif d.weekday() == SPARE_WEEKDAY:
            out.append(off(d, week, 'Spare day', 'Nothing planned. Catch up on a missed day, or rest.'))
        elif queue:
            s = queue.pop(0)
            week = s['week']
            out.append({'day': d.isoformat(), 'kind': s['kind'], 'minutes': DAY, 'week': week, 'title': s['title'],
                        'task': s['task'], 'units': s['units'], 'links': s['links'], 'parts': s['parts']})
        else:
            out.append(off(d, week, 'Spare day', 'Nothing planned. Catch up on a missed day, or rest.'))
        d += timedelta(days=1)
    return out, queue


def number_weeks(part):
    """Names each study week "Week 3 of 15 · Agents", so the plan reads as a
    course with an end. Weeks run Monday to Sunday; holiday weeks have no number."""
    monday = lambda s: D(s['day']) - timedelta(days=D(s['day']).weekday())
    weeks = sorted({monday(s) for s in part if s['minutes'] == DAY})
    for s in part:
        if s['week'] in ('Holiday', 'Christmas · Time off') or monday(s) not in weeks:
            continue
        s['week'] = f'Week {weeks.index(monday(s)) + 1} of {len(weeks)} · {s["week"]}'
    return part


def main():
    last_study = EXAM - timedelta(days=2)
    first, left = fill(START, last_study, PLAN, PLAN[0]['week'])
    if left:
        sys.exit(f'{len(left)} sessions do not fit before the exam, starting with "{left[0]["title"]}"')
    days_ = number_weeks(first)
    days_.append(off(EXAM - timedelta(days=1), 'Last days before the exam', 'Rest', 'No studying. Get your ID ready and go to bed early.'))
    days_.append(off(EXAM, 'Exam day', 'Exam day', 'Nothing new today. Have breakfast, read your page of answer rules once, then put it away.', 'Exam'))

    for a, b in zip(days_, days_[1:]):
        if D(b['day']) - D(a['day']) != timedelta(days=1):
            sys.exit(f'Gap in the plan between {a["day"]} and {b["day"]}')
    too_long = [s['day'] for s in days_ if s['minutes'] > DAY and s['kind'] != 'Optional']
    if too_long:
        sys.exit(f'Days over {DAY} minutes: {too_long}')
    OUT.write_text(json.dumps(days_, indent=1, ensure_ascii=False) + '\n')

    work = [s for s in first if s['minutes'] == DAY]
    spare = [s for s in first if s['title'] == 'Spare day']
    hands_on = [s for s in work if s['kind'] == 'Practice']
    print(f'{START} to {last_study}: {len(work)} study days ({len(work)} hours), {len(hands_on)} with hands-on work, {len(spare)} spare days')
    print(f'{len(days_)} days, {days_[0]["day"]} to {days_[-1]["day"]}. Wrote {OUT}')


if __name__ == '__main__':
    main()
