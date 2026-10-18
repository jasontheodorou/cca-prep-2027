import { useEffect, useRef, useState } from 'react'
import { Clawd, type ClawdHandle } from '../components/Clawd'
import { Head } from '../components/Head'
import { COURSE } from '../content/course'
import { useStudy } from '../data/store'
import { nextUnit, sectionCount, unitCount } from '../lib/progress'
import { useOpenUnit } from '../lib/useOpenUnit'

/* Course: first, the one unit to look at next. Beside it, the six sections
 * as tiles; choosing one shows its units. A unit opens in a sheet. */

let greeted = false

export function Course() {
  const { state } = useStudy()
  const open = useOpenUnit()
  const next = nextUnit(state.done)
  const [shown, setShown] = useState<string | null>(null)
  const section = COURSE.find((s) => s.id === shown)
  const clawd = useRef<ClawdHandle>(null)

  // The first time Course appears in a visit, Clawd climbs up onto the
  // sections card and does his little hop. After that he is just there.
  useEffect(() => {
    if (greeted) return
    greeted = true
    clawd.current?.climb()
  }, [])

  return (
    <main id="main" className="wrap">
      <Head title="Course" line="Six sections. One small idea at a time." />

      <div className="course-top">
        {next ? (
          <section className="card card--tone up" data-tone={next.section.tone} aria-labelledby="up-next">
            <p className="eyebrow" id="up-next">
              Up next
            </p>
            <h2 className="up__title">{next.unit.short}</h2>
            <p className="up__line">{next.unit.summary}</p>
            <button type="button" className="btn" onClick={() => open(next.unit.id)}>
              Start
            </button>
          </section>
        ) : (
          <section className="card up">
            <h2 className="up__title">Everything is ticked</h2>
            <p className="up__line">Every milestone in the course is marked as done.</p>
          </section>
        )}

        <section className="sections perch" aria-labelledby="sections">
          <Clawd ref={clawd} mode="progress" className="clawd--perch" />
          <h2 className="h3" id="sections">
            All sections
          </h2>
          <ul className="chips">
            {COURSE.map((s) => {
              const c = sectionCount(s, state.done)
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    className="chip"
                    data-tone={s.tone}
                    aria-expanded={shown === s.id}
                    aria-controls="section-units"
                    onClick={() => setShown(shown === s.id ? null : s.id)}
                  >
                    <span className="chip__dot" aria-hidden="true" />
                    <span className="chip__text">
                      {s.short}
                      <span className="chip__meta">{s.weight ? `${s.weight}% of the exam` : '4 exercises'}</span>
                    </span>
                    {c.n === c.of && <span className="visually-hidden">, all ticked</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      </div>

      <div id="section-units" aria-live="polite">
        {section && (
          <div className="reveal units" key={section.id}>
            <p className="units__why">
              <strong>{section.weight ? `${section.weight}% of the exam.` : 'Hands-on practice.'}</strong> {section.why}
            </p>
            <ul className="unitlist unitlist--grid">
              {section.units.map((u) => {
                const c = unitCount(u, state.done)
                return (
                  <li key={u.id}>
                    <button type="button" className="unitrow" data-tone={section.tone} onClick={() => open(u.id)}>
                      <span className="unitrow__id">{u.id}</span>
                      <span className="unitrow__name">{u.short}</span>
                      <span className="unitrow__count" data-full={c.n === c.of || undefined}>
                        {c.n === c.of ? 'All ticked' : `${c.n}/${c.of}`}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
    </main>
  )
}
