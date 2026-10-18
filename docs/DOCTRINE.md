# App Doctrine

Everything worth carrying forward from building the RSD Playbook, Pilot 2/3, the
runbook pilot, and the layout catalogue. Rules first, reasoning second, and the
specific mistake that produced each rule third.

Read this before writing the first component in a new project. Re-read section
10 before saying "it works".

**What this is not.** This is not the brand. Colour, type, tone of voice, and
the Mantine theme live in the **Valencia** skill (`~/projects/valencia`,
`SKILL.md` + `theme.ts` + `tokens.css`). Valencia says what a Transform app
should *look* like. This file says how a Transform app should be *built* —
architecture, motion, IA, data, reliability, verification, deployment. The two
are designed to stack. Install both.

---

## 0. The stack

**Vite + React 19 + TypeScript + Mantine v7 + Framer Motion + Zod. Playwright as a dev dependency, not a test framework.**

Mantine v7 is not interchangeable. Valencia is built on Mantine's theme API —
its tokens, component overrides, and colour tuples are expressed in Mantine's
schema. Any other component library means re-implementing the brand by hand,
which means brand drift within a fortnight.

Framer Motion over CSS animation for anything stateful: it has
`useReducedMotion` built in, it composes with React's render cycle, and spring
physics are one prop rather than a keyframe table.

Zod earns its place the moment content crosses a network boundary. Below that,
it is ceremony.

Playwright is here to *look at the app*, not to assert on it. See section 10.

```
react react-dom @mantine/core @mantine/hooks @mantine/notifications
framer-motion lucide-react zod
-D vite @vitejs/plugin-react typescript oxlint playwright @types/node
```

---

## 1. Non-negotiable configuration

Four things. Remove any one and the app is visibly wrong.

```tsx
<MantineProvider theme={transformTheme} defaultColorScheme="light">
```
```css
body { background: #FAF8F6; }
```

Mantine defaults to following the OS colour scheme. On a designer's machine at
6pm that means the brand renders dark, and every colour decision made in that
session is made against the wrong ground. Pin it.

