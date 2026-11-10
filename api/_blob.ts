import { del, get, list, put } from '@vercel/blob'

/* Where the online site keeps Jason's records: a private Vercel Blob store.
 * Nothing in it has a public address; only these functions can read it.
 *   study-log.jsonl        the study log, as in data/
 *   notes/<id>.md          one note each, as in notes/
 *   notes/images/<name>    pasted screenshots
 *   notes/terms.json       the code, infra and workflow word list */

const PRIVATE = { access: 'private' as const }

/** A file's bytes, or null if there is no such file. Always the latest copy. */
export async function read(path: string) {
  const found = await get(path, { ...PRIVATE, useCache: false })
  return found && found.statusCode === 200 ? found : null
}

export async function readText(path: string): Promise<string | null> {
  const found = await read(path)
  return found ? new Response(found.stream).text() : null
}

export const write = (path: string, body: string | ArrayBuffer, contentType: string) =>
  put(path, body, { ...PRIVATE, allowOverwrite: true, addRandomSuffix: false, contentType })

export const remove = (path: string) => del(path)

/** Every file path that starts with the prefix. */
export async function paths(prefix: string): Promise<string[]> {
  const out: string[] = []
  let cursor: string | undefined
  do {
    const page = await list({ prefix, cursor })
    out.push(...page.blobs.map((b) => b.pathname))
    cursor = page.hasMore ? page.cursor : undefined
  } while (cursor)
  return out
}
