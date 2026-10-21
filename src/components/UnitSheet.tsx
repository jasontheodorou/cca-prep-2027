import { useEffect, useRef, useState } from 'react'
import { Flecks } from './Delight'
import { Sheet } from './Sheet'
import { setMilestone, useStudy } from '../data/store'
import { findUnit, unitCount, unitMilestones } from '../lib/progress'

/* One unit, revealed a step at a time:
 *   start  its name, one sentence, and two choices
 *   learn  the ideas to understand, one card at a time
 *   check  the things to be able to do, as ticks
 * The guide's own wording waits behind a small link. */

type View = 'start' | 'learn' | 'check'

export function UnitSheet({ id, onClose }: { id: string; onClose: () => void }) {
  const found = findUnit(id)
  const { state } = useStudy()
  const [view, setView] = useState<View>('start')
  const [step, setStep] = useState(0)
  const [wording, setWording] = useState(false)
  // The box just ticked springs and sends out flecks (Delight.tsx).
  const [popped, setPopped] = useState<{ mid: string; id: number } | null>(null)
  // Moving between views removes the button just pressed, so focus moves to the new view.
  const area = useRef<HTMLDivElement>(null)
  const moved = useRef(false)
  useEffect(() => {
    if (moved.current) area.current?.focus()
    moved.current = true
  }, [view, step])

  if (!found) {
    return (
      <Sheet label="Unit not found" onClose={onClose}>
        <h2 className="h2">That unit is not in the course</h2>
        <p className="muted">There is no unit called “{id}”.</p>
      </Sheet>
    )
  }

  const { unit, section } = found
  const exercise = unit.understand.length === 0
  const { n, of } = unitCount(unit, state.done)
  const ids = unitMilestones(unit)

  return (
    <Sheet label={unit.short} tone={section.tone} onClose={onClose}>
      <p className="tag" data-tone={section.tone}>
        {unit.id} · {section.short}
      </p>

      <div ref={area} tabIndex={-1} className="sheet__area">
        {view === 'start' && (
          <div className="reveal" key="start">
            <h2 className="h1 sheet__title">{unit.short}</h2>
            <p className="sheet__lead">{unit.summary}</p>
            <div className="choices">
              {!exercise && (
                <button type="button" className="choice" onClick={() => setView('learn')}>
                  <span className="choice__main">Learn the ideas</span>
                  <span className="choice__sub">{unit.understand.length} short cards</span>
                </button>
              )}
              <button type="button" className="choice" onClick={() => setView('check')}>
                <span className="choice__main">{exercise ? 'See the steps' : 'Tick what I can do'}</span>
                <span className="choice__sub">
                  {n} of {of} ticked
                </span>
              </button>
            </div>
            <button type="button" className="link small" aria-expanded={wording} onClick={() => setWording((w) => !w)}>
              {wording ? 'Hide the guide’s wording' : 'Show the guide’s wording'}
            </button>
            {wording && <p className="wording">{unit.title}</p>}
          </div>
        )}

        {view === 'learn' && (
          <div className="reveal" key={`learn-${step}`}>
            <p className="step" aria-live="polite">
              Idea {step + 1} of {unit.understand.length}
            </p>
            <p className="idea">{unit.understand[step]}</p>
            <div className="dots" aria-hidden="true">
              {unit.understand.map((_, i) => (
                <span key={i} data-on={i === step || undefined} />
              ))}
            </div>
            <div className="row">
              <button type="button" className="btn btn--soft" onClick={() => (step ? setStep(step - 1) : setView('start'))}>
                Back
              </button>
              {step < unit.understand.length - 1 ? (
                <button type="button" className="btn" onClick={() => setStep(step + 1)}>
                  Next idea
                </button>
              ) : (
                <button type="button" className="btn" onClick={() => setView('check')}>
                  Now tick what I can do
                </button>
              )}
            </div>
          </div>
        )}

        {view === 'check' && (
          <div className="reveal" key="check">
            <h2 className="h2">{exercise ? 'Steps' : 'Can you do these?'}</h2>
            <p className="muted small">Tick the ones you could explain or do now. You can untick them later.</p>
            <ul className="ticks">
              {unit.able.map((text, i) => {
                const mid = ids[i]
                return (
                  <li key={mid}>
                    <label className="tickrow" data-on={!!state.done[mid] || undefined}>
                      <input
                        type="checkbox"
                        checked={!!state.done[mid]}
                        onChange={(e) => {
                          setMilestone(mid, e.target.checked)
                          setPopped(e.target.checked ? { mid, id: Date.now() } : null)
                        }}
                      />
                      <span key={popped?.mid === mid ? popped.id : 'box'} className="tickrow__box" data-pop={popped?.mid === mid || undefined} aria-hidden="true">
                        {popped?.mid === mid && <Flecks />}
                        <svg viewBox="0 0 16 16" width="14" height="14">
                          <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span>{text}</span>
                    </label>
                  </li>
                )
              })}
            </ul>
            <div className="row">
              <button
                type="button"
                className="btn btn--soft"
                onClick={() => {
                  setStep(0)
                  setView('start')
                }}
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  )
}
