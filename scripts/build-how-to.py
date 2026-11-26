#!/usr/bin/env python3
"""Writes src/content/how-to.json: step-by-step help for days with no study
guide link.

  python3 scripts/build-how-to.py

Jason, 11 November 2026: "'build some tools by hand' isn't enough
instruction", and asked for "some kind of pop out instruction section that
explains what I need to do in dumbo language, for any task like this which
doesn't have a link to the study guide ... it should be step by step and
clear". See design-journal/decisions/019.

Help is keyed by the title of each half-hour job, so it survives the plan
being rebuilt as long as titles stay the same. Since 26 November 2026 most
days hold two jobs (decision 020). schedule.json lists them in the day's
"parts", and this script joins their help into one entry under the day's
title. Run build-plan.py first. Each entry has:
  about  one or two sentences: what the day is for
  steps  numbered steps, one action each
  code   optional text to copy, shown in a box
  done   how to tell you have finished
  links  optional pages to open
The site checks at build time that every day with no link has an entry.
Uses the standard library only.
"""

import json
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / 'src' / 'content' / 'how-to.json'
SITE = 'https://claudecertificationguide.com'
FOLDER = '~/projects/refund-helper'
GUIDE = 'the exam guide (cca.pdf on your Desktop)'

SECTIONS = {
    'Agents': '1', 'Tools and MCP': '2', 'Claude Code': '3',
    'Prompts and output': '4', 'Context and reliability': '5',
}

H = {}

H['Start your practice project'] = {
    'about': 'Your practice project is a pretend shop helper that sorts out refunds. Nothing in it is real. You will add to it almost every day, so today you only make the folder and two files.',
    'steps': [
        'Open Terminal.',
        f'Type `mkdir {FOLDER}` and press Return. This makes the folder.',
        f'Type `cd {FOLDER}` and press Return. You are now inside the folder.',
        'Open the folder in your code editor.',
        'Make a new file called data.json. Copy the text in the box below into it and save. Change the names if you like.',
        'Make a new file called CLAUDE.md. Write three lines: what this project is, that data.json is the pretend shop database, and "Never refund more than $500."',
        'Save both files. That is all for today.',
    ],
    'code': json.dumps({
        'customers': [
            {'id': 'C1', 'name': 'Ann Lee', 'email': 'ann@example.com'},
            {'id': 'C2', 'name': 'Ben Shaw', 'email': 'ben@example.com'},
            {'id': 'C3', 'name': 'Cara Diaz', 'email': 'cara@example.com'},
            {'id': 'C4', 'name': 'Dev Patel', 'email': 'dev@example.com'},
            {'id': 'C5', 'name': 'Eve Moss', 'email': 'eve@example.com'},
        ],
        'orders': [
            {'id': 'A100', 'customer_id': 'C1', 'item': 'Kettle', 'total': 40, 'status': 'delivered'},
            {'id': 'A101', 'customer_id': 'C2', 'item': 'Desk', 'total': 650, 'status': 'delivered'},
            {'id': 'A102', 'customer_id': 'C3', 'item': 'Lamp', 'total': 25, 'status': 'shipped'},
            {'id': 'A103', 'customer_id': 'C4', 'item': 'Chair', 'total': 120, 'status': 'delivered'},
            {'id': 'A104', 'customer_id': 'C5', 'item': 'Rug', 'total': 90, 'status': 'refunded'},
        ],
    }, indent=2),
    'done': f'The folder {FOLDER} has data.json and CLAUDE.md in it.',
}

