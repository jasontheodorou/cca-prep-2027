import { useSyncExternalStore } from 'react'
import { readRaw, writeRaw } from './storage'

/* Day or night. The choice is remembered in this browser; until one is made,
 * the site follows the computer's own setting. index.html sets the theme
 * before the page draws, so it never flashes white at night. */

export type Theme = 'light' | 'dark'

const KEY = 'cca-prep.theme'
const stored = readRaw(KEY, 'theme')
let theme: Theme =
  stored === 'dark' || stored === 'light'
    ? stored
    : typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
const listeners = new Set<() => void>()

const mark = () => {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#16161b' : '#FFFFFF')
}
mark()

export function setTheme(next: Theme) {
  theme = next
  writeRaw(KEY, next, 'theme')
  mark()
  listeners.forEach((l) => l())
}

export function useTheme() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => theme,
  )
}
