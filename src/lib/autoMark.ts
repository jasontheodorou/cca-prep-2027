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
 *   matches the list, whichever order things happened in.
 *
 * Infra is different (Jason, 26 October 2026: "so I don't accidentally make
 * common words marked as infra"). It is not on the list. Typing | before a
 * word works like Markdown: once the word is finished, the | goes and the
 * word is infra, in that one place only. */

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
// The kinds the list controls. Infra is marked one place at a time.
const KINDS: AutoKind[] = ['code', 'workflow']
export const autoMarkKey = new PluginKey('autoMark')

/** A block's text with one stand-in character for each line break or other
 * inline item, so a place in the text is the same place in the note. */
export const blockText = (node: PMNode) => node.textBetween(0, node.content.size, undefined, '\ufffc')

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Where each kind belongs in one block of text: every whole-word match. */
function wanted(text: string, terms: Terms) {
  const out: { from: number; to: number; kind: AutoKind }[] = []
  const words = Object.keys(terms).sort((a, b) => b.length - a.length)
  if (!words.length) return out
  const pattern = new RegExp(words.map(escape).join('|'), 'giu')
  for (const m of text.matchAll(pattern)) {
    if (joined(text, m.index!) || joined(text, m.index! + m[0].length)) continue
    const kind = terms[m[0].toLowerCase()]
    if (KINDS.includes(kind)) out.push({ from: m.index!, to: m.index! + m[0].length, kind })
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
    const want = wanted(blockText(node), terms)
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

/** "|word" followed by a word, as written. The | must not follow a letter or digit. */
const BAR = /(?<![\p{L}\p{N}_])\|([\p{L}\p{N}_]+(?:[-./@~$][\p{L}\p{N}_]+)*)/gu

/** Turns every finished "|word" into the word marked infra, without the |.
 * A word the cursor is still at the end of waits until it is finished. */
export function applyBars(state: EditorState): Transaction | null {
  const type = state.schema.marks.infra
  if (!type) return null
  const { empty, head } = state.selection
  const found: { bar: number; end: number }[] = []
  state.doc.descendants((node: PMNode, pos: number) => {
    if (!node.isTextblock) return
    if (node.type.name === 'codeBlock') return false
    const text = blockText(node)
    for (const m of text.matchAll(BAR)) {
      const bar = pos + 1 + m.index!
      const end = bar + m[0].length
      // A word just followed by - . / @ ~ $ may go on, as in "CLAUDE.md", so it waits too.
      const more = JOIN.test(text[m.index! + m[0].length] ?? '') ? 1 : 0
      if (empty && head > bar && head <= end + more) continue
      found.push({ bar, end })
    }
    return false
  })
  if (!found.length) return null
  const tr = state.tr
  // From the end backwards, so earlier places do not move.
  for (const { bar, end } of found.reverse()) {
    tr.addMark(bar + 1, end, type.create())
    tr.delete(bar, bar + 1)
  }
  return tr
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
          // Bars first; the list rule then runs on the result.
          return applyBars(state) ?? applyRule(state, storage.terms)
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
