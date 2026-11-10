import { useSyncExternalStore } from 'react'
import { readJson, writeJson } from '../lib/storage'
import { apply, EMPTY, localIso, newId, type LogEvent, type NewEvent, type SessionStatus, type StudyState } from './events'

/* One shared copy of the study log for every page, as in sanctum. The server
 * (api/study.ts online, vite/study-log.ts locally) is the source of truth; the browser keeps a mirror for an instant
 * first paint and a queue of events that could not be sent yet, retried every
 * 30 seconds and whenever the tab comes back.
 *
 * This is the only module that knows where records live. To read them from a
 * folder of Markdown files later, replace post() and load() here; the pages
 * only use useStudy(), logEffort(), setMilestone() and setSession(). */

export type SaveStatus = 'loading' | 'saved' | 'waiting'

type Snapshot = { state: StudyState; status: SaveStatus }

const MIRROR = 'cca-prep.study.mirror'
const QUEUE = 'cca-prep.study.queue'

let queue: LogEvent[] = readJson<LogEvent[]>(QUEUE, 'study queue') ?? []
let snapshot: Snapshot = {
  state: queue.reduce(apply, readJson<StudyState>(MIRROR, 'study mirror') ?? EMPTY),
  status: 'loading',
}
const listeners = new Set<() => void>()
let started = false

function set(next: Partial<Snapshot>) {
  snapshot = { ...snapshot, ...next }
  writeJson(MIRROR, snapshot.state, 'study mirror')
  listeners.forEach((l) => l())
}

async function post(e: LogEvent): Promise<void> {
  const res = await fetch('/api/study', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(e),
  })
  if (!res.ok) throw new Error(`Save failed: ${res.status}`)
}

/** Sends queued events in order, stopping at the first failure. */
async function send() {
  while (queue.length) {
    try {
      await post(queue[0])
    } catch {
      set({ status: 'waiting' })
      return
    }
    queue = queue.slice(1)
    writeJson(QUEUE, queue, 'study queue')
  }
  await load()
}

/* One send at a time; a change made while sending is picked up by one more pass. */
let sending: Promise<void> | null = null
let again = false
function flush(): Promise<void> {
  if (sending) {
    again = true
    return sending
  }
  sending = (async () => {
    do {
      again = false
      await send()
    } while (again && queue.length)
  })().finally(() => {
    sending = null
  })
  return sending
}

async function load() {
  try {
    const res = await fetch('/api/study', { cache: 'no-store' })
    if (!res.ok) throw new Error(String(res.status))
    const server = (await res.json()).state as StudyState
    // Events still queued are shown on top of what the server has.
    set({ state: queue.reduce(apply, server), status: queue.length ? 'waiting' : 'saved' })
  } catch {
    set({ status: 'waiting' })
  }
}

function start() {
  if (started || typeof window === 'undefined') return
  started = true
  void flush()
  window.setInterval(() => {
    if (queue.length) void flush()
  }, 30_000)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) void flush()
  })
}

function record(change: NewEvent) {
  const event = { id: newId(), at: localIso(), ...change } as LogEvent
  queue = [...queue, event]
  writeJson(QUEUE, queue, 'study queue')
  set({ state: apply(snapshot.state, event) })
  void flush()
}

/** Records the study time for a day. Zero minutes and no note removes the entry. */
export function logEffort(day: string, minutes: number, note: string) {
  record({ type: 'effort.set', day, minutes, note })
}

/** Marks a milestone done, or takes the mark back. */
export function setMilestone(milestone: string, done: boolean) {
  record({ type: 'milestone.set', milestone, done })
}

/** Marks a planned session done, missed or caught up, or takes the mark back with "none". */
export function setSession(day: string, status: SessionStatus) {
  record({ type: 'session.set', day, status })
}

export function useStudy(): Snapshot {
  start()
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => snapshot,
  )
}
