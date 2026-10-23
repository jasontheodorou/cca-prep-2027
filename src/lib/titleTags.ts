import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { COURSE } from '../content/course'

/* A small row of tags under a note's title (Jason, 22 October 2026): the
 * exam section as a softly tinted pill, then the task statements the note
 * covers. With none yet, the week of the study plan the note was started
 * in. It sits inside the editor but is not part of the note: nothing here
 * is saved, and it cannot be typed into. */

export type TitleTagsData = { units: string[]; week?: string; onUnit?: (id: string) => void }

export const titleTagsKey = new PluginKey<TitleTagsData>('titleTags')

const SECTION_OF = new Map(COURSE.flatMap((s) => s.units.map((u) => [u.id, s] as const)))
const UNIT = new Map(COURSE.flatMap((s) => s.units.map((u) => [u.id, u] as const)))

function render(data: TitleTagsData) {
  const row = document.createElement('div')
  row.className = 'titletags'
  row.contentEditable = 'false'
  row.setAttribute('aria-label', 'Exam topics')

  const sections = [...new Set(data.units.map((u) => SECTION_OF.get(u)).filter(Boolean))]
  for (const s of sections) {
    const pill = document.createElement('span')
    pill.className = 'titletags__section'
    pill.dataset.tone = s!.tone
    pill.textContent = s!.short
    row.append(pill)
  }
  for (const id of data.units) {
    const unit = document.createElement('button')
    unit.type = 'button'
    unit.className = 'titletags__unit'
    unit.title = 'Show notes with this tag'
    unit.innerHTML = `<span class="titletags__id"></span><span class="titletags__name"></span>`
    unit.querySelector('.titletags__id')!.textContent = id
    unit.querySelector('.titletags__name')!.textContent = UNIT.get(id)?.short ?? ''
    unit.addEventListener('mousedown', (e) => e.preventDefault())
    unit.addEventListener('click', () => data.onUnit?.(id))
    row.append(unit)
  }
  if (!data.units.length && data.week) {
    const week = document.createElement('span')
    week.className = 'titletags__week'
    week.textContent = data.week
    row.append(week)
  }
  return row
}

export const TitleTags = Extension.create({
  name: 'titleTags',

  addProseMirrorPlugins() {
    return [
      new Plugin<TitleTagsData>({
        key: titleTagsKey,
        state: {
          init: () => ({ units: [] }),
          apply: (tr, value) => tr.getMeta(titleTagsKey) ?? value,
        },
        props: {
          decorations(state) {
            const data = titleTagsKey.getState(state)
            const first = state.doc.firstChild
            if (!data || !first || (!data.units.length && !data.week)) return null
            const key = `${data.units.join(',')}|${data.week ?? ''}`
            return DecorationSet.create(state.doc, [Decoration.widget(first.nodeSize, () => render(data), { key, side: -1, ignoreSelection: true })])
          },
        },
      }),
    ]
  },
})
