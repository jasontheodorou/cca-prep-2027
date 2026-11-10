---
id: decision-015-shareable-app-separate-project
type: decision
date: 2026-11-02
topic: sharing
summary: Why the shareable version for colleagues became a separate project, cca-prep-engine, and why cca-prep-2027 stays Jason's personal study site.
tags: [sharing, cca-prep-engine, vercel, password, claude-api, privacy]
status: accepted
related: [decision-001-sanctum-copy-and-study-log, decision-010-study-notes, decision-004-white-geist-pet, logbook-2026-11-02]
---

# 015 The shareable app is a separate project; this one stays personal

## Context

Jason's organisation showed interest in "turning it into an app that anyone can use to take this exam" (session begun 29 October 2026). cca-prep-2027 assumes one person on one laptop. Notes commit to git, progress is in one browser and a log file, the schedule is hand-written for one exam date, and the history holds Jason's notes. Jason wanted "just a lil helper", not "enterprise grade", working for any Claude exam, that he could share with a link.

## Options considered

- Convert cca-prep-2027 in place. Rejected: Jason's notes, study log and journal are in its git history, and his own study would be disrupted.
- Organisation-grade product with work sign-in and a shared database. Rejected for now: several weeks of work, plus hosting, privacy and accessibility reviews.
- A new repository copied from this app's code, with no notes, log or history, and everything stored in each person's browser. Chosen.

## Decision

- New project at `~/projects/cca-prep-engine`, with its own journal in `.vellum/`. Its detailed decisions (Claude patches a rule-built plan; browser storage and the password gate; a Today tab) live there.
- Jason hosts one copy on Vercel, sets one shared password and the Claude key once, and shares the link.
- A cloned copy runs with one install command; with no password the gate is off, and with no key the plan is built by rules alone.
- Shortbread stays, at Jason's request.
- cca-prep-2027 is unchanged and remains Jason's own site.

## Why

A fresh repository is the only sure way to keep personal notes out of what colleagues see. Browser storage needs no server, database or set-up. The password is checked on the server because it guards the Claude key: a browser-only check can be skipped.

## Consequences

- Two copies of the same code now drift apart. Fixes made in cca-prep-engine do not reach this site unless copied by hand.
- Each colleague's notes live in one browser only; a lost browser means lost work without a backup file.
- Every plan built or changed is charged to Jason's key. Jason was not worried: "We have so much juice on the API key."
- One shared password: changing it means telling everyone again.
- Personal files reached the new repository's early commits during clean-up, so it needs a fresh history before it is published.
- Whether the exam content may rely on claudecertificationguide.com and the exam guide publicly is still undecided.
- The review raised that the live cca-prep-2027 site has no password, so Jason's notes are public to anyone with the address. Not acted on.

## Checks

- At Jason's mid-session check, cca-prep-engine had 288 passing tests and clean type checks; the Vercel functions passed a build check.
- The real Claude API was never called. All Claude features were tested against a stand-in.
