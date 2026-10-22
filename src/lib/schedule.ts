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

/** Study days open with 10 minutes of flashcards (the plan's default). */
export const startsWithCards = (s: Session) => ['Daily', 'Long block', 'Half-day'].includes(s.kind)

/** Saturday's long block: the sandbox, a build exercise or a mock exam. */
export const isBuild = (s: Session) => s.kind === 'Long block' && /sandbox/i.test(`${s.title} ${s.task}`)

/** A lesson day: the plan's six-step way of working through a lesson applies. */
export const isLesson = (s: Session) => /^Lesson \d\.\d/.test(s.title)
