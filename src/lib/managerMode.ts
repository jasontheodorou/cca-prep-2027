import { useSyncExternalStore } from 'react'
import { readRaw, writeRaw } from './storage'

/* Manager mode: page titles and explainers, for showing the site to someone
 * else. Off by default, so each tab opens straight on its content. Remembered
 * in this browser only. */

const KEY = 'cca-prep.manager-mode'
let on = readRaw(KEY, 'manager mode') === 'on'
const listeners = new Set<() => void>()

const mark = () => {
  if (typeof document !== 'undefined') document.documentElement.toggleAttribute('data-manager', on)
}
mark()

export function setManagerMode(next: boolean) {
  on = next
  writeRaw(KEY, next ? 'on' : 'off', 'manager mode')
  mark()
  listeners.forEach((l) => l())
}

export function useManagerMode() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => on,
  )
}
