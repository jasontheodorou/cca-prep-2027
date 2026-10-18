#!/usr/bin/env node
/**
 * Compose one contact sheet from a set of PNGs, scaled to a common height and
 * labelled.
 *
 * Human visual memory across a tab switch is roughly worthless for spacing and
 * weight. Side by side at a common height, the same decision takes seconds and
 * comes out right.
 *
 * Usage:
 *   npm run sheet -- .shots/2026-08-26_root_*.png
 *   npm run sheet -- .shots/*.png --title "Variant C · six viewports"
 *   npm run sheet -- a.png b.png --height 900 --out ~/Desktop/sheet.png
 *
 * Labels come from filenames. Shell globs are expanded before we see them, so
 * quote nothing.
 */

import { chromium } from 'playwright'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, basename } from 'node:path'
import { homedir } from 'node:os'
import { parseArgs, ROOT } from './_config.mjs'

const { positional, value } = parseArgs()

if (!positional.length) {
  console.error('Usage: npm run sheet -- <images...> [--title T] [--height 800] [--out path]')
  process.exit(1)
}

const files = positional.map((f) => resolve(ROOT, f)).filter((f) => {
  if (existsSync(f)) return true
  console.warn(`! skipping missing file: ${f}`)
  return false
})
if (!files.length) { console.error('No readable images.'); process.exit(1) }

const targetH = Number(value('height', 800))
const title = value('title', `Contact sheet · ${files.length} renders`)
const out = resolve(value('out', resolve(homedir(), 'Desktop', 'contact-sheet.png')))

const GAP = 24
const PAD = 32
const LABEL_H = 44
const PER_ROW = Number(value('perRow', Math.min(4, files.length)))

/** Read PNG intrinsic size from the IHDR chunk — no image library needed. */
function pngSize(buf) {
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

const cells = files.map((f) => {
  const buf = readFileSync(f)
  const { width, height } = pngSize(buf)
  const scale = targetH / height
  return {
    label: basename(f).replace(/\.png$/, ''),
    src: `data:image/png;base64,${buf.toString('base64')}`,
    w: Math.max(40, Math.round(width * scale)),
    h: targetH,
    native: `${width}×${height}`,
  }
})

const rows = []
for (let i = 0; i < cells.length; i += PER_ROW) rows.push(cells.slice(i, i + PER_ROW))

const rowWidth = (row) => row.reduce((a, c) => a + c.w, 0) + GAP * (row.length - 1)
const sheetW = Math.max(...rows.map(rowWidth)) + PAD * 2
const sheetH = rows.length * (targetH + LABEL_H + GAP) + PAD * 2 + 50

const html = `<!doctype html><html><head><meta charset="utf-8" /><style>
  body { margin:0; background:#F2EFE9; padding:${PAD}px;
         font-family:'Open Sans',-apple-system,'Helvetica Neue',sans-serif; }
  h1 { margin:0 0 20px; font-size:18px; letter-spacing:-.01em; color:#333; font-weight:700; }
  .row { display:flex; gap:${GAP}px; margin-bottom:${GAP}px; align-items:flex-start; }
  .cell { display:flex; flex-direction:column; }
  .cell img { display:block; background:#fff; box-shadow:0 2px 12px rgba(0,0,0,.14); }
  .label { padding:12px 2px 0; font-size:13px; font-weight:600; color:#333; }
  .native { font-weight:400; color:#8A8583; }
</style></head><body>
<h1>${title}</h1>
${rows
  .map(
    (row) => `<div class="row">${row
      .map(
        (c) => `<div class="cell">
        <img src="${c.src}" style="width:${c.w}px;height:${c.h}px" />
        <div class="label">${c.label}<br><span class="native">${c.native}</span></div>
      </div>`,
      )
      .join('')}</div>`,
  )
  .join('')}
</body></html>`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: sheetW, height: sheetH } })
await page.setContent(html, { waitUntil: 'load' })
await page.waitForTimeout(400)
await page.screenshot({ path: out, fullPage: true })
await browser.close()

console.log(`\nContact sheet (${files.length} renders) → ${out}\n`)
