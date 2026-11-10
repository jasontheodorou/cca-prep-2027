---
id: decision-016-thirty-minutes-a-day-two-tries
type: decision
date: 2026-11-09
topic: schedule
summary: The plan is rebuilt for 30 minutes a day at most, with every lesson read, built and tested over three days, a first try on 29 May 2027 and a second on 28 August in case it is needed.
tags: [schedule, momentum, study-plan, exam-date, hands-on-practice]
status: accepted
related: [decision-014-exam-moved-to-may, decision-009-new-study-plan, logbook-2026-11-09, decision-017-pass-by-30-june]
---

# 016 Thirty minutes a day, hands-on, with a second try planned

## Context

Jason, 9 November 2026: "I am really not finding time to work on this almost at all. I need you to completely replan my study for 30 minutes every day. That is the maximum amount of time that I have, and that includes the exercises that go along with each module." Nothing had been studied since 28 October; he was still at lesson 1.4.

He then said the old plan's real fault was too little practice: "lots and lots and lots of manual practice is needed for each module ... I need to actually implement, test the code in practice projects to be good enough to pass the exam." The study log agreed: lessons 1.2 and 1.3 took 1 to 2 hours each against 30 minutes planned.

Claude worked out that several hours of practice per lesson at 30 minutes a day puts the exam between July and November 2027. Jason first suggested July, then said "July is too far. Let's call it end of May", and finally: "just try to design the best possible curriculum from now until the end of May to pass this exam. And assume that I don't pass on the first attempt, and then have some kind of revision or further study plan that goes to the end of August next year."

## Options considered

- Keep the old plan and cut its long days into 30-minute pieces. Rejected: 109 hours left against about 74 available, and still mostly reading.
- 1.5 or 3 hours of practice per lesson with the exam in August or November. Offered; Jason chose May with a second try instead.
- One day per lesson with separate weekly builds. Rejected: lessons already overran 30 minutes, and practice would lag the reading by days.
- Three days per lesson (read, build, test), a short second look, then split practice exams. Chosen.

## Decision

- First try: Saturday 29 May 2027. Second try: Saturday 28 August 2027. Neither is booked.
- No day is over 30 minutes. Friday is a spare day. Holidays and Christmas keep their dates.
- 9 November to 27 May: 148 sessions (74 hours), 73 of them hands-on. Seven days to set up the practice project and build lessons 1.1 to 1.3; 27 lessons at three days each; three closing days per section; a second look by section with the six exam situations; two practice exams, each split into four 30-minute parts.
- 30 May to 6 June: rest. If he passed, the plan ends there.
- 7 June to 26 August: 70 sessions (35 hours), 28 hands-on. Section by section, weakest first by rank, since nobody knows yet which that will be; then practice exams 3 and 4.
- Four optional library days, on Fridays 8 January, 26 February, 16 April and 7 May. Jason, after saying "it feels like this isnt going to happen": "lets keep end of may 2027 as the plan ... may need to find a way to get to the british library for a few days". Three hold the exam guide's exercises 1, 3 and 4 in full; the last is a full 2-hour practice exam. The plan works without them and each can move.
- Study weeks are numbered, such as "Week 3 of 25 · Agents", so the plan reads as a course with an end.
- Flashcards drop from 10 minutes to 5, and only on question and revision days.
- `scripts/build-plan.py` now writes `schedule.json` from lists in the script. `import-plan.py`, `plain-plan.json` and the Markdown plan are no longer the source.
- New day kind "Practice". `EXAM_DAY` is the first exam day; `LAST_DAY` is the end of the plan; both exam days are marked on the calendar.

## Consequences

- The dates, the second try and the library days here were changed the next day by decision 017. The daily rules stand.

- About 1 hour of hands-on work per lesson, less than the "several hours" Jason asked for. That is what fits before May; the second try is where the rest goes.
- Without library day 4, the real exam would be his first 2-hour sitting. The two employer study days could be two of the library days.
- Whether the study site's practice exam can be paused after 15 questions is not checked.
- The names of exam situations 2, 4 and 5 were not in the project, so those days give only the number.
- Old schedule kept at `artefacts/2026-11-09-schedule-22-may-exam.json`.
