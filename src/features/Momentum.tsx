import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { DrawnTick, Peek, stillMotion, useCountUp } from '../components/Delight'
import { Head } from '../components/Head'
import { Sheet } from '../components/Sheet'
import type { Effort } from '../data/events'
import { logEffort, setSession, useStudy } from '../data/store'
import { readRaw, writeRaw } from '../lib/storage'
import { dayKey, duration, longDay, mondayOf, parseDay } from '../lib/dates'
import { EXAM_DAY, hasWork, isBuild, isLesson, isOptional, sessionOn, startsWithCards, type Session } from '../lib/schedule'
import { useNow } from '../lib/useNow'

/* Momentum: today first, with today's job from the study plan (Done or
 * Missed) and one-tap time. Then this week as seven dots, green where study
 * was logged and washed where study is planned. Every other week waits
 * behind a button. Any past day opens a small sheet to fill in or change.
 * Missed days are not moved anywhere, as the plan says. Days with nothing
 * logged are plain: no warnings, no streaks. */

const ADD = [15, 30, 60]
const SET = [15, 30, 60, 120]
const short = (m: number) => duration(m).replace(' minutes', ' min').replace(' minute', ' min')

/** "21 October at 10:42", from a record's ISO time. */
const savedAt = (iso: string) => {
  const d = new Date(iso)
  return `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })} at ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
}
/** "Thursday 5 November" */
const dayName = (k: string) => parseDay(k).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', '')

/** How long the day is, in the plan's own terms. */
function length(s: Session) {
  switch (s.kind) {
    case 'Long block':
      return '2-hour block'
    case 'Half-day':
      return 'Half-day, about 3½ hours'
    case 'Full day':
      return 'Full day off work'
    case 'Optional':
      return `Optional, ${duration(s.minutes)}`
    default:
      return duration(s.minutes)
  }
}

export function Momentum() {
  const { state } = useStudy()
  const now = useNow()
  const today = dayKey(now)
  const entry = state.effort[today]
  const [editing, setEditing] = useState<string | null>(null)
  const [undo, setUndo] = useState<{ minutes: number; note: string; added: number } | null>(null)
  const [all, setAll] = useState(false)
  const [reading, setReading] = useState<string | null>(null)
  // A day ahead opens its plan; today and earlier days open the day sheet.
  const pick = (k: string) => (k > today ? setReading(k) : setEditing(k))
  const marks = state.sessions ?? {}
  const session = sessionOn(today)

  // Rewards (src/components/Delight.tsx): each is a key that plays its
  // animation once when it changes.
  const todayRef = useRef<HTMLElement>(null)
  const [wash, setWash] = useState<{ id: number; x: number; y: number } | null>(null)
  const [fresh, setFresh] = useState<{ k: string; id: number } | null>(null)
  const [peek, setPeek] = useState<number | null>(null)
  const [wave, setWave] = useState<number | null>(null)
  const shown = useCountUp(entry?.minutes ?? 0)

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = mondayOf(now)
    d.setDate(d.getDate() + i)
    return dayKey(d)
  })
  const weekMinutes = week.reduce((t, k) => t + (state.effort[k]?.minutes ?? 0), 0)

  /** A day marked done: the card's wash, Shortbread's peek, and the week's
   * ripple the first time it completes every study day in its week. */
  const celebrateDone = (day: string, from?: DOMRect) => {
    const id = Date.now()
    const card = todayRef.current?.getBoundingClientRect()
    if (from && card) setWash({ id, x: from.left + from.width / 2 - card.left, y: from.top + from.height / 2 - card.top })
    if (!stillMotion()) setPeek(id)
    const monday = dayKey(mondayOf(parseDay(day)))
    const after = { ...marks, [day]: 'done' as const }
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = parseDay(monday)
      d.setDate(d.getDate() + i)
      return sessionOn(dayKey(d))
    })
    const owed = days.filter((d) => hasWork(d) && !isOptional(d))
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
              s={session}
              mark={marks[today]}
              entry={entry}
              onRead={() => setReading(today)}
              onDone={(from) => {
                celebrateDone(today, from)
                setFresh({ k: today, id: Date.now() })
              }}
            />
          )}
          {session && !hasWork(session) && (
            <div className="session">
              <p className="session__week">{session.week}</p>
              <h2 className="session__focus">{session.title}</h2>
              <p className="session__start">{session.task}</p>
            </div>
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
          {sessionOn(week[0])?.week && <p className="muted small weekcard__name">{sessionOn(week[0])!.week}</p>}
          <ul className="week" key={wave ?? 'week'} data-wave={wave ? true : undefined}>
            {week.map((k) => (
              <li key={k}>
                <DayDot
                  k={k}
                  e={state.effort[k]}
                  s={sessionOn(k)}
                  mark={marks[k]}
                  today={today}
                  disabled={k > today}
                  onPick={pick}
                  fresh={fresh?.k === k ? fresh.id : undefined}
                />
                <span className="week__wd" aria-hidden="true">
                  {parseDay(k).toLocaleDateString('en-GB', { weekday: 'narrow' })}
                </span>
              </li>
            ))}
          </ul>
          <button type="button" className="link small" aria-expanded={all} onClick={() => setAll((a) => !a)}>
            {all ? 'Hide other weeks' : 'Show every week to the exam'}
          </button>
        </section>
      </div>
      {all && <Months effort={state.effort} marks={marks} today={today} onPick={pick} />}

      {editing && (
        <DaySheet
          key={editing}
          day={editing}
          entry={state.effort[editing]}
          s={sessionOn(editing)}
          mark={marks[editing]}
          onRead={() => setReading(editing)}
          onDone={() => celebrateDone(editing)}
          onClose={() => setEditing(null)}
        />
      )}
      {peek && <Peek id={peek} onDone={() => setPeek(null)} />}
      {reading && sessionOn(reading) && <SessionSheet s={sessionOn(reading)!} onClose={() => setReading(null)} />}
    </main>
  )
}

function DayDot({
  k,
  e,
  s,
  mark,
  today,
  disabled,
  onPick,
  small,
  fresh,
}: {
  k: string
  e?: Effort
  s?: Session
  mark?: 'done' | 'missed'
  today: string
  disabled?: boolean
  onPick: (k: string) => void
  small?: boolean
  /** Changes when time was just logged: the dot fills up and ripples. */
  fresh?: number
}) {
  const work = hasWork(s) && !mark
  const ahead = !!s && k >= today && (work || s.kind === 'Exam')
  const label =
    `${longDay(k)}${e ? `, ${duration(e.minutes)}` : ''}${k === today ? ', today' : ''}` +
    (work ? `, planned: ${s!.title}, ${length(s!)}` : '') +
    (s && !hasWork(s) && s.kind !== 'Exam' ? `, ${s.title.toLowerCase()}` : '') +
    (mark === 'missed' ? ', missed' : '') +
    (k === EXAM_DAY ? ', exam day' : '')
  return (
    <span className="dotcell" data-col={(parseDay(k).getDay() + 6) % 7}>
      <button
        key={fresh ?? 'dot'}
        type="button"
        className={small ? 'dot dot--small' : 'dot'}
        data-fresh={fresh ? true : undefined}
        data-studied={e ? true : undefined}
        data-today={k === today || undefined}
        data-exam={k === EXAM_DAY || undefined}
        data-planned={work || undefined}
        data-long={(work && s!.minutes >= 120) || undefined}
        // A planned day ahead opens its plan; other days ahead have nothing to open.
        disabled={disabled && !ahead}
        aria-label={label}
        onClick={() => onPick(k)}
      >
        {parseDay(k).getDate()}
      </button>
      {ahead && <SessionPop s={s!} />}
      {fresh && <span key={`r${fresh}`} className="dot-ripple" aria-hidden="true" />}
    </span>
  )
}

/* The popped day, borrowed from sanctum's calendar: on hover or focus a card
 * lifts off the page over a planned day ahead and shows what the day holds.
 * Hidden from assistive tech, which has the same facts in the label. */
function SessionPop({ s }: { s: Session }) {
  return (
    <span className="pop" aria-hidden="true">
      <span className="pop__day">
        {parseDay(s.day).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}, {length(s).toLowerCase()}
      </span>
      <span className="pop__focus">{s.title}</span>
      <span className="pop__start">{s.week}</span>
    </span>
  )
}

function Months({
  effort,
  marks,
  today,
  onPick,
}: {
  effort: Record<string, Effort>
  marks: Record<string, 'done' | 'missed'>
  today: string
  onPick: (k: string) => void
}) {
  const end = parseDay(EXAM_DAY)
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
                return <DayDot key={k} k={k} e={effort[k]} s={sessionOn(k)} mark={marks[k]} today={today} disabled={k > today} onPick={onPick} small />
              })}
            </div>
          </section>
        )
      })}
      <p className="muted small">
        {[
          ['green', 'Study logged'],
          ['planned', 'Study planned'],
          ['long', 'Long session: 2 hours or more'],
          ['exam', 'Exam day'],
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
  s,
  mark,
  onRead,
  onDone,
  onClose,
}: {
  day: string
  entry?: Effort
  s?: Session
  mark?: 'done' | 'missed'
  onRead: () => void
  /** Called when the day is marked done here. */
  onDone: () => void
  onClose: () => void
}) {
  const [minutes, setMinutes] = useState(entry ? String(entry.minutes) : '')
  const [note, setNote] = useState(entry?.note ?? '')
  // A saved note shows as saved text; the box only opens to add or edit one.
  const [showNote, setShowNote] = useState(false)
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
      {s && (hasWork(s) || mark) && (
        <div className="dayplan">
          <p className="dayplan__what">
            Planned: {s.title}, {length(s).toLowerCase()}.{' '}
            <button type="button" className="link small" onClick={onRead}>
              See the plan
            </button>
          </p>
          <div className="row" role="group" aria-label="Planned study">
            {(['done', 'missed', 'none'] as const).map((st) => (
              <button
                key={st}
                type="button"
                className="pill"
                aria-pressed={(mark ?? 'none') === st}
                onClick={() => {
                  if (st === 'done' && mark !== 'done') onDone()
                  setSession(day, st)
                  if (st === 'done' && !minutes) setMinutes(String(s.minutes))
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
            <textarea id="note" className="input" rows={4} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
          </>
        ) : entry?.note ? (
          <>
            <p className="field__label">Note</p>
            <p className="savednote">{entry.note}</p>
            <p className="savednote__meta">
              Saved {savedAt(entry.at)}.{' '}
              <button type="button" className="link small" onClick={() => setShowNote(true)}>
                Edit note
              </button>
            </p>
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

/** The study site's pages for the day, opened in a new tab. */
function SiteLinks({ s }: { s: Session }) {
  if (!s.links.length) return null
  return (
    <div className="row sitelinks">
      {s.links.map((l) => (
        <a key={l.href} className="pill pill--link" href={l.href} target="_blank" rel="noreferrer">
          {l.label}
          <span className="visually-hidden"> (opens in a new tab)</span>
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path d="M6 3h7v7M13 3L4 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      ))}
    </div>
  )
}

/** Today's job from the plan, then Done or Missed. */
function TodaySession({
  s,
  mark,
  entry,
  onRead,
  onDone,
}: {
  s: Session
  mark?: 'done' | 'missed'
  entry?: Effort
  onRead: () => void
  /** Called with the Done button's place, for the card's wash. */
  onDone: (from: DOMRect) => void
}) {
  const today = s.day
  // Time logged before Done, so taking Done back can restore it.
  const [before, setBefore] = useState<Effort | null | undefined>(undefined)

  const done = (from: DOMRect) => {
    onDone(from)
    setBefore(entry ?? null)
    if ((entry?.minutes ?? 0) < s.minutes) logEffort(today, s.minutes, entry?.note ?? '')
    setSession(today, 'done')
  }
  const takeBack = () => {
    if (before !== undefined && mark === 'done') logEffort(today, before?.minutes ?? 0, before?.note ?? '')
    setBefore(undefined)
    setSession(today, 'none')
  }

  return (
    <div className="session">
      <p className="session__week">{s.week}</p>
      <h2 className="session__focus">{s.title}</h2>
      <p className="session__meta">
        {length(s)}
        {startsWithCards(s) && '. Start with 10 minutes of flashcards'}
      </p>
      {mark ? (
        <p className="session__status" role="status">
          {mark === 'done' ? (
            <span className="session__done">
              <DrawnTick /> Done.
            </span>
          ) : isOptional(s) ? (
            'Skipped. It was optional.'
          ) : (
            'Missed. It does not move to another day. Carry on with the plan as it is.'
          )}{' '}
          <button type="button" className="link" onClick={takeBack}>
            Take back
          </button>
        </p>
      ) : (
        <>
          {s.task && <p className="session__start">{s.task}</p>}
          <SiteLinks s={s} />
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

/** Everything the plan says about one day, with the plan's standing rules
 * that apply to it. */
function SessionSheet({ s, onClose }: { s: Session; onClose: () => void }) {
  const friday = parseDay(s.day).getDay() === 5 && s.kind === 'Daily'
  const rows: [string, React.ReactNode][] = [
    ['First', startsWithCards(s) ? '10 minutes of flashcards. Every day, without fail.' : ''],
    ['The job', s.task ? `${s.title}. ${s.task}` : s.title],
    ['The sandbox step', s.build ? `${s.build}.` : ''],
    [
      'Exam topics',
      s.units.length
        ? s.units.map((u, i) => (
            <span key={u}>
              {i > 0 && ', '}
              <Link className="link" to={`/?unit=${u}`}>
                {u}
              </Link>
            </span>
          ))
        : '',
    ],
    [
      'Working a lesson',
      isLesson(s)
        ? 'Read What You Need to Know once, properly. Do the Concept Check straight away; if it goes badly, read again. Read the Exam Traps. Answer the Practice Scenario before revealing it, and say out loud why the other three are wrong. Leave the Build Exercise for Saturday. Tick Mark Complete.'
        : '',
    ],
    ['Afterwards', isBuild(s) ? 'Write three sentences in NOTES.md saying what surprised you. It takes two minutes.' : ''],
    ['If a day has to go', friday ? 'Make it this one. Never the Saturday block, and never the flashcards.' : ''],
  ]
  return (
    <Sheet label={s.title} wide onClose={onClose}>
      <h2 className="h2">{s.title}</h2>
      <p className="sheet__lead">
        {dayName(s.day)}. {s.week}. {length(s)}.
      </p>
      <SiteLinks s={s} />
      <dl className="plan">
        {rows
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
