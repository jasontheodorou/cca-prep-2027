import { useState } from 'react'
import { Head } from '../components/Head'
import { COURSE } from '../content/course'
import { useStudy } from '../data/store'
import { pct, sectionCount, unitCount } from '../lib/progress'
import { useOpenUnit } from '../lib/useOpenUnit'

/* Progress: one ring for the whole course, then one row per section. A row
 * opens to its units; a unit opens its sheet, where the ticks are. What the
 * figures measure is one tap away. */

export function Progress() {
  const { state } = useStudy()
  const open = useOpenUnit()
  const [shown, setShown] = useState<string | null>(null)
  const [explain, setExplain] = useState(false)
  const all = COURSE.reduce(
    (t, s) => {
      const c = sectionCount(s, state.done)
      return { n: t.n + c.n, of: t.of + c.of }
    },
    { n: 0, of: 0 },
  )
  const p = pct(all.n, all.of)

  return (
    <main id="main" className="wrap">
      <Head title="Progress" line="What you have ticked as done." />

      <div className="pr-grid">
      <section className="card ringcard" aria-label="Overall">
        <Ring value={p} />
        <div>
          <p className="ringcard__n">
            {all.n} of {all.of} ticked
          </p>
          <button type="button" className="link small" aria-expanded={explain} onClick={() => setExplain((e) => !e)}>
            What does this measure?
          </button>
          {explain && (
            <p className="muted small reveal">
              The share of the course’s milestones you have ticked. Study time does not tick anything, and this is not a
              predicted exam score.
            </p>
          )}
        </div>
      </section>

      <ul className="secs">
        {COURSE.map((s) => {
          const c = sectionCount(s, state.done)
          const sp = pct(c.n, c.of)
          return (
            <li key={s.id} className="sec" data-tone={s.tone}>
              <button
                type="button"
                className="sec__row"
                aria-expanded={shown === s.id}
                onClick={() => setShown(shown === s.id ? null : s.id)}
              >
                <span className="chip__dot" aria-hidden="true" />
                <span className="sec__name">{s.short}</span>
                <span className="bar" aria-hidden="true">
                  <span style={{ width: `${sp}%` }} />
                </span>
                <span className="sec__pct">{sp}%</span>
              </button>
              {shown === s.id && (
                <ul className="unitlist reveal">
                  {s.units.map((u) => {
                    const uc = unitCount(u, state.done)
                    return (
                      <li key={u.id}>
                        <button type="button" className="unitrow" data-tone={s.tone} onClick={() => open(u.id)}>
                          <span className="unitrow__id">{u.id}</span>
                          <span className="unitrow__name">{u.short}</span>
                          <span className="unitrow__count" data-full={uc.n === uc.of || undefined}>
                            {uc.n === 0 ? 'Not started' : uc.n === uc.of ? 'All ticked' : `${uc.n}/${uc.of}`}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
      </div>
    </main>
  )
}

function Ring({ value }: { value: number }) {
  const r = 42
  const c = 2 * Math.PI * r
  return (
    <div className="ring" role="img" aria-label={`${value}% ticked`}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r={r} className="ring__track" />
        <circle cx="50" cy="50" r={r} className="ring__fill" strokeDasharray={`${(value / 100) * c} ${c}`} />
      </svg>
      <span className="ring__n">{value}%</span>
    </div>
  )
}