```json
// vercel.json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

Vite builds a static SPA — only `index.html` exists on disk. Without the
rewrite, every direct URL hit (a bookmark, a refresh, a link you pasted into
Slack) returns a Vercel 404. Add this *before the first deploy*, not after the
first person reports the bug. **If you add API routes later, list them above
the catch-all or they will be swallowed.**

```
<ErrorBoundary> wrapping <App />
```

See section 7.

---

## 2. Motion

**Entrance-only. Never `AnimatePresence mode="wait"` for sequential content.**

With exit and entrance both running, perceived latency is ~440ms and users
notice — they described it as "laggy" before they could say why. When moving
between slides, steps, or cards, the *new content arriving* is the signal; the
old content leaving is noise. Default to `motion.div` with `initial`/`animate`
and no `exit`.

`mode="wait"` is correct in exactly one case: when the outgoing and incoming
content occupy the same space and the transition itself carries meaning (a
card growing into a full screen). Then it is a deliberate effect, not a
default.

**Text arrives before images. Always.**

Copy at 0ms, illustration at ~120ms. A layout where the image lands first reads
as decoration with text bolted on; text-first reads as a considered page.

**Illustrations settle. Icons bounce.**

| Element | Transition | Values |
|---|---|---|
| Full-bleed illustration, photography | timed ease | `filter: blur(4px)→blur(0)` + `scale(0.97)→1`, ~400ms, `cubic-bezier(0.2, 0.8, 0.2, 1)` |
| Icon grids, diagram nodes, small tiles | spring | `stiffness: 280, damping: 20` |
| Playful stacked/rotated tiles | spring, softer | `stiffness: 150, damping: 20, mass: 0.5` |
| Card → full-screen grow | timed ease | `duration: 0.55, ease: [0.16, 1, 0.3, 1]`, `transformOrigin` set to the originating card |

Blur-to-sharp is the single highest-value motion decision in the codebase. A
plain fade or scale-up reads as a *loading state* — the user waits for it to
finish. Blur-to-sharp reads as the image *coming into focus*, which reads as
intentional. Cost: one CSS property.

**Durations are a closed set.** `fast 120ms · base 220ms · slow 360ms`. If a
transition needs a duration outside that set, it is a special effect and should
be named and commented as one.

**Every motion component calls `useReducedMotion()` and has a still fallback.**
Not a faster animation — a still one. And keep the global CSS escape hatch:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Ambient motion (Ken Burns, drift, parallax) is slow or it is nausea.** 8s
minimum, ≤1.05 scale, ≤1.5% pan. If a viewer can perceive it moving while
reading, it is too fast.

---

## 3. Layout and imagery

**Container width is fixed infrastructure. Never widen it for an image.**

A side-by-side list-plus-image layout was built and deleted because it only fit
in a wider column. When the column widened, the heading appeared to shift —
even though it was left-aligned and had not moved. Readers track the left edge
of the text column across a whole document; break that and the page feels
unstable in a way nobody can articulate but everybody flags.

If an image only fits by widening the container: pick a different image, or a
different layout. Not a different container.

**Photography of people uses `object-position: top`.**

`object-fit: cover` defaults to `center`, which decapitates people in landscape
crops. For workshop, co-design, and team photography, anchor to the top and let
the crop take from the bottom.

**Measure optical bounds, not layout bounds.**

Two adjacent "heavy" blocks (full-bleed media, tinted panels) can have a
correct computed gap and still look wrong, because shadows, blurs, and
transformed children protrude past their own `getBoundingClientRect()`. When a
seam looks wrong, measure the *optical* extent — the min/max bounds of the
element **and every descendant** — before touching the CSS. `tools/measure.mjs`
does this. Twice now, the fix was to a wrapper's footprint and not to the gap
value everyone assumed was the problem.

**Check `documentElement.scrollWidth > innerWidth` at 375px on every route.**
Horizontal scroll on mobile is invisible on a 1440px development machine and
obvious to every phone user. `tools/measure.mjs --overflow` reports the exact
offending descendants.

---

## 4. Information architecture

**Any screen whose only outcome is a single action should be deleted, and the action promoted.**

An auth-gate interstitial explained that a section required an account, then
offered two buttons. When self-registration was removed, the screen became
"here is a button that goes to the sign-in screen." The sign-in page already
explains, by existing, that authentication is required.

Apply the test literally: count the meaningful actions on the screen. If it is
one, the screen is a speed bump.

**Cut intermediate navigation before a demo. Restore it after the concept is bought.**

A module index page sat between the intake form and the module view. It added a
step without adding persuasion. Every screen before the most impressive screen
is another opportunity for the room to lose interest. Demos are edited; V2s are
complete.

**Content slides end on content. The closing card is separate and uncounted.**

A final content slide carrying a reflection exercise *and* two CTAs has three
things competing. Split it: content slides end on their content; one explicit
closing card does the transition — headline, one line of copy, one primary
action.

And exclude it from the count. `countedSlides={10}` on an 11-card deck, with
the counter, progress bar, and dot indicators all deriving from it and hiding
once `currentIndex >= countedSlides`. Showing "11 / 11" on a card the user
reads as *finished* is a small thing that breaks the whole ending.

**When a decorative element fails on first look, question the premise — don't build variant two.**

A branching SVG illustrating a binary choice was built and deleted twice. The
choice was already legible from the card layout. Structural diagrams add noise
when the IA is self-explanatory. The second build was ~3 hours spent proving
the first deletion was right.

---

## 5. Components

**Default to the framework's native control. Earn the custom one.**

Custom selection tiles were built for a form before anyone had seen them in
place, and were rejected on sight. Mantine `Select` did the same job with a
fraction of the code and none of the styling surface. Build custom only after
the native version has been used and found genuinely wanting — and then say in
a comment what it was found wanting *for*.

**Visual consistency with the adjacent screen beats fidelity to an external pattern guide.**

The GDS sign-in pattern — left-aligned, sparse, no card — was implemented and
rejected instantly, because the screen next to it was a centred card form. For
internal products with a small known audience, a user's entire sample of "what
this product looks like" is the two screens either side. Pattern libraries
assume a population of users arriving from many contexts. Internal tools do not
have that population.

**Colour-tinted groupings need seed data that exercises every tint.**

The first seed data had one tinted group per card. The component looked
*broken* — as though the colour system had never been implemented — when in
fact it worked perfectly. Seed data that does not cover every visual variant
misrepresents the component to everyone who sees it, including you.

Write seed data that makes the component look the way it was designed to look.

---

## 6. Content and data

**Content goes behind a source module from day one, even when the source is a hardcoded array.**

```
src/lib/content/
  index.ts    — the only import surface the app uses
  types.ts    — the shape
  schemas.ts  — Zod, validates anything crossing the network
  local.ts    — hardcoded fallback
  client.ts   — remote fetch, timeout, retry, validate, fail open to local
