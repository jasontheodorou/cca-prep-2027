import { useEffect, useRef, useState } from 'react'

/* Small rewards for engaging (Jason, 21 October 2026: "micro dopamine hit
 * releasing animations and interactions ... to reward me engaging with it",
 * then "add them all as long as they dont clutter the design"). Each plays
 * once, for the thing just done, and adds nothing that stays on screen. They
 * reward what was done and never point at what was not: no streaks, no
 * counts. With reduced motion they are skipped or shown at rest. */

export const stillMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** A number that counts up to its new value when it grows. */
export function useCountUp(target: number, ms = 650) {
  const [shown, setShown] = useState(target)
  const from = useRef(target)
  useEffect(() => {
    const start = from.current
    from.current = target
    if (target <= start || stillMotion()) {
      setShown(target)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / ms)
      const eased = 1 - Math.pow(1 - p, 3)
      setShown(Math.round(start + (target - start) * eased))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return shown
}

/** Shortbread pops up at the bottom corner, hops, sends a heart and ducks
 * away. A picture of the Pet tab's bear, so no second 3D scene is drawn. */
export function Peek({ id, onDone }: { id: number; onDone: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 2900)
    return () => window.clearTimeout(t)
  }, [id, onDone])
  return (
    <div className="peek" aria-hidden="true">
      <span className="peek__heart">
        <svg viewBox="0 0 20 18" width="22" height="20">
          <path d="M10 17s-7-4.4-7-9.3C3 4.9 5 3 7.2 3c1.3 0 2.3.7 2.8 1.7C10.5 3.7 11.5 3 12.8 3 15 3 17 4.9 17 7.7 17 12.6 10 17 10 17Z" fill="#c9877a" />
        </svg>
      </span>
      <img className="peek__bear" src="/shortbread-peek.png" alt="" />
    </div>
  )
}

/** A tick that draws itself. */
export function DrawnTick() {
  return (
    <svg className="drawn-tick" viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
      <path d="M3 8.5l3.2 3.2L13 4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Flecks that burst out from a ticked box, in the section's colour. */
export function Flecks() {
  return (
    <span className="flecks" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <span key={i} style={{ rotate: `${i * 60 + 15}deg` }} />
      ))}
    </span>
  )
}
