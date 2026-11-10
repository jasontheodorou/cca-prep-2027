---
id: decision-018-live-site-with-gate-and-storage
type: decision
date: 2026-11-10
topic: hosting
summary: The Vercel site becomes the main copy, behind a password gate checked on the server, with the study log and notes kept in a private Vercel Blob store.
tags: [vercel, deploy, password-gate, storage, notes, study-log]
status: accepted
related: [decision-010-study-notes, decision-001-sanctum-copy-and-study-log, logbook-2026-11-10]
---

# 018 The live site gets a password gate and its own storage

## Context

Jason, 10 November 2026: "how can I get this whole thing on Vercel please. I'm tired of doing this on localhost. I want my own personal exam prep to be live as a simple vercel build, with a simple password gate". The site was already on Vercel, but public, read-only for notes, unable to save study time, and its page addresses such as /momentum returned 404.

## Options considered

- Vercel's own password protection. Rejected: a paid extra on the Pro plan.
- A password checked in the browser. Rejected: the notes and course would still be sent to anyone (see the training manual on server-side checks).
- Keep records in the GitHub repository through its API. Rejected: every saved note would be a commit and a new deployment.
- Middleware gate plus Vercel functions and a private Blob store. Chosen.

## Decision

- `middleware.ts` runs before every page, file and API call. Without the gate's cookie it sends pages to `/login` and answers API calls with 401.
- `api/login.ts` checks the password against the `SITE_PASSWORD` setting and sets an HttpOnly cookie for a year. The cookie holds an HMAC code, never the password. A wrong password waits one second.
- The password is four random words. Claude made it without showing it and saved it in the Mac Keychain as `cca-prep-2027-site-password`.
- `api/study.ts` and `api/notes.ts` offer the same API as the local dev server, so the browser code did not change. Records live in the private Blob store `cca-prep-2027-data` (London).
- `vercel.json` sends every page address to the app, which fixes the 404s.
- The study log, five notes, the word list and nine images were copied up with `scripts/push-to-live.mjs`. `scripts/pull-from-live.mjs` copies them back.

## Consequences

- The online site is the main copy. Local files go stale until pulled; nothing syncs by itself.
- Notes written online are no longer committed to git.
- A pasted image can be 4 MB at most online (15 MB locally), because of Vercel's limit on what a function is sent.
- Preview deployments use the same store as the live site.
- The notes are still built into the site as a read-only fallback, now behind the gate.
