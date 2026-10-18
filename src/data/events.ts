/* The study log: every change to study time or a milestone is one event,
 * appended to data/study-log.jsonl and never rewritten. Current state is
 * rebuilt by replaying the events, so the file is the full history an agent
 * can read. Shared by the browser and the local server (vite/study-log.ts).
 * Copied from sanctum's life log. Schema notes for agents: data/README.md. */

type Base = {
  /** Unique id of this event. */
  id: string
  /** When it was recorded, ISO 8601 with the writer's UTC offset. */
  at: string
}

export type LogEvent = Base &
  (
    | { type: 'effort.set'; day: string; minutes: number; note: string }
    | { type: 'milestone.set'; milestone: string; done: boolean }
  )

export type NewEvent = LogEvent extends infer E ? (E extends LogEvent ? Omit<E, 'id' | 'at'> : never) : never

/** Study recorded for one day. One entry per day; saving again replaces it. */
export type Effort = { minutes: number; note: string; at: string }

export type StudyState = {
  /** Keyed by day, YYYY-MM-DD. A day with no entry is simply absent. */
  effort: Record<string, Effort>
  /** Milestones marked done, keyed by id ("1.1.2"), with when they were marked. */
  done: Record<string, string>
}

export const EMPTY: StudyState = { effort: {}, done: {} }

/** A full day is 1,440 minutes; nobody studies more than that. */
const MAX_MINUTES = 1440
const MAX_NOTE = 1000

const day = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null)

/** Checks an event from outside; returns it cleaned, or null if it is not valid. */
export function validate(raw: unknown): NewEvent | null {
  if (!raw || typeof raw !== 'object') return null
  const e = raw as Record<string, unknown>
  switch (e.type) {
    case 'effort.set': {
      const d = day(e.day)
      const m = typeof e.minutes === 'number' && Number.isInteger(e.minutes) ? e.minutes : null
      const note = typeof e.note === 'string' ? e.note.trim().slice(0, MAX_NOTE) : null
      return !d || m === null || m < 0 || m > MAX_MINUTES || note === null ? null : { type: 'effort.set', day: d, minutes: m, note }
    }
    case 'milestone.set': {
      const id = typeof e.milestone === 'string' && /^[A-Z0-9.]{1,16}$/.test(e.milestone) ? e.milestone : null
      return !id || typeof e.done !== 'boolean' ? null : { type: 'milestone.set', milestone: id, done: e.done }
    }
    default:
      return null
  }
}

export function apply(state: StudyState, e: LogEvent): StudyState {
  switch (e.type) {
    case 'effort.set': {
      // Zero minutes and no note removes the day's entry.
      const effort = { ...state.effort }
      if (e.minutes === 0 && !e.note) delete effort[e.day]
      else effort[e.day] = { minutes: e.minutes, note: e.note, at: e.at }
      return { ...state, effort }
    }
    case 'milestone.set': {
      const done = { ...state.done }
      if (e.done) done[e.milestone] = done[e.milestone] || e.at
      else delete done[e.milestone]
      return { ...state, done }
    }
    default:
      return state
  }
}

export const replay = (events: LogEvent[]) => events.reduce(apply, EMPTY)

/** Local time with its UTC offset, such as 2026-10-18T12:30:05+01:00. */
export function localIso(d = new Date()) {
  const pad = (n: number) => String(Math.abs(n)).padStart(2, '0')
  const off = -d.getTimezoneOffset()
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` +
    `${off >= 0 ? '+' : '-'}${pad(Math.floor(Math.abs(off) / 60))}:${pad(Math.abs(off) % 60)}`
  )
}

export const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