H['Add three tools'] = {
    'about': 'A tool is an ordinary function in your own code that Claude is allowed to ask for. Claude never opens your file. It asks, your code runs the function, and your code sends back the answer. Today you write three tools and try them yourself. Claude is not involved yet.',
    'steps': [
        f'In Terminal, type `cd {FOLDER}` and press Return.',
        'Make a new file called tools.py next to data.json.',
        'Copy the code in the box below into tools.py and save.',
        'Read each tool. get_customer finds a customer by email. lookup_order finds an order by its number. process_refund checks the refund is allowed. Nothing is really paid.',
        'In Terminal, type `python3 tools.py` and press Return.',
        'Read the four lines it prints. Two should be details. Two should be clear error messages.',
        'Add one more line at the bottom that tries a refund of 20 on order A100. Run it again.',
        'In Notes, write one sentence each on what the three tools do.',
    ],
    'code': '''import json

data = json.load(open("data.json"))

def get_customer(email):
    for c in data["customers"]:
        if c["email"] == email:
            return c
    return {"error": f"No customer with email {email}"}

def lookup_order(order_id):
    for o in data["orders"]:
        if o["id"] == order_id:
            return o
    return {"error": f"No order with ID {order_id}"}

def process_refund(order_id, amount):
    order = lookup_order(order_id)
    if "error" in order:
        return order
    if amount > order["total"]:
        return {"error": f"{amount} is more than the order total of {order['total']}"}
    return {"refunded": amount, "order_id": order_id}

# Try each tool with a right and a wrong input
print(get_customer("ann@example.com"))
print(get_customer("nobody@example.com"))
print(lookup_order("A100"))
print(process_refund("A100", 9999))''',
    'done': 'Each tool gives the right details for a real customer or order, and a clear error for a wrong one. Clear errors matter: Claude decides what to do next from what a tool sends back.',
}

H['Welcome back'] = {
    'about': 'You have had a break. Today is a gentle way back in, with nothing new to learn.',
    'steps': [
        'Get your flashcards.',
        'Go through every card. Say the answer before you turn it over.',
        'Put any card you got wrong in a separate pile.',
        'Go through that pile once more.',
        'Open the Notes tab on this site.',
        'Read what you wrote over the last few weeks. Do not change anything.',
        'Stop at 30 minutes, even if you have not finished.',
    ],
    'done': 'You have been through every card once and read your recent notes.',
}

H['Flashcards, if you like'] = {
    'about': 'An optional 10 minutes over Christmas, so the facts do not fade. Skipping it is fine.',
    'steps': [
        'Set a timer for 10 minutes.',
        'Go through as many flashcards as you can. Say each answer before you turn the card.',
        'Stop when the timer goes.',
    ],
    'done': 'The 10 minutes are up.',
}


def fix_wrong(name, how):
    n = SECTIONS[name]
    return {
        'about': f'You have just answered practice questions on {name}. Now you take the two that confused you most and make them happen in your practice project, so you can see why the right answer is right.',
        'steps': [
            f'Look at your list of wrong answers on {name}.',
            'Pick the two wrong answers that confused you most.',
            'For the first one, write the question in one line in Notes.',
            'Read the right answer and its reason on the site.',
            how,
            'Write one sentence in Notes: why the right answer is right.',
            'Do the same for the second question.',
        ],
        'links': [{'label': f'Practice questions: {name}', 'href': f'{SITE}/drill?domain={n}'}],
        'done': 'Notes has two questions, each with one sentence on why the right answer wins.',
    }


H['Fix what you got wrong: Agents'] = fix_wrong('Agents', f'Open your practice project ({FOLDER}). Change the agent so the question\'s situation happens, run it, and watch what it does.')
H['Fix what you got wrong: Prompts and output'] = fix_wrong('Prompts and output', 'Change your review prompt or your fact-finding tool to match the question. Run it with each answer\'s idea and compare what comes back.')
H['Fix what you got wrong: Tools and MCP'] = fix_wrong('Tools and MCP', 'Change one tool, its description or its error message to match the question. Run it and see whether Claude now picks or handles the tool differently.')
H['Fix what you got wrong: Context and reliability'] = fix_wrong('Context and reliability', f'Open your practice project ({FOLDER}). Make the question\'s situation happen, such as a tool failing or a long chat, and watch what the agent does.')
H['Fix what you got wrong: Claude Code'] = {
    'about': 'Most Claude Code questions are about where a file goes or what a setting is called. Making each one for real is the quickest way to remember it.',
    'steps': [
        'Open the practice questions for Claude Code. Answer 10 of them.',
        'For every wrong answer that names a file location or a setting, write it on a new flashcard.',
        f'Open your practice project ({FOLDER}).',
        'Make each file or setting from your new cards for real, in the right place.',
        'Type `claude` in Terminal inside the folder. Check each one works, for example by typing `/` to see your commands.',
    ],
    'links': [{'label': 'Practice questions: Claude Code', 'href': f'{SITE}/drill?domain=3'}],
    'done': 'Every new flashcard has a real file or setting in your practice project to match.',
}

