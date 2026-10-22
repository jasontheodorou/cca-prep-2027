import type { Connect, Plugin } from 'vite'
import { execFile } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs'
import { extname, relative, resolve } from 'node:path'

/* Study notes, served by the dev and preview servers only. Each note is one
 * Markdown file in notes/ with a small header, and pasted screenshots live
 * in notes/images/. Both are kept in git: a minute after the last change the
 * server commits the notes folder, and only that folder.
 *
 *   GET    /api/notes              every note
 *   PUT    /api/notes/:id          save one: { title, created, tags, markdown }
 *   DELETE /api/notes/:id          delete one
 *   POST   /api/notes/images       save a pasted image (raw bytes), returns { src }
 *   GET    /notes-files/images/x   an image
 *
 * In a file, images are written as images/x.png, so the notes read properly
 * on GitHub; the editor sees them as /notes-files/images/x.png. */

export type NoteFile = { id: string; title: string; created: string; updated: string; tags: string[]; markdown: string }

const ID = /^[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{4}-[a-z0-9]{4}$/
const IMAGE_TYPES: Record<string, string> = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif', 'image/webp': '.webp' }
const MAX_NOTE = 2_000_000
const MAX_IMAGE = 15_000_000
const COMMIT_AFTER = 60_000

const toFile = (md: string) => md.replaceAll('](/notes-files/images/', '](images/').replaceAll('src="/notes-files/images/', 'src="images/')
const fromFile = (md: string) => md.replaceAll('](images/', '](/notes-files/images/').replaceAll('src="images/', 'src="/notes-files/images/')

/* The header is a few plain lines between --- marks, read and written here
 * only, so no YAML library is needed. */
function write(n: NoteFile) {
  const head = [
    '---',
    `id: ${n.id}`,
    `title: ${JSON.stringify(n.title)}`,
    `created: ${n.created}`,
    `updated: ${n.updated}`,
    `tags: [${n.tags.join(', ')}]`,
    '---',
    '',
  ].join('\n')
  return head + toFile(n.markdown).trimEnd() + '\n'
}

function read(text: string): NoteFile | null {
  const m = text.match(/^---\n([\s\S]*?)\n---\n\n?([\s\S]*)$/)
  if (!m) return null
  const field = (k: string) => m[1].match(new RegExp(`^${k}: (.*)$`, 'm'))?.[1] ?? ''
  let title = field('title')
  try {
    title = JSON.parse(title)
  } catch {
    // an older or hand-edited title without quotes is fine as it is
  }
  const tags = field('tags').replace(/^\[|\]$/g, '').split(',').map((t) => t.trim()).filter(Boolean)
  return { id: field('id'), title, created: field('created'), updated: field('updated'), tags, markdown: fromFile(m[2]) }
}

export function notes(dir = 'notes'): Plugin {
  const root = resolve(dir)
  const images = resolve(root, 'images')
  const file = (id: string) => resolve(root, `${id}.md`)
  // Commit only when the notes folder is inside this repository (tests use a temporary folder).
  const inRepo = !relative(process.cwd(), root).startsWith('..') && process.env.NOTES_COMMIT !== 'off'

  let timer: NodeJS.Timeout | undefined
  const commitSoon = () => {
    if (!inRepo) return
    clearTimeout(timer)
    timer = setTimeout(() => {
      const path = relative(process.cwd(), root)
      execFile('git', ['add', '-A', '--', path], (err) => {
        if (err) return console.error('[notes] git add failed:', err.message)
        execFile('git', ['commit', '-m', 'Study notes: autosave', '--', path], (e, out) => {
          if (e && !/nothing to commit|no changes added/.test(`${out}${e.message}`)) console.error('[notes] git commit failed:', e.message)
        })
      })
    }, COMMIT_AFTER)
  }

  const send = (res: Parameters<Connect.NextHandleFunction>[1], status: number, body: unknown) => {
    res.statusCode = status
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-store')
    res.end(JSON.stringify(body))
  }

  const body = (req: Connect.IncomingMessage, limit: number) =>
    new Promise<Buffer>((ok, fail) => {
      const parts: Buffer[] = []
      let size = 0
      req.on('data', (c: Buffer) => {
        size += c.length
        if (size > limit) {
          fail(new Error('Too large'))
          req.destroy()
        } else parts.push(c)
      })
      req.on('end', () => ok(Buffer.concat(parts)))
      req.on('error', fail)
    })

  const all = (): NoteFile[] => {
    if (!existsSync(root)) return []
    return readdirSync(root)
      .filter((f) => f.endsWith('.md'))
      .flatMap((f) => {
        const n = read(readFileSync(resolve(root, f), 'utf8'))
        return n && ID.test(n.id) ? [n] : []
      })
      .sort((a, b) => b.updated.localeCompare(a.updated))
  }

  const handler: Connect.NextHandleFunction = async (req, res, next) => {
    const url = req.url?.split('?')[0] ?? ''
    try {
      if (url.startsWith('/notes-files/images/')) {
        const name = url.slice('/notes-files/images/'.length)
        const path = resolve(images, name)
        if (!/^[a-z0-9-]+\.(png|jpg|gif|webp)$/.test(name) || !existsSync(path)) return send(res, 404, { error: 'No such image' })
        res.setHeader('Content-Type', `image/${extname(name).slice(1).replace('jpg', 'jpeg')}`)
        res.setHeader('Cache-Control', 'max-age=31536000, immutable')
        return res.end(readFileSync(path))
      }
      if (!url.startsWith('/api/notes')) return next()

      if (url === '/api/notes' && req.method === 'GET') return send(res, 200, { notes: all() })

      if (url === '/api/notes/images' && req.method === 'POST') {
        const ext = IMAGE_TYPES[String(req.headers['content-type'])]
        if (!ext) return send(res, 415, { error: 'Only PNG, JPEG, GIF or WebP images' })
        const bytes = await body(req, MAX_IMAGE)
        mkdirSync(images, { recursive: true })
        const name = `${new Date().toISOString().slice(0, 10)}-${Math.random().toString(36).slice(2, 10)}${ext}`
        writeFileSync(resolve(images, name), bytes)
        commitSoon()
        return send(res, 200, { src: `/notes-files/images/${name}` })
      }

      const id = url.slice('/api/notes/'.length)
      if (!ID.test(id)) return send(res, 400, { error: 'Not a note id' })

      if (req.method === 'PUT') {
        const raw = JSON.parse((await body(req, MAX_NOTE)).toString('utf8'))
        const note: NoteFile = {
          id,
          title: String(raw.title ?? '').replace(/\s+/g, ' ').trim().slice(0, 200) || 'New note',
          created: String(raw.created ?? new Date().toISOString()),
          updated: new Date().toISOString(),
          tags: Array.isArray(raw.tags) ? raw.tags.filter((t: unknown) => typeof t === 'string' && /^[1-5]\.[1-7]$/.test(t)) : [],
          markdown: String(raw.markdown ?? ''),
        }
        mkdirSync(root, { recursive: true })
        // Write to a spare file, then swap it in, so a crash never leaves half a note.
        writeFileSync(`${file(id)}.tmp`, write(note))
        renameSync(`${file(id)}.tmp`, file(id))
        commitSoon()
        return send(res, 200, { note })
      }

      if (req.method === 'DELETE') {
        if (existsSync(file(id))) unlinkSync(file(id))
        commitSoon()
        return send(res, 200, { deleted: id })
      }

      return send(res, 405, { error: 'Not allowed' })
    } catch (err) {
      return send(res, 400, { error: err instanceof Error ? err.message : 'Bad request' })
    }
  }

  return {
    name: 'cca-prep:notes',
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}
