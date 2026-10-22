#!/usr/bin/env node
/* Checks the core interactions in a real browser: tab navigation, logging,
 * editing, backfilling and removing study time, ticking and unticking
 * milestones and opening course units.
 *
 * It starts its own server on port 3026 with an empty, temporary data folder,
 * so it never touches data/study-log.jsonl.
 *
 *   npm run check:flows
 *   npm run check:flows -- --shots <folder>   # also save full-page screenshots */

import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const PORT = 3026
const BASE = `http://localhost:${PORT}`
const shotsAt = process.argv.indexOf('--shots')
const SHOTS = shotsAt > -1 ? process.argv[shotsAt + 1] : null
const dir = mkdtempSync(join(tmpdir(), 'cca-flows-'))

const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
  env: { ...process.env, STUDY_DATA_DIR: dir, NOTES_DIR: join(dir, 'notes'), NOTES_COMMIT: 'off' },
  stdio: 'ignore',
})
for (let i = 0; i < 60; i++) {
  try {
    if ((await fetch(BASE)).ok) break
  } catch {}
  await new Promise((r) => setTimeout(r, 250))
}

let failed = 0
const check = (ok, text) => {
  console.log(`  ${ok ? '✓' : '✗'} ${text}`)
  if (!ok) failed++
}
const pad = (n) => String(n).padStart(2, '0')
const key = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const today = new Date()
const earlier = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3)
const study = async () => (await (await fetch(`${BASE}/api/study`)).json()).state

const browser = await chromium.launch()
const errors = []
async function open(viewport) {
  const page = await browser.newPage({ viewport })
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  return page
}
const shot = async (page, name) => {
  if (!SHOTS) return
  await page.waitForTimeout(400) // let entrances finish
  await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: true })
}
function longDay(k) {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).replace(',', '')
}

