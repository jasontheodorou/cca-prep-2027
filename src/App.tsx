import { useEffect } from 'react'
import { Link, NavLink, Route, Routes, useLocation, useSearchParams } from 'react-router-dom'
import { TABS } from './pages'
import { UnitSheet } from './components/UnitSheet'
import { Course } from './features/Course'
import { Momentum } from './features/Momentum'
import { Progress } from './features/Progress'
import { Recommendations } from './features/Recommendations'
import { Pet } from './features/Pet'

/* Five tabs. A course unit opens in a sheet over whichever tab you are on,
 * named in the address (?unit=1.3), so Back closes it and links can open it. */

export function App() {
  const [params, setParams] = useSearchParams()
  const unit = params.get('unit')
  const { pathname } = useLocation()

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
        <Route path="/progress" element={<Progress />} />
        <Route path="/recommendations" element={<Recommendations />} />
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
