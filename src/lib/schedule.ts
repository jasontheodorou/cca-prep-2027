import SESSIONS from '../content/schedule.json'

/* The study schedule, written by scripts/build-plan.py (decision 016). The
 * site never changes it.
 *
 * The plan is 100 days of study from 1 December 2026 to 31 March 2027, not
 * counting Christmas and the February holiday, then practice exams until the
 * exam on 24 April 2027 (decision 021). Days 1 to 10
 * skim the whole course, 11 to 40 study the lessons that carry the most
 * marks, 41 to 50 are hard practice and 51 to 100 are ten five-day sprints.
 * No day is longer than one hour, and most days hold two half-hour jobs. */

export type Session = {
  day: string
  /** "Daily" (reading, questions), "Practice" (hands-on), "Optional", "Off", "Exam".
   * Days before 9 November 2026 also use "Long block". */
  kind: string
  minutes: number
  /** "Day 12 of 100 · What decides the mark · Agents" */
  week: string
  /** The day's job in a line: "Lesson 1.1 Agentic Loops". */
  title: string
  /** The rest of the plan's words for the day. Can be empty. */
  task: string
  /** Lessons the day names, such as "1.1". */
  units: string[]
  /** Pages on the study site the day uses. */
  links: { label: string; href: string }[]
  /** The titles of the day's half-hour jobs, when the plan names them. */
  parts?: string[]
  /** On a sandbox day: that step, as the plan's sandbox table describes it. */
  build?: string
}

export const SCHEDULE = SESSIONS as Session[]

const BY_DAY = new Map(SCHEDULE.map((s) => [s.day, s]))

export const sessionOn = (day: string) => BY_DAY.get(day)

/** The exam: the plan's first day of kind "Exam". */
export const EXAM_DAY = SCHEDULE.find((s) => s.kind === 'Exam')!.day

/** The plan's first day. The Momentum calendar starts in its month. */
export const FIRST_DAY = SCHEDULE[0].day

/** The plan's last day. */
export const LAST_DAY = SCHEDULE[SCHEDULE.length - 1].day

export const isExam = (s?: Session) => s?.kind === 'Exam'

/** A day with study planned: Done and Missed apply to it. Optional days
 * (Christmas flashcards) can be marked but are never owed. */
export const hasWork = (s?: Session) => !!s && s.minutes > 0

export const isOptional = (s?: Session) => !s || s.kind === 'Optional' || s.minutes === 0

/** The day the flashcards are made; there are none to go through before it. */
const DECK_DAY = SCHEDULE.find((s) => /flashcards/i.test(s.title))?.day ?? ''

/** A first-time lesson day (not a re-read): the plan's way of working through a lesson applies. */
export const isLesson = (s: Session) => /^Lesson \d\.\d:/.test(s.title)

/** Question and revision days open with 5 minutes of flashcards, once they
 * exist. Lesson days and hands-on days keep the whole hour. */
export const startsWithCards = (s: Session) => s.day > DECK_DAY && s.kind === 'Daily' && !isLesson(s)

/** A hands-on day in the practice project. */
export const isBuild = (s: Session) => s.kind === 'Practice' || !!s.build || /practice project/i.test(`${s.title} ${s.task}`)
