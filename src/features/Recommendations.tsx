import { useState } from 'react'
import { Head } from '../components/Head'
import { MAX_SHOWN, useRecommendations } from '../data/recommendations'
import { findUnit } from '../lib/progress'
import { useOpenUnit } from '../lib/useOpenUnit'

/* Recommendations: only what a connected agent wrote. The first suggestion
 * shows; the rest wait behind a button. With no agent, it says so. */

export function Recommendations() {
  const { state, reload } = useRecommendations()
  const open = useOpenUnit()
  const [more, setMore] = useState(false)
  const [how, setHow] = useState(false)

  return (
    <main id="main" className="wrap">
      <Head title="Recommendations" line="What to do next, from an agent you connect." />

      {state.status === 'loading' && (
        <section className="card rec" aria-busy="true">
          <p className="muted" role="status">
            Checking for suggestions…
          </p>
        </section>
      )}

      {state.status === 'none' && (
        <section className="card rec">
          <h2 className="h2">No agent connected yet</h2>
          <p className="muted">Suggestions show up here once an agent is connected. Nothing here is made up until then.</p>
          <div className="row">
            <button type="button" className="btn btn--soft" onClick={reload}>
              Check again
            </button>
            <button type="button" className="link small" aria-expanded={how} onClick={() => setHow((h) => !h)}>
              How does an agent connect?
            </button>
          </div>
          {how && (
            <p className="muted small reveal">
              It writes its suggestions to <code>data/recommendations.json</code>. The format is in <code>data/README.md</code>.
            </p>
          )}
        </section>
      )}

      {state.status === 'error' && (
        <section className="card rec" role="alert">
          <h2 className="h2">The suggestions could not be read</h2>
          <p className="muted">{state.message}</p>
          <div className="row">
            <button type="button" className="btn btn--soft" onClick={reload}>
              Try again
            </button>
          </div>
        </section>
      )}

      {state.status === 'ready' && (
        <>
          {state.sample && <p className="note-sample">Sample layout for checking the design. This is not advice and no agent wrote it.</p>}
          {state.set.items.length === 0 ? (
            <section className="card rec">
              <h2 className="h2">Nothing to suggest right now</h2>
              <p className="muted">The agent has no suggestions at the moment.</p>
            </section>
          ) : (
            <ol className="recs">
              {state.set.items.slice(0, more ? MAX_SHOWN : 1).map((r, i) => {
                const unit = r.unit ? findUnit(r.unit) : null
                return (
                  <li key={i} className="card rec reveal">
                    <p className="eyebrow">{i === 0 ? 'Suggested next' : 'Also'}</p>
                    <h2 className="h2">{r.action}</h2>
                    <p className="muted">{r.reason}</p>
                    {unit && (
                      <button type="button" className="link small" onClick={() => open(unit.unit.id)}>
                        Open {unit.unit.short}
                      </button>
                    )}
                  </li>
                )
              })}
            </ol>
          )}
          <div className="row">
            {!more && state.set.items.length > 1 && (
              <button type="button" className="btn btn--soft" onClick={() => setMore(true)}>
                Show {Math.min(state.set.items.length, MAX_SHOWN) - 1} more
              </button>
            )}
            <button type="button" className="link small" onClick={reload}>
              Check again
            </button>
          </div>
          <p className="muted small">
            From {state.set.agent},{' '}
            {new Date(state.set.generatedAt).toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' })}
          </p>
        </>
      )}
    </main>
  )
}
