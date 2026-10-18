#!/usr/bin/env node
/**
 * Measure the page instead of squinting at it.
 *
 * The instinct when spacing looks wrong is to nudge a margin and re-look. That
 * loop is slow and it lies — adjacent changes mask each other, and elements
 * routinely extend past their own bounding box via shadows, blurs and
 * transformed children. Get the numbers first.
 *
 * Usage:
 *   npm run measure -- /route --overflow
 *       Horizontal-scroll check at every viewport, plus the exact descendants
 *       protruding past the viewport width.
 *
 *   npm run measure -- /route --gap ".block-a" ".block-b"
 *       Layout gap AND optical gap between two elements, with the overhang
 *       each side contributes.
 *
 *   npm run measure -- /route --rect ".hero" ".card"
 *       Layout rect vs optical rect (element + every descendant + shadow
 *       extent) for each selector.
 *
 * Options:
 *   --vp 375            only this viewport width (default: all configured)
 *   --wait 1200         settle time before measuring
 *   --click ".next" 14  click a selector N times first (deep-linking into decks)
 *   --json              machine-readable output, for before/after diffing
 */

import { chromium } from 'playwright'
import { loadConfig, parseArgs, assertServer } from './_config.mjs'

const cfg = loadConfig()
const { positional, has, value, list } = parseArgs()

const route = positional[0] ?? '/'
const settle = Number(value('wait', 1000))
const asJson = has('json')
const onlyVp = value('vp', null)
const gapSels = list('gap')
const rectSels = list('rect')
const clickArgs = list('click')
const doOverflow = has('overflow') || (!gapSels.length && !rectSels.length)

const viewports = onlyVp
  ? [{ name: `w${onlyVp}`, width: Number(onlyVp), height: 2400 }]
  : cfg.viewports.map((v) => ({ ...v, height: Math.max(v.height, 2000) }))

await assertServer(cfg)

// ---------------------------------------------------------------- in-page

/** Injected into the page. Optical bounds = element + descendants + shadows. */
const PAGE_HELPERS = () => {
  // @ts-nocheck
  window.__kit = {
    shadowExtent(el) {
      const cs = getComputedStyle(el)
      const raw = cs.boxShadow
      if (!raw || raw === 'none') return { top: 0, right: 0, bottom: 0, left: 0 }
      // Split on top-level commas only (colours contain commas).
      const parts = []
      let depth = 0
      let buf = ''
      for (const ch of raw) {
        if (ch === '(') depth++
        if (ch === ')') depth--
        if (ch === ',' && depth === 0) { parts.push(buf); buf = '' } else buf += ch
      }
      if (buf.trim()) parts.push(buf)

      const ext = { top: 0, right: 0, bottom: 0, left: 0 }
      for (const p of parts) {
        if (p.includes('inset')) continue
        const nums = (p.match(/-?[\d.]+px/g) || []).map(parseFloat)
        const [ox = 0, oy = 0, blur = 0, spread = 0] = nums
        const reach = blur + spread
        ext.left = Math.max(ext.left, reach - ox)
        ext.right = Math.max(ext.right, reach + ox)
        ext.top = Math.max(ext.top, reach - oy)
        ext.bottom = Math.max(ext.bottom, reach + oy)
      }
      return ext
    },

    optical(el) {
      const nodes = [el, ...el.querySelectorAll('*')]
      let top = Infinity, bottom = -Infinity, left = Infinity, right = -Infinity
      for (const n of nodes) {
        const cs = getComputedStyle(n)
        if (cs.display === 'none' || cs.visibility === 'hidden') continue
        const r = n.getBoundingClientRect()
        if (!r.width && !r.height) continue
        const s = window.__kit.shadowExtent(n)
        top = Math.min(top, r.top - s.top)
        bottom = Math.max(bottom, r.bottom + s.bottom)
        left = Math.min(left, r.left - s.left)
        right = Math.max(right, r.right + s.right)
      }
      return { top, bottom, left, right }
    },

    describe(el) {
      const cls = typeof el.className === 'string' ? el.className.split(/\s+/).filter(Boolean) : []
      return el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '') + (cls.length ? `.${cls.slice(0, 3).join('.')}` : '')
    },
  }
}

// ------------------------------------------------------------------ probes

async function probeOverflow(page) {
  return page.evaluate(() => {
    const de = document.documentElement
    const vw = window.innerWidth

    // An element inside a clipping or scrolling ancestor is allowed to extend
    // past the viewport — that is what carousels, tab strips and code blocks
    // do on purpose. Only unclipped elements can push the page sideways.
    const isClipped = (el) => {
      for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
        const ox = getComputedStyle(p).overflowX
        if (ox === 'auto' || ox === 'scroll' || ox === 'hidden' || ox === 'clip') return true
      }
      return false
    }

    const offenders = []
    for (const el of document.querySelectorAll('*')) {
      const cs = getComputedStyle(el)
      if (cs.display === 'none' || cs.visibility === 'hidden') continue
      const r = el.getBoundingClientRect()
      if (!r.width && !r.height) continue
      const over = Math.round(r.right - vw)
      if (over > 1 && !isClipped(el)) {
        offenders.push({ el: window.__kit.describe(el), right: Math.round(r.right), over })
      }
    }
    // Deepest/worst first, deduped by description.
    const seen = new Set()
    const unique = offenders
      .sort((a, b) => b.over - a.over)
      .filter((o) => (seen.has(o.el) ? false : (seen.add(o.el), true)))
    return {
      scrollWidth: de.scrollWidth,
      innerWidth: vw,
      overflows: de.scrollWidth > vw + 1,
      offenders: unique.slice(0, 12),
    }
  })
}

