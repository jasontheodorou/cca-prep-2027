import { useSearchParams } from 'react-router-dom'

/** Opens a course unit's sheet over the current tab (see App.tsx). */
export function useOpenUnit() {
  const [params, setParams] = useSearchParams()
  return (id: string) => {
    params.set('unit', id)
    setParams(params)
  }
}
