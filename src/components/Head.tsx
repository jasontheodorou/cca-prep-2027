import { useManagerMode } from '../lib/managerMode'

/* A tab's heading: one big word and one short line, shown only in manager
 * mode. Otherwise the page opens straight on its content, and the heading
 * stays for screen readers only. */
export function Head({ title, line }: { title: string; line: string }) {
  const manager = useManagerMode()
  if (!manager) return <h1 className="visually-hidden">{title}</h1>
  return (
    <div className="head">
      <h1 className="h1">{title}</h1>
      <p className="muted">{line}</p>
    </div>
  )
}
