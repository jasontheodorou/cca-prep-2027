import { localIso, newId, replay, validate, type LogEvent } from '../src/data/events.js'
import { readText, write } from './_blob.js'

/* The study log online. The same API as the local server (vite/study-log.ts):
 *   GET  /api/study     current state, rebuilt from the log
 *   POST /api/study     append one event
 * The log is one file, study-log.jsonl, one JSON object per line. Events are
 * only ever added. The browser sends one at a time, so two writes never race. */

const LOG = 'study-log.jsonl'
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

async function events(): Promise<LogEvent[]> {
  return ((await readText(LOG)) ?? '')
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

export async function GET() {
  return json({ state: replay(await events()) })
}

export async function POST(request: Request) {
  const text = await request.text()
  if (text.length > 20_000) return json({ error: 'Too large' }, 413)
  let raw: Record<string, unknown>
  try {
    raw = JSON.parse(text)
  } catch {
    return json({ error: 'Not JSON' }, 400)
  }
  const clean = validate(raw)
  if (!clean) return json({ error: 'Not a valid event' }, 400)
  const event = {
    id: typeof raw.id === 'string' ? raw.id.slice(0, 64) : newId(),
    at: typeof raw.at === 'string' && !Number.isNaN(Date.parse(raw.at)) ? raw.at : localIso(),
    ...clean,
  } as LogEvent
  const all = await events()
  // Retries from the browser's queue must not double up.
  if (!all.some((e) => e.id === event.id)) {
    all.push(event)
    await write(LOG, all.map((e) => JSON.stringify(e)).join('\n') + '\n', 'application/x-ndjson')
  }
  return json({ event, state: replay(all) })
}