H['Write four questions of your own'] = {
    'about': 'Writing your own exam questions is the most useful thing you can do on a weeknight. Thinking up wrong answers that sound right makes you say why the right one wins.',
    'steps': [
        'Open the Notes tab and start a new note.',
        'Pick four topics from this section. The Course tab lists them.',
        'For each topic, write a short situation in two sentences, about a made-up company.',
        'Write the question underneath.',
        'Write the right answer, then three wrong answers that sound right.',
        'Under each wrong answer, write a few words on why it is wrong.',
        'Use the template in the box below to keep to the same shape.',
    ],
    'code': '''Situation: (two sentences about a made-up company)
Question:
A. (right answer)
B. (sounds right) Wrong because:
C. (sounds right) Wrong because:
D. (sounds right) Wrong because:''',
    'done': 'Notes has four questions, each with one right answer and three wrong ones with reasons.',
}

H['Write your nine answer rules'] = {
    'about': 'Many exam questions are decided by the same nine rules of judgement. Writing them by hand, in your own words, helps them stick. You will read this page again on your last study day and on exam morning.',
    'steps': [
        'Get one sheet of paper and a pen.',
        'Open study-plan.md on your Desktop. Go to section 2, "The answer patterns".',
        'Read rule 1. Then look away and write it in your own words, in one line.',
        'Do the same for rules 2 to 9.',
        'Check each line against the plan. Fix any that say something different.',
        'Keep the page somewhere you will see it.',
    ],
    'code': '''The nine rules, in short:
1. Fix the cause the evidence points at.
2. Pick the smallest fix that works first.
3. If a rule must never break, enforce it in code.
4. Never route on the model's confidence or the customer's mood.
5. Structured errors and findings beat vague ones.
6. Never hide a failure, and never throw everything away for one.
7. Give each agent only the tools it needs.
8. Split big jobs into smaller passes.
9. Clear criteria with examples beat vague instructions.''',
    'done': 'You have one handwritten page with nine lines on it.',
}

H['Book your exam'] = {
    'about': 'Booking the exam now makes the date real. Most problems on exam day come from the name on the booking not matching your ID.',
    'steps': [
        'Find the booking link in the exam guide or on Anthropic\'s certification page.',
        'Choose Saturday 24 April 2027. If that day is not offered, take the nearest day before it.',
        'Type your name exactly as it appears on your passport or driving licence.',
        'Finish the booking and wait for the email.',
        'Check the name in the email matches your ID, letter for letter.',
        'Put the date and time in your calendar.',
            ],
    'done': 'You have a booking email with your name spelt exactly as on your ID.',
}


def library(what, step_name):
    return {
        'about': f'An optional whole day somewhere quiet, such as the British Library. You finish {what} properly, then do it again from memory. Move the day to any nearby date that suits you.',
        'steps': [
            'Pack your laptop, charger, headphones and a lunch.',
            f'Open the hands-on exercises page and find {step_name}.',
            'Morning: finish any step you did not finish in its half hour. Tick it on the Progress page.',
            'Have lunch away from the screen.',
            'Afternoon: make a new empty folder, such as ~/projects/from-memory.',
            'Do the whole exercise again in that folder, without looking at your notes or the first version.',
            'Compare the two versions. Write three sentences in Notes about what you forgot.',
        ],
        'links': [{'label': 'Hands-on exercises', 'href': f'{SITE}/exercises'}],
        'done': 'The exercise is finished, and done a second time from memory.',
    }