```

The whole app imports from `index.ts` and never learns where content came
from. Flipping a project from hardcoded data to a CMS then costs one env var
(`VITE_CMS_URL`) and zero component changes. Retrofitting this abstraction
later costs every component that renders content.

**Remote content fails open, never blank.**

Timeout (8s), one retry on *transport* failure only (never retry a 4xx or a
schema failure — they will fail identically), Zod-validate the response, and on
any error log it and return the local copy. A stale page is a working page. A
blank page is an outage.

**Add metadata at authoring time for filters you know are coming.**

Every content card carried a `roles` field long before role-based filtering
shipped. Cost at authoring time: seconds. Cost of retrofitting: every component
in the content path. Personalisation stayed one `.filter()` away for months.

**Never encode a first-class field in a string you happen to already have.**

Deriving a user's role from their email prefix (`servicedesigner@demo.com`)
worked for two demo accounts, and it is written down here as a warning rather
than a pattern. It is fragile by construction and must not survive into
anything with real users. If a thing is a field, make it a field.

**Draft/preview content never reaches production.** Gate on
`import.meta.env.PROD` before reading `?draft=true` out of the URL, so a
production origin cannot be talked into serving unpublished content by anyone
who can type a query string.

---

## 7. Reliability

**One logging sink. Every unexpected error reaches it. Nothing is swallowed.**

```ts
// src/lib/log.ts
export function logError(err: unknown, context: Record<string, unknown> = {}): void
```

Console today; Sentry, Logtail, or Vercel observability tomorrow, by editing one
file. The value is not the console call — it is that there is exactly one place
to change.

**An `ErrorBoundary` wraps the app, shows a human sentence and a "Try again" button, and prints the stack in DEV only.**

An unhandled render error in React 19 unmounts the tree. The user sees white.
White is indistinguishable from a broken deploy, and that is the report you get.

**Every `localStorage` call is wrapped.**

`localStorage` throws in Safari private browsing and when a quota is hit. An
unwrapped `getItem` in a state initialiser takes the entire app to white screen
for a user whose only sin was opening a private window. Wrap get/set/remove,
log, and return `null`.

**Typed errors at boundaries.** A `DataError` carrying
`code: 'timeout' | 'network' | 'http' | 'schema' | 'unknown'` lets the caller
decide what is retryable without parsing message strings.

---

## 8. Accessibility

- A skip link is the first focusable element on every page.
- `*:focus-visible { outline: 2px solid #213D59; outline-offset: 2px; }` — never
  `outline: none` without a replacement of at least equal visibility.
- On glass/blurred surfaces the focus ring switches to orange at 3px — the navy
  ring disappears against `backdrop-filter`. This is the **only** structural use
  of orange in the system (see Valencia: orange is circles and one headline rule).
- Muted greys (`#8A8583`, `#C9C7C5`) are cleared for **≥13px only**.
- Decorative motion respects `prefers-reduced-motion` at both the component and
  the global-CSS level. Belt and braces, because component-level gets forgotten.
- Every image gets real alt text at the point of authoring. Alt text written
  later is alt text written badly.

---

## 9. Deployment and sharing

**Link previews are part of the deliverable.**

The first thing that happens to an internal tool is that someone pastes the URL
into Slack or Teams. A bare `<title>rsd-scaffold</title>` and no card is what
your stakeholders see before they see the work. Ship OG tags and a 1200×630
card with the first deploy.

**Crawlers do not resolve relative `og:image`.** It needs an absolute origin,
which the build knows and the source does not. Put `%SITE_URL%` in `index.html`
and substitute at build time with a tiny Vite plugin
(`vite/site-url.ts`), resolving `SITE_URL` → `VERCEL_PROJECT_PRODUCTION_URL` →
localhost. Preview deploys point their card at the production origin
deliberately: the image is identical and production never 404s.

**Generate the card, don't design it by hand.** `tools/og.mjs` renders HTML in
Playwright and screenshots it at 1200×630. Retitling is a flag, not a Figma
round trip. `--shot` insets a live screenshot of the running app.

**Check `git config user.email` before the first commit on a new machine.**

Vercel refuses to build a commit whose author lacks access to the hosting team.
The failure mode is quiet and expensive: GitHub accepts the push, the deploy
fails, and production silently stays on the previous commit. If a repo needs a
specific identity, set it repo-local and write it in the project's `CLAUDE.md`.

**Keep unlisted review pages out of search.** `public/robots.txt` with a
`Disallow` per review route. Any route reachable without auth will eventually
be indexed.

---

## 10. Verification — never eyeball, never assume

This is the section that separates this kit from a starter template.

**One command is the gate.**

```
npm run verify
```

Every route × every viewport: console errors, uncaught page errors, horizontal
scroll, missing or placeholder alt text, a focusable skip link. Exits non-zero,
so it works as a pre-deploy check and in CI. If this fails, nothing else in
this section matters yet.

**Look at the app at three viewports before saying it works.**

```
npm run shot -- /route           # 1440 · 1280 · 390, into .shots/
npm run shot -- /route --full    # full-page
```

Not one screenshot. Three. Most layout regressions live at 390px, and the
development machine never renders 390px by accident.

**Smoke every route for console errors after any structural change.**

```
npm run smoke
```

Routes come from `appkit.config.json`. It fails the exit code on any
`pageerror` or `console.error`. This catches the class of bug where a route
still renders but React logged a key warning or a component threw inside an
effect — invisible to a screenshot, fatal in review.

**Measure before you fix a spacing or overflow bug.**

```
npm run measure -- /route --overflow
npm run measure -- /route --gap ".block-a" ".block-b"
```

The instinct is to nudge a margin and re-look. That loop is slow and it lies —
adjacent changes mask each other. Get the numbers: layout bounds, optical
bounds (element *plus every descendant*), the delta between them, and any
descendant protruding past the viewport.

**Compare variants on a contact sheet, not by flipping tabs.**

```
npm run sheet -- .shots/2026-08-26_route_*.png
```

Human visual memory across a tab switch is roughly worthless for spacing and
weight. Side by side at a common height, decisions take seconds and are right.

**A screenshot is evidence. A description of a screenshot is not.** If a change
is visual, capture it and look at the file before reporting the change as done.

---

## 11. Journaling

Record the decision *and the rejected alternative and why it was rejected*.
Every rule in this document exists because a journal entry captured a deletion.
"We use Mantine Select" is worth nothing in six months. "We built custom tiles,
they were rejected on sight, Select did it in a fraction of the code" is worth
this entire section 5.

Capture failures deliberately. The highest-value entries in the RSD journal are
the two SVG diagrams that were built and deleted, and they are the ones that
would never have been written down without a rule saying to write them down.

---

## Pre-flight checklist

Before the first deploy:

- [ ] `defaultColorScheme="light"` on `MantineProvider`
- [ ] `body { background: #FAF8F6 }` in global CSS
- [ ] `vercel.json` catch-all rewrite present (API routes listed above it)
- [ ] `<ErrorBoundary>` wraps `<App />`
- [ ] Every `localStorage` call wrapped
- [ ] Real `<title>`, description, OG tags, and a generated `og.png`
- [ ] `git config user.email` is the identity the host expects
- [ ] `robots.txt` disallows unlisted review routes
- [ ] Skip link present and first in focus order
- [ ] `npm run verify` passes (console, overflow, alt text, skip link)
- [ ] `npm run shot` reviewed at 1440 / 1280 / 390 — actually looked at
- [ ] `prefers-reduced-motion` honoured — verified with `npm run shot -- --reduced`

Before saying "done" on any visual change:

- [ ] Screenshot captured and actually looked at
- [ ] Checked at 390px
- [ ] `npm run verify` passes
