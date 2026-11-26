---
id: training-manual
type: manual
date: 2026-04-19
topic: knowledge-base
summary: Lessons from this project that apply elsewhere, on CSS animation names, 3D flicker, deploy identity, changing Vercel settings, sharing a personal app safely, uv, pip and the Keychain on a locked-down Mac, rich-text editor pitfalls, API key protection, prompt caching and multi-agent design.
tags: [lessons, insights, techniques, patterns]
status: accepted
related: [logbook-2026-11-11, decision-015-shareable-app-separate-project, decision-008-study-rewards, decision-013-infra-bar-shortcut, experiment-2026-10-22-shortbread-face-flicker, logbook-2026-10-22, logbook-2026-10-26, logbook-2026-10-28, exp-2026-10-28-stage3-unsourced-fact, exp-2026-10-28-stage2-missing-fusion]
---

# Training Manual — cca-prep-2027

A codified knowledge base for designers joining this project or anyone at Transform UK building related tooling. Written incrementally as the project unfolds. The goal: a new designer should be able to pick up the craft from this document without reading the logbook.

## How to read this manual

Entries fall into four shapes. The shape tells you how to use it:

- **Lesson** — a principle learned the hard way (or near-miss prevented). If you take nothing else from an entry, take this.
- **Insight** — a conceptual framing that unlocks a problem. Often short; the value is in the reframe, not the length.
- **Technique** — a how-to. Step-by-step, or a decision heuristic.
- **Pattern** — a reusable structural template. Architectural, or about how to model a kind of problem.

Each entry is timeless: it should still make sense without the context of the session it came from. Entries are grouped by **topic**. New entries are added to an existing topic where possible; new topics appear only when genuinely new ground is covered.

---

## CSS and animation

### Lesson: Give new CSS animations a unique prefix so they cannot replace old ones

A `@keyframes` name is global. A second `@keyframes rise` later in the stylesheet silently replaces the first everywhere it is used. Here, a new reward animation reused `rise`, ended on white text, and blanked every course card and sheet title. Prefix each new set of animations (here `dl-`) and search for `@keyframes <name>` before adding one. The sign you got it wrong: text or shapes vanish, or move oddly, in places you did not touch.

From decision-008-study-rewards.

## 3D graphics

### Technique: Give each overlapping layer its own depth offset, and test flicker on a real screen

When small shapes sit on a 3D surface (eyes on a face), the graphics card cannot decide which is in front, and they flicker as the model moves. Push the surface behind back with a polygon offset and narrow the camera's near and far range. If three layers overlap, each needs a different offset: two layers pushed back by the same amount still fight each other. Headless test browsers often draw in software and never show this flicker, so a clean screenshot there proves nothing. Ask for a screenshot from the real device.

From experiment-2026-10-22-shortbread-face-flicker.

## Shipping

### Lesson: Check the commit email before the first push to a Vercel-hosted personal repo

Vercel decides who is deploying from the commit author's email. On a work laptop the default email belongs to a different GitHub account. On Vercel's free Hobby plan that account cannot deploy a private project, so the push succeeds but the deploy is blocked. Set the repository's own `user.email` before the first commit. If a deploy is already blocked, add a correctly authored commit on top; do not rewrite `main`.

From logbook-2026-10-22.

### Lesson: To share a personal app, start a new repository and leave personal files out of the first commit

Deleting notes, logs or journals from a copied project later does not remove them: they stay in the git history, and anyone who clones can read them. Copy only the code into a new, empty repository, excluding personal folders, before the first commit. If personal files did get committed, publish with a fresh history. The sign you got it wrong: `git log --all -- notes/` returns anything in the shared repository.

From decision-015-shareable-app-separate-project.

### Lesson: After changing a Vercel setting, check its "created" time and redeploy

An environment variable is a named setting, such as a password, that Vercel hands to the site when it builds. Two things go wrong when you change one. First, `vercel env add NAME --force` can print nothing and leave the old value in place. Remove the setting with `vercel env rm` and add it again, then run `vercel env ls` and check that "created" shows a few seconds ago. Second, a running site keeps the value it was built with, so redeploy. Then test the real thing: here, a sign-in with the new password and one with the old. The sign you got it wrong: the old password still works on the live site.

From logbook-2026-11-11.

## Development environment

### Technique: Update a Mac Keychain item with the same service and account, or you get a second item

`security add-generic-password -U` only updates an item when both the service name (`-s`) and the account name (`-a`) match the existing one. With a different account it quietly creates a second item, and `security find-generic-password -s NAME -w` may then return either. Before updating, read the existing item's account with `security find-generic-password -s NAME` (no `-w`) and reuse it. The sign you got it wrong: a script reads back the old secret straight after you "changed" it.

From logbook-2026-11-11.

### Lesson: On a Netskope-managed Mac, add --system-certs when uv fails to download

