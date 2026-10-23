import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Mark } from '@tiptap/core'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import { Placeholder } from '@tiptap/extensions'
import { Markdown } from '@tiptap/markdown'
import { NodeSelection } from '@tiptap/pm/state'
import { Head } from '../components/Head'
import { deleteNote, newNoteId, saveNote, setTerm, uploadImage, useNotes, type Note } from '../data/notes'
import { AutoMark, joined, type AutoKind, type Terms } from '../lib/autoMark'
import { sessionOn } from '../lib/schedule'
import { TitleTags, titleTagsKey } from '../lib/titleTags'
import { dayKey } from '../lib/dates'
import { autoTags, tagName } from '../lib/tags'

/* Notes (the Study page): notes on the left, the open note on the right. Headings, bold,
 * lists, links, pasted screenshots and YouTube videos. Every change saves
 * itself a moment later, as a Markdown file in the repository, and the
 * note is tagged with the exam task statements its words cover.
 *
 * Also: search covers titles, words
 * and tags; a tag filters the list; a deleted note can be brought back. */

const SAVE_AFTER = 800
const YOUTUBE = /^https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be|youtube-nocookie\.com)\//

// A video is kept in the file as ![video](its address), so the note still
// reads as plain Markdown; it comes back as a player when opened.
const Video = Youtube.extend({
  renderMarkdown: (node) => `![video](${node.attrs?.src ?? ''})`,
})
const Picture = Image.extend({
  // A resized picture keeps its width in the file as a plain HTML <img>,
  // which GitHub also shows at that width.
  renderMarkdown: (node) => {
    const { src = '', alt = '', width } = node.attrs ?? {}
    return width ? `<img src="${src}" alt="${alt}" width="${Math.round(Number(width))}">` : `![${alt}](${src})`
  },
  parseMarkdown: (token, helpers) =>
    token.text === 'video' && YOUTUBE.test(token.href ?? '')
      ? helpers.createNode('youtube', { src: token.href })
      : helpers.createNode('image', { src: token.href, title: token.title, alt: token.text }),
})

// Infra and workflow: like code, on a lilac or a green band (Jason,
// 22 October 2026). Markdown has no mark for them, so the file keeps them as
// <span data-infra>words</span> or <span data-workflow>words</span>, which
// GitHub shows as plain words. A word can be only one of code, infra and workflow.
const spanMark = (name: 'infra' | 'workflow') =>
  Mark.create({
    name,
    excludes: 'code infra workflow',
    parseHTML: () => [{ tag: `span[data-${name}]` }],
    renderHTML: () => ['span', { [`data-${name}`]: '', class: name }, 0],
    renderMarkdown: (node, h) => `<span data-${name}>${h.renderChildren(node)}</span>`,
  })
const Infra = spanMark('infra')
const Workflow = spanMark('workflow')

/** The note's title: its first line, however it is styled. */
const titleOf = (e: Editor) => e.state.doc.firstChild?.textContent.trim().slice(0, 120) || 'New note'

const when = (iso: string) => {
  const d = new Date(iso)
  const today = dayKey(new Date()) === dayKey(d)
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return today ? `Today, ${time}` : `${d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '')}, ${time}`
}

