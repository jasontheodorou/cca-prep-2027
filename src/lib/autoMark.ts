import { Extension } from '@tiptap/core'
import type { Node as PMNode } from '@tiptap/pm/model'
import { Plugin, PluginKey, type EditorState, type Transaction } from '@tiptap/pm/state'

/* Code, infra and workflow as a fixed rule (Jason, 22 October 2026: "if I write
 * stop-reason again, turn it into code ... make it a deterministic rule").
 *
 * One word list, notes/terms.json, says which words are code, infra or
 * workflow. In every note, those words are always marked, and nothing else is:
 * - Making words code or infra adds them to the list; taking the mark off
 *   removes them. The page then marks or unmarks every place they appear.
 * - Matching ignores capitals and only counts whole words: "hook" never
 *   marks part of "hooks". Letters, digits and _ join a word, and so do
 *   - . / @ ~ $ between them, so a full stop after a word does not.
 * - The rule runs on every change and when a note opens, so a note always
 *   matches the list, whichever order things happened in. */

export type AutoKind = 'code' | 'infra' | 'workflow'
export type Terms = Record<string, AutoKind>

const CORE = /[\p{L}\p{N}_]/u
const JOIN = /[-./@~$]/u

/** Whether position i (between text[i-1] and text[i]) is inside a word. A
 * letter, digit or _ always joins; - . / @ ~ $ join only between two of
 * those, so "CLAUDE.md" is one word but "Neon." ends at the full stop. */
export function joined(text: string, i: number) {
  const a = text[i - 1]
  const b = text[i]
  if (!a || !b) return false
  if (CORE.test(a) && CORE.test(b)) return true
  if (CORE.test(a) && JOIN.test(b)) return CORE.test(text[i + 1] ?? '')
  if (JOIN.test(a) && CORE.test(b)) return CORE.test(text[i - 2] ?? '')
  return false
}
const KINDS: AutoKind[] = ['code', 'infra', 'workflow']
export const autoMarkKey = new PluginKey('autoMark')

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Where each kind belongs in one block of text: every whole-word match. */
function wanted(text: string, terms: Terms) {
  const out: { from: number; to: number; kind: AutoKind }[] = []
  const words = Object.keys(terms).sort((a, b) => b.length - a.length)
  if (!words.length) return out
  const pattern = new RegExp(words.map(escape).join('|'), 'giu')
  for (const m of text.matchAll(pattern)) {
    if (joined(text, m.index!) || joined(text, m.index! + m[0].length)) continue
    out.push({ from: m.index!, to: m.index! + m[0].length, kind: terms[m[0].toLowerCase()] })
  }
  return out
}

/** Makes the document follow the list exactly. Returns null if it already does. */
export function applyRule(state: EditorState, terms: Terms): Transaction | null {
  const tr = state.tr
  state.doc.descendants((node: PMNode, pos: number) => {
    if (!node.isTextblock) return
    if (node.type.name === 'codeBlock') return false
    const start = pos + 1
    const end = pos + node.nodeSize - 1
    const want = wanted(node.textContent, terms)
    for (const kind of KINDS) {
      const type = state.schema.marks[kind]
      if (!type) continue
      // Off everywhere in the block, then on exactly where the list says.
      if (state.doc.rangeHasMark(start, end, type)) tr.removeMark(start, end, type)
      for (const w of want) if (w.kind === kind) tr.addMark(start + w.from, start + w.to, type.create())
    }
    return false
  })
  // Only keep the change if the marks really differ.
  if (!tr.docChanged || tr.doc.eq(state.doc)) return null
  // Typing straight after a marked word carries on in plain text.
  tr.setStoredMarks((state.storedMarks ?? state.selection.$head.marks()).filter((m) => !KINDS.includes(m.type.name as AutoKind)))
  return tr.setMeta(autoMarkKey, true)
}

export const AutoMark = Extension.create<object, { terms: Terms }>({
  name: 'autoMark',

  addStorage() {
    return { terms: {} }
  },

  addProseMirrorPlugins() {
    const storage = this.storage
    return [
      new Plugin({
        key: autoMarkKey,
        appendTransaction: (trs, _old, state) => {
          if (!trs.some((tr) => tr.docChanged || tr.getMeta('autoMarkRefresh'))) return null
          if (trs.every((tr) => tr.getMeta(autoMarkKey))) return null
          return applyRule(state, storage.terms)
        },
      }),
    ]
  },
})

declare module '@tiptap/core' {
  interface Storage {
    autoMark: { terms: Terms }
  }
}
