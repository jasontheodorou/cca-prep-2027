import HOW from '../content/how-to.json'
import type { Session } from './schedule'

/* Step-by-step help for days with no study guide link, written by
 * scripts/build-how-to.py and keyed by the day's title (decision 019). */

export type HowTo = {
  /** What the day is for, in a sentence or two. */
  about: string
  /** One action each, in order. */
  steps: string[]
  /** Text to copy, shown in a box. */
  code?: string
  /** How to tell the day is finished. */
  done: string
  links?: { label: string; href: string }[]
}

const ALL = HOW as Record<string, HowTo>

/** Help for a day, only when the plan gives it no study guide link. */
export const howTo = (s: Session): HowTo | undefined => (s.links.length ? undefined : ALL[s.title])
