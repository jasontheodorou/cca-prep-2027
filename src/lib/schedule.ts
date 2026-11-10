import SESSIONS from '../content/schedule.json'

/* The study schedule, written by scripts/build-plan.py (decision 016). The
 * site never changes it.
 *
 * No day is longer than 30 minutes. Each lesson takes three days: read it,
 * build it, test it. Friday is a spare day with nothing planned, which is
 * where a missed day can go. Each section ends with one of the exam guide's
 * four exercises, one step a day. The exam is planned for 26 June 2027. */

export type Session = {
  day: string
  /** "Daily" (reading, questions), "Practice" (hands-on), "Optional", "Off", "Exam".
   * Days before 9 November 2026 also use "Long block". */
  kind: string
  minutes: number
  /** "Week 1 · Domain 1, first half" */
  week: string
  /** The day's job in a line: "Lesson 1.1 Agentic Loops". */
  title: string
  /** The rest of the plan's words for the day. Can be empty. */
  task: string
  /** Lessons the day names, such as "1.1". */
  units: string[]
  /** Pages on the study site the day uses. */
  links: { label: string; href: string }[]
  /** On a sandbox day: that step, as the plan's sandbox table describes it. */
  build?: string
}

export const SCHEDULE = SESSIONS as Session[]

const BY_DAY = new Map(SCHEDULE.map((s) => [s.day, s]))

export const sessionOn = (day: string) => BY_DAY.get(day)

/** The exam: the plan's first day of kind "Exam". */
export const EXAM_DAY = SCHEDULE.find((s) => s.kind === 'Exam')!.day

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
 * exist. Lesson days and hands-on days keep the whole 30 minutes. */
export const startsWithCards = (s: Session) => s.day > DECK_DAY && s.kind === 'Daily' && !isLesson(s)

/** A hands-on day in the practice project. */
export const isBuild = (s: Session) => s.kind === 'Practice' || !!s.build || /practice project/i.test(`${s.title} ${s.task}`)
