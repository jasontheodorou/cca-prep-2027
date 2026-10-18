/* The tabs, in menu order. */
export type Tab = { path: string; label: string }

export const TABS: Tab[] = [
  { path: '/', label: 'Course' },
  { path: '/momentum', label: 'Momentum' },
  { path: '/progress', label: 'Progress' },
  { path: '/recommendations', label: 'Recommendations' },
  // Pet is always last, as in sanctum.
  { path: '/pet', label: 'Pet' },
]
