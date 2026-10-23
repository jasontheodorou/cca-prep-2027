import { useSyncExternalStore } from 'react'
import { readJson, writeJson } from '../lib/storage'
import type { AutoKind, Terms } from '../lib/autoMark'

/* Study notes: one shared copy for every page. The local server keeps them
 * as Markdown files in notes/, committed to git (vite/notes.ts). The browser
 * holds a draft of any note it could not save yet, sent again on the next
 * load or save, so nothing typed is lost while the server is stopped. */

export type Note = { id: string; title: string; created: string; updated: string; tags: string[]; markdown: string }
/** "readonly": the online copy, showing the notes as they were when it was built. */
export type NotesStatus = 'loading' | 'ready' | 'offline' | 'readonly'

type Snapshot = { notes: Note[]; status: NotesStatus; terms: Terms }

const DRAFTS = 'cca-prep.notes.drafts'

let snapshot: Snapshot = { notes: [], status: 'loading', terms: {} }
const listeners = new Set<() => void>()
let started = false

function set(next: Partial<Snapshot>) {
  snapshot = { ...snapshot, ...next }
  listeners.forEach((l) => l())
}

const drafts = () => readJson<Record<string, Note>>(DRAFTS, 'note drafts') ?? {}
const keepDraft = (n: Note) => writeJson(DRAFTS, { ...drafts(), [n.id]: n }, 'note drafts')
const dropDraft = (id: string) => {
  const d = drafts()
  delete d[id]
  writeJson(DRAFTS, d, 'note drafts')
}

const sorted = (notes: Note[]) => [...notes].sort((a, b) => b.updated.localeCompare(a.updated))

/** "2026-10-22-1432-x7k2": when it was made, plus four letters so two notes in a minute differ. */
export function newNoteId(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0')
  const rand = Math.random().toString(36).slice(2, 6).padEnd(4, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}-${rand}`
}

async function put(n: Note): Promise<Note> {
  const res = await fetch(`/api/notes/${n.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(n),
  })
  if (!res.ok) throw new Error(`Save failed: ${res.status}`)
  return (await res.json()).note as Note
}

async function load() {
  try {
    const res = await fetch('/api/notes', { cache: 'no-store' })
    if (!res.ok) throw new Error(String(res.status))
    const server = (await res.json()).notes as Note[]
    if (!Array.isArray(server)) throw new Error('No notes server')
    const byId = new Map(server.map((n) => [n.id, n]))
    // Drafts the server never got are shown, and sent again.
    for (const d of Object.values(drafts())) {
      const s = byId.get(d.id)
      if (!s || s.updated < d.updated) byId.set(d.id, d)
    }
    const terms = (await (await fetch('/api/notes/terms', { cache: 'no-store' })).json()).terms as Terms
    set({ notes: sorted([...byId.values()]), status: 'ready', terms })
    for (const d of Object.values(drafts())) void saveNote(d)
  } catch {
    // No server: on the online copy, show the notes it was built with, read only.
    if (import.meta.env.PROD) {
      const { SNAPSHOT, TERMS } = await import('./notes-snapshot')
      return set({ notes: SNAPSHOT, status: 'readonly', terms: TERMS })
    }
    set({ notes: sorted(Object.values(drafts())), status: 'offline' })
  }
}

/** Saves a note: shown at once, kept as a draft until the server has it. */
export async function saveNote(n: Note): Promise<boolean> {
  const note = { ...n, updated: new Date().toISOString() }
  keepDraft(note)
  set({ notes: sorted([note, ...snapshot.notes.filter((x) => x.id !== n.id)]) })
  try {
    const saved = await put(note)
    // A later edit may have been saved meanwhile; keep the draft until the newest is in.
    if (drafts()[n.id]?.updated === note.updated) dropDraft(n.id)
    set({ notes: sorted(snapshot.notes.map((x) => (x.id === n.id && x.updated <= note.updated ? { ...saved, markdown: note.markdown } : x))), status: 'ready' })
    return true
  } catch {
    set({ status: 'offline' })
    return false
  }
}

/** Adds words to the code and infra list, or takes them off with null. */
export async function setTerm(term: string, kind: AutoKind | null) {
  const t = term.trim().toLowerCase()
  if (!t || t.length > 60) return
  const terms = { ...snapshot.terms }
  if (kind) terms[t] = kind
  else delete terms[t]
  set({ terms })
  try {
    const res = await fetch('/api/notes/terms', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ terms }) })
    if (!res.ok) throw new Error(String(res.status))
  } catch {
    set({ status: 'offline' })
  }
}

export async function deleteNote(id: string) {
  dropDraft(id)
  set({ notes: snapshot.notes.filter((n) => n.id !== id) })
  try {
    const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error(String(res.status))
  } catch {
    set({ status: 'offline' })
  }
}

/** Stores a pasted or dropped image; gives back its address, or null. */
export async function uploadImage(file: Blob): Promise<string | null> {
  try {
    const res = await fetch('/api/notes/images', { method: 'POST', headers: { 'Content-Type': file.type }, body: file })
    if (!res.ok) throw new Error(String(res.status))
    return (await res.json()).src as string
  } catch {
    set({ status: 'offline' })
    return null
  }
}

export function useNotes(): Snapshot {
  if (!started && typeof window !== 'undefined') {
    started = true
    void load()
  }
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => snapshot,
  )
}
