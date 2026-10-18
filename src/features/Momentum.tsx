import { useState } from 'react'
import { Head } from '../components/Head'
import { Sheet } from '../components/Sheet'
import { EXAM } from '../content/course'
import type { Effort } from '../data/events'
import { logEffort, useStudy } from '../data/store'
import { dayKey, duration, longDay, mondayOf, parseDay } from '../lib/dates'
import { useNow } from '../lib/useNow'

/* Momentum: today first, with one-tap time. Then this week as seven dots,
 * green where study was logged. Every other week waits behind a button.
 * Any past day opens a small sheet to fill in or change. Days with nothing
 * logged are plain: no warnings, no streaks. */

const ADD = [15, 30, 60]
const SET = [15, 30, 60, 120]
const short = (m: number) => duration(m).replace(' minutes', ' min').replace(' minute', ' min')

export function Momentum() {
  const { state } = useStudy()
  const now = useNow()
  const today = dayKey(now)
  const entry = state.effort[today]
  const [editing, setEditing] = useState<string | null>(null)
  const [undo, setUndo] = useState<{ minutes: number; note: string; added: number } | null>(null)
  const [all, setAll] = useState(false)

  const add = (m: number) => {
    setUndo({ minutes: entry?.minutes ?? 0, note: entry?.note ?? '', added: m })
    logEffort(today, Math.min(1440, (entry?.minutes ?? 0) + m), entry?.note ?? '')
  }

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = mondayOf(now)
    d.setDate(d.getDate() + i)
    return dayKey(d)
  })
  const weekMinutes = week.reduce((t, k) => t + (state.effort[k]?.minutes ?? 0), 0)

  return (
    <main id="main" className="wrap">
      <Head title="Momentum" line="Any amount counts." />

      <div className="mo-top">
      <section className="card today" data-studied={entry ? true : undefined} aria-labelledby="today">
        <p className="eyebrow" id="today">
          Today
        </p>
        <p className="today__n">{entry ? short(entry.minutes) : 'Nothing logged yet'}</p>
        {entry?.note && <p className="today__note">“{entry.note}”</p>}
        <div className="row">
          {ADD.map((m) => (
            <button key={m} type="button" className="pill" onClick={() => add(m)}>
              + {short(m)}
            </button>
          ))}
        </div>
        <p className="today__foot" role="status">
          {undo ? (
            <>
              Added {short(undo.added)}.{' '}
              <button
                type="button"
                className="link"
                onClick={() => {
                  logEffort(today, undo.minutes, undo.note)
                  setUndo(null)
                }}
              >
                Undo
              </button>
            </>
          ) : (
            <button type="button" className="link small" onClick={() => setEditing(today)}>
              {entry ? 'Change time or add a note' : 'Enter a different time'}
            </button>
          )}
        </p>
      </section>

      <section className="card weekcard" aria-labelledby="week">
        <div className="block__head">
          <h2 className="h3" id="week">
            This week
          </h2>
          {weekMinutes > 0 && <p className="muted small">{duration(weekMinutes)}</p>}
        </div>
        <ul className="week">
          {week.map((k) => {
            const e = state.effort[k]
            const future = k > today
            const d = parseDay(k)
            return (
              <li key={k}>
                <DayDot k={k} e={e} today={today} disabled={future} onPick={setEditing} />
                <span className="week__wd" aria-hidden="true">
                  {d.toLocaleDateString('en-GB', { weekday: 'narrow' })}
                </span>
              </li>
            )
          })}
        </ul>
        <button type="button" className="link small" aria-expanded={all} onClick={() => setAll((a) => !a)}>
          {all ? 'Hide other weeks' : 'Show every week to the exam'}
        </button>
      </section>
      </div>
      {all && <Months effort={state.effort} today={today} onPick={setEditing} />}

      {editing && <DaySheet key={editing} day={editing} entry={state.effort[editing]} onClose={() => setEditing(null)} />}
    </main>
  )
}

