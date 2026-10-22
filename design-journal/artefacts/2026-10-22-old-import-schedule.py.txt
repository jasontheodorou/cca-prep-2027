#!/usr/bin/env python3
"""Reads the study schedule spreadsheet and writes src/content/schedule.json.

The spreadsheet is the source: change it, then run this again.

  python3 scripts/import-schedule.py ~/Desktop/dsp.xlsx

Only the "Daily plan" sheet is read, from the header row ("Date", "Day",
"Session" ...) down. The Status and Actual hours columns are ignored: the
site records those in the study log. Uses the standard library only.

Every sentence is swapped for its plain version from scripts/plain-words.json
(Jason, 21 October 2026: "plain English for a total dumbo to understand ...
Reading age of 5"). A task is split into its routine part ("how", the same
each weekday) and its own part ("task"). Any text with no plain version is
kept as written and listed, so it can be added to plain-words.json.
"""

import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from datetime import date, timedelta
from pathlib import Path

NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
REL = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'
OUT = Path(__file__).resolve().parent.parent / 'src' / 'content' / 'schedule.json'
PLAIN = json.loads((Path(__file__).resolve().parent / 'plain-words.json').read_text())
RECALL = re.compile(r'First 10 minutes: retrieve (.+) \((.+)\) without notes\. One scenario plus why the closest alternative loses\. Last studied week of (\d{4}-\d{2}-\d{2})\.')
missing = set()


def plain(group, text):
    if not text or text in PLAIN[group]:
        return PLAIN[group].get(text, text)
    missing.add(f'{group}: {text}')
    return text


def recall(text):
    m = RECALL.fullmatch(text)
    if not m:
        return plain('recall', text)
    when = date.fromisoformat(m.group(3))
    return (
        f'First 10 minutes: with no notes, think back to {plain("focus", m.group(1)).lower()}. '
        f'You did it in the week of {when.day} {when.strftime("%B")}. '
        'Make up one example. Say why the next best answer is wrong.'
    )


def task(text):
    for routine, how in PLAIN['how'].items():
        if text.startswith(routine):
            return how, plain('task', text[len(routine):])
    return '', plain('task', text)

# Spreadsheet heading -> field in schedule.json
FIELDS = {
    'Date': 'day',
    'Session': 'kind',
    'Hours': 'hours',
    'Focus': 'focus',
    'Objectives': 'objectives',
    'Start here': 'start',
    'Evidence to keep': 'evidence',
    'Assignment': 'task',
    'Minimum version': 'minimum',
    'Spaced recall': 'recall',
}


def text(el):
    return ''.join(t.text or '' for t in el.iter('{%s}t' % NS['m']))


def rows(path, wanted):
    z = zipfile.ZipFile(path)
    shared = []
    if 'xl/sharedStrings.xml' in z.namelist():
        shared = [text(si) for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si', NS)]
    book = ET.fromstring(z.read('xl/workbook.xml'))
    rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
    targets = {r.get('Id'): r.get('Target') for r in rels}
    sheet = next((s for s in book.find('m:sheets', NS) if s.get('name') == wanted), None)
    if sheet is None:
        sys.exit(f'No sheet called "{wanted}" in {path}')
    target = targets[sheet.get(REL)].lstrip('/')
    target = target if target.startswith('xl/') else 'xl/' + target
    for row in ET.fromstring(z.read(target)).iter('{%s}row' % NS['m']):
        cells = {}
        for c in row.findall('m:c', NS):
            col = re.match(r'[A-Z]+', c.get('r')).group()
            v = c.find('m:v', NS)
            t = c.get('t')
            if t == 's' and v is not None:
                cells[col] = shared[int(v.text)]
            elif t == 'inlineStr':
                cells[col] = text(c)
            elif v is not None:
                cells[col] = v.text
        yield cells


def day(value):
    if re.match(r'\d{4}-\d{2}-\d{2}', value):
        return value[:10]
    # An Excel date number: days since 30 December 1899.
    return (date(1899, 12, 30) + timedelta(days=int(float(value)))).isoformat()


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    columns = None
    sessions = []
    for cells in rows(sys.argv[1], 'Daily plan'):
        if columns is None:
            if cells.get('A') == 'Date':
                columns = {col: FIELDS[name] for col, name in cells.items() if name in FIELDS}
            continue
        if not cells.get('A'):
            continue
        s = {field: (cells.get(col) or '').strip() for col, field in columns.items()}
        s['day'] = day(s['day'])
        s['minutes'] = round(float(s.pop('hours') or 0) * 60)
        s['label'] = plain('kind', s['kind'])
        s['focus'] = plain('focus', s['focus'])
        s['how'], s['task'] = task(s['task'])
        for field in ('start', 'evidence', 'minimum'):
            s[field] = plain(field, s[field])
        s['recall'] = recall(s['recall'])
        sessions.append(s)
    sessions.sort(key=lambda s: s['day'])
    OUT.write_text(json.dumps(sessions, indent=1, ensure_ascii=False) + '\n')
    for m in sorted(missing):
        print('No plain version yet:', m)
    print(f'Wrote {len(sessions)} days, {sessions[0]["day"]} to {sessions[-1]["day"]}, to {OUT}')


main()
