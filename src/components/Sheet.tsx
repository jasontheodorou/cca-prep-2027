import { useEffect, useRef, useState, type ReactNode } from 'react'

/* A card that rises over the page: a native <dialog>, so focus stays inside
 * it, Escape closes it and focus returns to what opened it. A click on the
 * dimmed backdrop closes it too. */
export function Sheet({ label, tone, onClose, children }: { label: string; tone?: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  // What opened the sheet, read once before it opens, to give focus back on close.
  const [opener] = useState(() => (document.activeElement instanceof HTMLElement ? document.activeElement : null))

  useEffect(() => {
    const d = ref.current
    if (d && !d.open) d.showModal()
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = ''
      if (opener?.isConnected) opener.focus()
    }
  }, [opener])

  return (
    <dialog
      ref={ref}
      className="sheet"
      data-tone={tone}
      aria-label={label}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className="sheet__in">
        <button type="button" className="sheet__close" onClick={onClose} aria-label="Close">
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
        {children}
      </div>
    </dialog>
  )
}
