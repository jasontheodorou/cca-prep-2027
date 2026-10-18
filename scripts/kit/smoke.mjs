#!/usr/bin/env node
/**
 * Load every route and fail on any console error or uncaught page error.
 *
 * Catches the class of bug a screenshot cannot: the route still renders, but
 * React logged a key warning, a component threw inside an effect, or an image
 * 404'd. Invisible in a picture, fatal in review.
 *
 * Usage:
 *   npm run smoke                 # routes from appkit.config.json
 *   npm run smoke -- /a /b        # specific routes
 *   npm run smoke -- --warnings   # also report console warnings
 *   npm run smoke -- --net        # also report failed network requests
 */

import { chromium } from 'playwright'
import { loadConfig, parseArgs, assertServer } from './_config.mjs'

const cfg = loadConfig()
const { positional, has } = parseArgs()

const routes = positional.length ? positional : cfg.routes
const withWarnings = has('warnings')
const withNet = has('net')

await assertServer(cfg)

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()

const problems = []
let current = ''

page.on('pageerror', (e) => problems.push({ route: current, kind: 'pageerror', text: e.message }))
page.on('console', (msg) => {
  const type = msg.type()
  if (type === 'error') problems.push({ route: current, kind: 'console.error', text: msg.text() })
  else if (withWarnings && type === 'warning')
    problems.push({ route: current, kind: 'console.warn', text: msg.text() })
})
page.on('requestfailed', (req) => {
  if (withNet)
    problems.push({ route: current, kind: 'net', text: `${req.method()} ${req.url()} — ${req.failure()?.errorText}` })
})
page.on('response', (res) => {
  if (withNet && res.status() >= 400)
    problems.push({ route: current, kind: 'net', text: `${res.status()} ${res.url()}` })
})

console.log(`\nSmoke testing ${routes.length} route(s) at ${cfg.baseUrl}\n`)

for (const route of routes) {
  current = route
  const before = problems.length
  try {
    await page.goto(`${cfg.baseUrl}${route}`, { waitUntil: 'networkidle', timeout: 20000 })
    await page.waitForTimeout(600)
  } catch (err) {
    problems.push({ route, kind: 'navigation', text: err.message.split('\n')[0] })
  }
  const found = problems.length - before
  console.log(`  ${found ? '✗' : '✓'} ${route}${found ? `  (${found} problem${found > 1 ? 's' : ''})` : ''}`)
}

await browser.close()

if (problems.length) {
  console.log('\nPROBLEMS\n')
  for (const p of problems) {
    console.log(`  ✗ [${p.kind}] ${p.route}`)
    console.log(`      ${p.text.split('\n')[0]}`)
  }
  console.log('')
  process.exitCode = 1
} else {
  console.log('\nAll routes loaded clean ✓\n')
}
