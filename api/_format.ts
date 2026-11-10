/* How a note is written as a Markdown file. The same format as the local
 * server's (vite/notes.ts): keep the two in step. */

export type NoteFile = { id: string; title: string; created: string; updated: string; tags: string[]; markdown: string }

export const ID = /^[0-9]{4}-[0-9]{2}-[0-9]{2}-[0-9]{4}-[a-z0-9]{4}$/
export const IMAGE_NAME = /^[a-z0-9-]+\.(png|jpg|gif|webp)$/
export const IMAGE_TYPES: Record<string, string> = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif', 'image/webp': '.webp' }

const toFile = (md: string) => md.replaceAll('](/notes-files/images/', '](images/').replaceAll('src="/notes-files/images/', 'src="images/')
const fromFile = (md: string) => md.replaceAll('](images/', '](/notes-files/images/').replaceAll('src="images/', 'src="/notes-files/images/')

export function toText(n: NoteFile) {
  const head = ['---', `id: ${n.id}`, `title: ${JSON.stringify(n.title)}`, `created: ${n.created}`, `updated: ${n.updated}`, `tags: [${n.tags.join(', ')}]`, '---', ''].join('\n')
  return head + toFile(n.markdown).trimEnd() + '\n'
}

export function fromText(text: string): NoteFile | null {
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
