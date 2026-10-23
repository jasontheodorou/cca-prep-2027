import SESSIONS from '../content/schedule.json'

/* The study schedule, from Jason's study plan (scripts/import-plan.py reads
 * ~/Desktop/study-plan.md). The site never changes it.
 *
 * There is no catch-up. The plan's own rule: a missed day is not added to
 * another day, and two weeks are never squeezed into one. If a day has to
 * go, make it Friday. A missed holiday week swaps with the nearest study
 * week, which means editing the plan and importing it again. */

export type Session = {
  day: string
  /** "Daily", "Long block", "Half-day", "Full day", "Short day", "Optional", "Off", "Exam" */
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

/** The exam: the plan's last day. */
export const EXAM_DAY = SCHEDULE[SCHEDULE.length - 1].day

/** A day with study planned: Done and Missed apply to it. Optional days
 * (Christmas flashcards) can be marked but are never owed. */
export const hasWork = (s?: Session) => !!s && s.minutes > 0

export const isOptional = (s?: Session) => !s || s.kind === 'Optional' || s.minutes === 0

/** The day the flashcards are made; there are none to go through before it. */
const DECK_DAY = SCHEDULE.find((s) => /flashcards/i.test(s.title))?.day ?? ''

/** Study days open with 10 minutes of flashcards (the plan's default), once they exist. */
export const startsWithCards = (s: Session) => s.day > DECK_DAY && ['Daily', 'Long block', 'Half-day'].includes(s.kind)

/** A day working on the practice project (the plan's "sandbox"). */
export const isBuild = (s: Session) => !!s.build || /practice project/i.test(`${s.title} ${s.task}`)

/** A first-time lesson day (not a re-read): the plan's way of working through a lesson applies. */
export const isLesson = (s: Session) => /^Lesson \d\.\d:/.test(s.title)