H['Library day 1, if you can: exercise 2 again'] = library('exercise 2', 'exercise 2, Claude Code for a team')
H['Library day 2, if you can: exercise 3 again'] = library('exercise 3', 'exercise 3, facts from documents')
H['Library day 3, if you can: exercises 1 and 4 again'] = library('exercises 1 and 4', 'exercise 1, the support agent, and exercise 4, agents doing research')
H['Library day 4, if you can: a full practice exam'] = {
    'about': 'An optional whole day somewhere quiet, run like the real exam. If you can only manage one library day, make it this one. Move it to any nearby date that suits you.',
    'steps': [
        'Pack your laptop, charger, headphones and a lunch.',
        'Put your notes and phone away.',
        'Open the practice exam. Set a timer for 2 hours.',
        'Answer all 60 questions. Do not look anything up.',
        'Have lunch away from the screen.',
        'Mark it. Write each section\'s score in Notes.',
        'Pick your two weakest topics. Build each one again from an empty file in a new folder.',
    ],
    'links': [{'label': 'Practice exam', 'href': f'{SITE}/mock-exam'}],
    'done': 'You have a score for each section and have rebuilt your two weakest topics.',
}


def from_memory(folder, make, check):
    return {
        'about': 'Today you build something again with no help, to find out what you really remember. Getting stuck is useful: it shows you what to revise.',
        'steps': [
            'Close your notes, the study site and your practice project.',
            f'In Terminal, type `mkdir ~/projects/{folder}` and press Return. Then type `cd ~/projects/{folder}` and press Return.',
            *make,
            check,
            f'Now open your practice project ({FOLDER}) and compare.',
            'Write in Notes the parts you forgot or got wrong.',
        ],
        'done': 'It runs, and Notes lists what you forgot.',
    }


H['Build from memory: Agents'] = from_memory('memory-agents', [
    'Make a file called loop.py.',
    'Write the loop: send a message, and if stop_reason is tool_use, run the tool Claude asked for.',
    'Add the tool result to the messages and send again. Stop only when stop_reason is end_turn.',
    'Add a check in your code that refuses any refund over $500 before the tool runs.',
], 'Run it with `python3 loop.py` and ask for a $600 refund. Check the code blocks it.')
H['Build from memory: Claude Code'] = from_memory('memory-claude-code', [
    'Make a CLAUDE.md with two lines about the project.',
    'Make .claude/rules/tests.md with paths at the top, so it only applies to test files.',
    'Make .claude/commands/review.md, a command that asks Claude to review a file.',
    'Make .claude/skills/refunds/SKILL.md with a name and a description at the top.',
], 'Type `claude`. Type `/memory` to see CLAUDE.md is loaded, type `/` to see `/review`, and ask Claude which skills it has.')
H['Build from memory: Prompts and output'] = from_memory('memory-prompts', [
    'Make a file called extract.py.',
    'Write a fact-finding tool with a JSON schema. Let each fact be empty if the document does not say.',
    'Give one field the choices "unclear" and "other" as well as the real answers.',
    'Add a check after Claude answers. If it is wrong, send back the document, the answer and the error, and ask again.',
], 'Run it on a short made-up document with one fact missing. Check that fact comes back empty, not made up.')
H['Build from memory: Tools and MCP'] = from_memory('memory-tools', [
    'Make a file called tools.py.',
    'Write three tools, each with a description that says what it does, what it needs and when to use it.',
    'Make one tool return an error with errorCategory, isRetryable and a plain message.',
    'Ask Claude three questions, each needing a different tool. Print the name of the tool it picks.',
], 'Run it. Check Claude picks the right tool each time and handles the error.')
H['Build from memory: Context and reliability'] = from_memory('memory-context', [
    'Make a main agent and one helper agent.',
    'Make the helper fail on purpose, for example by having its tool stop with a timeout.',
    'Have the helper report the failure with what it tried and any partial results.',
    'Give the main agent two documents that disagree about one number.',
], 'Run it. Check the main agent finishes, says what is missing, and shows both numbers with where each came from.')

SITUATIONS = {1: 'about a customer support agent', 3: 'about several agents doing research together', 6: 'about pulling facts out of documents'}
for n in range(1, 7):
    H[f'Exam situation {n}'] = {
        'about': 'The exam builds its questions around six situations from the exam guide. Writing your own questions for one shows you what the examiner is likely to ask.',
        'steps': [
            f'Open {GUIDE}.',
            f'Find situation {n}{" " + SITUATIONS[n] if n in SITUATIONS else ""}. Read it twice.',
            'Open the Notes tab and start a new note.',
            'Write five questions the situation could lead to. Give each one four answers.',
            'Close the guide. Answer your five questions.',
            'Open the guide again and check your answers.',
        ],
        'done': 'Notes has five questions on this situation, answered and checked.',
    }

