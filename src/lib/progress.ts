import { COURSE, milestoneId, type Section, type Unit } from '../content/course'

/* Counting ticked milestones. A milestone counts only when ticked by hand. */

export type Done = Record<string, string>

export const unitMilestones = (u: Unit) => u.able.map((_, i) => milestoneId(u, i))

export function unitCount(u: Unit, done: Done) {
  const ids = unitMilestones(u)
  return { n: ids.filter((id) => done[id]).length, of: ids.length }
}

export function sectionCount(s: Section, done: Done) {
  return s.units.reduce(
    (t, u) => {
      const c = unitCount(u, done)
      return { n: t.n + c.n, of: t.of + c.of }
    },
    { n: 0, of: 0 },
  )
}

export const pct = (n: number, of: number) => (of ? Math.round((n / of) * 100) : 0)

/** The first unit, in study order, with anything left to tick. */
export function nextUnit(done: Done): { unit: Unit; section: Section } | null {
  for (const section of COURSE) {
    for (const unit of section.units) {
      const c = unitCount(unit, done)
      if (c.n < c.of) return { unit, section }
    }
  }
  return null
}

export function findUnit(id: string): { unit: Unit; section: Section } | null {
  for (const section of COURSE) {
    const unit = section.units.find((u) => u.id === id)
    if (unit) return { unit, section }
  }
  return null
}
