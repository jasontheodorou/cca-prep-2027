import type { Connect, Plugin } from 'vite'
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { localIso, newId, replay, validate, type LogEvent } from '../src/data/events'

/* The study log's local API, served by the dev and preview servers only.
 * Copied from sanctum's life log.
 *   GET  /api/study            current state, rebuilt from the log
 *   POST /api/study            append one event: { type, ...fields, id?, at? }
 *   GET  /api/recommendations  data/recommendations.json as an agent wrote it,
 *                              or { connected: false } when there is none,
 *                              or { connected: true, error } when it cannot be read
 * Events are appended to data/study-log.jsonl, one JSON object per line, and
 * never rewritten. A deployed (static) site has no API. */

export function studyLog(dir = 'data'): Plugin {
  const log = resolve(dir, 'study-log.jsonl')
  const recs = resolve(dir, 'recommendations.json')

  const read = (): LogEvent[] => {
    if (!existsSync(log)) return []
    return readFileSync(log, 'utf8')
      .split('\n')
      .filter(Boolean)
      .flatMap((line) => {
        try {
          return [JSON.parse(line) as LogEvent]
        } catch {
          return [] // a damaged line never stops the rest loading
        }
      })
  }

  const send = (res: Parameters<Connect.NextHandleFunction>[1], status: number, body: unknown) => {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-store')
    res.end(JSON.stringify(body))
  }

  const handler: Connect.NextHandleFunction = (req, res, next) => {
    if (req.url?.startsWith('/api/recommendations')) {
      if (req.method !== 'GET') return send(res, 405, { error: 'Use GET' })
      if (!existsSync(recs)) return send(res, 200, { connected: false })
      try {
        // Checked again in the browser (src/data/recommendations.ts).
        return send(res, 200, { connected: true, file: JSON.parse(readFileSync(recs, 'utf8')) })
      } catch {
        // Still a 200: the server is fine, the agent's file is not.
        return send(res, 200, { connected: true, error: 'data/recommendations.json is not valid JSON.' })
      }
    }

    if (!req.url?.startsWith('/api/study')) return next()
    if (req.method === 'GET') return send(res, 200, { state: replay(read()) })
    if (req.method !== 'POST') return send(res, 405, { error: 'Use GET or POST' })

    let body = ''
    req.on('data', (chunk) => {
      body += chunk
      if (body.length > 20_000) req.destroy()
    })
    req.on('end', () => {
      let raw: Record<string, unknown>
      try {
        raw = JSON.parse(body)
      } catch {
        return send(res, 400, { error: 'Not JSON' })
      }
      const clean = validate(raw)
      if (!clean) return send(res, 400, { error: 'Not a valid event' })
      const event = {
        id: typeof raw.id === 'string' ? raw.id.slice(0, 64) : newId(),
        at: typeof raw.at === 'string' && !Number.isNaN(Date.parse(raw.at)) ? raw.at : localIso(),
        ...clean,
      } as LogEvent
      const events = read()
      // Retries from the browser's queue must not double up.
      if (!events.some((e) => e.id === event.id)) {
        mkdirSync(dirname(log), { recursive: true })
        appendFileSync(log, JSON.stringify(event) + '\n')
        events.push(event)
      }
      send(res, 200, { event, state: replay(events) })
    })
  }

  return {
    name: 'cca-prep:study-log',
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}