H['Explain it out loud'] = {
    'about': 'If you can explain something out loud with no notes, you understand it. Saying it shows the gaps quickly.',
    'steps': [
        'Open the voice recorder on your phone and press record.',
        'Set a 3-minute timer. Explain how one main agent runs several helpers.',
        'Say who gives out the work, what each helper knows, how results come back, and what happens if one fails.',
        'Set another 3-minute timer. Explain hooks: what they are and when they run.',
        'Play the recording back.',
        'Open Notes and check what you said. Write down anything you missed or got wrong.',
    ],
    'done': 'You have explained both out loud and written down what you missed.',
}


def mark_exam(n):
    return {
        'about': f'Marking practice exam {n} shows which topics need work. The next days in the plan use the three topics you write down today.',
        'steps': [
            'Open the practice exam and go to your results.',
            'In Notes, write each section\'s score, such as "Agents 12 of 16".',
            'Find the three topics with the most wrong answers.',
            'Write them by lesson number, such as 2.3, 5.1 and 1.6.',
            'Put the worst one first.',
        ],
        'links': [{'label': 'Practice exam', 'href': f'{SITE}/mock-exam'}],
        'done': 'Notes has five section scores and your three weakest topics by number.',
    }


H['Mark practice exam 1'] = mark_exam(1)
H['Mark practice exam 2'] = mark_exam(2)


def weak(which):
    return {
        'about': f'Today you rebuild your {which} topic from nothing, so it sticks before the exam.',
        'steps': [
            'Open Notes and find the three topics you wrote down when you marked your last practice exam.',
            f'Take the {which} one. Open that lesson on the study site.',
            'Read its common-mistakes box (Exam Traps).',
            'Close the lesson. Make an empty file in your practice project.',
            'Build the thing the lesson is about again, without looking.',
            'Compare it with the lesson. Write in Notes what you got wrong.',
        ],
        'links': [{'label': 'Open the study site', 'href': SITE}],
        'done': 'You have rebuilt the topic and noted what you got wrong.',
    }


H['The exam guide: how the exam works'] = {
    'about': 'Before you study anything, see what the exam is. Knowing how it is marked tells you where to spend your time.',
    'steps': [
        f'Open {GUIDE}.',
        'Read the first pages: how many questions, how long, and the pass mark.',
        'Find the five sections and the share of the marks each one has.',
        'In Notes, write the five sections with their shares, biggest first.',
        'Read the six situations. In the exam you get four of them.',
        'Read the list of what is not in the exam.',
    ],
    'done': 'Notes has the five sections with their shares of the marks.',
}

H['Your shakiest topic'] = {
    'about': 'Each sprint ends its practice by going back to the one thing you are least sure of. Building it again from nothing is what makes it stick.',
    'steps': [
        'Think back over this sprint and the ones before it. Pick the one topic you are least sure of.',
        'Open that lesson on the study site.',
        'Read its common-mistakes box (Exam Traps).',
        'Close the lesson. Make an empty file in your practice project.',
        'Build the thing the lesson is about again, without looking.',
        'Compare it with the lesson. Write in Notes what you got wrong.',
    ],
    'links': [{'label': 'Open the study site', 'href': SITE}],
    'done': 'You have rebuilt the topic and noted what you got wrong.',
}

H['Sprint review'] = {
    'about': 'The last job of a sprint. You look back for a few minutes, so the next sprint starts from what you really know.',
    'steps': [
        'Open Notes and start a new note called "Sprint review".',
        'Write one line: what you learnt in this sprint.',
        'Write one line: what you got wrong.',
        'Write one line: what you need to look at again.',
        'Get your flashcards. Go through every card and say the answer before you turn it over.',
        'Go through the cards you got wrong once more.',
    ],
    'done': 'Notes has three lines for this sprint, and you have been through every card.',
}

H['Your weakest topic'] = weak('weakest')
H['Your second-weakest topic'] = weak('second-weakest')