async function probeGap(page, a, b) {
  return page.evaluate(([selA, selB]) => {
    const ea = document.querySelector(selA)
    const eb = document.querySelector(selB)
    if (!ea || !eb) return { error: `not found: ${!ea ? selA : selB}` }
    const ra = ea.getBoundingClientRect()
    const rb = eb.getBoundingClientRect()
    const oa = window.__kit.optical(ea)
    const ob = window.__kit.optical(eb)
    const round = (n) => Math.round(n * 10) / 10
    return {
      prev: { layoutBottom: round(ra.bottom), opticalBottom: round(oa.bottom), overhang: round(oa.bottom - ra.bottom) },
      next: { layoutTop: round(rb.top), opticalTop: round(ob.top), overhang: round(rb.top - ob.top) },
      layoutGap: round(rb.top - ra.bottom),
      opticalGap: round(ob.top - oa.bottom),
    }
  }, [a, b])
}

async function probeRect(page, sel) {
  return page.evaluate((s) => {
    const el = document.querySelector(s)
    if (!el) return { error: `not found: ${s}` }
    const r = el.getBoundingClientRect()
    const o = window.__kit.optical(el)
    const round = (n) => Math.round(n * 10) / 10
    return {
      layout: { top: round(r.top), right: round(r.right), bottom: round(r.bottom), left: round(r.left), w: round(r.width), h: round(r.height) },
      optical: { top: round(o.top), right: round(o.right), bottom: round(o.bottom), left: round(o.left) },
      overhang: { top: round(r.top - o.top), right: round(o.right - r.right), bottom: round(o.bottom - r.bottom), left: round(r.left - o.left) },
    }
  }, sel)
}

// -------------------------------------------------------------------- run

const browser = await chromium.launch()
const results = {}

for (const vp of viewports) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    isMobile: vp.isMobile ?? false,
  })
  const page = await context.newPage()
  await page.addInitScript(PAGE_HELPERS)
  await page.goto(`${cfg.baseUrl}${route}`, { waitUntil: 'networkidle', timeout: 20000 })

  if (clickArgs.length) {
    const [sel, n = '1'] = clickArgs
    for (let i = 0; i < Number(n); i++) {
      await page.waitForSelector(sel, { state: 'visible', timeout: 5000 })
      await page.click(sel)
      await page.waitForTimeout(400)
    }
  }

  await page.waitForTimeout(settle)

  const out = {}
  if (doOverflow) out.overflow = await probeOverflow(page)
  if (gapSels.length >= 2) out.gap = await probeGap(page, gapSels[0], gapSels[1])
  if (rectSels.length) {
    out.rects = {}
    for (const sel of rectSels) out.rects[sel] = await probeRect(page, sel)
  }
  results[`${vp.width}`] = out

  await context.close()
}
await browser.close()

// ----------------------------------------------------------------- report

if (asJson) {
  console.log(JSON.stringify({ route, results }, null, 2))
} else {
  console.log(`\n${route}  ·  ${cfg.baseUrl}\n`)
  for (const [width, out] of Object.entries(results)) {
    console.log(`── ${width}px ──────────────────────────────────`)

    if (out.overflow) {
      const o = out.overflow
      console.log(
        `  horizontal scroll: ${o.overflows ? `✗ YES  scrollWidth ${o.scrollWidth} > ${o.innerWidth}` : '✓ none'}`,
      )
      // Offenders are only meaningful when the page actually scrolls — an
      // unclipped element can still sit past the fold without causing it.
      if (o.overflows) {
        for (const off of o.offenders) console.log(`      +${off.over}px  ${off.el}`)
        if (!o.offenders.length) {
          console.log('      (no unclipped offender — check body/html padding or a negative margin)')
        }
      }
    }

    if (out.gap) {
      const g = out.gap
      if (g.error) console.log(`  gap: ✗ ${g.error}`)
      else {
        console.log(`  layout gap   ${g.layoutGap}px`)
        console.log(`  optical gap  ${g.opticalGap}px   ${g.opticalGap < g.layoutGap ? '(tighter than it computes)' : ''}`)
        console.log(`    prev overhangs below its box by ${g.prev.overhang}px`)
        console.log(`    next overhangs above its box by ${g.next.overhang}px`)
      }
    }

    if (out.rects) {
      for (const [sel, r] of Object.entries(out.rects)) {
        if (r.error) { console.log(`  ${sel}: ✗ ${r.error}`); continue }
        console.log(`  ${sel}`)
        console.log(`    layout   ${r.layout.w} × ${r.layout.h}  @ ${r.layout.left},${r.layout.top}`)
        console.log(`    overhang t${r.overhang.top} r${r.overhang.right} b${r.overhang.bottom} l${r.overhang.left}`)
      }
    }
    console.log('')
  }
}

const anyOverflow = Object.values(results).some((r) => r.overflow?.overflows)
if (anyOverflow) process.exitCode = 1