try {
  const page = await open({ width: 1440, height: 900 })

  console.log('\nTabs')
  await page.goto(BASE + '/')
  for (const [label, path] of [['Momentum', '/momentum'], ['Notes', '/notes'], ['Progress', '/progress'], ['Pet', '/pet'], ['Course', '/']]) {
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: label }).click()
    await page.waitForURL(BASE + path)
    await page.locator('h1', { hasText: label }).waitFor()
    const current = await page.locator('.tab[aria-current="page"]').textContent()
    check(current === label, `${label} opens, with its tab marked`)
  }
  check((await page.locator('.tab').count()) === 5, 'five tabs, Pet last')
  await page.getByRole('link', { name: 'exam prep, back to Course' }).click()
  await page.waitForURL(BASE + '/')
  check(true, 'the name in the header goes back to Course')

  console.log('\nCourse: little shown until asked')
  check((await page.locator('.unitrow').count()) === 0, 'no unit lists are shown at first')
  check((await page.locator('.up__title').textContent()) === 'CLAUDE.md levels', 'one "Up next" unit is shown')
  check((await page.locator('.chip').count()) === 6, 'six section chips')
  await shot(page, 'course-start')
  await page.getByRole('button', { name: 'Agents' }).click()
  check((await page.locator('.unitrow').count()) === 7, 'choosing a section shows only its 7 units')
  await page.getByRole('button', { name: 'Tools and MCP' }).click()
  check((await page.locator('.unitrow').count()) === 5, 'choosing another section swaps them')
  await page.getByRole('button', { name: 'Tools and MCP' }).click()
  check((await page.locator('.unitrow').count()) === 0, 'choosing it again hides them')

  console.log('\nUnit sheet')
  await page.getByRole('button', { name: 'Start' }).click()
  await page.waitForURL(/unit=3\.1/)
  const sheet = page.locator('dialog.sheet')
  await sheet.waitFor()
  check(await sheet.isVisible(), 'Start opens the unit in a sheet')
  check((await sheet.locator('.idea').count()) === 0 && (await sheet.locator('.tickrow').count()) === 0, 'the sheet starts with only a summary and two choices')
  await shot(page, 'sheet-start')
  await sheet.getByRole('button', { name: /Learn the ideas/ }).click()
  check((await sheet.locator('.step').textContent()) === 'Idea 1 of 4', 'ideas come one at a time')
  check(await page.evaluate(() => !!document.activeElement?.closest('dialog')), 'focus stays in the sheet')
  await shot(page, 'sheet-idea')
  for (let i = 0; i < 3; i++) await sheet.getByRole('button', { name: 'Next idea' }).click()
  check((await sheet.locator('.step').textContent()) === 'Idea 4 of 4', 'Next moves through the ideas')
  await sheet.getByRole('button', { name: 'Now tick what I can do' }).click()
  check((await sheet.locator('.tickrow').count()) === 4, 'then the four things to be able to do')
  await sheet.locator('.tickrow').first().click()
  await page.waitForTimeout(400)
  check(!!(await study()).done['3.1.1'], 'ticking saves to the study log')
  check((await sheet.locator('.tickrow[data-on]').count()) === 1, 'the tick shows')
  await shot(page, 'sheet-ticks')
  await page.keyboard.press('Escape')
  await sheet.waitFor({ state: 'detached' })
  check(!(await sheet.count()) && !page.url().includes('unit='), 'Escape closes the sheet')
  await page.goBack()
  await page.locator('dialog.sheet').waitFor()
  check(true, 'Back reopens it, because the unit is in the address')
  await page.locator('.sheet__close').click()
  await page.locator('.sheet__close').waitFor({ state: 'detached' })

  console.log('\nMomentum')
  await page.goto(BASE + '/momentum')
  check((await page.locator('.today__n').textContent()) === 'Nothing logged yet', 'today starts neutral')
  check((await page.locator('.month').count()) === 0, 'only this week shows at first')
  await page.getByRole('button', { name: '+ 30 min' }).click()
  await page.waitForTimeout(900) // the minutes count up
  check((await page.locator('.today__n').textContent()) === '30 min', 'one tap logs 30 minutes')
  await page.getByRole('button', { name: '+ 15 min' }).click()
  await page.waitForTimeout(400)
  check((await study()).effort[key(today)]?.minutes === 45, 'a second tap adds to the day')
  await page.getByRole('button', { name: 'Undo' }).click()
  await page.waitForTimeout(400)
  check((await study()).effort[key(today)]?.minutes === 30, 'Undo takes the last tap back')
  check((await page.locator(`.week .dot[aria-label^="${longDay(key(today))}"]`).getAttribute('data-studied')) !== null, 'today is green in the week')
  check(Object.keys((await study()).done).length === 1, 'logging time ticks no milestones')
  await shot(page, 'momentum-start')

  await page.getByRole('button', { name: 'Change time or add a note' }).click()
  const day = page.locator('dialog.sheet')
  await day.getByRole('button', { name: 'Add a note' }).click()
  await day.getByLabel('Note').fill('Read 3.1')
  await day.getByRole('textbox', { name: 'Minutes studied' }).fill('50')
  await shot(page, 'momentum-day')
  await day.getByRole('button', { name: 'Save' }).click()
  await page.waitForTimeout(400)
  let s = await study()
  check(s.effort[key(today)]?.minutes === 50 && s.effort[key(today)]?.note === 'Read 3.1', 'the day sheet changes time and adds a note')

  await page.getByRole('button', { name: 'Show every week to the exam' }).click()
  check((await page.locator('.month').count()) >= 6, 'every month to the exam shows on request')
  check((await page.locator('.month .dot[data-exam]').count()) === 1, 'the exam day is marked')
  await page.locator(`.month .dot[aria-label^="${longDay(key(earlier))}"]`).click()
  await page.locator('dialog.sheet').getByRole('textbox', { name: 'Minutes studied' }).fill('')
  await page.locator('dialog.sheet').getByRole('button', { name: 'Save' }).click()
  check(await page.locator('.field__error').isVisible(), 'an empty time is explained')
  await page.locator('dialog.sheet').getByRole('button', { name: '15 min' }).click()
  await page.locator('dialog.sheet').getByRole('button', { name: 'Save' }).click()
  await page.waitForTimeout(400)
  check((await study()).effort[key(earlier)]?.minutes === 15, 'an earlier day can be filled in')
  await shot(page, 'momentum-all')
  await page.locator(`.month .dot[aria-label^="${longDay(key(earlier))}"]`).click()
  await page.locator('dialog.sheet').getByRole('button', { name: 'Clear this day' }).click()
  await page.waitForTimeout(400)
  check(!(await study()).effort[key(earlier)], 'a day can be cleared')
  await page.reload()
  check((await page.locator('.today__n').textContent()) === '50 min', 'entries survive a reload')

  // Today's planned session, when the schedule has one with work in it.
  if (await page.locator('.session').count()) {
    await page.getByRole('button', { name: 'Missed', exact: true }).click()
    await page.waitForTimeout(400)
    check((await study()).sessions?.[key(today)] === 'missed', 'Missed marks the session')
    check(/does not move to another day|optional/.test(await page.locator('.session__status').textContent()), 'it says missed work is not moved')
    await page.getByRole('button', { name: 'Take back' }).click()
    await page.waitForTimeout(400)
    check(!(await study()).sessions?.[key(today)], 'Take back clears the mark')
    await page.getByRole('button', { name: "See all of today's plan" }).click()
    check(await page.locator('dialog.sheet').getByText('The job', { exact: true }).isVisible(), 'the whole day opens in a sheet')
    await page.locator('.sheet__close').click()
    await page.locator('.sheet__close').waitFor({ state: 'detached' })
    await page.getByRole('button', { name: 'Done', exact: true }).click()
    await page.waitForTimeout(400)
    s = await study()
    check(s.sessions?.[key(today)] === 'done' && s.effort[key(today)]?.minutes >= 50, 'Done marks the session and keeps the time')
    await shot(page, 'momentum-session')
  } else {
    console.log('  - no planned session today; session checks skipped')
  }

  console.log('\nNotes')
  await page.goto(BASE + '/notes')
  await page.getByRole('button', { name: 'New note' }).first().click()
  await page.locator('.prose').waitFor()
  await page.waitForTimeout(300)
  await page.keyboard.type('Hooks: a PostToolUse hook can block a refund. ')
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+b' : 'Control+b')
  await page.keyboard.type('Code beats prompts')
  await page.waitForTimeout(1500)
  const noteFiles = existsSync(join(dir, 'notes')) ? readdirSync(join(dir, 'notes')).filter((f) => f.endsWith('.md')) : []
  check(noteFiles.length === 1, 'a new note saves itself as a file')
  const noteText = noteFiles.length ? readFileSync(join(dir, 'notes', noteFiles[0]), 'utf8') : ''
  check(/\*\*Code beats prompts\*\*/.test(noteText), 'bold is kept in the file')
  check(/^tags: \[.*1\.5.*\]$/m.test(noteText), 'the note is tagged with the exam topic it covers')
  check(await page.locator('.notetag').first().isVisible(), 'the tag shows on the note')
  await page.reload()
  check((await page.locator('.prose strong').textContent()) === 'Code beats prompts', 'the note comes back after a reload')

  console.log('\nProgress')
  await page.goto(BASE + '/progress')
  check((await page.locator('.ringcard__n').textContent()).startsWith('1 of 147'), 'the ring counts the one tick')
  check((await page.locator('.unitrow').count()) === 0, 'no unit lists at first')
  check(!(await page.getByRole('button', { name: 'What does this measure?' }).isVisible()), 'explainers are hidden outside manager mode')
  await page.getByRole('switch', { name: 'Manager mode' }).click()
  check(await page.locator('.head .h1').isVisible(), 'manager mode shows the page title')
  check(!(await page.getByText('not a predicted exam score').count()), 'the explanation waits behind a link')
  await page.getByRole('button', { name: 'What does this measure?' }).click()
  check(await page.getByText('not a predicted exam score').isVisible(), 'and shows when asked')
  await page.getByRole('switch', { name: 'Manager mode' }).click()
  await page.locator('.sec__row').first().click()
  check((await page.locator('.unitrow').count()) === 6, 'a section opens to its units')
  await shot(page, 'progress')
  await page.locator('.unitrow').first().click()
  await page.locator('dialog.sheet').getByRole('button', { name: /Tick what I can do/ }).click()
  await page.locator('.tickrow').first().click()
  await page.waitForTimeout(400)
  check(!(await study()).done['3.1.1'], 'unticking from Progress takes it back')
  await page.keyboard.press('Escape')
  await page.locator('dialog.sheet').waitFor({ state: 'detached' })
  check((await page.locator('.ringcard__n').textContent()).startsWith('0 of 147'), 'the ring goes back to 0')

  console.log('\nPhone')
  const phone = await open({ width: 390, height: 844 })
  for (const path of ['/', '/momentum', '/notes', '/progress', '/pet']) {
    await phone.goto(BASE + path)
    const wide = await phone.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    check(!wide, `no sideways scroll on a phone at ${path}`)
  }
  await phone.goto(BASE + '/')
  await shot(phone, 'phone-course')
  await phone.getByRole('button', { name: 'Start' }).click()
  await phone.getByRole('button', { name: /Learn the ideas/ }).click()
  await shot(phone, 'phone-idea')
  await phone.goto(BASE + '/momentum')
  await shot(phone, 'phone-momentum')
  await phone.goto(BASE + '/pet')
  await phone.locator('shortbread-pet').waitFor()
  await shot(phone, 'phone-pet')
  await page.goto(BASE + '/pet')
  check((await page.locator('shortbread-pet').count()) === 1, 'Shortbread is on the Pet tab')
  await shot(page, 'pet')

  console.log('\nKeyboard')
  await page.goto(BASE + '/momentum')
  await page.locator('h1').waitFor() // the page must have drawn before Tab means anything
  await page.keyboard.press('Tab')
  check((await page.evaluate(() => document.activeElement?.textContent)) === 'Skip to main content', 'the first Tab reaches the skip link')

  check(errors.length === 0, `no console or page errors${errors.length ? ': ' + errors.join(' | ') : ''}`)
} catch (err) {
  console.error(err)
  failed++
} finally {
  await browser.close()
  server.kill()
  rmSync(dir, { recursive: true, force: true })
}

console.log(failed ? `\n✗ ${failed} check(s) failed\n` : '\n✓ All checks passed\n')
process.exit(failed ? 1 : 0)
