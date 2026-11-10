#!/usr/bin/env node
/* Copies the online site's study log and notes down to this machine, so the
 * local copy and anything that reads data/study-log.jsonl are up to date.
 *
 *   vercel env pull .env.local --yes
 *   node --env-file=.env.local scripts/pull-from-live.mjs
 *
 * It overwrites local files of the same name and deletes nothing. */

import { get, list } from '@vercel/blob'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

let cursor
do {
  const page = await list({ cursor })
  for (const b of page.blobs) {
    const file = b.pathname === 'study-log.jsonl' ? 'data/study-log.jsonl' : b.pathname
    const found = await get(b.pathname, { access: 'private', useCache: false })
    if (!found || found.statusCode !== 200) continue
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, Buffer.from(await new Response(found.stream).arrayBuffer()))
    console.log('  got', file)
  }
  cursor = page.hasMore ? page.cursor : undefined
} while (cursor)
console.log('Done.')