export function Study() {
  const { notes, status, terms } = useNotes()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [deleted, setDeleted] = useState<Note | null>(null)
  const [fresh, setFresh] = useState<string | null>(null)
  const openId = params.get('note')
  const tag = params.get('tag')
  const open = notes.find((n) => n.id === openId) ?? (openId ? undefined : notes[0])

  const go = (id: string | null, t: string | null = tag) => {
    const next = new URLSearchParams()
    if (id) next.set('note', id)
    if (t) next.set('tag', t)
    setParams(next, { replace: true })
  }

  const shown = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    return notes.filter((n) => {
      if (tag && !n.tags.includes(tag)) return false
      const hay = `${n.title} ${n.markdown} ${n.tags.map(tagName).join(' ')}`.toLowerCase()
      return words.every((w) => hay.includes(w))
    })
  }, [notes, query, tag])

  const create = () => {
    // Every new note is just "New note" until its first line is written (Jason, 22 October 2026).
    const now = new Date().toISOString()
    const note: Note = { id: newNoteId(), title: 'New note', created: now, updated: now, tags: [], markdown: '' }
    void saveNote(note)
    setFresh(note.id)
    setQuery('')
    go(note.id, null)
  }

  const remove = (n: Note) => {
    void deleteNote(n.id)
    setDeleted(n)
    go(null)
  }

  useEffect(() => {
    if (!deleted) return
    const t = window.setTimeout(() => setDeleted(null), 10_000)
    return () => window.clearTimeout(t)
  }, [deleted])

  return (
    <main id="main" className="wrap">
      <Head title="Notes" line="Your notes. Everything saves itself." />

      <div className="study">
        <section className="notes" aria-labelledby="notes-head">
          <div className="notes__top">
            <h2 className="h3" id="notes-head">
              Notes
            </h2>
            {status !== 'readonly' && (
              <button type="button" className="btn btn--small" onClick={create}>
                New note
              </button>
            )}
          </div>
          <label className="visually-hidden" htmlFor="note-search">
            Search notes
          </label>
          <input
            id="note-search"
            className="input notes__search"
            type="search"
            placeholder="Search notes"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {status === 'readonly' && <p className="notes__filter">Read only here. Notes are written on your computer.</p>}
          {tag && (
            <p className="notes__filter">
              Only notes tagged {tagName(tag)}.{' '}
              <button type="button" className="link small" onClick={() => go(open?.id ?? null, null)}>
                Show all
              </button>
            </p>
          )}
          {deleted && (
            <p className="notes__undo" role="status">
              Note deleted.{' '}
              <button
                type="button"
                className="link small"
                onClick={() => {
                  void saveNote(deleted)
                  go(deleted.id)
                  setDeleted(null)
                }}
              >
                Undo
              </button>
            </p>
          )}
          {status === 'loading' && !notes.length ? (
            <p className="muted small">Loading notes…</p>
          ) : shown.length ? (
            <ul className="notelist">
              {shown.map((n) => (
                <li key={n.id}>
                  <button type="button" className="notelist__item" aria-current={n.id === open?.id || undefined} onClick={() => go(n.id)}>
                    <span className="notelist__title">{n.title}</span>
                    <span className="notelist__meta">{when(n.updated)}</span>
                    {n.tags.length > 0 && <span className="notelist__tags">{n.tags.join(' · ')}</span>}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted small">{notes.length ? 'No notes match.' : 'No notes yet. Start one with New note.'}</p>
          )}
        </section>

        <section className="card notepad" aria-label="Note">
          {open ? (
            <NoteEditor key={open.id} note={open} terms={terms} fresh={fresh === open.id} readOnly={status === 'readonly'} offline={status === 'offline'} onTag={(t) => go(open.id, t)} onDelete={() => remove(open)} />
          ) : (
            <div className="notepad__empty">
              <p className="h3">{notes.length ? 'Choose a note, or start a new one.' : 'Your first note'}</p>
              {status !== 'readonly' && (
                <button type="button" className="btn" onClick={create}>
                  New note
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

function NoteEditor({
  note,
  fresh,
  readOnly,
  terms,
  offline,
  onTag,
  onDelete,
}: {
  note: Note
  /** Just made: the cursor goes straight to the end, ready to type. */
  fresh: boolean
  /** The online copy: the note can be read but not changed. */
  readOnly: boolean
  /** The code and infra word list every note follows. */
  terms: Terms
  offline: boolean
  onTag: (t: string) => void
  onDelete: () => void
}) {
  const [state, setState] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [tags, setTags] = useState(note.tags)
  const [linking, setLinking] = useState(false)
  const [url, setUrl] = useState('')
  const [, redraw] = useState(0)
  const timer = useRef<number | undefined>(undefined)
  const pending = useRef(false)

  const flush = async (e: Editor) => {
    window.clearTimeout(timer.current)
    if (!pending.current) return
    pending.current = false
    const t = autoTags(`${e.getText()}`)
    setTags(t)
    setState('saving')
    const ok = await saveNote({ ...note, title: titleOf(e), tags: t, markdown: e.getMarkdown().replace(/(\s*&nbsp;)+\s*$/, '\n') })
    setState(ok ? 'saved' : 'unsaved')
  }

  const placeImages = (e: Editor, files: File[], pos?: number) => {
    for (const f of files) {
      void uploadImage(f).then((src) => {
        if (!src) return setState('unsaved')
        // A paragraph follows the picture, so typing carries on below it
        // instead of replacing it.
        const block = [{ type: 'image', attrs: { src, alt: 'Screenshot' } }, { type: 'paragraph' }]
        if (pos !== undefined) e.chain().focus().insertContentAt(pos, block).run()
        else e.chain().focus().insertContent(block).run()
      })
    }
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: { openOnClick: false, autolink: true, linkOnPaste: true, defaultProtocol: 'https' } }),
      Picture.configure({
        inline: false,
        // Corner handles to resize a picture, keeping its shape.
        resize: { enabled: true, directions: ['top-left', 'top-right', 'bottom-left', 'bottom-right'], minWidth: 80, minHeight: 40, alwaysPreserveAspectRatio: true },
      }),
      Video.configure({ nocookie: true, addPasteHandler: true, width: 640, height: 360 }),
      Placeholder.configure({ placeholder: ({ pos }) => (pos === 0 ? 'Title' : '') }),
      Infra,
      Workflow,
      AutoMark,
      TitleTags,
      Markdown,
    ],
    content: note.markdown,
    contentType: 'markdown',
    immediatelyRender: true,
    editable: !readOnly,
    editorProps: {
      attributes: { class: 'prose', 'aria-label': 'Note text' },
      handlePaste: (view, event) => {
        const files = [...(event.clipboardData?.files ?? [])].filter((f) => f.type.startsWith('image/'))
        if (!files.length || !editor) return false
        placeImages(editor, files)
        return true
      },
      handleDrop: (view, event) => {
        const files = [...(event.dataTransfer?.files ?? [])].filter((f) => f.type.startsWith('image/'))
        if (!files.length || !editor) return false
        const at = view.posAtCoords({ left: event.clientX, top: event.clientY })
        placeImages(editor, files, at?.pos)
        return true
      },
    },
    onUpdate: ({ editor: e }) => {
      if (readOnly) return
      pending.current = true
      setState('saving')
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => void flush(e), SAVE_AFTER)
    },
    onSelectionUpdate: () => redraw((n) => n + 1),
  })

  // The tags under the title: the exam topics, or else the plan's week the note was started in.
  const onTagRef = useRef(onTag)
  onTagRef.current = onTag
  useEffect(() => {
    if (!editor) return
    const week = sessionOn(dayKey(new Date(note.created)))?.week
    editor.view.dispatch(editor.state.tr.setMeta(titleTagsKey, { units: tags, week, onUnit: (id: string) => onTagRef.current(id) }))
  }, [editor, tags, note.created])

  // The note follows the code and infra word list: on opening, and whenever the list changes.
  useEffect(() => {
    if (!editor) return
    editor.storage.autoMark.terms = terms
    editor.view.dispatch(editor.state.tr.setMeta('autoMarkRefresh', true))
  }, [editor, terms])

  // A new note opens with the cursor ready to type.
  useEffect(() => {
    if (!editor || !fresh) return
    // An empty note starts on a title line; whatever is typed there becomes its name.
    if (!editor.state.doc.textContent) editor.chain().setTextSelection(1).setNode('heading', { level: 1 }).focus('start').run()
    else editor.commands.focus('end')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  // Save straight away when leaving the note or the tab.
  useEffect(() => {
    if (!editor) return
    const away = () => document.hidden && void flush(editor)
    const leave = () => void flush(editor)
    document.addEventListener('visibilitychange', away)
    window.addEventListener('pagehide', leave)
    return () => {
      document.removeEventListener('visibilitychange', away)
      window.removeEventListener('pagehide', leave)
      void flush(editor)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  if (!editor) return null

  const tool = (label: string, active: boolean, run: () => void, key?: string) => (
    <button type="button" className="tool" aria-pressed={active} title={key ? `${label} (${key})` : label} onMouseDown={(e) => e.preventDefault()} onClick={run}>
      {label}
    </button>
  )

  // Code, infra and workflow go through the word list, so every note follows: marking
  // adds the words, unmarking takes the whole marked word off the list.
  const markAs = (kind: AutoKind) => {
    const on = editor.isActive(kind)
    if (on) editor.chain().focus().extendMarkRange(kind).run()
    // Whole words only: a selection inside a word grows to the whole word.
    let { from, to } = editor.state.selection
    const $from = editor.state.doc.resolve(from)
    const block = $from.parent.textContent
    const offset = $from.start()
    while (from > offset && joined(block, from - offset)) from--
    while (to < offset + block.length && joined(block, to - offset)) to++
    editor.commands.setTextSelection({ from, to })
    const words = editor.state.doc.textBetween(from, to, ' ').trim()
    if (!words) return
    void setTerm(words, on ? null : kind)
    if (on) editor.chain().focus().unsetMark(kind).run()
    else editor.chain().focus().setMark(kind).run()
  }

  const applyLink = () => {
    const href = url.trim()
    if (href) {
      const full = /^[a-z]+:\/\//i.test(href) ? href : `https://${href}`
      editor.chain().focus().extendMarkRange('link').setLink({ href: full }).run()
    } else {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    }
    setLinking(false)
    setUrl('')
  }

  return (
    <div className="editor">
      {/* Formatting appears only over highlighted words (Jason, 22 October 2026). */}
      <BubbleMenu
        editor={editor}
        className="bubble"
        shouldShow={({ state }) => !state.selection.empty && !(state.selection instanceof NodeSelection)}
        options={{ placement: 'top', offset: 8 }}
      >
        {linking ? (
          <form
            className="bubble__link"
            onSubmit={(e) => {
              e.preventDefault()
              applyLink()
            }}
          >
            <label className="visually-hidden" htmlFor="link-url">
              Web address
            </label>
            <input
              id="link-url"
              className="bubble__input"
              autoFocus
              placeholder="Paste a web address"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && (setLinking(false), editor.commands.focus())}
            />
            <button type="submit" className="tool">
              {url.trim() || !editor.isActive('link') ? 'Add' : 'Remove'}
            </button>
          </form>
        ) : (
          <div className="tools" role="toolbar" aria-label="Formatting">
            {tool('Heading', editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run())}
            {tool('Bold', editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), '⌘B')}
            {tool('Italic', editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), '⌘I')}
            {tool('Code', editor.isActive('code'), () => markAs('code'))}
            {tool('Infra', editor.isActive('infra'), () => markAs('infra'))}
            {tool('Wflow', editor.isActive('workflow'), () => markAs('workflow'))}
            {tool('Link', editor.isActive('link'), () => {
              setUrl(editor.getAttributes('link').href ?? '')
              setLinking(true)
            })}
          </div>
        )}
      </BubbleMenu>
      <EditorContent editor={editor} className="editor__body" />
      <div className="editor__foot">
        {readOnly ? (
          <p className="editor__meta editor__meta--end">Last saved {when(note.updated)}.</p>
        ) : (
        <p className="editor__meta editor__meta--end">
          <span className="editor__state" role="status" data-state={state}>
            {state === 'saving' ? 'Saving…' : state === 'unsaved' || offline ? 'Not saved yet: the local server is not running. Kept in this browser.' : `Saved ${when(note.updated)}`}
          </span>
          {' · '}Started {when(note.created)}.{' '}
          <button type="button" className="link small" onClick={onDelete}>
            Delete note
          </button>
        </p>
        )}
      </div>
    </div>
  )
}
