import HOW from '../content/how-to.json'
import type { Session } from './schedule'

/* Step-by-step help, written by scripts/build-how-to.py and keyed by the
 * day's title (decision 019). A day made of two half-hour jobs has the help
 * for both jobs joined into one entry (decision 020). */

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

/** Help for a day. A one-job day has it only when the plan gives no study
 * guide link; a two-job day has it when either job needs it. */
export const howTo = (s: Session): HowTo | undefined => (s.links.length && !s.parts ? undefined : ALL[s.title])
