import { Extension } from '@tiptap/core'
import type { Node as PMNode } from '@tiptap/pm/model'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { blockText, joined } from './autoMark'

/* EXAM TRAP in dark red (Jason, 26 October 2026: "When I write 'EXAM TRAP'
 * colour that automatically in a dark red colour"). Only the look changes:
 * nothing is saved, so the Markdown file keeps the plain words. Matching
 * ignores capitals and counts whole words only, like the code and infra rule. */

const PATTERN = /exam\s+trap/giu
const key = new PluginKey<DecorationSet>('examTrap')

function find(doc: PMNode) {
  const out: Decoration[] = []
  doc.descendants((node, pos) => {
    if (!node.isTextblock) return
    if (node.type.name === 'codeBlock') return false
    const text = blockText(node)
    for (const m of text.matchAll(PATTERN)) {
      const from = m.index!
      const to = from + m[0].length
      if (joined(text, from) || joined(text, to)) continue
      out.push(Decoration.inline(pos + 1 + from, pos + 1 + to, { class: 'examtrap' }))
    }
    return false
  })
  return DecorationSet.create(doc, out)
}

export const ExamTrap = Extension.create({
  name: 'examTrap',

  addProseMirrorPlugins() {
    return [
      new Plugin<DecorationSet>({
        key,
        state: {
          init: (_, state) => find(state.doc),
          apply: (tr, value) => (tr.docChanged ? find(tr.doc) : value),
        },
        props: {
          decorations: (state) => key.getState(state),
        },
      }),
    ]
  },
})
