#!/usr/bin/env node
/* Copies this machine's study log and notes up to the online site's private
 * store. Run once when moving from localhost to Vercel, or again to replace
 * what is online with what is here.
 *
 *   vercel env pull .env.local --yes
 *   node --env-file=.env.local scripts/push-to-live.mjs
 *
 * It overwrites files of the same name online and deletes nothing. */

import { put } from '@vercel/blob'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { extname, join } from 'node:path'

const TYPES = { '.md': 'text/markdown; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp' }
const send = (path, file, contentType) =>
  put(path, readFileSync(file), { access: 'private', allowOverwrite: true, addRandomSuffix: false, contentType }).then(() => console.log('  sent', path))

if (existsSync('data/study-log.jsonl')) await send('study-log.jsonl', 'data/study-log.jsonl', 'application/x-ndjson')
for (const f of readdirSync('notes')) {
  if (f === 'README.md') continue
  if (f.endsWith('.md') || f === 'terms.json') await send(`notes/${f}`, join('notes', f), TYPES[extname(f)])
}
if (existsSync('notes/images')) {
  for (const f of readdirSync('notes/images')) {
    const type = TYPES[extname(f)]
    if (type) await send(`notes/images/${f}`, join('notes/images', f), type)
  }
}
console.log('Done.')
