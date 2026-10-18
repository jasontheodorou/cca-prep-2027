/* A tab's heading: one big word and one short line. */
export function Head({ title, line }: { title: string; line: string }) {
  return (
    <div className="head">
      <h1 className="h1">{title}</h1>
      <p className="muted">{line}</p>
    </div>
  )
}
