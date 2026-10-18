import { useEffect, useState } from 'react'

/* The current time, updated on each minute boundary. Rechecked when the tab
 * comes back into view, because browsers slow timers in hidden tabs. */
export function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    let timer = 0
    const tick = () => {
      const d = new Date()
      setNow(d)
      timer = window.setTimeout(tick, 60_000 - (d.getSeconds() * 1000 + d.getMilliseconds()) + 50)
    }
    const onVisible = () => {
      if (document.hidden) return
      window.clearTimeout(timer)
      tick()
    }
    tick()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])
  return now
}