function DayDot({
  k,
  e,
  today,
  disabled,
  onPick,
  small,
}: {
  k: string
  e?: Effort
  today: string
  disabled?: boolean
  onPick: (k: string) => void
  small?: boolean
}) {
  const label = `${longDay(k)}${e ? `, ${duration(e.minutes)}` : ''}${k === today ? ', today' : ''}`
  const day = parseDay(k).getDate()
  const exam = k >= EXAM.weekOf && k <= dayKey(new Date(parseDay(EXAM.weekOf).getTime() + 6 * 86_400_000))
  return (
    <button
      type="button"
      className={small ? 'dot dot--small' : 'dot'}
      data-studied={e ? true : undefined}
      data-today={k === today || undefined}
      data-exam={exam || undefined}
      disabled={disabled}
      aria-label={label}
      onClick={() => onPick(k)}
    >
      {day}
    </button>
  )
}

function Months({ effort, today, onPick }: { effort: Record<string, Effort>; today: string; onPick: (k: string) => void }) {
  const end = parseDay(EXAM.weekOf)
  const first = Object.keys(effort).sort()[0]
  const start = parseDay(first && first < '2026-10-01' ? first : '2026-10-01')
  const months: Date[] = []
  for (let d = new Date(start.getFullYear(), start.getMonth(), 1); d <= end; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) months.push(d)

  return (
    <div className="months reveal">
      {months.map((m) => {
        const label = m.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
        const blanks = (m.getDay() + 6) % 7
        const count = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate()
        return (
          <section key={label} aria-label={label} className="month">
            <h3 className="month__name">{label}</h3>
            <div className="month__grid">
              {Array.from({ length: blanks }, (_, i) => (
                <span key={`b${i}`} />
              ))}
              {Array.from({ length: count }, (_, i) => {
                const k = dayKey(new Date(m.getFullYear(), m.getMonth(), i + 1))
                return <DayDot key={k} k={k} e={effort[k]} today={today} disabled={k > today} onPick={onPick} small />
              })}
            </div>
          </section>
        )
      })}
      <p className="muted small">
        <span className="key key--green" aria-hidden="true" /> Study logged
        <span className="key key--exam" aria-hidden="true" /> Planned exam week
      </p>
    </div>
  )
}

function DaySheet({ day, entry, onClose }: { day: string; entry?: Effort; onClose: () => void }) {
  const [minutes, setMinutes] = useState(entry ? String(entry.minutes) : '')
  const [note, setNote] = useState(entry?.note ?? '')
  const [showNote, setShowNote] = useState(!!entry?.note)
  const [error, setError] = useState('')

  const save = () => {
    const m = Number(minutes.trim())
    if (!minutes.trim() || !Number.isInteger(m) || m < 1 || m > 1440) {
      setError('Enter whole minutes, from 1 to 1,440.')
      return
    }
    logEffort(day, m, note.trim())
    onClose()
  }

  return (
    <Sheet label={longDay(day)} onClose={onClose}>
      <h2 className="h2">{longDay(day)}</h2>
      <form
        className="dayform"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <label className="field__label" htmlFor="minutes">
          Minutes studied
        </label>
        {error && (
          <p className="field__error" id="minutes-error" role="alert">
            {error}
          </p>
        )}
        <div className="row">
          <input
            id="minutes"
            className="input input--short"
            inputMode="numeric"
            autoComplete="off"
            value={minutes}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'minutes-error' : undefined}
            onChange={(e) => setMinutes(e.target.value)}
          />
          {SET.map((m) => (
            <button key={m} type="button" className="pill" aria-pressed={minutes === String(m)} onClick={() => setMinutes(String(m))}>
              {short(m)}
            </button>
          ))}
        </div>

        {showNote ? (
          <>
            <label className="field__label" htmlFor="note">
              Note
            </label>
            <textarea id="note" className="input" rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
          </>
        ) : (
          <button type="button" className="link small" onClick={() => setShowNote(true)}>
            Add a note
          </button>
        )}

        <div className="row row--end">
          {entry && (
            <button
              type="button"
              className="link small"
              onClick={() => {
                logEffort(day, 0, '')
                onClose()
              }}
            >
              Clear this day
            </button>
          )}
          <button type="submit" className="btn">
            Save
          </button>
        </div>
      </form>
    </Sheet>
  )
}
