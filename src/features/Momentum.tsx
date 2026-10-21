import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { DrawnTick, Peek, stillMotion, useCountUp } from '../components/Delight'
import { Head } from '../components/Head'
import { Sheet } from '../components/Sheet'
import { EXAM } from '../content/course'
import type { Effort } from '../data/events'
import { logEffort, setSession, useStudy } from '../data/store'
import { readRaw, writeRaw } from '../lib/storage'
import { dayKey, duration, longDay, mondayOf, parseDay } from '../lib/dates'
import { hasWork, plan, SCHEDULE, total, type PlannedDay } from '../lib/schedule'
import { useNow } from '../lib/useNow'

/* Momentum: today first, with today's planned session (Done or Missed) and
 * one-tap time. Then this week as seven dots, green where study was logged
 * and ringed where a session is planned. Every other week waits behind a
 * button. Any past day opens a small sheet to fill in or change. Missed
 * sessions move to later flexible days (src/lib/schedule.ts). Days with
 * nothing logged are plain: no warnings, no streaks. */

const ADD = [15, 30, 60]
const SET = [15, 30, 60, 120]
const short = (m: number) => duration(m).replace(' minutes', ' min').replace(' minute', ' min')
/** "Thursday 5 November" */
const dayName = (k: string) => parseDay(k).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', '')
const list = (items: string[]) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`)

type Plan = ReturnType<typeof plan>

/** Optional days: they never hold back the week's ripple. */
const OPTIONAL = new Set(['Flexible', 'Optional buffer'])

export function Momentum() {
  const { state } = useStudy()
  const now = useNow()
  const today = dayKey(now)
  const entry = state.effort[today]
  const [editing, setEditing] = useState<string | null>(null)
  const [undo, setUndo] = useState<{ minutes: number; note: string; added: number } | null>(null)
  const [all, setAll] = useState(false)
  const [reading, setReading] = useState<string | null>(null)
  // A day ahead opens its session; today and earlier days open the day sheet.
  const pick = (k: string) => (k > today ? setReading(k) : setEditing(k))
  const marks = useMemo(() => state.sessions ?? {}, [state.sessions])
  const planned = useMemo(() => plan(marks, today), [marks, today])
  const session = planned.days.get(today)

  // Rewards (src/components/Delight.tsx): each is a key that plays its
  // animation once when it changes.
  const todayRef = useRef<HTMLElement>(null)
  const [wash, setWash] = useState<{ id: number; x: number; y: number } | null>(null)
  const [fresh, setFresh] = useState<{ k: string; id: number } | null>(null)
  const [cleared, setCleared] = useState<{ k: string; id: number } | null>(null)
  const [peek, setPeek] = useState<number | null>(null)
  const [wave, setWave] = useState<number | null>(null)
  const shown = useCountUp(entry?.minutes ?? 0)

  /** A session marked done: the card's wash, the missed-work dot floating
   * away, Shortbread's peek, and the week's ripple when it completes it. */
  const celebrateDone = (day: string, from?: DOMRect) => {
    const id = Date.now()
    const card = todayRef.current?.getBoundingClientRect()
    if (from && card) setWash({ id, x: from.left + from.width / 2 - card.left, y: from.top + from.height / 2 - card.top })
    if (total(planned.days.get(day)?.catchUp ?? []) > 0) setCleared({ k: day, id })
    if (!stillMotion()) setPeek(id)
    // The week ripples once, the first time every main session in it is done.
    const monday = dayKey(mondayOf(parseDay(day)))
    const after = { ...marks, [day]: 'done' as const }
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = parseDay(monday)
      d.setDate(d.getDate() + i)
      return planned.days.get(dayKey(d))
    })
    const owed = days.filter((d) => d && ((d.minutes > 0 && !OPTIONAL.has(d.kind)) || d.catchUp.length > 0))
    const key = `cca-prep.week-done.${monday}`
    if (owed.length && owed.every((d) => after[d!.day] === 'done') && !readRaw(key, 'week ripple')) {
      writeRaw(key, '1', 'week ripple')
      if (monday === week[0]) setWave(id)
    }
  }

  const add = (m: number) => {
    setUndo({ minutes: entry?.minutes ?? 0, note: entry?.note ?? '', added: m })
    logEffort(today, Math.min(1440, (entry?.minutes ?? 0) + m), entry?.note ?? '')
    setFresh({ k: today, id: Date.now() })
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
      <section ref={todayRef} className="card today" data-studied={entry ? true : undefined} aria-labelledby="today">
        {wash && <span key={wash.id} className="today__wash" style={{ left: wash.x, top: wash.y }} aria-hidden="true" />}
        <p className="eyebrow" id="today">
          Today
        </p>
        {session && hasWork(session) && (
          <TodaySession
            p={session}
            mark={marks[today]}
            entry={entry}
            onRead={() => setReading(today)}
            onDone={(from) => {
              celebrateDone(today, from)
              setFresh({ k: today, id: Date.now() })
            }}
          />
        )}
        {planned.leftOver.length > 0 && (
          <p className="today__left">
            {duration(total(planned.leftOver))} of missed work has no free day before the exam. Think about moving the exam. Do not cram.
          </p>
        )}
        <p className="today__n">{entry ? short(shown || entry.minutes) : 'Nothing logged yet'}</p>
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
        <ul className="week" key={wave ?? 'week'} data-wave={wave ? true : undefined}>
          {week.map((k) => {
            const e = state.effort[k]
            const future = k > today
            const d = parseDay(k)
            return (
              <li key={k}>
                <DayDot
                  k={k}
                  e={e}
                  p={planned.days.get(k)}
                  mark={marks[k]}
                  today={today}
                  disabled={future}
                  onPick={pick}
                  fresh={fresh?.k === k ? fresh.id : undefined}
                  cleared={cleared?.k === k ? cleared.id : undefined}
                />
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
      {all && <Months effort={state.effort} planned={planned} marks={marks} today={today} onPick={pick} />}

      {editing && (
        <DaySheet
          key={editing}
          day={editing}
          entry={state.effort[editing]}
          p={planned.days.get(editing)}
          mark={marks[editing]}
          onRead={() => setReading(editing)}
          onDone={() => celebrateDone(editing)}
          onClose={() => setEditing(null)}
        />
      )}
      {peek && <Peek id={peek} onDone={() => setPeek(null)} />}
      {reading && planned.days.get(reading) && <SessionSheet p={planned.days.get(reading)!} onClose={() => setReading(null)} />}
    </main>
  )
}

function DayDot({
  k,
  e,
  p,
  mark,
  today,
  disabled,
  onPick,
  small,
  fresh,
  cleared,
}: {
  k: string
  e?: Effort
  p?: PlannedDay
  mark?: 'done' | 'missed'
  today: string
  disabled?: boolean
  onPick: (k: string) => void
  small?: boolean
  /** Changes when time was just logged: the dot fills up and ripples. */
  fresh?: number
  /** Changes when this day's missed work was just done: its mark floats away. */
  cleared?: number
}) {
  const work = p && hasWork(p) && !mark
  const extra = p ? total(p.catchUp) : 0
  const ahead = work && k >= today
  const label =
    `${longDay(k)}${e ? `, ${duration(e.minutes)}` : ''}${k === today ? ', today' : ''}` +
    (work ? `, planned: ${p.focus}, ${duration(p.minutes + extra)}` : '') +
    (work && extra ? `, including ${duration(extra)} you missed` : '') +
    (mark === 'missed' ? ', missed' : '')
  const day = parseDay(k).getDate()
  const exam = k >= EXAM.weekOf && k <= dayKey(new Date(parseDay(EXAM.weekOf).getTime() + 6 * 86_400_000))
  return (
    <span className="dotcell" data-col={(parseDay(k).getDay() + 6) % 7}>
      <button
        key={fresh ?? 'dot'}
        type="button"
        className={small ? 'dot dot--small' : 'dot'}
        data-fresh={fresh ? true : undefined}
        data-studied={e ? true : undefined}
        data-today={k === today || undefined}
        data-exam={exam || undefined}
        data-planned={work || undefined}
        data-catchup={(work && extra > 0) || undefined}
        // A planned day ahead opens its session; other days ahead have nothing to open.
        disabled={disabled && !ahead}
        aria-label={label}
        onClick={() => onPick(k)}
      >
        {day}
      </button>
      {ahead && <SessionPop p={p} />}
      {fresh && <span key={`r${fresh}`} className="dot-ripple" aria-hidden="true" />}
      {cleared && <span key={`c${cleared}`} className="dot-float" aria-hidden="true" />}
    </span>
  )
}

/* The popped day, borrowed from sanctum's calendar: on hover or focus a card
 * lifts off the page over a planned day ahead and shows what the session
 * holds. Hidden from assistive tech, which has the same facts in the label. */
function SessionPop({ p }: { p: PlannedDay }) {
  const extra = total(p.catchUp)
  return (
    <span className="pop" aria-hidden="true">
      <span className="pop__day">
        {parseDay(p.day).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}, {duration(p.minutes + extra)}
      </span>
      <span className="pop__focus">{p.focus}</span>
      <span className="pop__start">{p.start}</span>
    </span>
  )
}

function Months({
  effort,
  planned,
  marks,
  today,
  onPick,
}: {
  effort: Record<string, Effort>
  planned: Plan
  marks: Record<string, 'done' | 'missed'>
  today: string
  onPick: (k: string) => void
}) {
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
                return (
                  <DayDot key={k} k={k} e={effort[k]} p={planned.days.get(k)} mark={marks[k]} today={today} disabled={k > today} onPick={onPick} small />
                )
              })}
            </div>
          </section>
        )
      })}
      <p className="muted small">
        {[
          ['green', 'Study logged'],
          ['planned', 'Study planned'],
          ['catchup', 'Has missed work added'],
          ['exam', 'Planned exam week'],
        ].map(([k, text]) => (
          <span key={k} className="legend">
            <span className={`key key--${k}`} aria-hidden="true" /> {text}
          </span>
        ))}
      </p>
    </div>
  )
}

function DaySheet({
  day,
  entry,
  p,
  mark,
  onRead,
  onDone,
  onClose,
}: {
  day: string
  entry?: Effort
  p?: PlannedDay
  mark?: 'done' | 'missed'
  onRead: () => void
  /** Called when the day's session is marked done here. */
  onDone: () => void
  onClose: () => void
}) {
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
      {p && (hasWork(p) || mark) && (
        <div className="dayplan">
          <p className="dayplan__what">
            Planned: {p.focus}, {duration(p.minutes + total(p.catchUp))}.{' '}
            <button type="button" className="link small" onClick={onRead}>
              See the plan
            </button>
          </p>
          <div className="row" role="group" aria-label="Planned session">
            {(['done', 'missed', 'none'] as const).map((st) => (
              <button
                key={st}
                type="button"
                className="pill"
                aria-pressed={(mark ?? 'none') === st}
                onClick={() => {
                  if (st === 'done' && mark !== 'done') onDone()
                  setSession(day, st)
                  if (st === 'done' && !minutes) setMinutes(String(p.minutes + total(p.catchUp)))
                }}
              >
                {st === 'done' ? 'Done' : st === 'missed' ? 'Missed' : 'Not marked'}
              </button>
            ))}
          </div>
        </div>
      )}
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

/** Today's planned session: what to start with, then Done or Missed. */
function TodaySession({
  p,
  mark,
  entry,
  onRead,
  onDone,
}: {
  p: PlannedDay
  mark?: 'done' | 'missed'
  entry?: Effort
  onRead: () => void
  /** Called with the Done button's place, for the card's wash. */
  onDone: (from: DOMRect) => void
}) {
  const today = p.day
  const extra = total(p.catchUp)
  const all = p.minutes + extra
  // Time logged before Done, so taking Done back can restore it.
  const [before, setBefore] = useState<Effort | null | undefined>(undefined)

  const done = (from: DOMRect) => {
    onDone(from)
    setBefore(entry ?? null)
    if ((entry?.minutes ?? 0) < all) logEffort(today, all, entry?.note ?? '')
    setSession(today, 'done')
  }
  const takeBack = () => {
    if (before !== undefined && mark === 'done') logEffort(today, before?.minutes ?? 0, before?.note ?? '')
    setBefore(undefined)
    setSession(today, 'none')
  }

  return (
    <div className="session">
      <h2 className="session__focus">{p.focus}</h2>
      <p className="session__meta">
        {p.minutes ? `${p.label} (${duration(p.minutes)})` : p.label}
        {extra > 0 && `, plus ${duration(extra)} you missed on ${list(p.catchUp.map((m) => dayName(m.from)))}`}
      </p>
      {mark ? (
        <p className="session__status" role="status">
          {mark === 'done' ? (
            <span className="session__done">
              <DrawnTick /> Done.
            </span>
          ) : (
            `Missed. ${movedText(p)}`
          )}{' '}
          <button type="button" className="link" onClick={takeBack}>
            Take back
          </button>
        </p>
      ) : (
        <>
          <p className="session__start">{p.start}</p>
          <div className="row">
            <button type="button" className="btn" onClick={(e) => done(e.currentTarget.getBoundingClientRect())}>
              Done
            </button>
            <button type="button" className="btn btn--soft" onClick={() => setSession(today, 'missed')}>
              Missed
            </button>
            <button type="button" className="link small" onClick={onRead}>
              See all of today's plan
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function movedText(p: PlannedDay) {
  if (p.movedTo.length) return `You will do it on ${list(p.movedTo.map((m) => dayName(m.to)))}.`
  if (p.kind === 'Flexible' && !p.catchUp.length) return 'This hour was a choice, so you owe nothing.'
  return 'There is no free day left for it before the exam.'
}

/** Everything the schedule says about one day. */
function SessionSheet({ p, onClose }: { p: PlannedDay; onClose: () => void }) {
  const units = p.objectives.split(/[,;]\s*/).filter((o) => /^\d\.\d$/.test(o.trim()))
  const parts: [string, string][] = [
    ['First, do this', p.start],
    ['Warm up', p.recall],
    ["Today's job", p.task],
    ['How to do it', p.how],
    ['Short on time?', p.minimum],
    ['Write it down', p.evidence],
  ]
  // One screen, no scrolling (Jason, 21 October 2026): a wide sheet with the
  // labels beside the text, and the exam topics in the opening line.
  return (
    <Sheet label={p.focus} wide onClose={onClose}>
      <h2 className="h2">{p.focus}</h2>
      <p className="sheet__lead">
        {dayName(p.day)}. {p.label}
        {p.minutes ? ` (${duration(p.minutes)})` : ''}. Exam topics:{' '}
        {units.length
          ? units.map((u, i) => (
              <span key={u}>
                {i > 0 && ', '}
                <Link to={`/?unit=${u.trim()}`}>{u.trim()}</Link>
              </span>
            ))
          : p.objectives.toLowerCase()}
        .
      </p>
      <dl className="plan">
        {p.catchUp.length > 0 && (
          <div className="plan__row">
            <dt>Work you missed</dt>
            <dd>
              {p.catchUp.map((m) => (
                <CatchUp key={m.from} m={m} />
              ))}
            </dd>
          </div>
        )}
        {parts
          .filter(([, text]) => text)
          .map(([title, text]) => (
            <div key={title} className="plan__row">
              <dt>{title}</dt>
              <dd>{text}</dd>
            </div>
          ))}
      </dl>
    </Sheet>
  )
}

function CatchUp({ m }: { m: { from: string; minutes: number } }) {
  const from = SCHEDULE.find((s) => s.day === m.from)
  return (
    <p>
      {duration(m.minutes)} from {dayName(m.from)}
      {from ? `: ${from.focus}. ${from.task}` : '.'}
    </p>
  )
}
