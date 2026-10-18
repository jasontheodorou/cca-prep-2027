#!/usr/bin/env node
/**
 * Screenshot routes at every viewport that matters.
 *
 * Three viewports, not one. Most layout regressions live at 390px, and a
 * development machine never renders 390px by accident.
 *
 * Usage:
 *   npm run shot                     # every route in appkit.config.json
 *   npm run shot -- /pricing         # one route
 *   npm run shot -- /pricing --full  # full page, not just the fold
 *   npm run shot -- / --reduced      # as a prefers-reduced-motion user sees it
 *   npm run shot -- / --wait 2000    # let a slow entrance settle
 *   PORT=3014 npm run shot -- /
 */

import { chromium } from 'playwright'
import { resolve } from 'node:path'
import { loadConfig, parseArgs, ensureOut, slugify, STAMP, assertServer } from './_config.mjs'

const cfg = loadConfig()
const { positional, has, value } = parseArgs()

const routes = positional.length ? positional : cfg.routes
const full = has('full')
const reduced = has('reduced')
const settle = Number(value('wait', 700))
const outDir = ensureOut(cfg)

await assertServer(cfg)

console.log(`\nShooting ${routes.length} route(s) at ${cfg.baseUrl}`)
console.log(`Output: ${cfg.outDir}/${STAMP}_*${reduced ? ' (reduced motion)' : ''}\n`)

const browser = await chromium.launch()
let failures = 0

try {
  for (const route of routes) {
    const slug = slugify(route)
    console.log(`  ${route}`)

    for (const vp of cfg.viewports) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: vp.deviceScaleFactor ?? 1,
        isMobile: vp.isMobile ?? false,
        reducedMotion: reduced ? 'reduce' : 'no-preference',
      })
      const page = await context.newPage()

      try {
        await page.goto(`${cfg.baseUrl}${route}`, { waitUntil: 'networkidle', timeout: 15000 })
      } catch (err) {
        console.error(`    ✗ ${vp.name}: ${err.message.split('\n')[0]}`)
        failures++
        await context.close()
        continue
      }

      // Let entrance animations settle before capturing.
      await page.waitForTimeout(settle)

      const name = `${STAMP}_${slug}_${vp.name}${reduced ? '_reduced' : ''}${full ? '_full' : ''}.png`
      await page.screenshot({ path: resolve(outDir, name), fullPage: full })
      console.log(`    ✓ ${vp.name.padEnd(14)} → ${name}`)
      await context.close()
    }
  }
} finally {
  await browser.close()
}

console.log(`\nDone. Open ${cfg.outDir}/ and actually look at them.\n`)
if (failures) process.exitCode = 1
