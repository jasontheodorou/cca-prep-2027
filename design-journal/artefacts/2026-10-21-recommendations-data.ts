import { useCallback, useEffect, useState } from 'react'
import { logError } from '../lib/log'

/* Recommendations come only from an agent. The agent writes
 * data/recommendations.json (format in data/README.md) and this module reads
 * it through the local server. Nothing here makes advice up: with no file, the
 * page says no agent is connected.
 *
 * To connect an agent another way later, replace fetchRecommendations(); the
 * page only uses useRecommendations(). */

export type Recommendation = {
  /** What to do, as one short instruction. */
  action: string
  /** Why, in a sentence. */
  reason: string
  /** A course unit it relates to, such as "1.3". Optional. */
  unit?: string
}

export type RecommendationSet = {
  /** Which agent wrote it. */
  agent: string
  /** When it was written, ISO 8601. */
  generatedAt: string
  items: Recommendation[]
}

export type RecState =
  | { status: 'loading' }
  | { status: 'none' }
  | { status: 'error'; message: string }
  | { status: 'ready'; set: RecommendationSet; sample?: boolean }

/** Only the first three are shown: a small amount of advice is the point. */
export const MAX_SHOWN = 3

const str = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null)

export function parseSet(raw: unknown): RecommendationSet | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const agent = str(r.agent, 80)
  const generatedAt = str(r.generatedAt, 40)
  if (!agent || !generatedAt || Number.isNaN(Date.parse(generatedAt)) || !Array.isArray(r.items)) return null
  const items = r.items.flatMap((x) => {
    if (!x || typeof x !== 'object') return []
    const i = x as Record<string, unknown>
    const action = str(i.action, 300)
    const reason = str(i.reason, 600)
    const unit = str(i.unit, 8) ?? undefined
    return action && reason ? [{ action, reason, unit }] : []
  })
  return { agent, generatedAt, items }
}

async function fetchRecommendations(): Promise<RecState> {
  const res = await fetch('/api/recommendations', { cache: 'no-store' })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    return { status: 'error', message: body?.error ?? `The local server answered ${res.status}.` }
  }
  const body = await res.json()
  if (!body.connected) return { status: 'none' }
  if (body.error) return { status: 'error', message: body.error }
  const set = parseSet(body.file)
  return set ? { status: 'ready', set } : { status: 'error', message: 'data/recommendations.json is not in the expected format.' }
}

/* Layout previews for the states, on the local server only: add
 * ?preview=loading, error or sample to the address. A sample is always
 * labelled as a sample on the page. */
const SAMPLE: RecommendationSet = {
  agent: 'Sample layout',
  generatedAt: '2026-10-18T09:00:00+01:00',
  items: [
    { action: 'Sample action text, written by an agent.', reason: 'Sample reason text, written by an agent.', unit: '1.1' },
    { action: 'A second sample action.', reason: 'A second sample reason.' },
  ],
}

function preview(): RecState | null {
  if (!import.meta.env.DEV) return null
  const p = new URLSearchParams(window.location.search).get('preview')
  if (p === 'loading') return { status: 'loading' }
  if (p === 'error') return { status: 'error', message: 'This is a preview of the error message.' }
  if (p === 'sample') return { status: 'ready', set: SAMPLE, sample: true }
  if (p === 'none') return { status: 'none' }
  return null
}

export function useRecommendations() {
  const [state, setState] = useState<RecState>({ status: 'loading' })

  const load = useCallback(() => {
    const p = preview()
    if (p) return setState(p)
    setState({ status: 'loading' })
    fetchRecommendations()
      .then(setState)
      .catch((err) => {
        logError(err, { source: 'recommendations' })
        setState({ status: 'error', message: 'The local server could not be reached.' })
      })
  }, [])

  useEffect(load, [load])
  return { state, reload: load }
}
