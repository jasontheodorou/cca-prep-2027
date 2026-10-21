import SESSIONS from '../content/schedule.json'

/* The study schedule and its catch-up. The schedule comes from Jason's
 * spreadsheet (scripts/import-schedule.py) and is never changed by the site.
 * Catch-up is worked out afresh from the days marked missed, following the
 * spreadsheet's own "When behind" rule: unfinished core work moves into a
 * Thursday or Friday flexible hour or a buffer slot, never doubling a day.
 *
 * - A missed Core, Preparation leave or Light review session moves its
 *   minutes forward. Flexible hours are optional, so missing one moves only
 *   the catch-up it was holding.
 * - Catch-up goes to the next flexible or buffer days after the missed day,
 *   at most CAP minutes on any one day. A long session can spread over several.
 *   A day already past takes catch-up only if it was marked done.
 * - Catch-up with no room before the exam is reported as left over. */

export type Session = {
  day: string
  /** "Core", "Flexible", "Rest", "Leave", "Preparation leave", "Optional buffer", "Light review", "Exam" */
  kind: string
  /** The kind in plain words, for the screen: "Main session". */
  label: string
  focus: string
  /** Task statement ids such as "1.4, 1.5, 5.2", or "All", "Foundation". */
  objectives: string
  start: string
  evidence: string
  /** The weekday routine part of the task, in plain words. Empty on some days. */
  how: string
  task: string
  minimum: string
  recall: string
  minutes: number
}

/** Catch-up held by a day: minutes moved from one missed day. */
export type Moved = { from: string; minutes: number }

export type PlannedDay = Session & {
  /** Catch-up added to this day. */
  catchUp: Moved[]
  /** For a missed day: where its minutes went. */
  movedTo: { to: string; minutes: number }[]
}

const CAP = 60
const CARRIES = new Set(['Core', 'Preparation leave', 'Light review'])
const TAKES = new Set(['Flexible', 'Optional buffer'])

export const SCHEDULE = SESSIONS as Session[]

/** A day with a session to do: Done and Missed apply to it. */
export const hasWork = (d: PlannedDay) => d.minutes + total(d.catchUp) > 0

export const total = (m: { minutes: number }[]) => m.reduce((t, x) => t + x.minutes, 0)

export function plan(marks: Record<string, 'done' | 'missed'>, today: string) {
  const days = new Map<string, PlannedDay>()
  let owed: Moved[] = []
  for (const s of SCHEDULE) {
    const d: PlannedDay = { ...s, catchUp: [], movedTo: [] }
    days.set(s.day, d)
    if (TAKES.has(s.kind) && (s.day >= today || marks[s.day] === 'done')) {
      let room = CAP
      while (room > 0 && owed.length) {
        const take = Math.min(room, owed[0].minutes)
        d.catchUp.push({ from: owed[0].from, minutes: take })
        days.get(owed[0].from)!.movedTo.push({ to: s.day, minutes: take })
        room -= take
        owed[0] = { ...owed[0], minutes: owed[0].minutes - take }
        if (!owed[0].minutes) owed = owed.slice(1)
      }
    }
    if (marks[s.day] === 'missed') {
      // What this day held goes first, ahead of anything newer.
      const back = d.catchUp.map((m) => ({ ...m }))
      const own = CARRIES.has(s.kind) && s.minutes ? [{ from: s.day, minutes: s.minutes }] : []
      owed = [...back, ...owed, ...own]
      for (const m of back) {
        const src = days.get(m.from)!
        src.movedTo = src.movedTo.filter((t) => t.to !== s.day)
      }
    }
  }
  return { days, leftOver: owed }
}