Netskope, the work security software, inspects web traffic by swapping in its own certificate. `uv` trusts only its own built-in certificate list by default, so downloads fail with "invalid peer certificate: UnknownIssuer". Add `--system-certs` (older versions call it `--native-tls`) so `uv` trusts the Mac's own certificates, which include Netskope's. Use `uv` instead of `pip` here as well: the built-in Python is 3.9 and there are no admin rights, while `uv` gives each project its own Python. The sign you got it wrong: a `uv` command fails with "client error (Connect)" while the browser loads the same site fine.

From logbook-2026-10-26.

### Technique: Install into a uv-managed Python with --user, or better, inside a uv project

When `python3` points at a Python that `uv` installed, `python3 -m pip install X` is refused with "externally managed". `python3 -m pip install --user --break-system-packages X` installs into `~/Library/Python/3.x` and leaves `uv`'s files alone. For course or project code, prefer `uv add X` inside a project folder, which keeps each project separate. The sign you got it wrong: `pip3 install` succeeds but `import X` fails, because `pip3` still belongs to the old Apple Python.

From logbook-2026-10-26.

## Rich-text editors

### Lesson: After changing editor plugins, reload the page; hot reload does not rebuild an open editor

Vite's hot reload swaps in new code, but a TipTap or ProseMirror editor that is already open keeps the plugins it was built with. So a new highlight or input rule works in a fresh browser and "does not work" in the user's open tab. Here it happened twice in one day (EXAM TRAP colour, the | shortcut). Test in a fresh page, then ask the user to reload. Do not force a reload, because it can lose text typed since the last autosave. The sign you got it wrong: the saved file shows the old behaviour, such as a bar still in the text.

From decision-013-infra-bar-shortcut.

### Lesson: Count line breaks when mapping matched text back to editor positions

ProseMirror's `textContent` leaves out inline nodes such as a Shift+Enter line break, but each one still takes a position in the document. Matching a word in `textContent` and adding the offset to the block start then lands one place early for every break before it. Build the search text with one stand-in character per inline node. The sign you got it wrong: a highlight starts a letter early and stops a letter short, here "EXAM TRA" without the P.

From logbook-2026-10-26.

## Claude API

### Insight: Prompt caching rewards an identical start, not shorter wording

The API is stateless. Every call resends the whole conversation, so turn 20 pays again for turns 1 to 19. Prompt caching cuts that cost by charging about a tenth of the price for the part at the start of a request that exactly matches a recent one. So put the parts that never change first (instructions, tool list, reference documents) and the new question last. Keep anything that changes, such as today's date, out of the early part. Squeezing instructions into symbols does not help caching: symbols often take more tokens, and Claude follows plain English more reliably. The sign you got it wrong: cache reads stay near zero because something near the top changes on every call.

From logbook-2026-10-26.

### Lesson: Scope ANTHROPIC_API_KEY to the project that needs it, or Claude Code bills the key

Claude Code uses `ANTHROPIC_API_KEY` from the environment ahead of a claude.ai subscription login. So a key exported in `~/.zshrc` for course code also makes every Claude Code session pay per use. A subscription does not cover calls from your own SDK code, so that code still needs a key. Load the key only where the code runs, such as a `.env` file read by the script or a per-folder environment tool, and keep it out of the shell start-up file. Setup scripts that rewrite `~/.zshrc` can put a removed line back. The sign you got it wrong: `/status` in Claude Code lists an API key instead of your claude.ai account.

From logbook-2026-10-26.

### Lesson: A password that protects an API key must be checked on the server

If a hosted app calls Claude with the owner's key, anyone who reaches the server function can spend that money. A password checked only in the browser can be skipped by calling the function directly. Check it in the server function, keep the key there, and add a spending limit in the Claude Console as a backstop. The sign you got it wrong: the API route answers a request sent with `curl` and no password.

From decision-015-shareable-app-separate-project.

## Agent design

### Lesson: Give an agent's output format a place for doubts, or they leak into the data

A careful agent will always want to report what it could not find or does not trust. Claude does this by default and you cannot switch it off, so you do not need to predict the exact note, only to plan a place for it. If the output format only has room for findings, it squeezes those notes in as findings, and they show up as "facts" with no source. Add a separate field, such as a `gaps` list, and say that notes go there. Also give each subagent its format in one place only: a coordinator that restates the format in its own words can contradict the subagent's instructions. Run a small test on fake data before trusting the format. The sign you got it wrong: an "unsourced fact" that reads like a comment about the research.

From logbook-2026-10-28 and exp-2026-10-28-stage3-unsourced-fact.

### Lesson: When a multi-agent report misses a topic, check the coordinator's split first

Subagents only research what they are handed. If a coordinator splits a task into a capped number of subtopics, it can spend slots on side topics and leave out a required one, and no subagent will ever look at it. Fix the split, for example by naming each required item in the coordinator's prompt and raising the cap, before changing any subagent. The sign you got it wrong: every section that exists is good, but one required section is missing entirely.

From exp-2026-10-28-stage2-missing-fusion.
