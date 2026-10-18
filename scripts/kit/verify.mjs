#!/usr/bin/env node
/**
 * The pre-flight gate. One command, one pass/fail.
 *
 * For every configured route, at every configured viewport:
 *   - console errors and uncaught page errors
 *   - horizontal scroll (the 375px bug you cannot see on a 1440px machine)
 *   - images with missing or placeholder alt text
 *   - a focusable skip link
 *
 * Exits non-zero on any failure, so it works as a pre-deploy check or in CI.
 *
 * Usage:
 *   npm run verify
 *   npm run verify -- /a /b
 *   npm run verify -- --quiet     # only report failures
 */

import { chromium } from 'playwright'
import { loadConfig, parseArgs, assertServer } from './_config.mjs'

const cfg = loadConfig()
const { positional, has } = parseArgs()
const routes = positional.length ? positional : cfg.routes
const quiet = has('quiet')

await assertServer(cfg)

const failures = []
const note = (route, vp, kind, text) => failures.push({ route, vp, kind, text })

const browser = await chromium.launch()

console.log(`\nVerifying ${routes.length} route(s) × ${cfg.viewports.length} viewport(s) at ${cfg.baseUrl}\n`)

for (const route of routes) {
  let routeClean = true

  for (const vp of cfg.viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: vp.deviceScaleFactor ?? 1,
      isMobile: vp.isMobile ?? false,
    })
    const page = await context.newPage()

    page.on('pageerror', (e) => { routeClean = false; note(route, vp.name, 'pageerror', e.message) })
    page.on('console', (m) => {
      if (m.type() === 'error') { routeClean = false; note(route, vp.name, 'console.error', m.text()) }
    })

    try {
      await page.goto(`${cfg.baseUrl}${route}`, { waitUntil: 'networkidle', timeout: 20000 })
      await page.waitForTimeout(700)
    } catch (err) {
      routeClean = false
      note(route, vp.name, 'navigation', err.message.split('\n')[0])
      await context.close()
      continue
    }

    const audit = await page.evaluate(() => {
      const de = document.documentElement
      const isClipped = (el) => {
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
          const ox = getComputedStyle(p).overflowX
          if (ox === 'auto' || ox === 'scroll' || ox === 'hidden' || ox === 'clip') return true
        }
        return false
      }
      const describe = (el) => {
        const cls = typeof el.className === 'string' ? el.className.split(/\s+/).filter(Boolean) : []
        return el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '') + (cls.length ? `.${cls.slice(0, 2).join('.')}` : '')
      }

      const offenders = []
      if (de.scrollWidth > window.innerWidth + 1) {
        for (const el of document.querySelectorAll('*')) {
          const cs = getComputedStyle(el)
          if (cs.display === 'none' || cs.visibility === 'hidden') continue
          const r = el.getBoundingClientRect()
          if (r.right - window.innerWidth > 1 && !isClipped(el)) {
            offenders.push(`${describe(el)} (+${Math.round(r.right - window.innerWidth)}px)`)
          }
        }
      }

      const PLACEHOLDER = /^(image|img|photo|picture|graphic|icon|logo|screenshot)\.?$/i
      const badAlt = []
      for (const img of document.querySelectorAll('img')) {
        const alt = img.getAttribute('alt')
        // alt="" is correct for decorative images — only flag missing or lazy alt.
        if (alt === null) badAlt.push(`<img> with no alt: ${img.currentSrc || img.src || '(no src)'}`)
        else if (alt.trim() && PLACEHOLDER.test(alt.trim())) badAlt.push(`placeholder alt "${alt}"`)
      }

      const skip = document.querySelector('.skip-link, [data-skip-link]')

      return {
        overflows: de.scrollWidth > window.innerWidth + 1,
        scrollWidth: de.scrollWidth,
        innerWidth: window.innerWidth,
        offenders: [...new Set(offenders)].slice(0, 6),
        badAlt: badAlt.slice(0, 6),
        hasSkipLink: !!skip,
      }
    })

    if (audit.overflows) {
      routeClean = false
      note(route, vp.name, 'overflow', `scrollWidth ${audit.scrollWidth} > ${audit.innerWidth}` +
        (audit.offenders.length ? ` — ${audit.offenders.join(', ')}` : ' — no unclipped offender; check body padding or a negative margin'))
    }
    for (const a of audit.badAlt) { routeClean = false; note(route, vp.name, 'alt', a) }
    if (!audit.hasSkipLink && vp === cfg.viewports[0]) {
      routeClean = false
      note(route, vp.name, 'a11y', 'no .skip-link found')
    }

    await context.close()
  }

  if (!quiet || !routeClean) console.log(`  ${routeClean ? '✓' : '✗'} ${route}`)
}

await browser.close()

if (failures.length) {
  console.log('\nFAILURES\n')
  for (const f of failures) {
    console.log(`  ✗ [${f.kind}] ${f.route} @ ${f.vp}`)
    console.log(`      ${f.text.split('\n')[0]}`)
  }
  console.log(`\n${failures.length} problem(s). Not ready to ship.\n`)
  process.exitCode = 1
} else {
  console.log('\n✓ Clean — no console errors, no horizontal scroll, alt text present, skip link found.\n')
}
