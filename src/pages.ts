/* The tabs, in menu order. */
export type Tab = { path: string; label: string }

export const TABS: Tab[] = [
  { path: '/', label: 'Course' },
  { path: '/progress', label: 'Progress' },
  { path: '/momentum', label: 'Momentum' },
  { path: '/notes', label: 'Notes' },
  // Pet is always last, as in sanctum.
  { path: '/pet', label: 'Pet' },
]
