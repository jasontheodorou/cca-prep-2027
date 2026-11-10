import { paths, read, readText, remove, write } from './_blob.js'
import { fromText, ID, IMAGE_NAME, IMAGE_TYPES, toText, type NoteFile } from './_format.js'

/* Study notes online. The same API as the local server (vite/notes.ts):
 *   GET    /api/notes              every note
 *   PUT    /api/notes/:id          save one
 *   DELETE /api/notes/:id          delete one
 *   POST   /api/notes/images       save a pasted image, returns { src }
 *   GET    /api/notes/terms        the word list
 *   PUT    /api/notes/terms        replace it
 *   GET    /notes-files/images/x   an image
 * vercel.json sends all of these here. An image can be 4 MB at most, which
 * is Vercel's limit on what a function may be sent. */

const TERMS = 'notes/terms.json'
const MAX_NOTE = 2_000_000
const MAX_IMAGE = 4_000_000
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })

/** What was asked for: "" for the list, "terms", "images", a note id, or an image name. */
function target(request: Request) {
  const url = new URL(request.url)
  if (url.pathname.startsWith('/notes-files/images/')) return { image: url.pathname.slice('/notes-files/images/'.length), rest: '' }
  if (url.searchParams.has('image')) return { image: url.searchParams.get('image') ?? '', rest: '' }
  const rest = url.pathname.startsWith('/api/notes/') ? url.pathname.slice('/api/notes/'.length) : (url.searchParams.get('p') ?? '')
  return { image: null, rest: rest.replace(/\/$/, '') }
}

async function all(): Promise<NoteFile[]> {
  const files = (await paths('notes/')).filter((p) => /^notes\/[^/]+\.md$/.test(p))
  const notes = await Promise.all(files.map(async (p) => fromText((await readText(p)) ?? '')))
  return notes.filter((n): n is NoteFile => !!n && ID.test(n.id)).sort((a, b) => b.updated.localeCompare(a.updated))
}

export async function GET(request: Request) {
  const { image, rest } = target(request)
  if (image !== null) {
    const found = IMAGE_NAME.test(image) ? await read(`notes/images/${image}`) : null
    if (!found) return json({ error: 'No such image' }, 404)
    const type = `image/${image.split('.').pop()!.replace('jpg', 'jpeg')}`
    return new Response(found.stream, { headers: { 'Content-Type': type, 'Cache-Control': 'private, max-age=31536000, immutable' } })
  }
  if (rest === '') return json({ notes: await all() })
  if (rest === 'terms') return json({ terms: JSON.parse((await readText(TERMS)) ?? '{}') })
  return json({ error: 'Not allowed' }, 405)
}

export async function POST(request: Request) {
  if (target(request).rest !== 'images') return json({ error: 'Not allowed' }, 405)
  const ext = IMAGE_TYPES[request.headers.get('content-type') ?? '']
  if (!ext) return json({ error: 'Only PNG, JPEG, GIF or WebP images' }, 415)
  const bytes = await request.arrayBuffer()
  if (bytes.byteLength > MAX_IMAGE) return json({ error: 'Too large' }, 413)
  const name = `${new Date().toISOString().slice(0, 10)}-${Math.random().toString(36).slice(2, 10)}${ext}`
  await write(`notes/images/${name}`, bytes, request.headers.get('content-type')!)
  return json({ src: `/notes-files/images/${name}` })
}

export async function PUT(request: Request) {
  const { rest } = target(request)
  const text = await request.text()
  if (text.length > MAX_NOTE) return json({ error: 'Too large' }, 413)
  let raw: Record<string, unknown>
  try {
    raw = JSON.parse(text)
  } catch {
    return json({ error: 'Not JSON' }, 400)
  }

  if (rest === 'terms') {
    const clean: Record<string, string> = {}
    for (const [k, v] of Object.entries((raw.terms as Record<string, unknown>) ?? {})) {
      const t = String(k).trim().toLowerCase()
      if (t && t.length <= 60 && (v === 'code' || v === 'infra' || v === 'workflow')) clean[t] = v
    }
    const sorted = Object.fromEntries(Object.entries(clean).sort(([a], [b]) => a.localeCompare(b)))
    await write(TERMS, JSON.stringify(sorted, null, 2) + '\n', 'application/json')
    return json({ terms: sorted })
  }

  if (!ID.test(rest)) return json({ error: 'Not a note id' }, 400)
  const note: NoteFile = {
    id: rest,
    title: String(raw.title ?? '').replace(/\s+/g, ' ').trim().slice(0, 200) || 'New note',
    created: String(raw.created ?? new Date().toISOString()),
    updated: new Date().toISOString(),
    tags: Array.isArray(raw.tags) ? raw.tags.filter((t: unknown): t is string => typeof t === 'string' && /^[1-5]\.[1-7]$/.test(t)) : [],
    markdown: String(raw.markdown ?? ''),
  }
  await write(`notes/${rest}.md`, toText(note), 'text/markdown; charset=utf-8')
  return json({ note })
}

export async function DELETE(request: Request) {
  const { rest } = target(request)
  if (!ID.test(rest)) return json({ error: 'Not a note id' }, 400)
  await remove(`notes/${rest}.md`).catch(() => undefined)
  return json({ deleted: rest })
}