H['Learn from your wrong answers'] = {
    'about': 'Understanding why you got a question wrong is worth more than doing new questions.',
    'steps': [
        'Open practice exam 2\'s results.',
        'Go to the first question you got wrong.',
        'Read the right answer and its reason.',
        'In Notes, write one sentence: why the right answer is right.',
        'Do the same for every other question you got wrong.',
    ],
    'links': [{'label': 'Practice exam', 'href': f'{SITE}/mock-exam'}],
    'done': 'Every wrong answer has one sentence in Notes.',
}

H['The six exam situations'] = {
    'about': 'A last look at the six situations the exam is built around.',
    'steps': [
        f'Open {GUIDE} and find the six situations.',
        'Read situation 1.',
        'Look away and say out loud three questions you would expect about it.',
        'Do the same for situations 2 to 6.',
    ],
    'done': 'You have said three questions out loud for each of the six.',
}

H['Common mistakes: every section'] = {
    'about': 'A last pass over the traps the examiner likes to set. Only read the ones you find hard.',
    'steps': [
        'Open the study site.',
        'Go through the lessons one at a time.',
        'Read the common-mistakes box (Exam Traps) only where you marked it as hard, or where you are unsure.',
        'Skip any you already know.',
        'Stop at 30 minutes.',
    ],
    'links': [{'label': 'Open the study site', 'href': SITE}],
    'done': 'You have read every common-mistakes box you find hard.',
}

H['The sample questions'] = {
    'about': 'The exam guide has 12 sample questions written by the examiner. They are the closest thing to the real exam.',
    'steps': [
        f'Open {GUIDE} and find the sample questions.',
        'Cover the answers with a sheet of paper.',
        'Answer all 12 on the paper.',
        'Check your answers. Read the reason for any you got wrong.',
        'Then read the guide\'s list of what is not in the exam.',
    ],
    'done': 'You have answered all 12 and read what is not in the exam.',
}

H['Last study day'] = {
    'about': 'Two days before the exam. Today is a light review. Nothing new.',
    'steps': [
        'Read your page of nine answer rules. Then say them out loud without looking.',
        'Go through all your flashcards once.',
        'Stop. Do not start anything new.',
    ],
    'done': 'You have said the nine rules and been through the cards. Then rest.',
}

H['Exam day'] = {
    'about': 'Nothing to learn today.',
    'steps': [
        'Have breakfast.',
        'Have your ID ready, with the same name as your booking.',
        'Read your page of answer rules once, then put it away.',
        'In the exam, if two answers both work, pick the smaller, simpler one.',
        'If you are stuck on a question, pick your best guess and move on.',
    ],
    'done': 'You have sat the exam.',
}

# Days made of two half-hour jobs: join the help for each job.
sched = json.loads((OUT.parent / 'schedule.json').read_text())
HALVES = ('First half hour', 'Second half hour')
JOBS = dict(H)  # help for single jobs only, so a joined day is never joined again
for day in sched:
    parts = day.get('parts', [])
    if len(parts) != 2 or day['title'] in H or not any(t in JOBS for t in parts):
        continue
    tasks = [line.split(': ', 1)[1] for line in day['task'].split('\n')]
    steps, done, links, code = [], [], [], None
    for half, title, task in zip(HALVES, parts, tasks):
        h = JOBS.get(title)
        if not h:
            steps.append(f'{half}: {task} Use the link on the day\'s card.')
            continue
        steps.append(f'{half}: {title[0].lower() + title[1:]}. {h["about"]}')
        steps += h['steps']
        done.append(h['done'])
        links += [x for x in h.get('links', []) if x not in links]
        code = code or h.get('code')
    entry = {'about': 'Two jobs today, half an hour each. Stop each one at 30 minutes.', 'steps': steps, 'done': ' '.join(done)}
    if code:
        entry['code'] = code
    if links:
        entry['links'] = links
    H[day['title']] = entry

OUT.write_text(json.dumps(H, indent=1, ensure_ascii=False) + '\n')

# Every day with no link and some work should have help, and so should every
# two-job day where either job has none.
missing = sorted({s['title'] for s in sched if s['kind'] != 'Off' and s['title'] not in H
                  and (not s['links'] or any(t in H for t in s.get('parts', [])))})
print(f'{len(H)} entries. Wrote {OUT}')
if missing:
    print('No help yet for: ' + ', '.join(missing))
