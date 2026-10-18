/**
 * localStorage, wrapped.
 *
 * localStorage throws in Safari private browsing and when a quota is hit. An
 * unwrapped getItem inside a useState initialiser takes the whole app to a
 * white screen for a user whose only sin was opening a private window.
 *
 * Every access in the app goes through here. Failures are logged, never thrown.
 */

import { logError } from './log'

export function readRaw(key: string, context = ''): string | null {
  try {
    return localStorage.getItem(key)
  } catch (err) {
    logError(err, { op: 'localStorage.getItem', key, context })
    return null
  }
}

export function writeRaw(key: string, value: string, context = ''): boolean {
  try {
    localStorage.setItem(key, value)
    return true
  } catch (err) {
    logError(err, { op: 'localStorage.setItem', key, context })
    return false
  }
}

export function remove(key: string, context = ''): void {
  try {
    localStorage.removeItem(key)
  } catch (err) {
    logError(err, { op: 'localStorage.removeItem', key, context })
  }
}

/** Read + JSON.parse. Returns null on a missing key or malformed JSON. */
export function readJson<T>(key: string, context = ''): T | null {
  const raw = readRaw(key, context)
  if (raw === null) return null
  try {
    return JSON.parse(raw) as T
  } catch (err) {
    logError(err, { op: 'JSON.parse', key, context })
    return null
  }
}

/** JSON.stringify + write. Returns false if either step failed. */
export function writeJson(key: string, value: unknown, context = ''): boolean {
  try {
    return writeRaw(key, JSON.stringify(value), context)
  } catch (err) {
    logError(err, { op: 'JSON.stringify', key, context })
    return false
  }
}
