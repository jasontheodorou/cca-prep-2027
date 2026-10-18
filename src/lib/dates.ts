/* Days are handled as local YYYY-MM-DD strings, never as UTC, so a late
 * evening session is never filed under the next day. */

const pad = (n: number) => String(n).padStart(2, '0')

export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export function parseDay(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** "Sunday 18 October 2026" (without the comma en-GB puts after the weekday) */
export const longDay = (key: string) =>
  parseDay(key).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).replace(',', '')

/** "15 March 2027" */
export const shortDay = (key: string) => parseDay(key).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

/** "45 minutes", "1 hour", "2 hours 15 minutes" */
export function duration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const parts = []
  if (h) parts.push(`${h} ${h === 1 ? 'hour' : 'hours'}`)
  if (m || !h) parts.push(`${m} ${m === 1 ? 'minute' : 'minutes'}`)
  return parts.join(' ')
}

/** The Monday of the week a day falls in. */
export function mondayOf(d: Date) {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  r.setDate(r.getDate() - ((r.getDay() + 6) % 7))
  return r
}
