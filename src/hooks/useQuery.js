import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Generic async-fetch hook.
 *
 * Usage:
 *   const { data, loading, error, refetch } = useQuery(
 *     () => db.fetchOrders(locationId),
 *     [locationId]
 *   )
 *
 * `fn` must return a Promise that resolves to { data, error } (Supabase style),
 * or throws. `deps` is the dependency array — re-fetches whenever deps change.
 */
export function useQuery(fn, deps) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // Keep a stable ref to fn so the effect doesn't re-run when an arrow function
  // recreates on every render while deps are the same.
  const fnRef = useRef(fn)
  fnRef.current = fn

  const run = useCallback(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fnRef.current()
      .then(({ data: d, error: e }) => {
        if (cancelled) return
        if (e) setError(e.message || 'Failed to load data')
        else setData(d)
        setLoading(false)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || 'Failed to load data')
          setLoading(false)
        }
      })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    const cleanup = run()
    return cleanup
  }, [run])

  return { data, loading, error, refetch: run }
}
