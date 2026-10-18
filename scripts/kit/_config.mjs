/**
 * Shared config loader for the app-kit tools.
 *
 * Reads appkit.config.json from the project root. Every field is optional —
 * the defaults are the ones that were right on every project so far.
 */

import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve, dirname, parse } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Project root = nearest ancestor with a package.json.
 *
 * The tools live at <project>/scripts/kit/, so a fixed number of `..` hops is
 * wrong. npm run always sets cwd to the package root, so try that first, then
 * climb from the script itself for direct `node scripts/kit/...` invocations
 * from a subdirectory.
 */
function climbToPackage(start) {
  let dir = start
  const { root } = parse(dir)
  while (true) {
    if (existsSync(resolve(dir, 'package.json'))) return dir
    if (dir === root) return null
    dir = dirname(dir)
  }
}

export const ROOT =
  climbToPackage(process.cwd()) ||
  climbToPackage(dirname(fileURLToPath(import.meta.url))) ||
  process.cwd()

const DEFAULTS = {
  port: 5173,
  routes: ['/'],
  outDir: '.shots',
  viewports: [
    { name: 'desktop-1440', width: 1440, height: 900 },
    { name: 'laptop-1280', width: 1280, height: 800 },
    { name: 'mobile-390', width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 },
  ],
  og: {
    title: 'Untitled',
    tagline: '',
    eyebrow: 'TRANSFORM',
    out: 'public/og.png',
  },
}

export function loadConfig() {
  const path = resolve(ROOT, 'appkit.config.json')
  let file = {}
  if (existsSync(path)) {
    try {
      file = JSON.parse(readFileSync(path, 'utf8'))
    } catch (err) {
      console.error(`! appkit.config.json is not valid JSON — using defaults.\n  ${err.message}`)
    }
  }
  const cfg = { ...DEFAULTS, ...file, og: { ...DEFAULTS.og, ...(file.og ?? {}) } }
  cfg.port = process.env.PORT || cfg.port
  cfg.baseUrl = process.env.BASE_URL || `http://localhost:${cfg.port}`
  return cfg
}

/** Positional args (non-flags) and flag helpers. */
export function parseArgs(argv = process.argv.slice(2)) {
  const positional = argv.filter((a) => !a.startsWith('--'))
  const has = (name) => argv.includes(`--${name}`)
  const value = (name, fallback) => {
    const i = argv.indexOf(`--${name}`)
    return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : fallback
  }
  /** All values following --name, up to the next flag. */
  const list = (name) => {
    const i = argv.indexOf(`--${name}`)
    if (i === -1) return []
    const out = []
    for (let j = i + 1; j < argv.length && !argv[j].startsWith('--'); j++) out.push(argv[j])
    return out
  }
  return { argv, positional, has, value, list }
}

export function ensureOut(cfg) {
  const dir = resolve(ROOT, cfg.outDir)
  mkdirSync(dir, { recursive: true })
  return dir
}

export function slugify(path) {
  return path.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'root'
}

/** Timestamp for filenames. Stable within one run. */
export const STAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)

/** Fail with a useful message when the dev server isn't up. */
export async function assertServer(cfg) {
  try {
    await fetch(cfg.baseUrl, { method: 'HEAD' })
  } catch {
    console.error(
      `\n✗ Nothing responding at ${cfg.baseUrl}\n` +
        `  Start the dev server first (npm run dev), or set PORT / BASE_URL.\n`,
    )
    process.exit(1)
  }
}
