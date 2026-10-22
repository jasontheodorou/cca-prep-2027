import type { Note } from './notes'

/* The notes as they were when the site was built, for the online copy,
 * which has no server to ask. Loaded only in a production build: in
 * development, reading the notes folder here would reload the page every
 * time a note saved itself. The header format matches vite/notes.ts. */

const FILES = import.meta.glob('../../notes/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const IMAGES = import.meta.glob('../../notes/images/*', { query: '?no-inline', import: 'default', eager: true }) as Record<string, string>

// Pictures stay separate files (never inlined as data), because the editor
// only accepts pictures that are real addresses.
const imageUrl = (name: string) => IMAGES[`../../notes/images/${name}`] ?? `/notes-files/images/${name}`

function read(text: string): Note | null {
  const m = text.match(/^---\n([\s\S]*?)\n---\n\n?([\s\S]*)$/)
  if (!m) return null
  const field = (k: string) => m[1].match(new RegExp(`^${k}: (.*)$`, 'm'))?.[1] ?? ''
  let title = field('title')
  try {
    title = JSON.parse(title)
  } catch {
    // a title without quotes is fine as it is
  }
  const markdown = m[2]
    .replace(/\]\(images\/([^)\s]+)\)/g, (_, n) => `](${imageUrl(n)})`)
    .replace(/src="images\/([^"]+)"/g, (_, n) => `src="${imageUrl(n)}"`)
  const tags = field('tags').replace(/^\[|\]$/g, '').split(',').map((t) => t.trim()).filter(Boolean)
  return { id: field('id'), title, created: field('created'), updated: field('updated'), tags, markdown }
}

export const SNAPSHOT: Note[] = Object.values(FILES)
  .flatMap((t) => {
    const n = read(t)
    return n ? [n] : []
  })
  .sort((a, b) => b.updated.localeCompare(a.updated))
