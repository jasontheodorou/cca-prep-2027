---
id: decision-010-study-notes
type: decision
date: 2026-10-22
topic: notes
summary: A Study tab for notes, a minimal Notion-like editor saving Markdown files to notes/ in git, auto-tagged with exam task statements.
tags: [study, notes, editor, tiptap, markdown, git, tags]
status: accepted
related: [decision-007-recommendations-removed, decision-009-new-study-plan, logbook-2026-10-22]
---

# 010 Study: notes saved as Markdown in the repository

## Context

Jason: "lets get rid of 'recommendations' tab altogether and replace it with 'study'. This should be a Notion-like interface but very minimal. Just notes on one side, and a free text entry section on the other side." He asked for headings, free text, bold, pasted screenshots, URLs and video links, autosave with times and dates, subtle auto-tags for the exam section, everything saved to the git repo, and "a few functions of your choice". Recommendations had already been removed on 21 October (decision 007).

## Options considered

- A hand-built contentEditable editor: no new packages, but fragile with paste, images and undo.
- Tiptap (ProseMirror) with its official Markdown extension. Chosen: dependable editing, and notes stay readable Markdown in git.
- Storing notes as HTML or JSON: simpler round trip, but unreadable on GitHub. Rejected.

## Decision

- Tab order: Course, Momentum, Study, Progress, Pet.
- Packages: @tiptap/react, pm, starter-kit, markdown, extension-image, extension-youtube, extensions (all 3.32.0).
- `vite/notes.ts` serves notes (dev and preview servers only): one file per note in `notes/`, a small header (id, title, created, updated, tags) and the Markdown body; screenshots in `notes/images/`, written as relative links so they show on GitHub. Writes go to a spare file then swap in. A minute after the last change the server runs `git add -A -- notes` and `git commit -- notes`, so it commits only the notes folder and leaves anything else staged as it was. It never pushes.
- The browser keeps a draft of any note it could not save and sends it again, so a stopped server loses nothing.
- Autosave 0.8 seconds after typing stops, and at once when leaving the note or the tab. Status in the footer: "Saving…", "Saved Today, 10:25", or a plain warning when the server is not running.
- Formatting: no toolbar. Highlighting words shows a small menu with Heading, Bold, Italic and Link (changed the same day at Jason's request).
- YouTube: pasting a YouTube link, or adding one through "Link or video", gives a player; in the file it is `![video](address)` and becomes a player again when opened.
- Auto-tags (`src/lib/tags.ts`): a task statement's own number scores most; otherwise the exam's terms for it, with code-like terms (PostToolUse, custom_id) counting double; "1.5 hours" never counts. Score 2 or more, at most four. Tags show as small grey words under the note and in the list.
- Functions chosen: a new note starts from today's plan as its title; search covers titles, words and tags; clicking a tag filters the list; Delete note has Undo for 10 seconds.
- Study text is 16px or larger (Jason's eyesight), with quiet grey for tags and times.

## Consequences

- The online copy on Vercel has no server, so it cannot save notes; the page says so.
- Notes are committed but not pushed. They reach GitHub when Jason pushes.
- Checks: 18 end-to-end checks on a throwaway server (paste a screenshot, link, video, bold, heading, autosave, file contents, tags, reload, search, tag filter, delete and undo, phone width); the flow checks gained five Study checks and use a temporary notes folder with commits off; the commit was tested in a throwaway repository with another file staged, which stayed staged.
