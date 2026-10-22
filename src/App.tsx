import { useEffect } from 'react'
import { Link, Navigate, NavLink, Route, Routes, useLocation, useSearchParams } from 'react-router-dom'
import { TABS } from './pages'
import { setManagerMode, useManagerMode } from './lib/managerMode'
import { setTheme, useTheme } from './lib/theme'
import { UnitSheet } from './components/UnitSheet'
import { Course } from './features/Course'
import { Momentum } from './features/Momentum'
import { Progress } from './features/Progress'
import { Study } from './features/Study'
import { Pet } from './features/Pet'

/* Five tabs. A course unit opens in a sheet over whichever tab you are on,
 * named in the address (?unit=1.3), so Back closes it and links can open it. */

export function App() {
  const [params, setParams] = useSearchParams()
  const unit = params.get('unit')
  const { pathname } = useLocation()
  const manager = useManagerMode()
  const theme = useTheme()

  useEffect(() => {
    const tab = TABS.find((t) => t.path === pathname) ?? TABS[0]
    document.title = `${tab.label} · exam prep`
  }, [pathname])

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <header className="top">
        <div className="top__in">
          <Link className="brand" to="/" aria-label="exam prep, back to Course">
            <img className="brand__mark" src="/cc.svg" alt="" width="28" height="28" />
            exam prep
          </Link>
          {/* Both switches stay hidden until the pointer comes near them (Jason, 22 October 2026). */}
          <div className="toggles">
            <button
              type="button"
              className="tswitch"
              role="switch"
              aria-checked={theme === 'dark'}
              aria-label="Dark mode"
              title={theme === 'dark' ? 'Switch to day' : 'Switch to night'}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <span className="tswitch__track" aria-hidden="true">
                <svg className="tswitch__sun" viewBox="0 0 16 16" width="12" height="12">
                  <circle cx="8" cy="8" r="3" fill="currentColor" />
                  <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6L13 13M3 13l1.4-1.4M11.6 4.4L13 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <svg className="tswitch__moon" viewBox="0 0 16 16" width="12" height="12">
                  <path d="M13.5 9.6A5.6 5.6 0 0 1 6.4 2.5a5.6 5.6 0 1 0 7.1 7.1Z" fill="currentColor" />
                </svg>
                <span className="tswitch__knob" />
              </span>
            </button>
            <button
              type="button"
              className="mswitch"
              role="switch"
              aria-checked={manager}
              aria-label="Manager mode"
              title="Manager mode: page titles and explainers"
              onClick={() => setManagerMode(!manager)}
            >
              <span className="mswitch__track" aria-hidden="true">
                <span className="mswitch__knob" />
              </span>
            </button>
          </div>
          <nav aria-label="Main">
            <ul className="tabs">
              {TABS.map((t) => (
                <li key={t.path}>
                  <NavLink to={t.path} end className="tab">
                    {t.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <Routes>
        <Route path="/" element={<Course />} />
        <Route path="/momentum" element={<Momentum />} />
        <Route path="/notes" element={<Study />} />
        <Route path="/study" element={<Navigate to="/notes" replace />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/pet" element={<Pet />} />
        <Route path="*" element={<Course />} />
      </Routes>
      {unit && (
        <UnitSheet
          key={unit}
          id={unit}
          onClose={() => {
            params.delete('unit')
            setParams(params)
          }}
        />
      )}
    </>
  )
}
